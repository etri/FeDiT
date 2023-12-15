class Animation {
    constructor(view, VIZCore) {
        let scope = this;

        let mapAnimationGroup = new Map();
        let _AnimationList = [];

        let currentID = 0;
        let timeCurrent;
        let timeStart;
        let timeLooplessStart;
        let timePlay;
        let timePauseOffset = 0;
        let timeEnd = undefined;

        let enableEvent = true;

        let playSmartCity = false;

        let playSmooth = false; // 디지털화 재생시 이벤트 간격을 계산하여 재생 / 이벤트 간격을 고정으로 재생(1초)

        this.PlayMode = VIZCore.Enum.ANIMATION_PLAY_MODE.NONE;
        //this.PlayMode = VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_TARGET;

        let Time = {
            PlayStart : 0,
            PlayEnd : 0,
            PlayTime : 0,
            Current : 0,
            Pause : 0,
            PauseOn : false,
            CurrentOffset : 0,
            Items : [],
            Date : undefined,
            DateOffset : 1,// Day
            Interval : 1000,
            RollbackStatus : false,
        }

        let timeRepeat = 12;
        // 애니메이션 재생
        let AnimationPlay = null;
        // 애니메이션 이벤트 발생
        let AnimationEvent = null;

        let isAnimationPlay = false;

        // #region 현기차 애니메이션
        let g_pAniBuff;

        let g_robotCnt = 0; // 로봇 대수, 1000대
        let g_robotObjIndex = new Array(); //[1000][6] 로봇 관절별 노드
        let g_robotObjects = new Array(); //[1000][6] 로봇 관절별 노드

        let g_robotCellIndex = new Array(); //[1000] 로봇별 위치한 셀 인덱스
        let g_robotCellObjects = new Array(); //[1000][6] 로봇 관절별 노드

        let g_robotTickCurrent = new Array(); //[1000] 로봇이 부드럽게 애니메이션 하기위한 값

        let g_CarCnt = 0;
        let g_RobotCarObjIndex = new Array(); //[100][5] 자동차 진행률별 노드
        let g_RobotCarObjects = new Array();

        let g_AniLastTick = 0; // 애니메이션 이전 tick값, 애니메이션 초기화시 현재 틱값이랑 맞춰줘야함
        let g_lastRobotSelectId = -1;
        let bPause = false;
        let g_lastRobotSelectType = -1; // -1 : 선택 없음, 0 = Cell, 1 = Car

        this.ShowAnimationReview = true;
        this.AnimationItems_Sejong = new Map();
        this.AnimationItem_Sejong = function () {
            let item = {
                obj: undefined,
            };
            return item;
        };

        let SCVV_HV_AGV_Item = function () {
            let item = {
                state: 0,
                workCellIdx: 0,

                stateStartTick: 0,
                battery: 0,

                kind: 0,
                lastBattery100Tick: 0,

                rate: 0
            };
            return item;
        };

        let SCVV_HV_CELL_Item = function () {
            let item = {
                bCarIn: false,
                state: 0,
                progress: 0
            };
            return item;
        };

        let g_HV_AGV = []; //SCVV_HV_AGV_Item
        let g_HV_CELL = []; //SCVV_HV_CELL_Item
        let g_vCellPosition = new Array();

        let cameraBackupID;
        this.useAGVFocus = true;
        let focusAGVSkip = false;

        let focusAGVIndex = []; //Focus 대기 오브젝트 관리 리스트   
        let focusInAGVIndex = new Map(); //Focus 처리 오브젝트
        let timerFocus = null;

        this.hyundai_SEQ = new Map();

        // #endregion 현기차 애니메이션
        let AnimationGroupItem = function () {
            let item = {
                id: currentID,
                list: [],
                sort: true,
                enable: true
            };
            return item;
        };

        let AnimationItem = function () {
            let item = {
                object: null,
                action: view.Data.ActionItem(),
                timePos: 0,
                preItemIndex: -1,
                nextItemIndex: -1,
                vAniCenter: new VIZCore.Vector3(),
                bbox: new VIZCore.Vector3(),
                mapBase: new Map(),
                action_base: view.Data.ActionItem(),
                status: 0,
                move: new VIZCore.Vector3(),
                rotate: new VIZCore.Vector3(),
                visible: true,
                transform: new VIZCore.Matrix4(),

                type: 0,
                pre: -1,
                next: -1
            };
            return item;
        };

        let KeyItem = function () {
            let item = {
                time: -1,
                camera: -1,
                model: -1,
                modelInfoNum: 0,
                cameraKey: [],
                modelKey: []
            };
            return item;
        };

        let CameraKeyItem = function () {
            let item = {
                matrix: new VIZCore.Matrix4(),
                depth: 0,
                zoom: 0,
                pivot: new VIZCore.Vector3(),
                center: new VIZCore.Vector3(),
                key: null
            };
            return item;
        };

        let ModelKeyItem = function () {
            let item = {
                nodeid: -1,
                matrix: new VIZCore.Matrix4(),
                visible: 0,
                customColor: 0,
                customAlpha: 0,
                color: new VIZCore.Color(),
                center: new VIZCore.Vector3(),
                key: null
            };
            return item;
        };



        function copyAction(source, target) {
            view.Util.CopyAction(source, target);
        }

        function quaternionInterpolation(mat1, mat2, t) {
            // 1번
            let vQuerternion1 = new VIZCore.Quaternion(0, 0, 0, 1);
            let vScale1 = new VIZCore.Vector3();
            let vTranslate1 = new VIZCore.Vector3();

            vQuerternion1 = mat1.getQuaternion();
            vScale1 = mat1.getScale();
            vTranslate1 = mat1.getTranslate();

            // 2번
            //CRMVertex4 < T > vQuerternion2;
            let vQuerternion2 = new VIZCore.Quaternion();
            let vScale2 = new VIZCore.Vector3();
            let vTranslate2 = new VIZCore.Vector3();

            vQuerternion2 = mat2.getQuaternion();
            vScale2 = mat2.getScale();
            vTranslate2 = mat2.getTranslate();

            // 보간
            let r1 = 1.0 - t;
            let r2 = t;

            let vQuerternion = vQuerternion1.slerp(vQuerternion2, t);
            r1 = 1.0 - t;
            r2 = t;

            let vScale = new VIZCore.Vector3().addVectors(vScale1.multiplyScalar(r1), vScale2.multiplyScalar(r2));
            let vTranslate = new VIZCore.Vector3().addVectors(vTranslate1.multiplyScalar(r1), vTranslate2.multiplyScalar(r2));

            // 재생성
            let matTrans = new VIZCore.Matrix4();
            let matRotate = new VIZCore.Matrix4();
            let matScale = new VIZCore.Matrix4();
            let matTranslate = new VIZCore.Matrix4();

            matRotate.makeRotationFromQuaternion(vQuerternion);
            matScale.makeScale(vScale.x, vScale.y, vScale.z);
            matTranslate.makeTranslation(vTranslate.x, vTranslate.y, vTranslate.z);

            matTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matRotate);
            matTrans = new VIZCore.Matrix4().multiplyMatrices(matTrans, matScale);

            let vZero = new VIZCore.Vector3();
            let vOne = new VIZCore.Vector3(10000, 0, 0);
            vZero = matTrans.multiplyVector(vZero);
            vOne = matTrans.multiplyVector(vOne);
            let fRetScale = new VIZCore.Vector3().subVectors(vOne, vZero).length / 10000.0;

            if (fRetScale > 0.00001) {
                for (let i = 0; i < 3; i++)
                    for (let j = 0; j < 3; j++)
                        matTrans.elements[i * 4 + j] /= fRetScale;
            }

            //for (int i = 0; i < 16 ; i++ )
            //m_mat[i] = matTrans.m_mat[i];
            return matTrans;
        }

        function getTransform(center, move, rotate) {
            // transform 처리
            // rotate
            let rotateMatrix = new VIZCore.Matrix4();
            let rotateXMatrix = new VIZCore.Matrix4();
            let rotateYMatrix = new VIZCore.Matrix4();
            let rotateZMatrix = new VIZCore.Matrix4();
            rotateXMatrix.makeRotationX(rotate.x * 3.14 / 180.0);
            rotateYMatrix.makeRotationY(rotate.y * 3.14 / 180.0);
            rotateZMatrix.makeRotationZ(rotate.z * 3.14 / 180.0);

            rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateXMatrix, rotateYMatrix);
            rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, rotateZMatrix);

            let centerZero = new VIZCore.Vector3().copy(center).multiplyScalar(-1);
            let centerZeroMatrix = new VIZCore.Matrix4().setPosition(centerZero);
            let centerMatrix = new VIZCore.Matrix4().setPosition(center);
            let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, centerZeroMatrix);
            let rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(centerMatrix, tmpMatrix);
            rotateByPivotMatrix.translate(move.x, move.y, move.z);

            return rotateByPivotMatrix;
        }

        function loadXmlKeyData(element) {
            let key = KeyItem();
            for (let i = 0; i < element.childNodes.length; i++) {
                let child = element.childNodes[i];
                if (child.nodeName.localeCompare("key") === 0) {
                    key.time = child.getAttribute('time') * 1;
                    key.camera = child.getAttribute('camera') * 1;
                    key.model = child.getAttribute('model') * 1;
                    //key.modelInfoNum = child.getAttribute('modelInfoNum') * 1;
                }
                else if (child.nodeName.localeCompare("cameraKey") === 0) {
                }
                else if (child.nodeName.localeCompare("modelKey") === 0) {
                    key.modelKey = loadXmlModelKey(child);
                }
            }
            return key;
        }

        function loadXmlModelKey(element) {
            let modelKeys = [];
            for (let i = 0; i < element.childNodes.length; i++) {
                let modelKey = ModelKeyItem();
                let child = element.childNodes[i];
                modelKey.nodeid = child.getAttribute('nodeid') * 1;
                let strMatrix = child.getAttribute('matrix');
                const arrMatrixStr = strMatrix.split(',');
                modelKey.matrix.set(
                    arrMatrixStr[0] * 1,
                    arrMatrixStr[4] * 1,
                    arrMatrixStr[8] * 1,
                    arrMatrixStr[12] * 1,
                    arrMatrixStr[1] * 1,
                    arrMatrixStr[5] * 1,
                    arrMatrixStr[9] * 1,
                    arrMatrixStr[13] * 1,
                    arrMatrixStr[2] * 1,
                    arrMatrixStr[6] * 1,
                    arrMatrixStr[10] * 1,
                    arrMatrixStr[14] * 1,
                    arrMatrixStr[3] * 1,
                    arrMatrixStr[7] * 1,
                    arrMatrixStr[11] * 1,
                    arrMatrixStr[15] * 1
                );

                modelKey.visible = child.getAttribute('visible') * 1;
                modelKey.customColor = child.getAttribute('customColor') * 1;
                modelKey.customAlpha = child.getAttribute('customAlpha') * 1;
                let strColor = child.getAttribute('color');
                const arrColor = strColor.split(',');
                //modelKey.color = view.Data.ColorItem(arrColor[0] * 1, arrColor[1] * 1, arrColor[2] * 1, arrColor[3] * 1);
                modelKey.color = new VIZCore.Color(arrColor[0] * 1, arrColor[1] * 1, arrColor[2] * 1, arrColor[3] * 1);
                //color.R = arrColor[0] * 1;
                //color.G = arrColor[1] * 1;
                //color.B = arrColor[2] * 1;
                //color.A = arrColor[3] * 1;
                let strCenter = child.getAttribute('center');
                const arrCenter = strCenter.split(',');
                modelKey.center = new VIZCore.Vector3(arrCenter[0] * 1, arrCenter[1] * 1, arrCenter[2] * 1);

                modelKeys.push(modelKey);
            }

            return modelKeys;
        }

        function getEventData(){

            function pad(number) {
                if (number < 10) {
                  return '0' + number;
                }
                return number;
            }

            let startdate = function(date){
                let result = "";
                {
                    let dateResult = new Date(date.getTime());
                    result = pad(dateResult.getFullYear()) +"-"+pad(dateResult.getMonth()+1) + "-"+pad(dateResult.getDate());
                    //result = "" + dateResult.toISOString().split("T")[0];
                }
                return result;
            };
            let enddate = function(date){
                let result = "";
                {
                    // 시작시간 대비 누적 시간 계산
                    let time = Time.PlayTime;
                    let timeSecond = Math.floor(time / 1000);
                    // 초당 일자 계산
                    let timeResult = timeSecond * (60*60*24 * 1);
                    //let date = new Date(2021, 0, 1);
                    let date = Time.Date;
                    let dateResult = new Date(date.getTime() + timeResult * 1000);
    
                    //result = "Date: "+ dateResult.getFullYear() +"년 "+(dateResult.getMonth()+1) + "월 "+dateResult.getDate()+"일";
                    //result = "" + dateResult.toISOString().split("T")[0];
                    result = pad(dateResult.getFullYear()) +"-"+pad(dateResult.getMonth()+1) + "-"+pad(dateResult.getDate());
                }
                return result;
            };

            let obj = {
                TotalTime : Time.PlayTime,
                CurrentTime : Time.Current,
                DateString : scope.Daelim_GetTimeString(),
                StartDate : startdate(Time.Date),
                EndDate : enddate(),
                Duration : Time.DateOffset
            };
           
            return obj;
        };

        this.CalAnimationItemPreNextIndex = function () {

            function calAnimationItemPreNextIndex(value, key, map) {
                let _AnimationList = value.list;

                //Body 필요 여부
                if (value.sort) {
                    value.sort = false;
                    _AnimationList.sort(function (a, b) {
                        if (a.object.bodyId < b.object.bodyId) {
                            return -1;
                        }
                        else if (a.object.bodyId > b.object.bodyId) {
                            return 1;
                        }
                        else if (a.object.bodyId === b.object.bodyId) {

                            if (a.object.object.uuid === b.object.object.uuid) {
                                if (a.timePos < b.timePos) {
                                    return -1;
                                }
                                else if (a.timePos > b.timePos) {
                                    return 1;
                                }
                            }
                            else {
                                if (a.object.object.uuid < b.object.object.uuid)
                                    return -1;
                                else if (a.object.uuid > b.object.uuid)
                                    return 1;
                            }

                            return 0;
                        }
                        return 0;
                    });
                }

                let preBody = null;

                for (let i = 0; i < _AnimationList.length; i++) {
                    if (preBody !== _AnimationList[i].object) {
                        _AnimationList[i].preItemIndex = -1;
                        preBody = _AnimationList[i].object;
                    } else {
                        _AnimationList[i].preItemIndex = i - 1;
                    }

                    _AnimationList[i].nextItemIndex = -1;

                    if (i < _AnimationList.length - 1) {
                        if (_AnimationList[i].object === _AnimationList[i + 1].object) {
                            _AnimationList[i].nextItemIndex = i + 1;
                        }
                    }
                }
            }

            mapAnimationGroup.forEach(calAnimationItemPreNextIndex);
        };


        /**
       * 애니메이션 키 추가
       * @param {Number} groupid: animation Group id
       * @param {Number} id: node id
       * @param {Number} timePos: animation sec
       * @param {VIZCore.Vector3} move: node Translate
       * @param {VIZCore.Vector3} rotate: node Rotate Angle
       * @param {Boolean} visible: 가시화 여부
       */
        this.Add = function (groupid, id, timePos, move, rotate, visible, color) {
            let _AnimationList;
            if (mapAnimationGroup.has(groupid)) {
                _AnimationList = mapAnimationGroup.get(groupid).list;
                mapAnimationGroup.get(groupid).sort = true;
            }
            else {
                let group = AnimationGroupItem();
                //group.id = currentID;
                group.list = [];
                _AnimationList = group.list;
                mapAnimationGroup.set(groupid, group);
            }

            let bodies = view.Data.GetNodeData(id);
            let bbox = view.Data.GetBBox(bodies);
            //let bbox2 =view.Data.GetObjectBBox(id);
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                let animation = AnimationItem();
                animation.timePos = timePos;
                animation.object = body;
                //animation.vAniCenter = bbox.center;
                animation.bbox = bbox;
                animation.action_base = view.Data.ActionItem();
                copyAction(animation.action_base, action);
                animation.move.copy(move);
                animation.rotate.copy(rotate);

                if (visible !== undefined) {
                    animation.action.visible = visible;
                    animation.visible = visible;
                }
                if (color !== undefined){
                    animation.action.color = color;
                    animation.action.customColor = false;
                }

                let matrix = getTransform(bbox.center, move, rotate);
                animation.action.transform.copy(matrix);

                animation.vAniCenter = matrix.multiplyVector(bbox.center);
                _AnimationList.push(animation);
            }
        };

        this.AddModelKey = function (modelKey) {
            //console.log(cnt);
            let _AnimationList = mapAnimationGroup.get(currentID).list;

            //let bodies = view.Data.GetNodeData(modelKey.nodeid);
            //for (let i = 0; i < bodies.length; i++) {
            //    let body = bodies[i];
            //    let animation = AnimationItem();
            //    animation.timePos = modelKey.key.time;
            //    animation.object = body;
            //    animation.action_base = view.Data.ActionItem();
            //    copyAction(animation.action_base, body.action);
            //    animation.action.transform.copy(modelKey.matrix);
            //    animation.vAniCenter.copy(modelKey.center);
            //    _AnimationList.push(animation);
            //}
            //let body = view.Data.GetBody(modelKey.nodeid);
            let bodies = view.Data.GetBody(modelKey.nodeid);
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                let animation = AnimationItem();
                animation.timePos = modelKey.key.time;
                animation.object = body;
                animation.action_base = view.Data.ActionItem();
                copyAction(animation.action_base, action);
                animation.action.transform.copy(modelKey.matrix);
                animation.vAniCenter.copy(modelKey.center);

                _AnimationList.push(animation);
            }

            //cnt++;
        };

        this.EnableAnimation = function (groupid, enable) {
            let group = mapAnimationGroup.get(groupid);
            if (group !== undefined) {
                group.enable = enable;
                mapAnimationGroup.set(groupid, group);
            }
        };

        this.Start = function () {

            if (view.DemoType === 3) {
                LS_StartAnimation();
                return;
            }

            scope.CalAnimationItemPreNextIndex();

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }
            else {
                timePauseOffset = 0;
            }

            //timeRepeat = scope.PlayTime();
            timeStart = new Date().getTime();
            timeLooplessStart = new Date().getTime();

            let play = function () {

                timePlay = new Date().getTime();
                timeCurrent = (timePlay - timeStart); // 밀리초
                let ms = timeCurrent / 1000;

                function animationReset(value, key, map) {
                    let group = value;
                    let _AnimationList = group.list;
                    if (group.enable !== true)
                        return;

                    for (let i = 0; i < _AnimationList.length; i++) {
                        let animation = _AnimationList[i];
                        let body = animation.object;
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                        // 모델 초기화
                        copyAction(action, animation.action_base);

                        body.object.flag.updateProcess = true;

                        //body
                        for (let i = body.m_triIdx; i < body.m_triIdx + body.m_nTris; i++) {

                            if (body.object.attribs.a_matrixIndex.buffer === null)
                                break;

                            let idx1 = body.object.attribs.a_index.array[i];
                            action.transformIdx = body.object.attribs.a_matrixIndex.array[idx1 * 3 + 0];

                            view.Shader.ChangeUpdateMatrixData(body.object.uuid,
                                action.transformIdx, action.transform);
                            break;
                        }
                    }
                }

                if (ms > timeRepeat) {
                    timeStart = new Date().getTime();
                    timeCurrent = (timePlay - timeStart); // 밀리초
                    ms = timeCurrent / 1000;

                    mapAnimationGroup.forEach(animationReset);
                }

                // 기존 방법
                function animationProcess(value, key, map) {
                    let group = value;
                    let _AnimationList = group.list;
                    if (group.enable !== true)
                        return;

                    for (let i = 0; i < _AnimationList.length; i++) {
                        let animation = _AnimationList[i];

                        let timeStart = 0;
                        let timeEnd = 0;

                        if (animation.preItemIndex >= 0) {
                            timeStart = _AnimationList[animation.preItemIndex].timePos;
                        }
                        else {
                            continue;
                        }

                        timeEnd = animation.timePos;

                        if (ms >= timeStart && ms < timeEnd) {

                            let timeCurrentPos = ms - timeStart;
                            let timeLength = timeEnd - timeStart;
                            let timeRatio = timeCurrentPos / timeLength;

                            // 이전 키정보 설정
                            //let vCenterPre = new VIZCore.Vector3().copy(animation.object.BBox.center);
                            let vCenterPre = new VIZCore.Vector3().copy(_AnimationList[animation.preItemIndex].vAniCenter);
                            let matPre = new VIZCore.Matrix4();
                            if (animation.preItemIndex >= 0) {
                                vCenterPre = new VIZCore.Vector3().copy(_AnimationList[animation.preItemIndex].vAniCenter);
                                matPre = new VIZCore.Matrix4().copy(_AnimationList[animation.preItemIndex].action.transform);
                            }

                            let vCenterNext = new VIZCore.Vector3().copy(animation.vAniCenter);
                            let matNext = new VIZCore.Matrix4().copy(animation.action.transform);

                            // 매트릭스 보간
                            let matTrans = quaternionInterpolation(matPre, matNext, timeRatio);
                            animation.object.action.transform.copy(matTrans);

                            // 개체의 중심과 회전 중심이 맞지 않을때 중심점 보정
                            {
                                // 목표로 하는 센터 위치
                                let vCurrentCenter = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(vCenterPre).multiplyScalar(1.0 - timeRatio),
                                    new VIZCore.Vector3().copy(vCenterNext).multiplyScalar(timeRatio));

                                // 메트리스를 고려한 실제 이동 중심
                                let matPreInv = new VIZCore.Matrix4().getInverse(matPre);
                                let vCenterSrc = matPreInv.multiplyVector(vCenterPre);
                                let vCurrentCenterSrcWithCurrentMat = new VIZCore.Matrix4().copy(matTrans).multiplyVector(vCenterSrc);

                                // 계산결과 중심과 이동해야할 중심 차이를 보정
                                let vFitOffset = new VIZCore.Vector3().subVectors(vCurrentCenter, vCurrentCenterSrcWithCurrentMat);

                                let matFit = new VIZCore.Matrix4();
                                matFit.makeTranslation(vFitOffset.x, vFitOffset.y, vFitOffset.z);
                                let retMatrix = new VIZCore.Matrix4().multiplyMatrices(matFit, matTrans);
                                animation.object.action.transform.copy(retMatrix);
                            }

                            animation.object.object.flag.updateProcess = true;
                        }
                        else if (animation.nextItemIndex < 0 && ms >= timeEnd) {
                            // 마지막 키값으로 덮어쓴다
                            // 매트릭스 설정
                            animation.object.action.transform.copy(animation.action.transform);

                            animation.object.object.flag.updateProcess = true;
                        }
                    }
                }

                //mapAnimationGroup.forEach(animationProcess);
                //Shader UpdateMatrix 사용 버전
                //view.Shader.clearUpdateMatrixData();
                function animationProcess_updateMatrix(value, key, map) {
                    let group = value;
                    let _AnimationList = group.list;
                    if (group.enable !== true)
                        return;

                    for (let i = 0; i < _AnimationList.length; i++) {
                        let animation = _AnimationList[i];

                        let timeStart = 0;
                        let timeEnd = 0;

                        if (animation.preItemIndex >= 0) {
                            timeStart = _AnimationList[animation.preItemIndex].timePos;
                        }
                        else {
                            continue;
                        }

                        timeEnd = animation.timePos;

                        if (ms >= timeStart && ms < timeEnd) {

                            let timeCurrentPos = ms - timeStart;
                            let timeLength = timeEnd - timeStart;
                            let timeRatio = timeCurrentPos / timeLength;
                            
                            let body = animation.object;
                            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);


                            if (animation.type === 0 || animation.type === 1) {

                                let body = animation.object;
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                // 이전 키정보 설정
                                //let vCenterPre = new VIZCore.Vector3().copy(animation.object.BBox.center);
                                let vCenterPre = new VIZCore.Vector3().copy(_AnimationList[animation.preItemIndex].vAniCenter);
                                let matPre = new VIZCore.Matrix4();
                                if (animation.preItemIndex >= 0) {
                                    vCenterPre = new VIZCore.Vector3().copy(_AnimationList[animation.preItemIndex].vAniCenter);
                                    matPre = new VIZCore.Matrix4().copy(_AnimationList[animation.preItemIndex].action.transform);
                                }

                                let vCenterNext = new VIZCore.Vector3().copy(animation.vAniCenter);
                                let matNext = new VIZCore.Matrix4().copy(animation.action.transform);

                                // 매트릭스 보간
                                let matTrans = quaternionInterpolation(matPre, matNext, timeRatio);
                                action.transform.copy(matTrans);

                                // 개체의 중심과 회전 중심이 맞지 않을때 중심점 보정
                                if (animation.type === 0) {
                                    // 목표로 하는 센터 위치
                                    let vCurrentCenter = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(vCenterPre).multiplyScalar(1.0 - timeRatio),
                                        new VIZCore.Vector3().copy(vCenterNext).multiplyScalar(timeRatio));

                                    // 메트리스를 고려한 실제 이동 중심
                                    let matPreInv = new VIZCore.Matrix4().getInverse(matPre);
                                    let vCenterSrc = matPreInv.multiplyVector(vCenterPre);
                                    let vCurrentCenterSrcWithCurrentMat = new VIZCore.Matrix4().copy(matTrans).multiplyVector(vCenterSrc);

                                    // 계산결과 중심과 이동해야할 중심 차이를 보정
                                    let vFitOffset = new VIZCore.Vector3().subVectors(vCurrentCenter, vCurrentCenterSrcWithCurrentMat);

                                    let matFit = new VIZCore.Matrix4();
                                    matFit.makeTranslation(vFitOffset.x, vFitOffset.y, vFitOffset.z);
                                    let retMatrix = new VIZCore.Matrix4().multiplyMatrices(matFit, matTrans);
                                    action.transform.copy(retMatrix);
                                }
                            }
                            else if (animation.type == 2) {
                                //저장된 Transform 가져와서 등록
                                action.transform.copy(animation.action.transform);
                            }

                            //let matrixIdx = view.Shader.addUpdateMatrixData(animation.object.action.transform);
                            //animation.object.action.transformIdx = matrixIdx;
                            // 가시화 설정
                            let visible = animation.visible;
                            if (animation.preItemIndex >= 0) {
                                visible = _AnimationList[animation.preItemIndex].visible;
                            }

                            if (visible !== action.visible) {
                                animation.action.visible = visible;
                                action.visible = visible;
                                //view.Data.Show(animation.object.bodyId, visible);
                                //animation.object.object.flag.updateProcess = true;
                            }
                            if(animation.action.color !== undefined)
                            {
                                view.Data.SetObjectColor(body.bodyId, animation.action.color);
                            }
                            //animation.object.action.visible = animation.visible;
                            body.object.flag.updateProcess = true;

                            for (let i = body.m_triIdx; i < body.m_triIdx + body.m_nTris; i++) {

                                if (view.DemoType === 2) {
                                    if (body.object.attribs.a_matrixIndex.buffer === null)
                                        break;
                                    let idx1 = body.object.attribs.a_index.array[i];
                                    action.transformIdx = body.object.attribs.a_matrixIndex.array[idx1 * 3 + 0];

                                    view.Shader.ChangeUpdateMatrixData(body.object.uuid,
                                        action.transformIdx, action.transform);

                                    break;
                                }
                            }

                        }
                        else if (animation.nextItemIndex < 0 && ms >= timeEnd) {
                            // 마지막 키값으로 덮어쓴다
                            // 가시화 설정
                            if (animation.visible !== action.visible) {
                                animation.action.visible = animation.visible;
                                action.visible = animation.visible;

                                view.Data.Show(body.bodyId, animation.visible);
                                body.object.flag.updateProcess = true;
                            }

                            // 매트릭스 설정
                            if (action.transform.equals(animation.action.transform) === false) {
                                action.transform.copy(animation.action.transform);
                                body.object.flag.updateProcess = true;

                                //body
                                for (let i = body.m_triIdx; i < body.m_triIdx + body.m_nTris; i++) {
                                    if (body.object.attribs.a_matrixIndex.buffer === null)
                                        break;

                                    let idx1 = body.object.attribs.a_index.array[i];
                                    action.transformIdx = body.object.attribs.a_matrixIndex.array[idx1 * 3 + 0];

                                    view.Shader.ChangeUpdateMatrixData(body.object.uuid,
                                        action.transformIdx, action.transform);
                                    break;
                                }
                            }

                            // 매트릭스 설정
                        }
                    }
                }

                mapAnimationGroup.forEach(animationProcess_updateMatrix);

                view.MeshBlock.Reset();
                //view.Renderer.InitRenderProcess();
                view.Renderer.Render();
            };

            AnimationPlay = setInterval(function () {
                play();
            }, 50);
        };

        /**
        * 애니메이션 정지
        */
        this.Stop = function () {

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;

                function animationReset(value, key, map) {
                    let group = value;
                    let _AnimationList = group.list;
                    if (group.enable !== true)
                        return;

                    for (let i = 0; i < _AnimationList.length; i++) {
                        let animation = _AnimationList[i];

                        let body = animation.object;
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                        // 모델 초기화
                        copyAction(action, animation.action_base);

                        body.object.flag.updateProcess = true;

                        //body
                        for (let i = body.m_triIdx; i < body.m_triIdx + body.m_nTris; i++) {
                            let idx1 = body.object.attribs.a_index.array[i];
                            action.transformIdx = body.object.attribs.a_matrixIndex.array[idx1 * 3 + 0];

                            view.Shader.changeUpdateMatrixData(body.object.uuid,
                                action.transformIdx, action.transform);
                            break;
                        }
                    }
                };

                mapAnimationGroup.forEach(animationReset);

                if (view.DemoType === 2) {
                }
                else if(view.DemoType === 1){
                    Daelim_Stop();
                }
                else {
                    view.Shader.SetUseUpdateMatrixManager(false);
                }

                view.MeshBlock.Reset();
                view.Renderer.Render();
            }

            timePauseOffset = 0;
            timeCurrent = 0;
        };

        /**
       * 애니메이션 일시정지
       */
        this.Pause = function () {
            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }

            timePauseOffset = timeCurrent;
            bPause = true;
        };

        this.Clear = function () {
            currentID = 0;
            mapAnimationGroup.clear();
        };

        this.PlayTime = function () {
            let playtime = 0;
            for (let i = 0; i < _AnimationList.length; i++) {
                let animation = _AnimationList[i];
                //playtime = Math.max(playtime, animation.time.end);
            }
            return playtime;
        };

        /**
       * Play 시간 변경 (ms)
       */
        this.SetPlayTime = function (time) {
            isAnimationPlay = false;
            if(typeof(time) === 'string')
                time *= 1;
            timePauseOffset = time;
            // if (view.DemoType === 2) {
            //     focusAGVSkip = true;
            //     focusInAGVIndex.clear();
            //     scope.Hyundai_Animation(timePauseOffset);
            //     focusAGVSkip = false;

            //     scope.Hyundai_Play();
            // }

            // else
            //     scope.Start();

            Time.PauseOn = true;    
            Time.Pause = time;
            Time.Current = time;
            if(time !== 0)
                scope.StartAnimation(true);
            // let obj = getEventData();
            // view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Animation.Frame, obj);
            dispatchEvent();
        };

        /**
        * Play 시간 반환 (ms)
        */
        this.GetPlayTime = function () {
            if(view.DemoType === 1)
            {
                if(_timeCurrent !== undefined)
                {
                    // 시작시간 대비 누적 시간 계산
                    let tick = _timeCurrent.getTime() - _timeAnimation.getTime();
                    //let timeSecond = Math.floor(time / 1000);
                    // 초당 일주일 계산
                    //let timeResult = timeSecond * (60*60*24 * 7);
                    //let date = new Date(2021, 0, 1);
                    
                    //let dateResult = new Date(date.getTime() + timeResult * 1000);
    
                    //result = "Date: "+ dateResult.getFullYear() +"년 "+(dateResult.getMonth()+1) + "월 "+dateResult.getDate()+"일";
                    //result = "Date : " + dateResult.toISOString().split("T")[0];
                    return tick;
                }

                
            }
            else{
                return Time.Current;
            }
            
        };

        this.LoadAnimation = function (xmlDoc) {

            // 노드별
            let mapModelKey = new Map();

            let item = xmlDoc.getElementsByTagName("item");
            timeRepeat = item[0].getAttribute('TimeLength') * 1;

            let keys = xmlDoc.getElementsByTagName("keys");
            for (let i = 0; i < keys.length; i++) {
                let key = loadXmlKeyData(keys[i]);
                // 노드별 정리
                for (let j = 0; j < key.modelKey.length; j++) {
                    let modelkey = key.modelKey[j];
                    if (mapModelKey.get(modelkey.nodeid) === undefined) {
                        let arr = [];
                        modelkey.key = key;
                        arr.push(modelkey);
                        mapModelKey.set(modelkey.nodeid, arr);
                    }
                    else {
                        let arr = mapModelKey.get(modelkey.nodeid);
                        modelkey.key = key;
                        arr.push(modelkey);
                        mapModelKey.set(modelkey.nodeid, arr);
                    }
                }
            }

            function addKey(value, key, map) {
                for (let i = 0; i < value.length; i++) {
                    let modelKey = value[i];
                    scope.AddModelKey(modelKey);
                }
            }

            // Group 생성
            let group = AnimationGroupItem();
            mapAnimationGroup.set(group.id, group);
            // add
            mapModelKey.forEach(addKey);

            currentID++;
        };

        this.Get = function () {
            let animation = AnimationItem();
            return animation;
        };

        this.Hyundai_Play = function () {

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }
            else {
                //timePauseOffset = 0;
            }
            bPause = false;
            timeStart = new Date().getTime();

            AnimationPlay = setInterval(function () {
                timePlay = new Date().getTime();
                timeCurrent = timePauseOffset + (timePlay - timeStart); // 밀리초


                //if (view.DemoType === 2 && bPause === false) {
                //    let update = timeCurrent % 2000;
                //    if (update > 1000)
                //        view.Player.SetTime(timeCurrent);
                //}
                scope.Hyundai_Animation(timeCurrent);
            }, 50);
        };

        this.Hyundai_init = function () {

            let copyNum = 10; //10
            let copyOffset = 10000;

            //Cell 위치 설정
            let vCellPos = new Array(100);
            for (let y = 0; y < 20; y++) {
                vCellPos[y] = new VIZCore.Vector3(10 + 20000 * 0, -81056 + 9000 * y, -50);
                vCellPos[y + 20] = new VIZCore.Vector3(10 + 20000 * 1, -81056 + 9000 * (19 - y), -50);
                vCellPos[y + 40] = new VIZCore.Vector3(10 + 20000 * 2, -81056 + 9000 * y, -50);
                vCellPos[y + 60] = new VIZCore.Vector3(10 + 20000 * 3, -81056 + 9000 * (19 - y), -50);
                vCellPos[y + 80] = new VIZCore.Vector3(10 + 20000 * 4, -81056 + 9000 * y, -50);
            }

            //let robotObjIndex[1000][6];
            let robotObjIndex = new Array(1000);
            let robotObjects = new Array(1000);

            let cnt = 0;

            //let carObjIndex[1000][5];	// 0번은 agv
            let carObjIndex = new Array(1000); // 0번은 agv
            let carObjects = new Array(1000);

            let carCnt = 0;

            //Hyundai 관리 데이터 초기화
            scope.hyundai_SEQ.clear();

            scope.hyundai_SEQ.set(1, ["AAA", "AAA 000001", "BLUE", "AGV_001"]);
            scope.hyundai_SEQ.set(2, ["AAA", "AAA 000002", "RED", "AGV_002"]);
            scope.hyundai_SEQ.set(3, ["BBB", "BBB 000001", "BLUE", "AGV_003"]);
            scope.hyundai_SEQ.set(4, ["BBB", "BBB 000002", "RED", "AGV_004"]);
            scope.hyundai_SEQ.set(5, ["CCC", "CCC 000001", "BLUE", "AGV_005"]);
            scope.hyundai_SEQ.set(6, ["CCC", "CCC 000002", "RED", "AGV_006"]);
            scope.hyundai_SEQ.set(7, ["AAA", "AAA 000003", "WHITE", "AGV_007"]);
            scope.hyundai_SEQ.set(8, ["AAA", "AAA 000004", "BLUE", "AGV_008"]);
            scope.hyundai_SEQ.set(9, ["BBB", "BBB 000003", "WHITE", "AGV_009"]);
            scope.hyundai_SEQ.set(10, ["BBB", "BBB 000004", "BLUE", "AGV_010"]);
            scope.hyundai_SEQ.set(11, ["CCC", "CCC 000003", "WHITE", "AGV_011"]);
            scope.hyundai_SEQ.set(12, ["CCC", "CCC 000004", "BLUE", "AGV_012"]);
            scope.hyundai_SEQ.set(13, ["AAA", "AAA 000005", "RED", "AGV_013"]);
            scope.hyundai_SEQ.set(14, ["AAA", "AAA 000006", "WHITE", "AGV_014"]);
            scope.hyundai_SEQ.set(15, ["BBB", "BBB 000005", "RED", "AGV_015"]);
            scope.hyundai_SEQ.set(16, ["BBB", "BBB 000006", "WHITE", "AGV_016"]);
            scope.hyundai_SEQ.set(17, ["CCC", "CCC 000005", "RED", "AGV_017"]);
            scope.hyundai_SEQ.set(18, ["CCC", "CCC 000006", "WHITE", "AGV_018"]);
            scope.hyundai_SEQ.set(19, ["AAA", "AAA 000007", "BLUE", "AGV_019"]);
            scope.hyundai_SEQ.set(20, ["AAA", "AAA 000008", "RED", "AGV_020"]);
            scope.hyundai_SEQ.set(21, ["BBB", "BBB 000007", "BLUE", "AGV_021"]);
            scope.hyundai_SEQ.set(22, ["BBB", "BBB 000008", "RED", "AGV_022"]);
            scope.hyundai_SEQ.set(23, ["CCC", "CCC 000007", "BLUE", "AGV_023"]);
            scope.hyundai_SEQ.set(24, ["CCC", "CCC 000008", "RED", "AGV_024"]);
            scope.hyundai_SEQ.set(25, ["AAA", "AAA 000009", "WHITE", "AGV_025"]);
            scope.hyundai_SEQ.set(26, ["AAA", "AAA 000010", "BLUE", "AGV_026"]);
            scope.hyundai_SEQ.set(27, ["BBB", "BBB 000009", "WHITE", "AGV_027"]);
            scope.hyundai_SEQ.set(28, ["BBB", "BBB 000010", "BLUE", "AGV_028"]);
            scope.hyundai_SEQ.set(29, ["CCC", "CCC 000009", "WHITE", "AGV_029"]);
            scope.hyundai_SEQ.set(30, ["CCC", "CCC 000010", "BLUE", "AGV_030"]);
            scope.hyundai_SEQ.set(31, ["AAA", "AAA 000011", "RED", "AGV_031"]);
            scope.hyundai_SEQ.set(32, ["AAA", "AAA 000012", "WHITE", "AGV_032"]);
            scope.hyundai_SEQ.set(33, ["BBB", "BBB 000011", "RED", "AGV_033"]);
            scope.hyundai_SEQ.set(34, ["BBB", "BBB 000012", "WHITE", "AGV_034"]);
            scope.hyundai_SEQ.set(35, ["CCC", "CCC 000011", "RED", "AGV_035"]);
            scope.hyundai_SEQ.set(36, ["CCC", "CCC 000012", "WHITE", "AGV_036"]);
            scope.hyundai_SEQ.set(37, ["AAA", "AAA 000013", "BLUE", "AGV_037"]);
            scope.hyundai_SEQ.set(38, ["AAA", "AAA 000014", "RED", "AGV_038"]);
            scope.hyundai_SEQ.set(39, ["BBB", "BBB 000013", "BLUE", "AGV_039"]);
            scope.hyundai_SEQ.set(40, ["BBB", "BBB 000014", "RED", "AGV_040"]);
            scope.hyundai_SEQ.set(41, ["CCC", "CCC 000013", "BLUE", "AGV_041"]);
            scope.hyundai_SEQ.set(42, ["CCC", "CCC 000014", "RED", "AGV_042"]);
            scope.hyundai_SEQ.set(43, ["AAA", "AAA 000015", "WHITE", "AGV_043"]);
            scope.hyundai_SEQ.set(44, ["AAA", "AAA 000016", "BLUE", "AGV_044"]);
            scope.hyundai_SEQ.set(45, ["BBB", "BBB 000015", "WHITE", "AGV_045"]);
            scope.hyundai_SEQ.set(46, ["BBB", "BBB 000016", "BLUE", "AGV_046"]);
            scope.hyundai_SEQ.set(47, ["CCC", "CCC 000015", "WHITE", "AGV_047"]);
            scope.hyundai_SEQ.set(48, ["CCC", "CCC 000016", "BLUE", "AGV_048"]);
            scope.hyundai_SEQ.set(49, ["AAA", "AAA 000017", "RED", "AGV_049"]);
            scope.hyundai_SEQ.set(50, ["AAA", "AAA 000018", "WHITE", "AGV_050"]);
            scope.hyundai_SEQ.set(51, ["BBB", "BBB 000017", "RED", "AGV_051"]);
            scope.hyundai_SEQ.set(52, ["BBB", "BBB 000018", "WHITE", "AGV_052"]);
            scope.hyundai_SEQ.set(53, ["CCC", "CCC 000017", "RED", "AGV_053"]);
            scope.hyundai_SEQ.set(54, ["CCC", "CCC 000018", "WHITE", "AGV_054"]);
            scope.hyundai_SEQ.set(55, ["AAA", "AAA 000019", "BLUE", "AGV_055"]);
            scope.hyundai_SEQ.set(56, ["AAA", "AAA 000020", "RED", "AGV_056"]);
            scope.hyundai_SEQ.set(57, ["BBB", "BBB 000019", "BLUE", "AGV_057"]);
            scope.hyundai_SEQ.set(58, ["BBB", "BBB 000020", "RED", "AGV_058"]);
            scope.hyundai_SEQ.set(59, ["CCC", "CCC 000019", "BLUE", "AGV_059"]);
            scope.hyundai_SEQ.set(60, ["CCC", "CCC 000020", "RED", "AGV_060"]);
            scope.hyundai_SEQ.set(61, ["AAA", "AAA 000021", "WHITE", "AGV_061"]);
            scope.hyundai_SEQ.set(62, ["AAA", "AAA 000022", "BLUE", "AGV_062"]);
            scope.hyundai_SEQ.set(63, ["BBB", "BBB 000021", "WHITE", "AGV_063"]);
            scope.hyundai_SEQ.set(64, ["BBB", "BBB 000022", "BLUE", "AGV_064"]);
            scope.hyundai_SEQ.set(65, ["CCC", "CCC 000021", "WHITE", "AGV_065"]);
            scope.hyundai_SEQ.set(66, ["CCC", "CCC 000022", "BLUE", "AGV_066"]);
            scope.hyundai_SEQ.set(67, ["AAA", "AAA 000023", "RED", "AGV_067"]);
            scope.hyundai_SEQ.set(68, ["AAA", "AAA 000024", "WHITE", "AGV_068"]);
            scope.hyundai_SEQ.set(69, ["BBB", "BBB 000023", "RED", "AGV_069"]);
            scope.hyundai_SEQ.set(70, ["BBB", "BBB 000024", "WHITE", "AGV_070"]);
            scope.hyundai_SEQ.set(71, ["CCC", "CCC 000023", "RED", "AGV_071"]);
            scope.hyundai_SEQ.set(72, ["CCC", "CCC 000024", "WHITE", "AGV_072"]);
            scope.hyundai_SEQ.set(73, ["AAA", "AAA 000025", "BLUE", "AGV_073"]);
            scope.hyundai_SEQ.set(74, ["AAA", "AAA 000026", "RED", "AGV_074"]);
            scope.hyundai_SEQ.set(75, ["BBB", "BBB 000025", "BLUE", "AGV_075"]);
            scope.hyundai_SEQ.set(76, ["BBB", "BBB 000026", "RED", "AGV_076"]);
            scope.hyundai_SEQ.set(77, ["CCC", "CCC 000025", "BLUE", "AGV_077"]);
            scope.hyundai_SEQ.set(78, ["CCC", "CCC 000026", "RED", "AGV_078"]);
            scope.hyundai_SEQ.set(79, ["AAA", "AAA 000027", "WHITE", "AGV_079"]);
            scope.hyundai_SEQ.set(80, ["AAA", "AAA 000028", "BLUE", "AGV_080"]);
            scope.hyundai_SEQ.set(81, ["BBB", "BBB 000027", "WHITE", "AGV_081"]);
            scope.hyundai_SEQ.set(82, ["BBB", "BBB 000028", "BLUE", "AGV_082"]);
            scope.hyundai_SEQ.set(83, ["CCC", "CCC 000027", "WHITE", "AGV_083"]);
            scope.hyundai_SEQ.set(84, ["CCC", "CCC 000028", "BLUE", "AGV_084"]);
            scope.hyundai_SEQ.set(85, ["AAA", "AAA 000029", "RED", "AGV_085"]);
            scope.hyundai_SEQ.set(86, ["AAA", "AAA 000030", "WHITE", "AGV_086"]);
            scope.hyundai_SEQ.set(87, ["BBB", "BBB 000029", "RED", "AGV_087"]);
            scope.hyundai_SEQ.set(88, ["BBB", "BBB 000030", "WHITE", "AGV_088"]);
            scope.hyundai_SEQ.set(89, ["CCC", "CCC 000029", "RED", "AGV_089"]);
            scope.hyundai_SEQ.set(90, ["CCC", "CCC 000030", "WHITE", "AGV_090"]);
            scope.hyundai_SEQ.set(91, ["AAA", "AAA 000031", "BLUE", "AGV_091"]);
            scope.hyundai_SEQ.set(92, ["AAA", "AAA 000032", "RED", "AGV_092"]);
            scope.hyundai_SEQ.set(93, ["BBB", "BBB 000031", "BLUE", "AGV_093"]);
            scope.hyundai_SEQ.set(94, ["BBB", "BBB 000032", "RED", "AGV_094"]);
            scope.hyundai_SEQ.set(95, ["CCC", "CCC 000031", "BLUE", "AGV_095"]);
            scope.hyundai_SEQ.set(96, ["CCC", "CCC 000032", "RED", "AGV_096"]);
            scope.hyundai_SEQ.set(97, ["AAA", "AAA 000033", "WHITE", "AGV_097"]);
            scope.hyundai_SEQ.set(98, ["AAA", "AAA 000034", "BLUE", "AGV_098"]);
            scope.hyundai_SEQ.set(99, ["BBB", "BBB 000033", "WHITE", "AGV_099"]);
            scope.hyundai_SEQ.set(100, ["BBB", "BBB 000034", "BLUE", "AGV_100"]);


            //초기화
            for (let i = 0; i < 1000; i++) {
                robotObjIndex[i] = new Array(6);
                robotObjects[i] = new Array(6);

                for (let j = 0; j < 6; j++)
                    robotObjIndex[i][j] = -1;

                carObjIndex[i] = new Array(5);
                carObjects[i] = new Array(5);

                for (let j = 0; j < 5; j++)
                    carObjIndex[i][j] = -1;
            }

            // 로봇 구한다
            {
                let copy = 0;

                // 1레벨 구한다
                let find_g1_Robot_BA = function (value, key, map) {
                    if (value === undefined)
                        return;
                    if (value.itemType !== VIZCore.Enum.ENTITY_TYPES.EntBody)
                        return;

                    //if (value.name.localeCompare("G1_Robot_BA") !== 0) return;
                    if (value.name.lastIndexOf("G1_Robot_BA") < 0)
                        return;

                    robotObjIndex[cnt][0] = value.index + copy * copyOffset;
                    //robotObjects[cnt][0] = view.Data.GetNodeData(value.index + copy * copyOffset);
                    robotObjects[cnt][0] = view.Data.GetBody(value.index + copy * copyOffset);
                    cnt++;
                };

                // 2~6레벨 구한다
                let find_g2_Robot_BA = function (value, key, map) {
                    if (value === undefined)
                        return;
                    if (value.itemType !== VIZCore.Enum.ENTITY_TYPES.EntBody)
                        return;

                    // 2 레벨
                    if (value.name.lastIndexOf("G2_Robot_BA") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (robotObjIndex[j][1] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0]);
                            let bodies = robotObjects[j][0];
                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;

                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);
                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            if (length2D < 1000) {
                                robotObjIndex[j][1] = value.index + copy * copyOffset;
                                //robotObjects[j][1] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                robotObjects[j][1] = view.Data.GetBody(value.index + copy * copyOffset);

                                break;
                            }
                        }
                    }

                    // 3 레벨
                    if (value.name.lastIndexOf("G3_Robot_BA") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (robotObjIndex[j][2] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0]);
                            let bodies = robotObjects[j][0];
                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            if (length2D < 1000) {
                                robotObjIndex[j][2] = value.index + copy * copyOffset;
                                //robotObjects[j][2] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                robotObjects[j][2] = view.Data.GetBody(value.index + copy * copyOffset);

                                break;
                            }
                        }
                    }

                    // 4 레벨
                    if (value.name.lastIndexOf("G4_Robot_BA") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (robotObjIndex[j][3] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0]);
                            let bodies = robotObjects[j][0];
                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            if (length2D < 1000) {
                                robotObjIndex[j][3] = value.index + copy * copyOffset;
                                //robotObjects[j][3] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                robotObjects[j][3] = view.Data.GetBody(value.index + copy * copyOffset);


                                break;
                            }
                        }
                    }

                    // 5 레벨
                    if (value.name.lastIndexOf("G5_Robot_BA") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (robotObjIndex[j][4] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0]);
                            let bodies = robotObjects[j][0];
                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            if (length2D < 1000) {
                                robotObjIndex[j][4] = value.index + copy * copyOffset;
                                //robotObjects[j][4] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                robotObjects[j][4] = view.Data.GetBody(value.index + copy * copyOffset);

                                break;
                            }
                        }
                    }

                    // 6 레벨
                    if (value.name.lastIndexOf("G6_Robot_BA") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (robotObjIndex[j][5] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0]);
                            let bodies = robotObjects[j][0];
                            //let bodies = view.Data.GetNodeData(robotObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);
                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            if (length2D < 1000) {
                                robotObjIndex[j][5] = value.index + copy * copyOffset;
                                //robotObjects[j][5] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                robotObjects[j][5] = view.Data.GetBody(value.index + copy * copyOffset);

                                break;
                            }
                        }
                    }
                };

                //view.Data.bodyMap.forEach(find_g1_Robot_BA);
                for (let ct = 0; ct < copyNum; ct++) {
                    copy = ct;
                    view.Data.TreeMap.forEach(find_g1_Robot_BA);
                }

                for (let ct = 0; ct < copyNum; ct++) {
                    copy = ct;
                    view.Data.TreeMap.forEach(find_g2_Robot_BA);
                }
            }

            // 자동차 구한다
            {
                let copy = 0;

                // AGV 구한다
                let find_AGV = function (value, key, map) {
                    if (value === undefined)
                        return;
                    if (value.itemType !== VIZCore.Enum.ENTITY_TYPES.EntBody)
                        return;

                    if (value.name.lastIndexOf("AGV_001") < 0)
                        return;

                    carObjIndex[carCnt][0] = value.index + copy * copyOffset;
                    //carObjects[carCnt][0] = view.Data.GetNodeData(value.index + copy * copyOffset);
                    carObjects[carCnt][0] = view.Data.GetBody(value.index + copy * copyOffset);
                    carCnt++;
                };

                // Car 구한다
                let find_Car = function (value, key, map) {
                    if (value === undefined)
                        return;
                    if (value.itemType !== VIZCore.Enum.ENTITY_TYPES.EntBody)
                        return;

                    if (value.name.lastIndexOf("A1_Car_001") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (carObjIndex[j][1] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0]);
                            let bodies = carObjects[j][0];
                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            //let objectCar = view.Data.GetNodeData(value.index + copy * copyOffset);
                            let objectCar = view.Data.GetBody(value.index + copy * copyOffset);
                            for (let kk = 0; kk < objectCar.length; kk++) {
                                let body = objectCar[kk];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                action.visible = false;
                                body.object.flag.updateProcess = true;
                            }

                            if (length2D < 3000) {
                                carObjIndex[j][1] = value.index + copy * copyOffset;
                                //carObjects[j][1] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                carObjects[j][1] = objectCar;

                                break;
                            }
                        }
                    }

                    if (value.name.lastIndexOf("A1_Car_002") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (carObjIndex[j][2] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0]);
                            let bodies = carObjects[j][0];
                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            let objectCar = view.Data.GetNodeData(value.index + copy * copyOffset);
                            for (let kk = 0; kk < objectCar.length; kk++) {
                                let body = objectCar[kk];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                action.visible = false;
                                body.object.flag.updateProcess = true;
                            }

                            if (length2D < 3000) {
                                carObjIndex[j][2] = value.index + copy * copyOffset;
                                //carObjects[j][2] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                carObjects[j][2] = objectCar;

                                break;
                            }
                        }
                    }

                    if (value.name.lastIndexOf("A1_Car_003") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (carObjIndex[j][3] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0]);
                            let bodies = carObjects[j][0];
                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            let objectCar = view.Data.GetNodeData(value.index + copy * copyOffset);
                            for (let kk = 0; kk < objectCar.length; kk++) {
                                let body = objectCar[kk];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                action.visible = false;
                                body.object.flag.updateProcess = true;
                            }

                            if (length2D < 3000) {
                                carObjIndex[j][3] = value.index + copy * copyOffset;
                                //carObjects[j][3] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                carObjects[j][3] = objectCar;

                                break;
                            }
                        }
                    }

                    if (value.name.lastIndexOf("A1_Car_004") >= 0) {
                        for (let j = 0; j < cnt; j++) {
                            if (carObjIndex[j][4] >= 0)
                                continue;

                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0]);
                            let bodies = carObjects[j][0];
                            //let bodies = view.Data.GetNodeData(carObjIndex[j][0] - copy * copyOffset);
                            //let bbox = view.Data.GetBBox(bodies);
                            let bbox = view.Data.GetBBoxFormOriginal(bodies);

                            let vParentCenter = new VIZCore.Vector3().copy(bbox.center);
                            vParentCenter.z = 0;
                            //let vCenter = new VIZCore.Vector3().copy(value.BBox.center);
                            //let robotBodies = view.Data.GetNodeData(value.index);
                            let robotBodies = view.Data.GetBody(value.index);

                            let robotBBox = view.Data.GetBBox(robotBodies);
                            let vCenter = new VIZCore.Vector3().copy(robotBBox.center);
                            vCenter.z = 0;

                            let length2D = new VIZCore.Vector3().subVectors(vCenter, vParentCenter).length();

                            let objectCar = view.Data.GetNodeData(value.index + copy * copyOffset);
                            for (let kk = 0; kk < objectCar.length; kk++) {
                                let body = objectCar[kk];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                action.visible = false;
                                body.object.flag.updateProcess = true;
                            }

                            if (length2D < 3000) {
                                carObjIndex[j][4] = value.index + copy * copyOffset;
                                //carObjects[j][4] = view.Data.GetNodeData(value.index + copy * copyOffset);
                                carObjects[j][4] = objectCar;

                                break;
                            }
                        }
                    }
                };

                for (let ct = 0; ct < copyNum; ct++) {
                    copy = ct;
                    view.Data.TreeMap.forEach(find_AGV);
                }

                for (let ct = 0; ct < copyNum; ct++) {
                    copy = ct;
                    view.Data.TreeMap.forEach(find_Car);
                }
            }

            // 현기차 SEQ 데이터 연결
            let HyundaiSEQ_LinkProcess = function (value, key, map) {

                let num = key - 1;
                let colRed = new VIZCore.Color(255, 0, 0, 255);
                let colBlue = new VIZCore.Color(0, 0, 255, 255);
                let colWhite = new VIZCore.Color(255, 255, 255, 255);

                for (let i = num; i < carCnt; i++) {

                    if (carObjIndex[i][3] < 0)
                        continue;

                    if (value[2].localeCompare("RED") === 0) {
                        if (!carObjects[i][3][0].color.equals(colRed))
                            continue;
                    }
                    else if (value[2].localeCompare("BLUE") === 0) {
                        try{
                        if (!carObjects[i][3][0].color.equals(colBlue))
                            continue;
                        }catch(e)
                        {
                            console.log(e);
                        }
                    }
                    else if (value[2].localeCompare("WHITE") === 0) {
                        if (!carObjects[i][3][0].color.equals(colWhite))
                            continue;
                    }
                    else {
                        continue;
                    }

                    let tempIndex = carObjIndex[num];
                    let tempObject = carObjects[num];

                    carObjIndex[num] = carObjIndex[i];
                    carObjects[num] = carObjects[i];

                    carObjIndex[i] = tempIndex;
                    carObjects[i] = tempObject;
                    break;
                }
            };
            scope.hyundai_SEQ.forEach(HyundaiSEQ_LinkProcess);

            g_robotCnt = cnt; // 로봇 대수, 1000대
            g_robotObjIndex = robotObjIndex; //[1000][6] 로봇 관절별 노드
            g_robotObjects = robotObjects;

            g_CarCnt = carCnt;
            g_RobotCarObjIndex = carObjIndex; //[100][5] 자동차 진행률별 노드
            g_RobotCarObjects = carObjects;

            //연결된 자동차 노드 보이기 처리
            for (let i = 0; i < carCnt; i++) {
                for (let j = 0; j < 5; j++) {
                    if (g_RobotCarObjIndex[i][j] < 0)
                        continue;

                    for (let k = 0; k < g_RobotCarObjects[i][j].length; k++) {
                        let body = g_RobotCarObjects[i][j][k];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                        action.visible = true;
                        body.object.flag.updateProcess = true;
                    }
                }
            }

            //할당
            g_robotCellIndex = new Array(g_robotCnt); //[1000] 로봇별 위치한 셀 인덱스        
            g_robotCellObjects = new Array(g_robotCnt);

            g_robotTickCurrent = new Array(g_robotCnt); //[1000] 로봇이 부드럽게 애니메이션 하기위한 값






            //Cell Index 초기화
            //for (let i = 0; i < g_robotCnt; i++) {
            //    g_robotCellIndex[i] = 0;
            //}
            let bMinTest = true;
            let minRobotCellLength = 0;
            for (let i = 0; i < g_robotCnt; i++) {
                g_robotTickCurrent[i] = 0;

                g_robotCellIndex[i] = 0;

                for (let j = 0; j < 100; j++) {
                    //let bodies = view.Data.GetNodeData(g_robotObjIndex[j][0]);
                    if (g_robotObjIndex[i][0] < 0)
                        continue;

                    let bodies = g_robotObjects[i][0];
                    //let bbox = view.Data.GetBBox(bodies);
                    let bbox = view.Data.GetBBox(bodies);

                    let vCellCenter = new VIZCore.Vector3().copy(vCellPos[j]);
                    vCellCenter.z = 0;
                    let vCenter = new VIZCore.Vector3().copy(bbox.center);
                    vCenter.z = 0;

                    let length2D = new VIZCore.Vector3().subVectors(vCenter, vCellCenter).length();

                    if (length2D < 2500) { //기존 2000
                        g_robotCellIndex[i] = j;
                        break;
                    }
                }
            }

            g_vCellPosition = vCellPos;

            //AGV 및 Cell 정보 초기화
            g_HV_AGV = new Array(100); //SCVV_HV_AGV_Item
            g_HV_CELL = new Array(100); //SCVV_HV_CELL_Item

            for (let i = 0; i < 100; i++) {
                g_HV_AGV[i] = SCVV_HV_AGV_Item();
                g_HV_CELL[i] = SCVV_HV_CELL_Item();

                g_HV_AGV[i].state = 0;
                g_HV_AGV[i].workCellIdx = i;
                g_HV_AGV[i].kind = (i / 2) % 3;
            }

            // Buffer 데이터 다운로드
            {
                let urlsrc = "VIZCore/MODEL/HV_ANI_RECORD.bin";

                let download_binaryFile = function (url) {

                    let oReq = new XMLHttpRequest();
                    oReq.open("GET", url, true);
                    oReq.responseType = "arraybuffer";
                    //oReq.responseType = "blob";
                    oReq.onload = function (oEvent) {
                        let arrayBuffer = oReq.response; // Note: not oReq.responseText
                        if (arrayBuffer) {
                            g_pAniBuff = new Uint8Array(arrayBuffer);

                            //let buffer = new Uint8Array(arrayBuffer);
                            //
                            //g_pAniBuff = new Uint8Array(buffer.length * 100);
                            //for (let i = 0; i < 100; i++) {
                            //    for (let j = 0; j < buffer.length; j++) {
                            //        g_pAniBuff[i * buffer.length + j] = buffer[j];
                            //    }
                            //}
                            //console.log(g_pAniBuff.length);
                        }
                    };

                    oReq.send();
                };

                download_binaryFile(urlsrc);
            }



            //let testKey = scope.Hyundai_GetSeqKeyByText("AAA 000003");
            //console.log("testKey : " + testKey);
        };

        this.Hyundai_Animation = function (dwTick) {

            if (g_pAniBuff === undefined)
                return;

            let step1 = 0, step2 = 0;
            let fStepRate = 0.0;

            step1 = Math.floor(dwTick / 1000);
            step2 = step1 + 1;
            fStepRate = (dwTick - step1 * 1000) / 1000;

            let CRM_PI = Math.PI;

            let selectBody = -1;
            let selectType = -1;

            //g_vCellPosition = vCellPos;
            let setBodyMatrixHandlerList = function (bodies, matrix) {

                if (bodies === undefined)
                    return;

                //let bodies = g_robotBodies[robot_Type][robot_Num][robot_body];
                //let matrixIdx = view.Shader.addUpdateMatrixDataByIndex();
                //let bodies = view.Data.GetNodeData(id);
                for (let i = 0; i < bodies.length; i++) {
                    let body = bodies[i];
                    if (body.object.attribs.a_matrixIndex.buffer === null)
                        continue;
                    let idx1 = body.object.attribs.a_index.array[body.m_triIdx];
                    let matrixIdx = body.object.attribs.a_matrixIndex.array[idx1 * 3 + 0];

                    //if (!body.action.visible) {
                    //    view.Data.Show(body.bodyId, true);
                    //}
                    //instance matrix 처리
                    //let matTranslate = new VIZCore.Matrix4().multiplyMatrices(matrix, body.action.instance);
                    //let matTranslate = new VIZCore.Matrix4().multiplyMatrices(body.action.instance, matrix);
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                    action.transform.copy(matrix);

                    view.Shader.ChangeUpdateMatrixData(body.object.uuid,
                        matrixIdx, matrix);
                }
            };

            // 차량 애니메이션 데이터 처리
            {
                // Cell 처리
                for (let i = 0; i < 100; i++) {
                    //let progress1 = parseInt(g_pAniBuff[400 * step1 + i]);
                    //let progress2 = parseInt(g_pAniBuff[400 * step2 + i]);
                    let progress1 = g_pAniBuff[(400 * step1 + i) % g_pAniBuff.length];
                    let progress2 = g_pAniBuff[(400 * step2 + i) % g_pAniBuff.length];

                    g_HV_CELL[i].state = 0;

                    if (progress2 == 0)
                        g_HV_CELL[i].progress = 0;

                    else
                        g_HV_CELL[i].progress = progress1 * (1 - fStepRate) + progress2 * fStepRate;
                }

                // AGV 처리
                for (let i = 0; i < 100; i++) {
                    // 베터리 처리
                    //let battery1 = parseInt(g_pAniBuff[400 * step1 + 100 + i * 3 + 2]);
                    //let battery2 = parseInt(g_pAniBuff[400 * step2 + 100 + i * 3 + 2]);
                    let battery1 = g_pAniBuff[(400 * step1 + 100 + i * 3 + 2) % g_pAniBuff.length];
                    let battery2 = g_pAniBuff[(400 * step2 + 100 + i * 3 + 2) % g_pAniBuff.length];

                    g_HV_AGV[i].battery = Math.round(battery1 * (1 - fStepRate) + battery2 * fStepRate);

                    // 상태 처리
                    //g_HV_AGV[i].workCellIdx = parseInt(g_pAniBuff[400 * step1 + 100 + i * 3 + 0]);
                    g_HV_AGV[i].workCellIdx = g_pAniBuff[(400 * step1 + 100 + i * 3 + 0) % g_pAniBuff.length];

                    //let position1 = parseInt(g_pAniBuff[400 * step1 + 100 + i * 3 + 1]);
                    //let position2 = parseInt(g_pAniBuff[400 * step2 + 100 + i * 3 + 1]);
                    let position1 = g_pAniBuff[(400 * step1 + 100 + i * 3 + 1) % g_pAniBuff.length];
                    let position2 = g_pAniBuff[(400 * step2 + 100 + i * 3 + 1) % g_pAniBuff.length];

                    if (position1 < 50) //&& position2 <= 50 && position1 != position2)
                    {
                        g_HV_AGV[i].state = 20;
                        g_HV_AGV[i].fRate = (position1 + fStepRate * 25) / 100.0;
                    }
                    else if (position1 == 50 && position2 == 50) {
                        g_HV_AGV[i].state = 20;
                        g_HV_AGV[i].fRate = 0.5;
                    }
                    else if ((position1 >= 50 && position1 < 100)) // && position2 <= 100)
                    {
                        g_HV_AGV[i].state = 21;
                        g_HV_AGV[i].fRate = (position1 + fStepRate * 25) / 100.0;
                    }
                    else if (position1 == 255) {
                        g_HV_AGV[i].state = 0;
                        g_HV_AGV[i].fRate = 1.0;

                        g_HV_CELL[g_HV_AGV[i].workCellIdx].state = 1;
                    }
                    else if (position1 >= 150 && position1 < 200) {
                        g_HV_AGV[i].state = 10;
                        g_HV_AGV[i].fRate = fStepRate;
                    }
                    else if (position1 >= 200 && position1 < 250) {
                        g_HV_AGV[i].state = 11;
                        g_HV_AGV[i].fRate = fStepRate;
                    }
                }


                //for (let i = 0; i < 100; i++) {
                //
                //    if (g_HV_AGV[i].battery < 50) {
                //        console.log("AGV[" + i + "] : " + g_HV_AGV[i].battery);
                //    }
                //}
            }

            // 차량 애니메이션 그리기 처리
            {
                for (let i = 0; i < 100; i++) {
                    //let bodies = view.Data.GetNodeData(g_RobotCarObjIndex[j][0]);
                    if (g_RobotCarObjIndex[i][0] < 0)
                        continue;

                    let bodies = g_RobotCarObjects[i][0];
                    //let vCarBase = view.Data.GetBBox(bodies).center;
                    let vCarBase = view.Data.GetBBoxFormOriginal(bodies).center;

                    let matTranslate = new VIZCore.Matrix4();
                    let matRotate = new VIZCore.Matrix4();
                    let matZero = new VIZCore.Matrix4();
                    let matTransform = new VIZCore.Matrix4();

                    // 자동차 위치 정한다
                    let vCarPos = new VIZCore.Vector3().copy(g_vCellPosition[i]);
                    let vAGVPos = new VIZCore.Vector3().copy(g_vCellPosition[i]);

                    let fRotate = 0.0;
                    fRotate = (Math.floor(g_HV_AGV[i].workCellIdx / 20) + 1) * CRM_PI;

                    if (g_HV_AGV[i].state === 0) {
                        // 작업중이면 셀 위치
                        vAGVPos.copy(g_vCellPosition[g_HV_AGV[i].workCellIdx]);
                        //vCarPos = vAGVPos + CRMVertex3<float>(0, 0, 1000);
                        vCarPos = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(vAGVPos), new VIZCore.Vector3(0, 0, 1000));
                    }
                    else if (g_HV_AGV[i].state === 10) {
                        // 올리는중 처리
                        let fRate = g_HV_AGV[i].fRate;

                        vAGVPos.copy(g_vCellPosition[g_HV_AGV[i].workCellIdx]);
                        //vCarPos = vAGVPos + CRMVertex3<float>(0, 0, 1000 * fRate);
                        vCarPos = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(vAGVPos), new VIZCore.Vector3(0, 0, 1000 * fRate));

                    }
                    else if (g_HV_AGV[i].state === 11) {
                        // 내리는중 처리
                        let fRate = 1.0 - g_HV_AGV[i].fRate;

                        vAGVPos.copy(g_vCellPosition[g_HV_AGV[i].workCellIdx]);
                        //vCarPos = vAGVPos + CRMVertex3<float>(0, 0, 1000 * fRate);
                        vCarPos = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(vAGVPos), new VIZCore.Vector3(0, 0, 1000 * fRate));
                    }
                    else if (g_HV_AGV[i].state === 20) {
                        // 중간지점으로 이동 처리
                        let fRate = g_HV_AGV[i].fRate;
                        let lastIdx = (g_HV_AGV[i].workCellIdx - 1 + 100) % 100;
                        let currentIdx = g_HV_AGV[i].workCellIdx;

                        //fRate = min(fRate * 0.5, 0.5);
                        //vAGVPos = g_vCellPosition[lastIdx] * (1.0 - fRate) + g_vCellPosition[currentIdx] * fRate;
                        vAGVPos = new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]).multiplyScalar((1.0 - fRate));
                        vAGVPos.add(new VIZCore.Vector3().copy(g_vCellPosition[currentIdx]).multiplyScalar(fRate));

                        if (lastIdx === 99) {
                            //vAGVPos = g_vCellPosition[lastIdx] * (1.0 - fRate) + (g_vCellPosition[lastIdx] + CRMVertex3<float>(0, 9000, 0)) * fRate;
                            vAGVPos = new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]).multiplyScalar((1.0 - fRate));
                            //vAGVPos.add(new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]), new VIZCore.Vector3(0, 9000, 0).multiplyScalar(fRate)));
                            vAGVPos.add(new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]), new VIZCore.Vector3(0, 9000, 0)).multiplyScalar(fRate));
                        }
                        if (lastIdx === 19 || lastIdx === 59) {
                            let a = CRM_PI - CRM_PI * fRate;
                            //vAGVPos = (g_vCellPosition[lastIdx] + g_vCellPosition[currentIdx]) / 2.0 + CRMVertex3<float>(cos(a) * 10000, sin(a) * 9000, 0);
                            vAGVPos = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]), new VIZCore.Vector3().copy(g_vCellPosition[currentIdx]));
                            vAGVPos.multiplyScalar(0.5);
                            vAGVPos.add(new VIZCore.Vector3(Math.cos(a) * 10000, Math.sin(a) * 9000, 0));

                            fRotate = -a;
                        }

                        if (lastIdx === 39 || lastIdx === 79) {
                            let a = CRM_PI + CRM_PI * fRate;
                            //vAGVPos = (g_vCellPosition[lastIdx] + g_vCellPosition[currentIdx]) / 2.0 + CRMVertex3<float>(cos(a) * 10000, sin(a) * 9000, 0);
                            vAGVPos = new VIZCore.Vector3().addVectors(g_vCellPosition[lastIdx], g_vCellPosition[currentIdx]);
                            vAGVPos.multiplyScalar(0.5);
                            vAGVPos.add(new VIZCore.Vector3(Math.cos(a) * 10000, Math.sin(a) * 9000, 0));

                            fRotate = CRM_PI - a;
                        }

                        //vCarPos = vAGVPos;
                        vCarPos.copy(vAGVPos);
                    }
                    else if (g_HV_AGV[i].state === 21) {
                        // 셀로 이동 처리
                        let fRate = g_HV_AGV[i].fRate;
                        let lastIdx = (g_HV_AGV[i].workCellIdx - 1 + 100) % 100;
                        let currentIdx = g_HV_AGV[i].workCellIdx;

                        //fRate = 0.5 + fRate * 0.5;
                        //vAGVPos = g_vCellPosition[lastIdx] * (1.0 - fRate) + g_vCellPosition[currentIdx] * fRate;
                        vAGVPos = new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]).multiplyScalar((1.0 - fRate));
                        vAGVPos.add(new VIZCore.Vector3().copy(g_vCellPosition[currentIdx]).multiplyScalar(fRate));

                        if (lastIdx === 99) {
                            //vAGVPos = g_vCellPosition[lastIdx] * (1.0 - fRate) + (g_vCellPosition[lastIdx] + CRMVertex3<float>(0, 9000, 0)) * fRate;
                            //vAGVPos = vCellPos[lastIdx] * (1.0 - fRate) + (vCellPos[lastIdx] + CRMVertex3<float>(0, 9000, 0)) * fRate;
                            vAGVPos = new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]).multiplyScalar((1.0 - fRate));
                            vAGVPos.add(new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(g_vCellPosition[lastIdx]), new VIZCore.Vector3(0, 9000, 0)).multiplyScalar(fRate));
                        }
                        if (lastIdx === 19 || lastIdx === 59) {
                            let a = CRM_PI - CRM_PI * fRate;
                            //vAGVPos = (g_vCellPosition[lastIdx] + g_vCellPosition[currentIdx]) / 2.0 + CRMVertex3<float>(cos(a) * 10000, sin(a) * 9000, 0);
                            vAGVPos = new VIZCore.Vector3().addVectors(g_vCellPosition[lastIdx], g_vCellPosition[currentIdx]);
                            vAGVPos.multiplyScalar(0.5);
                            vAGVPos.add(new VIZCore.Vector3(Math.cos(a) * 10000, Math.sin(a) * 9000, 0));

                            fRotate = -a;
                        }

                        if (lastIdx === 39 || lastIdx === 79) {
                            let a = CRM_PI + CRM_PI * fRate;
                            //vAGVPos = (g_vCellPosition[lastIdx] + g_vCellPosition[currentIdx]) / 2.0 + CRMVertex3<float>(cos(a) * 10000, sin(a) * 9000, 0);
                            vAGVPos = new VIZCore.Vector3().addVectors(g_vCellPosition[lastIdx], g_vCellPosition[currentIdx]);
                            vAGVPos.multiplyScalar(0.5);
                            vAGVPos.add(new VIZCore.Vector3(Math.cos(a) * 10000, Math.sin(a) * 9000, 0));

                            fRotate = CRM_PI - a;
                        }

                        //vCarPos = vAGVPos;
                        vCarPos.copy(vAGVPos);
                    }

                    //matZero.SetTranslate(-vCarBase.x, -vCarBase.y, -vCarBase.z);
                    matZero.makeTranslation(-vCarBase.x, -vCarBase.y, -vCarBase.z);

                    //matRotate.SetRotateZ(fRotate);
                    matRotate.makeRotationZ(-fRotate);

                    //matTranslate.SetTranslate(vCarPos.x, vCarPos.y, vCarPos.z);
                    matTranslate.makeTranslation(vCarPos.x, vCarPos.y, vCarPos.z);

                    //matTransform = matTranslate * matRotate * matZero;
                    let matTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matRotate);
                    matTransform = new VIZCore.Matrix4().multiplyMatrices(matTrans, matZero);

                    //matTransform = new VIZCore.Matrix4().multiplyMatrices(matTranslate, bodies[0].action.instance);
                    let matAGVTranslate = new VIZCore.Matrix4().makeTranslation(vAGVPos.x, vAGVPos.y, vAGVPos.z);
                    let matAGVTransform = new VIZCore.Matrix4().multiplyMatrices(matAGVTranslate, matRotate);
                    matAGVTransform = new VIZCore.Matrix4().multiplyMatrices(matAGVTranslate, matZero);

                    //선택 차량 리뷰 및 진행 방향 처리
                    if (selectBody < 0) {
                        for (let j = 0; j < 5; j++) {
                            if (g_RobotCarObjects[i][j] === undefined)
                                continue;

                            for (let k = 0; k < g_RobotCarObjects[i][j].length; k++) {
                                //g_RobotCarObjects[i][j][k].length
                                let body = g_RobotCarObjects[i][j][k];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                if (action.selection) {
                                    selectBody = g_RobotCarObjIndex[i][j];
                                    selectType = 1;

                                    view.Drawing.Clear();

                                    let lastIdx = (g_HV_AGV[i].workCellIdx - 1 + 100) % 100;
                                    //view.Drawing.Clear(VIZCore.Enum.REVIEW_TYPES.RK_PATH);
                                    if (lastIdx == 99) {
                                        //showLevel = 5;
                                        //view.Drawing.Clear(VIZCore.Enum.REVIEW_TYPES.RK_PATH);
                                    }
                                    else {

                                        let cellOffset = g_HV_AGV[i].workCellIdx;

                                        let drawingNum = 100 - g_HV_AGV[i].workCellIdx - 1;
                                        let drawingLines = new Array(drawingNum * 2 + 2);
                                        drawingLines[0] = vAGVPos;
                                        drawingLines[1] = g_vCellPosition[cellOffset];
                                        let num = 2;
                                        for (let kk = 0; kk < drawingNum; kk++) {
                                            drawingLines[num] = g_vCellPosition[cellOffset + kk];
                                            num++;
                                            drawingLines[num] = g_vCellPosition[cellOffset + kk + 1];
                                            num++;
                                        }

                                        view.Drawing.Add(drawingLines, VIZCore.Enum.LINE_TYPES.SOLID_ARROW);
                                    }

                                    let pos = new VIZCore.Vector3().copy(vAGVPos);
                                    pos.z = 2000;
                                    //pos.z = 5000;
                                    //console.log("battery : " + g_HV_AGV[i].battery);
                                    let agvBattery = g_HV_AGV[i].battery;
                                    if (agvBattery < 0)
                                        agvBattery = 0;
                                    else if (agvBattery >= 100)
                                        agvBattery = 100;

                                    //if (g_lastRobotSelectType === selectType) {
                                    //    //update
                                    //    view.Drawing.UpdateCustom(pos, { battery: avgBattery });
                                    //}
                                    //else {
                                    //    //view.Drawing.Clear();
                                    //    view.Drawing.AddCustom(pos, { battery: avgBattery });
                                    //}
                                    let seqData = scope.hyundai_SEQ.get(i + 1);

                                    if (j === 0)
                                        view.Drawing.AddCustom(pos, { battery: agvBattery, name: seqData[3] });

                                    else
                                        view.Drawing.AddCustom(pos, { battery: agvBattery, name: seqData[1] });

                                    break;
                                }

                            }
                        }
                    }

                    //차량 완성도 가시화 처리 
                    {
                        let showLevel = -1;
                        let lastIdx = (g_HV_AGV[i].workCellIdx - 1 + 100) % 100;

                        if (lastIdx == 99 && g_HV_AGV[i].state === 20) {
                            showLevel = 5;
                        }
                        else if (lastIdx == 99 && g_HV_AGV[i].state === 21) {
                            showLevel = 5;
                        }
                        else if (g_HV_AGV[i].workCellIdx === 0) {
                            //최초
                            showLevel = 1;
                        }
                        else if (g_HV_AGV[i].workCellIdx < 40) {
                            showLevel = 2;
                        }
                        else if (g_HV_AGV[i].workCellIdx < 80) {
                            showLevel = 3;
                        }
                        else {
                            showLevel = 4;
                        }

                        if (showLevel >= 0)
                            for (let j = 0; j < 5; j++) {
                                if (g_RobotCarObjIndex[i][j] < 0)
                                    continue;

                                let bVisible = false;
                                if (j < showLevel)
                                    bVisible = true;

                                for (let k = 0; k < g_RobotCarObjects[i][j].length; k++) {
                                    let body = g_RobotCarObjects[i][j][k];
                                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                    if (action.visible === bVisible)
                                        continue;

                                    action.visible = bVisible;
                                    body.object.flag.updateProcess = true;
                                }
                            }
                    }

                    // 이동 처리
                    for (let j = 0; j < 5; j++) {

                        if (g_RobotCarObjects[i][j] === undefined)
                            continue;

                        //g_inf.m_data.m_ppNode[m_newRobotCarObjIndex[i][j]] -> SetTransform(matTransform);
                        //setBodyMatrixHandlerList(g_robotCarObjIndex[i][j], matTransform);
                        if (j === 0)
                            setBodyMatrixHandlerList(g_RobotCarObjects[i][j], matAGVTransform);

                        else
                            setBodyMatrixHandlerList(g_RobotCarObjects[i][j], matTransform);
                    }


                    //배터리 AGV 포커스 처리
                    if (g_HV_AGV[i].battery <= 30) //<= 30
                    {
                        //focusAGVIndex
                        let focusAnimationUpdate = true;

                        if (focusInAGVIndex.has(i))
                            focusAnimationUpdate = false;

                        if (scope.useAGVFocus === false)
                            focusAnimationUpdate = false;

                        focusInAGVIndex.set(i, [g_HV_AGV[i].battery, new VIZCore.Vector3().copy(vAGVPos)]);
                        if (!focusAGVSkip && focusAnimationUpdate) {
                            focusAGVIndex.push(i);

                            if (cameraBackupID === undefined) {
                                cameraBackupID = view.Camera.Backup();
                                scope.Hyundai_AGV_Focus();
                            }
                        }
                    }
                    else {
                        if (focusInAGVIndex.has(i)) {
                            focusInAGVIndex.delete(i);
                        }
                    }
                }
            }

            // 로봇 애니메이션 처리
            {
                // 1번 관절 기준 [5]
                let vLinkOffset = [
                    new VIZCore.Vector3(191, 169, 0),
                    new VIZCore.Vector3(196, 350, 327),
                    new VIZCore.Vector3(211, 277, 962),
                    new VIZCore.Vector3(395, 275, 2105),
                    new VIZCore.Vector3(395, 169, 2277) // z축 
                ];

                // 애니메이션 기준 [6]
                let aniStep = [4, 6, 6, 6, 6, 4];
                //[6][6][4]
                let aniData = [[[0.0, 0.25, 30, -30], [0.25, 0.5, -30, -30], [0.5, 0.75, -30, 30], [0.75, 1.0, 30, 30]],
                [[0.0, 0.125, 60, 0], [0.125, 0.25, 0, 60], [0.25, 0.35, 60, 60], [0.35, 0.625, 60, 0], [0.625, 0.95, 0, 60], [0.95, 1.0, 60, 60]],
                [[0.0, 0.125, 60, 0], [0.125, 0.25, 0, 60], [0.25, 0.35, 60, 60], [0.35, 0.625, 60, 0], [0.625, 0.95, 0, 60], [0.95, 1.0, 60, 60]],
                [[0.0, 0.125, 0, 60], [0.125, 0.25, 60, 0], [0.25, 0.5, 0, 0], [0.5, 0.625, 0, 60], [0.625, 0.75, 60, 0], [0.75, 1.0, 0, 0]],
                [[0.0, 0.125, 0, 180], [0.125, 0.25, 180, 0], [0.25, 0.5, 0, 0], [0.5, 0.625, 0, 180], [0.625, 0.75, 180, 0], [0.75, 1.0, 0, 0]],
                [[0.0, 0.25, 30, -30], [0.25, 0.5, -30, -30], [0.5, 0.75, -30, 30], [0.75, 1.0, 30, 30]],
                ];

                let dwTickStep = dwTick - g_AniLastTick;

                for (let i = 0; i < g_robotCnt; i++) {

                    if (g_robotObjIndex[i][0] < 0)
                        continue;
                    if (g_robotObjIndex[i][1] < 0)
                        continue;
                    if (g_robotObjIndex[i][2] < 0)
                        continue;
                    if (g_robotObjIndex[i][3] < 0)
                        continue;
                    if (g_robotObjIndex[i][4] < 0)
                        continue;
                    if (g_robotObjIndex[i][5] < 0)
                        continue;

                    //선택된 로봇 기준 공정 Process 가시화
                    if (selectBody < 0) {
                        for (let j = 0; j < 6; j++) {
                            if (g_robotObjIndex[i][j] === undefined)
                                continue;

                            for (let k = 0; k < g_robotObjects[i][j].length; k++) {
                                let body = g_robotObjects[i][j][k];
                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                                if (action.selection) {
                                    selectBody = g_robotObjIndex[i][j];
                                    selectType = 0;

                                    let pos = new VIZCore.Vector3().copy(g_vCellPosition[g_robotCellIndex[i]]);
                                    pos.z = 2000;
                                    //pos.z = 10000;
                                    //console.log("x : " + g_vCellPosition[g_robotCellIndex[i]].x + ", y : " + g_vCellPosition[g_robotCellIndex[i]].y);
                                    //console.log("progress : " + g_HV_CELL[g_robotCellIndex[i]].progress);
                                    //let cellProgress = Math.floor(g_HV_CELL[g_robotCellIndex[i]].progress);
                                    //let cellProgress = Math.round(g_HV_CELL[g_robotCellIndex[i]].progress);
                                    let cellProgress = parseFloat(g_HV_CELL[g_robotCellIndex[i]].progress).toFixed(2);

                                    if (g_lastRobotSelectType === selectType) {
                                        //update
                                        view.Drawing.UpdateCustom(pos, { progress: cellProgress });
                                    }
                                    else {
                                        //clear 후 처리
                                        view.Drawing.Clear();
                                        view.Drawing.AddCustom(pos, { progress: cellProgress });
                                    }

                                    break;
                                }

                            }
                        }
                    }


                    //Robot 애니메이션 처리
                    if ((g_HV_CELL[g_robotCellIndex[i]].progress == 0 || g_HV_CELL[g_robotCellIndex[i]].progress >= 100) && g_HV_CELL[g_robotCellIndex[i]].state != 1)
                        continue;

                    g_robotTickCurrent[i] += dwTickStep;

                    let dwTimeOffset = i * 24586443;
                    let dwCurrentTime = g_robotTickCurrent[i] + dwTimeOffset;

                    let dwAniLength = 1000 * 10;
                    let fRate = (dwCurrentTime % dwAniLength) / dwAniLength;

                    //[6]
                    let fAngle = [0, 0, 0, 0, 0];

                    //if (g_HV_CELL[g_robotCellIndex[i]].state == 0)
                    //continue;
                    for (let j = 0; j < 6; j++) {
                        for (let k = 0; k < aniStep[j]; k++) {
                            if (fRate >= aniData[j][k][0] && fRate <= aniData[j][k][1]) {
                                let fTimeOffset = aniData[j][k][0];
                                let fTimeLen = aniData[j][k][1] - aniData[j][k][0];

                                fAngle[j] = aniData[j][k][2] + ((fRate - fTimeOffset) / fTimeLen) * (aniData[j][k][3] - aniData[j][k][2]);
                            }
                        }

                        fAngle[j] = fAngle[j] / 180.0 * 3.141592654;
                    }

                    if (g_robotObjIndex[i][0] < 0)
                        continue;

                    let matTransZero = new VIZCore.Matrix4();
                    let matTransTo = new VIZCore.Matrix4();
                    let matRotate = new VIZCore.Matrix4();

                    let vBase = new VIZCore.Vector3();
                    let robotBaseBodies = g_robotObjects[i][1];
                    //let vRobotBase = view.Data.GetBBoxFormMatrix(robotBaseBodies).min;
                    //let vRobotBase = view.Data.GetBBox(robotBaseBodies).min;
                    let vRobotBase = view.Data.GetBBoxFormOriginal(robotBaseBodies).min;

                    //let vRobotBase = g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][1]] -> m_vMin;
                    //if (Math.abs(vRobotBase.x - (-2030)) < 1000 || Math.abs(vRobotBase.x - 18167) < 1000 || Math.abs(vRobotBase.x - 38188) < 1000 || Math.abs(vRobotBase.x - 58119) < 1000 ||
                    //    Math.abs(vRobotBase.x - 78112) < 1000)
                    //    ;
                    //else
                    //    fAngle[0] += 3.141592654;
                    //if (Math.abs(vRobotBase.x - (-2030)) < 1000
                    //    || Math.abs(vRobotBase.x - 18167) < 1000
                    //    || Math.abs(vRobotBase.x - 38188) < 1000
                    //    || Math.abs(vRobotBase.x - 58119) < 1000
                    //    || Math.abs(vRobotBase.x - 78112) < 1000)
                    //    fAngle[0] += 3.141592654;
                    if (Math.abs(vRobotBase.x - (-2030)) > 1000)
                        fAngle[0] += 3.141592654;

                    //CRMMatrix4 < float > matLink[6];
                    //CRMMatrix4 < float > matTranslate;
                    //matTranslate.SetTranslate(0, fAngle[5] * 500, 0);
                    let matLink = [];
                    let matTranslate = new VIZCore.Matrix4();
                    matTranslate.makeTranslation(0, fAngle[5] * 500, 0);

                    {
                        let body = robotBaseBodies[0];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                        matTranslate = new VIZCore.Matrix4().multiplyMatrices(matTranslate, action.instance);
                    }

                    // 1번 관절
                    {
                        //vBase = vRobotBase + vLinkOffset[0];
                        vBase = new VIZCore.Vector3().addVectors(vRobotBase, vLinkOffset[0]);

                        matTransZero = new VIZCore.Matrix4().makeTranslation(-vBase.x, -vBase.y, -vBase.z);
                        matRotate = new VIZCore.Matrix4().makeRotationZ(fAngle[0]);
                        matTransTo = new VIZCore.Matrix4().makeTranslation(vBase.x, vBase.y, vBase.z);

                        //matLink[0] = matTransTo * matRotate * matTransZero
                        matLink[0] = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTransTo, matRotate), matTransZero);
                    }

                    // 2번 관절
                    {
                        //vBase = vRobotBase + vLinkOffset[1];
                        vBase = new VIZCore.Vector3().addVectors(vRobotBase, vLinkOffset[1]);

                        matTransZero = new VIZCore.Matrix4().makeTranslation(-vBase.x, -vBase.y, -vBase.z);
                        matRotate = new VIZCore.Matrix4().makeRotationY(fAngle[1]);
                        matTransTo = new VIZCore.Matrix4().makeTranslation(vBase.x, vBase.y, vBase.z);

                        //matLink[1] = matTransTo * matRotate * matTransZero;
                        matLink[1] = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTransTo, matRotate), matTransZero);
                    }

                    // 3번 관절
                    {
                        //vBase = vRobotBase + vLinkOffset[2];
                        vBase = new VIZCore.Vector3().addVectors(vRobotBase, vLinkOffset[2]);

                        matTransZero = new VIZCore.Matrix4().makeTranslation(-vBase.x, -vBase.y, -vBase.z);
                        matRotate = new VIZCore.Matrix4().makeRotationY(fAngle[2]);
                        matTransTo = new VIZCore.Matrix4().makeTranslation(vBase.x, vBase.y, vBase.z);

                        //matLink[2] = matTransTo * matRotate * matTransZero;
                        matLink[2] = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTransTo, matRotate), matTransZero);
                    }

                    // 4번 관절
                    {
                        //vBase = vRobotBase + vLinkOffset[3];
                        vBase = new VIZCore.Vector3().addVectors(vRobotBase, vLinkOffset[3]);

                        matTransZero = new VIZCore.Matrix4().makeTranslation(-vBase.x, -vBase.y, -vBase.z);
                        matRotate = new VIZCore.Matrix4().makeRotationY(fAngle[3]);
                        matTransTo = new VIZCore.Matrix4().makeTranslation(vBase.x, vBase.y, vBase.z);

                        //matLink[3] = matTransTo * matRotate * matTransZero;
                        matLink[3] = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTransTo, matRotate), matTransZero);
                    }

                    // 5번 관절
                    {
                        //vBase = vRobotBase + vLinkOffset[4];
                        vBase = new VIZCore.Vector3().addVectors(vRobotBase, vLinkOffset[4]);

                        matTransZero = new VIZCore.Matrix4().makeTranslation(-vBase.x, -vBase.y, -vBase.z);
                        matRotate = new VIZCore.Matrix4().makeRotationX(fAngle[4]);
                        matTransTo = new VIZCore.Matrix4().makeTranslation(vBase.x, vBase.y, vBase.z);

                        //matLink[4] = matTransTo * matRotate * matTransZero;
                        matLink[4] = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTransTo, matRotate), matTransZero);
                    }

                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][0]] -> SetTransform(matTranslate);
                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][1]] -> SetTransform(matTranslate * matLink[0]);
                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][2]] -> SetTransform(matTranslate * matLink[0] * matLink[1]);
                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][3]] -> SetTransform(matTranslate * matLink[0] * matLink[1] * matLink[2]);
                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][4]] -> SetTransform(matTranslate * matLink[0] * matLink[1] * matLink[2] * matLink[3]);
                    //g_inf.m_data.m_ppNode[m_newRobotObjIndex[i][5]] -> SetTransform(matTranslate * matLink[0] * matLink[1] * matLink[2] * matLink[3] * matLink[4]);
                    setBodyMatrixHandlerList(g_robotObjects[i][0], matTranslate);
                    setBodyMatrixHandlerList(g_robotObjects[i][1],
                        new VIZCore.Matrix4().multiplyMatrices(matTranslate, matLink[0]));
                    setBodyMatrixHandlerList(g_robotObjects[i][2],
                        new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTranslate, matLink[0]), matLink[1]));
                    setBodyMatrixHandlerList(g_robotObjects[i][3],
                        new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTranslate, matLink[0]), matLink[1]), matLink[2]));
                    setBodyMatrixHandlerList(g_robotObjects[i][4],
                        new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTranslate, matLink[0]), matLink[1]), matLink[2]), matLink[3]));
                    setBodyMatrixHandlerList(g_robotObjects[i][5],
                        new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matTranslate, matLink[0]), matLink[1]), matLink[2]), matLink[3]), matLink[4]));

                }
            }

            if (selectBody < 0 && g_lastRobotSelectId >= 0) {
                view.Drawing.Clear();
            }
            g_lastRobotSelectId = selectBody;
            g_lastRobotSelectType = selectType;

            g_AniLastTick = dwTick;

            view.MeshBlock.Reset();
            view.Renderer.Render();

        };

        this.Hyundai_UseAGVFocus = function (enable) {
            scope.useAGVFocus = enable;

            if (!enable && timerFocus) {
                clearInterval(timerFocus);
                timerFocus = null;

                view.Camera.Rollback(cameraBackupID);
                view.Camera.DeleteBackupData(cameraBackupID);
                cameraBackupID = undefined;

                focusAGVIndex = [];
            }
        };

        this.Hyundai_AGV_Focus = function () {

            //실행전 배터리 확인
            if (focusAGVIndex.length > 0) {
                for (let i = focusAGVIndex.length - 1; i >= 0; --i) {
                    if (g_HV_AGV[focusAGVIndex[i]].battery > 30) {
                        focusAGVIndex.splice(i, 1);
                    }
                }
            }

            if (focusAGVIndex.length > 0) {

                let timeStartFocus = new Date().getTime();
                let focusAniLength = 1;
                let nextAnimation = 5;

                let focusFinish = false;
                let focusOutput = false;

                let focusAGV = function () {
                    let timeCurrentFocus = (new Date().getTime() - timeStartFocus); // 밀리초
                    let fRate = timeCurrentFocus / 1000 / focusAniLength;
                    let fNextRate = timeCurrentFocus / 1000 / nextAnimation;

                    let backup = view.Camera.GetBackupData(cameraBackupID);

                    //포커스 해야 하는 대상 바운드 박스
                    let focusObject = [];
                    let focusObjectNum = 0;
                    for (let j = 0; j < 5; j++) {
                        if (g_RobotCarObjects[focusAGVIndex[0]][j] === undefined)
                            continue;

                        let carObjNum = g_RobotCarObjects[focusAGVIndex[0]][j].length;
                        for (let k = 0; k < carObjNum; k++) {
                            focusObject[focusObjectNum] = g_RobotCarObjects[focusAGVIndex[0]][j][k];
                            focusObjectNum++;
                        }
                    }

                    {
                        let body = focusObject[0];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                        if (!action.selection) {
                            action.selection = true;
                            body.object.flag.updateProcess = true;
                        }
                    }

                    let boundBox = view.Data.GetBBoxFormMatrix(focusObject);
                    view.Camera.FocusBBox(boundBox);

                    let focusCamera = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                    let focusZoom = view.Camera.cameraZoom;
                    let focusViewDistance = view.Camera.viewDistance;

                    //view.Camera.FocusPivot(focusObject);
                    view.Camera.Rollback(cameraBackupID);
                    //cameraBackupID = view.Camera.Backup();
                    let cameraSrc = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                    let zoomSrc = view.Camera.cameraZoom;
                    let viewDistanceSrc = view.Camera.viewDistance;

                    if (fRate >= 1.0) {
                        fRate = 1.0;
                        focusOutput = true;
                        view.Camera.cameraMatrix.copy(focusCamera);
                        view.Camera.viewDistance = focusViewDistance;
                        view.Camera.cameraZoom = focusZoom;

                        view.Camera.ResizeGLWindow();

                        if (fNextRate >= 1.0) {
                            if (timerFocus !== null) {
                                clearInterval(timerFocus);
                                timerFocus = null;
                                timeStartFocus = new Date().getTime();

                                timerFocus = setInterval(function () {
                                    outputFocus();
                                }, 50);
                            }
                        }

                        return;
                    }

                    //matCamera
                    {
                        let camera1 = new VIZCore.Matrix4().copy(cameraSrc).multiplyScalar(1.0 - fRate); //기존 위치
                        let camera2 = new VIZCore.Matrix4().copy(focusCamera).multiplyScalar(fRate); // 포커스 위치

                        let currentCamera = new VIZCore.Matrix4();
                        for (let i = 0; i < 16; i++)
                            currentCamera.elements[i] = camera1.elements[i] + camera2.elements[i];

                        //currentCamera
                        view.Camera.cameraMatrix.copy(currentCamera);
                    }

                    //viewDistance
                    {
                        //scope.viewDistance
                        let viewDistance1 = viewDistanceSrc * (1.0 - fRate); //기존 위치
                        let viewDistance2 = focusViewDistance * fRate; // 포커스 위치

                        view.Camera.viewDistance = viewDistance1 + viewDistance2;
                    }

                    //Zoom
                    {
                        let zoom1 = focusZoom * (1.0 - fRate); //기존 줌
                        let zoom2 = zoomSrc * fRate; // 포커스 줌


                        //currentCamera
                        view.Camera.cameraZoom = zoom1 + zoom2;
                    }

                    view.Camera.ResizeGLWindow();

                };

                let outputFocus = function () {
                    let timeCurrentFocus = (new Date().getTime() - timeStartFocus); // 밀리초
                    let fRate = timeCurrentFocus / 1000 / focusAniLength;

                    let backup = view.Camera.GetBackupData(cameraBackupID);

                    //포커스 해야 하는 대상 바운드 박스
                    let focusObject = [];
                    let focusObjectNum = 0;
                    for (let j = 0; j < 5; j++) {
                        if (g_RobotCarObjects[focusAGVIndex[0]][j] === undefined)
                            continue;

                        let carObjNum = g_RobotCarObjects[focusAGVIndex[0]][j].length;
                        for (let k = 0; k < carObjNum; k++) {
                            focusObject[focusObjectNum] = g_RobotCarObjects[focusAGVIndex[0]][j][k];
                            focusObjectNum++;
                        }
                    }


                    {
                        let body = focusObject[0];
                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                        if (action.selection) {
                            action.selection = false;
                            body.object.flag.updateProcess = true;
                        }
                    }
                    let boundBox = view.Data.GetBBoxFormMatrix(focusObject);
                    view.Camera.FocusBBox(boundBox);

                    let focusCamera = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                    let focusZoom = view.Camera.cameraZoom;
                    let focusViewDistance = view.Camera.viewDistance;

                    view.Camera.Rollback(cameraBackupID);
                    //cameraBackupID = view.Camera.Backup();
                    let cameraSrc = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                    let zoomSrc = view.Camera.cameraZoom;
                    let viewDistanceSrc = view.Camera.viewDistance;

                    if (fRate >= 1.0) {
                        fRate = 1.0;
                        focusFinish = true;

                        view.Camera.cameraMatrix.copy(cameraSrc);
                        view.Camera.viewDistance = viewDistanceSrc;
                        view.Camera.cameraZoom = zoomSrc;

                        view.Camera.ResizeGLWindow();

                        if (focusFinish) {
                            clearInterval(timerFocus);
                            timerFocus = null;

                            focusAGVIndex.splice(0, 1);
                            scope.Hyundai_AGV_Focus();
                            return;
                        }
                    }

                    //matCamera
                    {
                        let camera1 = new VIZCore.Matrix4().copy(cameraSrc).multiplyScalar(fRate); //기존 위치
                        let camera2 = new VIZCore.Matrix4().copy(focusCamera).multiplyScalar(1.0 - fRate); // 포커스 위치

                        let currentCamera = new VIZCore.Matrix4();
                        for (let i = 0; i < 16; i++)
                            currentCamera.elements[i] = camera1.elements[i] + camera2.elements[i];

                        //currentCamera
                        view.Camera.cameraMatrix.copy(currentCamera);
                    }

                    //viewDistance
                    {
                        //scope.viewDistance
                        let viewDistance1 = viewDistanceSrc * (fRate); //기존 위치
                        let viewDistance2 = focusViewDistance * (1.0 - fRate); // 포커스 위치

                        view.Camera.viewDistance = viewDistance1 + viewDistance2;
                    }

                    //Zoom
                    {
                        let zoom1 = focusZoom * (fRate); //기존 줌
                        let zoom2 = zoomSrc * (1.0 - fRate); // 포커스 줌


                        //currentCamera
                        view.Camera.cameraZoom = zoom1 + zoom2;
                    }

                    view.Camera.ResizeGLWindow();

                };

                timerFocus = setInterval(function () {
                    focusAGV();
                }, 50);

            }
            else {
                if (cameraBackupID !== undefined) {
                    view.Camera.Rollback(cameraBackupID);
                    view.Camera.DeleteBackupData(cameraBackupID);
                    cameraBackupID = undefined;
                }
            }

        };

        this.Hyundai_GetSeqObjects = function (key) {
            if (!scope.hyundai_SEQ.has(key))
                return undefined;

            //let obejcts = scope.hyundai_SEQ.get(key);
            let num = key - 1;
            return g_RobotCarObjects[num];
        };

        this.Hyundai_GetSeqKeyByText = function (text) {

            let finedKey = -1;
            let findText = function (value, key, map) {

                if (finedKey > 0)
                    return;

                if (value[1].localeCompare(text) !== 0)
                    return; //차량 검색


                //if (value[3].localeCompare(text) !== 0) return; //agv 검색
                finedKey = key;
            };

            scope.hyundai_SEQ.forEach(findText);

            return finedKey;
        };

        this.LS_AnimationItem = function () {
            let item = {
                key: undefined,
                object: [],
                next: [],
                toggle: 0,

                duration: 0,
                start: {
                    cx: 0,
                    cy: 0,
                    cz: 0,
                    tx: 0,
                    ty: 0,
                    tz: 0,
                    ax: 0,
                    ay: 0,
                    az: 0,
                    visible : true,
                },
                end: {
                    cx: 0,
                    cy: 0,
                    cz: 0,
                    tx: 0,
                    ty: 0,
                    tz: 0,
                    ax: 0,
                    ay: 0,
                    az: 0,
                    visible : true,
                },
                review: undefined,

                //현대 중공업 리뷰 애니메이션 처리 
                //리뷰 애니메이션
                reviewAction: {
                    item: [],
                    actionType: 0,

                    start: {
                        ox: 0,
                        oy: 0
                    },
                    end: {
                        ox: 0,
                        oy: 0
                    }
                },
            };
            return item;
        };



        let animationBodyID = 199999;
        let keyIndex = 0;
        let newKey = function () {
            let result = "key" + keyIndex;
            keyIndex++;
            return result;
        };
        let mapAnimationBodyID = new Map();
        this.BackupUrl = "";
        this.GetAnimationBodyID = function (url) {
            if (scope.BackupUrl.localeCompare(url) !== 0) {
                animationBodyID++;
                scope.BackupUrl = url;
                mapAnimationBodyID.set(animationBodyID, animationBodyID);
            }
            return animationBodyID;
        };

        this.hyundai_POC = function () {
            let add = function (keyRoot, key, ids, duration, start, end, rotateS, rotateE, center, next) {
                //let location = new VIZCore.Vector3(5568841, 2840092, 50573);
                let item = scope.LS_AnimationItem();
                item.keyRoot = "key" + keyRoot;
                item.key = "key" + key;
                item.object = ids;
                item.duration = duration;
                item.start.tx = start.x;
                item.start.ty = start.y;
                item.start.tz = start.z;
                item.end.tx = end.x;
                item.end.ty = end.y;
                item.end.tz = end.z;
                let arrNext = [];
                for (let i = 0; i < next.length; i++) {
                    arrNext.push("key" + next[i]);
                }
                item.next = arrNext;
                item.start.cx = center.x;
                item.start.cy = center.y;
                item.start.cz = center.z;
                item.end.cx = center.x;
                item.end.cy = center.y;
                item.end.cz = center.z;
                //item.start.cx =0 ;
                //item.start.cy =0 ;
                //item.start.cz =0 ;
                //item.end.cx = 0;
                //item.end.cy = 0;
                //item.end.cz = 0;
                item.start.ax = rotateS.x;
                item.start.ay = rotateS.y;
                item.start.az = rotateS.z;
                item.end.ax = rotateE.x;
                item.end.ay = rotateE.y;
                item.end.az = rotateE.z;

                LS_mapAnimation_Key.set(item.key, item);
                LS_mapAnimation_ID.set(item.key, item);
            };
            let pos = [];

            let offsetZ = 0;

            //let keyItem = addKeyItem(27550, 10000, 25);
            let keyIndex = 0;
            let ids = [30239];

            let bodies = view.Data.GetBodies(ids);
            let bbox = view.MeshProcess.GetAABBFromMatrix(bodies);

            //pos.push(new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.center.z));
            //pos.push(new VIZCore.Vector3(bbox.center.x, bbox.center.y + 5000, bbox.center.z));
            pos.push(new VIZCore.Vector3(0, 0, 0));
            pos.push(new VIZCore.Vector3(0, 5000, 0));
            pos.push(new VIZCore.Vector3(0, 5000, 0));
            pos.push(new VIZCore.Vector3(0, 0, 0));


            let index = 0;
            add(keyIndex, keyIndex + 0, ids, 10000, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 0), new VIZCore.Vector3(0, 0, 90), new VIZCore.Vector3(), [1]);
            add(keyIndex, keyIndex + 1, ids, 10000, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 90), new VIZCore.Vector3(0, 0, 0), new VIZCore.Vector3(), []);

            LS_AddAnimation('key0', "", 1);

            LS_StartAnimation();
        };

        let mapTest = new Map();

        this.Sejong_Init = function () {

            let add = function (image, keyRoot, key, id, duration, start, end, rotate, next) {
                //let location = new VIZCore.Vector3(5568841, 2840092, 50573);
                let item = scope.LS_AnimationItem();
                item.keyRoot = "key" + keyRoot;
                item.key = "key" + key;
                item.object = [id];
                item.duration = duration;
                item.start.tx = start.x;
                item.start.ty = start.y;
                item.start.tz = start.z;
                item.end.tx = end.x;
                item.end.ty = end.y;
                item.end.tz = end.z;
                let arrNext = [];
                for (let i = 0; i < next.length; i++) {
                    arrNext.push("key" + next[i]);
                }
                item.next = arrNext;
                item.start.cx = 0;
                item.start.cy = 0;
                item.start.cz = 0;
                item.end.cx = 0;
                item.end.cy = 0;
                item.end.cz = 0;
                item.start.ax = rotate.x;
                item.start.ay = rotate.y;
                item.start.az = rotate.z;
                item.end.ax = rotate.x;
                item.end.ay = rotate.y;
                item.end.az = rotate.z;

                LS_mapAnimation_Key.set(item.key, item);
                LS_mapAnimation_ID.set(item.key, item);

                //LS_AddAnimation(item.key + "", "");
            };
            let pos = [];
            let offsetZ = 5000;
            // 직선 0
            pos.push(new VIZCore.Vector3(2575538.42, 1019621.03, 34055.54 + offsetZ));
            pos.push(new VIZCore.Vector3(2806407.99, 1015454.53, 38597.52 + offsetZ));
            pos.push(new VIZCore.Vector3(3602796.47, 753849, 48511.44 + offsetZ));
            pos.push(new VIZCore.Vector3(4176516.58, 577808.6, 30004.34 + offsetZ));

            // 회전 4
            pos.push(new VIZCore.Vector3(2877545, 730681, 35872 + offsetZ));
            pos.push(new VIZCore.Vector3(2917997.72, 824942.89, 38312.55 + offsetZ));
            pos.push(new VIZCore.Vector3(3041894.54, 819151.26, 39884.27 + offsetZ));
            pos.push(new VIZCore.Vector3(3144719.49, 734289.10, 39891.48 + offsetZ));
            pos.push(new VIZCore.Vector3(3119556.85, 635882.30, 37323.27 + offsetZ));
            // 9
            pos.push(new VIZCore.Vector3(2069919.25, 887233.60, 49558.44 + offsetZ));
            pos.push(new VIZCore.Vector3(2231670.15, 936514.84, 40341.27 + offsetZ));
            pos.push(new VIZCore.Vector3(2567447.40, 1012197.06, 33801.58 + offsetZ));
            pos.push(new VIZCore.Vector3(2600022.20, 833228.39, 31949.33 + offsetZ));
            pos.push(new VIZCore.Vector3(2881929.47, 726028.06, 35784.98 + offsetZ));
            pos.push(new VIZCore.Vector3(3119911.46, 631985.25, 39314.30 + offsetZ));
            pos.push(new VIZCore.Vector3(3527226.58, 467218.16, 35736.64 + offsetZ));
            // 16
            pos.push(new VIZCore.Vector3(3262103.87, 291048.26, 39989.94 + offsetZ));
            pos.push(new VIZCore.Vector3(3029963.62, 379925.47, 35523.25 + offsetZ));
            pos.push(new VIZCore.Vector3(2940717.72, 140826.39, 35782.45 + offsetZ));
            pos.push(new VIZCore.Vector3(2704181.62, 236033.28, 34540.38 + offsetZ));
            pos.push(new VIZCore.Vector3(2793844.79, 483448.19, 30600.88 + offsetZ));
            pos.push(new VIZCore.Vector3(2552768.46, 576568.53, 30135.04 + offsetZ));

            // 22
            pos.push(new VIZCore.Vector3(3118461.44, 630458.13, 37273.59 + offsetZ));
            pos.push(new VIZCore.Vector3(2883016.03, 725243.98, 35786.98 + offsetZ));
            pos.push(new VIZCore.Vector3(2794663.47, 479243.05, 30482.59 + offsetZ));
            pos.push(new VIZCore.Vector3(3025661.77, 385717.70, 32854.54 + offsetZ));
            //pos.push(new VIZCore.Vector3(0, 0, 0+ offsetZ));
            // 26
            pos.push(new VIZCore.Vector3(3350861, 540213, 39913 + offsetZ));
            pos.push(new VIZCore.Vector3(3123483, 629045, 37379 + offsetZ));
            pos.push(new VIZCore.Vector3(3028337, 386326, 32879 + offsetZ));
            pos.push(new VIZCore.Vector3(2792751, 479868, 30481 + offsetZ));
            pos.push(new VIZCore.Vector3(2560006, 574374, 30150 + offsetZ));
            pos.push(new VIZCore.Vector3(2472437, 328148, 30449 + offsetZ));
            pos.push(new VIZCore.Vector3(2706908, 228372, 34705 + offsetZ));

            //33
            pos.push(new VIZCore.Vector3(2467275, 329626, 30399 + offsetZ));
            pos.push(new VIZCore.Vector3(2559473, 576730, 30144 + offsetZ));
            pos.push(new VIZCore.Vector3(2794957, 484467, 30643 + offsetZ));
            pos.push(new VIZCore.Vector3(2880249, 729247, 35851 + offsetZ));
            pos.push(new VIZCore.Vector3(2599067, 829684, 31830 + offsetZ));

            //38
            pos.push(new VIZCore.Vector3(5624326, 108252, 30000 + offsetZ));
            pos.push(new VIZCore.Vector3(5180180, 366805, 25014 + offsetZ));
            pos.push(new VIZCore.Vector3(4845586, 443334, 56286 + offsetZ));
            pos.push(new VIZCore.Vector3(4636490, 482118, 25472 + offsetZ));
            pos.push(new VIZCore.Vector3(4418274, 525637, 58306 + offsetZ));
            pos.push(new VIZCore.Vector3(4176053, 578728, 30004 + offsetZ));
            pos.push(new VIZCore.Vector3(4094458, 287855, 28366 + offsetZ));

            // 45
            pos.push(new VIZCore.Vector3(3140607, 951699, 45851 + offsetZ));
            pos.push(new VIZCore.Vector3(3127693, 1062047, 47572 + offsetZ));
            pos.push(new VIZCore.Vector3(3110454, 1133578, 48669 + offsetZ));
            pos.push(new VIZCore.Vector3(3097961, 1186947, 49375 + offsetZ));
            pos.push(new VIZCore.Vector3(3044275, 1329585, 49024 + offsetZ));
            pos.push(new VIZCore.Vector3(2787891, 1273505, 40025 + offsetZ));
            pos.push(new VIZCore.Vector3(2845834, 1015208, 39598 + offsetZ));

            // 52
            pos.push(new VIZCore.Vector3(2555388, 1031895, 33896 + offsetZ));
            pos.push(new VIZCore.Vector3(2468864, 1227881, 35323 + offsetZ));
            pos.push(new VIZCore.Vector3(2356291, 1527520, 34552 + offsetZ));
            pos.push(new VIZCore.Vector3(2362513, 1810136, 39593 + offsetZ));
            pos.push(new VIZCore.Vector3(2645581, 1791903, 44652 + offsetZ));

            //57
            pos.push(new VIZCore.Vector3(2577307, 2836131, 47678 + offsetZ));
            pos.push(new VIZCore.Vector3(2857116, 2731938, 54805 + offsetZ));
            pos.push(new VIZCore.Vector3(3087841, 2571548, 57679 + offsetZ));
            pos.push(new VIZCore.Vector3(3234898, 2695243, 55545 + offsetZ));
            pos.push(new VIZCore.Vector3(3402734, 2833862, 54516 + offsetZ));
            pos.push(new VIZCore.Vector3(3477922, 3006093, 54722 + offsetZ));

            // 63
            pos.push(new VIZCore.Vector3(2529275, 2792550, 45535 + offsetZ));
            pos.push(new VIZCore.Vector3(2657700, 3054947, 51362 + offsetZ));
            pos.push(new VIZCore.Vector3(2815458, 3325455, 54658 + offsetZ));
            pos.push(new VIZCore.Vector3(2996095, 3510770, 60086 + offsetZ));
            pos.push(new VIZCore.Vector3(3305258, 3686298, 65350 + offsetZ));
            pos.push(new VIZCore.Vector3(3953337, 3856141, 46802 + offsetZ));

            //69
            pos.push(new VIZCore.Vector3(4175934, 581983, 30004 + offsetZ));
            pos.push(new VIZCore.Vector3(3997736, 618958, 34343 + offsetZ));
            pos.push(new VIZCore.Vector3(3870082, 653531, 38489 + offsetZ));
            pos.push(new VIZCore.Vector3(3807770, 679343, 40020 + offsetZ));
            pos.push(new VIZCore.Vector3(3602555, 752222, 48426 + offsetZ));

            //74
            pos.push(new VIZCore.Vector3(4093329, 284655, 28181 + offsetZ));
            pos.push(new VIZCore.Vector3(3837867, 369538, 30093 + offsetZ));
            pos.push(new VIZCore.Vector3(3563710, 460411, 30595 + offsetZ));
            pos.push(new VIZCore.Vector3(3500800, 382924, 33655 + offsetZ));
            pos.push(new VIZCore.Vector3(3556335, 198847, 30012 + offsetZ));
            //79
            pos.push(new VIZCore.Vector3(4172441, 617369, 30003 + offsetZ));
            pos.push(new VIZCore.Vector3(4324274, 1000253, 39923 + offsetZ));
            pos.push(new VIZCore.Vector3(4584647, 1260628, 39967 + offsetZ));
            pos.push(new VIZCore.Vector3(4894924, 1591039, 49998 + offsetZ));
            pos.push(new VIZCore.Vector3(5143775, 1835028, 61192 + offsetZ));
            pos.push(new VIZCore.Vector3(5338804, 2199587, 55022 + offsetZ));
            pos.push(new VIZCore.Vector3(5464307, 2659881, 50000 + offsetZ));
            pos.push(new VIZCore.Vector3(5484946, 3020955, 45953 + offsetZ));
            pos.push(new VIZCore.Vector3(5555117, 3366367, 44976 + offsetZ));

            //88
            pos.push(new VIZCore.Vector3(4378945, 3917080, 50413 + offsetZ));
            pos.push(new VIZCore.Vector3(4380261, 3785388, 58418 + offsetZ));
            pos.push(new VIZCore.Vector3(4688433, 3624181, 60534 + offsetZ));
            pos.push(new VIZCore.Vector3(4976238, 3481743, 64967 + offsetZ));
            pos.push(new VIZCore.Vector3(5276886, 3424890, 54995 + offsetZ));
            pos.push(new VIZCore.Vector3(5538835, 3367094, 44990 + offsetZ));
            pos.push(new VIZCore.Vector3(5484520, 3878274, 41008 + offsetZ));
            pos.push(new VIZCore.Vector3(5095759, 3860821, 54023 + offsetZ));
            pos.push(new VIZCore.Vector3(4892032, 3883126, 54918 + offsetZ));

            // 97
            pos.push(new VIZCore.Vector3(4320628, 3804530, 54487 + offsetZ));
            pos.push(new VIZCore.Vector3(4250055, 3885439, 50045 + offsetZ));
            pos.push(new VIZCore.Vector3(4153952, 3925127, 50003 + offsetZ));
            pos.push(new VIZCore.Vector3(4011867, 3901073, 49897 + offsetZ));
            pos.push(new VIZCore.Vector3(3906822, 3939885, 40003 + offsetZ));
            pos.push(new VIZCore.Vector3(3771064, 4096394, 41983 + offsetZ));
            pos.push(new VIZCore.Vector3(3704879, 4272423, 42655 + offsetZ));
            pos.push(new VIZCore.Vector3(3683412, 4475314, 34347 + offsetZ));
            pos.push(new VIZCore.Vector3(3757533, 4724282, 29974 + offsetZ));

            // 106
            pos.push(new VIZCore.Vector3(3843772, 4835976, 29864 + offsetZ));
            pos.push(new VIZCore.Vector3(3761258, 4732739, 29968 + offsetZ));
            pos.push(new VIZCore.Vector3(3674190, 4741387, 29975 + offsetZ));
            pos.push(new VIZCore.Vector3(3590008, 4777715, 29958 + offsetZ));
            pos.push(new VIZCore.Vector3(3540421, 4805965, 29977 + offsetZ));
            pos.push(new VIZCore.Vector3(3398586, 4864773, 29991 + offsetZ));

            //112
            pos.push(new VIZCore.Vector3(3103324, 5114105, 45903 + offsetZ));
            pos.push(new VIZCore.Vector3(3102675, 5061269, 45000 + offsetZ));
            pos.push(new VIZCore.Vector3(3051825, 5057800, 44703 + offsetZ));
            pos.push(new VIZCore.Vector3(3089757, 4896270, 29998 + offsetZ));
            pos.push(new VIZCore.Vector3(3042426, 4886697, 29999 + offsetZ));
            pos.push(new VIZCore.Vector3(3019755, 4844396, 32105 + offsetZ));
            pos.push(new VIZCore.Vector3(3043710, 4764715, 36230 + offsetZ));

            // 119
            pos.push(new VIZCore.Vector3(2576660, 1015456, 34010 + offsetZ));
            pos.push(new VIZCore.Vector3(2829496, 1015456, 39184 + offsetZ));
            pos.push(new VIZCore.Vector3(3132499, 951244, 45677 + offsetZ));
            pos.push(new VIZCore.Vector3(3517773, 792720, 48533 + offsetZ));
            pos.push(new VIZCore.Vector3(3804722, 680348, 40041 + offsetZ));
            pos.push(new VIZCore.Vector3(4167923, 586036, 30002 + offsetZ));


            let addKeyItem = function (id, time, type) {
                //let key = newKey();
                let currentKey = keyIndex;
                if (type === 0) {
                    // 직진
                    //add(1, keyIndex, keyIndex + 0, id, time, pos[0], pos[1], new VIZCore.Vector3(0, 0, 180), [keyIndex + 1]);
                    //add(1, keyIndex, keyIndex + 1, id, time, pos[1], pos[2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    //add(1, keyIndex, keyIndex + 2, id, time, pos[2], pos[3], new VIZCore.Vector3(0, 0, 0), []);
                    //keyIndex += 3;
                    let index = 119;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 180), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 170), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 160), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 170), []);
                    keyIndex += 5;
                }
                else if (type === 1) {
                    // 버스 회전
                    add(1, keyIndex, keyIndex + 0, id, time, pos[4], pos[5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[5], pos[6], new VIZCore.Vector3(0, 0, -180), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[6], pos[7], new VIZCore.Vector3(0, 0, -225), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[7], pos[8], new VIZCore.Vector3(0, 0, 80), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[8], pos[4], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 2) {
                    // 자동차1
                    add(1, keyIndex, keyIndex + 0, id, time, pos[9], pos[10], new VIZCore.Vector3(0, 0, -165), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[10], pos[11], new VIZCore.Vector3(0, 0, -165), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[11], pos[12], new VIZCore.Vector3(0, 0, 90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[12], pos[13], new VIZCore.Vector3(0, 0, 150), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[13], pos[14], new VIZCore.Vector3(0, 0, 150), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[14], pos[15], new VIZCore.Vector3(0, 0, 150), []);
                    keyIndex += 6;
                }
                else if (type === 3) {
                    // 자동차 2
                    add(1, keyIndex, keyIndex + 0, id, time, pos[16], pos[17], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[17], pos[18], new VIZCore.Vector3(0, 0, 65), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[18], pos[19], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[19], pos[20], new VIZCore.Vector3(0, 0, -115), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[20], pos[21], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 4) {
                    //  자동차2 역
                    add(1, keyIndex, keyIndex + 0, id, time, pos[21], pos[20], new VIZCore.Vector3(0, 0, 165), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[20], pos[19], new VIZCore.Vector3(0, 0, 70), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[19], pos[18], new VIZCore.Vector3(0, 0, 165), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[18], pos[17], new VIZCore.Vector3(0, 0, -115), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[17], pos[16], new VIZCore.Vector3(0, 0, 165), []);
                    keyIndex += 5;
                }
                else if (type === 5) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[22], pos[23], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[23], pos[24], new VIZCore.Vector3(0, 0, 70), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[24], pos[25], new VIZCore.Vector3(0, 0, 165), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[25], pos[22], new VIZCore.Vector3(0, 0, -115), []);
                    keyIndex += 4;
                }
                else if (type === 6) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[26], pos[27], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[27], pos[28], new VIZCore.Vector3(0, 0, -115), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[28], pos[29], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[29], pos[30], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[30], pos[31], new VIZCore.Vector3(0, 0, -115), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[31], pos[32], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 6;
                }
                else if (type === 7) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[33], pos[34], new VIZCore.Vector3(0, 0, -115), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[34], pos[35], new VIZCore.Vector3(0, 0, 165), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[35], pos[36], new VIZCore.Vector3(0, 0, -115), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[36], pos[37], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 4;
                }
                else if (type === 8) {
                    let index = 38;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -25), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -25), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 70), []);
                    keyIndex += 6;
                }
                else if (type === 9) {
                    let index = 44;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, -115), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, -205), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, -205), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -205), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, -205), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, -220), []);
                    keyIndex += 6;
                }
                else if (type === 10) {
                    let index = 45;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -80), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -80), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -80), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 0), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 6;
                }
                else if (type === 11) {
                    let index = 52;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -80), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -180), []);
                    keyIndex += 4;
                }
                else if (type === 12) {
                    let index = 56;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 100), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 4;
                }
                else if (type === 13) {
                    let index = 57;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -150), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -130), []);
                    keyIndex += 5;
                }
                else if (type === 14) {
                    let index = 62;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 70), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 50), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 40), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -40), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 15) {
                    let index = 63;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -120), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -150), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -160), []);
                    keyIndex += 5;
                }
                else if (type === 16) {
                    let index = 68;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 20), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 40), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 60), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 70), []);
                    keyIndex += 5;
                }
                else if (type === 17) {
                    let index = 69;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -20), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -20), []);
                    keyIndex += 4;
                }
                else if (type === 18) {
                    let index = 73;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 160), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 180), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 180), []);
                    keyIndex += 4;
                }

                //74
                else if (type === 19) {
                    let index = 74;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -20), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -20), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 70), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 4;
                }
                else if (type === 20) {
                    let index = 78;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, -70), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, -200), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -200), []);
                    keyIndex += 4;
                }
                else if (type === 21) {
                    let index = 79;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -100), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 8;
                }
                else if (type === 22) {
                    let index = 79;
                    //add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 7;
                }
                else if (type === 23) {
                    let index = 79;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 6;
                }

                else if (type === 24) {
                    let index = 85;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 60), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 50), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 80), []);
                    //add(1, keyIndex, keyIndex + 4, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 80), [keyIndex + 5]);
                    //add(1, keyIndex, keyIndex + 5, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 80), []);
                    keyIndex += 4;
                }
                else if (type === 25) {
                    let index = 85;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 60), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 50), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 50), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 50), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 50), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 80), []);
                    keyIndex += 8;
                }
                else if (type === 26) {
                    let index = 88;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 140), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 160), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -90), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, 20), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -10), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 27) {
                    let index = 88;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 160), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, 20), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -10), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 0], pos[index + 1], new VIZCore.Vector3(0, 0, -90), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 28) {
                    let index = 97;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -45), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -30), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 10), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -50), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -70), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -80), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 29) {
                    let index = 105;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 100), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 130), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 155), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 190), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 150), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 135), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 30) {
                    let index = 106;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 60), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -30), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -40), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -115), []);
                    keyIndex += 5;
                }
                else if (type === 31) {
                    let index = 112;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 10), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 70), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 115), []);
                    keyIndex += 6;
                }

                return "key" + currentKey;
            };

            let keyCount = 40;

            let rand = function (min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
            };

            //let keyItem = addKeyItem(200000, rand(10000, 10000), 14);
            //LS_AddAnimation(keyItem, "", 1);
            let center = new VIZCore.Vector3(5249204.36401367, 1849805.56286621, 63317.220703125);
            let move = new VIZCore.Vector3(2467275, 329626, 30399);
            let rotate = new VIZCore.Vector3(0, 0, -115);
            let trans = getTransform(center, move, rotate);
            let aniCnt = 31;
            let modelCnt = 80; //80;
            for (let i = 0; i < modelCnt; i++) {
                let id = 200000 + i;
                let image = id < 200020 ? 1 : 0;
                let min = id > 200020 ? 15000 : 50000;
                let max = id > 200020 ? 90000 : 150000;

                if (i % 2 === 0 && i < 32) {
                    let keyItem = addKeyItem(200000 + i, rand(min, max), i);
                    LS_AddAnimation(keyItem, "", image);
                }
                else {
                    let timer = function (id, imageType) {
                        let tmpID = id;
                        let tmpImageType = imageType;
                        setTimeout(function () {
                            let keyItem = addKeyItem(tmpID, rand(min, max), rand(0, aniCnt));
                            LS_AddAnimation(keyItem, "", tmpImageType);
                        }, rand(3000, 8000));
                    };
                    timer(200000 + i, image);
                }
            }
            //let keyItem = addKeyItem(200000, 5000, 12);
            //LS_AddAnimation(keyItem, "", 1);
            //keyItem = addKeyItem(200001, rand(5000, 10000), 22);
            //LS_AddAnimation(keyItem, "", 1);
            //keyItem = addKeyItem(200002, rand(5000, 10000), 24);
            //LS_AddAnimation(keyItem, "", 1);
            //keyItem = addKeyItem(200020, 50000, 1);
            //LS_AddAnimation(keyItem, "", 0);
            //LS_AddAnimation(key[3], "", 0);
            //LS_AddAnimation(key[8], "", 0);
            //LS_AddAnimation(key[14], "", 0);
            //LS_AddAnimation(key[21], "", 1);
            //LS_AddAnimation(key[26], "", 0);
            //LS_AddAnimation(key[30], "", 0);
            //LS_AddAnimation(key[36], "", 0);
            //for (let i = 1; i < 10; i++) {
            //    setTimeout(function () {
            //        LS_AddAnimation(key[0 + i * keyCount], "", 1);
            //        LS_AddAnimation(key[3 + i * keyCount], "", 0);
            //        LS_AddAnimation(key[8 + i * keyCount], "", 0);
            //        LS_AddAnimation(key[14 + i * keyCount], "", 0);
            //        LS_AddAnimation(key[21 + i * keyCount], "", 1);
            //        LS_AddAnimation(key[26 + i * keyCount], "", 0);
            //        LS_AddAnimation(key[30 + i * keyCount], "", 0);
            //        LS_AddAnimation(key[36 + i * keyCount], "", 0);
            //    //}, 2000 * i);
            //    }, 10000 * i);
            //}
            //add(1, key[3], 200000, 63000, pos[3], pos[1], new VIZCore.Vector3(180, 0, 0), key[1]);
            //add(200001, 30000, new VIZCore.Vector3(5568841, 2801092, 50573), new VIZCore.Vector3(-100000, 0, 0), 0);
            //add(200002, 30000, new VIZCore.Vector3(3138949, 2801092, 50573), new VIZCore.Vector3(-100000, 0, 0), 0);
            LS_StartAnimation();
        };

        this.SmartCity_Init = function(){
            let add = function (image, keyRoot, key, ids, duration, start, end, rotate, next) {
                //let location = new VIZCore.Vector3(5568841, 2840092, 50573);
                let item = scope.LS_AnimationItem();
                item.keyRoot = "key" + keyRoot;
                item.key = "key" + key;
                item.object = ids;
                item.duration = duration;
                item.start.tx = start.x;
                item.start.ty = start.y;
                item.start.tz = start.z;
                item.end.tx = end.x;
                item.end.ty = end.y;
                item.end.tz = end.z;
                let arrNext = [];
                for (let i = 0; i < next.length; i++) {
                    arrNext.push("key" + next[i]);
                }
                item.next = arrNext;
                item.start.cx = 0;
                item.start.cy = 0;
                item.start.cz = 0;
                item.end.cx = 0;
                item.end.cy = 0;
                item.end.cz = 0;
                item.start.ax = rotate.x;
                item.start.ay = rotate.y;
                item.start.az = rotate.z;
                item.end.ax = rotate.x;
                item.end.ay = rotate.y;
                item.end.az = rotate.z;

                LS_mapAnimation_Key.set(item.key, item);
                LS_mapAnimation_ID.set(item.key, item);
            };
            let pos = [];
            let offsetZ = 50;

            // 직선 0
            pos.push(new VIZCore.Vector3(-380869.37, -509288.85, -850.75 + offsetZ));
            // pos.push(new VIZCore.Vector3(-391389.33, -502852.48, -850.75 + offsetZ));
            // pos.push(new VIZCore.Vector3(-412115.02, -488883.75, -850.75 + offsetZ));
            pos.push(new VIZCore.Vector3(-427772.99, -478748.31, -850.75 + offsetZ));
            pos.push(new VIZCore.Vector3(-458992.01, -457875.16, -850.75 + offsetZ));
            pos.push(new VIZCore.Vector3(-458992.01, -457875.16, -850.75 + offsetZ));

            let ratio = 1;

            let addKeyItem = function (ids, time, type) {
                //let key = newKey();
                time *= ratio;

                let currentKey = keyIndex;
                if (type === 0) {
                    // 직진
                    let index = 0;
                    add(1, keyIndex, keyIndex + 0, ids, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -122), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, ids, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -122), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, ids, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -122), []);
                    keyIndex += 3;
                }
                else if (type === 1) {
                    // 버스 회전
                    add(1, keyIndex, keyIndex + 0, id, time, pos[4], pos[5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[5], pos[6], new VIZCore.Vector3(0, 0, -180), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[6], pos[7], new VIZCore.Vector3(0, 0, -225), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[7], pos[8], new VIZCore.Vector3(0, 0, 80), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[8], pos[4], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 2) {
                    // 자동차1
                    add(1, keyIndex, keyIndex + 0, id, time, pos[9], pos[10], new VIZCore.Vector3(0, 0, -165), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[10], pos[11], new VIZCore.Vector3(0, 0, -165), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[11], pos[12], new VIZCore.Vector3(0, 0, 90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[12], pos[13], new VIZCore.Vector3(0, 0, 150), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[13], pos[14], new VIZCore.Vector3(0, 0, 150), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[14], pos[15], new VIZCore.Vector3(0, 0, 150), []);
                    keyIndex += 6;
                }
                else if (type === 3) {
                    // 자동차 2
                    add(1, keyIndex, keyIndex + 0, id, time, pos[16], pos[17], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[17], pos[18], new VIZCore.Vector3(0, 0, 65), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[18], pos[19], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[19], pos[20], new VIZCore.Vector3(0, 0, -115), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[20], pos[21], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 4) {
                    //  자동차2 역
                    add(1, keyIndex, keyIndex + 0, id, time, pos[21], pos[20], new VIZCore.Vector3(0, 0, 165), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[20], pos[19], new VIZCore.Vector3(0, 0, 70), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[19], pos[18], new VIZCore.Vector3(0, 0, 165), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[18], pos[17], new VIZCore.Vector3(0, 0, -115), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[17], pos[16], new VIZCore.Vector3(0, 0, 165), []);
                    keyIndex += 5;
                }
                else if (type === 5) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[22], pos[23], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[23], pos[24], new VIZCore.Vector3(0, 0, 70), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[24], pos[25], new VIZCore.Vector3(0, 0, 165), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[25], pos[22], new VIZCore.Vector3(0, 0, -115), []);
                    keyIndex += 4;
                }
                else if (type === 6) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[26], pos[27], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[27], pos[28], new VIZCore.Vector3(0, 0, -115), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[28], pos[29], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[29], pos[30], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[30], pos[31], new VIZCore.Vector3(0, 0, -115), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[31], pos[32], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 6;
                }
                else if (type === 7) {
                    add(1, keyIndex, keyIndex + 0, id, time, pos[33], pos[34], new VIZCore.Vector3(0, 0, -115), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[34], pos[35], new VIZCore.Vector3(0, 0, 165), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[35], pos[36], new VIZCore.Vector3(0, 0, -115), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[36], pos[37], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 4;
                }
                else if (type === 8) {
                    let index = 38;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -25), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -25), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -25), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -25), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 70), []);
                    keyIndex += 6;
                }
                else if (type === 9) {
                    let index = 44;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, -115), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, -205), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, -205), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -205), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, -205), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, -220), []);
                    keyIndex += 6;
                }
                else if (type === 10) {
                    let index = 45;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -80), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -80), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -80), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 0), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 6;
                }
                else if (type === 11) {
                    let index = 52;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -80), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -180), []);
                    keyIndex += 4;
                }
                else if (type === 12) {
                    let index = 56;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 100), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 4;
                }
                else if (type === 13) {
                    let index = 57;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -150), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -130), []);
                    keyIndex += 5;
                }
                else if (type === 14) {
                    let index = 62;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 70), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 50), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 40), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -40), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, -25), []);
                    keyIndex += 5;
                }
                else if (type === 15) {
                    let index = 63;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -120), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -150), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -160), []);
                    keyIndex += 5;
                }
                else if (type === 16) {
                    let index = 68;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 20), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 40), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 60), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 70), []);
                    keyIndex += 5;
                }
                else if (type === 17) {
                    let index = 69;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -20), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -20), []);
                    keyIndex += 4;
                }
                else if (type === 18) {
                    let index = 73;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 160), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 180), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 180), []);
                    keyIndex += 4;
                }

                //74
                else if (type === 19) {
                    let index = 74;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -20), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -20), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 70), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 110), []);
                    keyIndex += 4;
                }
                else if (type === 20) {
                    let index = 78;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, -70), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, -200), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, -200), []);
                    keyIndex += 4;
                }
                else if (type === 21) {
                    let index = 79;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -100), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 8;
                }
                else if (type === 22) {
                    let index = 79;
                    //add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 0), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -130), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 7;
                }
                else if (type === 23) {
                    let index = 79;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -130), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -130), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -110), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -100), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    keyIndex += 6;
                }

                else if (type === 24) {
                    let index = 85;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 60), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 50), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 80), []);
                    //add(1, keyIndex, keyIndex + 4, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 80), [keyIndex + 5]);
                    //add(1, keyIndex, keyIndex + 5, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 80), []);
                    keyIndex += 4;
                }
                else if (type === 25) {
                    let index = 85;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 60), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 50), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 50), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 50), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 50), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 50), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 80), []);
                    keyIndex += 8;
                }
                else if (type === 26) {
                    let index = 88;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 140), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 160), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 160), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -90), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, 20), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -10), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 27) {
                    let index = 88;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 160), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 160), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -90), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, 20), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -10), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 0], pos[index + 1], new VIZCore.Vector3(0, 0, -90), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 140), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 28) {
                    let index = 97;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -45), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -30), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 10), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -25), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -50), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, -70), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index + 6], pos[index + 7], new VIZCore.Vector3(0, 0, -80), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index + 7], pos[index + 8], new VIZCore.Vector3(0, 0, -100), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 29) {
                    let index = 105;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index - 1], new VIZCore.Vector3(0, 0, 80), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index - 1], pos[index - 2], new VIZCore.Vector3(0, 0, 100), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index - 2], pos[index - 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index - 3], pos[index - 4], new VIZCore.Vector3(0, 0, 130), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index - 4], pos[index - 5], new VIZCore.Vector3(0, 0, 155), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index - 5], pos[index - 6], new VIZCore.Vector3(0, 0, 190), [keyIndex + 6]);
                    add(1, keyIndex, keyIndex + 6, id, time, pos[index - 6], pos[index - 7], new VIZCore.Vector3(0, 0, 150), [keyIndex + 7]);
                    add(1, keyIndex, keyIndex + 7, id, time, pos[index - 7], pos[index - 8], new VIZCore.Vector3(0, 0, 135), []);
                    //add(1, keyIndex, keyIndex + 8, id, time, pos[index + 8], pos[index + 9], new VIZCore.Vector3(0, 0, -10), []);
                    keyIndex += 8;
                }
                else if (type === 30) {
                    let index = 106;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 60), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -30), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, -40), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, -115), []);
                    keyIndex += 5;
                }
                else if (type === 31) {
                    let index = 112;
                    add(1, keyIndex, keyIndex + 0, id, time, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, 90), [keyIndex + 1]);
                    add(1, keyIndex, keyIndex + 1, id, time, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, 0), [keyIndex + 2]);
                    add(1, keyIndex, keyIndex + 2, id, time, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, 110), [keyIndex + 3]);
                    add(1, keyIndex, keyIndex + 3, id, time, pos[index + 3], pos[index + 4], new VIZCore.Vector3(0, 0, 10), [keyIndex + 4]);
                    add(1, keyIndex, keyIndex + 4, id, time, pos[index + 4], pos[index + 5], new VIZCore.Vector3(0, 0, 70), [keyIndex + 5]);
                    add(1, keyIndex, keyIndex + 5, id, time, pos[index + 5], pos[index + 6], new VIZCore.Vector3(0, 0, 115), []);
                    keyIndex += 6;
                }

                return "key" + currentKey;
            };

            let rand = function (min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
            };

            let min = 1500;
            let max = 9000;
            // 노선 추가
            let ids = view.Custom.GetCustomAniIDs("busbluecopy9");
            let index = 0;
            //let keyIndex = 0;
            add(1, keyIndex, keyIndex + 0, ids, 1000 * ratio, pos[index], pos[index + 1], new VIZCore.Vector3(0, 0, -122), [keyIndex + 1]);
            add(1, keyIndex, keyIndex + 1, ids, 1000 * ratio, pos[index + 1], pos[index + 2], new VIZCore.Vector3(0, 0, -122), [keyIndex + 2]);
            add(1, keyIndex, keyIndex + 2, ids, 1000 * ratio, pos[index + 2], pos[index + 3], new VIZCore.Vector3(0, 0, -122), []);
            LS_AddAnimation("key" + keyIndex, "", 0);
            keyIndex += 3;


            // let modelCnt = 1; 
            // for (let i = 0; i < modelCnt; i++) {
            //     let image = 0;
            //     let min = 1500;
            //     let max = 9000;

            //     let bodyIds = view.Custom.GetCustomAniIDs("busbluecopy9");
            //     {
            //         let timer = function (ids, imageType) {
            //             let tmpID = ids;
            //             let tmpImageType = imageType;
            //             setTimeout(function () {
            //                 let keyItem = addKeyItem(tmpID, rand(min, max), 0);
            //                 LS_AddAnimation(keyItem, "", tmpImageType);
            //             }, rand(1000, 2000));
            //         };
            //         timer(bodyIds, image);
            //     }
            // }

            LS_StartAnimation();
        };
        //#region LS 산전 코드
        let LS_mapAnimation_Key = new Map();
        let LS_mapAnimation_ID = new Map();
        let LS_arrAnimation = [];

        function LS_AnimationItem() {
            let item = {
                info: undefined,

                object: undefined,
                action: view.Data.ActionItem(),

                next: [],

                enable: true,
                delete: false,
                endHide:  scope.PlayMode == VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_END? true : false,

                startTime: new Date()
            };

            return item;
        }

        function LS_ResetAnimationItem(key, value, review) {
            let item = LS_mapAnimation_Key.get(key + value);
            if (item === undefined)
                return undefined;

            let ids = item.object;
            let object = view.Data.GetBodies(ids);

            let ani = LS_AnimationItem();

            ani.info = item;
            ani.object = object;
            item.review = review;
            LS_AddNextAnimation(ani);

            ani.enable = true;

            LS_arrAnimation.push(ani);
            return item;
        }

        function LS_AddAnimation(key, value, image) {
            let item = LS_mapAnimation_Key.get(key + value);
            if (item === undefined)
                return undefined;

            let ids = item.object;

            if(scope.PlayMode === VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_ALL || scope.PlayMode === VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_TARGET){
                view.Interface.Object3D.ShowByNodeID(ids, false);
            }

            let object = view.Data.GetBodies(ids);
            let ani = LS_AnimationItem();

            ani.info = item;
            ani.object = object;
            if (image !== undefined)
                item.review = view.Drawing.AddCustom_Sign(item.start, { sign: { image: image } });

            LS_AddNextAnimation(ani);

            ani.enable = true;

            LS_arrAnimation.push(ani);
            return item;
        }

        function LS_AddNextAnimation(item) {

            for (let i = 0; i < item.info.next.length; i++) {
                if (item.info.next[i].localeCompare("") !== 0) {
                    let next = LS_mapAnimation_ID.get(item.info.next[i]);
                    if (next === undefined)
                        continue;

                    let ids = next.object;
                    if(scope.PlayMode === VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_ALL || scope.PlayMode === VIZCore.Enum.ANIMATION_PLAY_MODE.HIDE_TARGET){
                        view.Interface.Object3D.ShowByNodeID(ids, false);
                    }
                    let object = view.Data.GetBodies(ids);
                    let ani = LS_AnimationItem();
                    ani.info = next;
                    ani.object = object;
                    ani.enable = false;
                    ani.info.review = item.info.review;
                    LS_AddNextAnimation(ani);

                    item.next.push(ani);
                    LS_arrAnimation.push(ani);
                }
            }

        }

        function LS_AddToggleAnimation(item) {

            if (item.info.toggle.value >= 0) {

                let next = LS_mapAnimation_ID.get(item.info.toggle.next[item.info.toggle.value]);
                if (next === undefined)
                    return;

                let ids = next.object;
                let object = view.Data.GetBodies(ids);

                let ani = LS_AnimationItem();
                ani.info = next;
                ani.object = object;
                ani.enable = true;

                LS_AddNextAnimation(ani);

                LS_arrAnimation.push(ani);
            }

        }

        function LS_StartAnimation() {
            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }

            

            let startAnimationPlay = function () {

                let useDelete = false;

                for (let i = LS_arrAnimation.length - 1; i >= 0; i--) {

                    let ani = LS_arrAnimation[i];
                    if (!ani.enable)
                        continue;

                    if (ani.object === undefined)
                        continue;

                    let timeCurrent = new Date() - ani.startTime;
                    {
                        let timeRatio = timeCurrent / ani.info.duration;
                        let objectCenter;
                        if (view.DemoType === 3)
                            objectCenter = new VIZCore.Vector3();

                        else
                            //objectCenter = view.Data.GetBBoxFormOriginal(ani.object).center;
                            objectCenter = new VIZCore.Vector3();

                        //start
                        let startTrans = new VIZCore.Matrix4();
                        let startAniCenter;
                        {
                            let vMove, vRotate;

                            startAniCenter = new VIZCore.Vector3().copy(objectCenter);
                            startAniCenter.add(new VIZCore.Vector3(ani.info.start.cx, ani.info.start.cy, ani.info.start.cz));

                            vMove = new VIZCore.Vector3(ani.info.start.tx, ani.info.start.ty, ani.info.start.tz);
                            vRotate = new VIZCore.Vector3(ani.info.start.ax, ani.info.start.ay, ani.info.start.az);

                            startTrans = getTransform(startAniCenter, vMove, vRotate);
                            startAniCenter = startTrans.multiplyVector(startAniCenter);
                        }

                        //end
                        let endTrans = new VIZCore.Matrix4();
                        let endAniCenter;
                        {
                            let vMove, vRotate;

                            endAniCenter = new VIZCore.Vector3().copy(objectCenter);
                            endAniCenter.add(new VIZCore.Vector3(ani.info.end.cx, ani.info.end.cy, ani.info.end.cz));

                            vMove = new VIZCore.Vector3(ani.info.end.tx, ani.info.end.ty, ani.info.end.tz);
                            vRotate = new VIZCore.Vector3(ani.info.end.ax, ani.info.end.ay, ani.info.end.az);

                            endTrans = getTransform(endAniCenter, vMove, vRotate);
                            endAniCenter = endTrans.multiplyVector(endAniCenter);
                        }

                        if (timeRatio <= 1) {
                            // Visible
                            if(ani.info.start.visible)
                            {
                                 view.Interface.Object3D.ShowByNodeID(ani.info.object, true);
                            }
                            

                            let transform = quaternionInterpolation(startTrans, endTrans, timeRatio);

                            // 개체의 중심과 회전 중심이 맞지 않을때 중심점 보정
                            //if(false)
                            {
                                // 목표로 하는 센터 위치
                                let vCurrentCenter = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(startAniCenter).multiplyScalar(1.0 - timeRatio),
                                    new VIZCore.Vector3().copy(endAniCenter).multiplyScalar(timeRatio));

                                // 메트리스를 고려한 실제 이동 중심
                                let matPreInv = new VIZCore.Matrix4().getInverse(startTrans);
                                let vCenterSrc = matPreInv.multiplyVector(startAniCenter);
                                let vCurrentCenterSrcWithCurrentMat = new VIZCore.Matrix4().copy(transform).multiplyVector(vCenterSrc);

                                // 계산결과 중심과 이동해야할 중심 차이를 보정
                                let vFitOffset = new VIZCore.Vector3().subVectors(vCurrentCenter, vCurrentCenterSrcWithCurrentMat);

                                let matFit = new VIZCore.Matrix4();
                                matFit.makeTranslation(vFitOffset.x, vFitOffset.y, vFitOffset.z);
                                let retMatrix = new VIZCore.Matrix4().multiplyMatrices(matFit, transform);
                                transform.copy(retMatrix);
                            }

                            for (let j = 0; j < ani.object.length; j++) {
                                let body = ani.object[j];
                                if (body === undefined)
                                    console.log("");

                                let trans = transform.getTranslate();
                                //if (trans.y > 4750000)
                                //    console.log("");

                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                                action.transform.copy(transform);
                                body.object.flag.updateProcess = true;
                            }

                            if (view.DemoType === 3) {
                                if (ani.info.review !== undefined) {
                                    ani.info.review.drawitem.position[0] = transform.getTranslate();
                                }
                            }

                            //Review Action 
                            if (ani.info.reviewAction.item.length > 0) {
                                let reviewAction = view.Data.ReviewActionItem();

                                let currentDistance = new VIZCore.Vector3().subVectors(
                                    new VIZCore.Vector3(ani.info.reviewAction.end.ox, ani.info.reviewAction.end.oy, 0),
                                    new VIZCore.Vector3(ani.info.reviewAction.start.ox, ani.info.reviewAction.start.oy, 0)
                                );

                                let currentOffset = new VIZCore.Vector3().addVectors(
                                    new VIZCore.Vector3(ani.info.reviewAction.start.ox, ani.info.reviewAction.start.oy, 0),
                                    new VIZCore.Vector3().copy(currentDistance).multiplyScalar(timeRatio)
                                );

                                if (ani.info.reviewAction.actionType === 0 ||
                                    ani.info.reviewAction.actionType === 1) {

                                    reviewAction.text.transform.copy(transform);
                                    reviewAction.text.offset.copy(currentOffset);
                                }

                                if (ani.info.reviewAction.actionType === 0 ||
                                    ani.info.reviewAction.actionType === 2) {

                                    reviewAction.drawitem.transform.copy(transform);
                                    reviewAction.drawitem.offset.copy(currentOffset);
                                }

                                for (let j = 0; j < ani.info.reviewAction.item.length; j++) {
                                    let reviewItem = view.Data.GetReview(ani.info.reviewAction.item[j]);

                                    reviewItem.action = reviewAction;
                                }
                            }

                        }
                        else {
                            //마지막 트랜스폼 적용
                            let transform = endTrans;
                            for (let j = 0; j < ani.object.length; j++) {
                                let body = ani.object[j];

                                let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                                action.transform.copy(transform);
                                body.object.flag.updateProcess = true;
                            }
                            //연계 애니메이션 확인
                            if (ani.next !== undefined) {

                                for (let j = 0; j < ani.next.length; j++) {
                                    ani.next[j].startTime = new Date();
                                    ani.next[j].enable = true;
                                }
                            }

                            // 토글 연계 애니메이션 설정
                            if (ani.info.toggle.set >= 0) {
                                for (let j = 0; j < ani.info.toggle.id.length; j++) {
                                    let toggle_info = LS_mapAnimation_ID.get(ani.info.toggle.id[j]);
                                    toggle_info.toggle.value = ani.info.toggle.set;
                                }
                            }

                            // 토글 연계 애니메이션 추가
                            if (ani.info.toggle.value >= 0) {
                                LS_AddToggleAnimation(ani);
                            }

                            if (ani.endHide) {
                                for (let j = 0; j < ani.object.length; j++) {
                                    let body = ani.object[j];
                                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                                    action.visible = false;
                                    body.object.flag.updateProcess = true;
                                }
                            }


                            ani.enable = false;
                            ani.delete = true;
                            useDelete = true;

                            if (ani.info.next.length === 0 && ani.info.keyRoot !== undefined) {
                                //for (let j = 0; j < ani.object.length; j++) {
                                //    let body = ani.object[j];
                                //    if (view.DemoType === 3)
                                //        body.action.transform = new VIZCore.Matrix4();
                                //    body.object.flag.updateProcess = true;
                                //}
                                if(view.DemoType === 7)
                                    LS_ResetAnimationItem(ani.info.keyRoot, "", ani.info.review);
                            }
                            //LS_AddAnimation(ani.info.key, "");
                            //Review Action 
                            if (ani.info.reviewAction.item.length > 0) {
                                let reviewAction = view.Data.ReviewActionItem();
                                let currentOffset = new VIZCore.Vector3(ani.info.reviewAction.end.ox, ani.info.reviewAction.end.oy, 0);

                                if (ani.info.reviewAction.actionType === 0 ||
                                    ani.info.reviewAction.actionType === 1) {

                                    reviewAction.text.transform.copy(transform);
                                    reviewAction.text.offset.copy(currentOffset);
                                }

                                if (ani.info.reviewAction.actionType === 0 ||
                                    ani.info.reviewAction.actionType === 2) {

                                    reviewAction.drawitem.transform.copy(transform);
                                    reviewAction.drawitem.offset.copy(currentOffset);
                                }

                                for (let j = 0; j < ani.info.reviewAction.item.length; j++) {
                                    let reviewItem = view.Data.GetReview(ani.info.reviewAction.item[j]);

                                    reviewItem.action = reviewAction;
                                }
                            }
                        }
                    }
                }

                // 재생이 끝난 아이템 삭제
                if (useDelete) {
                    for (let i = LS_arrAnimation.length - 1; i >= 0; i--) {
                        let ani = LS_arrAnimation[i];
                        if (ani.delete) {
                            LS_arrAnimation.splice(i, 1);
                        }
                    }
                }

                //view.MeshBlock.Reset();
                view.Renderer.MainFBClear(false);
                view.Renderer.Render();

            };


            AnimationPlay = setInterval(function () {
                startAnimationPlay();
            }, view.DemoType === 3 ? 200 : 30);
        }



        function LS_AddKey(itemKey, itemValue) {

            LS_AddAnimation(itemKey, itemValue);

        }

        //#endregion LS 산전 코드
        this.hhi_ReviewAnimation = function () {
            //3D 이동 방식
            let addReview3D = function (key, reviewIds, actionType, duration, start, end, rotate) {

                let item = scope.LS_AnimationItem();

                item.key = key;
                item.object = [];
                item.duration = duration;
                item.start.tx = start.x;
                item.start.ty = start.y;
                item.start.tz = start.z;
                item.end.tx = end.x;
                item.end.ty = end.y;
                item.end.tz = end.z;

                item.start.cx = 0;
                item.start.cy = 0;
                item.start.cz = 0;
                item.end.cx = 0;
                item.end.cy = 0;
                item.end.cz = 0;

                item.start.ax = rotate.x;
                item.start.ay = rotate.y;
                item.start.az = rotate.z;
                item.end.ax = rotate.x;
                item.end.ay = rotate.y;
                item.end.az = rotate.z;

                item.reviewAction.item = reviewIds;
                item.reviewAction.actionType = actionType;

                //등록
                LS_mapAnimation_Key.set(item.key, item);
                LS_mapAnimation_ID.set(item.key, item);

            };

            //2D 이동 방식
            let addReview2D = function (key, reviewIds, actionType, duration, start, end) {

                let item = scope.LS_AnimationItem();

                item.key = key;
                item.object = [];
                item.duration = duration;

                item.reviewAction.start.ox = start.x;
                item.reviewAction.start.oy = start.y;

                item.reviewAction.end.ox = end.x;
                item.reviewAction.end.oy = end.y;


                item.reviewAction.item = reviewIds;
                item.reviewAction.actionType = actionType;

                //등록
                LS_mapAnimation_Key.set(item.key, item);
                LS_mapAnimation_ID.set(item.key, item);
            };

            let reviewids = [];
            for (let i = 0; i < view.Data.Reviews.length; i++) {
                if (i === 1)
                    continue;

                reviewids.push(view.Data.Reviews[i].id);
            }

            //3D Test 방식
            //addReview3D("0", reviewids, 0, 5000,
            //    new VIZCore.Vector3(0, 0, 0), //시작 위치
            //    new VIZCore.Vector3(0, 0, 0), //종료 위치
            //    new VIZCore.Vector3(0, 0, 0) //회전 
            //);
            //애니메이션 템플릿
            //2D Test 방식
            // 화면 비율에 따른 비율로 처리 Offset 기준으로 추가 이동
            addReview2D("Animation0", reviewids, 0,
                1000,
                new VIZCore.Vector3(0.3, 0, 0),
                new VIZCore.Vector3(0, 0, 0)
            );

            //서로 다른 리뷰 이동
            if (view.Data.Reviews.length >= 2) {
                let reviewids2 = [view.Data.Reviews[1].id];

                addReview2D("Animation1", reviewids2, 0,
                    1000,
                    new VIZCore.Vector3(0, 0.2, 0),
                    new VIZCore.Vector3(0, 0, 0)
                );
            }

            //템플릿에 등록된
            // 애니메이션 등록
            LS_AddAnimation("Animation0", "");
            LS_AddAnimation("Animation1", "");


            //애니메이션 실행
            LS_StartAnimation();
        };

        //this.hhi_ReleaseReviewAnimationData = function () {
        //    for (let i = 0; i < view.Data.Reviews.length; i++) {
        //        view.Data.Reviews[i].action = undefined;
        //    }
        //};
        this.hhi_AddAnimationKey = function (key, animation) {
            LS_mapAnimation_Key.set(key, animation);
            LS_mapAnimation_ID.set(key, animation);
        };

        this.hhi_AddNoteAnimation = function (key) {
            LS_AddAnimation(key, "");
        };

        this.hhi_StartAnimation = function () {
            LS_StartAnimation();
        };


        function Daelim_AnimationItem() {
            let info = {
                duration : 0,
                color_start : new VIZCore.Color(255,0,0,255),
                color_end : new VIZCore.Color(0,255,0,255)
            };

            let item = {
                info: info,
                object: undefined,
                action: view.Data.ActionItem(),
                next: [],
                enable: true,
                endHide: false,
                status : 0, // 적용 상태 관리
                baseTime: new Date().getTime(),
                startTime: new Date().getTime()
            };

            return item;
        }

        let mapAnimation_Key = new Map();
        let mapAnimation_ID = new Map();
        let arrAnimation = [];
        let _timeAnimation = undefined;
        let _timeCurrent = undefined;

        this.Daelim_InitAnimation = function()
        {
            if(timePauseOffset === 0)
            {
            _timeAnimation = new Date();
            // 카메라 초기 설정
            view.Camera.ViewRightElevation();
            // Xray 활성화
            view.Mode.Xray(true);

            // 목록 삭제
            arrAnimation = [];

            scope.Daelim_AddAnimation(1,0,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(13,1,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(19,2,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(20,3,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(31,4,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(40,5,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(49,6,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(57,7,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(66,8,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(74,9,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(83,10,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(92,11,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(101,12,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(110,13,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(120,14,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(128,15,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(136,16,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(145,17,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(156,18,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(165,19,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(171,20,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(180,21,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(188,22,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(195,23,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(206,24,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(213,25,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(221,26,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(228,27,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(236,28,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(242,29,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(249,30,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(255,31,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(261,32,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(10,33,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(11,34,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(12,35,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(28,36,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(29,37,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(30,38,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(46,39,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(47,40,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(48,41,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(55,42,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(56,43,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(65,44,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(72,45,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(73,46,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(82,47,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(89,48,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(90,49,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(91,50,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(100,51,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(107,52,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(108,53,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(109,54,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(118,55,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(119,56,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(126,57,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(127,58,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(142,59,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(143,60,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(144,61,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(153,62,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(154,63,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(155,64,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(162,65,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(163,66,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(164,67,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(175,68,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(176,69,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(177,70,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(186,71,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(187,72,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(194,73,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(203,74,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(204,75,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(205,76,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(220,77,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(227,78,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(235,79,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            scope.Daelim_AddAnimation(248,80,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
            }
            else{
                _timeCurrent = timePauseOffset;
                
            }
        };

        this.Daelim_AddAnimation = function(id, time, color_start, color_end){
            time = time / 2;
            let bodyMap = view.Tree.GetBodyMapByNodeIDs([id]);
            let ani = Daelim_AnimationItem();
            ani.duration = 2 * 1000;
            ani.color_start = color_start;
            ani.color_end = color_end;
            //let objects = Array.from(bodyMap.keys());

            //let bodies = view.Data.GetBodies(Array.from(bodyMap.keys()));
            let bodies = view.Data.GetBodyByIDMap(bodyMap);
            ani.object = bodies;
            ani.enable = true;
            ani.startTime = time * 1000;
            //if(bodies.length > 0)
            {
                Time.Items.push(ani);
                arrAnimation.push(ani);
            }
            //return item;
        };

        function Daelim_Stop(){
            if(scope.PlayMode !== VIZCore.Enum.ANIMATION_PLAY_MODE.NONE)
                view.Tree.ShowAll(true);

            // Xray 활성화
            //view.Mode.Xray(false);
            if(Time.RollbackStatus)
            {
                for(let i = 0; i < Time.Items.length;i++){
                    let ani = Time.Items[i];
                    // 시작 변경
                    for (let j = 0; j < ani.object.length; j++) {
                        let body = ani.object[j];
                        if (body === undefined)
                            console.log("");

                        let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                            
                        action.color = undefined;
                        action.customColor = false;
                        action.visible = true;
                        body.object.flag.updateProcess = true;
                    }
                }

                Time.PauseOn = false;
                Time.Pause = 0;
                Time.Current = 0;
            }

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }

            if (AnimationEvent !== null) {
                clearInterval(AnimationEvent);
                AnimationEvent = null;
            }

            view.Renderer.MainFBClear(false);
                view.Renderer.Render();
        }

        function Daelim_StartAnimation(bPause) {
            // 모델 전체 숨기기
            view.Tree.ShowAll(false);

            Time.PlayStart = new Date().getTime();
            Time.PlayEnd = Time.PlayStart + Time.PlayTime;
            if(bPause === undefined)
                Time.PauseOn = false;
                
            arrAnimation = [];
            for(let l = 0; l < Time.Items.length;l++)
            {
                Time.Items[l].baseTime = Time.PlayStart;
                Time.Items[l].status = 0;
                Time.Items[l].delete = false;
                arrAnimation.push(Time.Items[l]);

                let ani = Time.Items[l];
                // status 가 시작 이후인 아이템이 있으면 모델 보이기 적용
                // if(ani.status !== 0)
                // {
                //     let objects = view.Data.GetBodyByIDMap(ani.objectMap);
                //     for (let j = 0; j < objects.length; j++) {
                //         let body = objects[j];
                //         if (body === undefined)
                //             console.log("");
                //         body.action.visible = true;
                //         body.object.flag.updateProcess = true;
                //     }
                // }
            }

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }

            if (AnimationEvent !== null) {
                clearInterval(AnimationEvent);
                AnimationEvent = null;
            }

            let animationTick = 0;
            let animationStart = new Date();

            // let startAnimationPlay = function () {
            //     view.Renderer.Lock();
            //     let useDelete = false;
            //     //for (let i = arrAnimation.length - 1; i >= 0; i--) {
            //     for (let i = 0 ; i < arrAnimation.length; i++) {

            //         let ani = arrAnimation[i];
            //         if (!ani.enable)
            //             continue;

            //         _timeCurrent = new Date();

            //         Time.Current = (_timeCurrent.getTime() - Time.PlayStart) * Time.DateOffset;
            //         //console.log(Time.Current);
            //         // 일시정지 상태라면 리턴
            //         if(Time.PauseOn === true)
            //         {
            //             Time.Current = Time.Pause;
            //         }
            //         else{
            //             Time.Current += Time.Pause;
            //         }

            //         //let timeCurrent = new Date().getTime() - ani.baseTime;
            //         {
            //             //let timeRatio = timeCurrent - ani.startTime;
            //             // 애니메이션 시작 시점 확인
            //             let timeRatio = Time.Current - ani.startTime;
            //             //if(timeEnd < timeRatio)
            //             if(Time.Current > Time.PlayTime)
            //             {
            //                 Time.Current = Time.PlayTime + 1;
            //                 //return;
            //                 let obj = getEventData();
            //                 dispatchEvent();

            //                 scope.StopAnimation();
            //             }

            //             let objectCenter;
            //             //let objects = ani.object;
            //             let objects = view.Data.GetBodyByIDMap(ani.objectMap);

            //             // 시작 해야 하는 아이템 확인
            //             if (timeRatio > 0 && timeRatio <= ani.duration) {
            //                 // 색상 적용
            //                 if(ani.status === 0)
            //                 {
            //                     // 시작 변경
            //                     for (let j = 0; j < objects.length; j++) {
            //                         let body = objects[j];
            //                         if (body === undefined)
            //                             console.log("");
                                        
            //                         body.action.color = new VIZCore.Color().copy(ani.color_start);
            //                         //console.log("1 ::", ani.color_start, i);
            //                         body.action.customColor = true;
            //                         //body.action.visible = true;
            //                         body.object.flag.updateProcess = true;
            //                     }
            //                     view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true);
            //                     view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
            //                     ani.status = 1;
            //                 }
            //             }
            //             else if(timeRatio > ani.duration){
            //                 //ani.enable = false;
            //                 if(ani.status === 0)
            //                 {
            //                     // 시작 변경
            //                     for (let j = 0; j < objects.length; j++) {
            //                         let body = objects[j];
            //                         if (body === undefined)
            //                             console.log("");
                                        
            //                         body.action.color = new VIZCore.Color().copy(ani.color_start);
            //                         //console.log("2 ::" ,ani.color_start, i);
            //                         body.action.customColor = true;
            //                         //body.action.visible = true;
            //                         body.object.flag.updateProcess = true;
            //                     }
            //                     view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true);
            //                     view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
                                
            //                     ani.status = 1;
            //                 }
            //                 else if(ani.status === 1) //종료 상태 확인
            //                 {
            //                     // 시작 변경
            //                     for (let j = 0; j < objects.length; j++) {
            //                         let body = objects[j];
            //                         if (body === undefined)
            //                             console.log("");

            //                         body.action.color = new VIZCore.Color().copy(ani.color_end);
            //                         //console.log("3 ::" ,ani.color_end, i);
            //                         body.action.customColor = true;
            //                         body.object.flag.updateProcess = true;
            //                     }
            //                     ani.status = 2;
            //                 }
            //                 else if(timeRatio > ani.duration * 2)
            //                 {
            //                     if(ani.status === 2) //완전 종료 
            //                     {
            //                         if(Time.RollbackStatus)
            //                         {
            //                             for (let j = 0; j < objects.length; j++) {
            //                                 let body = objects[j];
            //                                 if (body === undefined)
            //                                     console.log("");

            //                                 body.action.color = undefined;
            //                                 body.action.customColor = false;
            //                                 body.object.flag.updateProcess = true;
            //                             }
            //                         }
            //                         ani.status = 3;
            //                         ani.delete = true;
            //                         useDelete = true;
            //                         //console.log("4 ::" ,ani.color_end, i);
            //                     }
            //                 }
            //             }
            //             // else if (timeRatio < 0) {
            //             //     // 색상 적용
            //             //     if(ani.status === 0)
            //             //     {
            //             //         // 시작 변경
            //             //         for (let j = 0; j < objects.length; j++) {
            //             //             let body = objects[j];
            //             //             if (body === undefined)
            //             //                 console.log("");
                                        
            //             //             body.action.color = new VIZCore.Color().copy(ani.color_start);
            //             //             //console.log("1 ::", ani.color_start, i);
            //             //             body.action.customColor = true;
            //             //             //body.action.visible = true;
            //             //             body.object.flag.updateProcess = true;
            //             //         }
            //             //         view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true);
            //             //         view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
            //             //         ani.status = 2;
            //             //     }
            //             // }

            //         }

            //         if (view.DemoType === 1 && bPause === false) {
            //             let update = _timeCurrent % 2000;
            //             if (update > 1000)
            //                 view.Player.UpdateTime(timeCurrent);
            //          }

            //         // 현재 재생 tick
            //         let tick = (_timeCurrent.getTime() - animationStart.getTime());
            //         animationTick += tick;
            //         animationStart = new Date();
            //         if(Time.PauseOn === false)
            //         {
            //             // 재생중일때는 날짜 변경에 따른 이벤트 발생
            //             if(animationTick >= Time.Interval)
            //             {
            //                 animationTick = animationTick - Time.Interval;
            //                 //Time.Current = Math.floor(Time.Current / Time.Interval) * 1000;
            //                 //console.log("TimeEvent ::", animationTick);
            //                 dispatchEvent();
            //             }
            //         }
            //     }

            //     // 재생이 끝난 아이템 삭제
            //     if (useDelete) {
            //         for (let i = arrAnimation.length - 1; i >= 0; i--) {
            //             let ani = arrAnimation[i];
            //             if (ani.delete) {
            //                 arrAnimation.splice(i, 1);
            //             }
            //         }
            //     }

            //     //view.MeshBlock.Reset();
            //     view.Renderer.Unlock();
            //     view.Renderer.MainFBClear(false);
            //     view.Renderer.Render();

                
            // };

            let startAnimationPlay = function (time) {
                view.Renderer.Lock();
                let useDelete = false;
                //for (let i = arrAnimation.length - 1; i >= 0; i--) {
                for (let i = 0 ; i < arrAnimation.length; i++) {

                    let ani = arrAnimation[i];
                    if (!ani.enable)
                        continue;

                    _timeCurrent = new Date();

                    //Time.Current = (_timeCurrent.getTime() - Time.PlayStart) * Time.DateOffset;
                    //Time.Current = time * Time.DateOffset;
                    Time.Current = time;
                    //console.log(Time.Current);
                    // 일시정지 상태라면 리턴
                    if(Time.PauseOn === true)
                    {
                        Time.Current = Time.Pause;
                    }

                    //let timeCurrent = new Date().getTime() - ani.baseTime;
                    {
                        //let timeRatio = timeCurrent - ani.startTime;
                        // 애니메이션 시작 시점 확인
                        let timeRatio = Time.Current - ani.startTime;
                        //if(timeEnd < timeRatio)
                        if(Time.Current > Time.PlayTime)
                        {
                            //Time.Current = Time.PlayTime + 1;
                            Time.Current = Time.PlayTime;
                            //return;
                            let obj = getEventData();
                            dispatchEvent();

                            scope.StopAnimation();
                        }

                        let objectCenter;
                        //let objects = ani.object;
                        let objects = view.Data.GetBodyByIDMap(ani.objectMap);

                        // 시작 해야 하는 아이템 확인
                        if (timeRatio > 0 && timeRatio <= ani.duration) {
                            // 색상 적용
                            if(ani.status === 0)
                            {
                                // 시작 변경
                                for (let j = 0; j < objects.length; j++) {
                                    let body = objects[j];
                                    if (body === undefined)
                                        console.log("");

                                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                    action.color = new VIZCore.Color().copy(ani.color_start);
                                    //console.log("1 ::", ani.color_start, i);
                                    action.customColor = true;
                                    //body.action.visible = true;
                                    body.object.flag.updateProcess = true;
                                }
                                view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true, false);
                                view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
                                ani.status = 1;
                            }
                        }
                        else if(timeRatio > ani.duration){
                            //ani.enable = false;
                            if(ani.status === 0)
                            {
                                // 시작 변경
                                for (let j = 0; j < objects.length; j++) {
                                    let body = objects[j];
                                    if (body === undefined)
                                        console.log("");

                                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                                        
                                    action.color = new VIZCore.Color().copy(ani.color_start);
                                    //console.log("2 ::" ,ani.color_start, i);
                                    action.customColor = true;
                                    //body.action.visible = true;
                                    body.object.flag.updateProcess = true;
                                }
                                view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true, false);
                                view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
                                
                                ani.status = 1;
                            }
                            else if(ani.status === 1) //종료 상태 확인
                            {
                                // 시작 변경
                                for (let j = 0; j < objects.length; j++) {
                                    let body = objects[j];
                                    if (body === undefined)
                                        console.log("");

                                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                    action.color = new VIZCore.Color().copy(ani.color_end);
                                    //console.log("3 ::" ,ani.color_end, i);
                                    action.customColor = true;
                                    body.object.flag.updateProcess = true;
                                }
                                ani.status = 2;
                            }
                            else if(timeRatio > ani.duration * 2)
                            {
                                if(ani.status === 2) //완전 종료 
                                {
                                    if(Time.RollbackStatus)
                                    {
                                        for (let j = 0; j < objects.length; j++) {
                                            let body = objects[j];
                                            if (body === undefined)
                                                console.log("");
                                            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                                            action.color = undefined;
                                            action.customColor = false;
                                            body.object.flag.updateProcess = true;
                                        }
                                    }
                                    ani.status = 3;
                                    ani.delete = true;
                                    useDelete = true;
                                    //console.log("4 ::" ,ani.color_end, i);
                                }
                            }
                        }
                        // else if (timeRatio < 0) {
                        //     // 색상 적용
                        //     if(ani.status === 0)
                        //     {
                        //         // 시작 변경
                        //         for (let j = 0; j < objects.length; j++) {
                        //             let body = objects[j];
                        //             if (body === undefined)
                        //                 console.log("");
                                        
                        //             body.action.color = new VIZCore.Color().copy(ani.color_start);
                        //             //console.log("1 ::", ani.color_start, i);
                        //             body.action.customColor = true;
                        //             //body.action.visible = true;
                        //             body.object.flag.updateProcess = true;
                        //         }
                        //         view.Tree.ShowMulti(Array.from(ani.objectMap.keys()), true);
                        //         view.Tree.SetObjectCustomColor(Array.from(ani.objectMap.keys()), ani.color_start);
                        //         ani.status = 2;
                        //     }
                        // }

                    }

                    if (view.DemoType === 1 && bPause === false) {
                        let update = _timeCurrent % 2000;
                        if (update > 1000)
                            view.Player.UpdateTime(timeCurrent);
                     }

                    // // 현재 재생 tick
                    // let tick = (_timeCurrent.getTime() - animationStart.getTime());
                    
                    // animationStart = new Date();
                    // if(Time.PauseOn === false)
                    // {
                    //     // 재생중일때는 날짜 변경에 따른 이벤트 발생
                    //     if(animationTick >= Time.Interval)
                    //     {
                    //         animationTick = animationTick - Time.Interval;
                    //         //Time.Current = Math.floor(Time.Current / Time.Interval) * 1000;
                    //         //console.log("TimeEvent ::", animationTick);
                    //         dispatchEvent();
                    //     }
                    // }
                    
                        
                }

                // 재생이 끝난 아이템 삭제
                if (useDelete) {
                    for (let i = arrAnimation.length - 1; i >= 0; i--) {
                        let ani = arrAnimation[i];
                        if (ani.delete) {
                            arrAnimation.splice(i, 1);
                        }
                    }
                }

                //view.MeshBlock.Reset();
                view.Renderer.Unlock();
                view.Renderer.MainFBClear(false);
                view.Renderer.Render();

                
            };

            // 애니메이션 디지털화
            // 이벤트 시간에 맞춰 재생
            //let interval = 1000 / Time.DateOffset;
            let interval = 1000;
            if(playSmooth)
            {
                interval = interval / Time.DateOffset;
            }

            let callCnt = 1;
            let callEnd = ((Time.PlayTime - Time.Pause) / interval) + 1;
            if(Time.Pause > 0)
            {
                callCnt = Math.ceil(Time.Pause / interval / Time.DateOffset); // 올림
            }
                
            let eventTick = 0;

            if(Time.PauseOn)
            {
                startAnimationPlay(Time.Pause);
            }
            else{
                Time.Pause = 0;

                AnimationPlay = setInterval(function () {
                    let tick = interval * callCnt;
                    tick *= Time.DateOffset;
                    if(callCnt <= callEnd)
                    {
                        if(Time.PauseOn)
                            tick = Time.Pause;
                        // else
                        //     tick += Time.Pause;
                        startAnimationPlay(tick);
                        eventTick += interval;
                    }
                    callCnt++;

                    if(Time.PauseOn === false)
                    {
                        if(eventTick >= Time.Interval)
                        {
                            dispatchEvent();
                            eventTick = 0;
                        }
                    }
                }, interval);
            }

            // AnimationEvent = setInterval(function () {
            //     if(Time.PauseOn === false)
            //     {
            //         dispatchEvent();
            //     }
            //     // let obj = getEventData();
            //     // view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Animation.Frame, obj);
            // }, 500);//Time.Interval);
        }

        function Daelim_Pause(){
            Time.Pause = Time.Current;
            Time.PauseOn = true;
        };

        this.Daelim_Play = function () {

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }
            else {
                //timePauseOffset = 0;
            }
            bPause = false;
            timeStart = new Date().getTime();

            AnimationPlay = setInterval(function () {
                timePlay = new Date().getTime();
                timeCurrent = timePauseOffset + (timePlay - timeStart); // 밀리초

                scope.Hyundai_Animation(timeCurrent);
            }, 50);
        };

        this.Daelim_StartAnimation = function()
        {
            Daelim_StartAnimation();
        };

        this.Daelim_GetTimeString = function(){
            let result = "";
            // if(_timeCurrent !== undefined)
            // {
            //     // 시작시간 대비 누적 시간 계산
            //     let time = _timeCurrent.getTime() - _timeAnimation.getTime();
            //     let timeSecond = Math.floor(time / 1000);
            //     // 초당 일주일 계산
            //     let timeResult = timeSecond * (60*60*24 * 7);
            //     let date = new Date(2021, 0, 1);
                
            //     let dateResult = new Date(date.getTime() + timeResult * 1000);

            //     //result = "Date: "+ dateResult.getFullYear() +"년 "+(dateResult.getMonth()+1) + "월 "+dateResult.getDate()+"일";
            //     result = "Date : " + dateResult.toISOString().split("T")[0];
            // }
            function pad(number) {
                if (number < 10) {
                  return '0' + number;
                }
                return number;
            }
            if(Time.PlayStart !== undefined && Time.Date !== undefined)
            {
                // 시작시간 대비 누적 시간 계산
                let time = Time.Current;
                let timeSecond = Math.floor(time / 1000);
                // 초당 일자 계산
                let timeResult = timeSecond * (60*60*24 * 1);
                //let date = new Date(2021, 0, 1);
                let date = Time.Date;
                let dateResult = new Date(date.getTime() + timeResult * 1000);

                //result = "Date: "+ dateResult.getFullYear() +"년 "+(dateResult.getMonth()+1) + "월 "+dateResult.getDate()+"일";
                //result = "Date : " + dateResult.toISOString().split("T")[0];
                //result = "" + dateResult.toISOString().split("T")[0];
                result = pad(dateResult.getFullYear()) +"-"+pad(dateResult.getMonth()+1) + "-"+pad(dateResult.getDate());
            }
            return result;
        };

       

        // Animation API for DLENC
        this.InitAnimation = function(){
            if(timePauseOffset === 0)
            {
            _timeAnimation = new Date();
            // 목록 삭제
            arrAnimation = [];
            }
            else{
                _timeCurrent = timePauseOffset;
            }
        };

        this.AddAnimationItem = function(ids, time, duration, color_start, color_end){
            //time = time / 2;
            let bodyMap = undefined;
            if(Array.isArray(ids))
                bodyMap = view.Tree.GetBodyMapByNodeIDs(ids);
            else
                bodyMap = view.Tree.GetBodyMapByNodeIDs([ids]);

            let ani = Daelim_AnimationItem();
            ani.duration = duration * 1000;
            ani.color_start = color_start;
            ani.color_end = color_end;
            let bodies = view.Data.GetBodyByIDMap(bodyMap);
            ani.object = bodies;
            ani.objectMap = bodyMap;
            ani.enable = true;
            ani.startTime = time * 1000;
            //if(bodies.length > 0)
            {
                Time.Items.push(ani);
                arrAnimation.push(ani);
            }

            let endTime = ani.startTime + ani.duration;
            if(Time.PlayTime === undefined)
            {
                Time.PlayTime = endTime;
                // 이벤트 발생
                view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Animation.PlayTime, Time.PlayTime);
            }
            else if(Time.PlayTime < endTime)
            {
                Time.PlayTime = endTime;
                // 이벤트 발생
                view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Animation.PlayTime, Time.PlayTime);
            }

            
            dispatchEvent();
            return ani;
        };

        this.StartAnimation = function(bPause)
        {
            isAnimationPlay = true;
            Daelim_StartAnimation(bPause);
            if(Time.PauseOn)
                isAnimationPlay = false;
        };

        this.StopAnimation = function(){
            isAnimationPlay = false;
            Daelim_Stop();
        };

        this.PauseAnimation = function(){
            isAnimationPlay = false;
            Daelim_Pause();
        };

        this.IsAnimationPlay = function(){
            return isAnimationPlay;
        };

        this.SetStartDate = function(date, offset){
            Time.Date = date;
            if(offset !== undefined)
                Time.DateOffset = offset;
            
            dispatchEvent();
        };

        this.SetDuration = function(offset){
            Time.DateOffset = offset;
            dispatchEvent();
        };

        this.SetEventInterval = function(val){
            Time.Interval = val;
        };

        this.SetRestoreStatus = function(bRestore){
            Time.RollbackStatus = bRestore;
        };

        function dispatchEvent(){
            if(enableEvent)
            {
                let obj = getEventData();
                view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Animation.Frame, obj);
            }
        }

        this.EnableEvent = function(enable)
        {
            enableEvent = enable;
            if(enableEvent)
            {
                dispatchEvent();
            }
        }

        // SmartCity
        this.GetAnimationItem = function(){
            return scope.LS_AnimationItem();
        };

        this.SetAnimationItem = function(item){
            LS_mapAnimation_Key.set(item.key, item);
            LS_mapAnimation_ID.set(item.key, item);
        };

        this.StartAnimationSmartCity = function(){
            LS_StartAnimation();
        };

        this.AddAnimationItemSmartCity = function(key, value, image){
            LS_AddAnimation(key, value, image);
        };

        this.StartAnimation_Transform = function(){
            LS_StartAnimation();
        };

        this.AddAnimationItem_Transform = function(key, value, image){
            LS_AddAnimation(key, value, image);
        };

        // 재생 모드 설정
        // NONE, HIDE_ALL, HIDE_TARGET, HIDE_END
        this.SetPlayMode = function(mode){
            scope.PlayMode = mode;
        };

        
        // 애니메이션 데이터 초기화
        this.Clear = function(){
            mapAnimationGroup = new Map();
            _AnimationList = [];
            LS_arrAnimation = [];

            if (AnimationPlay !== null) {
                clearInterval(AnimationPlay);
                AnimationPlay = null;
            }

            Time = {
                PlayStart : 0,
                PlayEnd : 0,
                PlayTime : 0,
                Current : 0,
                Pause : 0,
                PauseOn : false,
                CurrentOffset : 0,
                Items : [],
                Date : undefined,
                DateOffset : 1,// Day
                Interval : 1000,
                RollbackStatus : false,
            }

            currentID = 0;
            timeCurrent = undefined;
            timeStart = undefined;
            timeLooplessStart = undefined;
            timePlay = undefined;
            timePauseOffset = 0;
            timeEnd = undefined;
            playSmartCity = false;
            // 애니메이션 재생
            AnimationPlay = null;
            isAnimationPlay = false;

            animationBodyID = 199999;
            keyIndex = 0;
            mapAnimationBodyID = new Map();

            //#region LS 산전 코드
            LS_mapAnimation_Key = new Map();
            LS_mapAnimation_ID = new Map();
            LS_arrAnimation = [];

            mapAnimation_Key = new Map();
            mapAnimation_ID = new Map();
            arrAnimation = [];
            _timeAnimation = new Date();
            _timeCurrent = undefined;
        };
    }
}

export default Animation;