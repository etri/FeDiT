import { Container } from 'typedi';
import { Pool } from 'mysql2/promise';
import LoggerInstance from './logger';
import proj4 from 'proj4';

export default async (mysqlConnectionPool: Pool) => {
    try {
        Container.set('logger', LoggerInstance);
        Container.set('mysqlConnectionPool', mysqlConnectionPool);

        proj4.defs("EPSG:5186","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");
    } catch (e) {
        LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
        throw e;
    }
};