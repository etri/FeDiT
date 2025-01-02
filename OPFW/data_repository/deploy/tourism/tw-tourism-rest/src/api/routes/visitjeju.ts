import { Router, Request, Response } from 'express';
import axios from 'axios';
import asyncHanlder from 'express-async-handler';
import Logger from '../../loaders/logger';
import config from '@/config';
import fs from 'node:fs';

const route = Router();

export default (app: Router) => {
    app.use('/visitjeju', route);

    route.get('/', asyncHanlder(async (req: Request, res: Response) => {
        let page_number = 1;
        let number_of_rows = 25;
        let andArgument: any = [];
        for (const key in req.query) {
            if (key == 'measure_position_id') {
                let condition: any = {};
                condition['measure_position_id'] = {
                    '$eq': req.query[key]
                }
                andArgument.push(condition);
            }
            else if (key == 'title') {
                let condition: any = {};
                condition['title'] = {
                    '$regex': req.query[key]
                }
                andArgument.push(condition);
            }
            else if (key == 'page_number') {
                let data = req.query[key];
                if (typeof data == "string") {
                    page_number = parseInt(data);
                }
            }
            else if (key == 'number_of_rows') {
                let data = req.query[key];
                if (typeof data == "string") {
                    number_of_rows = parseInt(data);
                }
            }
        }

        let findData: any = {
            limit: number_of_rows,
            skip: number_of_rows * (page_number - 1)
        }
        if (andArgument.length) {
            findData['selector'] = {
                '$and': andArgument
            }
        }

        let result = await axios.post(`${config.dataInterfaceIpAddress}/visitjeju/find`, findData);
        let visitjejuCount = result.data.count;

        let list = await Promise.all(result.data.doc.map(async (element: any) => {
            let obj: any = {};
            for (const property in element) {
                if (element[property] != null) {
                    obj[property] = element[property];
                }
            }

            let andArgumentInner: any = [];
            {
                const contentsid = element.contentsid;
                let condition: any = {};
                condition['visitjeju_id'] = {
                    '$eq': contentsid
                }
                andArgumentInner.push(condition);
            }
            let resultNearBusStop = await axios.post(`${config.dataInterfaceIpAddress}/near_bus_stop/find`, { selector: { '$and': andArgumentInner } });
            let listNearBusStop = await Promise.all(resultNearBusStop.data.doc.map(async (elementNearBusStop: any) => {
                let objNearBusStop: any = {};

                if (elementNearBusStop.hasOwnProperty('walk_time')) {
                    objNearBusStop.walk_time = elementNearBusStop.walk_time;
                }

                let andArgumentBusStop: any = [];
                {
                    const bus_stop_id = elementNearBusStop.bus_stop_id;
                    let condition: any = {};
                    condition['id'] = {
                        '$eq': bus_stop_id
                    }
                    andArgumentBusStop.push(condition);
                }
                let resultBusStop = await axios.post(`${config.dataInterfaceIpAddress}/bus_stop/find`, { selector: { '$and': andArgumentBusStop } });
                const busStop = resultBusStop.data.doc[0];

                objNearBusStop.name = busStop.name;
                objNearBusStop.direction = busStop.direction;
                objNearBusStop.bus_number = busStop.bus_number;

                return objNearBusStop;
            }));

            obj.near_bus_stop_list = listNearBusStop;


            let listImage = [element.image1_id, element.image2_id, element.image3_id, element.image4_id, element.image5_id].filter(function (elementImageId) {
                if (!elementImageId)
                    return false;
                return true;
            });

            let listImageData = await Promise.all(listImage.map(async (elementImageId: any) => {
                let objImage: any = {};
                let andArgumentImage: any = [];
                {
                    let condition: any = {};
                    condition['id'] = {
                        '$eq': elementImageId
                    }
                    andArgumentImage.push(condition);
                }
                const resultVisitjejuImage = await axios.post(`${config.dataInterfaceIpAddress}/visitjeju_image/find`, { selector: { '$and': andArgumentImage } });

                const visitjejuImage = resultVisitjejuImage.data.doc[0];
                const fileItemId = visitjejuImage.file_item_id;

                let andArgumentFile: any = [];
                {
                    andArgument = [];
                    let condition: any = {};
                    condition['id'] = {
                        '$eq': fileItemId
                    }
                    andArgumentFile.push(condition);
                }

                const resultFileItem = await axios.post(`${config.dataInterfaceIpAddress}/file_item/find`, { selector: { '$and': andArgumentFile } });
                const fileInfo = resultFileItem.data.doc[0];

                objImage.url = `http://${config.imageAPI.ipAddress}:${config.imageAPI.port}/${config.imageAPI.servicdId}/v1/visitjeju-image/data?id=${elementImageId}`;
                objImage.license = visitjejuImage.license;
                objImage.copyright_holder = visitjejuImage.copyright_holder;

                // const savePath = 'D:/work/data/local_db/twin/poc1/db-files/visitjeju-image';
                const imageFilePath = `${fileInfo.save_path}/${fileInfo.save_file_name}`;
                const imageContents = fs.readFileSync(imageFilePath);

                const base64data = Buffer.from(imageContents).toString('base64');
                objImage.base64 = base64data;

                return objImage;
            }));

            obj.image_list = listImageData;

            return obj;
        }));

        let responseJson = {
            page_number: page_number,
            number_of_rows: number_of_rows,
            total_count: visitjejuCount,
            success: true,
            code: 0,
            msg: "성공하였습니다.",
            list: list
        }
        res.json(responseJson);
    }));
};