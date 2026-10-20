import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Boxes, ChartNoAxesCombined, FolderOpen } from "lucide-react";
import { UploadProvider } from "../features/uploads/UploadProvider";

import "./App.css";

export function App() {
  const location = useLocation();
  return (
    <UploadProvider>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          본문으로 이동
        </a>
        <header className="app-header">
          <NavLink to="/" className="brand" aria-label="FlowCast3D Viewer 홈">
            <span className="brand-mark">
              <Boxes size={23} strokeWidth={1.6} />
            </span>
            <span>
              FlowCast<span className="brand-accent">3D</span> Viewer
            </span>
          </NavLink>
          <nav aria-label="주 메뉴" className="primary-navigation">
            <NavLink to="/" end>
              <ChartNoAxesCombined size={16} />
              Visualization
            </NavLink>
            <NavLink to="/datasets">
              <FolderOpen size={16} />
              Dataset
            </NavLink>
          </nav>
        </header>
        <main
          id="main"
          className={location.pathname === "/" ? "main-workspace" : "main-page"}
        >
          <Outlet />
        </main>
      </div>
    </UploadProvider>
  );
}
