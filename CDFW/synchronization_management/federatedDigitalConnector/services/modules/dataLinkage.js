const Model = require("../../models");
const model = new Model();
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
class DataLinkage {
   /**
    * Generate kafkaKey from data if possible.
    * @param {Object} data - The input data containing twin_id and obj_id.
    * @returns {Object|null} - The kafkaKey object or null.
    * @throws {ErrorHandler} - If the necessary keys are not found in data.
    */
   generateKafkaKey(data) {
      if ("twin_id" in data && "obj_id" in data) {
         return {
            digital_twin_id: data.twin_id,
            digital_object_id: data.obj_id,
         };
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Missing required fields: 'twin_id' and/or 'obj_id'."
         );
      }
   }

   /**
    * Send data to Kafka with the specified topic.
    * @param {String} topic - The Kafka topic.
    * @param {Object} kafkaKey - The key for Kafka message.
    * @param {Object} data - The data to send.
    */
   async sendToKafka(topic, kafkaKey, data) {
      await model.kafka.kafkaProducer({
         topic,
         kafkaKey: JSON.stringify(kafkaKey),
         data: JSON.stringify(data),
      });
   }

   /**
    * Handle data linkage operation for different types.
    * @param {String} type - The type of operation (validation, outlier, error).
    * @param {Object} data - The input data.
    * @returns {String} - The timestamp of the operation.
    * @throws {ErrorHandler} - If the type is not supported.
    */
   async handleOperation(type, data) {
      const rowtime = lib.timestamp();
      const kafkaKey = this.generateKafkaKey(data);

      switch (type) {
         case "validation":
         case "outlier":
         case "error":
            this.sendToKafka(type, kafkaKey, data);
            break;
         default:
            throw new ErrorHandler(
               400,
               400,
               `Unsupported operation type: ${type}`
            );
      }

      return rowtime;
   }

   /**
    * Validation operation
    * @param {Object} data - The input data.
    * @returns {String} - The timestamp of the operation.
    */
   async validation(data) {
      return await this.handleOperation("validation", data);
   }

   /**
    * Outlier operation
    * @param {Object} data - The input data.
    * @returns {String} - The timestamp of the operation.
    */
   async outlier(data) {
      return await this.handleOperation("outlier", data);
   }

   /**
    * Error operation
    * @param {Object} data - The input data.
    * @returns {String} - The timestamp of the operation.
    */
   async error(data) {
      return await this.handleOperation("error", data);
   }
}

module.exports = DataLinkage;
