import { Router, Request, Response } from 'express'
import axios from 'axios'
import asyncHanlder from 'express-async-handler';
import config from '@/config';
import { Container } from 'typedi';
import { Logger } from 'winston';
import { Pool, RowDataPacket } from 'mysql2/promise';

const route = Router();

interface ResultItem extends RowDataPacket {
	measure_position_id: number,
    latitude: string,
    longitude: string,
}

export default (app: Router) => {
	app.use('/visitjeju/gps-list', route);

	route.post('/', asyncHanlder( async (req: Request, res: Response) => {
        const Logger: Logger = Container.get('logger');

        const measure_position_id_list = req.body.measure_position_id_list;

        if(measure_position_id_list == null) {
			throw {status: 422, message: "parameter missing : measure_position_id_list"};
		}

        const placeholders = measure_position_id_list.map(() => '?').join(', ');
        const query = `SELECT measure_position_id, latitude, longitude ` +
                                `FROM visitjeju ` +
                                `WHERE measure_position_id IN (${placeholders})`;

        const mysqlConnectionPool: Pool = Container.get('mysqlConnectionPool');

        let [rows, fields] = await mysqlConnectionPool.execute<ResultItem[]>(query, measure_position_id_list);

		res.json( rows );
	}));
}