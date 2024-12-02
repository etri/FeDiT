import { Router, Request, Response } from 'express'
import axios from 'axios'
import asyncHanlder from 'express-async-handler';
import config from '@/config';
import { Container } from 'typedi';
import { Logger } from 'winston';
import proj4 from 'proj4';
import { Pool, RowDataPacket } from 'mysql2/promise';

const route = Router();

interface NodeLinkId extends RowDataPacket {
	node_link_id: number
}

export default (app: Router) => {
	app.use('/measure-position/nodelinks/within-radius', route);

	route.get('/', asyncHanlder( async (req: Request, res: Response) => {
		const Logger: Logger = Container.get('logger');

		Logger.info("/measure-position/nodelinks/within-radius called.");

		// EPSG:4326 (WGS84) 좌표계 정의
		const wgs84 = 'EPSG:4326';

		// EPSG:5186 (중부원점, 한국 TM 중부 좌표계) 정의
		const epsg5186 = 'EPSG:5186';


		let longitude = null;
		let latitude = null;
		let radius = null;
		let radius_power = null;
		
		let page_number = 1;
		let number_of_rows = 25;
		let andArgument : any = [];
		for (const key in req.query) {
			if (key == 'page_number') {
				let data = req.query[key];
				if(typeof data == "string"){
					page_number = parseInt(data);
				}
			}
			else if (key == 'number_of_rows') {
				let data = req.query[key];
				if(typeof data == "string"){
					number_of_rows = parseInt(data);
				}
			}
			else if (key == 'longitude') {
				let data = req.query[key];
				if(typeof data == "string"){
					longitude = parseFloat(data);
				}
			}
			else if (key == 'latitude') {
				let data = req.query[key];
				if(typeof data == "string"){
					latitude = parseFloat(data);
				}
			}
			else if (key == 'radius') {
				let data = req.query[key];
				if(typeof data == "string"){
					radius = parseFloat(data);
					radius_power = Math.pow(radius, 2);
				}
			}
		}
	
		if(longitude == null || latitude == null || radius == null) {
			let missing:string[] = [];
			if(longitude==null) missing.push("longitude");
			if(latitude==null) missing.push("latitude");
			if(radius==null) missing.push("radius");

			throw {status: 422, message: "parameter missing : " + missing.join(" ")};
		}

		const coordinate = [longitude, latitude];
		const result= proj4(wgs84, epsg5186, coordinate);

		Logger.info("longitude : " + longitude);
		Logger.info("latitude : " + latitude);
		Logger.info("radius : " + radius);
		Logger.info("radius_power : " + radius_power);
		Logger.info("result : " + result);

		const mysqlConnectionPool: Pool = Container.get('mysqlConnectionPool');
		const query = `select DISTINCT  node_link_id from nodelink_point` +
							` where epsg5186_x >= (?)` +
							` and epsg5186_x <= (?)` +
							` and epsg5186_y >= (?)` +
							` and epsg5186_y <= (?)` +
            				` and POWER(?-epsg5186_x,2) + POWER(?-epsg5186_y,2) <= ?`;
		const params = [
			result[0]-radius,
			result[0]+radius,
			result[1]-radius,
			result[1]+radius,
			result[0],result[1],radius_power
		]

		let [rows, fields] = await mysqlConnectionPool.execute<NodeLinkId[]>(query, params);
		const nodeLinkIds = rows.map(row => row.node_link_id);

		res.json( {
			list: nodeLinkIds,
			total_count: nodeLinkIds.length
		})
	}));
}