/**
 * @author jhjang@softhills.net
 */

function DataManager(container, camera, raycaster) {
    this.container = container;
    this.camera = camera;
    this.raycaster = raycaster;
    this.list_vertex = [];
    this.list_normal = [];
    this.list_face = [];
    this.list_mesh = [];
    this.list_model = [];

    this.list_colormesh = [];
    this.list_colorface = [];

    // 선택 매쉬
    this.selectItem = null;
    this.selectmesh = null;
    this.selectmeshbackup = null;

    // 컬러 메쉬 테이블
    this.mColors = [];
    // 컬러 테이블 카운트
    this.mColorCount = 0;

    // Ray 결과 선택 모델
    this.mSelectedModels = [];
    // 모델 선택 관리 
    this.mSelectObjects = [];
    // 선택 파트 이름
    this.mSelectPartName = [];

    this.mParts = [];

    this.mTree = [];

    // 숨기기 모델
    this.mHideParts = [];

    // 트리 카운트
    this.mTreeCount = 0;
    // RootNode
    var children = [];
    var bboxMin = new THREE.Vector3(0, 0, 0);
    var bboxMax = new THREE.Vector3(0, 0, 0);
    var bbox = { min: bboxMin, max: bboxMax };
    this.RootNode = { ID: -1, PID: -1, bbox: bbox, children: children, filename: "" };
    this.PROJECTIONMODE = { PERSPECTIVE: 1, ORTHOGRAPHIC: 0 };
    this.mCameraMode = this.PROJECTIONMODE.PERSPECTIVE;

    // 현재 선택 프로세스 상태
    this.bSelectProcess = false;

    // 플라스틱모드
    this.bPlasticMode = false;
}

DataManager.prototype.Clear =
    function () {
        this.list_vertex = [];
        this.list_normal = [];
        this.list_face = [];
        this.list_mesh = [];
        this.list_model = [];
        this.list_colormesh = [];
        this.list_colorface = [];
        //this.mTree = [];
    };

DataManager.prototype.AddFace =
    function (colorIdx, face) {
        this.list_face.push(face);
    };

DataManager.prototype.AddColorFace =
    function (colorIdx, face) {
        var index = this.ContainsColorFace(colorIdx);

        if (index >= 0) {
            this.list_colorface[index].faces.push(face);
        }
        else {
            var faces = [];
            faces.push(face);
            this.list_colorface.push({ color: colorIdx, faces: faces });
        }
    };

DataManager.prototype.AddMesh = function (name, startIdx, count, colorIdx, faces, ID) {
    var index = this.ContainsMesh(name);
    var mesh = null;
    if (index >= 0) {
        // startIdx
        if (this.list_mesh[index].startIdx < startIdx) {
            this.list_mesh[index].startIdx = startIdx;
        }
        // count
        this.list_mesh[index].count += count;

        for (var i = 0; i < faces.length; i++) {
            this.list_mesh[index].faces.push(faces[i]);
        }

        mesh = this.list_mesh[index];
    }
    else {
        mesh = this.Mesh(name, startIdx, count, colorIdx, faces, ID);
        this.list_mesh.push(mesh);
    }

    // color 별 mesh 관리
    var colorindex = this.ContainsColorMesh(colorIdx);
    if (colorindex >= 0) {
        this.list_colormesh[colorindex].meshes.push(mesh);
    }
    else {
        var meshes = [];
        meshes.push(mesh);

        var colormesh = { color: colorIdx, meshes: meshes };
        this.list_colormesh.push(colormesh);
    }
};

DataManager.prototype.GetColorCount =
    function () {
        return this.mColorCount;
    };

DataManager.prototype.ContainsColorTable =
    function (color) {
        for (var i = 0; i < this.mColors.length; i++) {
            var vo = this.mColors[i];
            if (vo.r === color.r && vo.g === color.g && vo.b === color.b && vo.a === color.a)
                return true;
        }

        return false;
    };

DataManager.prototype.GetColorIndex =
    function (color) {
        for (var i = 1; i < this.mColors.length; i++) {
            var vo = this.mColors[i];
            if (this.mColors[i].r === color.r && this.mColors[i].g === color.g && this.mColors[i].b === color.b && this.mColors[i].a === color.a)
                return i;
        }

        return -1;
    };

DataManager.prototype.GetColor =
    function (color) {
        for (var i = 1; i < this.mColors.length; i++) {
            var vo = this.mColors[i];
            if (this.mColors[i].r === color.r && this.mColors[i].g === color.g && this.mColors[i].b === color.b && this.mColors[i].a === color.a)
                return this.mColors[i];
        }

        return null;
    };

DataManager.prototype.AddColorTable =
    function (color) {
        var index = this.mColors.length;
        var color = { index: index, r: color.r, g: color.g, b: color.b, a: color.a };
        this.mColors[this.mColors.length] = color;

        //return this.mColors.length - 1;
        return color;
    };

DataManager.prototype.GetTreeCount =
    function () {
        return this.mTreeCount;
    };

DataManager.prototype.SetTreeData =
    function (node) {
        this.mTree.push(node);
    };

DataManager.prototype.SetTreeHierarchy =
    function (filename) {
        var FileRootNode = this.GetRootNode();
        if (FileRootNode !== null) {
            // 파일명 관리
            FileRootNode = { ID: FileRootNode.ID, PID: FileRootNode.PID, bbox: FileRootNode.bbox, children: FileRootNode.children, filename: filename };
            this.RootNode.children.push(FileRootNode);

            this.SetSubTreeHierarchy(FileRootNode);
        }

        // RootNode BBox 설정
        for (var i = 0; i < this.RootNode.children.length; i++) {
            if (i === 0) {
                this.RootNode.bbox.min = this.RootNode.children[i].bbox.min;
                this.RootNode.bbox.max = this.RootNode.children[i].bbox.max;
            }
            else {
                this.RootNode.bbox.min = this.Min(this.RootNode.bbox.min, this.RootNode.children[i].bbox.min);
                this.RootNode.bbox.max = this.Max(this.RootNode.bbox.max, this.RootNode.children[i].bbox.max);
            }
        }

        this.mTreeCount = this.mTree.length;
    }

DataManager.prototype.SetSubTreeHierarchy =
    function (parent) {
        for (var i = 0; i < this.mTree.length; i++) {
            if (this.mTree[i].PID === parent.ID) {
                parent.children.push(this.mTree[i]);
                //if (this.mTree[i].ID === 380)
                //    console.log("");
                this.SetSubTreeHierarchy(this.mTree[i]);
            }
        }
    }

DataManager.prototype.GetRootNode =
    function () {
        var result = null;
        for (var i = 0; i < this.mTree.length; i++) {
            if (this.mTree[i].PID === -1) {
                result = this.mTree[i];
                break;
            }
        }

        return result;
    }

DataManager.prototype.ContainsNode = function (nId) {
    var result = -1;
    for (var i = 0; i < this.mTree.length; i++) {
        if (this.mTree[i].ID === nId) {
            result = i;
            break;
        }
    }
    return result;
};

DataManager.prototype.UpdateNode = function (part) {
    var me = this;

    for (var i = 0; i < me.mTree.length; i++) {
        if (me.mTree[i].ID === part.ID) {
            console.log("");
        }
    }

    for (var i = 0; i < me.RootNode.children.length; i++) {
        me.UpdateSubNode(part, me.RootNode.children[i]);
    }
};

DataManager.prototype.UpdateSubNode = function (part, parent) {
    var me = this;

    for (var i = 0; i < parent.children.length; i++) {
        var node = parent.children[i];
        if (node.children !== null) {
            if (node.children.length > 0)
                me.UpdateSubNode(part, node);
        }
        else {
            if (node.ID === part.ID) {
                node = part;
            }
        }
    }
};



DataManager.prototype.SetPartData =
    function (body) {
        var index = this.ContainsNode(body.ID);
        if (index >= 0) {
            // 파트의 바디 정보 추가
            this.mTree[index].children.push(body);
        }
    };

DataManager.prototype.ContainsFace = function (key) {
    var result = -1;
    for (var i = 0; i < this.list_face.length; i++) {
        if (this.list_face[i].color === key) {
            result = i;
            break;
        }
    }
    return result;
};

DataManager.prototype.ContainsColorFace = function (key) {
    var result = -1;
    for (var i = 0; i < this.list_colorface.length; i++) {
        if (this.list_colorface[i].color === key) {
            result = i;
            break;
        }
    }
    return result;
};

DataManager.prototype.ContainsColorMesh = function (key) {
    var result = -1;
    for (var i = 0; i < this.list_colormesh.length; i++) {
        if (this.list_colormesh[i].color === key) {
            result = i;
            break;
        }
    }
    return result;
};

DataManager.prototype.ContainsMesh = function (name) {
    var result = -1;
    for (var i = 0; i < this.list_mesh.length; i++) {
        if (this.list_mesh[i].name.localeCompare(name) === 0) {
            result = i;
            break;
        }
    }
    return result;
};

DataManager.prototype.Mesh = function Mesh(name, startIdx, count, colorIdx, faces, ID) {
    return { name: name, startIdx: startIdx, count: count, colorIdx: colorIdx, faces: faces, ID: ID };
};



DataManager.prototype.GetPart =
    function (name, object) {
        var models = [];
        var count = 0;
        for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
            for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
                var mesh = object.children[groupIdx].children[meshIdx];
                if (mesh.visible === false)
                    continue;
                var parts = mesh.geometry.attributes.parts.array;
                for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                    var part = parts[partIdx];
                    if (part.name.localeCompare(name) === 0) {
                        // Part Mesh 리스트 생성
                        models.push({ mesh: mesh, part: part, partIdx: partIdx, parent: object.children[groupIdx] });
                        count = count + part.count;
                    } // if
                } // for partIdx
            } // for meshIdx
        } // for groupIdx

        // Part Mesh 생성
        var result = null;

        if (count > 0) {
            var buffpos = new Float32Array(count);
            var buffnormal = new Float32Array(count);

            var partIndex = 0;
            for (var modelIdx = 0; modelIdx < models.length; modelIdx++) {
                var model = models[modelIdx];
                var positions = model.mesh.geometry.attributes.position.array;
                var normals = model.mesh.geometry.attributes.normal.array;

                var part = model.part;

                for (var i = 0; i < part.count; i++) {
                    buffpos[i + partIndex] = positions[i + part.startIdx];
                    buffnormal[i + partIndex] = normals[i + part.startIdx];
                } // for i

                partIndex = partIndex + part.count;

            } // for modelIdx

            var buffgeom = new THREE.BufferGeometry();
            buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
            buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
            buffgeom.computeBoundingSphere();

            var material = new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });
            result = new THREE.Mesh(buffgeom, material);

            if (!result.userData.init) {
                var tag = this.Tag();
                result.userData = tag;
            }
            result.userData.modelsTmp = models;
            //result.userData = { bodies: models };

            result.name = name;
        } // if (count > 0)

        return result;
    }

DataManager.prototype.GetParts = function (names, object) {
    var me = this;

    var models = [];
    var count = 0;
    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
            var mesh = object.children[groupIdx].children[meshIdx];
            var parts = mesh.geometry.attributes.parts.array;
            for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                var part = parts[partIdx];
                var bExisted = false;
                for (var nameIdx = 0; nameIdx < names.length; nameIdx++) {
                    if (part.name.localeCompare(names[nameIdx]) === 0) {
                        bExisted = true;
                        break;
                    }
                }

                if (bExisted) {
                    // Part Mesh 리스트 생성
                    models.push({ mesh: mesh, part: part, partIdx: partIdx, parent: object.children[groupIdx] });
                    count = count + part.count;
                } // if
            } // for partIdx
        } // for meshIdx
    } // for groupIdx

    // Part Mesh 생성
    var result = null;

    if (count > 0) {
        var buffpos = new Float32Array(count);
        var buffnormal = new Float32Array(count);

        var partIndex = 0;
        for (var modelIdx = 0; modelIdx < models.length; modelIdx++) {
            var model = models[modelIdx];
            var positions = model.mesh.geometry.attributes.position.array;
            var normals = model.mesh.geometry.attributes.normal.array;

            var part = model.part;

            for (var i = 0; i < part.count; i++) {
                buffpos[i + partIndex] = positions[i + part.startIdx];
                buffnormal[i + partIndex] = normals[i + part.startIdx];
            } // for i

            partIndex = partIndex + part.count;
        } // for modelIdx

        var buffgeom = new THREE.BufferGeometry();
        buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
        buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
        buffgeom.computeBoundingSphere();

        var material = new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });
        result = new THREE.Mesh(buffgeom, material);

        if (!result.userData.init) {
            var tag = this.Tag();
            result.userData = tag;
        }
        result.userData.modelsTmp = models;
        //result.userData = { bodies: models };

        result.name = name;
    } // if (count > 0)

    return result;
};

DataManager.prototype.FindParts =
    function (keyword, object, includehide) {
        var models = [];
        var count = 0;

        var pattern = new RegExp(keyword, 'i'); // ignore case
        var names = [];
        for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
            for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
                var mesh = object.children[groupIdx].children[meshIdx];
                if (includehide === false && mesh.visible === false)
                    continue;

                var parts = mesh.geometry.attributes.parts.array;
                for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                    var part = parts[partIdx];
                    if (pattern.test(part.name) === true) {
                        var bContains = false;
                        var idx = 0;
                        for (var nameIdx = 0; nameIdx < names.length; nameIdx++) {
                            if (part.name.localeCompare(names[nameIdx]) === 0) {
                                bContains = true;
                                idx = nameIdx;
                                break;
                            }
                        }

                        // Part Mesh 리스트 생성
                        //models.push({ mesh: mesh, part: part, partIdx: partIdx, parent: object.children[groupIdx] });

                        if (!bContains)
                            names.push({ name: part.name, count: part.count });
                        else {
                            names[idx].count = names[idx].count + part.count;
                        }
                    }
                } // for partIdx
            } // for meshIdx
        } // for groupIdx

        // Part Mesh 생성
        var results = [];

        for (var nameIdx = 0; nameIdx < names.length; nameIdx++) {
            results.push(names[nameIdx].name);
        }

        return results;
    }

DataManager.prototype.HidePart =
    function (name, object) {
        var me = this;

        var hidepart = me.GetPart(name, object);

        if (hidepart === null)
            return;

        for (var modelIdx = 0; modelIdx < hidepart.userData.modelsTmp.length; modelIdx++) {
            var part = hidepart.userData.modelsTmp[modelIdx].part;
            part.visible = false;

            if (me.ContainsHidePart(name))
                continue;
            // 숨김 목록 추가
            me.mHideParts.push(part);
        }

        me.SetAllPartColor(object);
    };

DataManager.prototype.HideParts =
    function (names, object) {
        var me = this;

        var hidepart = me.GetParts(names, object);

        if (hidepart === null)
            return;

        for (var modelIdx = 0; modelIdx < hidepart.userData.modelsTmp.length; modelIdx++) {
            var part = hidepart.userData.modelsTmp[modelIdx].part;
            part.visible = false;

            if (me.ContainsHidePart(part.name))
                continue;
            // 숨김 목록 추가
            me.mHideParts.push(part);
        }

        me.SetAllPartColor(object);
    };

DataManager.prototype.ContainsHidePart = function (name) {
    var me = this;

    for (var i = 0; i < me.mHideParts.length; i++) {
        if (me.mHideParts[i].name.localeCompare(name) === 0) {
            return true;
        }
    }
    return false;
};

DataManager.prototype.ShowPart = function (name, object) {
    var me = this;

    for (var i = me.mHideParts.length - 1; i >= 0; i--) {
        var vo = me.mHideParts[i];

        if (vo.name.localeCompare(name) === 0) {
            vo.visible = true;
            // 숨김 목록 삭제
            me.mHideParts.splice(i, 1);
        } // if (vo.part.name.localeCompare(name) == 0)
    } // for i

    me.SetAllPartColor(object);
};

DataManager.prototype.ShowParts = function (names, object) {
    var me = this;
    for (var i = me.mHideParts.length - 1; i >= 0; i--) {
        var vo = me.mHideParts[i];

        var bExisted = false;
        for (var nameIdx = 0; nameIdx < names.length; nameIdx++) {
            if (vo.name.localeCompare(names[nameIdx]) === 0) {
                bExisted = true;
                break;
            }
        }

        if (bExisted) {
            vo.visible = true;
            // 숨김 목록 삭제
            me.mHideParts.splice(i, 1);
        }
    } // for i

    me.SetAllPartColor(object);
};

DataManager.prototype.GetPartListName = function (object) {
    var me = this;
    var listPart = [];
    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
            var mesh = object.children[groupIdx].children[meshIdx];
            var parts = mesh.geometry.attributes.parts.array;
            for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                var part = parts[partIdx];
                if (me.ContainsPartListName(listPart, part.name) !== true) {
                    listPart.push(part.name);
                } // if
            } // for partIdx
        } // for meshIdx
    } // for groupIdx

    return listPart;
};

DataManager.prototype.GetPartList = function (object) {
    var me = this;
    var listPart = [];
    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
            var mesh = object.children[groupIdx].children[meshIdx];
            var parts = mesh.geometry.attributes.parts.array;
            for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                var part = parts[partIdx];
                //if (part.name.localeCompare("Part 1 of /6501-SHAFT") === 0) {
                //    console.log("");
                //}
                if (me.ContainsPartList(listPart, part.name) !== true) {
                    listPart.push({ name: part.name });
                } // if
            } // for partIdx
        } // for meshIdx
    } // for groupIdx

    return listPart;
};

DataManager.prototype.ContainsPartList = function (list, name) {
    for (var i = 0; i < list.length; i++) {
        if (name.localeCompare(list[i].name) === 0) {
            return true;
        }
    }
    return false;
};

DataManager.prototype.ContainsPartListName = function (list, name) {
    for (var i = 0; i < list.length; i++) {
        if (name.localeCompare(list[i]) === 0) {
            return true;
        }
    }
    return false;
};

DataManager.prototype.GetSelectPart = function () {
    var me = this;
    var list = [];
    for (var i = 0; i < me.mSelectObjects.length; i++) {
        var part = me.mSelectObjects[i];
        list.push(part.name);
    }
    return list;
};

DataManager.prototype.SelectModel = function (mx, my, object, onUpPosition) {
    var me = this;

    me.bSelectProcess = true;

    // 이전 모델 선택 초기화
    me.UnSelectModel(object);
    //alert("SelectModel");
    me.HitTestNode(mx, my, onUpPosition);
    //alert("HitTestNode");
    if (me.mSelectedModels.length > 0) {
        var models = new THREE.Object3D();
        var strName = "";
        for (var i = 0; i < me.mSelectedModels.length; i++) {
            // 모델 만들기
            var meshTmp = me.mSelectedModels[i].part.mesh; //me.mSelectedModels[i].mesh;
            var partTmp = me.mSelectedModels[i].part;
            var positions = meshTmp.geometry.attributes.position.array;
            var normals = meshTmp.geometry.attributes.normal.array;

            var buffpos = new Float32Array(partTmp.count);
            var buffnormal = new Float32Array(partTmp.count);

            for (var j = 0; j < partTmp.count; j++) {
                buffpos[j] = positions[j + partTmp.startIdx];
                buffnormal[j] = normals[j + partTmp.startIdx];
            }

            var buffgeom = new THREE.BufferGeometry();
            buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
            buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
            buffgeom.computeBoundingBox();
            buffgeom.computeBoundingSphere();

            var material = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });

            var selectmesh = new THREE.Mesh(buffgeom, material);
            selectmesh.name = partTmp.name;
            if (!selectmesh.userData.init) {
                var tag = this.Tag();
                tag.opacity = 1;
                selectmesh.userData = tag;
            }
            selectmesh.userData.partTmp = partTmp;
            selectmesh.userData.mesh = meshTmp; // = { part: partTmp, mesh: meshTmp };
            models.add(selectmesh);
        }
        // Ray 
        //onUpPosition.x = 0.5561708860759493;
        //onUpPosition.y = 0.45673749923706053;
        var mouse = new THREE.Vector2();
        //mouse.set((onUpPosition.x * 2) - 1, -(onUpPosition.y * 2) + 1);
        mouse.set(onUpPosition.x, onUpPosition.y);

        projector = new THREE.Projector();
        if (this.mCameraMode === this.PROJECTIONMODE.PERSPECTIVE) {
            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            projector.unprojectVector(vector, me.camera);
            var tmp = vector.sub(me.camera.position).normalize();
            me.raycaster = new THREE.Raycaster(me.camera.position, tmp);
        }
        else {
            var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
            projector.unprojectVector(origin, me.camera);

            var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
            me.raycaster = new THREE.Raycaster();
            me.raycaster.set(origin, direction);
        }

        if (models.children.length > 0) {
            var intersects = me.raycaster.intersectObjects(models.children, true);

            if (intersects.length > 0) {
                console.log('intersect: ' + intersects[0].object.name);
                for (var i = 0; i < models.children.length; i++) {
                    var mesh = models.children[i];
                    if (mesh.name.localeCompare(intersects[0].object.name) === 0) {
                        mesh.userData.partTmp.selected = true;
                        me.mSelectObjects.push(mesh.userData.partTmp);
                    }
                }

                me.SetAllPartColor(object);
            }
            else {
                console.log('no intersect');
            }
        } // if models.children.length > 0
        else {
            //alert("models.children.length < 0!!!");
        }
    }
    else {
        //alert("models.children.length < 0!!!");
    }

    me.bSelectProcess = false;
};

DataManager.prototype.SelectParts = function (names, object) {
    var me = this;

    // 이전 모델 선택 초기화
    me.UnSelectModel(object);

    // 전체 ColorMesh를 돌면서 선택처리
    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var i = 0; i < object.children[groupIdx].children.length; i++) {
            var colormesh = object.children[groupIdx].children[i];

            var parts = colormesh.geometry.attributes.parts.array;
            for (var k = 0; k < parts.length; k++) {
                var part = parts[k];

                var bExisted = false;
                for (var nameIdx = 0; nameIdx < names.length; nameIdx++) {
                    if (part.name.localeCompare(names[nameIdx]) === 0) {
                        bExisted = true;
                        break;
                    }
                }

                if (bExisted) {
                    part.selected = true;

                    me.mSelectObjects.push(part);
                } // for i
            } // if 
        } // for k
    } // for groupIdx

    me.SetAllPartColor(object);
};

DataManager.prototype.UnSelectModel = function (object) {
    var me = this;

    for (var i = 0; i < me.mSelectObjects.length; i++) {
        var part = me.mSelectObjects[i];
        part.selected = false;
    }

    me.SetAllPartColor(object);

    // 이전 선택 모델 초기화
    me.mSelectedModels = [];
    me.mSelectObjects = [];
};


DataManager.prototype.HitTestNode = function (mx, my, onUpPosition) {
    var me = this;

    //    mx = 717;
    //    my = 265.5099792480469;
    //    onUpPosition.x = 0.5745192307692307;
    //    onUpPosition.y = 0.3318875122070313;

    var mouse = new THREE.Vector2();
    //mouse.set((onUpPosition.x * 2) - 1, -(onUpPosition.y * 2) + 1);
    mouse.set(onUpPosition.x, onUpPosition.y);

    var rootNode = me.RootNode;

    var boundbox = rootNode.bbox;

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
        me.HitTestSubNode(mx, my, onUpPosition, rootNode);
    }
};

DataManager.prototype.HitTestSubNode = function (mx, my, onUpPosition, parent) {
    var me = this;
    var mouse = new THREE.Vector2();
    //mouse.set((onUpPosition.x * 2) - 1, -(onUpPosition.y * 2) + 1);
    mouse.set(onUpPosition.x, onUpPosition.y);

    for (var i = 0; i < parent.children.length; i++) {
        var node = parent.children[i];

        var boundbox = node.bbox;

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
            if (node.children !== null) {
                if (node.children.length > 0)
                    me.HitTestSubNode(mx, my, onUpPosition, node);
            }
            else {
                me.mSelectedModels.push({ part: node, mesh: node.mesh });
            }
        }
    }
};

function get_screen_xy(position) {
    var me = this;
    var pos = new THREE.Vector3(0, 0, 0);
    pos.x = position[0];
    pos.y = position[1];
    pos.z = position[2];
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices(me.camera.projectionMatrix, me.camera.matrixWorldInverse);
    //projScreenMat.multiplyMatrices(me.camera.cameraP.projectionMatrix, me.camera.cameraP.matrixWorldInverse);
    pos.applyProjection(projScreenMat);

    var rect = me.container.getBoundingClientRect();

    return {
        x: ((pos.x + 1) * rect.width / 2) - rect.left,
        y: ((-pos.y + 1) * rect.height / 2) + rect.top,
        z: pos.z
    };
}

function get_screen_xyByVector(position) {
    var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    pos.applyProjection(projScreenMat);

    var rect = container.getBoundingClientRect();

    //    return { x: ((pos.x + 1) * (rect.width ) / 2),//rect.left,
    //        y: ((-pos.y + 1) * (rect.height ) / 2) ,//rect.top,
    //        z: pos.z
    //    };

    return {
        x: ((pos.x + 1) * (rect.width + container.offsetLeft) / 2) + container.offsetLeft / 2, // - rect.left,
        y: ((-pos.y + 1) * (rect.height + container.offsetTop) / 2) + container.offsetTop / 2, // + rect.top,
        z: pos.z
    };
}

function IsPointInTriangle2D(x, y, tx1, ty1, tx2, ty2, tx3, ty3) {
    var dir1X, dir1Y, dir2X, dir2Y, cross1, cross2, cross3;

    dir1X = tx2 - tx1; dir1Y = ty2 - ty1;
    dir2X = x - tx1; dir2Y = y - ty1;
    cross1 = dir1X * dir2Y - dir1Y * dir2X;

    dir1X = tx3 - tx2; dir1Y = ty3 - ty2;
    dir2X = x - tx2; dir2Y = y - ty2;
    cross2 = dir1X * dir2Y - dir1Y * dir2X;

    dir1X = tx1 - tx3; dir1Y = ty1 - ty3;
    dir2X = x - tx3; dir2Y = y - ty3;
    cross3 = dir1X * dir2Y - dir1Y * dir2X;

    if ((cross1 <= 0 && cross2 <= 0 && cross3 <= 0) || (cross1 >= 0 && cross2 >= 0 && cross3 >= 0))
        return true;

    return false;
}

function GetPlaneBy3Pt(v1, v2, v3) {
    var plane = new Float32Array([1, 0, 0, 0]);
    var p1 = new Float32Array([v2.x - v1.x, v2.y - v1.y, v2.z - v1.z]);
    var p2 = new Float32Array([v3.x - v1.x, v3.y - v1.y, v3.z - v1.z]);

    var n = new Float32Array([p1[1] * p2[2] - p1[2] * p2[1], p1[2] * p2[0] - p1[0] * p2[2], p1[0] * p2[1] - p1[1] * p2[0]]);

    var length = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);

    if (length < 0.00001)
        return plane;
    n[0] /= length; n[1] /= length; n[2] /= length;

    plane[0] = n[0];
    plane[1] = n[1];
    plane[2] = n[2];
    plane[3] = -(n[0] * v1.x + n[1] * v1.y + n[2] * v1.z);

    return plane;
}



DataManager.prototype.Min =
    function (source, target) {
        var x, y, z;
        if (source.x > target.x)
            x = target.x;
        else
            x = source.x;

        if (source.y > target.y)
            y = target.y;
        else
            y = source.y;

        if (source.z > target.z)
            z = target.z;
        else
            z = source.z;

        return new THREE.Vector3(x, y, z);
    };

DataManager.prototype.Max =
    function (source, target) {
        var x, y, z;
        if (source.x < target.x)
            x = target.x;
        else
            x = source.x;

        if (source.y < target.y)
            y = target.y;
        else
            y = source.y;

        if (source.z < target.z)
            z = target.z;
        else
            z = source.z;

        return new THREE.Vector3(x, y, z);
    };


DataManager.prototype.UnloadModel =
    function (name, object) {
        // 파일 메쉬 삭제
        for (var i = object.children.length - 1; i >= 0; i--) {
            var model = object.children[i];

            if (model.name.localeCompare(name) === 0) {
                object.remove(model);
                for (var meshIdx = 0; meshIdx < model.children.length; meshIdx++) {
                    model.children[meshIdx].userData = null;
                    model.children[meshIdx].geometry.attributes.position.array = null;
                    model.children[meshIdx].geometry.attributes.normal.array = null;
                    model.children[meshIdx].geometry.attributes.parts.array = null;
                    model.children[meshIdx].geometry.dispose();
                    model.children[meshIdx].material.dispose();
                }
            }
        }

        // 데이터 관리 트리 삭제
        for (var i = this.RootNode.children.length - 1; i >= 0; i--) {
            var filenode = this.RootNode.children[i];
            if (filenode.filename.localeCompare(name) === 0) {
                this.RootNode.children.splice(i, 1);
            }
        }
    };


/// 파트 색상 초기화
DataManager.prototype.InitPartColor =
    function (object) {
        var me = this;
        for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
            for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
                var mesh = object.children[groupIdx].children[meshIdx];
                var parts = mesh.geometry.attributes.parts.array;
                for (var partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
                    var part = parts[partIdx];
                    // 색상 변경 해제
                    part.colorchanged = false;
                    // 플라스틱 색상 변경 해제
                    part.colorplasticchanged = false;
                    // 플라스틱 모드 해제
                    part.colorplastic = false;

                } // for partIdx
            } // for meshIdx
        } // for groupIdx

        me.SetAllPartColor(object);
    }

DataManager.prototype.GetTreeNode = function (parent, id) {
    var node = null;
    for (var i = 0; i < parent.children.length; i++) {
        var vo = parent.children[i];
        if (vo.ID === id) {
            node = vo;
            return node;
        }

        if (vo.children !== null) {
            node = this.GetTreeNode(vo, id);
            if (node !== null)
                return node;
        }
    }

    return node;
}

DataManager.prototype.RGB2HEX =
    function RGB2HEX(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

// 플라스틱 모드 설정
DataManager.prototype.SetModelPlasticMode =
    function (object, bPlastic) {
        var me = this;
        //me.bPlasticMode = bPlastic;
        for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
            for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
                var mesh = object.children[groupIdx].children[meshIdx];
                var parts = mesh.geometry.attributes.parts.array;
                for (var partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
                    var part = parts[partIdx];

                    part.colorplastic = bPlastic;
                    part.colorplasticchanged = false;

                } // for partIdx
            } // for meshIdx
        } // for groupIdx


        me.SetAllPartColor(object);
    };

DataManager.prototype.Tag =
    function Tag() {
        return {
            // Tag 초기화
            init: true,
            // 불투명도
            opacity: 1,
            // Mesh
            mesh: null,
            model: null,
            // 플라스틱 재질
            plasticmaterial: new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthTest: true, depthWrite: false }),
            //plasticmaterial: new THREE.MeshNormalMaterial( { transparent: true, opacity: 0.5 } ),
            // 원본 재질
            basematerial: null,

            partTmp: null,
            modelsTmp: null,
            changecolor: false,
            parts:null
        };
    };

DataManager.prototype.Part =
    function Part(id, name, startIdx, count, color, bbox, mesh, children) {
        var me = this;
        return {
            // 이름
            name: name,
            // 시작 Index
            startIdx: startIdx,
            // Vertices 참조 갯수
            count: count,
            // 색상
            color: color,
            // bbox
            bbox: bbox,
            // ID
            ID: id,
            // children
            children: children,
            // 선택 상태
            selected: false,
            // 색상 변경 상태
            colorchanged: false,
            // 플라스틱 모드
            colorplastic: false,
            // 플라스틱 모드 색상변경
            colorplasticchanged: false,

            // 보이기 숨기기 상태
            visible: true,
            // 원 색상
            color_base: { index: color, r: me.mColors[color].r, g: me.mColors[color].g, b: me.mColors[color].b, a: me.mColors[color].a },
            // 변경 색상
            color_change: null,
            // 선택 색상
            color_select: { index: -1, r: 255, g: 0, b: 0, a: 1 },
            // 플라스틱 색상
            color_plastic: { index: -1, r: 255, g: 255, b: 255, a: 0.5 },
            // 플라스틱 변경 색상
            color_change_plastic: { index: -1, r: 255, g: 255, b: 255, a: 0.5 },
            // 숨기기 색상
            color_hide: { index: -1, r: 255, g: 255, b: 255, a: 0 }
        };
    };

DataManager.prototype.SetPivot =
    function (object, controls, mx, my, onUpPosition) {
        var me = this;

        me.HitTestNode(mx, my, onUpPosition);
        //alert("HitTestNode");
        if (me.mSelectedModels.length > 0) {
            var models = new THREE.Object3D();
            var strName = "";
            for (var i = 0; i < me.mSelectedModels.length; i++) {
                // 모델 만들기
                var meshTmp = me.mSelectedModels[i].mesh;
                var partTmp = me.mSelectedModels[i].part;
                var positions = meshTmp.geometry.attributes.position.array;
                me.selectmeshbackup = meshTmp.geometry.attributes.position.clone();
                var normals = meshTmp.geometry.attributes.normal.array;

                var buffpos = new Float32Array(partTmp.count);
                var buffnormal = new Float32Array(partTmp.count);

                for (var j = 0; j < partTmp.count; j++) {
                    buffpos[j] = positions[j + partTmp.startIdx];
                    buffnormal[j] = normals[j + partTmp.startIdx];
                }

                var buffgeom = new THREE.BufferGeometry();
                buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
                buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
                buffgeom.computeBoundingSphere();

                var material = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, vertexColors: THREE.NoColors });

                var selectmesh = new THREE.Mesh(buffgeom, material);
                selectmesh.name = partTmp.name;
                if (!selectmesh.userData.init) {
                    var tag = this.Tag();
                    selectmesh.userData = tag;
                }
                selectmesh.userData.partTmp = partTmp;
                selectmesh.userData.mesh = meshTmp; // = { part: partTmp, mesh: meshTmp };
                models.add(selectmesh);
            }
            // Ray 
            var mouse = new THREE.Vector2();
            mouse.set((onUpPosition.x * 2) - 1, -(onUpPosition.y * 2) + 1);

            projector = new THREE.Projector();
            if (this.mCameraMode === this.PROJECTIONMODE.PERSPECTIVE) {
                var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                projector.unprojectVector(vector, me.camera);
                var tmp = vector.sub(me.camera.position).normalize();
                me.raycaster = new THREE.Raycaster(me.camera.position, tmp);
            }
            else {
                var origin = new THREE.Vector3(mouse.x, mouse.y, -1);
                projector.unprojectVector(origin, me.camera);

                var direction = (new THREE.Vector3(0, 0, -1)).transformDirection(camera.matrixWorld);
                me.raycaster = new THREE.Raycaster();
                me.raycaster.set(origin, direction);
            }

            if (models.children.length > 0) {
                var intersects = me.raycaster.intersectObjects(models.children, true);

                if (intersects.length > 0) {
                    console.log('intersect: ' + intersects[0].object.name);

                    for (var i = 0; i < models.children.length; i++) {
                        var mesh = models.children[i];
                        if (mesh.name.localeCompare(intersects[0].object.name) === 0) {

                            bbox = new THREE.BoundingBoxHelper(mesh, 0xff0000);
                            bbox.update();

                            // Model Center
                            var vCenter = new THREE.Vector3(
                                (bbox.box.max.x + bbox.box.min.x) / 2
                                , (bbox.box.max.y + bbox.box.min.y) / 2
                                , (bbox.box.max.z + bbox.box.min.z) / 2);

                            controls.bPivot = true;
                            controls.Pivot = vCenter;

                        } // if
                    } // for i
                }
                else {
                    console.log('no intersect');
                }
            } // if models.children.length > 0
            else {
                //alert("models.children.length < 0!!!");
            }
        }
        else {
            //alert("models.children.length < 0!!!");
        }
    };

DataManager.prototype.SetCamera =
    function (camera, mode) {
        if (mode === 0) {
            this.mCameraMode = this.PROJECTIONMODE.PERSPECTIVE;
        }
        else {
            this.mCameraMode = this.PROJECTIONMODE.ORTHOGRAPHIC;
        }
        this.camera = camera;
    };

DataManager.prototype.GetColorMesh =
    function (color, groupIdx, object) {
        var colormesh = null;
        // 기존에 추가한 색상이 있다면 메쉬 정보 가져오기
        for (var meshIdx = 0; meshIdx < object.children[groupIdx].children.length; meshIdx++) {
            var mesh = object.children[groupIdx].children[meshIdx];
            if (mesh.userData.color === color.index) {
                colormesh = mesh;
                break;
            }
        }

        return colormesh;
    };

/// 멀티 파트의 색상 변경
DataManager.prototype.SetPartColor =
    function (name, object, r, g, b, a) {
        var me = this;
        // 컬러 색상 가져오기
        var bColor = false;
        var color = me.GetColor({ r: r, g: g, b: b, a: a });
        if (color === null) {
            // 신규 컬러 추가
            color = me.AddColorTable({ r: r, g: g, b: b, a: a });
        }
        else {
            bColor = true;
        }

        for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
            for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
                var mesh = object.children[groupIdx].children[meshIdx];
                var parts = mesh.geometry.attributes.parts.array;
                for (var partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
                    var part = parts[partIdx];
                    var bContains = false;

                    if (name.localeCompare(part.name) === 0 &&
                        part.color !== color.index) {
                        bContains = true;
                    }

                    if (bContains) {
                        if (part.colorplastic) {
                            part.colorplasticchanged = true;
                            part.color_change_plastic = color;
                            //part.color_change_plastic.r = color.r;
                            //part.color_change_plastic.g = color.g;
                            //part.color_change_plastic.b = color.b;
                        }
                        else {
                            part.colorchanged = true;
                            part.color_change = color;
                        }
                    } // if
                } // for partIdx
            } // for meshIdx
        } // for groupIdx

        me.SetAllPartColor(object);
    };

/// 멀티 파트의 색상 변경
DataManager.prototype.SetPartsColor = function (names, object, r, g, b, a) {
    var me = this;
    // 컬러 색상 가져오기
    var bColor = false;
    var color = me.GetColor({ r: r, g: g, b: b, a: a });
    if (color === null) {
        // 신규 컬러 추가
        color = me.AddColorTable({ r: r, g: g, b: b, a: a });
    }
    else {
        bColor = true;
    }

    var colorMesh = null;

    var count = 0;
    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        colorMesh = me.GetColorMesh(color, groupIdx, object);
        for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
            var mesh = object.children[groupIdx].children[meshIdx];

            var parts = mesh.geometry.attributes.parts.array;

            for (var partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
                var part = parts[partIdx];

                var bContains = false;

                for (var c = 0; c < names.length; c++) {
                    if (names[c].localeCompare(part.name) === 0 &&
                        part.color !== color.index) {
                        bContains = true;
                        break;
                    }
                }

                if (bContains) {
                    if (part.colorplastic) {
                        part.colorplasticchanged = true;
                        part.color_change_plastic = color;
                        //part.color_change_plastic.r = color.r;
                        //part.color_change_plastic.g = color.g;
                        //part.color_change_plastic.b = color.b;
                    }
                    else {
                        part.colorchanged = true;
                        part.color_change = color;
                    }
                } // if
            } // for partIdx
        } // for meshIdx
    } // for groupIdx

    me.SetAllPartColor(object);
};




function RGB2HEX(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

DataManager.prototype.SetAllPartColor = function (object) {
    var me = this;
    // 컬러 색상 가져오기
    var bColor = false;
    var color;

    var colorMesh = null;

    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
            var mesh = object.children[groupIdx].children[meshIdx];
            var parts = mesh.userData.parts;//mesh.geometry.attributes.parts.array;
            for (var partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
                var part = parts[partIdx];

                // 숨기기 상태
                if (part.visible === false) {
                    color = me.GetColor({ r: part.color_hide.r, g: part.color_hide.g, b: part.color_hide.b, a: part.color_hide.a });
                    if (color === null) {
                        color = me.AddColorTable({ r: part.color_hide.r, g: part.color_hide.g, b: part.color_hide.b, a: part.color_hide.a });
                    }
                }
                // 선택
                else if (part.selected) {
                    color = me.GetColor({ r: part.color_select.r, g: part.color_select.g, b: part.color_select.b, a: part.color_select.a });
                    if (color === null) {
                        color = me.AddColorTable({ r: part.color_select.r, g: part.color_select.g, b: part.color_select.b, a: part.color_select.a });
                    }
                }

                // 플라스틱
                //else if (me.bPlasticMode) {
                else if (part.colorplastic) {
                    if (part.colorplasticchanged) {
                        color = me.GetColor({ r: part.color_change_plastic.r, g: part.color_change_plastic.g, b: part.color_change_plastic.b, a: part.color_change_plastic.a });
                        if (color === null) {
                            color = me.AddColorTable({ r: part.color_change_plastic.r, g: part.color_change_plastic.g, b: part.color_change_plastic.b, a: part.color_change_plastic.a });
                        }
                    }
                    else {
                        color = me.GetColor({ r: part.color_plastic.r, g: part.color_plastic.g, b: part.color_plastic.b, a: part.color_plastic.a });
                        if (color === null) {
                            color = me.AddColorTable({ r: part.color_plastic.r, g: part.color_plastic.g, b: part.color_plastic.b, a: part.color_plastic.a });
                        }
                    }
                }

                // 색상 변경
                else if (part.colorchanged) {
                    color = me.GetColor({ r: part.color_change.r, g: part.color_change.g, b: part.color_change.b, a: part.color_change.a });
                    if (color === null) {
                        color = me.AddColorTable({ r: part.color_change.r, g: part.color_change.g, b: part.color_change.b, a: part.color_change.a });
                    }
                }
                // 기본
                else {
                    color = me.GetColor({ r: part.color_base.r, g: part.color_base.g, b: part.color_base.b, a: part.color_base.a });
                    if (color === null) {
                        color = me.AddColorTable({ r: part.color_base.r, g: part.color_base.g, b: part.color_base.b, a: part.color_base.a });
                    }
                }

                colorMesh = me.GetColorMesh(color, groupIdx, object);

                // Part Mesh 리스트 생성
                // 색상이 다르다면 목록을 만든다.
                if (color.index !== part.color) {
                    var positions = mesh.geometry.attributes.position.array;
                    var normals = mesh.geometry.attributes.normal.array;

                    //색상 변경될 모델 정보 관리
                    var subpositions = positions.subarray(part.startIdx, part.startIdx + part.count);
                    var subnormals = normals.subarray(part.startIdx, part.startIdx + part.count);

                    var newpositions = new Float32Array(positions.length - part.count);
                    var newnormals = new Float32Array(normals.length - part.count);

                    // 변경된 모델의 데이터 정리
                    newpositions.set(positions.subarray(0, part.startIdx), 0);
                    newpositions.set(positions.subarray(part.startIdx + part.count, positions.length), part.startIdx);

                    newnormals.set(normals.subarray(0, part.startIdx), 0);
                    newnormals.set(normals.subarray(part.startIdx + part.count, normals.length), part.startIdx);

                    newparts = parts.splice(partIdx, 1);

                    // 파트 시작 인덱스 조정
                    for (var i = 0; i < parts.length; i++) {
                        if (parts[i].startIdx >= part.startIdx) {
                            parts[i].startIdx = parts[i].startIdx - part.count;
                        }
                    }

                    if (colorMesh !== mesh) {
                        // 이전 메쉬 데이터 리프레쉬
                        mesh.geometry.addAttribute('position', new THREE.BufferAttribute(newpositions, 3));
                        mesh.geometry.addAttribute('normal', new THREE.BufferAttribute(newnormals, 3));
                        //mesh.geometry.addAttribute('parts', new THREE.BufferAttribute(parts, 1));

                        //mesh.geometry.attributes.position.needsUpdate = true;
                        //mesh.geometry.attributes.normal.needsUpdate = true;
                        //mesh.geometry.computeBoundingBox();
                        //mesh.geometry.computeBoundingSphere();

                        // 메쉬의 데이터가 없는경우 삭제
                        if (newpositions.length === 0 && newnormals.length === 0 && parts.length === 0) {
                            mesh.userData = null;
                            mesh.geometry.attributes.position.array = null;
                            mesh.geometry.attributes.normal.array = null;
                            //mesh.geometry.attributes.parts.array = null;
                            mesh.geometry.dispose();
                            mesh.material.dispose();
                            object.children[groupIdx].remove(mesh);
                        } // if (newpositions.length == 0 && newnormals.length == 0 && parts.length == 0)
                    } // if (colorMesh != mesh)

                    // 변경 색상의 Mesh에 파트 정보 추가
                    if (colorMesh !== null) {
                        var colorpositions = colorMesh.geometry.attributes.position.array;
                        var colornormals = colorMesh.geometry.attributes.normal.array;
                        var colorparts = colorMesh.userData.parts;//colorMesh.geometry.attributes.parts.array;

                        var buffpos = new Float32Array(colorpositions.length + part.count);
                        var buffnormal = new Float32Array(colornormals.length + part.count);

                        // 새로운 배열에 기존정보 추가
                        buffpos.set(colorpositions, 0);
                        buffnormal.set(colornormals, 0);

                        // 새로운 배열에 신규정보 추가
                        buffpos.set(subpositions, colorpositions.length);
                        buffnormal.set(subnormals, colornormals.length);

                        part.startIdx = colorpositions.length;
                        part.color = color.index;
                        part.mesh = colorMesh;

                        colorparts.push(part);

                        colorMesh.geometry.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
                        colorMesh.geometry.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
                        //colorMesh.geometry.addAttribute('parts', new THREE.BufferAttribute(colorparts, 1));
                        colorMesh.userData.parts = colorparts;
                        //colorMesh.geometry.computeBoundingSphere();
                        //colorMesh.geometry.computeBoundingBox();
                        //colorMesh.geometry.attributes.position.needsUpdate = true;
                        //colorMesh.geometry.attributes.normal.needsUpdate = true;

                        // 숨김 상태는 Mesh에서 처리
                        if (!part.visible)
                            colorMesh.visible = false;

                        // 선택 파트의 뎁스 설정
                        if (part.selected)
                            colorMesh.renderOrder = 0;
                        else
                            colorMesh.renderOrder = 1;
                    }
                    else {
                        // 메쉬의 데이터가 없는경우 삭제
                        if (newpositions.length === 0 && newnormals.length === 0 && parts.length === 0) {
                            mesh.userData = null;
                            mesh.geometry.attributes.position.array = null;
                            mesh.geometry.attributes.normal.array = null;
                            //mesh.geometry.attributes.parts.array = null;
                            mesh.geometry.dispose();
                            mesh.material.dispose();
                            object.children[groupIdx].remove(mesh);
                        }

                        // 메쉬를 새로 생성한다.
                        var buffpos = new Float32Array(part.count);
                        var buffnormal = new Float32Array(part.count);

                        // 새로운 배열에 신규정보 추가
                        buffpos.set(subpositions, 0);
                        buffnormal.set(subnormals, 0);
                        var colorparts = [];
                        part.startIdx = 0;
                        part.color = color.index;
                        colorparts.push(part);

                        var buffgeom = new THREE.BufferGeometry();
                        buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
                        buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
                        //buffgeom.addAttribute('parts', new THREE.BufferAttribute(colorparts, 1));
                        //buffgeom.computeBoundingSphere();
                        //buffgeom.computeBoundingBox();

                        var colorTmp = RGB2HEX(parseInt(color.r), parseInt(color.g), parseInt(color.b));

                        var material = new THREE.MeshPhongMaterial({
                            color: colorTmp,
                            side: THREE.DoubleSide,
                            transparent: true,
                            vertexColors: THREE.NoColors,
                            opacity: color.a
                        });
                        meshtmp = new THREE.Mesh(buffgeom, material);
                        meshtmp.castShadow = true;
                        part.mesh = meshtmp;
                        colorMesh = meshtmp;
                        if (!meshtmp.userData.init) {
                            var tag = me.Tag();
                            tag.color = color.index;
                            tag.parts = colorparts;
                            meshtmp.userData = tag;
                        }
                        object.children[groupIdx].add(colorMesh);

                        // 숨김 상태는 Mesh에서 처리
                        if (!part.visible)
                            colorMesh.visible = false;

                        // 선택 파트의 뎁스 설정
                        if (part.selected)
                            colorMesh.renderOrder = 0;
                        else
                            colorMesh.renderOrder = 1;
                    }
                } // if (color.index != part.color)
            } // for partIdx
        } // for meshIdx
    } // for groupIdx

    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
            var mesh = object.children[groupIdx].children[meshIdx];
            mesh.geometry.computeBoundingSphere();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.attributes.normal.needsUpdate = true;
        } // for meshIdx
    } // for groupIdx
};



DataManager.prototype.GetBoundingBox = function (object) {
    var minX = +Infinity;
    var minY = +Infinity;
    var minZ = +Infinity;

    var maxX = -Infinity;
    var maxY = -Infinity;
    var maxZ = -Infinity;

    for (var groupIdx = 0; groupIdx < object.children.length; groupIdx++) {
        for (var meshIdx = object.children[groupIdx].children.length - 1; meshIdx >= 0; meshIdx--) {
            var mesh = object.children[groupIdx].children[meshIdx];
            if (mesh.visible === true) {
                var positions = mesh.geometry.attributes.position.array;

                for (var i = 0, l = positions.length; i < l; i += 3) {

                    var x = positions[i];
                    var y = positions[i + 1];
                    var z = positions[i + 2];

                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (z < minZ) minZ = z;

                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    if (z > maxZ) maxZ = z;

                }
            }
        }
    }

    var min = new THREE.Vector3(minX, minY, minZ);
    var max = new THREE.Vector3(maxX, maxY, maxZ);
    var box = { min: min, max: max };
    return { box: box };
};
