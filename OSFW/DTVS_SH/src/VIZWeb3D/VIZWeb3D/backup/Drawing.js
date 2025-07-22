/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Drawing = function (VIEW, camera, renderer) {
    var scope = this;

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    // Scene
    var scene = new THREE.Scene();

    var view = VIEW;

    var objDrawing = new THREE.Object3D();
    var line;
    var lineArray = [];
    var positions = [];

    var mouseDown = false;
    var pressShift = false;
    var mapDrawing = new Map();
    var mapGroup = new Map();
    var group;
    var groupItem = function () {
        var item = {
            id: view.Data.UUIDv4(),
            items : []
        };
        return item;
    };
    var drawing;
    var drawingItem = function () {
        var item = {
            id: view.Data.UUIDv4(),
            type: scope.DrawingType,
            color: {
                Line: { r: view.Configuration.Drawing.Color.Line.r, g: view.Configuration.Drawing.Color.Line.g, b: view.Configuration.Drawing.Color.Line.b, a: view.Configuration.Drawing.Color.Line.a},
            },
            width: view.Configuration.Drawing.Width,
            obj: {
                line: null,
            }
        };
        return item;
    };

    init();
    function init() {
        scene.matrixAutoUpdate = false;
        scene.add(camera);
        scene.add(objDrawing);
    }

    function createGeometry() {
        lineArray = [];
        var geometry = new THREE.Geometry();

        let gFig = new MeshLine();
        gFig.setGeometry(geometry);
        
        //gFig.setGeometry(geometry, function (p) { return 1 - p; });
        //gFig.setGeometry(geometry, function (p) { return 1 * Maf.parabola(p, 1)}); 
        //gFig.setGeometry(geometry, function (p) { return 2 + Math.sin(50 * p)});

        let resolution = new THREE.Vector2(100, 100); //화면비율 width, height
        let opt = {
            color: new THREE.Color(view.Configuration.Drawing.Color.Line.r / 255, view.Configuration.Drawing.Color.Line.g / 255, view.Configuration.Drawing.Color.Line.b / 255), //컬러 부분은 THREE.Color 써야한다.
            opacity: view.Configuration.Drawing.Color.Line.a,
            resolution: resolution,
            lineWidth: view.Configuration.Drawing.Width / 1000, //화면대비 비율로 굵기가 정해진다. (대충 1000으로 정함)
            transparent : true,
            depthTest : false,
            side: THREE.DoubleSide,
        };
        var material = new MeshLineMaterial(opt);

        line = new THREE.Mesh(gFig.geometry, material);

        drawing = drawingItem();
        drawing.obj.line = line;
        addDrawingMap();
        line.userData = drawing;

        if (group !== undefined)
            group.items.push(line);

        objDrawing.add(line);
    }

    function geometryCircle(vPos1, vPos2) {
        var arrposition = [];
        var vPos = new THREE.Vector2().subVectors(vPos2, vPos1);
        //var fHRadius = Math.abs(vPos.x / 2.0);
        //var fVRadius = Math.abs(vPos.y / 2.0);
        //var vCenter = new THREE.Vector2().addVectors(vPos1, vPos2).divideScalar(2);

        var fHRadius = Math.abs(vPos.x);
        var fVRadius = Math.abs(vPos.y);

        var fRadius = vPos2.distanceTo(vPos1);
        var vCenter = new THREE.Vector2().copy(vPos1);
        for (var  j = 0; j <= 360 ; j += 6 )
        {
            var angle = j / 180.0 * 3.141592654;
            var x, y;
            if (pressShift) {
                x = vCenter.x + Math.cos(angle) * fRadius;
                y = vCenter.y + Math.sin(angle) * fRadius;
            }
            else {
                x = vCenter.x + Math.cos(angle) * fHRadius;
                y = vCenter.y + Math.sin(angle) * fVRadius;
            }

            var mouse = view.Data.GetMousePos_1(x, y);

            var vector = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(camera);
            arrposition.push(vector.x, vector.y, vector.z);
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrposition, 3));
        geometry.computeBoundingSphere();

        return geometry;
    }

    function geometryQuadrangle(vPos1, vPos2) {
        var arrposition = [];

        var pos1 = view.Data.GetMousePos_1(vPos1.x, vPos1.y);
        var pos2 = view.Data.GetMousePos_1(vPos2.x, vPos2.y);

        var vector = new THREE.Vector3(pos1.x, pos1.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);
        vector = new THREE.Vector3(pos1.x, pos2.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);
        vector = new THREE.Vector3(pos2.x, pos2.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);
        vector = new THREE.Vector3(pos2.x, pos1.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);
        vector = new THREE.Vector3(pos1.x, pos1.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrposition, 3));
        geometry.computeBoundingSphere();

        return geometry;
    }

    function geometryLine(vPos1, vPos2) {
        var arrposition = [];

        var pos1 = view.Data.GetMousePos_1(vPos1.x, vPos1.y);
        var pos2 = view.Data.GetMousePos_1(vPos2.x, vPos2.y);

        var vector = new THREE.Vector3(pos1.x, pos1.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);
        vector = new THREE.Vector3(pos2.x, pos2.y, 0).unproject(camera);
        arrposition.push(vector.x, vector.y, vector.z);

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrposition, 3));
        geometry.computeBoundingSphere();

        return geometry;
    }

    function updatePositions() {
        var geometry;
        if (scope.DrawingType === DRAWING_TYPES.FREE) {
            geometry = new THREE.Geometry();
            for (var i = 0; i < lineArray.length; i++) {
                geometry.vertices.push(new THREE.Vector3(lineArray[i].x, lineArray[i].y, lineArray[i].z));
            }
        }

        if (scope.DrawingType === DRAWING_TYPES.CIRCLE) {
            geometry = geometryCircle(lineArray[0], lineArray[1]);
        }

        if (scope.DrawingType === DRAWING_TYPES.QUADRANGLE) {
            geometry = geometryQuadrangle(lineArray[0], lineArray[1]);
        }

        if (scope.DrawingType === DRAWING_TYPES.LINE) {
            geometry = geometryLine(lineArray[0], lineArray[1]);
        }

        let gFig = new MeshLine();
        gFig.setGeometry(geometry);
        //gFig.setGeometry(geometry, function (p) { return 1 - p; });
        //gFig.setGeometry(geometry, function (p) { return 1 * Maf.parabola(p, 1)}); 
        //gFig.setGeometry(geometry, function (p) { return 2 + Math.sin(50 * p)});
        line.geometry = gFig.geometry;
    }

    function updatePositions1() {
        if (scope.DrawingType === DRAWING_TYPES.FREE) {
            var geometry = new THREE.LineGeometry();
            positions = [];
            for (var i = 0; i < lineArray.length; i++) {
                positions.push(lineArray[i].x, lineArray[i].y, lineArray[i].z);
            }
            geometry.setPositions(positions);
            console.log(positions.length);

            matLine = new THREE.LineMaterial({
                color: new THREE.Color(view.Configuration.Drawing.Color.Line.r / 255, view.Configuration.Drawing.Color.Line.g / 255, view.Configuration.Drawing.Color.Line.b / 255), //컬러 부분은 THREE.Color 써야한다.,
                linewidth: view.Configuration.Drawing.Width / 1000, // in pixels
                //vertexColors: THREE.VertexColors,
                //resolution:  // to be set by renderer, eventually
                dashed: false
            });
            matLine.transparent = true;
            matLine.depthTest = false;
            matLine.uniforms.opacity = view.Configuration.Drawing.Color.Line.a;

            var line1 = new THREE.Line2(geometry, matLine);
            objDrawing.add(line1);
        }
    }

    function addDrawingMap() {
        mapDrawing.set(drawing.id, drawing);
    }

    // API
    this.Option = {
        get 'PressShift'() {
            return pressShift;
        },
        set 'PressShift'(v) {
            pressShift = v;
            if (mouseDown) {
                updatePositions();
                view.RenderEvent = true;
            }
        }
    };

    this.DrawingMode = false;
    this.DrawingType = DRAWING_TYPES.NONE;

    this.Start = function (type) {
        // Add Group
        group = new groupItem();
        mapGroup.set(group.id, group);

        scope.DrawingMode = true;
        scope.DrawingType = type;

        for (var i = 0; i < objDrawing.children.length; i++) {
            objDrawing.children[i].visible = false;
        }
    };

    this.Continue = function (type) {
        scope.DrawingMode = true;
        scope.DrawingType = type;
    };

    this.End = function () {
        scope.DrawingMode = false;
        scope.DrawingType = DRAWING_TYPES.NONE;

        scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
    };

    this.DeleteAll = function () {
        //function deleteItem(value, key, map) {
        //    if (value !== undefined) {
        //        view.Data.Dispose(value.obj.line);
        //    }
        //}
        //mapDrawing.forEach(deleteItem);
        //mapDrawing.clear();

        for (var i = group.items.length - 1; i >= 0; i--) {
            view.Data.Dispose(group.items[i]);
            group.items.splice(i);
        }

        //objDrawing.visible = false;

        view.Render();
    };

    this.onMouseDown = function (event) {
        var isRightMB;
        event = event || window.event;

        if ("which" in event)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = event.which === 3;
        else if ("button" in event)  // IE, Opera 
            isRightMB = event.button === 2;

        if (isRightMB)
            return;

        var mouse = new THREE.Vector2();
        if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
            var x = event.changedTouches[0].pageX;
            var y = event.changedTouches[0].pageY;
            mouse.set(x, y);
        }
        else
            mouse.set(event.clientX, event.clientY);

        if (scope.DrawingType === DRAWING_TYPES.FREE) {
            mouseDown = true;
            createGeometry();
        }
        if (scope.DrawingType === DRAWING_TYPES.CIRCLE
            || scope.DrawingType === DRAWING_TYPES.QUADRANGLE
            || scope.DrawingType === DRAWING_TYPES.LINE) {
            mouseDown = true;
            createGeometry();
            
            lineArray.push(mouse);
            lineArray.push(mouse);
        }
    };

    this.onMouseMove = function (event) {
        if (mouseDown) {
            if (renderer) {

                var mouse = new THREE.Vector2();
                if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
                    var x = event.changedTouches[0].pageX;
                    var y = event.changedTouches[0].pageY;
                    mouse.set(x, y);
                }
                else
                    mouse.set(event.clientX, event.clientY);

                if (scope.DrawingType === DRAWING_TYPES.FREE) {
                    mouse = view.Data.GetMousePos_1(mouse.x, mouse.y);
                    var vector = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(camera);

                    lineArray.push(vector);
                    updatePositions();
                    line.geometry.attributes.position.needsUpdate = true;
                    view.RenderEvent = true;
                }
                if (scope.DrawingType === DRAWING_TYPES.CIRCLE
                    || scope.DrawingType === DRAWING_TYPES.QUADRANGLE
                    || scope.DrawingType === DRAWING_TYPES.LINE) {
                    
                    lineArray[1] = mouse;

                    updatePositions();
                    view.RenderEvent = true;
                }
            }
        }
    };

    this.onMouseUp = function (event) {
        mouseDown = false;
    };

    this.Render = function () {
        if (scope.DrawingMode)
        {
            renderer.clearDepth();
            renderer.render(scene, camera);
        }
    };
    
};