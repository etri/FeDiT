/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Data = function (View, Model) {

    var scope = this;
    var me = this;

    var id_max = 0;
    var id_start = 0;
    // Data Process
    var selectDatas = [];
    var hideDatas = [];
    var selectMesh = null;
    var disableMesh = null;
    var view = View;
    var objModel = Model;
    var action = true;
    var colSelect = { r: 255, g: 0, b: 0, a: 1.0 };
    var colLineSelection = { r: 255, g: 0, b: 0, a: 1.0 };
    var colorEdge = { r: 255, g: 0, b: 0, a: 1.0 };
    var enableLineSelection = true;
    var widthLineSelection = 2.0;

    var UserData = function () {
        var data = {
            body: null,
            mesh: null,
            tmp: null,
            outline: null,
            move:null
        };
        return data;
    };

    // Reponse Data
    var Node = function () {
        var item = {
            ID: -1,
            ParentID: -1,
            Name: ""
        };
        return item;
    };

    this.SessionID = "";
    this.AliveTimer = null;
    this.AliveTime = 10 * 60 * 1000;


    init();
    function init() {
        if (action) {
            //initSelect();
            //initDisable();
        }
    }

    function initSelect() {
        var geometry = new THREE.BufferGeometry();
        var indexes = new Float32Array();
        var positions = new Float32Array();
        var normals = new Float32Array();

        geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));

        var material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(colSelect.r / 255, colSelect.g / 255, colSelect.b / 255),
            side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors,
            opacity: colSelect.a
        });

        selectMesh = new THREE.Mesh(geometry, material);
        selectMesh.userData = [];
        selectMesh.name = "SelectMesh";
        objModel.add(selectMesh);
    }

    function initDisable() {
        var geometry = new THREE.BufferGeometry();
        var indexes = new Float32Array();
        var positions = new Float32Array();
        var normals = new Float32Array();

        geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));

        var material = new THREE.MeshPhongMaterial({ color: 0x000000, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });

        disableMesh = new THREE.Mesh(geometry, material);
        disableMesh.userData = [];
        disableMesh.name = "DisableMesh";
        disableMesh.visible = false;
        objModel.add(disableMesh);
    }

    function clear_SelectMesh() {
        dispose(selectMesh);
        initSelect();
    }

    function clear_DisableMesh() {
        dispose(disableMesh);
        initDisable();
    }

    function getBodies(Index, bodies, map) {

        var value = scope.TreeMap.get(Index);
        if (value === undefined)
            return;

        if (value.data.type === ENTITY_TYPES.EntBody) {
            bodies.push(value.data);
            if (map !== undefined)
                map.set(value.data.index, value.data);
        }

        for (var i = 0; i < value.sub.length; i++) {
            if (value.sub[i].type === ENTITY_TYPES.EntAssembly
                || value.sub[i].type === ENTITY_TYPES.EntPart) {
                getBodies(value.sub[i].index * 1, bodies, map);
            }
            else {
                bodies.push(value.sub[i]);
                if (map !== undefined)
                    map.set(value.sub[i].index, value.sub[i]);
            }
        }
    }

    function getDatas(obj, arrIndex, datas, map) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh
                || obj.children[i] instanceof THREE.LineSegments) {
                for (var j = 0; j < obj.children[i].userData.length; j++) {
                    var data = obj.children[i].userData[j];
                    var isMatch = function (element) {
                        return element.index === data.bodyId;
                    };
                    if (map !== undefined) {
                        if (map.get(data.bodyId) !== undefined) {
                            datas.push({
                                body: data,
                                mesh: obj.children[i]
                            });
                        }
                    }
                }
            }
            else {
                getDatas(obj.children[i], arrIndex, datas, map);
            }
        }
    }

    function getAllDatas(obj, datas) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh
                || obj.children[i] instanceof THREE.LineSegments) {
                for (var j = 0; j < obj.children[i].userData.length; j++) {
                    var data = obj.children[i].userData[j];
                    datas.push({
                        body: data,
                        mesh: obj.children[i]
                    });
                }
            }
            else {
                getAllDatas(obj.children[i], datas);
            }
        }
    }

    function getMesh(obj, uuid) {
        var result = [];

        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh
                || obj.children[i] instanceof THREE.LineSegments) {
                if (obj.children[i].uuid.localeCompare(uuid) === 0) {
                    result.push(obj.children[i]);
                    break;
                }
            }
            else {
                getMesh2(obj.children[i], uuid, result);
            }
        }

        if (result.length > 0)
            return result[0];
        else
            return null;
    }

    function getMesh2(obj, uuid, result) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh) {
                if (obj.children[i].uuid.localeCompare(uuid) === 0) {
                    result.push(obj.children[i]);
                    break;
                }
            }
            else {
                getMesh2(obj.children[i], uuid, result);
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
                        if (o.parent) {
                            o.parent.remove(o);
                        }
                        dispose(o.geometry);
                        dispose(o.material);
                        dispose(o.children);
                    } else
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

    function setOutlineHelper(obj) {

        if (enableLineSelection) {
            scope.OutlineMap = new Map();

            var makeOutline = function (value) {
                for (var j = 0; j < value.mesh.userData.length; j++) {
                    var data = value.mesh.userData[j];
                    if (!data.Tag.Select) {
                        // 선택 정보가 아니므로 백업 데이터 생성
                        data.Tag.Outline.Base = value.mesh.geometry.index.array.slice(data.m_triIdx, data.m_triIdx + data.m_nTris);
                        data.Tag.Outline.New = new Float32Array(data.m_nTris);
                    }
                }
            };

            var makeOutlineData = function (obj) {
                for (var j = 0; j < selectDatas.length; j++) {
                    if (!scope.OutlineMap.get(selectDatas[j].mesh)) {
                        var mesh = getMesh(obj, selectDatas[j].mesh);
                        var parent = mesh.parent;
                        scope.OutlineMap.set(selectDatas[j].mesh, { mesh: mesh, parent: parent });
                    }
                }
                scope.OutlineMap.forEach(makeOutline);
            };

            makeOutlineData(obj);

            // 백업 데이터를 텍스처 생성 과정에서 편집
            view.SetOutlineSelection();
        }
    }

    function getHitTestNode(obj, mx, my, onUpPosition, _TargetMeshes) {
        var me = this;

        var mouse = new THREE.Vector2();
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

    this.Shader = {
        derivatives: [
            '#extension GL_OES_standard_derivatives : enable'
        ].join('\n'),
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['fog'],
            THREE.UniformsLib['lights'],
            {
                time: {
                    type: 'f',
                    value: 0.0
                },
                vEye: {
                    type: 'v3',
                    value: new THREE.Vector3(0.0, 0.0, 10.0).multiplyScalar(10000)
                },
                vLight: {
                    type: 'v3',
                    value: new THREE.Vector3(200.0, 500.0, 1000.0).multiplyScalar(10000 * 300)
                },
                fShininess: {
                    type: 'f',
                    value: 0.5
                },
                //p: { type: 'f', value: 3.0 },
                //glowColor: { type: 'c', value: new THREE.Color(0x84ccff) },
                mode: { type: 'f', value: 0 },
                useAlpha: { type: 'f', value: 0 },
                alpha: { type: 'f', value: 0 },
            }]),
        uniforms_xray: THREE.UniformsUtils.merge([
            THREE.UniformsLib['fog'],
            THREE.UniformsLib['lights'],
            {
                time: {
                    type: 'f',
                    value: 0.0
                },
                vEye: {
                    type: 'v3',
                    value: new THREE.Vector3(0.0, 0.0, 10.0).multiplyScalar(10000)
                },
                vLight: {
                    type: 'v3',
                    value: new THREE.Vector3(200.0, 500.0, 1000.0).multiplyScalar(10000 * 300)
                },


                p: { type: 'f', value: 3 },
                glowColor: { type: 'c', value: new THREE.Color(0x84ccff) },
                x_ray: { type: 'f', value: 1 },
            }]),
        vertex: [
            //'precision mediump float;',
            //'uniform float p;',
            'uniform float useAlpha;',
            'uniform float alpha;',
            'uniform float mode;',
            'varying float v_useAlpha;',
            'varying float v_alpha;',
            'varying float v_mode;',
            'varying float intensity;',
            'attribute vec4 color;',
            'varying vec3 vPosition;',
            'varying vec3 vmyViewPosition;',
            'varying vec3 vNormal;',
            'varying vec4 vColor;',
            '#include <clipping_planes_pars_vertex>',
            'void main()	{',
            '#include <begin_vertex>',
            //'vPosition = position;',
            'v_mode = mode;',
            'v_useAlpha = useAlpha;',
            'v_alpha = alpha;',
            'mat4 normalMatrix = modelViewMatrix;',
            'normalMatrix[3][0] = 0.0;',
            'normalMatrix[3][1] = 0.0;',
            'normalMatrix[3][2] = 0.0;',
            'vNormal = vec3(normalMatrix * vec4(normal, 0.0));',
            'vColor = color;',
            //'intensity = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), p);',
            '#include <project_vertex>',
            '#include <clipping_planes_vertex>',
            'vPosition = mvPosition.xyz;',
            'vmyViewPosition = -mvPosition.xyz;',
            '}'
        ].join("\n"),
        fragment: [
            //'precision mediump float;',
            'uniform float time;',
            'uniform vec3 vEye;',
            'uniform vec3 vLight;',
            'uniform float fShininess;',	// 0 ~ 1   64.0 == 0.5
            //'uniform vec3 glowColor;',
            //'uniform float useAlpha;',
            //'uniform float alpha;',
            'varying float v_useAlpha;',
            'varying float v_alpha;',
            'varying float intensity;',
            'varying float v_mode;',
            'varying vec3 vPosition;',
            'varying vec3 vmyViewPosition;',
            'varying vec3 vNormal;',
            'varying vec4 vColor;',

            '#include <clipping_planes_pars_fragment>',
            'void main()	{',
            '#include <clipping_planes_fragment>',

            '#ifdef FLAT_SHADED',
            'vec3 normal = normalize( cross( dFdx( vmyViewPosition), dFdy( vmyViewPosition ) ) );', //Flat
            '#else',
            'vec3 normal = normalize(vNormal);',
            'if(normal.z < 0.0)',
            'normal *= -1.0;',
            '#endif',

            'vec3 lightDir = normalize(vLight - vPosition);',
            'float lambertian = max(dot(lightDir, normal), 0.0);',
            'float specular = 0.0;',
            'if (lambertian > 0.0)',
            '{',
            'vec3 viewDir = normalize(vEye - vPosition);',
            'vec3 halfDir = normalize(lightDir + viewDir);',
            'float specAngle = max(dot(halfDir, normal), 0.0);',
            //'specular = pow(specAngle, 64.0); //fShininess',
            'float shininess = mix(0.1, 1.0, 1.0 - fShininess);',
            'specular = pow(specAngle, shininess * 128.0);',            
            '}',
            'vec3 colorLinear = vec3(0.3, 0.3, 0.3)*vColor.rgb +',
            'lambertian * vColor.rgb * vec3(0.7, 0.7, 0.7)+',
            'specular * vec3(1.0, 1.0, 1.0) * 0.5;',
            'vec3 colorGammaCorrected = colorLinear;',
            'colorGammaCorrected = clamp(colorGammaCorrected, 0.0, 1.0);',
            'if(v_mode > 4.0){',
            //'vec3 glow = glowColor * intensity;',
            //'gl_FragColor = vec4(glow, 0.2);',
            'gl_FragColor = vec4(colorGammaCorrected, 0.2);',
            '}',
            'else if(v_mode > 2.0){',
            'gl_FragColor = vec4(colorGammaCorrected, 0.0);',
            '}',
            'else',
            'if(v_useAlpha > 0.5){',
            'gl_FragColor = vec4(colorGammaCorrected, v_alpha);',
            '}',
            'else{',
            'gl_FragColor = vec4(colorGammaCorrected, vColor.a);',
            '}',
            '}'
        ].join("\n"),
    };

    this.Materials = {
        basic: new THREE.ShaderMaterial({
            derivatives: scope.Shader.derivatives,
            uniforms: scope.Shader.uniforms,
            vertexShader: scope.Shader.vertex,
            fragmentShader: scope.Shader.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            flatShading: false,
            clipping: true,
            clippingPlanes: [],
            blending: THREE.NormalBlending, //AdditiveBlending, NormalBlending
            depthTest: true,
            depthWrite: true
        }),
        outline_edge: new THREE.ShaderMaterial({
            uniforms: {
                "maskTexture": { value: null },
                "texSize": { value: new THREE.Vector2(1, 1) },
                "edgeColor": { value: new THREE.Vector3(0, 1, 0) },
                "edgeColorR": { value: 0.0 },
                "edgeColorG": { value: 1.0 },
                "edgeColorB": { value: 0.0 },
                "edgeAlpha": { value: 1.0 },
                "edgeWidth": { value: 2.0 }
            },
            //        vertexShader:
            //            "varying vec2 vUv;\n\
            //void main() {\n\
            //	vUv = uv;\n\
            //	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
            //}",
            vertexShader: [
                'varying vec2 vUv;',
                //'#include <clipping_planes_pars_vertex>',
                'void main() {',
                'vUv = uv;',
                //'#include <begin_vertex>',
                //    '#include <project_vertex>',
                //    '#include <clipping_planes_vertex>',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join("\n"),
            fragmentShader:
                [
                    'varying vec2 vUv;',
                    'uniform sampler2D maskTexture;',
                    'uniform vec2 texSize;',
                    'uniform vec3 edgeColor;',
                    'uniform float edgeColorR;',
                    'uniform float edgeColorB;',
                    'uniform float edgeColorG;',

                    'uniform float edgeAlpha;',
                    'uniform float edgeWidth;',
                    'float GetmatSample(vec2 offset, int i, int j){',
                    '   vec3 sample = texture2D(maskTexture, vUv + vec2(float(i) * offset.x, float(j) * offset.y)).rgb; ',
                    '  return length(sample); ',
                    '}',
                    //      '#include <clipping_planes_pars_fragment>',
                    'void main()	{',
                    //     '#include <clipping_planes_fragment>',
                    'vec2 invSize = vec2( 1.0 / texSize.x, 1.0 / texSize.y);',
                    'float dxtex = invSize.x;',
                    'float dytex = invSize.y;',
                    //얇은
                    '	mat3 matEdgeX = mat3(',
                    '		0.0, -1.0, 0.0,',
                    '		0.0, 1.0, 0.0,',
                    '		0.0, 0.0, 0.0',
                    '	);',
                    '	mat3 matEdgeY = mat3(',
                    '		0.0, 0.0, 0.0,',
                    '		-1.0, 1.0, 0.0,',
                    '		0.0, 0.0, 0.0',
                    '	);',
                    //기본
                    //'mat3 matEdgeX = mat3(',
                    //'	0.0, 1.0, 0.0,',
                    //'	0.0, 0.0, 0.0,',
                    //'	0.0, -1.0, 0.0',
                    //');',
                    //'mat3 matEdgeY = mat3(',
                    //'	0.0, 0.0, 0.0,',
                    //'	1.0, 0.0, -1.0,',
                    //'	0.0, 0.0, 0.0',
                    //');',
                    //두꺼운
                    //'mat3 matEdgeX = mat3(',
                    //'	1.0, 2.0, 1.0,',
                    //'	0.0, 0.0, 0.0,',
                    //'	-1.0, -2.0, -1.0',
                    //');',
                    //'mat3 matEdgeY = mat3(',
                    //'	1.0, 0.0, -1.0,',
                    //'	2.0, 0.0, -2.0,',
                    //'	1.0, 0.0, -1.0',
                    //');',
                    'mat3 matSample = mat3(',
                    '	0.0, 0.0, 0.0,',
                    '	0.0, 0.0, 0.0,',
                    '	0.0, 0.0, 0.0',
                    ');',
                    'for (int i = -1; i<2; i++)',
                    '{',
                    '	for (int j = -1; j<2; j++)',
                    '	{',
                    '		vec3 sample = texture2D(maskTexture, vUv + vec2(float(i) * dxtex, float(j) * dytex)).rgb;',
                    '		matSample[i + 1][j + 1] = length(sample);',
                    '	}',
                    '}',
                    'float gx = dot(matEdgeX[0], matSample[0]) + dot(matEdgeX[1], matSample[1]) + dot(matEdgeX[2], matSample[2]);',
                    'float gy = dot(matEdgeY[0], matSample[0]) + dot(matEdgeY[1], matSample[1]) + dot(matEdgeY[2], matSample[2]);',
                    'float g = sqrt(pow(gx, 2.0) + pow(gy, 2.0));',
                    'if( g > 0.0){',
                    //'   gl_FragColor = vec4(edgeColor, edgeAlpha);',
                    '   gl_FragColor = vec4(edgeColorR, edgeColorG, edgeColorB, edgeAlpha);',
                    //'   gl_FragColor = vec4(50.0/255.0, 200.0/255.0, 100.0/255.0, edgeAlpha);',
                    '}',
                    'else',
                    '{',
                    '	gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);',
                    '}',
                    '}'
                ].join("\n"),
            blending: THREE.NormalBlending, //   .NoBlending, AdditiveBlending, NormalBlending, MultiplyBlending
            depthTest: false,
            depthWrite: false,
            transparent: true
        }),
        outline_select: new THREE.ShaderMaterial({
            uniforms: {
                "maskTexture": { value: null },
                "texSize": { value: new THREE.Vector2(1, 1) },
                "edgeColor": { value: new THREE.Vector3(0, 1, 0) },
                "edgeColorR": { value: 0.0 },
                "edgeColorG": { value: 1.0 },
                "edgeColorB": { value: 0.0 },
                "edgeAlpha": { value: 1.0 },
                "edgeWidth": { value: 2.0 }
            },
            //        vertexShader:
            //            "varying vec2 vUv;\n\
            //void main() {\n\
            //	vUv = uv;\n\
            //	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
            //}",
            vertexShader: [
                'varying vec2 vUv;',
                //'#include <clipping_planes_pars_vertex>',
                'void main() {',
                'vUv = uv;',
                //'#include <begin_vertex>',
                //    '#include <project_vertex>',
                //    '#include <clipping_planes_vertex>',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join("\n"),
            fragmentShader:
                [
                    'varying vec2 vUv;',
                    'uniform sampler2D maskTexture;',
                    'uniform vec2 texSize;',
                    'uniform vec3 edgeColor;',
                    'uniform float edgeColorR;',
                    'uniform float edgeColorB;',
                    'uniform float edgeColorG;',

                    'uniform float edgeAlpha;',
                    'uniform float edgeWidth;',
                    'float GetmatSample(vec2 offset, int i, int j){',
                    '   vec3 sample = texture2D(maskTexture, vUv + vec2(float(i) * offset.x, float(j) * offset.y)).rgb; ',
                    '  return length(sample); ',
                    '}',
                    //      '#include <clipping_planes_pars_fragment>',
                    'void main()	{',
                    //     '#include <clipping_planes_fragment>',
                    'vec2 invSize = vec2( 1.0 / texSize.x, 1.0 / texSize.y);',
                    'float dxtex = invSize.x;',
                    'float dytex = invSize.y;',
                    //얇은
                    '	mat3 matEdgeX = mat3(',
                    '		0.0, -1.0, 0.0,',
                    '		0.0, 1.0, 0.0,',
                    '		0.0, 0.0, 0.0',
                    '	);',
                    '	mat3 matEdgeY = mat3(',
                    '		0.0, 0.0, 0.0,',
                    '		-1.0, 1.0, 0.0,',
                    '		0.0, 0.0, 0.0',
                    '	);',
                    //기본
                    //'mat3 matEdgeX = mat3(',
                    //'	0.0, 1.0, 0.0,',
                    //'	0.0, 0.0, 0.0,',
                    //'	0.0, -1.0, 0.0',
                    //');',
                    //'mat3 matEdgeY = mat3(',
                    //'	0.0, 0.0, 0.0,',
                    //'	1.0, 0.0, -1.0,',
                    //'	0.0, 0.0, 0.0',
                    //');',
                    //두꺼운
                    //'mat3 matEdgeX = mat3(',
                    //'	1.0, 2.0, 1.0,',
                    //'	0.0, 0.0, 0.0,',
                    //'	-1.0, -2.0, -1.0',
                    //');',
                    //'mat3 matEdgeY = mat3(',
                    //'	1.0, 0.0, -1.0,',
                    //'	2.0, 0.0, -2.0,',
                    //'	1.0, 0.0, -1.0',
                    //');',
                    'mat3 matSample = mat3(',
                    '	0.0, 0.0, 0.0,',
                    '	0.0, 0.0, 0.0,',
                    '	0.0, 0.0, 0.0',
                    ');',
                    'for (int i = -1; i<2; i++)',
                    '{',
                    '	for (int j = -1; j<2; j++)',
                    '	{',
                    '		vec3 sample = texture2D(maskTexture, vUv + vec2(float(i) * dxtex, float(j) * dytex)).rgb;',
                    '		matSample[i + 1][j + 1] = length(sample);',
                    '	}',
                    '}',
                    'float gx = dot(matEdgeX[0], matSample[0]) + dot(matEdgeX[1], matSample[1]) + dot(matEdgeX[2], matSample[2]);',
                    'float gy = dot(matEdgeY[0], matSample[0]) + dot(matEdgeY[1], matSample[1]) + dot(matEdgeY[2], matSample[2]);',
                    'float g = sqrt(pow(gx, 2.0) + pow(gy, 2.0));',
                    'if( g > 0.0){',
                    //'   gl_FragColor = vec4(edgeColor, edgeAlpha);',
                    '   gl_FragColor = vec4(edgeColorR, edgeColorG, edgeColorB, edgeAlpha);',
                    //'   gl_FragColor = vec4(50.0/255.0, 200.0/255.0, 100.0/255.0, edgeAlpha);',
                    '}',
                    'else',
                    '{',
                    '	gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);',
                    '}',
                    '}'
                ].join("\n"),
            blending: THREE.NormalBlending, //   .NoBlending, AdditiveBlending, NormalBlending, MultiplyBlending
            depthTest: false,
            depthWrite: false,
            transparent: true
        }),
        outline_basic: new THREE.ShaderMaterial({
            uniforms: {
            },
            vertexShader:
                "void main() {\n\
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
				}",
            fragmentShader:
                [
                    'void main()	{',
                    '   gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);',
                    '}'
                ].join("\n"),
            depthTest: false,
            depthWrite: false,
        }),
        hiddenline_basic: new THREE.ShaderMaterial({
            uniforms: {
            },
            vertexShader:
                [
                    'attribute vec4 color;',
                    'varying vec4 vColor;',
                    'varying vec3 vPosition;',
                    '#include <clipping_planes_pars_vertex>',
                    'void main()	{',
                    '#include <begin_vertex>',
                    'vColor = color;',
                    '#include <project_vertex>',
                    '#include <clipping_planes_vertex>',
                    'vPosition = mvPosition.xyz;',
                    '}'
                ].join("\n"),
            fragmentShader:
                [
                    'varying vec3 vPosition;',
                    'varying vec4 vColor;',

                    '#include <clipping_planes_pars_fragment>',
                    'void main()	{',
                    '#include <clipping_planes_fragment>',
                    '   gl_FragColor = vec4(vec3(vColor.xyz), 1.0);',
                    '}'
                ].join("\n"),
            depthTest: false,
            depthWrite: false,
            //transparent: true
            clipping: true,
            clippingPlanes: []
        }),

        edge: new THREE.ShaderMaterial({
            uniforms: {
                "edgeColor": { value: new THREE.Vector3(0, 0, 0) },
                "edgeAlpha": { value: 0.2 },
            },

            vertexShader:
                [
                    'varying vec3 vPosition;',
                    '#include <clipping_planes_pars_vertex>',
                    'void main()	{',
                    '#include <begin_vertex>',
                    '#include <project_vertex>',
                    '#include <clipping_planes_vertex>',
                    'vPosition = mvPosition.xyz;',
                    '}'
                ].join("\n"),
            fragmentShader:
                [
                    'varying vec3 vPosition;',
                    'uniform vec3 edgeColor;',
                    'uniform float edgeAlpha;',
                    '#include <clipping_planes_pars_fragment>',
                    'void main()	{',
                    '#include <clipping_planes_fragment>',
                    '   gl_FragColor = vec4(edgeColor, edgeAlpha);',
                    '}'
                ].join("\n"),
            transparent: true,
            flatShading: false,
            clipping: true,
            clippingPlanes: [],
            //blending: THREE.AdditiveBlending,
            //alphaTest: 1,
            depthWrite: true,
            //depthTest: true
        }),

        SSAO: new THREE.ShaderMaterial({
            uniforms: {

                "tDiffuse": { type: "t", value: null },
                "tDepth": { type: "t", value: null },
                "size": { type: "v2", value: new THREE.Vector2(512, 512) },
                "cameraNear": { type: "f", value: 1 },
                "cameraFar": { type: "f", value: 1000 },
                "onlyAO": { type: "i", value: 0 },
                "aoClamp": { type: "f", value: 0.5 },
                "lumInfluence": { type: "f", value: 0.5 }

            },

            vertexShader: [

                "varying vec2 vUv;",

                "void main() {",

                "vUv = uv;",

                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

                "}"

            ].join("\n"),

            fragmentShader: [

                "uniform float cameraNear;",
                "uniform float cameraFar;",

                "uniform bool onlyAO;",      // use only ambient occlusion pass?

                "uniform vec2 size;",        // texture width, height
                "uniform float aoClamp;",    // depth clamp - reduces haloing at screen edges

                "uniform float lumInfluence;",  // how much luminance affects occlusion

                "uniform sampler2D tDiffuse;",
                "uniform sampler2D tDepth;",

                "varying vec2 vUv;",

                // "#define PI 3.14159265",
                "#define DL 2.399963229728653",  // PI * ( 3.0 - sqrt( 5.0 ) )
                "#define EULER 2.718281828459045",

                // helpers

                "float width = size.x;",   // texture width
                "float height = size.y;",  // texture height

                "float cameraFarPlusNear = cameraFar + cameraNear;",
                "float cameraFarMinusNear = cameraFar - cameraNear;",
                "float cameraCoef = 2.0 * cameraNear;",

                // user variables

                "const int samples = 8;",     // ao sample count
                "const float radius = 5.0;",  // ao radius

                "const bool useNoise = false;",      // use noise instead of pattern for sample dithering
                "const float noiseAmount = 0.0003;", // dithering amount

                "const float diffArea = 0.4;",   // self-shadowing reduction
                "const float gDisplace = 0.4;",  // gauss bell center


                // RGBA depth

                "float unpackDepth( const in vec4 rgba_depth ) {",

                "const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
                "float depth = dot( rgba_depth, bit_shift );",
                "return depth;",

                "}",

                // generating noise / pattern texture for dithering

                "vec2 rand( const vec2 coord ) {",

                "vec2 noise;",

                "if ( useNoise ) {",

                "float nx = dot ( coord, vec2( 12.9898, 78.233 ) );",
                "float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );",

                "noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );",

                "} else {",

                "float ff = fract( 1.0 - coord.s * ( width / 2.0 ) );",
                "float gg = fract( coord.t * ( height / 2.0 ) );",

                "noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;",

                "}",

                "return ( noise * 2.0  - 1.0 ) * noiseAmount;",

                "}",

                "float readDepth( const in vec2 coord ) {",

                // "return ( 2.0 * cameraNear ) / ( cameraFar + cameraNear - unpackDepth( texture2D( tDepth, coord ) ) * ( cameraFar - cameraNear ) );",
                "return cameraCoef / ( cameraFarPlusNear - unpackDepth( texture2D( tDepth, coord ) ) * cameraFarMinusNear );",


                "}",

                "float compareDepths( const in float depth1, const in float depth2, inout int far ) {",

                "float garea = 2.0;",                         // gauss bell width
                "float diff = ( depth1 - depth2 ) * 100.0;",  // depth difference (0-100)

                // reduce left bell width to avoid self-shadowing

                "if ( diff < gDisplace ) {",

                "garea = diffArea;",

                "} else {",

                "far = 1;",

                "}",

                "float dd = diff - gDisplace;",
                "float gauss = pow( EULER, -2.0 * dd * dd / ( garea * garea ) );",
                "return gauss;",

                "}",

                "float calcAO( float depth, float dw, float dh ) {",

                "float dd = radius - depth * radius;",
                "vec2 vv = vec2( dw, dh );",

                "vec2 coord1 = vUv + dd * vv;",
                "vec2 coord2 = vUv - dd * vv;",

                "float temp1 = 0.0;",
                "float temp2 = 0.0;",

                "int far = 0;",
                "temp1 = compareDepths( depth, readDepth( coord1 ), far );",

                // DEPTH EXTRAPOLATION

                "if ( far > 0 ) {",

                "temp2 = compareDepths( readDepth( coord2 ), depth, far );",
                "temp1 += ( 1.0 - temp1 ) * temp2;",

                "}",

                "return temp1;",

                "}",

                "void main() {",

                "vec2 noise = rand( vUv );",
                "float depth = readDepth( vUv );",

                "float tt = clamp( depth, aoClamp, 1.0 );",

                "float w = ( 1.0 / width )  / tt + ( noise.x * ( 1.0 - noise.x ) );",
                "float h = ( 1.0 / height ) / tt + ( noise.y * ( 1.0 - noise.y ) );",

                "float ao = 0.0;",

                "float dz = 1.0 / float( samples );",
                "float z = 1.0 - dz / 2.0;",
                "float l = 0.0;",

                "for ( int i = 0; i <= samples; i ++ ) {",

                "float r = sqrt( 1.0 - z );",

                "float pw = cos( l ) * r;",
                "float ph = sin( l ) * r;",
                "ao += calcAO( depth, pw * w, ph * h );",
                "z = z - dz;",
                "l = l + DL;",

                "}",

                "ao /= float( samples );",
                "ao = 1.0 - ao;",

                "vec3 color = texture2D( tDiffuse, vUv ).rgb;",

                "vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );",
                "float lum = dot( color.rgb, lumcoeff );",
                "vec3 luminance = vec3( lum );",

                "vec3 final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );",  // mix( color * ao, white, luminance )

                "if ( onlyAO ) {",

                "final = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );",  // ambient occlusion only

                "}",

                "gl_FragColor = vec4( final, 1.0 );",

                "}"

            ].join("\n")
        }),

        pick: new THREE.ShaderMaterial({
            uniforms: {
            },
            vertexShader:
                [
                    'attribute vec4 color;',
                    'varying vec4 vColor;',
                    'varying vec3 vPosition;',
                    '#include <clipping_planes_pars_vertex>',
                    'void main()	{',
                    '#include <begin_vertex>',
                    'vColor = color;',
                    '#include <project_vertex>',
                    '#include <clipping_planes_vertex>',
                    'vPosition = mvPosition.xyz;',
                    '}'
                ].join("\n"),
            fragmentShader:
                [
                    'varying vec3 vPosition;',
                    'varying vec4 vColor;',

                    '#include <clipping_planes_pars_fragment>',
                    'void main()	{',
                    '#include <clipping_planes_fragment>',
                    '   gl_FragColor = vec4(vec3(vColor.xyz), 1.0);',
                    '}'
                ].join("\n"),
            depthTest: false,
            depthWrite: false,
            //transparent: true
            clipping: true,
            clippingPlanes: []
        }),
    };

    var eventHandler = new VIZWeb3D.EventDispatcher(window, container);
    this.EventHandler = eventHandler;

    this.Load = 'Data.Loaded';
    this.Parse = 'Data.Parse';
    this.ParseType = 1;
    this.Check = function (url) {
        if (view.TRIAL) {
            let date = new Date(1688050800000); // 1231
            console.log(date.getTime());
            let currentDate = new Date();

            // if ((date.getTime() - currentDate.getTime()) > 0) {
                 scope.ParseType = 0;
                 eventHandler.dispatchEvent(this.Load);
            // }
            // else {
            //    scope.ParseType = 1;
            //    eventHandler.dispatchEvent(this.Parse);
            //}
        }
        else {
            var check = {
                parse: function (url) {
                    var result = $.ajax({
                        type: "GET",
                        url: url,
                        async: false
                    }).responseText;
                    return result;
                }
            };

            var result = check.parse(url);
            if (result) {
                var resultTmp = result.split('@');
                if (resultTmp[0].localeCompare('5') === 0) {
                    scope.ParseType = 0;
                    scope.SessionID = resultTmp[1];
                    scope.AliveTimer = setInterval(function () {
                        scope.Alive();
                    }, scope.AliveTime);
                    eventHandler.dispatchEvent(this.Load);
                }
                else {
                    scope.ParseType = 1;
                    eventHandler.dispatchEvent(this.Parse);
                }

            }
            else {
                scope.ParseType = 1;
                eventHandler.dispatchEvent(this.Parse);
            }
        }
    };
    this.Alive = function () {
        let check = {
            parse: function (url) {
                var result = $.ajax({
                    type: "GET",
                    url: url,
                    async: false,
                }).responseText;
                return result;
            }
        };
        let strAlive = view.Configuration.AUTHORITY_PARAMS.Data + '/?flag=4&id=5&msg=' + scope.SessionID;
        check.parse(strAlive);
    };
    this.Disconnect = function () {
        if (!view.TRIAL) {
            let check = {
                parse: function (url) {
                    var result = $.ajax({
                        type: "GET",
                        url: url,
                        async: true
                    }).responseText;
                    return result;
                }
            };
            let strDisconnect = view.Configuration.AUTHORITY_PARAMS.Data + '/?flag=4&id=3&msg=' + scope.SessionID;
            check.parse(strDisconnect);
        }
    };

    this.Nodes = [];
    this.Roots = [];

    this.TreeMap = new Map();

    this.PropertyMap = new Map();

    this.OutlineMap = new Map();

    this.EdgeMap = new Map();

    this.EdgeData = {};

    this.DataMap = new Map();

    this.Tag = function () {
        var tag = {
            SourceMesh: null,
            Select: false,
            Visible: true,
            Outline: {
                Base: null,
                New: null
            },
            Render: {
                ProcessMap : new Map(),
            },
        };
        return tag;
    };

    this.Body = function () {
        var data = {
            partId: -1,
            bodyId: -1,
            color: null,
            m_vnIdx: 0,
            m_triIdx: 0,
            m_nVtx: 0,
            m_nTris: 0,
            BBox: {
                min: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                max: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            },
            Tag: scope.Tag()
        };
        return data;
    };

    this.AddNodes = function (data) {
        var max = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i].pIndex === -1) {
                this.Roots.push(data[i]);
            }

            if (this.TreeMap.get(data[i].index) === undefined) {
                var value = {
                    data: data[i],
                    sub: []
                };

                this.TreeMap.set(data[i].index, value);

            }
            else {
                console.log("Error : Same Index!");
            }
            if (data[i].index > max)
                max = data[i].index;
        }

        // 구조 설정
        for (var i = 0; i < data.length; i++) {
            if (this.TreeMap.get(data[i].pIndex) !== undefined) {
                var parent = this.TreeMap.get(data[i].pIndex);
                parent.sub.push(data[i]);
            }
        }

        id_max = max;
    };

    function getProperty() {
        var Property = {
            nodeId: null,
            arrProperties: [],
            arrUserProperties: []
        };
        return Property;
    }

    this.AddProperty = function (properties) {
        for (var i = 0; i < properties.length; i++) {
            if (this.PropertyMap.get(properties[i].nodeId) === undefined) {
                var Property = scope.GetProperty();
                Property.nodeId = properties[i].nodeId;
                Property.arrProperties.push(properties[i]);
                this.PropertyMap.set(Property.nodeId, Property);
            }
            else {
                this.PropertyMap.get(data[i].nodeId).arrProperties.push(properties[i]);
            }
        }
    };

    this.AddUserProperty = function (properties) {
        for (var i = 0; i < properties.length; i++) {
            if (this.PropertyMap.get(properties[i].nodeId) === undefined) {
                var Property = getProperty();
                Property.nodeId = properties[i].nodeId;
                Property.arrUserProperties.push(properties[i]);
                this.PropertyMap.set(Property.nodeId, Property);
            }
            else {
                this.PropertyMap.get(properties[i].nodeId).arrUserProperties.push(properties[i]);
            }
        }
    };

    this.GetNode = function (id) {
        return this.TreeMap.get(id);
    };
    this.GetProperty = function (id) {
        return this.PropertyMap.get(id);
    };

    this.GetMaxID = function () {
        if (id_max === 0)
            return id_max;
        else
            return id_max + 1;
    };

    this.GetStartID = function () {
        if (id_start === 0)
            return id_start;
        else
            return id_start + 1;
    };

    this.ResetID = function () {
        id_start = id_max;
    };

    this.GetSubNodes = function (index) {
        if (index === -1) {
            return this.Roots;
        }
        else {
            return this.TreeMap.get(index).sub;
        }
    };

    this.GetNodePath = function (index, nodes) {
        var node = scope.TreeMap.get(index);
        //if (node.data.pIndex === -1)
        //    return;

        nodes.push(node.data);
        if (node.data.pIndex !== -1) {
            scope.GetNodePath(node.data.pIndex, nodes);
        }
    };

    //this.Select = function (index, obj, treeselect) {

    //    var movedata = function (source, target, body) {
    //        // 데이터 추출
    //        var indexes = source.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
    //        var positions = source.geometry.attributes.position.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);
    //        var normals = source.geometry.attributes.normal.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);

    //        var m_triIdx = target.geometry.index.array.length;
    //        var m_vnIdx = target.geometry.attributes.position.array.length;

    //        for (var i = 0; i < indexes.length; i++) {
    //            indexes[i] = indexes[i] - body.m_vnIdx / 3 + target.geometry.attributes.position.array.length / 3;
    //        }

    //        var newindexes = new Float32Array(target.geometry.index.array.length + body.m_nTris);
    //        var newpositions = new Float32Array(target.geometry.attributes.position.array.length + body.m_nVtx);
    //        var newnormals = new Float32Array(target.geometry.attributes.normal.array.length + body.m_nVtx);

    //        newindexes.set(target.geometry.index.array, 0);
    //        newindexes.set(indexes, target.geometry.index.array.length);
    //        newpositions.set(target.geometry.attributes.position.array, 0);
    //        newpositions.set(positions, target.geometry.attributes.position.array.length);
    //        newnormals.set(target.geometry.attributes.normal.array, 0);
    //        newnormals.set(normals, target.geometry.attributes.normal.array.length);

    //        var geometry = new THREE.BufferGeometry();
    //        dispose(target.geometry);
    //        target.geometry = geometry;

    //        target.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
    //        target.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
    //        target.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
    //        target.geometry.attributes.position.needsUpdate = true;
    //        target.geometry.attributes.normal.needsUpdate = true;
    //        target.geometry.computeBoundingSphere();

    //        // body 데이터 추가
    //        var newBody = scope.Body();
    //        newBody.partId = body.partId;
    //        newBody.bodyId = body.bodyId;
    //        newBody.color = body.color;
    //        newBody.m_nVtx = body.m_nVtx;
    //        newBody.m_nTris = body.m_nTris;
    //        newBody.m_vnIdx = m_vnIdx;
    //        newBody.m_triIdx = m_triIdx;
    //        newBody.BBox = body.BBox;
    //        newBody.Tag.Select = false;
    //        newBody.Tag.SourceMesh = null;

    //        target.userData.push(newBody);
    //    };

    //    var selectdata = function (mesh, body) {
    //        // 데이터 추출
    //        var indexes = mesh.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
    //        var positions = mesh.geometry.attributes.position.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);
    //        var normals = mesh.geometry.attributes.normal.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);

    //        var m_triIdx = selectMesh.geometry.index.array.length;
    //        var m_vnIdx = selectMesh.geometry.attributes.position.array.length;

    //        for (var i = 0; i < indexes.length; i++) {
    //            indexes[i] = indexes[i] - body.m_vnIdx / 3 + selectMesh.geometry.attributes.position.array.length / 3;
    //        }

    //        var newindexes = new Float32Array(selectMesh.geometry.index.array.length + body.m_nTris);
    //        var newpositions = new Float32Array(selectMesh.geometry.attributes.position.array.length + body.m_nVtx);
    //        var newnormals = new Float32Array(selectMesh.geometry.attributes.normal.array.length + body.m_nVtx);

    //        newindexes.set(selectMesh.geometry.index.array, 0);
    //        newindexes.set(indexes, selectMesh.geometry.index.array.length);
    //        newpositions.set(selectMesh.geometry.attributes.position.array, 0);
    //        newpositions.set(positions, selectMesh.geometry.attributes.position.array.length);
    //        newnormals.set(selectMesh.geometry.attributes.normal.array, 0);
    //        newnormals.set(normals, selectMesh.geometry.attributes.normal.array.length);


    //        selectMesh.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
    //        selectMesh.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
    //        selectMesh.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));

    //        selectMesh.geometry.attributes.position.needsUpdate = true;
    //        selectMesh.geometry.attributes.normal.needsUpdate = true;
    //        selectMesh.geometry.computeBoundingSphere();

    //        // body 데이터 추가
    //        var newBody = scope.Body();
    //        newBody.partId = body.partId;
    //        newBody.bodyId = body.bodyId;
    //        newBody.color = body.color;
    //        newBody.m_nVtx = body.m_nVtx;
    //        newBody.m_nTris = body.m_nTris;
    //        newBody.m_vnIdx = m_vnIdx;
    //        newBody.m_triIdx = m_triIdx;
    //        newBody.BBox = body.BBox;
    //        newBody.Tag.Select = true;
    //        newBody.Tag.SourceMesh = mesh.uuid;

    //        selectMesh.userData.push(newBody);
    //    };

    //    var updatedata = function (mesh, body) {
    //        var newindexes = new Float32Array(mesh.geometry.index.array.length - body.m_nTris);
    //        var newpositions = new Float32Array(mesh.geometry.attributes.position.array.length - body.m_nVtx);
    //        var newnormals = new Float32Array(mesh.geometry.attributes.normal.array.length - body.m_nVtx);

    //        newindexes.set(mesh.geometry.index.array.subarray(0, body.m_triIdx), 0);
    //        newindexes.set(mesh.geometry.index.array.subarray(body.m_triIdx + body.m_nTris, mesh.geometry.index.array.length), body.m_triIdx);
    //        newpositions.set(mesh.geometry.attributes.position.array.subarray(0, body.m_vnIdx), 0);
    //        newpositions.set(mesh.geometry.attributes.position.array.subarray(body.m_vnIdx + body.m_nVtx, mesh.geometry.attributes.position.array.length), body.m_vnIdx);
    //        newnormals.set(mesh.geometry.attributes.normal.array.subarray(0, body.m_vnIdx), 0);
    //        newnormals.set(mesh.geometry.attributes.normal.array.subarray(body.m_vnIdx + body.m_nVtx, mesh.geometry.attributes.normal.array.length), body.m_vnIdx);

    //        // update index value값 변경
    //        var cnt = 0;
    //        for (var i = body.m_triIdx; i < newindexes.length; i++ , cnt++) {
    //            newindexes[i] = newindexes[i] - body.m_nVtx / 3;

    //            if (newindexes[i] < 0 || newindexes[i] > newpositions.length - 1)
    //                console.log("");
    //        }

    //        var geometry = new THREE.BufferGeometry();
    //        dispose(mesh.geometry);
    //        mesh.geometry = geometry;
    //        mesh.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
    //        mesh.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
    //        mesh.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
    //        mesh.geometry.computeBoundingSphere();

    //        for (var i = mesh.userData.length - 1; i >= 0; i--) {
    //            if (mesh.userData[i].bodyId === body.bodyId) {
    //                mesh.userData.splice(i, 1);
    //            }
    //            else if (mesh.userData[i].m_triIdx > body.m_triIdx) {
    //                mesh.userData[i].m_triIdx = mesh.userData[i].m_triIdx - body.m_nTris;
    //                mesh.userData[i].m_vnIdx = mesh.userData[i].m_vnIdx - body.m_nVtx;
    //            }
    //        }
    //    };

    //    //var nStart = new Date().getTime();

    //    for (var i = 0; i < selectMesh.userData.length; i++) {
    //        var data = selectMesh.userData[i];
    //        var target = getMesh(obj, data.Tag.SourceMesh);
    //        movedata(selectMesh, target, data);
    //    }
    //    //var nEnd = new Date().getTime();
    //    //var nDiff = nEnd - nStart;
    //    //console.log("revert : " + nDiff + "ms");

    //    // SelectMesh 초기화
    //    clear_SelectMesh();

    //    //nStart = new Date().getTime();
    //    var Index = index * 1;

    //    var bodies = [];
    //    var bodyMap = new Map();
    //    getBodies(Index, bodies, bodyMap);
    //    //nEnd = new Date().getTime();
    //    //nDiff = nEnd - nStart;
    //    //console.log("getBodies : " + nDiff + "ms");

    //    //nStart = new Date().getTime();
    //    var datas = [];
    //    getDatas(obj, bodies, datas, bodyMap);
    //    //nEnd = new Date().getTime();
    //    //nDiff = nEnd - nStart;
    //    //console.log("getDatas : " + nDiff + "ms");

    //    //nStart = new Date().getTime();
    //    for (var i = 0; i < datas.length; i++) {
    //        // select
    //        var mesh = getMesh(obj, datas[i].mesh.uuid);
    //        selectdata(mesh, datas[i].body);
    //        // Mesh 및 Body 데이터 조정(원본)
    //        updatedata(mesh, datas[i].body);
    //    }
    //    //nEnd = new Date().getTime();
    //    //nDiff = nEnd - nStart;
    //    //console.log("selectdata : " + nDiff + "ms");

    //    // Clipping Update
    //    event.dispatchEvent(EVENT_TYPES.Data.Selected, { id: index, treeselect: treeselect });
    //};

    this.Show = function (index, obj, visible) {
        var movedata = function (source, target, body) {
            // 데이터 추출
            var indexes = source.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
            var positions = source.geometry.attributes.position.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);
            var normals = source.geometry.attributes.normal.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);

            var m_triIdx = target.geometry.index.array.length;
            var m_vnIdx = target.geometry.attributes.position.array.length;

            for (var i = 0; i < indexes.length; i++) {
                indexes[i] = indexes[i] - body.m_vnIdx / 3 + target.geometry.attributes.position.array.length / 3;
            }

            var newindexes = new Float32Array(target.geometry.index.array.length + body.m_nTris);
            var newpositions = new Float32Array(target.geometry.attributes.position.array.length + body.m_nVtx);
            var newnormals = new Float32Array(target.geometry.attributes.normal.array.length + body.m_nVtx);

            newindexes.set(target.geometry.index.array, 0);
            newindexes.set(indexes, target.geometry.index.array.length);
            newpositions.set(target.geometry.attributes.position.array, 0);
            newpositions.set(positions, target.geometry.attributes.position.array.length);
            newnormals.set(target.geometry.attributes.normal.array, 0);
            newnormals.set(normals, target.geometry.attributes.normal.array.length);

            var geometry = new THREE.BufferGeometry();
            dispose(target.geometry);
            target.geometry = geometry;

            target.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
            target.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
            target.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
            target.geometry.attributes.position.needsUpdate = true;
            target.geometry.attributes.normal.needsUpdate = true;
            target.geometry.computeBoundingSphere();

            // body 데이터 추가
            var newBody = scope.Body();
            newBody.partId = body.partId;
            newBody.bodyId = body.bodyId;
            newBody.color = body.color;
            newBody.m_nVtx = body.m_nVtx;
            newBody.m_nTris = body.m_nTris;
            newBody.m_vnIdx = m_vnIdx;
            newBody.m_triIdx = m_triIdx;
            newBody.BBox = body.BBox;
            //newBody.Tag.Select = false;
            newBody.Tag.SourceMesh = null;

            target.userData.push(newBody);
        };

        var disabledata = function (mesh, body) {
            // 데이터 추출
            var indexes = mesh.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
            var positions = mesh.geometry.attributes.position.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);
            var normals = mesh.geometry.attributes.normal.array.slice(body.m_vnIdx, body.m_vnIdx + body.m_nVtx);

            var m_triIdx = disableMesh.geometry.index.array.length;
            var m_vnIdx = disableMesh.geometry.attributes.position.array.length;

            for (var i = 0; i < indexes.length; i++) {
                indexes[i] = indexes[i] - body.m_vnIdx / 3 + disableMesh.geometry.attributes.position.array.length / 3;
            }

            var newindexes = new Float32Array(disableMesh.geometry.index.array.length + body.m_nTris);
            var newpositions = new Float32Array(disableMesh.geometry.attributes.position.array.length + body.m_nVtx);
            var newnormals = new Float32Array(disableMesh.geometry.attributes.normal.array.length + body.m_nVtx);

            newindexes.set(disableMesh.geometry.index.array, 0);
            newindexes.set(indexes, disableMesh.geometry.index.array.length);
            newpositions.set(disableMesh.geometry.attributes.position.array, 0);
            newpositions.set(positions, disableMesh.geometry.attributes.position.array.length);
            newnormals.set(disableMesh.geometry.attributes.normal.array, 0);
            newnormals.set(normals, disableMesh.geometry.attributes.normal.array.length);


            disableMesh.geometry.setIndex(new THREE.Uint32BufferAttribute(newindexes, 1));
            disableMesh.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
            disableMesh.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));

            disableMesh.geometry.attributes.position.needsUpdate = true;
            disableMesh.geometry.attributes.normal.needsUpdate = true;
            disableMesh.geometry.computeBoundingSphere();

            // body 데이터 추가
            var newBody = scope.Body();
            newBody.partId = body.partId;
            newBody.bodyId = body.bodyId;
            newBody.color = body.color;
            newBody.m_nVtx = body.m_nVtx;
            newBody.m_nTris = body.m_nTris;
            newBody.m_vnIdx = m_vnIdx;
            newBody.m_triIdx = m_triIdx;
            newBody.BBox = body.BBox;
            //newBody.Tag.Select = true;
            newBody.Tag.Visible = false;
            newBody.Tag.SourceMesh = mesh.uuid;

            disableMesh.userData.push(newBody);
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

        var Index = index * 1;

        var bodies = [];
        getBodies(Index, bodies);

        var datas = [];
        getDatas(obj, bodies, datas);

        if (visible) {

            for (var i = disableMesh.userData.length - 1; i >= 0; i--) {
                var data = disableMesh.userData[i];

                var isMatch = function (element) {
                    return element.body.bodyId === data.bodyId;
                };
                var find = datas.findIndex(isMatch);

                if (find !== -1) {
                    var target = getMesh(obj, data.Tag.SourceMesh);
                    movedata(disableMesh, target, data);

                    // Mesh 및 Body 데이터 조정(원본)
                    updatedata(disableMesh, datas[find].body);
                }
            }
        }
        else {
            for (var i = 0; i < datas.length; i++) {
                // disable
                var mesh = getMesh(obj, datas[i].mesh.uuid);
                disabledata(mesh, datas[i].body);
                // Mesh 및 Body 데이터 조정(원본)
                updatedata(mesh, datas[i].body);
            }
        }
    };

    this.Select_v2 = function (index, obj, treeselect) {

        var deselect = function (source, body, bXray) {
            for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                source.geometry.attributes.color.array[i] = body.color.R;
                source.geometry.attributes.color.array[i + 1] = body.color.G;
                source.geometry.attributes.color.array[i + 2] = body.color.B;
                if (bXray)
                    source.geometry.attributes.color.array[i + 3] = 0.1 * 255;
                else
                    source.geometry.attributes.color.array[i + 3] = body.color.A;
            }
            source.geometry.attributes.color.needsUpdate = true;
            body.Tag.Select = false;
        };

        var bXray = view.Control.Model.RenderMode === RENDER_MODES.Xray ? true : false;

        for (var i = selectDatas.length - 1; i >= 0; i--) {
            // deselect
            var mesh = getMesh(obj, selectDatas[i].mesh);
            deselect(mesh, selectDatas[i].body, bXray);
            selectDatas.splice(i, 1);
        }

        var Index = index * 1;

        if (view.Configuration.Model.Selection.Unit === SELECT_UNIT.Part) {
            var node = scope.GetNode(Index);
            if (node.data.type === ENTITY_TYPES.EntBody)
                Index = node.data.pIndex;
        }

        var bodies = [];
        var bodyMap = new Map();
        getBodies(Index, bodies, bodyMap);
        var datas = [];
        getDatas(obj, bodies, datas, bodyMap);

        var outline = {
            cntIndex: 0,
            count: 0,
            bodies: [],
            indices: [],
            positions: [],
            normals: []
        };

        var select = function (source, body) {
            for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                source.geometry.attributes.color.array[i] = colSelect.r;
                source.geometry.attributes.color.array[i + 1] = colSelect.g;
                source.geometry.attributes.color.array[i + 2] = colSelect.b;
                source.geometry.attributes.color.array[i + 3] = colSelect.a * 255;
            }
            source.geometry.attributes.color.needsUpdate = true;

            body.Tag.Select = true;

            data = UserData();
            data.body = body;
            data.mesh = source.uuid;
            selectDatas.push(data);
        };

        for (var i = 0; i < datas.length; i++) {
            // select
            var mesh = getMesh(obj, datas[i].mesh.uuid);
            select(mesh, datas[i].body);
        }
        //if(0)
        setOutlineHelper(obj);

        // Clipping Update
        //event.dispatchEvent(EVENT_TYPES.Data.Selected, { id: index, treeselect: treeselect });
        eventHandler.dispatchEvent(EVENT_TYPES.Data.Selected, { id: Index, treeselect: treeselect });
    };

    this.DeselectAll = function (obj) {
        var deselect = function (source, body, bXray) {
            for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                source.geometry.attributes.color.array[i] = body.color.R;
                source.geometry.attributes.color.array[i + 1] = body.color.G;
                source.geometry.attributes.color.array[i + 2] = body.color.B;
                if (bXray)
                    source.geometry.attributes.color.array[i + 3] = 0.1 * 255;
                else
                    source.geometry.attributes.color.array[i + 3] = body.color.A;
            }
            source.geometry.attributes.color.needsUpdate = true;
            body.Tag.Select = false;
        };

        var bXray = view.Control.Model.RenderMode === RENDER_MODES.Xray ? true : false;

        for (var i = selectDatas.length - 1; i >= 0; i--) {
            // deselect
            var mesh = getMesh(obj, selectDatas[i].mesh);
            deselect(mesh, selectDatas[i].body, bXray);
            selectDatas.splice(i, 1);
        }

        setOutlineHelper(obj);

        eventHandler.dispatchEvent(EVENT_TYPES.Data.Deselect_All);
    };

    this.Show_v2 = function (index, obj, visible, remove) {

        var show = function (source, data) {
            source.geometry.index.array.set(data.tmp, data.body.m_triIdx);
            source.geometry.index.needsUpdate = true;
            data.body.Tag.Visible = true;
        };

        var Index = index * 1;

        var bodies = [];
        var bodyMap = new Map();
        getBodies(Index, bodies, bodyMap);
        var datas = [];
        getDatas(obj, bodies, datas, bodyMap);

        var hide = function (source, body) {
            var indexes = source.geometry.index.array.slice(body.m_triIdx, body.m_triIdx + body.m_nTris);
            for (var i = body.m_triIdx; i < body.m_triIdx + body.m_nTris; i++) {
                source.geometry.index.array[i] = 0;
            }
            source.geometry.index.needsUpdate = true;
            body.Tag.Visible = false;
            data = UserData();
            data.body = body;
            data.mesh = source.uuid;
            data.tmp = indexes;
            hideDatas.push(data);
        };

        if (visible) {
            for (var j = hideDatas.length - 1; j >= 0; j--) {
                if (bodyMap.get(hideDatas[j].body.bodyId) !== undefined) {
                    var mesh = getMesh(obj, hideDatas[j].mesh);
                    show(mesh, hideDatas[j]);
                }
                //var data = scope.DataMap.get(hideDatas[j].body.bodyId);
                //if (data !== undefined)
                //    show(data.mesh, hideDatas[j]);
            }
            
            for (var j = hideDatas.length - 1; j >= 0; j--) {
                if (bodyMap.get(hideDatas[j].body.bodyId) !== undefined) {
                    hideDatas.splice(j, 1);
                }
            }
        }
        else {
            for (var i = 0; i < datas.length; i++) {
                var mesh = getMesh(obj, datas[i].mesh.uuid);
                hide(mesh, datas[i].body);
                //var data = scope.DataMap.get(datas[i].body.bodyId);
                //if (data !== undefined)
                //    hide(data.mesh, data.data);
            }
        }

        setOutlineHelper(obj);
    };

    this.SetXray = function (obj) {

        var xray = function (source, body) {
            for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                source.geometry.attributes.color.array[i] = colSelect.r;
                source.geometry.attributes.color.array[i + 1] = colSelect.g;
                source.geometry.attributes.color.array[i + 2] = colSelect.b;
                source.geometry.attributes.color.array[i + 3] = colSelect.a * 255;
            }
            source.geometry.attributes.color.needsUpdate = true;

            body.Tag.Select = true;

            data = UserData();
            data.body = body;
            data.mesh = source.uuid;
            selectDatas.push(data);
        };

        for (var i = 0; i < datas.length; i++) {
            // select
            var mesh = getMesh(obj, datas[i].mesh.uuid);
            select(mesh, datas[i].body);
        }

        // Clipping Update
        eventHandler.dispatchEvent(EVENT_TYPES.Data.Selected, { id: index, treeselect: treeselect });
    };

    this.SetSelectionOutline = function (obj, bReset) {
        function setOutline(value, key, map) {
            value.material = mat;
            value.material.needsUpdate = true;
            for (var j = 0; j < value.userData.length; j++) {
                var data = value.userData[j];
                if (!data.Tag.Select) {
                    if (bReset) {
                        value.geometry.index.array.set(data.Tag.Outline.Base, data.m_triIdx);
                    }
                    else
                        value.geometry.index.array.set(data.Tag.Outline.New, data.m_triIdx);

                    value.geometry.index.needsUpdate = true;
                }
            }
        }

        this.OutlineMap.forEach(setOutline);
    };

    this.SetSelectionOutline = function (obj, bReset, mat) {
        function setOutline(value, key, map) {
            value.mesh.material = mat;
            value.mesh.material.needsUpdate = true;
            for (var j = 0; j < value.mesh.userData.length; j++) {
                var data = value.mesh.userData[j];
                if (!data.Tag.Select) {
                    if (bReset) {
                        value.mesh.geometry.index.array.set(data.Tag.Outline.Base, data.m_triIdx);
                    }
                    else
                        value.mesh.geometry.index.array.set(data.Tag.Outline.New, data.m_triIdx);

                    value.mesh.geometry.index.needsUpdate = true;
                }
            }
        }

        this.OutlineMap.forEach(setOutline);
    };

    this.UpdateSelectionObjectMaterial = function (mat) {
        function setMaterial(value, key, map) {
            value.mesh.material = mat;
            value.mesh.material.needsUpdate = true;
        }

        this.OutlineMap.forEach(setMaterial);
    };

    this.UpdateObjectStatus = function (obj, bReset, bSelectChange, bSelectColor, mat, color) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh) {
                obj.children[i].material = mat;
                obj.children[i].material.needsUpdate = true;
                for (var j = 0; j < obj.children[i].userData.length; j++) {
                    var data = obj.children[i].userData[j];
                    if (!bSelectChange && data.Tag.Select)
                        continue;

                    var setcolor = function (source, body, color) {
                        for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                            source.geometry.attributes.color.array[i] = color.r;
                            source.geometry.attributes.color.array[i + 1] = color.g;
                            source.geometry.attributes.color.array[i + 2] = color.b;
                            source.geometry.attributes.color.array[i + 3] = color.a * 255;
                        }
                        source.geometry.attributes.color.needsUpdate = true;
                    };

                    if (!bReset)
                        if (bSelectColor && data.Tag.Select)
                            setcolor(obj.children[i], data, colSelect);
                        else
                            setcolor(obj.children[i], data, color);
                    else {
                        setcolor(obj.children[i], data, { r: data.color.R, g: data.color.G, b: data.color.B, a: data.color.A / 255 });
                    }
                }
            }
            else {
                scope.UpdateObjectStatus(obj.children[i], bReset, bSelectChange, bSelectColor, mat, color);
            }
        }
    };

    this.ResetObjectStatus = function (meshs, mat) {
        for (var i = 0; i < meshs.length; i++) {

            meshs[i].material = mat;
            meshs[i].material.needsUpdate = true;
            for (var j = 0; j < meshs[i].userData.length; j++) {
                var data = meshs[i].userData[j];

                var setcolor = function (source, body, color) {
                    for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                        source.geometry.attributes.color.array[i] = color.r;
                        source.geometry.attributes.color.array[i + 1] = color.g;
                        source.geometry.attributes.color.array[i + 2] = color.b;
                        source.geometry.attributes.color.array[i + 3] = color.a * 255;
                    }
                    source.geometry.attributes.color.needsUpdate = true;
                };

                if (data.Tag.Select)
                    setcolor(meshs[i], data, colSelect);
                else
                    setcolor(meshs[i], data, { r: data.color.R, g: data.color.G, b: data.color.B, a: data.color.A / 255 });
            }
        }
    };

    this.UpdateObjectMaterial = function (obj, mat) {
        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh) {
                obj.children[i].material = mat;
                obj.children[i].material.needsUpdate = true;
            }
            else {
                scope.UpdateObjectMaterial(obj.children[i], mat);
            }
        }
    };


    this.SetOption = function (parameters) {
        if (parameters === undefined) parameters = {};
        //colSelect = parameters.hasOwnProperty("Color") ? parameters["Color"].Select : colSelect;
        colSelect = parameters.hasOwnProperty("Selection") ? parameters["Selection"].Color : colSelect;
        var colEdge = parameters.hasOwnProperty("Edge") ? parameters["Edge"].Color : colEdge;

        //enableLineSelection = parameters.hasOwnProperty("LineSelection") ? parameters["LineSelection"].Enable : enableLineSelection;
        //colLineSelection = parameters.hasOwnProperty("LineSelection") ? parameters["LineSelection"].Color : colLineSelection;
        enableLineSelection = parameters.hasOwnProperty("Selection") ? parameters["Selection"].Line.Enable : enableLineSelection;
        colLineSelection = parameters.hasOwnProperty("Selection") ? parameters["Selection"].Line.Color : colLineSelection;
        widthLineSelection = parameters.hasOwnProperty("LineSelection") ? parameters["LineSelection"].Line.Width : widthLineSelection;
        //scope.Materials.outline_edge.uniforms['edgeColor'].value = new THREE.Color(colLineSelection.r, colLineSelection.g, colLineSelection.b);
        //var color = new THREE.Color(colLineSelection.r / 255, colLineSelection.g / 255, colLineSelection.b / 255);
        //var vColor = new THREE.Vector3(colLineSelection.r / 255.0, colLineSelection.g / 255.0, colLineSelection.b / 255.0);
        //var vColor = new Float[colLineSelection.r / 255, colLineSelection.g / 255, colLineSelection.b / 255];

        var color = new THREE.Color(colLineSelection.r / 255, colLineSelection.g / 255, colLineSelection.b / 255);

        scope.Materials.outline_select.uniforms['edgeColor'].value = color;
        scope.Materials.outline_select.uniforms['edgeColorR'].value = color.r;
        scope.Materials.outline_select.uniforms['edgeColorG'].value = color.g;
        scope.Materials.outline_select.uniforms['edgeColorB'].value = color.b;

        scope.Materials.outline_select.uniforms['edgeAlpha'].value = colEdge.a;
        scope.Materials.outline_select.uniforms['edgeWidth'].value = widthLineSelection;

        color = new THREE.Color(colEdge.r / 255, colEdge.g / 255, colEdge.b / 255);
        
        scope.Materials.outline_edge.uniforms['edgeColor'].value = color;
        scope.Materials.outline_edge.uniforms['edgeColorR'].value = color.r;
        scope.Materials.outline_edge.uniforms['edgeColorG'].value = color.g;
        scope.Materials.outline_edge.uniforms['edgeColorB'].value = color.b;


        scope.Materials.outline_edge.uniforms['edgeAlpha'].value = colEdge.a;
        scope.Materials.outline_edge.uniforms['edgeWidth'].value = widthLineSelection;

        colorEdge = parameters.hasOwnProperty("Edge") ? parameters["Edge"].Color : colorEdge;
        //var vColor2 = new THREE.Vector3(colorEdge.r / 255, colorEdge.g / 255, colorEdge.b / 255);
        //scope.Materials.edge.uniforms['edgeColor'].value = vColor2;
        scope.Materials.edge.uniforms['edgeColor'].value = new THREE.Color(colorEdge.r / 255, colorEdge.g / 255, colorEdge.b / 255);
        scope.Materials.edge.uniforms['edgeAlpha'].value = colorEdge.a;
    };

    this.SetHiddenEdgeColor = function (bReset) {
        if (!bReset) {
            //scope.Materials.edge.uniforms['edgeColor'].value = new THREE.Color(colorEdge.r, colorEdge.g, colorEdge.b);
            //scope.Materials.edge.uniforms['edgeAlpha'].value = 0.12;
            scope.Materials.edge.uniforms['edgeColor'].value = new THREE.Color(colorEdge.r, colorEdge.g, colorEdge.b);
            //scope.Materials.edge.uniforms['edgeColor'].value = new THREE.Color(20, 20, 20);
            scope.Materials.edge.uniforms['edgeAlpha'].value = 0.15;
            //scope.Materials.edge.uniforms['edgeAlpha'].value = 0.1;
        }
        else {
            scope.Materials.edge.uniforms['edgeColor'].value = new THREE.Color(colorEdge.r, colorEdge.g, colorEdge.b);
            scope.Materials.edge.uniforms['edgeAlpha'].value = colorEdge.a;
        }
    };

    this.SetBasicShaderDepthTest = function (enable) {
        scope.Materials.basic.depthTest = enable;
        scope.Materials.basic.depthWrite = enable;
        scope.Materials.edge.depthTest = enable;
        scope.Materials.edge.depthWrite = enable;
    };

    this.GetEdgeColor = function () {
        return colLineSelection;
    };

    this.GetHiddenEdgeColor = function () {
        return colorEdge;
    };

    this.GetIntersections = function (event) {
        var mouse = new THREE.Vector2();

        var rect = view.ViewSize();

        //mouse.set(
        //    [2 * ((event.clientX - rect.left) / rect.width) - 1, 1 - 2 * ((event.clientY - rect.top) / rect.height)]
        //);

        mouse.set(
            2 * ((event.clientX - rect.left) / rect.width) - 1,
            1 - 2 * ((event.clientY - rect.top) / rect.height)
            //event.clientX / rect.width * 2 - 1,
            //-(event.clientY / rect.height) * 2 + 1
        );
        var _TargetMeshes = [];

        clipInfo = view.Clipping.GetClipInfo();

        getHitTestNode(objModel, event.x, event.y, mouse, _TargetMeshes);

        if (camera.isPerspectiveCamera) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            vector = vector.unproject(camera);
            var tmp = vector.sub(camera.position).normalize();
            raycaster = new THREE.Raycaster(camera.position, tmp);
        }
        else {
            var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            origin = origin.unproject(camera);

            var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            raycaster = new THREE.Raycaster();
            raycaster.set(origin, direction);
        }

        if (_TargetMeshes.length > 0) {
            var intersects = raycaster.intersectObjects(_TargetMeshes, true);

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
    };

    this.GetIntersectionsByID = function (id) {
        var mouse = new THREE.Vector2();
        var rect = view.ViewSize();
        mouse.set(
            2 * ((event.clientX - rect.left) / rect.width) - 1,
            1 - 2 * ((event.clientY - rect.top) / rect.height)
        );

        var datas = scope.GetData(id);
        var _TargetMeshes = [];
        for (var i = 0; i < datas.length; i++) {
            _TargetMeshes.push(datas[i].mesh);
        }
        clipInfo = view.Clipping.GetClipInfo();
        if (camera.isPerspectiveCamera) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            vector = vector.unproject(camera);
            var tmp = vector.sub(camera.position).normalize();
            raycaster = new THREE.Raycaster(camera.position, tmp);
        }
        else {
            var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            origin = origin.unproject(camera);

            var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            raycaster = new THREE.Raycaster();
            raycaster.set(origin, direction);
        }

        if (_TargetMeshes.length > 0) {
            var intersects = raycaster.intersectObjects(_TargetMeshes, true);
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
    };

    this.GetIntersectionsByMesh = function (mouse, mesh) {
        var _TargetMeshes = [];
        _TargetMeshes.push(mesh);

        //var mouse = scope.GetMousePos(event);
        
        clipInfo = view.Clipping.GetClipInfo();
        if (camera.isPerspectiveCamera) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            vector = vector.unproject(camera);
            var tmp = vector.sub(camera.position).normalize();
            raycaster = new THREE.Raycaster(camera.position, tmp);
        }
        else {
            var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            origin = origin.unproject(camera);

            var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            raycaster = new THREE.Raycaster();
            raycaster.set(origin, direction);
        }

        if (_TargetMeshes.length > 0) {
            var intersects = raycaster.intersectObjects(_TargetMeshes, true);
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
    };

    this.GetMousePos = function (event) {
        var mouse = new THREE.Vector2();

        var rect = view.ViewSize();

        mouse.set(
            2 * ((event.clientX - rect.left) / rect.width) - 1,
            1 - 2 * ((event.clientY - rect.top) / rect.height)
            //event.clientX / rect.width * 2 - 1,
            //-(event.clientY / rect.height) * 2 + 1
        );

        return mouse;
    };

    this.GetMousePos_1 = function (x, y) {
        var mouse = new THREE.Vector2();

        var rect = view.ViewSize();

        mouse.set(
            2 * ((x - rect.left) / rect.width) - 1,
            1 - 2 * ((y - rect.top) / rect.height)
            //event.clientX / rect.width * 2 - 1,
            //-(event.clientY / rect.height) * 2 + 1
        );

        return mouse;
    };

    this.Dispose = function (o) {
        dispose(o);
    };

    this.GetParent = function () {
        return view;
    };

    this.UUIDv4 = function b(
        a // placeholder
    ) {
        return a // if the placeholder was passed, return
            ? ( // a random number from 0 to 15
                a ^ // unless b is 8,
                Math.random() // in which case
                * 16 // a random number from
                >> a / 4 // 8 to 11
            ).toString(16) // in hexadecimal
            : ( // or otherwise a concatenated string:
                [1e7] + // 10000000 +
                -1e3 + // -1000 +
                -4e3 + // -4000 +
                -8e3 + // -80000000 +
                -1e11 // -100000000000,
            ).replace( // replacing
                /[018]/g, // zeroes, ones, and eights with
                b // random hex digits
            );
    };
    // Hide Node 복원(Geometry의 Index 정보가 수정된것을 복구)
    this.RestoreHideData = function (objModel) {
        for (var j = hideDatas.length - 1; j >= 0; j--) {
            var mesh = getMesh(objModel, hideDatas[j].mesh);
            var data = hideDatas[j];
                mesh.geometry.index.array.set(data.tmp, data.body.m_triIdx);
        }
    };

    this.ResetHideData = function (objModel) {
        // Hide Node 적용
        for (var j = hideDatas.length - 1; j >= 0; j--) {
            var mesh = getMesh(objModel, hideDatas[j].mesh);
            var data = hideDatas[j];
            for (var i = data.body.m_triIdx; i < data.body.m_triIdx + data.body.m_nTris; i++) {
                mesh.geometry.index.array[i] = 0;
            }
        }
    };

    this.SetEdgeData = function (mesh, thresholdAngle, facenormal, objEdge) {
        thresholdAngle = (thresholdAngle !== undefined) ? thresholdAngle : 1;
        // buffer
        var vertices = [];
        // helper variables
        var thresholdDot = Math.cos((Math.PI * 2 / 360) * thresholdAngle);
        var key, keys = ['a', 'b', 'c'];

        for (var d = 0; d < mesh.userData.length; d++) {
            var edge = [0, 0], edges = {}, edge1, edge2;
            var data = mesh.userData[d];
            //if (data.bodyId === 134)
            //    console.log("");
            //EdgeDataMap
            // prepare source geometry
            var indexes = mesh.geometry.index.array.slice(data.m_triIdx, data.m_triIdx + data.m_nTris);
            var positions = mesh.geometry.attributes.position.array.slice(data.m_vnIdx, data.m_vnIdx + data.m_nVtx);

            for (var k = 0; k < indexes.length; k++) {
                indexes[k] = indexes[k] - data.m_vnIdx / 3;
                if (indexes[k] < 0)
                    return;
            }
            var geometry = new THREE.BufferGeometry();
            geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
            geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            var geometry2;
            if (geometry.isBufferGeometry) {
                geometry2 = new THREE.Geometry(); 
                geometry2.fromBufferGeometry(geometry);
            } else {
                geometry2 = geometry.clone();
            }

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
                        edges[key] = { index1: edge[0], index2: edge[1], face1: i, face2: undefined };
                    } else {
                        edges[key].face2 = i;
                    }
                }
            }

            // generate vertices
            for (key in edges) {
                var e = edges[key];

                if (e.face2 === undefined) {
                    if (data.vertices === undefined)
                        data.vertices = [];

                    var vertex = sourceVertices[e.index1];
                    data.vertices.push(vertex.x, vertex.y, vertex.z);
                    vertices.push(vertex.x, vertex.y, vertex.z);

                    vertex = sourceVertices[e.index2];
                    data.vertices.push(vertex.x, vertex.y, vertex.z);
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
                            if (data.vertices === undefined)
                                data.vertices = [];

                            var vertex = sourceVertices[e.index1];
                            data.vertices.push(vertex.x, vertex.y, vertex.z);
                            vertices.push(vertex.x, vertex.y, vertex.z);

                            vertex = sourceVertices[e.index2];
                            data.vertices.push(vertex.x, vertex.y, vertex.z);
                            vertices.push(vertex.x, vertex.y, vertex.z);
                        }
                    }
                }
            }

            var result = new THREE.BufferGeometry();
            result.addAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3));
            var meshEdge = new THREE.LineSegments(result, scope.Materials.edge);
            var datas = [];
            datas.push(data);
            meshEdge.userData = datas;
            data.edge = meshEdge;
            data.edge.visible = data.Tag.Visible;
            objEdge.add(meshEdge);
        }
    };

    this.SetEdgeData_v2 = function (mesh, thresholdAngle, facenormal, objEdge) {
        thresholdAngle = (thresholdAngle !== undefined) ? thresholdAngle : 1;

        // helper variables
        var thresholdDot = Math.cos((Math.PI * 2 / 360) * thresholdAngle);
        var key, keys = ['a', 'b', 'c'];

        for (var d = 0; d < mesh.userData.length; d++) {
            // buffer
            var vertices = [];
            var edge = [0, 0], edges = {}, edge1, edge2;
            var data = mesh.userData[d];

            if (data.vertices === undefined)
                data.vertices = [];

            //EdgeDataMap
            // prepare source geometry
            var indexes = mesh.geometry.index.array.slice(data.m_triIdx, data.m_triIdx + data.m_nTris);
            var positions = mesh.geometry.attributes.position.array.slice(data.m_vnIdx, data.m_vnIdx + data.m_nVtx);

            for (var k = 0; k < indexes.length; k++) {
                indexes[k] = indexes[k] - data.m_vnIdx / 3;
            }
            var geometry = new THREE.BufferGeometry();
            geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
            geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            var geometry2;
            if (geometry.isBufferGeometry) {
                geometry2 = new THREE.Geometry();
                geometry2.fromBufferGeometry(geometry);
            } else {
                geometry2 = geometry.clone();
            }

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
                        edges[key] = { index1: edge[0], index2: edge[1], face1: i, face2: undefined };
                    } else {
                        edges[key].face2 = i;
                    }
                }
            }

            // generate vertices
            for (key in edges) {
                var e = edges[key];

                if (e.face2 === undefined) {
                    if (data.vertices === undefined)
                        data.vertices = [];

                    var vertex = sourceVertices[e.index1];
                    data.vertices.push(vertex.x, vertex.y, vertex.z);
                    vertices.push(vertex.x, vertex.y, vertex.z);

                    vertex = sourceVertices[e.index2];
                    data.vertices.push(vertex.x, vertex.y, vertex.z);
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
                            if (data.vertices === undefined)
                                data.vertices = [];

                            var vertex = sourceVertices[e.index1];
                            data.vertices.push(vertex.x, vertex.y, vertex.z);
                            vertices.push(vertex.x, vertex.y, vertex.z);

                            vertex = sourceVertices[e.index2];
                            data.vertices.push(vertex.x, vertex.y, vertex.z);
                            vertices.push(vertex.x, vertex.y, vertex.z);
                        }
                    }
                }
            }

            if (scope.EdgeData[data.bodyId] === undefined) {
                scope.EdgeData[data.bodyId] = vertices;
            }
            else {
                scope.EdgeData[data.bodyId].push(vertices);
            }
        }
    };

    this.CreateEdgeMesh = function (objEdge, objModel) {
        var vertices = [];
        function add_vertex(x, y, z) {
            vertices.push(x, y, z);
        }
        var datas = [];
        getAllDatas(objModel, datas);

        for (var d = 0; d < datas.length; d++) {
            var data = datas[d];
            if (data.body.Tag.Visible) {
                for (var i = 0; i < data.body.vertices.length; i = i + 3) {
                    add_vertex(data.body.vertices[i], data.body.vertices[i + 1], data.body.vertices[i + 2]);
                }
                //vertices = vertices.concat(data.body.vertices);
            }
        }
        
        for (var i = 0; i < objEdge.children.length; i++) {
            dispose(objEdge.children[i]);
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeBoundingSphere();

        var meshEdge = new THREE.LineSegments(geometry, scope.Materials.edge);
        objEdge.add(meshEdge);
    };

    this.GetMesh = function (obj, uuid) {
        return getMesh(obj, uuid);
    };

    this.ShowEdge = function (Index, obj) {
        var bodies = [];
        var bodyMap = new Map();
        getBodies(Index, bodies, bodyMap);
        var datas = [];
        getDatas(obj, bodies, datas, bodyMap);

        for (var i = 0; i < datas.length; i++) {
            if (datas[i].body.Tag.Visible)
                datas[i].body.edge.visible = true;
            else
                datas[i].body.edge.visible = false;
        }
    };

    this.ShowEdge_v2 = function (objEdge, objModel) {
        scope.CreateEdgeMesh(objEdge, objModel);
    };

    this.GetMesh = function (uuid) {
        var result = [];

        var obj = view.Control.Model.Object;

        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i] instanceof THREE.Mesh
                || obj.children[i] instanceof THREE.LineSegments) {
                if (obj.children[i].uuid.localeCompare(uuid) === 0) {
                    result.push(obj.children[i]);
                    break;
                }
            }
            else {
                getMesh2(obj.children[i], uuid, result);
            }
        }

        if (result.length > 0)
            return result[0];
        else
            return null;
    };

    this.GetData = function (Index) {
        var bodies = [];
        var obj = view.Control.Model.Object;
        var bodyMap = new Map();
        getBodies(Index, bodies, bodyMap);
        var datas = [];
        getDatas(obj, bodies, datas, bodyMap);
        return datas;
    };

    this.Find = function (text, fullmatch, casesensitive) {
        var result = [];

        if (!casesensitive)
            text = text.toUpperCase();

        function find(value, key, map) {
            var name = value.data.name === null ? 'Body ' + value.data.index : value.data.name;

            var nameCase;
            if (!casesensitive)
                nameCase = name.toUpperCase();
            else
                nameCase = name;

            if (fullmatch) {
                if (nameCase.localeCompare(text) === 0) {
                    var node = Node();
                    node.ID = value.data.index;
                    node.ParentID = value.data.pIndex;
                    node.Name = name;
                    result.push(node);
                }
            }
            else {
                if (view.Browser.Type === BROWSER_TYPES.Internet_Explorer) {
                    if (nameCase.indexOf(text) >= 0) {
                        var node = Node();
                        node.ID = value.data.index;
                        node.ParentID = value.data.pIndex;
                        node.Name = name;
                        result.push(node);
                    }
                }
                else {
                    if (nameCase.includes(text)) {
                        var node = Node();
                        node.ID = value.data.index;
                        node.ParentID = value.data.pIndex;
                        node.Name = name;
                        result.push(node);
                    }
                }
            }
        }

        this.TreeMap.forEach(find);
        
        return result;
    };

    (function () {
        'use strict';
        var _slice = Uint32Array.prototype.slice;

        try {
            _slice.call(document.documentElement);
        } catch (e) { // Fails in IE
            Uint32Array.prototype.slice = function (begin, end) {
                end = (typeof end !== 'undefined') ? end : this.length;
                // 네이티브 Array 객체의 경우 네이티브 slice 함수를 사용합니다.
                if (Object.prototype.toString.call(this) === '[object Array]') {
                    return _slice.call(this, begin, end);
                }

                // object와 같은 배열을 위해 우리는 스스로 처리한다.
                var i, cloned = [],
                    size, len = this.length;

                // "begin"에 대한 음수 값을 처리합니다.
                var start = begin || 0;
                start = (start >= 0) ? start : Math.max(0, len + start);

                // "end"에 대한 음수 값을 처리합니다.
                var upTo = (typeof end === 'number') ? Math.min(end, len) : len;
                if (end < 0) {
                    upTo = len + end;
                }
                // 슬라이스의 실제 예상 크기
                size = upTo - start;
                if (size > 0) {
                    cloned = new Array(size);
                    if (this.charAt) {
                        for (i = 0; i < size; i++) {
                            cloned[i] = this.charAt(start + i);
                        }
                    } else {
                        for (i = 0; i < size; i++) {
                            cloned[i] = this[start + i];
                        }
                    }
                }
                return cloned;
            };
        }

        var _slice = Float32Array.prototype.slice;

        try {
            _slice.call(document.documentElement);
        } catch (e) { // Fails in IE
            Float32Array.prototype.slice = function (begin, end) {
                end = (typeof end !== 'undefined') ? end : this.length;
                // 네이티브 Array 객체의 경우 네이티브 slice 함수를 사용합니다.
                if (Object.prototype.toString.call(this) === '[object Array]') {
                    return _slice.call(this, begin, end);
                }

                // object와 같은 배열을 위해 우리는 스스로 처리한다.
                var i, cloned = [],
                    size, len = this.length;

                // "begin"에 대한 음수 값을 처리합니다.
                var start = begin || 0;
                start = (start >= 0) ? start : Math.max(0, len + start);

                // "end"에 대한 음수 값을 처리합니다.
                var upTo = (typeof end === 'number') ? Math.min(end, len) : len;
                if (end < 0) {
                    upTo = len + end;
                }
                // 슬라이스의 실제 예상 크기
                size = upTo - start;
                if (size > 0) {
                    cloned = new Array(size);
                    if (this.charAt) {
                        for (i = 0; i < size; i++) {
                            cloned[i] = this.charAt(start + i);
                        }
                    } else {
                        for (i = 0; i < size; i++) {
                            cloned[i] = this[start + i];
                        }
                    }
                }
                return cloned;
            };
        }
    }());


};