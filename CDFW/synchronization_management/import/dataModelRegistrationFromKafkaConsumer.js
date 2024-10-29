const { Kafka } = require("kafkajs");
const axios = require("axios");

const kafka = new Kafka({
   clientId: "client-keti",
   brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "n2m-server1" });

const initKafka = async () => {
   console.log("start subscribe");
   await consumer.connect();
   await consumer.subscribe({ topic: "n2m-meta-data", fromBeginning: false });
   await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
         let eachStr = await message.value.toString();
         let jsonData;
         try {
            jsonData = JSON.parse(eachStr);
            console.log(jsonData);
         } catch (error) {
            console.error("Error parsing JSON:", error);
         }
         await processJsonObject(jsonData);
      },
   });
};

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
            } else if (action === "modify" || action === "delete") {
               url = `${host}/fedit/v1/digital-twins/${key}`;
            }
            break;
         case "DigitalObject":
            if (action === "create") {
               url = `${host}/fedit/light/digital-twins/${dtwId}/digital-objects`;
               modifiedObject["digital_object_identifier"] = key;
            } else if (action === "modify" || action === "delete") {
               url = `${host}/fedit/v1/digital-twins/${dtwId}/digital-objects/${key}`;
            }
            break;
         case "DigitalObjectData":
            if (action === "modify") {
               modifiedObject["digital_object_data_source_type"] = "POLL";
               if (jsonData.metadata?.digitalObjectDataAccessBaseUrl) {
                  modifiedObject["digital_object_data_source_base_url"] =
                     jsonData.metadata.digitalObjectDataAccessBaseUrl;
               }
               modifiedObject["digital_object_data_interval"] =
                  jsonData.metadata?.digitalObjectDataInterval;
               modifiedObject["digital_object_data_source_url"] =
                  jsonData.metadata?.digitalObjectDataAccessUrl;
               modifiedObject["digital_object_data_access_type"] =
                  jsonData.metadata?.digitalObjectDataAccessType;
               modifiedObject["digital_object_control_url"] =
                  jsonData.metadata?.digitalObjectControlUrl;
               modifiedObject["digital_object_control_request_model"] =
                  jsonData.metadata?.digitalObjectControlRequestModel;

               url = `${host}/fedit/v1/digital-twins/${dtwId}/digital-objects/${jsonData.upSetList[0].upSetId}`;
            }
            break;
         case "Simulation":
            if (action === "create") {
               url = `${host}/fedit/light/digital-twins/${dtwId}/simulations`;
               modifiedObject["simulation_identifier"] = key;
            } else if (action === "modify" || action === "delete") {
               url = `${host}/fedit/v1/digital-twins/${dtwId}/simulations/${key}`;
            }
            break;
         case "Service":
            if (action === "create") {
               url = `${host}/fedit/light/digital-twins/${dtwId}/services`;
               modifiedObject["service_identifier"] = key;
            } else if (action === "modify" || action === "delete") {
               url = `${host}/fedit/v1/digital-twins/${dtwId}/services/${key}`;
            }
            break;
         default:
            console.error(`Invalid metaTypeModel ${metaTypeModel}`);
            break;
      }

      const method = {
         create: "POST",
         modify: "PATCH",
         delete: "DELETE",
      }[action];

      if (method && url) {
         //   sendHttpRequest(metaTypeModel, modifiedObject, method, url);
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
            /[A-Z]/g,
            (match) => `_${match.toLowerCase()}`
         );

         // Additional check for keys ending with "URL"
         if (key.endsWith("URL")) {
            newKey = key
               .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
               .replace(/_u_r_l$/, "_url"); // Handles the specific URL ending
         }

         newObj[newKey] = obj[key];
      }
   }
   return newObj;
}

const sendHTTPRequest = async ({ metaTypeModel, data, method, url }) => {
   console.log(`${metaTypeModel} Sending ${method} request to: ${url}`);
   // console.log(data);
   const config = {
      method: method,
      url: url,
      data: data,
   };

   return axios(config);
};

initKafka();

/** 해당리소스들이 들어오면 _match로는 url부분이 적용안되므로 변경 로직 추가
 * serviceAccessURL -> service_access_url
 * simulationAccessURL
 * controlAccessURL
 * visualModelAccessURL
 */
