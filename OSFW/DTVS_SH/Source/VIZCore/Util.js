/**
 * @author ssjo@softhills.net
 */

class Util {
    constructor(view, VIZCore) {
        let scope = this;


        this.GetViewIDName = function (currentName) {
            return "#" + view.Container.id + currentName;
        };

        this.GetClassIDName = function (currentName) {
            return view.Container.id + currentName;
        };

        
        /**
         * Data Type 에 따른 비교
         * 
         * @param {DataType} sourceKey : Number, string, 비교 .. 
         * @param {DataType} targetKey : Number, string, 비교 ..
         * @returns {Boolean} 
         */
         this.EqualDataTypeValue = function (sourceKey, targetKey) {
            if(typeof sourceKey !== typeof targetKey) return false;

            if(typeof sourceKey === "string") {
                if(sourceKey.localeCompare(targetKey) !== 0) return false;
            }
            else {
                if(sourceKey !== targetKey) return false;
            }
            return true;
        };

        /**
         * Action 정보 비교
         * @param {Data.ActionItem} source 
         * @param {Data.ActionItem} target 
         * @returns 
         */
        this.EqualAction = function (source, target) {
            
            return view.Data.ShapeAction.EqualAction(source, target);
        };

        ///**
        // * Copy Action
        // * @param {Data.ActionItem} source
        // * @param {Data.ActionItem} target
        // */
        this.CopyAction = function (source, target) {
            return view.Data.ShapeAction.CopyAction(source, target);
        };


        /**
         * 웹 색상정보 Color 반환
         * @param {string} hex 웹 색상정보 (#FFFFFF)
         * @returns {VIZCore.Color}
         */
        this.GetColorByHex = function (hex) {
            if(hex === undefined) return undefined;

            let color = new VIZCore.Color();
            if(typeof(hex) === 'object')
            {
                color.a = hex.a;
                color.r = hex.r;
                color.g = hex.g;
                color.b = hex.b;
            }
            else{
                if (hex.slice(0, 1).localeCompare("#") !== 0) return undefined;

                
    
                if (hex.length < 8) {
                    //RGB
                    //#FFFFFF
                    color.r = parseInt(hex.slice(1, 3), 16);
                    color.g = parseInt(hex.slice(3, 5), 16);
                    color.b = parseInt(hex.slice(5, 7), 16);
                }
                else {
                    //ARGB
                    //#80FFFFFF
                    color.a = parseInt(hex.slice(1, 3), 16);
                    color.r = parseInt(hex.slice(3, 5), 16);
                    color.g = parseInt(hex.slice(5, 7), 16);
                    color.b = parseInt(hex.slice(7, 9), 16);
                }
            }
            
            
            return color;
        };

        
        
        

        /**
         * Line 2 Circle3D 충돌확인 (교차)
         * @param {VIZCore.Vector3} r1p0 line vector1
         * @param {VIZCore.Vector3} r1p1 line vector2
         * @param {VIZCore.Vector3} position Circle Center Position
         * @param {VIZCore.Vector3} normal Circle Normal
         * @param {Number} radius Circle radius
         * @returns {Array<Number, VIZCore.Vector3>} : [result, ept1]
         * result: 충돌여부 (-1 = 실패, 0 = 교차하지않음, 1 = 교차
         * ept1 : 충돌좌표
         */
        this.LineToCircleIntersections = function (r1p0, r1p1, position, normal, radius) {
            // 좌표축 구한다
            let vZAxis = new VIZCore.Vector3().copy(normal);
            vZAxis.normalize();
            let vXAxis = new VIZCore.Vector3(1.0, 0.0, 0.0);
            if (vXAxis.dot(vZAxis) > 0.99 || vXAxis.dot(vZAxis) < -0.99) {
                vXAxis = new VIZCore.Vector3(0.0, 1.0, 0.0);
            }

            let vYAxis = new VIZCore.Vector3().crossVectors(vZAxis, vXAxis);
            vXAxis = new VIZCore.Vector3().crossVectors(vYAxis, vZAxis);

            vXAxis.normalize();
            vYAxis.normalize();
            vZAxis.normalize();

            let roundNum = 10;
            let vPos = []; //VIZCore.Vector3

            for (let i = 0; i < roundNum + 1; i++) {
                let fAngle = Math.PI * 2.0 / roundNum * i;

                let vCurrent1 = new VIZCore.Vector3().copy(vXAxis).multiplyScalar(Math.cos(fAngle));
                let vCurrent1_Scalar = new VIZCore.Vector3().copy(vCurrent1).multiplyScalar(radius);

                let vCurrent2 = new VIZCore.Vector3().copy(vYAxis).multiplyScalar(Math.sin(fAngle));
                let vCurrent2_Scalar = new VIZCore.Vector3().copy(vCurrent2).multiplyScalar(radius);

                let vCurrent = new VIZCore.Vector3().addVectors(position, new VIZCore.Vector3().addVectors(vCurrent1_Scalar, vCurrent2_Scalar));
                vPos.push(vCurrent);
            }

            //Last
            {
                let fAngle = Math.PI * 2.0 / roundNum;

                let vCurrent1 = new VIZCore.Vector3().copy(vXAxis).multiplyScalar(Math.cos(fAngle));
                let vCurrent1_Scalar = new VIZCore.Vector3().copy(vCurrent1).multiplyScalar(radius);

                let vCurrent2 = new VIZCore.Vector3().copy(vYAxis).multiplyScalar(Math.sin(fAngle));
                let vCurrent2_Scalar = new VIZCore.Vector3().copy(vCurrent2).multiplyScalar(radius);

                let vCurrent = new VIZCore.Vector3().addVectors(position, new VIZCore.Vector3().addVectors(vCurrent1_Scalar, vCurrent2_Scalar));
                vPos.push(vCurrent);
            }

            //TRIANGLE_STRIP
            for(let i = 1 ; i < vPos.length; i++) {
                let s1p0 = vPos[i - 1];
                let s1p1 = vPos[i];
                let s1p2 = position;

                let result = scope.LineToTriangleIntersections(r1p0, r1p1, s1p0, s1p1, s1p2);
                if(result[0] !== 1) continue;

                return result;
            }

            return [0, undefined]; // => no intersect
        };



        /**
        * Line 2 Triangle 충돌확인 (교차)
        * @param {VIZCore.Vector3} r1p0: line vector1
        * @param {VIZCore.Vector3} r1p1: line vector2
        * @param {VIZCore.Vector3} s1p0: triangle vector1
        * @param {VIZCore.Vector3} s1p1: triangle vector2
        * @param {VIZCore.Vector3} s1p2: triangle vector3
        * @returns {Array<Number, VIZCore.Vector3>} : [result, ept1]
        * result: 충돌여부 (-1 = 실패, 0 = 교차하지않음, 1 = 교차
        * ept1 : 충돌좌표
        */
        this.LineToTriangleIntersections = function (r1p0, r1p1, s1p0, s1p1, s1p2) {

            let u = new VIZCore.Vector3().subVectors(s1p1, s1p0);
            let v = new VIZCore.Vector3().subVectors(s1p2, s1p0);
            let n = new VIZCore.Vector3().crossVectors(u, v);

            if (n.x === 0 && n.y === 0 && n.z === 0) // triangle is degenerate
                return [-1, undefined]; // do not deal with this case

            let dir = new VIZCore.Vector3().subVectors(r1p1, r1p0);
            let w0 = new VIZCore.Vector3().subVectors(r1p0, s1p0);

            let a = -n.dot(w0);
            let b = n.dot(dir);
            if (Math.abs(b) < 2.2250738585072014e-308) // ray is  parallel to triangle plane
            {
                if (a === 0)
                    return [2, undefined]; //ray lies in triangle plane
                else
                    return [0, undefined]; // ray disjoint from plane
            }

            let r = a / b;
            if (r < 0.0) // ray goes away from triangle
                return [0, undefined]; // => no intersect


            // for a segment, also test if (r > 1.0) => no intersect
            let segment = new VIZCore.Vector3().addVectors(r1p0, new VIZCore.Vector3().copy(dir).multiplyScalar(r));

            // s1p0 s1p1
            let nu = new VIZCore.Vector3().crossVectors(n, u);
            let d1 = -nu.dot(s1p0);
            if (nu.dot(segment) + d1 <= 0)
                return [0, segment];

            // s1p1 s1p2
            let w = new VIZCore.Vector3().subVectors(s1p2, s1p1);
            let nw = new VIZCore.Vector3().crossVectors(n, w);
            let d2 = -nw.dot(s1p1);
            if (nw.dot(segment) + d2 <= 0)
                return [0, segment];

            // s1p2 s1p0
            let nv = new VIZCore.Vector3().crossVectors(n, new VIZCore.Vector3().copy(v).multiplyScalar(-1.0));
            let d3 = -nv.dot(s1p2);
            if (nv.dot(segment) + d3 <= 0)
                return [0, segment];

            return [1, segment]; // I is in T
        };

        ///**
        //* Point 2 Line Distance
        //* @param {VIZCore.Vector3} point: point
        //* @param {VIZCore.Vector3} v1: Line start
        //* @param {VIZCore.Vector3} v2: Line end
        //* @param {VIZCore.Vector3} minPt: [out] 라인에 가까운 점
        //* @returns {Number} min Distance
        //*/
        this.Point2LineDistance = function (point, v1, v2, minPt) {

            let v = new VIZCore.Vector3().subVectors(v2, v1);
            let w = new VIZCore.Vector3().subVectors(point, v1);

            let c1 = w.dot(v);
            if (c1 <= 0) {
                let dP = w; //new VIZCore.Vector3().subVectors(p, v1);
                if (minPt !== undefined)
                    minPt.copy(v1);

                return dP.length();
            }

            let c2 = v.dot(v);
            if (c2 <= c1) {
                let dP = new VIZCore.Vector3().subVectors(point, v2);
                if (minPt !== undefined)
                    minPt.copy(v2);

                return dP.length();
            }

            let b = c1 / c2;
            //Point3   dP = s1p0 + b * v;
            let dP = new VIZCore.Vector3().addVectors(v1, new VIZCore.Vector3().copy(v).multiplyScalar(b));

            if (minPt !== undefined)
                minPt.copy(dP);

            return new VIZCore.Vector3().subVectors(point, dP).length();
        };

        ///**
        //* Line 2 Line Distance
        //* @param {VIZCore.Vector3} r1p0: Line0 start
        //* @param {VIZCore.Vector3} r1p1: Line0 end
        //* @param {VIZCore.Vector3} s1p0: Line0 start
        //* @param {VIZCore.Vector3} s1p1: Line0 end
        //* @param {VIZCore.Vector3} minPtA: [out] 라인에 가까운 점
        //* @param {VIZCore.Vector3} minPtB: [out] 라인에 가까운 점
        //* @returns {Number} min Distance
        //*/
        this.Line2LineDistance = function (s1p0, s1p1, s2p0, s2p1, minPtA, minPtB) {

            let u = new VIZCore.Vector3().subVectors(s1p1, s1p0);
            let v = new VIZCore.Vector3().subVectors(s2p1, s2p0);
            let w = new VIZCore.Vector3().subVectors(s1p0, s2p0);

            let a = u.dot(u); // always >= 0
            let b = u.dot(v);
            let c = v.dot(v); // always >= 0
            let d = u.dot(w);
            let e = v.dot(w);
            let D = a * c - b * b; // always >= 0
            let sc, sN, sD = D; // sc = sN / sD, default sD = D >= 0
            let tc, tN, tD = D; // tc = tN / tD, default tD = D >= 0

            let valueMin = -3.40282347E+38; // Float Min

            if (D < valueMin || D === 0) {
                sN = 0.0;
                sD = 1.0;
                tN = e;
                tD = c;
            }
            else {
                sN = (b * e - c * d);
                tN = (a * e - b * d);

                if (sN < 0.0) { // sc < 0 => the s=0 edge is visible
                    sN = 0.0;
                    tN = e;
                    tD = c;
                }
                else if (sN > sD) { // sc > 1  => the s=1 edge is visible
                    sN = sD;
                    tN = e + b;
                    tD = c;
                }
            }


            if (tN < 0.0) { // tc < 0 => the t=0 edge is visible
                tN = 0.0;
                // recompute sc for this edge
                if (-d < 0.0)
                    sN = 0.0;
                else if (-d > a)
                    sN = sD;
                else {
                    sN = -d;
                    sD = a;
                }
            }
            else if (tN > tD) { // tc > 1  => the t=1 edge is visible
                tN = tD;
                // recompute sc for this edge
                if ((-d + b) < 0.0)
                    sN = 0;
                else if ((-d + b) > a)
                    sN = sD;
                else {
                    sN = (-d + b);
                    sD = a;
                }
            }
            // finally do the division to get sc and tc
            sc = (Math.abs(sN) < valueMin ? 0.0 : sN / sD);
            tc = (Math.abs(tN) < valueMin ? 0.0 : tN / tD);

            // get the difference of the two closest points
            //let dP = w + (sc * u) - (tc * v);  // =  S1(sc) - S2(tc)
            let dP = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(w),
                new VIZCore.Vector3().subVectors(
                    new VIZCore.Vector3().copy(u).multiplyScalar(sc),
                    new VIZCore.Vector3().copy(v).multiplyScalar(tc)
                ));

            if (minPtA !== undefined) {
                let pt = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(s1p0),
                    new VIZCore.Vector3().copy(u).multiplyScalar(sc)
                );

                minPtA.copy(pt);
            }

            if (minPtB !== undefined) {
                let pt = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(s2p0),
                    new VIZCore.Vector3().copy(v).multiplyScalar(tc)
                );

                minPtB.copy(pt);
            }

            return dP.length();
        };

        /**
         * Line 2 Line Cross
         * @param {VIZCore.Vector3} s1p0 : Line0 start
         * @param {VIZCore.Vector3} s1p1 : Line0 end
         * @param {VIZCore.Vector3} s2p0 : Line0 start
         * @param {VIZCore.Vector3} s2p1 : Line0 end
         * @param {VIZCore.Vector3} crossPt  [out] Cross Point
         * @param {Number} tol : 오차
         * @returns {boolean} 
         */
        this.Line2LineCrossPosition = function (s1p0, s1p1, s2p0, s2p1, crossPt, tol) {

            let vDir1 = new VIZCore.Vector3().subVectors(s1p1, s1p0);
            let vDir2 = new VIZCore.Vector3().subVectors(s2p1, s2p0);
            vDir1.normalize();
            vDir2.normalize();
            
            let vRet = new VIZCore.Vector3();
        
            // 한 평면안에 없으면 스킵
            let error = tol;
            if(error === undefined)
                error = 0.0001;

            let planeBase = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vDir1, s1p0);
            let vBasePos1 = planeBase.projectPoint(s2p0);
            let vBasePos2 = planeBase.projectPoint(s2p1);
        
            if( new VIZCore.Vector3().subVectors(vBasePos1, vBasePos2).length() < error )
            {
                if( new VIZCore.Vector3().subVectors(vBasePos1, s1p0).length() < error )
                    vRet = vRet.copy(s1p0);
                else
                    return false;
            }
            else
            {
                // CRMVertex3<T> vDirTo = vBasePos2 - vBasePos1;
                // vDirTo.Normalize();
                // CRMPlane<T> planeTo( vDirTo, vBasePos1 );

                let vDirTo = new VIZCore.Vector3().subVectors(vBasePos2, vBasePos1);
                vDirTo.normalize();
                let planeTo = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vDirTo, vBasePos1);

                //CRMVertex3<T> vToVertex = planeTo.GetProjectionPos( vLine1Start );
                let vToVertex = planeTo.projectPoint(s1p0);

                let lineDist = new VIZCore.Vector3().subVectors(vToVertex, vBasePos1).length();
        
                if( lineDist > error )
                    return false;
        
                // 찾는다
                let totalLen = new VIZCore.Vector3().subVectors(vBasePos2, vBasePos1).length();
                let len11 = new VIZCore.Vector3().subVectors(vBasePos1, s1p0).length();
                let len12 = new VIZCore.Vector3().subVectors(vBasePos2, s1p0).length();
                let dir1 = new VIZCore.Vector3().subVectors(vBasePos2, vBasePos1).dot( new VIZCore.Vector3().subVectors(s1p0, vBasePos1) );
                let dir2 = new VIZCore.Vector3().subVectors(vBasePos1, vBasePos2).dot( new VIZCore.Vector3().subVectors(s1p0, vBasePos2) );
        
                if( dir1 < 0 )
                {
                    if( len11 < error )
                        vRet = vRet.copy(s2p0);
                    else
                        return false;
                }
                else
                if( dir2 < 0 )
                {
                    if( len12 < error )
                        vRet = vRet.copy(s2p1);
                    else
                        return false;
                }
                else
                {
                    //let rate = len11/totalLen;
                    //vRet = s2p0*(1.0-rate) + s2p1*(rate);

                    let rate = len11/totalLen;
                    vRet = new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(s2p0).multiplyScalar(1.0-rate),
                        new VIZCore.Vector3().copy(s2p1).multiplyScalar(rate));
                }
            }
        
            // 첫번째 라인과 비교
            {
                let totalLen = new VIZCore.Vector3().subVectors(s1p1, s1p0).length();
                let len11 = new VIZCore.Vector3().subVectors(s1p0, vRet).length();
                let len12 = new VIZCore.Vector3().subVectors(s1p1, vRet).length();
                let dir1 = new VIZCore.Vector3().subVectors(s1p1, s1p0).dot( new VIZCore.Vector3().subVectors(vRet, s1p0) );
                let dir2 = new VIZCore.Vector3().subVectors(s1p0, s1p1).dot( new VIZCore.Vector3().subVectors(vRet, s1p1 ));
        
                if( totalLen < error )
                {
                    if( new VIZCore.Vector3().subVectors(vRet, s1p0).length() < error )
                    {
                        crossPt.copy(vRet);
                        return true;
                    }
                    else
                        return false;
                }
        
                if( dir1 < 0 )
                {
                    if( new VIZCore.Vector3().subVectors(s1p0, vRet).length() < error )
                    {
                        crossPt.copy(s1p0);
                        return true;
                    }
                    else
                        return false;
                }
                else
                if( dir2 < 0 )
                {
                    if(  new VIZCore.Vector3().subVectors(s1p1, vRet).length() < error )
                    {
                        crossPt.copy(s1p1);
                        return true;
                    }
                    else
                        return false;
                }
                else
                {
                    let rate = len11/totalLen;
                    vRet = new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(s1p0).multiplyScalar(1.0-rate),
                        new VIZCore.Vector3().copy(s1p1).multiplyScalar(rate));
                    crossPt.copy(vRet);
                    return true;
                }
            }
        
            return false;
        };

        ///**
        // * Triangle 2 Triangle Distance
        // * @param {Data.TriangleItem} triangles1 :
        // * @param {Data.TriangleItem} triangles2 :
        // * @param {VIZCore.Vector3} aPt : [out] 
        // * @param {VIZCore.Vector3} bPt : [out]
        // * @returns { [float, VIZCore.Vector3, VIZCore.Vector3]} : [거리, triangles1 에서 가장 가까운 위치, triangles2 에서 가장 가까운 위치]
        // */
        this.Tris2TrisDistance = function (triangles1, triangles2, aPt, bPt) {

            let a = [triangles1.vertex.v1, triangles1.vertex.v2, triangles1.vertex.v3];
            let b = [triangles2.vertex.v1, triangles2.vertex.v2, triangles2.vertex.v3];

            let currentshPlane = new VIZCore.shPlane().setFromTriangle(triangles1);

            let nb = [];
            nb[0] = currentshPlane.getLocalPoint(b[0]);
            nb[1] = currentshPlane.getLocalPoint(b[1]);
            nb[2] = currentshPlane.getLocalPoint(b[2]);

            let na = [];
            na[0] = currentshPlane.getLocalPoint(a[0]);
            na[1] = currentshPlane.getLocalPoint(a[1]);
            na[2] = currentshPlane.getLocalPoint(a[2]);

            //Vector2
            let aprj = [new VIZCore.Vector2(na[0].x, na[0].y), new VIZCore.Vector2(na[1].x, na[1].y), new VIZCore.Vector2(na[2].x, na[2].y)];
            let bprj = [new VIZCore.Vector2(nb[0].x, nb[0].y), new VIZCore.Vector2(nb[1].x, nb[1].y), new VIZCore.Vector2(nb[2].x, nb[2].y)];

            // let IsInTri = function (v2, prj, tol) {
            //     let minCrs = 1.0e+20;
            //     for (let j = 0; j < 3; j++) {
            //         let v0 = new VIZCore.Vector2().subVectors(prj[(j + 1) % 3], prj[j]).normalize();
            //         let v1 = new VIZCore.Vector2().subVectors(v2, prj[j]).normalize();

            //         let crossValue = v0.cross(v1);
            //         minCrs = Math.min(crossValue, minCrs);
            //         if (crossValue < tol)
            //             return false;
            //     }
            //     return true;
            // };

            let minDist = 0;
            let minDistFirst = true;

            for (let i = 0; i < 3; i++) {
                //let h = nb[i].z;
                //
                //if (IsInTri(bprj[i], aprj, -1.0e-6)) {
                //    let distba = Math.abs(h);
                //    let addDistPoint = false;
                //
                //    if (minDistFirst) {
                //        minDistFirst = false;
                //        minDist = distba;
                //        addDistPoint = true;
                //    }
                //    else if (distba < minDist) {
                //        minDist = distba;
                //        addDistPoint = true;
                //    }
                //
                //    if (addDistPoint) {
                //        let minNpt = new VIZCore.Vector2(nb[i].x, nb[i].y);
                //        let rstPt = currentshPlane.getGlobalPoint(minNpt);
                //
                //        if (aPt !== undefined)
                //            aPt.copy(rstPt);
                //        if (bPt !== undefined)
                //            bPt.copy(b[i]);
                //
                //        //aPt = new VIZCore.Vector3(rstPt.x, rstPt.y, rstPt.z);
                //        //bPt = b[i];
                //    }
                //}
                // A의 에지들과 B의 에지들간 3D 거리
                let i0 = i;
                let i1 = (i0 + 1) % 3;

                for (let j0 = 0; j0 < 3; j0++) {
                    let j1 = (j0 + 1) % 3;

                    let ept1 = new VIZCore.Vector3();
                    let ept2 = new VIZCore.Vector3();

                    let d = scope.Line2LineDistance(a[j0], a[j1], b[i0], b[i1], ept1, ept2);
                    if (minDistFirst || d < minDist) {
                        minDistFirst = false;
                        minDist = d;

                        if (aPt !== undefined)
                            aPt.copy(ept1);
                        if (bPt !== undefined)
                            bPt.copy(ept2);
                    }
                }

            }

            return minDist;
        };

        /**
         * 평면과 벡터 교점
         * @param {VIZCore.Vector3} pt  start
         * @param {VIZCore.Vector3} dir 방향
         * @param {VIZCore.Plane} plane Plane
         * @param {VIZCore.Vector3} crossPt [out] Cross Point
         * @returns {boolean} 
         */
        this.PlaneVectorCrossPosition = function (pt, dir, plane, crossPt) {

            let error = 0.00001;
            //let dot = plane.distanceToPoint(dir);
            let dot = plane.normal.dot(dir);

            // 평면과 벡터와 평행하면 스킵
            if(Math.abs(dot) < error) return false;

            
            // 교점 구한다
            //k = -(pt.x*a + pt.y*b + pt.z*c + d)/fDot;
            let ptDot = plane.distanceToPoint(pt);
            let k = (-ptDot / dot);

            //*crossPt = vDir*k + vPos;
            let resultPt = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(dir).multiplyScalar(k), pt);
            crossPt.copy(resultPt);

            return true;
        };

        ///**
        // * 
        // * @param {VIZCore.Vector3} v1
        // * @param {VIZCore.Vector3} v2
        // * @param {VIZCore.Vector3} v3
        // * @returns {Number} area
        // */
        this.GetPolygonArea = function (v1, v2, v3) {
            let fSideLength1 = new VIZCore.Vector3().subVectors(v2, v1).length();
            let fSideLength2 = new VIZCore.Vector3().subVectors(v3, v2).length();
            let fSideLength3 = new VIZCore.Vector3().subVectors(v1, v3).length();

            let s = (fSideLength1 + fSideLength2 + fSideLength3) / 2.0;
            let area = Math.sqrt(s * Math.max(0, (s - fSideLength1)) * Math.max(0, (s - fSideLength2)) * Math.max(0, (s - fSideLength3)));
            return area;
        };

        /**
       * Get BoundBox to Vertex
       * @param {VIZCore.BBox} : Bound Box
       * @returns {Array<VIZCore.Vector3>} : 정점 리스트 Array[8]
       */
        this.GetBBox2Vertex = function (bbox) {
            //array[8]
            let vertex = [
                new VIZCore.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
                new VIZCore.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
                new VIZCore.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
                new VIZCore.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
                new VIZCore.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
                new VIZCore.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
                new VIZCore.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
                new VIZCore.Vector3(bbox.max.x, bbox.max.y, bbox.max.z) //7
            ];

            return vertex;
        };

        /**
         * BBox Trasform 갱신
         * @param {VIZCore.BBox} bbox 
         * @param {VIZCore.Matrix4} transform 
         * @returns 
         */
        this.GetBBoxFormMatrix = function (bbox, transform) {
            
            let result = undefined;

            if(transform !== undefined)
            {
                result = new VIZCore.BBox();

                let vBox = scope.GetBBox2Vertex(bbox);
                //bound box Transform 
                for (let i = 0; i < 8; ++i) {
                    vBox[i].applyMatrix4(transform);

                    if (i === 0) {
                        result.min.copy(vBox[i]);
                        result.max.copy(vBox[i]);
                    }
                    else {
                        result.min.min(vBox[i]);
                        result.max.max(vBox[i]);
                    }
                }
                result.update();
            }            
            else {
                result = bbox;
            }

            return result;
        };

        
        /**
         * GL Line Width Vertex
         * @param {VIZCore.Vector3} v1 pos
         * @param {VIZCore.Vector3} v2 pos
         * @param {Number} width 
         * @returns {Array<VIZCore.Vector3>} vertices
         */
        this.Get2DLineFromWidth = function (v1, v2, width) {
            let hw = width * 0.5;

            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
            let vScreenPos1 = view.Camera.world2ScreenWithMatrix(matMVP, new VIZCore.Vector3().copy(v1));
            let vScreenPos2 = view.Camera.world2ScreenWithMatrix(matMVP, new VIZCore.Vector3().copy(v2));

            let vDirection = new VIZCore.Vector3().subVectors(vScreenPos2, vScreenPos1);
            vDirection.normalize();

            let vCross = new VIZCore.Vector3(0, 0, 1);
            vCross.cross(vDirection);

            let currentVertices = [
                new VIZCore.Vector3(vScreenPos1.x + (vCross.x * hw), vScreenPos1.y + (vCross.y * hw), vScreenPos1.z),
                new VIZCore.Vector3(vScreenPos1.x - (vCross.x * hw), vScreenPos1.y - (vCross.y * hw), vScreenPos1.z),
                new VIZCore.Vector3(vScreenPos2.x + (vCross.x * hw), vScreenPos2.y + (vCross.y * hw), vScreenPos2.z),
                new VIZCore.Vector3(vScreenPos2.x - (vCross.x * hw), vScreenPos2.y - (vCross.y * hw), vScreenPos2.z)
            ];

            for(let i = 0 ; i < 4; i++) {
                currentVertices[i] = view.Camera.screen2WorldWithMatrix(matMVP, currentVertices[i]);
            }

            return currentVertices;
        };

        /**
        * Degree 2 Radian
        * @param {Number} d: Degree
        * @returns {Number} Radian
        */
        this.DegToRad = function (d) {
            return d * Math.PI / 180;
        };

        /**
        * Radian 2 Degree
        * @param {Number} r: Radian
        * @returns {Number} Degree
        */
        this.RadToDeg = function (r) {
            return r / Math.PI * 180;
        };

        /**
         * Lerp
         * @param {Number} a
         * @param {Number} b
         * @param {Number} f
         */
        this.Lerp = function (a, b, f) {
            return a + f * (b - a);
        };

        /**
         * X축과 Y축 방향 반환
         * @param {VIZCore.Vector3} zAxis Z축
         * @param {VIZCore.Vector3} xAxis output X축
         * @param {VIZCore.Vector3} yAxis output Y축
         */
        this.GetXandYAxis = function (zAxis, xAxis, yAxis) {
            xAxis.set(1, 0, 0);
            //yAxis.set(0, 1, 0);

            if( Math.abs(xAxis.dot( zAxis )) > 0.9 )
                xAxis.set(0, 0, 1);
        
            yAxis.copy(zAxis); yAxis.cross( xAxis ); yAxis.normalize();
            xAxis.copy(yAxis); xAxis.cross( zAxis ); xAxis.normalize();        
        };

        ///**
        // * index 정보로 normal 반환
        // * @param {Data.TriangleItem} t : 
        // * @param {Number} idx : 
        // * @returns {VIZCore.Vector3} : 
        // */
        this.GetTriangleItemIdxNormal = function (t, idx) {

            if (idx === 0)
                return t.normal.v1;
            else if (idx === 1)
                return t.normal.v2;

            return t.normal.v3;
        };
        
        ///**
        // * Triangle Normal
        // * @param {VIZCore.Vector3} v1 :
        // * @param {VIZCore.Vector3} v2 : 
        // * @param {VIZCore.Vector3} v3 : 
        // * @returns {VIZCore.Vector3} : normal
        // */
        this.GetTriangleNormal = function (v1, v2, v3) {

            let sub1 = new VIZCore.Vector3().subVectors(v2, v1);
            let sub2 = new VIZCore.Vector3().subVectors(v3, v1);

            return sub1.cross(sub2).normalize();
        };

        ///**
        // * Triangles BoundBox
        // * @param {Array<Data.TriangleItem>} triangles :
        // * @returns {VIZCore.BBox} : 
        // */
        this.GetTrianglesBBox = function (triangles) {

            let result = new VIZCore.BBox();

            for (let i = 0; i < triangles.length; i++) {
                if (i === 0) {
                    result.min.copy(triangles[i].vertex.v1);
                    result.min.min(triangles[i].vertex.v2);
                    result.min.min(triangles[i].vertex.v3);

                    result.max.copy(triangles[i].vertex.v1);
                    result.max.max(triangles[i].vertex.v2);
                    result.max.max(triangles[i].vertex.v3);
                }
                else {
                    result.min.min(triangles[i].vertex.v1);
                    result.min.min(triangles[i].vertex.v2);
                    result.min.min(triangles[i].vertex.v3);

                    result.max.max(triangles[i].vertex.v1);
                    result.max.max(triangles[i].vertex.v2);
                    result.max.max(triangles[i].vertex.v3);
                }
            }

            result.update();

            return result;
        };

        ///**
        // * index 정보로 vertex 반환
        // * @param {Data.TriangleItem} t : 
        // * @param {Number} idx : 
        // * @returns {VIZCore.Vector3} : 
        // */
        this.GetTrianglePos = function (t, idx) {

            if (idx === 0)
                return t.vertex.v1;
            else if (idx === 1)
                return t.vertex.v2;

            return t.vertex.v3;
        };

        ///**
        // * 3점 포인트 원 중심 반환
        // * @param {VIZCore.Vector3} vP1 : 
        // * @param {VIZCore.Vector3} vP2 : 
        // * @param {VIZCore.Vector3} vP3 : 
        // * @returns {VIZCore.Vector3} : 
        // */
        this.GetCircleCenterPTFrom3Pt = function (vP1, vP2, vP3) {

            let vertex1 = [vP1.x, vP1.y, vP1.z ];
            let vertex2 = [vP2.x, vP2.y, vP2.z ];
            let vertex3 = [vP3.x, vP3.y, vP3.z ];

            // 먼저 평면 방정식 구한다
            let a, b, c, d;
            let planeNormal = [ vertex2[0]-vertex1[0], vertex2[1]-vertex1[1], vertex2[2]-vertex1[2] ];
            let planePt = [ (vertex2[0]+vertex1[0])/2, (vertex2[1]+vertex1[1])/2, (vertex2[2]+vertex1[2])/2 ];
            d = -( planeNormal[0]*planePt[0] + planeNormal[1]*planePt[1] + planeNormal[2]*planePt[2] );
            a = planeNormal[0]; b = planeNormal[1]; c = planeNormal[2];

            // 벡터 방향 구한다
            let dir1 = [ vertex2[0]-vertex1[0], vertex2[1]-vertex1[1], vertex2[2]-vertex1[2] ];
            let dir2 = [ vertex3[0]-vertex2[0], vertex3[1]-vertex2[1], vertex3[2]-vertex2[2] ];
            let circlePlaneNormal = [];

            circlePlaneNormal[0] = dir1[1]*dir2[2] - dir1[2]*dir2[1];
            circlePlaneNormal[1] = dir1[2]*dir2[0] - dir1[0]*dir2[2];
            circlePlaneNormal[2] = dir1[0]*dir2[1] - dir1[1]*dir2[0];

            let vecDir = [];

            vecDir[0] = circlePlaneNormal[1]*dir2[2] - circlePlaneNormal[2]*dir2[1];
            vecDir[1] = circlePlaneNormal[2]*dir2[0] - circlePlaneNormal[0]*dir2[2];
            vecDir[2] = circlePlaneNormal[0]*dir2[1] - circlePlaneNormal[1]*dir2[0];

            // 벡터가 지나는 점 구한다
            let vecPt = [ (vertex3[0]+vertex2[0])/2, (vertex3[1]+vertex2[1])/2, (vertex3[2]+vertex2[2])/2 ];
            let vRet = [ 0.0, 0.0, 0.0 ];

            // k 구하기
            let under = (a*vecPt[0] + b*vecPt[1] + c*vecPt[2] + d );
            let k = 0;

            if( Math.abs( under ) > 0.0000001 )
            {
                k = -under/(a*vecDir[0] + b*vecDir[1] + c*vecDir[2]);
            }
            else
            {
                ;//pVertexCenter[0] = pVertexCenter[1] = pVertexCenter[2] = 0.0f;
            }

            vRet[0] = vecDir[0]*k + vecPt[0];
            vRet[1] = vecDir[1]*k + vecPt[1];
            vRet[2] = vecDir[2]*k + vecPt[2];

            let vCenter = new VIZCore.Vector3();

            vCenter.x = vRet[0];
            vCenter.y = vRet[1];
            vCenter.z = vRet[2];

            return vCenter;
        };

        ///**
        //* 
        //* @param {VIZCore.Vector3()} vPos: 3D
        //* @param {[Number]} nearPlane: nearPlane []
        //*/
        this.IsRenderReivewNearPlane = function (vPos, nearPlane) {
            if (vPos === undefined)
                return false;

            if (vPos.x * nearPlane[0] +
                vPos.y * nearPlane[1] +
                vPos.z * nearPlane[2] + nearPlane[3] < 0)
                return true;

            return false;
        };

         /**
       * (Function) Point In Triangle 2D
       * @param {VIZCore.Vector3} pt: 포인트
       * @param {VIZCore.Vector3} t1: 정점1
       * @param {VIZCore.Vector3} t2: 정점2
       * @param {VIZCore.Vector3} t3: 정점3
       * @returns {Boolean} 성공여부
       */
        this.IsPointInTriangle2D = function (pt, t1, t2, t3) {
            let vDir1, vDir2;

            vDir1 = new VIZCore.Vector3().subVectors(t2, t1);
            vDir2 = new VIZCore.Vector3().subVectors(pt, t1);
            let cross1 = vDir1.x * vDir2.y - vDir1.y * vDir2.x;

            vDir1 = new VIZCore.Vector3().subVectors(t3, t2);
            vDir2 = new VIZCore.Vector3().subVectors(pt, t2);
            let cross2 = vDir1.x * vDir2.y - vDir1.y * vDir2.x;

            vDir1 = new VIZCore.Vector3().subVectors(t1, t3);
            vDir2 = new VIZCore.Vector3().subVectors(pt, t3);
            let cross3 = vDir1.x * vDir2.y - vDir1.y * vDir2.x;

            if ((cross1 <= 0 && cross2 <= 0 && cross3 <= 0) || (cross1 >= 0 && cross2 >= 0 && cross3 >= 0))
                return true;

            return false;
        }

        /**
        * (Function) Triangle In Box 2D
        * @param {VIZCore.Vector3} t1: 정점1
        * @param {VIZCore.Vector3} t2: 정점2
        * @param {VIZCore.Vector3} t3: 정점3
        * @param {VIZCore.Vector3} vBoxMin: BBox Min
        * @param {VIZCore.Vector3} vBoxMax: BBox Max
        * @returns {Boolean} 성공여부
        */
        this.IsTriangleInBox2D = function (t1, t2, t3, vBoxMin, vBoxMax) {
            if (t1.x >= vBoxMin.x && t2.x >= vBoxMin.x && t3.x >= vBoxMin.x && t1.y >= vBoxMin.y && t2.y >= vBoxMin.y && t3.y >= vBoxMin.y)
                if (t1.x <= vBoxMax.x && t2.x <= vBoxMax.x && t3.x <= vBoxMax.x && t1.y <= vBoxMax.y && t2.y <= vBoxMax.y && t3.y <= vBoxMax.y)
                    return true;

            return false;
        };
        

        /**
        * (Function)
        * @param {VIZCore.Vector3} p1: 포인트1
        * @param {VIZCore.Vector3} p2: 포인트2
        * @param {VIZCore.Vector3} p3: 포인트3
        * @param {VIZCore.Vector3} p4: 포인트4
        * @returns {Boolean} 성공여부
        */
        this.CheckCross2D = function (p1, p2, p3, p4) {
            if (new VIZCore.Vector3().subVectors(p2, p1).length() < 0.0000001) return false;
            if (new VIZCore.Vector3().subVectors(p4, p3).length() < 0.0000001) return false;

            if (p1.x >= p2.x) {
                if ((p1.x < p3.x && p1.x < p4.x) || (p2.x > p3.x && p2.x > p4.x))
                    return false;
            }
            else {
                if ((p2.x < p3.x && p2.x < p4.x) || (p1.x > p3.x && p1.x > p4.x))
                    return false;
            }

            if (p1.y >= p2.y) {
                if ((p1.y < p3.y && p1.y < p4.y) || (p2.y > p3.y && p2.y > p4.y))
                    return false;
            }
            else {
                if ((p2.y < p3.y && p2.y < p4.y) || (p1.y > p3.y && p1.y > p4.y))
                    return false;
            }

            if (((p1.x - p2.x) * (p3.y - p1.y) + (p1.y - p2.y) * (p1.x - p3.x)) *
                ((p1.x - p2.x) * (p4.y - p1.y) + (p1.y - p2.y) * (p1.x - p4.x)) > 0)
                return false;

            if (((p3.x - p4.x) * (p1.y - p3.y) + (p3.y - p4.y) * (p3.x - p1.x)) *
                ((p3.x - p4.x) * (p2.y - p3.y) + (p3.y - p4.y) * (p3.x - p2.x)) > 0)
                return false;

            return true;
        };

        /**
        * (Function) Triangle Cross Box 2D
        * @param {VIZCore.Vector3} t1: 정점1
        * @param {VIZCore.Vector3} t2: 정점2
        * @param {VIZCore.Vector3} t3: 정점3
        * @param {VIZCore.Vector3} vBoxMin: BBox Min
        * @param {VIZCore.Vector3} vBoxMinSub: BBox Min
        * @param {VIZCore.Vector3} vBoxMax: BBox Max
        * @param {VIZCore.Vector3} vBoxMaxSub: BBox Max
        * @returns {Number} 성공여부 Type 여부
        *                   0 = 실패, 1 = TriInBox, 2 = PointInTri, 3 = Cross
        */
        this.IsTriangleCrossBox2D = function (t1, t2, t3,
            vBoxMin, vBoxMinSub, vBoxMax, vBoxMaxSub) {

            const tMinX = Math.min(t1.x, Math.min(t2.x, t3.x));
            const tMinY = Math.min(t1.y, Math.min(t2.y, t3.y));
            const tMaxX = Math.max(t1.x, Math.max(t2.x, t3.x));
            const tMaxY = Math.max(t1.y, Math.max(t2.y, t3.y));

            // 해당사항 없음
            if (tMaxX < vBoxMin.x || tMinX > vBoxMinSub.x || tMaxY < vBoxMin.y || tMinY > vBoxMax.y)
                return 0;

            // 삼각형이 박스 안에 존재
            if (scope.IsTriangleInBox2D(t1, t2, t3, vBoxMin, vBoxMax)) return 1;

            // 박스가 삼각형에 걸쳐진 경우
            {
                if (scope.IsPointInTriangle2D(vBoxMin, t1, t2, t3) || scope.IsPointInTriangle2D(vBoxMinSub, t1, t2, t3) ||
                    scope.IsPointInTriangle2D(vBoxMax, t1, t2, t3) || scope.IsPointInTriangle2D(vBoxMaxSub, t1, t2, t3))
                    return 2;
            }

            {
                if (scope.CheckCross2D(t1, t2, vBoxMin, vBoxMinSub)) return 3;
                if (scope.CheckCross2D(t1, t2, vBoxMinSub, vBoxMax)) return 3;
                if (scope.CheckCross2D(t1, t2, vBoxMax, vBoxMaxSub)) return 3;
                if (scope.CheckCross2D(t1, t2, vBoxMaxSub, vBoxMin)) return 3;

                if (scope.CheckCross2D(t2, t3, vBoxMin, vBoxMinSub)) return 3;
                if (scope.CheckCross2D(t2, t3, vBoxMinSub, vBoxMax)) return 3;
                if (scope.CheckCross2D(t2, t3, vBoxMax, vBoxMaxSub)) return 3;
                if (scope.CheckCross2D(t2, t3, vBoxMaxSub, vBoxMin)) return 3;

                if (scope.CheckCross2D(t3, t1, vBoxMin, vBoxMinSub)) return 3;
                if (scope.CheckCross2D(t3, t1, vBoxMinSub, vBoxMax)) return 3;
                if (scope.CheckCross2D(t3, t1, vBoxMax, vBoxMaxSub)) return 3;
                if (scope.CheckCross2D(t3, t1, vBoxMaxSub, vBoxMin)) return 3;
            }

            return 0;
        };

      
        /**
         * 메트릭스 값에 대한 회전 및 이동 값 반환
         * @param {VIZCore.Matrix4} matrix 
         * @param {VIZCore.Vector3} move 이동 값
         * @param {VIZCore.Vector3} rotate 회전 값
         */
        this.GetRotateTranslateFormMatrix = function(matrix, move, rotate) {
            
            if(matrix === undefined) {
                return;
            }
            let m = new VIZCore.Matrix4().copy(matrix);
            move.copy(m.getTranslate());
            //m.setPosition(0, 0, 0);

            //let q = m.getQuaternion();
            //rotate.copy(q.quaternionToEuler());

            rotate.x = Math.atan2(m.elements[6], m.elements[10]);
            rotate.y = Math.atan2(-m.elements[2], Math.sqrt(m.elements[6] * m.elements[6] + m.elements[10] * m.elements[10]));
            rotate.z = Math.atan2(m.elements[1], m.elements[0]);
        };

        // 회전 및 이동 메트릭스 반환 (Center 기준)
        // @param {VIZCore.Vector3} center: 기준
        // @param {VIZCore.Vector3} move: 이동
        // @param {VIZCore.Vector3} rotate: 회전
        // @returns {VIZCore.Matrix4} 
        this.GetTransformMatrix = function (center, move, rotate) {
            // transform 처리
            // rotate
            let rotateMatrix = new VIZCore.Matrix4();
            let rotateXMatrix = new VIZCore.Matrix4();
            let rotateYMatrix = new VIZCore.Matrix4();
            let rotateZMatrix = new VIZCore.Matrix4();
            rotateXMatrix.makeRotationX(rotate.x * 3.14 / 180.0);
            rotateYMatrix.makeRotationY(rotate.y * 3.14 / 180.0);
            rotateZMatrix.makeRotationZ(rotate.z * 3.14 / 180.0);

            rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateXMatrix, rotateYMatrix);
            rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, rotateZMatrix);

            let centerZero = new VIZCore.Vector3().copy(center).multiplyScalar(-1);
            let centerZeroMatrix = new VIZCore.Matrix4().setPosition(centerZero);
            let centerMatrix = new VIZCore.Matrix4().setPosition(center);
            let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, centerZeroMatrix);
            let rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(centerMatrix, tmpMatrix);
            rotateByPivotMatrix.translate(move.x, move.y, move.z);

            return rotateByPivotMatrix;
        };


        // 메트릭스에서 Center 기준 메트릭스 반환
        // @param {VIZCore.Matrix4} transform: 이동, 회전 메트릭스
        // @returns {VIZCore.Matrix4}
        this.GetTransformMatrixFormTransform = function (center, transform) {
            // transform 처리
            // rotate
            let rotateMatrix = new VIZCore.Matrix4().copy(transform);

            let centerZero = new VIZCore.Vector3().copy(center).multiplyScalar(-1);
            let centerZeroMatrix = new VIZCore.Matrix4().setPosition(centerZero);
            let centerMatrix = new VIZCore.Matrix4().setPosition(center);
            let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, centerZeroMatrix);
            let rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(centerMatrix, tmpMatrix);

            return rotateByPivotMatrix;
        };

        ///**
        // * 메트릭스 보간
        // * @param {VIZCore.Matrix4} mat1
        // * @param {VIZCore.Matrix4} mat2
        // * @param {Number} t : 0 ~ 1
        // */
        this.QuaternionInterpolation = function (mat1, mat2, t) {
            // 1번
            let vQuerternion1 = new VIZCore.Quaternion(0, 0, 0, 1);
            let vScale1 = new VIZCore.Vector3();
            let vTranslate1 = new VIZCore.Vector3();

            vQuerternion1 = mat1.getQuaternion();
            vScale1 = mat1.getScale();
            vTranslate1 = mat1.getTranslate();

            // 2번
            //CRMVertex4 < T > vQuerternion2;
            let vQuerternion2 = new VIZCore.Quaternion();
            let vScale2 = new VIZCore.Vector3();
            let vTranslate2 = new VIZCore.Vector3();

            vQuerternion2 = mat2.getQuaternion();
            vScale2 = mat2.getScale();
            vTranslate2 = mat2.getTranslate();

            // 보간
            let r1 = 1.0 - t;
            let r2 = t;

            let vQuerternion = vQuerternion1.slerp(vQuerternion2, t);
            r1 = 1.0 - t;
            r2 = t;

            let vScale = new VIZCore.Vector3().addVectors(vScale1.multiplyScalar(r1), vScale2.multiplyScalar(r2));
            let vTranslate = new VIZCore.Vector3().addVectors(vTranslate1.multiplyScalar(r1), vTranslate2.multiplyScalar(r2));

            // 재생성
            let matTrans = new VIZCore.Matrix4();
            let matRotate = new VIZCore.Matrix4();
            let matScale = new VIZCore.Matrix4();
            let matTranslate = new VIZCore.Matrix4();

            matRotate.makeRotationFromQuaternion(vQuerternion);
            matScale.makeScale(vScale.x, vScale.y, vScale.z);
            matTranslate.makeTranslation(vTranslate.x, vTranslate.y, vTranslate.z);

            matTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matRotate);
            matTrans = new VIZCore.Matrix4().multiplyMatrices(matTrans, matScale);

            let vZero = new VIZCore.Vector3();
            let vOne = new VIZCore.Vector3(10000, 0, 0);
            vZero = matTrans.multiplyVector(vZero);
            vOne = matTrans.multiplyVector(vOne);
            let fRetScale = new VIZCore.Vector3().subVectors(vOne, vZero).length / 10000.0;

            if (fRetScale > 0.00001) {
                for (let i = 0; i < 3; i++)
                    for (let j = 0; j < 3; j++)
                        matTrans.elements[i * 4 + j] /= fRetScale;
            }

            return matTrans;
        };

        this.GetVectorCrossPos = function (vPos1, vDir1, vPos2, vDir2, vRet, error) {
            if (Math.abs(vDir1[0] - vDir2[0]) < error && Math.abs(vDir1[1] - vDir2[1]) < error && Math.abs(vDir1[2] - vDir2[2]) < error)
                return false;
            if (Math.abs(vDir1[0] + vDir2[0]) < error && Math.abs(vDir1[1] + vDir2[1]) < error && Math.abs(vDir1[2] + vDir2[2]) < error)
                return false;

            let a, b, c, d, e, f, g, h, k1, k2;
            let p;

            // 먼저 계수가 0인게 있는지 조사
            for (let i = 0; i < 3; i++) {
                if (Math.abs(vDir1[i]) < error && Math.abs(vDir2[i]) > error) {
                    k2 = (vPos1[i] - vPos2[i]) / vDir2[i];

                    vRet[0] = vPos2[0] + vDir2[0] * k2;
                    vRet[1] = vPos2[1] + vDir2[1] * k2;
                    vRet[2] = vPos2[2] + vDir2[2] * k2;

                    return true;
                }

                if (Math.abs(vDir2[i]) < error && Math.abs(vDir1[i]) > error) {
                    k1 = (vPos2[i] - vPos1[i]) / vDir1[i];

                    vRet[0] = vPos1[0] + vDir1[0] * k1;
                    vRet[1] = vPos1[1] + vDir1[1] * k1;
                    vRet[2] = vPos1[2] + vDir1[2] * k1;

                    return true;
                }
            }

            // 아무거나 2개씩 뽑아서 검사
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (i === j)
                        continue;
                    if (Math.abs(vDir1[i]) < error && Math.abs(vDir2[i]) < error)
                        continue;
                    if (Math.abs(vDir1[j]) < error && Math.abs(vDir2[j]) < error)
                        continue;

                    a = vDir1[i];
                    b = vPos1[i];
                    c = vDir2[i];
                    d = vPos2[i];
                    e = vDir1[j];
                    f = vPos1[j];
                    g = vDir2[j];
                    h = vPos2[j];

                    p = c / g;

                    e *= p;
                    f *= p;
                    g *= p;
                    h *= p;

                    a = a - e;
                    b = b - f;
                    d = d - h;

                    if (Math.abs(a) < error)
                        continue;

                    k1 = (d - b) / a;

                    vRet[0] = vPos1[0] + vDir1[0] * k1;
                    vRet[1] = vPos1[1] + vDir1[1] * k1;
                    vRet[2] = vPos1[2] + vDir1[2] * k1;

                    return true;
                }
            }

            return false;
        };


        

        /**
        * Image to Base64 변환
        * @returns {String} Base64
        */
        //this.getBase64Image = function(img) {
        //    // Create an empty canvas element
        //    let canvas = document.createElement("canvasBase64");
        //    canvas.width = img.width;
        //    canvas.height = img.height;
        //    // Copy the image contents to the canvas
        //    let ctx = canvas.getContext("2d");
        //    ctx.drawImage(img, 0, 0);
        //    // Get the data-URL formatted image
        //    // Firefox supports PNG and JPEG. You could check img.src to guess the
        //    // original format, but be aware the using "image/jpg" will re-encode the image.
        //    let dataURL = canvas.toDataURL("image/png");
        //    return (dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
        //}
        /**
        * Image to Base64 출력
        * @param {String} url : Url에서 다운받아서 얻은 이미지 base64 출력
        */
        this.GetBase64FromImageUrl = function (url) {
            let img = new Image();

            img.setAttribute('crossOrigin', 'anonymous');

            img.onload = function () {
                let canvas = document.createElement("canvas");
                canvas.width = this.width;
                canvas.height = this.height;

                let ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0);

                let dataURL = canvas.toDataURL("image/png");

                //alert(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
                console.log(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
            };

            img.src = url;
        };

        this.GetCubeMapTexture = function (type) {

            let current = "";
            switch (type) {
                //SkyBox
                case 0:

                    //+x
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Left.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Left.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Left.jpg";
                    current = "VIZCore/Resource/skybox/Skybox_Right.png";
                    //current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Right.png";                
                    break;
                case 1:

                    //-x
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Right.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Right.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Right.jpg";
                    current = "VIZCore/Resource/skybox/Skybox_Left.png";
                    //current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Left.png";
                    break;
                case 2:

                    //+y
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Bottom.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Bottom.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Bottom.jpg";
                    current = "VIZCore/Resource/skybox/Skybox_Front.png";
                    //current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Front.png";
                    break;
                case 3:

                    //-y
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Top.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Top.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Top.jpg";
                    current = "VIZCore/Resource/skybox/Skybox_Back.png";
                    //current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Back.png";
                    break;
                case 4:

                    //+z
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Back.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Back.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Back.jpg";
                    current = "VIZCore/Resource/skybox/Skybox_Top.png";
                    //current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Top.png";
                    break;
                case 5:

                    //-z
                    //current = "VIZCore/MODEL/Resource/skybox/Cubemap_Front.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v2/Cubemap_Front.jpg";
                    //current = "VIZCore/MODEL/Resource/skybox_v3/Cubemap_Front.jpg";
                    //current = "VIZCore/Resource/skybox/Skybox_Bottom.png";
                    current = "VIZCore/Resource/skybox2/Skybox_UnityVer1_Bottom.png";
                    break;
            }
            return current;
        };

        this.GetTESTTextureData64Src = function (type) {
            let current = "";

            switch (type) {
                //chair_UV_3.vizw (mold)
                case 100:
                    //\\shnas\Utils\User\조수성\VIZCore\MODEL\Resource\1
                    current = "VIZCore/MODEL/Resource/1/texture_mold.jpg";
                    //current = "\\shnas\Utils\User\조수성\VIZCore\MODEL\Resource\texture_mold.jpg";
                    break;
                //chair_UV_3.vizw (armNwheel)
                case 101:
                    current = "VIZCore/MODEL/Resource/1/texture_armNwheel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_armNwheel.jpg";
                    break;
                //chair_UV_3.vizw (leather)
                case 102:
                    current = "VIZCore/MODEL/Resource/1/texture_leather.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_leather.jpg";
                    break;
                //chair_UV_3.vizw (steel)
                case 103:
                    current = "VIZCore/MODEL/Resource/1/texture_steel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_steel.jpg";
                    break;
                case 104:
                    current = "VIZCore/MODEL/Resource/1/texture_wheel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_steel.jpg";
                    break;
                case 105:
                    //current = "VIZCore/MODEL/Resource/1/PlaneShadow_v2.png";
                    current = "VIZCore/MODEL/Resource/1/PlaneShadow_v3.png";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_steel.jpg";
                    break;

                //chair_UV_3.vizw (mold Normal)
                case 200:
                    current = "VIZCore/MODEL/Resource/1/normal_mold.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/normal_mold.jpg";
                    break;
                //chair_UV_3.vizw (armNwheel Normal)
                case 201:
                    current = "VIZCore/MODEL/Resource/1/normal_armNwheel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/normal_armNwheel.jpg";
                    break;
                //chair_UV_3.vizw (leather Normal)
                case 202:
                    current = "VIZCore/MODEL/Resource/1/normal_leather.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/normal_leather.jpg";
                    break;
                //chair_UV_3.vizw (steel Normal)
                case 203:
                    current = "VIZCore/MODEL/Resource/1/normal_steel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/normal_steel.jpg";
                    break;
                case 204:
                    current = "VIZCore/MODEL/Resource/1/normal_wheel.jpg";
                    //current = "//shnas/Utils/User/조수성/VIZCore/MODEL/Resource/texture_steel.jpg";
                    break;



                case 150:
                    current = "VIZCore/MODEL/Resource/steelCase/mold_texture_steelcase.jpg";
                    break;
                case 152:
                    current = "VIZCore/MODEL/Resource/steelCase/leather_texture_steelcase.jpg";
                    break;

                case 250:
                    current = "VIZCore/MODEL/Resource/steelCase/mold_normal_steelcase.jpg";
                    break;

                case 252:
                    current = "VIZCore/MODEL/Resource/steelCase/leather_normal_steelcase.jpg";
                    break;




            }

            return current;
        };

        this.ExportTextFileTxt_v1 = function (text) {
            let blob = new Blob(text, { type: 'text/plain;charset=utf-8' });
            let objURL = window.URL.createObjectURL(blob);

            //let saveTime = new Date();

            let a = document.createElement("a");
            document.body.appendChild(a);
            a.href = objURL;
            a.download = "textFile.txt";
            a.click();
            window.URL.revokeObjectURL(objURL);

        };


        this.SaveCanvasImage = function (canvas) {
            const imgBase64 = canvas.toDataURL();
            scope.SaveImageByBase64(imgBase64);

            //const imgBase64 = canvas.toDataURL('image/jpeg', 'image/octet-stream'); //jpg 형식의 base64
        };


        this.SaveImageData = function (imgData, imgWidth, imgHeight) {

            // Create a 2D canvas to store the result 
            let canv = document.createElement('canvas');
            canv.id = view.Container.id + 'canvasbuffer'; // gives canvas id
            canv.width = imgWidth;
            canv.height = imgHeight;

            let context = canv.getContext('2d');

            let imageData = context.createImageData(imgWidth, imgHeight);
            imageData.data.set(imgData);
            context.putImageData(imageData, 0, 0);

            const imgBase64 = canv.toDataURL();
            scope.SaveImageByBase64(imgBase64);
        };

        this.SaveImageByBase64 = function (imgBase64) {
            let blob = dataURLtoBlob(imgBase64);

            let a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            //blob.type = "octet-stream";
            a.href = imgBase64;
            a.download = "filename";
            a.click();
            window.URL.revokeObjectURL(imgBase64);

            //const imgBase64 = canvas.toDataURL('image/jpeg', 'image/octet-stream'); //jpg 형식의 base64
        };

        function dataURLtoBlob(dataurl) {
            let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {
                type: mime
            });
        };


        ///**
        // * 
        // * @param {Array<Number>} byteData : [byte]
        // */
        this.ByteToImageSrc = function (byteData) {
            return "data:image/png;base64," + btoa(String.fromCharCode.apply(null, new Uint8Array(byteData)));
        };


        /**
         * 텍스트 파일 저장
         * @param {Array(String)} text 
         */
        this.ExportTextFileTxt_v2 = function(text) {
            let blob = new Blob(text, {type : 'text/plain;charset=utf-8'});
            let objURL = window.URL.createObjectURL(blob);

            let saveTime = new Date();

            let a = document.createElement("a");
            document.body.appendChild(a);

            a.href = objURL;
            a.download = "Text_" + 
                    saveTime.getFullYear() + "." + (saveTime.getMonth() + 1) + "." + saveTime.getDate() + "_" + 
                    saveTime.getHours() + "_" + saveTime.getMinutes() + ".txt";
            a.click();
            window.URL.revokeObjectURL(objURL);
            document.body.removeChild(a);
        };
        
        /**
         * json 파일 저장
         * @param {Object)} json
         */
         this.ExportTextFile = function(json) {
            let blob = new Blob([json], {type : 'application/json'});
            let objURL = window.URL.createObjectURL(blob);

            let saveTime = new Date();

            let a = document.createElement("a");
            document.body.appendChild(a);

            a.href = objURL;
            a.download = "JSON_" + 
                    saveTime.getFullYear() + "." + (saveTime.getMonth() + 1) + "." + saveTime.getDate() + "_" + 
                    saveTime.getHours() + "_" + saveTime.getMinutes() + ".json";
            a.click();
            window.URL.revokeObjectURL(objURL);
            document.body.removeChild(a);
        };

        this.ExportBufferFile = function(data, fileName) {
            let blob = new Blob([data], {type : 'application/octet-stream'});
            let objURL = window.URL.createObjectURL(blob);

            let a = document.createElement("a");
            document.body.appendChild(a);

            a.href = objURL;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(objURL);
            document.body.removeChild(a);
        };

        
        /**
         * json 파일 불러오기
         * @param {Object)} json
         */
         this.ImportFileByJson = function(json, cbEvent) {
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = _=> {
                let files = Array.from(input.files);

                let readFile = new FileReader();
                readFile.onload = function(e) {
                    let contents = e.target.result;
                    let json = JSON.parse(contents);


                };
                readFile.readAsText(files[0]);
            };
            input.click();

        };

        /*
        function ImageTest()
        {
            let src = "./VIZCore/Resource/image.tg4";
            //let src = "./VIZCore/Resource/env_map.jpg";
    
            const oReq = new XMLHttpRequest();
                oReq.open("GET", src);
                oReq.responseType = "arraybuffer";
    
                oReq.onload = function() {
                    const img = new Image();
    
                    const arrayBuffer = oReq.response;
    
                    //let byteArray = new Uint8Array(arrayBuffer);
    
                    //const imgBase64 = canvas.toDataURL('image/png', 'image/octet-stream'); //jpg 형식의 base64
    
                    //img.src = view.Util.ByteToImageSrc(arrayBuffer);
    
                    //let blob = new Blob([byteArray], {type: "image/png"});
                    //let url = URL.createObjectURL(blob);
    
                    // const base64 = btoa(byteArray);
                    // const data = 'data:image/png;base64,' + base64;
                  
                    //img.src = url;
                    img.src = src;
    
                    img.onload = () => {
                        ctx_review.drawImage(img, 0, 0, img.width, img.height );
                    };
                    
                    img.onerror = function() {
                        
                    };
            };
            oReq.send();
    
            // let img = new Image();
            
            // img.src = "./VIZCore/Resource/image.tg4";
            //         //img.src = "./VIZCore/Resource/env_map.jpg";
            // img.src = view.Util.ByteToImageSrc()
    
            // img.onload = function() {
            //     ctx_review.drawImage(img, 0, 0, img.width, img.height );
            // };
            // img.onerror = function(e)
            // {
            //     ;
            // };
        }
        */

    }
}

export default Util;