import { Router } from 'express';
import dataInterface from './routes/data-interface';
import hello from './routes/hello'

// guaranteed to get dependencies
export default () => {
	const app = Router();

    dataInterface(app);
	hello(app);

	return app
}