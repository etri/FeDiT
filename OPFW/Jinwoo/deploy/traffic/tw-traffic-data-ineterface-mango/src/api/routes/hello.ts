import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/hello', route);

  route.get('/hi', (req: Request, res: Response) => {
    const Logger: Logger = Container.get('logger');

    Logger.info("~~~hello~~~");
    return res.send("hello");
  });
};