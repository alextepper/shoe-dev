import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import ItemSheetForm, {
  sheetFormFromItem,
  sheetFormToPayload,
  appendSheetToFormData,
} from "../components/ItemSheetForm.jsx";
import "./FormPage.css";

export default function EditItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendOk, setBackendOk] = useState(true);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => setBackendOk(h.features?.modelNumber === true))
      .catch(() => setBackendOk(false));
  }, []);

  useEffect(() => {
    api
      .getItem(id)
      .then((item) => {
        setForm(sheetFormFromItem(item));
        setCurrentPhoto(item.main_image);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = sheetFormToPayload(form);
      let updated;
      if (mainImage) {
        const fd = new FormData();
        appendSheetToFormData(fd, form);
        fd.append("main_image", mainImage);
        updated = await api.updateItem(id, fd);
      } else {
        updated = await api.updateItem(id, payload);
      }

      const savedModel = (updated?.model_number ?? payload.model_number)?.trim();
      if (savedModel) {
        navigate(`/models/${encodeURIComponent(savedModel)}`);
      } else {
        navigate(`/items/${id}`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!form) return <div className="error-banner">{error || "Not found"}</div>;

  return (
    <div className="form-page">
      <Link to={`/items/${id}`} className="back-link">
        ← Back to model
      </Link>
      <h1>Edit model</h1>

      {!backendOk && (
        <div className="error-banner">
          Backend is out of date — restart it so model number saves work:{" "}
          <code>cd backend && npm run dev</code>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}

      <form className="form-card card" onSubmit={handleSubmit}>
        <ItemSheetForm
          form={form}
          onChange={setForm}
          mainImage={mainImage}
          onMainImageChange={setMainImage}
          currentPhotoUrl={currentPhoto}
        />

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link to={`/items/${id}`} className="cancel-link secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
