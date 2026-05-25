import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSheet = pathname === "/" || pathname.startsWith("/models/");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="brand">
          <span className="brand-mark">SD</span>
          <span>
            <strong>Shoe Dev</strong>
            <small>Model development</small>
          </span>
        </Link>
        <nav className="layout-nav">
          <Link to="/">All models</Link>
          <Link to="/items/new" className="btn-link">
            + New model
          </Link>
          <span className="user-pill">{user?.username}</span>
          <button type="button" className="secondary" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>
      <main className={`layout-main${isSheet ? "" : " layout-main--padded"}`}>
        <Outlet />
      </main>
    </div>
  );
}
