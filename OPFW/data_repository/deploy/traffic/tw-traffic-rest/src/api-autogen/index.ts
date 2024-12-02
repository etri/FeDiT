import { Router } from 'express';
import measurePosition from './routes/measure-position';
import measurePositionType from './routes/measure-position-type';
import measurePositionNodelinksWithinRadius from './routes/measure-position-nodelinks-within-radius';
import airportPax from './routes/airport-pax';
import parkingLot from './routes/parking-lot';
import parkingLotStatus from './routes/parking-lot-status';
import roadCondition from './routes/road-condition';
import roadOperationStatus from './routes/road-operation-status';
import traffic from './routes/traffic';
import vvms from './routes/vvms';
import riverWaterLevelDevice from './routes/river-water-level-device';
import riverWaterLevel from './routes/river-water-level';

export default () => {
	const app = Router();

	measurePosition(app);
	measurePositionType(app);
	measurePositionNodelinksWithinRadius(app);
	airportPax(app);
	parkingLot(app);
	parkingLotStatus(app);
	roadCondition(app);
	roadOperationStatus(app);
	traffic(app);
	vvms(app);
	riverWaterLevelDevice(app);
	riverWaterLevel(app);

	return app;
}
