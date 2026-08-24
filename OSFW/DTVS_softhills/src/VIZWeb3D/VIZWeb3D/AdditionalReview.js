/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.AdditionalReview = function (VIEW, camera, renderer) {
    var scope = this;

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    // Scene
    let scene = new THREE.Scene();
    let camera_review = new THREE.OrthographicCamera(-50, 50, 50, -50, -50, 50);
    // Review Camera
    //var camera_reviewSize = 200;
    //var camera_reviewNear = -200;
    //var camera_reviewFar = 200;
    //var camera_review = new THREE.OrthographicCamera(-camera_reviewSize, camera_reviewSize, camera_reviewSize, -camera_reviewSize, camera_reviewNear, camera_reviewFar);

    var view = VIEW;

    var objAxis = new THREE.Object3D();
    var objEdge = new THREE.Object3D();

    let visible_Axis = true;
    let visible_Edge = true;
    let visible_Dot = true;

    let mapAxis = new Map();
    let mapEdge = new Map();
  
    init();
    function init() {
        scene.matrixAutoUpdate = false;
        scene.add(camera);
        scene.add(objAxis);
        scene.add(objEdge);

        var vCenter = new THREE.Vector3(0, 0, 0);
        var vUp = new THREE.Vector3(0, 0, 1);
        var vLat = new THREE.Vector3(0, 0, 0);

        var LightDir = new THREE.Vector3().subVectors(vUp, vCenter);

        LightDir.applyAxisAngle(vLat, 30 / 180.0 * 3.141592);
        LightDir.applyAxisAngle(vUp, 10 / 180.0 * 3.141592);
        var dirUp = LightDir;

        // 조명
        var lightCoordinate1 = new THREE.DirectionalLight(0xffffff, 1);
        var lightCoordinatePos1 = new THREE.Vector3(dirUp.x, dirUp.y, dirUp.z);
        lightCoordinate1.position.copy(lightCoordinatePos1);
        scene.add(lightCoordinate1);

        var lightCoordinatePos2 = new THREE.Vector3(-dirUp.x, -dirUp.y, -dirUp.z);
        var lightCoordinate2 = new THREE.DirectionalLight(0xffffff, 1);
        lightCoordinate2.position.copy(lightCoordinatePos2);
        scene.add(lightCoordinate2);

        scene.matrixAutoUpdate = false;
        //camera_review = camera.cameraO.clone();
        scene.add(camera_review);
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
            transparent: true,
            depthTest: false,
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

    function geometryLine(arrPos) {
      
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrPos, 3));
        geometry.computeBoundingSphere();

        return geometry;
    }

    function setReviewCamera(rect) {
        var width = rect.width;
        var height = rect.height;

        width /= 2.0;
        height /= 2.0;

        camera_review.left = -width;
        camera_review.right = width;
        camera_review.top = height;
        camera_review.bottom = -height;

        camera_review.updateProjectionMatrix();
    }
 

    

    this.DrawingMode = false;
    this.DrawingType = DRAWING_TYPES.NONE;

    

    this.DeleteAll = function () {
      

        for (var i = group.items.length - 1; i >= 0; i--) {
            view.Data.Dispose(group.items[i]);
            group.items.splice(i);
        }

        view.Render();
    };

   

    this.Render = function () {
        //camera_review = camera.clone();
        //var rect = view.Container.getBoundingClientRect();
        //renderer.setViewport(0, 0, rect.width, rect.height);

        //// 2D 카메라 설정
        //setReviewCamera(rect);
        
        objEdge.visible = visible_Edge;
        objAxis.visible = false;
        renderer.render(scene, camera);
        renderer.clearDepth();
        objEdge.visible = false;
        objAxis.visible = visible_Axis;
        update();
        renderer.render(scene, camera);
     
    };

    this.Item_Axis = function () {
        let item = {
            id: view.Data.UUIDv4(),
            visible: true,
            matrix: new THREE.Matrix4(),
            name: '',
            mesh: undefined
        };

        return item;
    };

    this.Item_Edge = function () {
        let item = {
            id: view.Data.UUIDv4(),
            visible: true,
            nType: undefined,
            vtArray: [],
            color: undefined,
            mesh: undefined
        };

        return item;
    };

    this.AddAxis = function (axis) {
               
        let obj = view.Coordinate.GetCoordi(axis.name);
        //obj.matrix.copy(axis.matrix);
        //obj.matrixAutoUpdate = true;
        obj.setRotationFromMatrix(axis.matrix);
        obj.position.set(axis.matrix.elements[12], axis.matrix.elements[13], axis.matrix.elements[14]);
        
        axis.mesh = obj;
        objAxis.add(obj);
        mapAxis.set(axis.id, axis);
    };
    var oldradius = 0;
    function getCameraRadius(pos, offset) {
        var v1 = new THREE.Vector3().copy(pos).project(camera);
        v1.y -= offset;
        var v2 = v1.unproject(camera);
        var v = new THREE.Vector3();
        v.subVectors(pos, v2);

        return v.length();
    }

    var offset = 0.002;
    //var offset = 0.012;
    function update() {
        

        let calc = function (value, key, map) {
            var radius = getCameraRadius(value.mesh.position, offset);

            if (oldradius !== radius) {
                //var ratio = radius / 60;
                var ratio = radius;// / 5;
                //pivot.scale.set(ratio, ratio, ratio);
                value.mesh.scale.set(ratio, ratio, ratio);
            }
            else
                oldradius = radius;
        };
        mapAxis.forEach(calc);
        
    }
    this.SetAxisFactor = function (factor) {
        offset *= factor;
    };
    this.AddEdge = function (edge) {
       

        //const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

        const material = new THREE.LineBasicMaterial({ color: new THREE.Color(edge.color[0], edge.color[1], edge.color[2]), opacity: edge.color[3] });

        const points = [];
        for (var i = 0; i < edge.vtArray; i = i + 3) {
            points.push(new THREE.Vector3(edge.vtArray[i], edge.vtArray[i+1], edge.vtArray[i+2]));
        }
        
       

        //const geometry = new THREE.BufferGeometry().setFromPoints(points);
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(edge.vtArray, 3));
        geometry.computeBoundingSphere();

        const line = new THREE.Line(geometry, material);
       
        //line.visible = false;
        edge.mesh = line;
        objEdge.add(line);

        mapEdge.set(edge.id, edge);
    };

    this.ShowEdge = function (show) {

        let set = function (value, key, map) {
            if (value.nType === 11)
            value.mesh.visible = show;
        };
        mapEdge.forEach(set);

        //objEdge.visible = show;
        visible_Edge = show;

        view.RenderEvent = true;
    };
    this.ShowDot = function (show) {

        let set = function (value, key, map) {
            if (value.vtArray === 10)
            value.mesh.visible = show;
        };
        mapEdge.forEach(set);

        //objAxis.visible = show;
        visible_Dot = show;

        view.RenderEvent = true;
    };
    this.ShowAxis = function (show) {

        let set = function (value, key, map) {
            value.mesh.visible = show;
        };
        mapAxis.forEach(set);

        //objAxis.visible = show;
        visible_Axis = show;

        view.RenderEvent = true;
    };
    this.IsVisible = function (reviewType) {
        if (reviewType === 0) {
            // Dot
            return visible_Dot;
        }
        else if (reviewType === 1) {
            // Edge
            return visible_Edge;
        }
        else if (reviewType === 2) {
            // Axis
            return visible_Axis;
        }
    };

    this.IsVisible = function (reviewType) {
        if (reviewType === 0) {
            // Dot
            return visible_Dot;
        }
        else if (reviewType === 1) {
            // Edge
            return visible_Edge;
        }
        else if (reviewType === 2) {
            // Axis
            return visible_Axis;
        }
    };

};