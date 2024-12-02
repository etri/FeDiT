import { Router, Request, Response } from 'express';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import asyncHanlder from 'express-async-handler';

const route = Router();

export default (app: Router) => {
  const swaggerSpec = YAML.load('./dist/swagger.yaml');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/swagger', asyncHanlder( async (req: Request, res: Response) => {
    res.json(swaggerSpec);
  }));
};