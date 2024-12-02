import mysql from 'mysql2/promise';
import config from '@/config';
import { Logger } from 'winston';
import { Container } from 'typedi';

function parse_condition_operator(key: string, value: any) {
    const Logger: Logger = Container.get('logger');

    if (!has_operator(value)) {
        let argument = value;
        if (typeof value == "string") {
            argument = `'${argument}'`;
        }
        return `${key} = ${argument}`;
    }

    const propertyArray = Object.keys(value);
    const propertyCount = propertyArray.length;
    if (propertyCount < 1) {
        Logger.error("condition operator has no property.");
        return;
    }

    const property = propertyArray[0];
    let argument = value[property];

    // console.log(typeof argument + ":" + argument);

    if (typeof argument == "string") {
        argument = `'${argument}'`;
    }

    switch (property) {
        case '$gt':
            return `${key} > ${argument}`;
        case '$gte':
            return `${key} >= ${argument}`;
        case '$lt':
            return `${key} < ${argument}`;
        case '$lte':
            return `${key} <= ${argument}`;
        case '$eq':
            return `${key} = ${argument}`;
        case '$ne':
            return `${key} = ${argument}`;
        default:
            return `${key} = ${argument}`;
    }
}

function has_operator(value: any) {
    if (typeof value !== 'object') {
        return false;
    }
    if (Array.isArray(value)) {
        return false;
    }
    if (value === null) {
        return false;
    }

    const propertyArray = Object.keys(value);
    const propertyCount = propertyArray.length;
    const key = propertyArray[0];
    return is_condition_operator(key);
}

function is_combination_operator(key: string): boolean {
    let regex = /^\$(and)/;
    return regex.test(key);
}

function is_condition_operator(key: string): boolean {
    let regex = /^\$(gt|gte|lt|lte|eq|ne)/;
    return regex.test(key);
}

function parse_combination_operator_and(array: any) {
    const Logger: Logger = Container.get('logger');

    if (!Array.isArray(array)) {
        Logger.error("and operator must have array argument.");
    }

    let clause = '';

    for (const element of array) {
        const propertyArray = Object.keys(element);
        const propertyCount = propertyArray.length;
        const property = propertyArray[0];
        const value = element[property];

        const current = parse_combination_operator(property, value);
        clause += " (" + current + ") and";

        // console.log(current);
        // console.log(`${propertyCount}, ${property}, ${JSON.stringify(element[property])}`);
    }

    clause = clause.replace(/and$/, '');

    return clause;
}

function parse_combination_operator(key: string, value: any) {
    // console.log(`parse_combination_operator - ${key} : ${JSON.stringify(value)}`)
    if (!is_combination_operator(key)) {
        return parse_condition_operator(key, value);
    }

    switch (key) {
        case '$and':
            // console.log(Array.isArray(value));
            // console.log(value);
            return parse_combination_operator_and(value);
    }
}

export function parse_selector(selectorObj: any) {
    let whereClause = '';

    for (const property in selectorObj) {
        // console.log(`${property} : ${JSON.stringify(selectorObj[property])}`)
        whereClause += " (" + parse_combination_operator(property, selectorObj[property]) + ") and";
        // parse_condition_operator(selectorList, property, selectorObj[property]);
    }


    whereClause = whereClause.replace(/and$/, '');
    // console.log(whereClause);

    return whereClause;
}

export async function execute_query(sql: string, whereClause: string, limitClause:string | null) : Promise<any[]> {
    const Logger: Logger = Container.get('logger');

    let connection = await mysql.createConnection({
        host: config.mariadb.host,
        port: config.mariadb.port,
        user: config.mariadb.user,
        password: config.mariadb.password,
        database: config.mariadb.database
    });

    // let result = undefined;
    // let sql = "select * from measure_position where" + whereClause;
    // let sql = "select * from air_quality where" + whereClause;
    // connection.query(sql, function (error: any, results: any, fields: any) {
    //     if (error) {
    //         console.log(error);
    //     }
    //     console.log(results);
    //     result = results;
    // });
    
    let query = sql;
    if(whereClause){
        query += ` where ${whereClause}`;
    }
    if(limitClause){
        query += ` ${limitClause}`;
    }

    Logger.info(query);

    const [rows] = await connection.query(query);

    connection.end();

    // let values: any = [];
    // values.push('2024-04-18 12:00:00');

    // const sql = "select * from air_quality where date_time > ?;";
    // connection.query(sql, [values], function (error: any, results: any, fields: any) {
    //     if (error) {
    //         console.log(error);
    //     }
    //     console.log(results);
    // });
    return rows as any[];
}
