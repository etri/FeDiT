import { Router } from 'express';
import visitjeju from './routes/visitjeju';
import visitjejuImage from './routes/visitjeju-image';
import visitjejuGpsList from './routes/visitjeju-gps-list';

export default () => {
	const app = Router();

	visitjeju(app);
    visitjejuImage(app);
	visitjejuGpsList(app);

	return app;
}
