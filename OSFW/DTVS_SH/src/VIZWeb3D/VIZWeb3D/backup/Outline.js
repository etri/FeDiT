/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Outline = function (resolution, Data, renderer) {
    var scope = this;

    this.renderScene = null;
    this.renderSceneBase = null;
    this.renderCamera = null;
    this.renderer = renderer;
    this.object = null;
    this.datamng = Data;
    this.map = null;
    this.drawMap = new Map();
    this.useAlpha = false;
    //this.edgeColor = new THREE.Color(1, 1, 1);
    //this.edgeAlpha = 1;

    this.resolution = (resolution !== undefined) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);

    this.oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;
    this.width = 0;
    this.height = 0;
    this.downSampleRatio = 1;

    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

    var resx = Math.round(this.resolution.x / this.downSampleRatio);
    var resy = Math.round(this.resolution.y / this.downSampleRatio);

    this.renderTargetDepthBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetDepthBuffer.texture.name = "OutlinePass.depth";
    this.renderTargetDepthBuffer.texture.generateMipmaps = false;

    //this.renderTargetEdgeBuffer1 = new THREE.WebGLRenderTarget(resx, resy, pars);
    this.renderTargetEdgeBuffer1 = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetEdgeBuffer1.texture.name = "OutlinePass.edge1";
    this.renderTargetEdgeBuffer1.texture.generateMipmaps = false;

    this.fsQuad = new VIZWeb3D.FullScreenQuad(null);

    this.setSize = function (width, height) {
        this.width = width;
        this.height = height;

        var resx = Math.round(width / this.downSampleRatio);
        var resy = Math.round(height / this.downSampleRatio);
        this.renderTargetEdgeBuffer1.setSize(resx, resy);

        resx = Math.round(resx / 2);
        resy = Math.round(resy / 2);
    };

    this.addData = function (drawtype, scene, camera, meshObj, base) {
        var data = {
            type: drawtype,
            scene: scene,
            camera: camera,
            object: meshObj,
            base: base
        };

        this.drawMap.set(data.type, data);
    };

    this.render = function (drawtype) {

        var data = this.drawMap.get(drawtype);
        if (data !== undefined) {
                this.renderScene = data.scene;
                this.renderCamera = data.camera;
                this.object = data.object;
                this.renderSceneBase = data.base;

            this.map = this.datamng.OutlineMap;

            if (drawtype === 0)
                 this.render_selection();
            else if (drawtype === 1)
                this.render_edge();
            else if (drawtype === 2)
                this.render_hidden();
        }
    };

    this.render_selection = function () {
        if (this.object !== undefined) {

            this.oldClearColor.copy(this.renderer.getClearColor());
            this.oldClearAlpha = this.renderer.getClearAlpha();
            var oldAutoClear = this.renderer.autoClear;

            renderer.autoClear = false;

            //renderer.setClearColor(0xffffff, 1);
            var values = [];
            this.map.forEach(function (value, index, array) {
                //return values.push(value);
                scope.renderScene.add(value.mesh);
            });

            // 선택 모델 추출
            var setOutlineData = function (obj, bReset, mat, outlinemap) {

                function setOutline(value, key, map) {
                    value.material = mat;
                    value.material.needsUpdate = true;
                    for (var j = 0; j < value.userData.length; j++) {
                        var data = value.userData[j];
                        if (!data.Tag.Select) {
                            // 선택 정보가 아니므로 백업 데이터 생성
                            if (bReset) {
                                value.geometry.index.array.set(data.Tag.Outline.Base, data.m_triIdx);
                            }
                            else
                                value.geometry.index.array.set(data.Tag.Outline.New, data.m_triIdx);

                            value.geometry.index.needsUpdate = true;
                        }
                    }
                }

                outlinemap.forEach(setOutline);
            };

            this.datamng.SetSelectionOutline(this.object, false, this.datamng.Materials.outline_basic);

            renderer.setRenderTarget(this.renderTargetDepthBuffer); //renderTarget renderTargetDepthBuffer
            renderer.clear();
            renderer.render(this.renderScene, this.renderCamera, this.renderTargetDepthBuffer, true);

            this.fsQuad.material = this.datamng.Materials.outline_select;
            this.fsQuad.material.uniforms["maskTexture"].value = this.renderTargetDepthBuffer.texture;
            this.fsQuad.material.uniforms["texSize"].value = new THREE.Vector2(this.width, this.height);
            var colEdge = this.datamng.GetEdgeColor();
            this.fsQuad.material.uniforms["edgeColor"].value = new THREE.Vector3(colEdge.r, colEdge.g, colEdge.b);
            this.fsQuad.material.uniforms["edgeAlpha"].value = colEdge.a;

            renderer.setRenderTarget(this.renderTargetEdgeBuffer1);
            renderer.clear();
            this.fsQuad.render(renderer);

            if (this.useAlpha) {
                var mode = this.datamng.Materials.basic.uniforms['mode'].value;
                this.datamng.Materials.basic.uniforms['mode'].value = 0;
                this.datamng.Materials.basic.uniforms['useAlpha'].value = 1;
                this.datamng.Materials.basic.uniforms['alpha'].value = 0.2;

                this.datamng.UpdateSelectionObjectMaterial(this.datamng.Materials.basic);

                this.datamng.SetBasicShaderDepthTest(true);
                renderer.render(this.renderScene, this.renderCamera);
                this.datamng.Materials.basic.uniforms['mode'].value = mode;
            }
            else {
                var mode = this.datamng.Materials.basic.uniforms['mode'].value;
                this.datamng.Materials.basic.uniforms['mode'].value = 0;
                this.datamng.Materials.basic.uniforms['useAlpha'].value = 0;
                this.datamng.Materials.basic.uniforms['alpha'].value = 1;

                this.datamng.UpdateSelectionObjectMaterial(this.datamng.Materials.basic);

                this.datamng.SetBasicShaderDepthTest(true);
                renderer.render(this.renderScene, this.renderCamera);
                this.datamng.Materials.basic.uniforms['mode'].value = mode;
            }
            

            this.datamng.SetSelectionOutline(this.object, true, this.datamng.Materials.basic);

            this.map.forEach(function (value, index, array) {
                value.parent.add(value.mesh);
            });
        }
    };

    this.render_edge = function () {
        if (this.object !== undefined) {

            this.oldClearColor.copy(this.renderer.getClearColor());
            this.oldClearAlpha = this.renderer.getClearAlpha();
            var oldAutoClear = this.renderer.autoClear;

            renderer.autoClear = false;

            //renderer.setClearColor(0x000000, 1);
            //renderer.setClearColor(0xffffff, 1);

            var color = { r: 0, g: 0, b: 1, a: 1.0 };
            var colorHide = { r: 0, g: 0, b: 0, a: 0.0 };
            var colorTmp = { r: 0, g: 0, b: 255, a: 1.0 };

            var newcolor = function (color) {
                var offset = 10;
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

            setColorData(this.object, false, this.datamng.Materials.hiddenline_basic, color);

            renderer.autoClearDepth = false;

            {
                this.datamng.Materials.hiddenline_basic.depthTest = true;
                this.datamng.Materials.hiddenline_basic.depthWrite = true;

                renderer.setRenderTarget(this.renderTargetDepthBuffer); //renderTarget renderTargetDepthBuffer
                renderer.clear();
                renderer.render(this.renderScene, this.renderCamera, this.renderTargetDepthBuffer, true);

                this.fsQuad.material = this.datamng.Materials.outline_edge;
                //this.fsQuad.material = this.datamng.Materials.edge;
                this.fsQuad.material.uniforms["maskTexture"].value = this.renderTargetDepthBuffer.texture;
                this.fsQuad.material.uniforms["texSize"].value = new THREE.Vector2(this.width, this.height);
                var colEdge = this.datamng.GetHiddenEdgeColor();
                this.fsQuad.material.uniforms["edgeColor"].value = new THREE.Vector3(colEdge.r, colEdge.g, colEdge.b);
                this.fsQuad.material.uniforms["edgeAlpha"].value = 0.5;

                renderer.setRenderTarget(this.renderTargetEdgeBuffer1);
                renderer.clear();
                this.fsQuad.render(renderer);
            }
            
            this.datamng.UpdateObjectStatus(this.object, false, true, true, this.datamng.Materials.basic, colorHide);

            this.datamng.Materials.hiddenline_basic.depthTest = false;
            this.datamng.Materials.hiddenline_basic.depthWrite = false;

            renderer.autoClearDepth = false;
        }
    };

    this.GetPickInfo = function (event) {

        var data = this.drawMap.get(5);
        if (data !== undefined) {
            this.renderScene = data.scene;
            this.renderCamera = data.camera;
            this.object = data.object;
            this.renderSceneBase = data.base;

            this.map = this.datamng.OutlineMap;

            renderer.setViewport(0, 0, resolution.x, resolution.y);
        }

        var mouse = scope.datamng.GetMousePos(event);
        if (this.object !== undefined) {
            this.oldClearColor.copy(this.renderer.getClearColor());
            this.oldClearAlpha = this.renderer.getClearAlpha();
            var oldAutoClear = this.renderer.autoClear;
            renderer.autoClear = true;

            var color = { r: 0, g: 0, b: 1, a: 1.0 };
            var colorHide = { r: 0, g: 0, b: 0, a: 0.0 };
            var colorTmp = { r: 0, g: 0, b: 255, a: 1.0 };

            var newcolor = function (color) {
                var offset = 10;
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

            setColorData(this.object, false, this.datamng.Materials.hiddenline_basic, color);

            //renderer.autoClearDepth = false;
            renderer.autoClearDepth = true;

            {
                //this.datamng.Materials.hiddenline_basic.depthTest = true;
                //this.datamng.Materials.hiddenline_basic.depthWrite = true;

                //renderer.setRenderTarget(this.renderTargetDepthBuffer); //renderTarget renderTargetDepthBuffer
                //renderer.clear();
                //renderer.render(this.renderScene, this.renderCamera, this.renderTargetDepthBuffer, true);

                //this.fsQuad.material = this.datamng.Materials.outline_edge;
                //this.fsQuad.material.uniforms["maskTexture"].value = this.renderTargetDepthBuffer.texture;
                //this.fsQuad.material.uniforms["texSize"].value = new THREE.Vector2(this.width, this.height);
                //var colEdge = this.datamng.GetHiddenEdgeColor();
                //this.fsQuad.material.uniforms["edgeColor"].value = new THREE.Vector3(colEdge.r, colEdge.g, colEdge.b);
                //this.fsQuad.material.uniforms["edgeAlpha"].value = 0.5;

                //renderer.setRenderTarget(this.renderTargetEdgeBuffer1);
                //renderer.clear();
                //this.fsQuad.render(renderer);

                renderer.render(this.renderScene, this.renderCamera);
                var img = new Image();
                img.src = renderer.domElement.toDataURL();
                img.style.height = "100%";
                img.style.width = "100%";
                img.style.objectfit = "contain";

                var canvas = document.createElement('canvas');
                canvas.width = resolution.x;
                canvas.height = resolution.y;
                var context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                var imgData = context.getImageData(0, 0, resolution.x, resolution.y);

                var w = window.open('', '');
                w.document.title = "Snapshot";
                var divSnapshot = w.document.createElement('div');
                divSnapshot.style.position = "absolute";
                divSnapshot.style.width = "100%";
                divSnapshot.style.height = "100%";
                //divSnapshot.style.backgroundColor = "red";
                //divSnapshot.style.backgroundimage = "linear-gradient(180deg, rgba(0, 189, 189, 0.1), rgba(255,255,255,1) )";

                divSnapshot.style.top = 0;
                divSnapshot.style.left = 0;
                divSnapshot.style.margin = 0;
                divSnapshot.appendChild(img);

                w.document.body.appendChild(divSnapshot);

                //var texData = this.renderTargetDepthBuffer.texture.image;

                //var tx = Math.min(emod(u, 1) * texData.width | 0, texData.width - 1);
                //var ty = Math.min(emod(v, 1) * texData.height | 0, texData.height - 1);
                var offset = (event.clientY * img.width + event.clientX) * 4;
                var r = imgData.data[offset + 0];
                var g = imgData.data[offset + 1];
                var b = imgData.data[offset + 2];
                var a = imgData.data[offset + 3];

                console.log("R : " + r + " G :  " + g + " B : " + b);

                // this is only needed if your UV coords are < 0 or > 1
                // if you're using CLAMP_TO_EDGE then you'd instead want to
                // clamp the UVs to 0 to 1.
                var emod = function (n, m) {
                    return ((n % m) + m) % m;
                };
            }

            //this.datamng.UpdateObjectStatus(this.object, false, true, true, this.datamng.Materials.basic, colorHide);

            this.datamng.Materials.hiddenline_basic.depthTest = false;
            this.datamng.Materials.hiddenline_basic.depthWrite = false;

            renderer.autoClearDepth = false;
        }

    };
};

VIZWeb3D.FullScreenQuad = (function () {

    var camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    var FullScreenQuad = function (material) {

        this._mesh = new THREE.Mesh(geometry, material);

    };

    Object.defineProperty(FullScreenQuad.prototype, 'material', {

        get: function () {

            return this._mesh.material;

        },

        set: function (value) {

            this._mesh.material = value;

        }

    });

    Object.assign(FullScreenQuad.prototype, {

        render: function (renderer) {

            renderer.render(this._mesh, camera);

        }

    });

    return FullScreenQuad;

})();
