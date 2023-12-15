/**
 * @author ssjo@softhills.net
 */

 let UIMarkup_Util_Transform = function (uiBase, view, VIZCore) {
    let scope = this;

    this.base = VIZCore.UIMarkup_Base;
    this.base(uiBase, view);

    // 선택개체 이동 포함 여부 설정
    let IsModelTransform = true;  //모델 개체 이동 가능 설정
    let IsCustomModelTransform = true; //Custom 개체 이동 가능 설정

    let currentUpdateObjects = []; //이동 갱신 개체
    let currentUpdateObjectsID = []; //이동 갱신 개체 ID
    let currentUpdateBBox = undefined;

    let lastPickData = undefined; // 마지막 선택 위치
    


    this.Start = function () {
        let textMeasure = "Select Object Transform.";
        view.UIManager.ShowMessage(textMeasure);

        scope.base.prototype.Start.call(scope);

        releaseObejctsItem();
        updateObjectItem(true);

        if(isCurrentTrnasObjects()) {
            uiBase.NextStep();
        }
    };

    this.Release = function () {

        releaseObejctsItem();

        scope.MarkupSubType = 0;
        lastPickData = undefined;
        scope.base.prototype.Release.call(scope);
    };

    
    this.SetSubType = function (subType) {
        // 0 = 점과 점 거리이동
        // 1 = 면과 면 이동 (평행이동)
        // 2 = 면 접합

        scope.MarkupSubType = subType;
    };

    function releaseObejctsItem() {
        currentUpdateObjects = []; //초기화
        currentUpdateObjectsID = [];
        currentUpdateBBox = undefined;
    }

    // 이동할 개체가 지정되어있는지 여부 반환
    function isCurrentTrnasObjects() {
        return currentUpdateObjects.length > 0 || currentUpdateObjectsID.length > 0;
    }

    //선택 개체 이동 설정 및 bbox 재설정
    function updateObjectItem(updateSelected) {

        let firstBBox = true;
        let boundBox = new VIZCore.BBox();
        //선택된 Body
        if (IsModelTransform) {

            if(view.useTree) {

                if(updateSelected) {
                    let selectBodies = view.Data.GetSelection(); //ID

                    for (let i = 0; i < selectBodies.length; i++) {
                        currentUpdateObjectsID.push(selectBodies[i]);
                    }
                }

                boundBox = view.Tree.GetBBoxArrayID(currentUpdateObjectsID);

                if(currentUpdateObjectsID.length > 0 && boundBox.radius !== 0)
                    firstBBox = false;
            }
            else
            {
                if(updateSelected) {
                    let selectBodies = view.Data.GetSelection();
                    let bodies = view.Data.GetBodies(selectBodies);

                    for (let i = 0; i < bodies.length; i++) {
                        currentUpdateObjects.push(bodies[i]);
                    }
                }

                let bbox = view.Data.GetBBoxFormMatrix(currentUpdateObjects);

                if (firstBBox) {
                    boundBox.min.copy(bbox.min);
                    boundBox.max.copy(bbox.max);
                    firstBBox = false;
                }
                else {
                    boundBox.min.min(bbox.min);
                    boundBox.min.min(bbox.max);

                    boundBox.max.min(bbox.min);
                    boundBox.max.max(bbox.max);
                }

                
            }
        }

        //선택된 Custom 개체
        if (IsCustomModelTransform) {
            if(updateSelected) {
                let selectObjects = view.CustomObject.GetSelection();
                if (selectObjects.length > 0) {
                    for (let i = 0; i < bodies.length; i++) {
                        currentUpdateObjects.push(bodies[i]);
                    }
                }
            }

            for (let i = 0; i < currentUpdateObjects.length; i++) {
                let bodies = view.CustomObject.GetBodyFormObject(currentUpdateObjects[i]);
                let bbox = view.Data.GetBBoxFormMatrix(bodies);

                if (firstBBox) {
                    boundBox.min.copy(bbox.min);
                    boundBox.max.copy(bbox.max);
                    firstBBox = false;
                }
                else {
                    boundBox.min.min(bbox.min);
                    boundBox.min.min(bbox.max);

                    boundBox.max.min(bbox.min);
                    boundBox.max.max(bbox.max);
                }
            }
        }

        currentUpdateBBox = boundBox;
    }

    // 개체 이동
    function ProcessObjectTransform(updateTransform)
    {
        for (let i = 0; i < currentUpdateObjects.length; i++) {
            let body = currentUpdateObjects[i];
            let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

            action.transform = new VIZCore.Matrix4().multiplyMatrices(
                updateTransform, action.transform);

            body.object.flag.updateProcess = true;
        }

        if(view.useTree) {

            let updateObjectsTransform = [];

            for (let i = 0; i < currentUpdateObjectsID.length; i++) {

                let file_id = view.Data.ModelFileManager.GetFileKeyByNodeID(currentUpdateObjectsID[i]);

                let origin_id = view.Data.GetOriginNodeID(file_id, currentUpdateObjectsID[i]);

                let action = view.Data.ShapeAction.GetAction(file_id, origin_id);

                if(action === undefined) continue;

                let updateTrans = new VIZCore.Matrix4().multiplyMatrices(
                    updateTransform, action.transform);

                updateObjectsTransform.push(updateTrans);
            }

            view.Tree.SetMultiObjectTransform(currentUpdateObjectsID, updateObjectsTransform);
        }
    }

    this.ProcessStep = function (pickData) {

        switch (uiBase.GetStep()) {
            case 0: {
                if (pickData === undefined) return;
                if (!pickData.pick) return;

                //currentUpdateObjects.push(pickData.body);
                currentUpdateObjectsID.push(pickData.body.bodyId);

                updateObjectItem(false);

                //선택 영역 그리기
                view.Renderer.Render();
                uiBase.NextStep();
            }
            break;
            case 1:
                {
                    if (pickData === undefined) return;
                    if (!pickData.pick) return;

                    lastPickData = pickData;
                    uiBase.currentReviewItem.drawitem.position[0] = pickData.position;

                    view.Renderer.Render();
                    uiBase.NextStep();
                }
                break;
            case 2:
                {    
                    //위치 업데이트
                    let updateTransform = undefined;

                    // 점과 점 거리이동
                    if(scope.MarkupSubType === 0) {
                        let vPos = new VIZCore.Vector3().subVectors(pickData.position, lastPickData.position);
                        updateTransform = new VIZCore.Matrix4();
                        updateTransform.translate(vPos.x, vPos.y, vPos.z);
                    }
                    // 면과 면 이동 (평행이동)
                    else if(scope.MarkupSubType === 1) {

                        //평행면
                        let fDot = pickData.normal.dot(lastPickData.normal);
                        if (Math.abs(fDot) < 0.999)
                            break;

                        let vPos = new VIZCore.Vector3();
                        let vTrans = new VIZCore.Vector3().subVectors(pickData.position, lastPickData.position);

                        let vTransPos1 = new VIZCore.Vector3().multiplyVectors(pickData.normal, vTrans);
                        let vTransPos2 = new VIZCore.Vector3().multiplyVectors(new VIZCore.Vector3().copy(pickData.normal).multiplyScalar(-1), vTrans);

                        //가까운 위치 확인
                        let pos1Length = new VIZCore.Vector3().subVectors(pickData.position, new VIZCore.Vector3().addVectors(lastPickData.position, vTransPos1)).length();
                        let pos2Length = new VIZCore.Vector3().subVectors(pickData.position, new VIZCore.Vector3().addVectors(lastPickData.position, vTransPos2)).length();
                        if(pos1Length < pos2Length)
                            vPos.copy(vTransPos1);
                        else
                            vPos.copy(vTransPos2);
                        
                        // let plane = new VIZCore.Plane().setFromNormalAndCoplanarPoint(pickData.normal, pickData.position);
                        // let basePos = plane.projectPoint(lastPickData.position);

                        // let vPos = new VIZCore.Vector3().subVectors(pickData.position, basePos);
                        updateTransform = new VIZCore.Matrix4();
                        updateTransform.translate(vPos.x, vPos.y, vPos.z);
                    }
                    // 면 접합
                    else if(scope.MarkupSubType === 2) {
                        let vCurrentNormal = new VIZCore.Vector3().copy(pickData.normal).multiplyScalar(-1);

                        let matSrcTransform, matTrgTransform;
                        let vSrcXAxis, vSrcYAxis, vSrcZAxis;
                        let vTrgXAxis, vTrgYAxis, vTrgZAxis;

                        vSrcZAxis = new VIZCore.Vector3().copy(lastPickData.normal);
                        vTrgZAxis = new VIZCore.Vector3().copy(vCurrentNormal);

                        //src
                        {
                            if ((Math.abs(vSrcZAxis.z) < 0.9 && Math.abs(vTrgZAxis.z) < 0.9))
                                vSrcXAxis = new VIZCore.Vector3(0, 0, 1);
                            else if ((Math.abs(vSrcZAxis.x) < 0.9 && Math.abs(vTrgZAxis.x) > 0.9))
                                vSrcXAxis = new VIZCore.Vector3(1, 0, 0);
                            else
                                vSrcXAxis = new VIZCore.Vector3(0, 1, 0);

                            if (Math.abs(vSrcXAxis.dot(vSrcZAxis)) > 0.9)
                            {
                                if( Math.abs(vSrcZAxis.x) < 0.9 )
                                    vSrcXAxis = new VIZCore.Vector3(1, 0, 0);
                                else if (Math.abs(vSrcZAxis.y) < 0.9)
                                    vSrcXAxis = new VIZCore.Vector3(0, 1, 0);
                                else
                                    vSrcXAxis = new VIZCore.Vector3(0, 0, 1);
                            }

                            vSrcYAxis = new VIZCore.Vector3().crossVectors(vSrcZAxis, vSrcXAxis);
                            vSrcXAxis = new VIZCore.Vector3().crossVectors(vSrcYAxis, vSrcZAxis);
                            
                            vSrcXAxis.normalize();
                            vSrcYAxis.normalize();

                            let matTranslate = new VIZCore.Matrix4();
                            matTranslate.translate(lastPickData.position.x, lastPickData.position.y, lastPickData.position.z);
                            let matRotate = new VIZCore.Matrix4().makeBasis(vSrcXAxis, vSrcYAxis, vSrcZAxis);
                            
                            matSrcTransform = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matRotate);
                            //matSrcTransform = new VIZCore.Matrix4().copy(matRotate);
                            matSrcTransform = new VIZCore.Matrix4().getInverse(matSrcTransform);
                        }
                        //trg 
                        {
                            if ((Math.abs(vSrcZAxis.z) < 0.9 && Math.abs(vTrgZAxis.z) < 0.9))
                                vTrgXAxis = new VIZCore.Vector3(0, 0, 1);
                            else if ((Math.abs(vSrcZAxis.x) < 0.9 && Math.abs(vTrgZAxis.x) > 0.9))
                                vTrgXAxis = new VIZCore.Vector3(1, 0, 0);
                            else
                                vTrgXAxis = new VIZCore.Vector3(0, 1, 0);

                            if (Math.abs(vTrgXAxis.dot(vTrgZAxis)) > 0.9)
                            {
                                if( Math.abs(vTrgZAxis.x) < 0.9 )
                                    vTrgXAxis = new VIZCore.Vector3(1, 0, 0);
                                else if (Math.abs(vTrgZAxis.y) < 0.9)
                                    vTrgXAxis = new VIZCore.Vector3(0, 1, 0);
                                else
                                    vTrgXAxis = new VIZCore.Vector3(0, 0, 1);
                            }

                            let vPos = new VIZCore.Vector3().subVectors(pickData.position, lastPickData.position);
                            updateTransform = new VIZCore.Matrix4();
                            updateTransform.translate(vPos.x, vPos.y, vPos.z);

                            vTrgYAxis = new VIZCore.Vector3().crossVectors(vTrgZAxis, vTrgXAxis);
                            vTrgXAxis = new VIZCore.Vector3().crossVectors(vTrgYAxis, vTrgZAxis);
                            
                            vTrgXAxis.normalize();
                            vTrgYAxis.normalize();

                            let matTranslate = new VIZCore.Matrix4();
                            matTranslate.translate(pickData.position.x, pickData.position.y, pickData.position.z);
                            let matRotate = new VIZCore.Matrix4().makeBasis(vTrgXAxis, vTrgYAxis, vTrgZAxis);
                            
                            matTrgTransform = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matRotate);
                            //matTrgTransform = new VIZCore.Matrix4().copy(matRotate);
                        }

                        updateTransform = new VIZCore.Matrix4().multiplyMatrices(matTrgTransform, matSrcTransform);
                        
                    }

                    ProcessObjectTransform(updateTransform);

                    //완료

                    view.Control.RestoreMode(); //뒤로

                    view.Renderer.Render();
                    //if (view.useFramebuffer)
                    //    view.MeshBlock.Reset();
                }
                break;
        }

        if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.PRESELECT)) {
            view.Pick.RefreshPreselectEdgeProcess();
        }
    };

    this.PreviousStep = function () {

        switch (uiBase.GetStep()) {
            case 0:
                {
                    //선택되어있는 개체 취소
                    releaseObejctsItem();
                    scope.mouseAction = true;
                }
                break;
            }
    };
    
    this.mouseDown = function (x, y, button) {

        if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.ROTATE) === false)
        {
            scope.mouseAction = false;
            uiBase.actionEnabled = false; //회전 방지
        }

        uiBase.base.prototype.mouseDown.call(uiBase, x, y, button);
        uiBase.actionEnabled = true;

        return true;
    };
    
    this.mouseUp = function (x, y, button) {
        uiBase.actionEnabled = false;
        uiBase.base.prototype.mouseUp.call(uiBase, x, y, button);
        uiBase.actionEnabled = true;

        if (button === 0 && uiBase.GetMouseClick(uiBase.mouse.x, uiBase.mouse.y)) {
            switch (uiBase.GetStep()) {
                case 0:
                case 1:
                case 2:
                    {
                        //let body = view.Renderer.Picking(uiBase.mouse.x, uiBase.mouse.y);
                        //if (body !== undefined)
                        {
                            if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.PRESELECT)) {
                                //Preselect 선택 정보 확인
                                let preselectData = view.Pick.GetPreselectDataPick(uiBase.mouse.x, uiBase.mouse.y);
                                if(preselectData !== undefined) {
                                    //Preselect 선택으로 처리
                                    view.Data.GetPreselectPick(uiBase.mouse.x, uiBase.mouse.y, scope.ProcessStep);
                                    scope.mouseAction = false;
                                    break;
                                }
                            }

                            let body = view.Renderer.Picking(uiBase.mouse.x, uiBase.mouse.y);
                            if (body !== undefined) {

                                if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.PRESELECT)) {
                                    if(view.Pick.GetMakePreselectID() !== body.bodyId) {

                                        let callbackMake = function (bodyId) {
                                            let makePreselect = view.Pick.MakeMeasurePreselectInfoByID(bodyId);
                                            if(makePreselect) {
                                                view.ViewRefresh();
                                            }
                                            else {
                                                if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.SURFACE)) {
                                                    view.Data.GetPickByBodyCacheDownload(uiBase.mouse.x, uiBase.mouse.y, scope.ProcessStep);
                                                }
                                            }
                                        };
                                        view.Pick.GetBodyCacheDownload(body.bodyId, callbackMake);
                                        
                                        //view.Pick.MakeMeasurePreselectInfoByBodyCache(body.bodyId);

                                        scope.mouseAction = false;
                                        break;
                                    }
                                }

                                //Body Pick
                                if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.SURFACE)) {
                                    view.Data.GetPickByBodyCacheDownload(uiBase.mouse.x, uiBase.mouse.y, scope.ProcessStep);
                                }
                                scope.mouseAction = false;
                            }
                        }

                        //if (view.useFramebuffer)
                        //    view.MeshBlock.Reset();
                    }
                    break;
            }
        }
        else
            view.MeshBlock.Reset();

        return scope.mouseAction;
    };

    this.mouseWheel = function (x, y, delta) {
        //if (uiBase.GetStep() !== 1)
        if(scope.GetProcessFlag(VIZCore.Enum.MARKUP_FLAG.ZOOM))
            uiBase.base.prototype.mouseWheel.call(uiBase, x, y, delta);
    };

    
    this.Render = function () {
        if(!isCurrentTrnasObjects()) return;

        //boundbox 그리기
                    
        switch (uiBase.GetStep()) {
            case 0:
            case 1:
            case 2:
            {
                let colorLine = new VIZCore.Color(100, 200, 0, 255);

                view.gl.disable(view.gl.DEPTH_TEST);

                //BoundBox 그리기
                const matMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
                const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
                {
                    view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC2D);
                    view.Shader.SetMatrix(matMVP, matMV);
                    view.Shader.SetClipping(undefined);

                    let currentColor = colorLine;
                    let currentGLColor = currentColor.glColor();
                    view.Shader.SetGLColor(currentGLColor.r, currentGLColor.g, currentGLColor.b, currentGLColor.a);

                    //BoundBox Line Array 12
                    let lineIndex = [[0, 4, 4, 5, 5, 1, 1, 0], [2, 6, 6, 7, 7, 3, 3, 2], [0, 2], [4, 6], [1, 3], [5, 7]
                    ];

                    let vertices = view.Util.GetBBox2Vertex(currentUpdateBBox);

                    let positionBuffer = view.gl.createBuffer();
                    let positionArray = [];
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                    view.gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, view.gl.FLOAT, false, 0, 0);

                    {
                        let posNum = 0;
                        for (let i = 0; i < lineIndex.length; i++) {
                            for (let j = 0; j < lineIndex[i].length; j++) {
                                positionArray[posNum] = vertices[lineIndex[i][j]].x; posNum++;
                                positionArray[posNum] = vertices[lineIndex[i][j]].y; posNum++;
                                positionArray[posNum] = vertices[lineIndex[i][j]].z; posNum++;
                            }
                        }
                    }

                    //view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(positionArray), view.gl.STATIC_DRAW);
                    view.gl.drawArrays(view.gl.LINES, 0, positionArray.length);

                    view.gl.deleteBuffer(positionBuffer);
                }

                view.Shader.EndShader();
            }
            break;
        }
    };


    this.Render2D = function (context) {

        const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

        switch (uiBase.GetStep()) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                {
                    let pointSize = 3;
                    context.fillStyle = "rgba(0, 255, 0, 1)";

                    let screenPos = view.Renderer.Util.GetScreenPositionByMatrix(matMVP, uiBase.currentReviewItem.drawitem.position[0]);
                   
                    //let pos = new VIZCore.Vector2(pixelX, pixelY);
                    context.beginPath();
                    context.arc(screenPos.x, screenPos.y, pointSize, 0, Math.PI * 2);
                    context.fill();
                }
                break;
            case 2:
                break;
        }

    };

    this.GetProcessFlag = function (flag) {

        if(scope.MarkupSubType === 0) {
            switch(uiBase.GetStep())
            {
                case 0:
                    {
                        if(flag === VIZCore.Enum.MARKUP_FLAG.SURFACE)
                            return true;

                        if(flag === VIZCore.Enum.MARKUP_FLAG.ROTATE)
                            return true;

                        if(flag === VIZCore.Enum.MARKUP_FLAG.ZOOM)
                            return true;
                    }
                    break;
                case 1:
                case 2:
                {
                    if(flag === VIZCore.Enum.MARKUP_FLAG.PRESELECT)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.ROTATE)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.ZOOM)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.POINT)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.CIRCLE_CENTER)
                        return true;
                        
                    if(flag === VIZCore.Enum.MARKUP_FLAG.SURFACE)
                        return true;
                }
                break;
            }
        }
        else if(scope.MarkupSubType === 1 || 
            scope.MarkupSubType === 2) {
            switch(uiBase.GetStep())
            {
                case 0:
                    {
                        if(flag === VIZCore.Enum.MARKUP_FLAG.SURFACE)
                            return true;

                        if(flag === VIZCore.Enum.MARKUP_FLAG.ROTATE)
                            return true;

                        if(flag === VIZCore.Enum.MARKUP_FLAG.ZOOM)
                            return true;
                    }
                    break;
                case 1:
                case 2:
                {
                    if(flag === VIZCore.Enum.MARKUP_FLAG.PRESELECT)
                        return false;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.ROTATE)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.ZOOM)
                        return true;

                    if(flag === VIZCore.Enum.MARKUP_FLAG.SURFACE)
                        return true;
                }
                break;
            }
        }
        
        return false;
    };

 };

 export default UIMarkup_Util_Transform;