class Coordinate {
    constructor(view, VIZCore) {
        let scope = this;
        this.view = view;
        this.VIZCore = VIZCore;

        this.Base = {
            ratio : {
                latitude : 1,
                longitude : 1,
                x : 1,
                y : 1,
            },
            coordinate : {
                latitude : 1,
                longitude : 1,
                x : 1,
                y : 1,
            }
        }
    }

    // 기준 좌표 설정
    setStandardValue(latitude1, longitude1, x1, y1, latitude2, longitude2, x2, y2)
    {
        let lat = latitude2 - latitude1;
        let lon = longitude2 - longitude1;
        let xlength = x2 - x1;
        let ylength = y2 - y1;
        // 1:x = lat : xlength
        let xr = xlength / lat;
        let yr = ylength / lon;
        // x:1 = lat : xlength
        let latr = lat / xlength;
        let lonr = lon / ylength;

        this.Base.ratio.latitude = xr;
        this.Base.ratio.longitude = yr;
        this.Base.ratio.x = latr;
        this.Base.ratio.y = lonr;
        this.Base.coordinate.latitude = latitude1;
        this.Base.coordinate.longitude = longitude1;
        this.Base.coordinate.x = x1;
        this.Base.coordinate.y = y1;
    }

    toCartesian(latitude, longitude)
    {
        // calc
        let offset_lat = latitude - this.Base.coordinate.latitude;
        let offset_lon = longitude - this.Base.coordinate.longitude;

        let x = offset_lat * this.Base.ratio.latitude;
        let y = offset_lon * this.Base.ratio.longitude;

        let result = {
            x : this.Base.coordinate.x + x,
            y : this.Base.coordinate.y + y,
            z : 0
        }
        return result;
    }

    toLatLon(x, y)
    {
         // calc
         let offset_x = x - this.Base.coordinate.x;
         let offset_y = y - this.Base.coordinate.y;
 
         let lat = offset_x * this.Base.ratio.x;
         let lon = offset_y * this.Base.ratio.y;
 
         let result = {
            latitude : this.Base.coordinate.latitude + lat,
            longitude : this.Base.coordinate.longitude + lon
         }
         return result;
    }
}

export default Coordinate;