import mysql, { Connection } from 'mysql2/promise';
import LoggerInstance from './loaders/logger';

function getDateString(date: Date) {
    return date.toLocaleString('en-GB').replace(/(\d+)\/(\d+)\/(\d+)(,)/, '$3-$2-$1');
}

const main = async () => {
    let connection;

    connection = await mysql.createConnection({
        host: '116.123.96.153',
        port: 33306,
        user: 'etri',
        password: 'etri12#',
        database: 'twin',
    });

    try {
        await connection.connect();

        let date = new Date(Date.now());
        let date_5 = new Date(date.getTime() - 5 * 60 * 1000);

        const sql_query = 'select * from measurement where ? <= `measurement_date` and `measurement_date` <= ?;'
        let values: any[] = [`${getDateString(date_5)}`, `${getDateString(date)}`];

        const [results] = await connection.execute(sql_query, values);

        if (Array.isArray(results)) {
            results.forEach(element => {
                let data = element as any;
                data.measurement_date = new Date(data.measurement_date);

                LoggerInstance.info(JSON.stringify(data));
            });
        }else{
            throw new Error("result is not array.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }


    LoggerInstance.info("===============================================================");

    try {
        await connection.connect();

        let date = new Date(Date.now());
        let date_5 = new Date(date.getTime() - 5 * 60 * 1000);

        const sql_query = 'select * from measurement where ? <= `measurement_date` and `measurement_date` <= ?;'
        let values: any[] = [`${getDateString(date_5)}`, `${getDateString(date)}`];

        const [results] = await connection.execute(sql_query, values);

        if (Array.isArray(results)) {
            results.forEach(element => {
                let data = element as any;
                data.measurement_date = new Date(data.measurement_date);

                LoggerInstance.info(JSON.stringify(data));
            });
        }else{
            throw new Error("result is not array.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

main();