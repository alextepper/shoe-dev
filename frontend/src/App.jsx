import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ItemListPage from "./pages/ItemListPage.jsx";
import ItemDetailPage from "./pages/ItemDetailPage.jsx";
import NewItemPage from "./pages/NewItemPage.jsx";
import EditItemPage from "./pages/EditItemPage.jsx";
import ModelSheetPage from "./pages/ModelSheetPage.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ItemListPage />} />
        <Route path="models/:modelNumber" element={<ModelSheetPage />} />
        <Route path="items/new" element={<NewItemPage />} />
        <Route path="items/:id/edit" element={<EditItemPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
