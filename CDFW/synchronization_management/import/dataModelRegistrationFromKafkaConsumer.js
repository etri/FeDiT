const { Kafka } = require("kafkajs");
const axios = require("axios");

const kafka = new Kafka({
  clientId: "client-keti",
  brokers: ["220.124.222.84:9092"],
});

const consumer = kafka.consumer({ groupId: "twin-meta" });

/**
 * 기존 light 서버(단일 트윈 관련) + 연합(Fedit v1) 서버 분리
 * - 단일 DT/DO 등: 1219 (/fedit/light, /fedit/v1 일부)
 * - 연합 FDT/FDO: 1213 (/fedit/v1/federated-twins ...)
 */
const HOST_CONNECTOR = "http://localhost:1219";
const HOST_BRAIN = "http://localhost:1213";

/**
 * FDO 연계로 생성되는 파생 DO를 수용하는 전용 DT
 */
const DERIVED_DO_TWIN_ID = "KR-01-SYSFDO-20260001";

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
       * - upSetList[0].upModelId === FederatedDigitalTwin 이면 연합 객체(FDO) 등록/수정/삭제
       * - 그 외는 기존 단일 트윈 하위 DO 등록/수정/삭제 유지
       */
      case "DigitalTwinObject": {
        const parentTwinType = resolveParentTwinTypeForObject(jsonData);
        const isFederatedParent = parentTwinType === "FederatedDigitalTwin";

        if (!dtwId) {
          console.error("[error] dtwId not found for DigitalTwinObject");
          return;
        }

        if (isFederatedParent) {
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
          if (action === "create") {
            url = `${HOST_CONNECTOR}/fedit/light/digital-twins/${dtwId}/digital-objects`;
            modifiedObject["digital_object_identifier"] = key;
            modifiedObject["digital_object_name"] = jsonData?.metadata?.name;
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

    if (method && url) {
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

      const parentTwinType = resolveParentTwinTypeForObject(jsonData);
      const isFederatedParent =
        metaTypeModel === "DigitalTwinObject" &&
        parentTwinType === "FederatedDigitalTwin";

      /**
       * FDO 생성 성공 후, 전용 DT 하위에 파생 DO 자동 생성
       */
      if (isFederatedParent && action === "create") {
        const autoDoInfo = getAutoCreateDOInfo({
          sourceFdtId: dtwId,
          sourceFdoId: key,
          metadata: jsonData?.metadata,
        });

        const doPayload = buildDerivedDigitalObjectFromFDO(autoDoInfo);

        console.log({
          message: "Creating derived DO from created FDO",
          targetTwinId: DERIVED_DO_TWIN_ID,
          doPayload,
        });

        const doResponse = await sendHTTPRequest({
          metaTypeModel: "DigitalTwinObject(FDO->DerivedDO)",
          data: doPayload.data,
          method: "POST",
          url: doPayload.url,
        });

        console.log("Derived DO create res:", doResponse.data);
      }
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

function buildDerivedDigitalObjectFromFDO({
  targetDtwId,
  dataAccessURL,
  digital_object_identifier,
  digital_object_name,
  description,
  keywords,
  subjects,
  updateInterval,
  digitalObjectDataModel,
  sourceFdtId,
  sourceFdoId,
  sourceFdoName,
}) {
  const now = new Date().toISOString();

  const modifiedObject = {
    digital_object_identifier,
    digital_object_name,
    description,
    keywords,
    subjects,
    creation_time: now,
    modification_time: now,
    digital_object_data_access_type: "http",
    digital_object_data_access_url: dataAccessURL,
    digital_object_data_source_type: "POLL",
    digital_object_data_source_url: null,
    digital_object_data_source_base_url: null,
    digital_object_data_model: digitalObjectDataModel ?? {},
    digital_object_data_interval: updateInterval,
    digital_object_control_request_model: {},
    do_metadata: {
      sensors: [],
      controllers: [],
      visual_models: {},
    },
    preliminary_field: {
      generated_from: "federated_digital_object",
      linked_federated_digital_twin_id: sourceFdtId,
      linked_federated_digital_object_id: sourceFdoId,
      linked_federated_digital_object_name: sourceFdoName,
      generated_at: now,
    },
  };

  try {
    const urlObj = new URL(dataAccessURL);
    const source_base_url = `${urlObj.protocol}//${urlObj.host}`;
    modifiedObject["digital_object_data_source_base_url"] = source_base_url;
    modifiedObject["digital_object_data_source_url"] = dataAccessURL;
  } catch (e) {
    console.warn(`[warn] Invalid digitalAccessURL: ${dataAccessURL}`);
  }

  return {
    url: `${HOST_CONNECTOR}/fedit/v1/digital-twins/${targetDtwId}/digital-objects`,
    data: modifiedObject,
  };
}

function getAutoCreateDOInfo({ sourceFdtId, sourceFdoId, metadata }) {
  const sourceFdoName = metadata?.name ?? sourceFdoId;
  const sourceDescription =
    metadata?.description ??
    `${sourceFdoName} 연합 객체와 연계되어 자동 생성된 파생 디지털 객체`;

  const sourceKeywords = Array.isArray(metadata?.keywords)
    ? metadata.keywords
    : [];

  const sourceSubjects = Array.isArray(metadata?.subjects)
    ? metadata.subjects
    : [];

  return {
    targetDtwId: DERIVED_DO_TWIN_ID,
    // dataAccessURL은 n2m? 에서 API 주소 제공할거라 생각함. 일단 포맷은 이렇게 잡아두겠음
    dataAccessURL: `http://localhost:3001/ngsi-ld/objects/${sourceFdoId}`,
    digital_object_identifier: `${sourceFdoId}`,
    digital_object_name: `${sourceFdoName} 파생 DO`,
    description: sourceDescription,
    keywords: [
      ...new Set([...sourceKeywords, "fdo-derived", "auto-generated"]),
    ],
    subjects:
      sourceSubjects.length > 0
        ? [...new Set([...sourceSubjects, "federated-digital-object"])]
        : ["federated-digital-object", "derived-digital-object"],
    updateInterval: metadata?.digitalTwinObjectData?.updateInterval ?? 600000, // 기본 10분
    digitalObjectDataModel:
      metadata?.digitalTwinObjectData?.schemaInformation ?? {},
    sourceFdtId,
    sourceFdoId,
    sourceFdoName,
  };
}

initKafka();
