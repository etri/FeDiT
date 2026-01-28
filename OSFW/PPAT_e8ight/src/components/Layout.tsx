import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import useProjectStore from '../stores/projectStore';

function Layout() {
  const projectName = useProjectStore(state => state.projectName);

  // Use project name from store for title
  const title = projectName || 'NFLOW Web';

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          zIndex: 1000,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Navigation title={title} showSaveButton={true} />
      </div>
      <main
        style={{
          position: "fixed",
          top: "3.5rem",
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
