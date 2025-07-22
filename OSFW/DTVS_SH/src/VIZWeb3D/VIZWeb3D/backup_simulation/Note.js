VIZWeb3D.Note = function (VIEW, camera, renderer) {
    var scope = this;
    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    // Note Scene
    var scene = new THREE.Scene();
    // Sprite Scene
    var sceneSprite = new THREE.Scene();
    // Note Context
    var ctx_review = VIEW.ctx_review;

    // Review Camera
    var camera_reviewSize = 200;
    var camera_reviewNear = -200;
    var camera_reviewFar = 200;
    var camera_review = new THREE.OrthographicCamera(-camera_reviewSize, camera_reviewSize, camera_reviewSize, -camera_reviewSize, camera_reviewNear, camera_reviewFar);

    var view = VIEW;
    var offsetSnap = 0.02;
    var sizeMarker = 2;
    var sizeText = 1500;
    var sizeArrow = 20;
    // Mouse Click
    var clicks = 0;

    var colLine = { r: 255, g: 255, b: 255, a: 1.0 };
    var colArrow = { r: 255, g: 0, b: 0, a: 1.0 };
    var colPoint = { r: 255, g: 0, b: 0, a: 1.0 };
    var colPick = { r: 0, g: 255, b: 0, a: 1.0 };
    var colBack = { r: 0, g: 255, b: 0, a: 1.0 };
    var colBorder = { r: 255, g: 0, b: 0, a: 1.0 };
    var colText = { r: 255, g: 0, b: 0, a: 1.0 };

    var noteItem = function () {
        var item = {
            id: view.Data.UUIDv4(),
            type: REVIEW_TYPES.NONE,
            text: null,
            points: [],
            pointsBase: [],
            mousepoints: [],
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
                arrows: [],
                supportlines: [],
                center: null,
                text: null
            }
        };
        return item;
    };

    var noteAnimationItem = function () {
        var a_item = {
            item: noteItem(),
            style: {
                fontsize: 12,
                backgroundColor: null,
                borderColor: null,
                textColor: null,

                border: {
                    offset: 5
                }
            },
            linkId: -1
        };
        return a_item;
    };

    // Note 관리
    var mapNote = new Map();
    var mapNoteAnimation = new Map();

    // Drawing 관리
    var markerA = new THREE.Mesh(
        new THREE.SphereGeometry(sizeMarker, 10, 20),
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(colPick.r / 255, colPick.g / 255, colPick.b / 255),
            opacity: colPick.a
        })
    );
    
    var markers = [
        markerA
    ];

    var objNote = new THREE.Object3D();
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

    this.ReviewType = REVIEW_TYPES.NONE;
    this.ReviewMode = false;
    var noteProcess = false;
    var bSelect = false;

    // Base Camera Points
    var pointsBase = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
    ];

    var points = [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
    ];

    var mousepoints = [
        new THREE.Vector2(),
        new THREE.Vector2(),
        new THREE.Vector2()
    ];

    this.Start = function (type) {
        scope.ReviewMode = true;
        objMarker.visible = true;
        markerA.visible = false;
        scope.ReviewType = type;
        clicks = 0;
        initNoteItem();
        
        visibleTextWindow(true);
    };

    this.End = function () {
        scope.ReviewMode = false;
        objMarker.visible = false;
        markerA.visible = false;
        currentObjDispose();
        clicks = 0;
        visibleTextWindow(false);
        scope.ReviewType = REVIEW_TYPES.NONE;
        scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
    };

    function setLine(vectorA, vectorB) {
        line.geometry.vertices[0].copy(vectorA);
        line.geometry.vertices[1].copy(vectorB);
        line.geometry.verticesNeedUpdate = true;
    }

    function initNoteItem() {
        note = noteItem();
        obj = new THREE.Object3D();
        objText = new THREE.Object3D();

        $('#ui_note_text').val("");
        if (scope.ReviewType === REVIEW_TYPES.RK_2D_NOTE)
            $('#ui_note_title').html("2D Note");
        if (scope.ReviewType === REVIEW_TYPES.RK_3D_NOTE)
            $('#ui_note_title').html("3D Note");
        if (scope.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE)
            $('#ui_note_title').html("Surface Note");
        
        bSelect = false;
    }

    function visibleTextWindow(visible) {
        var popup = $("#ui_note_div");
        if (popup.length > 0) {
            if (scope.ReviewType === REVIEW_TYPES.RK_2D_NOTE || scope.ReviewType === REVIEW_TYPES.RK_3D_NOTE) {
                if (visible) {
                    $('#ui_btn_note_select').hide();
                    $('#ui_note_div').fadeIn(500);
                    $("#ui_note_div").mouseover(function () {
                        view.Lock(true);
                    }).mouseout(function () {
                        view.Lock(false);
                    });
                }
                else
                    $('#ui_note_div').fadeOut(500);
            }
            else if (scope.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE) {
                if (visible) {
                    $('#ui_btn_note_select').show();
                    $('#ui_note_div').fadeIn(500);
                    $("#ui_note_div").mouseover(function () {
                        view.Lock(true);
                    }).mouseout(function () {
                        view.Lock(false);
                    });
                }
                else
                    $('#ui_note_div').fadeOut(500);
            }
        }
    }

    function addNoteMap() {
        note.color.colLine = { r: colLine.r, g: colLine.g, b: colLine.b, a: colLine.a };
        note.color.colPoint = { r: colPoint.r, g: colPoint.g, b: colPoint.b, a: colPoint.a };
        note.color.colPick = { r: colPick.r, g: colPick.g, b: colPick.b, a: colPick.a };
        note.color.colBack = { r: colBack.r, g: colBack.g, b: colBack.b, a: colBack.a };
        note.color.colBorder = { r: colBorder.r, g: colBorder.g, b: colBorder.b, a: colBorder.a };
        note.color.colText = { r: colText.r, g: colText.g, b: colText.b, a: colText.a };
        for (var i = 0; i < points.length; i++) {
            note.points.push(new THREE.Vector3().copy(points[i]));
        }

        for (var i = 0; i < pointsBase.length; i++) {
            note.pointsBase.push(new THREE.Vector3().copy(pointsBase[i]));
        }

        note.type = scope.ReviewType;

        mapNote.set(note.id, note);

        markerA.visible = false;
    }

    function currentObjDispose() {
        if (note !== undefined) {
            for (var i = 0; i < note.obj.markers.length; i++)
                view.Data.Dispose(note.obj.markers[i]);

            for (var i = 0; i < note.obj.arrows.length; i++)
                view.Data.Dispose(note.obj.arrows[i]);

            for (var i = 0; i < note.obj.supportlines.length; i++)
                view.Data.Dispose(note.obj.supportlines[i]);

            view.Data.Dispose(note.obj.text);
            view.Data.Dispose(note.obj.line);
        }
    }

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
        mapNote.forEach(deleteItem);

        mapNote.clear();

        objMarker.visible = false;

        view.Render();
    };

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
            opacity: colPick.a
        });
    };

    init();
    function init() {
        scene.matrixAutoUpdate = false;
        scene.add(camera);
        scene.add(objNote);
        markerA.name = "marker";

        objMarker.add(markerA);
        objMarker.visible = false;

        objNote.add(objMarker);
        objNote.add(objLine);
        objNote.add(objSnap);

        sceneSprite.add(objSprite);

        $('#ui_btn_note_ok').click(function (e) {
            var text = $('#ui_note_text').val();
            var arr = text.split('\n');
            // 텍스트 생성
            if (text.length === 0) {
                alert("Please enter text.");
                return;
            }

            text = arr;

            $('#ui_note_div').fadeOut(100);
            if (scope.ReviewType === REVIEW_TYPES.RK_2D_NOTE)
                add_2DNote(e, text);
            else if (scope.ReviewType === REVIEW_TYPES.RK_3D_NOTE)
                add_3DNote(e, text);
            else if (scope.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE)
                note.text = text;
            noteProcess = true;
        });

        $('#ui_btn_note_cancel').click(function (e) {
            scope.End();
            view.Toolbar.Refresh();
            $('#ui_note_div').fadeOut(100);
        });

        $('#ui_btn_note_select').click(function (e) {
            $('#ui_note_div').fadeOut(100);
            noteProcess = true;
            bSelect = true;
        });
        
    }

    var note;
    var obj;
    var objText;
    
    function add_3DNote(event, message) {
        var spritey = Add_TextSprite(message, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        spritey.renderOrder = 999;
        spritey.scale.set(sizeText, sizeText, sizeText);
        note.text = message;

        var mouse = view.Data.GetMousePos(event);
        mousepoints[0].copy(mouse);

        var modelCenter = view.Control.Model.Center();
        var vector2d = modelCenter.project(camera);

        var vector = new THREE.Vector3(mouse.x, mouse.y, vector2d.z).unproject(camera);
        pointsBase[0].copy(vector);
        points[0].copy(getReviewCameraPos(vector));

        spritey.name = "marker";
        spritey.position = spritey.position.copy(points[0]);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);

        //objText.add(spritey);
        objText = spritey;
        objText.userData = note;
        objSprite.add(objText);
        note.obj.text = objText;
    }

    function add_SurfaceNote(vectorA, text) {
        var marker1 = new THREE.Mesh(
            new THREE.SphereGeometry(sizeMarker, 32, 32),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(colPoint.r / 255, colPoint.g / 255, colPoint.b / 255),
                opacity: colPoint.a
            })
        );
        marker1.position.copy(markerA.position);
        marker1.userData = new THREE.Vector3().copy(pointsBase[0]);
        note.obj.markers = [
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
        note.obj.line = new THREE.Line(geometry, lineMaterial);

        var dir1 = new THREE.Vector3().subVectors(marker1.position, marker1.position).normalize();

        var arrowGeometry1 = new THREE.CylinderBufferGeometry(0, 0.2, 0.6, 12, 1, false);
        arrowGeometry1.translate(0, -0.3, 0);

        var arrMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            opacity: colArrow.a,
            color: new THREE.Color(colArrow.r / 255, colArrow.g / 255, colArrow.b / 255)
        });

        var arr1 = new THREE.Mesh(arrowGeometry1, arrMaterial);

        set_Direction(arr1, dir1);

        arr1.position.copy(marker1.position);

        note.obj.arrows = [
            arr1
        ];

        arr1.name = "arrow";

        var spritey = Add_TextSprite(text, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        spritey.renderOrder = 999;
        spritey.scale.set(sizeText, sizeText, sizeText);
        note.text = text;

        var center = new THREE.Vector3(
            marker1.position.x,
            marker1.position.y,
            marker1.position.z
        );

        note.obj.center = center;
        note.obj.text = spritey;
        
        spritey.name = "marker";
        spritey.position = spritey.position.copy(center);

        objNote.add(note.obj.markers[0]);
        objNote.add(note.obj.arrows[0]);
        obj.add(note.obj.line);
        //objText.add(spritey);
        objText.userData = note;

        objNote.add(obj);

        
        //objSprite.add(objText);
        objText = spritey;
        note.obj.text = objText;
        objSprite.add(objText);
    }

    function add_2DNote(event, message) {
        var spritey = Add_TextSprite(message, { fontsize: 12, backgroundColor: colBack, borderColor: colBorder, textColor: colText });
        spritey.renderOrder = 999;
        spritey.scale.set(sizeText, sizeText, sizeText);
        note.text = message;

        var mouse = view.Data.GetMousePos(event);
        mousepoints[0].copy(mouse);
        
        note.mousepoints[0] = new THREE.Vector2().copy(mouse);
        note.mousepoints[1] = new THREE.Vector2().copy(mouse);

        var modelCenter = view.Control.Model.Center();
        var vector2d = modelCenter.project(camera);
        var vector = new THREE.Vector3(mouse.x, mouse.y, vector2d.z).unproject(camera);
        pointsBase[0].copy(vector);
        points[0].copy(getReviewCameraPos(vector));

        spritey.name = "marker";
        spritey.position = spritey.position.copy(points[0]);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
        objText = spritey;
        objText.userData = note;
        note.obj.text = objText;
        objSprite.add(objText);
    }

    function add_Animation2DNote(message, linkId) {
        let aniNoteItem = noteAnimationItem();        
        aniNoteItem.linkId = linkId;
        aniNoteItem.item.type = REVIEW_TYPES.RK_2D_NOTE;
        
        aniNoteItem.style.fontsize = 12;
        aniNoteItem.style.backgroundColor = colBack;
        aniNoteItem.style.borderColor = colBorder;
        aniNoteItem.style.textColor = colText;
        
        aniNoteItem.item.text = message;

        mapNoteAnimation.set(aniNoteItem.item.id, aniNoteItem);
    }

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

    function update(o) {
        try {
            var updatePos = function (value) {
                var point_Review = [];
                var point_Mouse = [];

                if (value.type === REVIEW_TYPES.RK_SURFACE_NOTE) {
                    for (var i = 0; i < value.pointsBase.length; i++) {
                        point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(value.pointsBase[i])));
                        point_Mouse.push(new THREE.Vector3().copy(value.pointsBase[i]).project(camera));
                    }
                    
                    var dir = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]).normalize();
                    for (var i = 0; i < value.obj.markers.length; i++) {
                        value.obj.markers[i].position.copy(point_Review[i]);
                    }
                    //set_Direction(value.obj.arrows[0], dir);
                    //value.obj.arrows[0].position.copy(point_Review[0]);
                    value.obj.line.geometry.vertices[0].copy(point_Review[0]);
                    value.obj.line.geometry.vertices[1].copy(point_Review[1]);
                    value.obj.line.geometry.verticesNeedUpdate = true;
                    value.obj.text.position.copy(new THREE.Vector3().copy(point_Review[1]));
                }
                else if (value.type === REVIEW_TYPES.RK_3D_NOTE) {
                    for (var i = 0; i < value.pointsBase.length; i++) {
                        point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(value.pointsBase[i])));
                        point_Mouse.push(new THREE.Vector3().copy(value.pointsBase[i]).project(camera));
                    }
                    value.obj.text.position.copy(new THREE.Vector3().copy(point_Review[0]));
                }
            };

            mapNote.forEach(updatePos);
        }
        catch (error) {
            console.log(error);
        }
    }

    function update2D() {
        var modelCenter = view.Control.Model.Center();
        if (modelCenter !== null) {
            var vector2d = modelCenter.project(camera);
            for (var i = 0; i < objSprite.children.length; i++) {
                var objT = objSprite.children[i];
                if (objT.userData.type === REVIEW_TYPES.RK_2D_NOTE) {
                    var vector1 = new THREE.Vector3(objT.userData.mousepoints[0].x, objT.userData.mousepoints[0].y, -1).unproject(camera);
                    var vector2 = new THREE.Vector3(objT.userData.mousepoints[1].x, objT.userData.mousepoints[1].y, -1).unproject(camera);
                    var vSub = new THREE.Vector3().subVectors(vector1, vector2);
                    var pos = new THREE.Vector3();
                    objT.position.copy(new THREE.Vector3().subVectors(pos, vSub));

                    var vector = new THREE.Vector3(objT.userData.mousepoints[0].x, objT.userData.mousepoints[0].y, vector2d.z).unproject(camera);
                    objT.children[0].position.copy(vector);
                }
            }
        }
    }

    function updateContext2D() {

        if (ctx_review === undefined) return;

        var updateAnimationPos = function (value, key, map) {
            let review = value;

            if (review.item.type === REVIEW_TYPES.RK_2D_NOTE) {

                var mesh = view.Control.Model.AnimationObject.children[review.linkId];
                let position = new THREE.Vector3().copy(mesh.position);
                let bb_vector2d = position.project(camera);

                //let id;
                //if (view.Configuration.Model.Selection.Unit === SELECT_UNIT.Part)
                //    id = body.partId;
                //else
                //    id = body.bodyId;
                //var node = view.Data.GetNode(id);

                //let node = view.Data.GetNode(review.linkId);
                //let boundbox = node.bbox;
                //
                //let boxcenter = new THREE.Vector3(
                //    (boundbox.max.x + boundbox.min.x) / 2
                //    , (boundbox.max.y + boundbox.min.y) / 2
                //    , (boundbox.max.z + boundbox.min.z) / 2);

                //let bb_vector2d = boxcenter.project(camera);

                setOption_ctxReviewText(review);

                // box metrics
                const metrics = getTextMetrics(review);
                
                let w = metrics.width + review.style.border.offset * 2;
                let h = metrics.height * review.item.text.length + review.style.border.offset * 2;

                let pos = bb_vector2d;
                //let pixelX = (pos.x * 0.5 + 0.5) * gl.canvas.width;
                //let pixelY = (pos.y * -0.5 + 0.5) * gl.canvas.height;
                pos.x = (pos.x * 0.5 + 0.5) * ctx_review.canvas.width;
                pos.y = (pos.y * -0.5 + 0.5) * ctx_review.canvas.height;

                //text center offset
                pos.x -= w * 0.5;
                pos.y -= h * 0.5;

                // gackground
                {
                    let x = pos.x - review.style.border.offset;
                    let y = pos.y - review.style.border.offset;

                    // background 설정
                    setOption_ctxReview(review);
                    // 박스 그리기
                    Draw_RoundRect(ctx_review, x, y, w, h, 0);
                }

                setOption_ctxReviewText(review);

                for (let i = 0; i < review.item.text.length; i++) {
                    ctx_review.fillText(review.item.text[i], pos.x, pos.y + (metrics.ascent * i + metrics.ascent + review.style.border.offset * i));
                }

            }
        };

        //resizeCanvasToDisplaySize(ctx_review.canvas, view.Container.clientWidth, view.Container.clientHeight);
        resizeCanvasToDisplaySize(ctx_review.canvas);
        ctx_review.clearRect(0, 0, ctx_review.canvas.width, ctx_review.canvas.height);
        mapNoteAnimation.forEach(updateAnimationPos);
    }

    function resizeCanvasToDisplaySize(canvas, multiplier) {
        multiplier = multiplier || 1;
        const width = canvas.clientWidth * multiplier | 0;
        const height = canvas.clientHeight * multiplier | 0;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;

            return true;
        }
        return false;
    };

    function getRadius(pos, offset) {
        var v1 = new THREE.Vector3().copy(pos).project(camera);
        v1.y -= offset;
        var v2 = v1.unproject(camera);
        var v = new THREE.Vector3();
        v.subVectors(pos, v2);

        return v.length();
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
        context.font = fontsize + "pt " + fontface;

        var metrics;
        for (var i = 0; i < message.length; i++) {
            if (i === 0)
                metrics = context.measureText(message[i]);
            else if (metrics.width < context.measureText(message[i]).width)
                metrics = context.measureText(message[i]);
        }

        var metricsh = getTextHeight(context.font, message[0]);
        context.width = metrics.width;
        context.height = metricsh.height * message.length;

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
        //context.textAlign = "right";
        context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + "," + textColor.b + "," + textColor.a + ")";
        for (var i = 0; i < message.length; i++) {
            context.fillText(message[i], borderThickness / 2 + x, (borderThickness / 2 + y + metricsh.height * i) + offset / 2);
        }
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


    function setOption_ctxReview(newReview) {
        var parameters = newReview.style;

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

        ctx_review.font = fontsize + "pt " + fontface;
                
        // background color
        ctx_review.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        ctx_review.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";

        ctx_review.lineWidth = borderThickness;

        //var x = (canvas.width - metrics.width) / 2;
        //var y = (canvas.height - metricsh.height) / 2 + metricsh.height / 2;
        //var offset = 10;

        //Draw_RoundRect(context, borderThickness / 2 + x - offset + 1, y - metricsh.height, context.width + offset * 2, context.height + offset + offset / 2, 0);

        // text color
        //context.textAlign = "right";
        //context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + "," + textColor.b + "," + textColor.a + ")";
        //for (var i = 0; i < message.length; i++) {
        //    context.fillText(message[i], borderThickness / 2 + x, (borderThickness / 2 + y + metricsh.height * i) + offset / 2);
        //}

        var metrics;
        for (var i = 0; i < newReview.item.text.length; i++) {
            if (i === 0)
                metrics = ctx_review.measureText(newReview.item.text[i]);
            else if (metrics.width < ctx_review.measureText(newReview.item.text[i]).width)
                metrics = ctx_review.measureText(newReview.item.text[i]);
        }

        if (newReview.item.text.length > 0) {
            metrics.height = newReview.style.fontsize * 1.5;
            metrics.ascent = newReview.style.fontsize + newReview.style.fontsize * 0.1;
        }

        return metrics;
    }

    function setOption_ctxReviewText(newReview) {
        var parameters = newReview.style;

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

        ctx_review.font = fontsize + "pt " + fontface;

        // background color
        ctx_review.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        ctx_review.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";

        ctx_review.lineWidth = borderThickness;

        //var x = (canvas.width - metrics.width) / 2;
        //var y = (canvas.height - metricsh.height) / 2 + metricsh.height / 2;
        //var offset = 10;

        //Draw_RoundRect(context, borderThickness / 2 + x - offset + 1, y - metricsh.height, context.width + offset * 2, context.height + offset + offset / 2, 0);

        // text color
        //ctx_review.textAlign = "right";
        ctx_review.textAlign = "left";
        ctx_review.fillStyle = "rgba(" + textColor.r + "," + textColor.g + "," + textColor.b + "," + textColor.a + ")";
        //for (var i = 0; i < message.length; i++) {
        //    context.fillText(message[i], borderThickness / 2 + x, (borderThickness / 2 + y + metricsh.height * i) + offset / 2);
        //}

       
    }

    function getTextMetrics(newReview) {
        var metrics;
        for (var i = 0; i < newReview.item.text.length; i++) {
            if (i === 0)
                metrics = ctx_review.measureText(newReview.item.text[i]);
            else if (metrics.width < ctx_review.measureText(newReview.item.text[i]).width)
                metrics = ctx_review.measureText(newReview.item.text[i]);
        }

        if (newReview.item.text.length > 0) {
            metrics.height = newReview.style.fontsize * 1.5;
            metrics.ascent = newReview.style.fontsize + newReview.style.fontsize * 0.1;
        }

        return metrics;
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

    function process3DNote(event) {
        if (!noteProcess)
            return;

        if (clicks < 1) {
            var mouse = view.Data.GetMousePos(event);

            var modelCenter = view.Control.Model.Center();
            var vector2d = modelCenter.project(camera);
            var vector = new THREE.Vector3(mouse.x, mouse.y, vector2d.z).unproject(camera);
            pointsBase[0].copy(vector);
            points[0].copy(getReviewCameraPos(vector));

            note.obj.text.position.copy(points[0]);
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    }
    function make3DNote(event) {
        clicks = 0;
        noteProcess = false;
        addNoteMap();
        scope.ReviewType = REVIEW_TYPES.NONE;
        view.Toolbar.Refresh();
    }

    function processSurfaceNote(event) {

        if (!noteProcess)
            return;

        if (clicks < 1) {
            //var intersects = view.Data.GetIntersections(event);
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
                    //markers[clicks].material.color = new THREE.Color(1, 0, 0);
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
                }
            }

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
        else {
            //var mouse = view.Data.GetMousePos(event);

            //var vector1 = new THREE.Vector3(mousepoints[0].x, mousepoints[0].y, -1).unproject(camera);
            //var vector2 = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
            //var vSub = new THREE.Vector3().subVectors(vector1, vector2);
            //var pos = new THREE.Vector3();
            //obj.position.copy(new THREE.Vector3().subVectors(pos, vSub));

            //note.obj.line.geometry.vertices[1].copy(new THREE.Vector3().addVectors(points[0], vSub));
            //note.obj.line.geometry.verticesNeedUpdate = true;

            //var dir1 = new THREE.Vector3().subVectors(vector1, vector2).normalize();
            //set_Direction(note.obj.arrows[0], dir1);

            //note.obj.text.position.copy(new THREE.Vector3().subVectors(pos, vSub));

            //scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);

            var mouse = view.Data.GetMousePos(event);
            var vecMouse = new THREE.Vector3().copy(pointsBase[0]).project(camera);
            pointsBase[1] = new THREE.Vector3(mouse.x, mouse.y, vecMouse.z).unproject(camera);

            var point_Review = [];
            for (var i = 0; i < pointsBase.length; i++) {
                point_Review.push(new THREE.Vector3().copy(getReviewCameraPos(pointsBase[i])));
            }

            note.obj.line.geometry.vertices[0].copy(point_Review[0]);
            note.obj.line.geometry.vertices[1].copy(point_Review[1]);
            note.obj.line.geometry.verticesNeedUpdate = true;

            var dir = new THREE.Vector3().subVectors(point_Review[0], point_Review[1]).normalize();
            set_Direction(note.obj.arrows[0], dir);

            //note.obj.text.position.copy(new THREE.Vector3().copy(point_Review[1]));
            objText.position.copy(new THREE.Vector3().copy(point_Review[1]));

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    }

    function makeSurfaceNote(event) {
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
                    //snap = scope.findClosestVertex(object, point, radius);
                    snap = scope.findClosestVertex(object, point, offsetSnap);
                }
                if (snap) {
                    //points[clicks].copy(snap);
                    //markers[clicks].position.copy(snap);
                    //markers[clicks].material.color = new THREE.Color(1, 0, 0);
                    pointsBase[clicks].copy(snap);
                    points[clicks].copy(getReviewCameraPos(snap));
                    markers[clicks].position.copy(getReviewCameraPos(snap));
                    markers[clicks].material.color = new THREE.Color(1, 0, 0);
                } else {
                    //points[clicks].copy(intersects[0].point);
                    //markers[clicks].position.copy(intersects[0].point);
                    //markers[clicks].material.color = new THREE.Color(0, 1, 0);
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
                    var name = "";
                    if (bSelect) {
                        for (var i = 0; i < intersect.object.userData.length; i++) {
                            var body = intersect.object.userData[i];
                            if (intersect.faceIndex * 3 >= body.m_triIdx && intersect.faceIndex * 3 < body.m_triIdx + body.m_nTris) {
                                //scope.Data.Select_v2(body.bodyId, objModel, true);
                                var id;
                                if (view.Configuration.Model.Selection.Unit === SELECT_UNIT.Part)
                                    id = body.partId;
                                else
                                    id = body.bodyId;

                                var node = view.Data.GetNode(id);

                                name = node.data.name === null ? 'Body ' + node.data.index : node.data.name;

                                name = name.split('\n');
                                break;
                            }
                        }
                    }
                    else {
                        name = note.text;
                    }
                    var vector = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
                    vector.z = points[1].z;

                    add_SurfaceNote(points[0], name);
                }
            }
        }
        else {
            var mouse = view.Data.GetMousePos(event);
            mousepoints[2].copy(mouse);
            
            clicks = 0;
            addNoteMap();
            noteProcess = false;
            scope.ReviewType = REVIEW_TYPES.NONE;
            view.Toolbar.Refresh();
        }
    }

    function process2DNote(event) {
        if (!noteProcess)
            return;

        if (clicks < 1) {
            var mouse = view.Data.GetMousePos(event);

            var modelCenter = view.Control.Model.Center();
            var vector2d = modelCenter.project(camera);
            var vector = new THREE.Vector3(mouse.x, mouse.y, vector2d.z).unproject(camera);
            pointsBase[0].copy(vector);
            points[0].copy(getReviewCameraPos(vector));
            note.obj.text.position.copy(points[0]);

            note.mousepoints[1] = new THREE.Vector2().copy(mouse);
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
        else {
            clicks = 0;
            noteProcess = false;
            addNoteMap();
            scope.ReviewType = REVIEW_TYPES.NONE;
            view.Toolbar.Refresh();
        }
    }
    function make2DNote(event) {
        //clicks++;
        clicks = 0;
        noteProcess = false;
        addNoteMap();
        scope.ReviewType = REVIEW_TYPES.NONE;
        view.Toolbar.Refresh();
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

    this.findClosestVertex = function (object, position, radius) {

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

        if (scope.ReviewType === REVIEW_TYPES.RK_3D_NOTE) {
            make3DNote(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE) {
            makeSurfaceNote(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_2D_NOTE) {
            make2DNote(event);
        }
    };

    this.onMouseUp = function (event) {
        if (noteProcess === false) {
            scope.ReviewMode = false;
            view.Toolbar.Refresh();
        }
    };

    this.onMouseMove = function (event) {
        if (scope.ReviewType === REVIEW_TYPES.RK_3D_NOTE) {
            process3DNote(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE) {
            processSurfaceNote(event);
        }
        else if (scope.ReviewType === REVIEW_TYPES.RK_2D_NOTE) {
            process2DNote(event);
        }
    };

    this.addAnimation2DNote = function (message, linkId) {
        add_Animation2DNote(message, linkId);
    }

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

        updateContext2D();
    };
}