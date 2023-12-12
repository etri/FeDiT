const mqtt = require("mqtt");
const config = require("../../config");

const { ip, port } = config.mqtt;

exports.init = () => {
   global.Mclient = mqtt.connect(`mqtt://${ip}:${port}`);

   Mclient.on("connect", () => {
      logger.info("MQTT connected");
   });

   Mclient.on("error", (error) => {
      logger.info("MQTT disconnect" + error);
      process.exit(1);
   });
};
