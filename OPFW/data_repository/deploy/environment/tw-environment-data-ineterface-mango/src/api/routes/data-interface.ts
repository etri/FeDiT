import { Router } from 'express';
import asyncHanlder from 'express-async-handler';
import { execute_query, parse_selector } from '@/utils/data-interface';
import { Logger } from 'winston';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/data-interface',route);

  route.post('/:db/find', asyncHanlder(async (req, res) => {
    const Logger: Logger = Container.get('logger');

    let whereClause = '';
        let limit = 25;
        let skip = 0;
        for (const property in req.body) {
            if (property == 'selector') {
                whereClause = parse_selector(req.body[property]);
            } else if (property == 'limit') {
                let data = req.body[property];
                if(typeof data == "string"){
                    limit = parseInt(data);
                }else{
                    limit = data;
                }
                // Logger.info("--limit:" + limit);
            } else if (property == 'skip') {
                let data = req.body[property];
                if(typeof data == "string"){
                    skip = parseInt(data);
                }else{
                    skip = data;
                }
                // console.log("--skip:" + skip);
            }
        }

        // Logger.info(whereClause + ` limit ${skip}, ${limit}`);
        // return res.send(whereClause + ` limit ${skip}, ${limit}`);
        
        let sql = `select * from ${req.params.db}`;
        let list = await execute_query(sql, whereClause, `limit ${skip}, ${limit}`);

        sql = `select count(*) as count from ${req.params.db}`;
        let rows = await execute_query(sql, whereClause, null);
        let result = {
            doc: list,
            count: rows[0].count
        }
        res.json(result);
  }));
};