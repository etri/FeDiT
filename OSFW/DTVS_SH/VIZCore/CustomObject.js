//import $ from 'jquery';

class CustomObject {
    constructor(view, VIZCore) {
        let scope = this;


        let mapPipeline = new Map();
        let id_current = 1;

        // Custom Object List
        let CustomObjects = []; //CustomObjectData
        let CustomObjectsUpdateLength = 0;

        //let selectionColor = new VIZCore.Color(255, 0, 0, 255);
        //let selectionColor = view.Configuration.Model.Selection.Color;
        if (view.DEBUG) {
            this.GetObjectsByDEBUG = function () {
                return CustomObjects;
            };
        }

        // 파일 다운로드 완료 초기 위치설정 관리
        let DownloadInitDatas = [];

        init();
        function init() {
        }

        /**
         * CustomObject Key
         * @returns {String}
         */
        this.GetKey = function() {
            return "softhills_CustomObject";
        };

        /**
         * 모두 제거
         */
        this.Clear = function () {

            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {
                scope.DeleteObject(CustomObjects[i].uuid);
            }

            CustomObjects = [];
            CustomObjectsUpdateLength = 0;
            id_current = 1;

            DownloadInitDatas = [];
        };


        // 개체 추가
        this.AddObject = function (customObject) {
            //customObject (Data.CustomObjectData())
            CustomObjects.push(customObject);

            for (let i = 0; i < customObject.object.length; i++) {

                customObject.object[i].id_file = scope.GetKey();

                //색상 ID 등록
                view.Data.IDColor.new();
                let colors = [];

                //개체 추가시 ID부여
                for(let j = 0 ; j < customObject.object[i].tag.length ; j++) {
                    let body = customObject.object[i].tag[j];

                    body.partId = id_current; id_current++;
                    body.bodyId = id_current; id_current++;
                    body.origin_id = body.bodyId;

                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                    
                    //Action 데이터 설정
                    {
                        if(action === undefined) {
                            action = view.Data.ActionItem();

                            action.material = body.material;
                        }

                        //파일 읽는 부분에서 material 등록이 있기때문에 등록 필요
                        view.Data.ShapeAction.SetAction(body.object.id_file, body.origin_id, action);
                    }

                    //색상 정보 등록
                    body.colorIdx = view.Data.IDColor.r + (view.Data.IDColor.g << 8) + (view.Data.IDColor.b << 16) + (view.Data.IDColor.a * 16777216); //<< 24
                    
                    //let colorArrLength = body.m_nVtx / 3 * 4; //vectex 3, color는 4
                    let colorArrLength = body.m_nVtx * 4; //vectex 3, color는 4
                    for (let k = 0; k < colorArrLength; k = k + 4) {
                        colors[k + 0] = view.Data.IDColor.r;
                        colors[k + 1] = view.Data.IDColor.g;
                        colors[k + 2] = view.Data.IDColor.b;
                        colors[k + 3] = view.Data.IDColor.a;
                    }
                }

                //색상 적용
                customObject.object[i].attribs.a_color.array = new Uint8Array(colors);

                view.RenderWGL.SetDataByObject(customObject.object[i]);
            }
            CustomObjectsUpdateLength++;

            //scope.SetPosAndDirection(customObject.uuid,
            //    new VIZCore.Vector3(),
            //    new VIZCore.Vector3(-1, 0 ,0),
            //    new VIZCore.Vector3(0, 0, 1)
            //);
            //테스트
            //scope.SetAnimationByIndex(customObject.uuid, 0, 0);
        };

        // 개체 삭제
        this.DeleteObject = function (customID) {
            //customID (Data.CustomObjectData().uuid) (undefined 일경우 모두 제거)
            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {

                if (customID !== undefined) {
                    if (CustomObjects[i].uuid.localeCompare(customID) !== 0) { continue; }
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.ReleaseDataByObject(CustomObjects[i].object[k]);
                }

                CustomObjects.splice(i, 1);
                CustomObjectsUpdateLength--;
                break;
            }

        };

        // 개체 반환
        this.GetObject = function (customID) {

            for (let i = 0; i < CustomObjects.length; i++) {
                if (CustomObjects[i].uuid !== customID)
                    continue;

                return CustomObjects[i];
            }

            return undefined;
        };

        // 개체 반환 (Body ID)
        this.GetObjectByBodyID = function (bodyID) {

            for (let i = 0; i < CustomObjects.length; i++) {
                for (let j = 0; j < CustomObjects[i].object.length; j++) {
                    if (CustomObjects[i].object[j].bodyId !== bodyID)
                        continue;

                    return CustomObjects[i];
                }
            }

            return undefined;
        };

        // Custom Object에서 Bodies 반환
        this.GetBodyFormObject = function (customObject) {
            let bodies = [];
            for (let i = 0; i < customObject.object.length; i++) {
                let object = customObject.object[i];
                for (let m = 0; m < object.tag.length; m++) {
                    bodies.push(object.tag[m]);
                }
            }
            return bodies;
        };

        /**
         * 색상 변경
         * @param {Number} customID 
         * @param {VIZCore.Color} color undefined 초기 색상으로 변경
         */
        this.SetObjectColor = function (customID, color) {
            let customObject = scope.GetObject(customID);
            if(customObject === undefined) return;

            for(let i = 0 ; i < customObject.object.length; i++) {
                let obj = customObject.object[i];

                for(let j = 0 ; j < obj.tag.length; j++) {
                    let body = obj.tag[j];
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                    if(color === undefined) {
                        action.customColor = false;
                        action.color = undefined;
                    }
                    else {
                        action.customColor = true;
                        action.color = color;
                    }
                    obj.flag.updateProcess = true;
                }
            }
        }; 

        /**
          * 색상 반환
         * @param {Number} customID 
         * @returns {VIZCore.Color} 
         */
        this.GetObjectColor = function (customID) {
            let color = undefined;

            let customObject = scope.GetObject(customID);
            if(customObject === undefined) return undefined;

            for(let i = 0 ; i < customObject.object.length; i++) {
                let obj = customObject.object[i];

                let body = obj.tag[0];
                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                if(action.customColor)
                    color = action.color;
                else
                    color = body.color;
            }

            return color;
        };

        /**
         * 개체 Material 적용
         * @param {Number} customID 개체 ID
         * @param {Number} materialID 등록할 Material ID
         */
        this.SetObjectMaterial = function (customID, materialID) {
            
            let customObject = scope.GetObject(customID);
            if(customObject === undefined) return;

            let bodies = scope.GetBodyFormObject(customObject);
            for(let i = 0; i < bodies.length ;i++) {
                let body = bodies[i];
                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                
                action.material = materialID;
                body.object.flag.updateProcess = true;
            }
        };

        /**
         * 
         * @param {Number} customID 개체 ID
         * @returns {Number} Material ID (찾지 못 한경우 -1)
         */
        this.GetObjectMaterial = function(customID) {
            let customObject = scope.GetObject(customID);
            if(customObject === undefined) return -1;

            let bodies = scope.Main.CustomObject.GetBodyFormObject(customObject);
            for(let i = 0; i < bodies.length ;i++) {
                let body = bodies[i];

                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);                
                return action.material;                
            }

            return -1;
        };

        /**
         * 
         * @param {String} szName 
         * @param {boolean} fullMatch 
         * @returns {Array<*>} id 반환
         */
        this.FindObjectByName = function (szName, fullMatch) {
            let result = [];
            
            for(let i = 0 ; i < CustomObjects.length; i++) {
                let obj = CustomObjects[i];

                if (fullMatch) {
                    if (obj.name.localeCompare(szName) === 0) {
                        result.push(obj.id);

                    }
                }
                else {
                    if (obj.name.toUpperCase().includes(szName.toUpperCase())) {
                        result.push(obj.id);
                    }
                }
            }

            return result;
        };

        ///**
        // * 해당 개체의 애니메이션 추가
        // * @param {Data.UUIDv4()} customID
        // * @param {Number} animation index
        // * @param {Number} aniLayerIdx (-1 === 맨 뒤에 추가)
        // * @param {Data.CustomObjectAnimation()} animationData
        // */
        this.AddAnimationData = function (customID, aniIndex, aniLayerIdx, animationData) {
            let obj = scope.GetObject(customID);
            if (obj === undefined)
                return; //해당 개체 없음

            if (aniIndex < 0)
                aniIndex = 0;

            if (obj.animation[aniIndex] === undefined) {
                obj.animation[aniIndex] = animationData;
            }
            else {
                //obj.animation[aniIndex].layer[aniLayerIdx] = animationData.layer[0];
                if (aniLayerIdx >= 0) {
                    for (let i = 0; i < animationData.layer.length; i++) {
                        obj.animation[aniIndex].layer[aniLayerIdx + i] = animationData.layer[i];
                    }
                }
                else {
                    for (let i = 0; i < animationData.layer.length; i++) {
                        obj.animation[aniIndex].layer.push(animationData.layer[i]);
                    }
                }
            }
        };

        // 애니메이션 변경
        this.SetAnimationByIndex = function (customID, aniIndex, aniLayerIdx) {
            //Custom Object Animation 설정
            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {

                if (customID !== undefined) {
                    if (CustomObjects[i].uuid.localeCompare(customID) !== 0) { continue; }
                }

                if (aniLayerIdx < CustomObjects[i].animation[aniIndex].layer.length)
                    scope.SetAnimation(CustomObjects[i].uuid, aniIndex, CustomObjects[i].animation[aniIndex].layer[aniLayerIdx].ID);
            }
        };

        // 애니메이션 변경
        this.SetAnimation = function (customID, aniIndex, aniLayerID) {
            //Custom Object Animation 설정
            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {

                if (customID !== undefined) {
                    if (CustomObjects[i].uuid.localeCompare(customID) !== 0) { continue; }
                }

                let animationKindChanged = false;
                if (CustomObjects[i].currentAnimationNum !== aniIndex) {
                    animationKindChanged = true;
                    //CustomObjects[i].animation[aniIndex].playAnimation = -1;
                    //CustomObjects[i].animation[aniIndex].lastAnimation = -1;
                }

                let playIdx = -1;
                for (let j = 0; j < CustomObjects[i].animation[aniIndex].layer.length; j++) {

                    if (CustomObjects[i].animation[aniIndex].layer[j].ID !== aniLayerID)
                        continue;

                    playIdx = j;
                    break;
                }

                //동일애니메이션
                if (!animationKindChanged && CustomObjects[i].animation[aniIndex].playAnimation === playIdx)
                    return;

                CustomObjects[i].currentAnimationNum = aniIndex;

                CustomObjects[i].animation[aniIndex].lastAnimation = CustomObjects[i].animation[aniIndex].playAnimation;
                CustomObjects[i].animation[aniIndex].lastAnimationSecond = CustomObjects[i].animation[aniIndex].animationSecond;

                CustomObjects[i].animation[aniIndex].playAnimation = -1;
                if (playIdx >= 0) {
                    CustomObjects[i].animation[aniIndex].playAnimation = playIdx;
                    CustomObjects[i].animation[aniIndex].animationSecond = 0;
                }

                //for (let j = 0; j < CustomObjects[i].animation[aniIndex].layer.length; j++) {
                //
                //    if (CustomObjects[i].animation[aniIndex].layer[j].ID !== aniLayerID) continue;
                //
                //    CustomObjects[i].animation[aniIndex].playAnimation = j;
                //    CustomObjects[i].animation[aniIndex].animationSecond = 0;
                //    break;
                //}
                if (animationKindChanged) //group 단위 변경
                    CustomObjects[i].animation[aniIndex].lastAnimation = -1;
            }
        };

        // 개체 위치 변경
        this.SetPosAndDirection = function (customID, vPos, vDir, vUp) {
            //Custom Object 위치 생성
            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {

                if (customID !== undefined) {
                    if (CustomObjects[i].uuid.localeCompare(customID) !== 0) { continue; }
                }

                if (vPos !== undefined)
                    CustomObjects[i].position.copy(vPos);
                if (vDir !== undefined)
                    CustomObjects[i].direction.copy(vDir);
                if (vUp !== undefined)
                    CustomObjects[i].up.copy(vUp);

                let vXAxis = new VIZCore.Vector3().copy(CustomObjects[i].direction);
                let vObjUp = new VIZCore.Vector3().copy(CustomObjects[i].up);
                let vYAxis = new VIZCore.Vector3().crossVectors(vObjUp, vXAxis);

                let vZAxis = new VIZCore.Vector3().copy(vXAxis);
                vZAxis.cross(vYAxis);
                vZAxis.normalize();

                let matAxis = new VIZCore.Matrix4().makeBasis(vXAxis, vYAxis, vZAxis);
                let matTranslate = new VIZCore.Matrix4().setPosition(CustomObjects[i].position);
                let matObjTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matAxis);

                for (let k = 0; k < CustomObjects[i].object.length; k++) {

                    for (let m = 0; m < CustomObjects[i].object[k].tag.length; m++) {
                        let body = CustomObjects[i].object[k].tag[m];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id); 

                        action.transform.copy(matObjTrans);
                    }
                    CustomObjects[i].object[k].flag.updateProcess = true;
                }

                if (customID !== undefined) {
                    break;
                }
            }

            view.Renderer.Render();
        };

        // 파일 다운로드 완료 초기 위치설정 추가
        this.AddDownloadInitPosAndDirection = function (fileDataID, vPos, vDir, vUp) {

            //존재하는 경우 추가가 아닌 변경
            for (let i = DownloadInitDatas.length - 1; i >= 0; i--) {
                if (DownloadInitDatas[i].id.localeCompare(fileDataID) !== 0) { continue; } //uuid

                DownloadInitDatas[i].vPos = vPos;
                DownloadInitDatas[i].vDir = vDir;
                DownloadInitDatas[i].vUp = vUp;
                return;
            }

            let item = {
                id: fileDataID,
                vPos: vPos,
                vDir: vDir,
                vUp: vUp
            };

            DownloadInitDatas.push(item);
        };

        // 파일 다운로드 완료 초기 위치설정 
        this.SetDownloadInitPosAndDirection = function (fileData, customObject) {

            let idx = -1;

            for (let i = DownloadInitDatas.length - 1; i >= 0; i--) {
                //if (DownloadInitDatas[i].id !== fileData.id) continue;
                if (DownloadInitDatas[i].id.localeCompare(fileData.ID) !== 0) { continue; } //uuid

                idx = i;
                break;
            }

            if (idx < 0)
                return;

            //Custom Object 위치 설정
            if (DownloadInitDatas[idx].vPos !== undefined)
                customObject.position.copy(DownloadInitDatas[idx].vPos);
            if (DownloadInitDatas[idx].vDir !== undefined)
                customObject.direction.copy(DownloadInitDatas[idx].vDir);
            if (DownloadInitDatas[idx].vUp !== undefined)
                customObject.up.copy(DownloadInitDatas[idx].vUp);

            let vXAxis = new VIZCore.Vector3().copy(customObject.direction);
            let vObjUp = new VIZCore.Vector3().copy(customObject.up);
            let vYAxis = new VIZCore.Vector3().crossVectors(vObjUp, vXAxis);

            let vZAxis = new VIZCore.Vector3().copy(vXAxis);
            vZAxis.cross(vYAxis);
            vZAxis.normalize();

            let matAxis = new VIZCore.Matrix4().makeBasis(vXAxis, vYAxis, vZAxis);
            let matTranslate = new VIZCore.Matrix4().setPosition(customObject.position);
            let matObjTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matAxis);

            for (let k = 0; k < customObject.object.length; k++) {

                for (let m = 0; m < customObject.object[k].tag.length; m++) {
                    let body = customObject.object[k].tag[m];
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id); 

                    action.transform.copy(matObjTrans);
                }
                customObject.object[k].flag.updateProcess = true;
            }

            DownloadInitDatas.splice(idx, 1);

        };

        //#region Data

        ///**
        // *  Get Object By Color
        // * @param {any} id : color Idx
        // * @returns [Custom Object, body]
        // */
        this.GetObjectByColorIdx = function (id) {
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];
                for (let j = 0; j < custom.object.length; j++) {
                    let object = custom.object[j];
                    for (let k = 0; k < object.tag.length; k++) {
                        if (object.tag[k].colorIdx === id)
                            return [custom, object.tag[k]];
                    }
                }
            }
            return undefined;
        };

        ///**
        // * 모든 Custom Object 선택해제
        // * */
        this.DeselectAll = function () {
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];
                if (custom.enableSelection === false)
                    continue;

                custom.selection = false;
                for (let j = 0; j < custom.object.length; j++) {
                    let object = custom.object[j];
                    for (let k = 0; k < object.tag.length; k++) {
                        let body = object.tag[k];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                        action.selection = false;
                        body.object.flag.updateProcess = true;
                    }
                }

            }
        };

        /**
         * 해당 Custom Object 선택
         * @param {Array<UUID>} ids : custom object uuid
         * @param {Boolean} select : 선택 여부
         * @param {Boolean} append : 추가 선택여부
         */
        this.Select = function (ids, select, append) {

            if (!append && select) {
                scope.DeselectAll();
            }

            for (let j = 0; j < ids.length; j++) {
                for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                    let custom = CustomObjects[i];
                    if (custom.enableSelection === false)
                        continue;
                    if (custom.selection === select)
                        continue;
                    if (custom.uuid.localeCompare(ids[j]) !== 0)
                        continue;

                    custom.selection = select;
                    for (let k = 0; k < custom.object.length; k++) {
                        for (let m = 0; m < custom.object[k].tag.length; m++) {

                            let body = custom.object[k].tag[m];
                            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                            action.selection = select;
                            custom.object[k].tag[m].object.flag.updateProcess = true;
                        }
                    }
                    break;
                }
            }

            view.Renderer.MainFBClear();
            view.Renderer.Render();
        };

        ///**
        // * 해당 Custom Object 반환
        // * @returns  [Data.CustomObjectData] Custom Objects
        // */
        this.GetSelection = function () {

            let result = [];
            for (let i = 0; i < CustomObjects.length; i++) {
                if (!CustomObjects[i].selection)
                    continue;

                result.push(CustomObjects[i]);
            }
            return result;
        };

        
        /**
         * 화면에서 선택 가능 여부 설정
         * @param {Array<UUID>} ids objectid
         * @param {boolean} bEnable true : 선택 가능, false : 선택 불가능
         */
        this.EnableUseSelection = function(ids, bEnable) {

            for (let j = 0; j < ids.length; j++) {
                for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                    let custom = CustomObjects[i];

                    if (custom.uuid.localeCompare(ids[j]) !== 0)
                        continue;

                    custom.enableSelection = bEnable;                    
                    for (let k = 0; k < custom.object.length; k++) {
                        for (let m = 0; m < custom.object[k].tag.length; m++) {

                            let body = custom.object[k].tag[m];
                            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                            action.useSelection = bEnable;
                            custom.object[k].tag[m].object.flag.updateProcess = true;
                        }
                    }
                    break;
                }
            }
            
            view.Renderer.Render();
        };

        /**
         * 해당 Custom Objects 의 Boundbox 반환
         * @param {Array<Data.CustomObjectData>} customObjects 
         */
        this.GetBoundBox = function(customObjects) {
            let bbox = new VIZCore.BBox();
            let firstBBox = true;
            for(let i = 0 ; i < customObjects.length ; i++) {
                let customObject = customObjects[i];
                for(let j = 0 ; j < customObject.object.length ; j++) {
                    if(customObject.object[j].tag === undefined || customObject.object[j].tag === null) continue;

                    for(let k = 0 ; k < customObject.object[j].tag.length ; k++) {
                        let body = customObject.object[j].tag[k];

                        if(firstBBox) {
                            firstBBox = false;
                            bbox.min.copy(body.BBox.min);
                            bbox.max.copy(body.BBox.max);
                        }
                        else{
                            bbox.min.min(body.BBox.min);
                            bbox.max.max(body.BBox.max);
                        }
                    }//k
                }//j
            }//i
            bbox.update();

            return bbox;
        };

        /**
         * 해당 Custom Object 가시화 설정
         * @param {[uuid]} ids : custom object uuid
         * @param {Boolean} visible : 가시화 설정
         */
        this.Show = function (ids, visible) {

            for (let j = 0; j < ids.length; j++) {
                for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                    let custom = CustomObjects[i];
                    if (custom.visible === visible)
                        continue;
                    if (custom.uuid.localeCompare(ids[j]) !== 0)
                        continue;

                    custom.visible = visible;
                    for (let k = 0; k < custom.object.length; k++) {
                        for (let m = 0; m < custom.object[k].tag.length; m++) {
                            let body = custom.object[k].tag[m];
                            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                            action.visible = visible;
                            custom.object[k].tag[m].object.flag.updateProcess = true;
                        }
                    }
                    break;
                }
            }

            view.Renderer.MainFBClear();
            view.Renderer.Render();
        };


        // Get Body Pick Point
        // @param {UUID} id :
        // @param {VIZCore.Vector3()} v1 : world Pos 1
        // @param {VIZCore.Vector3()} v2 : world Pos 2
        // @returns {Data.PickDataItem()}
        this.GetWorldPickByID = function (id, v1, v2) {
            let customObject = scope.GetObject(id);

            if (customObject !== undefined) {
                let bodies = scope.GetBodyFormObject(customObject);
                return view.Data.GetWorldPick(bodies, v1, v2);
            }
            return view.Data.GetWorldPick(undefined, v1, v2);
        };

        // Get Body Pick Point
        // @param {UUID} id :
        // @param {VIZCore.Vector3()} v1 : screen 1
        // @param {VIZCore.Vector3()} v2 : screen 2
        // @returns {Data.PickDataItem()} 
        this.GetPickByBody = function (id, x, y) {
            let mouse;
            if (view.Camera.perspectiveView)
                mouse = new VIZCore.Vector3(x, y, 0.0);

            else
                mouse = new VIZCore.Vector3(x, y, -1.0);

            let screenRay1 = new VIZCore.Vector3(mouse.x, mouse.y, mouse.z);
            let screenRay2 = new VIZCore.Vector3(mouse.x, mouse.y, 1.0);

            let worldRay1, worldRay2;
            worldRay1 = view.Camera.screen2WorldWithMatrix(view.Camera.matMVP, screenRay1);
            worldRay2 = view.Camera.screen2WorldWithMatrix(view.Camera.matMVP, screenRay2);

            let result = scope.GetWorldPickByID(id, worldRay1, worldRay2);
            return result;
        };

        //#endregion
        //#region CustomObject Render
        function initRenderProcess() {

            //그리기 위치 보정
            {
                scope.Process();
            }


            //Pipeline
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    let pipeline = view.RenderWGL.InitRenderPipeline(CustomObjects[i].object[k]);
                    mapPipeline.set(CustomObjects[i].object[k].uuid, pipeline);
                }
            }
        }

        this.BenginRenderObject = function () {
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];

                //index buffer 존재하는 경우에 활성화
                for (let k = 0; k < custom.object.length; k++) {
                    if (custom.object[k].attribs.a_index.buffer !== null)
                        custom.object[k].flag.renderEnable = true;
                }
            }
        };

        this.EndRenderObject = function () {
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];

                //index buffer 존재하는 경우에 활성화
                for (let k = 0; k < custom.object.length; k++) {
                    custom.object[k].flag.renderEnable = false;

                    let pipelineItem = mapPipeline.get(custom.object[k].uuid);
                    if(pipelineItem !== undefined)
                        pipelineItem.renderEnableOcclusion = false;
                }
            }
        };

        // 개체 그리기
        this.Render = function () {

            if (CustomObjectsUpdateLength <= 0)
                return;

            //초기 설정
            initRenderProcess();

            //Occlusion
            renderOcclusion();


            let shaderTypeModelRender = VIZCore.Enum.SHADER_TYPES.PHONG;
            if(view.useWebGL2)
                shaderTypeModelRender = VIZCore.Enum.SHADER_TYPES.PBR;

            //애니메이션이 없는 고정 개체
            //그리기
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PBR);
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PHONG);
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.ANIMATIONPBR);

            //view.Shader.SetGLCameraData();

            //view.Shader.SetGLLight();
            // view.gl.disable(view.gl.BLEND);
            // view.gl.enable(view.gl.DEPTH_TEST);

            // const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
            // const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            // view.Shader.SetMatrix(matMVP, matMVMatrix);
            // view.Shader.SetClipping(undefined); //해당 내용은 단면 처리 하지 않음.
            view.RenderWGL.SetUpdateClipping(false);
            
            //view.Shader.EndShader();
            view.gl.enable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);
            
            view.gl.enable(view.gl.BLEND);
            view.gl.blendFunc(view.gl.SRC_ALPHA, view.gl.ONE_MINUS_SRC_ALPHA);
         

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;

                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    //view.RenderWGL.UpdateRenderProcessByObject_v2(CustomObjects[i].object[k], false);
                    view.RenderWGL.UpdateRenderProcessByObject_v3(CustomObjects[i].object[k], false, shaderTypeModelRender);
                }
            }

            view.gl.enable(view.gl.DEPTH_TEST);
            //view.gl.disable(view.gl.DEPTH_TEST);
            view.gl.depthMask(false);   //23.08.22 이전.. 투명개체 그리고 난 후 모델 그리면 위에 그려짐
            //view.gl.depthMask(true);
            view.gl.enable(view.gl.BLEND);
            view.gl.blendFunc(view.gl.SRC_ALPHA, view.gl.ONE_MINUS_SRC_ALPHA);

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;

                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    //view.RenderWGL.UpdateRenderProcessByObject_v2(CustomObjects[i].object[k], true);
                    view.RenderWGL.UpdateRenderProcessByObject_v3(CustomObjects[i].object[k], true, shaderTypeModelRender);

                }
            }
            
            view.RenderWGL.SetUpdateClipping(true);

            //view.gl.disable(view.gl.BLEND);
            //view.gl.enable(view.gl.DEPTH_TEST);
            
            view.gl.disable(view.gl.BLEND);
            view.gl.disable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);

            view.Shader.EndShader();
        };

        //Animation 개체 그리기
        this.AnimationRender = function () {

            if (CustomObjectsUpdateLength <= 0)
                return;
            //확장시 에만 가능..
            //if (view.Shader.IsWebGLEXTDEPTH() === false)
            //    return;
            let timeCurrent = (view.RenderProcessTime - view.LastRenderProcessTime) / 1000; // 초

            //초기 설정 (Render 에서 처리함)
            //initRenderProcess();
            //항상 새로 그리기.
            //그리기
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PBR);
            view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.ANIMATIONPBR);

            view.Shader.SetGLCameraData();

            //기존 깊이 이미지 사용
            //let hUsePrevDpeth = view.gl.getUniformLocation(view.Shader.currentProgram, "ubUsePrevDpeth");
            //if (hUsePrevDpeth != null)
            //    view.gl.uniform1i(hUsePrevDpeth, 1);
            //
            //if (view.Shader.IsWebGLEXTDEPTH()) {
            //    let fbDepth = view.Shader.GetItemFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.DEPTH);
            //    //view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetTexture);
            //    view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetDepthTexture);
            //}
            //else {
            //    let fbDepth = view.Shader.GetItemFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.DEPTH);
            //    view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetTexture);
            //}
            view.Shader.SetGLLight();
            //view.gl.disable(view.gl.BLEND);
            view.gl.enable(view.gl.BLEND); //Custom은 한번에 그리기에 Blend 활성화

            view.gl.enable(view.gl.DEPTH_TEST);

            const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
            const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            view.Shader.SetMatrix(matMVP, matMVMatrix);
            view.Shader.SetClipping(undefined); //해당 내용은 단면 처리 하지 않음.

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;
                view.Shader.SetUpdateCurrentMatrixData();

                if (CustomObjects[i].currentAnimationNum < 0)
                    continue;

                //Animation Biped 관리 생성
                if (CustomObjects[i].currentAnimationNum >= 0) {
                    let animation = CustomObjects[i].animation[CustomObjects[i].currentAnimationNum];

                    let aniIdx = animation.playAnimation;
                    let lastAniIdx = animation.lastAnimation;

                    if (aniIdx >= 0)
                        animation.animationSecond += timeCurrent;
                    if (lastAniIdx >= 0)
                        animation.lastAnimationSecond += timeCurrent;

                    if (aniIdx < 0)
                        continue;

                    //console.log(animation.animationSecond);
                    // 시간 스텝 찾는다
                    let step = 0, lastStep = 0;
                    if (aniIdx >= 0)
                        step = animation.animationSecond / animation.layer[aniIdx].step;

                    if (lastAniIdx >= 0)
                        lastStep = animation.lastAnimationSecond / animation.layer[lastAniIdx].step;

                    // 바이패드 메트리스 정리
                    let matBiped = [];
                    for (let j = 0; j < animation.layer[aniIdx].data.length; j++) {
                        if (animation.layer[aniIdx].data[j].transform.length > 0) {
                            let currentStep = Math.floor(step) % Math.floor(animation.layer[aniIdx].data[j].transform.length);
                            matBiped.push(new VIZCore.Matrix4().copy(animation.layer[aniIdx].data[j].transform[currentStep]));
                        }
                        else {
                            matBiped.push(new VIZCore.Matrix4());
                        }
                    }

                    // 블렌딩 해야할 상황이라면 섞는다
                    let fBlendSecondLen = 0.5;
                    if (animation.animationSecond < fBlendSecondLen && lastAniIdx >= 0) {
                        let fBlendRate = animation.animationSecond / fBlendSecondLen;

                        for (let j = 0; j < animation.layer[lastAniIdx].data.length; j++) {
                            let matCurrent = new VIZCore.Matrix4();

                            if (animation.layer[lastAniIdx].data[j].transform.length > 0) {
                                let currentStep = Math.floor(lastStep) % Math.floor(animation.layer[lastAniIdx].data[j].transform.length);
                                matCurrent.copy(animation.layer[lastAniIdx].data[j].transform[currentStep]);
                            }

                            //matBiped[j] = matBiped[j] * fBlendRate + matCurrent * (1.0f - fBlendRate);
                            //matBiped[j] = matBiped[j].multiplyScalar(fBlendRate) + matCurrent.multiplyScalar((1.0 - fBlendRate));
                            let bipedUpdate1 = new VIZCore.Matrix4().copy(matBiped[j]).multiplyScalar(fBlendRate);
                            let bipedUpdate2 = matCurrent.multiplyScalar((1.0 - fBlendRate));

                            for (let k = 0; k < 16; k++) {
                                matBiped[j].elements[k] = bipedUpdate1.elements[k] + bipedUpdate2.elements[k];
                            }

                        }
                    }

                    view.Shader.SetUpdateCurrentMatrixData(matBiped);
                }

                //view.Shader.SetUpdateCurrentMatrixData();
                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByAnimationObject_v2(CustomObjects[i].object[k]);
                }
            }

            view.gl.disable(view.gl.BLEND);
            //view.gl.enable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);

            view.gl.disable(view.gl.BLEND);
            view.gl.disable(view.gl.DEPTH_TEST);

            view.Shader.EndShader();

        };


        /**
         * Occlusion
         */
        function renderOcclusion() {

            if(view.Renderer.enableOcclusion === false) return;

            gl.colorMask(false, false, false, false);
            gl.depthMask(false);

            let whiteColor = new VIZCore.Color(255, 255, 255, 255);
            view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC2D);
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByObjectOcclusion_v2(CustomObjects[i].object[k], whiteColor);
                }
            }
            view.Shader.EndShader();
            gl.colorMask(true, true, true, true);
            gl.depthMask(true);

        }


        ///**
        // * 선택된 개체 그리기 (ColorID)
        // * @param {Number} shaderTypes VIZCore.Enum.SHADER_TYPES
        // * */
        this.SelectedRender = function (shaderTypes) {
            if (CustomObjectsUpdateLength <= 0)
                return;

            if (shaderTypes === undefined)
                shaderTypes = VIZCore.Enum.SHADER_TYPES.PICKING;

            //Pick
            view.Shader.BeginShader(shaderTypes);
            view.Shader.SetGLCameraData();

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;
                if (CustomObjects[i].selection === false)
                    continue;

                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByPickObject_v2(CustomObjects[i].object[k]);
                }
            }

            view.Shader.EndShader();
        };

        //**
        // * 선택가능한 개체 그리기 (ColorID)
        // * @param {Number} shaderTypes VIZCore.Enum.SHADER_TYPES
        // * */
        this.PickRender = function (shaderTypes) {

            if (CustomObjectsUpdateLength <= 0)
                return;

            if (shaderTypes === undefined)
                shaderTypes = VIZCore.Enum.SHADER_TYPES.PICKING;

            //Pick
            view.Shader.BeginShader(shaderTypes);
            view.Shader.SetGLCameraData();

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;
                //if (CustomObjects[i].enableSelection === false) continue;
                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByPickObject_v2(CustomObjects[i].object[k]);
                }
            }

            view.Shader.EndShader();
        };


        ///**
        // * ColorID 개체 그리기
        // * @param {Number} shaderTypes VIZCore.Enum.SHADER_TYPES
        // */
        this.ColorIDRender = function (shaderTypes) {

            if (CustomObjectsUpdateLength <= 0)
                return;

            if (shaderTypes === undefined)
                shaderTypes = VIZCore.Enum.SHADER_TYPES.PICKING;

            //Pick
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PICKING);
            view.Shader.BeginShader(shaderTypes);
            view.Shader.SetGLCameraData();

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;

                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByColorID_v2(CustomObjects[i].object[k]);
                }
            }

            view.Shader.EndShader();
        };


        ///**
        // * ColorID 개체 그리기
        // * @param {Number} shaderTypes VIZCore.Enum.SHADER_TYPES
        // */
        this.OneColorRender = function (shaderTypes, color) {

            if (CustomObjectsUpdateLength <= 0)
                return;

            if (shaderTypes === undefined)
                shaderTypes = VIZCore.Enum.SHADER_TYPES.BASIC2D;

            view.Shader.BeginShader(shaderTypes);
            view.Shader.SetGLCameraData();

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                if (CustomObjects[i].visible === false)
                    continue;

                if (CustomObjects[i].currentAnimationNum >= 0) {
                    continue;
                }

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.UpdateRenderProcessByObjectOneColor_v2(CustomObjects[i].object[k], color);
                }
            }

            view.Shader.EndShader();
        };


        this.Process = function () {

            let timeCurrent = (view.RenderProcessTime - view.LastRenderProcessTime) / 1000; // 초


            // 걷기 최저 속도
            let fWalkMinSpeed = 1000.0;

            // 위치 도작 오차
            let fArrivePosTol = 10.0;

            // 방향 전환 속도
            let fRotateSpeed = 5.0;

            // 방향 전환 오차
            let fRotateTol = 0.01;

            // 뛰기 시작 속도
            let fRunSpeed = 1500.0;

            //그리기 전 위치 보정
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {

                let PlayerProcessData = view.SHWebSocket.GetPlayerDataByAvatar(CustomObjects[i].uuid);
                if (PlayerProcessData === undefined)
                    continue; //데이터 없음            

                let vPos = new VIZCore.Vector3().copy(CustomObjects[i].position);
                let vDir = new VIZCore.Vector3().copy(CustomObjects[i].direction);
                let vUp = new VIZCore.Vector3().copy(CustomObjects[i].up);

                // 목표 지점에 도착했으면 각만 보정
                let vLeftDistance = new VIZCore.Vector3().subVectors(PlayerProcessData.TrgPosition, vPos);
                let fLeftDistance = vLeftDistance.length();

                let bRotateAction = false;

                // 각 보정
                {
                    // 각 오프셋 설정
                    let fDirAngleCurrent = vDir.get2DAngle();
                    let fDirAngleTarget = 0.0;

                    if (fLeftDistance < fArrivePosTol) {
                        fDirAngleTarget = PlayerProcessData.TrgZAngle;
                    }
                    else {
                        let vTargetDir = new VIZCore.Vector3().subVectors(PlayerProcessData.TrgPosition, vPos);
                        vTargetDir.normalize();
                        fDirAngleTarget = vTargetDir.get2DAngle();
                        fDirAngleTarget += 3.141592654 / 2.0;
                    }

                    //console.log("fDirAngleTarget : " + fDirAngleTarget + ", fDirAngleCurrent : " + fDirAngleCurrent);
                    let fAngleOffset = fDirAngleTarget - fDirAngleCurrent;
                    while (fAngleOffset < -3.141592654) {
                        fAngleOffset += 3.141592654 * 2;
                        fDirAngleTarget += 3.141592654 * 2;
                    }
                    while (fAngleOffset > 3.141592654) {
                        fAngleOffset -= 3.141592654 * 2;
                        fDirAngleTarget -= 3.141592654 * 2;
                    }

                    // 각속도에 밪춰 돌린다
                    if (fAngleOffset > 0) {
                        fDirAngleCurrent += fRotateSpeed * timeCurrent;
                        if (fDirAngleCurrent > fDirAngleTarget - fRotateTol)
                            fDirAngleCurrent = fDirAngleTarget;
                    }
                    else if (fAngleOffset < 0) {
                        fDirAngleCurrent -= fRotateSpeed * timeCurrent;
                        if (fDirAngleCurrent < fDirAngleTarget + fRotateTol)
                            fDirAngleCurrent = fDirAngleTarget;
                    }

                    if (Math.abs(fAngleOffset) > fRotateTol)
                        bRotateAction = true;

                    // 새로운 바라보기각 설정
                    vDir.x = Math.cos(fDirAngleCurrent);
                    vDir.y = Math.sin(fDirAngleCurrent);
                    vDir.z = 0;

                    //CustomObjects[i].direction.copy(vDir);
                    PlayerProcessData.zAngle = fDirAngleCurrent;
                }

                // 위치 보정
                {
                    if (fLeftDistance < fArrivePosTol) {
                        vPos.copy(PlayerProcessData.TrgPosition);

                        if (bRotateAction) {
                            scope.SetAnimationByIndex(CustomObjects[i].uuid, 0, 1);
                        }
                        else if (CustomObjects[i].direction.equals(vDir) === true) {
                            scope.SetAnimationByIndex(CustomObjects[i].uuid, 0, 0);
                        }
                    }
                    else {
                        let vTargetDir = new VIZCore.Vector3().copy(PlayerProcessData.MoveOffset);
                        let fTargetDistance = vTargetDir.length();

                        let fDesireSpeedByTarget = fTargetDistance / 1.0;
                        let fCurrentSpeed = fDesireSpeedByTarget;
                        if (fCurrentSpeed < fWalkMinSpeed)
                            fCurrentSpeed = fWalkMinSpeed;

                        let fCurrentStepSpeed = fCurrentSpeed * timeCurrent;

                        let vCurrentTargetDistance = new VIZCore.Vector3().subVectors(PlayerProcessData.TrgPosition, PlayerProcessData.position);
                        let fCurrentTargetDistance = vCurrentTargetDistance.length();

                        // 목적지에 도착하는 경우
                        if (fCurrentStepSpeed > fCurrentTargetDistance) {
                            vPos.copy(PlayerProcessData.TrgPosition);
                            fCurrentSpeed = 0;
                        }
                        else {
                            let vCurrentDir = new VIZCore.Vector3().copy(vCurrentTargetDistance);
                            vCurrentDir.normalize();

                            vCurrentDir.multiplyScalar(fCurrentStepSpeed);
                            vPos.add(vCurrentDir);
                        }

                        // 속도에 맞춰 애니메이션 변경 
                        if (fCurrentSpeed === 0) {
                            scope.SetAnimationByIndex(CustomObjects[i].uuid, 0, 0);
                        }
                        else if (fCurrentSpeed < fRunSpeed) {
                            scope.SetAnimationByIndex(CustomObjects[i].uuid, 0, 1);
                        }
                        else {
                            scope.SetAnimationByIndex(CustomObjects[i].uuid, 0, 2);
                        }
                    }

                    //CustomObjects[i].position.copy(vPos);
                    PlayerProcessData.position.copy(vPos);
                    scope.SetPosAndDirection(CustomObjects[i].uuid, vPos, vDir, vUp);


                    if (PlayerProcessData.review !== undefined) {
                        PlayerProcessData.review.text.position.copy(vPos);
                        PlayerProcessData.review.text.position.z += 2000.0; //아바타 높이보다 올림
                    }
                }
            }
        };

        /**
         * 해당 타입의 개체 삭제
         * @param {*} itemType 
         */
        this.DeleteObject_ItemType = function (itemType){
            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {
                if(CustomObjects[i].itemType !== itemType)
                    continue;

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    view.RenderWGL.ReleaseDataByObject(CustomObjects[i].object[k]);
                }

                CustomObjects.splice(i, 1);
                CustomObjectsUpdateLength--;
                break;
            }
        };

        this.ShowObject_ItemType = function (itemType, visible){
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];
                if (custom.visible === visible)
                    continue;
                if (custom.itemType !== itemType)
                    continue;

                custom.visible = visible;
                for (let k = 0; k < custom.object.length; k++) {
                    for (let m = 0; m < custom.object[k].tag.length; m++) {
                        //custom.object[k].tag[m].action.visible = visible;
                        let body = custom.object[k].tag[m];

                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                        action.visible = visible;
                        body.object.flag.updateProcess = true;
                    }
                }
                break;
            }
        };

        this.GetObjectsTag = function(itemType){
            let result = [];
            for (let i = 0; i < CustomObjectsUpdateLength; i++) {
                let custom = CustomObjects[i];
                if (custom.visible === visible)
                    continue;
                if (custom.itemType !== itemType)
                    continue;
                
                result.push(custom.tag);
            }

            return result;
        };

        this.GetCustomObjectCount = function(){
            return CustomObjects.length;
        };

        //#endregion
        // Custom Object 

        //#region Custom Object Body 생성 

        /**
        * Sphere 3D
        * @param {VIZCore.Vector3} v1: 중심
        * @param {Number} radius: radius
        * @param {VIZCore.Color} color: color
        * @return {Object} Sphere Info
        */
        this.CustomObject_Sphere3D = function (v1, radius, color) {

            let firstBoundbox = false;
            let currentboundBox = new VIZCore.BBox();

            // 좌표축 구한다
            let vXAxis = new VIZCore.Vector3(1.0, 0.0, 0.0);
            let vYAxis = new VIZCore.Vector3(0.0, 1.0, 0.0);
            let vZAxis = new VIZCore.Vector3(0.0, 0.0, 1.0);

            //let fHeight = new VIZCore.Vector3().subVectors(v2, v1).length();
            let arrPos = [];
            let arrNormal = [];
            let arrIndex = [];

            let colors = [];

            let roundNum = 20;

            let idxNum = 0;
            let vUp = new VIZCore.Vector3(0.0, 0.0, 1.0);
            for (let j = 0; j < roundNum; j++) {
                let fHAngle = Math.PI * 2.0 / roundNum * j;
                let fHAngleNext = Math.PI * 2.0 / roundNum * (j + 1);

                let vPos = [];
                let vNormal = [];
                let vertiesNum = 0;


                for (let i = 0; i < roundNum + 1; i++) {
                    let fAngle = Math.PI * 2.0 / roundNum * i;

                    //let vCurrent = v1 + vXAxis * cos(fAngle) * radius + vYAxis * sin(fAngle) * radius;
                    let vCurrent1 = new VIZCore.Vector3().copy(vXAxis).multiplyScalar(Math.cos(fAngle));
                    let vCurrent1_Scalar = new VIZCore.Vector3().copy(vCurrent1).multiplyScalar(radius);

                    let vCurrent2 = new VIZCore.Vector3().copy(vYAxis).multiplyScalar(Math.sin(fAngle));
                    let vCurrent2_Scalar = new VIZCore.Vector3().copy(vCurrent2).multiplyScalar(radius);

                    let vSide = new VIZCore.Vector3().addVectors(vCurrent1_Scalar, vCurrent2_Scalar);
                    vSide.normalize();

                    //CRMVertex3 < float > vCurrent = vUp * cos(fHAngle) + vSide * sin(fHAngle);
                    let vCurrent = new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vUp).multiplyScalar(Math.cos(fHAngle)),
                        new VIZCore.Vector3().copy(vSide).multiplyScalar(Math.sin(fHAngle))
                    );
                    vCurrent.normalize();

                    let vCurrentPos = new VIZCore.Vector3().addVectors(
                        v1,
                        new VIZCore.Vector3().copy(vCurrent).multiplyScalar(radius));

                    vPos.push(vCurrentPos.x);
                    vPos.push(vCurrentPos.y);
                    vPos.push(vCurrentPos.z);

                    vNormal.push(vCurrent.x);
                    vNormal.push(vCurrent.y);
                    vNormal.push(vCurrent.z);

                    let vCurrentNext = new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vUp).multiplyScalar(Math.cos(fHAngleNext)),
                        new VIZCore.Vector3().copy(vSide).multiplyScalar(Math.sin(fHAngleNext))
                    );
                    vCurrentNext.normalize();

                    let vCurrentNextPos = new VIZCore.Vector3().addVectors(
                        v1,
                        new VIZCore.Vector3().copy(vCurrentNext).multiplyScalar(radius));

                    vPos.push(vCurrentNextPos.x);
                    vPos.push(vCurrentNextPos.y);
                    vPos.push(vCurrentNextPos.z);

                    vNormal.push(vCurrentNext.x);
                    vNormal.push(vCurrentNext.y);
                    vNormal.push(vCurrentNext.z);

                    vertiesNum += 2;


                    if (firstBoundbox) {
                        firstBoundbox = false;
                        currentboundBox.min.copy(vCurrentPos);
                        currentboundBox.max.copy(vCurrentPos);

                        currentboundBox.min.min(vCurrentNextPos);
                        currentboundBox.max.max(vCurrentNextPos);
                    }
                    else {
                        currentboundBox.min.copy(vCurrentPos);
                        currentboundBox.max.copy(vCurrentPos);

                        currentboundBox.min.min(vCurrentNextPos);
                        currentboundBox.max.max(vCurrentNextPos);
                    }

                }

                for (let i = 0; i < vertiesNum - 2; i++) {

                    arrPos.push(vPos[(i * 3) + 0]);
                    arrPos.push(vPos[(i * 3) + 1]);
                    arrPos.push(vPos[(i * 3) + 2]);

                    arrPos.push(vPos[((i + 1) * 3) + 0]);
                    arrPos.push(vPos[((i + 1) * 3) + 1]);
                    arrPos.push(vPos[((i + 1) * 3) + 2]);

                    arrPos.push(vPos[((i + 2) * 3) + 0]);
                    arrPos.push(vPos[((i + 2) * 3) + 1]);
                    arrPos.push(vPos[((i + 2) * 3) + 2]);

                    arrNormal.push(vNormal[(i * 3) + 0]);
                    arrNormal.push(vNormal[(i * 3) + 1]);
                    arrNormal.push(vNormal[(i * 3) + 2]);

                    arrNormal.push(vNormal[((i + 1) * 3) + 0]);
                    arrNormal.push(vNormal[((i + 1) * 3) + 1]);
                    arrNormal.push(vNormal[((i + 1) * 3) + 2]);

                    arrNormal.push(vNormal[((i + 2) * 3) + 0]);
                    arrNormal.push(vNormal[((i + 2) * 3) + 1]);
                    arrNormal.push(vNormal[((i + 2) * 3) + 2]);

                    arrIndex.push(idxNum); idxNum++;
                    arrIndex.push(idxNum); idxNum++;
                    arrIndex.push(idxNum); idxNum++;
                }

            }


            //let color = new VIZCore.Color(255, 0, 0, 255);
            let object = view.Data.Object3D();
            //object.id_file = data.Key;
            currentboundBox.update();
            let info = {
                partId: id_current,
                bodyId: id_current + 1,
                color: color,
                m_vnIdx: 0,
                m_triIdx: 0,
                //m_nVtx: arrPos.length * 3,
                //m_nTris: arrIndex.length * 3,
                m_nVtx: arrPos.length / 3,
                m_nTris: arrIndex.length,

                BBox: new VIZCore.BBox().copy(currentboundBox),
                //action: view.Data.ActionItem(),

                colorIdx: null,
                object: null
            };

            view.Data.IDColor.new();
            info.colorIdx = view.Data.IDColor.r + (view.Data.IDColor.g << 8) + (view.Data.IDColor.b << 16) + (view.Data.IDColor.a * 16777216); //<< 24

            //let colorArrLength = info.m_nVtx / 3 * 4; //vectex 3, color는 4
            let colorArrLength = info.m_nVtx * 4; //vectex 3, color는 4
            for (let k = 0; k < colorArrLength; k = k + 4) {
                colors[k + 0] = view.Data.IDColor.r;
                colors[k + 1] = view.Data.IDColor.g;
                colors[k + 2] = view.Data.IDColor.b;
                colors[k + 3] = view.Data.IDColor.a;
            }

            //let currentIDColor = new VIZCore.Color(255, 0, 0, 255);
            //info.colorIdx = currentIDColor.r + (currentIDColor.g << 8) + (currentIDColor.b << 16) + (currentIDColor.a * 16777216); //<< 24
            ////let colorArrLength = info.m_nVtx / 3 * 4; //vectex 3, color는 4
            //let colorArrLength = info.m_nVtx * 4; //vectex 3, color는 4
            //for (let k = 0; k < colorArrLength; k = k + 4) {
            //    colors[k + 0] = currentIDColor.r;
            //    colors[k + 1] = currentIDColor.g;
            //    colors[k + 2] = currentIDColor.b;
            //    colors[k + 3] = currentIDColor.a;
            //}
            info.object = object;

            object.attribs.a_index.array = new Uint32Array(arrIndex);
            object.numElements = object.attribs.a_index.array.length;
            object.attribs.a_position.array = new Float32Array(arrPos);
            object.attribs.a_normal.array = new Float32Array(arrNormal);

            object.attribs.a_color.array = new Uint8Array(colors);
            //object.attribs.a_color.array = new Float32Array(colors, 0, vtArray.length); 
            //view.Data.Objects.push(object);
            let datas = [];
            datas.push(info);
            object.tag = datas;
            //object.flag.lod = data.DataType;
            //object.link = data.Url;
            return object;
        };

        /**
         * 평판 생성
         * @param {VIZCore.Vector3} center 중심 위치
         * @param {VIZCore.Vector3} normal 방향
         * @param {float} widht 너비
         * @param {float} length 길이
         * @param {VIZCore.Color} color color
         * @returns {Object}
         */
        this.CustomObject_Panel = function (center, normal, width, length, color) {
            // 좌표축 구한다
            let vXAxis = new VIZCore.Vector3(1.0, 0.0, 0.0);
            let vYAxis = new VIZCore.Vector3(0.0, 1.0, 0.0);
            let vZAxis = new VIZCore.Vector3().copy(normal);
            
            view.Util.GetXandYAxis(vZAxis, vXAxis, vYAxis);

            let meshItem = view.MeshProcess.GetPanel3DVertices(center, vXAxis, vYAxis, width, length, true);

            let idxArray = [];

            for (let i = 0, len = meshItem.vertices.length / 3 ; i < len ; i++) {
                idxArray[i] = i;
            }

            return scope.CustomObject_Array(meshItem.vertices, meshItem.normals, meshItem.uv, idxArray, color);
        };

        /**
         * Box 생성
         * @param {VIZCore.Vector3} v1 : 중심 
         * @param {Number} radius : box size
         * @param {VIZCore.Color} color : color
         * @returns {Object}
         */
        this.CustomObject_Box3DByCenter = function (v1, radius, color) {
            // 좌표축 구한다
            let vXAxis = new VIZCore.Vector3(1.0, 0.0, 0.0);
            let vYAxis = new VIZCore.Vector3(0.0, 1.0, 0.0);
            let vZAxis = new VIZCore.Vector3(0.0, 0.0, 1.0);

            let vVertices = [
                //0
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(radius)
                        )
                    )
                ),

                //1
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(-radius)
                        )
                    )
                ),

                //2
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(-radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(radius)
                        )
                    )
                ),

                //3
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(-radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(-radius)
                        )
                    )
                ),
                //4
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(-radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(radius)
                        )
                    )
                ),
                //5
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(-radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(-radius)
                        )
                    )
                ),
                //6
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(-radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(-radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(radius)
                        )
                    )
                ),
                //7
                new VIZCore.Vector3().copy(v1).add(
                    new VIZCore.Vector3().addVectors(
                        new VIZCore.Vector3().copy(vXAxis).multiplyScalar(-radius),
                        new VIZCore.Vector3().addVectors(
                            new VIZCore.Vector3().copy(vYAxis).multiplyScalar(-radius),
                            new VIZCore.Vector3().copy(vZAxis).multiplyScalar(-radius)
                        )
                    )
                )
            ];

            let triIndex = [[2, 0, 3], [1, 3, 0], [4, 6, 5], [7, 5, 6], [0, 4, 1], [5, 1, 4], [6, 2, 7], [3, 7, 2],
            [4, 0, 6], [2, 6, 0], [1, 5, 3], [7, 3, 5]
            ];

            let vertexArray = [];
            let normalArray = [];
            let idxArray = [];

            let posNum = 0;
            for (let jj = 0; jj < 12; jj++) {
                for (let k = 0; k < 3; k++) {
                    vertexArray[posNum] = vVertices[triIndex[jj][k]];
                    //idxArray[posNum] = triIndex[jj][k];
                    idxArray[posNum] = posNum;
                    posNum++;
                }
                let normal = view.Util.GetTriangleNormal(
                    vertexArray[posNum - 3],
                    vertexArray[posNum - 2],
                    vertexArray[posNum - 1]);

                normalArray[posNum - 3] = normal;
                normalArray[posNum - 2] = normal;
                normalArray[posNum - 1] = normal;
            }

            return scope.CustomObject_Box3D(vertexArray, normalArray, idxArray, color);
        };

        /**
         * Box 생성
         * @param {VIZCore.BBox} bbox : boundbox 
         * @param {VIZCore.Color} color : color
         * @returns {Object}
         */
        this.CustomObject_Box3DByBoundBox = function (bbox, color) {
            let vVertices = view.Util.GetBBox2Vertex(bbox);

            //BoundBox Array 12
            let triIndex = [[0, 1, 2], [2, 1, 3], [5, 4, 6], [5, 6, 7], [0, 2, 4], [4, 2, 6], [3, 1, 5], [3, 5, 7],
            [2, 3, 6], [6, 3, 7], [1, 0, 4], [1, 4, 5]
            ];

            let vertexArray = [];
            let normalArray = [];
            let idxArray = [];

            let posNum = 0;

            //Vertices 추가
            for (let jj = 0; jj < 12; jj++) {
                for (let k = 0; k < 3; k++) {
                    vertexArray[posNum] = vVertices[triIndex[jj][k]];
                    idxArray[posNum] = posNum;
                    posNum++;
                }
                let normal = view.Util.GetTriangleNormal(
                    vertexArray[posNum - 3],
                    vertexArray[posNum - 2],
                    vertexArray[posNum - 1]);

                normalArray[posNum - 3] = normal;
                normalArray[posNum - 2] = normal;
                normalArray[posNum - 1] = normal;
            }

            return scope.CustomObject_Box3D(vertexArray, normalArray, idxArray, color);
        };
        
        /**
         * 명칭 변경 (기존 버전과 문제 없이 사용하기 위해 그대로 함수는 삭제 하지 않음)
         * CustomObject_Triangles
         * @returns Object
         */
        this.CustomObject_Box3D = function (vVertices, vNormals, indexes, color) {
            return scope.CustomObject_Triangles(vVertices, vNormals, indexes, color);
        };

        /**
         * Triangles방식으로 생성
         * @param {Array<VIZCore.Vector3>} vVertices 
         * @param {Array<VIZCore.Vector3>} vNormals 
         * @param {Array<Number>} indexes 
         * @param {VIZCore.Color} color 
         * @returns 
         */
        this.CustomObject_Triangles = function (vVertices, vNormals, indexes, color) {
            let firstBoundbox = true;
            let currentboundBox = new VIZCore.BBox();

            for (let jj = 0; jj < vVertices.length; jj++) {
                if (firstBoundbox === true) {
                    firstBoundbox = false;

                    currentboundBox.min.copy(vVertices[jj]);
                    currentboundBox.max.copy(vVertices[jj]);
                }
                else {
                    currentboundBox.min.min(vVertices[jj]);
                    currentboundBox.max.max(vVertices[jj]);
                }
            }
            currentboundBox.update();

            let arrPos = [];
            let arrNormal = [];
            //let arrIndex = [];
            let arrIndex = indexes;

            //let colors = [];

            for (let jj = 0; jj < vVertices.length; jj++) {
                arrPos[jj * 3 + 0] = vVertices[jj].x;
                arrPos[jj * 3 + 1] = vVertices[jj].y;
                arrPos[jj * 3 + 2] = vVertices[jj].z;

                arrNormal[jj * 3 + 0] = vNormals[jj].x;
                arrNormal[jj * 3 + 1] = vNormals[jj].y;
                arrNormal[jj * 3 + 2] = vNormals[jj].z;
            }
            let object = view.Data.Object3D();


            let info = view.Data.ObjectBodyInfoItem();

            info.color = color;
            info.m_vnIdx = 0;
            info.m_triIdx = 0;
            info.m_nVtx = arrPos.length / 3;
            info.m_nTris = arrIndex.length;
            info.BBox = currentboundBox;

            // 등록시 사용
            //view.Data.IDColor.new();
            //info.colorIdx = view.Data.IDColor.r + (view.Data.IDColor.g << 8) + (view.Data.IDColor.b << 16) + (view.Data.IDColor.a * 16777216); //<< 24

            //let colorArrLength = info.m_nVtx / 3 * 4; //vectex 3, color는 4
            // let colorArrLength = info.m_nVtx * 4; //vectex 3, color는 4
            // for (let k = 0; k < colorArrLength; k = k + 4) {
            //     colors[k + 0] = view.Data.IDColor.r;
            //     colors[k + 1] = view.Data.IDColor.g;
            //     colors[k + 2] = view.Data.IDColor.b;
            //     colors[k + 3] = view.Data.IDColor.a;
            // }

            info.object = object;

            object.attribs.a_index.array = new Uint32Array(arrIndex);
            object.numElements = object.attribs.a_index.array.length;
            object.attribs.a_position.array = new Float32Array(arrPos);
            object.attribs.a_normal.array = new Float32Array(arrNormal);

            //object.attribs.a_color.array = new Uint8Array(colors);
            let datas = [];
            datas.push(info);
            object.tag = datas;

            return object;
        };

           /**
         * Triangles방식으로 생성
         * @param {Array<Number>} arrPos 
         * @param {Array<Number>} arrNormal 
         * @param {Array<Number>} indexes 
         * @param {VIZCore.Color} color 
         * @returns 
         */
        this.CustomObject_Array = function (arrPos, arrNormal, arrUV, arrIndex, color) {
            let firstBoundbox = true;
            let currentboundBox = new VIZCore.BBox();

            for (let jj = 0, len = arrPos.length; jj < len; jj += 3) {
                if (firstBoundbox === true) {
                    firstBoundbox = false;

                    currentboundBox.min.x = arrPos[jj + 0];
                    currentboundBox.min.y = arrPos[jj + 1];
                    currentboundBox.min.z = arrPos[jj + 2];

                    currentboundBox.max.x = arrPos[jj + 0];
                    currentboundBox.max.y = arrPos[jj + 1];
                    currentboundBox.max.z = arrPos[jj + 2];
                }
                else {
                    currentboundBox.min.x = Math.min(arrPos[jj + 0], currentboundBox.min.x);
                    currentboundBox.min.y = Math.min(arrPos[jj + 1], currentboundBox.min.y);
                    currentboundBox.min.z = Math.min(arrPos[jj + 2], currentboundBox.min.z);

                    currentboundBox.max.x = Math.max(arrPos[jj + 0], currentboundBox.max.x);
                    currentboundBox.max.y = Math.max(arrPos[jj + 1], currentboundBox.max.y);
                    currentboundBox.max.z = Math.max(arrPos[jj + 2], currentboundBox.max.z);
                }
            }            
            currentboundBox.update();

            let object = view.Data.Object3D();

            
            let info = view.Data.ObjectBodyInfoItem();

            info.color = color;
            info.m_vnIdx = 0;
            info.m_triIdx = 0;
            info.m_nVtx = arrPos.length / 3;
            info.m_nTris = arrIndex.length;
            info.BBox = currentboundBox;
    
            info.object = object;

            object.attribs.a_index.array = new Uint32Array(arrIndex);
            object.numElements = object.attribs.a_index.array.length;
            object.attribs.a_position.array = new Float32Array(arrPos);
            if(arrNormal !== undefined)
                object.attribs.a_normal.array = new Float32Array(arrNormal);
            if(arrUV !== undefined)
                object.attribs.a_uv.array = new Float32Array(arrUV);

            //object.attribs.a_color.array = new Uint8Array(colors); //AddCustomObject 할때 등록함
            let datas = [];
            datas.push(info);
            object.tag = datas;

            return object;
        };
        

        /**
         * Cylinder 생성
         * @param {VIZCore.Vector3} v1 
         * @param {VIZCore.Vector3} v2 
         * @param {Number} radius 
         * @param {VIZCore.Color} color 
          * @return {Object} Sphere Info
         */
        this.CustomObject_Cylinder = function (v1, v2, radius, color) {

            
            let firstBoundbox = true;
            let currentboundBox = new VIZCore.BBox();

            //let fHeight = new VIZCore.Vector3().subVectors(v2, v1).length();
            let arrPos = [];
            let arrNormal = [];
            let arrIndex = [];

            let colors = [];

            let idxNum = 0;

            /// MeshProcess.MeshItem
            let meshItems = view.MeshProcess.GetCylinderSide3DVertices(v1, v2, radius);

            for(let i = 1 ; i < meshItems.vertices.length - 1 ; i++) {
                //let item = meshItems[i];

                for(let j = -1 ; j < 2 ; j++) {
                    let idx = i + j;

                    arrPos[idxNum * 3 + 0] = meshItems.vertices[idx].x;
                    arrPos[idxNum * 3 + 1] = meshItems.vertices[idx].y;
                    arrPos[idxNum * 3 + 2] = meshItems.vertices[idx].z;
    
                    arrNormal[idxNum * 3 + 0] = meshItems.normals[idx].x;
                    arrNormal[idxNum * 3 + 1] = meshItems.normals[idx].y;
                    arrNormal[idxNum * 3 + 2] = meshItems.normals[idx].z;

                    arrIndex[idxNum] = idxNum;
                    idxNum++;
                }

                
            }

            //BoundBox 생성
            for(let i = 0 ; i < meshItems.vertices.length ; i++) {
                if (firstBoundbox === true) {
                    firstBoundbox = false;

                    currentboundBox.min.copy(meshItems.vertices[i]);
                    currentboundBox.max.copy(meshItems.vertices[i]);
                }
                else {
                    currentboundBox.min.min(meshItems.vertices[i]);
                    currentboundBox.max.max(meshItems.vertices[i]);
                }
            }

            //let color = new VIZCore.Color(255, 0, 0, 255);
            let object = view.Data.Object3D();
            //object.id_file = data.Key;
            currentboundBox.update();
            let info = {
                partId: id_current,
                bodyId: id_current + 1,
                color: color,
                m_vnIdx: 0,
                m_triIdx: 0,
                //m_nVtx: arrPos.length * 3,
                //m_nTris: arrIndex.length * 3,
                m_nVtx: arrPos.length / 3,
                m_nTris: arrIndex.length,

                BBox: new VIZCore.BBox().copy(currentboundBox),
                //action: view.Data.ActionItem(),

                colorIdx: null,
                object: null
            };

            view.Data.IDColor.new();
            info.colorIdx = view.Data.IDColor.r + (view.Data.IDColor.g << 8) + (view.Data.IDColor.b << 16) + (view.Data.IDColor.a * 16777216); //<< 24

            //let colorArrLength = info.m_nVtx / 3 * 4; //vectex 3, color는 4
            let colorArrLength = info.m_nVtx * 4; //vectex 3, color는 4
            for (let k = 0; k < colorArrLength; k = k + 4) {
                colors[k + 0] = view.Data.IDColor.r;
                colors[k + 1] = view.Data.IDColor.g;
                colors[k + 2] = view.Data.IDColor.b;
                colors[k + 3] = view.Data.IDColor.a;
            }
            info.object = object;

            object.attribs.a_index.array = new Uint32Array(arrIndex);
            object.numElements = object.attribs.a_index.array.length;
            object.attribs.a_position.array = new Float32Array(arrPos);
            object.attribs.a_normal.array = new Float32Array(arrNormal);

            object.attribs.a_color.array = new Uint8Array(colors);
            //object.attribs.a_color.array = new Float32Array(colors, 0, vtArray.length); 
            //view.Data.Objects.push(object);
            let datas = [];
            datas.push(info);
            object.tag = datas;
            //object.flag.lod = data.DataType;
            //object.link = data.Url;
            return object;
        };

        //#endregion Custom Object Body 생성

    }
}

export default CustomObject;