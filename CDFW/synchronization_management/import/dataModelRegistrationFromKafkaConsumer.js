// /home/jejutp/kafkajs/dataModelRegistrationFromKafkaConsumer.js
const { Kafka } = require("kafkajs");
const axios = require("axios");

const kafka = new Kafka({
  clientId: "client-keti",
  brokers: ["220.124.222.84:9092"],
});

const consumer = kafka.consumer({ groupId: "twin-meta" });

const initKafka = async () => {
  console.log("start subscribe");
  await consumer.connect();
  await consumer.subscribe({
    topic: "twin-meta-changelog",
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let eachStr = message.value.toString();
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

async function processJsonObject(jsonData) {
  try {
    const metaTypeModel = jsonData.metadata.metaTypeModel;
    const action = jsonData.action;
    const dtwId = jsonData.upSetList[0]?.dtwId;
    const key = jsonData.key;
    const host = "http://localhost:1219";
    let modifiedObject = modifyKeys(jsonData.metadata);

    let url = "";

    switch (metaTypeModel) {
      case "DigitalTwin":
        if (action === "create") {
          url = `${host}/fedit/light/digital-twins`;
          modifiedObject["digital_twin_identifier"] = key;
          modifiedObject["digital_twin_name"] = jsonData.metadata.name;
        } else if (action === "modify" || action === "delete") {
          url = `${host}/fedit/v1/digital-twins/${key}`;
          modifiedObject["member_digital_objects_ids"] =
            jsonData.metadata.digitalTwinObjects;
          modifiedObject["number_of_digital_objects"] = safeCount(
            jsonData.metadata?.digitalTwinObjects
          );
          modifiedObject["number_of_services"] = safeCount(
            jsonData.metadata?.services
          );
          modifiedObject["number_of_simulations"] = safeCount(
            jsonData.metadata?.simulations
          );
        }
        break;

      case "DigitalTwinObject":
        if (action === "create") {
          url = `${host}/fedit/light/digital-twins/${dtwId}/digital-objects`;
          modifiedObject["digital_object_identifier"] = key;
          modifiedObject["digital_twin_name"] = jsonData.metadata.name;
        } else if (action === "modify" || action === "delete") {
          url = `${host}/fedit/v1/digital-twins/${dtwId}/digital-objects/${key}`;
          modifiedObject["digital_object_data_source_type"] = "POLL";
          const accessUrl =
            jsonData.metadata?.digitalTwinObjectData?.dataAccessURL;
          if (accessUrl) {
            try {
              const urlObj = new URL(accessUrl);
              const source_base_url = `${urlObj.protocol}//${urlObj.host}`;
              modifiedObject["digital_object_data_source_base_url"] =
                source_base_url;
              modifiedObject["digital_object_data_source_url"] = accessUrl;
            } catch (e) {
              console.warn(`[warn] Invalid digitalAccessURL: ${accessUrl}`);
            }
          }

          modifiedObject["digital_object_data_interval"] =
            jsonData.metadata?.digitalTwinObjectData?.updateInterval;
          modifiedObject["digital_object_data_access_type"] = "http";
          modifiedObject["digital_object_control_url"] =
            jsonData.metadata?.digitalObjectControlUrl;
          modifiedObject["digital_object_control_request_model"] =
            jsonData.metadata?.digitalObjectControlRequestModel;
          modifiedObject["digital_object_data_model"] =
            jsonData.metadata?.digitalTwinObjectData;
        }
        break;

      case "Simulation":
        if (action === "create") {
          url = `${host}/fedit/light/digital-twins/${dtwId}/simulations`;
          modifiedObject["simulation_identifier"] = key;
          modifiedObject["simulation_name"] = jsonData.metadata.name;
        } else if (action === "modify" || action === "delete") {
          url = `${host}/fedit/v1/digital-twins/${dtwId}/simulations/${key}`;
        }
        break;

      case "Service":
        if (action === "create") {
          url = `${host}/fedit/light/digital-twins/${dtwId}/services`;
          modifiedObject["service_identifier"] = key;
          modifiedObject["service_name"] = jsonData.metadata.name;
        } else if (action === "modify" || action === "delete") {
          url = `${host}/fedit/v1/digital-twins/${dtwId}/services/${key}`;
        }
        break;

      default:
        console.error(`Invalid metaTypeModel ${metaTypeModel}`);
        return;
    }

    const method = {
      create: "POST",
      modify: "PATCH",
      delete: "DELETE",
    }[action];

    if (method && url) {
      const response = await sendHTTPRequest({
        metaTypeModel,
        data: modifiedObject,
        method,
        url,
      });
      console.log(`res:`, response.data);
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
        (match) => `_${match.toLowerCase()}`
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

initKafka();
