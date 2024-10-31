import { Router } from 'express';
import swagger from './routes/swagger';
import hello from './routes/hello'

// guaranteed to get dependencies
export default () => {
	const app = Router();

	hello(app);
    swagger(app);

	return app
}