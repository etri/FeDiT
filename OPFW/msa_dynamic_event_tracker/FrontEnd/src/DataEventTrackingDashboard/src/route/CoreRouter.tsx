import { Navigate, Route, Routes } from 'react-router'
import Dashboard from '../pages/dashboard/Dashboard.tsx'
import RelayPage from '../pages/dashboard/RelayPage.tsx'
import KubernetesControl from '../pages/kubernetes-control/KubernetesControl.tsx'
import DataTrackingMain from '../pages/data-tracking/DataTrackingMain.tsx'
import DeploymentDetail from '../pages/kubernetes-control/DeploymentDetail.tsx'
import DataTrackingRJSF from '../pages/data-tracking-rjsf/DataTrackingRJSF.tsx'
import GraphDB from '../pages/graph-db/GraphDB.tsx'
import DataTrackingListMain from '../pages/data-tracking-list/DataTrackingListMain.tsx'
import OntologyList from '../pages/ontology/OntologyList.tsx'
import NDXProTest from '../pages/ndxpro-test/NDXProTest.tsx'

export default function CoreRouter() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to="/data-tracking" replace />}
            />
            <Route path="/monitoring" element={<Dashboard />} />
            <Route path="/relay/role/:role" element={<RelayPage />} />
            <Route path="/control" element={<KubernetesControl />} />
            <Route
                path="/control/deployment/detail"
                element={<DeploymentDetail />}
            />
            <Route path="/data-tracking" element={<DataTrackingMain />} />
            <Route
                path="/data-tracking-list"
                element={<DataTrackingListMain />}
            />
            <Route path="/data-tracking-rjsf" element={<DataTrackingRJSF />} />
            <Route path="/ndxpro-test" element={<NDXProTest />} />
            <Route path="/graph-db" element={<GraphDB />} />
            <Route path="/ontology/list" element={<OntologyList />} />
            <Route
                path="*"
                element={<Navigate to="/data-tracking" replace />}
            />
        </Routes>
    )
}
