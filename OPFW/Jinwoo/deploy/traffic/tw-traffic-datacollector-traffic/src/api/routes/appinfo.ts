import { Router, Request, Response } from 'express';
const route = Router();

export default (app: Router) => {
  app.use('/appinfo', route);

  route.get('/health', (req: Request, res: Response) => {
    const content = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now()
    };
    res.send(content);
  });

  route.get('/memory', (req: Request, res: Response) => {
    const content = {
      memory: process.memoryUsage().rss
    };
    res.send(content);
  });
};