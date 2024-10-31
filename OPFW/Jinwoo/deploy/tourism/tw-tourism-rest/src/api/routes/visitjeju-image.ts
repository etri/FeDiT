import { Router, Request, Response } from 'express';
import axios from 'axios';
import asyncHanlder from 'express-async-handler';
import Logger from '../../loaders/logger';
import config from '@/config';
import fs from 'node:fs';

const route = Router();

export default (app: Router) => {
    app.use('/visitjeju-image', route);

    route.get('/', asyncHanlder(async (req: Request, res: Response) => {
        let page_number = 1;
        let number_of_rows = 25;
        let andArgument: any = [];
        for (const key in req.query) {
            if (key == 'id') {
                let condition: any = {};
                condition['id'] = {
                    '$eq': req.query[key]
                }
                andArgument.push(condition);
            }
            else if (key == 'label') {
                let condition: any = {};
                condition['label'] = {
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

        let result = await axios.post(`${config.dataInterfaceIpAddress}/visitjeju_image/find`, findData);

        let list = result.data.doc.map(function (element: any) {
            let obj: any = {};
            for (const property in element) {
                if (element[property] != null) {
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

    route.get('/data', asyncHanlder(async (req: Request, res: Response) => {
        let page_number = 1;
        let number_of_rows = 25;
        let andArgument: any = [];

        if (!req.query.hasOwnProperty('id')) {
            res.status(500).send("error");
            return;
        }

        {
            let condition: any = {};
            condition['id'] = {
                '$eq': req.query['id']
            }
            andArgument.push(condition);
        }

        let findData: any = {
        };

        if (andArgument.length) {
            findData['selector'] = {
                '$and': andArgument
            }
        }

        let result = await axios.post(`${config.dataInterfaceIpAddress}/visitjeju_image/find`, findData);


        if(result?.data?.doc?.length != 1) {
            res.status(500).send("error. data length is not 1.");
            return;
        }

        
        let fileItemId = result.data.doc[0].file_item_id;
        
        {
            andArgument = [];
            let condition: any = {};
            condition['id'] = {
                '$eq': fileItemId
            }
            andArgument.push(condition);

            findData = {};
            findData['selector'] = {
                '$and': andArgument
            }
        }

        result = await axios.post(`${config.dataInterfaceIpAddress}/file_item/find`, findData);

        const fileInfo = result.data.doc[0];

        // const savePath = 'D:/work/data/local_db/twin/poc1/db-files/visitjeju-image';
        const imageFilePath = `${fileInfo.save_path}/${fileInfo.save_file_name}`;
        const imageContents = fs.readFileSync(imageFilePath);

        const fileName = `${fileInfo.orig_file_name}.${fileInfo.file_ext}`;

        res.status(200);
        res.header('Content-Disposition', "attachment; filename=" + fileName);
        res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');
        res.header('Content-Type', 'application/octet-stream');
        res.send(imageContents);
    }));
};