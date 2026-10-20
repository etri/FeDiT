var mysql = require('mysql');

const db = mysql.createPool({
    host : process.env.DB_HOST || "172.28.0.4",
    user : process.env.DB_USER || "model_designer",
    password : process.env.DB_PASSWORD || "",
    port : parseInt(process.env.DB_PORT) || 3306,
    database : process.env.DB_NAME || "model_designer",
    connectionLimit : parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    multipleStatements : true,
});

module.exports = db;
