//import $ from 'jquery';
class Grid {
    constructor(view, VIZCore) {
        let scope = this;

        let groundPlaneColor = new VIZCore.Color(128, 128, 128, 200);
        let groundPlaneLineColor = new VIZCore.Color(255, 0, 0, 200);

        //바닥 텍스트 그리기 정보
        let groundLinesPosition = []; //[0] x, [1] y 라인 3D 월드좌표

        this.Visible = true;
        this.Loaded = false;
        this.Info = {
            BBox : undefined,
            Items : []
        };

        this.ElevationLine = true;
        this.PlanLine = true;
        this.SectionLine = true;
        this.ShowEvenNumber = true;
        this.ShowNumberAllStep = false;
        this.ShowOddNumber = true;
        this.ShowFrameNumber = false; // 조선 좌표계 표시
        this.XYPlane = true;
        this.YZPlane = true;
        this.ZXPlane = true;

        let showCustomLabel = false; // 사용자 정의 Label 적용

        this.ShowCustomLevelGrid = false; // LevelGrid 활성화

        
        this.GridItem = (axis) => { 
            let item = undefined;
            item = {
                axis: axis === VIZCore.Enum.Axis.X? "X" : axis === VIZCore.Enum.Axis.Y? "Y" : "Z", 
                axisId: axis === VIZCore.Enum.Axis.X? 0 : axis === VIZCore.Enum.Axis.Y? 1 : 2, 
                //label: axis === VIZCore.Enum.Axis.X? "FR" : axis === VIZCore.Enum.Axis.Y? "LP" : "LP",  
                label: axis === VIZCore.Enum.Axis.X? "FR" : axis === VIZCore.Enum.Axis.Y? "LP" : "LV",  
                items: []
                };
            return item;
        }

        init();
        function init() {
        }

        function renderText(context, pos, dir, text, offset, fillStyle) {
            
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
    
            // 폰트 설정
            let textFontSize = 8;
            let textBorder = 2;
            context.font = textFontSize + "pt Arial";
            //context.fillStyle = "rgba(255, 255, 255, 1.0)";
            context.fillStyle = "rgba(0, 0, 0, 1.0)";
            if(fillStyle !== undefined)
                context.fillStyle = fillStyle;

            let nearPlane = [1.0, 0.0, 0.0, 0.0];
            {
                let matMV = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                let matMVinv = new VIZCore.Matrix4().getInverse(matMV);
    
                let vCamWorldPosition = matMVinv.multiplyVector(view.Camera.cameraPosition);
                let vCamWorldTarget = matMVinv.multiplyVector(view.Camera.cameraTarget);
    
                let nearPlaneDist = view.Camera.near;
                let vCamDirection = new VIZCore.Vector3().subVectors(vCamWorldTarget, vCamWorldPosition);
                vCamDirection.normalize();
    
                // 니어플랜 평면 방정식 만든다
                nearPlane[0] = vCamDirection.x;
                nearPlane[1] = vCamDirection.y;
                nearPlane[2] = vCamDirection.z;
    
                let vNearPlanePos = new VIZCore.Vector3().addVectors(vCamWorldPosition, vCamDirection.multiplyScalar(nearPlaneDist));
                nearPlane[3] = -(nearPlane[0] * vNearPlanePos.x + nearPlane[1] * vNearPlanePos.y + nearPlane[2] * vNearPlanePos.z);
            }

            //원근뷰에서 가시화 여부 확인
            if(view.Util.IsRenderReivewNearPlane(pos, nearPlane))
                return;
            
            //텍스트
            const metrics = view.Renderer.Util.GetTextMetricsByText(context, [text], textFontSize);//getTextMetricsByText(text, textFontSize);
            let w = metrics.width + textBorder * 2;
            let h = metrics.height + textBorder * 2;

            let pixel = w / 2;
            if(offset === undefined)
                offset = 0;
                //pixel += offset;
            let len = view.Camera.GetScreen1PixelLength(pos);

            // 2D 좌표 변환
            let textPos = new VIZCore.Vector3().addVectors(pos, new VIZCore.Vector3().copy(dir).multiplyScalar(len*pixel));
            let text2DPos = view.Camera.world2ScreenWithMatrix(matMVP, textPos);
            
            
            
    
            

            //텍스트 좌표
            //let textPosition = new VIZCore.Vector2().addVectors(screen2, new VIZCore.Vector2().copy(direction).multiplyScalar(w));
                    
            //for (let i = 0; i < review.text.value.length; i++) {
            //    ctx_review.fillText(review.text.value[i], pos.x, pos.y + (metrics.ascent * i + metrics.ascent + review.style.border.offset * i));
            //}

            // context.fillText(text,
            //     text2DPos.x - w * 1.5,
            //     text2DPos.y);
                //text2DPos.y + (metrics.ascent * 0 + metrics.ascent + textBorder * 0));
                context.fillText(text,
                text2DPos.x - pixel,// - w * 0.5,
                text2DPos.y + (h - metrics.ascent) / 2 + offset);
        }

        function parseJSON(data){
            scope.Loaded = true;

            scope.Info.Items = data;
            let min = new VIZCore.Vector3();
            let max = new VIZCore.Vector3();

            for (let index = 0; index < data.length; index++) {
                const axis = data[index];
                if(axis.axisId === 0)// X
                {
                    for (let j = 0; j < axis.items.length; j++) {
                        let item = axis.items[j];
                        if(j === 0){
                            min.x = item.offset;
                            max.x = item.offset;
                        }
                        else{
                            min.x = Math.min(min.x, item.offset);
                            max.x = Math.max(max.x, item.offset);
                        }
                        if(item.label === undefined)
                            item.label = item.id + "";
                    }
                }
                else if (axis.axisId === 1)//Y
                {
                    for (let j = 0; j < axis.items.length; j++) {
                        let item = axis.items[j];
                        if(j === 0){
                            min.y = item.offset;
                            max.y = item.offset;
                        }
                        else{
                            min.y = Math.min(min.y, item.offset);
                            max.y = Math.max(max.y, item.offset);
                        }
                        if(item.label === undefined)
                            item.label = item.id + "";
                    }
                }
                else if(axis.axisId === 2)//Z
                {
                    for (let j = 0; j < axis.items.length; j++) {
                        let item = axis.items[j];
                        if(j === 0){
                            min.z = item.offset;
                            max.z = item.offset;
                        }
                        else{
                            min.z = Math.min(min.z, item.offset);
                            max.z = Math.max(max.z, item.offset);
                        }
                        if(item.label === undefined)
                            item.label = item.id + "";
                    }
                }
            }

            scope.Info.BBox = new VIZCore.BBox([min.x, min.y, min.z, max.x, max.y, max.z]);

            view.MeshBlock.Reset();
            view.Renderer.Render();
        }

        function drawBox(gl, context, bufferClear, sourceBBox){
            if (view.Data.ObjectsBBox === undefined) return;

            //let bbox = new VIZCore.BBox().copy(view.Data.ObjectsBBox);
            let drawBBox = new VIZCore.BBox().copy(view.Data.ObjectsBBox);
            //bbox.append(view.Data.ObjectsBBox);
            if(sourceBBox !== undefined)
                drawBBox = new VIZCore.BBox().copy(sourceBBox);

            //라인 위치 데이터 수집
            groundLinesPosition = [];
            groundLinesPosition[0] = [];
            groundLinesPosition[1] = [];
            let xLinesNum = 0;
            let yLinesNum = 0;

            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(true);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
            const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            let drawPlaneTest = ()=>
            {
                //gl
                if(bufferClear) {
                    view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC2D);
                    view.Shader.SetMatrix(matMVP, matMVMatrix);
                    //view.Shader.SetGLLight();
                    view.Shader.SetClipping(undefined);

                    if (groundPlaneColor === undefined)
                        view.Shader.SetGLColor(1.0, 1.0, 1.0, 1.0);
                    else {
                        let GLColor = groundPlaneLineColor.glColor();
                        view.Shader.SetGLColor(GLColor.r, GLColor.g, GLColor.b, GLColor.a);
                    }
                }

                let fSideOffset = 5;
                let gridMinWidth = 60;
                let stepMulValue = 2;
                let strokeLineStepValue = 5;
                let m_bFrameShowPosInverse = false;
                let m_bShowMarineFrameXYPlane = scope.XYPlane;
                let m_bShowMarineFrameZXPlane = scope.YZPlane;
                let m_bShowMarineFrameYZPlane = scope.ZXPlane;
                let m_bShowMarineFrameAllStep = scope.ShowNumberAllStep;
                let m_bShowMarineFrame_SECTION = scope.SectionLine;
                let m_bShowMarineFrame_ELEVATION = scope.ElevationLine;
                let m_bShowMarineFrame_PLAN = scope.PlanLine;
                let m_bShowMarineFrameNumber = scope.ShowFrameNumber;
                let m_bShowMarineFrameLineOddNumber = scope.ShowOddNumber;
                let m_bShowMarineFrameLineEvenNumber = scope.ShowEvenNumber;
                let bbox = new VIZCore.BBox().copy(drawBBox);

                let drawMax = 30000; //65024
                let linePositionNum = 0;
                let position = [];
                let lineStrokePositionNum = 0;
                let positionStroke = [];
    
                // 바운드 박스 그린다
                // float expandRatio = 1.3f;
                // CRMVertex3<float> vCenter = (pLib->m_Camera.m_vModelBBMin + pLib->m_Camera.m_vModelBBMax)/2.0f;
                // CRMVertex3<float> vMin = vCenter + (pLib->m_Camera.m_vModelBBMin - vCenter)*expandRatio;
                // CRMVertex3<float> vMax = vCenter + (pLib->m_Camera.m_vModelBBMax - vCenter)*expandRatio;
                let expandRatio = 1;
                let vCenter = new VIZCore.Vector3().copy(bbox.center);
                let vTmp1 = new VIZCore.Vector3().subVectors(bbox.min, vCenter).multiplyScalar(expandRatio);
                let vTmp2 = new VIZCore.Vector3().subVectors(bbox.max, vCenter).multiplyScalar(expandRatio);
                let vMin = new VIZCore.Vector3().addVectors(vCenter, vTmp1);
                let vMax = new VIZCore.Vector3().addVectors(vCenter, vTmp2);
                let radius = bbox.radius;
    
                let v1 = new VIZCore.Vector3();
                let v2 = new VIZCore.Vector3();
                let matrix = new VIZCore.Matrix4().copy(view.Camera.matMVP);
                let vPoly = [];
                // xy 평면 그린다
                if( m_bShowMarineFrameXYPlane )
                {
                    //v1 = pLib->m_Camera.m_vModelCenter;
                    v1 = new VIZCore.Vector3().copy(bbox.center);
                    //v2 = v1; 
                    v2 = new VIZCore.Vector3().copy(v1);
                    //v2.z += pLib->m_Camera.m_fModelRadius;
                    v2.z += radius;
            
                    // 2D Pos
                    //v1 = pLib->m_Camera.World2Screen( v1 );
                    v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                    //v2 = pLib->m_Camera.World2Screen( v2 );
                    v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                    let z = 0.0;
                    
                    if( m_bFrameShowPosInverse )
                    {
                        if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                            z = vMin.z;
                        else
                            z = vMax.z;
                    }
                    else
                        z = vMin.z;
            
                    //vPoly[0] = vPoly[4] = CRMVertex3<float>( vMin.x, vMin.y, z );
                    vPoly[0] = vPoly[4] = new VIZCore.Vector3(vMin.x, vMin.y, z);
                    //vPoly[1] = CRMVertex3<float>( vMax.x, vMin.y, z );
                    vPoly[1] = new VIZCore.Vector3( vMax.x, vMin.y, z );
                    //vPoly[2] = CRMVertex3<float>( vMax.x, vMax.y, z );
                    vPoly[2] = new VIZCore.Vector3( vMax.x, vMax.y, z );
                    //vPoly[3] = CRMVertex3<float>( vMin.x, vMax.y, z );
                    vPoly[3] = new VIZCore.Vector3( vMin.x, vMax.y, z );
                    
                    //Render3DPolyline( vPoly, 5, 1.0f, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                    for(let k = 0; k < vPoly.length ; k++) {
                        if(k === 0)
                        {
                            continue;
                        }
                        position[linePositionNum + 0] = vPoly[k-1].x;
                        position[linePositionNum + 1] = vPoly[k-1].y;
                        position[linePositionNum + 2] = vPoly[k-1].z;
                        linePositionNum += 3;
                        position[linePositionNum + 0] = vPoly[k].x;
                        position[linePositionNum + 1] = vPoly[k].y;
                        position[linePositionNum + 2] = vPoly[k].z;
                        linePositionNum += 3;

                        
                    }

                    let m_frameXAxisNum = 0;
                    if(scope.Info.Items[0] !== undefined && scope.Info.Items[0].items.length > 0)
                        m_frameXAxisNum = scope.Info.Items[0].items.length;

                    if(m_bShowMarineFrame_SECTION && m_frameXAxisNum)
                    {
                        let m_pFrameXAxis = scope.Info.Items[0].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.y += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let y = 0.0;
                        let changeDir = false;
                        if (v1.z > v2.z)
                        {
                            y = vMax.y + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            changeDir = true;
                        }
                        else
                        {
                            y = vMin.y - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                        }
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[0].offset,y, z ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[m_frameXAxisNum-1].offset,y, z ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameXAxisNum )
                        {
                            if( fLength/m_frameXAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameXAxisNum)
                        for( let i=0 ; i<m_frameXAxisNum ; i+=step )
                        {
                            if( m_pFrameXAxis[i].offset < vMin.x || m_pFrameXAxis[i].offset > vMax.x )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,vMin.y, z );
                            vPoly[1] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,vMax.y, z );

                            let vDir = undefined;

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[0].label + " " + m_pFrameXAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameXAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameXAxis[i].label;
                            }
                            if(changeDir)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text);
                            }
                            else
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                vDir.normalize();
                                renderText(context, vPoly[0], vDir, text);
                            }

                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }

                    let m_frameYAxisNum = 0;
                    if(scope.Info.Items[1] !== undefined && scope.Info.Items[1].items.length > 0)
                        m_frameYAxisNum = scope.Info.Items[1].items.length;
                        
                    if(m_bShowMarineFrame_ELEVATION && m_frameYAxisNum)
                    {
                        let m_pFrameYAxis = scope.Info.Items[1].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.x += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let x = 0.0;
                        let changeDir = false;
                        if (v1.z > v2.z){
                            x = vMax.x + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            changeDir = true;
                        }
                        else
                            x = vMin.x - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[0].offset, z ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[m_frameYAxisNum-1].offset, z ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameYAxisNum )
                        {
                            if( fLength/m_frameYAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameYAxisNum)
                        for( let i=0 ; i<m_frameYAxisNum ; i+=step )
                        {
                            if( m_pFrameYAxis[i].offset < vMin.y || m_pFrameYAxis[i].offset > vMax.y )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3( vMin.x, m_pFrameYAxis[i].offset, z );
                            vPoly[1] = new VIZCore.Vector3( vMax.x, m_pFrameYAxis[i].offset, z );

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[1].label + " " + m_pFrameYAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameYAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameYAxis[i].label;
                            }

                            let vDir = undefined;
                            if(changeDir)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text);
                            }
                            else
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                vDir.normalize();
                                renderText(context, vPoly[0], vDir, text);
                            }

                            

                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }
                }

                // xz 평면 그린다
                if( m_bShowMarineFrameZXPlane )
                {
                    vPoly = [];
                    //v1 = pLib->m_Camera.m_vModelCenter;
                    v1 = new VIZCore.Vector3().copy(bbox.center);
                    //v2 = v1; 
                    v2 = new VIZCore.Vector3().copy(v1);
                    //v2.x += pLib->m_Camera.m_fModelRadius;
                    v2.y += radius;
            
                    // 2D Pos
                    //v1 = pLib->m_Camera.World2Screen( v1 );
                    v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                    //v2 = pLib->m_Camera.World2Screen( v2 );
                    v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                    let y = 0.0;
                    
                    if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                        y = vMin.y;
                    else
                        y = vMax.y;
            
                    vPoly[0] = vPoly[4] = new VIZCore.Vector3(vMin.x, y, vMin.z);
                    vPoly[1] = new VIZCore.Vector3( vMax.x, y, vMin.z );
                    vPoly[2] = new VIZCore.Vector3( vMax.x, y, vMax.z );
                    vPoly[3] = new VIZCore.Vector3( vMin.x, y, vMax.z );
                    
                    for(let k = 0; k < vPoly.length ; k++) {
                        if(k === 0)
                        {
                            continue;
                        }
                        position[linePositionNum + 0] = vPoly[k-1].x;
                        position[linePositionNum + 1] = vPoly[k-1].y;
                        position[linePositionNum + 2] = vPoly[k-1].z;
                        linePositionNum += 3;
                        position[linePositionNum + 0] = vPoly[k].x;
                        position[linePositionNum + 1] = vPoly[k].y;
                        position[linePositionNum + 2] = vPoly[k].z;
                        linePositionNum += 3;
                    }


                    let m_frameZAxisNum = 0;
                    if(scope.Info.Items[2] !== undefined && scope.Info.Items[2].items.length > 0)
                        m_frameZAxisNum = scope.Info.Items[2].items.length;
                    if(m_bShowMarineFrame_PLAN && m_frameZAxisNum > 0)
                    {
                        let m_pFrameZAxis = scope.Info.Items[2].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.x += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let x = 0.0;
                        let changeDir = false;
                        if (v1.z > v2.z)
                        {
                            x = vMax.x + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            changeDir = true;
                        }
                        else
                            x = vMin.x - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[0].offset ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[m_frameZAxisNum-1].offset ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameZAxisNum )
                        {
                            if( fLength/m_frameZAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameZAxisNum)
                        for( let i=0 ; i<m_frameZAxisNum ; i+=step )
                        {
                            if( m_pFrameZAxis[i].offset < vMin.z || m_pFrameZAxis[i].offset > vMax.z )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3( vMin.x, y, m_pFrameZAxis[i].offset);
                            vPoly[1] = new VIZCore.Vector3( vMax.x, y, m_pFrameZAxis[i].offset);

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[2].label + " " + m_pFrameZAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameZAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameZAxis[i].label;
                            }

                            let vDir = undefined;
                            if(changeDir)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text, -10);
                            }
                            else
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                vDir.normalize();
                                renderText(context, vPoly[0], vDir, text, -10);
                            }



                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }

                    let m_frameXAxisNum = 0;
                    if(scope.Info.Items[0] !== undefined && scope.Info.Items[0].items.length > 0)
                        m_frameXAxisNum = scope.Info.Items[0].items.length;
                    if(m_bShowMarineFrame_SECTION && m_frameXAxisNum)
                    {
                        let m_pFrameXAxis = scope.Info.Items[0].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.z += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let z = vMax.z + fSideOffset;
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[0].offset,y, z ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[m_frameXAxisNum-1].offset,y, z ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameXAxisNum )
                        {
                            if( fLength/m_frameXAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameXAxisNum)
                        for( let i=0 ; i<m_frameXAxisNum ; i+=step )
                        {
                            if( m_pFrameXAxis[i].offset < vMin.x || m_pFrameXAxis[i].offset > vMax.x )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,y, vMin.z );
                            vPoly[1] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,y, vMax.z );

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[0].label + " " + m_pFrameXAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameXAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameXAxis[i].label;
                            }

                            let vDir = undefined;
                            if(true)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text);
                            }
                            // else
                            // {
                            //     vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                            //     vDir.normalize();
                            //     renderText(context, vPoly[0], vDir, m_pFrameXAxis[i].offset + "");
                            // }

                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }
                }

                // yz 평면 그린다
                if( m_bShowMarineFrameYZPlane )
                {
                    vPoly = [];
                    //v1 = pLib->m_Camera.m_vModelCenter;
                    v1 = new VIZCore.Vector3().copy(bbox.center);
                    //v2 = v1; 
                    v2 = new VIZCore.Vector3().copy(v1);
                    //v2.x += pLib->m_Camera.m_fModelRadius;
                    v2.x += radius;
            
                    // 2D Pos
                    //v1 = pLib->m_Camera.World2Screen( v1 );
                    v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                    //v2 = pLib->m_Camera.World2Screen( v2 );
                    v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                    let x = 0.0;
                    
                    if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                        x = vMin.x;
                    else
                        x = vMax.x;
            
                    vPoly[0] = vPoly[4] = new VIZCore.Vector3(x, vMin.y, vMin.z);
                    vPoly[1] = new VIZCore.Vector3( x, vMax.y, vMin.z );
                    vPoly[2] = new VIZCore.Vector3( x, vMax.y, vMax.z );
                    vPoly[3] = new VIZCore.Vector3( x, vMin.y, vMax.z );
                    
                    for(let k = 0; k < vPoly.length ; k++) {
                        if(k === 0)
                        {
                            continue;
                        }
                        position[linePositionNum + 0] = vPoly[k-1].x;
                        position[linePositionNum + 1] = vPoly[k-1].y;
                        position[linePositionNum + 2] = vPoly[k-1].z;
                        linePositionNum += 3;
                        position[linePositionNum + 0] = vPoly[k].x;
                        position[linePositionNum + 1] = vPoly[k].y;
                        position[linePositionNum + 2] = vPoly[k].z;
                        linePositionNum += 3;
                    }

                    let m_frameZAxisNum = 0;
                    if(scope.Info.Items[2] !== undefined && scope.Info.Items[2].items.length > 0)
                        m_frameZAxisNum = scope.Info.Items[2].items.length;
                    if(m_bShowMarineFrame_PLAN && m_frameZAxisNum > 0)
                    {
                        let m_pFrameZAxis = scope.Info.Items[2].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.y += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let y = 0.0;
                        let changeDir = false;
                        if (v1.z > v2.z)
                        {
                            y = vMax.y + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            changeDir = true;
                        }
                        else
                            y = vMin.y - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[0].offset ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[m_frameZAxisNum-1].offset ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameZAxisNum )
                        {
                            if( fLength/m_frameZAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameZAxisNum)
                        for( let i=0 ; i<m_frameZAxisNum ; i+=step )
                        {
                            if( m_pFrameZAxis[i].offset < vMin.z || m_pFrameZAxis[i].offset > vMax.z )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3( x, vMin.y, m_pFrameZAxis[i].offset);
                            vPoly[1] = new VIZCore.Vector3( x, vMax.y, m_pFrameZAxis[i].offset);

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[2].label + " " + m_pFrameZAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameZAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameZAxis[i].label;
                            }

                            let vDir = undefined;
                            if(changeDir)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text, -10);
                            }
                            else
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                vDir.normalize();
                                //if(i === 0)
                                    renderText(context, vPoly[0], vDir, text, -10);
                                //else
                                //    renderText(context, vPoly[0], vDir, text);
                            }

                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }

                    let m_frameYAxisNum = 0;
                    if(scope.Info.Items[1] !== undefined && scope.Info.Items[1].items.length > 0)
                        m_frameYAxisNum = scope.Info.Items[1].items.length;
                        
                    if(m_bShowMarineFrame_ELEVATION && m_frameYAxisNum)
                    {
                        let m_pFrameYAxis = scope.Info.Items[1].items;
                        
                        vPoly = [];
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        v2 = new VIZCore.Vector3().copy(v1);
                        v2.z += radius;
                
                        // 2D Pos
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        let z = 0.0;
                        z = vMax.z + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                        
                        let step = 1;
                        let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[0].offset, z ) );
                        let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[m_frameYAxisNum-1].offset, z ) );
                        vTest1.z = vTest2.z = 0.0;
                        let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                        while( step < m_frameYAxisNum )
                        {
                            if( fLength/m_frameYAxisNum*step > gridMinWidth )
                                break;
                            step *= stepMulValue;
                        }
            
                        if (m_bShowMarineFrameAllStep)
                            step = 1;

                        let lscnt = 0;
                        if (step < m_frameYAxisNum)
                        for( let i=0 ; i<m_frameYAxisNum ; i+=step )
                        {
                            if( m_pFrameYAxis[i].offset < vMin.y || m_pFrameYAxis[i].offset > vMax.y )
                            continue;
        
                            lscnt++;
                            if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                               continue;
                            if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                               continue;
                            
                            vPoly[0] = new VIZCore.Vector3( x, m_pFrameYAxis[i].offset, vMin.z );
                            vPoly[1] = new VIZCore.Vector3( x, m_pFrameYAxis[i].offset, vMax.z );

                            let text = undefined;
                            if(m_bShowMarineFrameNumber)
                            {
                                text = scope.Info.Items[1].label + " " + m_pFrameYAxis[i].id + "";
                            }
                            else
                            {
                                text = m_pFrameYAxis[i].offset + "";                                    
                            }

                            if(showCustomLabel)
                            {
                                text =  m_pFrameYAxis[i].label;
                            }

                            let vDir = undefined;
                            if(true)
                            {
                                vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                vDir.normalize();
                                renderText(context, vPoly[1], vDir, text, 15);
                            }

                            if( i%(step*strokeLineStepValue) != 0 )
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    position[linePositionNum + 0] = vPoly[k-1].x;
                                    position[linePositionNum + 1] = vPoly[k-1].y;
                                    position[linePositionNum + 2] = vPoly[k-1].z;
                                    linePositionNum += 3;
                                    position[linePositionNum + 0] = vPoly[k].x;
                                    position[linePositionNum + 1] = vPoly[k].y;
                                    position[linePositionNum + 2] = vPoly[k].z;
                                    linePositionNum += 3;
                                }
                            }
                            else
                            {
                                //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                for(let k = 0; k < vPoly.length ; k++) {
                                    if(k === 0)
                                    {
                                        continue;
                                    }
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                    lineStrokePositionNum += 3;
                                    positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                    positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                    positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                    lineStrokePositionNum += 3;
                                }
                            }
                                
                        }
                    }
                }

                //gl
                if(bufferClear)
                {
                    let positionBuffer = undefined;
                    

                    positionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                    gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
                    
                    let color = new VIZCore.Color(255, 255, 255, 255).glColor();
                    if(view.Configuration.Frame.LineColor !== undefined)
                        color = view.Configuration.Frame.LineColor.glColor();

                    view.Shader.SetGLColor(color.r, color.g, color.b, color.a);

                    if (linePositionNum > 0) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

                        gl.drawArrays(gl.LINES, 0, linePositionNum / 3);
                    }

                    gl.deleteBuffer(positionBuffer);

                    positionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                    gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

                    color = new VIZCore.Color(255, 0, 0, 255).glColor();
                    if(view.Configuration.Frame.SplitLineColor !== undefined)
                        color = view.Configuration.Frame.SplitLineColor.glColor();
                    view.Shader.SetGLColor(color.r, color.g, color.b, color.a);

                    if (lineStrokePositionNum > 0) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionStroke), gl.STATIC_DRAW);

                        gl.drawArrays(gl.LINES, 0, lineStrokePositionNum / 3);
                    }

                    gl.deleteBuffer(positionBuffer);

                    view.Shader.EndShader();
                }
            };

            drawPlaneTest();
        }

        // Url 추가
        this.Add = (path) => {
            let fileData = view.Data.FileData();
            //fileData.Url = './VIZCore/Model/ShipGrid/8222.json';
            fileData.Url = path;
            fileData.DataType = -1;
            view.Loader.LoadGrid(fileData, function (data) {
                //console.log("JSON :: ", data);
                if(data === null)
                    return;

                parseJSON(data);
            }, undefined);

            return fileData;
        };

        this.AddString = (str) => {
            let data = JSON.parse(str);
            parseJSON(data);
        }

        this.Clear = ()=> {
            this.Info = {
                BBox : undefined,
                Items : []
            };
            this.Loaded = false;
        };

        this.AddGridLine = (axis, gridId, offset)=>{
            let axisGroup = undefined;
            if(axis === VIZCore.Enum.Axis.X)
            {
                // 그룹 생성
                if(scope.Info.Items[0] === undefined)
                {
                    scope.Info.Items[0] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[0];
            }
            else if(axis === VIZCore.Enum.Axis.Y)
            {
                // 그룹 생성
                if(scope.Info.Items[1] === undefined)
                {
                    scope.Info.Items[1] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[1];
            }
            else if(axis === VIZCore.Enum.Axis.Z)
            {
                // 그룹 생성
                if(scope.Info.Items[2] === undefined)
                {
                    scope.Info.Items[2] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[2];
            }

            axisGroup.items.push({ id: gridId, offset: offset, label : gridId + "" });
            this.Loaded = true;
        };

        this.AddGridLineCustom = (axis, gridId, offset, labelText)=>{
            let axisGroup = undefined;
            if(axis === VIZCore.Enum.Axis.X)
            {
                // 그룹 생성
                if(scope.Info.Items[0] === undefined)
                {
                    scope.Info.Items[0] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[0];
            }
            else if(axis === VIZCore.Enum.Axis.Y)
            {
                // 그룹 생성
                if(scope.Info.Items[1] === undefined)
                {
                    scope.Info.Items[1] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[1];
            }
            else if(axis === VIZCore.Enum.Axis.Z)
            {
                // 그룹 생성
                if(scope.Info.Items[2] === undefined)
                {
                    scope.Info.Items[2] = this.GridItem(axis);
                }
                axisGroup = scope.Info.Items[2];
            }

            axisGroup.items.push({ id: gridId, offset: offset, label : labelText });
            this.Loaded = true;
        };



        // 그리기
        this.Render = (gl, context, bufferClear) => {

            if (scope.Visible && scope.Loaded) {
                drawBox(gl, context, bufferClear);
                //drawPlaneLineText(0);
                //drawPlaneLineText(1);
                //drawPlaneLineText(2);

                
                //gl.disable(gl.DEPTH_TEST);

                //let bbox = new VIZCore.BBox([19860,-1616,5233,20260,-1001,5502]);
            }
        
            if(scope.ShowCustomLevelGrid)
                scope.RenderLevelPlan(gl, context, bufferClear);
        };

        this.GetFrameBBox = () => {
            let min = new VIZCore.Vector3();
            let max = new VIZCore.Vector3();

            let getMinMax = function(items){
                let obj = {
                    min : undefined,
                    max : undefined
                };
                for(let i = 0; i < items.length;i++)
                {
                    let info = items[i];
                    if(obj.min === undefined)
                    {
                        obj.min = info.offset;
                    }
                    else{
                        obj.min = Math.min(obj.min, info.offset);
                    }

                    if(obj.max === undefined)
                    {
                        obj.max = info.offset;
                    }
                    else{
                        obj.max = Math.max(obj.max, info.offset);
                    }
                }

                if(obj.min !== undefined && obj.max !== undefined){
                    return obj;
                }
                else
                    return undefined;
            }

            let bCompleted = true;
            for(let i = 0; i < scope.Info.Items.length; i++){
                let m_pFrame = scope.Info.Items[i];

                let obj = getMinMax(m_pFrame.items);
                if(obj === undefined)
                {
                    bCompleted = false;
                    continue;
                }
                    
                if(m_pFrame.axisId === VIZCore.Enum.Axis.X)
                {
                    min.x = obj.min;
                    max.x = obj.max;
                }
                else if(m_pFrame.axisId === VIZCore.Enum.Axis.Y)
                {
                    min.y = obj.min;
                    max.y = obj.max;
                }
                else if (m_pFrame.axisId === VIZCore.Enum.Axis.Z)
                {
                    min.z = obj.min;
                    max.z = obj.max;
                }
            }
            
            if(bCompleted)
            {
                return new VIZCore.BBox([min.x, min.y, min.z, max.x, max.y, max.z]);
            }
            else{
                return undefined;
            }
        };

        let backupBBox = undefined;
        this.ShowLevelGrid = (visible) => {
            scope.ShowCustomLevelGrid = visible;
            if(visible){
               backupBBox = new VIZCore.BBox().copy(view.Data.ObjectsBBox);
            }
            else{
                if(backupBBox !== undefined)
                    view.Data.ObjectsBBox = new VIZCore.BBox().copy(backupBBox);
            }

            // let bbox_frame = scope.GetFrameBBox();
            // if(bbox_frame === undefined || bbox_frame.radius === 0)
            //     return;
            // view.Camera.ResizeGLWindow(bbox_frame);
            view.ViewRefresh();
        };
        this.RenderLevelPlan = (gl, context, bufferClear) => {
            // Z축별 그리기

            // Z축 모델 BBox 기준 그리기

            // Camera Z 축 기준 활성화
            
            if(view.Data.ObjectsBBox === undefined)
                 return;

            let bbox_frame = scope.GetFrameBBox();
            // 모델 Z 축 기준 활성화
            bbox_frame.min.z = view.Data.ObjectsBBox.min.z;
            bbox_frame.max.z = view.Data.ObjectsBBox.max.z;
            
            if(bbox_frame === undefined || bbox_frame.radius === 0)
                return;

            // GL Window 재정의
            //view.Camera.ResizeGLWindow(bbox_frame);

            let groundPlaneXYLineColor = new VIZCore.Color(255, 255, 255, 255);
            let textColor = new VIZCore.Color(150,150,150,200);
            let textGLColor = textColor.glColor();
            //let fillStyle = "rgba(0.5, 0.5, 0.5, 0.5)";
            let fillStyle = "rgba(" + textColor.r + "," + textColor.g + ","+ textColor.b + "," + textColor.glAlpha() + ")";

            if (scope.Visible && scope.Loaded) {

                //라인 위치 데이터 수집
                groundLinesPosition = [];
                groundLinesPosition[0] = [];
                groundLinesPosition[1] = [];
                let xLinesNum = 0;
                let yLinesNum = 0;

                //gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.DEPTH_TEST);
                gl.depthMask(true);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

                const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
                const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

                let drawPlaneTest = ()=>
                {
                    //gl
                    if(bufferClear) {
                        view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC2D);
                        view.Shader.SetMatrix(matMVP, matMVMatrix);
                        //view.Shader.SetGLLight();
                        view.Shader.SetClipping(undefined);

                        if (groundPlaneXYLineColor === undefined)
                            view.Shader.SetGLColor(1.0, 1.0, 1.0, 1.0);
                        else {
                            let GLColor = groundPlaneXYLineColor.glColor();
                            view.Shader.SetGLColor(GLColor.r, GLColor.g, GLColor.b, GLColor.a);
                        }
                    }
                    
                    let fSideOffset = 5;
                    let gridMinWidth = 60;
                    let stepMulValue = 2;
                    let strokeLineStepValue = 5;
                    let m_bFrameShowPosInverse = false;
                    let m_bShowMarineFrameXYPlane = true;
                    let m_bShowMarineFrameZXPlane = true;
                    let m_bShowMarineFrameYZPlane = true;
                    let m_bShowMarineFrameAllStep = true;
                    let m_bShowMarineFrame_SECTION = true;
                    let m_bShowMarineFrame_ELEVATION = true;
                    let m_bShowMarineFrame_PLAN = true;
                    let m_bShowMarineFrameNumber = true;
                    let m_bShowMarineFrameLineOddNumber = true;
                    let m_bShowMarineFrameLineEvenNumber = true;
                    let bbox = new VIZCore.BBox().copy(bbox_frame);

                    let drawMax = 30000; //65024
                    let linePositionNum = 0;
                    let position = [];
                    let lineStrokePositionNum = 0;
                    let positionStroke = [];
        
                    // 바운드 박스 그린다
                    // float expandRatio = 1.3f;
                    // CRMVertex3<float> vCenter = (pLib->m_Camera.m_vModelBBMin + pLib->m_Camera.m_vModelBBMax)/2.0f;
                    // CRMVertex3<float> vMin = vCenter + (pLib->m_Camera.m_vModelBBMin - vCenter)*expandRatio;
                    // CRMVertex3<float> vMax = vCenter + (pLib->m_Camera.m_vModelBBMax - vCenter)*expandRatio;
                    let expandRatio = 1;
                    let vCenter = new VIZCore.Vector3().copy(bbox.center);
                    let vTmp1 = new VIZCore.Vector3().subVectors(bbox.min, vCenter).multiplyScalar(expandRatio);
                    let vTmp2 = new VIZCore.Vector3().subVectors(bbox.max, vCenter).multiplyScalar(expandRatio);
                    let vMin = new VIZCore.Vector3().addVectors(vCenter, vTmp1);
                    let vMax = new VIZCore.Vector3().addVectors(vCenter, vTmp2);
                    //let radius = bbox.radius;
                    let radius = bbox.min.z;
        
                    let v1 = new VIZCore.Vector3();
                    let v2 = new VIZCore.Vector3();
                    let matrix = new VIZCore.Matrix4().copy(view.Camera.matMVP);
                    let vPoly = [];
                    // xy 평면 그린다
                    if( m_bShowMarineFrameXYPlane )
                    {
                        //v1 = pLib->m_Camera.m_vModelCenter;
                        v1 = new VIZCore.Vector3().copy(bbox.center);
                        //v2 = v1; 
                        v2 = new VIZCore.Vector3().copy(v1);
                        //v2.z += pLib->m_Camera.m_fModelRadius;
                        v2.z += radius;
                
                        // 2D Pos
                        //v1 = pLib->m_Camera.World2Screen( v1 );
                        v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                        //v2 = pLib->m_Camera.World2Screen( v2 );
                        v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                        //let z = 0.0;
                        let z = bbox.min.z;
                        
                        // if( m_bFrameShowPosInverse )
                        // {
                        //     if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                        //         z = vMin.z;
                        //     else
                        //         z = vMax.z;
                        // }
                        // else
                        //     z = vMin.z;
                
                        //vPoly[0] = vPoly[4] = CRMVertex3<float>( vMin.x, vMin.y, z );
                        vPoly[0] = vPoly[4] = new VIZCore.Vector3(vMin.x, vMin.y, z);
                        //vPoly[1] = CRMVertex3<float>( vMax.x, vMin.y, z );
                        vPoly[1] = new VIZCore.Vector3( vMax.x, vMin.y, z );
                        //vPoly[2] = CRMVertex3<float>( vMax.x, vMax.y, z );
                        vPoly[2] = new VIZCore.Vector3( vMax.x, vMax.y, z );
                        //vPoly[3] = CRMVertex3<float>( vMin.x, vMax.y, z );
                        vPoly[3] = new VIZCore.Vector3( vMin.x, vMax.y, z );
                        
                        //Render3DPolyline( vPoly, 5, 1.0f, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                        for(let k = 0; k < vPoly.length ; k++) {
                            if(k === 0)
                            {
                                continue;
                            }
                            position[linePositionNum + 0] = vPoly[k-1].x;
                            position[linePositionNum + 1] = vPoly[k-1].y;
                            position[linePositionNum + 2] = vPoly[k-1].z;
                            linePositionNum += 3;
                            position[linePositionNum + 0] = vPoly[k].x;
                            position[linePositionNum + 1] = vPoly[k].y;
                            position[linePositionNum + 2] = vPoly[k].z;
                            linePositionNum += 3;

                            
                        }

                        let m_frameXAxisNum = 0;
                        if(scope.Info.Items[0] !== undefined && scope.Info.Items[0].items.length > 0)
                            m_frameXAxisNum = scope.Info.Items[0].items.length;

                        if(m_bShowMarineFrame_SECTION && m_frameXAxisNum)
                        {
                            let m_pFrameXAxis = scope.Info.Items[0].items;
                            
                            vPoly = [];
                            v1 = new VIZCore.Vector3().copy(bbox.center);
                            v2 = new VIZCore.Vector3().copy(v1);
                            v2.y += radius;
                    
                            // 2D Pos
                            v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                            v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                            let y = 0.0;
                            let changeDir = false;
                            if (v1.z > v2.z)
                            {
                                y = vMax.y + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                changeDir = true;
                            }
                            else
                            {
                                y = vMin.y - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            }
                            
                            let step = 1;
                            let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[0].offset,y, z ) );
                            let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[m_frameXAxisNum-1].offset,y, z ) );
                            vTest1.z = vTest2.z = 0.0;
                            let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                            while( step < m_frameXAxisNum )
                            {
                                if( fLength/m_frameXAxisNum*step > gridMinWidth )
                                    break;
                                step *= stepMulValue;
                            }
                
                            if (m_bShowMarineFrameAllStep)
                                step = 1;

                            let lscnt = 0;
                            if (step < m_frameXAxisNum)
                            for( let i=0 ; i<m_frameXAxisNum ; i+=step )
                            {
                                if( m_pFrameXAxis[i].offset < vMin.x || m_pFrameXAxis[i].offset > vMax.x )
                                continue;
            
                                lscnt++;
                                if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                   continue;
                                if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                   continue;
                                
                                vPoly[0] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,vMin.y, z );
                                vPoly[1] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,vMax.y, z );

                                let vDir = undefined;

                                let text = undefined;
                                if(m_bShowMarineFrameNumber)
                                {
                                    text = scope.Info.Items[0].label + " " + m_pFrameXAxis[i].id + "";
                                }
                                else
                                {
                                    text = m_pFrameXAxis[i].offset + "";                                    
                                }

                                if(showCustomLabel)
                                {
                                    text =  m_pFrameXAxis[i].label;
                                }
                                if(changeDir)
                                {
                                    vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                    vDir.normalize();
                                    renderText(context, vPoly[1], vDir, text, 0,fillStyle);
                                }
                                else
                                {
                                    vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                    vDir.normalize();
                                    renderText(context, vPoly[0], vDir, text, 0,fillStyle);
                                }

                                if( i%(step*strokeLineStepValue) != 0 )
                                {
                                    //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                    for(let k = 0; k < vPoly.length ; k++) {
                                        if(k === 0)
                                        {
                                            continue;
                                        }
                                        position[linePositionNum + 0] = vPoly[k-1].x;
                                        position[linePositionNum + 1] = vPoly[k-1].y;
                                        position[linePositionNum + 2] = vPoly[k-1].z;
                                        linePositionNum += 3;
                                        position[linePositionNum + 0] = vPoly[k].x;
                                        position[linePositionNum + 1] = vPoly[k].y;
                                        position[linePositionNum + 2] = vPoly[k].z;
                                        linePositionNum += 3;
                                    }
                                }
                                else
                                {
                                    //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                    for(let k = 0; k < vPoly.length ; k++) {
                                        if(k === 0)
                                        {
                                            continue;
                                        }
                                        positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                        positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                        positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                        lineStrokePositionNum += 3;
                                        positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                        positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                        positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                        lineStrokePositionNum += 3;
                                    }
                                }
                                    
                            }
                        }

                        let m_frameYAxisNum = 0;
                        if(scope.Info.Items[1] !== undefined && scope.Info.Items[1].items.length > 0)
                            m_frameYAxisNum = scope.Info.Items[1].items.length;
                            
                        if(m_bShowMarineFrame_ELEVATION && m_frameYAxisNum)
                        {
                            let m_pFrameYAxis = scope.Info.Items[1].items;
                            
                            vPoly = [];
                            v1 = new VIZCore.Vector3().copy(bbox.center);
                            v2 = new VIZCore.Vector3().copy(v1);
                            v2.x += radius;
                    
                            // 2D Pos
                            v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                            v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                            let x = 0.0;
                            let changeDir = false;
                            if (v1.z > v2.z){
                                x = vMax.x + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                changeDir = true;
                            }
                            else
                                x = vMin.x - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                            
                            let step = 1;
                            let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[0].offset, z ) );
                            let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[m_frameYAxisNum-1].offset, z ) );
                            vTest1.z = vTest2.z = 0.0;
                            let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                            while( step < m_frameYAxisNum )
                            {
                                if( fLength/m_frameYAxisNum*step > gridMinWidth )
                                    break;
                                step *= stepMulValue;
                            }
                
                            if (m_bShowMarineFrameAllStep)
                                step = 1;

                            let lscnt = 0;
                            if (step < m_frameYAxisNum)
                            for( let i=0 ; i<m_frameYAxisNum ; i+=step )
                            {
                                if( m_pFrameYAxis[i].offset < vMin.y || m_pFrameYAxis[i].offset > vMax.y )
                                continue;
            
                                lscnt++;
                                if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                   continue;
                                if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                   continue;
                                
                                vPoly[0] = new VIZCore.Vector3( vMin.x, m_pFrameYAxis[i].offset, z );
                                vPoly[1] = new VIZCore.Vector3( vMax.x, m_pFrameYAxis[i].offset, z );

                                let text = undefined;
                                if(m_bShowMarineFrameNumber)
                                {
                                    text = scope.Info.Items[1].label + " " + m_pFrameYAxis[i].id + "";
                                }
                                else
                                {
                                    text = m_pFrameYAxis[i].offset + "";                                    
                                }

                                if(showCustomLabel)
                                {
                                    text =  m_pFrameYAxis[i].label;
                                }

                                let vDir = undefined;
                                if(changeDir)
                                {
                                    vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                    vDir.normalize();
                                    renderText(context, vPoly[1], vDir, text, 0,fillStyle);
                                }
                                else
                                {
                                    vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                    vDir.normalize();
                                    renderText(context, vPoly[0], vDir, text, 0,fillStyle);
                                }

                                

                                if( i%(step*strokeLineStepValue) != 0 )
                                {
                                    //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                    for(let k = 0; k < vPoly.length ; k++) {
                                        if(k === 0)
                                        {
                                            continue;
                                        }
                                        position[linePositionNum + 0] = vPoly[k-1].x;
                                        position[linePositionNum + 1] = vPoly[k-1].y;
                                        position[linePositionNum + 2] = vPoly[k-1].z;
                                        linePositionNum += 3;
                                        position[linePositionNum + 0] = vPoly[k].x;
                                        position[linePositionNum + 1] = vPoly[k].y;
                                        position[linePositionNum + 2] = vPoly[k].z;
                                        linePositionNum += 3;
                                    }
                                }
                                else
                                {
                                    //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                    for(let k = 0; k < vPoly.length ; k++) {
                                        if(k === 0)
                                        {
                                            continue;
                                        }
                                        positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                        positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                        positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                        lineStrokePositionNum += 3;
                                        positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                        positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                        positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                        lineStrokePositionNum += 3;
                                    }
                                }
                                    
                            }
                        }
                    }

                    if(false){
                        // xz 평면 그린다
                        if( m_bShowMarineFrameZXPlane )
                        {
                            vPoly = [];
                            //v1 = pLib->m_Camera.m_vModelCenter;
                            v1 = new VIZCore.Vector3().copy(bbox.center);
                            //v2 = v1; 
                            v2 = new VIZCore.Vector3().copy(v1);
                            //v2.x += pLib->m_Camera.m_fModelRadius;
                            v2.y += radius;
                    
                            // 2D Pos
                            //v1 = pLib->m_Camera.World2Screen( v1 );
                            v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                            //v2 = pLib->m_Camera.World2Screen( v2 );
                            v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                            let y = 0.0;
                            
                            if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                                y = vMin.y;
                            else
                                y = vMax.y;
                    
                            vPoly[0] = vPoly[4] = new VIZCore.Vector3(vMin.x, y, vMin.z);
                            vPoly[1] = new VIZCore.Vector3( vMax.x, y, vMin.z );
                            vPoly[2] = new VIZCore.Vector3( vMax.x, y, vMax.z );
                            vPoly[3] = new VIZCore.Vector3( vMin.x, y, vMax.z );
                            
                            for(let k = 0; k < vPoly.length ; k++) {
                                if(k === 0)
                                {
                                    continue;
                                }
                                position[linePositionNum + 0] = vPoly[k-1].x;
                                position[linePositionNum + 1] = vPoly[k-1].y;
                                position[linePositionNum + 2] = vPoly[k-1].z;
                                linePositionNum += 3;
                                position[linePositionNum + 0] = vPoly[k].x;
                                position[linePositionNum + 1] = vPoly[k].y;
                                position[linePositionNum + 2] = vPoly[k].z;
                                linePositionNum += 3;
                            }


                            let m_frameZAxisNum = 0;
                            if(scope.Info.Items[2] !== undefined && scope.Info.Items[2].items.length > 0)
                                m_frameZAxisNum = scope.Info.Items[2].items.length;
                            if(m_bShowMarineFrame_PLAN && m_frameZAxisNum > 0)
                            {
                                let m_pFrameZAxis = scope.Info.Items[2].items;
                                
                                vPoly = [];
                                v1 = new VIZCore.Vector3().copy(bbox.center);
                                v2 = new VIZCore.Vector3().copy(v1);
                                v2.x += radius;
                        
                                // 2D Pos
                                v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                                v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                                let x = 0.0;
                                let changeDir = false;
                                if (v1.z > v2.z)
                                {
                                    x = vMax.x + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                    changeDir = true;
                                }
                                else
                                    x = vMin.x - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                
                                let step = 1;
                                let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[0].offset ) );
                                let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[m_frameZAxisNum-1].offset ) );
                                vTest1.z = vTest2.z = 0.0;
                                let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                                while( step < m_frameZAxisNum )
                                {
                                    if( fLength/m_frameZAxisNum*step > gridMinWidth )
                                        break;
                                    step *= stepMulValue;
                                }
                    
                                if (m_bShowMarineFrameAllStep)
                                    step = 1;

                                let lscnt = 0;
                                if (step < m_frameZAxisNum)
                                for( let i=0 ; i<m_frameZAxisNum ; i+=step )
                                {
                                    if( m_pFrameZAxis[i].offset < vMin.z || m_pFrameZAxis[i].offset > vMax.z )
                                    continue;
                
                                    lscnt++;
                                    if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                    continue;
                                    if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                    continue;
                                    
                                    vPoly[0] = new VIZCore.Vector3( vMin.x, y, m_pFrameZAxis[i].offset);
                                    vPoly[1] = new VIZCore.Vector3( vMax.x, y, m_pFrameZAxis[i].offset);

                                    let text = undefined;
                                    if(m_bShowMarineFrameNumber)
                                    {
                                        text = scope.Info.Items[2].label + " " + m_pFrameZAxis[i].id + "";
                                    }
                                    else
                                    {
                                        text = m_pFrameZAxis[i].offset + "";                                    
                                    }

                                    if(showCustomLabel)
                                    {
                                        text =  m_pFrameZAxis[i].label;
                                    }

                                    let vDir = undefined;
                                    if(changeDir)
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                        vDir.normalize();
                                        renderText(context, vPoly[1], vDir, text, -10);
                                    }
                                    else
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                        vDir.normalize();
                                        renderText(context, vPoly[0], vDir, text, -10);
                                    }



                                    if( i%(step*strokeLineStepValue) != 0 )
                                    {
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            position[linePositionNum + 0] = vPoly[k-1].x;
                                            position[linePositionNum + 1] = vPoly[k-1].y;
                                            position[linePositionNum + 2] = vPoly[k-1].z;
                                            linePositionNum += 3;
                                            position[linePositionNum + 0] = vPoly[k].x;
                                            position[linePositionNum + 1] = vPoly[k].y;
                                            position[linePositionNum + 2] = vPoly[k].z;
                                            linePositionNum += 3;
                                        }
                                    }
                                    else
                                    {
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                            lineStrokePositionNum += 3;
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                            lineStrokePositionNum += 3;
                                        }
                                    }
                                        
                                }
                            }

                            let m_frameXAxisNum = 0;
                            if(scope.Info.Items[0] !== undefined && scope.Info.Items[0].items.length > 0)
                                m_frameXAxisNum = scope.Info.Items[0].items.length;
                            if(m_bShowMarineFrame_SECTION && m_frameXAxisNum)
                            {
                                let m_pFrameXAxis = scope.Info.Items[0].items;
                                
                                vPoly = [];
                                v1 = new VIZCore.Vector3().copy(bbox.center);
                                v2 = new VIZCore.Vector3().copy(v1);
                                v2.z += radius;
                        
                                // 2D Pos
                                v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                                v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                                let z = vMax.z + fSideOffset;
                                
                                let step = 1;
                                let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[0].offset,y, z ) );
                                let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( m_pFrameXAxis[m_frameXAxisNum-1].offset,y, z ) );
                                vTest1.z = vTest2.z = 0.0;
                                let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                                while( step < m_frameXAxisNum )
                                {
                                    if( fLength/m_frameXAxisNum*step > gridMinWidth )
                                        break;
                                    step *= stepMulValue;
                                }
                    
                                if (m_bShowMarineFrameAllStep)
                                    step = 1;

                                let lscnt = 0;
                                if (step < m_frameXAxisNum)
                                for( let i=0 ; i<m_frameXAxisNum ; i+=step )
                                {
                                    if( m_pFrameXAxis[i].offset < vMin.x || m_pFrameXAxis[i].offset > vMax.x )
                                    continue;
                
                                    lscnt++;
                                    if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                    continue;
                                    if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                    continue;
                                    
                                    vPoly[0] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,y, vMin.z );
                                    vPoly[1] = new VIZCore.Vector3(  m_pFrameXAxis[i].offset,y, vMax.z );

                                    let text = undefined;
                                    if(m_bShowMarineFrameNumber)
                                    {
                                        text = scope.Info.Items[0].label + " " + m_pFrameXAxis[i].id + "";
                                    }
                                    else
                                    {
                                        text = m_pFrameXAxis[i].offset + "";                                    
                                    }

                                    if(showCustomLabel)
                                    {
                                        text =  m_pFrameXAxis[i].label;
                                    }

                                    let vDir = undefined;
                                    if(true)
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                        vDir.normalize();
                                        renderText(context, vPoly[1], vDir, text);
                                    }
                                    // else
                                    // {
                                    //     vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                    //     vDir.normalize();
                                    //     renderText(context, vPoly[0], vDir, m_pFrameXAxis[i].offset + "");
                                    // }

                                    if( i%(step*strokeLineStepValue) != 0 )
                                    {
                                        //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            position[linePositionNum + 0] = vPoly[k-1].x;
                                            position[linePositionNum + 1] = vPoly[k-1].y;
                                            position[linePositionNum + 2] = vPoly[k-1].z;
                                            linePositionNum += 3;
                                            position[linePositionNum + 0] = vPoly[k].x;
                                            position[linePositionNum + 1] = vPoly[k].y;
                                            position[linePositionNum + 2] = vPoly[k].z;
                                            linePositionNum += 3;
                                        }
                                    }
                                    else
                                    {
                                        //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                            lineStrokePositionNum += 3;
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                            lineStrokePositionNum += 3;
                                        }
                                    }
                                        
                                }
                            }
                        }

                        // yz 평면 그린다
                        if( m_bShowMarineFrameYZPlane )
                        {
                            vPoly = [];
                            //v1 = pLib->m_Camera.m_vModelCenter;
                            v1 = new VIZCore.Vector3().copy(bbox.center);
                            //v2 = v1; 
                            v2 = new VIZCore.Vector3().copy(v1);
                            //v2.x += pLib->m_Camera.m_fModelRadius;
                            v2.x += radius;
                    
                            // 2D Pos
                            //v1 = pLib->m_Camera.World2Screen( v1 );
                            v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                            //v2 = pLib->m_Camera.World2Screen( v2 );
                            v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                            let x = 0.0;
                            
                            if( (v1.z > v2.z && !m_bFrameShowPosInverse) || (v1.z < v2.z && m_bFrameShowPosInverse) )
                                x = vMin.x;
                            else
                                x = vMax.x;
                    
                            vPoly[0] = vPoly[4] = new VIZCore.Vector3(x, vMin.y, vMin.z);
                            vPoly[1] = new VIZCore.Vector3( x, vMax.y, vMin.z );
                            vPoly[2] = new VIZCore.Vector3( x, vMax.y, vMax.z );
                            vPoly[3] = new VIZCore.Vector3( x, vMin.y, vMax.z );
                            
                            for(let k = 0; k < vPoly.length ; k++) {
                                if(k === 0)
                                {
                                    continue;
                                }
                                position[linePositionNum + 0] = vPoly[k-1].x;
                                position[linePositionNum + 1] = vPoly[k-1].y;
                                position[linePositionNum + 2] = vPoly[k-1].z;
                                linePositionNum += 3;
                                position[linePositionNum + 0] = vPoly[k].x;
                                position[linePositionNum + 1] = vPoly[k].y;
                                position[linePositionNum + 2] = vPoly[k].z;
                                linePositionNum += 3;
                            }

                            let m_frameZAxisNum = 0;
                            if(scope.Info.Items[2] !== undefined && scope.Info.Items[2].items.length > 0)
                                m_frameZAxisNum = scope.Info.Items[2].items.length;
                            if(m_bShowMarineFrame_PLAN && m_frameZAxisNum > 0)
                            {
                                let m_pFrameZAxis = scope.Info.Items[2].items;
                                
                                vPoly = [];
                                v1 = new VIZCore.Vector3().copy(bbox.center);
                                v2 = new VIZCore.Vector3().copy(v1);
                                v2.y += radius;
                        
                                // 2D Pos
                                v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                                v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                                let y = 0.0;
                                let changeDir = false;
                                if (v1.z > v2.z)
                                {
                                    y = vMax.y + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                    changeDir = true;
                                }
                                else
                                    y = vMin.y - fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                
                                let step = 1;
                                let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[0].offset ) );
                                let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, y, m_pFrameZAxis[m_frameZAxisNum-1].offset ) );
                                vTest1.z = vTest2.z = 0.0;
                                let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                                while( step < m_frameZAxisNum )
                                {
                                    if( fLength/m_frameZAxisNum*step > gridMinWidth )
                                        break;
                                    step *= stepMulValue;
                                }
                    
                                if (m_bShowMarineFrameAllStep)
                                    step = 1;

                                let lscnt = 0;
                                if (step < m_frameZAxisNum)
                                for( let i=0 ; i<m_frameZAxisNum ; i+=step )
                                {
                                    if( m_pFrameZAxis[i].offset < vMin.z || m_pFrameZAxis[i].offset > vMax.z )
                                    continue;
                
                                    lscnt++;
                                    if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                    continue;
                                    if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                    continue;
                                    
                                    vPoly[0] = new VIZCore.Vector3( x, vMin.y, m_pFrameZAxis[i].offset);
                                    vPoly[1] = new VIZCore.Vector3( x, vMax.y, m_pFrameZAxis[i].offset);

                                    let text = undefined;
                                    if(m_bShowMarineFrameNumber)
                                    {
                                        text = scope.Info.Items[2].label + " " + m_pFrameZAxis[i].id + "";
                                    }
                                    else
                                    {
                                        text = m_pFrameZAxis[i].offset + "";                                    
                                    }

                                    if(showCustomLabel)
                                    {
                                        text =  m_pFrameZAxis[i].label;
                                    }

                                    let vDir = undefined;
                                    if(changeDir)
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                        vDir.normalize();
                                        renderText(context, vPoly[1], vDir, text, -10);
                                    }
                                    else
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[0], vPoly[1]);
                                        vDir.normalize();
                                        //if(i === 0)
                                            renderText(context, vPoly[0], vDir, text, -10);
                                        //else
                                        //    renderText(context, vPoly[0], vDir, text);
                                    }

                                    if( i%(step*strokeLineStepValue) != 0 )
                                    {
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            position[linePositionNum + 0] = vPoly[k-1].x;
                                            position[linePositionNum + 1] = vPoly[k-1].y;
                                            position[linePositionNum + 2] = vPoly[k-1].z;
                                            linePositionNum += 3;
                                            position[linePositionNum + 0] = vPoly[k].x;
                                            position[linePositionNum + 1] = vPoly[k].y;
                                            position[linePositionNum + 2] = vPoly[k].z;
                                            linePositionNum += 3;
                                        }
                                    }
                                    else
                                    {
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                            lineStrokePositionNum += 3;
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                            lineStrokePositionNum += 3;
                                        }
                                    }
                                        
                                }
                            }

                            let m_frameYAxisNum = 0;
                            if(scope.Info.Items[1] !== undefined && scope.Info.Items[1].items.length > 0)
                                m_frameYAxisNum = scope.Info.Items[1].items.length;
                                
                            if(m_bShowMarineFrame_ELEVATION && m_frameYAxisNum)
                            {
                                let m_pFrameYAxis = scope.Info.Items[1].items;
                                
                                vPoly = [];
                                v1 = new VIZCore.Vector3().copy(bbox.center);
                                v2 = new VIZCore.Vector3().copy(v1);
                                v2.z += radius;
                        
                                // 2D Pos
                                v1 = view.Camera.world2ScreenWithMatrix(matrix, v1);
                                v2 = view.Camera.world2ScreenWithMatrix(matrix, v2);
                                let z = 0.0;
                                z = vMax.z + fSideOffset;// pLib->m_Camera.m_fModelRadius / 30.0f;
                                
                                let step = 1;
                                let vTest1 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[0].offset, z ) );
                                let vTest2 = view.Camera.world2ScreenWithMatrix(matrix, new VIZCore.Vector3( x, m_pFrameYAxis[m_frameYAxisNum-1].offset, z ) );
                                vTest1.z = vTest2.z = 0.0;
                                let fLength = new VIZCore.Vector3().subVectors(vTest2 , vTest1).length();
                                while( step < m_frameYAxisNum )
                                {
                                    if( fLength/m_frameYAxisNum*step > gridMinWidth )
                                        break;
                                    step *= stepMulValue;
                                }
                    
                                if (m_bShowMarineFrameAllStep)
                                    step = 1;

                                let lscnt = 0;
                                if (step < m_frameYAxisNum)
                                for( let i=0 ; i<m_frameYAxisNum ; i+=step )
                                {
                                    if( m_pFrameYAxis[i].offset < vMin.y || m_pFrameYAxis[i].offset > vMax.y )
                                    continue;
                
                                    lscnt++;
                                    if( !m_bShowMarineFrameLineOddNumber && lscnt%2 )
                                    continue;
                                    if( !m_bShowMarineFrameLineEvenNumber && !(lscnt%2) )
                                    continue;
                                    
                                    vPoly[0] = new VIZCore.Vector3( x, m_pFrameYAxis[i].offset, vMin.z );
                                    vPoly[1] = new VIZCore.Vector3( x, m_pFrameYAxis[i].offset, vMax.z );

                                    let text = undefined;
                                    if(m_bShowMarineFrameNumber)
                                    {
                                        text = scope.Info.Items[1].label + " " + m_pFrameYAxis[i].id + "";
                                    }
                                    else
                                    {
                                        text = m_pFrameYAxis[i].offset + "";                                    
                                    }

                                    if(showCustomLabel)
                                    {
                                        text =  m_pFrameYAxis[i].label;
                                    }

                                    let vDir = undefined;
                                    if(true)
                                    {
                                        vDir = new VIZCore.Vector3().subVectors(vPoly[1], vPoly[0]);
                                        vDir.normalize();
                                        renderText(context, vPoly[1], vDir, text, 15);
                                    }

                                    if( i%(step*strokeLineStepValue) != 0 )
                                    {
                                        //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 0.3f ) );
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            position[linePositionNum + 0] = vPoly[k-1].x;
                                            position[linePositionNum + 1] = vPoly[k-1].y;
                                            position[linePositionNum + 2] = vPoly[k-1].z;
                                            linePositionNum += 3;
                                            position[linePositionNum + 0] = vPoly[k].x;
                                            position[linePositionNum + 1] = vPoly[k].y;
                                            position[linePositionNum + 2] = vPoly[k].z;
                                            linePositionNum += 3;
                                        }
                                    }
                                    else
                                    {
                                        //Render3DPolyline( vPoly, 2, 1.0, CRMColor4<float>( colR, colG, colB, 1.0f ) );
                                        for(let k = 0; k < vPoly.length ; k++) {
                                            if(k === 0)
                                            {
                                                continue;
                                            }
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k-1].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k-1].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k-1].z;
                                            lineStrokePositionNum += 3;
                                            positionStroke[lineStrokePositionNum + 0] = vPoly[k].x;
                                            positionStroke[lineStrokePositionNum + 1] = vPoly[k].y;
                                            positionStroke[lineStrokePositionNum + 2] = vPoly[k].z;
                                            lineStrokePositionNum += 3;
                                        }
                                    }
                                        
                                }
                            }
                        }
                    }

                    //gl
                    if(bufferClear)
                    {
                        let positionBuffer = undefined;
                        

                        positionBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
                        
                        let color = new VIZCore.Color(255, 255, 255, 255).glColor();
                        if(groundPlaneXYLineColor !== undefined)
                            color = groundPlaneXYLineColor.glColor();

                        view.Shader.SetGLColor(color.r, color.g, color.b, color.a);

                        if (linePositionNum > 0) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

                            gl.drawArrays(gl.LINES, 0, linePositionNum / 3);
                        }

                        gl.deleteBuffer(positionBuffer);

                        positionBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

                        color = new VIZCore.Color(255, 0, 0, 255).glColor();
                        if(groundPlaneXYLineColor !== undefined)
                            color = groundPlaneXYLineColor.glColor();
                        view.Shader.SetGLColor(color.r, color.g, color.b, color.a);

                        if (lineStrokePositionNum > 0) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionStroke), gl.STATIC_DRAW);

                            gl.drawArrays(gl.LINES, 0, lineStrokePositionNum / 3);
                        }

                        gl.deleteBuffer(positionBuffer);

                        view.Shader.EndShader();
                    }
                };

                drawPlaneTest();
                
                //gl.disable(gl.DEPTH_TEST);
            }
        };



        
        /**
         * 지정 축의 그리드 리스트 반환
         * @param {VIZCore.Enum.Axis} nAxis 
         * @returns {Object}
         */
         this.GetGridItem = (nAxis) => {
            let gridItems = undefined;
            if(nAxis === VIZCore.Enum.Axis.X) {
                if(scope.Info.Items[0])
                    gridItems = scope.Info.Items[0];
            }
            else if(nAxis === VIZCore.Enum.Axis.Y) {
                if(scope.Info.Items[1])
                    gridItems = scope.Info.Items[1];
            }
            else if(nAxis === VIZCore.Enum.Axis.Z) {
                if(scope.Info.Items[2])
                    gridItems = scope.Info.Items[2];
            }
            return gridItems;
        };

        /**
         * 가장 가까운 Grid 반환
         * @param {VIZCore.Enum.Axis} nAxis 
         * @param {number} point 
         */
        this.GetSnap = (nAxis, point) => {
            
            let griditem = this.GetGridItem(nAxis);

            if(griditem === undefined) {
                return undefined;
            }

            let items = griditem.items;
            
            let minidx = -1;
            let maxidx = -1;

            let minDistIdx = -1;
            let minDist = 0;            

            for(let i = 0, iLen = items.length ; i < iLen ; i++ ) {
                if(i === 0) {
                    minidx = i;
                    maxidx = i;

                    minDistIdx = i;
                    minDist = point - items[minDistIdx].offset;
                }
                else {
                    if(items[i].offset < items[minidx].offset)
                        minidx = i;
                    if(items[i].offset > items[maxidx].offset)
                        maxidx = i;

                    let current = point - items[i].offset;
                    if(current < minDist) {
                        minDist = current;
                        minDistIdx = i;
                    }
                }
            }

            if(minidx >= 0 && point <= items[minidx].offset)
                return items[minidx];

            if(maxidx >= 0 && point >= items[maxidx].offset)
                return items[maxidx];

            if(minDistIdx < 0) return undefined;

            return items[minDistIdx];
        };

          /**
         * 지정 위치에서 가장 가까운 그리드 정보 반환
         * @param {VIZCore.Enum.Axis} nAxis 축
         * @param {Number} point 좌표
         * @return {*} 그리드 반환 (찾기 실패시 undefined)
         */
           this.GetSnapItem = (nAxis, point) => {
            let item = scope.GetSnap(nAxis, point);
            if(item === undefined)
                return undefined;

            let szLabel = item.label;

            if(!scope.GetShowCustomLabel()) {
                let gridItem = scope.GetGridItem(nAxis);

                szLabel = gridItem.label + " " + szLabel;
            }

            return {
                Axis : nAxis,
                GridID : item.id,
                Label : szLabel,
                Offset : point - item.offset
            };
        };  

        /**
         * 지정 위치의 가장 가까운 좌표계 위치 표시 형식(FR23+100)으로 반환
         * @param {VIZCore.Enum.Axis} nAxis 축
         * @param {number} point 좌표
         * @return {string} 텍스트 반환 (찾기 실패시 undefined)
         */
        this.GetSnapLabel = (nAxis, point) => {
            let item = this.GetSnap(nAxis, point);
            if(item === undefined)
                return undefined;
                   
            let griditem = this.GetGridItem(nAxis);

            if(griditem === undefined) {
                return undefined;
            }

            if(showCustomLabel) {
                return item.label;
            }
            else {
                return griditem.label + " " + item.label;
            }
                
        };

        /**
         * 그리드 설정한 라벨 표시 설정
         * @param {boolean} bShow 
         */
        this.SetShowCustomLabel = (bShow) => {
            showCustomLabel = bShow;
        };

        /**
         * 그리드 설정한 라벨 표시 설정
         * @returns {boolean} 
         */
        this.GetShowCustomLabel = () => {
            return showCustomLabel;
        };

    }
}

export default Grid;