const { Kafka } = require("kafkajs");
const axios = require("axios");

const kafka = new Kafka({
  clientId: "client-keti",
  brokers: ["localhost:9092"], //220.124.222.84:9092, localhost:9092
});

const consumer = kafka.consumer({ groupId: "twin-meta" });

/**
 * 기존 light 서버(단일 트윈 관련) + 연합(Fedit v1) 서버 분리
 * - 단일 DT/DO 등: 1219 (/fedit/light, /fedit/v1 일부)
 * - 연합 FDT/FDO: 1213 (/fedit/v1/federated-twins ...)
 */
const HOST_CONNECTOR = "http://localhost:1219";
const HOST_BRAIN = "http://localhost:1213";

const initKafka = async () => {
  console.log("start subscribe");
  await consumer.connect();
  await consumer.subscribe({
    topic: "twin-meta-changelog",
    fromBeginning: false,
  });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const eachStr = message.value.toString();
      let jsonData;
      try {
        jsonData = JSON.parse(eachStr);
        console.log(jsonData);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return;
      }
      await processJsonObject(jsonData);
    },
  });
};

function safeCount(value) {
  return Array.isArray(value) ? value.length : 0;
}

function getKeywordsFromMetadata(metadata) {
  // 연합 트윈 예시에선 keywords가 따로 없고 subjects가 사실상 키워드 역할
  // 실제로 keywords 필드가 오면 그걸 우선 사용
  return metadata?.keywords ?? metadata?.subjects ?? [];
}

function resolveParentTwinTypeForObject(jsonData) {
  // DigitalTwinObject의 상위 트윈 타입 판단: upSetList[0].upModelId
  // - FederatedDigitalTwin: 연합
  // - SingleDigitalTwin: 단일
  return jsonData?.upSetList?.[0]?.upModelId ?? null;
}

async function processJsonObject(jsonData) {
  try {
    const metaTypeModel = jsonData?.metadata?.metaTypeModel;
    const metaModel = jsonData?.metadata?.metaModel;
    const action = jsonData?.action;
    const key = jsonData?.key;

    // dtwId는 DigitalTwinObject/Service/Simulation에선 upSetList에서 가져오고,
    // DigitalTwin 자체는 metadata.dtid도 사용 가능하게 보강
    const dtwId =
      jsonData?.upSetList?.[0]?.dtwId ??
      jsonData?.metadata?.dtid ??
      jsonData?.metadata?.dtwId;

    let modifiedObject = modifyKeys(jsonData.metadata);

    let url = "";
    let method = {
      create: "POST",
      modify: "PATCH",
      delete: "DELETE",
    }[action];

    if (!method) {
      console.error(`[error] Invalid action: ${action}`);
      return;
    }

    switch (metaTypeModel) {
      /**
       * DigitalTwin
       * - metaModel === FederatedDigitalTwin 이면 연합 트윈 등록/수정/삭제로 처리
       * - 그 외는 기존 단일 트윈 로직 유지
       */
      case "DigitalTwin": {
        const isFederatedTwin = metaModel === "FederatedDigitalTwin";

        if (isFederatedTwin) {
          // 연합 트윈 (FDT)
          if (action === "create") {
            url = `${HOST_BRAIN}/fedit/v1/federated-twins`;
            modifiedObject["federated_digital_twin_identifier"] =
              key ?? jsonData?.metadata?.dtid;
            modifiedObject["federated_digital_twin_name"] =
              jsonData?.metadata?.name;
            modifiedObject["point_of_access"] =
              jsonData?.metadata?.pointOfAccess;
            modifiedObject["description"] = jsonData?.metadata?.description;
            modifiedObject["owner"] = jsonData?.metadata?.owner;
            modifiedObject["keywords"] = getKeywordsFromMetadata(
              jsonData?.metadata,
            );
            modifiedObject["creator_id"] = jsonData?.metadata?.creator;
          } else if (action === "modify" || action === "delete") {
            url = `${HOST_BRAIN}/fedit/v1/federated-twins/${key}`;
            modifiedObject["federated_digital_twin_name"] =
              jsonData?.metadata?.name;
            modifiedObject["point_of_access"] =
              jsonData?.metadata?.pointOfAccess;
            modifiedObject["keywords"] = getKeywordsFromMetadata(
              jsonData?.metadata,
            );
            modifiedObject["creator_id"] = jsonData?.metadata?.creator;
          }
        } else {
          // 기존 단일 트윈 (SingleDigitalTwin 가정)
          if (action === "create") {
            url = `${HOST_CONNECTOR}/fedit/light/digital-twins`;
            modifiedObject["digital_twin_identifier"] = key;
            modifiedObject["digital_twin_name"] = jsonData?.metadata?.name;
          } else if (action === "modify" || action === "delete") {
            url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${key}`;
            modifiedObject["member_digital_objects_ids"] =
              jsonData?.metadata?.digitalTwinObjects;
            modifiedObject["number_of_digital_objects"] = safeCount(
              jsonData?.metadata?.digitalTwinObjects,
            );
            modifiedObject["number_of_services"] = safeCount(
              jsonData?.metadata?.services,
            );
            modifiedObject["number_of_simulations"] = safeCount(
              jsonData?.metadata?.simulations,
            );
            modifiedObject["creator_id"] = jsonData?.metadata?.creator;
          }
        }
        break;
      }

      /**
       * DigitalTwinObject
       * - 부모가 FederatedDigitalTwin 이고 upPrptyId === "federatedDigitalTwinObjects" 이면
       *   연합 객체(FDO) 등록/수정/삭제로 처리
       * - 부모가 FederatedDigitalTwin 이고 upPrptyId === "digitalTwinObjects" 이면
       *   연합 트윈 하위에 등록된 단일 객체로, 미러 DT(id=fdt_id) 하위에 단일 DO로 처리
       * - 그 외는 기존 단일 트윈 하위 DO 등록/수정/삭제 유지
       */
      case "DigitalTwinObject": {
        const parentTwinType = resolveParentTwinTypeForObject(jsonData);
        const parentPropertyId = jsonData?.upSetList?.[0]?.upPrptyId ?? null;
        const isFDO =
          parentTwinType === "FederatedDigitalTwin" &&
          parentPropertyId === "federatedDigitalTwinObjects";

        if (!dtwId) {
          console.error("[error] dtwId not found for DigitalTwinObject");
          return;
        }

        if (isFDO) {
          // 연합 객체(FDO)
          if (action === "create") {
            url = `${HOST_BRAIN}/fedit/v1/federated-twins/${dtwId}/federated-digital-objects`;

            modifiedObject["federated_digital_object_identifier"] = key;
            modifiedObject["federated_digital_object_name"] =
              jsonData?.metadata?.name;
            modifiedObject["description"] = jsonData?.metadata?.description;
            modifiedObject["keywords"] = jsonData?.metadata?.keywords ?? [];
            modifiedObject["member_digital_twin_object_ids"] =
              jsonData?.metadata?.relatedDigitalTwinObjects ?? [];
          } else if (action === "modify" || action === "delete") {
            url = `${HOST_BRAIN}/fedit/v1/federated-twins/${dtwId}/federated-digital-objects/${key}`;

            modifiedObject["federated_digital_object_name"] =
              jsonData?.metadata?.name;
            modifiedObject["description"] = jsonData?.metadata?.description;
            modifiedObject["keywords"] = jsonData?.metadata?.keywords ?? [];
            modifiedObject["member_digital_twin_object_ids"] =
              jsonData?.metadata?.relatedDigitalTwinObjects ?? [];
          }
        } else {
          // 기존 단일 트윈 하위 디지털 객체(DO)
          const isFDTSingleDOCreate =
            parentTwinType === "FederatedDigitalTwin" &&
            parentPropertyId === "digitalTwinObjects" &&
            action === "create";

          if (isFDTSingleDOCreate) {
            // FDT 하위 단일 DO create는 후처리 단계의 createMirrorDigitalObject로 위임
            // (url 미설정 → 메인 요청 자동 스킵)
          } else if (action === "create") {
            url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${dtwId}/digital-objects`;
            modifiedObject["digital_object_identifier"] = key;
            modifiedObject["digital_object_name"] = jsonData?.metadata?.name;

            const accessUrl =
              jsonData?.metadata?.digitalTwinObjectData?.dataAccessURL;
            if (accessUrl) {
              try {
                const urlObj = new URL(accessUrl);
                const source_base_url = `${urlObj.protocol}//${urlObj.host}`;
                modifiedObject["digital_object_data_source_base_url"] =
                  source_base_url;
                modifiedObject["digital_object_data_source_url"] = accessUrl;
                modifiedObject["digital_object_data_source_type"] = "POLL";
              } catch (e) {
                console.warn(`[warn] Invalid digitalAccessURL: ${accessUrl}`);
              }
            }

            modifiedObject["digital_object_data_access_url"] =
              jsonData?.metadata?.digitalTwinObjectData?.contextURL;
            modifiedObject["digital_object_data_interval"] =
              jsonData?.metadata?.digitalTwinObjectData?.updateInterval;
            modifiedObject["digital_object_data_model"] =
              jsonData?.metadata?.digitalTwinObjectData?.schemaInformation;
            modifiedObject["digital_object_data_access_type"] = "http";
            modifiedObject["digital_object_control_url"] =
              jsonData?.metadata?.digitalObjectControlUrl;
            modifiedObject["digital_object_control_request_model"] =
              jsonData?.metadata?.digitalObjectControlRequestModel;
          } else if (action === "modify" || action === "delete") {
            url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${dtwId}/digital-objects/${key}`;

            const accessUrl =
              jsonData?.metadata?.digitalTwinObjectData?.dataAccessURL;
            if (accessUrl) {
              try {
                const urlObj = new URL(accessUrl);
                const source_base_url = `${urlObj.protocol}//${urlObj.host}`;
                modifiedObject["digital_object_data_source_base_url"] =
                  source_base_url;
                modifiedObject["digital_object_data_source_url"] = accessUrl;
                modifiedObject["digital_object_data_source_type"] = "POLL";
              } catch (e) {
                console.warn(`[warn] Invalid digitalAccessURL: ${accessUrl}`);
              }
            }

            modifiedObject["digital_object_data_access_url"] =
              jsonData?.metadata?.digitalTwinObjectData?.contextURL;
            modifiedObject["digital_object_data_interval"] =
              jsonData?.metadata?.digitalTwinObjectData?.updateInterval;
            modifiedObject["digital_object_data_model"] =
              jsonData?.metadata?.digitalTwinObjectData?.schemaInformation;
            modifiedObject["digital_object_data_access_type"] = "http";
            modifiedObject["digital_object_control_url"] =
              jsonData?.metadata?.digitalObjectControlUrl;
            modifiedObject["digital_object_control_request_model"] =
              jsonData?.metadata?.digitalObjectControlRequestModel;
          }
        }
        break;
      }

      case "Simulation": {
        if (!dtwId) {
          console.error("[error] dtwId not found for Simulation");
          return;
        }
        if (action === "create") {
          url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${dtwId}/simulations`;
          modifiedObject["simulation_identifier"] = key;
          modifiedObject["simulation_name"] = jsonData?.metadata?.name;
        } else if (action === "modify" || action === "delete") {
          url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${dtwId}/simulations/${key}`;
        }
        break;
      }

      case "Service": {
        if (!dtwId) {
          console.error("[error] dtwId not found for Service");
          return;
        }
        if (action === "create") {
          url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${dtwId}/services`;
          modifiedObject["service_identifier"] = key;
          modifiedObject["service_name"] = jsonData?.metadata?.name;
        } else if (action === "modify" || action === "delete") {
          url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${dtwId}/services/${key}`;
        }
        break;
      }

      case "VisualModel": {
        if (!dtwId) {
          console.error("[error] dtwId not found for VisualModel");
          return;
        }
        if (action === "create") {
          url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${dtwId}/visual-models`;
          modifiedObject["visual_model_identifier"] = key;
          modifiedObject["visual_model_name"] = jsonData?.metadata?.name;
        } else if (action === "modify" || action === "delete") {
          url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${dtwId}/visual-models/${key}`;
        }
        break;
      }

      default:
        console.error(`Invalid metaTypeModel ${metaTypeModel}`);
        return;
    }

    const parentTwinType = resolveParentTwinTypeForObject(jsonData);
    const parentPropertyId = jsonData?.upSetList?.[0]?.upPrptyId ?? null;
    const isUnderFDT =
      metaTypeModel === "DigitalTwinObject" &&
      parentTwinType === "FederatedDigitalTwin";
    const isFDOCreate =
      isUnderFDT &&
      parentPropertyId === "federatedDigitalTwinObjects" &&
      action === "create";
    const isSingleDOUnderFDTCreate =
      isUnderFDT &&
      parentPropertyId === "digitalTwinObjects" &&
      action === "create";

    const hasRelatedDtObjects =
      Array.isArray(jsonData?.metadata?.relatedDigitalTwinObjects) &&
      jsonData.metadata.relatedDigitalTwinObjects.length > 0;

    // relatedDigitalTwinObjects가 없는 FDO create면 FDO 자체 생성은 건너뜀
    const skipMainRequest = isFDOCreate && !hasRelatedDtObjects;

    /**
     * FDT 하위 DO create (FDO든 단일 DO든) 의 경우, 메인 요청 전에
     * 커넥터 쪽 미러 DT(id=fdt_id)가 존재하는지 확인하고 없으면 먼저 생성한다.
     * - FDO create: 메인 요청은 브레인(FDO 등록)이지만 이후 미러 DO 생성을 위해 DT 필요
     * - 단일 DO create: 메인 요청이 커넥터의 DT 하위 DO 등록이므로 DT가 반드시 존재해야 함
     */
    if ((isFDOCreate || isSingleDOUnderFDTCreate) && dtwId) {
      const dtExists = await checkDigitalTwinExists(dtwId);
      if (!dtExists) {
        await createMirrorDigitalTwin(dtwId);
      } else {
        console.log(`[info] DT ${dtwId} already exists, skip DT create`);
      }
    }

    if (method && url && !skipMainRequest) {
      console.log({
        metaTypeModel,
        data: modifiedObject,
        method,
        url,
      });

      const response = await sendHTTPRequest({
        metaTypeModel,
        data: modifiedObject,
        method,
        url,
      });

      console.log(`res:`, response.data);
    } else if (skipMainRequest) {
      console.log(
        `[info] Skip FDO create for ${key}: relatedDigitalTwinObjects is empty`,
      );
    }

    /**
     * FDT 하위 DO create 의 미러 DO 등록을 통일된 경로로 처리한다.
     * - FDO(federatedDigitalTwinObjects): 메인은 브레인 FDO 등록, 이후 커넥터 미러 DO 등록
     * - 단일 DO(digitalTwinObjects): 메인 요청은 스킵(case에서 url 미설정), 동일 경로로 미러 DO 등록
     * preliminary_field.generated_from 으로 출처를 구분한다.
     */
    if (isFDOCreate) {
      await createMirrorDigitalObject({
        fdtId: dtwId,
        fdoId: key,
        fdoMetadata: jsonData?.metadata,
        generatedFrom: "federated_digital_object",
      });
    } else if (isSingleDOUnderFDTCreate) {
      await createMirrorDigitalObject({
        fdtId: dtwId,
        fdoId: key,
        fdoMetadata: jsonData?.metadata,
        generatedFrom: "digital_twin_object_under_federated_twin",
      });
    }
  } catch (error) {
    console.error("[error] Invalid action or metaTypeModel", error);
  }
}

function modifyKeys(obj) {
  const newObj = {};
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      let newKey = key.replace(
        /([A-Z])/g,
        (match) => `_${match.toLowerCase()}`,
      );
      if (key.endsWith("URL")) {
        newKey = key
          .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
          .replace(/_u_r_l$/, "_url");
      }
      newObj[newKey] = obj[key];
    }
  }
  return newObj;
}

const sendHTTPRequest = async ({ metaTypeModel, data, method, url }) => {
  console.log(`${metaTypeModel} Sending ${method} request to: ${url}`);
  try {
    const response = await axios({ method, url, data });
    return response;
  } catch (error) {
    console.error(`[HTTP ${method}] ${url} failed:`, error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

async function checkDigitalTwinExists(dtId) {
  const url = `${HOST_CONNECTOR}/fedit/v1/digital-twins/${dtId}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    // 빈 배열 응답은 존재하지 않음을 의미
    if (Array.isArray(data) && data.length === 0) {
      return false;
    }
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    console.error(
      `[checkDigitalTwinExists] ${dtId} check failed:`,
      error.message,
    );
    throw error;
  }
}

async function fetchFederatedTwin(fdtId) {
  const url = `${HOST_BRAIN}/fedit/v1/federated-twins/${fdtId}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    if (Array.isArray(data) && data.length === 0) return null;
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.warn(`[fetchFederatedTwin] ${fdtId} fetch failed:`, error.message);
    return null;
  }
}

async function createMirrorDigitalTwin(fdtId) {
  const fdt = await fetchFederatedTwin(fdtId);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "");

  const derivedFromTag = `[연합트윈 ${fdtId}에서 파생된 단일 트윈]`;
  const description = fdt?.description
    ? `${derivedFromTag} ${fdt.description}`
    : derivedFromTag;

  const payload = {
    digital_twin_identifier: fdtId,
    digital_twin_name: fdt?.federated_digital_twin_name ?? fdtId,
    description,
    keywords: Array.isArray(fdt?.keywords) ? fdt.keywords : [],
    owner: fdt?.owner ?? null,
    point_of_access: fdt?.point_of_access ?? null,
    creator_id: fdt?.creator_id ?? null,
    creation_time: now,
    modification_time: now,
  };

  const url = `${HOST_CONNECTOR}/fedit/light/digital-twins`;
  const response = await sendHTTPRequest({
    metaTypeModel: "DigitalTwin(MirrorFromFDT)",
    data: payload,
    method: "POST",
    url,
  });
  console.log("Mirror DT create res:", response.data);
  return response.data;
}

async function createMirrorDigitalObject({
  fdtId,
  fdoId,
  fdoMetadata,
  generatedFrom = "federated_digital_object",
}) {
  const now = new Date().toISOString();
  const doData = fdoMetadata?.digitalTwinObjectData ?? {};

  let dataSourceBaseUrl = null;
  if (doData.dataAccessURL) {
    try {
      const urlObj = new URL(doData.dataAccessURL);
      dataSourceBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
    } catch (e) {
      console.warn(`[warn] Invalid dataAccessURL: ${doData.dataAccessURL}`);
    }
  }

  const derivedLabel =
    generatedFrom === "federated_digital_object"
      ? "연합 객체"
      : "연합트윈 하위 단일 객체";
  const derivedFromTag = `[연합트윈 ${fdtId}의 ${derivedLabel} ${fdoId}에서 파생된 단일 객체]`;
  const description = fdoMetadata?.description
    ? `${derivedFromTag} ${fdoMetadata.description}`
    : derivedFromTag;

  const payload = {
    digital_object_identifier: fdoId,
    digital_object_name: fdoMetadata?.name ?? fdoId,
    description,
    keywords: Array.isArray(fdoMetadata?.keywords) ? fdoMetadata.keywords : [],
    subjects: Array.isArray(fdoMetadata?.subjects) ? fdoMetadata.subjects : [],
    creation_time: fdoMetadata?.creationTime ?? now,
    modification_time: fdoMetadata?.modificationTime ?? now,
    digital_object_data_access_type: "http",
    digital_object_data_model: doData.schemaInformation ?? {},
    digital_object_control_request_model:
      fdoMetadata?.digitalObjectControlRequestModel ?? {},
    do_metadata: {
      sensors: [],
      controllers: [],
      visual_models: {},
    },
    preliminary_field: {
      generated_from: generatedFrom,
      linked_federated_digital_twin_id: fdtId,
      linked_federated_digital_object_id: fdoId,
      linked_federated_digital_object_name: fdoMetadata?.name ?? fdoId,
      generated_at: now,
    },
  };

  // nullable string/number 필드는 값이 있을 때만 포함 (서버가 null 거부)
  if (doData.contextURL) {
    payload.digital_object_data_access_url = doData.contextURL;
  }
  if (doData.dataAccessURL) {
    payload.digital_object_data_source_url = doData.dataAccessURL;
    payload.digital_object_data_source_type = "POLL";
  }
  if (dataSourceBaseUrl) {
    payload.digital_object_data_source_base_url = dataSourceBaseUrl;
  }
  if (typeof doData.updateInterval === "number") {
    payload.digital_object_data_interval = doData.updateInterval;
  }
  if (fdoMetadata?.digitalObjectControlUrl) {
    payload.digital_object_control_url = fdoMetadata.digitalObjectControlUrl;
  }

  const url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${fdtId}/digital-objects`;
  const response = await sendHTTPRequest({
    metaTypeModel: `DigitalTwinObject(Mirror:${generatedFrom})`,
    data: payload,
    method: "POST",
    url,
  });
  console.log("Mirror DO create res:", response.data);
  return response.data;
}

initKafka();
