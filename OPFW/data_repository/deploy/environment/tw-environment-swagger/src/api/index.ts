import { Router } from 'express';
import swagger from './routes/swagger';

// guaranteed to get dependencies
export default () => {
	const app = Router();
    swagger(app);

	return app
}