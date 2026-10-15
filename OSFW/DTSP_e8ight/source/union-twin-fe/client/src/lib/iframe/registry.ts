import type { EmbeddedAppConfig, EmbeddedAppId } from '@/lib/iframe/types';

const DEFAULT_SANDBOX = 'allow-scripts allow-same-origin allow-forms';
const VIZWIDE_SANDBOX = `${DEFAULT_SANDBOX} allow-fullscreen`;
const SWAGGER_SANDBOX = `${DEFAULT_SANDBOX} allow-popups`;
const METADATA_SANDBOX = `${DEFAULT_SANDBOX} allow-modals`;
const SIMULATION_SANDBOX = `${DEFAULT_SANDBOX} allow-popups allow-popups-to-escape-sandbox allow-modals`;
const TRACKING_SANDBOX = `${DEFAULT_SANDBOX} allow-modals`;

const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin';

function originOf(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

type DefineAppInput = Omit<EmbeddedAppConfig, 'origin' | 'referrerPolicy'>;

function defineApp(config: DefineAppInput): EmbeddedAppConfig {
  return {
    ...config,
    origin: originOf(config.url),
    referrerPolicy: DEFAULT_REFERRER_POLICY,
  };
}

// 사내 서버 주소는 소스에 두지 않는다. viewer·predictor·docs* 는 런타임 설정(RuntimeConfig)의 URL로 덮어쓴다.
const URLS = {
  viewer: '',
  demo: 'http://ec2-52-79-123-151.ap-northeast-2.compute.amazonaws.com/VIZWide3D/Demo_SmartCity/',
  docsJeju:
    'http://dev.jinwoosi.co.kr:8083/swagger-ui/index.html#/AirQuality/find_23',
  docsDataModel: '',
  docsEntity: '',
  docsVizwide: 'https://www.softhills.net/SHDC/VIZWide3D/vizwide3d.html',
  metadataSearch: 'https://dtmeta.fedit.or.kr/meta/exsearch/list',
  metadataRegistration:
    'https://dtmeta.fedit.or.kr/loginpass?to=/meta/exmanage/dt',
  metadataGraph: 'https://dtmeta.fedit.or.kr/loginpass?to=/meta/exmedatagraph',
  syncEngine: 'https://keti.fedit.or.kr',
  verification: 'https://dtag.fedit.or.kr',
  serviceLogic: 'http://bigsoft.iptime.org:9900/keti',
  predictor: '',
  simulation: 'https://simulation.fedit.or.kr/simulation/',
  dataTracking: 'https://tracking.fedit.or.kr/data-tracking',
  dataTrackingList: 'https://tracking.fedit.or.kr/data-tracking-list',
} as const;

const EMBEDDED_APPS: Record<EmbeddedAppId, EmbeddedAppConfig> = {
  viewer: defineApp({
    url: URLS.viewer,
    sandbox: VIZWIDE_SANDBOX,
    allow: 'fullscreen; xr-spatial-tracking',
    errorTitle: '뷰어를 불러올 수 없습니다',
  }),
  demo: defineApp({
    url: URLS.demo,
    sandbox: VIZWIDE_SANDBOX,
    allow: 'fullscreen; xr-spatial-tracking',
    errorTitle: '데모 페이지를 불러올 수 없습니다',
    errorMessage:
      '데모 서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해주세요.',
  }),
  docsJeju: defineApp({
    url: URLS.docsJeju,
    sandbox: SWAGGER_SANDBOX,
    errorTitle: '제주 API 문서를 불러올 수 없습니다',
  }),
  docsDataModel: defineApp({
    url: URLS.docsDataModel,
    sandbox: SWAGGER_SANDBOX,
    errorTitle: '데이터 모델 API 문서를 불러올 수 없습니다',
  }),
  docsEntity: defineApp({
    url: URLS.docsEntity,
    sandbox: SWAGGER_SANDBOX,
    errorTitle: '데이터 조회 API 문서를 불러올 수 없습니다',
  }),
  docsVizwide: defineApp({
    url: URLS.docsVizwide,
    sandbox: VIZWIDE_SANDBOX,
    allow: 'fullscreen',
    errorTitle: 'VIZWide 가이드를 불러올 수 없습니다',
  }),
  metadataSearch: defineApp({
    url: URLS.metadataSearch,
    sandbox: METADATA_SANDBOX,
    errorTitle: '메타데이터 검색을 불러올 수 없습니다',
  }),
  metadataRegistration: defineApp({
    url: URLS.metadataRegistration,
    sandbox: METADATA_SANDBOX,
    errorTitle: '메타데이터 등록을 불러올 수 없습니다',
  }),
  metadataGraph: defineApp({
    url: URLS.metadataGraph,
    sandbox: METADATA_SANDBOX,
    errorTitle: '메타데이터 그래프를 불러올 수 없습니다',
  }),
  syncEngine: defineApp({
    url: URLS.syncEngine,
    sandbox: DEFAULT_SANDBOX,
    errorTitle: '동기화 엔진을 불러올 수 없습니다',
  }),
  verification: defineApp({
    url: URLS.verification,
    sandbox: DEFAULT_SANDBOX,
    errorTitle: '검증 도구를 불러올 수 없습니다',
  }),
  serviceLogic: defineApp({
    url: URLS.serviceLogic,
    sandbox: DEFAULT_SANDBOX,
    errorTitle: '로직 도구를 불러올 수 없습니다',
  }),
  predictor: defineApp({
    url: URLS.predictor,
    sandbox: DEFAULT_SANDBOX,
    errorTitle: '예측 도구를 불러올 수 없습니다',
  }),
  simulation: defineApp({
    url: URLS.simulation,
    sandbox: SIMULATION_SANDBOX,
    errorTitle: '시뮬레이션 도구를 불러올 수 없습니다',
  }),
  dataTracking: defineApp({
    url: URLS.dataTracking,
    sandbox: TRACKING_SANDBOX,
    errorTitle: '트래킹 요청을 불러올 수 없습니다',
  }),
  dataTrackingList: defineApp({
    url: URLS.dataTrackingList,
    sandbox: TRACKING_SANDBOX,
    errorTitle: '트래킹 요청 목록을 불러올 수 없습니다',
  }),
};

export function getEmbeddedApp(
  id: EmbeddedAppId,
  urlOverride?: string,
): EmbeddedAppConfig {
  const config = EMBEDDED_APPS[id];
  return urlOverride ? defineApp({ ...config, url: urlOverride }) : config;
}
