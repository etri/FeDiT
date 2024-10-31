import express from 'express';
import Logger from './loaders/logger';
import config from './config';
import https from 'https';
import fs from 'node:fs';
import { createMysqlConnectionPool } from './loaders/mysql';
import { Pool } from 'mysql2/promise';


async function gracefulShutdown(server:any, mysqlConnectionPool:Pool) {
    console.log('Starting graceful shutdown');

    // 서버 종료
    server.close(async () => {
        console.log('Express server closed');

        // MySQL 연결 종료
        if (mysqlConnectionPool) {
            try {
                await mysqlConnectionPool.end();
                console.log('MySQL connection pool closed');
            } catch (err) {
                console.error('Error closing MySQL connection pool:', err);
            }
        }

        // 프로세스 종료
        process.exit(0);
    });

    // 일정 시간 후 강제 종료
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000); // 30초 후 강제 종료
}

async function startServer() {
    
    const app = express();

    const mysqlConnectionPool = await createMysqlConnectionPool();

    /**
     * A little hack here
     * Import/Export can only be used in 'top-level code'
     * Well, at least in node 10 without babel and at the time of writing
     * So we are using good old require.
     **/
    await require('./loaders').default({ expressApp: app, mysqlConnectionPool: mysqlConnectionPool });

    const server = app.listen(config.port, () => {
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

    // SIGTERM 시그널 처리
    process.on('SIGTERM', () => gracefulShutdown(server, mysqlConnectionPool) );

    // SIGINT 시그널 처리
    process.on('SIGINT', () => gracefulShutdown(server, mysqlConnectionPool));

    // 예기치 않은 에러 처리
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        () => gracefulShutdown(server, mysqlConnectionPool);
    });

    // 처리되지 않은 Promise 거부 처리
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        () => gracefulShutdown(server, mysqlConnectionPool);
    });
}

startServer();