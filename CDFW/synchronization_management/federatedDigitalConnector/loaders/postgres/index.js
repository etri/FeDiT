const config = require("../../config");
const pgPoolConfig = config.postgresPool;
const pg = require("pg");
pg.types.setTypeParser(1114, (str) => str);

exports.init = () => {
   global.pool = new pg.Pool(pgPoolConfig);
};
