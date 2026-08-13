import HomeAdminRolesIcon from 'assets/images/home/admin-roles.svg';
import HomeDashboardIcon from 'assets/images/home/dashboard.svg';
import HomeDataCollectionIcon from 'assets/images/home/data-collection.svg';
import HomeKatibIcon from 'assets/images/home/katib.svg';
import HomeKserveIcon from 'assets/images/home/kserve.svg';
import HomeLabelingIcon from 'assets/images/home/labeling.svg';
import HomeMlflowIcon from 'assets/images/home/mlflow.svg';
import HomeNifiIcon from 'assets/images/home/nifi.svg';
import HomeDatasetIcon from 'assets/images/home/object-data-model-management.svg';
import HomePipelineIcon from 'assets/images/home/pipeline.svg';
import HomePredictionManagerIcon from 'assets/images/home/prediction-manager.svg';
import HomeRayIcon from 'assets/images/home/ray-dashboard.svg';
import HomeTensorboardIcon from 'assets/images/home/tensorboard.svg';
import HomeVolumeIcon from 'assets/images/home/volume.svg';
import AlarmBar from 'components/alarmbar/AlarmBar';
import Layout from 'components/layout/layout';
import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import './predictor-creator-tool.scss';

// Kubeflow Central Dashboard postMessage 프로토콜
// https://github.com/kubeflow/kubeflow/blob/master/components/centraldashboard/public/library.js
const APP_CONNECTED_EVENT = 'iframe-connected';
const PARENT_CONNECTED_EVENT = 'parent-connected';
const NAMESPACE_SELECTED_EVENT = 'namespace-selected';

const LIGHT_MODE_DASHBOARD_STORAGE: Record<string, Record<string, string>> = {
  '/mlflow': {
    _mlflow_dark_mode_toggle_enabled: 'false',
    'databricks-dark-mode-pref': 'light',
  },
  '/ray': {
    themeMode: 'light',
  },
};

function hostServiceUrl(port: number, path = '/') {
  return `${window.location.protocol}//${window.location.hostname}:${port}${path}`;
}

function applyLightModeDashboardDefaults(servicePath: string) {
  const storage = LIGHT_MODE_DASHBOARD_STORAGE[servicePath];
  if (!storage) return;

  Object.entries(storage).forEach(([key, value]) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage can be blocked in hardened browsers; the iframe still loads normally.
    }
  });
}

interface Service {
  name: string;
  description: string;
  icon: string;
  path: string;
  // Kubeflow 서비스인 경우 sub-path만 (ns는 동적으로)
  // 외부 서비스인 경우 url 직접
  kubeflowApp?: string; // ex: '/pipeline/', '/volumes/'
  url?: string; // ex: '/prediction-manager/'
  needsNamespace?: boolean;
  adminOnly?: boolean;
  externalUrl?: () => string; // 호스트 포트에서 직접 여는 서비스 URL
}

const services: Service[] = [
  {
    name: '예측매니저',
    description: '이미지 빌드, 컨테이너 관리, GPU 모니터링',
    icon: HomePredictionManagerIcon,
    path: '/prediction-manager',
    url: '/prediction-manager/',
  },
  {
    name: '데이터셋 카탈로그',
    description: '데이터셋 등록, 전처리, 라벨링 결과, Pipeline 입력 패키지',
    icon: HomeDatasetIcon,
    path: '/datasets',
    url: '/prediction-manager/?standalone=1#/datasets',
  },
  {
    name: '데이터 수집',
    description: 'MQTT/REST/Kafka 커넥터, 트윈 입출력 현황',
    icon: HomeDataCollectionIcon,
    path: '/data-collection',
    url: '/prediction-manager/?standalone=1#/data-collection',
  },
  {
    name: '볼륨',
    description: '영구 볼륨(PVC) 관리',
    icon: HomeVolumeIcon,
    path: '/volume',
    kubeflowApp: '/volumes/',
    needsNamespace: true,
  },
  {
    name: 'Apache NiFi',
    description: '데이터 수집/전처리 파이프라인',
    icon: HomeNifiIcon,
    path: '/nifi',
    // NiFi는 namespace 경로로 리다이렉트되지만 프런트엔드에 해당 프록시
    // 경로가 없으면 iframe에서 404가 된다. 설치 스크립트가 공개한 호스트
    // 주소로 직접 이동한다. NiFi는 다른 origin의 iframe 삽입을 차단한다.
    externalUrl: () => hostServiceUrl(15001, '/nifi/'),
  },
  {
    name: 'Label Studio',
    description: '학습 데이터 라벨링, 주석 프로젝트, 데이터셋 검수',
    icon: HomeLabelingIcon,
    path: '/label-studio',
    // Route through the verification Nginx proxy so the Kubeflow SSO header
    // is injected and Label Studio's absolute /user and /static paths remain
    // on the same origin.
    url: '/label-studio/',
  },
  {
    name: '파이프라인',
    description: '데이터셋 기반 Pipeline Run 실행 이력과 Kubeflow 원본 관리',
    icon: HomePipelineIcon,
    path: '/pipeline',
    url: '/prediction-manager/?standalone=1#/pipeline',
  },
  {
    name: 'AutoML',
    description: 'Ray Tune + Optuna 기반 자동 모델 탐색 / MLflow 연동',
    icon: HomeKatibIcon,
    path: '/automl',
    url: '/prediction-manager/?standalone=1#/automl',
  },
  {
    name: 'Ray 대시보드',
    description: '분산 컴퓨팅 클러스터, HPO 작업 관리',
    icon: HomeRayIcon,
    path: '/ray',
    externalUrl: () => hostServiceUrl(15002),
  },
  {
    name: 'MLflow',
    description: '실험 추적, 모델 레지스트리, 모델 서빙',
    icon: HomeMlflowIcon,
    path: '/mlflow',
    externalUrl: () => hostServiceUrl(15000),
  },
  {
    name: '텐서보드',
    description: '학습 시각화 대시보드',
    icon: HomeTensorboardIcon,
    path: '/tensorboard',
    kubeflowApp: '/tensorboards/',
    needsNamespace: true,
  },
  {
    name: '모델 관리',
    description: 'MLflow 모델 레지스트리 버전/단계 관리, KServe 운영 배포',
    icon: HomeMlflowIcon,
    path: '/models',
    url: '/prediction-manager/?standalone=1#/models',
  },
  {
    name: 'KServe 엔드포인트',
    description: '모델 서빙 엔드포인트 관리',
    icon: HomeKserveIcon,
    path: '/kserve',
    kubeflowApp: '/kserve-endpoints/',
    needsNamespace: true,
  },
  {
    name: 'MLOps 모니터링',
    description: 'GPU, 시스템, AutoML, KServe 운영 지표와 알람',
    icon: HomeDashboardIcon,
    path: '/monitoring',
    url: '/prediction-manager/?standalone=1#/monitoring',
  },
  {
    name: '시스템 관리',
    description: '사용자 계정, 권한, 리소스 할당량 관리 (관리자 전용)',
    icon: HomeAdminRolesIcon,
    path: '/system-admin',
    url: '/prediction-manager/?standalone=1#/admin',
    adminOnly: true,
  },
];

const PM_PAGE_SERVICE_PATHS: Record<string, string> = {
  home: '/prediction-manager',
  images: '/prediction-manager',
  containers: '/prediction-manager',
  'containers-new': '/prediction-manager',
  datasets: '/datasets',
  'data-collection': '/data-collection',
  pipeline: '/pipeline',
  monitoring: '/monitoring',
  automl: '/automl',
  models: '/models',
  admin: '/system-admin',
};

interface UserInfo {
  email: string;
  namespace: string;
  is_admin: boolean;
  accessible_namespaces: { namespace: string; role: string }[];
}

async function fetchUserInfo(): Promise<UserInfo> {
  try {
    const resp = await fetch('/prediction-manager/api/user-info', {
      credentials: 'include',
    });
    return await resp.json();
  } catch (e) {
    return {
      email: 'user@example.com',
      namespace: 'kubeflow-user-example-com',
      is_admin: false,
      accessible_namespaces: [
        { namespace: 'kubeflow-user-example-com', role: 'owner' },
      ],
    };
  }
}

// Keep logout on the current host so the package is portable across PCs.
const LOGOUT_URL = '/oauth2/sign_out?rd=/fedit/';

function UserMenu({ userInfo }: { userInfo: UserInfo | null }) {
  const [open, setOpen] = useState(false);
  if (!userInfo) return null;
  const initial = (userInfo.email || 'U').charAt(0).toUpperCase();
  return (
    <div className="predictor-tool__user-menu">
      <button
        type="button"
        className="predictor-tool__user-btn"
        onClick={() => setOpen(!open)}
      >
        <span className="predictor-tool__user-avatar">{initial}</span>
        <span className="predictor-tool__user-email">{userInfo.email}</span>
        <span className="predictor-tool__user-arrow">▾</span>
      </button>
      {open && (
        <div className="predictor-tool__user-dropdown">
          <div className="predictor-tool__user-info-row">
            <div className="predictor-tool__user-info-label">이메일</div>
            <div className="predictor-tool__user-info-value">
              {userInfo.email}
            </div>
          </div>
          <div className="predictor-tool__user-info-row">
            <div className="predictor-tool__user-info-label">네임스페이스</div>
            <div className="predictor-tool__user-info-value">
              {userInfo.namespace}
            </div>
          </div>
          <div className="predictor-tool__user-info-row">
            <div className="predictor-tool__user-info-label">역할</div>
            <div className="predictor-tool__user-info-value">
              {userInfo.is_admin ? '관리자' : '일반 사용자'}
            </div>
          </div>
          <a href={LOGOUT_URL} className="predictor-tool__user-logout">
            로그아웃
          </a>
        </div>
      )}
    </div>
  );
}

function IframePage({ service }: { service: Service }) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [namespace, setNamespace] = useState<string>('');
  const [accessibleNs, setAccessibleNs] = useState<
    { namespace: string; role: string }[]
  >([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handlePredictionManagerRoute = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as {
        type?: string;
        page?: string;
        path?: string;
        namespace?: string;
        runId?: string;
        kubeflowHash?: string;
        datasetId?: string;
      };
      if (data?.type === 'prediction-manager-user-deleted') {
        fetchUserInfo().then((info) => {
          const namespaces = info.accessible_namespaces || [];
          const currentNsStillExists = namespaces.some(
            (ns) => ns.namespace === namespace,
          );
          const selectedNs = currentNsStillExists
            ? namespace
            : namespaces.find((ns) => ns.namespace === info.namespace)
                ?.namespace ||
              namespaces[0]?.namespace ||
              '';

          setUserInfo(info);
          setAccessibleNs(namespaces);
          setNamespace(selectedNs);

          if (selectedNs && service.kubeflowApp) {
            setIframeUrl(buildKubeflowUrl(service.kubeflowApp, selectedNs));
          } else if (selectedNs && service.url && isPmUrl(service.url)) {
            const state = location.state as {
              scrollTo?: string;
              runId?: string;
              datasetId?: string;
            } | null;
            setIframeUrl(buildPmUrl(service.url, selectedNs, state));
          }
        });
        return;
      }
      if (data?.type === 'prediction-manager-open-service') {
        const nextPath = String(data.path || '').startsWith('/')
          ? String(data.path)
          : `/${String(data.path || '')}`;
        if (!nextPath || nextPath === '/') return;
        navigate(`/predictor-creator-tool${nextPath}`, {
          state: {
            namespace: data.namespace,
            kubeflowHash:
              data.kubeflowHash ||
              (data.runId
                ? `#/runs/details/${encodeURIComponent(data.runId)}`
                : undefined),
            runId: data.runId,
            datasetId: data.datasetId,
          },
        });
        return;
      }
      if (data?.type !== 'prediction-manager-route') return;
      const page = String(data.page || '').replace(/^#?\//, '');
      const nextPath = PM_PAGE_SERVICE_PATHS[page];
      if (nextPath && nextPath !== service.path) {
        navigate(`/predictor-creator-tool${nextPath}`, { replace: true });
      }
    };

    window.addEventListener('message', handlePredictionManagerRoute);
    return () => {
      window.removeEventListener('message', handlePredictionManagerRoute);
    };
  }, [navigate, service, namespace, location.state]);

  const isPmUrl = (u?: string) => !!u && u.includes('/prediction-manager/');

  const buildPmUrl = (
    baseUrl: string,
    ns: string,
    state?: { scrollTo?: string; runId?: string; datasetId?: string } | null,
  ) => {
    // baseUrl 형식: /prediction-manager/?standalone=1#/automl
    const [beforeHash, hash] = baseUrl.split('#');
    const url = new URL(beforeHash, window.location.origin);
    url.searchParams.set('ns', ns);
    if (state?.scrollTo) url.searchParams.set('scrollTo', state.scrollTo);
    if (state?.runId) url.searchParams.set('runId', state.runId);
    if (state?.datasetId) url.searchParams.set('datasetId', state.datasetId);
    return `${url.pathname}${url.search}${hash ? `#${hash}` : ''}`;
  };

  const buildKubeflowUrl = (
    appPath: string,
    ns: string,
    kubeflowHash?: string,
  ) => {
    const [beforeHash, existingHash] = appPath.split('#');
    const url = new URL(beforeHash, window.location.origin);
    url.searchParams.set('ns', ns);
    const hash = kubeflowHash || (existingHash ? `#${existingHash}` : '');
    return `${url.pathname}${url.search}${hash}`;
  };

  // 1. URL 결정 (Kubeflow 앱이면 namespace 조회 후, 아니면 즉시)
  useEffect(() => {
    let cancelled = false;
    const buildUrl = async () => {
      const info = await fetchUserInfo();
      if (cancelled) return;
      setUserInfo(info);
      applyLightModeDashboardDefaults(service.path);
      if (service.kubeflowApp) {
        const state = location.state as {
          kubeflowHash?: string;
          namespace?: string;
        } | null;
        const selectedNs = state?.namespace || info.namespace;
        setAccessibleNs(info.accessible_namespaces || []);
        setNamespace(selectedNs);
        setIframeUrl(
          buildKubeflowUrl(
            service.kubeflowApp,
            selectedNs,
            state?.kubeflowHash,
          ),
        );
      } else if (service.url) {
        setAccessibleNs(info.accessible_namespaces || []);
        if (isPmUrl(service.url)) {
          const state = location.state as {
            namespace?: string;
            scrollTo?: string;
            runId?: string;
            datasetId?: string;
          } | null;
          const selectedNs = state?.namespace || info.namespace;
          setNamespace(selectedNs);
          setIframeUrl(buildPmUrl(service.url, selectedNs, state));
        } else {
          setNamespace(info.namespace);
          setIframeUrl(service.url);
        }
      }
    };
    buildUrl();
    return () => {
      cancelled = true;
    };
  }, [service, location.state]);

  // namespace 변경 시 iframe URL 업데이트
  const handleNamespaceChange = (newNs: string) => {
    setNamespace(newNs);
    setIsLoading(true);
    if (service.kubeflowApp) {
      navigate(location.pathname, {
        replace: true,
        state: { namespace: newNs },
      });
      setIframeUrl(buildKubeflowUrl(service.kubeflowApp, newNs));
    } else if (service.url && isPmUrl(service.url)) {
      const state = location.state as {
        scrollTo?: string;
        runId?: string;
        datasetId?: string;
      } | null;
      setIframeUrl(buildPmUrl(service.url, newNs, state));
    }
  };

  // 2. iframe 로드 후 postMessage로 namespace 전달
  useEffect(() => {
    if (!service.kubeflowApp || !namespace) {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      // Kubeflow sub-app이 'iframe-connected' 보내면 응답
      if (event.data?.type === APP_CONNECTED_EVENT) {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;
        // PARENT_CONNECTED 응답
        iframe.contentWindow.postMessage(
          { type: PARENT_CONNECTED_EVENT, value: null },
          event.origin || '*',
        );
        // NAMESPACE 전달
        iframe.contentWindow.postMessage(
          { type: NAMESPACE_SELECTED_EVENT, value: namespace },
          event.origin || '*',
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [service, namespace]);

  const handleLoad = () => {
    setIsLoading(false);
    // 일부 앱은 onload 이후에도 namespace 메시지를 받아야 함
    if (service.kubeflowApp && namespace && iframeRef.current?.contentWindow) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: NAMESPACE_SELECTED_EVENT, value: namespace },
          '*',
        );
      }, 500);
    }
  };

  const visibleQuickNav = services.filter(
    (s) => !s.adminOnly || userInfo?.is_admin,
  );

  return (
    <div className="predictor-tool__iframe-wrapper">
      <div className="predictor-tool__toolbar">
        <button
          type="button"
          className="predictor-tool__back-btn"
          onClick={() => navigate('/predictor-creator-tool')}
        >
          &larr;
        </button>
        <div className="predictor-tool__quick-nav">
          {visibleQuickNav.map((svc) => (
            <button
              key={svc.path}
              type="button"
              className={`predictor-tool__quick-nav-item ${
                svc.path === service.path ? 'active' : ''
              }`}
              onClick={() => {
                if (svc.externalUrl) {
                  window.location.assign(svc.externalUrl());
                } else {
                  navigate(`/predictor-creator-tool${svc.path}`);
                }
              }}
              title={svc.name}
            >
              <img src={svc.icon} alt={svc.name} />
              <span>{svc.name}</span>
            </button>
          ))}
        </div>
        {(service.kubeflowApp || isPmUrl(service.url)) &&
          accessibleNs.length > 0 && (
            <select
              className="predictor-tool__ns-select"
              value={namespace}
              onChange={(e) => handleNamespaceChange(e.target.value)}
            >
              {accessibleNs.map((ns) => (
                <option key={ns.namespace} value={ns.namespace}>
                  {ns.namespace} ({ns.role})
                </option>
              ))}
            </select>
          )}
        <UserMenu userInfo={userInfo} />
      </div>
      {isLoading && (
        <div className="loading-mask">
          <div className="loading-mask__spinner" />
        </div>
      )}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          title={service.name}
          src={iframeUrl}
          className="predictor-tool__iframe"
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}

function ToolHome() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserInfo().then((info) => setIsAdmin(!!info.is_admin));
  }, []);

  const visibleServices = services.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="predictor-tool__home">
      <div className="predictor-tool__header">
        <div>
          <h2>예측기 생성/연동 도구</h2>
          <p>MLOps 플랫폼 서비스에 접속합니다.</p>
        </div>
        <AlarmBar />
      </div>
      <div className="predictor-tool__grid">
        {visibleServices.map((svc) => (
          <div
            key={svc.name}
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (svc.externalUrl) {
                window.location.assign(svc.externalUrl());
              } else {
                navigate(`/predictor-creator-tool${svc.path}`);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (svc.externalUrl) {
                  window.location.assign(svc.externalUrl());
                } else {
                  navigate(`/predictor-creator-tool${svc.path}`);
                }
              }
            }}
          >
            <div className="card__icon-div">
              <img className="card__icon" src={svc.icon} alt={svc.name} />
            </div>
            <p className="card__title">{svc.name}</p>
            <p className="card__subtitle">{svc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PredictorCreatorTool() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ToolHome />} />
        {services
          .filter((svc) => !svc.externalUrl)
          .map((svc) => (
            <Route
              key={svc.path}
              path={svc.path}
              element={<IframePage service={svc} />}
            />
          ))}
      </Routes>
    </Layout>
  );
}
