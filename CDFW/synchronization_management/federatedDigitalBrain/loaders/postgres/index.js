const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const pgPoolConfig = config.postgresPool;

const pg = require("pg");
pg.types.setTypeParser(1114, (str) => str);

exports.init = async () => {
   try {
      global.pool = new pg.Pool(pgPoolConfig);

      const windowArr = config.setWindowDOtable.term.filter(
         (term) => term !== 0
      );
      const windowTableNames = windowArr.map(
         (term) => `federated_digital_object_window_data_${term}`
      );

      const existences = await model.postgres.TableExistCheck({
         connectors: windowTableNames,
      });

      const tablesToCreate = windowArr.filter(
         (term, index) => !existences[index]
      );
      if (tablesToCreate.length > 0) {
         const createTableQueries = tablesToCreate
            .map(
               (term) => `
            CREATE TABLE federated_digital_object_window_data_${term} (
               federated_digital_twin_id text,
               federated_digital_object_id text,
               rowtime timestamp with time zone,
               location text,
               data jsonb
            );
            CREATE INDEX index_federated_digital_objectswindow_data_${term}
            ON federated_digital_object_window_data_${term}
            USING btree (federated_digital_twin_id, federated_digital_object_id, rowtime);
         `
            )
            .join("");

         await model.postgres.sendQuery({ sql: createTableQueries });
      }
   } catch (error) {
      console.error("Error during initialization:", error);
   }
};
