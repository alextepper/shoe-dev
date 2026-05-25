import { useRef, useState } from "react";
import { api, getToken } from "../api.js";
import "./CsvImportBar.css";

export default function CsvImportBar({ onImported }) {
  const inputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const downloadTemplate = async () => {
    setError("");
    try {
      const token = getToken();
      const res = await fetch("/api/items/import/template", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Could not download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shoe-dev-import-template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setError("");
    setMessage("");
    try {
      const result = await api.importCsv(file);
      const failed = result.errors?.length ?? 0;
      setMessage(
        `Imported ${result.created} of ${result.total} row(s)` +
          (failed ? ` (${failed} skipped)` : "")
      );
      if (failed && result.errors.length <= 5) {
        setError(result.errors.map((x) => `Row ${x.row}: ${x.error}`).join("; "));
      } else if (failed) {
        setError(`${failed} rows had errors (see server log for details)`);
      }
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="csv-import-bar">
      <button type="button" className="secondary" onClick={downloadTemplate}>
        Download CSV template
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
      >
        {importing ? "Importing…" : "Import CSV"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleFile}
      />
      {message && <span className="csv-import-ok">{message}</span>}
      {error && <span className="csv-import-err">{error}</span>}
    </div>
  );
}
