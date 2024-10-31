require('dotenv').config({ path: require("path").join(__dirname, `./dist/env/.env.${process.env.NODE_ENV}`)});

module.exports = {
  apps : [{
    name   : `${process.env.APP_NAME}`,
    script : "./dist/src/app.js",
    env: {
      NODE_ENV: "development"
    },
    env_production : {
       NODE_ENV: "production"
    },
    out_file: `${process.env.LOGDIR}/out.log`,
    error_file: `${process.env.LOGDIR}/error.log`,
    log_file: `${process.env.LOGDIR}/combined.log`,
    // out_file: `logs/out.log`,
    // error_file: `logs/error.log`,
    time: false,
    // log_date_format : "YYY-MM-DD HH:mm Z",
    // log_date_format : "",
    log_type: "json"
  }]
}
