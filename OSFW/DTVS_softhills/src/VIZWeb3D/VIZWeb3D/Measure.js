VIZWeb3D.Measure = function (VIEW, camera, renderer) {

    var scope = this;

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    // Measure Scene
    var scene = new THREE.Scene();
    // Sprite Scene
    var sceneSprite = new THREE.Scene();

    // Review Camera
    var camera_reviewSize = 200;
    var camera_reviewNear = -200;
    var camera_reviewFar = 200;
    var camera_review = new THREE.OrthographicCamera(-camera_reviewSize, camera_reviewSize, camera_reviewSize, -camera_reviewSize, camera_reviewNear, camera_reviewFar);

    var view = VIEW;
    var radius = 0.1;//var radius = 1;
    //var offsetSnap = 0.03;
    var offsetSnap = 0.1;
    
    var clipInfo = null;

    var sizeMarker = 2;
    var sizeText = 1500;
    var sizeArrow = 20;

    // Review Camera Points
    var points = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
    ];

    // Base Camera Points
    var pointsBase = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
    ];
    
    // Mouse Points
    var mousepoints = [
        new THREE.Vector2(),
        new THREE.Vector2(),
        new THREE.Vector2(),
        new THREE.Vector2()
    ];

    // Mouse Click
    var clicks = 0;

    var colLine = { r: 255, g: 255, b: 255, a: 1.0 };
    var colArrow = { r: 255, g: 0, b: 0, a: 1.0 };
    var colPoint = { r: 255, g: 0, b: 0, a: 1.0 };
    var colPick = { r: 0, g: 255, b: 0, a: 1.0 };
    var colBack = { r: 0, g: 255, b: 0, a: 1.0 };
    var colBorder = { r: 255, g: 0, b: 0, a: 1.0 };
    var colText = { r: 255, g: 0, b: 0, a: 1.0 };

    var measureItem = function () {
        var item = {
            id: view.Data.UUIDv4(),
            type: REVIEW_TYPES.NONE,
            text: null,
            points: [],
            pointsBase:[],
            color: {
                colLine: null,
                colPoint: null,
                colPick: null,
                colBack: null,
                colBorder: null,
                colText: null
            },
            obj: {
                markers: [],
                line: null,
                ellipse : null,
                arrows: [],
                supportlines: [],
                center: null,
                centerArc:null,
                text: null
            }
        };
        return item;
    };

    // Measure 관리
    var mapMeasure = new Map();
    // Drawing 관리
    var markerA = new THREE.Mesh(
        new THREE.SphereGeometry(sizeMarker, 10, 20),
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
            opacity: colPick.a
        })
    );
    var markerB = markerA.clone();
    var markerC = markerA.clone();
    var markers = [
        markerA, markerB, markerC
    ];

    var objMeasure = new THREE.Object3D();
    var objLine = new THREE.Object3D();
    var objSprite = new THREE.Object3D();
    var objMarker = new THREE.Object3D();
    var objSnap = new THREE.Object3D();

    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(new THREE.Vector3());
    lineGeometry.vertices.push(new THREE.Vector3());
    var lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
        opacity: colPick.a,
    });
    var line = new THREE.Line(lineGeometry, lineMaterial);

    var offset = 0.005;
    var offsetText = 4.00;
    //var offsetText = 0.04;
    var ratio = 0;

    var measure;
    var obj;
    var objText;

    this.ReviewType = REVIEW_TYPES.NONE;

    this.SetSnapDistance = function (value) {
        //radius = value;
    };

    this.ReviewMode = false;
    // Review Start
    this.Start = function (type) {
        scope.ReviewMode = true;
        objMarker.visible = true;
        markerA.visible = false;
        markerB.visible = false;
        markerC.visible = false;
        scope.ReviewType = type;
        initMeasureItem();
        if ($("#ui_message").length > 0) {
            var textMeasure;
            switch (scope.ReviewType) {
                case REVIEW_TYPES.RK_MEASURE_POS:
                    textMeasure = "Measure the coordinates of a particular point.";
                    break;
                case REVIEW_TYPES.RK_MEASURE_DISTANCE:
                    textMeasure = "Measures the distance between two points.";
                    break;
                case REVIEW_TYPES.RK_MEASURE_ANGLE:
                    textMeasure = "Calculate the angle between three points.";
                    break;
                default:
                    break;
            }
            
            $("#ui_message_text").html(textMeasure + "<br><p2>*</p2><p1>Press the</p1> <p2>ESC</p2> <p1>key to end the measurement.</p1>");
            $("#ui_message").fadeIn(500);
        }
    };
    // Review End
    this.End = function () {
        scope.ReviewMode = false;
        objMarker.visible = false;
        markerA.visible = false;
        markerB.visible = false;
        markerC.visible = false;
        if (clicks !== 0) {
            // Drawing Object Remove
            currentObjDispose();
        }
        clicks = 0;
        scope.ReviewType = REVIEW_TYPES.NONE;
        if ($("#ui_message").length > 0) {
            $("#ui_message_text").html("");
            $("#ui_message").hide();
        }
        scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
    };
    // Review 전체 삭제
    this.DeleteAll = function () {
        currentObjDispose();

        function deleteItem(value, key, map) {
            if (value !== undefined) {
                for (var i = 0; i < value.obj.markers.length; i++)
                    view.Data.Dispose(value.obj.markers[i]);

                for (var i = 0; i < value.obj.arrows.length; i++)
                    view.Data.Dispose(value.obj.arrows[i]);

                for (var i = 0; i < value.obj.supportlines.length; i++)
                    view.Data.Dispose(value.obj.supportlines[i]);

                view.Data.Dispose(value.obj.text);
                view.Data.Dispose(value.obj.line);
            }
        }
        mapMeasure.forEach(deleteItem);

        mapMeasure.clear();

        view.Render();
    };
    // Review 옵션 설정
    this.SetOption = function (parameters) {
        if (parameters === undefined) parameters = {};
        colLine = parameters.hasOwnProperty("Color") ? parameters["Color"].Line : colLine;
        colPoint = parameters.hasOwnProperty("Color") ? parameters["Color"].Point : colPoint;
        colPick = parameters.hasOwnProperty("Color") ? parameters["Color"].Pick : colPick;
        colBack = parameters.hasOwnProperty("Color") ? parameters["Color"].Back : colBack;
        colBorder = parameters.hasOwnProperty("Color") ? parameters["Color"].Border : colBorder;
        colText = parameters.hasOwnProperty("Color") ? parameters["Color"].Text : colText;

        markerA.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
            opacity: colPick.a,
        });
        markerB.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
            opacity: colPick.a,
        });
        markerC.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
            opacity: colPick.a,
        });
    };

    // Measure Item 초기화
    function initMeasureItem() {
        measure = measureItem();
        obj = new THREE.Object3D();
        objText = new THREE.Object3D();
    }
    // Measure 관리 맵 추가
    function addMeasureMap() {
        measure.color.colLine = { r: colLine.r, g: colLine.g, b: colLine.b, a: colLine.a };
        measure.color.colPoint = { r: colPoint.r, g: colPoint.g, b: colPoint.b, a: colPoint.a };
        measure.color.colPick = { r: colPick.r, g: colPick.g, b: colPick.b, a: colPick.a };
        measure.color.colBack = { r: colBack.r, g: colBack.g, b: colBack.b, a: colBack.a };
        measure.color.colBorder = { r: colBorder.r, g: colBorder.g, b: colBorder.b, a: colBorder.a };
        measure.color.colText = { r: colText.r, g: colText.g, b: colText.b, a: colText.a };

        for (var i = 0; i < points.length; i++) {
            measure.points.push(new THREE.Vector3().copy(points[i]));
        }

        for (var i = 0; i < pointsBase.length; i++) {
            measure.pointsBase.push(new THREE.Vector3().copy(pointsBase[i]));
        }

        measure.type = scope.ReviewType;

        mapMeasure.set(measure.id, measure);
    }
    // 활성화된 Object 제거
    function currentObjDispose() {
        if (measure !== undefined) {
            for (var i = 0; i < measure.obj.markers.length; i++)
                view.Data.Dispose(measure.obj.markers[i]);

            for (var i = 0; i < measure.obj.arrows.length; i++)
                view.Data.Dispose(measure.obj.arrows[i]);

            for (var i = 0; i < measure.obj.supportlines.length; i++)
                view.Data.Dispose(measure.obj.supportlines[i]);

            view.Data.Dispose(measure.obj.text);
            view.Data.Dispose(measure.obj.line);
        }
    }

    init();
    function init() {
        scene.matrixAutoUpdate = false;
        scene.add(camera);
        scene.add(objMeasure);

        //markerA.name = "marker";
        //markerB.name = "marker";
        //markerC.name = "marker";

        objMarker.add(markerA);
        objMarker.add(markerB);
        objMarker.add(markerC);
        //objMarker.add(line);
        objMarker.visible = false;

        objMeasure.add(objMarker);
        objMeasure.add(objLine);
        objMeasure.add(objSnap);

        sceneSprite.add(objSprite);

        createSphereHelper();

        
    }
    // 활성화된 Line 설정
    function setLine(vectorA, vectorB) {
        line.geometry.vertices[0].copy(vectorA);
        line.geometry.vertices[1].copy(vectorB);
        line.geometry.verticesNeedUpdate = true;
    }
    // 거리 측정 추가
    function add_Distance(vectorA, vectorB, distance) {

        var marker1 = new THREE.Mesh(
            new THREE.SphereGeometry(sizeMarker, 32, 32),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                opacity: colPoint.a
            })
        );
        marker1.position.copy(markerA.position);
        var marker2 = marker1.clone();
        marker2.position.copy(markerB.position);
        measure.obj.markers = [
            marker1, marker2
        ];

        marker1.name = "marker";
        marker2.name = "marker";

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices[0].copy(vectorA);
        geometry.vertices[1].copy(vectorB);
        geometry.verticesNeedUpdate = true;

        var lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(colLine.r / 255, colLine.g / 255, colLine.b / 255),
            opacity: colLine.a
        });
        measure.obj.line = new THREE.Line(geometry, lineMaterial);

        var linegeometry1 = new THREE.Geometry();
        linegeometry1.vertices.push(new THREE.Vector3());
        linegeometry1.vertices.push(new THREE.Vector3());
        linegeometry1.vertices[0].copy(points[1]);
        linegeometry1.vertices[1].copy(points[1]);
        linegeometry1.verticesNeedUpdate = true;

        var vSub = new THREE.Vector3().subVectors(points[1], points[2]);

        var linegeometry2 = new THREE.Geometry();
        linegeometry2.vertices.push(new THREE.Vector3());
        linegeometry2.vertices.push(new THREE.Vector3());
        linegeometry2.vertices[0].copy(points[0]);
        linegeometry2.vertices[1].copy(points[0]);
        linegeometry2.verticesNeedUpdate = true;

        measure.obj.supportlines = [
            new THREE.Line(linegeometry1, lineMaterial),
            new THREE.Line(linegeometry2, lineMaterial)
        ];

        var dir1 = new THREE.Vector3().subVectors(marker1.position, marker2.position).normalize();
        var dir2 = new THREE.Vector3().subVectors(marker2.position, marker1.position).normalize();

        var arrowGeometry1 = new THREE.CylinderBufferGeometry(0, 0.2, 0.6, 12, 1, false);
        arrowGeometry1.translate(0, -0.3, 0);
        var arrowGeometry2 = new THREE.CylinderBufferGeometry(0, 0.2, 0.6, 12, 1, false);
        arrowGeometry2.translate(0, -0.3, 0);

        var arrMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            opacity: colArrow.a,
            color: new THREE.Color(colArrow.r / 255, colArrow.g / 255, colArrow.b / 255)
        });

        var arr1 = new THREE.Mesh(arrowGeometry1, arrMaterial);
        var arr2 = new THREE.Mesh(arrowGeometry2, arrMaterial);


        set_Direction(arr1, dir1);
        set_Direction(arr2, dir2);

        arr1.scale.set(sizeArrow, sizeArrow, sizeArrow);
        arr2.scale.set(sizeArrow, sizeArrow, sizeArrow);

        arr1.position.copy(marker1.position);
        arr2.position.copy(marker2.position);

        measure.obj.arrows = [
            arr1, arr2
        ];

        arr1.name = "arrow";
        arr2.name = "arrow";



        var spritey = Add_TextSprite(distance, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        spritey.renderOrder = 999;
        measure.text = distance;

        var center = new THREE.Vector3(
            (marker1.position.x + marker2.position.x) / 2,
            (marker1.position.y + marker2.position.y) / 2,
            (marker1.position.z + marker2.position.z) / 2
        );

        measure.obj.center = center;
        measure.obj.text = spritey;
        spritey.name = "marker";
        spritey.position = spritey.position.copy(center);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
        spritey.scale.set(sizeText, sizeText, sizeText);

        objMeasure.add(measure.obj.markers[0]);
        objMeasure.add(measure.obj.markers[1]);

        obj.add(measure.obj.arrows[0]);
        obj.add(measure.obj.arrows[1]);
        obj.add(measure.obj.line);
        obj.add(measure.obj.supportlines[0]);
        obj.add(measure.obj.supportlines[1]);
        //objText.add(spritey);
        objText = spritey;
        objMeasure.add(obj);
        objSprite.add(objText);
    }
    // 좌표 측정 추가
    function add_Coordinate(vectorA) {
        var marker1 = new THREE.Mesh(
            new THREE.SphereGeometry(sizeMarker, 32, 32),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                opacity: colPoint.a
            })
        );
        marker1.position.copy(markerA.position);
        marker1.userData = new THREE.Vector3().copy(pointsBase[0]);
        measure.obj.markers = [
            marker1
        ];
        marker1.name = "marker";

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices[0].copy(vectorA);
        geometry.vertices[1].copy(vectorA);
        geometry.verticesNeedUpdate = true;

        var lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(colLine.r / 255, colLine.g / 255, colLine.b / 255),
            opacity: colLine.a
        });
        measure.obj.line = new THREE.Line(geometry, lineMaterial);


        var dir1 = new THREE.Vector3().subVectors(marker1.position, marker1.position).normalize();

        var arrowGeometry1 = new THREE.CylinderBufferGeometry(0, 0.2 , 0.6 , 12, 1, false);
        arrowGeometry1.translate(0, -0.3, 0);

        var arrMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            opacity: colArrow.a,
            color: new THREE.Color(colArrow.r / 255, colArrow.g / 255, colArrow.b / 255)
        });

        var arr1 = new THREE.Mesh(arrowGeometry1, arrMaterial);

        set_Direction(arr1, dir1);
        arr1.scale.set(sizeArrow, sizeArrow, sizeArrow);

        arr1.position.copy(marker1.position);
        arr1.userData = new THREE.Vector3().copy(pointsBase[0]);

        measure.obj.arrows = [
            arr1
        ];

        arr1.name = "arrow";

        //var spritey = Add_TextSprite_Coordinate(vectorA, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        var spritey = Add_TextSprite_Coordinate(pointsBase[0], { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        console.log("Pos :: ", [vectorA, markerA.position]);
        spritey.renderOrder = 999;

        //var msgX = getUnit(vectorA.x);
        //var msgY = getUnit(vectorA.y);
        //var msgZ = getUnit(vectorA.z);
        var msgX = pointsBase[0].x.toFixed(view.Configuration.Measure.PositionalNumber);
        var msgY = pointsBase[0].y.toFixed(view.Configuration.Measure.PositionalNumber);
        var msgZ = pointsBase[0].z.toFixed(view.Configuration.Measure.PositionalNumber);
        measure.text = "X = " + msgX + "\r\n" + "Y = " + msgY + "\r\n" + "Z = " + msgZ;

        var center = new THREE.Vector3(
            marker1.position.x,
            marker1.position.y,
            marker1.position.z
        );

        measure.obj.center = center;
        measure.obj.text = spritey;
        spritey.name = "marker";
        spritey.position = spritey.position.copy(center);
        
        spritey.scale.set(sizeText, sizeText, sizeText);

        objMeasure.add(measure.obj.markers[0]);
        objMeasure.add(measure.obj.arrows[0]);
        obj.add(measure.obj.line);
        //objText.add(spritey);

        objMeasure.add(obj);
        //objSprite.add(objText);
        objText = spritey;
        objSprite.add(spritey);
    }
    // 각도 측정 추가
    function add_Angle() {
        var lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(colLine.r / 255, colLine.g / 255, colLine.b / 255),
            opacity: colLine.a
        });
        if (clicks === 1) {
            var marker1 = new THREE.Mesh(
                new THREE.SphereGeometry(sizeMarker, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                    opacity: colPoint.a
                })
            );
            marker1.position.copy(markerA.position);
            marker1.name = "marker";

            measure.obj.markers.push(marker1);

            var linegeometry1 = new THREE.Geometry();
            linegeometry1.vertices.push(new THREE.Vector3());
            linegeometry1.vertices.push(new THREE.Vector3());
            linegeometry1.vertices[0].copy(points[0]);
            linegeometry1.vertices[1].copy(points[1]);
            linegeometry1.verticesNeedUpdate = true;

            objMeasure.add(measure.obj.markers[0]);
            measure.obj.supportlines.push(new THREE.Line(linegeometry1, lineMaterial));
            obj.add(measure.obj.supportlines[0]);

            objMeasure.add(obj);
        }

        if (clicks === 2) {
            //var marker2 = marker1.clone();
            var marker2 = new THREE.Mesh(
                new THREE.SphereGeometry(sizeMarker, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                    opacity: colPoint.a
                })
            );
            marker2.name = "marker";
            marker2.position.copy(markerB.position);
            measure.obj.markers.push(marker2);

            var linegeometry2 = new THREE.Geometry();
            linegeometry2.vertices.push(new THREE.Vector3());
            linegeometry2.vertices.push(new THREE.Vector3());
            linegeometry2.vertices[0].copy(points[0]);
            linegeometry2.vertices[1].copy(points[1]);
            linegeometry2.verticesNeedUpdate = true;

            objMeasure.add(measure.obj.markers[1]);
            measure.obj.supportlines.push(new THREE.Line(linegeometry2, lineMaterial));
            linegeometry2.vertices[1].copy(points[2]);
            linegeometry2.verticesNeedUpdate = true;

            obj.add(measure.obj.supportlines[1]);

        }
        

        if (clicks === 3) {
            var marker3 = new THREE.Mesh(
                new THREE.SphereGeometry(sizeMarker, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                    opacity: colPoint.a
                })
            );
            //var marker3 = marker1.clone();
            marker3.name = "marker";
            marker3.position.copy(markerC.position);
            measure.obj.markers.push(marker3);

            objMeasure.add(measure.obj.markers[2]);
            //var dir1 = new THREE.Vector3().subVectors(markerA.position, markerB.position).normalize();
            //var dir2 = new THREE.Vector3().subVectors(markerA.position, markerC.position).normalize();
            var dir1 = new THREE.Vector3().subVectors(pointsBase[0], pointsBase[1]).normalize();
            var dir2 = new THREE.Vector3().subVectors(pointsBase[0], pointsBase[2]).normalize();

            var theta = dir1.dot(dir2);
            theta = Math.acos(theta);
            var degree = theta * (180 / Math.PI);
            var message = degree.toFixed(view.Configuration.Measure.PositionalNumber) + "°";
            var spritey = Add_TextSprite(message, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
            spritey.renderOrder = 999;
            measure.text = message;

            var ellipse = render3DAngle(points[0], points[1], points[2], degree, false);
            measure.obj.ellipse = ellipse;
            obj.add(ellipse);

            var center = new THREE.Vector3(
                points[2].x,
                points[2].y,
                points[2].z
            );

            measure.obj.center = center;
            measure.obj.text = spritey;
            spritey.name = "marker";
            
            spritey.position = spritey.position.copy(center);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
            spritey.scale.set(sizeText, sizeText, sizeText);
            var modelCenter = view.Control.Model.Center();
            var vector2d = modelCenter.project(camera);
            var vector = new THREE.Vector3(mouse.x, mouse.y, vector2d.z).unproject(camera);

            obj.add(measure.obj.arrows[0]);
            obj.add(measure.obj.arrows[1]);
            //obj.add(measure.obj.line);
            measure.obj.supportlines[2].geometry.vertices[1].copy(spritey.position);
            obj.add(measure.obj.supportlines[2]);
            measure.obj.supportlines.push(ellipse);
            obj.add(measure.obj.supportlines[3]);
            //objText.add(spritey);
            objText = spritey;
            objSprite.add(objText);
        }
    }
    // 각도 그리기
    function render3DAngle(vPosBase, vPos1, vPos2, degree, bLargeAngle) {
        
        // 각범위 그린다
        var vXAxis, vYAxis, vTmp;
        vXAxis = new THREE.Vector3().subVectors(vPos1, vPosBase);
        vYAxis = new THREE.Vector3().subVectors(vPos2, vPosBase);

        vTmp = new THREE.Vector3().crossVectors(vXAxis, vYAxis);
        vYAxis = new THREE.Vector3().crossVectors(vXAxis, vTmp);

        vXAxis.normalize();
        vYAxis.normalize();

        var vDir1 = new THREE.Vector3().subVectors(vPos1, vPosBase);
        var vDir2 = new THREE.Vector3().subVectors(vPos2, vPosBase);
        var radius = Math.min(vDir1.length(), vDir2.length()) / 3;

        vDir1.normalize();
        vDir2.normalize();

        var angle = Math.acos(vDir1.dot(vDir2));
        if (bLargeAngle) {
            angle = (3.141592654 * 2 - angle) * -1.0;
        }

        var arrposition = [];
        var arrowPos1 = new THREE.Vector3();
        var arrowPos2 = new THREE.Vector3();
        var dirAngle1 = new THREE.Vector3();
        var dirAngle2 = new THREE.Vector3();
        var posTmp = new THREE.Vector3();
        var posCenter = new THREE.Vector3();
        for (var i = 0; i <= 60 ; i++ )
        {
            var a = -(i / 60.0) * angle;
            var vXAxis1 = new THREE.Vector3().copy(vXAxis).multiplyScalar(Math.cos(a)).multiplyScalar(radius);
            var vYAxis1 = new THREE.Vector3().copy(vYAxis).multiplyScalar(Math.sin(a)).multiplyScalar(radius);

            var pos = new THREE.Vector3().addVectors(vXAxis1, vYAxis1); 

            if (i === 30)
                posCenter.copy(pos);

            arrposition.push(pos.x, pos.y, pos.z || 0);

            if (i === 0) {
                arrowPos1.copy(pos);
            }
            if (i === 1) {
                dirAngle1 = new THREE.Vector3().subVectors(arrowPos1, pos).normalize();
            }
            if (i === 59) {
                posTmp.copy(pos);
            }
            if (i === 60) {
                arrowPos2.copy(pos);
                dirAngle2 = new THREE.Vector3().subVectors(arrowPos2, posTmp).normalize();
            }
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrposition, 3));
        var material = new THREE.LineBasicMaterial({
            color: new THREE.Color(colLine.r / 255, colLine.g / 255, colLine.b / 255),
            opacity: colLine.a
        });
        

        // Create the final object to add to the scene
        var ellipse = new THREE.Line(geometry, material);
        ellipse.position.copy(vPosBase);

        // 화살표 그린다
        var arrowGeometry1 = new THREE.CylinderBufferGeometry(0, 0.2, 0.6, 12, 1, false);
        arrowGeometry1.translate(0, -0.3, 0);
        var arrowGeometry2 = new THREE.CylinderBufferGeometry(0, 0.2, 0.6, 12, 1, false);
        arrowGeometry2.translate(0, -0.3, 0);

        var arrMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            opacity: colArrow.a,
            color: new THREE.Color(colArrow.r / 255, colArrow.g / 255, colArrow.b / 255)
        });

        var arr1 = new THREE.Mesh(arrowGeometry1, arrMaterial);
        var arr2 = new THREE.Mesh(arrowGeometry2, arrMaterial);


        set_Direction(arr1, dirAngle1);
        set_Direction(arr2, dirAngle2);

        arr1.scale.set(sizeArrow, sizeArrow, sizeArrow);
        arr2.scale.set(sizeArrow, sizeArrow, sizeArrow);

        arr1.position.copy(new THREE.Vector3().addVectors(vPosBase, arrowPos1));
        arr2.position.copy(new THREE.Vector3().addVectors(vPosBase, arrowPos2));

        measure.obj.arrows = [
            arr1, arr2
        ];

       

        arr1.name = "arrow";
        arr2.name = "arrow";

        // 라인 그린다
        posCenter.copy(new THREE.Vector3().addVectors(vPosBase, posCenter));

        measure.obj.centerArc = posCenter;
        var linegeometry = new THREE.Geometry();
        linegeometry.vertices.push(new THREE.Vector3());
        linegeometry.vertices.push(new THREE.Vector3());
        linegeometry.vertices[0].copy(posCenter);
        linegeometry.vertices[1].copy(posCenter);
        linegeometry.verticesNeedUpdate = true;
        measure.obj.supportlines.push(new THREE.Line(linegeometry, material));
        linegeometry.verticesNeedUpdate = true;

        return ellipse;
    }

    // 방향 설정
    function set_Direction(object, dir) {
        var axis = new THREE.Vector3();
        var radians;

        if (dir.y > 0.99999) {
            object.quaternion.set(0, 0, 0, 1);

        } else if (dir.y < - 0.99999) {
            object.quaternion.set(1, 0, 0, 0);
        } else {
            axis.set(dir.z, 0, - dir.x).normalize();
            radians = Math.acos(dir.y);
            object.quaternion.setFromAxisAngle(axis, radians);
        }
    }
    // 업데이트
    function update() {
        try {
            var updatePos = function (value) {
                var point_Review = [];
                var point_Mouse = [];

                if (value.type === REVIEW_TYPES.RK_MEASURE_POS) {
                    for (var i = 0; i < value.pointsBase.length; i++) {
                        point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(value.pointsBase[i])));
                        point_Mouse.push(new THREE.Vector3().copy(value.pointsBase[i]).project(camera));
                    }
                    //var vec2D0 = new THREE.Vector3().copy(value.pointsBase[0]).project(camera);
                    //var vec2D1 = new THREE.Vector3().copy(value.pointsBase[1]).project(camera);
                    //var vector1 = new THREE.Vector3(vec2D0.x, vec2D0.y, vec2D0.z).unproject(camera_review);
                    //var vector2 = new THREE.Vector3(vec2D1.x, vec2D1.y, vec2D0.z).unproject(camera_review);
                    //var dir1 = new THREE.Vector3().subVectors(vector1, vector2).normalize();
                    var dir = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]).normalize();
                    for (var i = 0; i < value.obj.markers.length; i++) {
                        //value.obj.markers[i].position.copy(getReviewCameraPos(value.pointsBase[i]));
                        value.obj.markers[i].position.copy(point_Review[i]);
                    }
                    set_Direction(value.obj.arrows[0], dir);
                    //value.obj.arrows[0].position.copy(getReviewCameraPos(value.pointsBase[0]));
                    value.obj.arrows[0].position.copy(point_Review[0]);
                    //var pos0 = getReviewCameraPos(value.pointsBase[0]);
                    //var pos1 = getReviewCameraPos(value.pointsBase[1]);
                    //value.obj.line.geometry.vertices[0].copy(pos0);
                    //value.obj.line.geometry.vertices[1].copy(pos1);
                    value.obj.line.geometry.vertices[0].copy(point_Review[0]);
                    value.obj.line.geometry.vertices[1].copy(point_Review[1]);
                    value.obj.line.geometry.verticesNeedUpdate = true;
                    //value.obj.text.position.copy(new THREE.Vector3().copy(pos1));
                    value.obj.text.position.copy(new THREE.Vector3().copy(point_Review[1]));
                }
                else if (value.type === REVIEW_TYPES.RK_MEASURE_DISTANCE) {
                    
                    for (var i = 0; i < value.pointsBase.length; i++) {
                        point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(value.pointsBase[i])));
                        point_Mouse.push(new THREE.Vector3().copy(value.pointsBase[i]).project(camera));
                    }

                    for (var i = 0; i < value.obj.markers.length; i++) {
                        value.obj.markers[i].position.copy(point_Review[i]);
                    }

                    var dir1 = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]).normalize();
                    var dir2 = new THREE.Vector3().subVectors(point_Review[1], point_Review[0]).normalize();
                    var vLength = new THREE.Vector3().subVectors(point_Review[1], point_Review[2]);

                    value.obj.supportlines[0].geometry.vertices[0].copy(point_Review[0]);
                    value.obj.supportlines[0].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[0], vLength));
                    value.obj.supportlines[0].geometry.verticesNeedUpdate = true;
                    value.obj.supportlines[1].geometry.vertices[0].copy(point_Review[1]);
                    value.obj.supportlines[1].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[1], vLength));
                    value.obj.supportlines[1].geometry.verticesNeedUpdate = true;

                    value.obj.line.geometry.vertices[0].copy(value.obj.supportlines[0].geometry.vertices[1]);
                    value.obj.line.geometry.vertices[1].copy(value.obj.supportlines[1].geometry.vertices[1]);
                    value.obj.line.geometry.verticesNeedUpdate = true;

                    set_Direction(value.obj.arrows[0], dir1);
                    set_Direction(value.obj.arrows[1], dir2);
                    value.obj.arrows[0].position.copy(value.obj.supportlines[0].geometry.vertices[1]);
                    value.obj.arrows[1].position.copy(value.obj.supportlines[1].geometry.vertices[1]);

                    var center = new THREE.Vector3(
                        (value.obj.supportlines[0].geometry.vertices[1].x + value.obj.supportlines[1].geometry.vertices[1].x) / 2,
                        (value.obj.supportlines[0].geometry.vertices[1].y + value.obj.supportlines[1].geometry.vertices[1].y) / 2,
                        (value.obj.supportlines[0].geometry.vertices[1].z + value.obj.supportlines[1].geometry.vertices[1].z) / 2
                    );
                    value.obj.text.position.copy(new THREE.Vector3().copy(center));
                }
                else if (value.type === REVIEW_TYPES.RK_MEASURE_ANGLE) {
                    for (var i = 0; i < value.pointsBase.length; i++) {
                        point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(value.pointsBase[i])));
                        point_Mouse.push(new THREE.Vector3().copy(value.pointsBase[i]).project(camera));
                    }

                    for (var i = 0; i < value.obj.markers.length; i++) {
                        value.obj.markers[i].position.copy(point_Review[i]);
                    }
                    
                    var vLength1 = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]);
                    var vLength2 = new THREE.Vector3().subVectors(point_Review[0], point_Review[2]);

                    value.obj.supportlines[0].geometry.vertices[0].copy(point_Review[0]);
                    value.obj.supportlines[0].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[0], vLength1));
                    value.obj.supportlines[0].geometry.verticesNeedUpdate = true;
                    value.obj.supportlines[1].geometry.vertices[0].copy(point_Review[0]);
                    value.obj.supportlines[1].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[0], vLength2));
                    value.obj.supportlines[1].geometry.verticesNeedUpdate = true;

                    // 각범위 그린다
                    var vXAxis, vYAxis, vTmp;
                    vXAxis = new THREE.Vector3().subVectors(point_Review[1], point_Review[0]);
                    vYAxis = new THREE.Vector3().subVectors(point_Review[2], point_Review[0]);

                    vTmp = new THREE.Vector3().crossVectors(vXAxis, vYAxis);
                    vYAxis = new THREE.Vector3().crossVectors(vXAxis, vTmp);

                    vXAxis.normalize();
                    vYAxis.normalize();

                    var vDir1 = new THREE.Vector3().subVectors(point_Review[1], point_Review[0]);
                    var vDir2 = new THREE.Vector3().subVectors(point_Review[2], point_Review[0]);
                    var radius = Math.min(vDir1.length(), vDir2.length()) / 3;

                    vDir1.normalize();
                    vDir2.normalize();

                    var angle = Math.acos(vDir1.dot(vDir2));
                    //if (bLargeAngle) {
                    //    angle = (3.141592654 * 2 - angle) * -1.0;
                    //}

                    var arrposition = [];
                    var arrowPos1 = new THREE.Vector3();
                    var arrowPos2 = new THREE.Vector3();
                    var dirAngle1 = new THREE.Vector3();
                    var dirAngle2 = new THREE.Vector3();
                    var posTmp = new THREE.Vector3();
                    var posCenter = new THREE.Vector3();
                    for (var i = 0; i <= 60; i++) {
                        var a = -(i / 60.0) * angle;
                        var vXAxis1 = new THREE.Vector3().copy(vXAxis).multiplyScalar(Math.cos(a)).multiplyScalar(radius);
                        var vYAxis1 = new THREE.Vector3().copy(vYAxis).multiplyScalar(Math.sin(a)).multiplyScalar(radius);

                        var pos = new THREE.Vector3().addVectors(vXAxis1, vYAxis1);

                        if (i === 30)
                            posCenter.copy(pos);

                        arrposition.push(pos.x, pos.y, pos.z || 0);

                        if (i === 0) {
                            arrowPos1.copy(pos);
                        }
                        if (i === 1) {
                            dirAngle1 = new THREE.Vector3().subVectors(arrowPos1, pos).normalize();
                        }
                        if (i === 59) {
                            posTmp.copy(pos);
                        }
                        if (i === 60) {
                            arrowPos2.copy(pos);
                            dirAngle2 = new THREE.Vector3().subVectors(arrowPos2, posTmp).normalize();
                        }
                    }

                    var geometry = new THREE.BufferGeometry();
                    geometry.addAttribute('position', new THREE.Float32BufferAttribute(arrposition, 3));
                    //var material = new THREE.LineBasicMaterial({
                    //    color: new THREE.Color(colLine.r / 255, colLine.g / 255, colLine.b / 255),
                    //    opacity: colLine.a
                    //});

                    //// Create the final object to add to the scene
                    //var ellipse = new THREE.Line(geometry, material);
                    //ellipse.position.copy(vPosBase);
                    value.obj.ellipse.geometry = geometry;
                    //value.obj.ellipse.geometry.attributes.position.array = new THREE.Float32BufferAttribute(arrposition, 3);

                    value.obj.ellipse.position.copy(point_Review[0]);

                    set_Direction(value.obj.arrows[0], dirAngle1);
                    set_Direction(value.obj.arrows[1], dirAngle2);

                    value.obj.arrows[0].position.copy(new THREE.Vector3().addVectors(point_Review[0], arrowPos1));
                    value.obj.arrows[1].position.copy(new THREE.Vector3().addVectors(point_Review[0], arrowPos2));

                    // 라인 그린다
                    posCenter.copy(new THREE.Vector3().addVectors(point_Review[0], posCenter));
                    value.obj.supportlines[2].geometry.vertices[0].copy(posCenter);
                    //value.obj.supportlines[2].geometry.vertices[0].copy(point_Review[0]);
                    value.obj.supportlines[2].geometry.vertices[1].copy(point_Review[3]);
                    value.obj.supportlines[2].geometry.verticesNeedUpdate = true;

                    value.obj.text.position.copy(new THREE.Vector3().copy(point_Review[3]));
                }
            };
            mapMeasure.forEach(updatePos);
        } catch (error) {
            console.log(error);
        }
    }

    function getRadius(pos, offset) {
        var v1 = new THREE.Vector3().copy(pos).project(camera);
        v1.y -= offset;
        var v2 = v1.unproject(camera_review);
        var v = new THREE.Vector3();
        v.subVectors(pos, v2);

        return v.length();
    }

    function getHitTestNode(obj, mx, my, onUpPosition, _TargetMeshes) {
        var me = this;

        //    mx = 717;
        //    my = 265.5099792480469;
        //    onUpPosition.x = 0.5745192307692307;
        //    onUpPosition.y = 0.3318875122070313;

        var mouse = new THREE.Vector2();
        //mouse.set((onUpPosition.x * 2) - 1, -(onUpPosition.y * 2) + 1);
        mouse.set(onUpPosition.x, onUpPosition.y);

        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh) {
                for (var j = 0; j < obj.children[i].userData.length; j++) {
                    var body = obj.children[i].userData[j];

                    var boundbox = body.BBox;

                    // Center
                    var vCenter = new THREE.Vector3((boundbox.max.x + boundbox.min.x) / 2, (boundbox.max.y + boundbox.min.y) / 2, (boundbox.max.z + boundbox.min.z) / 2);
                    var vLine1Tmp = new THREE.Vector3(mouse.x, mouse.y, 0.3);
                    var vLine2Tmp = new THREE.Vector3(mouse.x, mouse.y, 0.7);

                    // 3D 좌표 변환
                    var vLine1 = vLine1Tmp.unproject(me.camera);
                    var vLine2 = vLine2Tmp.unproject(me.camera);

                    var v1 = new THREE.Vector3();
                    v1.subVectors(vCenter, vLine1);
                    var v2 = new THREE.Vector3();
                    v2.subVectors(vCenter, vLine2);
                    var v3 = new THREE.Vector3();
                    v3.crossVectors(v1, v2);
                    var v4 = new THREE.Vector3();
                    v4.subVectors(vLine1, vLine2);

                    var len = v3.length() / v4.length();
                    //var fRadius = Math.abs(vCenter.x - boundbox.max.x);
                    var fRadius = new THREE.Vector3(boundbox.max.x - boundbox.min.x, boundbox.max.y - boundbox.min.y, boundbox.max.z - boundbox.min.z).length();
                    fRadius /= 1.9;
                    if (len < fRadius) {


                        _TargetMeshes.push(obj.children[i]);

                        break;
                    }
                }
            }
            else {
                getHitTestNode(obj.children[i], mx, my, onUpPosition, _TargetMeshes);
            }
        }
    }

    function getIntersections(event) {
        //var mouse = new THREE.Vector2();

        //mouse.set(
        //    event.clientX / window.innerWidth * 2 - 1,
        //    -(event.clientY / window.innerHeight) * 2 + 1
        //);
        var mouse = view.Data.GetMousePos(event);
        var _TargetMeshes = [];

        clipInfo = view.Clipping.GetClipInfo();

        getHitTestNode(objModel, event.x, event.y, mouse, _TargetMeshes);
        //projector = new THREE.Projector();

        if (camera.isPerspectiveCamera) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            vector = vector.unproject(camera); //projector.unprojectVector(vector, camera);
            var tmp = vector.sub(camera.position).normalize();
            raycaster = new THREE.Raycaster(camera.position, tmp);
        }
        else {
            var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            //projector.unprojectVector(origin, camera);
            origin = origin.unproject(camera);

            var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            raycaster = new THREE.Raycaster();
            raycaster.set(origin, direction);
        }

        if (_TargetMeshes.length > 0) {
            var intersects = raycaster.intersectObjects(_TargetMeshes, true);
            //var intersects = raycaster.intersectObjects(_TargetMeshes, false);

            if (intersects.length > 0) {

                for (var i = intersects.length - 1; i >= 0; i--) {
                    // Clipping Area Check
                    var bSkip = false;
                    if (clipInfo.enable !== null || clipInfo.enable !== false) {

                        if (clipInfo.type === CLIPPING_MODES.X) {
                            if (clipInfo.inverse === false) {
                                if (intersects[i].point.x >= clipInfo.value)
                                    bSkip = true;
                            }
                            else {
                                if (intersects[i].point.x <= clipInfo.value * -1)
                                    bSkip = true;
                            }
                        }
                        if (clipInfo.type === CLIPPING_MODES.Y) {
                            if (clipInfo.inverse === false) {
                                if (intersects[i].point.y >= clipInfo.value)
                                    bSkip = true;
                            }
                            else {
                                if (intersects[i].point.y <= clipInfo.value * -1)
                                    bSkip = true;
                            }
                        }
                        if (clipInfo.type === CLIPPING_MODES.Z) {
                            if (clipInfo.inverse === false) {
                                if (intersects[i].point.z >= clipInfo.value)
                                    bSkip = true;
                            }
                            else {
                                if (intersects[i].point.z <= clipInfo.value * -1)
                                    bSkip = true;
                            }
                        }
                    }
                    if (bSkip)
                        intersects.splice(i, 1);
                }

                return intersects;
            }
            else {
                return [];
            }
        }
        else {
            return [];
        }
    }

    function getTextHeight(font, s) {
        s = s || 'Hg';
        var text = $('<span>' + s + '</span>').css({ font: font });
        var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

        var div = $('<div></div>');
        div.append(text, block);

        var body = $('body');
        body.append(div);

        try {
            var result = {};

            block.css({ verticalAlign: 'baseline' });
            result.ascent = block.offset().top - text.offset().top;

            block.css({ verticalAlign: 'bottom' });
            result.height = block.offset().top - text.offset().top;

            result.descent = result.height - result.ascent;

        } finally {
            div.remove();
        }

        return result;
    };

    function Add_TextSprite(message, parameters) {
        if (parameters === undefined) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 18;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 0;
        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

        var textColor = parameters.hasOwnProperty("textColor") ?
            parameters["textColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

        var canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        var context = canvas.getContext('2d');
        //context.font = "Bold " + fontsize + "px " + fontface;
        //context.font = fontsize + "px " + fontface;
        context.font = fontsize + "pt " + fontface;
        var metrics = context.measureText(message);
        var metricsh = getTextHeight(context.font, message);
        context.width = metrics.width;
        context.height = metricsh.height;

        // background color
        context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;

        var x = (canvas.width - metrics.width) / 2;
        var y = (canvas.height - metricsh.height) / 2 + metricsh.height / 2;
        var offset = 10;

        //Draw_RoundRect(context, borderThickness / 2 + x - offset + 1, y - metricsh.height, context.width + offset * 2, context.height + offset + offset / 2, 0);
        Draw_RoundRect(context, borderThickness / 2 + x - offset + 1, y - metricsh.height, context.width + offset * 2, context.height + offset + offset / 2, 0);

        // text color
        context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + ","
            + textColor.b + "," + textColor.a + ")";
        //context.fillText(message, borderThickness / 2 + x, borderThickness / 2 + y);
        context.fillText(message, borderThickness / 2 + x, (borderThickness / 2 + y) + offset / 2);
        //var texture = new THREE.Texture(canvas);
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                side: THREE.DoubleSide
            });
        var sprite = new THREE.Sprite(spriteMaterial);

        return sprite;
    }

    function Add_TextSprite_Coordinate(vertex, parameters) {

        //var msgX = getUnit(vertex.x);
        //var msgY = getUnit(vertex.y);
        //var msgZ = getUnit(vertex.z);
        var msgX = vertex.x.toFixed(view.Configuration.Measure.PositionalNumber);
        var msgY = vertex.y.toFixed(view.Configuration.Measure.PositionalNumber);
        var msgZ = vertex.z.toFixed(view.Configuration.Measure.PositionalNumber);

        if (parameters === undefined) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 18;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 0;
        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

        var textColor = parameters.hasOwnProperty("textColor") ?
            parameters["textColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

        var canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        var context = canvas.getContext('2d');
        //context.font = "Bold " + fontsize + "px " + fontface;
        //context.font = fontsize + "px " + fontface;
        context.font = fontsize + "pt " + fontface;

        var arrMetrics = [
            context.measureText(msgX),
            context.measureText(msgY),
            context.measureText(msgZ)
        ];

        var metricsDiscription = context.measureText("X = ");
        var metrics;
        for (var i = 0; i < arrMetrics.length; i++) {
            if (i === 0)
                metrics = arrMetrics[i];
            else if (metrics.width < arrMetrics[i].width)
                metrics = arrMetrics[i];
        }

        var metricsh = getTextHeight(context.font, msgX);
        context.width = metrics.width + metricsDiscription.width;
        context.height = metricsh.height * 3;

        // background color
        context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;

        var x = (canvas.width - metrics.width) / 2;
        var y = (canvas.height - metricsh.height) / 2 + metricsh.height / 2;
        var offset = 10;

        Draw_RoundRect(context, borderThickness / 2 + x - offset + 1, y - metricsh.height, context.width + offset * 2, context.height + offset + offset / 2, 0);

        // text color
        context.textAlign = "right";
        context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + "," + textColor.b + "," + textColor.a + ")";
        context.fillText(msgX, borderThickness / 2 + x + context.width, borderThickness / 2 + y + offset / 2);
        context.fillText("X = ", borderThickness / 2 + x + metricsDiscription.width, borderThickness / 2 + y + offset / 2);
        context.fillText(msgY, borderThickness / 2 + x + context.width, borderThickness / 2 + y + metricsh.height + offset / 2);
        context.fillText("Y = ", borderThickness / 2 + x + metricsDiscription.width, borderThickness / 2 + y + metricsh.height + offset / 2);
        context.fillText(msgZ, borderThickness / 2 + x + context.width, borderThickness / 2 + y + metricsh.height * 2 + offset / 2);
        context.fillText("Z = ", borderThickness / 2 + x + metricsDiscription.width, borderThickness / 2 + y + metricsh.height * 2 + offset / 2);


        //var texture = new THREE.Texture(canvas);
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                side: THREE.DoubleSide
            });
        var sprite = new THREE.Sprite(spriteMaterial);

        return sprite;
    }

    function Draw_RoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function getUnit(distance) {
        var value;
        if (view.Configuration.Measure.Unit === MEASURE_UNIT.mm)
            value = distance.toFixed(view.Configuration.Measure.PositionalNumber);
        else if (view.Configuration.Measure.Unit === MEASURE_UNIT.cm)
            value = (distance / 10).toFixed(view.Configuration.Measure.PositionalNumber);
        else if (view.Configuration.Measure.Unit === MEASURE_UNIT.inch)
            value = (distance / 2.54).toFixed(view.Configuration.Measure.PositionalNumber);

        return value + " " + view.Configuration.Measure.Unit;
    }

    function createSnap(object, point) {
        callback = function (object) {
            if (object instanceof THREE.Mesh) {
                points = object.geometry.attributes.position.array;
                test = object.worldToLocal(point.clone());
                for (var i = 0, il = points.length; i < il; i++) {
                    var sprite = createSprite(points[i]);
                    objSnap.add(sprite);
                }
            }
        };
        //scene.traverse(callback);
        callback(object);
    }

    function createSprite(position) {
        var material = new THREE.SpriteMaterial({
            color: 0xffffff
        });
        sprite = new THREE.Sprite(material);
        sprite.name = 'snap';
        sprite.scale.set(5, 5, 1.0);
        sprite.position.copy(position);
        return sprite;
    }

    var threshold = 10000;
    function createSphereHelper() {
        sphereHelper = new THREE.Line(new THREE.SphereGeometry(1), new THREE.LineBasicMaterial({
            color: 0xffff00
        }));
        sphereHelper.visible = false;
        sphereHelper.name = 'marker';
        objSnap.add(sphereHelper);
    }

    function processDistance(event) {
        if (clicks < 2) {
            //var intersects = view.Data.GetIntersections(event);//getIntersections(event);
            var intersects = view.Picking.PickInfo(event);

            var snap = null;
            if (intersects.length > 0) {

                if (clicks === 0)
                    markerA.visible = true;
                if (clicks === 1)
                    markerB.visible = true;
                
                pointsBase[clicks].copy(intersects[0].point);
                points[clicks].copy(getReviewCameraPos(intersects[0].point));
                markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));

                var index = 0;
                var intersect = intersects[index];
                if (intersect) {
                    var face = intersect.face;
                    var point = intersect.point;
                    var object = intersect.object;
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));
                    markers[clicks].material.color = new THREE.Color(1, 0, 0);
                } else {
                    markers[clicks].material.color = new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255);
                }
            }
            else {
                if (clicks === 0)
                    markerA.visible = false;
                if (clicks === 1) {
                    markerA.visible = true;
                    markerB.visible = false;
                }
            }

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
        else {
            var mouse = view.Data.GetMousePos(event);

            var vecMouse = new THREE.Vector3().copy(pointsBase[1]).project(camera);
            pointsBase[2] = new THREE.Vector3(mouse.x, mouse.y, vecMouse.z).unproject(camera);
            var point_Review = [];
            for (var i = 0; i < pointsBase.length; i++) {
                point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(pointsBase[i])));
            }

            var vLength = new THREE.Vector3().subVectors(point_Review[1], point_Review[2]);

            measure.obj.supportlines[0].geometry.vertices[0].copy(point_Review[0]);
            measure.obj.supportlines[0].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[0], vLength));
            measure.obj.supportlines[0].geometry.verticesNeedUpdate = true;
            measure.obj.supportlines[1].geometry.vertices[0].copy(point_Review[1]);
            measure.obj.supportlines[1].geometry.vertices[1].copy(new THREE.Vector3().subVectors(point_Review[1], vLength));
            measure.obj.supportlines[1].geometry.verticesNeedUpdate = true;

            measure.obj.line.geometry.vertices[0].copy(measure.obj.supportlines[0].geometry.vertices[1]);
            measure.obj.line.geometry.vertices[1].copy(measure.obj.supportlines[1].geometry.vertices[1]);
            measure.obj.line.geometry.verticesNeedUpdate = true;

            measure.obj.arrows[0].position.copy(measure.obj.supportlines[0].geometry.vertices[1]);
            measure.obj.arrows[1].position.copy(measure.obj.supportlines[1].geometry.vertices[1]);
            
            var center = new THREE.Vector3(
                (measure.obj.supportlines[0].geometry.vertices[1].x + measure.obj.supportlines[1].geometry.vertices[1].x) / 2,
                (measure.obj.supportlines[0].geometry.vertices[1].y + measure.obj.supportlines[1].geometry.vertices[1].y) / 2,
                (measure.obj.supportlines[0].geometry.vertices[1].z + measure.obj.supportlines[1].geometry.vertices[1].z) / 2
            );
            objText.position.copy(new THREE.Vector3().copy(center));
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    }

   
    function makeDistance(event) {
        //var intersects = view.Data.GetIntersections(event);
        var intersects = view.Picking.PickInfo(event);

        if (clicks < 2) {
            if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_DISTANCE) {
                if (intersects.length > 0) {
                    var index = 0;
                    var intersect = intersects[index];
                    if (intersect) {
                        var face = intersect.face;
                        var point = intersect.point;
                        var object = intersect.object;
                        snap = scope.findClosestVertex(object, point, offsetSnap);
                    }
                    if (snap) {
                        pointsBase[clicks].copy(snap);
                        points[clicks].copy(getReviewCameraPos(snap));
                        markers[clicks].position.copy(getReviewCameraPos(snap));
                        markers[clicks].material.color = new THREE.Color(1, 0, 0);
                    } else {
                        pointsBase[clicks].copy(intersects[0].point);
                        points[clicks].copy(getReviewCameraPos(intersects[0].point));
                        markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));
                        markers[clicks].material.color = new THREE.Color(0, 1, 0);
                    }

                    var mouse = view.Data.GetMousePos(event);
                    mousepoints[clicks].copy(mouse);

                    clicks++;

                    if (clicks > 1) {
                        //var distance = points[0].distanceTo(points[1]);
                        var distance = pointsBase[0].distanceTo(pointsBase[1]);
                        setLine(points[0], points[1]);
                        var vector = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
                        vector.z = points[1].z;
                        points[2].copy(vector);

                        add_Distance(points[0], points[1], getUnit(distance));
                    }
                }
            }
        }
        else {
            //var mouse = new THREE.Vector2();
            //mouse.set(
            //    event.clientX / window.innerWidth * 2 - 1,
            //    -(event.clientY / window.innerHeight) * 2 + 1
            //);

            var mouse = view.Data.GetMousePos(event);
            mousepoints[2].copy(mouse);
            clicks = 0;
            addMeasureMap();
            initMeasureItem();
        }
    }

    function processPos(event) {
        if (clicks < 1) {
            //var intersects = view.Data.GetIntersections(event);//getIntersections(event);
            var intersects = view.Picking.PickInfo(event);

            var snap = null;
            if (intersects.length > 0) {
                if (clicks === 0)
                    markerA.visible = true;
                //points[clicks].copy(intersects[0].point);
                //markers[clicks].position.copy(intersects[0].point);
                pointsBase[clicks].copy(intersects[0].point);
                points[clicks].copy(getReviewCameraPos(intersects[0].point));
                markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));
                
                var index = 0;
                var intersect = intersects[index];
                if (intersect) {
                    var face = intersect.face;
                    var point = intersect.point;
                    var object = intersect.object;
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    //points[clicks].copy(snap);
                    //markers[clicks].position.copy(snap);
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));
                    markers[clicks].material.color = new THREE.Color(1, 0, 0);
                } else {
                    markers[clicks].material.color = new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255);
                }
            }
            else {
                
                if (clicks === 0)
                    markerA.visible = false;
                if (clicks === 1) {
                    markerA.visible = true;
                    markerB.visible = false;
                }
            }

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
        else {
            var mouse = view.Data.GetMousePos(event);
            var vecMouse = new THREE.Vector3().copy(pointsBase[0]).project(camera);
            pointsBase[1] = new THREE.Vector3(mouse.x, mouse.y, vecMouse.z).unproject(camera);

            var point_Review = [];
            for (var i = 0; i < pointsBase.length; i++) {
                point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(pointsBase[i])));
            }

            measure.obj.line.geometry.vertices[0].copy(point_Review[0]);
            measure.obj.line.geometry.vertices[1].copy(point_Review[1]);
            measure.obj.line.geometry.verticesNeedUpdate = true;

            var dir = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]).normalize();
            set_Direction(measure.obj.arrows[0], dir);

            objText.position.copy(new THREE.Vector3().copy(point_Review[1]));

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    }
    function makePos(event) {
        //var intersects = view.Data.GetIntersections(event);
        var intersects = view.Picking.PickInfo(event);

        if (clicks < 1) {
            if (intersects.length > 0) {
                var index = 0;
                var intersect = intersects[index];
                if (intersect) {
                    var face = intersect.face;
                    var point = intersect.point;
                    var object = intersect.object;
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));
                    markers[clicks].material.color = new THREE.Color(1, 0, 0);
                } else {
                    pointsBase[clicks].copy(intersects[0].point);
                    points[clicks].copy(getReviewCameraPos(intersects[0].point));
                    markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));
                    markers[clicks].material.color = new THREE.Color(0, 1, 0);
                }

                setLine(intersects[0].point, intersects[0].point);

                var mouse = view.Data.GetMousePos(event);
                mousepoints[clicks].copy(mouse);

                clicks++;

                if (clicks > 0) {
                    add_Coordinate(points[0]);
                }
            }
        }
        else {
            var mouse = view.Data.GetMousePos(event);
            mousepoints[2].copy(mouse);
            clicks = 0;
            addMeasureMap();
            initMeasureItem();
        }
    }

    function processAngle(event) {
        if (clicks < 3) {
            //var intersects = view.Data.GetIntersections(event);//getIntersections(event);
            var intersects = view.Picking.PickInfo(event);

            var snap = null;
            if (intersects.length > 0) {

                if (clicks === 0)
                    markerA.visible = true;
                if (clicks === 1)
                    markerB.visible = true;
                if (clicks === 2)
                    markerC.visible = true;

                pointsBase[clicks].copy(intersects[0].point);
                points[clicks].copy(getReviewCameraPos(intersects[0].point));
                markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));

                var index = 0;
                var intersect = intersects[index];
                if (intersect) {
                    var face = intersect.face;
                    var point = intersect.point;
                    var object = intersect.object;
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    //points[clicks].copy(snap);
                    //markers[clicks].position.copy(snap);
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));
                    markers[clicks].material.color = new THREE.Color(1, 0, 0);

                    if (clicks === 1) {
                        // 1라인 이동
                        measure.obj.supportlines[0].geometry.vertices[1].copy(markers[clicks].position);
                        measure.obj.supportlines[0].geometry.verticesNeedUpdate = true;

                    }
                    if (clicks === 2) {
                        // 2라인 이동
                        measure.obj.supportlines[1].geometry.vertices[1].copy(markers[clicks].position);
                        measure.obj.supportlines[1].geometry.verticesNeedUpdate = true;
                    }
                } else {
                    markers[clicks].material.color = new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255);

                    if (clicks === 1) {
                        // 1라인 이동
                        measure.obj.supportlines[0].geometry.vertices[1].copy(markers[clicks].position);
                        measure.obj.supportlines[0].geometry.verticesNeedUpdate = true;

                    }
                    if (clicks === 2) {
                        // 2라인 이동
                        measure.obj.supportlines[1].geometry.vertices[1].copy(markers[clicks].position);
                        measure.obj.supportlines[1].geometry.verticesNeedUpdate = true;
                    }
                }

                //var mouse = new THREE.Vector2();
                //mouse.set(
                //    event.clientX / window.innerWidth * 2 - 1,
                //    -(event.clientY / window.innerHeight) * 2 + 1
                //);

                //if (clicks === 1) {
                //    // 1라인 이동
                //    var vector = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
                //    measure.obj.supportlines[0].geometry.vertices[1].copy(vector);
                //    measure.obj.supportlines[0].geometry.verticesNeedUpdate = true;

                //}
                //if (clicks === 2) {
                //    // 2라인 이동
                //    var vector = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
                //    measure.obj.supportlines[1].geometry.vertices[1].copy(vector);
                //    measure.obj.supportlines[1].geometry.verticesNeedUpdate = true;
                //}
            }
            else {
                if (clicks === 0)
                    markerA.visible = false;
                if (clicks === 1) {
                    markerA.visible = true;
                    markerB.visible = false;
                }
                if (clicks === 2) {
                    markerA.visible = true;
                    markerB.visible = true;
                    markerC.visible = false;
                }
            }

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
        else {
            var mouse = view.Data.GetMousePos(event);

            
            //var vecMouse = new THREE.Vector3().copy(measure.obj.centerArc).project(camera_review);
            var vecMouse = new THREE.Vector3().copy(pointsBase[0]).project(camera);


            pointsBase[3] = new THREE.Vector3(mouse.x, mouse.y, vecMouse.z).unproject(camera);
            var point_Review = [];
            for (var i = 0; i < pointsBase.length; i++) {
                point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(pointsBase[i])));
            }

            // 3라인 이동
            measure.obj.supportlines[2].geometry.vertices[1].copy(point_Review[3]);
            measure.obj.supportlines[2].geometry.verticesNeedUpdate = true;

            objText.position.copy(new THREE.Vector3().copy(point_Review[3]));

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);

            markerA.visible = false;
            markerB.visible = false;
            markerC.visible = false;
            
        }
    }
    function makeAngle(event) {
        //var intersects = view.Data.GetIntersections(event);
        var intersects = view.Picking.PickInfo(event);

        if (clicks < 3) {
            if (intersects.length > 0) {
                var index = 0;
                var intersect = intersects[index];
                if (intersect) {
                    var face = intersect.face;
                    var point = intersect.point;
                    var object = intersect.object;
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    //points[clicks].copy(snap);
                    //markers[clicks].position.copy(snap);
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));

                    markers[clicks].material.color = new THREE.Color(1, 0, 0);
                } else {
                    //points[clicks].copy(intersects[0].point);
                    //markers[clicks].position.copy(intersects[0].point);
                    pointsBase[clicks].copy(intersects[0].point);
                    points[clicks].copy(getReviewCameraPos(intersects[0].point));
                    markers[clicks].position.copy(getReviewCameraPos(intersects[0].point));
                    markers[clicks].material.color = new THREE.Color(0, 1, 0);
                }

                setLine(intersects[0].point, intersects[0].point);

                var mouse = view.Data.GetMousePos(event);
                mousepoints[clicks].copy(mouse);

                clicks++;

                if (clicks === 1) {
                    // 두점 라인 그리기
                    var distance = points[0].distanceTo(points[1]);
                    //setLine(points[0], points[1]);

                    var vector = new THREE.Vector3(mouse.x, mouse.y, points[0].z).unproject(camera_review);
                    //vector.z = points[0].z;
                    points[1].copy(vector);

                    ////add_Distance(points[0], points[1], getUnit(distance));
                    add_Angle();
                }
                else if (clicks === 2) {
                    // 세점 라인 그리기
                    var distance = points[0].distanceTo(points[2]);
                    //setLine(points[0], points[1]);
                    var vector = new THREE.Vector3(mouse.x, mouse.y, points[0].z).unproject(camera_review);
                    //vector.z = points[1].z;
                    points[2].copy(vector);
                    add_Angle();
                }
                else if (clicks === 3) {
                    add_Angle();
                }
            }
        }
        else {
            //var mouse = new THREE.Vector2();
            //mouse.set(
            //    event.clientX / window.innerWidth * 2 - 1,
            //    -(event.clientY / window.innerHeight) * 2 + 1
            //);
            var mouse = view.Data.GetMousePos(event);
            mousepoints[2].copy(mouse);
            clicks = 0;
            addMeasureMap();
            initMeasureItem();
        }
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

    function getReviewCameraPos(pos) {
        var v1 = new THREE.Vector3().copy(pos).project(camera);
        var v2 = v1.unproject(camera_review);
        return v2;
    }

    function pixelToOffset(pos, px) {
        var v1 = new THREE.Vector3().copy(pos).project(camera);
        v1.y -= px;
        var v2 = v1.unproject(camera);
        var v = new THREE.Vector3();
        v.subVectors(pos, v2);

        return v.length();
    }

    // 스냅 정점 확인
    this.findClosestVertex = function (object, position, radius) {
        radius = getRadius(new THREE.Vector3(), 0.001);
        var arrPosition = object.geometry.attributes.position.array;
        var vertices = [];
        for (var i = 0; i < arrPosition.length; i = i + 3) {
            var vec = new THREE.Vector3(arrPosition[i], arrPosition[i + 1], arrPosition[i + 2]);
            vertices.push(vec);
        }
        if (vertices.length === 0) {
            return null;
        }
        var distance, vertex = null,
            localPosition = object.worldToLocal(position.clone());
        for (var i = 0, il = vertices.length; i < il; i++) {
            distance = vertices[i].distanceTo(localPosition);
            if (distance > radius) {
                continue;
            }
            // use distance in new comparison to find the closest point
            radius = distance;
            vertex = vertices[i];
        }
        if (vertex === null) {
            return null;
        }
        return object.localToWorld(vertex);
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

        //var intersects = getIntersections(event);
        if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_DISTANCE) {
            makeDistance(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_POS) {
            makePos(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_ANGLE) {
            makeAngle(event);
        }
    };

    this.onMouseMove = function (event) {
        if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_DISTANCE) {
            processDistance(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_POS) {
            //setTimeout(function () {
                processPos(event);    
            //}, 25);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_MEASURE_ANGLE) {
            processAngle(event);
        }
    };

    this.Render = function () {
        renderer.autoClear = false;

        var rect = view.Container.getBoundingClientRect();
        renderer.setViewport(0, 0, rect.width, rect.height);

        // 2D 카메라 설정
        setReviewCamera(rect);

        radius = getRadius(new THREE.Vector3(), offsetSnap);
        
        update();
        renderer.clearDepth();

        

        renderer.render(scene, camera_review);
        renderer.clearDepth();
        renderer.render(sceneSprite, camera_review);
    };
}