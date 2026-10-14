/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Clipping = function (scene, camera, renderer, control, object, edge, data) {

    var scope = this;

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    var objModel = object;
    var objEdge = edge;
    var hiding = null;
    var defaultClipValue = 0;
    var controls = control;
    var _enable = false;
    var _inverse = false;
    var datamng = data;
    //option_Clipping = {
    //    clipIntersection: true,
    //    planeConstant: 0,
    //    showHelpers: false
    //};

    // API
    this.Option = {
        get 'Visible'() {
            return objClipping.visible;
        },
        set 'Visible'(v) {
            objClipping.visible = v;
            eventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    };

    var changeEvent = { type: "change" };

    var objClipping = null;
    var clipPlanes = [];
    var objDrag = [];
    // 활성 클리핑 면
    var enabled_Plane = null;
    var enabled_PlaneType = null;
    var xPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    var yPlane = new THREE.Plane(new THREE.Vector3(0, - 1, 0), 0);
    var zPlane = new THREE.Plane(new THREE.Vector3(0, 0, - 1), 0);

    globalPlane = new THREE.Plane(new THREE.Vector3(- 1, 0, 0), 0.1); 

    var xPlaneMesh = null;
    var yPlaneMesh = null;
    var zPlaneMesh = null;

    init();
    function init() {
        
        objClipping = new THREE.Object3D();

        //var globalPlanes = [globalPlane],
        //    Empty = Object.freeze([]);
        //renderer.clippingPlanes = globalPlanes;

        objClipping.visible = true;

        scene.add(objClipping);

        addControls();
    }

    function addControls() {
        controls.addEventListener('start', function () {
            cancelHideTransform();
        });
        controls.addEventListener('end', function () {
            delayHideTransform();
        });

        transformControl = new THREE.TransformControls(camera, renderer.domElement);
        transformControl.showX = false;
        transformControl.showY = false;
        transformControl.showZ = false;
        //transformControl.addEventListener('change', this.Render);
        transformControl.addEventListener('change', function (event) {
            // 화면 갱신 이벤트 발생
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        transformControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        scene.add(transformControl);
        // Hiding transform situation is a little in a mess :()
        transformControl.addEventListener('change', function () {
            cancelHideTransform();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        transformControl.addEventListener('mouseDown', function () {
            defaultClipValue = clipPlanes[0].constant;
            cancelHideTransform();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        transformControl.addEventListener('mouseUp', function () {
            delayHideTransform();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        transformControl.addEventListener('objectChange', function () {
            updateClippingPlanes();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });

        dragcontrols = new THREE.DragControls(objDrag, camera, renderer.domElement);
        dragcontrols.enabled = false;
        dragcontrols.addEventListener('hoveron', function (event) {
            transformControl.attach(event.object);
            cancelHideTransform();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
        dragcontrols.addEventListener('hoveroff', function () {
            delayHideTransform();
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        });
    }

    function delayHideTransform() {
        cancelHideTransform();
        hideTransform();
    }
    function hideTransform() {
        hiding = setTimeout(function () {
            transformControl.detach(transformControl.object);
        }, 2500);
    }
    function cancelHideTransform() {
        if (hiding) clearTimeout(hiding);
    }
    
    function updateClippingPlanes() {
        var offset = new THREE.Vector3();
        offset.copy(transformControl.pointEnd).sub(transformControl.pointStart);

        if (_inverse) {
            offset.x *= -1;
            offset.y *= -1;
            offset.z *= -1;
        }
    
        //console.log('offset : ' + offset.x);
        if (enabled_PlaneType === CLIPPING_MODES.X)
            clipPlanes[0].constant = defaultClipValue + offset.x;
        else if (enabled_PlaneType === CLIPPING_MODES.Y)
            clipPlanes[0].constant = defaultClipValue + offset.y;
        else if (enabled_PlaneType === CLIPPING_MODES.Z)
            clipPlanes[0].constant = defaultClipValue + offset.z;

        //console.log('plane : ' + clipPlanes[0].constant);

        //updateMaterial();

    }

    function setClippingPlane(obj) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh) {
                obj.children[i].material.clippingPlanes = clipPlanes;
                //obj.children[i].material.clipIntersection = false;
                obj.children[i].material.clipShadows = true;

            }
            else if (obj.children[i] instanceof THREE.LineSegments) {
                obj.children[i].material.clippingPlanes = clipPlanes;
                //obj.children[i].material.clipIntersection = false;
                obj.children[i].material.clipShadows = true;

            }
            else {
                setClippingPlane(obj.children[i]);
            }
        }
    }

    function updateMaterial() {
        datamng.Materials.hiddenline_basic.clippingPlanes = clipPlanes;
        //obj.children[i].material.clipIntersection = false;
        datamng.Materials.hiddenline_basic.clipShadows = true;
    }


    this.UpdateModel = function (obj, init) {
        objModel = obj;
        let box = this.BoundingBox(objModel);
        //let sphere = box.getBoundingSphere();
        //let centerPoint = sphere.center;
        var centerPoint = new THREE.Vector3((box.max.x + box.min.x) / 2, (box.max.y + box.min.y) / 2, (box.max.z + box.min.z) / 2);
        if (init) {
            xPlane.constant = centerPoint.x;
            yPlane.constant = centerPoint.y;
            zPlane.constant = centerPoint.z;
        }
        
        setClippingPlane(objModel);
        setClippingPlane(objEdge);

        updateMaterial();
    },

        
    this.BoundingBox = function (obj) {

        var me = this;
        // 바운딩 박스 계산
        if (obj instanceof THREE.Mesh) {
            if (obj.visible) {
                var geometry = obj.geometry;
                geometry.computeBoundingBox();
                return geometry.boundingBox;
            }
        }

        if (obj instanceof THREE.Object3D) {

            var bb = new THREE.Box3();
            for (var i = 0; i < obj.children.length; i++) {
                bb.union(me.BoundingBox(obj.children[i]));
            }
            return bb;
        }

    },

    this.Enable = function (enable, type) {
        _enable = enable;
        if (enabled_PlaneType === type)
            return;

        if (enabled_Plane !== null) {
            transformControl.detach(transformControl.object);
            objClipping.remove(enabled_Plane);
            objDrag.splice(0, 1);
            enabled_PlaneType = null;
            enabled_Plane = null;
        }
        clipPlanes = [];
        if (enable) {

            let box = this.BoundingBox(objModel);
            let sphere = box.getBoundingSphere();
            let centerPoint = sphere.center;

            var x = box.max.x - box.min.x;
            var y = box.max.y - box.min.y;
            var z = box.max.z - box.min.z;
            var x_offset = x * 0.1;
            var y_offset = y * 0.1;
            var z_offset = z * 0.1;

            if (type === CLIPPING_MODES.X) {
                transformControl.showX = true;
                transformControl.showY = false;
                transformControl.showZ = false;

                clipPlanes.push(xPlane);

                // 좌표 평면 추가
                var xPlaneMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(z + z_offset, y + y_offset)
                    , new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false}));
                
                xPlaneMesh.rotation.y = Math.PI / 2;
                if (_inverse)              
                    xPlaneMesh.position.set(-xPlane.constant, centerPoint.y, centerPoint.z);
                else
                    xPlaneMesh.position.set(xPlane.constant, centerPoint.y, centerPoint.z);
                objClipping.add(xPlaneMesh);

                objDrag.push(xPlaneMesh);

                enabled_Plane = xPlaneMesh;
                enabled_PlaneType = CLIPPING_MODES.X;

                defaultClipValue = -objModel.position.x;

                //objClipping.visible = scope.Option.Visible;
                objClipping.visible = true;
            }
            else if (type === CLIPPING_MODES.Y) {
                transformControl.showX = false;
                transformControl.showY = true;
                transformControl.showZ = false;
                clipPlanes.push(yPlane);

                // 좌표 평면 추가
                var yPlaneMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(x + x_offset, z + z_offset)
                    , new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
                
                yPlaneMesh.rotation.x = Math.PI / 2;

                if (_inverse)
                    yPlaneMesh.position.set(centerPoint.x, -yPlane.constant, centerPoint.z);
                else
                    yPlaneMesh.position.set(centerPoint.x, yPlane.constant, centerPoint.z);
                
                
                objClipping.add(yPlaneMesh);

                objDrag.push(yPlaneMesh);

                enabled_Plane = yPlaneMesh;
                enabled_PlaneType = CLIPPING_MODES.Y;

                defaultClipValue = -objModel.position.y;

                //objClipping.visible = scope.Option.Visible;
                objClipping.visible = true;
            }
            else {
                transformControl.showX = false;
                transformControl.showY = false;
                transformControl.showZ = true;

                clipPlanes.push(zPlane);

                // 좌표 평면 추가
                var zPlaneMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(x + x_offset, y + y_offset)
                    , new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false}));

                if (_inverse)
                    zPlaneMesh.position.set(centerPoint.x, centerPoint.y, -zPlane.constant);
                else
                    zPlaneMesh.position.set(centerPoint.x, centerPoint.y, zPlane.constant);

                objClipping.add(zPlaneMesh);

                objDrag.push(zPlaneMesh);

                enabled_Plane = zPlaneMesh;
                enabled_PlaneType = CLIPPING_MODES.Z;

                defaultClipValue = -objModel.position.z;

                //objClipping.visible = scope.Option.Visible;
                objClipping.visible = true;
            }
        }

        setClippingPlane(objModel);
        setClippingPlane(objEdge);

        updateMaterial();

        eventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
    };

    this.Inverse = function () {

        if (enabled_Plane !== null) {
            _inverse = !_inverse;
            xPlane.normal.x = -xPlane.normal.x;
            xPlane.constant = -xPlane.constant; 
            yPlane.normal.y = -yPlane.normal.y;
            yPlane.constant = -yPlane.constant;
            zPlane.normal.z = -zPlane.normal.z;
            zPlane.constant = -zPlane.constant;
            if (enabled_PlaneType === CLIPPING_MODES.X)
                defaultClipValue = xPlane.constant;
            else if (enabled_PlaneType === CLIPPING_MODES.Y)
                defaultClipValue = yPlane.constant;
            else 
                defaultClipValue = zPlane.constant;
            
            //this.Enable(_enable, enabled_PlaneType);
        }

        eventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
    };

    this.GetClipInfo = function(){
        var info = {
            enable: enabled_Plane,
            type: enabled_PlaneType,
            inverse: _inverse,
            value: clipPlanes.length === 0? 0 : clipPlanes[0].constant
        };
        return info;
    };
};

