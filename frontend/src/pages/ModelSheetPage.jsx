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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItem, setHistoryItem] = useState(null);
  const [versions, setVersions] = useState([]);

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

  const openHistory = async (item) => {
    if (!item?.id) return;
    setHistoryItem(item);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await api.getItemVersions(item.id);
      setVersions(data.versions ?? []);
    } catch (e) {
      setHistoryError(e.message);
      setVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const restoreVersion = async (versionId) => {
    if (!historyItem?.id) return;
    if (
      !window.confirm(
        "Restore this version? This will overwrite the current row values (a snapshot of the current row will be saved first)."
      )
    ) {
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      await api.restoreItemVersion(historyItem.id, versionId);
      await loadSheet();
      const data = await api.getItemVersions(historyItem.id);
      setVersions(data.versions ?? []);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
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
                className="secondary"
                onClick={() => openHistory(items[0])}
                disabled={!items.length}
                title="Open history for a row by clicking it"
              >
                History
              </button>
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
          onRowClick={(item) => openHistory(item)}
        />
      )}

      {historyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="history-modal"
          onClick={() => setHistoryOpen(false)}
        >
          <div className="history-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-head">
              <div>
                <div className="history-title">History</div>
                <div className="history-sub">
                  Row: <strong>{historyItem?.sn || "—"}</strong> —{" "}
                  {historyItem?.title || "—"}
                </div>
              </div>
              <button type="button" className="secondary" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </div>

            {historyError && <div className="error-banner">{historyError}</div>}

            {historyLoading ? (
              <div className="history-loading">Loading…</div>
            ) : versions.length === 0 ? (
              <div className="history-empty">No history yet. Make an edit and save to create a version.</div>
            ) : (
              <ul className="history-list">
                {versions.map((v) => (
                  <li key={v.id} className="history-item">
                    <div className="history-meta">
                      <div className="history-date">{v.created_at}</div>
                      <div className="history-user">{v.username ? `by ${v.username}` : ""}</div>
                    </div>
                    <button type="button" onClick={() => restoreVersion(v.id)} disabled={historyLoading}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
