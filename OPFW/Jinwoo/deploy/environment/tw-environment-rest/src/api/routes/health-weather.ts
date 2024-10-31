import { Router, Request, Response } from 'express'
import axios from 'axios'
import asyncHanlder from 'express-async-handler';
import config from '@/config';

const route = Router();

export default (app: Router) => {
	app.use('/health-weather', route);

	route.get('/', asyncHanlder( async (req: Request, res: Response) => {
		let page_number = 1;
		let number_of_rows = 25;
		let andArgument : any = [];
		for (const key in req.query) {
			if (key == 'start_date_time') {
				let condition: any = {};
				condition['date_time'] = {
					'$gte': req.query[key]
				}
				andArgument.push(condition);
			}
			else if (key == 'end_date_time') {
				let condition: any = {};
				condition['date_time'] = {
					'$lte': req.query[key]
				}
				andArgument.push(condition);
			}
			else if (key == 'measure_position_id') {
				let condition: any = {};
				condition['measure_position_id'] = {
					'$eq': req.query[key]
				}
				andArgument.push(condition);
			}
			else if (key == 'page_number') {
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

		let result = await axios.post(`${config.dataInterfaceIpAddress}/health_weather_index/find`, findData)

		let list = result.data.doc.map( function (element:any) {
			let obj:any = {};
			for(const property in element){
				if(property=='date_time'){
					obj[property] = new Date(element[property]).toLocaleString('sv');
				}
				else if(element[property]!=null){
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