import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  STICKY_COLUMNS,
  DATA_COLUMNS,
  stickyLeftOffsets,
  cellValue,
  commentValue,
} from "../sheetColumns.js";
import "../pages/ItemListPage.css";

export default function ExcelSheetTable({
  items = [],
  commentColumns = [],
  onRowClick,
  showCommentColumns = true,
  highlightItemId = null,
  editMode = false,
  onCellChange,
  onPhotoChange,
}) {
  const navigate = useNavigate();
  const sticky = useMemo(() => stickyLeftOffsets(), []);

  const scrollColumns = [
    ...DATA_COLUMNS,
    ...(showCommentColumns
      ? commentColumns.map((label) => ({ key: label, label, isComment: true }))
      : []),
  ];

  const handleRowClick = (item) => {
    if (editMode) return;
    if (onRowClick) onRowClick(item);
    else navigate(`/items/${item.id}`);
  };

  const stopEdit = (e) => editMode && e.stopPropagation();

  if (!items.length) {
    return <p className="excel-empty">No color variants yet.</p>;
  }

  return (
    <div className="excel-scroll">
      <table className={`excel-table${editMode ? " excel-table--edit" : ""}`}>
        <thead>
          <tr>
            {sticky.map((col, i) => (
              <th
                key={col.key}
                className={`excel-th sticky-col sticky-col-${i}`}
                style={{ left: col.left, width: col.width, minWidth: col.width }}
              >
                {col.label}
              </th>
            ))}
            {scrollColumns.map((col) => (
              <th
                key={col.isComment ? `c-${col.label}` : col.key}
                className="excel-th scroll-col"
                style={{ minWidth: col.isComment ? 200 : col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`excel-row${highlightItemId === item.id ? " is-highlighted" : ""}${editMode ? " excel-row--edit" : ""}`}
              onClick={() => handleRowClick(item)}
              tabIndex={editMode ? -1 : 0}
              onKeyDown={(e) => {
                if (!editMode && e.key === "Enter") handleRowClick(item);
              }}
            >
              {sticky.map((col, i) => (
                <td
                  key={col.key}
                  className={`excel-td sticky-col sticky-col-${i}`}
                  style={{ left: col.left, width: col.width, minWidth: col.width }}
                  onClick={stopEdit}
                >
                  {col.key === "sn" &&
                    (editMode ? (
                      <input
                        className="cell-input cell-input-sn"
                        value={item.sn ?? ""}
                        maxLength={3}
                        onChange={(e) => onCellChange?.(item.id, "sn", e.target.value)}
                      />
                    ) : (
                      <span className="sn-cell">{cellValue(item, "sn") || "—"}</span>
                    ))}
                  {col.key === "main_image" && (
                    <div className="photo-cell-wrap">
                      {item.main_image ? (
                        <img src={item.main_image} alt="" className="photo-cell" />
                      ) : (
                        <span className="photo-empty">—</span>
                      )}
                      {editMode && (
                        <input
                          type="file"
                          accept="image/*"
                          className="photo-upload-input"
                          onChange={(e) =>
                            onPhotoChange?.(item.id, e.target.files?.[0] || null)
                          }
                        />
                      )}
                    </div>
                  )}
                  {col.key === "title" &&
                    (editMode ? (
                      <input
                        className="cell-input cell-input-title"
                        value={item.title ?? ""}
                        onChange={(e) => onCellChange?.(item.id, "title", e.target.value)}
                      />
                    ) : (
                      <span className="title-cell">{item.title}</span>
                    ))}
                </td>
              ))}
              {scrollColumns.map((col) => (
                <td
                  key={col.isComment ? `c-${col.label}` : col.key}
                  className={`excel-td scroll-col${col.isComment ? " comment-col" : ""}`}
                  onClick={stopEdit}
                >
                  {editMode && !col.isComment ? (
                    <input
                      className="cell-input"
                      value={item[col.key] ?? ""}
                      onChange={(e) => onCellChange?.(item.id, col.key, e.target.value)}
                    />
                  ) : col.isComment ? (
                    commentValue(item, col.label)
                  ) : (
                    cellValue(item, col.key)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
