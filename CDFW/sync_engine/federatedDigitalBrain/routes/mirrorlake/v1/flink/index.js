const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const ErrorHandler = require("../../../../lib/error-handler");
const lib = require("../../../../lib");
const Model = require("../../../../models");
const model = new Model();
global.SESSION_ID = null;
/**
 * Digital Connector 서버가 실행될 때 Flink에 연결하여 받은 session을
 * 이 서버(Digital Brain)로 sessionId를 공유해줌
 */
router.post("/:sessionId", async (req, res) => {
   global.SESSION_ID = req.params.sessionId;
   console.log("sessionID: ", global.SESSION_ID);

   try {
      const getDOlistSQL = `select digital_object_id, member_sensor_ids from digital_objects`;
      const DOidList = await model.postgres.selectDataS({
         sql: getDOlistSQL,
      });

      const result = async (DOidList) => {
         const kafkaPromises = DOidList.map(async (id) => {
            const valueObjectMessage = {
               digital_object_id: id.digital_object_id,
               sensor_id: id.member_sensor_ids,
               rowtime: lib.timestamp(),
            };
            const kafkaKey = { digital_object_id: id.digital_object_id };
            await model.kafka.kafkaProducer({
               topic: "DOcomposition",
               kafkaKey: JSON.stringify(kafkaKey),
               data: JSON.stringify(valueObjectMessage),
            });
         });
         await Promise.all(kafkaPromises);
      };

      if (DOidList.length > 0) {
         await result(DOidList);
      }

      res.success();
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, "POST /mirrorlake/v1/flink");
   }
});

module.exports = router;
