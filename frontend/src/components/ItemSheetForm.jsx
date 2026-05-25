import { DATA_COLUMNS } from "../sheetColumns.js";

export function emptySheetForm() {
  return {
    model_number: "",
    sn: "",
    title: "",
    ...Object.fromEntries(DATA_COLUMNS.map((c) => [c.key, ""])),
  };
}

export function sheetFormFromItem(item) {
  const form = emptySheetForm();
  if (!item) return form;
  form.model_number = item.model_number ?? "";
  form.sn = item.sn ?? "";
  form.title = item.title ?? "";
  for (const col of DATA_COLUMNS) {
    form[col.key] = item[col.key] ?? "";
  }
  return form;
}

export function sheetFormToPayload(form) {
  const payload = {
    model_number: form.model_number?.trim() ?? "",
    title: form.title?.trim() ?? "",
    sn: (form.sn ?? "").trim().slice(0, 3),
  };
  for (const col of DATA_COLUMNS) {
    payload[col.key] = (form[col.key] ?? "").trim();
  }
  return payload;
}

export function appendSheetToFormData(fd, form) {
  const payload = sheetFormToPayload(form);
  for (const [key, value] of Object.entries(payload)) {
    fd.append(key, value);
  }
}

export default function ItemSheetForm({
  form,
  onChange,
  mainImage,
  onMainImageChange,
  currentPhotoUrl,
  children,
}) {
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value });

  return (
    <>
      <section>
        <h2>Sheet row</h2>
        <div className="form-group">
          <label htmlFor="model_number">Model number *</label>
          <input
            id="model_number"
            value={form.model_number}
            onChange={set("model_number")}
            required
            placeholder="e.g. 4521"
          />
          <p className="section-hint">Same model number for every color variant of this shoe.</p>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="sn">SN (2–3 chars)</label>
            <input
              id="sn"
              value={form.sn}
              onChange={set("sn")}
              maxLength={3}
              placeholder="A1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">Updated model name *</label>
            <input
              id="title"
              value={form.title}
              onChange={set("title")}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="main">Model photo</label>
          {currentPhotoUrl && (
            <img src={currentPhotoUrl} alt="" className="form-photo-preview" />
          )}
          <input
            id="main"
            type="file"
            accept="image/*"
            onChange={(e) => onMainImageChange(e.target.files?.[0] || null)}
          />
          {currentPhotoUrl && !mainImage && (
            <p className="section-hint">Leave empty to keep the current photo.</p>
          )}
        </div>
      </section>

      <section>
        <h2>Specifications</h2>
        <div className="sheet-fields-grid">
          {DATA_COLUMNS.map((col) => (
            <div key={col.key} className="form-group">
              <label htmlFor={col.key}>{col.label}</label>
              <input
                id={col.key}
                value={form[col.key]}
                onChange={set(col.key)}
              />
            </div>
          ))}
        </div>
      </section>

      {children}
    </>
  );
}
