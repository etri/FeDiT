import { Container } from 'typedi';
import { Pool } from 'mysql2/promise';
import LoggerInstance from './logger';

export default async (mysqlConnectionPool: Pool) => {
    try {
        Container.set('logger', LoggerInstance);
        Container.set('mysqlConnectionPool', mysqlConnectionPool);
    } catch (e) {
        LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
        throw e;
    }
};