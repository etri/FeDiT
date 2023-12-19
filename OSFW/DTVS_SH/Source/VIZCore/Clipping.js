/**
 * @author ssjo@softhills.net
 */

class Clipping {
    constructor(view, VIZCore) {
        // Private
        let scope = this;

        let clippingMap = new Map();

        //init();
        //function init() {
        //
        //}
        /**
        * 단면추가
        * @param {String} clippingType: CLIPPING_MODES
        */
        function add(clippingType) {

            let item = view.Data.ClipItem();
            clippingMap.set(item.id, item);

            let bbox = getShowObjectsBBox();

            item.itemType = clippingType;
            switch (item.itemType) {
                case VIZCore.Enum.CLIPPING_MODES.X:
                    {
                        let clipPlane = view.Data.ClipPlane();
                        clipPlane.normal = new VIZCore.Vector3(-1, 0, 0);
                        clipPlane.center.copy(bbox.center);

                        item.planes.push(clipPlane);

                        let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                        handle.enable = false;
                        handle.center.copy(clipPlane.center);

                        handle.axis.x.enable = true;
                        handle.axis.x.visible = true;
                        handle.axis.x.normal.copy(clipPlane.normal);
                        handle.axis.x.normal.multiplyScalar(-1);

                        handle.axis.y.enable = false;
                        handle.axis.y.visible = true;

                        handle.axis.z.enable = false;
                        handle.axis.z.visible = true;
                        
                        handle.rotate.y.enable = true;
                        handle.rotate.y.visible = true;

                        handle.rotate.z.enable = true;
                        handle.rotate.z.visible = true;
                        view.Util.GetXandYAxis(new VIZCore.Vector3(-1, 0, 0), handle.axis.z.normal, handle.axis.y.normal);


                        handle.object = clipPlane;
                        clipPlane.handle = handle;
                    }
                    break;
                case VIZCore.Enum.CLIPPING_MODES.Y:
                    {
                        let clipPlane = view.Data.ClipPlane();
                        clipPlane.normal = new VIZCore.Vector3(0, -1, 0);
                        clipPlane.center.copy(bbox.center);

                        item.planes.push(clipPlane);

                        let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                        handle.enable = false;
                        handle.center.copy(clipPlane.center);

                        handle.axis.y.enable = true;
                        handle.axis.y.visible = true;
                        handle.axis.y.normal.copy(clipPlane.normal);
                        handle.axis.y.normal.multiplyScalar(-1);

                        handle.axis.x.enable = false;
                        handle.axis.x.visible = true;

                        handle.axis.z.enable = false;
                        handle.axis.z.visible = true;
                        
                        handle.rotate.x.enable = true;
                        handle.rotate.x.visible = true;

                        handle.rotate.z.enable = true;
                        handle.rotate.z.visible = true;
                        view.Util.GetXandYAxis(new VIZCore.Vector3(0, -1, 0), handle.axis.x.normal, handle.axis.z.normal);


                        handle.object = clipPlane;
                        clipPlane.handle = handle;
                    }
                    break;
                case VIZCore.Enum.CLIPPING_MODES.Z:
                    {
                        let clipPlane = view.Data.ClipPlane();
                        clipPlane.normal = new VIZCore.Vector3(0, 0, -1);
                        clipPlane.center.copy(bbox.center);

                        item.planes.push(clipPlane);

                        let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                        handle.enable = false;
                        handle.center.copy(clipPlane.center);

                        handle.axis.z.enable = true;
                        handle.axis.z.visible = true;
                        handle.axis.z.normal.copy(clipPlane.normal);
                        handle.axis.z.normal.multiplyScalar(-1);

                        handle.axis.x.enable = false;
                        handle.axis.x.visible = true;

                        handle.axis.y.enable = false;
                        handle.axis.y.visible = true;
                        
                        handle.rotate.x.enable = true;
                        handle.rotate.x.visible = true;

                        handle.rotate.y.enable = true;
                        handle.rotate.y.visible = true;
                        view.Util.GetXandYAxis(new VIZCore.Vector3(0, 0, 1), handle.axis.x.normal, handle.axis.y.normal);


                        handle.object = clipPlane;
                        clipPlane.handle = handle;
                    }
                    break;

                case VIZCore.Enum.CLIPPING_MODES.BOX:
                    {
                        for (let ii = 0; ii < 6; ii++) {
                            let clipPlane = view.Data.ClipPlane();
                            item.planes[ii] = clipPlane;
                        }
                        //x
                        {
                            item.planes[0].normal = new VIZCore.Vector3(1, 0, 0);
                            item.planes[0].center = new VIZCore.Vector3(bbox.min.x, bbox.center.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[0].center);

                            handle.axis.x.enable = true;
                            handle.axis.x.visible = true;
                            handle.axis.x.normal.copy(item.planes[0].normal);
                            handle.axis.x.normal.multiplyScalar(-1);

                            handle.object = item.planes[0];
                            item.planes[0].handle = handle;
                        }
                        //-x
                        {
                            item.planes[1].normal = new VIZCore.Vector3(-1, 0, 0);
                            item.planes[1].center = new VIZCore.Vector3(bbox.max.x, bbox.center.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[1].center);

                            handle.axis.x.enable = true;
                            handle.axis.x.visible = true;
                            handle.axis.x.normal.copy(item.planes[1].normal);
                            handle.axis.x.normal.multiplyScalar(-1);

                            handle.object = item.planes[1];
                            item.planes[1].handle = handle;
                        }
                        //y
                        {
                            item.planes[2].normal = new VIZCore.Vector3(0, 1, 0);
                            item.planes[2].center = new VIZCore.Vector3(bbox.center.x, bbox.min.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[2].center);

                            handle.axis.y.enable = true;
                            handle.axis.y.visible = true;
                            handle.axis.y.normal.copy(item.planes[2].normal);
                            handle.axis.y.normal.multiplyScalar(-1);

                            handle.object = item.planes[2];
                            item.planes[2].handle = handle;
                        }
                        //-y
                        {
                            item.planes[3].normal = new VIZCore.Vector3(0, -1, 0);
                            item.planes[3].center = new VIZCore.Vector3(bbox.center.x, bbox.max.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[3].center);

                            handle.axis.y.enable = true;
                            handle.axis.y.visible = true;
                            handle.axis.y.normal.copy(item.planes[3].normal);
                            handle.axis.y.normal.multiplyScalar(-1);

                            handle.object = item.planes[3];
                            item.planes[3].handle = handle;
                        }

                        //z
                        {
                            item.planes[4].normal = new VIZCore.Vector3(0, 0, 1);
                            item.planes[4].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.min.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[4].center);

                            handle.axis.z.enable = true;
                            handle.axis.z.visible = true;
                            handle.axis.z.normal.copy(item.planes[4].normal);
                            handle.axis.z.normal.multiplyScalar(-1);

                            handle.object = item.planes[4];
                            item.planes[4].handle = handle;
                        }

                        //-z
                        {
                            item.planes[5].normal = new VIZCore.Vector3(0, 0, -1);
                            item.planes[5].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[5].center);

                            handle.axis.z.enable = true;
                            handle.axis.z.visible = true;
                            handle.axis.z.normal.copy(item.planes[5].normal);
                            handle.axis.z.normal.multiplyScalar(-1);

                            handle.object = item.planes[5];
                            item.planes[5].handle = handle;
                        }

                    }
                    break;
                case VIZCore.Enum.CLIPPING_MODES.SELECTBOX:
                    {
                        bbox = view.Data.GetSelectedObjectsBBox();

                        item.itemType = VIZCore.Enum.CLIPPING_MODES.BOX; //생성을 위한 기능이므로 BOX 타입으로 변경
                        if (bbox === undefined)
                            return;

                        for (let ii = 0; ii < 6; ii++) {
                            let clipPlane = view.Data.ClipPlane();
                            item.planes[ii] = clipPlane;
                        }
                        //x
                        {
                            item.planes[0].normal = new VIZCore.Vector3(1, 0, 0);
                            item.planes[0].center = new VIZCore.Vector3(bbox.min.x, bbox.center.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[0].center);

                            handle.axis.x.enable = true;
                            handle.axis.x.visible = true;
                            handle.axis.x.normal.copy(item.planes[0].normal);
                            handle.axis.x.normal.multiplyScalar(-1);

                            handle.object = item.planes[0];
                            item.planes[0].handle = handle;
                        }
                        //-x
                        {
                            item.planes[1].normal = new VIZCore.Vector3(-1, 0, 0);
                            item.planes[1].center = new VIZCore.Vector3(bbox.max.x, bbox.center.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[1].center);

                            handle.axis.x.enable = true;
                            handle.axis.x.visible = true;
                            handle.axis.x.normal.copy(item.planes[1].normal);
                            handle.axis.x.normal.multiplyScalar(-1);

                            handle.object = item.planes[1];
                            item.planes[1].handle = handle;
                        }
                        //y
                        {
                            item.planes[2].normal = new VIZCore.Vector3(0, 1, 0);
                            item.planes[2].center = new VIZCore.Vector3(bbox.center.x, bbox.min.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[2].center);

                            handle.axis.y.enable = true;
                            handle.axis.y.visible = true;
                            handle.axis.y.normal.copy(item.planes[2].normal);
                            handle.axis.y.normal.multiplyScalar(-1);

                            handle.object = item.planes[2];
                            item.planes[2].handle = handle;
                        }
                        //-y
                        {
                            item.planes[3].normal = new VIZCore.Vector3(0, -1, 0);
                            item.planes[3].center = new VIZCore.Vector3(bbox.center.x, bbox.max.y, bbox.center.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[3].center);

                            handle.axis.y.enable = true;
                            handle.axis.y.visible = true;
                            handle.axis.y.normal.copy(item.planes[3].normal);
                            handle.axis.y.normal.multiplyScalar(-1);

                            handle.object = item.planes[3];
                            item.planes[3].handle = handle;
                        }

                        //z
                        {
                            item.planes[4].normal = new VIZCore.Vector3(0, 0, 1);
                            item.planes[4].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.min.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[4].center);

                            handle.axis.z.enable = true;
                            handle.axis.z.visible = true;
                            handle.axis.z.normal.copy(item.planes[4].normal);
                            handle.axis.z.normal.multiplyScalar(-1);

                            handle.object = item.planes[4];
                            item.planes[4].handle = handle;
                        }

                        //-z
                        {
                            item.planes[5].normal = new VIZCore.Vector3(0, 0, -1);
                            item.planes[5].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z);

                            let handle = view.Handle.Add(VIZCore.Enum.HANDLER_TYPE.CLIPPING);
                            handle.enable = false;
                            handle.center.copy(item.planes[5].center);

                            handle.axis.z.enable = true;
                            handle.axis.z.visible = true;
                            handle.axis.z.normal.copy(item.planes[5].normal);
                            handle.axis.z.normal.multiplyScalar(-1);

                            handle.object = item.planes[5];
                            item.planes[5].handle = handle;
                        }

                    }
                    break;
            }

            return item;
        }

        /**
        * 단면제거
        * @param {Data.UUIDv4} id: id
        */
        function remove(id) {
            let item = clippingMap.get(id);
            if (item === undefined)
                return;

            for (let ii = 0; ii < item.planes.length; ii++) {
                if (item.planes[ii].handle === undefined)
                    continue;

                view.Handle.Delete(item.planes[ii].handle.id);
            }

            clippingMap.delete(id);
        }

        /**
        * 활성화 단면 그리기 정점 업데이트
        */
        function updateGLVertex() {
            let item = view.Clipping.Get();
            if (item === undefined)
                return;

            let bboxVertex = undefined;
            let xAxis, yAxis, zAxis;

            let useGLOffset = 1; // use = 1, notUse = 0
            switch (item.itemType) {
                case VIZCore.Enum.CLIPPING_MODES.X:
                case VIZCore.Enum.CLIPPING_MODES.Y:
                case VIZCore.Enum.CLIPPING_MODES.Z:
                    {
                        //모델 MinMax로 계산
                        let bbox = getShowObjectsBBox();
                        bboxVertex = view.Util.GetBBox2Vertex(bbox);
                        useGLOffset = 1;
                    }
                    break;
                case VIZCore.Enum.CLIPPING_MODES.CUSTOM:
                    {
                        let bbox = getShowObjectsBBox();
                        bboxVertex = view.Util.GetBBox2Vertex(bbox);

                        useGLOffset = 1;
                    }
                    break;

                case VIZCore.Enum.CLIPPING_MODES.BOX:
                case VIZCore.Enum.CLIPPING_MODES.SELECTBOX:
                    {
                        //Clipping Box 크기로 계산
                        let planeMin;
                        let planeMax;
                        for (let ii = 0; ii < item.planes.length; ii++) {
                            if (ii === 0) {
                                planeMin = new VIZCore.Vector3().copy(item.planes[ii].center);
                                planeMax = new VIZCore.Vector3().copy(item.planes[ii].center);
                            }
                            else {
                                planeMin.min(item.planes[ii].center);
                                planeMax.max(item.planes[ii].center);
                            }
                        }
                        let bbox = new VIZCore.BBox([planeMin.x, planeMin.y, planeMin.z, planeMax.x, planeMax.y, planeMax.z]);

                        // plane 위치 보정
                        item.planes[0].center = new VIZCore.Vector3(bbox.min.x, bbox.center.y, bbox.center.z);
                        item.planes[1].center = new VIZCore.Vector3(bbox.max.x, bbox.center.y, bbox.center.z);
                        item.planes[2].center = new VIZCore.Vector3(bbox.center.x, bbox.min.y, bbox.center.z);
                        item.planes[3].center = new VIZCore.Vector3(bbox.center.x, bbox.max.y, bbox.center.z);
                        item.planes[4].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.min.z);
                        item.planes[5].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z);


                        // 연결된 핸들 위치 보정
                        if (item.planes[0].handle !== undefined)
                            item.planes[0].handle.center = new VIZCore.Vector3(bbox.min.x, bbox.center.y, bbox.center.z);
                        if (item.planes[1].handle !== undefined)
                            item.planes[1].handle.center = new VIZCore.Vector3(bbox.max.x, bbox.center.y, bbox.center.z);
                        if (item.planes[2].handle !== undefined)
                            item.planes[2].handle.center = new VIZCore.Vector3(bbox.center.x, bbox.min.y, bbox.center.z);
                        if (item.planes[3].handle !== undefined)
                            item.planes[3].handle.center = new VIZCore.Vector3(bbox.center.x, bbox.max.y, bbox.center.z);
                        if (item.planes[4].handle !== undefined)
                            item.planes[4].handle.center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.min.z);
                        if (item.planes[5].handle !== undefined)
                            item.planes[5].handle.center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z);

                        bboxVertex = view.Util.GetBBox2Vertex(bbox);
                        useGLOffset = 0;
                    }
                    break;
            }

            if (bboxVertex === undefined)
                return;

            for (let ii = 0; ii < item.planes.length; ii++) {
                zAxis = new VIZCore.Vector3().copy(item.planes[ii].normal);

                xAxis = new VIZCore.Vector3(1, 0, 0);
                if (Math.abs(xAxis.dot(zAxis)) > 0.99)
                    xAxis.set(0, 0, 1);

                yAxis = new VIZCore.Vector3().crossVectors(zAxis, xAxis).normalize();
                xAxis = new VIZCore.Vector3().crossVectors(yAxis, zAxis).normalize();

                let xAxisLenMin, xAxisLenMax, yAxisLenMin, yAxisLenMax;
                for (let jj = 0; jj < 8; jj++) {
                    let vDir = new VIZCore.Vector3().subVectors(bboxVertex[jj], item.planes[ii].center);
                    let xLen = vDir.dot(xAxis);
                    let yLen = vDir.dot(yAxis);

                    if (jj === 0) {
                        xAxisLenMin = xLen;
                        xAxisLenMax = xLen;

                        yAxisLenMin = yLen;
                        yAxisLenMax = yLen;
                    }
                    else {
                        xAxisLenMin = Math.min(xLen, xAxisLenMin);
                        xAxisLenMax = Math.max(xLen, xAxisLenMax);

                        yAxisLenMin = Math.min(yLen, yAxisLenMin);
                        yAxisLenMax = Math.max(yLen, yAxisLenMax);
                    }
                }
                let xMinOffset = Math.max(xAxisLenMin * 0.05, -10);
                let xMaxOffset = Math.min(xAxisLenMax * 0.05, 10);
                let yMinOffset = Math.max(yAxisLenMin * 0.05, -10);
                let yMaxOffset = Math.min(yAxisLenMax * 0.05, 10);

                let xVertexMin = new VIZCore.Vector3().copy(xAxis).multiplyScalar(xAxisLenMin + xMinOffset * useGLOffset);
                let xVertexMax = new VIZCore.Vector3().copy(xAxis).multiplyScalar(xAxisLenMax + xMaxOffset * useGLOffset);
                let yVertexMin = new VIZCore.Vector3().copy(yAxis).multiplyScalar(yAxisLenMin + yMinOffset * useGLOffset);
                let yVertexMax = new VIZCore.Vector3().copy(yAxis).multiplyScalar(yAxisLenMax + yMaxOffset * useGLOffset);

                let current;
                current = new VIZCore.Vector3().addVectors(
                    new VIZCore.Vector3().addVectors(item.planes[ii].center, xVertexMin), yVertexMin);
                item.planes[ii].vertex[0] = current;

                current = new VIZCore.Vector3().addVectors(
                    new VIZCore.Vector3().addVectors(item.planes[ii].center, xVertexMax), yVertexMin);
                item.planes[ii].vertex[1] = current;

                current = new VIZCore.Vector3().addVectors(
                    new VIZCore.Vector3().addVectors(item.planes[ii].center, xVertexMin), yVertexMax);
                item.planes[ii].vertex[2] = current;

                current = new VIZCore.Vector3().addVectors(
                    new VIZCore.Vector3().addVectors(item.planes[ii].center, xVertexMax), yVertexMax);
                item.planes[ii].vertex[3] = current;
            }
        }

        /**
        * 활성화 단면 존재여부 반환
        * @param {Boolean}
        */
        this.IsClipping = function () {
            let clipping = view.Clipping.Get();
            return (clipping !== undefined) ? true : false;
        };

        /**
        * 단면추가
        * @param {String} clippingType: CLIPPING_MODES
        */
        this.CreateClipping = function (clippingType) {

            //현재는 1개의 단면만 생성하도록 함.
            clippingMap.forEach(function (item) {
                remove(item.id);
            });

            let item = add(clippingType);
            updateGLVertex();

            view.Shader.UpdateShader();
           
            view.ViewRefresh();

            return item;
        };

        /**
        * 단면 반환
        * @param {Data.UUIDv4} id: id
        * @return {Data.ClipItem} clipping item
        */
        this.GetClipping = function (id) {
            let clipping = undefined;

            clippingMap.forEach(function (item) {
                if (item.id === id) {
                    clipping = item;
                    return true;
                }
                return false;
            });

            return clipping;
        };

        /**
        * 활성화 단면
        * @return {Data.ClipItem} clipping item
        */
        this.Get = function () {
            let clipping = undefined;

            clippingMap.forEach(function (item) {
                if (item.enable) {
                    clipping = item;
                    return true;
                }
                return false;
            });

            return clipping;
        };

        /**
        * 활성화 단면 업데이트
        */
        this.Update = function () {
            updateGLVertex();
        };

        /**
        * 활성화 단면 반대 방향으로 변경
        */
        this.Inverse = function () {
            let item = view.Clipping.Get();

            if (item === undefined)
                return;

            if (item.itemType === VIZCore.Enum.CLIPPING_MODES.BOX)
                return;

            for (let ii = 0; ii < item.planes.length; ii++) {
                item.planes[ii].normal.multiplyScalar(-1);

                if (item.planes[ii].handle !== undefined) {
                    item.planes[ii].handle.axis.x.normal.multiplyScalar(-1);
                    item.planes[ii].handle.axis.y.normal.multiplyScalar(-1);
                    item.planes[ii].handle.axis.z.normal.multiplyScalar(-1);
                }
            }

            view.ViewRefresh();
        };

        /**
        * 단면 모두 제거
        */
        this.Clear = function () {
            if (clippingMap.size <= 0)
                return;

            clippingMap.forEach(function (value, key, map) {
                remove(value.id);
            });

            view.Shader.UpdateShader();

            view.ViewRefresh();
        };

        /**
         * 단면 보이기/숨기기 설정
         * @param {Data.UUIDv4} id 단면 id
         */
        this.SetShowClipping = function (id, show) {
            let item = view.Clipping.GetClipping(id);

            if (item === undefined)
                return;

            item.visible = show;

            for (let ii = 0; ii < item.planes.length; ii++) {
                if (item.planes[ii].handle !== undefined)
                    item.planes[ii].handle.enable = show;
                item.planes[ii].handle.visible = false;
            }
        };

        /**
       * 해당 좌표가 단면에 잘린상태 여부
       * @param {VIZCore.Vector3()} position : 좌표
       * @returns {Boolean} true = 해당 좌표가 단면에 잘림
       */
        this.IsClippingPosition = function (position) {
            let clipping = view.Clipping.Get();
            if (clipping === undefined)
                return false;

            for (let ii = 0; ii < clipping.planes.length; ii++) {
                let plane = new VIZCore.Plane().setFromNormalAndCoplanarPoint(clipping.planes[ii].normal, clipping.planes[ii].center);

                const distance = plane.distanceToPoint(position);
                if (distance < 0)
                    return true;
            }

            return false;
        };


        /**
         * 단면상자 크기 변경
         * @param {Data.UUIDv4} id 단면 id
         * @param {VIZCore.BBox} bbox  BoundBox
         */
        this.SetClippingBoxSize = function (id, bbox) {
            let item = clippingMap.get(id);
            if (item === undefined)
                return;

            if (item.itemType !== VIZCore.Enum.CLIPPING_MODES.BOX) return;

            bbox.update();
            item.planes[0].center = new VIZCore.Vector3(bbox.min.x, bbox.center.y, bbox.center.z);
            item.planes[1].center = new VIZCore.Vector3(bbox.max.x, bbox.center.y, bbox.center.z);
            item.planes[2].center = new VIZCore.Vector3(bbox.center.x, bbox.min.y, bbox.center.z);
            item.planes[3].center = new VIZCore.Vector3(bbox.center.x, bbox.max.y, bbox.center.z);
            item.planes[4].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.min.z);
            item.planes[5].center = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z);
            updateGLVertex();
        };

        /**
         * 단면상자 크기 반환
         * @param {Data.UUIDv4} id 단면 id
         * @returns {VIZCore.BBox}
         */
        this.GetClippingBoxSize = function (id) {

            let bbox = new VIZCore.BBox();

            let item = clippingMap.get(id);
            if (item === undefined)
                return bbox;

            if (item.itemType !== VIZCore.Enum.CLIPPING_MODES.BOX) return bbox;

            for (let i = 0; i < 6; i++) {

                if (i === 0) {
                    bbox.min.copy(item.planes[i].center);
                    bbox.max.copy(item.planes[i].center);
                }
                else {
                    bbox.min.min(item.planes[i].center);
                    bbox.max.max(item.planes[i].center);
                }
            }
            bbox.update();

            return bbox;
        };

        /**
        * 단면에 잘린 boundbox 재설정
        * @param {Data.BBox()} bbox : BoundBox
        * @returns {Data.BBox()} undefined = 해당 boundbox가 잘면 잘린 상태
        */
        this.RebuildClippingBoundBox = function (bbox) {

            let clipping = view.Clipping.Get();
            if (clipping === undefined)
                return bbox;

            let rebuildSuccess = false;

            let firstBBox = true;
            let minBox = new VIZCore.Vector3().copy(bbox.min);
            let maxBox = new VIZCore.Vector3().copy(bbox.max);
            let bboxVertex = view.Util.GetBBox2Vertex(bbox);

            for (let i = 0; i < clipping.planes.length; i++) {
                const plane = new VIZCore.Plane().setFromNormalAndCoplanarPoint(clipping.planes[i].normal, clipping.planes[i].center);
                let clippingNum = 0;

                for (let j = 0; j < 8; j++) {
                    const distance = plane.distanceToPoint(bboxVertex[j]);
                    if (distance < 0) {
                        clippingNum++;
                    }
                }

                //해당 boundbox는 모두 단면에 잘림
                if (clippingNum === 8) {
                    continue;
                }

                rebuildSuccess = true;

                for (let j = 0; j < 8; j++) {
                    const distance = plane.distanceToPoint(bboxVertex[j]);
                    if (distance < 0) {
                        const subPosition = new VIZCore.Vector3().copy(clipping.planes[i].normal).multiplyScalar(distance);
                        const newPosition = new VIZCore.Vector3().subVectors(bboxVertex[j], subPosition);

                        //boundbox 재측정
                        if (firstBBox) {
                            firstBBox = false;
                            minBox.copy(newPosition);
                            maxBox.copy(newPosition);
                        }
                        else {
                            minBox.min(newPosition);
                            maxBox.max(newPosition);
                        }
                    }
                    else {
                        //boundbox 재측정
                        if (firstBBox) {
                            firstBBox = false;
                            minBox.copy(bboxVertex[j]);
                            maxBox.copy(bboxVertex[j]);
                        }
                        else {
                            minBox.min(bboxVertex[j]);
                            maxBox.max(bboxVertex[j]);
                        }
                    }
                }
            }

            if (firstBBox)
                return undefined;

            return new VIZCore.BBox([minBox.x, minBox.y, minBox.z, maxBox.x, maxBox.y, maxBox.z]);
        };

        /**
        * 마우스 위치의
        * 단면 Plane 정보 및 해당 Plane의 Handle 활성화
        * @param {Number} x : mouse X
        * @param {Number} y : mouse Y
        */
        this.PickPlane = function (x, y) {
            //GLVertex 정보를 가지고 pick 여부 확인
            if (clippingMap.size <= 0)
                return;

            //let item = view.Clipping.Get();
            //if (item === undefined) return;
            const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
            const matMVP = new VIZCore.Matrix4().multiplyMatrices(view.Camera.projectionMatrix, matMVMatrix);

            let mouse;
            // if (view.Camera.perspectiveView)
            //     mouse = new VIZCore.Vector3(x, y, 0.0);
            // else
            //     mouse = new VIZCore.Vector3(x, y, -1.0);

            mouse = new VIZCore.Vector3(x, y, -1.0);

            let screenRay1 = new VIZCore.Vector3(mouse.x, mouse.y, mouse.z);
            let screenRay2 = new VIZCore.Vector3(mouse.x, mouse.y, 1.0);

            let worldRay1, worldRay2;
            worldRay1 = view.Camera.screen2WorldWithMatrix(matMVP, screenRay1);
            worldRay2 = view.Camera.screen2WorldWithMatrix(matMVP, screenRay2);

            clippingMap.forEach(function (value, key, map) {
                if (!value.enable)
                    return;
                //if (!value.visible) return;
                //for (let ii = 0; ii < value.planes.length; ii++) {
                //    if (value.planes[ii].handle === undefined) continue;
                //    if (!value.planes[ii].handle.enable) continue;
                //
                //    //value.planes[ii].handle.visible = false;
                //    value.planes[ii].handle.enable = false;
                //    view.Renderer.Render();
                //}
                //if (item !== undefined && item.id === value.id) {
                let hitNum = -1;
                let bHit = false;
                let minDist, minPick;
                for (let ii = 0; ii < value.planes.length; ii++) {
                    if (value.planes[ii].vertex.length <= 0)
                        continue;
                    if (value.planes[ii].visible === false)
                        continue;

                    let result1 = view.Util.LineToTriangleIntersections(worldRay1, worldRay2, value.planes[ii].vertex[0], value.planes[ii].vertex[1], value.planes[ii].vertex[2]);
                    if (result1[0] === 1) {
                        let pickLength = (new VIZCore.Vector3().subVectors(worldRay1, result1[1])).length();
                        if (bHit === false) {
                            bHit = true;
                            hitNum = ii;
                            minPick = result1[1];
                            minDist = pickLength;
                        }
                        else if (pickLength < minDist) {
                            hitNum = ii;
                            minPick = result1[1];
                            minDist = pickLength;
                        }
                        continue;
                    }

                    let result2 = view.Util.LineToTriangleIntersections(worldRay1, worldRay2, value.planes[ii].vertex[1], value.planes[ii].vertex[2], value.planes[ii].vertex[3]);
                    if (result2[0] === 1) {
                        let pickLength = (new VIZCore.Vector3().subVectors(worldRay1, result2[1])).length();
                        if (bHit === false) {
                            bHit = true;
                            hitNum = ii;
                            minPick = result2[1];
                            minDist = pickLength;
                        }
                        else if (pickLength < minDist) {
                            hitNum = ii;
                            minPick = result2[1];
                            minDist = pickLength;
                        }
                        continue;
                    }
                }

                if (bHit === true && value.planes[hitNum].handle !== undefined) {
                    if (value.planes[hitNum].handle.enable)
                        return;

                    for (let ii = 0; ii < value.planes.length; ii++) {
                        if (value.planes[hitNum].handle.state !== VIZCore.Enum.HANDLE_MOUSE_STATE.DOWN)
                            value.planes[ii].handle.enable = false;
                    }

                    //value.planes[hitNum].handle.visible = false;
                    value.planes[hitNum].handle.enable = true;
                    view.Renderer.Render();

                    let handleDisableTimer = function () {
                        if (value.planes[hitNum].handle === undefined)
                            return;

                        if (value.planes[hitNum].handle.state === VIZCore.Enum.HANDLE_MOUSE_STATE.DOWN) {
                            setTimeout(handleDisableTimer, 3000);
                        }
                        else {
                            value.planes[hitNum].handle.enable = false;
                            view.Renderer.Render();
                        }
                    };
                    setTimeout(handleDisableTimer, 3000);
                }
                //} //if(item.id === value.id)
            });
        };

        this.AddClippingItem = function (item) {
            clippingMap.set(item);
        };


        /**
        * '보이기' 되어있는 object들의 Boundbox
        * @return {VIZCore.BBox} bbox  : bound box
        */
        function getShowObjectsBBox() {
            // BBox 재계산
            let min = undefined;
            let max = undefined;
            let bbox = undefined;

            let bodies = [];
            for (let i = 0; i < view.Data.Objects.length; i++) {
                let object = view.Data.Objects[i];
                for (let j = 0; j < object.tag.length; j++) {
                    let body = object.tag[j];
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                    if (action.visible === true)
                        bodies.push(body);
                }
            }

            if (bodies.length > 0) {
                const nodeBBox = view.Data.GetBBoxFormMatrix(bodies);
                min = new VIZCore.Vector3().copy(nodeBBox.min);
                max = new VIZCore.Vector3().copy(nodeBBox.max);
            }

            if (min !== undefined && max !== undefined) {
                bbox = new VIZCore.BBox([min.x, min.y, min.z, max.x, max.y, max.z]);
            }
            else{
                bbox = view.Data.GetBBox();
            }

            return bbox;
        }
    }
}

export default Clipping;
