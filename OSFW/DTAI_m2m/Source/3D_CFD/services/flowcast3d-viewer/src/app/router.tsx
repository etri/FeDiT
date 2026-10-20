import {
  createBrowserRouter,
  isRouteErrorResponse,
  Link,
  Navigate,
  useRouteError,
} from "react-router-dom";
import { App } from "./App";
import { WorkspacePage } from "../pages/WorkspacePage";
import { DatasetsPage } from "../pages/DatasetsPage";
import { JobsPage } from "../pages/JobsPage";
// eslint-disable-next-line react-refresh/only-export-components
function RouteError() {
  const error = useRouteError();
  return (
    <div className="error-page">
      <h1>화면을 열 수 없습니다</h1>
      <p>
        {isRouteErrorResponse(error)
          ? `${error.status} ${error.statusText}`
          : error instanceof Error
            ? error.message
            : "Unexpected application error"}
      </p>
      <Link to="/">작업공간으로 이동</Link>
    </div>
  );
}
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <WorkspacePage /> },
      { path: "datasets", element: <DatasetsPage /> },
      { path: "uploads", element: <Navigate to="/datasets" replace /> },
      { path: "jobs", element: <JobsPage /> },
      {
        path: "*",
        element: (
          <div className="error-page">
            <h1>페이지를 찾을 수 없습니다</h1>
            <Link to="/">작업공간으로 이동</Link>
          </div>
        ),
      },
    ],
  },
]);
