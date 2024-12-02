import mysql from 'mysql2/promise';
import config from '@/config';

export async function createMysqlConnection() {
    let connection = await mysql.createConnection({
        ...config.databaseSource
    });
    return connection;
}
