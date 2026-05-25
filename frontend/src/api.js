import { DEFAULT_COMMENT_COLUMNS } from "./sheetColumns.js";

const TOKEN_KEY = "shoe_dev_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { ...options, headers, body });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password } }),
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: { username, password } }),
  me: () => request("/auth/me"),
  health: () => request("/health"),
  getItems: async () => {
    const data = await request("/items");
    if (Array.isArray(data)) {
      return { items: data, comment_columns: DEFAULT_COMMENT_COLUMNS };
    }
    const comment_columns = Array.isArray(data?.comment_columns)
      ? data.comment_columns
      : DEFAULT_COMMENT_COLUMNS;
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      comment_columns: comment_columns.length ? comment_columns : DEFAULT_COMMENT_COLUMNS,
    };
  },
  getModelSheet: (modelNumber) =>
    request(`/models/${encodeURIComponent(modelNumber)}`),
  deleteModel: (modelNumber) =>
    request(`/models/${encodeURIComponent(modelNumber)}`, { method: "DELETE" }),
  getModels: () => request("/models"),
  getItem: (id) => request(`/items/${id}`),
  createItem: (formData) => request("/items", { method: "POST", body: formData }),
  importCsv: (file) => {
    const fd = new FormData();
    const name = file.name?.toLowerCase().endsWith(".csv") ? file.name : "import.csv";
    fd.append("file", file, name);
    return request("/items/import/csv", { method: "POST", body: fd });
  },
  updateItem: (id, body) =>
    request(`/items/${id}`, { method: "PUT", body }),
  deleteItem: (id) => request(`/items/${id}`, { method: "DELETE" }),
  addImages: (id, formData) =>
    request(`/items/${id}/images`, { method: "POST", body: formData }),
  deleteImage: (itemId, imageId) =>
    request(`/items/${itemId}/images/${imageId}`, { method: "DELETE" }),
  addComment: (id, formData) =>
    request(`/items/${id}/comments`, { method: "POST", body: formData }),
};
