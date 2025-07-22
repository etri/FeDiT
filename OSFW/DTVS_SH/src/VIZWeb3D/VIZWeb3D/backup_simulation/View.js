function GetBrowser() {
    var agent = navigator.userAgent, match;
    var platform, app, version;

    var filter = "win16|win32|win64|mac";
    if (navigator.platform) {
        if (0 > filter.indexOf(navigator.platform.toLowerCase())) {
            platform = 1;
        } else {
            platform = 0;
        }
    }

    if ((match = agent.match(/MSIE ([0-9]+)/)) || (match = agent.match(/Trident.*rv:([0-9]+)/))) app = 1;
    else if (match = agent.match(/Edge\/([0-9]+)/)) app = 2;
    else if (match = agent.match(/Chrome\/([0-9]+)/)) app = 3;
    else if (match = agent.match(/Firefox\/([0-9]+)/)) app = 4;
    else if (match = agent.match(/Safari\/([0-9]+)/)) app = 5;
    else if ((match = agent.match(/OPR\/([0-9]+)/)) || (match = agent.match(/Opera\/([0-9]+)/))) app = 6;
    else app = 0;

    if (app !== 0) version = match[1];

    var bMS = false;
    if (app === 1 || app === 2)
        bMS = true;

    var Request = function () {
        this.getParameter = function (name) {
            var rtnval = '';
            var nowAddress = unescape(location.href);
            var parameters = (nowAddress.slice(nowAddress.indexOf('?') + 1,
                nowAddress.length)).split('&');
            for (var i = 0; i < parameters.length; i++) {
                var varName = parameters[i].split('=')[0];
                if (varName.toUpperCase() == name.toUpperCase()) {
                    rtnval = parameters[i].split('=')[1];
                    break;
                }
            }
            return rtnval;
        };
    };
    var request = new Request();
    var thema = request.getParameter('thema');

    var Browser = {
        Platform: platform,
        Type: app,
        Version: version,
        IsMS: bMS,
        Thema: thema
    };
    return Browser;
}

function BrowserScript() {
    var Browser = GetBrowser();
    //return 'VIZWeb3D/VIZWLoader';
    
    if (Browser.IsMS) {
        return 'VIZWeb3D/VIZWLoader_IE';
    }
    else {
        return 'VIZWeb3D/VIZWLoader';
    }
}

function ConfigurationFile() {
    var path = 'VIZWeb3D/Configuration.js?' + (new Date()).getTime();
    return path;
}

define([
    BrowserScript(),
    'VIZWeb3D/ThirdParty/Three/js/camera/CombinedCamera',
    'VIZWeb3D/ThirdParty/Three/js/controls/TrackballControls',
    'VIZWeb3D/ThirdParty/Three/js/controls/DragControls',
    'VIZWeb3D/ThirdParty/Three/js/controls/TransformControls',
    'VIZWeb3D/ThirdParty/Three/js/controls/OrthographicTrackballControls',
    'VIZWeb3D/ThirdParty/Three/js/controls/OrbitControls',
    'VIZWeb3D/ThirdParty/Three/js/shaders/THREE.MeshLine',
    ConfigurationFile(),
    'VIZWeb3D/Configuration_UI',
    'VIZWeb3D/Drawing',
    'VIZWeb3D/Coordinate',
    'VIZWeb3D/Data',
    'VIZWeb3D/Clipping',
    'VIZWeb3D/Pivot',
    'VIZWeb3D/Toolbar',
    'VIZWeb3D/Tree',
    'VIZWeb3D/Measure',
    'VIZWeb3D/Note',
    'VIZWeb3D/Property',
    'VIZWeb3D/Outline',
    'VIZWeb3D/EventDispatcher',
    'VIZWeb3D/Animation',
    'VIZWeb3D/Picking'
],
    function (VIZWLoader) {
        function VIEW(obj) {
            scope = this;
            
            // base
            container = obj;
            this.Container = container;
            scene = null, sceneCoordinate = null;
            sceneOut = new THREE.Scene();
            sceneTexture = new THREE.Scene();
            sceneGround = new THREE.Scene();
            renderTarget = null;

            cube = null;
            var ctx_review;

            //composer = null;
            camera = null; cameraCoordinate = null;
            renderer = null, light = null, spotLight = null, raycaster = null;
            lightCamera = null;
            light1 = null, light2 = null;
            stats = null;
            controls = null;
            mouse = new THREE.Vector2();
            mouseAction = true;


            // data
            //objModel = null;
            objModel = new THREE.Object3D();
            objGround = null;
            objClipping = null;
            objEdge = new THREE.Object3D();
            objPivot = new THREE.Object3D();
            objAnimation = new THREE.Object3D();
            objDrag = [];
            orgModelBBox = null;
            orgModelCenter = null;
            objOutline = new THREE.Object3D();

            this.Browser = GetBrowser();
            // class
            this.Data = null;//new VIZWeb3D.Data(this, objModel);
            coordinate = new VIZWeb3D.Coordinate();
            clipping = null;
            pivot = null;
            loaderVIZW = null;
            datamng = null;

            //event = new VIZWeb3D.EventDispatcher(window, container);
            //this.Event = event;
            eventHandler = new VIZWeb3D.EventDispatcher(window, container);
            this.EventHandler = eventHandler;
            this.Toolbar = new VIZWeb3D.Toolbar(this);
            this.Tree = null;
            this.Configuration = new VIZWeb3D.Configuration();
            this.Animation = null;
            

            if (this.Browser.Thema === '1')
                this.Configuration.Thema.Type = THEMA_TYPES.Splitter;

            this.Measure = null;
            this.Note = null;
            this.Property = null;
            this.Outline = null;
            this.Drawing = null;
            this.Picking = null;

            // configuration
            bEnableRender = true;
            bWebGLInit = false;
            visible_ground = true;
            visible_model = true;
            visible_edge = false;
            bInit_Edge = false;
            _rendermode = RENDER_MODES.Smooth;
            _cameradirection = CAMERA_DIRECTIONS.PlusISO;
            _projection = PROJECTION_MODES.Orthographic;

            loadScene = null;
            cameraType = 0; //0 : Perspective, 1 : Orthographic

            viewBoundBox = null;

            helperCamera = null;

            cameraInitPos = new THREE.Vector3();
            let sphereBBox = null;

            _Datas = [];
            _TargetMeshes = [];

            ID = 0;
            _TotalDownloadCnt = 0;
            _CurrentDownloadSeq = 0;

            onDownPosition = new THREE.Vector2();
            onUpPosition = new THREE.Vector2();
            onCurrentPosition = new THREE.Vector2();
            onPickPosition = new THREE.Vector2();

            progress();

            // Data Process
            select = {
                body: null,
                mesh: null,
                source: null
            };

            keycode = '/?flag=4&id=2&msg=53@127.0.0.1@00-00-00-00-00-00@N/A@N/A@N/A@N/A@1.0.0.1';
            //keycode = '/?flag=4&id=11&msg=53@127.0.0.1@00-00-00-00-00-00@N/A@N/A@N/A@N/A@1.0.0.1';

            testHiddenline = true;

            //var effectComposer;
            //var ssaoPass;
            //var group;

            //this.postprocessing = { enabled: false, onlyAO: true, radius: 32, aoClamp: 0.25, lumInfluence: 0.7 };

            renderCnt = 0;
            eventCnt = 0;
            animationCnt = 0;

            pickingMap = null;

            this.AnimationSample = true;
            this.TRIAL = true;

            InitInfo();
            InitUI();
        }

        VIEW.prototype = {
            Constructor: VIEW,
            RenderEvent: false,
            ModelData: function () {
                return objModel;
            },
            Coordinate: null,
            Clipping: null,
            Event: null,
            Toolbar: null,
            Tree: null,
            Ground: new function () {
                this.Option = {
                    get 'Visible'() {
                        return visible_ground;
                    },
                    set 'Visible'(v) {
                        //createLine(objModel.children[0]);
                        visible_ground = v;
                        scope.RenderEvent = true;
                    }
                };
            },

            Control: new function () {
                this.Edge = {
                    get 'Visible'() {
                        return visible_edge;
                        //return objEdge.visible;
                    },
                    set 'Visible'(v) {
                        //if (!bInit_Edge) {
                        //    bInit_Edge = true;
                        //}
                        visible_edge = v;
                        if (visible_edge)
                            setEdgeData(objModel);

                        objEdge.visible = visible_edge;
                        scope.RenderEvent = true;
                    }
                };
                this.Model = {
                    get 'Visible'() {
                        return visible_model;
                    },
                    set 'Visible'(v) {
                        visible_model = v;
                        scope.RenderEvent = true;
                    },
                    get 'RenderMode'() {
                        return _rendermode;
                    },
                    set 'RenderMode'(v) {
                        _rendermode = v;

                        setRenderMode(v, objModel);
                        scope.Toolbar.Refresh();
                        scope.RenderEvent = true;
                    },
                    get 'Object'() {
                        return objModel;
                    },
                    get 'AnimationObject'() {
                        return objAnimation;
                    },
                    Add: function (v) {
                        scope.Add_Model(v);
                        scope.RenderEvent = true;
                    },
                    Close: function () {
                        dispose(objModel);
                        //scene.remove(objModel);
                        dispose(objEdge);
                        //scene.remove(objEdge);

                        //objModel = new THREE.Object3D();
                        //objEdge = new THREE.Object3D();
                        scope.RenderEvent = true;
                    },
                    Find: function (text, fullmatch) {
                        return scope.Data.Find(text, fullmatch);
                    },
                    Select: function (id, treeselect) {
                        //scope.Data.Select(id, objModel, false);
                        scope.Data.Select_v2(id, objModel, treeselect);
                        scope.RenderEvent = true;
                    },
                    Show: function (id, visible) {
                        //scope.Data.Show(id, objModel, visible);
                        scope.Data.Show_v2(id, objModel, visible);
                        scope.Data.ShowEdge(id, objEdge);
                        //scope.Data.ShowEdge_v2(objEdge, objModel);
                        scope.RenderEvent = true;
                    },
                    Center: function () {
                        if (orgModelCenter === null)
                            return null;
                        else
                            return new THREE.Vector3().copy(orgModelCenter);
                    }
                    
                };
                this.Camera = {
                    get 'Direction'() {
                        return _cameradirection;
                    },
                    set 'Direction'(v) {
                        _cameradirection = v;
                        scope.Camera_Rotate(v);
                        scope.Camera_Rotate(v);
                        scope.RenderEvent = true;
                    },
                    get 'Projection'() {
                        return _projection;
                    },
                    set 'Projection'(v) {
                        scope.RenderEvent = true;
                        if (_projection !== v) {
                            _projection = v;
                            if (_projection === PROJECTION_MODES.Orthographic) {
                                camera.setCameraMode(PROJECTION_MODES.Orthographic);
                                //camera.toOrthographic();
                            }
                            else {
                                camera.setCameraMode(PROJECTION_MODES.Perspective);
                                //camera.toPerspective();
                            }
                        }
                        scope.RenderEvent = true;
                    },
                    InitPos: function () {
                        scope.Camera_FitAll(objModel);
                        controls.Pivot.copy(orgModelCenter);

                        scope.Camera_Rotate(CAMERA_DIRECTIONS.PlusISO);

                        lightCamera.position.copy(camera.position);
                        lightCamera.target = objModel;

                        scope.RenderEvent = true;
                    },
                    Focuse: function (ID) {
                        scope.Camera_FocuseObject(ID, 1);
                    },
                };
            },
            Property: null,

            Init: function () {
                if (!bWebGLInit) {
                    loadScene = this.Init_LoadScene();
                }
                scene = loadScene.scene;
                camera = loadScene.camera;
                sceneCoordinate = coordinate.scene;
                cameraCoordinate = coordinate.camera;

                this.Coordinate = coordinate;
                this.Coordinate.EventHandler.addEventListener(EVENT_TYPES.Control.Changed,
                    function () {
                        scope.RenderEvent = true;
                    });



                raycaster = new THREE.Raycaster();

                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));

                var material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });

                line = new THREE.Line(geometry, material);
                scene.add(line);

                // outline
                sceneOut.add(objOutline);

                //**************************************************
                loaderVIZW = new VIZWLoader();
                this.Parse = loaderVIZW;
                //**************************************************
                if (!bWebGLInit) {
                    addCustomEventListener();
                    this.Add_Render();
                    //this.Add_Model();
                    this.Add_Light();
                    this.Add_Controllers();


                    //datamng = new DataManager(container, camera, raycaster);

                    this.EventHandler = eventHandler;

                    objModel = new THREE.Object3D();
                    this.Data = new VIZWeb3D.Data(this, objModel);

                    clipping = new VIZWeb3D.Clipping(scene, camera, renderer, controls, objModel, objEdge, this.Data);
                    this.Clipping = clipping;
                    this.Clipping.EventHandler.addEventListener(EVENT_TYPES.Control.Changed,
                        function () {
                            scope.RenderEvent = true;
                        });

                    pivot = new VIZWeb3D.Pivot(container, scene, camera, renderer, controls);
                    pivot.EventHandler.addEventListener(EVENT_TYPES.Pivot.DrawRender,
                        function () {
                            scope.RenderEvent = true;
                        });

                    this.Tree = new VIZWeb3D.Tree(this);
                    this.Tree.SetOption(this.Configuration.Tree);

                    this.Data.EventHandler.addEventListener(EVENT_TYPES.Data.Selected,
                        function (event) {
                            if (event.data.treeselect === true)
                                scope.Tree.Select(event.data.id);
                            scope.Clipping.UpdateModel(objModel);
                            scope.RenderEvent = true;

                            var node = scope.Data.GetNode(event.data.id);
                            var name = node.data.name === null ? 'Body ' + node.data.index : node.data.name;
                            scope.EventHandler.dispatchEvent(EVENT_TYPES.Model.Select, { id: event.data.id, name: name });
                        });
                    this.Data.EventHandler.addEventListener(EVENT_TYPES.Data.Deselect_All,
                        function (event) {
                            scope.Tree.DeselectAll();
                            scope.Clipping.UpdateModel(objModel);
                            scope.RenderEvent = true;
                            scope.EventHandler.dispatchEvent(EVENT_TYPES.Model.Select, { id: -1, name: '' });
                        });

                    this.Data.EventHandler.addEventListener(this.Data.Load,
                        function () {
                            scope.Parse.parsetype = scope.Data.ParseType;
                            scope.EventHandler.dispatchEvent(EVENT_TYPES.View.Init);
                        });
                    this.Data.EventHandler.addEventListener(this.Data.Parse,
                        function () {
                            scope.Parse.parsetype = scope.Data.ParseType;
                        });

                    this.Data.SetOption(this.Configuration.Model);

                    this.Data.Check(this.Configuration.AUTHORITY_PARAMS.Data + keycode);


                    visible_ground = this.Configuration.Ground.Option.Visible;

                    this.Toolbar.SetOption(this.Configuration.Toolbar);
                    if (scope.Browser.Platform === PLATFORM_TYPES.Mobile) {
                        this.Toolbar.Resize();
                    }

                    this.Configuration.EventHandler.addEventListener(EVENT_TYPES.Toolbar.Show,
                        function () {
                            scope.Toolbar.Visible = true;
                        });

                    this.Configuration.EventHandler.addEventListener(EVENT_TYPES.Toolbar.Hide,
                        function () {
                            scope.Toolbar.Visible = false;
                        });

                    this.Measure = new VIZWeb3D.Measure(this, camera, renderer);
                    this.Measure.EventHandler.addEventListener(EVENT_TYPES.Control.Changed,
                        function () {
                            scope.RenderEvent = true;
                        });

                    this.Measure.SetOption(this.Configuration.Measure);

                    this.Note = new VIZWeb3D.Note(this, camera, renderer);
                    this.Note.EventHandler.addEventListener(EVENT_TYPES.Control.Changed,
                        function () {
                            scope.RenderEvent = true;
                        });

                    this.Note.SetOption(this.Configuration.Note);

                    this.Property = new VIZWeb3D.Property(this);

                    this.Outline = new VIZWeb3D.Outline(new THREE.Vector2(window.innerWidth, window.innerHeight), scope.Data, renderer);

                    this.Drawing = new VIZWeb3D.Drawing(this, camera, renderer);

                    this.Drawing.EventHandler.addEventListener(EVENT_TYPES.Control.Changed,
                        function () {
                            scope.RenderEvent = true;
                            scope.Lock(false);
                        });

                    // Test Drawing
                    //this.Drawing.Start(DRAWING_TYPES.CUSTOM);
                    //this.Lock(true);
                    //mouseAction = true;

                    this.Configuration_UI = new VIZWeb3D.Configuration_UI(this);

                    this.Animation = new VIZWeb3D.Animation(this);

                    this.Picking = new VIZWeb3D.Picking(this, scene, camera, renderer, new THREE.Vector2(window.innerWidth, window.innerHeight));

                    scene.add(objModel);
                    scene.add(objAnimation);

                    //initPostprocessing();
                    

                    bWebGLInit = true;
                }
            },

            Init_LoadScene: function () {

                var frustumSize = 500;
                var aspect = window.innerWidth / window.innerHeight;
                var camera1 = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000);

                var result = {

                    scene: new THREE.Scene(),
                    camera: new THREE.CombinedCamera(window.innerWidth, window.innerHeight, 60, 1, 10000000, 1, 10000000, this, container)
                    //new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 100000000)
                };

                result.camera.position.z = 100;

                result.scene.add(result.camera);
                result.scene.matrixAutoUpdate = false;

                return result;
            },



            // 렌더링 추가
            Add_Render: function () {
                // render
                //renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setClearColor(0xeeeeee);
                //renderer.setClearColor(0x000000, 0);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(container.clientWidth, container.clientHeight);
                renderer.localClippingEnabled = true;
                renderer.shadowMap.enabled = true;

                renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
                //renderer.shadowMap.type = THREE.PCFShadowMap; // default THREE.PCFShadowMap
                renderer.shadowMap.renderSingleSided = true;
                renderer.shadowMap.renderReverseSided = true;

                //renderer.setAnimationLoop(scope.Render);

                container.appendChild(renderer.domElement);


            },

            Add_Controllers: function () {
                //controls = new THREE.OrthographicTrackballControls(camera, container);
                //controls = new THREE.TrackballControls(camera, container, this);
                controls = new THREE.TrackballControls(camera, container, this);
                //if (scope.Browser.Type === BROWSER_TYPES.Internet_Explorer
                //    || scope.Browser.Type === BROWSER_TYPES.Edge
                //    ) {
                if (scope.Browser.IsMS) {
                    controls.rotateSpeed = 20;
                    controls.zoomSpeed = 2;
                    controls.panSpeed = 2;
                    controls.staticMoving = false;
                    controls.dynamicDampingFactor = 0.2;
                }
                else {
                    controls.rotateSpeed = 7.0;
                    controls.zoomSpeed = 1.3;
                    controls.panSpeed = 1;
                    controls.staticMoving = false;
                    controls.dynamicDampingFactor = 0.35;

                    //controls.minDistance = Math.PI;
                    //controls.maxDistance = Math.PI;
                }

                controls.noZoom = false;
                controls.noPan = false;



                var vPos = new THREE.Vector3(0, 0, 25);

                controls.target.copy(vPos);

                controls.bPivot = true;
                controls.Pivot = vPos;

                controls.addEventListener('change', onControlChanged);
                controls.addEventListener('start', onControlChangeStart);
            },

            Add_Light: function () {
                // LIGHT
                //var light = new THREE.PointLight(0xffffff);
                //light.position.set(100, 250, 100);
                //scene.add(light);

                // 조명
                var lightAmb = new THREE.AmbientLight(0x303030); // soft white light
                //var lightAmb = new THREE.AmbientLight(0x606060); // soft white light
                scene.add(lightAmb);


                var vCenter = new THREE.Vector3(0, 0, 0);
                var vUp = new THREE.Vector3(0, 0, 1);
                var vLat = new THREE.Vector3(0.1, 0.1, 0.1);

                var LightDir = new THREE.Vector3().subVectors(vUp, vCenter);

                LightDir.applyAxisAngle(vLat, 30 / 180.0 * 3.141592);
                LightDir.applyAxisAngle(vUp, 10 / 180.0 * 3.141592);
                var dirUp = LightDir;

                light1 = new THREE.DirectionalLight(0xffffff, 1);
                var lightPos1 = new THREE.Vector3(dirUp.x, dirUp.y, dirUp.z);
                //var lightPos1 = new THREE.Vector3(0, 1, 0);
                light1.position.copy(lightPos1);
                //light1.castShadow = true;
                //light1.shadow.camera.near = 0.5;
                //light1.shadow.camera.far = 100000;
                //light1.shadow.mapSize.width = 4096;
                //light1.shadow.mapSize.height = 4096;
                scene.add(light1);



                var lightPos2 = new THREE.Vector3(-dirUp.x, -dirUp.y, -dirUp.z);

                light2 = new THREE.DirectionalLight(0xeeeeee, 1);
                //var light2 = new THREE.DirectionalLight(0xffffff, 1);
                light2.position.copy(lightPos2);
                //light2.castShadow = true;
                //light2.shadow.camera.near = 0.5;
                //light2.shadow.camera.far = 10000;
                //light2.shadow.mapSize.width = 4096;
                //light2.shadow.mapSize.height = 4096;
                scene.add(light2);



                spotLight = new THREE.SpotLight(0xffffff, 1);
                //spotLight = new THREE.DirectionalLight(0x808080, 1);
                spotLight.position.set(0, 0, 0);
                spotLight.angle = 0.1;//Math.PI / 2.1;
                //spotLight.angle = Math.PI/4;
                spotLight.penumbra = 0.2;
                spotLight.decay = 2;
                spotLight.distance = 200;
                spotLight.castShadow = true;
                spotLight.shadow.camera.near = 3;
                spotLight.shadow.camera.far = 1000000;
                //spotLight.shadow.camera.far = 1000;
                //spotLight.shadow.mapSize.width = 1024;
                //spotLight.shadow.mapSize.height = 1024;
                spotLight.shadow.mapSize.width = 8192;
                spotLight.shadow.mapSize.height = 8192;
                //spotLight.shadow.camera.right = 1;
                //spotLight.shadow.camera.left = - 1;
                //spotLight.shadow.camera.top = 1;
                //spotLight.shadow.camera.bottom = - 1;

                //spotLight.target = objModel;
                scene.add(spotLight);


                lightCamera = new THREE.DirectionalLight(0xffffff, 2);
                lightCamera.position.copy(lightPos1);
                //lightCamera.castShadow = true;
                //lightCamera.shadow.camera.near = 0.5;
                //lightCamera.shadow.camera.far = 100000;
                //lightCamera.shadow.mapSize.width = 4096;
                //lightCamera.shadow.mapSize.height = 4096;

                cameraHelper = new THREE.CameraHelper(lightCamera.shadow.camera);
                //scene.add(cameraHelper);

                //scene.add(lightCamera);
            },
            Add_Model: function (datas) {
                if (datas !== undefined)
                    for (var i = 0; i < datas.length; i++) {
                        ID++;
                        Data = {
                            ID: ID,
                            Url: datas[i],
                            Downloaded: false,
                            Current: false,
                        };

                        _Datas.push(Data);
                    }
                _TotalDownloadCnt = _Datas.length;
                _CurrentDownloadSeq = 0;

                download(1);
            },

            Add_Ground: function () {
                if (objGround !== null)
                    scene.remove(objGround);

                objGround = new THREE.Object3D();
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
                //sceneGround.add(lightCoordinate1);

                var lightCoordinatePos2 = new THREE.Vector3(-dirUp.x, -dirUp.y, -dirUp.z);
                var lightCoordinate2 = new THREE.DirectionalLight(0xffffff, 1);
                lightCoordinate2.position.copy(lightCoordinatePos2);
                //sceneGround.add(lightCoordinate2);

                //sceneGround.matrixAutoUpdate = false;
                //sceneGround.add(camera);



                // 좌표 평면 추가
                var offset = 0.2;
                var distanceX = orgModelBBox.max.x - orgModelBBox.min.x;
                var distanceY = orgModelBBox.max.y - orgModelBBox.min.y;
                var distanceCenter = (orgModelBBox.max.z - orgModelBBox.min.z) / 2;
                var distance = null;
                distanceX = distanceX + (distanceX * offset);
                distanceY = distanceY + (distanceY * offset);

                if (distanceX > distanceY)
                    distance = distanceX;
                else
                    distance = distanceY;

                var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(distance, distance, 100, 100), new THREE.MeshPhongMaterial({ color: 0xb0b0b0, depthWrite: false, side: THREE.DoubleSide }));
                var vPos = new THREE.Vector3(orgModelCenter.x, orgModelCenter.y, orgModelCenter.z - distanceCenter);
                ground.position.copy(vPos);

                ground.receiveShadow = true;
                objGround.add(ground);

                var grid = new THREE.GridHelper(distance, 20, 0x000000, 0x000000);
                grid.material.opacity = 0.2;
                //grid.material.transparent = true;
                grid.side = THREE.DoubleSide;
                grid.rotation.x = - Math.PI / 2;
                grid.position.copy(vPos);
                objGround.add(grid);

                objGround.visible = visible_ground;
                scene.add(objGround);//sceneGround.add(objGround);

            },

            Render_Grid: function () {
                var gridXZ = new THREE.GridHelper(100, 10);
                gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
                gridXZ.position.set(100, 0, 100);
                scene.add(gridXZ);

                var gridXY = new THREE.GridHelper(100, 10);
                gridXY.position.set(100, 100, 0);
                gridXY.rotation.x = Math.PI / 2;
                gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0x000066));
                scene.add(gridXY);

                var gridYZ = new THREE.GridHelper(100, 10);
                gridYZ.position.set(0, 100, 100);
                gridYZ.rotation.z = Math.PI / 2;
                gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0x660000));
                scene.add(gridYZ);
            },

            Render: function () {
                if (!bWebGLInit)
                    return;

                calFrame();

                //renderCnt++;
                //console.log("Render : " + renderCnt);
                renderer.autoClear = true;
                var rect = container.getBoundingClientRect();

                renderer.setViewport(0, 0, rect.width, rect.height);

                // Ground
                if (objEdge !== null)
                    objEdge.visible = false;

                if (objModel !== null)
                    objModel.visible = false;

                scope.Data.SetBasicShaderDepthTest(true);

                if (visible_ground) {
                    if (objGround !== null) {
                        objGround.visible = true;
                        renderer.render(scene, camera);
                    }
                }

                if (visible_ground) {
                    if (objGround !== null) {
                        objGround.visible = false;
                    }
                }

                // Render
                if (!testHiddenline)
                    if (scope.Control.Model.RenderMode === RENDER_MODES.HiddenLine) {
                        scope.Data.SetBasicShaderDepthTest(false);
                        scope.Outline.render(1);
                        renderer.autoClearDepth = true;
                        scope.Outline.useAlpha = false;
                    }

                if (scope.Control.Model.RenderMode === RENDER_MODES.Xray) {
                    scope.Data.SetBasicShaderDepthTest(false);
                    renderer.autoClearDepth = true;
                    scope.Outline.useAlpha = false;
                }

                {
                    if (testHiddenline)
                        if (scope.Control.Model.RenderMode === RENDER_MODES.HiddenLine)
                            scope.Data.SetHiddenEdgeColor(true);



                    if (objEdge !== null)
                        objEdge.visible = visible_edge;

                    if (objModel !== null)
                        objModel.visible = visible_model;

                    renderer.autoClear = false;
                    //renderer.render(scene, camera);
                    render();
                    

                    

                    renderer.autoClear = false;
                }



                if (scope.Control.Model.RenderMode === RENDER_MODES.HiddenLine_Elimination
                    || scope.Control.Model.RenderMode === RENDER_MODES.HiddenLine) {
                    objEdge.visible = true;

                    renderer.autoClearDepth = false;
                    scope.Outline.render(1);
                    scope.Outline.useAlpha = false;
                }

                if (testHiddenline)
                    if (scope.Control.Model.RenderMode === RENDER_MODES.HiddenLine) {
                        scope.Data.SetHiddenEdgeColor(false);
                        scope.Data.SetBasicShaderDepthTest(false);
                        scope.Outline.render(1);
                        scope.Outline.useAlpha = false;
                        renderer.autoClear = false;

                        if (objModel !== null)
                            objModel.visible = false;

                        renderer.render(scene, camera);
                        renderer.autoClear = false;
                        scope.Data.SetHiddenEdgeColor(true);
                    }

                {
                    visible_edge = objEdge.visible;
                    scope.Toolbar.onEdgeLoadingCompleted();
                }

                if (scope.Control.Model.RenderMode !== RENDER_MODES.HiddenLine_Elimination
                    && scope.Control.Model.RenderMode !== RENDER_MODES.HiddenLine
                    && scope.Control.Model.RenderMode !== RENDER_MODES.Xray
                ) {
                    scope.Outline.useAlpha = false;
                }

                scope.Outline.render(0);

                scope.Measure.Render();

                scope.Note.Render();

                scope.Drawing.Render();



                if (coordinate.Option.Visible) {
                    renderer.autoClear = false;
                    //if (visible_model)
                    if (objModel !== null)
                        objModel.visible = false;

                    if (visible_ground) {
                        if (objGround !== null)
                            objGround.visible = false;
                    }

                    if (visible_edge)
                        if (objEdge !== null)
                            objEdge.visible = false;

                    if (scope.Browser.Platform === PLATFORM_TYPES.PC)
                        renderer.setViewport(0, rect.height - 200, 200, 200);
                    else
                        renderer.setViewport(0, rect.height - 100, 100, 100);

                    // 방향 처리
                    var vRotation = new THREE.Vector3(0, 0, 0);
                    vRotation.copy(camera.rotation);
                    coordinate.camera.rotation.copy(camera.rotation);
                    renderer.render(coordinate.scene, coordinate.camera);
                }

                if (pivot.DrawRender)
                    pivot.update();
            },

            Render_Pick: function () {
                renderer.autoClear = true;
                var rect = container.getBoundingClientRect();
                renderer.setViewport(0, 0, rect.width, rect.height);

                scope.Data.SetBasicShaderDepthTest(true);

                if (objModel !== null)
                    objModel.visible = visible_model;

                renderer.autoClear = false;
                render();
                renderer.autoClear = false;
                
                //scope.Outline.render(0);
                //scope.Measure.Render();
                //scope.Note.Render();
                //scope.Drawing.Render();
            },

            BoundingBox: function (obj) {
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

            Camera_MoveTo: function (obj) {
                boundbox = this.BoundingBox(obj);

                // Original Model Center
                var boxcenter = new THREE.Vector3(
                    (boundbox.max.x + boundbox.min.x) / 2
                    , (boundbox.max.y + boundbox.min.y) / 2
                    , (boundbox.max.z + boundbox.min.z) / 2);

                var v = new THREE.Vector3();
                v.subVectors(boxcenter, controls.target);

                // 카메라 이동
                camera.position.addVectors(camera.position, v);
                camera.lookAt(boxcenter);

                // 컨트롤 포커스 이동
                controls.target.set(boxcenter.x, boxcenter.y, boxcenter.z);

                // 카메라 기준 설정
                camera.vCenter = boxcenter;
            },

            Camera_FitAll: function (obj) {
                var bbox = this.BoundingBox(obj);
                if (bbox.isEmpty()) {
                    return;
                }

                camera.factor = 1;

                // 중심이동
                this.Camera_MoveTo(objModel);

                var sphereSize = bbox.getSize().length() * 0.4;
                var distToCenter = sphereSize / Math.sin(Math.PI / 180.0 * camera.fov * 0.5);

                // move the camera backward 

                var target = controls.target;
                var vec = new THREE.Vector3();
                vec.subVectors(camera.position, target);
                vec.setLength(distToCenter);
                camera.position.addVectors(vec, target);
                camera.updateProjectionMatrix();

            },

            Camera_FocuseObject: function (ID, factor) {
                var datas = scope.Data.GetData(ID);
                if (datas.length === 0)
                    return;
                //camera.factor = factor;
                var min = new THREE.Vector3();
                var max = new THREE.Vector3();
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];

                    var mesh = scope.Data.GetMesh(data.mesh.uuid);

                    var bFirst = true;
                    for (var p = data.body.m_vnIdx; p < data.body.m_vnIdx + data.body.m_nVtx; p += 3) {
                        if (bFirst) {
                            min.x = mesh.geometry.attributes.position.array[p];
                            min.y = mesh.geometry.attributes.position.array[p + 1];
                            min.z = mesh.geometry.attributes.position.array[p + 2];
                            max.x = mesh.geometry.attributes.position.array[p];
                            max.y = mesh.geometry.attributes.position.array[p + 1];
                            max.z = mesh.geometry.attributes.position.array[p + 2];
                            bFirst = false;
                        }
                        else{
                            min.x = Math.min(min.x, mesh.geometry.attributes.position.array[p]);
                            min.y = Math.min(min.y, mesh.geometry.attributes.position.array[p + 1]);
                            min.z = Math.min(min.z, mesh.geometry.attributes.position.array[p + 2]);
                            max.x = Math.max(max.x, mesh.geometry.attributes.position.array[p]);
                            max.y = Math.max(max.y, mesh.geometry.attributes.position.array[p + 1]);
                            max.z = Math.max(max.z, mesh.geometry.attributes.position.array[p + 2]);
                        }
                    }

                    //if (i === 0) {
                    //    min = new THREE.Vector3(data.body.BBox.min.x, data.body.BBox.min.y, data.body.BBox.min.z);
                    //    max = new THREE.Vector3(data.body.BBox.max.x, data.body.BBox.max.y, data.body.BBox.max.z);
                    //}
                    //else {
                    //    min = new THREE.Vector3(Math.min(data.body.BBox.min.x, min.x), Math.min(data.body.BBox.min.y, min.y), Math.min(data.body.BBox.min.z, min.z));
                    //    max = new THREE.Vector3(Math.max(data.body.BBox.max.x, max.x), Math.max(data.body.BBox.max.y, max.y), Math.max(data.body.BBox.max.z, max.z));
                    //}
                }

                // 중심이동
                var boxcenter = new THREE.Vector3(
                    (max.x + min.x) / 2
                    , (max.y + min.y) / 2
                    , (max.z + min.z) / 2);

                var v = new THREE.Vector3();
                v.subVectors(boxcenter, controls.target);

                // 카메라 이동
                camera.position.addVectors(camera.position, v);
                camera.lookAt(boxcenter);

                // 컨트롤 포커스 이동
                controls.target.set(boxcenter.x, boxcenter.y, boxcenter.z);

                // 카메라 기준 설정
                camera.vCenter = boxcenter;

                var bbox = new THREE.Box3(min, max);

                var sphereSize = bbox.getSize().length() * 0.4;
                var distToCenter = sphereSize / Math.sin(Math.PI / 180.0 * camera.fov * 0.5);

                // move the camera backward 
                //controls.target.copy(boxcenter);
                controls.Pivot.copy(boxcenter);
                var target = controls.target;
                var vec = new THREE.Vector3();
                vec.subVectors(camera.position, target);
                vec.setLength(distToCenter);
                camera.position.addVectors(vec, target);
                camera.updateProjectionMatrix();
            },

            Camera_Rotate: function (rotate) {
                if (typeof rotate === "undefined") {
                    return;
                }

                this.Camera_Reset();

                if (rotate === CAMERA_DIRECTIONS.PlusX) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                    setCameraRotate(0, 0, 1, Math.PI / 2);
                }
                else if (rotate === CAMERA_DIRECTIONS.MinusX) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                    setCameraRotate(0, 0, -1, Math.PI / 2);
                }
                else if (rotate === CAMERA_DIRECTIONS.PlusY) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                    setCameraRotate(0, 0, 1, Math.PI);
                }
                else if (rotate === CAMERA_DIRECTIONS.MinusY) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                }
                else if (rotate === CAMERA_DIRECTIONS.PlusZ) {
                }
                else if (rotate === CAMERA_DIRECTIONS.MinusZ) {
                    setCameraRotate(1, 0, 0, Math.PI);
                }
                else if (rotate === CAMERA_DIRECTIONS.PlusISO) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                    setCameraRotate(0, 0, -1, Math.PI / 4);
                    setCameraRotate(-1, 1, 0, Math.PI / 36 * 5);
                }
                else if (rotate === CAMERA_DIRECTIONS.MinusISO) {
                    setCameraRotate(1, 0, 0, Math.PI / 2);
                    setCameraRotate(0, 0, 1, Math.PI);
                    setCameraRotate(0, 0, 1, 120);
                    setCameraRotate(1, 0, 0, Math.PI);
                    setCameraRotate(0, -1, 0, Math.PI / 36 * 5);
                    setCameraRotate(1, 0, 0, Math.PI / 36 * 6);
                }

                scope.Camera_FitAll(objModel);
            },

            Camera_Translation: function (axis, value) {
                var delta = new THREE.Vector3();
                if (axis.localeCompare('x') === 0)
                    delta = new THREE.Vector3(getDegInRad(value), 0, 0);
                else if (axis.localeCompare('y') === 0)
                    delta = new THREE.Vector3(0, getDegInRad(value), 0);
                else
                    delta = new THREE.Vector3(0, 0, getDegInRad(value));

                var center = new THREE.Vector3();
                var vector = new THREE.Vector3();
                vector.copy(camera.position).sub(center);

                var theta = Math.atan2(vector.x, vector.z);
                var phi = Math.atan2(Math.sqrt(vector.x * vector.x + vector.z * vector.z), vector.y);

                theta += delta.x;
                phi += delta.y;

                var EPS = 0.000001;

                phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

                var radius = vector.length();

                vector.x = radius * Math.sin(phi) * Math.sin(theta);
                vector.y = radius * Math.cos(phi);
                vector.z = radius * Math.sin(phi) * Math.cos(theta);

                camera.position.copy(center).add(vector);
            },

            Camera_TranslationByValue: function (axis, value) {
                var delta = new THREE.Vector3();
                if (axis.localeCompare('x') === 0)
                    delta = new THREE.Vector3(value, 0, 0);
                else if (axis.localeCompare('y') === 0)
                    delta = new THREE.Vector3(0, value, 0);
                else
                    delta = new THREE.Vector3(0, 0, value);

                var center = new THREE.Vector3();
                var vector = new THREE.Vector3();
                vector.copy(camera.position).sub(center);

                var theta = Math.atan2(vector.x, vector.z);
                var phi = Math.atan2(Math.sqrt(vector.x * vector.x + vector.z * vector.z), vector.y);

                theta += delta.x;
                phi += delta.y;

                var EPS = 0.000001;

                phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

                var radius = vector.length();

                vector.x = radius * Math.sin(phi) * Math.sin(theta);
                vector.y = radius * Math.cos(phi);
                vector.z = radius * Math.sin(phi) * Math.cos(theta);

                camera.position.copy(center).add(vector);
            },

            Camera_Reset: function () {
                var viewBoundBox = new THREE.Box3().setFromObject(objModel);


                var vCenter = new THREE.Vector3((viewBoundBox.max.x + viewBoundBox.min.x) / 2, (viewBoundBox.max.y + viewBoundBox.min.y) / 2, (viewBoundBox.max.z + viewBoundBox.min.z) / 2);

                //var sphereObject = new THREE.Mesh(
                //    new THREE.SphereGeometry(),
                //    new THREE.MeshBasicMaterial(0xff0000)
                //);
                //sphereObject.geometry.computeBoundingBox();

                //let sphereBBox = viewBoundBox.getBoundingSphere(sphereObject);
                //var vCenter = sphereBBox.center;
                //var vCenter = viewBoundBox.getCenter;

                camera.position.z = vCenter.z + 0.5;
                camera.position.x = vCenter.x;
                camera.position.y = vCenter.y;
                camera.up.set(0, 1, 0);
                camera.factor = 1;

                camera.lookAt(objModel);
                camera.updateProjectionMatrix();
            },

            Lock: function (lock) {
                //if (!scope.Drawing.DrawingMode)
                //    controls.enabled = !lock;
                //else
                //    controls.enabled = false;
                if (scope.Drawing.DrawingMode)
                    controls.enabled = false;
                else
                    controls.enabled = !lock;

                mouseAction = !lock;
                scope.RenderEvent = true;
            },

            // 화면 갱신
            Animate: function () {

                //animationCnt++;

                if (controls) {
                    if (controls.enabled)
                        controls.update();
                }

                var vDirTmp = new THREE.Vector3().copy(camera.position);
                var vOffset = new THREE.Vector3(-10, -10, 10);
                vDirTmp = new THREE.Vector3().subVectors(vDirTmp, vOffset);
                var vUp = new THREE.Vector3(0, 0, 1);
                vDirTmp.applyAxisAngle(vUp, 30 / 180.0 * 3.141592);
                light1.position.copy(vDirTmp);
                var vDir = new THREE.Vector3().subVectors(light1.position, controls.target);
                light2.position.set(-vDir.x, -vDir.y, -vDir.z);

                if (objModel !== null && orgModelCenter !== null) {
                    //var sphere = new THREE.Sphere();
                    //sphereBBox = orgModelBBox.getBoundingSphere(sphere);
                    var vCamera, vTarget, offset, range, min;
                    range = 2;
                    min = sphereBBox.radius * range;

                    vCamera = camera.position.clone();
                    vTarget = orgModelCenter.clone();
                    //vTarget = controls.target.clone();

                    offset = vCamera.distanceTo(vTarget);
                    //offset = sphereBBox.radius * 1.5;
                    camera.target.copy(controls.target);

                    if (camera.isOrthographicCamera) {
                        camera.cameraP.near = offset <= 0.1 ? 0.1 : 1;
                        camera.cameraP.far = offset * range <= min ? min : offset * range;
                        camera.cameraO.near = -offset * range >= -min ? -min : -offset * range;
                        camera.cameraO.far = offset * range <= min ? min : offset * range;
                        //camera.setViewVolumn();
                        camera.m_fModelRadius = sphereBBox.radius;
                        camera.updateProjectionMatrix();
                    }
                    else {

                        if (offset <= sphereBBox.radius * 1.5) {
                            camera.cameraP.near = sphereBBox.radius / 1000;
                            //camera.cameraP.near = 1;
                            camera.cameraP.far = sphereBBox.radius * 3;
                            //var tmp = offset - sphereBBox.radius * 1.5;
                            //camera.cameraP.near = offset - sphereBBox.radius * 1.5;
                            //camera.cameraP.far = offset * range <= min ? min : offset * range;
                            //camera.cameraP.far = camera.cameraP.far + tmp;
                        }
                        else {
                            camera.cameraP.near = offset - sphereBBox.radius * 1.5;
                            camera.cameraP.far = offset * range <= min ? min : offset * range;
                        }

                        camera.m_fModelRadius = sphereBBox.radius;
                        camera.updateProjectionMatrix();
                    }
                }

                if (this.RenderEvent === true) {
                    //if (scope.postprocessing.enabled) {
                    //    initPostprocessing();
                    //    effectComposer.render();
                    //} else {
                    //    this.Render();
                    //}
                    
                    this.Render();

                    this.RenderEvent = false;
                }
            },

            Parse: null,

            SetOutlineSelection: function () {
                var size = renderer.getDrawingBufferSize(new THREE.Vector2());
                scope.Outline.setSize(size.width, size.height);
                scope.Outline.addData(0, sceneOut, camera, objModel, scene);

                scope.RenderEvent = true;
            },

            SetOutlineHidden: function () {
                var size = renderer.getDrawingBufferSize(new THREE.Vector2());
                scope.Outline.setSize(size.width, size.height);
                scope.Outline.addData(1, scene, camera, objModel, scene);

                scope.RenderEvent = true;
            },

            SetPickInfo: function () {
                var size = renderer.getDrawingBufferSize(new THREE.Vector2());
                scope.Outline.setSize(size.width, size.height);
                scope.Outline.addData(5, scene, camera, objModel, scene);
            },

            ClearMode: function () {
                if (scope.Measure.ReviewMode) {
                    scope.Measure.End();
                }

                if (scope.Note.ReviewMode) {
                    scope.Note.End();
                }

                if (scope.Drawing.DrawingMode) {
                    scope.Drawing.End();
                }

                scope.Toolbar.Refresh();
            },

            Pivot: function () {
                return controls.Pivot;
            },

            Snapshot: function () {
                var w = window.open('', '');
                w.document.title = "Snapshot";
                var img = new Image();
                this.Render();
                img.src = renderer.domElement.toDataURL();
                img.style.height = "100%";
                img.style.width = "100%";
                img.style.objectfit = "contain";

                w.document.body.appendChild(img);  
                //var divSnapshot = w.document.createElement('div');
                //divSnapshot.style.position = "absolute";
                //divSnapshot.style.width = "100%";
                //divSnapshot.style.height = "100%";
                ////divSnapshot.style.backgroundColor = "red";
                ////divSnapshot.style.backgroundimage = "linear-gradient(180deg, rgba(0, 189, 189, 0.1), rgba(255,255,255,1) )";

                //divSnapshot.style.top = 0;
                //divSnapshot.style.left = 0;
                //divSnapshot.style.margin = 0;
                //divSnapshot.appendChild(img);

                //w.document.body.appendChild(divSnapshot);
            },

            GetPickInfo: function (event) {

                pickingMap = new Map();
                {
                    var color = { r: 0, g: 0, b: 1, a: 1.0 };
                    var colorHide = { r: 0, g: 0, b: 0, a: 0.0 };
                    var colorTmp = { r: 0, g: 0, b: 255, a: 1.0 };

                    var newcolor = function (color) {
                        var offset = 1;
                        if (color.b + offset <= 255)
                            color.b += offset;
                        else if (color.g + offset <= 255) {
                            color.g += offset;
                            color.b = 0;
                        }
                        else {
                            color.r += offset;
                            color.g = 0;
                            color.b = 0;
                        }
                    };

                    var setColorData = function (obj, bReset, mat, color) {
                        for (var i = 0; i < obj.children.length; i++) {
                            if (obj.children[i] instanceof THREE.Mesh) {
                                obj.children[i].material = mat;
                                obj.children[i].material.needsUpdate = true;
                                for (var j = 0; j < obj.children[i].userData.length; j++) {
                                    var data = obj.children[i].userData[j];
                                    var setcolor = function (source, body, color) {
                                        for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                                            source.geometry.attributes.color.array[i] = color.r;
                                            source.geometry.attributes.color.array[i + 1] = color.g;
                                            source.geometry.attributes.color.array[i + 2] = color.b;
                                            source.geometry.attributes.color.array[i + 3] = color.a * 255;

                                            
                                        }
                                        source.geometry.attributes.color.needsUpdate = true;
                                        newcolor(color);
                                    };

                                    var id = color.r + (color.g << 8) + (color.b << 16) + ((color.a * 255) << 24);
                                    pickingMap.set(id, data.bodyId);
                                    if (!bReset)
                                        setcolor(obj.children[i], data, color);
                                    else {
                                        setcolor(obj.children[i], data, color);
                                    }
                                }
                            }
                            else {
                                setColorData(obj.children[i], bReset, mat, color);
                            }
                        }
                    };

                    setColorData(objModel, false, scope.Data.Materials.hiddenline_basic, color);

                    renderer.autoClearDepth = false;
                }

                this.Render();

                const gl = renderer.domElement.getContext("webgl");
                if (!gl) {
                    return;
                }
                else {
                    var rect = container.getBoundingClientRect();
                    var mouse = scope.Data.GetMousePos(event);
                    //const pixelX = mouse.x * gl.canvas.width / gl.canvas.clientWidth;
                    //const pixelY = gl.canvas.height - mouse.y * gl.canvas.height / gl.canvas.clientHeight - 1;
                    const pixelX = event.clientX;
                    const pixelY = rect.height - event.clientY;
                    const data = new Uint8Array(4);
                    gl.readPixels(
                        pixelX,            // x
                        pixelY,            // y
                        1,                 // width
                        1,                 // height
                        gl.RGBA,           // format
                        gl.UNSIGNED_BYTE,  // type
                        data);             // typed array to hold result

                    //var data = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
                    //gl.readPixels(
                    //    0,            // x
                    //    0,            // y
                    //    1,                 // width
                    //    1,                 // height
                    //    gl.RGBA,           // format
                    //    gl.UNSIGNED_BYTE,  // type
                    //    data);             // typed array to hold result

                    var id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
                    //console.log(id);
                    console.log("R : " + data[0] + " G : " + data[1] + " B : " + data[2]);

                    var bodyId = pickingMap.get(id);
                    if (bodyId !== undefined) {
                        var node = scope.Data.GetNode(bodyId);
                        console.log("Picking : " + bodyId);
                    }
                }

                //img.style.height = "100%";
                //img.style.width = "100%";
                //img.style.objectfit = "contain";
                //img.onload = function (e) {
                //    ctx.drawImage(img, 0, 0);
                //    var data = ctx.getImageData(event.clientX, event.clientY, 1, 1).data;
                //    var r = data[0];
                //    var g =data[1];
                //    var b =data[2];
                //    var a = data[3];
                //    console.log("R : " + r + " G : " + g + "B : " + b);
                //    //var offset = (event.clientY * img.width + event.clientX) * 4;
                //};

                

                //var img = new Image();
                //img.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4RDSRXhpZgAATU0AKgAAAAgABAE7AAIAAAAESkpIAIdpAAQAAAABAAAISpydAAEAAAAIAAAQwuocAAcAAAgMAAAAPgAAAAAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFkAMAAgAAABQAABCYkAQAAgAAABQAABCskpEAAgAAAAMxNwAAkpIAAgAAAAMxNwAA6hwABwAACAwAAAiMAAAAABzqAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAyMDowNjowOCAwODoyNjowNwAyMDIwOjA2OjA4IDA4OjI2OjA3AAAASgBKAEgAAAD/4QsWaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49J++7vycgaWQ9J1c1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCc/Pg0KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIvPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj48eG1wOkNyZWF0ZURhdGU+MjAyMC0wNi0wOFQwODoyNjowNy4xNzE8L3htcDpDcmVhdGVEYXRlPjwvcmRmOkRlc2NyaXB0aW9uPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj48ZGM6Y3JlYXRvcj48cmRmOlNlcSB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxyZGY6bGk+SkpIPC9yZGY6bGk+PC9yZGY6U2VxPg0KCQkJPC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L3g6eG1wbWV0YT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0ndyc/Pv/bAEMABwUFBgUEBwYFBggHBwgKEQsKCQkKFQ8QDBEY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TGjE8J6w9vl9a1O4WC00pHnl1GOa2WMiWTJPnqjEBdq+YwBYLk153/wtLVVik0YeItJO53K3P2i0J8synB+0/wBojB2kf8s9wH8HFeqeGvDh0TWL/UrqXQPPvlAlfS9LazaVgxbdITO4c5Y84B560ltYeLLRBDF4q0WWFWO03OkyySlSSQGf7WASAcZwPpVdU/63Jto/66I6WzvLbULOK7sLiK6tplDxTQuHR1PcMOCPpU1R+fF/z1T/AL6FHnw/89U/76FIZJRUfnw/89U/76FHnw/89U/76FAElFR+fD/z1T/voUefD/z1T/voUASUVH58P/PVP++hR58P/PVP++hQBJRUfnw/89U/76FHnw/89U/76FAElFR+fD/z1T/voUefD/z1T/voUASUVH58P/PVP++hR58P/PVP++hQBJRUfnw/89U/76FHnw/89U/76FAElFR+fD/z1T/voUefD/z1T/voUASVBe/8eb/h/On+fD/z1T/voVDeSxtauFkUnjgMPWgC1RUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBJRUfnw/89U/76FHnw/8APVP++hQBwuoTSDUL/Vxqt5HqFnq8FlDZrdP5IjYxjyzADtYurs24gsMjBAUYfqmoatF4cmudPubkTw67IpkWzmvdkQlYYMMRDuoGBgEY/Cuqk0zRZdYi1aWysH1KFPLjvWiQzIvPyh8bgOTxnuaqjSYhoeqad9uT/iYPcN5m0fu/NJPTPON3qM+1LVJeX6W/O34/fWjfq/ws/wAro870DWPE8niiyj1m4uEhmunaIkXFsZ0Ny2C1vKN0S4wFUs3y46dKt+MrfUJvGl4W1PWLO2EMQhW207V7mNuDuINnPGgOeoIJ966e00fXUvrObUdY8N3SW21dy6G6zbAeiyG6baffBwe1WJ/CGi3FxJNJqGtBpGLsI/EV8igk54VZgAPYAAU7Wil2bJ1cnLvYv+FgF8MWSiW5mKx4Ml1DcRSMcnJKXDNKOegdicY5xiuaN7rGsatp9hFrt3pqyz6n5ktpDbl2WGcJGv7yNxgKewye5rqNJ02w0WCSKzurqRZG3E3mozXTA4xw0rsQPYHFZd14UtpZreew16/0y4t5bmRZrY27E+e+91IljcYyBjjPuab1dwWkbf1sy14cur8z6npeq3H22XTp1RLwxhGnjZFdS4XC7xkg7QAcAgDOBrWv/Lb/AK6tVTSNPsdGs2ht7hpXkcyz3E8u+SeQ4y7H14AwMAAAAAAAWLaWNfN3SKMykjLDmgDhZrC6bx1/a4sfEP8AY8dz9ndV1W7BacuP34txJt+zgjaRtwQxbbsG42raLxTeeBLqG4t7hbgX8mxYr1kurm1FyxZQzqvlOY8quGxjaQ65yN3U/CvhPWr03msaDo2oXTAKZ7qzilcgdBuYE1XtPDVpY+BLnwzbXcMUMsVxFG8cYVYllZyAEB6KHxjI6dqnaNu39f192w953MPS7HxTa6lZOhvrPRW1FcadqErXl4ieS24vcLM4EZfnaxfqPmXhV6LxtPf23haWbSXmjuo7i2YNDbSXDKonTefKiId127sqpBIzXNaR4B1Cx1zTr6+8Updw2U3m+Rvvm3nYygfvr2VB97OdhPpiu01m2h1bQr/TvtMcX2y2kg8zhtm5SucZGcZ6ZpvbT+tgj8Sv/WrOG0S68XajryXdxqDy6Z/acavH/Yd3YMyfZzkgTSkrHuxnKkFucis7xLrPh3WPEV1t8XQaJJZzYlE3i5oFu2QY8tYobjESHHzMVDgj7pyTWtpHw6h03XNO1D/ikbf7FN5u7S/DotJ3+Rl2+b57YHzZPBziuw1eyh1VbMfa0i+y3cdz2bdsOdvUYz60W29f8tf+ALX8P89P+CZ/gbWtL1jw+Ro8xljtZWifdqq6g27rnzhLISDnjcQ2MfKOldJUfnw/89U/76FHnw/89U/76FN6iSsSUVH58P8Az1T/AL6FHnw/89U/76FIZJRUfnw/89U/76FHnw/89U/76FAElFR+fD/z1T/voUefD/z1T/voUASUVH58P/PVP++hR58P/PVP++hQBJRUfnw/89U/76FHnw/89U/76FAElFR+fD/z1T/voUefD/z1T/voUASUVH58P/PVP++hR58P/PVP++hQASf6yL/f/wDZTUlQSTRF4sSJw3PzD0NP8+H/AJ6p/wB9CgCSio/Ph/56p/30KPPh/wCeqf8AfQoAkoqPz4f+eqf99Cjz4f8Anqn/AH0KAJKKj8+H/nqn/fQo8+H/AJ6p/wB9CgCSio/Ph/56p/30KPPh/wCeqf8AfQoAkoqPz4f+eqf99Cjz4f8Anqn/AH0KAJKKj8+H/nqn/fQo8+H/AJ6p/wB9CgCSio/Ph/56p/30KPPh/wCeqf8AfQoAkoqPz4f+eqf99Cjz4f8Anqn/AH0KAJKKj8+H/nqn/fQo8+H/AJ6p/wB9CgCSio/Ph/56p/30KPPh/wCeqf8AfQoAkoqPz4f+eqf99Cjz4f8Anqn/AH0KAJKKj8+H/nqn/fQo8+H/AJ6p/wB9CgCSio/Ph/56p/30KPPh/wCeqf8AfQoAkoqPz4f+eqf99Cjz4f8Anqn/AH0KAJKKj8+H/nqn/fQo8+H/AJ6p/wB9CgCSq1//AMeyf9d4v/Ri1L58P/PVP++hVTVLuCKx8xpUwksTH5wOki+pxQBX1nxBHpU0dtBaz6heyKZfstsMusQ+9IfQdgP4mwo9s/xZfW2pfDbUryxmWe3mtGZJF6Ef0PYjqDxV4a/pomaUeSJGUKzi4gyQMkAnf0GT+ZrF8W6vYS+CtWtrXykMkEjYSaI5YncThWJJJJPTqaAOmj/1Q/D/ANBWiiP/AFQ/D/0FaKZR414p+GOsD4jf8JHZ6jMZCFZVt9PeRVAXZgsG6nBOOcZ+mfVPB2mXulaAItTuFuJ5JDL5ioycEDAKtyCOmK3qzdZl8i1knCK7Q28sihxkEgA1vPE1alKNKT92O2i6fiZqKUnLqypP4Q064vtaupHuN+tW629wBINqALt3IMcMRjJ5+6tQXHgfTLjSbfT3nuxFb6VPpSsJFLNFKEDMSVOX/dg56ZJyDWPpUlxfaBHqFxq94JHL/JDYwlMhyoAbYw7Afe69cHgW9Lkm/wCEghtZruS5R7WZ5I5YohsdXiAwVRc8Ofz9q5uemqipc3vWvbXb+mWm/iRq6p4TstWmmmlnuoZ5IYYklhdQ0JikMkci5U/MGOecg4wQRnNJPAdtGs0qaxqn9oy3a3n9pF4jMkoiERIHl+XgoMFShXngAgYk8SXF1p2ivcaVZJNMHVWP2dpvJQn5pPKTDSbRzsUgntWf4U1LUdUuLlNRhSeCNFKXX9i3Gm/MScp5c7MzcYO4cc46012X9df677bha39fI1V8Gaf5emedPdzTafdNefaJJB5lxI2SxkIABBbDbVCgFFAAAxUQ8E20OhzaZYanqFjFPPLLK8JiZnWTgxEPGy7AuFHG4BQAeueU1/xdf6brGowLLa2aWTLiBvD13e71I+VmuInEce45ADD5cc5rvbaPzbWKS4tEglZAzxcNsYjlcjrg8ZoVmv6/rotPvDZ2/r+td+vQlutHtbvSF012uordVVVNtdywSALjH7yNg/b1571ip8O9Cjnkmjm1xZZceZIviG/DPjpk+dzisDVdU16yk1yWPUdJSHStrmJtCd3dWXcoU/a1DHtkhckHitbxHd6ppPh+0+xRW91q08yQDyrBXWRiCTiN7iMKMKTzKce9F+oJdF0NO78HaZe3T3E11rSu+MiHXb2JeBjhUlCjp2HPXrU+h+GNN8PNOdMa+/fndILrUbi5BJOSQJXYAknkjBPeua8LXPi261eWPxNpEFtYiAskv2OKBvM3DC4S7nyMbjzt6DrVrWbbxNbR3t5YanocdtEjyRwzaNLI4AGcFxcqCeOu0fShvlVwUeZ2Oyorz/W9d1aPRdCfQ7OKbUdTjDmJbJJgf3e9sB7iEKB/vH6d6TR/E19ceJ7fQtW0+GC78hZLgR2z7EbyUdlEmSmQ7MNu4nGPqW1ZtPoSmmk0eg0VWs1CiUKAB5nQD/ZFWaQwooooAKKKKACiiigDndX/AOPzWf8AsFx/znrk/hB/x9a1/wBcbL/0B66zV/8Aj81n/sFx/wA565P4Qf8AH1rX/XGy/wDQHpsfQ7jxDqy6Tpxfz47d2yfOlICwooy8jE8AKoJyeOlL4f1VdV08OJ47hlwRNEQVmRhuSRSOCGUg5HHWuM8ZXsWraHr3mpcSwz6fPbRpbR75TGUYHYvGWY9B34o8G3kWkaHoHlLcRww2EFtIlzHslEYRQN6jOGU9R2+avkP7aj9e5ub3L8tunr9/4Hd9Wl7O1tdzrfEuq6tpFqLrTLDTrqBFJlN7qD2xByAqoFhk3Ek4A4OcAZzSaR4mXVdaudM+xXNtNaW6STGaGSNQ7MylULookUFfvqSDVLxkk1o1lqtjZG4uYpPL+0Pbz3qWSlW/eraRsC7k/JuTDAOSTtBFZPg2G4S91rULHQ7D7XPErfbl0qfRVu5cuTHJFLvckEhjNg534wSpr66Pn/X9f158MttP61/r8zV1LXPFmlW095c6BozWcB3O0etSmQpnqFNqBnHbd+Peuqrg73TPGWoXuoS3Gi6EIr60htnjTXZgVEbyNncbM9fMx04x78dtaNcvZxNfwxQ3JUGWOGUyIrdwGKqSPcqPpR0F1JqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCtqF21jYyXEdpcXjrgLb2yqZJCSAANxCjr1JAHUkCsQeNLc2DP8A2VqP9ord/YjpWIvtHnbPM258zyseWd+7fjHfPFX/ABJc6raaHLJoFk97e7kVY0MYYKWAZh5jopIXJALDJArm4LPULW1sdTsvDmq/abO9eW6tr25tjdXvmRlGlDLMY8glflLKAqlVAAUULr/X9f12Yf1/X9foa48X+fpMF7pugavfvI0qS2sKQpJbNG211cySKuQ3GFZt3Vcjmob3x7p1taw3VnZ3+pWrWaX889nEpFtbtkrI4dlY5AY7UDNhT8vTORcxeJILSOIaHqT2+pzT3V/Hpt1bieHcy7Id8kqBcrnc0ZJBB2sOGqe5tNXsjcpo3huZrfVdOito4vPhQac6hkxKPMI2AOD+63n5W4PGTW1+v/A1+V+v+aGrXs9v0v8Anb+tzr7vULWw0ybULqUJawRGaSTBOEAyTgcnisW18aW0kF62o6ZqWlz2cUczWt1EjSSpISsZTy3cMWYFQud2eCBkZh1LwrfzaNd2trrt5IrWQggsp1hFurqoCncI/N5K85c9Tx2rH1rR9Y8W29xfXeh3GnmBbYR6fPdxeZd+XMJZF3RuyBWACrlhk53BRzQ7c1lsJX5dd/8AhjtNLv5tRs/OudMu9MkDFTb3ZjLj3zG7qQfZqy77xja2OsNZtYX01vFPFbXOoRIhgt5ZMbEbLByTvTJVWUbxkjnGboPhu6XT71dOS88F2s10slvY2QtWaJQgVsoVliTc2WwmegJOWYUy70zWRcajokemzXNpqV5Hcf2r58apEmE8wOu4Pv8A3Z27UKncvK4OH9r+vL/gi6GofFVzFr1rptz4Y1iAXU7QxXTPatEdoLFyFnLhcL1K9wMZIFX9c1Z9JtYfs1sLq8u5hb2sDSeWryEE/M+DtUBWJOCcDgE4BZbWVzJ4pvdQvE2xRwpbWQLA/KfnkcY5G5tqnP8AzyH41vFVlqOp2S2Vno+nalbyfNJ9s1KW0aJ1IKNG0cLkMCMhgVKkAj2noiurH6VrGpy6s2ma/pdvY3LQG4hazvDcxSIGCsNzRxsGBZeNuMMME8gYi+O9Sg8TX2malo9mIdPCNcSafdXN5MFfO3bClrliPlLDPyh1OeRTPBmgeItAnX+0tM06eSb5LnUpPEF1eXBjBYqqiaDO0Z+7vAySepNRxXOjaLrFzYX+halEul3vnabcWWkXtwZBJCpkkaaNGDszvIGyecDIJGaf9fiLudfoepjWvD9hqgiMIvLdJxGSSU3KDjkD19BVSDxVp00OqzyLdWsGlZNxJc2zxZULuLKrDcRwecc44yCCZ/DUEdr4W0y3heWSOG2jjV5rd4HYBQMmNwGQ8dDyKzNU0O9v4/EkUIWNr6GMWzu3ysyp3xyBnAP9aJaXsCJ9N8X2l5JPDqVpdaHPCIm8rUzEhdZWKxsrI7KdzArtzuzwQMjMqeJU/t9dMutNv7RZTItteTrGIbhkGWC4cuOAxBZVBCkgkYzR06bVrvWJdavvD95Y7YI7SO0e4geVsvl5DtkKbFyMfNuOG+XoDRbS9T1DxgZo9M1HToyJo7u6u75Li3mjKFVFvH5jNES2xiQsWQpzuOKJXS031/4AaX+7/gmjp/jnT72ci5trvTbV7Z7u2vb4RpBcwIRukVg5KgBlOJAhw2ccHFkeJWm8QSaZZaNqF3HC6JPfQvbiCIuoYZ3ShzhWB+VD14zWPpEWub9OOoaDcQDQbN48pcQt9ul2hB5ID8KQpP7zYQWXjqQmt6K+oeKra4sPCqWuoJc28reIswKRCpUyRlg3mklQ0e3btw2d2KenMktha2d9/wCv66m9ba+LzWpLK102+kt4naJ9RCxi3Ei/eQZfeSDwSEK5yM5BFa9ed6P4Sn0/xLDt0Dy7qDUZ7mTxCZo8z27s7iEYbzT/AKxVKMoQbSwJIXPolJbJje9gooooAKKKKACiiigAooooAKKKKACiiigAooooAKytd8RWXh2O0fUPM23dylspQA7C38bZIwo7ntWrXDeK/Ceu+KfEFyYruxsdOTTXsY/tdo1yZTNgyuoSZNhAVFBOT978UxnU6h4g0bSJo4dV1exsZZSqolzcpGzlshQAxGc7Tj1wfSibxBo1vqkWm3Gr2MV/M+yO1e5RZXbAOAhOScMDjHQj1rz9o9fk1K+tbzw8mpandeHrexuJFliCRuZLld772/1TfeIXcwGBtJ6Pj0nUZbzX9CtdJa5Fxf2ayauZYwsXlW9sSzhm37htym1WG4jJXk1SV5W/re39XE/6/D+vkdlo/iVNVnWE2xhdpryNf3yEYt5/KJwSGOeDwpAzgnpmQeLPDp0ubUxr+lmwt5fJmuxex+VG/HyM+cBuRwTnkVyEng7WLpJoDCIBNBrcXmNKuAbm6R4c4ycMgJ4Bx3weK0NSl1+60m0bTPDd9pLLMI5UtnsWu40WMhWj8xmhCZO3nLbScKM5pdP67/1/W7drv1Zp3fjzQLTVrnTPt9vLe29iL4QrdQqZUwzYXe4Gdq7iTgBSCTitKTxBo8GqW+l3OqWUGpXKh4bKW5QTSA55VM5PQ9M9DXA/8Ixr1r4Vl0xdKkmmvPCx00mOaELBOiyYVssuQxkABVcAjnaK073RtUa41PS10Qzx6pfQXa6oJYvLgCLEPnDNv3p5R2hVIPycrzhpa/13t+Wv/Dilpt/Wi/W51cHiHRbnVG0221ewmv1DM1pHco0oCsVY7Ac8MCDxwRiqOjeK11a3jubjSrzSrS4CfZbm/ltwtyXPyqgSVmyeMBgD+PFZFj4bvreLTibJElh8R3l/KwZMiKRrja+c85WRBjrg4I4NZmiaHqNv4VfRv+Ec1mC7mgihe41LVFuLaNwR+9jQXLlAp+YBFQ8KOOyQ5K10v61f+V/mdte+JdC0yOSTUda060SJykjT3aRhGG3IJJ4I3rx/tD1FST67pNrPZQXOqWUMuocWcclwitc9P9WCfn6jpnqK4dI9S0XX9AVvDj6hdWVpqEZW2lhV5syQf6QnmSADfnLBmDAs3XvQj8Ca1bXVtbStqQtrqytreb+y5LPybcxyO5R/PjMgRS42mLJ4PC4FNa2/rv8A5Ce1z0H/AISXS5NRisbO8try4afyZI4LqItC21z8ylw3/LNxgAn5TxgEh8fiTQ5Vumi1nT3WylEN0VukIgkLbQj8/KxPGDzniuWg8LajFYaTDDb/AGeSLXb68ndXXKJKt0Ek68k+bHwMkZ6cHGHpngjVzoUNrfW+pyy2f2C18m+ksTA8UV1FI5i8lFZkCoxHm4Yg/dyTQtXb0/r5f1sOWj0/rX/LX+rnosfiTQ5dFbWItZ099LTO6+W6QwLg4OZM7Rzx1pW8RaKjWCvrFgrakAbEG6QfagcY8vn5+o+7nqK5jUND1GDxBdavDpbX8UWrR3qWkUkSvcD7IIS672C7lbn5iv3eD0zQ1fwzq2peJWuRb6raWep21vFLFYy2O22KSO5ExlRmGC+7MJbnd6AlLW39dBPRHXSeLtDtbNrnU9TtdMiWaaLN9cJDuMUnlsRk9N2Of9pemap3vjbTbXxZbaIL3SwWtXu7mSfUFjeKMDKlUwd+RknJUBRnJ6VS03w9exeKbC8u7NfJgGq5dmVthnuY3jwM5+ZA3Tp0OM4rMbwnqzeBpNMay/fN4aOniLzUx5vICZzjp36e9C6X/rR/qkU0tfX9f8jsU8T6DJLaRR63pzSXzMlqi3cZNwynDBBn5iDwQM4NVNX8ceHNEtLqe81iyxZ3Edvcol1Huhd2wA4LDb3ODzhWPasDxZpOv6hq1vZ6dZXA05DaOrWxtFhcRzBmWYyZl+ULlBGAMk5bniKbRtbNjq9pZ6VdLZxTR3Ntb3EtuWkkW5ErrA6tny2wSPOKkMw6DhQleZ2EfibQprhIIda06SZ1VkjW7QswbaFIGeQd6Y9d6+oq/FcQTSTRwzRyPA4SVUYExsVDYYdjhgcHsQe9cRPoWpSWOuX0OlOt3daxaalHbPLGJJkiW3JTcGKhv3bqMtjI64Oa0vDf9qwahrN7f6HdWo1TUlljjM0LtFGLWJNz7XI+9GVwpY5I7c09Lf15f5v7gOpoqpaXk9ywE2nXNoDEshMzRHDHOY/kdvmXAz/DyME84t0gCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqG8uo7GzluZlmaOJdzLDC8rkeyICzH2AJqaigCnpGpxazpNvqEEUsUc67hHMoDrzjBAJ549auVl+G7Oew8P21tdp5c0YbcuQcZYnqOOhrUoA5LVPGd1p1xe3C6XFLpGnXKWt3P9qYXO9tn+rgEZ3j94mBvDNztU/LuuW/i2O68KX2uwafdvHavMq25hdJnEbFclHVWXOM4IyB61zPiXU20/wCI0E0ngu2v/JMATV00m5uLmKM53hGjgZeMnrIpGT8p72r+G5vfAWoSSabqWnapbTyTtb20t2mZHbduH2eUNMNr5Ko5G7I4IwFryt/10H1t/XUt+GfHv9va0un/APEkut8bP5uhax/aAhx/z1/dJ5YPQHnJ4rsq8l8M6ZcT+KbKKbUddvbclnkL22u2Cx7RlSXuLlkYEgDaRzmvWqp7ErdhRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFZuv/8AIIb/AK7Q/wDo1a0qzPELKmjOzkKqywkknAA81aAM6sTxh/yJ+pf9cT/OtL+0bL/n8t/+/q/41j+LL21l8JaikVzC7mE4VZASaAO4j/1Q/D/0FaKI/wDVD8P/AEFaKZRdrK8Qf8gu6/69Jv8A0EVq1XvTDFayXM6uVgjZzsJBwBk4wfakSeUaYdel/sgWFolzpjl/tMz2wlIxI38fluegGMFsY5x0HVaagj8ZW6iLyv8AQJzjyvLz+8h5x5aenXH49gWj/wBq6cdUi8N6aYJC7eZLf5Y7WIJOIyM8Huat6M1u+tRQto1pZvNayypPbXDM21XRSpGxSMlh/wB89KpKKlrbmt3V7fnYcpNpaWS8t/XzKnjzw3Fr2kxsujWepXMLgZltbeadIifn8nzwYw5wPv8Ay8c9qxPBPgaz0/VJLq48MxWyIn7qTUtP05LlJOhMZs12hCpIO7nPTjNdxrep6T4dso7zWLj7LavMsLTyz7EjLdCzMwAFVdK8TeGte1RrDQtVttTkSEzSPZXqzJGNwGGKscE54+hqY2vp/Wn9MJPv/Wp5zrXw7g/ti7+yeD/3e7/Rf7M0zR/s23Axv+0L5uc53Y4x92vTdH0uDR9Ghs7GysdP2plobKARwrIR8xVRjjOfeqNr4psLm5Qf2bqcVncB/smoSFfJuiiliExIXGQrEF1UELwTkZ2dNktdU0m01C3WZYruBJ0V3IYKyhgDgnnBoXw2BtcxwM3w0lubiSe4tPAss0rF5JJPCJZnYnJJJueST3rVvPCepXfh200iR/C8lrBndbT+Hmkt+D8myL7QAmBnufbFdn9ki/2/+/jf40fZIv8Ab/7+N/jR0sF+p5/4S+H114SuI3s5PDK4V0lmtfDxguJFY7tvmi4PGccYPCj61pXek+M7yyntpPEWhKk0bRsyaFNkAjGRm7681132SL/b/wC/jf40fZIv9v8A7+N/jQ7NWYJ2d0cL4l8MXmoeABYXtpYa3qNqY/IMenwjaoZQxjS5aRA/l7hlmwT6VR8I6Lqem6/aKum6xaadFFIHGoQaSkaHAC7Psg3g8Y9MfhXpH2SL/b/7+N/jR9ki/wBv/v43+NO+rfcWlkhtp/y2/wCun/soqxTI4kiUhARk5OST/On0gCiiigAooooAKKKKAOd1f/j81n/sFx/znrk/hB/x9a1/1xsv/QHrrNX/AOPzWf8AsFx/znrk/hB/x9a1/wBcbL/0B6bH0Oi1OTR4JLn7H4f0+5Frk3VzOsUEMR6kNIwPPrxxSabLo01xbJe+H9PtDcgNazwrHNDLkZG1wo5I5HHPasi/1D7H8HbrYsT3P2aTzUmjV1Mu47tytkHnPBqmJLqfwDp0rKiMbKAxrEgRRJsXYFUcAbsYA6UvqtP2XtOVb22F7SXNy3O71bxR4f0CaOLXdc03TJJV3RpeXccJcdMgMRkVctNSsb9Uaxvbe5EkSzoYZVfdG2drjB5U4OD0OK5nx3bz3ENsbjVX0zT4JUmjNnbyXF1cXStujQRKpLICu5lUFmx1UKSc7wlPYQaxqmu3d5LZ5sIjfJqUt5H5LB5GZ1F2FKQ/NxtwoII7ULXf+v6/rfRtW2/rU7n7ba/Yzd/aYfswGTN5g2AdM7ulT14A+p6QZ30ca/oG1w0wv/8AhP7oQAGXp9n2+Xuwc+X933r3m0vLbULOK7sLiK6tplDxTQuHR1PQhhwR9KFrG5PWxNRRRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiszxGdM/sKZddhFxZOyI9uUL+excBY9o+9ubA2ng5weM1xqeHLe1XTNK1bT7a00bU9VklGjDa1vCBATHAygbDl0MhUfLvPBbGSLUD0WivNodN0K60UaM2iWuvGO8vI9Is7jEkMUSyAMxLArGkbHYCAWVRtQHoWaloOnyW+pWviu4W9udF0KA2t5cN+8hYLJuuY2PKSF0XLg5+VeaV1bm/ra40ru39b2PTKK47Xdb1ZPCmoRSaTqNo8enF31NZIRGrbBu2bZDKGGWwSg5X6Gud12ws/Dsl9YeDoLWzs72Cxju44JPKhjEtx5fmkJjBZCwLAhiFHPAIpq0uX+v+ASmnHm/rp/mep0VxPh64n8N2OoaXY+H7a/exu1Ro/DsENpH88avkxSzBUYZAIDsTlWxycZmqWVheT6xrN3Ci6/ZarbRWUsjATW4/c+XCjDlVfe2VU4be/Wlu7f10/zHsrv+v6sek1Fd3dvYWct1fXEVtbQqXlmmcIkajqSx4A9zXIR+FPDdx8Qxc2WgaZbz6UPtU13BaRpJJcy7gMso3HC7mOepdD1FWPHmo6ZZ2diL7XNH027huUu7aDVrtYYrox/wnJzj5gQwDbWCtg4wV0Q+rN3Sde0jXoHm0LVbLUoo22PJZ3CTKrYzglScHFVLTxn4Xv9SXTrHxJpFzfMxVbaG+ieUkZyNobORg/lXJ+DfGWleJ/Eiard6t4btb+e2NlBp1jqi3E8wDltzkqhOMHaoU4DMc/NgWrfQb3V9av7i61XzZ3uEttWtLS5uLVbdFj8yFYZUKsWUSAsej+Y2duAof8AX9f16i7ncwzxXMCT28qSxSKGSSNgysD0II6in1jeD7aSz8E6NbTxyRSQ2MKOkoO9SEAwc85+vNc3fW40Wx8bNp0lzE3lJK0xnkkkUmM7mDsSwwOnYYAGAKJaXsB3tFcXo+h6bpXiq6sfCpTTLOSxt7ieOwCBN4kba20qVzIgYM2NxCjnIBFO6tYdO8d22pWel2UEl6blIL6xm82a/fyi5W4yoIRSh24MgBVR8g4Kk7K/r+ALV29PxPQKK858PaRpsF1oFxoM32W+1bSpXv7u3KedcEqh8+TcpEkiyNwzg43sO5FS63otvpPjJPE1xFomqeff2lqEuNOU3sDtsjBin38Yz5m3Z03cjrVNWko/1vYV7q6PQaK8/s9Gt/Dvj+3vXh0O/k1u+uViuYtOEd9bna8jbpt7eYihDGcKuMr9K9ApdEPq0FFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRXB+KY1j8S3GlOcReKLWK225xuMcm2b8TDL/AOOe1LW9lux+bO5EES3DzrEgmdQjSBRuZQSQCepALHA9z60RwRRPK8USI0zb5GVQC7YAyfU4AGfQCvLBeSaham9m8meXS5dM0eXzYkkCz/bE+0cMCASPKIOMggEHODWrZavr0d1banNq0t3Bca1e6f8A2cbeJYxHG9xsIZV37x5SjO4gj+HPzU3ZK/8AXT87oLO1/wCtr/ozvWuIUuI4HljWaRWZIywDOFxkgdSBkZ+oqSvJZ9b1Gyk0vXpddTUrq48PXmoJDLCgitiRAcpsAbygT0cs3y/e61uXWp6t4dvpopvEMurWtvHbXlxLcQwK8UTSmNwTGijYVy4+XI8tvmI4Das7P+t/ysLpdf1/VzvqK85tfEniLUkls7S7jiv/AC5b6MzRoqiKWNDbxtxjh5SoPcw85ya63wxePeaH+/uLye4gkeGf7ekSzo4PKv5P7skZHKcEY69aX9f16bMDZoryjQ7G90TwJZX2k6NomhXd89hANSsdss9ykkyK7Sq0KgMVYn7z8nrxk6suoa9atrHmeIpvKt9TttKgklt4P3ayLb7p2xGAZMyNt6IC3KkYAaV9P66f5ob0/r+ux35gia4SdokMyKUWQqNyqSCQD1AO0ZHsPSn155Lfa+muQeH4PEk8q/2oLeTUTb2/niM2jzGMgJ5e8MFOdg+VlyD1N34j2J1BfDdr/ZVhrBfVj/oWovthlxa3B+Y7H6YyPlPIHTqF0C35N/df/I7aivJLfV9XtdE0fSPDS6hHm3vLmSKwFnvtZEmC/ZSLlwoiiLlDt5wqYKitOXXtddtV1B9a+yy6beWcS6RHFCySGaKAmN22ljuaRwpRhg/3gMU0rv8ArvYk9IorgYNY1cy2urHXGkW81OexOk+TF5cao0i/Kdok8xRHuYlmH3/lAxjP0a11jUdV8G6pq3iS+mnvNMmuJYkgtliJKwM0YHlbtp787uOCKm+jfb/K5WzsenUV5Pp2qa7L4YSbT9YOmxab4Vs9SS3trKARyzMJiQwKcIfLUFU2n0K8509V8Qasftupxa8bBbTVLOwTTlhiZJFlMBJYsu/ewlbBVgAAOCQTV8vvcv8AW9gkuXf+tL/kz0WiiipEFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUVyzWa2PjjULqyEr3M+lmQ+ZM8mWDnaFDE7V/wBlQBkk4yTSbt+P4Jv9B2uvu/F2/U6mivJJrWw0jQLHU/DrCC/1DQ7ibULq3fbLcDaha4kIGXkV2OGPILMOOa6fSfD+i2PiTUNK0CFLPTrnTIZLiHT5mgCuXcJIDGQVdlBy4IJCLzxVNWfL/XX/ACJumr/10/zO0orC8FRJB4O0+KJdqRoyqPQByBW7SGZ83iDRrbWYtIuNWsYtSmAaKykuUWaQc8qhO49D0HY1bW6t2iklWeMxxFhI4cYQr94E9sY59K8/12HSpfEl14duPFdhaR6rdw3E+mPA326ST5dvkyiQFV/dL8wRimDhl+Xa+6tU074ZX8VnFDqumTXNw0jXWoXQcRNK2CHEUssjhsDGDn1PdX92/wDXT+v8h9bf1bX+v8zrtJ8UaBr8skWha5pupyRLukSzu45ig9SFJwK1K8j8Nar4hu/FtgdUhuL+5UOLY6q9zarECP3hT/iVwK7bR91m7cY6165VWJT1CiiikMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKrX/8Ax7J/13i/9GLVmq1//wAeyf8AXeL/ANGLQBZrA8df8iHq/wD17NW/WB46/wCRD1f/AK9moA0o/wDVD8P/AEFaKI/9UPw/9BWimUXapa1zoN//ANe0n/oJq7UVykMlpMl1t8hkYSbjgbcc5PbikSeUafr0UH9k6VJYzzy3zPsuIlDYxIw6+W7HG3nDNgen3R1mjxmLxtCGEgZrC4c+YCD/AKyAd0T09Px9K9qvhfyP9CnvJYN77WGmmcfeOQJGhYtg5HJPTFaOiR6N/wAJAsljNdfaxayKsUtn9nUpuj3Njy1BIIQfjT9jHn9tKPvWtfy7BKSsox0767vv5DvGSXlxa21vY6drU7rKJ1utIezDwMp4yLlwpzk/wt+HFYng5PEkWrRXPifTvElzdyRtA1xePpgt4ELbsgQOHOcLnhuenFd5cXENpbvPdTRwQxjc8kjBVUepJ4FK08SzpA0qCV1LJGWG5gMZIHcDcM/UetJaf18vyB6nm0d94S0vVb6y1Pxfb2B0uaWGy0rUdTt447ctH/rFG1ZMYkYAOzgAnHbHYeDNLsdH8F6TZ6Wtj5C2sZ8ywC+TMxUbpFKgBgx53d85p1p4z8L3+pLp1j4k0i5vmYqttDfRPKSM5G0NnIwfyrWguIbq3Se1ljmhkXckkbBlYeoI4IojpH7vwB6v7/xJKKKKACiiigAooooAKKKKACiiigAooooAKKKKAOd1f/j81n/sFx/znrk/hB/x9a1/1xsv/QHrrNX/AOPzWf8AsFx/znrk/hB/x9a1/wBcbL/0B6bH0Om8Q6BYZluX1K305Lg5mS6VXhlPqVYjn1weafoej2kphuTqkGppa4ECWqqsEOBgEKpPIHTJ4rJvJYj4GvvFN5L5d7NbvNDcGBZzbJ/CEjY4OBg47mqUepJBoum65aHddraRzzTrCIftK7Az70XgZGTjselXyy5Obpcm65rHd6rpNnrNmLa/SQoHDo8MzwyRsP4lkQhlOCRkEcEjoTUWk+H7DRDK1kLmSSXAea8vJrqQgdF3yszBRknaDjJJxya5rx7f6rDeWdv4c1LVlvflluLPTYbd9tsG/eSsZYn+bAIRQQWboDg4n8J61quoa/PbXtxb3NgunQT2k8U4la4DSSDzXxDGEchRlACBjis467f1/X9bMp6b/wBa/wBf00dhRXkz/FG+XSJIf7S8KfbFkaIE6+v2zPmFR/o3kY34/g3fjXrNC1VxdbBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAVdS0uw1ixey1extr+1cgtBdQrKjEHIyrAg4PNUYvCPhuDSZtLg8PaVHp1w4eazSyjEMjDGCyBcE8DkjsKv6gL5rGRdKe3juzgRvcozxpyMkqpBbAycZGemR1rk7bxLrl1D/AGbby6ZLqbalJZJqKwP9ldI4/MeQQ+ZuJU5iKiT74JzwVo7/ANf10DzN2+8IeGtTt7WDUvD2lXcNnH5dtHcWUciwJx8qArhRwOB6CpZPDOgzCwEuiac403H2HdaRn7LjGPL4+TGB93HQVhjWPENz4eluPt2iaXcadJPHqFxdQSSwnyzwyqJUKKy/Ocs23OPm61Xm8UeI7+xN1o1nZWj2emRX95aXyO7yPIpb7OrBl8sgKfnZW5YfLwcl9L/P9bjtd2+X6WO3IDAgjIPBB71m2Xh3RNN02fTtO0fT7Sxud3n2sFqiRS7hhtyAYORwc9RTdR1uOy8LTa1FH56rbefHHv2+YSMque2SQM+9c3e+LNY8MxXsPiV9MuLkQQyWcttHJBG7ySeV5bIWkb5WKncDlg2AuRyPR2f9eQk7rmR12naZYaPYpZaTY21jaoSUgtYViRcnJwqgAZPNRy6JpU+sQ6vNplnJqUC7Ir17dDNGvPCvjcB8x4B7n1qj4U1iXV9Mla7vIbq5hlMcvl6fNYtHwCA0EzF0OCDyeQQRwazNR8Ra3De3t9ZDT/7G028jtbiGVGM0wOzzJFkDhUCeZ90oxbYeRkYfX+v66i6HWRwRRSSPFEiPK26RlUAucAZPqcAD6AU+uXefxTD4ts7I6lo9zZzNJNNCmmSxyw268A+Z9oYFixRfuAH5jj5cVa8YanPpeixzQ3JsYXnSO61ARh/sURzulwQV4OBuYFVzuYFVNLomV1sb1YF54K0e91K5v3fVILi6ZXnNnrF3bK7BQgJSKVVztVRnHas3wnrIvdcuLXTvFH/CVactuJHvMQN9nl3YEfmQIsbblyduNy7ck4ZcYdrrOv8A/CRtPYazfajptxL5OljUTb21teyAMZVMkdoXCgY8s8byjckYJBdGej2lrHZWcVtC0rRxKFUzTPK5Hu7ksx9ySacLeFZJJFiQPLjzGCjL4GBk9+KzvC17c6j4R0m9v2D3VxZxSTMMYLlQT0A7+wrMPiXUrG38QzarZ2gbTAHt4LaZm8wFcqGdlHJOP4cDOPmxkktL3BGraeGtC0+xaysNF061tGmE7W8NoiRmQEEPtAxuBVSD14HpT7TQNGsNUuNSsdJsba/uc+fdQ2yJLLk5O5wMtyAeTWTpura/aarPpmvQ2moT+TFcQyaZF5GVZyjgpLIfuHDbg3zBuFyMGFPEl7H4xnsZL/SL21hSVrm1swftGnKq7kaZi5B3D+HYhy3G4Amhu2vr/wAEN9DZh8NaFb/b/I0XT4v7Sz9t2WqD7VnOfMwPn+83XPU+tPGg6OusLqy6VYjUlTy1vRbJ5wXGNofG7GOMZrntM8ReIBcWU2rWtpcW2q2clzaW1kmyeFlCusLM8myQlGPzfuwCp4weCbxHqieOv7NnuIdOsPNiSIXOjXDi53IGIW7EghVtxKhSCcjocinZppBe6bOitdC0mx1S41Ky0uyt7+64nuordElm5z8zgZboOpq/XNSaprdj4usbO8n024tNRklWK0t4HW4t40UsJmcuQ65CqQEXDSqMnHzdLS6IOoUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFRS2lvPPDPPbxSS27FoZHQFoyRglSehIJHHY1LXIa74mnsvGkGjr4g0LR0eCGRI9ShLy3bPI6lI/38fI2js3LD6UdUg6NnS/2ZYCORBY22yWcXEi+SuHlBBEhGOWBVTu65A9Kcun2SKgSzgURzNOgESjbIxJZxxwxLNk9TuPrWO/jTS4tNjvZhPHEwuDKCgLQCAkSlgCejALhckllx1qq/juKKOJJ9B1eO/muhbJp5SEzFmieVWyJSm0iNhndwRzjBIA/r/M2bPw9ounXUtzp+kWFrPMzPLLBbIjSM33iSBkk4Gc9cUll4c0PTdOuLDTtG0+0s7nPn20FqiRy5GDuUDDZHBz2rBj8cXN3r2j2thoV9Jb3qXIud/kq9tJFIqMrZlH3STnaGzlSpPNM0fxXfvod5r+r3NhLY20Za5sbK3ZbjTnGC0crNIQzIpJb5YzxkDkChD1Ook0rT5jOZrC2k+0QC3m3QqfNiGcRtxyvzN8p45PrT7DT7LSrGOy0uzgsrWIERwW8SxomTk4UAAckmsjUfFtvY6gbG30+91C681YkjtRH87mNpCAXdRlUUMckcMuMk4rPj8cTw6prsOoaLepbafcRQWskYiLXLyLHsjA83O9mfgkKoH3iuDR5f1/WojXsvCHhrTZ3n07w9pVpLIQzyQWUaMxDBgSQvOGAI9wDV+TTrGaC6gms7eSK8z9pjaJSs+VCneMfN8oA57ACuek8eRK1vBDoOr3F/Ms5awiSHzYTCUDhiZQnSRSCGII6HJAM/h/xrZeI7iBLWxvreG8tjdWVxdRoi3UalQxVQxcYLr99VznIyOaFqrL+v6t+AeZq2WiaVpttb22naZZ2kFq7PBFBboiwsQQSoAwpIZskep9atS28E8kLzQxyPA/mRM6gmNsFdy+hwxGR2JHepKKAMy88NaFqKldQ0XT7pTP9pIntUcGXGPM5H3sADd1xUFv4V0yPxBda1c2dpdX8tx50FxJbKZbYeUkZVXOSM7CeMfexW1RQtNv6/qwFCPQdIi1ibVotKsU1KdNkt4tsgmkXgYZ8biOBwT2FOl0XS54rOKfTbOSOxdXtEeBSLdlGFKAj5SBwCMYq7RQBTj0jTYoWhi0+1SJoFtmRYFCmFc7YyMfcG5sL0GT61z+qeCv7X8Tw6hcnSUtoWiK+VpeL0rGwdYzcmQ/JvUEqEHHHvXWUUdbgFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFM8mL7R5/lp523Z5m0btuc4z6Z7U+ufm8RSDxVBYQJEbFVlW5nYHPmIobavbAB5PPJxwQaV0gNGx0LSdMuLu403S7K0mvW33UlvbpG07ZJy5Ayx5PX1NO0rRdK0K2e30TTLPToHcyNFaW6xKzEAbiFABOAOfauW8MeMrvxHNM0F1Y/6TbNcafaPY3EOV42n7Qx2Tj5l3eUvyFsZPBKT+I/EVjZ67bO1lqd9potylzp+nTMimVsNG1usruzooDkK+SrrwO72QbnaQwxW8KxW8aRRr0RFCgfgKfWN4W1ObVdHM9zf297MsrI7Q6fLZGMjHyPDK7OrDryRwQceuzRsJamBqvgrRda1E318t95zFC32fU7mBGKfdJSORVJHrjNWR4X0dNJutMhtPIsbs5kgt5XiVTgD5NpHl9Afkxzk9STXMa3qfiOHxBcJYS6p9rW4jWx06PT91hcwnbuaa58pjGeZM/vFK7VwjcB55PFd5Y+Cb681vUtH0nVPtVxb2/wBrvFW3Dq7BUV3VN2FHGVHTmlpy/wBeRXX+vM2tP8H6VpuoxX0L6nNPCGEZvNXurlUyMEhZZGXOOM4zW5XlfhT4g2tx4hhhn8XLLayKUePWdS0lnZzgIIRZtksT138YxjmvVKolbhRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFVr//AI9k/wCu8X/oxas1Wv8A/j2T/rvF/wCjFoAs1geOv+RD1f8A69mrfrA8df8AIh6v/wBezUAaUf8Aqh+H/oK0UR/6ofh/6CtFMou1S1rnQb//AK9pP/QTV2ob22+2WFxbFtnnRNHuxnGRjOO/WkScb4WvLs+G7byZbgplwNqsw++3fy5P/Qz+H3RoWM00vja1+0GQsNOuMeYpBx5kPqify/GoLHwneWVoLdzbXBVmIlJQFgWJHDwuw4Pdj7cYFXdL0G6s/EKX0v2dIVtZIdqMNxZnjIOFjQYwh9+n4bXjYytLm8iD4gLH/wAIzPJql0Y9GVQL2CKSOCWcFlAUTyyoka885IJzgEHryHw/1zTda8cxtHqN9fajHZXJaSbU7e5R4zJDjKQXUqRuAFBKxorkk4GMV6Xq+kWeuaa9hqSSPbuyORFM8TBkYOpDoQykMoOQR0qppfhew0i8+02lxqskm0ri71i7uUwf9iWRlz74zWMdHc1eqOJ1EPa+I7qXWtR1G6nvgiajZaNbX7R2kSZaERzWyFlkG4lgxG8PnCjaK7PwZaLY+CdItUuI7lYbSNRNE5dXAHUE8n8eaXUfCWl6pfPeTnUIJ5ABIbHU7m0EmOAWWKRQxxxkgnAAzgCtW2toLK1jtrSJIYIlCRxoMBQOgAoWisN6u5LRRRQIKKKKACiiigAooooAKKKKACiiigAooooA53V/+PzWf+wXH/OeuT+EH/H1rX/XGy/9Aeus1f8A4/NZ/wCwXH/OeuT+EH/H1rX/AFxsv/QHpsfQv+INEvotDutCEM8mnTKywz28RlaJWOdrIOeM8EdRUmlaJNe6XYaStpPDZWsUcc9zcxGJpVQAbVQ8jOOc9BWlf6tqV3p15qWnyTQafahtn2S2E9xdbTg7FbjGRgdzUdlr17ZQ2dzqM8lxZXaozfaYFhuLbeBjeq8cZwRjir5p+z5el/xJsua/U1PFOnahqejiDSpdsglVpIvtklp56DOU8+IF4+cNlQSdu3oxrN8OeH9Zs7e/S8u5tOW4QJFHDq02ptC/OZVlukyCcgbNpX5c85NXfEvik+GvszSaLqF/FcSpCstrJbKokdwiIfNlQ5JI6Aj3pdD8X6X4g1G4sLCVWu7SFJLqJZopTbMzMvlOY3YBwUORnHTk1mutin5/1/X/AACh/wAITfHUhf8A/Cb+IPtQhMIk8qw+5ndjH2XHUda6a0gktrOKGa6lu5EUBp5ggeQ+pCKq5+gA9q5lvif4PWzaQ69p4uVYobD7ZD9p3htuzy9+d2e1dZQttBdQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAMrxJpd5rOhy2OnX6WE0jITM8LSKVDAshVXQ4YAqcMOCazP+Ec1ptMs1/tXTLe/06YPZSWmlPHbxx7NhjaEzksNpOMOuPlx0539Q1C30uxku7xnEUeM+XE0jEkgAKigsxJIAABJJrMHjHRTo51L7RP5Qm+zmE2c32jzf+efkbPN3Y+bbtzt+bpzR/X9f1+YGTc+DdYP9nva63YvLbyS3FwL7TGminuHcMJQizJt2YIQEttBHJIzVnUPDGsXkzywa7BavfWqW2p7LEsJQufnhzL+5bDsPm8wfd4OObcvjXQ49LttQSe6uILnf5YtbCeeQbDh90aIXTaeG3AbTwcHinaj4z0DSlt3u7/MdxCJ1lghkmjSI9JXdFKxxnP33IXg88HBbp/X9eX+QdbjbzwXoF3Hdsul2lveXVsbZ7+GBFuAm0KP3mNxwAOp7CqEng/UdQtriTXNahutTPk/Zbm3sfKjgML+YjGMuxYl+W+YAgAAL1rqZp4be3e4nlSKGNC7yOwCqoGSSewx3rHsfGOh6hZ3l1FePDHYxiW4F3bS2zRxkEh9kiqxU4OGAwcHB4NHW/b8P8g6EEHg+1vre4/4TGLT9fuLmZZnEunqIEKrtUJG5fGBnksSSx5AwBFP4Sun1KZLXVI4NFup47i5sPsm6QugX5Ul34RG2JldhP3sEZ429L1a21iz+02a3KoGKlbq1lt3B90kVWHXrjmqd34s0ax1pNLurp0uXdIyRbyNEjv9xHlC7EZuMKzAnK4HIy+obotWmli31q/1J5fNluxHGo2Y8uNAcJnv8zO3/Aqj1fSrzUmiNnr+o6SEBDLZR27CTPc+bE/T2x1qoPGekf2xDpjrqcVzPObeIzaRdxxyOASQJGjCHhWOc4wCc4rQ1fVodHs1mlimuJJJBFBbQKDJPIeiLkgZ4JySAACSQATS6XH1MjQ/CN1oRgSHxXrNzawszfZLiOz2PkkkErAr9STwwpjp4vsNb1WTT7PS9RsbqdJbf7Zq00DQKIkQoEFvIANys3DfxdM1oaT4hOo30ljeaTf6ReLH5ywXoiPmR5wWVondDg4BG7IyMjBBOQ3xEs7XWLmx1jS7vSI7QIbi8v7uyjhhV9wjZiLgt8xQgDbn1AoF3Oi0e1ay0WztXtorQwwrH5EM7TJHgY2h2VSwHqQDVS78OxXy6yk87iPVYljPlja0WE25B7nv0/Oruk6nBrOjWep2e77PeQpPFuxnawyOhI6Hsar2fiPR9QS+ey1G3mi09it1Mr/u4iBk5f7vGDnB4IIOCDRLrcEUtN0TWreeW91LWbS81F1ihWRNPMUSQq2WGzzSd7ZbLbsD5fl4IMb+GtQvtet7zWtUtrq0snle0hhsjDMPMQoRJL5hDDax4VUyQpPSr+i+JdL8QGZdMmmMkAVpIri1lt5ArZ2tskVWKnBwwGDg4PBot/E2l3OtvpMU0wu13432sqRyFOHCSsoRyueQrEjBz0NDXRgZmmeGNWsGjM+twXQsLZrbSw1iV8oHADTfvMysAqjK+WPvcZORY1PQdT1fUIlvNWg/siOeG5a0jsiJmeJldR5vmEBN6hsbN3bdip9L8WaNrOoSWWn3TvOqNIoe3kjWZA20vEzKFlUEgFkLDkc8jLpPE2nR67/ZG2+kuwyqxh064kiQsMjdKqGNeCDywx3p3d0w2uv6/wCAZ+jeHtd0vXLm7n1fTLqC6neSYnS5FuXTLFI/O88jCbsAbMYzwCSa6esq38TaXda42kxTTfa137d9rKkchThwkrKEcqTyFYkYOehrVpdEHUKKKKACiiigAooooAKKKKACiiigAooooAKKKKACsHUNH1lvETanouqWNqstvHBNFd6e9wWCO7AqyzJt/wBYRyD0Fb1Vk1C2fU5tPWXN1BCk8ke0/KjlgpzjHJjbjrx9KPMOjRz114DtL2TX/tNyzQaxEY1h8tSLbcB5hXdkHcyqxBGMjpUGjeAYtKbT5VXSLWa0vvtbjSdJWzjmHkSRBSodjn96TuLHpgAZrqbC+ttT0+C9sZPNt7hA8b7SNynocHkVYoWmiB6/130OZi8J3NpqFpeWWpRpJDeXU0nmWxcPFcPvZBhxtYELh+RwflOaryaFc2moXOueJbyDUUispLQR6fpDrNNEzA7ZNryNLjHARVALMcc8dFquq2mi6bLf6i7pbxFQxjieViWYKAEQFmJJAwAetR6RrdjrlvJLp7ynyX8uWKe3kglibAOGjkVWXIIIyBkEEcGla6t/XYd3e/8AXc5W08F3tz8PrTTJ57aO7mxNdf2laC7w2Bt6OmJEAQK4PG3OCcEWNW8AtqiX8E1/bz2l39nm8q+sRcE3EIUB3ywV0ZUAZNoJySGHbsq50+M7RNFvtUmsNRitrWK4mVmgBE8UP3nVlJVc/wAKuUY4PGBmm9X/AF0Ek9l/VyHQ/BcOi3en3MP9n25tbe5ikg07T1tYXaZojuVAx24EIHJYnPXjFWtF8Mf2PBoUf2vzv7I05rHPlbfNyIvn6nb/AKrpz168c7qtvQMOhGaztX8Qafofki/adpJyfKgtbWW5lcD7zCOJWbaMjLYwMjJ5FO7X9ev+bCOq0NKio7e4juraK4gbdFKgdGwRkEZHB5FSUgCioVuUa8e2Cy+YiK5JhYIQSQMPjaTwcgHI4yORU1ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFcpF8PNItdXs720n1JEtmlY28mqXUsblxz8rSlQMkkjGDmurqhba7pl5rFzpdpexT3tooa4ijO7ys9mI4Df7PXBBxgilZN2Doc5B4L1aDT/saeIUSOzspLPSXisdj2wZQoeQ+Z+8dVAAK+WOpxnGL2laJr+maNLYx6po8bKAbVrXSJI0jbduYyK1wxk3c5wVOSTnJq1p3i3SdUSeS1a8WG3jMr3Fxp1xBEUHUrJIiq3/ASeOadZeK9GvbC7vBdtaQWR/0o6hBJaNAMZBdZlUqCDwSMH1p3vqHkO0DRptJjvJb68W8vr+4+0XU0cPlRltioAiZYqoVFHLMeCSea1qradqNrq2nQ31hJ5ttOu6N9pXcPoQCPxqzQBxGv6P42k8XLfaDqEJ0wPC5s59RMKNt+8Cotnbnj7sig91PfQk0fxC3g2/0qW+iuL9twt7xLiW3MoJ3Hcy7miwSygqW4APHQP1DxraabdXHn2F62nWcgivNVXyhb2znGQ+XEmBuXLKhUZ5Iw2LEPjDR7jwzda/b3Im023aRTPCRIsmxipKFSQQSOD/Kkvht/X9dg63+RheH/AA1r1j4itbu5h+yWsauJl/4Sq/1LzcrgDy50VRg4O7OeK7msGw8UPc6rDp+paHqWjz3Ks1v9sa3cTbRlgDDLJggHPzY9s1vVQgooopDCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACq1//AMeyf9d4v/Ri1Zqtf/8AHsn/AF3i/wDRi0AWawPHX/Ih6v8A9ezVv1geOv8AkQ9X/wCvZqANKP8A1Q/D/wBBWiiP/VD8P/QVoplF2qmrO8ei3rxMyOtvIVZTgg7TgirdVdThe50m8ghXdJLA6KuQMkqQBzSJOD0Kw0+fwzFMdDtryZy+Z/JeVmJkYZ4Vwcf7/bt0GloFrb2vjCBILBLRhYXAYiDyjKPMhwxGB6kenBrmoPCOoSX2m3lybi3ayZxLbmF28z52I+YRuuMHuXyMdOg6vRbadPF8UptZI4VsZlL+SUXcZIiBny4xnAPbt19FyzdXn53ZK1uj8xyUYxSWreu23l5l7xvqM9j4Vuo9OEkmp3im3sIYZNkkkzA42ntgAsT2Ck9qZb63Hq+saDdadcObS7tbl2TJHzL5Ywy9mU7gQeQcit5rW3a7S6aCM3EaNGkxQb1ViCyhuoBKrkd8D0qjJodudYgv4AkGxZvNSKPaZmkCAuWGOcIOevT0p9BdTHux4s1HUoNRsYI9Nt7Fm26ddzDff5+Vt7RlljAHKffJJ+YL0ql44g8Q634e0uTRbDU7Wf7VvurSO5VJkTY4AYxXcIYbtpwJvQ4OMVqf8IHpH/P54g/8KPUP/j9O1jwhBqHg2fw/a3DiOVkcPqTy34O2RX2v5km51O3GNw4NLoNbmN4di8Qw+JoU1AX6WQH7uKbefKTyhtSRjLKHcHq+85Nd3XEeHfh7/YfiODVPK8NW/kxyJt0fQPsLvuA+8/nPkDHTHWu3qn3JWgUUUUhhRRRQAUUUUAFFFFABRRRQAUUUUAc7q/8Ax+az/wBguP8AnPXJ/CD/AI+ta/642X/oD11mr/8AH5rP/YLj/nPXJ/CD/j61r/rjZf8AoD02PoS6vLOvwzvtAiRzf29u9s0SAl2OeGAHXI5zUUOnTHwfpOnOW+3XFnFbrC331JjCsSO23knPpXT+JLvQPtaRahaTXd4i8fZARIg93BXH0zR4au/D5u3i061ltLx15+1AmRx7OS2fpmtry9jbl0vv/X9X0MeaHtN9Sp8QbbTY7OLUtZhjvYkIgihv7z7NZWzNnM8kgUmNsfKr4JBIC7SxNUvBmr/bpr6/j8vWbq0sYrcTaVqsd9HcBWdghlMcKibLHIOBgqSeah/4Wx/1Bf8Aya/+wo/4Wx/1Bf8Aya/+wrsWU41fY/Ff5nG80wj+3+D/AMjLbTfFBnNiLDxoNBaNt1n5mi7txfds3bt2zGR97d716naTyXNnFNNay2kjqC0ExQvGfQlGZc/Qke9cB/wtj/qC/wDk1/8AYUf8LY/6gv8A5Nf/AGFNZTjErcn4r/MX9p4S9+f8H/kei0V51/wtj/qC/wDk1/8AYUf8LY/6gv8A5Nf/AGFL+ycb/J+K/wAx/wBqYT+f8H/kei0V51/wtj/qC/8Ak1/9hR/wtj/qC/8Ak1/9hR/ZON/k/Ff5h/amE/n/AAf+R6LRXnX/AAtj/qC/+TX/ANhR/wALY/6gv/k1/wDYUf2Tjf5PxX+Yf2phP5/wf+R6LRXnX/C2P+oL/wCTX/2FH/C2P+oL/wCTX/2FH9k43+T8V/mH9qYT+f8AB/5HotFedf8AC2P+oL/5Nf8A2FH/AAtj/qC/+TX/ANhR/ZON/k/Ff5h/amE/n/B/5HotFedf8LY/6gv/AJNf/YUf8LY/6gv/AJNf/YUf2Tjf5PxX+Yf2phP5/wAH/kei0V51/wALY/6gv/k1/wDYUf8AC2P+oL/5Nf8A2FH9k43+T8V/mH9qYT+f8H/kei0V51/wtj/qC/8Ak1/9hR/wtj/qC/8Ak1/9hR/ZON/k/Ff5h/amE/n/AAf+R6LRXnX/AAtj/qC/+TX/ANhR/wALY/6gv/k1/wDYUf2Tjf5PxX+Yf2phP5/wf+R6LRXnX/C2P+oL/wCTX/2FH/C2P+oL/wCTX/2FH9k43+T8V/mH9qYT+f8AB/5HotFedf8AC2P+oL/5Nf8A2FH/AAtj/qC/+TX/ANhR/ZON/k/Ff5h/amE/n/B/5HYeJNXm0TQ5b21sp72VWRFiggklI3MF3FY1Ziqg7jgE4FclbyQ24stejh1fUPL1F5tSkfR7iGUu8HlK8du0Ycoo2INoYhepYhjTP+Fsf9QX/wAmv/sKP+Fsf9QX/wAmv/sKFlONX2PxX+Yf2pg/5/wf+Q59ZvdNsVhSz1Wwh1i5ubs3MOkz3MlpEXG0eXHG2yRwS48wfKc7lJG2iXyNGhvLSx0bU7mz1PSILTTUSwlb7iugilyuYfvqcy7Ry2Twab/wtj/qC/8Ak1/9hR/wtj/qC/8Ak1/9hR/ZGM5eXk09Vtt3BZphE+bn89nvv2NfWNF8RTeG76xW9sru2Nh5UdoLNlnkcIAQZjKVIYgjHlj73XjNYmvC58Urc6ppVlq9pbW6WizB7J7e4mWO4Esixo6hyUQHBA5LEKSRUn/C2P8AqC/+TX/2FH/C2P8AqC/+TX/2FN5VjXLmcPxX+YlmeDUeXn/B/wCRpaDBrMun3v8Awjl7c2dn9qU2jeIrS4uZSmwbwFkljmA39DIc8NgbStVL1bpZtW0GXT72W91LUIriG6hs3NuUxFmQy4KIU8tvlZt3yrjdkVB/wtj/AKgv/k1/9hR/wtj/AKgv/k1/9hR/ZONvfk/FeXn5B/aeEtbn/B/5eZ1kEM954uubq4idLawhWC13oQHdxukcHuMeWoPYhxnk1V8XrNcWkFvBour3zh/OiutKmto5LSRfusDNKgJ5PGGUjIYEHB53/hbH/UF/8mv/ALCj/hbH/UF/8mv/ALCl/ZON/k/Ff5j/ALUwn8/4P/IseDRr8N+k/ibRvEVzqMymFr+9m0/ybeLcWAVIJRjOFyQhYnHOAMVrbU/B2ieJr6DVPEFvpOq6be5kuL7VI0m1FZII3JkVsZT5woUDC+UNu3GKX/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MH/P8Ag/8AI67wnHHD4P0mKC6t7yOO0jQXFrJ5kUmFA3Kw6jjrWRrOmXt7b+LIba2d3uYIxCrDas5EfKgnjnp+NZH/AAtj/qC/+TX/ANhR/wALY/6gv/k1/wDYUPKca/sfiv8AMP7UwnWf4P8AyNS2urPXdbm1a40i+XT0ggtgl9pcqvJN5u9SImTfiMlTvxtBYkH5SRVne71XxpGtn/a03l+ekseo6eYYLAGJlEkEwjUOzNtH3pflZsbRnNX/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwoeUYxrl5NNeq6/MP7Uwid+ft0fT5EmmtDqEGl219od9Fb6LpssGoxXGmyFGyioYUBT9+DtJ/dhgQq+oBn1W3gi8WxSeHrTW4dZlurYzOq3K2MkA2iRnyfIyIgygff3BcDvVT/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwqnleNcuZw/Ff5/wBISzPBpWU/wf8AkaEdxc33xAtXgXVrhIJJRPDqOnGGCxXyyu+CYIokZm2j70nyu2Coznta86/4Wx/1Bf8Aya/+wo/4Wx/1Bf8Aya/+wqf7Jxtvg/Ff5h/aeEv8f4P/ACPRaK86/wCFsf8AUF/8mv8A7Cj/AIWx/wBQX/ya/wDsKP7Jxv8AJ+K/zH/amE/n/B/5HotFedf8LY/6gv8A5Nf/AGFH/C2P+oL/AOTX/wBhR/ZON/k/Ff5h/amE/n/B/wCR6LRXnX/C2P8AqC/+TX/2FH/C2P8AqC/+TX/2FH9k43+T8V/mH9qYT+f8H/kei0V51/wtj/qC/wDk1/8AYUf8LY/6gv8A5Nf/AGFH9k43+T8V/mH9qYT+f8H/AJHotFedf8LY/wCoL/5Nf/YUf8LY/wCoL/5Nf/YUf2Tjf5PxX+Yf2phP5/wf+R6LRXnX/C2P+oL/AOTX/wBhR/wtj/qC/wDk1/8AYUf2Tjf5PxX+Yf2phP5/wf8Akei0V51/wtj/AKgv/k1/9hR/wtj/AKgv/k1/9hR/ZON/k/Ff5h/amE/n/B/5HotclqV8fD/ji71G7sNQuLW+02CCF7GylucSRSTMUYRqSuRKuCQF4PIxWP8A8LY/6gv/AJNf/YUf8LY/6gv/AJNf/YUf2Tjf5PxX+Yf2phLW5/wfr2Kmn6Nd6TqegKdOafV002K3Yy2DyLZkI+Xiuh+7TBJDxnl8DHbdi6P4VvJ9H8q5t3LvPYR6lBFoc9m80i3KNJJLK8ji4YAPukQFSCTuxiul/wCFsf8AUF/8mv8A7Cj/AIWx/wBQX/ya/wDsKayrGJ35Ovdf5ieaYR/b/B/5HQeL9MlHgn+z9Bto4WimtVtoorcskQWePH7tSPlUDOARwOorI1PwhNe6no58QmPWmuNTaa+8uzMdsI1tZURTGWfCZxnczZZvTCit/wALY/6gv/k1/wDYUf8AC2P+oL/5Nf8A2FH9lY3fk/Ff5j/tTCWtz/g/8iCx0W1l1+COTQLga+NRne/1GWxfy5bUl/la4ICSRtGY1WIM235QVGwkULrws9h4XFto+hNbb/DusI8VrZ7N00hhCAhR99gvA6kLx0rW/wCFsf8AUF/8mv8A7Cj/AIWx/wBQX/ya/wDsKFlONX2PxXa3cazXCKSlz/g/8irFouoy/FBrm7xHOt5HLbXB0OaST7MIlBjW8EojjQneDGVzuJO05BrqPF7Q2s1nfq+qWt7CrrBd6fp0l6uDtJilijViUYqpPCn5eHUmsH/hbH/UF/8AJr/7Cj/hbH/UF/8AJr/7Cl/ZONslyfiv8yVmeEX2/wAH/kZesabrmt+JNPu9Wt1s7iaztTaM2hzXps5wzNL5cscwW2bO3JfgjaNzbSKv22gS6How8Rabo8sms2+r3UsyLDie6geeZAmcZKhZA6jp8oPepf8AhbH/AFBf/Jr/AOwo/wCFsf8AUF/8mv8A7Cm8pxlrcn4r/MP7UwnWf4P/ACIbzw7fWLahALa5ng/s3TvtrW0bZuwLmd7pVxjczBmJUckPjHzDNHxNottdxaUujaQLLw95NwsVpP4auLlIrhmXDi2Ro3hbG/a7KAvzHjcCdT/hbH/UF/8AJr/7Cj/hbH/UF/8AJr/7Cj+ycY38H4r/AD+7sx/2phN+f8H0+X3/AHHe2EU0Gm20N1K080cKLJKwwXYAAsRk4yeep+pqxXnX/C2P+oL/AOTX/wBhR/wtj/qC/wDk1/8AYUPKsa3fk/Ff5iWZ4NK3P+D/AMj0WivOv+Fsf9QX/wAmv/sKP+Fsf9QX/wAmv/sKX9k43+T8V/mP+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9Forzr/AIWx/wBQX/ya/wDsKP8AhbH/AFBf/Jr/AOwo/snG/wAn4r/MP7Uwn8/4P/I9Forzr/hbH/UF/wDJr/7Cj/hbH/UF/wDJr/7Cj+ycb/J+K/zD+1MJ/P8Ag/8AI9FrI8mX/hNDP5T+T/Z+zzNp27vMzjPTOO1cj/wtj/qC/wDk1/8AYUf8LY/6gv8A5Nf/AGFH9k426fJ+K7Nd/MP7Uwlrc/4PvfsTeH/L0zU5j4dsvEMOjW9hJ9qt71LlikwZfLW3S4JJIXzciPKH5cZOK0fBRuJdR1W4dr+7tpBCI9Q1SxNpdTMA25DGUj+RQV2kRqMs33jk1kf8LY/6gv8A5Nf/AGFH/C2P+oL/AOTX/wBhT/snG/yfiv8AMTzTCP7f4P8AyOu8Kwy2/hm0iuI3ikUNlHUqR857GtevOv8AhbH/AFBf/Jr/AOwo/wCFsf8AUF/8mv8A7Cl/ZON/k/Ff5j/tTCfz/g/8ip4p8R+FNJ+Ii2et2bRzNNbSPLJrSwWzE9JZLUyjzGXauG8t/ur8w2jF6+1FJPh7qmoadf3mky29xNPd28jQxspdidkvnwP5aFXV/uZ2kckdWf8AC2P+oL/5Nf8A2FH/AAtj/qC/+TX/ANhS/sjG8tuT8V5efkH9qYS9+f8AB/5HK+A7a1tfF1tZ6Lr+iRtdhvN/4R6+02eRlQbsSLHp0Z2HGM7uCeK9vrzr/hbH/UF/8mv/ALCj/hbH/UF/8mv/ALCq/srG2+D8V/mJZnhL/H+D/wAj0WivOv8AhbH/AFBf/Jr/AOwo/wCFsf8AUF/8mv8A7Cl/ZON/k/Ff5j/tTCfz/g/8j0WivOv+Fsf9QX/ya/8AsKP+Fsf9QX/ya/8AsKP7Jxv8n4r/ADD+1MJ/P+D/AMj0WivOv+Fsf9QX/wAmv/sKP+Fsf9QX/wAmv/sKP7Jxv8n4r/MP7Uwn8/4P/I9Forzr/hbH/UF/8mv/ALCj/hbH/UF/8mv/ALCj+ycb/J+K/wAw/tTCfz/g/wDI9Forzr/hbH/UF/8AJr/7Cj/hbH/UF/8AJr/7Cj+ycb/J+K/zD+1MJ/P+D/yPRaK86/4Wx/1Bf/Jr/wCwo/4Wx/1Bf/Jr/wCwo/snG/yfiv8AMP7Uwn8/4P8AyPRaK86/4Wx/1Bf/ACa/+wo/4Wx/1Bf/ACa/+wo/snG/yfiv8w/tTCfz/g/8j0WivOv+Fsf9QX/ya/8AsKP+Fsf9QX/ya/8AsKP7Jxv8n4r/ADD+1MJ/P+D/AMj0WivOv+Fsf9QX/wAmv/sKP+Fsf9QX/wAmv/sKP7Jxv8n4r/MP7Uwn8/4P/I9Fori9A+IX9ua5b6d/Znkedu/efaN2MKW6bR6V2lcdfD1cPLkqqz3/AKsdVGvTrx5qbugooorA3CiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKrX/APx7J/13i/8ARi1Zqtf/APHsn/XeL/0YtAFmsDx1/wAiHq//AF7NW/WB46/5EPV/+vZqANKP/VD8P/QVooj/ANUPw/8AQVoplF2q+oXDWmm3NxGAzwwu6hs4JAJ7VYqlrXOg3/8A17Sf+gmkSc3ol3qOqaRFeT69qCvIz5WCwjdBhyAAVRgeB/ePvg8C/p9xeReKIbOXUrq8gks5pStzbpEQyvEARhFPR29vyrnfDambQIH8lpstIN/kGTOHYfe8mTPp98/h0GppA2+NoF8sx/8AEvnODHs/5aQ9vLT+X4+nRb3TFSfNYteOtY1TRNDW50O5s1vWfy4LS4s2uHvJD92OMLLGQepJ5wAScAE1W8O+KdS1HWLKwuoY7i3ntZ5xqkMKRQ3JR4wBGgnkdcbyGDgHI7citXxRFfJpqXuiWP2vU7aaIxhFi80xGVPOVGkIUFoww6jtznFUtJL3fiCK5fwnqmimKOf97M9n5TtKyM5YRTOxYlAc49c9q54/1939f5G72RhaF47m1G6/0nxd4VM2+dRo0UJW7BQuFXJuTz8oJ/d8jPA61YvPGWuHwHoWtw2DadLfMhvXl02S/FvEYXcyiK3kLbSyqAS3Ab5gDWD4p0Xxle+KNTksrLVltGlAtpLO9l2smxfm2/2rAFO7dwIgOM85rqNc0a9vPAumxvaarqF7bxwJPbR6k9rNMp2LNvMdwqM+3cfmkZc9z3Svyeen9f5h9u3TUs+HvEV7qFxpsVxPHdJdwXExmGlz2BOxoguIpmLYxIeeQeMYrR16+1GGWxsNFa1ivL2RgJ7uNpI4UVSzNsVlLnoANy/eznjBw/DGnC11i3MfhvxLpyQwyxpLqmqRXcahtny83Mrj/VrgKAOua6LWdGXWIYdt5dWFzbyebBd2hTzImwVPDqysCpIIZSOc9QCKlboKPmZuk+Ib67vLC0vIYEmc3cV0YwdpkgdV3Jk8K2ScHJGQM8ZPLX/xP1ayiszNoNxbi4jnKXDwiWKZ0kRVKiKRmRMMSWkCjpyOldZa+H/7M1XSBZiSW3tornz7iVwXeSRkYu3TJYhicDA9AMCuc1Dw5bWWr6wlr4Bkmjvtvl6ho8OnwSbSFZ1LSSI5JdSTkHPrS66h00NTVPEmtL4KstQ0i2hl1K7uVhWIQiQYLkHCtNGCcDvIP6VP4TvvFt5d3A8U2YtYVQeV/oMUBZs+qXk+eOxC9evaoLjw5e6v4Xs9OittPtbQbjNYeItLTUGLbsqT5U6xjHJ6t1HQimeHPBN14d1Zbq1j8JWqMNk/9l+GzaSyJ12iQXDY5APKnpRHS9wlqtDs6KKKACiiigAooooAKKKKAOd1f/j81n/sFx/znrk/hB/x9a1/1xsv/QHrrNX/AOPzWf8AsFx/znrk/hB/x9a1/wBcbL/0B6bH0Mu/uQfC95PcIJZZld5lZj8zEnIJHPtUFtcSppVjNAnltFFG8QVj8rADABPPtXba94Fa+mlfTZIVinJaW3mLKuTySCM4z6Yp2ieCXtZoX1SSF4rfb5VvDkrkdCxOCcY6Yr2PrlH6ryW12t02/Lz/AF0PF+q1fa/qcN4Yv3smkWKa+lkmzGlnZMwY5XmTjglRnA659MU7xCZIdPS2uoJI7j7S0nmSRzK1wu1R5h8wnkkc4qvZaVrtlK7Lod5KkiGOSOS1k2up7HGCOQDwR0qaaz19liW00G7sUik81Rb282Q/HzZYkg8Doa+jkoe250196/r8PmeFFzVHkaf3Pr/Xl+d9KObTfPi1QtpfkxvGjSkXXnBgnoPlzwe2K42ui/4rX/qPf+RqozaJr9zM01xpmpSyucs728jMx9yRV0OWm3eS++/6ImtzVErRf3WMuitH/hHda/6A9/8A+Ar/AOFH/CO61/0B7/8A8BX/AMK6vbU/5l95zeyqfyv7jOorR/4R3Wv+gPf/APgK/wDhR/wjutf9Ae//APAV/wDCj21P+ZfeHsqn8r+4zqK0f+Ed1r/oD3//AICv/hR/wjutf9Ae/wD/AAFf/Cj21P8AmX3h7Kp/K/uM6itH/hHda/6A9/8A+Ar/AOFH/CO61/0B7/8A8BX/AMKPbU/5l94eyqfyv7jOorR/4R3Wv+gPf/8AgK/+FH/CO61/0B7/AP8AAV/8KPbU/wCZfeHsqn8r+4zqK0f+Ed1r/oD3/wD4Cv8A4Uf8I7rX/QHv/wDwFf8Awo9tT/mX3h7Kp/K/uM6itH/hHda/6A9//wCAr/4Uf8I7rX/QHv8A/wABX/wo9tT/AJl94eyqfyv7jOorR/4R3Wv+gPf/APgK/wDhR/wjutf9Ae//APAV/wDCj21P+ZfeHsqn8r+4zqK0f+Ed1r/oD3//AICv/hR/wjutf9Ae/wD/AAFf/Cj21P8AmX3h7Kp/K/uM6itH/hHda/6A9/8A+Ar/AOFH/CO61/0B7/8A8BX/AMKPbU/5l94eyqfyv7jOorR/4R3Wv+gPf/8AgK/+FH/CO61/0B7/AP8AAV/8KPbU/wCZfeHsqn8r+4rWPm/bo/s0CzykkJG6bwTj0PBx154454rad7dfPulitJru1tB5hjiUw+aZAuQoGw4VgOBgnkZ61Vs9K8Q2FyJ7bSb0SBSvzWRcEEYIIZSDwTU4tvEy3QnTR5432FCE0wKjKeoZQm1vxBrmqyjOV1Jff+HodFKMoRs4v7vx9f66jj5n2tJ7S2sYhNbxy3DzQK0cPUE4YEDcRnAGegX0pyzWds8MtjZQy295fSLtmiDnygVwgJyV4Y8jnpzxSJF4pVpidKuZPOZWdZdNEi/KCFwGQhQASABjApsMHii38zyNLu08x/MwNP4RsY3INnyH3XH6VlZP7S+/8/ToaXdtE/u/L16/8AgtdFD6zEjvBJatdeVtW4Tey7sfcB3DOOuKu2CW+spFcXkFrCYJZSfLhCK6LGXClVAyAV+pDdazE0HXY5FkTStQV1O5WFs4IPr0q7LB4qmuop2029WSFiyeXYlFyepKqoBJ75HI4NXU97aa9b7fnuKGju4O19rb/wDDEF/ZnUJYJ7Oa2aOWNsF0is8bWwQV3bc8joSSPpVq1SKFrDT3t7d47uB3mlZFZtxLgMHxkBdo+6cHB65qrd6X4hvpFa40m9OxdqKlkUVRnOAqqAOSTwO9SRWfieGxNpHpl8IsMB/oRLKG+8A23coPcAgHJ9TQ7OCjzr7/AF/L0QR0qOXK/u9P+D16ka30i+H5Gnhs280/Z4MWkQYYALNuC7sgEDOf4j3FVdHuYrW+LzSeSzRssU+3d5Lno+Bzx6jkZyOQKmk0XX5IYon0rUDHCCEX7K/GTk9qltNP8UWAYWNpq9sHxu8mKVN2OmcDmrvS5JJNa+ZlapzRbT08iTXZZY7NbPUNR/tK8EiyLJ87eUhXON7gE5yDjoMepNW5taCaTHZzXVzdIkZdWuXmEN1kgFAAwO1cfKemQ2QM8VZofGFxC0VxHrksbjDI6zMGHuDT47PVxZwW9x4VkuRbqVR5Le4DYLFsfKwHUntWNqfLFSadn0a/4H9a7m/NPmbint1T/wCD/XkZ2ukHxFekjC+e2QvYZrX1KC1axup2Sza0hnj+y/Y2QSGM5+VioJBKgHLgnIPvWXNoOsSzM6aFeQqx4jS2lKr9M5P5mrMtn4lmESyaTdbYmDhBp+FZvVgFwx92zWknFqFpLTz9P+GM48ylNuL18vX/ADv8kS2ggT7BY/ZYGhvIHklkkjDOCS4BD4yNu0dMA4PrUjW9vPpM3lix+xx2SyRshTz1lG3dux8/LFh83y4Ix2qulp4njs2tk0y9ER3Af6CdyhvvBW25UHuAQOvrTH0/xI9kLU6VeCIYyFsSrPjoGYLlgPcms2lzX51v389/XoWpNKzi/u8l+AaVLGsjSNbQJpglzO9zGsjlf+eattzuxnGwA85OAMhLKRU02Q3kFsliUkVC0K+bLJg7drY3cHbnBCgDB5ODPHD4njiMY0aVozIZNj6SjBWOAcAx8dBwPSkFv4m+yrbto0zxopVd+lKzKCSSAxTI5J71Tabesfv/AOBuKN1bR6eX9aHP0Vo/8I7rX/QHv/8AwFf/AAo/4R3Wv+gPf/8AgK/+Fdntqf8AMvvOT2VT+V/cZ1FaP/CO61/0B7//AMBX/wAKP+Ed1r/oD3//AICv/hR7an/MvvD2VT+V/cZ1FaP/AAjutf8AQHv/APwFf/Cj/hHda/6A9/8A+Ar/AOFHtqf8y+8PZVP5X9xnUVo/8I7rX/QHv/8AwFf/AAo/4R3Wv+gPf/8AgK/+FHtqf8y+8PZVP5X9xnUVo/8ACO61/wBAe/8A/AV/8KP+Ed1r/oD3/wD4Cv8A4Ue2p/zL7w9lU/lf3GdRWj/wjutf9Ae//wDAV/8ACj/hHda/6A9//wCAr/4Ue2p/zL7w9lU/lf3GdRWj/wAI7rX/AEB7/wD8BX/wo/4R3Wv+gPf/APgK/wDhR7an/MvvD2VT+V/cZ1FaP/CO61/0B7//AMBX/wAKP+Ed1r/oD3//AICv/hR7an/MvvD2VT+V/cZ1bOkyIbMwWq2n29pc7buJWEyYGFVmBCkHP93ORg5wKr/8I7rX/QHv/wDwFf8Awq5Z2XiWxTbb6TdgBt6l9P3lG9VLKSp4HIx0FZVZwnGykvvNKUJwldxf3DbbS7Jha21yLgXd5Gzo6sAkRyyqCpGTyvJyMZ7450xLp0mnpDNa3TxQ6YZUQ3K7VJcZKjy+GP8AeqhHa+KIrU266bfbCGAZrIs6hvvAOV3AHJyAR1PqaZDYeJYJkkj0u9LJF5ID2JZSnoQVIPXvXNNKbu5ry1/r0OmD5LWg/PT0/wCCT6jbWd1EdonW6g02CbeXXyyAiDbtxnoc5z7Y71f8lbe4khT7sd1fqMKq8C3HZQAPwArHOneJGZydMv8ALwiBv9DblAAAPu/7I568VK1t4peRpG06/LM8khP2M8tIu1z93uOP5UnFNJc669fIqM7O/I76dCjqFlb29lbTWnmSK6jfN5qsrNtBK7QMoQcjDZzjIpL2NE0nTHRFV3jkLMF5bEhAz61buNO8R3VvHBNpV75aHIC2JUscYyxCgscdzk9aetn4kWxWz/se4eFQyr5mmh2UE5OGKFh17Gt1USSvJXT7+pz8mr916rt6C6pYWFlcXcl350ha6lghWHZGECYyxAXB+8PlAXvyKnTw5Z/6JFLPiaR4N7LdxEuJCuVWMfMpAYcnIOCcDiofs/indcE6besbhzI++xLYc/xLlflPuuDSC28UBYANMvc27K0b/YPn+X7oLbcsBxgEkcD0rG8+VJVF9/8AX9amtottuD+7+v8AgDU03S5hDNG88UPnSQss0yAyMqgrhtoCbicc5A9TU0Hh61aF3u2NuXmeJBLeQp5IUA7mDf6zlh93HAz3AqCCw8SW6hY9KvSgcybHsS6kkYOQVIPQcHipDB4pZZQ+m3riVix32G7aSMZTK/JwAPlx0HoKcnLaNRfeCUN3B/d/X9amdpEttDdSG5MSMYyIZJovMjjfI5ZcHIxkdDgkHHFakGji6mubnVRCm1o0CW9zBbo24E7wx+UjC9F6k9sGqlrpPiCzkLwaReZYbWWSxMisPdWUg/lVkQ+KRNJIdMu28wKGR9P3INvC4QptGB0wBjJq6krybhJfeRTi1FKcX9wjaLp6tbWqSzTXVzHKY5UkXyyys6oAMHO4qO/fvRBo0ctsLVZCkzy2qSMyqQpkDnjjIwNvAPJzntiA6Z4kMlvIdN1Avbf6pvsr5X5i3pzySeac2n+JmaZjp2o7ppVmdhauCXGcHOOMbj0qbu38Rff5/wCRXu3/AIb+7y/z/BhZ6fpuoXE7WwnSC3iLMk91FG0p3BRh2AVeuSCD0xk54ztStorTUZYbeVZYlIKsrq/BAONy8EjOMj0rXMPik3JnOl3W4qVZRpwCOCcncmzaxyAckE8D0FUptD12eZpZdIvizHJxaOB+AAwB7CtKc7SvKat63M6kLxtGDvfsZdFaP/CO61/0B7//AMBX/wAKP+Ed1r/oD3//AICv/hXR7an/ADL7zD2VT+V/cZ1FaP8Awjutf9Ae/wD/AAFf/Cj/AIR3Wv8AoD3/AP4Cv/hR7an/ADL7w9lU/lf3GdRWj/wjutf9Ae//APAV/wDCj/hHda/6A9//AOAr/wCFHtqf8y+8PZVP5X9xnUVo/wDCO61/0B7/AP8AAV/8KP8AhHda/wCgPf8A/gK/+FHtqf8AMvvD2VT+V/cZ1FaP/CO61/0B7/8A8BX/AMKP+Ed1r/oD3/8A4Cv/AIUe2p/zL7w9lU/lf3GdRWj/AMI7rX/QHv8A/wABX/wo/wCEd1r/AKA9/wD+Ar/4Ue2p/wAy+8PZVP5X9xnUVo/8I7rX/QHv/wDwFf8Awo/4R3Wv+gPf/wDgK/8AhR7an/MvvD2VT+V/cZ1FaP8Awjutf9Ae/wD/AAFf/Cj/AIR3Wv8AoD3/AP4Cv/hR7an/ADL7w9lU/lf3GdRWj/wjutf9Ae//APAV/wDCj/hHda/6A9//AOAr/wCFHtqf8y+8PZVP5X9xnUVo/wDCO61/0B7/AP8AAV/8KP8AhHda/wCgPf8A/gK/+FHtqf8AMvvD2VT+V/cZ1FaP/CO61/0B7/8A8BX/AMKP+Ed1r/oD3/8A4Cv/AIUe2p/zL7w9lU/lf3GdRWj/AMI7rX/QHv8A/wABX/wo/wCEd1r/AKA9/wD+Ar/4Ue2p/wAy+8PZVP5X9xnUVo/8I7rX/QHv/wDwFf8Awo/4R3Wv+gPf/wDgK/8AhR7an/MvvD2VT+V/cZ1X9Gjje/Z5Y1lEMMkwjcZDFUJGR3GRnHfFO/4R3Wv+gPf/APgK/wDhUtto3iCzuUuLbStQSWM5Vvsrn9COR7VE6lOUWlJfeVCnOMk3F/cR6my3FjY3ZiiimlV1kEUYQNtbhtoAA4OOPSs2ti70rxDfSK9xpN6Sq7VVLJkVR6BVUAdSeB1JqD/hHda/6A9//wCAr/4UqdSnGNnJfeOpCcpXUX9xpafqqwadApF75aRSB7OOPMF11JZzuHQEZ+UkBRgjjDUZLvxDZNClvA8cMW23limZWbA+UABmPXI/nViwfxHYaYbBdAuZoG37lkhuAGDDBBCsAfxGRVc23iF9SgvpNCuGni6n7HIokx0yFwOBxxjgVye7zSd0t+q/r9f06ve5IrXp0fl/X/BNXW7S4/seVbq5uvLJUmTUmuZQhHTYTbqFJ6Zz04ria6GWy1drSaC38KyWvnAK7xW9wWwCDj5mI6gdqz/+Ed1r/oD3/wD4Cv8A4VrhnCnFpyX3r/MzxKnUkmo/n/kZ1FaP/CO61/0B7/8A8BX/AMKP+Ed1r/oD3/8A4Cv/AIV1e2p/zL7zm9lU/lf3GdRWj/wjutf9Ae//APAV/wDCj/hHda/6A9//AOAr/wCFHtqf8y+8PZVP5X9xnUVo/wDCO61/0B7/AP8AAV/8KP8AhHda/wCgPf8A/gK/+FHtqf8AMvvD2VT+V/cZ1FaP/CO61/0B7/8A8BX/AMKP+Ed1r/oD3/8A4Cv/AIUe2p/zL7w9lU/lf3GdRWj/AMI7rX/QHv8A/wABX/wo/wCEd1r/AKA9/wD+Ar/4Ue2p/wAy+8PZVP5X9xnUVo/8I7rX/QHv/wDwFf8Awo/4R3Wv+gPf/wDgK/8AhR7an/MvvD2VT+V/cZ1FaP8Awjutf9Ae/wD/AAFf/Cj/AIR3Wv8AoD3/AP4Cv/hR7an/ADL7w9lU/lf3GdRWj/wjutf9Ae//APAV/wDCj/hHda/6A9//AOAr/wCFHtqf8y+8PZVP5X9xnUVo/wDCO61/0B7/AP8AAV/8KP8AhHda/wCgPf8A/gK/+FHtqf8AMvvD2VT+V/caPgH/AJHjT/8Atp/6LavaK8k8E6Nqlp4xsZrrTbuCJfM3SSQMqjMbDkketet18jncoyxEXF3939WfUZPGUcO1JW1/RBRRRXiHshRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFVr/AP49k/67xf8Aoxas1Wv/APj2T/rvF/6MWgCzWB46/wCRD1f/AK9mrfrA8df8iHq//Xs1AGlH/qh+H/oK0UR/6ofh/wCgrRTKMiXXNTTKrbr5glwVFtIyhM9Q4PzHGOw98dK3bKZrnT7ed9u6WJXO3pkjPFcxpuiQ6rZG8l1PUFMssvyw3GEAEjAYGOmAK2PD9v8AYo72zSeaaK3uAkZmfcyr5UZx9ASeK5aEaqXNN3uVNx2SMzU9RsItZnsrHwpPrd3Eqy3RtIrVfK35K7jNImScMflz05xVuDUNDtfD3/CR2tnHFAYNwaO3VZNpI+TjuWAHXGQOcc15r8QrK2n8TPb61rWnt5K74W8Sz6bbLtfnbb+ZYSs6DoSTkEYOetdS9neSfDCS4l1zXAhgLtGsNkG8vaUMYxbBfK/i3bM7eenFb3fI5EfaSOi0/wATS3Opw2OpaDqejyXAYwNeNbuspUZKjyZZCCBzyAPfNaOr6idJ0qe+FpLdiBd7RQyRI23ud0rogAGSSWHArxv4daHYWviyFND12xWQ25R28O32n3eY1IbE4SwjIU4xvyWJ4yM5r1Pxgl3PoEtpZWuq3Buv3Uh0o2glRCOf+PkhMEcdCeeMdRU7qOgo6y1IdO8WXF9qtvYzeGtTsjcRmVZZ7myZQgx8+2O4ZyuSoyFPLCqHiX4m6R4X1p9Nvod8york/wBp6fBwRn7s1yj/APjuPTNY+i6drVjr1heS2Xjef7PELQC8k0YxiEkZDeWwfGQCSp3Hb36UuvR+Km1y4uvDun+LLET3KfaRbvpDRSIo2l081mcMVAwDgeoFEulv6/rQSvrc67SfE0Wu+Eote0mwurmOZWMdqjw+a+1ypAbzPLPIJB34I71DZeKp59ZtdO1Dw3q2lPdh/JluntWRiq7iP3UzkHHtiodO1fWbLQk+0+HvEWoXKSlD9pk04TuDk7z5cyxbR93jB6cHk1Tn1PWb/wASaRct4K1qGG1aXfJJcWPyl1Cg4W5JIAyT39Aab30DWw67+JekWXiifQpYJWuYBIWaK6tJD8kTSn90sxlX5VIyyAZx0yK6TTNUh1WCWW3WRVilMR8wAHIx6E8c15p4uuzoHiu902PxHbWVnqUDXdxbatrFtYwyGTdGyxk2kkh4TJ+cYyK6n4Ztp58Jv/Y9vYW9qt3KFTTbpbi2yDyY3WNAVP8AujnNKGq+X431HPR28/wtdFq+8ZfYtUubUaDqlxb2lzFbT30TW/ko8gQjhphIQPMXOEPfGa27DUItRjmeBXUQzyQNvAGWRipIwemRXm3jpGg8Ty/8I9pMesak8kFzcWcfiG9jYFNvzyWkSmILsjGGcjcQAFY4Vuw8E30V/otxMj2Zla8leeK0vDcCGRjuKMWjjZGG7lGUMvQ0R1X9eX/BCWn9eTNl9QiTWItOKv50sDzq2BtCoyqR1znLjt61TbxFaLCkhjmw9+dPHyj/AFm8rnr93I69fasPUPB97qmpXGs3xsri+JNtFZTAvavZZO6F8qcl8hmbbwyoMMFO7OPhWPUPBkuk6RpOlS21rrksq6ddDyrV0SdiUwsbgD22kUluv66r9GD2dv60f6r7vw64+ILUan9hMc3m/bRZZ2jbvMHn569NvHrntjmjXPEem+HVs21WcRC8uUtoskD5m7nJHyjue1cnpPh+Xw/eacsuk6Vo6XevGeOz0mQvDGPsLp18qPklCfu9+tXpHMGqX8//AAr/AFy+kud8MlxNdWcyyRk8qgluspG2AdgCj1XNN9P67Df6fqzs643xL8TdI8L60+m30O+ZUVyf7T0+DgjP3ZrlH/8AHcema1/C0Yg02SFNF1LR41lJSDULpJjggfc2TSBEHQICAMcACuR16PxU2uXF14d0/wAWWInuU+0i3fSGikRRtLp5rM4YqBgHA9QKT3SQls2zrtJ8TRa74Si17SbC6uY5lYx2qPD5r7XKkBvM8s8gkHfgjvUNl4qnn1m107UPDeraU92H8mW6e1ZGKruI/dTOQce2Kh07V9ZstCT7T4e8RahcpKUP2mTThO4OTvPlzLFtH3eMHpweTVOfU9Zv/EmkXLeCtahhtWl3ySXFj8pdQoOFuSSAMk9/QGqe+gtbGjq//H5rP/YLj/nPXJ/CD/j61r/rjZf+gPXWav8A8fms/wDYLj/nPXJ/CD/j61r/AK42X/oD0MroauplNS8I3viPUXgdRE8tnBeF/s0SA/KXVOWz1J/KqljfxaRpOn6tpzRRiSCOa7gtS/2eVSoLFFblcZJB6461H4jt57PwndeGrplgiaNora6lyImQnjLDoQOCKXSdOj1LQtP0WwP2gRW8cF1dxg+UiqoDYY/eJAIAHrWtoeyv1v8AgRrz+VjV8e+JNU8OmxbSr+wiM8gV7efTpLqQRhh5k/yTJtjjU5YkEdBkZFW/DviLUtS16403UbLyUt7KGZbnbGq3ZZ3UyRhJpMRkICAx3c81Z8U2uoCy+1aBBJ9uZkjnms0g+1mAEnbEZ/3edxBw/GC2PmxWT4T0vWrS3vQIZrH9wsNm+sWtm00bAscbbMqhhG4EKWDZL9ARWMf6/r+uvkXLb+u5C3jrWh4ckvh4T1Ald2Lzfa/ZsByu/b9o8zbjn7ufau6rzNvhTcNr39rlfBZudpyP+ETO0uW3eZ/x8535/izXo1otylnEt/NFNchQJZIYjGjN3IUsxA9ix+tC+HXcnqTUUUUDCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCtqEt3BYyPptql3dcCOGSbylYkgZZ8HAHUkAnA4BPFc4ni7UXga0XRoTri332H7KL0m33eUJi/n+Xu2CMjny87vlx3rX8SQ6xcaHLF4deBL5mQAzzGIbNw3gOEcqxXIB2nBOawotD1uDTrCay0rR7G+025aSK1XUZZYrlHUrIXmMAcOSxbdtckjknJIF1AuReIddvtHS40zQbZryOSaK8gu9RMKQvG20hXWJy+7qpKqCvJ2niqlx45u5rCO+0HQ2vrZNPj1G7E1x5MkcUgLKkahWEkm1WO0lR935ueKt54c8Sva28QtdJv4LmSa51Sykv5baOWV2Uom5YXMkaqCpBCh+MjBK1cv9G8RvNcSabDpUP8AatnHbXqyXDkWbKGG+LEQ84bXPyt5f3RyMnBrbz/4H5X/AOHGrX12/S/52Oiv9Wt7DQp9WkDyW8MBnxGMs4xkBR3J7Vz58ZXunW9+PEujx2N1bQRTwx296Jo5xIxRV8xkTawcYbI2gEHcRnFm/wDBVlc6fdRW1zfQzTWn2aPfezSQR4UBSIC/ljG0HhQevPNZeoeFtb8RQT3euw6TDqEX2c2dtDNJNCxhlE2XdkUgOwC4CnaBnLHih25tNv62JV+XXf8A4b/gnQ+GNbbxBowvmbTXDOyh9L1AXkDAekmxcnsRjgis+/8AFl7a6pP9n0dbjSbO5itbu8NztlR328pFsIdF8xNzF1I+bAO3lLTwvNqKX1x4j/0O5vrlZmh0fUbiEJsjEYzMnlNISBk5AH3Rg7cmvc+G9YN5eadbfYW0TULqO5nmmmc3EWAu+MJtIfd5Y+cuCN54bAy/tf15f8EOn9f12Lb634jg8S2enXGiaYba7lkxNBqsjyxwoMmVozbqO6DAc8uOSOau+JdWn0mxthZmCO4vLqO0inugTDCz5wzgEE8jAUEbmKrkZyJrTTZk8Q6hqVy6N5scUFsqknZGoJOQeAS7N06gL6cQeIdN1XVbb7Lp91pMdrKjJcwanpjXizA9sCaMYxnIIOanoiurK+k6jq8PiOTRddutOvpTa/a0msYHtzGu/bteNpJMZPKtu52uMDbk87B4w8QL4qurMT2OsWkD7IotP04QyXbjPmxxyy3YjLRfIX4PVgACpxf8G+C9V8Hwx2dpe+H1sDI0k8dnoTW8sxOeri4IyMgAlTwMU4zalpeqXlm3g271PTbe5SXSmshYpHbp5KAhRJMjKwcy846NwcU/6/H+vW3QXRm9oOqyal4T0/Vr5FhkuLNLiVFHCEoGIHJ6fU1kaV4yubloJNW0j7Ha31m17YPbzNdSSRqFJV41jBWTa6kKnmZ+YZ4GdvQbYWfh2wtVt7i2WG3SMQ3TI0qADGGKEqTx/CSK5bQ/Bl3pOsSaoljZwPaW8sFhZrqlxPE28qc5kQ/Z1+QDy41IGf4sKA/tP+v66B0NG98W3lvqMxttHE+k2lzFa3d21yUlR328pEUwyL5ibiXUj5sA7eUtPF9zcalA0ulpFo93dy2VteLdFpWljLjLw7AFVjG4BDsfu5UZOIbvw9rUt7eWMQ086NqV0l1cSvK/nw4C741jCbXDFBhiykbzwcDMMfgqR/Gi6nJa29raW1095EItQnlE8rKwybdgIoDlyxZNzMe4ywKXS/8AW1/1t+oPr/Xe36X/AENHW/Euo6bpx1ax0dLnSobb7VdS3Nw9tOqDJYJC0ZLOFGdrmPkgZ64k1TX9T0vUIXl0iFtIkuIbY3X2w+fulZUUrDswVDOoJLg4DHacDOdq+n+Kb/V7a4k0rRr6yihjcWU+rSxJHcgks5xbN5oHybS2MEbtoOCHyad4kk8Xm/utN0m/s4pV+xtLqcqNaIUAdliFuVaTO/DFs4O0FQTlrdAzrqKKKQBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVgalr2pR6+dK0TS7e9lht0ubg3V6bf5GZlAjAjfe3yNnO0DK/Nycb9ct4v0XVdZaOPTrHTJGVD5GoT3ctvc2Eh4LxmNCWyMZUPHkAqSQxwdUMv3fi7RbHVxpt1cyJcb0jdxbStDE742I8wUxoxyuFZgTuX+8M81H8ShFrEyXVpeyWkmp/YLeOLRbwSRhUYs7PsIkJK8KqqQOSTV668Oa41zfWELWEml6ndR3NxdvK6XEWFQOixqm1s+Xwxddu7o23me98PamsST2H2Sa6g1htQjimmaNHRlZCpYIxU4cn7p5AHfNC3V/61j/AMET2f8AXR/rYNA8cWmp3Uun3j+Vf/bru2iUW0qwv5UsiqvmkFDJsTcVDbupwBVB/HV5IqS2sVm0MttpU6FfMcEXd00T4LBCQFAK5VTnqO1Xrbwvew21hG8tvuttbutRfDNgxyvOygcfe/erntwefXKs/AWqW+m2lu89oXgsdHt2IdsFrS5MshHy9CpwvqeuOtONr691/wAEp21t/Xvf5HYabrthq1xcw2EkshtnKO7W8iIxBIOx2ULIAQQSpIB4NJY6qb3UtVtBDsOnzJFuL58zdEsmenH3sd+lZvh7R9T03WtRluFtrWwmOYre3u5JldyxJlCOoEGQeUQspJJznJLIbLxBYeKtSntLLTbjTdRnikaaS/kjmiAiRGxGIWVvu5HzjPtUu9tN7fiT1ZLb+NNKay0qS5m/f6lbx3CR2kM1wqI+MOzCMFI8nG+RUHXpg0+TxroEM99FLeuv2CKWWeQ20vl7Yv8AWBJNu2Rk/iVCSCCCMisnQPDeu+Go9MSyXTbk/wBm2tjfNNPInkmEEb48IfMB3t8p2dBzycZLfDe9NprNoBEwmt71bG6k1i8cb7gOButmzFHjzCCy7s4yAM4FO19PP/gDVr6+X/BOrj8b6DLa3VwtzOFtTGHjaynWR/MOIzHGU3SBiCFKBg2DjOKkuPF+i2s9pDPcyrJdokij7LKfKV22qZcL+5BbIHmbeQR1Bxn654avb2+u7qCC0u1ksreBIJrqW2O+OR23CWNS0ZG8FWUE5HbrWNL4B1S51K3uNTkXUBcWsEF839sXdt5flsxzsiwtwMNj59nKk/xEAW5Otvl+Oh1viDWZtJis47K0jury+uBbW6TT+TFu2s+XkCsVGEOMKxJwMckiG68UW+i6fbSeJk+xXcwcm3tFkvMBPvOCibvLAIJdlUDcM4zVjxHZ3N/pD21tpum6oshAls9TcpDKvuwR8EHB5Q5x261x134D1meDTZ5pFu7iGKeCWD+3b22EUckgdQLiP55tgG3DqN3ByuMVOv8AX9dytP6/r+vy6oeMdDbVm05Lx3nSVIWZLeVoldwpRTKF2AsHXALc54p7+JbJda+w+fAqRxTyTyys6eX5Xl7sZTYVAlGW3jB4wcNtyk8GPDoOu6fA8MRu5457FwzHymihhWJmJycq8IPVuAOSagufA9ze21rBPdQrnS762u5VDEtPcvE5dV4yu5H4JBwQPpWn9en+f6CXmay+NtDbTDfCW7EXmiFEOn3AmmYjcPLiKb5AQCQVUjCsc4BxsWN7b6lYw3llKJbedA8bgEZB9jyD7HkVyGueH/EPiKwsJ9Qt7CG+0+5MiW1nq91bpKpjZCftEaK6H5s42MMDBJ3ZHTaFpi6PodrYogj8pcsonkmwxJZvnkJZuSeW5Pt0o7i7GhRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFZ+uao2kaW1xFbm6nZ0hggDbfMkdgqgtg7RkjJwcDJwcYrQrK8R6bc6lparp7RLeW88dzb+fkRs6MGCsQCQDggkAkZzg9KX9f5gN0HV7vUvtlvqtglhfWUwjljin86NgVDK6OVUlSGxyqkEMO2Tr1jaBYahDLfahrSWsV9fSKWhtJGkjiRF2qu9lUuerE7V+9jHGTs1QHBa343v8ATvEFxaw3Ol+bBcRww6DJGTf6grbcyQt5oAHzNj5GX9225l5KbNl4g1W+8JahqUOjuNQgmnjisJGUP8jlQGKsyk4GTtY57Vma/f8Ajm08XKNG02W90XfCzCKK23Ff+WiiSS4Qr248tvZh2bqvh++1jwHfWWtaBZXeqQyvLDtgtp0kdju8yISqEDBWK5kUZIOcg5M/Yf8AXb+v8h9bf110/r8Sfwz4h13UNaW2u/8ATbRo2Ms3/CP3elfZyPu/8fDt5u7phcEdTXZV5L4Z+H1tb+KbKaXwjcxWsZZ5ZNV03RFVSBlChtV8wMGx7V61VPYlbsKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqtf/APHsn/XeL/0YtWarX/8Ax7J/13i/9GLQBZrA8df8iHq//Xs1b9YHjr/kQ9X/AOvZqANKP/VD8P8A0FaKI/8AVD8P/QVoplGRLdaFIWnk0RZS8xQv9mjLM2SCSM7hz3IHvitvTorWOxjexto7aKZRJsRAvUDqBxnGKwp9OWaOa4jSOWVYw5EmmNuf5cgZbGTgYx1HTGeKteE725vNHZLyFoXtZfs6q8bIxVVXBYNzk5zXLSlW5rVTSUFyc8diTU/GHhrRLz7JrPiHStPudofybu9jifaeh2swOKtLrelPov8Aa6anZtpmwyfbRcIYdo4Lb87ce+awtU1zxbp1xGqeH9FlhnuRbwudalVjnO0sv2UgcDkAnHvWRd2PiTTvhxdWF1pliJPOkdjY6hPK6q8hk3oBZuxcMwG3y2GOfaui/ut/1/WqMvtWOp0zxj4Z1q8Fno3iLSdQuSpYQWt9FK5A6narE4rZryPwlr/jSTxNBb6ld3N2sztsg1BJrSMoBk/M2lRbnUZOA65x06165VW0RKerCiiikMKKKKACiiigAooooAKKKKACiiigAooooAKKKKAOd1f/AI/NZ/7Bcf8AOeuT+EH/AB9a1/1xsv8A0B66zV/+PzWf+wXH/OeuT+EH/H1rX/XGy/8AQHpsfQ6nVPElxFa3t5Y/ZoNOsA32i+uld1yv3tqJy2PWk03xPOyWc2om1msr5Ua3vbUMi/OAV3I/K5yOc/XFc/qOpzaf8J7u3tZXgv7a3kidkOHSUHk+oOefxquqXl34G01riV5bm6s4UTccs8rIMH3OefwrX2f7r2nnYjm9/lO21vxTpvh6SJNTW/8A3xARrbTbi5UknaFLRRsASSAATk1bs9Xs76cQQNKJjbpc+VNA8TrG5IUlXAKnKn5TgjHIrnPHenQ3q2bajLf3MAlUWWm6dsjlluxlkl8x2VcoFLKrELkEncdoGf4SgtNI1jVL+60ebSdR+wRPfW8WnRCS6w8h+0BbaSXezEsNvLZXpgisY+f9f1+XztbXby/P+vn+PZnWLEaQ2qef/oaqWMuxugODxjPX2q7Xg76NYtqTW39kWn2V90x1M/Dq/N4HMmceZnO/Bz5m3t0r3K0uo72ziuYVlWOVQyiaF4nA90cBlPsQDQtY3F1sTUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAEN5eW2n2ct3f3ENrbQrvlmmcIiL6ljwB9apjxHoh0P+2hrOnnSv8An/8AtSeR97b/AKzO373HXrxUXijW9O8O6DJqWr+UbeOSML5zKi+YXUISzYVcMQdx6Yz2ri4NR0SKSy8QXOuaTeWcmsPc6hdWVyr2lnObby4wXzgAAKNzYyzBsLkAC1v/AF/X9dw/r+v6/I7e78UaBp+nW2oX+uaba2V3j7PczXcaRzZGRsYnDcc8VNf65pOlTWsOp6pZWUt4+y2S4uEjaduBhASNx5HA9RXAx+KdG0PT1iiu9IsP7Xub2bTrvUpFhgS3aQF5BuILhmbeqKQHGDlR81Qzy+GtHsL3TLy9t7q1vtAt7LSXdw51GNVdfLiwf3jFmU4Xk719qOl7f1bb1X+fYa3t/W+/9fqepVn6dr2j6xaS3WkarY31vAxWWa1uUlSMgZIZlJAOOea57XU8RyeE9Rsp9OtJbb+zSpmgvHa4mbYN6+T5YAz8w4kJ6cc4rm/EN9p2uR6hqPhS8s5tLFtZW+o3kCCWJYluNzKcfKdkTOWU9FYbhg4oekrf16vyEtY3/roelaZq2na1Zi80a/tdQtixUT2syyoSOo3KSM0ybW9KttXg0q41Ozi1G4XfDZyXCLNKvPKoTuI+U8gdj6VzGgarq1zYXzeHLuy8UwR3SpBqF5cLbLMvlgt+8ghZJCrfLlUA7E5U5y9SurD7RrOjXzW6eIb3Vba4tLUndJLt8oxyoOrImxssAANjE45p/at/XT/P8BdLnXw+M/C9xqg0y38SaRLfmQxC0S+iaXeOCuwNnIweMZrQ1LU7TSLF7zUJTHCpA+VGdmYnAVVUFmYkgBQCSTgCstcat4yk8xQ1voyL5eR1uZFOT06rGQAQf+WrVW8aXNtHbWivJqMF7DMLmzuLPSLi/WN1BH7xYkPykMQQSpIJ2kEZE9EV1ZpaR4k03W5poLJ7hLiFQ7295ZzWsoU5AbZKqsVJBG4DGQRniq1n4y0m/wBZOl28eqC7X7wl0e7iRRzgl2iCgHa2CTg44zXOeDtdutT1eK98Sf2j/akkT20MEfhu9s7eBC+4lnkVhubYpyXAAAAAOSZLTwnp+tavqR1GVdTu4LxYdWW/so5Le8XylkjRYySEWMSLtPUHfnduJL/r8RdztrK8g1CxgvLN/Mt7iMSRvgjcpGQcHkVBZa3pWpXl1aadqdnd3Nm2y5gguEd4GyRh1BypyCMH0NVfDVlLpHgzS7K4g8ua0so4nhQg7SqAbRjjtjjivPfCeoaa1xYQXGq2M1rbaRPDKtnO0M2jRfIzJdSghg+VxvPkkFW+QnJV6czS/rf/AC/rq+h6Y+t6VHrMekSanZpqcieYlk1wgmdefmCZ3EcHnHY0Ra3pU+sTaTBqdnJqUCb5bJLhDNGvHLIDuA+Yckdx61x+varYv4q0/T7XUNMu3W/t5H0iJSt+0nA+0b9xLIqYY/IMqp+fHBzbUzDxbYaDZz6TdJp+sXN9NPbXLPdwpIJmbz49oEWTJt3bzv4IUZJVLX+vTX8f62Sen9ev+R6Dfa9o+mX1tZalqtjZ3V2222guLlI3mOcYRScsckDj1ok17R4taj0eXVbFNUlXdHYtcoJ3GCciPO4jAJ6djXE+JPEXhZ7c+GBruk2cF9p8fn6jqGoozPatvC+W7vumc4fDFsLu3EsflM2q+IvDuqeJh4efWNI0/wCy39vNcefdRpcXU6+XJEkaZBOcRguc5A2gHO5WtWl/X9f11B6Hf0UUUgCiiigAooooAKKKKACiiigAooooAKKKKACiiigAqhqWvaPoslvHrGq2Ng90xWBbq5SIynjhQxG48jp6ir9cN4v1Ww8N65LqY1LTVvbiyWGXStRbY1/GrOVWBuTvy7fKFfcSq4UndR1QzuazoNe0241G4sY7gie3lWB98bIjSFS2xHICuwAJIUkjviuF1XUom8QXvm6zfWniFL2BdK0sXjxCWArGeLcHbKhJl3OVbbhuV2DFLUNB0ixaK+v7/Uba0j8TP588utXSJEpjdQSxlAXLMozx1x3ojq0u/wDnFfr94nom/wCtm/0PT7LUbXULeSe0l8yKOWSF2KlcPG5Rxz6MpGenFUm8U6KPu6hHIpS3kV4gZEZbiQxwkMoIIZwRweOpwOa4nRLZ7C6sdStr6+El34k1G1lhN05gaIy3Jx5WdgO5Q27G7PfHFZFpcTXelWNxdzSTzy6X4aeSWRizOxvnJJJ5JPrTirv5pfeU1a/l/wDJWPY6iS5gkkmSOaNngIEqhwTGSAQG9OCDz2Nch4M1COXxFrVl/aJ1K4SQySzx37zpHl2xG8LcW0ij5di/eC5POQHad4h0bT/HPiHTr/V7G1v7m8g8i1muUSWXNvGBtQnLZPHAqW9L+RPV+R1trdW97axXNlPHcW8yh45YnDo6noQRwR71LXl+hanFdweHP+Ep1+8tDJo9lNpyi+kha9uGz5pOCPPf/Vjy23DDZK/NWPNrGuPH4nnOqwQ31vZ6k1zBFrc73EKqH8ki0MYSDbhMOGBYHOW3ZqmrO3r+A0tben4ntFFeaavG+jSapYr4guLa0aztLuSXU9VmRN5lkDr9oyWt1kCquVwFONqgnBy73XNSvta0xLK+jsY5LK2fSkv9dnt3mcu28hFjYXuQEHzE/KVbA37iLV/1/X9dCb6X8r/l/n/w56tqGo2Wk2Ml7ql5b2VpFjzJ7mVY40ycDLMQByQPxp1le2uo2cV5p9zDd20y7o54JA6OPUMOCKw/GZsobGyvr3V7XR5LG6E1teXyhrdJCjJiQFlGCrsB8ynJGD2PDeIfE93qdrpMyTWOlWFzHdESjXZrC3muVkCo8dxHDmYEbnVCAHyThttTcqx65ULXdsl5HaPcRLcyozxwlwHdVwGIXqQNwye2R6153Gmrpb6/rlzqV7Lf6TeQObeO6kEHlJBbyTxiLIU7h5mCVyCe3NOutS1sTRXunXF01xqGk6nfW9uSzqMPbiDEZyNwQg7cfeZuPmNVtv8A1pf+vQS1/r+v6Z6RRXlWtapp9v4dsW8M+I/t+kTXwGo3t54hnhjU+UxCm7UO0OWCZVSozhfl34PfeFDdt4U086jPHczmLmaKZpVdcnad7Kpf5cfMVGevei24r7GvRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFR3FxDaW0tzdzRwQQoXklkYKqKBksSeAAO9SVz3jZo49Ainuxmygvbea7JGQsKyqzM3+yuAx9gaANfTtTsNYsUvdJvra+tXJCT2syyo2Dg4ZSQcHirVcz4TuLLUNU13U9Flhn068uY2S4gO6OeRYlV3Vhww4VcjjKEdQa6amBjXXi3R7LVv7OuJ5lm8xImkW0laCN2xtR5gpjRjlcKzA/MvHzDNxtY09NPub2S6SO2tXdJpXyoQocMOfcY9+1cTrq6E/iqfR7651wW17cQm706KzV7C4d8YMkxjJQHau5PMUNj7p3Hc0R2kPwtuZPCZ086U9xO/2RtNWZGRpWHlJGs8SqdxGCWAxzgdpv7t/wCr6Ddr2/q2p1mmeK9L1W9Fpb/boLhlLJHfadcWhkA67PORd2O4XOK2a8l8M6f4n0/xVYrqEM1q8+5Yp9WgkuwABudUJ1WYxsVB+YL25z0r1qqJW4UUUUhhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABVa//AOPZP+u8X/oxas1Wv/8Aj2T/AK7xf+jFoAs1geOv+RD1f/r2at+sDx1/yIer/wDXs1AGlH/qh+H/AKCtFEf+qH4f+grRTKMm00rV7eN/tLQ30zyq5lmuBnCOGRf9SeBjH1JbhjmtHRbK4sorj7UsSGSVWVYn3AKsSIP4VGfkzgADmtKim5OW5nGKirIhubOC88n7Qm/yZRLHyRtcdDx9amooqSiCazgnube4lTdLbMzRNkjaSpU/XgnrU9FFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//H5rP/YLj/nPXJ/CD/j61r/rjZf+gPXWav8A8fms/wDYLj/nPXJ/CD/j61r/AK42X/oD02PodR4it9CjvFmvLyayvZB1tMtJIB0JQK2fqRS+H4dEmvDNa309/exrwbzKyRg+iFVx9QKyLm8jtvhjqOuTPcLeXlu88s1tL5cy56Kr4O3aOBxxVA6o8nhXStTh84z29nFPHPPJvlbEYJDtgbiw4PqTV8j5OfzsTze9ynoWoadZatYyWWqWdve2kuPMguYlkjfByMqwIPIB/CotJ0PSdBt3t9D0uy02F33vHZ26QqzYxkhQATgDmuW8e6bqOrXlnBodvqjXUW2eeWDVLiygMCtlosxuqtK+CoyPlBJJXjM/hNNZXX5zfT3EmmNp0Bs0mt54mi/eSZSQyyOXlA27myCeOOlZx1/r+v6+V29DsKK8ifxP4kFjJpI1S4+3Etttf+EV1E3GzzMcXPmbPQeZt2167QtVcOtgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiqmpxSzabMlvftpzkZN0qIxiUHLEBwVzjOCwIHUg9K46y1LW761t9Og1m4MN5qDx2utNbRCea1SHzC6r5flEl8orbNrINwByGJuB3lFcO93qTeG5Dqfim506XTrqa1e6tLSFpb1g2IhseNwWKkArGgLOflwPlqO4vfFWpWczrqI0a+0vSobma3igR457l1ZmSTerHyxsA+Rlb5m+bgUXVubp/wLjSbdv63sd5RXL6j440yPRrr+z9R0+TWYrL7QuntOplQlQVLxg7wvzKTx0NY+qa1rXhH7XZXWrT6xLcQ2/2Oea0j8yKaSbyWG2JUVlyysoODncC2OQO6fL1/MlNNcx6BRXI6N4ostK0ib/hLNYnsJoLgRO3iF7W3kBZQyruhxEwIyQVz3B5BqrqGqaxJNqGt2GrmKx029igWwWCN4rmL935jMxXfvPmNtKsF+Vcg5OTrb+v61H0uzuKK5I2mrJ42tra28ValPCga7vLSaG0MaQncscYKwhxls4O4nEbZ5Oav+MDeDRYzai8a389Ptw0/d9o+z87/L2/NnpnZ8+3dt+bFHRMfWxvViaj4L8LavfPe6t4a0e+u5Mb57mwikkbAwMsyknAAFYvgy4t7rVppvDsutzaG1v876u1ywNwHx+6Nz+9+6GDfwZ24+bdWPa6VrS+I21PTv7WsrW8l8uwOo3d7eLAVDFpJ7Y3CgJJkhQfubVJALYC7C6M9HtLO20+zitLC3itbaFQkUMKBERR0AUcAfSpqxvCE09x4J0aa8mae4ksYWllYkl2KDJOSTyfUmuV8J+ItYv9RAbUTfz3NhJcG0u40t7dJgy7VtpVj3Sw4YguPNwNhyCcGvtWC2lz0OiuQ1jUr6y8YafHHq91F588SNYyWYWyaNgQ3+kNHlps5KqsgJ+UbMZasix8XXJ8VW8M2vLPe3GpTWVx4e8uL/Q4h5nly/KvmjIRDvdijCQ4AyuEtf69P8wen9ev+R6NRXIeKrjWbXT4Ly31d7HUzEFtdItEjnjvLjk7GZ4/MZOgJXy9q7mJA5V+uT6paeIbE2OtzSXFxPEF0VIImiNvlRNI7bDINoLMH3qu7YuCThmld2A6yiiikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFcj4lv7228QRLda3c6BpXkqYbyG3ieKSYs25J5JEYRrjywvKbixAYnAB1sHS511Fctf+LL+1vrt4NHjm0iwuEtru7e78uUMwUlo4ihDIu9ckup4bAOBnmk1Txhba41xDa2Tte66bRkl1mZo/LSJyEVDAVjHGSyDLEc560LVpf10/wAweib/AK2b/Rnp1FcJ4d8SatFMLfUbPzLG71m/s4b43heZXWadlHllMCMLHtB35GANuOax18Q6hfW0F4t9eILix0Cfa0wyDNeuJM7FVcsuFYhVBAxjHFNK/wCH4jatfy/zsep0VheHfEUmu3eoxtbW8CWc7QhEu/MnUhiP30e0eUSAGUZbKkHIqTSr+5utb1+3ml3RWlxHHAAoGxTAjHnHPzMTzmpbsr/MRs0VxuheLNS1Wx0mPTNO+3yPp9teX813eLE0aSg4C7IsSSfKxxtjXgcjOBmv8XLD7Rqi26afcLZwXckEMWqI11I1uGLCSELmJW2NtbLcYyBnFU1Z2/rQdne39anolFcZdeN9Q023vxqujW1rc28cE8edQzAIpXZA80vljytpUl8KwAwQW5xW1j4n2ei6nbWV3/ZUcn2eG4ull1ZEbbKxAFupXM5GC38HBXHJwETdWv8AM7yisHxdcajbabbtp0t1bwtcAXlzY2wuLiGLa3zRxlX3HeEB+RsKWOO4wNW+Idj4a03TYo9Y0zWJLqGW4S+1DUobNJokYDh1Qq8hLABVVQdrElcUroqx3tFcZB49nupp7mDSU/sa3ure2e9a6Ic+csTK4jCEFR5w3HcMY79nXfjRbXVmmuI500+C2v5f3TownFu8KE7Smd253VcOBxk5yNtWf9elxLXY7GiuM1jxxe+HdLt5fENhpWmXd7ceTbLc6wEt8bC5MszRjYQFIwFbJKgE5JHQ+Htah8ReH7TVbbZ5dymcRyCRQQSGAccMMg4I6jmkBpUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFY/ia8u7XSUTTpRBc3dzFaxzlA3k73ClwDkEgZIzxnGQRxQBsUVg+G5dQhvNU0vVNQk1JrKVDDdSxIkjxugYB9iqhYNuGVUcbcjOSd6gDI1Lwj4b1m+F7q/h/Sr+7ACie6so5ZAB0G5lJ4q5NpOnXMF3DcafayxXv8Ax9RyQqy3HyhfnBHzcADnPAArjdb0zxHN4guHsItU+1tcRtY6jHqG2wtoRt3LNbeapkPEmf3bFty4deCk8l5q+neCb6LVry9GqTXVxFDd2Wk3M+352KssSCRkTaOCSQOMHpS+z/Xl/X+Y+v8AX9f10N3TPB3hnRbwXmjeHdJ0+5ClRPa2MUTgHqNyqDitmvK/CmrT2viGF57TXbC2ZTG8LjWtSWdmwFybm2UQhTzuB574FeqVRPUKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqtf/wDHsn/XeL/0YtWarX//AB7J/wBd4v8A0YtAFmsDx1/yIer/APXs1b9YHjr/AJEPV/8Ar2agDSj/ANUPw/8AQVooj/1Q/D/0FaKZRdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/wDH5rP/AGC4/wCc9cn8IP8Aj61r/rjZf+gPXWav/wAfms/9guP+c9cn8IP+PrWv+uNl/wCgPTY+hsa74XvXsLnTrSJrvTLnd+6ilVJYdxyVG75SM9OeKl0vw7dzWdlYXlr9i06zSNfLkkV5ZwgG0MV4A4GcHmjULy81HQb3XBPMlnCrta2kF0LXzgpxueU/dyRx2AqCy1efSrOx1BrmeS2uI43ubW4uRcGEMASUl/i2569CBkVd58nlf8SdObzN/wAU6B/wkmjiy8y3XbKsnl3lt9ot5cZ+WWLcu9ec43DDBT2xWb4c8DxaLb38UrWMC3qCN4dCs20yEAZ+cKkjMJDnG8MDgKOMZp3jTxVfeFY7OeCy02e3uriO1D3movbMJXbAACwyZUDLE5GADxxVjQvFR1jWrnSpbCW2ubO2jlnLxzIm9mdSsZliQyKNnDgYOazXWxTv1/rX/Mg/4V3oX2n7R52uefs8vzf+Ehv923OdufOzjPOK6K0tY7KzitoWlaOJQqmaZ5XI93clmPuSTXJN8StPXSHuv7N1bz1LL5f9l3fkkhtv+v8AJ8vb/tZx712dHQXUKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDM8Q6IniHR30+W7uLRXkjk822EZYFHDAYkVlIyoyCpBFUZfCs1zYRxXfiLVp7uCfz7bUGW2Wa3O3aQoWEIVILAhkb7x9sbGoXbWNjJcR2lxeOuAtvbKpkkJIAA3EKOvUkAdSQKxB40tzYM/wDZWo/2it39iOlYi+0eds8zbnzPKx5Z37t+Md88Uf1/X4ARS+Bk3afLZa/q1lcWSzD7RH9nkeZ5WDSSP5sTjcSOqhQASAAOKlv/AAbHqEiPLrWqRvJbrbXzQtCn9oRqTxLiP5T8zDMew4Y89MOHi/z9JgvdN0DV795GlSW1hSFJLZo22urmSRVyG4wrNu6rkc1De+PdOtrWG6s7O/1K1azS/nns4lItrdslZHDsrHIDHagZsKfl6ZP6/ry38g1/r+t/xN+90+11DS5tPuog9rPEYnjHHykYwMdKxI/BUDWN1DqGranqNzcCMLfXMkYmg8tt0ezYioCr/NkqST97cOK27vULWw0ybULqUJawRGaSTBOEAyTgcnisW18aW0kF62o6ZqWlz2cUczWt1EjSSpISsZTy3cMWYFQud2eCBkZOrBbK39f1p+Bo6Noq6PHOXvbrULm5k8ye7uynmSEAADCKqqAAAAqgdT1JJpXPhG2udae9/tC+it5pkuLjTo3QW88qY2u3ybwflTIVgp2DIPOdLS7+bUbPzrnTLvTJAxU292Yy498xu6kH2asu+8Y2tjrDWbWF9NbxTxW1zqESIYLeWTGxGywck70yVVlG8ZI5w+q/r+v8w6M1rbTorXUL28RpGlvGQvvbIUKu0KvoOp+rGq+r+H7PW2ia8m1GMxAhfsWp3FqDn1EUi7unfOKoHxVcxa9a6bc+GNYgF1O0MV0z2rRHaCxchZy4XC9SvcDGSBV/XNWfSbWH7NbC6vLuYW9rA0nlq8hBPzPg7VAViTgnA4BOAZAo6V4I0fRZ4ZdOk1ZPJYskUmtXkkWTnOY3lKnqTyDzzUD6B4itNb1S80PW9Lt4NSnSdobzSpJ2RhEkWA63CAjEYP3e9XNK1jU5dWbTNf0u3sbloDcQtZ3huYpEDBWG5o42DAsvG3GGGCeQMRfHepQeJr7TNS0ezEOnhGuJNPurm8mCvnbthS1yxHylhn5Q6nPIp/1/X3B3OssLNrfSIbO6+zOUiEbi2gMMRGMYVNzbR7ZP1rFsvBaWUkbjXdWnNrA8FgJmhP2FWAGU/djeQAADL5h49znW0PVBrXh+w1QRGAXluk/lsSSm5QccgHjPoKytN8cafqDs01tdadZtbPeW99e+WkFzApAaVWDkqoDKf3gQ4YHHXD1u/wCv66/iHQnuvC/23VEuLzWNSmtEmjn/ALNdovIMiEFWz5fmcMobbv25HTHFSjw6ra2NRu9SvrsRO0lrbTGPyrR2UqWTagYnDMBvZsAkDGaq3njOztNWNr9hvp7aOaK3uNRhRGgt5ZMbEb5t5zvTlVZRvGSOcLbeMbS51ZbX7DexWss0lvb6lIqC3nlj3b0XDlxjY/LKFOw4JyMrp/X9dvwsH9f1+v4kVx4PuJtVXUoPFOs2t19lS1kkijs28xVJOSHgbaSWydu0HA44qRPCc0OvXOqWviTVrf7XKks9ssdq0cmxVULloC4XC9Awxk4xmnap4vttOtkvYbC81HS/IFzNqVkYnghi5+ckuC4ABY+WHOB05GZL7xOunapHb3OlagLN5Y4DqYWP7OskhARcF/MOWZV3BCoLcng4a3Bm5RRRSAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACsXXPDr62WU61qdjbSxGK4trVotk6HOQS8bMuQSMoVPPXIBG1WLqfiQWOqf2faaTqGqTpEs1wLMRYt42JCs3mOu7O1/lTc3y9ORkHruV5vBlrLqTzx6hfwWc0sc1xpsTp5FxIgUKzEoZBwiZCuFbbyDlsz3nhe3urYxxXt3aSi++3x3EJjLxSdDjejLggkYIPBP1q3Pr2j22rw6Vc6rZQ6jcLuhs5LhFmkHPKoTuPQ9B2NcvH8VvDo1ae3u9U0mK2W+FlBMupxs7OELM0iHAjQFdoIZiSegoWr0/rVfrYXT+uz/S5vQ+F7KGG2jWW4IttQm1FCWXJklaQsDx93MrYHXgc+tKDwFpdvaQW6T3ZSC3sbdSXXJW0lMsZPy9Sxw3qOmOtWNE8YaZrNxPZi6tItSinuY/sAukaZkimeLzNnBwdmemBnGT1qlL46RWBisC8bQ6dMpNyhyLu4aEcpuU7du7KsQ2cAjrTV76eX/AG763+f3/5mtp3h9bDWLnUZdQvL2aZPKjFyY8QR7i2xdqKWGT1cs3vycwHwzIniG41S013UrVbqRJLiyjW3MMpVQnJaIuMhQDhx7YrStNV06/u7q1sb+1ubizYJcwwzK7wMegcA5U8Hg0211SG8vdQtYkk8ywkWOXcAAxaNXG3n0Ydcc1OlhdWZNr4Mt9PTTU03VNSs1srWK0kETx/6XFH9xZMocEZb5k2H5jz0wP4Mgks9TsX1XUjp2oQzRfYt8fl2/nZ3sh2b85ZiA7MBngAAAXU8TaSLLTbi9v7WwOqBfskVzdRBpmbGFQqxVzyPuFgcjGamPiDRlvLy0bV7EXNjF513CblN9vHjO91zlVwQcnAqtb/AH/8Eet7le98Orc3k15baje2F3Jbx24ntjGSiozMCA6MpJ3sDuBHTABGaqWngyDTprV9N1XUrRYYkinjjePbeKhLDflCVOWbmMpwcdAoF+PxPoM1jd3sOt6dJa2TFLqdbuMx27DqHbOFPscVJJ4g0aGSxjl1axR9RwbJWuUBus4x5Yz8/UdM9RSROlv66f5D9V0+XUbVY7bUrzTJVbctxaGMsPUYkV0IPup9Rg81jjwVFFFbGz1rVbW8iMplvY3iMlyJX3yBw0ZQZYA/KqlcYXaMitPWtaj0aGA/Zbi9ubqXyba0tQvmTPtLEAuyqMKrElmA49SAWP4j0+z0u3vddlTQhO/lLFqc0cTCTJ+TO4qTwSNrHI5FC7jY1/DVjJY6xaSNM0WrsWuNzAlSYlj+U49EB5zzzUJ8IaW8VpFKJpIrWwmsAjSf6yOXy95YjncfLHII6k/S82vaOmqDTW1WxW/JwLU3KeaTgHGzOehHbuPWl/te2bWF06JllmKSM5SaP92U2ZVl3b84kU8KQARkjK5N/wCvL/INmZbeEpJLGGOXxHrEl5bzebb6gzQedF8pUqF8ry2BUsDuRic5zkAjdtYDbWsUJmknMahTLKQXc+pxgZPsAPQCs5fFfh59Ln1NNe0xrC2k8qe7F5GYon4+VnzgHkcE9xWnDNFcQRz28iSxSKHSRGDK6kZBBHUEd6YD6KKKQBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABVHWNKh1rTHs7iSWLLK8c0JAkhdSGV1JBG4EAjII9QRxV6qWr6rBo2mSXtykkgUqiRQrl5XZgqIoJAyzEAZIHPJA5oAj0bRl0eCYNeXV/c3Enmz3d2U8yVsBRkIqqAFAACqBx6kk6NZeh65HrcVzmzurC5tJvJuLS7VBJE20MOUZlYFWUgqxHOOoIGpTA4jX/Amp6n4uXW9N16KyCvDJ5EsFxKu6PoSq3CRtn/aQkdjWhJ4Qlfwbf8Ah19RW5huN3ky3lqJCoY7mEqqVEgLbum3g47ZMOqeM7rTri9uF0uKXSNOuUtbuf7Uwud7bP8AVwCM7x+8TA3hm52qfl3XLfxbHdeFL7XYNPu3jtXmVbcwukziNiuSjqrLnGcEZA9anTlfbf8AL/gD63+Rj+H/AIef2L4itdU8rwzbfZ1cY0fw/wDYpJNy7cM/nPlec4x1Arua43wz49/t7Wl0/wD4kl1vjZ/N0LWP7QEOP+ev7pPLB6A85PFdlVO5KsFFFFIYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVWv/APj2T/rvF/6MWrNVr/8A49k/67xf+jFoAs1geOv+RD1f/r2at+sDx1/yIer/APXs1AGlH/qh+H/oK0UR/wCqH4f+grRTKLtFFFIkKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAOd1f/j81n/sFx/znrk/hB/x9a1/1xsv/QHrrNX/AOPzWf8AsFx/znrk/hB/x9a1/wBcbL/0B6bH0JNcW4TwReeEyoF4sDQQqzBRMmflZSeDx19DSWemibw7pugxMHvzaRW86IwYQLsCuWI4GBnHqa6jXNWtJluIf7Mt9RhtM/aJryRI7eE9wXYEZ9cDik0TV7SBoLY6Zb6al2A1vJaOkkE2RkYZQOo5HHPatOeXs+Tpe5HKubm6kfjK1EFuNUttOjursp9jeeazlvhbwPy5FtGQ0m4hVITBIIJyFxWZ4NGoBL2WCzjupLezjt7W4uLK80xXClyIWS4MkmBuz5gBHzYwdtdNq3ijw/oE0cWu65pumSSrujS8u44S46ZAYjIq5aanY36o1he29yJIlnQwyq+6Ns7XGDypwcHocGsl5f1/Wv4lvz/r+tP+HPNm8D+Im1IynSbX7AUO7T/+E11LyS5fdu2+Tt29Rsxt56V6ZaNcvZxNfwxQ3JUGWOGUyIrdwGKqSPcqPpSfbbX7Gbv7TD9mAyZvMGwDpnd0qejZWF1uFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBleJLnVbTQ5ZNAsnvb3cirGhjDBSwDMPMdFJC5IBYZIFc3BZ6ha2tjqdl4c1X7TZ3ry3Vte3Nsbq98yMo0oZZjHkEr8pZQFUqoACiu5oo/r+v6/QDgLmLxJBaRxDQ9Se31Oae6v49NurcTw7mXZDvklQLlc7mjJIIO1hw1T3Npq9kblNG8NzNb6rp0VtHF58KDTnUMmJR5hGwBwf3W8/K3B4z3FFKyty9P6Vv6/wAx3adzltS8K382jXdra67eSK1kIILKdYRbq6qAp3CPzeSvOXPU8dqx9a0fWPFtvcX13odxp5gW2Eenz3cXmXflzCWRd0bsgVgAq5YZOdwUc16DRTer5nuSkkrI4zQfDd0un3q6cl54LtZrpZLexshas0ShArZQrLEm5sthM9AScswpl3pmsi41HRI9NmubTUryO4/tXz41SJMJ5gddwff+7O3ahU7l5XBx21FHW/8AX9aD3Vv6/rUybayuZPFN7qF4m2KOFLayBYH5T88jjHI3NtU5/wCeQ/Gt4qstR1OyWys9H07UreT5pPtmpS2jROpBRo2jhchgRkMCpUgEe2/UV3d29hZy3V9cRW1tCpeWaZwiRqOpLHgD3NLoPqcV4M0DxFoE6/2lpmnTyTfJc6lJ4gury4MYLFVUTQZ2jP3d4GST1JqOK50bRdYubC/0LUol0u987Tbiy0i9uDIJIVMkjTRowdmd5A2TzgZBIzXX6Tr2ka9A82harZalFG2x5LO4SZVbGcEqTg4qpaeM/C9/qS6dY+JNIub5mKrbQ30TykjORtDZyMH8qfWwuhL4dgFt4S0+3tJJHENokcb3Fu8DHC4BaN8MvToea5DwxpOs6TqUN0dD1CFrazkS+8+8glW8k+UgWq78RKWUnGIFwVyucbPQYZ4rmBJ7eVJYpFDJJGwZWB6EEdRT6fW4dLM4m80/WXudR0eLSZZLPVL1Ln+0RcRrHbxkJ5iuu/zN42HbtUqdy8jnEEPhnUG8XwCJNVt9Isb+S/ENxPbm2d2D/wCoCfveXkLESkKvIUdCO9opbW8v6X3WDv5/0/vucVr1xrWpX0Vvc+FtYudGa3SSS3tJ7NWllJO6KYtOvyqAuQhIbJBJXKl93Jq974sCan4b1W40y2njNmbee1EGcKfOlBmEjFWLYXaQNoYBm2kdlRQtGD1CiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK5Hxfa6i96k+h6PqD6mIdltqVjdwxrGcn5J0kYb4+c42SYyxUK2CeuooA4O+0fV5LnVNMOi/aF1W/gvBqqSxeVAFWIHcrN5m9DEdoVCD8nK84t32lanbpFdwafJdvb66179nhkjDyRMjJlS7KuRvzgkcA967Gq0Oo2VzfXNlb3lvLd2m03FukqtJDuGV3qDlcjkZ60LRry/wCB/kg6W/rqv1OSsvDd9BDpxNkqSxeIry/lIZMiKRrja+QeSVkQY64OD0NZFj4R1yHSbGGSy2yRadocLjzU4e2umkmH3v4VIOe/bJr0mC4guoy9tNHMiu0ZaNgwDKSrLx3BBBHYgioptRsreZop7y3ikXy9yPKoI8xtiZBP8TAqPUjApxdtu6/Abbd/663/ADOf8L2Wo2OsahDJY3FppYZmgF08D4kaRmfyWjJYxEkt+9wwJ4GOAlq+qab4v1df7Av7m01G5ieO+hlt/KjUQohLBpVfgqein2zXVUVNrqwu55/4b0XVfD8WlC70F9QebRrTT5is0OLJot28PuYZQlwcpvOUPHSsiXwTrkmn65ZSrqs0gt9SNp5ktkLSd7gPgKVQTZO8Z8wgAjqwANer0VTd3d+f4jTs7+n4HEa54euW1K5ubbTLmSFbGzSH+zpIEmWWGWRlKCUhCU3KcP8ALjPXoce58L+Ir/VoptSXUo11Gztobn+zXsVjhMbux87zUZl++GzCW+bd6KT6fRRcmyt8rfdb+vvMXxTbC60lVbR7rVgsoYR2VysFxGcHDxuzptIzjIdTgnr0PGaloHim+XTL29/tiSQW11aSR2kmnm5WOWRSnm+anlcooDmI5BAxuGTXptFTZf19xVzhIfB93baH4ght4j9se7gurCV5FLTPBBAIyxGOrxEHIHU8AGor3wjq1/BApRYp7rSdRS6kMo2x3Fy8LhCRyV+VlyAcBfpXoFFU23r/AFtb+vRCWmxwGuWGs6xY6VfWOh6no0um3QY2tpLYm5ZfJeMNH5m+Ehd+BuZTgsRg4B6vw1pp0jw3Z2TGctGhJFw0ZkBYlsN5ahMjOPlGOOPWtSii4rBRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFY/ie0u7rSY5NOh+0XNpcxXSW+8IZtjglASQASM4zxnGcda2KKAMPw9Dey3Wo6rqNjJpz3siCO0mlR5ERF2gvsZkDE7jhWPG3JzkDcoooA848S6m2n/EaCaTwXbX/kmAJq6aTc3FzFGc7wjRwMvGT1kUjJ+U97V/Dc3vgLUJJNN1LTtUtp5J2t7aW7TMjtu3D7PKGmG18lUcjdkcEYHWzeINGttZi0i41axi1KYBorKS5RZpBzyqE7j0PQdjVtbq3aKSVZ4zHEWEjhxhCv3gT2xjn0pfZ+/9B/aPKvDOmXE/imyim1HXb23JZ5C9trtgse0ZUl7i5ZGBIA2kc5r1qsvSfFGga/LJFoWuabqckS7pEs7uOYoPUhScCtSq6ErcKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqtf/8AHsn/AF3i/wDRi1Zqtf8A/Hsn/XeL/wBGLQBZrA8df8iHq/8A17NW/WB46/5EPV/+vZqANKP/AFQ/D/0FaKI/9UPw/wDQVoplF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/wAfms/9guP+c9cn8IP+PrWv+uNl/wCgPXWav/x+az/2C4/5z1yfwg/4+ta/642X/oD02PoWr/UPsfwdutixPc/ZpfNWaNZFMu47tytkHnPBqmJLqfwDp0pVEY2UBjWJAiiTYuwKo4A3YwB0rqPEOg2GZbl9St9OS4OZkulV4ZT6lWI59cHmn6Ho9pKYbk6pBqaWuBAlqqrBDgYBCqTyB0yeK0517Lktre5HK+fmKvju3nuIbY3GqvpmnwSpNGbO3kuLq4ulbdGgjVSWQFdzKoLNjqoUk53hKewg1jVddu7yWzzYRG+TUpbyPyWDyMzqLsKUh+bjbhQQw7V2eq6TZ6zZi2v0kKK4dHhmeGSNh/EkiEMpwSMgjgkdCai0jw/YaIZWshcySS4DzXd5NdSEDou+VmYKMk7QcZJOOTWS0/r+v6SLeq/rueJSanpBmfRxr+gYcNML/wD4T+6FuAZen2fb5e7Bz5f3fevebS8ttQs4ruwuIrq2mUPFNC4dHU9CGHBH0qaihaRSE9ZXCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAzPEZ0z+wpl12EXFk7Ij25Qv57FwFj2j725sDaeDnB4zXGp4ct7VdM0rVtPtrTRtT1WSUaMNrW8IEBMcDKBsOXQyFR8u88FsZPd6lpdhrFi9lq9jbX9q5BaC6hWVGIORlWBBweaoxeEfDcGkzaXB4e0qPTrhw81mllGIZGGMFkC4J4HJHYULS4HHQ6boV1oo0ZtEtdeMd5eR6RZ3GJIYolkAZiWBWNI2OwEAsqjagPQs1LQdPkt9StfFdwt7c6LoUBtby4b95CwWTdcxseUkLouXBz8q812l94Q8Nanb2sGpeHtKu4bOPy7aO4so5FgTj5UBXCjgcD0FSyeGdBmFgJdE05xpuPsO60jP2XGMeXx8mMD7uOgo6Wv8/la/qNOzv/AFvexg67rerJ4U1CKTSdRtHj04u+prJCI1bYN2zbIZQwy2CUHK/Q1zuu2Fn4dkvrDwdBa2dnewWMd3HBJ5UMYluPL80hMYLIWBYEMQo54BHqZAYEEZB4IPes2y8O6Jpumz6dp2j6faWNzu8+1gtUSKXcMNuQDByODnqKHrK/9PyZK0jb+umpzfh64n8N2OoaXY+H7a/exu1Ro/DsENpH88avkxSzBUYZAIDsTlWxycZmqWVheT6xrN3Ci6/ZarbRWUsjATW4/c+XCjDlVfe2VU4be/Wu/wBO0yw0exSy0mxtrG1QkpBawrEi5OThVAAyeajl0TSp9Yh1ebTLOTUoF2RXr26GaNeeFfG4D5jwD3PrT+1f+un+X4h0sjmY/Cnhu4+IYubLQNMt59KH2qa7gtI0kkuZdwGWUbjhdzHPUuh6irHjzUdMs7OxF9rmj6bdw3KXdtBq12sMV0Y/4Tk5x8wIYBtrBWwcYPUxwRRSSPFEiPK26RlUAucAZPqcAD6AU+l0VuhXVnnPg3xlpXifxImq3ereG7W/ntjZQadY6otxPMA5bc5KoTjB2qFOAzHPzYFq30G91fWr+4utV82d7hLbVrS0ubi1W3RY/MhWGVCrFlEgLHo/mNnbgKO8rAvPBWj3upXN+76pBcXTK85s9Yu7ZXYKEBKRSqudqqM47UeX9b3/AM/0F3uSeE4X0/wLpENzHLE9vYRLIkgO9SqDIIPOeO/NcP4NsVtdT010ji06XWtLmaHUbKSOS4vzmN/tFyCCvmgNkf61cu2WGQrem2lrHZWcVtC0rRxKFUzTPK5Hu7ksx9ySaoQeFvD9s16bbQtNhOoAi8MdnGv2kHORJgfPnJ656mnf3nL+uodLHGarp+n3FxrOrXSxvr1hq1tBZXLkCaEfuvLjRsZVH3NlRw29+tV7exn03xppudF8rVrnVrnztdWWI/bbYiVth2sZCEHlja6hFKKAeFz6C+haRJq0GqyaVZPqNunlw3jW6GaJcEbVfGQME8A9zS2+iaVa6jc6ha6ZZw3t2MXNzHbqskw/22Ay340lpby/4H521B638/8Ag/lfT9DlfFGg2OsyJpUdouqeIY7VAmrXSIH05SW23AZVASTcGIEYBZlGdqjcsmp6Lp+s+LI5NJ06H+1bK6hkvNbZQJLdU2sYEf7xLphSgwgV2JOTtbXuvA/hO+MRvvDGjXJgiWGIzafE/lxr0RcrwozwBxUk3g3wxcaoNSn8OaTLfh1cXT2MRlDLjad5XORgYOeMCmtGmD1NmiiikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFcR4w0uy/taXXNW0yy12wsrMGa2ndPO08KXYzwh/lBb+I7kbEQILEBa7es7UfD2i6vd291q2kWF9cWpzBNc2ySPEc5+UsCV5APHpR1TGcnf6zqj3Gp6paa40EWm38FrFpYhiMdwriI4csvmb3807drqPu8HnORJod9/aFqw8TaqgfxPIMiK0+Q+TJyP3HXtznr616LNoWk3GsQ6tcaXZS6lAu2K9e3Rpo154VyNwHJ6Huafd6PpmoWclpf6daXNtLJ5skM0CujvnO4qRgnIBz7ULRp/1vF/p+Inqmv62a/U4PQH1LTp7a4TVJJLK+8Q6jaSae8MflBTNctvDbd+/cg/i24ONueaw7OUz6TYzMsaNJpnhp2WKJY0BN85OFUBVHsABXra6dZIqKlnbqscrToBEoCyMSWcccMdzZPU7j61GujaWkaomm2ioiRIqiBQFWJt0agY6I3KjseRinF2fzX4FN3v5/53MXw1f38ms6ha6zeTyzuTPbxlYTbmDeQrQsg3EY2hhId27pxjMuhjPiTxUCMj7XDwf+vaKtay0fTNNubq407TrS0nvH8y5lggVGnbk7nIGWPJ5PqarXHhbw/d6wmrXehabPqSFWW8ks42mUr90hyNwx254qWrq3l/X9f8MTs2cf4TvtR1TTdGgTVk0a3s9Fsrxo7a2gVblpN24MpXCxDZjEYQ5Y/MOKzpvFnixtP1vVo0vYbdLfUfKaUWRtrdoA4jaMK5mZwUAYOCMk8KABXosvh7RpzYGbSLCQ6bj7FvtkP2XGMeXx8n3R0x0HpR/wjui/bLy7/sew+038Ziu5vsqb7hCMFZGxlhgAYORVN3d/X8RppO/oclc3PiWzur/SrbWbjULh7a2uonMVtHOm+RxLHDlRGTtjygkzg53Me2fc+KvEF7qkUegHUruCzs7aYsi2Ma3DO7q/2kSurKP3ZX90B827rwB6DfaLpepwyxalptneRzIscqXECyCRFO5VYEcgHkA9DzUcnh7RZprGWXSLB5NOAFk7WqE2oGMCM4+ToOmOgoW5NtPl/kZ/jDSDrVhaW6pZXWy5Eh06/crBfAI37t8BuBnePlYZQHHccje6/eLDp2k+CdNv9MgSC7ke2sBY74JIZQhjImk8sRhmO7yyT90ArzXompaVp+s2TWesWFrf2rEM0F1CsqEjodrAjiq9x4Z0G60+1sLrRNOms7Mhra2ktI2jgI4BRSMLj2qbFX/r+vz/AOAcfHrPiMw6vrd1qDxQaXdwCTTY4omjEBhgkny4UsWUPIQVbHHfjEd/4hv4b1NbjWC43aXql3ZrJCh2RxvbiLDgBtjD5yN3O72XHoH2K12XC/Zodt0SZx5YxKSoU7v73ygDnsAKFsrVJIZEtoVeCMxRMIwDGhxlVPYHavA4+UelV/X4W/P9RLTc4fXL3XdGtNM0+y1nUNZuNTusNcWsditxEghZ9sQk2RYJTI3Bjt38scEdX4auL+78N2c2sRmO9KEShjGSSCRk+WzJkgAkKSATimr4T8OppEmlLoGlrp0snmyWYs4/Jd+PmKY2k8DnHYVpwwxW8EcFvGkUUahEjRQqooGAAB0AHajuLsPooopDCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACue8a7H0GKC5bbZ3N7bwXZzgGJpVDKx/utnac8YY10NRXNtBe2stteQR3FvMhSSKVAyOpGCCDwQfSkBzvhOxstK1TXtP0aKK302C6jMdvBgRwSNEpdEUcIPutgd3J7109VtP02x0ixjstKsrextI87ILaJY40ycnCqABkkn8as1QHnWuw6VL4kuvDtx4rsLSPVbuG4n0x4G+3SSfLt8mUSAqv7pfmCMUwcMvy7X3VqmnfDK/is4odV0ya5uGka61C6DiJpWwQ4illkcNgYwc+p79HqvgrRda1E318t95zFC32fU7mBGKfdJSORVJHrjNWR4X0dNJutMhtPIsbs5kgt5XiVTgD5NpHl9Afkxzk9STU68tv66W/IfXy/XU858Nar4hu/FtgdUhuL+5UOLY6q9zarECP3hT/iVwK7bR91m7cY6165WHp/g/StN1GK+hfU5p4QwjN5q91cqmRgkLLIy5xxnGa3KrQlXuFFFFIYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVWv/8Aj2T/AK7xf+jFqzVa/wD+PZP+u8X/AKMWgCzWB46/5EPV/wDr2at+sDx1/wAiHq//AF7NQBpR/wCqH4f+grRRH/qh+H/oK0Uyi7RRRSJCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDndX/wCPzWf+wXH/ADnrk/hB/wAfWtf9cbL/ANAeus1f/j81n/sFx/znrk/hB/x9a1/1xsv/AEB6bH0NO8liPga+8U3kvl3s1u80NwYFnNsn8ISNjg4GDjuapR6kkGi6drlo267W0jmmnWEQ/aV2Bn3ovAyMnHY9Ks+INEvotDutDEM8mnTKywz28RlaJWOdrIOeM8EdRUmlaJNe6XYaStpcQ2VrFHHPc3MRiaVUAGFQ8jOOc9BWt4eyt1v+BGvP5WJPHt/qsN5Z2/hzUtWW9ystxZ6bDbvttg37yVjLE/zYyEUEFm6A4OJ/CetarqHiCe1vbi3ubBdOgntJ4pxK1wGkkXzXxDGEchRlACBjitbxTp2o6no4g0qXbIJVaSL7XJaeegzlPPiBePnDZUEnbt6MazvDnh/WbO3v0vLubTluIwkMcOrTam0L85lWW6TIJyBs2lRtzzk1jHT+v6/4f8Ll/X3/ANfLzvfkX+KN8ujywjUvCn2xZGiBOvr9sz5hUf6N5GN+P4N3416zXJ/8ITfHUhqH/Cb+IPtQhMAk8qw+5ndjH2XHUda6a0gktrOKGa6lu5EUBp5ggeQ+pCKq5+gA9qF8KvuJ/F5E1FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBW1AXzWMi6U9vHdnAje5RnjTkZJVSC2Bk4yM9MjrXJ23iXXLqH+zbeXTJdTbUpLJNRWB/srpHH5jyCHzNxKnMRUSffBOeCtdB4k0u81nQ5bHTr9LCaRkJmeFpFKhgWQqrocMAVOGHBNZn/AAjmtNplmv8AaumW9/p0weyktNKeO3jj2bDG0JnJYbScYdcfLjpyLrf+v6/roBANY8Q3Ph6W4+3aJpdxp0k8eoXF1BJLCfLPDKolQorL85yzbc4+brVebxR4jv7E3WjWdlaPZ6ZFf3lpfI7vI8ilvs6sGXyyAp+dlblh8vBzLc+DdYP9nva63YvLbyS3FwL7TGminuHcMJQizJt2YIQEttBHJIzVnUPDGsXkzywa7BavfWqW2p7LEsJQufnhzL+5bDsPm8wfd4OOTW3n/wAD8r9PTzGrX12/S/52/rY1dR1uOy8LTa1FH56rbefHHv2+YSMque2SQM+9c3e+LNY8MxXsPiV9MuLkQQyWcttHJBG7ySeV5bIWkb5WKncDlg2AuRztXngvQLuO7ZdLtLe8urY2z38MCLcBNoUfvMbjgAdT2FUJPB+o6hbXEmua1DdamfJ+y3NvY+VHAYX8xGMZdixL8t8wBAAAXrQ7c2m39beYlfl13/4b/gmj4U1iXV9Mla7vIbq5hlMcvl6fNYtHwCA0EzF0OCDyeQQRwazNR8Ra3De3t9ZDT/7G028jtbiGVGM0wOzzJFkDhUCeZ90oxbYeRkYuQeD7W+t7j/hMYtP1+4uZlmcS6eogQqu1Qkbl8YGeSxJLHkDAEU/hK6fUpktdUjg0W6njuLmw+ybpC6BflSXfhEbYmV2E/ewRnh/a/ry/4Iumn9f1oDz+KYfFtnZHUtHubOZpJpoU0yWOWG3XgHzPtDAsWKL9wA/McfLirXjDU59L0WOaG5NjC86R3WoCMP8AYojndLggrwcDcwKrncwKqav2mli31q/1J5fNluxHGo2Y8uNAcJnv8zO3/Aqj1fSrzUmiNnr+o6SEBDLZR27CTPc+bE/T2x1qeiRXVmD4T1kXuuXFrp3ij/hKtOW3Ej3mIG+zy7sCPzIEWNty5O3G5duScMuMO11nX/8AhI2nsNZvtR024l8nSxqJt7a2vZAGMqmSO0LhQMeWeN5RuSME9RofhG60IwJD4r1m5tYWZvslxHZ7HySSCVgV+pJ4YUx08X2Gt6rJp9npeo2N1Oktv9s1aaBoFESIUCC3kAG5Wbhv4umaf9fiLuaPhi8u9S8HaVeXrqby4sopJXxkbygJOBjjP0/CsqzvfFdv4gntr2503Vra1tDNPHYac9tMZCf3catJcMhJAYnOMfLz82Rv6PatZaLZ2r20VoYYVj8iGdpkjwMbQ7KpYD1IBqC00mawt9Sa1uYze31xJcefLBuVWICoGUMCwVVRfvDO3qKb+Jv+v6/yDoZOoeINQtvGFnp9ve6TKszoH0kAm9WJgd05YSYVVPbYQQvD5IAqWfizVH1K0ubptP8A7Mv9Sn02G0SNluYnjMgDM5fa5JiOUCLt3D5jtOdLUvD2p6tqdv8AbtVtW0uC6iu1t1sSJxJGQwAm8zAXcP7m7BK7uc1DH4KjPjNtfuP7N8xHMkLW2miG4dipUefNuJlCg8DC9ickA0l5/wBbf8H+tAf9fj/wBPEusa9pukf2zaCxs7eGFXk0++hMlxcSE8QK8cuxHPyqpAkyzdOOZNb1TW9K1WzmWbTXsLm7htY7AwP9ql34DOsm/aCgLOV8s/LGTuGflivfDviO41y31SHW9J82C2WNUutIklSKT5t8kYFyuwsGxzuOBjOCaevh7XovFdxq8WsaW8czKoS40uSSWGEBd0UcguAFBKlvudTzuwKa3X9f1+nqDOoooopAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXMazrOqr4qg0fTrvTNO8yASwtqMDym/bLbootsibSiqCT85w4O3A56eue8U+H9R8Q2sljDqNlDp1zGEuIbrTvtDAg5Dxt5ihWHBBZXAIU44wTqhiXnjG3s9Ultv7N1Ce2t5kt7rUIUQwW8jhSFYFw5++mSqMo3ckYOOaTxn4ht9akd9D1a4gudY+wx2zGyCRRpG5PlkTBi5K7iXJGOAB0reufCN7LeXEUWsKuj3s8dxd2str5kzsoUEJLvAVW8tcgox5bBGRtmvfDFxLAGsdQjgu49TOoQyTWxkRSQVKMgdSRtZhncOcHtiiO6v/Wsf+D8hPZ/10f62M/w94ynnuGstUs73M2p3tpb6g0UYgZo5pdkWA2/Ijj+8V2kjG7dWYfGOqXUUVzbXYEU9notwgFsqf8AHzdskvykuRuQAY3Njsc810kHhPyILOP7bu+zatcalnysbvNaZtnXjHnde+3oM8Ztt8Pfs9hbW39p7vItNMtt32fG77HOZd2N3G/OMfw9eelONr691/wSnbW39e9/kb+ja6mtvcm3sbuG3hkaOO5mCbLgqxRim1iwwykfOFPoCKNO1Se81bWrSRY1SwnSOIqpyQ0KOd3PPLHpjiqui+HJ9M8Qajqdxd2shvABstbP7OXwTh5jvYSSYwN4C8Dp0w1ND1m18TXt/YarYJY300cs9tNp7yS/LGqELKJlAyF7ocZ71LvbzsT1ZW03xot5Y6T5Nhe6ncXlnDd3DWluka20cn3XdXlOM4b5EaRvlPB7rcePrC2S+nlsNQFlaRXEiXgRPLujAD5qRjfuyNrY3KoO04JHNM0rwhf6FHpqaTrEMYhsYLK9MtlvNwsIIVk+ceW3zN13jkccc5q/CyzjGsxwjSIl1CC6ihuo9HRbyIzhtxecN+8A3kABVOMAk8k07X08/wDgDVr6+X/B/r/hzW/4Tq3SO5Fxo+qW91EYfJs5UiElyJnKRlCJNoywIw7KRj5gOKmvPGVvZXMUMumaixEUc16ypHiwWRiqmXL88hv9XvwFJ6YJTV/C8uoXF5PDc2mbqyis2gvrH7TAyo7sd6b13Ah8YyMEA5PSsU/C+1bULG6uTpWoNDBFBcNqWkJcyERkkGF2bMX3iMN5nCr3BJFv/X9f10J1t8vx0/4P/BN/xdrVzomm28ttNaWazXAim1C+Qvb2abWPmSKGXIJUJyygFwSeMGO88R3GhWtrb6jay6vqUkUk0iaTCqL5SEbpdsknyj5l+XczEnjdg1q6rBqU9qBo19BZ3Ktndc2pnjYdwUDofphhz6jiuMuPhZbT2WnIx0a5mtBMrJfaIk9sqyvvIhh3jytpGF+ZgATkMeROv9f13K0/r+v6+82Y/HmnzahLBDZX0lrDcw2sl+EjECySrGYxy+8581OQvGeccU6fxhaQaw0csjQWUEF3JNI8G4P9nMQdlYPkAGQrjYSSp6YG53/CHwDRta05JxHFqbh4vLiC/ZiIY402gHHymMMMY9O1Qy+B7e5t7SC5u3eOHTrqymIjAaZp2jZ5c9Ad0ZOMEZb25rRf15fo/wA/IS8yZvGBjsYpZvD+rxXdxMIbWwdYRNc/IX3KfN2KAqsTvZSNuCASAdnTNRh1bTIL63V0jmXOyRcMh6FWHYggg+4rl9Y8E33iLS7aPxBfaRqV7Z3Hmwm50USWpGwqQ8DSksTuJyHXBC4GAQel0fTYdH0e2sLeO3ijgTbstoFhjB6nai8KMk8fqetHcWuhdooopDCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACsvxFqVxpmlhrBInvLiaO2txNnYHkYKGYAgkLksQCCQMZGc1qVna7pT6vpZt4Lk2lwkiTW8+zeI5EYMpK5G4ZHIyMjIyOtH9f5gVfD2oalPPqOn64bSS8sZVHnWkbRpNG6Blby2ZihzuXG5vu5zzgbdZWh6Vdaet1Pql7HfX95KJJpYYPJjAChVVELMQAB3ZiSSc84GrTA4LW9T8Rw+ILhLCXVPta3Ea2OnR6fusLmE7dzTXPlMYzzJn94pXauEbgPPJ4rvLHwTfXmt6lo+k6p9quLe3+13irbh1dgqK7qm7CjjKjpzSa/o/jaTxct9oOoQnTA8Lmzn1Ewo237wKi2duePuyKD3U99CTR/ELeDb/Spb6K4v23C3vEuJbcygncdzLuaLBLKCpbgA8dBOvK/67f1+Q+tv666HJeFPiDa3HiGGGfxcstrIpR49Z1LSWdnOAghFm2SxPXfxjGOa9UrhvD/AIa16x8RWt3cw/ZLWNXEy/8ACVX+peblcAeXOiqMHB3ZzxXc1T2JW7CiiikMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKrX/APx7J/13i/8ARi1Zqtf/APHsn/XeL/0YtAFmsDx1/wAiHq//AF7NW/WB46/5EPV/+vZqANKP/VD8P/QVooj/ANUPw/8AQVoplF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/x+az/2C4/5z1yfwg/4+ta/642X/oD11mr/APH5rP8A2C4/5z1yfwg/4+ta/wCuNl/6A9Nj6HS3+rald6dealp0k0Gn2ofZ9kthPcXW3g7FbjGRgdzUdlr17ZRWdzqM8lxZXaozfabcQ3FtvAxvVeOM4IxxWHq8s6/DO+0CJHN/b272zRICXY54YAdcjnNRQ6dMfB+k6dIW+3XFnFbrC331JjCsSO23knPpWvIvZc/W5nd89vI7DxL4pPhr7M0mi6hfxXEqQrLayWyqJHcIiHzZUOSSOgI96XQ/GGl+INSuLCwlVru0hSS6iWaKU2zMzL5TmN2AcFDkZx05NZXxBttNis4tS1mCO9iQiCKG/vPs1lbM2czySBSY2x8qvgkEgLtLE1S8Gav9umvr+Py9ZurWwitxNpWqx30dwFZ2CeaY4VE2WOQcDBUk81jH+v6/r8NdJf195pN8T/B62bSHXtPFyrFDYfbIftO8Nt2eXvzuz2rra8mbTfFDTGxFh40GgtG26z8zRd24vu2bt27ZjI+9u969TtJ5LmzimmtZbSR1BaCYoXjPoSjMufoSPehfCmJ/FYmooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAK2oahb6XYyXd4ziKPGfLiaRiSQAFRQWYkkAAAkk1mDxjop0c6l9on8oTfZzCbOb7R5v/PPyNnm7sfNt252/N05qfxJq82iaHLe2tlPeyqyIsUEEkpG5gu4rGrMVUHccAnArkreSG3Flr0cOr6h5eovNqUj6PcQyl3g8pXjt2jDlFGxBtDEL1LEMaF1A6SXxrocel22oJPdXEFzv8sWthPPINhw+6NELptPDbgNp4ODxTtR8Z6BpS273d/mO4hE6ywQyTRpEekruilY4zn77kLweeDjmH1m902xWFLPVbCHWLm5uzcw6TPcyWkRcbR5ccbbJHBLjzB8pzuUkbaJfI0aG8tLHRtTubPU9IgtNNRLCVvuK6CKXK5h++pzLtHLZPBo6Xt8vlt+g1a9v633+47+aeG3t3uJ5UihjQu8jsAqqBkknsMd6x7HxjoeoWd5dRXjwx2MYluBd20ts0cZBIfZIqsVODhgMHBweDWbrGi+IpvDd9Yre2V3bGw8qO0FmyzyOEAIMxlKkMQRjyx97rxmsTXhc+KVudU0qy1e0trdLRZg9k9vcTLHcCWRY0dQ5KIDggcliFJIofxWX/DebJWsbv+ttDvNL1a21iz+02a3KoGKlbq1lt3B90kVWHXrjmqd34s0ax1pNLurp0uXdIyRbyNEjv9xHlC7EZuMKzAnK4HIzi6DBrMun3v8Awjl7c2dn9qU2jeIrS4uZSmwbwFkljmA39DIc8NgbStVL1bpZtW0GXT72W91LUIriG6hs3NuUxFmQy4KIU8tvlZt3yrjdkU/tW/rp/XyDpc6AeM9I/tiHTHXU4rmec28Rm0i7jjkcAkgSNGEPCsc5xgE5xWhq+rQ6PZrNLFNcSSSCKC2gUGSeQ9EXJAzwTkkAAEkgAmqkEM954uubq4idLawhWC13oQHdxukcHuMeWoPYhxnk1V8XrNcWkFvBour3zh/OiutKmto5LSRfusDNKgJ5PGGUjIYEHBnoiurLek+ITqN9JY3mk3+kXix+csF6Ij5kecFlaJ3Q4OARuyMjIwQTkN8RLO11i5sdY0u70iO0CG4vL+7so4YVfcI2Yi4LfMUIA259QKo+DRr8N+k/ibRvEVzqMymFr+9m0/ybeLcWAVIJRjOFyQhYnHOAMVrbU/B2ieJr6DVPEFvpOq6be5kuL7VI0m1FZII3JkVsZT5woUDC+UNu3GKf9fiLozutL1S31fRLTVbTf9nu4FuI8jLbWXcOBnJwe2aztO8ZaTqmrR6bbrqUV3LG8saXmk3VsGVcbiGljUcbl79x61N4Tjjh8H6TFBdW95HHaRoLi1k8yKTCgblYdRx1qnDAly2u6jrtk8ts5a1S2e1aUtbRggjywCX3uXPA+YFBg4FN/E1/X9f8EOhen8TaXb65HpM00y3UjCNW+yymHeV3BDNt8sORyFLbuRxyKZb+K9HutbbSoLmQ3Id4wxt5FikdPvokpXy3dcHKqxI2tkfKcYGtzz3XijT7axTVpWguoD/Z8+mkWIQEFpxOIwA6qSQpkPzKBszgihBpmot4qtNLtZ7iTSdO1Ka+dJdJkhMQYSHb9oYlJwWkwBGuQD8zcEMl5/1tqD/r8f6/zOv1bxRpWiXSQalLPGzKHZ0tJZI4VJwGlkRSsS5B5cqOCexouPFOk2usppc806Ts6x+Z9klMAdhlUM23y1Y5GFLAncoxyM8xrmq2ckUPh5NO1Sw0CWyQyGz0G6kMsTbh9nVUiIh4A3bhuAbACn5hPqOsR6p4mXStRtdWt9Ps7qFoli0e6kW8kGx0ZpljKJGr44yDuTkhQQzWrQPQ7eiiikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFZOq+J9L0a8S1vZLhp3TzCltaTXBjTOA8nlq3lqSDhmwDtbng41q43xbcyaVqv2/R01RNXe3CRpBpsl3bXwUttilKDEZBY4YvHgtkllBFHVDOyrHh8S2kupzWckFxAqXQs4riRV8u4m2F2VMEsNoU5LKoz0JrjNV0yO58QXzXehXcviOa9gk0zUVtHkW3hCx8C5A2xIpEu5CwLfNw28Zh1DwVoVrsvp/CVrJFF4haacQ6QJneEoyhtioWZdzKeAcde1C1av1/wA4/wCbE9n/AF0b/Q9D0vVYNWs5bm2SRUiuJrdg6jJaKRo2IAJ4yhx7Y+lZ1x4x0+3maNoLzISzf5oDGcXMxhjyr4YEMpLAgED1PFctpfhlbO9sNWh0l4dSfxDfefdCAiU2zvclQzYz5RyhAPy5KkcnNZun6NqiaLp6Ppt2rppnh5GUwMCrRXjNIpGOqLyw7Dk4pxV3r3X4lNWv/X2rHrVVoNQtri5u4IZN8tm4SdQp+RiocDpz8rA8Z61yngy2Wy8Ra1FBp8ipJIZZb6bT5LaV5C7Hy5Hbi4xk7ZE4C4HoTNZanHpnjTXLS7tNSDX11C1vLHplxJCw8iNcmVUKLggg5YYxzUt6X8ierv0OptbhLu1iuIlkVJVDKJYmjcA+qsAyn2IBqWvL9C0mCCDw4vivQ728Mej2UWnqbGSUWdwufMzgHyJMmP5228Ljdwax5vDurSx+J3liZtTaz1JZhFoU6TXayBxEhuzIUmGDHsRFJUALhcGqas7Lz/AaWtvT8T2iivNNX8LWWnyapbWemyWmmXFnaTTLb6a91DPOsshJlgT5psjYHA+YgjJwMjLvdH1PU9a0ySexTTVaytl01ToM939idXYt5TrIotT9wnzAPl2rk7SALVk30v5X/L/M9R1bWLLRLRbjUJHVXcRxpFC80krHnakaAs5wCcKDwCegJqXT7+DU7GO7tPM8qTOBLC8Tgg4IZHAZSCDwQDWV4tjtjp0E90dTie3nEkN3pds1xNbPtK7hGqOWBDFSNjD5uQOo4PxJBrXiK30i41u0U2hiuYwJvDtxdqZS6iKb7MkokgcxglWfOzLAlS2KkrT+v62PWqha5RLyO2Ky+ZIjOpELFABjOXA2g8jAJBPOM4Nedx+E54rfX9We0e5160vILi0u5IcSTiKC3LIh5IWQo6kAkEk8nFOutH1maaK8sba4g1G/0nU5nkVdjRTSvbmKMtwFcIoUZI/1ftVf1+F0JanpFFeVa1penT+HbEeGNBksNHW+D6ja3fh24mSZvKYK0loCkk2G2ZYBgWCschSR33hSzm0/wpp9rcStK8cWAzQNBhckqvlszFMLgYJJGOaLbi7GvRRRSGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFVtQ1C10rT5r2/lEVvCuXbBY+gAAyWJOAAASSQACTVmsLxdHMdHiuIbeW6FneQXUsEKb3dEkDNtUDLEAbgBySMDmkBd0fXLDXrWSfTZZGEUhiljmgeGSJwAdrxuAynBBwQMgg9CK0K5/w07X2oatqyW11bW15NGIUurdoJJAiBTIY3Adcnj5gCQgOMEE9BVAc3qHjW0026uPPsL1tOs5BFeaqvlC3tnOMh8uJMDcuWVCozyRhsWIfGGj3Hhm61+3uRNptu0imeEiRZNjFSUKkggkcH+VcX4p8R+FNJ+Ii2et2bRzNNbSPLJrSwWzE9JZLUyjzGXauG8t/ur8w2jF6+1FJPh7qmoadf3mky29xNPd28jQxspdidkvnwP5aFXV/uZ2kckdZv7jf9dP6/zH1t/Vtf6/yOksPFD3Oqw6fqWh6lo89yrNb/AGxrdxNtGWAMMsmCAc/Nj2zW9XiHgO2tbXxdbWei6/okbXYbzf8AhHr7TZ5GVBuxIsenRnYcYzu4J4r2+qa0JT1YUUUUhhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABVa/wD+PZP+u8X/AKMWrNVr/wD49k/67xf+jFoAs1geOv8AkQ9X/wCvZq36wPHX/Ih6v/17NQBpR/6ofh/6CtFEf+qH4f8AoK0Uyi7RRRSJCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDndX/4/NZ/7Bcf8565P4Qf8fWtf9cbL/wBAeus1f/j81n/sFx/znrk/hB/x9a1/1xsv/QHpsfQ6vXn0a5vhBPp9xqN7EvIsgRJGD0y4ZcfQmk0GTRra+aC30+40++kHS9BMkgHXDlmz9Aawb+6hg+D9/c3ECXU11bSS3EcjMPMdidwJUg+3B7VSS6kbwLpdxBALcQWUEsCoWPlssYKqCST1wvJJrT2f7vn87Ec3vcp6fRXn/wATdAtdZW3nv7PQba1sNlxLq+tRxMnyuCtt83Kq7YDMeADgBieD4erbXWs3epaTqUN7pzWEFukMFxaSR2Dq8jG3X7MANqhlxnJwetZR1/r+v6+V6en9f16/07egUV49Ja+JfKk8NhPFf2h1eRbcHSfsZi83Gd3+t2cjvvr2GhaxTB6NoKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoqhrgtDotx/aN5LZWuB5s0M5hcDI4Dr8wJ6fKQ3PBBxXG21rfSR2Ok3F1qtppepalI1us95Kt59mSDeEaUv5q7pFZ+W3hMKdvKg3/r+v6TDY9Borz8xQNoRsdU1HXLua0vbm1sIbK/liuLvDfJl42Vn2A7Sztt6s57hl1Z6rqFrex6xrd5bajoujwSLJZXLQp9pKOzzMqELINyABXBXAbjk0rq3N0/4F/wCvVDSvLl67fjY9DorktX8XeX4cvRbx31tqUdh53myafMIYmKA5ErJ5TFd2cBj0I7GsTWmvvCMl3p2jXuqXi30Vokf2i8aeSCWSfyWdZJSxXcrA45VSmQvUGmmpcpKaceY9IorjtE1hPD2m3VprFlqUc9rcKjJbzXes53puVlk2GXb1B3KACCBwRmjqBubt9V1+LUtQiudN1GGC2to7h0i8oeVujeHOxi/mNy6lhuXGNopbu39dP8x7K7/r+rHf0Vx40G2bx7D9hvdYQ2YN7eBtXu3hcvuWOLy2kKbch2IAGNqDoa0vGGnXOpaLHHbWov4knSS608uE+2wjO6LLfLzkHaxCtt2sQGJo6IOpvUVw3gW0tZdQl1XQPDf/AAjWkS25iNr+5j+0zB/9Z5ULMi7QCu7O5s4Iwqk41j4I3+J7jV7DS9N0i4nuBDINLgszdaTtUsshZ42UvIH+cAZAdMFsEkDoz1KisLwWn/FAaHG7M3/EvhUtnBPyDnjGD9KyNK0EReJtQm0PUdUjWwhNqov9Su7yF7hwrlmjklwwRSo+UjJdxnKjDt71gO0orgNSF3PJquuDU76O70vUYbe3gguWSExjyt0bQ7tjl/Mb5mBYblwRtFVLa/vbPxdZLcPrY1e61We3uknE/wBhe2IlaPyw37nhEjYeX+84bd/HSWtvP9bW/P5B38v0vf8AI9Kori/FVpPPHBDDqN9L4mNuBaR6dcS28EcgJ/fyRByvl56iUuCF2qCThpNYtWn8U2x0a+1KXV0uIXuFS8k+yWtuCPMEkW4RZdN20FTIWcMMBcq1q1/X9eYM7CiiikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFcd4qglj1pb7Vn1f8AsWO3G2TSrqWI2coZi0kscTBpVI8sDhwu0kqFLNR1A7GiuNvvEetrc6hf2DacdJ0y7jtpbeSJ3nuAQhd1kV9qY8zhSjZ29Ru45xLLxFa699stNU0mG5v/ABE0E8y6XIHmRIZNqyMLjLoAOFPAPPtQtWl3/wA1/mHRv+tm/wBD1WivO/Deo6xp0sayPZSaVfa9qNoIlicTo3n3D+Z5m/bjKEbdvQ53dqw47t9QsrW8lBElxp3huVgZHkwWv3J+Z2Zj16sSfUmnFXf3fiNq1/L/ADsewUVz3h3WdQ1DVNStdWMEEsEh8uzFrJFJHHuYK3mMxWYMADuQAA5U8in6PcTTeIPEsUs0jxw3USxIzkiMG3jJC+nJJ47mpbsriN6iuF8Ma5rms6fpEWl/Y7dItLtLy8e8WadpjKD+7RjJuXARvnYyHkcHBrOl+I2seVrF5b2Ja2t7e+e3jk0i7jWFoA2xpLlsRSK+w/Ku0jcBlsE1TVnb1/AaV3Y9LoriLnxD4osf7QtJo7G6u44Le6ils7KZxDFJIyvuhDl5igQn5CpfONoxzTvvH2pR6lb2+mxC+jitoJ53tdHu7hbwyMQVjePKwYCk/vN3LY42klf1/X9ehN9P6/r+tT0OisHxdaahd6bbrp63c0KXAa7trG5+zXFxFtb5Y5dy7SGKN99chSM84PM6j4xk0qz06w8LG9nV4Z5jNfaZfX8o8twvkuqDzVYsxG+Q8BejZpXX9feVY9EorhI/F2vOb/U5bezttKsLu3hmt5YH+0COSOF3dmLgL5fmtkFOQvbHKXvi65tdT/tF7cTWqWOpT28UckiGRYHgRcjcUO4lyGKkhSuMfNuqzvb+triWux3lFcTrfiDxH4e0+zh1CSynvtQudkdxY6RdXCWyCMu26CN2eQ5XaCGUfNkgbcHpPD2o3Gq+H7S9vbZ7a4lT95E8LxEMCQTscBlBxkBhnBFIDSooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKw/Fs0y6PDbwXElqb28gtXmiba6I8gDbW6qxGQCOQTkcijql/WoebNyiud8MQSadqOsaWLq7urW1nja3a7nad4w8YJj8xyXbBy3zEkb8dAK6KgAorzvXfCsl94kuZk/sVbiW6hePXJbjGoacPlxDEhjIOdp2guqnzDlG5DyXSzaN8ONTivJdQ1CKa5uvM1G3urOJ0jMjHzXdnijA7EDHpgc0r+7f+un+Y7a2/rqegUV4l4B1nTj4ugOk6Xpfn7GUweG49MtfMU4y0ypqErSKvUADg5PPSvbaqxN9QooopDCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACqupKHswpzgzRA4JB/wBYvcVaqtf/APHsn/XeL/0YtADBa2pmaITTGRVDMgupMgHIBI3dDg/kawvGUFufAury280kgWCRc/aHdcg7SMEkZBBHsRWlrOgR6rNHcwXU+n3samL7VbHDtEfvRn1HcH+FsMPfP8WWNtpvw21KzsYVgt4bRlSNegH9T3J6k80AbUf+qH4f+grRRH/qh+H/AKCtFMou0UUUiQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA53V/+PzWf+wXH/OeuZ8JaVY6dpMN5aeJ5LK4vraBrhEMBAKpwMOrEYyRXTav/AMfms/8AYLj/AJz1y3w70fTNQ8PzS3+nWl1Is6qHmgVyB5ERxkjpyfzpjLlx4d0i6sri0n8Vztb3DM0ke+2AJY5OMJxz6YqRNE0xLO1tV8WzCC12eTHutsLs+7n5OcYHXNS6ofBWjX0dpqOm2McrqHOzTfMWJSdoeRlQrEpOQGcqDg88GrU1h4St1uzLpenKLNkSf/QVOwsAV/h5zuHT1p3fLa+gWV/MhurS2vZLaS58ZTu1rN50Jzaja+0rnhOeGIwfWobnSdNvJ7mW88VNcG6txazrMlo6SRAsQhQx7SMs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P/BdJQB0FFc//wAJdF/0Btc/8F0lH/CXRf8AQG1z/wAF0lAHQUVz/wDwl0X/AEBtc/8ABdJR/wAJdF/0Btc/8F0lAHQUVz//AAl0X/QG1z/wXSUf8JdF/wBAbXP/AAXSUAdBRXP/APCXRf8AQG1z/wAF0lH/AAl0X/QG1z/wXSUAdBRXP/8ACXRf9AbXP/BdJR/wl0X/AEBtc/8ABdJQB0FFc/8A8JdF/wBAbXP/AAXSUf8ACXRf9AbXP/BdJQB0FFc//wAJdF/0Btc/8F0lH/CXRf8AQG1z/wAF0lAHQUVz/wDwl0X/AEBtc/8ABdJR/wAJdF/0Btc/8F0lAHQUVz//AAl0X/QG1z/wXSUf8JdF/wBAbXP/AAXSUAdBRXP/APCXRf8AQG1z/wAF0lH/AAl0X/QG1z/wXSUAdBRXP/8ACXRf9AbXP/BdJR/wl0X/AEBtc/8ABdJQB0FFc/8A8JdF/wBAbXP/AAXSUf8ACXRf9AbXP/BdJQB0FFc//wAJdF/0Btc/8F0lH/CXRf8AQG1z/wAF0lAHQUVz/wDwl0X/AEBtc/8ABdJR/wAJdF/0Btc/8F0lAHQUVz//AAl0X/QG1z/wXSUf8JdF/wBAbXP/AAXSUAdBRXP/APCXRf8AQG1z/wAF0lH/AAl0X/QG1z/wXSUAdBRXP/8ACXRf9AbXP/BdJR/wl0X/AEBtc/8ABdJQB0FFc/8A8JdF/wBAbXP/AAXSUf8ACXRf9AbXP/BdJQB0FFc//wAJdF/0Btc/8F0lH/CXRf8AQG1z/wAF0lAHQUVz/wDwl0X/AEBtc/8ABdJR/wAJdF/0Btc/8F0lAHQUVz//AAl0X/QG1z/wXSUf8JdF/wBAbXP/AAXSUAdBRXP/APCXRf8AQG1z/wAF0lH/AAl0X/QG1z/wXSUAdBRXP/8ACXRf9AbXP/BdJR/wl0X/AEBtc/8ABdJQB0FFc/8A8JdF/wBAbXP/AAXSUf8ACXRf9AbXP/BdJQB0FFc//wAJdF/0Btc/8F0lH/CXRf8AQG1z/wAF0lAHQUVz/wDwl0X/AEBtc/8ABdJR/wAJdF/0Btc/8F0lAHQUVz//AAl0X/QG1z/wXSUf8JdF/wBAbXP/AAXSUAdBRXP/APCXRf8AQG1z/wAF0lH/AAl0X/QG1z/wXSUAdBRXP/8ACXRf9AbXP/BdJR/wl0X/AEBtc/8A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uwcY64OKtNqFkgkL3cCiKVYZCZVGyRsbUPPDHcuB1O4etef6d4O1OLw9qFtdadGbiXwvDp0YLxnMwM+6PIwAPnj5wFPHpxNd6RryS3enw6PLcx3mq2F+b0XEQjjSM2/mKwLby48ljwpBBHOeKaS5rf1v/lqD/r7l+rt8js4tf0afVf7Mh1axk1DDH7IlyhlwpIY7M54IIPHBBp8uqQw63a6WyyGe6glnRgBtCxtGGBOc5/eLjjsa4fQ7K+v7iK1j0Y29ta+Iby+fU/Nj2OBNMMAbvM8w52nKhdufm6LXR6/DqFr4i0vWtP02bVEtoLi2mtreSNJQJTGwdfMZVIBiwQWB+bIzjFJdG/60/wA9PxH9pr+v6/zLcHijSZNouLyGzeS8ksoUupUjaeVHKkICfmyRwBz7VOdf0dby7tG1axFzZR+bdQm5TfAmAdzrnKjkcnHWuOXRNbs1sry102f+0ri5nll8uaBoYY5p/MaGcOckAbfmiy25T2+9kz+CNan0/WLCdNUnYRX5tvMlshaztcFuFKqJskOM+YQAR1YAUK9v6/r+vmLr5X/D+v66Hp9nfWmo2oudPuobqBiVEsEgdSQSCMjjggg+4qxTIY1ihSNFCqihQoHAAHSn0xLbUKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/wDXpL/6Aat1U1j/AJFrVf8Ar0l/9ANW6AGx/wCqH4f+grRRH/qh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFW7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFTGjqbX/kPX//AF6Qf+hTVbqpa/8AIev/APr0g/8AQpqt0DOf0r/kePEH/XG0/wDQZK6Cuf0r/kePEH/XG0/9BkroKACiiigAooooAKztK8P6NoXm/wBiaTY6d5xBl+x2yReYR03bQM9T19a0aKACiiigAooooAKKKKAI4YIrdCkESRKWZyqKACzEljx3JJJPcmpKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/8AoBq3VTWP+Ra1X/r0l/8AQDVugBsf+qH4f+grRRH/AKofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFW7q/8Ax+az/wBguP8AnPWF8L/+RZn/AOvhf/REVMaOptf+Q9f/APXpB/6FNVuqlr/yHr//AK9IP/Qpqt0DOf0r/kePEH/XG0/9BkroK4251WTSPEviCe3tvtdzILCCCDfsDyOXVctg7Vyck4OADwelaKX+saJCJvE1zY3sU00MER0+zeBo3kkCAMHlfcMsDkEEYPBoWobHQ0VzmoeM7Sxvnso7C+vLoXwsEht1jzJL9nE/BZ1AGw9SRyPTmoY/HdvPCz2ujapOzXb2VtGiwhrqWNnEgTMgAC+WxLOVGMYJPFAbHU0VyVx8QrKFWaHStUukis0vbl4Yo8WsRZ1YvucElTE2VXceOA3OLeh+I7zVfEms6fLpc0NrYyosF2Wj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YBOAN2K16KNxWW39f1qcnpvg++s2062udZjm0zSSx0+GOz2TIdjRp5khdlfYjkDCLkgE5xzm3HwzF5ZEXkujTXAvDdRwvooaxBKFGzbmQks2SxYOuWAPqD31FG+4zC0HwxFoN5JNbtAiSWkFv5FtbLBGhjaRiVVTgAmQ8dsdTmjU9E1FtYOqeH9TgsLqWFYLhLq0NxDMqlip2q6MHBZhkNjBIIOARu0U3q7glZWOWv8Awvq9xLLJaa9HA19arbag0liJDIF3fPF84EbYdh8wkHC5Bwc17nwPdG6ki0/VorXSpby1vJLVrPfJvgMWFWTeAEIhXjaSDk5xxXY0ULR3X9dQOdg8K+TDZp9s3fZdWn1LPlY3ea0rbOvGPO699vQZ4ueHdIudD0RNNmu4rlLclLZ0gMZWL+FWy7bmHdhtz6CtaikD1d/6/rUitluEtY1vJI5bgKBJJFGY0Zu5ClmIHtk/Wsa68NNNpd5bw3xhuJb37dBP5WRDIGDLlc/MMrgjIyCenWt6ijrf+u/6B0sZWiaVc6eLqfU7yO9v7yQPNLFB5MYAUKqohZiAAO7MSSTnnA1aKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/9ekv/AKAat1U1j/kWtV/69Jf/AEA1boAbH/qh+H/oK0UR/wCqH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/wDH5rP/AGC4/wCc9YXwv/5Fmf8A6+F/9ERVu6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFTGjqbX/kPX/wD16Qf+hTVbqpa/8h6//wCvSD/0KardAzn9K/5HjxB/1xtP/QZK6Cuf0r/kePEH/XG0/wDQZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/AIAf5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/+gGrdVNY/5FrVf+vSX/0A1boAbH/qh+H/AKCtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8AH5rP/YLj/nPWF8L/APkWZ/8Ar4X/ANERVu6v/wAfms/9guP+c9YXwv8A+RZn/wCvhf8A0RFTGjqbX/kPX/8A16Qf+hTVbqpa/wDIev8A/r0g/wDQpqt0DOF1a8urPX9dFjcfZJbmTTbX7TsDGESOyFgCCN2G4yCMkZB6VJ4h0C30XQVa1u9SmEmo6eHW9v5rkZF5F8w81mKn2XA9uBV+CytdS8V+JrPULeO5tp7e1SWGVQyupWTgg1bt/CGj20LRbLy4VpIpM3moXFwymNw6bWkdioDKDgEA45Bpx0afnf8ALQP6/r+vzOc07x5f3mqXLTQCHTgblUabTLqFLbyiQryXLDynDbTwoBGQMtg0y08Y6/fCGytms/tkuqiy+1XWlXNquw2rzbvs8jBwQVx97DDuM8dMfB2iM96TaylL1XEsP2qXyhvOWZI922NieSyBTkk5yadY+EtG06SOS3t5WljuftQlnupZpGl8sxb2Z2JY7GK8k8Y9BSXmHf5/loZmg+J9Rv8AVrbT7+O18wRXouJIUZQ8kE6RhlBY7VYMTtOSOmTjJy7bxb4l1TTI7qwOkW/laFbarP8AaIZH8x5BKWjXEg2L+74Y7sejdumu/B+iXioJbaVSk0sweG6liYtKd0gLIwJVjyUJ2nA44FZp+HukSaoDNbEadBp9vY29vHdSp8kbSExyBWAkjIZflcsDg5Hqa8tuv/D/APA+4eiv/XX/ACL2tahJN4Vs762Mts1xcWTYDFWVXnjypx7Eg/jWNbeJPEU11DLI+mLZ3eqXemQxrbSGSMxtMElZvMww/dAFAB1yGHSuxu7K3vrcQXUe+NXSQLkjDIwZTx6FQfwqqmg6bGkKpbYEF3JexjzG+WZy5ZuvcyPx056cCh2f9eglflt1/wCA/wBbHnlh4v8AEem+F9CtpLhb6+urF7s3K6Nd3eUXaFiZYnZt7FjmQkAY+6c1tReLtdkN/qUtvaW2l2F3bwzW8kD/AGhY5I4Xd2YuApTzWyCvIXtjnaPgfQjDHGsN3GIpHeNotQuEZA5BZAyuCIyQD5YOzgfLxWj/AGJpwtr+3Fsvk6iSbpNxxJlBGe/HyqBxjpQu7/rX/LT8dxNHJ674z1Gx0aa/spbVT5tw9vAdPuLt5oYvlyREcorMCfNI2qGUbSTmtXwpL5+seJ5cbfM1CJsZzjNnbmrN/wCDNC1K2tre6tJBDbW5tUjhupYlaEgDy3CMPMXgcNkfma0rLTLTT5Lh7OLy2unWSY7idzBFjB5PHyoo49PWnHS9+1vxX+Q/6/r8SW2W5WNheSxSvvYqYoigC5+UYLNkgYBOeTzgdK5RpbzTIfF27Wrh5IIhLBc3aiQW7GIkYRFAwDjgLk453Eknq7a2S0jZImlYM7OTLM0hyxyeWJIHPA6AcAAVBNpNhcLercWySrfoEuUk+ZZVC7cEHjGOKmSurDWjuee21xe2YuNJM2s6Wb57KMQ6jetcTqryFJZY5S7bQw2qArblPzbUJGbvkXEevnwqNT1I6bJfhhI17IZwn2cyGAT7vN++u7O7ODtzjiukh8FaHFaXVu1vcXAu0WOWW6vZ55dqnKhZZHLqAfmG0jB5GDzTv+EP0U6T/Z3kT+V5/wBo877ZN9o83+/5+/zd2Plzuzt+XpxVf1+X9fhoibP+v6/rfc5jTre41fU18O32q6n9jsfthSWK9khmnCyqse6VGDtsVypyfmIBbJFVbVtQ8QaNdzXutahb3Ok6VHJbzW9wYd837wmd1QhZA3lr8rgr97jk12Fx4N0S5020sWtpoorTd5L293NDKN338yo4dt3Vsk7jycnmlvvB2hag1sbiyKrbRCBIoJpIY2iByI3RGCyIP7jgryeOTU62tfXv9+vqNfFfp2/T+vQ5aSe91CzvfEbX9/b3tje28UFrFcssQTERaNog2xy/mP8AMwLDcuCMCvRax7jwro9zrS6rNbObpWRyBcSCJ2T7jtEG8t2XjDMpIwMHgY2KroJJrcKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/AIAf5iloAKKKKAKmsf8AItar/wBekv8A6Aat1U1j/kWtV/69Jf8A0A1boAbH/qh+H/oK0UR/6ofh/wCgrRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/APH5rP8A2C4/5z1hfC//AJFmf/r4X/0RFW7q/wDx+az/ANguP+c9YXwv/wCRZn/6+F/9ERUxo6m1/wCQ9f8A/XpB/wChTVbqpa/8h6//AOvSD/0KardAzn9K/wCR48Qf9cbT/wBBkroK5/Sv+R48Qf8AXG0/9BkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/9ekv/AKAat1U1j/kWtV/69Jf/AEA1boAbH/qh+H/oK0UR/wCqH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/wDH5rP/AGC4/wCc9YXwv/5Fmf8A6+F/9ERVu6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFTGjqbX/kPX/wD16Qf+hTVbqpa/8h6//wCvSD/0KardAzn9K/5HjxB/1xtP/QZK6Cuf0r/kePEH/XG0/wDQZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/AIAf5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/+gGrdVNY/5FrVf+vSX/0A1boAbH/qh+H/AKCtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8AH5rP/YLj/nPWF8L/APkWZ/8Ar4X/ANERVu6v/wAfms/9guP+c9YXwv8A+RZn/wCvhf8A0RFTGjqbX/kPX/8A16Qf+hTVbqpa/wDIev8A/r0g/wDQpqt0DOf0r/kePEH/AFxtP/QZK6Cuf0r/AJHjxB/1xtP/AEGSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP+AH+YpaACiiigCprH/Itar/ANekv/oBq3VTWP8AkWtV/wCvSX/0A1boAbH/AKofh/6CtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVbur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVMaOptf+Q9f/8AXpB/6FNVuqlr/wAh6/8A+vSD/wBCmq3QM5/Sv+R48Qf9cbT/ANBkroK5/Sv+R48Qf9cbT/0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP8AgB/mKWgAooooAqax/wAi1qv/AF6S/wDoBq3VTWP+Ra1X/r0l/wDQDVugBsf+qH4f+grRRH/qh+H/AKCtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v8A8fms/wDYLj/nPWF8L/8AkWZ/+vhf/REVbur/APH5rP8A2C4/5z1hfC//AJFmf/r4X/0RFTGjqbX/AJD1/wD9ekH/AKFNVuqlr/yHr/8A69IP/Qpqt0DOf0r/AJHjxB/1xtP/AEGSugrn9K/5HjxB/wBcbT/0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/8AoBq3VTWP+Ra1X/r0l/8AQDVugBsf+qH4f+grRRH/AKofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFW7q/8Ax+az/wBguP8AnPWF8L/+RZn/AOvhf/REVMaOptf+Q9f/APXpB/6FNVuqlr/yHr//AK9IP/Qpqt0DOf0r/kePEH/XG0/9BkroK5/Sv+R48Qf9cbT/ANBkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP8AgB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv/XpL/6Aat1U1j/kWtV/69Jf/QDVugBsf+qH4f8AoK0UR/6ofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/wAfms/9guP+c9YXwv8A+RZn/wCvhf8A0RFW7q//AB+az/2C4/5z1hfC/wD5Fmf/AK+F/wDREVMaOptf+Q9f/wDXpB/6FNVuqlr/AMh6/wD+vSD/ANCmq3QM5/Sv+R48Qf8AXG0/9BkroK5/Sv8AkePEH/XG0/8AQZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv8A16S/+gGrdVNY/wCRa1X/AK9Jf/QDVugBsf8Aqh+H/oK0UR/6ofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/x+az/2C4/5z1hfC/8A5Fmf/r4X/wBERVu6v/x+az/2C4/5z1hfC/8A5Fmf/r4X/wBERUxo6m1/5D1//wBekH/oU1W6qWv/ACHr/wD69IP/AEKardAzn9K/5HjxB/1xtP8A0GSugrn9K/5HjxB/1xtP/QZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/wCAH+YpaACiiigCprH/ACLWq/8AXpL/AOgGrdVNY/5FrVf+vSX/ANANW6AGx/6ofh/6CtFEf+qH4f8AoK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q/wDx+az/ANguP+c9YXwv/wCRZn/6+F/9ERVu6v8A8fms/wDYLj/nPWF8L/8AkWZ/+vhf/REVMaOptf8AkPX/AP16Qf8AoU1W6qWv/Iev/wDr0g/9Cmq3QM5/Sv8AkePEH/XG0/8AQZK6Cuf0r/kePEH/AFxtP/QZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv/XpL/wCgGrdVNY/5FrVf+vSX/wBANW6AGx/6ofh/6CtFEf8Aqh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q/8Ax+az/wBguP8AnPWF8L/+RZn/AOvhf/REVbur/wDH5rP/AGC4/wCc9YXwv/5Fmf8A6+F/9ERUxo6m1/5D1/8A9ekH/oU1W6qWv/Iev/8Ar0g/9Cmq3QM5/Sv+R48Qf9cbT/0GSugrn9K/5HjxB/1xtP8A0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/wCAH+YpaQf6z/gB/mKWgAooooAqax/yLWq/9ekv/oBq3VTWP+Ra1X/r0l/9ANW6AGx/6ofh/wCgrRRH/qh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//AB+az/2C4/5z1hfC/wD5Fmf/AK+F/wDREVbur/8AH5rP/YLj/nPWF8L/APkWZ/8Ar4X/ANERUxo6m1/5D1//ANekH/oU1W6qWv8AyHr/AP69IP8A0KardAzn9K/5HjxB/wBcbT/0GSugrn9K/wCR48Qf9cbT/wBBkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/wDXpL/6Aat1U1j/AJFrVf8Ar0l/9ANW6AGx/wCqH4f+grRRH/qh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFW7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFTGjqbX/kPX//AF6Qf+hTVbqpa/8AIev/APr0g/8AQpqt0DOf0r/kePEH/XG0/wDQZK6Cuf0r/kePEH/XG0/9BkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/AIAf5iloAKKKKAKmsf8AItar/wBekv8A6Aat1U1j/kWtV/69Jf8A0A1boAbH/qh+H/oK0UR/6ofh/wCgrRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/APH5rP8A2C4/5z1hfC//AJFmf/r4X/0RFW7q/wDx+az/ANguP+c9YXwv/wCRZn/6+F/9ERUxo6m1/wCQ9f8A/XpB/wChTVbqpa/8h6//AOvSD/0KardAzn9K/wCR48Qf9cbT/wBBkroK5/Sv+R48Qf8AXG0/9BkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/9ekv/AKAat1U1j/kWtV/69Jf/AEA1boAbH/qh+H/oK0UR/wCqH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/wDH5rP/AGC4/wCc9YXwv/5Fmf8A6+F/9ERVu6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFTGjqbX/kPX/wD16Qf+hTVbqpa/8h6//wCvSD/0KardAzn9K/5HjxB/1xtP/QZK6Cuf0r/kePEH/XG0/wDQZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/AIAf5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/+gGrdVNY/5FrVf+vSX/0A1boAbH/qh+H/AKCtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8AH5rP/YLj/nPWF8L/APkWZ/8Ar4X/ANERVu6v/wAfms/9guP+c9YXwv8A+RZn/wCvhf8A0RFTGjqbX/kPX/8A16Qf+hTVbqpa/wDIev8A/r0g/wDQpqt0DOf0r/kePEH/AFxtP/QZK6Cuf0r/AJHjxB/1xtP/AEGSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP+AH+YpaACiiigCprH/Itar/ANekv/oBq3VTWP8AkWtV/wCvSX/0A1boAbH/AKofh/6CtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVbur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVMaOptf+Q9f/8AXpB/6FNVuqlr/wAh6/8A+vSD/wBCmq3QM5/Sv+R48Qf9cbT/ANBkroK5/Sv+R48Qf9cbT/0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP8AgB/mKWgAooooAqax/wAi1qv/AF6S/wDoBq3VTWP+Ra1X/r0l/wDQDVugBsf+qH4f+grRRH/qh+H/AKCtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v8A8fms/wDYLj/nPWF8L/8AkWZ/+vhf/REVbur/APH5rP8A2C4/5z1hfC//AJFmf/r4X/0RFTGjqbX/AJD1/wD9ekH/AKFNVuqlr/yHr/8A69IP/Qpqt0DOf0r/AJHjxB/1xtP/AEGSugrn9K/5HjxB/wBcbT/0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/4Af5ilpB/rP+AH+YpaACiiigCprH/Itar/16S/8AoBq3VTWP+Ra1X/r0l/8AQDVugBsf+qH4f+grRRH/AKofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/AMfms/8AYLj/AJz1hfC//kWZ/wDr4X/0RFW7q/8Ax+az/wBguP8AnPWF8L/+RZn/AOvhf/REVMaOptf+Q9f/APXpB/6FNVuqlr/yHr//AK9IP/Qpqt0DOf0r/kePEH/XG0/9BkroK5/Sv+R48Qf9cbT/ANBkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP8AgB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv/XpL/6Aat1U1j/kWtV/69Jf/QDVugBsf+qH4f8AoK0UR/6ofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/wAfms/9guP+c9YXwv8A+RZn/wCvhf8A0RFW7q//AB+az/2C4/5z1hfC/wD5Fmf/AK+F/wDREVMaOptf+Q9f/wDXpB/6FNVuqlr/AMh6/wD+vSD/ANCmq3QM5/Sv+R48Qf8AXG0/9BkroK5/Sv8AkePEH/XG0/8AQZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv8A16S/+gGrdVNY/wCRa1X/AK9Jf/QDVugBsf8Aqh+H/oK0UR/6ofh/6CtFAF2iiikSFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAHO6v/x+az/2C4/5z1hfC/8A5Fmf/r4X/wBERVu6v/x+az/2C4/5z1hfC/8A5Fmf/r4X/wBERUxo6m1/5D1//wBekH/oU1W6qWv/ACHr/wD69IP/AEKardAzn9K/5HjxB/1xtP8A0GSugrn9K/5HjxB/1xtP/QZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/wCAH+YpaACiiigCprH/ACLWq/8AXpL/AOgGrdVNY/5FrVf+vSX/ANANW6AGx/6ofh/6CtFEf+qH4f8AoK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q/wDx+az/ANguP+c9YXwv/wCRZn/6+F/9ERVu6v8A8fms/wDYLj/nPWF8L/8AkWZ/+vhf/REVMaOptf8AkPX/AP16Qf8AoU1W6qWv/Iev/wDr0g/9Cmq3QM5/Sv8AkePEH/XG0/8AQZK6Cuf0r/kePEH/AFxtP/QZK6CgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAQf6z/gB/mKWkH+s/4Af5iloAKKKKAKmsf8i1qv/XpL/wCgGrdVNY/5FrVf+vSX/wBANW6AGx/6ofh/6CtFEf8Aqh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q/8Ax+az/wBguP8AnPWF8L/+RZn/AOvhf/REVbur/wDH5rP/AGC4/wCc9YXwv/5Fmf8A6+F/9ERUxo6m1/5D1/8A9ekH/oU1W6qWv/Iev/8Ar0g/9Cmq3QM5/Sv+R48Qf9cbT/0GSugrn9K/5HjxB/1xtP8A0GSugoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEH+s/wCAH+YpaQf6z/gB/mKWgAooooAqax/yLWq/9ekv/oBq3VTWP+Ra1X/r0l/9ANW6AGx/6ofh/wCgrRRH/qh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//AB+az/2C4/5z1hfC/wD5Fmf/AK+F/wDREVbur/8AH5rP/YLj/nPWF8L/APkWZ/8Ar4X/ANERUxo6m1/5D1//ANekH/oU1W6qWv8AyHr/AP69IP8A0KardAzn9K/5HjxB/wBcbT/0GSugrn9K/wCR48Qf9cbT/wBBkroKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBB/rP+AH+YpaQf6z/gB/mKWgAooooAqax/yLWq/wDXpL/6Aat1U1j/AJFrVf8Ar0l/9ANW6AGx/wCqH4f+grRRH/qh+H/oK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFW7q//H5rP/YLj/nPWF8L/wDkWZ/+vhf/AERFTGjqbX/kPX//AF6Qf+hT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ooAKKKKACiiigAooooA53V/+PzWf+wXH/OesL4X/APIsz/8AXwv/AKIird1f/j81n/sFx/znrC+F/wDyLM//AF8L/wCiIqY0dTa/8h6//wCvSD/0KardVLX/AJD1/wD9ekH/AKFNVugYUVjal4v8NaNeG01fxDpVhcqAxhur2OJwD0O1mBq2Nc0k6N/a41OzOmbd/wBtFwnk7c4zvztxnjOaOlw62L1FY+m+L/DWs3gtNH8Q6Vf3JUsIbW9jlcgdTtVicVp3NzBZ2stzeTR28EKl5JZXCqijkkk8AD1o2Dcloqna6tp19ZwXdjqFrc21y22CaGZXSU88KwOCeD09DVPU/F3hvRbz7JrHiDStPudobybq9jifB6HazA4oA2KKgs7211Gziu9PuYbq2mXdHNBIHRx6hhwRU9ABRRRQAUUUUAFFFFABRRRQAUUVU1LVNP0ezN3q99bWFspCme6mWJAT0G5iBQBboqppuq6drNmLvR7+1v7YsVE1rMsqEjqNykjNUz4t8ODV/wCyjr+ljUfM8r7Gb2Pzt/8Ad2Z3Z9sUdbB0ua9FISFUljgDkk9q53/hYfgrOP8AhL9Bz/2E4f8A4qgDo6KztU8QaNokEU2s6vY6fFMcRSXdykSyHGflLEZ49KXSdf0fXkkfQ9WsdSWEgSNZ3KTBCegO0nHSgDQorA/4Tzwh9p+z/wDCVaJ5+/y/K/tGHduzjbjdnOeMVc1TxJoehzRRa1rOn6dJMMxJd3SRNIOnAYjP4UAadFQRXtrcTNFBcwyyLnciSAkYODkD0PH1qegAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKmsf8AItar/wBekv8A6Aat1U1j/kWtV/69Jf8A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catqem2GmeKLGaFb3Ufs8onihjM0KxPIFZY5pVOTGFblQwJG0Cuuu7C2vxCLuPzBBMs8fzEbXXoeP5dKZqWnRanaeTK8kTK6yRyxEB4nU5DLkEZ+oIIyCCCRRHRf15fjv+APe6/p6nH2ejmTxXL4aniifRNO/wCJlHCRkP5xcJEV6bUdZm/79+lbvhhJn06PN7M0VnNc2ixfKVkVJmRCxK7iyqgGQQDk5zwRrvaRNJNNGqw3MsYia4RF8zaM7eSDnBZiAcjJPHJqvY6NY6fHaiK3R5bWNo47iRQ0oDEF/mxn5iATjqaFpoD30/r+nqX6KKKAGTRLPBJE5YLIpUlTg4Ixwe1eTvbaHrenTWc3jCyvU0bTpoLWLTUltJbdTtj/ANJeOQseVUFAqBjklDgY9brmo/h94bS7897S4uOGHk3V/cTwAMdxHku5TGeQNuAQCMYFK2v9fId7arcwvHc+paf/AGQtrbKJ4B/ol3aTTvcK+wrIBClncKV2/wATDv2NP+Hd5qV1qGotfW2+Z9hvLu6mnS5YgYjHkvZW67cA/Mo7c5rp73wtpl/Z2dtP9tVbEYgkg1G4hlUYxzIjh249Sal0jw/YaG07WP2pnuCvmyXd7Ncu23OBuldiAMngHHNV1bZFrJJGnRRRSKCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCprH/ACLWq/8AXpL/AOgGrdVNY/5FrVf+vSX/ANANW6AGx/6ofh/6CtFEf+qH4f8AoK0UAXaKKKRIUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAc7q/wDx+az/ANguP+c9YXwv/wCRZn/6+F/9ERVu6v8A8fms/wDYLj/nPWF8L/8AkWZ/+vhf/REVMaOptf8AkPX/AP16Qf8AoU1W6qWv/Iev/wDr0g/9Cmq3QMjm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7724Jxy3P/1q0aKOtw6WIby0hv7Gezu08yC4jaKRMkblYYIyORwalUBVAHQDApajt7iG6t0ntZY5oZBuSSNgysPUEcGgCSiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCprH/Itar/ANekv/oBq3VTWP8AkWtV/wCvSX/0A1boAbH/AKofh/6CtFEf+qH4f+grRQBdooopEhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBzur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVbur/8fms/9guP+c9YXwv/AORZn/6+F/8AREVMaOptf+Q9f/8AXpB/6FNVuqlr/wAh6/8A+vSD/wBCmq3QM5GeTUT4oXxDHY3BsrYNpxt/KPnPGzgvcKvUgOqADqVDMM5UHI8vVx8Nr9XOlXVtJNc7fPkltPs8fmvgllWXzW3YwAqZ6c9/Rapf2PYHSZNMNuDZybt0RYnO5ix5znqSfbtSa92yD7V/6/qx5h4Vv/Fl54rsX1eQX7wwt5aaoZ7IhzgSPFnToQ525+QlvXI611E0+rv46j12HT5m0i2RtMeMwsJ33uC1wqnkxqyIvTJG5hwBu29N8K6Zpd6LuA3086qVRr3Uri78vPXaJXYKT0yMHHFbNV1T/r+rf1sTbRr+v6uef6bFdT6DYadqk1vcWGpatPF5UcBQiFWnkMchLMHDGMA8KCpIxzURdP8AhA7u2Vl83/hJXiEYPzbjqW4Lj12kN9DnpXZzaFZyaWtjD5lskcvnRSRN88Um/fuUtnnJPByMEgjHFOOgaOdaGsHSbE6mBtF99mTzsYxjzMbunHXpSX9fh/X4lPVW/rr/AJmdodu0d5qNlbXMkFrp+ofu4YlXaUeFHMZ3KcKGkJG0jHAzgYroazrTQ7K1jTzYxdzJcNci4uUVpBKw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xjGPQkGPT/Eeh6tCsulazp97G0vkq9tdJIDJjdsypPzYGcdcc1eSaKSWSJJEaSPG9AwJTPIyO2aYaGfZ+G9G0ya6n0fS7LTbq6UiW5s7WOORieck7fmOeec81LY6NY6fHaiK3R5bWNo47iRQ0oDEF/mxn5iATjqatwzxXEYkt5ElQkgMjBhkHB5HoQRUlIAooooAKKKKACiiigAooooAKKKQnAyeBQAtFUbPW9K1Gza70/U7O6tkfy2mguEdFbj5SwOM8jj3FTyXtrD5nm3MKeWVD7pANpY4UH0yTx61bpzTs1qF0T0VXhv7O4jkeC7glSMZdkkDBOvXHTofyrNtvGfhe9uo7az8SaRcTysEjiivomZ2PQABsk1UaNWV+WLdt9BXSNqimySJFG0krqiICzMxwFA6kmse28Z+F726jtrPxJpFxPKwSOKK+iZnY9AAGyTShSqTTcIt28gbS3Nqis3U/EWi6LIkes6xYae8g3It1dJEWHqAxGasafqdhq9r9q0q+tr633FfNtpVkTI6jKkjNDpVFDncXbvbQd1exaorO1PxDo2ivGms6vYae0oJjW7uUiLgdSNxGan0/U7DV7X7VpV9bX1vuK+bbSrImR1GVJGaHSqKHO4u3e2gXV7Fqisu08T6Bf6h9gsNc025vMkfZ4buN5Mjr8oOeMc0t74l0LTL5bLUta060umAKwT3SRuc9MKTnmq9hV5uXld99mK6NOio454pmkWGVJDE+yQKwOxsA4PocEHHuKkrJprcYUUUUgCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAqax/wAi1qv/AF6S/wDoBq3VTWP+Ra1X/r0l/wDQDVugBsf+qH4f+grRRH/qh+H/AKCtFAF2iiikSFFF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FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBU1j/kWtV/69Jf/AEA1bqprH/Itar/16S/+gGrdADY/9UPw/wDQVooj/wBUPw/9BWigC7RRRSJCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDndX/wCPzWf+wXH/ADnrC+F//Isz/wDXwv8A6IioopjR1Nr/AMh6/wD+vSD/ANCmq3RRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKmsf8i1qv/XpL/wCgGrdFFADY/wDVD8P/AEFaKKKAP//Z";
                //img.style.height = "100px";
                //img.style.width = "100px";
                //img.style.objectfit = "contain";

                

                

                //var imgData = ctx.getImageData(0, 0, rect.width, rect.height);
                //var data = ctx.getImageData(event.clientX, event.clientY, 1, 1).data;

                //var offset = (event.clientY * img.width + event.clientX) * 4;
                //var r = imgData.data[offset + 0];
                //var g = imgData.data[offset + 1];
                //var b = imgData.data[offset + 2];
                //var a = imgData.data[offset + 3];
            },

            ViewSize: function () {
                //alert(container);
                var rect = container.getBoundingClientRect();
                return rect;
            },

            Refresh: function () {
                var rect = container.getBoundingClientRect();
                renderer.setSize(rect.width, rect.height);

                camera.cameraP.aspect = container.clientWidth / container.clientHeight;
                camera.cameraP.updateProjectionMatrix();

                scope.RenderEvent = true;

                if (controls)
                    controls.handleResize();

                if (scope.Toolbar)
                    scope.Toolbar.Resize();
            },

            EdgeShow: function () {
                var processEdge = function (data) {
                    if (data.Tag.Visible === true && data.vertices !== undefined) {
                        var result = new THREE.BufferGeometry();
                        result.addAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3));
                        var edge = new THREE.LineSegments(result, scope.Data.Materials.edge);
                        objEdge.add(edge);
                    }
                };

                dispose(objEdge);
                objEdge = new THREE.Object3D();
                scene.add(objEdge);

                for (var i = 0; i < objModel.children[0].children.length; i++) {
                    var mesh = objModel.children[0].children[i];
                    for (var j = 0; j < mesh.userData.length; j++) {
                        var data = mesh.userData[j];
                        processEdge(data);
                    }                    
                }
            },

            SetConfiguration: function (resetTree) {
                if (resetTree) {
                    scope.Data.DeselectAll(objModel);
                    scope.Tree.Refresh();
                }
                //scope.Tree.SetOption(scope.Configuration.Tree);
                scope.Data.SetOption(scope.Configuration.Model);
                scope.Toolbar.SetOption(scope.Configuration.Toolbar);
                scope.Measure.SetOption(scope.Configuration.Measure);
                scope.Note.SetOption(scope.Configuration.Note);
            }
        };

        function setDrawRange(obj, start, end) {
            for (var i = 0; i < obj.children.length; i++) {
                if (obj.children[i] instanceof THREE.Mesh)
                {
                    //for (var j = 0; j < obj.children[i].userData.length; j++) {
                    //    var data = obj.children[i].userData[j];
                    //    var isMatch = function (element) {
                    //        return element.index === data.bodyId;
                    //    };
                    //    if (map !== undefined) {
                    //        if (map.get(data.bodyId) !== undefined) {
                    //            datas.push({
                    //                body: data,
                    //                mesh: obj.children[i]
                    //            });
                    //        }
                    //    }
                    //}
                    obj.children[i].geometry.setDrawRange(start, end);
                }
                else {
                    setDrawRange(obj.children[i], start, end);
                }
            }
        }

        function render() {

            renderer.render(scene, camera);
        }

        function initPostprocessing() {

            // Setup render pass
            var renderPass = new THREE.RenderPass(scene, camera);

            // Setup SSAO pass
            ssaoPass = new THREE.SSAOPass(scene, camera);
            ssaoPass.renderToScreen = true;

            // Add pass to effect composer
            effectComposer = new THREE.EffectComposer(renderer);
            effectComposer.addPass(renderPass);
            effectComposer.addPass(ssaoPass);

        }

        function InitUI() {
            if (scope.Browser.IsMS) {
                $('.submenu-render').css('marginTop', '1px');
                $('.submenu-camera').css('marginTop', '1px');
                $('.submenu-clipping').css('marginTop', '1px');
                $('.submenu-measure').css('marginTop', '1px');
                $('.submenu-note').css('marginTop', '1px');

                if (scope.Browser.Type === BROWSER_TYPES.Internet_Explorer)
                    $('nav').css('height', '100%');
            }
        }

        var currentTick;
        var calculation = 0;
        var previousTick = new Date().getTime();
        function calFrame() {
            setTimeout(function () {
                // 현재 틱을 가져오고

                currentTick = new Date().getTime();

                // 현재의 틱 값이 이전 틱 값 + 1000보다 클 경우
                // 즉, 마지막 갱신 시간으로부터 1초가 지난 경우
                if (currentTick >= previousTick + 1000) {
                    // 이전 시간을 현재 시간으로 설정하고 
                    // 계산량을 구한다.
                    previousTick = currentTick;
                    console.log(calculation);
                    calculation = 0;
                }
                // 계산 수를 1 증가시킨다.
                calculation++;
            }, 10);
        }

        function InitInfo() {
            var divInfo = document.createElement('div');
            divInfo.style.position = "absolute";
            divInfo.style.width = "100px";
            //divInfo.style.height = "50px";
            divInfo.style.right = 0;
            divInfo.style.bottom = 0;
            divInfo.style.marginRight = "20px";
            divInfo.style.marginLeft = "auto";
            divInfo.style.margine = "auto";

            divInfo.innerHTML = "<img alt = \"imgfile\" src = \"data:image;base64,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\" width=\"100%\" >";

            container.appendChild(divInfo);

            // Browser Message


            const canvas_review = document.getElementById("canvas_review");
            scope.ctx_review = canvas_review.getContext("2d");

            //ctx_review.fillStyle = "rgba(" + '255' + "," + '0' + ","
            //    + '0' + "," + '1' + ")";            
            //ctx_review.fillText("테스트 코드", 100, 100, 100, 100  );
        }




        function fitImageSize(obj, href, maxWidth, maxHeight) {
            var image = new Image();

            image.onload = function () {

                var width = image.width;
                var height = image.height;

                var scalex = maxWidth / width;
                var scaley = maxHeight / height;

                var scale = (scalex < scaley) ? scalex : scaley;
                if (scale > 1)
                    scale = 1;

                obj.width = scale * width;
                obj.height = scale * height;

                obj.style.display = "";
            };
            image.src = href;
        }


        var first = true;

        function createVector(x, y, z, camera, width, height) {
            var p = new THREE.Vector3(x, y, z);
            var vector = p.project(camera);

            vector.x = (vector.x + 1) / 2 * width;
            vector.y = -(vector.y - 1) / 2 * height;
            vector.z = 0;
            return vector;
        }

        function createLine(object) {
          

            for (var i = 0; i < object.children.length; i++) {
                var mesh = object.children[i];

                var geo = mesh.geometry.clone();
                //for (var j = 2; j < geo.attributes.position.array.length; j = j + 3) {
                //    geo.attributes.position.array[j] = 0;
                //}

                //var edge = new THREE.EdgesGeometry(mesh.geometry);
                for (var j = 0; j < geo.attributes.position.array.length; j = j + 3) {
                    var x = geo.attributes.position.array[j];
                    var y = geo.attributes.position.array[j + 1];
                    var z = geo.attributes.position.array[j + 2];
                    var vec = new THREE.Vector3(x, y, z);
                    var vec2D = createVector(x, y, z, camera, container.clientWidth, container.clientHeight);

                    var mouse = scope.Data.GetMousePos_1(vec2D.x, vec2D.y);
                    var vertex = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(camera);

                    geo.attributes.position.array[j] = vertex.x;
                    geo.attributes.position.array[j + 1] = vertex.y;
                    geo.attributes.position.array[j + 2] = vertex.z;
                }

                var edge = new THREE.EdgesGeometry(geo);

                var line = new THREE.LineSegments(edge, scope.Data.Materials.edge);
                scene.add(line);

                var vertices2D = [];
                //var vertices = [];
                //var map = new Map();

                //for (var j = 0; j < mesh.geometry.attributes.position.array.length; j = j + 3) {
                //    var x = mesh.geometry.attributes.position.array[j];
                //    var y = mesh.geometry.attributes.position.array[j + 1];
                //    var z = mesh.geometry.attributes.position.array[j + 2];
                //    var vec = new THREE.Vector3(x, y, z);
                //    var vec2D = createVector(x, y, z, camera, container.clientWidth, container.clientHeight);
                //    vertices2D.push(vec2D);
                //}

                //for (var i = 0; i < vertices2D.length; i++) {
                //    var mouse = scope.Data.GetMousePos_1(vertices2D[i].x, vertices2D[i].y);
                //    var vertex = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(camera);
                //    vertices.push(vertex.x, vertex.y, vertex.z);
                //}

                //var geometry = new THREE.BufferGeometry();
                //geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                //var material = new THREE.MeshPhongMaterial({
                //    color: new THREE.Color(1, 0, 0),
                //});

                //var line = new THREE.Line(geometry, material);
                //scene.add(line);
            }

            //vertices2D.sort(function (a, b) {
            //    if (a.x < b.x)
            //        return -1;
            //    if (a.x > b.x)
            //        return 1;
            //    return 0;
            //});

            //for (var i = 0; i < vertices2D.length; i++) {
            
        }

        //var offsetX = 0;
        function onLoadVIZW(object, data) {
            scope.RenderEvent = true;

            //alert("onLoadVIZW");
            scope.Refresh();
            //alert("Refresh()");
            data.Downloaded = true;

            if (scope.AnimationSample) {
                if (data.Url.localeCompare("VIZWeb3D/MODEL/BOX.vizw") === 0) {
                    for (var i = 0; i < 50; i++) {
                        for (var j = 0; j < object.children.length; j++) {
                            var mesh = object.children[j];
                            var geometry = mesh.geometry.clone();
                            var metrial = mesh.material.clone();
                            var newMesh = new THREE.Mesh(geometry, metrial);
                            newMesh.userData = mesh.userData;
                            newMesh.name = "box";
                            objAnimation.add(newMesh);
                        }
                    }
                }
                else if (data.Url.includes("MR1718"))
                {
                    var objTmp = new THREE.Object3D();
                    for (var j = object.children.length - 1; j >= 0; j--) {
                        objTmp.add(object.children[j]);
                    }
                    objTmp.name = data.Url;
                    objAnimation.add(objTmp);
                }
                else
                    objModel.add(object);
            }
            else {
                objModel.add(object);
            }

            if (scope.Configuration.Model.LOD.Enable) {
                objModel.updateMatrix(); // Needed
                if (first) {
                    cameraInitPos.copy(camera.position);
                    scope.Camera_FitAll(objModel);
                    scope.Control.Camera.Projection = PROJECTION_MODES.Orthographic;
                    scope.Camera_Rotate(_cameradirection);
                    //camera.setViewVolumn();
                    first = false;
                }
            }
            else {
                //// Original Model BoundBox
                //orgModelBBox = new THREE.Box3().setFromObject(object);
                orgModelBBox = new THREE.Box3().setFromObject(objModel);
                var sphere = new THREE.Sphere();
                //orgModelBBox.getBoundingSphere(sphereBBox);
                sphereBBox = orgModelBBox.getBoundingSphere(sphere);

                orgModelCenter = sphereBBox.center;
                var offset = 100;
                var offsetfar = 8000;
                //spotLight.position.set(orgModelBBox.max.x + offset, orgModelBBox.max.y + offset, orgModelBBox.max.z + offsetz);
                spotLight.position.set(-orgModelCenter.x + offset, -orgModelCenter.y + offset, 10000);
                spotLight.shadow.camera.far = (orgModelBBox.max.z - orgModelBBox.min.z) * 2 + offsetfar;//+ offsetfar * 2;

                var geometry = new THREE.SphereGeometry(20, 32, 32);
                var material = new THREE.MeshPhongMaterial({
                    color: 0x505050,
                    side: THREE.DoubleSide,
                    transparent: true,
                    vertexColors: THREE.NoColors,
                    //opacity: 0.2
                    //flatShading: true
                });
                //var sphere = new THREE.Mesh(geometry, material);
                //sphere.castShadow = true;
                //sphere.receiveShadow = true;
                //sphere.position.copy(orgModelCenter);
                //sphere.name = 'sphere';
                //objModel.add(sphere);

                if (bWebGLInit) {
                    scene.remove(objModel);
                }

                var vEye = new THREE.Vector3(0.0, 0.0, 10.0).multiplyScalar(sphereBBox.radius / 2); //* 모델 반지름
                var vLight = new THREE.Vector3(200.0, 500.0, 200.0).multiplyScalar(sphereBBox.radius / 2 * 300);// * 모델 반지름 * 300

                scope.Data.Shader.uniforms['vEye'].value = vEye;
                scope.Data.Shader.uniforms['vLight'].value = vLight;

                scene.add(objModel);
                objModel.updateMatrix(); // Needed
                cameraInitPos.copy(camera.position);
                scope.Camera_FitAll(objModel);

                controls.bPivot = true;
                controls.Pivot.copy(orgModelCenter);

                scope.Camera_Rotate(_cameradirection);
                //camera.setViewVolumn();

                lightCamera.position.copy(camera.position);
                lightCamera.target = objModel;

                scope.Add_Ground();

                // 클리핑 모델 업데이트
                clipping.UpdateModel(objModel, true);

                
            }
            
            // delete list
            for (var k = _Datas.length - 1; k >= 0; k--) {
                if (_Datas[k].ID === data.ID) {
                    _Datas.splice(k, 1);
                }
            }
            
            if (_Datas.length === 0) {
                $('.ProgressPage').fadeOut(500);
                // Original Model BoundBox
                orgModelBBox = new THREE.Box3().setFromObject(objModel);
                //orgModelBBox.getBoundingSphere(sphereBBox);
                sphereBBox = orgModelBBox.getBoundingSphere(sphere);

                orgModelCenter = sphereBBox.center;
                var offset = 100;
                var offsetfar = 8000;

                spotLight.position.set(-orgModelCenter.x + offset, -orgModelCenter.y + offset, 10000);
                spotLight.shadow.camera.far = (orgModelBBox.max.z - orgModelBBox.min.z) * 2 + offsetfar;//+ offsetfar * 2;

                var vEye = new THREE.Vector3(0.0, 0.0, 10.0).multiplyScalar(sphereBBox.radius / 2); //* 모델 반지름
                var vLight = new THREE.Vector3(200.0, 500.0, 200.0).multiplyScalar(sphereBBox.radius / 2 * 300);// * 모델 반지름 * 300

                scope.Data.Shader.uniforms['vEye'].value = vEye;
                scope.Data.Shader.uniforms['vLight'].value = vLight;

                //scene.add(objModel);
                objModel.updateMatrix(); // Needed
                cameraInitPos.copy(camera.position);
                scope.Camera_FitAll(objModel);

                controls.bPivot = true;
                controls.Pivot.copy(orgModelCenter);

                scope.Camera_Rotate(_cameradirection);
                //camera.setViewVolumn();

                lightCamera.position.copy(camera.position);
                lightCamera.target = objModel;

                scope.Add_Ground();

                

                // 클리핑 모델 업데이트
                clipping.UpdateModel(objModel, true);
                scope.Tree.Init();

                scope.Control.Model.RenderMode = scope.Configuration.Model.RenderMode;
                

                // Loading Complete
                scope.EventHandler.dispatchEvent(EVENT_TYPES.View.Loading_Complete);

                if (scope.AnimationSample)
                    scope.Animation.Start();
            }

            setTimeout(function () {
                console.log("onloadVIZW - Timer");
                _CurrentDownloadSeq++;

                if (scope.Configuration.Model.LOD.Enable)
                    download(2);
                else
                    download(1);
            }, 25);

            scope.RenderEvent = true;
        }

        function onProgress(type, percent, loaded, total) {

            //updateProgressBar(percent); // update progress bar
            var str = '';
            if (type === PROGRESS_TYPES.File_Downloading)
                str = 'File Downloading : ';
            else if (type === PROGRESS_TYPES.Data_Loading)
                str = 'Data Loading : ';
            else
                str = 'Edge Loading : ';
            //console.log(str + percent);
            var $pCaption = $('.progress-bar p');
            var $pCaptionText = $('.progress-bar pText');
            var $pCaptionFile = $('.progress-bar pTextFile');
            var iProgress = document.getElementById('inactiveProgress');
            var aProgress = document.getElementById('activeProgress');
            if (type === 0) {
                drawProgress(0, iProgress, percent, $pCaption, $pCaptionText, $pCaptionFile, loaded, total);
            }
            else if (type === 1)
                drawProgress(1, aProgress, percent, $pCaption, $pCaptionText, $pCaptionFile);
            else
                drawProgress(2, aProgress, percent, $pCaption, $pCaptionText, $pCaptionFile);

            var value = (percent * 100).toFixed(2);

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Progress.Percentage, { type: type, value: value });
        }

        function download(cnt) {
            if (_Datas.length !== 0) {
                $('.ProgressPage').fadeIn(500);
                onProgress(PROGRESS_TYPES.File_Downloading, 0);
                onProgress(PROGRESS_TYPES.Data_Loading, 0);
            }

            var bRender = true;
            for (var i = 0; i < _Datas.length; i++) {
                if (cnt !== 0)
                    if (!_Datas[i].Current && !_Datas[i].Downloaded) {
                        _Datas[i].Current = true;
                        //setTimeout(function () {
                        console.log("File Downloading Start : " + _Datas[i].Url);
                        //loaderVIZW.load(_Datas[i], onLoadVIZW, datamng, onProgress);
                        loaderVIZW.load(_Datas[i], onLoadVIZW, scope.Data, onProgress, GetBrowser());
                        //}, 25);
                        cnt--;
                        bRender = false;
                    }
            }
        }

        function dispose(o) {
            try {
                if (o && typeof o === 'object') {
                    if (Array.isArray(o)) {
                        o.forEach(dispose);
                    } else
                        if (o instanceof THREE.Object3D) {
                            dispose(o.geometry);
                            dispose(o.material);
                            if (o.parent) {
                                o.parent.remove(o);
                            }
                            dispose(o.children);
                        } else if (o instanceof THREE.Mesh) {
                            dispose(o.geometry);
                            dispose(o.material);
                            if (o.parent) {
                                o.parent.remove(o);
                            }
                            dispose(o.children);
                        }
                        else
                            if (o instanceof THREE.Geometry || o instanceof THREE.BufferGeometry) {
                                o.dispose();
                            } else
                                if (o instanceof THREE.Material) {
                                    o.dispose();
                                    dispose(o.materials);
                                    dispose(o.map);
                                    dispose(o.lightMap);
                                    dispose(o.bumpMap);
                                    dispose(o.normalMap);
                                    dispose(o.specularMap);
                                    dispose(o.envMap);
                                } else
                                    if (typeof o.dispose === 'function') {
                                        o.dispose();
                                    } else {
                                        Object.values(o).forEach(dispose);
                                    }
                }
            } catch (error) {
                console.log(error);
            }
        }

        function getMesh(obj, uuid) {
            var result = null;
            for (var i = 0; i < obj.children.length; i++) {
                if (obj.children[i] instanceof THREE.Mesh) {
                    if (obj.children[i].uuid.localeCompare(uuid) === 0) {
                        result = obj.children[i];
                        break;
                    }
                }
                else {
                    result = getMesh(obj.children[i], uuid);
                }
            }

            return result;
        }

        function setEdgeData(obj) {
            var cntEdgeProgress = 10;
            var cntload = 0;
            var meshes = [];

            var calEdgeMesh = function (obj) {
                for (var i = 0; i < obj.children.length; i++) {
                    if (obj.children[i] instanceof THREE.Mesh) {
                        if (scope.Data.EdgeMap.get(obj.children[i].uuid) === undefined) {
                            meshes.push(obj.children[i]);
                            scope.Data.EdgeMap.set(obj.children[i].uuid, 0);
                        }
                    }
                    else {
                        calEdgeMesh(obj.children[i]);
                    }
                }
            };
            // 숨겨진 노드 데이터 복원
            scope.Data.RestoreHideData(objModel);
            calEdgeMesh(obj);

            if (meshes.length !== 0) {
                $('.ProgressPage').fadeIn(0);
                onProgress(PROGRESS_TYPES.Edge_Loading, 0);
                setTimeout(function () {
                    onProgress(PROGRESS_TYPES.Edge_Loading, cntload / meshes.length);
                    edgeloading();
                }, 25);
            }

            var edgeloading = function () {
                for (var i = 0; i < cntEdgeProgress; i++) {
                    createEdge(meshes[cntload]);
                    cntload++;
                    if (cntload === meshes.length)
                        break;
                }
                onProgress(PROGRESS_TYPES.Edge_Loading, cntload / meshes.length);

                if (cntload === meshes.length) {
                    objEdge.visible = true;
                    scene.add(objEdge);
                    $('.ProgressPage').fadeOut(500);

                    // 숨김 복원
                    scope.Data.ResetHideData(objModel);
                    //scope.Data.CreateEdgeMesh(objEdge, objModel);
                    scope.Toolbar.onEdgeLoadingCompleted();
                    scope.Clipping.UpdateModel(objModel);
                    
                    scope.RenderEvent = true;
                }
                else {
                    setTimeout(function () {
                        edgeloading();
                    }, 25);
                }
            };

            var createEdge = function (mesh) {
                //var edges = new THREE.EdgesGeometry(mesh.geometry);
                //var edges = EdgesGeometry(mesh, 0.80, false);
                //objEdge.add(line);
                //var edge = EdgesGeometry(mesh, 0.80, false);
                //objEdge.add(edge);

                scope.Data.SetEdgeData(mesh, 0.80, false, objEdge);
                //scope.Data.SetEdgeData_v2(mesh, 0.80, false, objEdge);
            };

            
            var EdgesGeometry = function (mesh, thresholdAngle, facenormal) {
                thresholdAngle = (thresholdAngle !== undefined) ? thresholdAngle : 1;
                var geometry = mesh.geometry;
                // buffer
                var vertices = [];
                // helper variables
                var thresholdDot = Math.cos((Math.PI * 2 / 360) * thresholdAngle);
                var edge = [0, 0], edges = {}, edge1, edge2;
                var body = [0, 0], bodies = {}, body1, body2;
                var key, keys = ['a', 'b', 'c'];

                var getBody = function (index) {
                    var result = -1;
                    for (var i = 0; i < mesh.userData.length; i++) {
                        var data = mesh.userData[i];
                        if (index >= data.m_triIdx && index <= data.m_triIdx + data.m_nTris) {
                            result = data;
                            break;
                        }
                    }

                    return result;
                };

                // prepare source geometry
                var geometry2;
                if (geometry.isBufferGeometry) {
                    geometry2 = new THREE.Geometry();
                    geometry2.fromBufferGeometry(geometry);
                } else {
                    geometry2 = geometry.clone();
                }

                //geometry2.mergeVertices();
                if (facenormal) 
                    geometry2.computeFaceNormals();
                else
                    geometry2.computeVertexNormals();

                var sourceVertices = geometry2.vertices;
                var faces = geometry2.faces;

                // now create a data structure where each entry represents an edge with its adjoining faces
                for (var i = 0, l = faces.length; i < l; i++) {
                    var face = faces[i];
                    for (var j = 0; j < 3; j++) {
                        edge1 = face[keys[j]];
                        edge2 = face[keys[(j + 1) % 3]];
                        edge[0] = Math.min(edge1, edge2);
                        edge[1] = Math.max(edge1, edge2);
                        key = edge[0] + ',' + edge[1];
                        if (edges[key] === undefined) {
                            //edges[key] = { index1: edge[0], index2: edge[1], face1: i, face2: undefined };
                            edges[key] = { index1: edge[0], index2: edge[1], face1: i, face2: undefined};
                        } else {
                            edges[key].face2 = i;     
                        }
                    }
                }

                // generate vertices
                for (key in edges) {
                    var e = edges[key];

                    if (e.face2 === undefined) {
                        var body = getBody(e.face1);
                        if (body.vertices === undefined)
                            body.vertices = [];
                        
                        var vertex = sourceVertices[e.index1];
                        body.vertices.push(vertex.x, vertex.y, vertex.z);
                        vertices.push(vertex.x, vertex.y, vertex.z);

                        vertex = sourceVertices[e.index2];
                        body.vertices.push(vertex.x, vertex.y, vertex.z);
                        vertices.push(vertex.x, vertex.y, vertex.z);
                    }
                    else {
                        if (facenormal) {
                            // an edge is only rendered if the angle (in degrees) between the face normals of the adjoining faces exceeds this value. default = 1 degree.
                            if (e.face2 === undefined || faces[e.face1].normal.dot(faces[e.face2].normal) <= thresholdDot) {
                                var vertex = sourceVertices[e.index1];
                                vertices.push(vertex.x, vertex.y, vertex.z);
                                vertex = sourceVertices[e.index2];
                                vertices.push(vertex.x, vertex.y, vertex.z);
                            }
                        }
                        else {
                            var cnt = 0;

                            if (faces[e.face1].vertexNormals[0].dot(faces[e.face2].vertexNormals[0]) >= thresholdAngle) {
                                cnt++;
                            }
                            if (faces[e.face1].vertexNormals[1].dot(faces[e.face2].vertexNormals[1]) >= thresholdAngle) {
                                cnt++;
                            }
                            if (faces[e.face1].vertexNormals[2].dot(faces[e.face2].vertexNormals[2]) >= thresholdAngle) {
                                cnt++;
                            }
                            if (cnt < 2) {
                                //var vertex = sourceVertices[e.index1];
                                //vertices.push(vertex.x, vertex.y, vertex.z);
                                //vertex = sourceVertices[e.index2];
                                //vertices.push(vertex.x, vertex.y, vertex.z);
                                var body = getBody(e.face1);
                                if (body.vertices === undefined)
                                    body.vertices = []; 

                                var vertex = sourceVertices[e.index1];
                                body.vertices.push(vertex.x, vertex.y, vertex.z);
                                vertices.push(vertex.x, vertex.y, vertex.z);


                                body = getBody(e.face2);
                                if (body.vertices === undefined)
                                    body.vertices = []; 
                                vertex = sourceVertices[e.index2];
                                body.vertices.push(vertex.x, vertex.y, vertex.z);
                                vertices.push(vertex.x, vertex.y, vertex.z);
                            }
                        }
                    }
                }
                // build geometry
                var result = new THREE.BufferGeometry();
                result.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

                var line = new THREE.LineSegments(result, scope.Data.Materials.edge);
                //return result;
                line.userData = edges;
                return line;
            };

            
        }

        function drawProgress(type, bar, percentage, $pCaption, $pCaptionText, $pCaptionFile, loaded, total) {
            var barCTX = bar.getContext("2d");
            var quarterTurn = Math.PI / 2;
            var endingAngle = ((2 * percentage) * Math.PI) - quarterTurn;
            var startingAngle = 0 - quarterTurn;

            $pCaption.text((parseInt(percentage * 100, 10)) + '%');
            bar.width = bar.width;
            barCTX.lineCap = 'square';

            barCTX.beginPath();

            if (type === 0) {
                currentTrun = Math.PI / _TotalDownloadCnt * _CurrentDownloadSeq *2;
                quarterTurn = Math.PI / 2;
                startingAngle = 0 - quarterTurn;
                endingAngle = ((2 * percentage) * Math.PI / _TotalDownloadCnt) - quarterTurn + currentTrun;
                
                barCTX.lineWidth = 12;
                barCTX.strokeStyle = '#ffe1e1';
                if (percentage === 0)
                    barCTX.lineWidth = 0;
                else
                    barCTX.arc(100, 100, 94, startingAngle, endingAngle);
                //$pCaptionText.text('File Downloading...');
                $pCaptionText.text('Receiving model...');
                //if (loaded !== undefined)
                //    $pCaptionFile.text(loaded + '/' + total + 'byte');
                //else
                //    $pCaptionFile.text('');
            }
            else if (type === 1) {
                barCTX.lineWidth = 6;
                barCTX.strokeStyle = '#e1e1ff';
                if (percentage === 0)
                    barCTX.lineWidth = 0;
                else
                    barCTX.arc(100, 100, 88, startingAngle, endingAngle);
                //$pCaptionText.text('Data Loading...');
                $pCaptionText.text('Loading model...');
                //$pCaptionFile.text('');
            }
            else {
                barCTX.lineWidth = 6;
                barCTX.strokeStyle = '#e1ffe1';
                if (percentage === 0)
                    barCTX.lineWidth = 0;
                else
                barCTX.arc(100, 100, 90, startingAngle, endingAngle);
                //$pCaptionText.text('Edge Loading...');
                $pCaptionText.text('Creating edge...');
                //$pCaptionFile.text('');
            }
            barCTX.stroke();

            
            
        }

        function progress() {
            var $pCaption = $('.progress-bar p');
            var $pCaptionText = $('.progress-bar pText');
            var iProgress = document.getElementById('inactiveProgress');
            var aProgress = document.getElementById('activeProgress');
            var iProgressCTX = iProgress.getContext('2d');

            //drawInactive(iProgressCTX);

            function drawInactive(iProgressCTX) {
                iProgressCTX.lineCap = 'square';

                //file
                iProgressCTX.beginPath();
                iProgressCTX.lineWidth = 15;
                iProgressCTX.strokeStyle = '#ffe1e1';
                iProgressCTX.arc(137.5, 137.5, 100, 0, 2 * Math.PI);
                iProgressCTX.stroke();

                ////progress bar
                //iProgressCTX.beginPath();
                //iProgressCTX.lineWidth = 0;
                //iProgressCTX.fillStyle = '#e6e6e6';
                //iProgressCTX.arc(137.5, 137.5, 96, 0, 2 * Math.PI);
                //iProgressCTX.fill();

                ////progressbar caption
                //iProgressCTX.beginPath();
                //iProgressCTX.lineWidth = 0;
                //iProgressCTX.fillStyle = '#fff';
                //iProgressCTX.arc(137.5, 137.5, 90, 0, 2 * Math.PI);
                //iProgressCTX.fill();

            }
            

            //drawProgress(1, iProgress, 0.80, $pCaption, $pCaptionText);
            //drawProgress(0, aProgress, 0.90, $pCaption, $pCaptionText);
        }

        function setRenderMode(v, obj) {
            scope.Data.SetHiddenEdgeColor(true);
            scope.Data.Materials.basic.uniforms['mode'].value = 0;
            // HiddenLine_Elimination
            if (v === RENDER_MODES.HiddenLine_Elimination) {
                visible_edge = true;
                scope.SetOutlineHidden();
                setEdgeData(objModel);
                scope.Data.Materials.basic.uniforms["mode"].value = 4;
            }
            // HiddenLine
            else if (v === RENDER_MODES.HiddenLine) {
                visible_edge = true;
                if (testHiddenline === false)
                    scope.Data.SetHiddenEdgeColor(false);

                scope.SetOutlineHidden();
                setEdgeData(objModel);
                scope.Data.Materials.basic.uniforms["mode"].value = 3;
            }
            // Xray
            else if (v === RENDER_MODES.Xray) {
                visible_edge = true;
                scope.Data.SetHiddenEdgeColor(false);
                scope.Data.UpdateObjectStatus(obj, true, false, true, scope.Data.Materials.basic);
                setEdgeData(objModel);
                scope.Data.Materials.basic.uniforms["mode"].value = 5;
            }
            else if (v === RENDER_MODES.SmoothEdge) {
                visible_edge = true;
                setEdgeData(objModel);
                scope.Data.UpdateObjectStatus(obj, true, false, true, scope.Data.Materials.basic);
                scope.Data.Materials.basic.uniforms["mode"].value = 0;
            }
            else {
                visible_edge = false;
                scope.Data.UpdateObjectStatus(obj, true, false, true, scope.Data.Materials.basic);
                scope.Data.Materials.basic.uniforms["mode"].value = 0;
            }

            // else
            for (var i = 0; i < obj.children.length; i++) {
                if (obj.children[i] instanceof THREE.Mesh) {
                    obj.children[i].material = scope.Data.Materials.basic;

                    obj.children[i].material.wireframe = v === RENDER_MODES.Wireframe ? true : false;
                    obj.children[i].material.flatShading = v === RENDER_MODES.Flat ? true : false;

                    obj.children[i].material.needsUpdate = true;
                }
                else {
                    setRenderMode(v, obj.children[i]);
                }
            }

            scope.RenderEvent = true;
        }

        function getDegInRad(deg) {
            return deg * Math.PI / 180;
        }
        
        function setCameraRotate(xdir, ydir, zdir, angle) {
            var axis = new THREE.Vector3(),
                quaternion = new THREE.Quaternion(),
                eyeDirection = new THREE.Vector3(),
                objectUpDirection = new THREE.Vector3(),
                objectSidewaysDirection = new THREE.Vector3(),
                moveDirection = new THREE.Vector3(),
                _eye = new THREE.Vector3();

            moveDirection.set(xdir, ydir, zdir);

            if (angle) {

                _eye.copy(camera.position).sub(controls.target);

                eyeDirection.copy(_eye).normalize();
                objectUpDirection.copy(camera.up).normalize();
                objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

                objectUpDirection.setLength(ydir);
                objectSidewaysDirection.setLength(xdir);

                moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

                axis.x = xdir;
                axis.y = ydir;
                axis.z = zdir;
                quaternion.setFromAxisAngle(axis, angle);

                _eye.applyQuaternion(quaternion);
                camera.up.applyQuaternion(quaternion);
            }
            camera.position.addVectors(controls.target, _eye);
            camera.lookAt(controls.target);
        }

        function setSelectMesh(mesh, body, deselect) {
            // 복원
            var resetdata = function (source, mesh, body) {
                var newindexes = new Float32Array(source.geometry.index.array.length + body.m_nTris);
                var newpositions = new Float32Array(source.geometry.attributes.position.array.length + body.m_nVtx);
                var newnormals = new Float32Array(source.geometry.attributes.normal.array.length + body.m_nVtx);

                // body update
                body.m_triIdx = source.geometry.index.array.length;
                body.m_vnIdx = source.geometry.attributes.position.array.length;

                newindexes.set(source.geometry.index.array, 0);
                newindexes.set(mesh.geometry.index.array, source.geometry.index.array.length);
                newpositions.set(source.geometry.attributes.position.array, 0);
                newpositions.set(mesh.geometry.attributes.position.array, source.geometry.attributes.position.array.length);
                newnormals.set(source.geometry.attributes.normal.array, 0);
                newnormals.set(mesh.geometry.attributes.normal.array, source.geometry.attributes.normal.array.length);

                for (var i = source.geometry.index.array.length; i < source.geometry.index.array.length + body.m_nTris; i++) {
                    newindexes[i] = newindexes[i] + body.m_vnIdx / 3;

                    if (newindexes[i] < 0 || newindexes[i] > newpositions.length - 1)
                        console.log("");
                }
                var geometry = new THREE.BufferGeometry();
                dispose(source.geometry);
                source.geometry = geometry;
                source.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
                source.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
                source.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
                source.geometry.computeBoundingSphere();

                source.userData.push(body);

                dispose(select.mesh);
                select.mesh = null;
                select.body = null;
                select.source = null;
            };

            var selectdata = function (mesh, body) {
                var indexes = mesh.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
                var positions = mesh.geometry.attributes.position.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);
                var normals = mesh.geometry.attributes.normal.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);

                for (var i = 0; i < indexes.length; i++) {
                    indexes[i] = indexes[i] - body.m_vnIdx / 3;
                }

                var geometry = new THREE.BufferGeometry();
                geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
                geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
                geometry.computeBoundingSphere();

                var material = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });
                select.mesh = new THREE.Mesh(geometry, material);
                select.body = {
                    partId: body.partId,
                    bodyId: body.bodyId,
                    color: body.color,
                    m_nVtx: body.m_nVtx,
                    m_nTris: body.m_nTris,
                    m_vnIdx: body.m_vnIdx,
                    m_triIdx: body.m_triIdx,
                    BBox: body.BBox,
                };
                select.body.m_triIdx = 0;
                select.body.m_vnIdx = 0;
                select.source = mesh.uuid;
                objModel.add(select.mesh);
            };

            var updatedata = function (mesh, body) {
                var newindexes = new Float32Array(mesh.geometry.index.array.length - body.m_nTris);
                var newpositions = new Float32Array(mesh.geometry.attributes.position.array.length - body.m_nVtx);
                var newnormals = new Float32Array(mesh.geometry.attributes.normal.array.length - body.m_nVtx);

                newindexes.set(mesh.geometry.index.array.subarray(0, body.m_triIdx), 0);
                newindexes.set(mesh.geometry.index.array.subarray(body.m_triIdx + body.m_nTris, mesh.geometry.index.array.length), body.m_triIdx);
                newpositions.set(mesh.geometry.attributes.position.array.subarray(0, body.m_vnIdx), 0);
                newpositions.set(mesh.geometry.attributes.position.array.subarray(body.m_vnIdx + body.m_nVtx, mesh.geometry.attributes.position.array.length), body.m_vnIdx);
                newnormals.set(mesh.geometry.attributes.normal.array.subarray(0, body.m_vnIdx), 0);
                newnormals.set(mesh.geometry.attributes.normal.array.subarray(body.m_vnIdx + body.m_nVtx, mesh.geometry.attributes.normal.array.length), body.m_vnIdx);

                // update index value값 변경
                var cnt = 0;
                for (var i = body.m_triIdx; i < newindexes.length; i++ , cnt++) {
                    newindexes[i] = newindexes[i] - body.m_nVtx / 3;

                    if (newindexes[i] < 0 || newindexes[i] > newpositions.length - 1)
                        console.log("");
                }

                var geometry = new THREE.BufferGeometry();
                dispose(mesh.geometry);
                mesh.geometry = geometry;
                mesh.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
                mesh.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
                mesh.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
                mesh.geometry.computeBoundingSphere();

                for (var i = mesh.userData.length - 1; i >= 0; i--) {
                    if (mesh.userData[i].bodyId === body.bodyId) {
                        mesh.userData.splice(i, 1);
                    }
                    else if (mesh.userData[i].m_triIdx > body.m_triIdx) {
                        mesh.userData[i].m_triIdx = mesh.userData[i].m_triIdx - body.m_nTris;
                        mesh.userData[i].m_vnIdx = mesh.userData[i].m_vnIdx - body.m_nVtx;
                    }
                }
            };

            if (deselect) {
                if(select.mesh !== null) {
                    var source = getMesh(objModel, select.source);
                    resetdata(source, select.mesh, select.body);
                }
                return;
            }

            console.log('intersect: ' + body.bodyId);

            // 이전 선택 처리
            if (select.mesh !== null) {
                if (select.body.bodyId === body.bodyId)
                    return;
                var source = getMesh(objModel, select.source);
                resetdata(source, select.mesh, select.body);
            }

            // select
            selectdata(mesh, body);
            
            // Mesh 및 Body 데이터 조정
            updatedata(mesh, body);
        }

        function setPivot() {

            var intersects = scope.Picking.PickInfoByPos(onPickPosition, onDownPosition);
            if (intersects !== undefined && intersects.length > 0) {
                console.log("Pivot : " + intersects[0].point.x + "," + intersects[0].point.y + "," + intersects[0].point.z);
                controls.Pivot.copy(intersects[0].point);
                bSetPivot = true;
            }
            return;
            //var mouse = new THREE.Vector2();
            //mouse.set(onDownPosition.x, onDownPosition.y);

            //_TargetMeshes.splice(0, _TargetMeshes.length);
            //getHitTestNode(objModel, onPickPosition.x, onPickPosition.y, onDownPosition);

            //if (camera.isPerspectiveCamera) {
            //    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            //    vector = vector.unproject(camera);
            //    var tmp = vector.sub(camera.position).normalize();
            //    raycaster = new THREE.Raycaster(camera.position, tmp);
            //}
            //else {
            //    var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            //    origin = origin.unproject(camera);
            //    var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            //    raycaster = new THREE.Raycaster();
            //    raycaster.set(origin, direction);
            //}

            //if (_TargetMeshes.length > 0) {
            //    var intersects = raycaster.intersectObjects(_TargetMeshes, true);
            //    if (intersects.length > 0) {
            //        var clipInfo = scope.Clipping.GetClipInfo();
            //        for (var i = intersects.length - 1; i >= 0; i--) {
            //            // Clipping Area Check
            //            var bSkip = false;
            //            if (clipInfo.enable !== null || clipInfo.enable !== false) {

            //                if (clipInfo.type === CLIPPING_MODES.X) {
            //                    if (clipInfo.inverse === false) {
            //                        if (intersects[i].point.x >= clipInfo.value)
            //                            bSkip = true;
            //                    }
            //                    else {
            //                        if (intersects[i].point.x <= clipInfo.value * -1)
            //                            bSkip = true;
            //                    }
            //                }
            //                if (clipInfo.type === CLIPPING_MODES.Y) {
            //                    if (clipInfo.inverse === false) {
            //                        if (intersects[i].point.y >= clipInfo.value)
            //                            bSkip = true;
            //                    }
            //                    else {
            //                        if (intersects[i].point.y <= clipInfo.value * -1)
            //                            bSkip = true;
            //                    }
            //                }
            //                if (clipInfo.type === CLIPPING_MODES.Z) {
            //                    if (clipInfo.inverse === false) {
            //                        if (intersects[i].point.z >= clipInfo.value)
            //                            bSkip = true;
            //                    }
            //                    else {
            //                        if (intersects[i].point.z <= clipInfo.value * -1)
            //                            bSkip = true;
            //                    }
            //                }
            //            }
            //            if (bSkip)
            //                intersects.splice(i, 1);
            //        }

            //        if (intersects.length > 0) {
            //            console.log("Pivot : " + intersects[0].point.x + "," + intersects[0].point.y + "," + intersects[0].point.z);
            //            controls.Pivot.copy(intersects[0].point);
            //            bSetPivot = true;
            //        }
            //    }
            //    else {
            //        console.log('no intersect');
            //    }
            //} // if models.children.length > 0
            //else {
            //    //alert("models.children.length < 0!!!");
            //}
        }

        // 모델 선택
        function setSelectModel() {
            if (onDownPosition.distanceTo(onUpPosition) === 0) {

                var intersects = scope.Picking.PickInfoByPos(onPickPosition, onUpPosition);
                if (intersects !== undefined && intersects.length > 0) {
                    var Index = -1;
                    for (var i = 0; i < intersects[0].object.userData.length; i++) {
                        var body = intersects[0].object.userData[i];
                        if (intersects[0].faceIndex * 3 >= body.m_triIdx && intersects[0].faceIndex * 3 < body.m_triIdx + body.m_nTris) {
                            scope.Data.Select_v2(body.bodyId, objModel, true);
                            clipping.UpdateModel(objModel);
                            scope.RenderEvent = true;
                            break;
                        }
                    }
                }
                else {
                    console.log('no intersect');
                    scope.Data.DeselectAll(objModel);
                }
                return;
                //var mouse = new THREE.Vector2();
                //mouse.set(onUpPosition.x, onUpPosition.y);
                //_TargetMeshes.splice(0, _TargetMeshes.length);
                //getHitTestNode(objModel, onPickPosition.x, onPickPosition.y, onUpPosition);

                ////projector = new THREE.Projector();
                
                //if (camera.isPerspectiveCamera) {
                //    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                //    //projector.unprojectVector(vector, camera);
                //    vector = vector.unproject(camera);
                //    var tmp = vector.sub(camera.position).normalize();
                //    raycaster = new THREE.Raycaster(camera.position, tmp);
                //}
                //else {
                //    var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
                //    //projector.unprojectVector(origin, camera);
                //    origin = origin.unproject(camera);

                //    var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
                //    raycaster = new THREE.Raycaster();
                //    raycaster.set(origin, direction);
                //}

                //if (_TargetMeshes.length > 0) {
                //    var intersects = raycaster.intersectObjects(_TargetMeshes, true);
                //    if (intersects.length > 0) {

                //        var clipInfo = scope.Clipping.GetClipInfo();
                //        for (var i = intersects.length - 1; i >= 0; i--) {
                //            // Clipping Area Check
                //            var bSkip = false;
                //            if (clipInfo.enable !== null || clipInfo.enable !== false) {

                //                if (clipInfo.type === CLIPPING_MODES.X) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.x >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.x <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //                if (clipInfo.type === CLIPPING_MODES.Y) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.y >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.y <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //                if (clipInfo.type === CLIPPING_MODES.Z) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.z >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.z <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //            }
                //            if (bSkip)
                //                intersects.splice(i, 1);
                //        }

                //        if (intersects.length > 0) {
                //            var Index = -1;
                //            for (var i = 0; i < intersects[0].object.userData.length; i++) {
                //                var body = intersects[0].object.userData[i];
                //                if (intersects[0].faceIndex * 3 >= body.m_triIdx && intersects[0].faceIndex * 3 < body.m_triIdx + body.m_nTris) {
                //                    scope.Data.Select_v2(body.bodyId, objModel, true);
                //                    clipping.UpdateModel(objModel);
                //                    scope.RenderEvent = true;
                //                    break;
                //                }
                //            }
                //        }
                //        else {
                //            console.log('no intersect');
                //            scope.Data.DeselectAll(objModel);
                //        }
                //    }
                //    else {
                //        console.log('no intersect');
                //        scope.Data.DeselectAll(objModel);
                //    }
                //} // if models.children.length > 0
                //else {
                //    //alert("models.children.length < 0!!!");
                //    scope.Data.DeselectAll(objModel);
                //}
            }
        }

        // 모델 선택
        function setSelectModelTouch() {
            var tmp = onDownPosition.distanceTo(onUpPosition);
            if (onDownPosition.distanceTo(onUpPosition) <= 0.01) {
                var intersects = scope.Picking.PickInfoByPos(onPickPosition, onUpPosition);
                if (intersects !== undefined && intersects.length > 0) {
                    var Index = -1;
                    for (var i = 0; i < intersects[0].object.userData.length; i++) {
                        var body = intersects[0].object.userData[i];
                        if (intersects[0].faceIndex * 3 >= body.m_triIdx && intersects[0].faceIndex * 3 < body.m_triIdx + body.m_nTris) {
                            scope.Data.Select_v2(body.bodyId, objModel, true);
                            clipping.UpdateModel(objModel);
                            scope.RenderEvent = true;
                            break;
                        }
                    }
                }
                else {
                    console.log('no intersect');
                    scope.Data.DeselectAll(objModel);
                }
                return;
               
                //var mouse = new THREE.Vector2();
                //mouse.set(onUpPosition.x, onUpPosition.y);
                //_TargetMeshes.splice(0, _TargetMeshes.length);
                //getHitTestNode(objModel, onPickPosition.x, onPickPosition.y, onUpPosition);

                ////projector = new THREE.Projector();

                //if (camera.isPerspectiveCamera) {
                //    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                //    //projector.unprojectVector(vector, camera);
                //    vector = vector.unproject(camera);
                //    var tmp = vector.sub(camera.position).normalize();
                //    raycaster = new THREE.Raycaster(camera.position, tmp);
                //}
                //else {
                //    var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
                //    //projector.unprojectVector(origin, camera);
                //    origin = origin.unproject(camera);

                //    var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
                //    raycaster = new THREE.Raycaster();
                //    raycaster.set(origin, direction);
                //}

                //if (_TargetMeshes.length > 0) {
                //    var intersects = raycaster.intersectObjects(_TargetMeshes, true);
                //    if (intersects.length > 0) {

                //        var clipInfo = scope.Clipping.GetClipInfo();
                //        for (var i = intersects.length - 1; i >= 0; i--) {
                //            // Clipping Area Check
                //            var bSkip = false;
                //            if (clipInfo.enable !== null || clipInfo.enable !== false) {

                //                if (clipInfo.type === CLIPPING_MODES.X) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.x >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.x <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //                if (clipInfo.type === CLIPPING_MODES.Y) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.y >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.y <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //                if (clipInfo.type === CLIPPING_MODES.Z) {
                //                    if (clipInfo.inverse === false) {
                //                        if (intersects[i].point.z >= clipInfo.value)
                //                            bSkip = true;
                //                    }
                //                    else {
                //                        if (intersects[i].point.z <= clipInfo.value * -1)
                //                            bSkip = true;
                //                    }
                //                }
                //            }
                //            if (bSkip)
                //                intersects.splice(i, 1);
                //        }

                //        if (intersects.length > 0) {
                //            for (var i = 0; i < intersects[0].object.userData.length; i++) {
                //                var body = intersects[0].object.userData[i];
                //                if (intersects[0].faceIndex * 3 >= body.m_triIdx && intersects[0].faceIndex * 3 < body.m_triIdx + body.m_nTris) {

                //                    //setSelectMesh(intersects[0].object, body);
                //                    scope.Data.Select_v2(body.bodyId, objModel, true);
                //                    clipping.UpdateModel(objModel);
                //                    scope.RenderEvent = true;
                //                    break;
                //                }
                //            }
                //        }
                //        else {
                //            console.log('no intersect');
                //            scope.Data.DeselectAll(objModel);
                //        }
                //    }
                //    else {
                //        console.log('no intersect');
                //        scope.Data.DeselectAll(objModel);
                //    }
                //} // if models.children.length > 0
                //else {
                //    //alert("models.children.length < 0!!!");
                //    scope.Data.DeselectAll(objModel);
                //}
            }
        }

        function getHitTestNode(obj, mx, my, onUpPosition) {
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
                    getHitTestNode(obj.children[i], mx, my, onUpPosition);
                }
            }
        }

        function getMousePosition(dom, x, y) {
            var rect = dom.getBoundingClientRect();
            //return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
            return [2 * ((x - rect.left) / rect.width) - 1, 1 - 2 * ((y - rect.top) / rect.height)];

        }

        function onControlChanged() {
            scope.RenderEvent = true;
        }

        function onControlChangeStart() {
            if (!controls.noZoom) {
                // 피벗 위치 이동
                //setPivot();
            }

            scope.RenderEvent = true;
        }

        function onDocumentMouseDown(event) {
            if (!mouseAction)
                return;

            var array = getMousePosition(container, event.clientX, event.clientY);
            onDownPosition.fromArray(array);
            onPickPosition.x = event.x;
            onPickPosition.y = event.y;

            pressTimer = setTimeout(function () {
                if (onDownPosition.distanceTo(onCurrentPosition) === 0) {
                    //onUpPosition = onDownPosition;
                    setPivot();
                    scope.RenderEvent = true;
                }
            }, 1000);

            if (scope.Measure.ReviewMode)
                scope.Measure.onMouseDown(event);

            if (scope.Note.ReviewMode)
                scope.Note.onMouseDown(event);

            if (scope.Drawing.DrawingMode)
                scope.Drawing.onMouseDown(event);

            scope.RenderEvent = true;
        }

        function onDocumentMouseUp(event) {
            if (!mouseAction)
                return;

            clearTimeout(pressTimer);
            
            var array = getMousePosition(container, event.clientX, event.clientY);
            onPickPosition.x = event.x;
            onPickPosition.y = event.y;
            onUpPosition.fromArray(array);
            if (bSetPivot) {
                bSetPivot = false;
            }
            else {
                if (!scope.Measure.ReviewMode && !scope.Note.ReviewMode && !scope.Drawing.DrawingMode)
                    setSelectModel();
            }

            // 노트 상태 처리
            scope.Note.onMouseUp(event);

            if (scope.Drawing.DrawingMode)
                scope.Drawing.onMouseUp(event);

            scope.RenderEvent = true;
        }

        function onWindowResize() {
            scope.Toolbar.CalcSplitBar();
            scope.Refresh();

            //var rect = container.getBoundingClientRect();
            //renderer.setSize(rect.width, rect.height);

            //camera.cameraP.aspect = container.clientWidth / container.clientHeight;
            //camera.cameraP.updateProjectionMatrix();

            //scope.RenderEvent = true;

            //if (controls)
            //    controls.handleResize();
            
            //if (scope.Toolbar)
            //    scope.Toolbar.Resize();

            //console.log("resize");
        }
        var pressTimer;
        var bSetPivot = false;
        function onDocumentMouseMove(event) {
            if (!mouseAction)
                return;

            var array = getMousePosition(container, event.clientX, event.clientY);
            //onPickPosition.x = event.x;
            //onPickPosition.y = event.y;
            onCurrentPosition.fromArray(array);

            if (scope.Measure.ReviewMode)
                scope.Measure.onMouseMove(event);

            if (scope.Note.ReviewMode)
                scope.Note.onMouseMove(event);

            if (scope.Drawing.DrawingMode)
                scope.Drawing.onMouseMove(event);
        }

        function onKeyDown(event) {
            event = event || window.event; // IE support
            var c = event.keyCode;
            var ctrlDown = event.ctrlKey || event.metaKey; // Mac support

            // 노트 상태에서의 ESC 제어
            if (c !== 27 && scope.Note.ReviewMode && scope.Note.ReviewType !== REVIEW_TYPES.NONE)
                return;
            // Shift, Ctrl, Alt
            if (c === 16 || c === 17 || c === 18) {
                if (c === 16)
                    scope.Drawing.Option.PressShift = true;
                return;
            }

            var key = {
                ctrl: ctrlDown,
                alt: event.altKey,
                shift: event.shiftKey,
                key: event.keyCode
            };

            scope.EventHandler.dispatchEvent(EVENT_TYPES.Keyboard.Down, key);
        }

        function onKeyUp(event) {
            event = event || window.event; // IE support
            var c = event.keyCode;
            var ctrlUp = event.ctrlKey || event.metaKey; // Mac support

            // Shift, Ctrl, Alt
            if (c === 16 || c === 17 || c === 18) {
                if (c === 16)
                    scope.Drawing.Option.PressShift = false;
            }
        }

        
        function addCustomEventListener() {
            // mouse move
            //container.addEventListener('mousemove', onDocumentMouseMove, false);
            //container.addEventListener('mousedown', onDocumentMouseDown, false);
            //container.addEventListener("mouseup", onDocumentMouseUp, false);

            //container.addEventListener('touchstart', onDocumentTouchStart, false);
            //container.addEventListener('touchmove', onDocumentMouseMove, false);
            //container.addEventListener('touchend', onDocumentTouchEnd, false);
            $('#VIZWeb3D').on('mousemove', function (event) {
                var e = event.originalEvent;
                onDocumentMouseMove(e);
            });
            $('#VIZWeb3D').on('mousedown', function (event) {
                var e = event.originalEvent;
                onDocumentMouseDown(e);
            });
            $('#VIZWeb3D').on('mouseup', function (event) {
                var e = event.originalEvent;
                onDocumentMouseUp(e);
            });

            $('#VIZWeb3D').on('touchstart', function (event) {
                var e = event.originalEvent;
                onDocumentTouchStart(e);
            });
            $('#VIZWeb3D').on('touchmove', function (event) {
                var e = event.originalEvent;
                onDocumentMouseMove(e);
            });
            $('#VIZWeb3D').on('touchend', function (event) {
                var e = event.originalEvent;
                onDocumentTouchEnd(e);
            });


            // resize
            window.addEventListener('resize', onWindowResize, false);

            // key down
            document.addEventListener('keydown', onKeyDown, false);
            // key down
            document.addEventListener('keyup', onKeyUp, false);
        }

        function onDocumentTouchStart(event) {
            scope.Lock(false);
            //var e = event.originalEvent;
            var moveTouchX = event.changedTouches[0].pageX;
            var moveTouchY = event.changedTouches[0].pageY;
            //var array = getMousePosition(container, event.changedTouches[0].pageX, event.changedTouches[0].pageY);
            var array = getMousePosition(container, moveTouchX, moveTouchY);
            //onDownPosition.fromArray(array);
            onDownPosition.fromArray(array);
            onPickPosition.x = moveTouchX;
            onPickPosition.y = moveTouchY;

            pressTimer = setTimeout(function () {
                if (onDownPosition.distanceTo(onCurrentPosition) === 0) {
                    setPivot();
                    scope.RenderEvent = true;
                }
            }, 1000);

            if (scope.Measure.ReviewMode)
                scope.Measure.onMouseDown(event);

            if (scope.Note.ReviewMode)
                scope.Note.onMouseDown(event);

            if (scope.Drawing.DrawingMode)
                scope.Drawing.onMouseDown(event);

            scope.RenderEvent = true;
        }

        function onDocumentTouchEnd(event) {
            scope.Lock(false);
            
            var moveTouchX = event.changedTouches[0].pageX;
            var moveTouchY = event.changedTouches[0].pageY;
            //var array = getMousePosition(container, event.changedTouches[0].pageX, event.changedTouches[0].pageY);
            var array = getMousePosition(container, moveTouchX, moveTouchY);
            onPickPosition.x = moveTouchX;
            onPickPosition.y = moveTouchY;
            onUpPosition.fromArray(array);
            if (bSetPivot) {
                bSetPivot = false;
            }
            else {
                if (!scope.Measure.ReviewMode && !scope.Note.ReviewMode)
                    setSelectModelTouch();

                if (scope.Drawing.DrawingMode)
                    scope.Drawing.onMouseUp(event);
            }

            // 노트 상태 처리
            scope.Note.onMouseUp(event);

            scope.RenderEvent = true;
        }
        

        

        return VIEW;
    }
);


