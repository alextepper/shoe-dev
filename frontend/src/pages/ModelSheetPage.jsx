import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { compareSn } from "../sortUtils.js";
import ExcelSheetTable from "../components/ExcelSheetTable.jsx";
import {
  sheetFormFromItem,
  sheetFormToPayload,
  appendSheetToFormData,
} from "../components/ItemSheetForm.jsx";
import "./ItemListPage.css";
import "./ModelSheetPage.css";

function toEditableRows(apiItems) {
  return apiItems.map((item) => ({
    id: item.id,
    ...sheetFormFromItem(item),
    main_image: item.main_image,
  }));
}

export default function ModelSheetPage() {
  const { modelNumber } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(modelNumber);
  const [items, setItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [photoFiles, setPhotoFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadSheet = useCallback(() => {
    return api.getModelSheet(decoded).then((data) => {
      const rows = toEditableRows(data.items ?? []).sort((a, b) => compareSn(a.sn, b.sn));
      setItems(rows);
      return rows;
    });
  }, [decoded]);

  useEffect(() => {
    setLoading(true);
    loadSheet()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadSheet]);

  const updateCell = (id, key, value) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const updatePhoto = (id, file) => {
    if (!file) return;
    setPhotoFiles((p) => ({ ...p, [id]: file }));
    setItems((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, main_image: URL.createObjectURL(file) } : r
      )
    );
  };

  const saveEdits = async () => {
    setSaving(true);
    setError("");
    try {
      for (const row of items) {
        const form = { ...row, model_number: decoded };
        if (photoFiles[row.id]) {
          const fd = new FormData();
          appendSheetToFormData(fd, form);
          fd.append("main_image", photoFiles[row.id]);
          await api.updateItem(row.id, fd);
        } else {
          await api.updateItem(row.id, {
            ...sheetFormToPayload(form),
            model_number: decoded,
          });
        }
      }
      setPhotoFiles({});
      setEditMode(false);
      await loadSheet();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = async () => {
    setEditMode(false);
    setPhotoFiles({});
    setError("");
    await loadSheet();
  };

  const deleteModel = async () => {
    const count = items.length;
    const msg =
      count === 0
        ? `Delete model ${decoded}?`
        : `Delete model ${decoded} and all ${count} color variant${count === 1 ? "" : "s"}? This cannot be undone.`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    setError("");
    try {
      await api.deleteModel(decoded);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading sheet…</div>;

  return (
    <div className="item-list-page">
      <div className="model-sheet-bar">
        <Link to="/" className="back-link">
          ← All models
        </Link>
        <span className="model-sheet-bar-title">Model {decoded}</span>
        <span className="model-sheet-bar-meta">
          {items.length} color{items.length === 1 ? "" : "s"}
        </span>
        <div className="model-sheet-bar-actions">
          {!editMode ? (
            <>
              <button type="button" onClick={() => setEditMode(true)} disabled={deleting}>
                Edit
              </button>
              <Link
                to={`/items/new?model_number=${encodeURIComponent(decoded)}`}
                className="model-sheet-bar-add"
              >
                + Add color
              </Link>
              <button
                type="button"
                className="danger"
                onClick={deleteModel}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete model"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="button" onClick={saveEdits} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No color variants for this model.</p>
          <Link to={`/items/new?model_number=${encodeURIComponent(decoded)}`}>
            Add color variant
          </Link>
        </div>
      ) : (
        <ExcelSheetTable
          items={items}
          showCommentColumns={false}
          editMode={editMode}
          onCellChange={updateCell}
          onPhotoChange={updatePhoto}
          onRowClick={() => {}}
        />
      )}
    </div>
  );
}
