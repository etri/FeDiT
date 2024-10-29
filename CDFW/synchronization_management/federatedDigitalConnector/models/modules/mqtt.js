class Mqtt {
   /*
    * MQTT-Message publish
    */
   messagePublish({ topic, message }) {
      return Mclient.publish(topic, JSON.stringify(message), {
         retain: true,
         qos: 1,
      });
   }
}

module.exports = Mqtt;
