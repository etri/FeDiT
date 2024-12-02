import { Router, Request, Response } from 'express'
import axios from 'axios'
import Decimal from 'decimal.js'
import asyncHanlder from 'express-async-handler';
import config from '@/config';

const route = Router();

export default (app: Router) => {
	app.use('/measure-position/nodelinks/within-radius', route);

	route.get('/', asyncHanlder( async (req: Request, res: Response) => {
		let page_number = 1;
		let number_of_rows = 25;
		let andArgument : any = [];
		for (const key in req.query) {
			if (key == 'longitude') {
				let condition: any = {};
				condition['longitude'] = {
					'$eq': req.query[key]
				}
				andArgument.push(condition);
			}
			else if (key == 'latitude') {
				let condition: any = {};
				condition['latitude'] = {
					'$eq': req.query[key]
				}
				andArgument.push(condition);
			}
			else if (key == 'radius') {
				let condition: any = {};
				condition['radius'] = {
					'$eq': req.query[key]
				}
				andArgument.push(condition);
			}
		}
	
		let findData : any = {
			limit: number_of_rows,
			skip: number_of_rows*(page_number-1)
		}
		if(andArgument.length){
			findData['selector'] = {
				'$and': andArgument
			}
		}

		let result = await axios.post(`${config.dataInterfaceIpAddress}/measure_position_nodelinks_within_radius/find`, findData)

		let list = result.data.doc.map( function (element:any) {
			let obj:any = {};
			for(const property in element){
				if(element[property]!=null){
					obj[property] = element[property];
				}
			}
			return obj;
		});

		let responseJson = {
			page_number: page_number,
			number_of_rows: number_of_rows,
			total_count: result.data.count,
			success: true,
			code: 0,
			msg: "성공하였습니다.",
			list: list
		}
		res.json(responseJson);
	}));
}