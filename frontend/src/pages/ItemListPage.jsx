import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { DEFAULT_COMMENT_COLUMNS } from "../sheetColumns.js";
import { sortByModelNumberThenSn } from "../sortUtils.js";
import ExcelSheetTable from "../components/ExcelSheetTable.jsx";
import CsvImportBar from "../components/CsvImportBar.jsx";
import "./ItemListPage.css";

export default function ItemListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [commentColumns, setCommentColumns] = useState(DEFAULT_COMMENT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = (silent = false) => {
    if (!silent) setLoading(true);
    return api
      .getItems()
      .then((data) => {
        setItems(data.items ?? []);
        if (data.comment_columns?.length) setCommentColumns(data.comment_columns);
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const sortedItems = useMemo(() => sortByModelNumberThenSn(items), [items]);

  if (loading) return <div className="page-loading">Loading sheet…</div>;

  return (
    <div className="item-list-page">
      <CsvImportBar onImported={() => loadItems(true)} />
      {error && <div className="error-banner">{error}</div>}

      {sortedItems.length === 0 ? (
        <div className="empty-state">
          <p>No models yet.</p>
          <Link to="/items/new">Add color variant</Link>
        </div>
      ) : (
        <ExcelSheetTable
          items={sortedItems}
          commentColumns={commentColumns}
          onRowClick={(item) => {
            const model = item.model_number?.trim() || "Unassigned";
            navigate(
              `/models/${encodeURIComponent(model)}?selected=${item.id}`
            );
          }}
        />
      )}
    </div>
  );
}
