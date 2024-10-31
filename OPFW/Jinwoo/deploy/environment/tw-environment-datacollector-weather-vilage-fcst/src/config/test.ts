import path from 'node:path';
import fs from 'node:fs';
import config from '@/config';

console.log(path.resolve(__dirname));
console.log(path.resolve());
console.log(config.path.root);

// let schemaPath = path.resolve('@assets/ParkingLotStatus.avsc');
// fs.readFile(schemaPath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//     console.log(data);
//   });