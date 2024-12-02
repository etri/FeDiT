import 'reflect-metadata'; // We need this in order to use @Decorators

import config from './config';
import express from 'express';
import Logger from './loaders/logger';
import https from 'https';
import fs from 'node:fs';

async function startServer() {
    const app = express();

    /**
     * A little hack here
     * Import/Export can only be used in 'top-level code'
     * Well, at least in node 10 without babel and at the time of writing
     * So we are using good old require.
     **/
    await require('./loaders').default({ expressApp: app });

    app.listen(config.port, () => {
        Logger.info(`
        ################################################
        🛡️  node_env : ${config.node_env} 🛡️
        🛡️  root_dir : ${config.path.root} 🛡️
        🛡️  Server listening on port: ${config.port} 🛡️
        🛡️  log_dir : ${config.logs.dir} 🛡️
        ################################################
      `);
    }).on('error', err => {
        Logger.error(err);
        process.exit(1);
    });


    // const options = {
    //     key: fs.readFileSync("./dist/ssh/server.key.insecure"),
    //     cert: fs.readFileSync("./dist/ssh/server.crt"),
    // };

    // https.createServer(options, app).listen(config.port, () => {
    //     Logger.info(`
    //     ################################################
    //     🛡️  node_env : ${config.node_env} 🛡️
    //     🛡️  root_dir : ${config.path.root} 🛡️
    //     🛡️  Server listening on port: ${config.port} 🛡️
    //     🛡️  log_dir : ${config.logs.dir} 🛡️
    //     ################################################
    //   `);
    // }).on('error', err => {
    //     Logger.error(err);
    //     process.exit(1);
    // });
}

startServer();