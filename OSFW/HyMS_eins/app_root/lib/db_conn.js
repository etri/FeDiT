//import React, { Component } from 'react';

var mysql = require('mysql');
//const logger = require('./logger')

const db = mysql.createPool({
    host : "172.28.0.4",
    user : "model_designer", //mysql의 id
    password : "mdesigner!@#", //mysql의 password
    port : 3306,
    database : "model_designer", //사용할 데이터베이스
    connectionLimit : 4,
    multipleStatements : true,
});

module.exports = db;
