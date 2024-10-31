import mysql from 'mysql2/promise';
import config from '@/config';

export async function createMysqlConnectionPool() {
    let pool = await mysql.createPool({
        ...config.databaseSource
    });
    return pool;
}
