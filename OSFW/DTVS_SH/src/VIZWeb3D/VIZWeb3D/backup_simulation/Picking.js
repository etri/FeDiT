/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Picking = function (view, scene, camera, renderer, resolution) {
    var scope = this;

    var _view = view;
    var _camera = camera;
    var _scene = scene;
    var _renderer = renderer;
    var map = new Map();
    
    this.resolution = (resolution !== undefined) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);
    var oldClearColor = new THREE.Color();
    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

    this.renderTargetDepthBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetDepthBuffer.texture.name = "Picking.depth";
    this.renderTargetDepthBuffer.texture.generateMipmaps = false;

    this.PickInfo = function (event) {
        {
            var mouse = _view.Data.GetMousePos(event);
            var intersections = [];
            oldClearColor.copy(_renderer.getClearColor());
            oldClearAlpha = _renderer.getClearAlpha();
            oldAutoClear = _renderer.autoClear;

            _renderer.autoClear = false;
            _renderer.setClearColor(0xffffff, 1);
            map = new Map();
            var model = _view.Control.Model.Object;
            var color = { r: 0, g: 0, b: 1, a: 1.0 };
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
            var getHitTestNode = function (obj, pos, _TargetMeshes) {
                var me = this;

                for (var i = 0; i < obj.children.length; i++) {
                    if (obj.children[i] instanceof THREE.Mesh) {
                        var bHit = false;

                        for (var j = 0; j < obj.children[i].userData.length; j++) {
                            var data = obj.children[i].userData[j];

                            var boundbox = data.BBox;

                            // Center
                            var vCenter = new THREE.Vector3((boundbox.max.x + boundbox.min.x) / 2, (boundbox.max.y + boundbox.min.y) / 2, (boundbox.max.z + boundbox.min.z) / 2);
                            var vLine1Tmp = new THREE.Vector3(pos.x, pos.y, 0.3);
                            var vLine2Tmp = new THREE.Vector3(pos.x, pos.y, 0.7);

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
                            //fRadius /= 5;
                            if (len < fRadius) {
                                bHit = true;
                                break;
                            }
                        }

                        if (!bHit) {
                            obj.children[i].visible = false;
                            _ChangeMeshes.push(obj.children[i]);
                        }
                        else {
                            _TargetMeshes.push(obj.children[i]);
                        }
                    }
                    else {
                        getHitTestNode(obj.children[i], mouse, _TargetMeshes);
                    }
                }
            };
            var setColorData = function (mesh, mat, color) {
                mesh.material = mat;
                mesh.material.needsUpdate = true;
                for (var j = 0; j < mesh.userData.length; j++) {
                    var data = mesh.userData[j];
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
                    //map.set(id, data.bodyId);
                    map.set(id, { bodyId: data.bodyId, mesh: mesh });

                    setcolor(mesh, data, color);
                }
            };
            
            var _TargetMeshes = [];
            var _ChangeMeshes = [];
            getHitTestNode(_view.Control.Model.Object, mouse, _TargetMeshes);
            for (var i = 0; i < _TargetMeshes.length; i++) {
                setColorData(_TargetMeshes[i], _view.Data.Materials.pick, color);
            }
            _renderer.autoClearDepth = false;
            
            view.Data.Materials.pick.depthTest = true;
            view.Data.Materials.pick.depthWrite = true;

            // 그리기
            _renderer.autoClear = true;
            _renderer.setViewport(0, 0, resolution.x, resolution.y);
            if (model !== null)
                model.visible = true;
            _renderer.setRenderTarget(this.renderTargetDepthBuffer); //renderTarget renderTargetDepthBuffer
            _renderer.clear();
            _renderer.render(_scene, _camera, this.renderTargetDepthBuffer, true);

            var gl = _renderer.domElement.getContext("webgl");
            if (!gl)
                gl = _renderer.domElement.getContext("experimental-webgl");
            
            if (!gl) {
                return;
            }
            else {
                const pixelX = event.clientX;
                const pixelY = resolution.y - event.clientY;

                const data = new Uint8Array(4);
                gl.readPixels(
                    pixelX,            // x
                    pixelY,            // y
                    1,                 // width
                    1,                 // height
                    gl.RGBA,           // format
                    gl.UNSIGNED_BYTE,  // type
                    data);             // typed array to hold result
                var id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
                var info = map.get(id);
                if (info !== undefined) {
                    intersections = _view.Data.GetIntersectionsByMesh(mouse, info.mesh);
                }
            }

            for (var i = 0; i < _ChangeMeshes.length; i++) {
                _ChangeMeshes[i].visible = true;
            }

            var UpdateObjectStatus = function (meshes, bReset, mat, color) {
                for (var i = 0; i < meshes.length; i++) {
                    if (meshes[i] instanceof THREE.Mesh) {
                        meshes[i].material = mat;
                        meshes[i].material.needsUpdate = true;
                        for (var j = 0; j < meshes[i].userData.length; j++) {
                            var data = meshes[i].userData[j];
                            //if (!bSelectChange && data.Tag.Select)
                            //    continue;

                            var setcolor = function (source, body, color) {
                                for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                                    source.geometry.attributes.color.array[i] = color.r;
                                    source.geometry.attributes.color.array[i + 1] = color.g;
                                    source.geometry.attributes.color.array[i + 2] = color.b;
                                    source.geometry.attributes.color.array[i + 3] = color.a * 255;
                                }
                                source.geometry.attributes.color.needsUpdate = true;
                            };

                            //if (!bReset)
                            //    if (bSelectColor && data.Tag.Select)
                            //        setcolor(obj.children[i], data, colSelect);
                            //    else
                            //        setcolor(obj.children[i], data, color);
                            //else {
                            setcolor(meshes[i], data, { r: data.color.R, g: data.color.G, b: data.color.B, a: data.color.A / 255 });
                            //}
                        }
                    }
                    else {
                        scope.UpdateObjectStatus(meshes[i], bReset, mat, color);
                    }
                }
            };
            //UpdateObjectStatus(_TargetMeshes, true, _view.Data.Materials.basic, null);
            _view.Data.ResetObjectStatus(_TargetMeshes, _view.Data.Materials.basic);

            return intersections;
        }
    };

    this.PickInfoByPos = function (pixel, mouse) {
        {
            var intersections = [];
            oldClearColor.copy(_renderer.getClearColor());
            oldClearAlpha = _renderer.getClearAlpha();
            oldAutoClear = _renderer.autoClear;

            _renderer.autoClear = false;
            _renderer.setClearColor(0xffffff, 1);
            map = new Map();
            var model = _view.Control.Model.Object;
            var color = { r: 0, g: 0, b: 1, a: 1.0 };
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
            var getHitTestNode = function (obj, pos, _TargetMeshes) {
                var me = this;

                for (var i = 0; i < obj.children.length; i++) {
                    if (obj.children[i] instanceof THREE.Mesh) {
                        var bHit = false;

                        for (var j = 0; j < obj.children[i].userData.length; j++) {
                            var data = obj.children[i].userData[j];

                            var boundbox = data.BBox;

                            // Center
                            var vCenter = new THREE.Vector3((boundbox.max.x + boundbox.min.x) / 2, (boundbox.max.y + boundbox.min.y) / 2, (boundbox.max.z + boundbox.min.z) / 2);
                            var vLine1Tmp = new THREE.Vector3(pos.x, pos.y, 0.3);
                            var vLine2Tmp = new THREE.Vector3(pos.x, pos.y, 0.7);

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
                            //fRadius /= 5;
                            if (len < fRadius) {
                                bHit = true;
                                break;
                            }
                        }

                        if (!bHit) {
                            obj.children[i].visible = false;
                            _ChangeMeshes.push(obj.children[i]);
                        }
                        else {
                            _TargetMeshes.push(obj.children[i]);
                        }
                    }
                    else {
                        getHitTestNode(obj.children[i], mouse, _TargetMeshes);
                    }
                }
            };
            var setColorData = function (mesh, mat, color) {
                mesh.material = mat;
                mesh.material.needsUpdate = true;
                for (var j = 0; j < mesh.userData.length; j++) {
                    var data = mesh.userData[j];
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
                    //map.set(id, data.bodyId);
                    map.set(id, { bodyId: data.bodyId, mesh: mesh });

                    setcolor(mesh, data, color);
                }
            };

            var _TargetMeshes = [];
            var _ChangeMeshes = [];
            getHitTestNode(_view.Control.Model.Object, mouse, _TargetMeshes);
            for (var i = 0; i < _TargetMeshes.length; i++) {
                setColorData(_TargetMeshes[i], _view.Data.Materials.pick, color);
            }
            _renderer.autoClearDepth = false;

            view.Data.Materials.pick.depthTest = true;
            view.Data.Materials.pick.depthWrite = true;

            // 그리기
            _renderer.autoClear = true;
            _renderer.setViewport(0, 0, resolution.x, resolution.y);
            if (model !== null)
                model.visible = true;
            _renderer.setRenderTarget(this.renderTargetDepthBuffer); //renderTarget renderTargetDepthBuffer
            _renderer.clear();
            _renderer.render(_scene, _camera, this.renderTargetDepthBuffer, true);

            var gl = _renderer.domElement.getContext("webgl");
            if (!gl)
                gl = _renderer.domElement.getContext("experimental-webgl");

            if (!gl) {
                return;
            }
            else {
                const pixelX = pixel.x;
                const pixelY = resolution.y - pixel.y;

                const data = new Uint8Array(4);
                gl.readPixels(
                    pixelX,            // x
                    pixelY,            // y
                    1,                 // width
                    1,                 // height
                    gl.RGBA,           // format
                    gl.UNSIGNED_BYTE,  // type
                    data);             // typed array to hold result
                var id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
                var info = map.get(id);
                if (info !== undefined) {
                    intersections = _view.Data.GetIntersectionsByMesh(mouse, info.mesh);
                }
            }

            for (var i = 0; i < _ChangeMeshes.length; i++) {
                _ChangeMeshes[i].visible = true;
            }

            var UpdateObjectStatus = function (meshes, bReset, mat, color) {
                for (var i = 0; i < meshes.length; i++) {
                    if (meshes[i] instanceof THREE.Mesh) {
                        meshes[i].material = mat;
                        meshes[i].material.needsUpdate = true;
                        for (var j = 0; j < meshes[i].userData.length; j++) {
                            var data = meshes[i].userData[j];
                            //if (!bSelectChange && data.Tag.Select)
                            //    continue;

                            var setcolor = function (source, body, color) {
                                for (var i = body.m_vnIdx / 3 * 4; i < body.m_vnIdx / 3 * 4 + body.m_nVtx + body.m_nVtx / 3; i = i + 4) {
                                    source.geometry.attributes.color.array[i] = color.r;
                                    source.geometry.attributes.color.array[i + 1] = color.g;
                                    source.geometry.attributes.color.array[i + 2] = color.b;
                                    source.geometry.attributes.color.array[i + 3] = color.a * 255;
                                }
                                source.geometry.attributes.color.needsUpdate = true;
                            };

                            //if (!bReset)
                            //    if (bSelectColor && data.Tag.Select)
                            //        setcolor(obj.children[i], data, colSelect);
                            //    else
                            //        setcolor(obj.children[i], data, color);
                            //else {
                            setcolor(meshes[i], data, { r: data.color.R, g: data.color.G, b: data.color.B, a: data.color.A / 255 });
                            //}
                        }
                    }
                    else {
                        scope.UpdateObjectStatus(meshes[i], bReset, mat, color);
                    }
                }
            };
            //UpdateObjectStatus(_TargetMeshes, true, _view.Data.Materials.basic, null);
            _view.Data.ResetObjectStatus(_TargetMeshes, _view.Data.Materials.basic);

            return intersections;
        }
    };
};


