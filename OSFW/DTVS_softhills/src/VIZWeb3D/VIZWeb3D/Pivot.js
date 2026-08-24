/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Pivot = function (container, scene, camera, renderer, control) {
    var scope = this;

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = camera;
    this.control = control;
    this.renderer = renderer;

    var pivot = null;
    this.sphere = null;
    this.sphere1 = null;
    this.sphere2 = null;
    this.sphere3 = null;
    this.sphere4 = null;
    this.sphere5 = null;

    this.DrawRender = false;

    var eventCnt = 0;
    var oldradius = 0;

    // API
    this.Option = {
        get 'Visible'() {
            return pivot.visible;
        },
        set 'Visible'(v) {
            pivot.visible = v;
        }
    };

    init();
    function init() {

        controls.addEventListener('change', onChanged);
        controls.addEventListener('start', onChangedStart);
        controls.addEventListener('end', onChangedEnd);
        container.addEventListener("mouseup", onDocumentMouseUp, false);
        add();
    }

    function add() {
        pivot = new THREE.Object3D();
        pivot.visible = false;

        scope.scene.add(pivot);

        var geometry = new THREE.SphereGeometry(90, 32, 32);
        var material = new THREE.MeshPhongMaterial({
            color: 0xff5050,
            side: THREE.DoubleSide,
            transparent: true,
            vertexColors: THREE.NoColors,
        });
        sphere = new THREE.Mesh(geometry, material);
        sphere.renderOrder = 1;
        sphere.onBeforeRender = function (renderer) { renderer.clearDepth(); };
        pivot.add(sphere);

        geometry = new THREE.SphereGeometry(120, 32, 32, 0, Math.PI * 2, 0, 0.3);
        material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            vertexColors: THREE.NoColors,
            opacity : 0.6
        });
        sphere1 = new THREE.Mesh(geometry, material);
        sphere1.renderOrder = 1;
        pivot.add(sphere1);

        geometry = new THREE.SphereGeometry(120, 32, 32, 0, Math.PI * 2, Math.PI / 5 * 2, 0.3);
        sphere2 = new THREE.Mesh(geometry, material);
        sphere2.renderOrder = 1;
        pivot.add(sphere2);

        geometry = new THREE.SphereGeometry(120, 32, 32, 0, Math.PI * 2, Math.PI / 5 * 3, 0.3);
        sphere3 = new THREE.Mesh(geometry, material);
        sphere3.renderOrder = 1;
        pivot.add(sphere3);

        geometry = new THREE.SphereGeometry(120, 32, 32, 0, Math.PI * 2, Math.PI / 5 * 4, 0.3);
        sphere4 = new THREE.Mesh(geometry, material);
        sphere4.renderOrder = 1;
        pivot.add(sphere4);

        geometry = new THREE.SphereGeometry(120, 32, 32, 0, Math.PI * 2, Math.PI / 5 * -1.5, 0.3);
        sphere5 = new THREE.Mesh(geometry, material);
        sphere5.renderOrder = 1;
        pivot.add(sphere5);


        //var lightAmb = new THREE.AmbientLight(0x303030); // soft white light
        var lightAmb = new THREE.AmbientLight(0xaaaaaa); // soft white light
        scope.scene.add(lightAmb);

        pivot.visible = false;

        var vCenter = new THREE.Vector3(0, 0, 0);
        var vUp = new THREE.Vector3(0, 0, 1);
        var vLat = new THREE.Vector3(0.1, 0.1, 0.1);

        var LightDir = new THREE.Vector3().subVectors(vUp, vCenter);

        LightDir.applyAxisAngle(vLat, 30 / 180.0 * 3.141592);
        LightDir.applyAxisAngle(vUp, 10 / 180.0 * 3.141592);
        var dirUp = LightDir;

        light1 = new THREE.DirectionalLight(0xffffff, 1);
        var lightPos1 = new THREE.Vector3(dirUp.x, dirUp.y, dirUp.z);
        light1.position.copy(lightPos1);
        scope.scene.add(light1);

        var lightPos2 = new THREE.Vector3(-dirUp.x, -dirUp.y, -dirUp.z);

        light2 = new THREE.DirectionalLight(0xeeeeee, 1);
        light2.position.copy(lightPos2);
        scope.scene.add(light2);
    }

    this.update = function () {
        if (controls.PivotProcess === 1) {
            if (controls.WheelDown) {
                pivot.visible = true;
            }
            else {
                pivot.visible = false;
            }
        }
        else {
            pivot.visible = true;
        }
        
        pivot.position.copy(scope.control.Pivot);

        scope.renderer.autoClear = false;
        var rect = scope.container.getBoundingClientRect();
        renderer.setViewport(0, 0, rect.width, rect.height);

        var offset = 0.015;
        var radius = getRotatePivotRadius(pivot.position, offset);

        if (oldradius !== radius)
        {
            var ratio = radius / 60;
            pivot.scale.set(ratio, ratio, ratio);
        }    
        else
            oldradius = radius;

        renderer.render(scope.scene, scope.camera);
        pivot.visible = false;
    };

    function getRotatePivotRadius(pos, offset) {
        var v1 = new THREE.Vector3().copy(pos).project(scope.camera);
        v1.y -= offset;
        var v2 = v1.unproject(scope.camera);
        var v = new THREE.Vector3();
        v.subVectors(pos, v2);

        return v.length();
    }

    function onChanged() {
        scope.DrawRender = true;
        eventCnt++;
        startPivotRenderTimer();
    }

    function onChangedStart() {
        scope.DrawRender = true;
        eventCnt++;
        startPivotRenderTimer();
    }

    function onChangedEnd() {
        eventCnt++;
        startPivotRenderTimer();
    }

    function onDocumentMouseUp(event) {
    }

    function startPivotRenderTimer() {
        var self = this;
        this.nLongTabTimer = setTimeout(function () {
            eventCnt--;
            if (eventCnt === 0) {
                scope.DrawRender = false;

                scope.EventHandler.dispatchEvent(EVENT_TYPES.Pivot.DrawRender);
                delete self.nLongTabTimer;
            }
        }, 2000);
    }
}