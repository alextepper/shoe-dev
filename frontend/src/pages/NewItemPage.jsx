import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import ItemSheetForm, { emptySheetForm, appendSheetToFormData } from "../components/ItemSheetForm.jsx";
import "./FormPage.css";

export default function NewItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetModel = searchParams.get("model_number") ?? "";
  const [form, setForm] = useState(() => ({
    ...emptySheetForm(),
    model_number: presetModel,
  }));
  const [mainImage, setMainImage] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      appendSheetToFormData(fd, form);
      if (mainImage) fd.append("main_image", mainImage);
      const item = await api.createItem(fd);
      navigate(`/items/${item.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <Link to="/" className="back-link">
        ← All models
      </Link>
      <h1>New shoe model</h1>

      {error && <div className="error-banner">{error}</div>}

      <form className="form-card card" onSubmit={handleSubmit}>
        <ItemSheetForm
          form={form}
          onChange={setForm}
          mainImage={mainImage}
          onMainImageChange={setMainImage}
        />

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create model"}
          </button>
          <Link to="/" className="cancel-link secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
