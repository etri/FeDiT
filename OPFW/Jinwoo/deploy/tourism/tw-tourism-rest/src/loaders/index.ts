import { Application } from 'express';
import Logger from './logger';
import expressLoader from './express';
import { Pool } from 'mysql2/promise';
import dependencyInjectorLoader from './dependencyInjector';

export default async ({ expressApp, mysqlConnectionPool }: { expressApp: Application, mysqlConnectionPool:Pool }) => {
    await dependencyInjectorLoader(mysqlConnectionPool);
    Logger.info('✌️ Dependency Injector loaded');

    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');
}