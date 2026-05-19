/**
 * -----------------------------------------------------------------------------
 * NGSI-LD Converter Server
 * -----------------------------------------------------------------------------
 * 기능
 * - GET /ngsi-ld/objects/atmosphere/latest
 * - GET /ngsi-ld/objects/marine/latest
 * - GET /ngsi-ld/objects/weather/latest
 * - GET /ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld
 * curl 예시
 * - curl http://localhost:3001/ngsi-ld/objects/atmosphere/latest
 * - curl http://localhost:3001/ngsi-ld/objects/marine/latest
 * - curl http://localhost:3001/ngsi-ld/objects/weather/latest
 * - curl http://localhost:3001/ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld
 * -----------------------------------------------------------------------------
 * 추가 기능
 * 1) 시뮬레이션 실행 API
 *    - simulationRequestParam 검증
 *    - simulationResponseInfo / errorInfo 반환
 *    - curl 예시: curl --location --request POST 'http://localhost:3001/api/simulations/run' --header 'Content-Type: application/json' --data-raw '{
  "initialState": "normal",
  "condition": "heavy_rain"
}'
 * 2) 시각화 모델 다운로드 API
 *    - files/sample.fbx 파일다운로드
 *    - curl 예시: curl -OJ 'http://localhost:3001/api/visual-models/download'
 * 
 */

const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3001;

app.use(express.json());

/**
 * 샘플 시뮬레이션 메타데이터
 */
const simulations = [
  {
    dtsimid: "SIM-KR-1-04710-0001",
    name: "하천 범람 시뮬레이션",
    description: "제주시 서귀포 지역 하천의 우천시 범람 시뮬레이션입니다.",
    creationTime: "2024-03-04T17:17:40.123456Z",
    modificationTime: "2024-03-04T17:17:40.123456Z",
    subjects: ["환경"],
    keywords: ["#재난안전"],
    simulationAccessURL: `http://localhost:${PORT}/api/simulations/SIM-KR-1-04710-0001/run`,
    authorization: "없음",
    simulationRequestParam: {
      initialState: "string",
      condition: "string",
    },
    simulationResponseInfo: {
      result: {
        creationTime: "2026-04-03T16:20:40.123456+09:00",
        data: "random()",
      },
    },
    responseFormatType: "JSON",
    interfaceType: "REST",
    errorInfo: {
      errors: [
        {
          code: 4,
          message: "HTTP_ERROR",
          description: "HTTP 에러",
        },
        {
          code: 99,
          message: "UNKNOWN_ERROR",
          description: "기타에러",
        },
      ],
    },
    simulationType: "동역학 시뮬레이션",
  },
];

/**
 * 표준 errorInfo 응답 생성
 */
function buildErrorResponse(code, message, description) {
  return {
    errors: [
      {
        code,
        message,
        description,
      },
    ],
  };
}

/**
 * 시뮬레이션 요청 파라미터 검증
 * 현재 예시 기준으로 initialState, condition 필수
 */
function validateSimulationRequest(body) {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      description: "요청 본문은 JSON object여야 합니다.",
    };
  }

  if (typeof body.initialState !== "string") {
    return {
      valid: false,
      description: "initialState는 string이어야 합니다.",
    };
  }

  if (typeof body.condition !== "string") {
    return {
      valid: false,
      description: "condition은 string이어야 합니다.",
    };
  }

  return { valid: true };
}

/**
 * 현재 시각 반환
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * 파일명 추출
 */
function getFileNameFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return path.basename(parsedUrl.pathname) || "model.fbx";
  } catch (e) {
    return "model.fbx";
  }
}

/**
 * -----------------------------------------------------------------------------
 * 기본 설정
 * -----------------------------------------------------------------------------
 */
const FDT_BASE_URL =
  "http://localhost:1219/fedit/v1/digital-twins/KR-01-O84213-20260001/digital-objects";

const ATMOSPHERE_OBJECT_ID = "KR-104111-0021";
const MARINE_OBJECT_ID = "KR-104111-0022";
const WEATHER_OBJECT_ID = "KR-104111-0023";

const CONTEXT_URL =
  "http://localhost:3001/ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld";

const COMMON_METADATA = {
  owner: "KETI",
  contactPoint: "mailto:cotlab@keti.re.kr",
  creator: "FederatedTwin NGSI-LD Converter",
};

/**
 * -----------------------------------------------------------------------------
 * 단일 통합 Context 문서
 * -----------------------------------------------------------------------------
 */
const FDT_POHANG_CONTEXT_DOC = {
  "@context": {
    "ngsi-ld": "https://uri.etsi.org/ngsi-ld/",
    id: "@id",
    type: "@type",
    value: "https://uri.etsi.org/ngsi-ld/hasValue",

    object: {
      "@id": "https://uri.etsi.org/ngsi-ld/hasObject",
      "@type": "@id",
    },

    Property: "https://uri.etsi.org/ngsi-ld/Property",
    Relationship: "https://uri.etsi.org/ngsi-ld/Relationship",
    GeoProperty: "https://uri.etsi.org/ngsi-ld/GeoProperty",
    DateTime: "https://uri.etsi.org/ngsi-ld/DateTime",

    createdAt: {
      "@id": "https://uri.etsi.org/ngsi-ld/createdAt",
      "@type": "DateTime",
    },
    modifiedAt: {
      "@id": "https://uri.etsi.org/ngsi-ld/modifiedAt",
      "@type": "DateTime",
    },
    observedAt: {
      "@id": "https://uri.etsi.org/ngsi-ld/observedAt",
      "@type": "DateTime",
    },
    location: "https://uri.etsi.org/ngsi-ld/location",
    coordinates: "https://uri.etsi.org/ngsi-ld/coordinates",

    "@vocab": "https://220.124.222.84:3001/fdt-pohang/",

    Atmosphere: "https://220.124.222.84:3001/fdt-pohang/Atmosphere",
    MarineWaterQuality:
      "https://220.124.222.84:3001/fdt-pohang/MarineWaterQuality",
    WeatherObservation:
      "https://220.124.222.84:3001/fdt-pohang/WeatherObservation",

    name: "https://uri.etsi.org/ngsi-ld/name",
    description: "https://uri.etsi.org/ngsi-ld/description",

    owner: "https://220.124.222.84:3001/fdt-pohang/owner",
    contactPoint: "https://220.124.222.84:3001/fdt-pohang/contactPoint",
    creator: "https://220.124.222.84:3001/fdt-pohang/creator",
    subject: "https://220.124.222.84:3001/fdt-pohang/subject",
    keywords: "https://220.124.222.84:3001/fdt-pohang/keywords",
    source: "https://220.124.222.84:3001/fdt-pohang/source",

    platformRowtime: {
      "@id": "https://220.124.222.84:3001/fdt-pohang/platformRowtime",
      "@type": "DateTime",
    },

    co: "https://220.124.222.84:3001/fdt-pohang/co",
    o3: "https://220.124.222.84:3001/fdt-pohang/o3",
    ou: "https://220.124.222.84:3001/fdt-pohang/ou",
    co2: "https://220.124.222.84:3001/fdt-pohang/co2",
    h2s: "https://220.124.222.84:3001/fdt-pohang/h2s",
    nh3: "https://220.124.222.84:3001/fdt-pohang/nh3",
    no2: "https://220.124.222.84:3001/fdt-pohang/no2",
    so2: "https://220.124.222.84:3001/fdt-pohang/so2",
    voc: "https://220.124.222.84:3001/fdt-pohang/voc",
    batt: "https://220.124.222.84:3001/fdt-pohang/batt",
    hcho: "https://220.124.222.84:3001/fdt-pohang/hcho",
    humi: "https://220.124.222.84:3001/fdt-pohang/humi",
    pm10: "https://220.124.222.84:3001/fdt-pohang/pm10",
    pm25: "https://220.124.222.84:3001/fdt-pohang/pm25",
    temp: "https://220.124.222.84:3001/fdt-pohang/temp",
    devId: "https://220.124.222.84:3001/fdt-pohang/devId",
    winsp: "https://220.124.222.84:3001/fdt-pohang/winsp",
    windir: "https://220.124.222.84:3001/fdt-pohang/windir",

    ec: "https://220.124.222.84:3001/fdt-pohang/ec",
    ph: "https://220.124.222.84:3001/fdt-pohang/ph",
    orp: "https://220.124.222.84:3001/fdt-pohang/orp",
    tds: "https://220.124.222.84:3001/fdt-pohang/tds",
    temper: "https://220.124.222.84:3001/fdt-pohang/temper",
    doxygen: "https://220.124.222.84:3001/fdt-pohang/doxygen",
    salinity: "https://220.124.222.84:3001/fdt-pohang/salinity",
    waterDepth: "https://220.124.222.84:3001/fdt-pohang/waterDepth",
    flowVelocity: "https://220.124.222.84:3001/fdt-pohang/flowVelocity",

    mmafCode: "https://220.124.222.84:3001/fdt-pohang/mmafCode",
    mmafName: "https://220.124.222.84:3001/fdt-pohang/mmafName",
    mmsiCode: "https://220.124.222.84:3001/fdt-pohang/mmsiCode",
    mmsiName: "https://220.124.222.84:3001/fdt-pohang/mmsiName",
    windDirection: "https://220.124.222.84:3001/fdt-pohang/windDirection",
    windSpeed: "https://220.124.222.84:3001/fdt-pohang/windSpeed",
    surfaceCurrentDirection:
      "https://220.124.222.84:3001/fdt-pohang/surfaceCurrentDirection",
    surfaceCurrentSpeed:
      "https://220.124.222.84:3001/fdt-pohang/surfaceCurrentSpeed",
    airTemperature: "https://220.124.222.84:3001/fdt-pohang/airTemperature",
    humidity: "https://220.124.222.84:3001/fdt-pohang/humidity",
    waterTemperature: "https://220.124.222.84:3001/fdt-pohang/waterTemperature",
  },
};

/**
 * -----------------------------------------------------------------------------
 * 공통 유틸 함수
 * -----------------------------------------------------------------------------
 */
function sendError(res, status, message, detail = null) {
  return res.status(status).json({
    error: message,
    detail,
  });
}

function property(value, observedAt) {
  const result = {
    type: "Property",
    value,
  };

  if (observedAt) {
    result.observedAt = observedAt;
  }

  return result;
}

function geoProperty(longitude, latitude, observedAt) {
  const result = {
    type: "GeoProperty",
    value: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };

  if (observedAt) {
    result.observedAt = observedAt;
  }

  return result;
}

function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function parseNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "-" ||
    value === "미제공"
  ) {
    return null;
  }

  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function parseString(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "-" ||
    value === "미제공"
  ) {
    return null;
  }

  return String(value);
}

/**
 * KST 문자열 ("YYYY-MM-DD HH:mm:ss") -> ISO8601 UTC
 * 예: 2026-04-02 13:59:54 -> 2026-04-02T04:59:54.000Z
 */
function parseKstTextToUtcIso(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const [, y, m, d, hh, mm, ss] = match;
  const isoKst = `${y}-${m}-${d}T${hh}:${mm}:${ss}+09:00`;
  return new Date(isoKst).toISOString();
}

/**
 * KST 문자열 ("YYYYMMDDHHmmss") -> ISO8601 UTC
 * 예: 20260402121000 -> 2026-04-02T03:10:00.000Z
 */
function parseCompactKstTextToUtcIso(text) {
  if (!text || typeof text !== "string" || text.length !== 14) {
    return null;
  }

  const y = text.slice(0, 4);
  const m = text.slice(4, 6);
  const d = text.slice(6, 8);
  const hh = text.slice(8, 10);
  const mm = text.slice(10, 12);
  const ss = text.slice(12, 14);

  const isoKst = `${y}-${m}-${d}T${hh}:${mm}:${ss}+09:00`;
  return new Date(isoKst).toISOString();
}

function createBaseEntity({
  id,
  type,
  name,
  description,
  subject,
  keywords,
  platformRowtime,
}) {
  const entity = {
    id,
    type,
    "@context": CONTEXT_URL,
    name: property(name),
    description: property(description),
    owner: property(COMMON_METADATA.owner),
    contactPoint: property(COMMON_METADATA.contactPoint),
    creator: property(COMMON_METADATA.creator),
    subject: property(subject),
    keywords: property(keywords),
  };

  if (platformRowtime) {
    entity.createdAt = property(platformRowtime);
    entity.modifiedAt = property(platformRowtime);
    entity.platformRowtime = property(platformRowtime);
  }

  entity.source = property("FederatedTwin");

  return entity;
}

/**
 * -----------------------------------------------------------------------------
 * FDT API 호출
 * -----------------------------------------------------------------------------
 */
async function fetchLatestFdtData(digitalObjectId) {
  const url = `${FDT_BASE_URL}/${digitalObjectId}/data?count=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `FDT API 호출 실패: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();

  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(
      `FDT API 응답에 데이터가 없습니다. objectId=${digitalObjectId}`,
    );
  }

  return json[0];
}

/**
 * -----------------------------------------------------------------------------
 * 변환 함수
 * -----------------------------------------------------------------------------
 */
function transformAtmosphereToNgsiLd(raw) {
  const data = raw.data || {};
  const platformRowtime = raw.rowtime;
  const sensorObservedAt = parseKstTextToUtcIso(data.logDateTime);

  const entity = createBaseEntity({
    id: `urn:ngsi-ld:Atmosphere:${raw.digital_object_id}`,
    type: "Atmosphere",
    name: "포항 대기 환경 측정 객체",
    description: "포항 디지털 트윈의 대기 환경 센서 최신 관측 데이터",
    subject: "Pohang Atmosphere Sensor",
    keywords: "air-quality, pm10, pm25, temperature, humidity",
    platformRowtime,
  });

  const fieldNames = [
    "co",
    "o3",
    "ou",
    "co2",
    "h2s",
    "nh3",
    "no2",
    "so2",
    "voc",
    "batt",
    "hcho",
    "humi",
    "pm10",
    "pm25",
    "temp",
    "devId",
    "winsp",
    "windir",
  ];

  for (const fieldName of fieldNames) {
    if (data[fieldName] !== undefined && data[fieldName] !== null) {
      entity[fieldName] = property(
        data[fieldName],
        sensorObservedAt || undefined,
      );
    }
  }

  return entity;
}

function transformMarineToNgsiLd(raw) {
  const data = raw.data || {};
  const platformRowtime = raw.rowtime;
  const sensorObservedAt = parseKstTextToUtcIso(data.logDateTime);

  const entity = createBaseEntity({
    id: `urn:ngsi-ld:MarineWaterQuality:${raw.digital_object_id}`,
    type: "MarineWaterQuality",
    name: "포항 해양 환경 측정 객체",
    description: "포항 디지털 트윈의 해양 환경 센서 최신 관측 데이터",
    subject: "Pohang Marine Sensor",
    keywords: "water-quality, salinity, ph, dissolved-oxygen",
    platformRowtime,
  });

  const fieldNames = [
    "ec",
    "ph",
    "orp",
    "tds",
    "batt",
    "devId",
    "temper",
    "doxygen",
    "salinity",
    "waterDepth",
    "flowVelocity",
  ];

  for (const fieldName of fieldNames) {
    if (data[fieldName] !== undefined && data[fieldName] !== null) {
      entity[fieldName] = property(
        data[fieldName],
        sensorObservedAt || undefined,
      );
    }
  }

  if (isValidNumber(data.gpsLongi) && isValidNumber(data.gpsLati)) {
    entity.location = geoProperty(
      data.gpsLongi,
      data.gpsLati,
      sensorObservedAt || undefined,
    );
  }

  return entity;
}

function transformWeatherToNgsiLd(raw) {
  const data = raw.data || {};
  const platformRowtime = raw.rowtime;
  const sensorObservedAt = parseCompactKstTextToUtcIso(data.DATETIME);

  const entity = createBaseEntity({
    id: `urn:ngsi-ld:WeatherObservation:${raw.digital_object_id}`,
    type: "WeatherObservation",
    name: "포항 해양 기상 관측 객체",
    description: "포항 디지털 트윈의 해양 기상 최신 관측 데이터",
    subject: "Pohang Weather Marine Observation",
    keywords:
      "marine-weather, wind, surface-current, air-temperature, water-temperature, humidity",
    platformRowtime,
  });

  const mmafCode = parseString(data.MMAF_CODE);
  const mmafName = parseString(data.MMAF_NM);
  const mmsiCode = parseString(data.MMSI_CODE);
  const mmsiName = parseString(data.MMSI_NM);

  const windDirection = parseNumber(data.WIND_DIRECT);
  const windSpeed = parseNumber(data.WIND_SPEED);
  const surfaceCurrentDirection = parseNumber(data.SURFACE_CURR_DRC);
  const surfaceCurrentSpeed = parseNumber(data.SURFACE_CURR_SPEED);
  const airTemperature = parseNumber(data.AIR_TEMPERATURE);
  const humidity = parseNumber(data.HUMIDITY);
  const waterTemperature = parseNumber(data.WATER_TEMPER);
  const latitude = parseNumber(data.LATITUDE);
  const longitude = parseNumber(data.LONGITUDE);

  if (mmafCode !== null) entity.mmafCode = property(mmafCode);
  if (mmafName !== null) entity.mmafName = property(mmafName);
  if (mmsiCode !== null) entity.mmsiCode = property(mmsiCode);
  if (mmsiName !== null) entity.mmsiName = property(mmsiName);

  if (windDirection !== null) {
    entity.windDirection = property(
      windDirection,
      sensorObservedAt || undefined,
    );
  }
  if (windSpeed !== null) {
    entity.windSpeed = property(windSpeed, sensorObservedAt || undefined);
  }
  if (surfaceCurrentDirection !== null) {
    entity.surfaceCurrentDirection = property(
      surfaceCurrentDirection,
      sensorObservedAt || undefined,
    );
  }
  if (surfaceCurrentSpeed !== null) {
    entity.surfaceCurrentSpeed = property(
      surfaceCurrentSpeed,
      sensorObservedAt || undefined,
    );
  }
  if (airTemperature !== null) {
    entity.airTemperature = property(
      airTemperature,
      sensorObservedAt || undefined,
    );
  }
  if (humidity !== null) {
    entity.humidity = property(humidity, sensorObservedAt || undefined);
  }
  if (waterTemperature !== null) {
    entity.waterTemperature = property(
      waterTemperature,
      sensorObservedAt || undefined,
    );
  }

  if (longitude !== null && latitude !== null) {
    entity.location = geoProperty(
      longitude,
      latitude,
      sensorObservedAt || undefined,
    );
  }

  return entity;
}

/**
 * -----------------------------------------------------------------------------
 * Context API
 * -----------------------------------------------------------------------------
 */
app.get("/ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld", (req, res) => {
  res.setHeader("Content-Type", "application/ld+json");
  return res.json(FDT_POHANG_CONTEXT_DOC);
});

/**
 * 헬스체크
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * -----------------------------------------------------------------------------
 * 라우트
 * -----------------------------------------------------------------------------
 */
app.get("/", (req, res) => {
  res.json({
    message: "NGSI-LD 변환 서버 실행 중",
    endpoints: [
      "GET /ngsi-ld/objects/atmosphere/latest",
      "GET /ngsi-ld/objects/marine/latest",
      "GET /ngsi-ld/objects/weather/latest",
      "GET /ngsi-ld/objects/:fdoId",
      "GET /ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld",
    ],
  });
});

app.get("/ngsi-ld/objects/atmosphere/latest", async (req, res) => {
  try {
    const raw = await fetchLatestFdtData(ATMOSPHERE_OBJECT_ID);
    const entity = transformAtmosphereToNgsiLd(raw);
    return res.json(entity);
  } catch (error) {
    return sendError(res, 500, "대기 데이터 변환 실패", error.message);
  }
});

app.get("/ngsi-ld/objects/marine/latest", async (req, res) => {
  try {
    const raw = await fetchLatestFdtData(MARINE_OBJECT_ID);
    const entity = transformMarineToNgsiLd(raw);
    return res.json(entity);
  } catch (error) {
    return sendError(res, 500, "해양 데이터 변환 실패", error.message);
  }
});

app.get("/ngsi-ld/objects/weather/latest", async (req, res) => {
  try {
    const raw = await fetchLatestFdtData(WEATHER_OBJECT_ID);
    const entity = transformWeatherToNgsiLd(raw);
    return res.json(entity);
  } catch (error) {
    return sendError(res, 500, "기상 데이터 변환 실패", error.message);
  }
});

/**
 * 일반 FDO id 단순 스텁
 * - 미러 DO 생성 시 digital_object_data_source_url 도달 가능성 확인 등의 용도
 * 예: curl http://localhost:3001/ngsi-ld/objects/KR-TEST-0001
 */
app.get("/ngsi-ld/objects/:fdoId", (req, res) => {
  const { fdoId } = req.params;
  res.setHeader("Content-Type", "application/ld+json");
  return res.json({
    id: `urn:ngsi-ld:DigitalObjectData:${fdoId}`,
    type: "DigitalObjectData",
    "@context": `http://localhost:3001/ngsi-ld/objects/${fdoId}`,
    name: property(fdoId),
    description: property(
      `${fdoId} dataAccessURL 도달 가능성 확인용 스텁 응답`,
    ),
    source: property("외부 API 또는 FDO"),
  });
});

/**
 * 샘플 fbx 정적 파일 제공용
 * server.js와 같은 위치에 files/sample.fbx 파일을 두면 됨
 */
app.use("/files", express.static(path.join(__dirname, "files")));

/**
 * 시뮬레이션 실행 API
 * simulationRequestParam 검증 후
 * simulationResponseInfo 형태로 결과 반환
 */
app.post("/api/simulations/run", (req, res) => {
  try {
    const validation = validateSimulationRequest(req.body);
    if (!validation.valid) {
      return res
        .status(400)
        .json(buildErrorResponse(4, "HTTP_ERROR", validation.description));
    }

    /**
  
     * 실제 시뮬레이터 대신 예시 결과 생성
     */
    const response = {
      result: {
        creationTime: nowIso(),
        data: Math.random(),
        request: {
          initialState: req.body.initialState,
          condition: req.body.condition,
        },
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        buildErrorResponse(99, "UNKNOWN_ERROR", error.message || "기타에러"),
      );
  }
});

app.get("/api/visual-models/download", (req, res) => {
  try {
    const filePath = path.join(__dirname, "files", "sample.fbx");

    /**
     * 파일 존재 체크
     */
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json(
          buildErrorResponse(
            4,
            "HTTP_ERROR",
            "sample.fbx 파일이 존재하지 않습니다.",
          ),
        );
    }

    /**
     * 다운로드 헤더 설정
     */
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", 'attachment; filename="sample.fbx"');

    /**
     * 파일 스트림으로 내려주기
     */
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    return res
      .status(500)
      .json(
        buildErrorResponse(99, "UNKNOWN_ERROR", error.message || "기타에러"),
      );
  }
});

app.listen(PORT, () => {
  console.log(`NGSI-LD converter server is running on port ${PORT}`);
  console.log(`server running: http://localhost:${PORT}`);
  console.log(`health check : http://localhost:${PORT}/health`);
});
