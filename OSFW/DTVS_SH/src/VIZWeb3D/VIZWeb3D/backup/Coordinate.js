/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Coordinate = function (domElement) {
    //THREE.Object3D.call(this);

    //domElement = (domElement !== undefined) ? domElement : document;
    
    // Private
    var scope = this;
    var coordinate = null;
    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;
    // Public
    
    // API
    this.Option = {
        get 'Visible'() {
            return coordinate.visible;
        },
        set 'Visible'(v) {
            coordinate.visible = v;
            scope.EventHandler.dispatchEvent(EVENT_TYPES.Control.Changed);
        }
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-50, 50, 50, -50, -50, 50);

    // Function
    init();
    function init() {
        
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
        scope.scene.add(lightCoordinate1);

        var lightCoordinatePos2 = new THREE.Vector3(-dirUp.x, -dirUp.y, -dirUp.z);
        var lightCoordinate2 = new THREE.DirectionalLight(0xffffff, 1);
        lightCoordinate2.position.copy(lightCoordinatePos2);
        scope.scene.add(lightCoordinate2);

        scope.scene.matrixAutoUpdate = false;
        scope.scene.add(scope.camera);

        Add();
    }

    function Add() {
        //var coordinate = new THREE.Object3D();
        coordinate = new THREE.Object3D();
        var offset = 2;
        var height = 25;
        // 좌표축 추가
        var geometry = new THREE.SphereGeometry(offset * 1.8, 32, 32);
        var material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        var sphere = new THREE.Mesh(geometry, material);
        coordinate.add(sphere);

        var arrow = new THREE.Object3D();
        var origin = new THREE.Vector3(0, 0, 0);
        var terminus = new THREE.Vector3(1, 0, 0);
        var dir = new THREE.Vector3().subVectors(terminus, origin).normalize();
        geometry = new THREE.CylinderBufferGeometry(offset, offset, height, 32, 1);
        geometry.translate(0, height / 2, 0);
        material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        var cylinder = new THREE.Mesh(geometry, material);
        arrow.add(cylinder);

        geometry = new THREE.CylinderBufferGeometry(0, offset * 2, 5, 32, 1);
        geometry.translate(0, height, 0);
        material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        var cone = new THREE.Mesh(geometry, material);
        arrow.add(cone);

        var spritey = Add_TextSprite("X", { fontsize: 48, backgroundColor: { r: 255, g: 0, b: 0, a: 1 } });
        spritey.position = spritey.position.set(height + 8, 0, 0);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
        coordinate.add(spritey);

        Set_ModelDirection(arrow, dir);
        coordinate.add(arrow);

        arrow = new THREE.Object3D();
        origin = new THREE.Vector3(0, 0, 0);
        terminus = new THREE.Vector3(0, 1, 0);
        dir = new THREE.Vector3().subVectors(terminus, origin).normalize();
        geometry = new THREE.CylinderBufferGeometry(offset, offset, height, 32, 1);
        geometry.translate(0, height/2, 0);
        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        cylinder = new THREE.Mesh(geometry, material);
        arrow.add(cylinder);

        geometry = new THREE.CylinderBufferGeometry(0, offset* 2, 5, 32, 1);
        geometry.translate(0, height, 0);
        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        cone = new THREE.Mesh(geometry, material);
        arrow.add(cone);

        spritey = Add_TextSprite("Y", { fontsize: 48, backgroundColor: { r: 0, g: 255, b: 0, a: 1 } });
        spritey.position = spritey.position.set(0, height + 8, 0);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
        coordinate.add(spritey);

        Set_ModelDirection(arrow, dir);
        coordinate.add(arrow);

        arrow = new THREE.Object3D();
        origin = new THREE.Vector3(0, 0, 0);
        terminus = new THREE.Vector3(0, 0, 1);
        dir = new THREE.Vector3().subVectors(terminus, origin).normalize();
        geometry = new THREE.CylinderBufferGeometry(offset, offset, height, 32, 1);
        geometry.translate(0, height/2, 0);
        material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        cylinder = new THREE.Mesh(geometry, material);
        arrow.add(cylinder);

        geometry = new THREE.CylinderBufferGeometry(0, offset * 2, 5, 32, 1);
        geometry.translate(0, height, 0);
        material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        cone = new THREE.Mesh(geometry, material);
        arrow.add(cone);

        spritey = Add_TextSprite("Z", { fontsize: 48, backgroundColor: { r: 0, g: 0, b: 255, a: 1 } });
        spritey.position = spritey.position.set(0, 0, height + 8);//new THREE.Vector3(20, 0, 0).multiplyScalar(1.1);
        coordinate.add(spritey);

        Set_ModelDirection(arrow, dir);
        coordinate.add(arrow);

        scope.scene.add(coordinate);
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

        //var spriteAlignment = parameters.hasOwnProperty("alignment") ?
        //	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

        //var spriteAlignment = THREE.SpriteAlignment.topLeft;


        var canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        var context = canvas.getContext('2d');
        //context.font = "Bold " + fontsize + "px " + fontface;
        context.font = fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        //var metrics = context.measureText(message);
        //var textWidth = metrics.width;
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
        //this.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        //context.fillStyle = "rgba(0, 0, 0, 1.0)";

        var x = (canvas.width - metrics.width) / 2;
        var y = (canvas.height - metricsh.height) / 2 + metricsh.height / 2;
        var offset = 5;

        //context.fillText(message, 136, fontsize + 55);
        context.fillText(message, borderThickness / 2 + x, borderThickness / 2 + y);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            { map: texture });
        //{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 30, 30.0);
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

    function Set_ModelDirection(object, dir) {
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
    
};

