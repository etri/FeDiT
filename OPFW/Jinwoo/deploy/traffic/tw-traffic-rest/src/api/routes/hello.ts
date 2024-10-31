import { Router, Request, Response } from 'express';
import { Logger } from 'winston';

const route = Router();

export default (app: Router) => {
  app.use('/hello', route);

  route.get('/hi', (req: Request, res: Response) => {
    return res.send("hello2");
  });
};