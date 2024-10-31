import { Router, Request, Response } from 'express';
import axios from 'axios';
import asyncHanlder from 'express-async-handler';
import Logger from '../../loaders/logger';

const route = Router();

export default (app: Router) => {
  app.use('/hello', route);

  route.get('/hi', asyncHanlder( async (req: Request, res: Response) => {
    Logger.info('hello is called.');
    let result = await axios.get(`http://tw-tourism-rest:8080/v1/hello/hi`);
    res.send(result.data);
  }));

  route.get('/hi2', asyncHanlder( async (req: Request, res: Response) => {
    let result = await axios.get(`http://tw-tourism-rest:8080/v1/measure-position/type?page_number=1&number_of_rows=10`,{
      headers: {
          Authorization: `accept: application/json`
      }
  });
    res.send(result.data);
  }));
};