import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { api } from "../api.js";

/** Legacy item URLs redirect to the model sheet for that variant. */
export default function ItemDetailPage() {
  const { id } = useParams();
  const [target, setTarget] = useState(null);

  useEffect(() => {
    api
      .getItem(id)
      .then((item) => {
        const model = item.model_number?.trim();
        if (model) {
          setTarget(`/models/${encodeURIComponent(model)}?selected=${id}`);
        } else {
          setTarget("/");
        }
      })
      .catch(() => setTarget("/"));
  }, [id]);

  if (!target) return <div className="page-loading">Loading…</div>;
  return <Navigate to={target} replace />;
}
