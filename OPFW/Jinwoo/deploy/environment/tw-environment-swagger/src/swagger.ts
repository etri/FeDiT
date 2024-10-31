import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import express from 'express';

const PORT = process.env.PORT || 3002;
const app = express();
const swaggerSpec = YAML.load('./dist/swagger.yaml');
// const swaggerSpec = YAML.load(path.join(__dirname, './src/swagger/openapi.yaml'))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => console.log(`server start port ${PORT}`));