import { Router } from 'express';
import measurePosition from './routes/measure-position';
import measurePositionType from './routes/measure-position-type';
import visitor from './routes/visitor';

export default () => {
	const app = Router();

	measurePosition(app);
	measurePositionType(app);
	visitor(app);

	return app;
}
