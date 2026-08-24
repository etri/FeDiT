VIZWeb3D.Animation = function (VIEW) {
    var scope = this;
    var view = VIEW;

    var _AnimationList = [];
    var currentID = 0;
    var timeCurrent; 
    var timeStart;
    var timeLooplessStart;
    var timePlay; 
    var timeRepeat = 12;

    var AnimationItem = function () {
        var item = {
            ID: currentID,
            Transform: {
                Move: new THREE.Vector3(),
                Rotate: new THREE.Vector3(),
                UsePoint: false,
                Point: new THREE.Vector3()
            },
            Action: {
                Visible: true,
                Color: { r: 255, g: 0, b: 0, a: 1.0 },
                UseColor : false
            },
            Base: {
                Move: new THREE.Vector3(),
                Rotate: new THREE.Vector3(),
                Point: new THREE.Vector3(),
            },
            Time: {
                Start: 0,
                End : 0
            },
            Status: 0,
            ZeroBase: false,
            Mesh: {
                ID: null,
                Item : null
            },
        };
        return item;
    };

    // 애니메이션 재생
    var AnimationPlay = null;
    var _OffetMap = new Map();
    var bInit = false;

    var objectList = [];

    function Init() {
        if (bInit)
            return;

        var offRobot = 0;
        // Box
        for (var i = 0; i < view.Control.Model.AnimationObject.children.length; i++) {
            var mesh = view.Control.Model.AnimationObject.children[i];//.children[0];
            if (mesh.name.localeCompare("box") === 0)
                scope.AddAnimation(i / 2, mesh);
            else {
                scope.AddAnimation_Arm(offRobot, mesh);
                objectList.push(mesh);
            }
        }

        timeRepeat = scope.PlayTime();
        bInit = true;
    }

    this.Add = function (start, end, move, rotate, zero, mesh, usecolor, color) {
        var animation = AnimationItem();
        animation.Time.Start = start;
        animation.Time.End = end;
        animation.Transform.Move = new THREE.Vector3().copy(move);
        animation.Transform.Rotate = new THREE.Vector3().copy(rotate);
        animation.ZeroBase = zero;
        animation.Mesh.ID = mesh.uuid;
        animation.Mesh.Item = mesh;
        animation.Base.Move = new THREE.Vector3().copy(mesh.position);
        animation.Base.Rotate = new THREE.Vector3().copy(mesh.rotation);
        if (usecolor !== undefined && color !== undefined) {
            animation.Action.UseColor = usecolor;
            animation.Action.Color = color;
        }
        _AnimationList.push(animation);
        currentID++;
    };

    this.Add_Offset = function (start, end, move, rotate, zero, mesh, useOffset, offset) {
        var animation = AnimationItem();
        animation.Time.Start = start;
        animation.Time.End = end;
        animation.Transform.Move = new THREE.Vector3().copy(move);
        animation.Transform.Rotate = new THREE.Vector3().copy(rotate);
        animation.ZeroBase = zero;
        animation.Mesh.ID = mesh.uuid;
        animation.Mesh.Item = mesh;
        animation.Base.Move = new THREE.Vector3().copy(mesh.position);
        animation.Base.Rotate = new THREE.Vector3().copy(mesh.rotation);
        if (useOffset !== undefined && offset !== undefined) {
            animation.Transform.UsePoint = useOffset;
            animation.Transform.Point = offset;
        }
        _AnimationList.push(animation);
        currentID++;
    };

    this.AddAnimation = function (offset, mesh) {
        mesh.geometry.center();
        //mesh.position.copy(center);
        mesh.position.set(-113035.43, -7556.23, 1231.27);
        scope.Add(offset + 0, offset + 1, new THREE.Vector3(0, 1583.23, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 1, offset + 1.5, new THREE.Vector3(344.94, 812.89, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 1.5, offset + 2, new THREE.Vector3(999.75, 300.94, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 1, offset + 2, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -90), false, mesh);

        scope.Add(offset + 2, offset + 5, new THREE.Vector3(7801.94, 0, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 5, offset + 5.5, new THREE.Vector3(856.12, 270.56, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 5.5, offset + 6, new THREE.Vector3(320.89, 908.23, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 5, offset + 6, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 90), false, mesh);

        var colorStatus = { r: 255, g: 0, b: 0, a: 1.0 };
            scope.Add(offset + 3, offset + 4, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), false, mesh, true, colorStatus);


        colorStatus = { r: 255, g: 255, b: 0, a: 1.0 };
            scope.Add(offset + 6, offset + 8, new THREE.Vector3(0, 3781.29, 0), new THREE.Vector3(0, 0, 0), false, mesh, true, colorStatus);
        
        //    scope.Add(offset + 6, offset + 8, new THREE.Vector3(0, 3781.29, 0), new THREE.Vector3(0, 0, 0), false, mesh);

        scope.Add(offset + 8, offset + 8.5, new THREE.Vector3(-287.01, 894.35, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 8.5, offset + 9, new THREE.Vector3(-805.33, 257.64, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 8, offset + 9, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 90), false, mesh);

        colorStatus = { r: 0, g: 255, b: 0, a: 1.0 };
        //if (offset === 0)
            //scope.Add(offset + 9, offset + 10, new THREE.Vector3(-2761.2, 62.71, 0), new THREE.Vector3(0, 0, 0), false, mesh, true, colorStatus);
        //else
        scope.Add(offset + 9, offset + 10, new THREE.Vector3(-2761.2, 62.71, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 10, offset + 10.5, new THREE.Vector3(-1149.01, 363.1, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 10.5, offset + 11, new THREE.Vector3(-299.97, 1051.71, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 10, offset + 11, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -90), false, mesh);

        scope.Add(offset + 11, offset + 12, new THREE.Vector3(0, 1288.45, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        scope.Add(offset + 9, offset + 11, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), false, mesh, true, colorStatus);
    };
    this.AddAnimation_Arm = function (offset, mesh) {
        //mesh.geometry.center();
        //mesh.position.copy(center);
        mesh.scale.set(2, 2, 2);
        //var posBase = new THREE.Vector3(-101145, -1259, 1088);
        //mesh.position.set(-101145, -1259, 1088);
        
        if (mesh.name.localeCompare("VIZWeb3D/MODEL/MR1718-ARM-BASE-1.vizw") === 0) {
            //mesh.position.set(-101145, -1259, 1088);
            //mesh.position.set(-113284, -7287, 1481);
            //scope.Add(offset + 0, offset + 0.1, new THREE.Vector3(-113284, -7287, 1481), new THREE.Vector3(0, 0, 0), false, mesh);
        }
        else if (mesh.name.localeCompare("VIZWeb3D/MODEL/MR1718-ARM-ELBOW-1.vizw") === 0) {
            //scope.Add(offset + 0, offset + 1, new THREE.Vector3(222, -520, 180), new THREE.Vector3(0, 0, 0), false, mesh);
            //scope.Add_Offset(offset + 2, offset + 3, new THREE.Vector3(0, 0, 0), new THREE.Vector3(50, 0, 0), false, mesh, true, new THREE.Vector3(0, 30, 0) );
        }
        else if (mesh.name.localeCompare("VIZWeb3D/MODEL/MR1718-ARM-GRIPPER-1.vizw") === 0) {
            
        }
        else if (mesh.name.localeCompare("VIZWeb3D/MODEL/MR1718-ARM-WRIST-1.vizw") === 0) {
            //scope.Add(offset + 1, offset + 2, new THREE.Vector3(30, -1446, 220), new THREE.Vector3(0, 0, 0), false, mesh);
            //scope.Add_Offset(offset + 2, offset + 3, new THREE.Vector3(0, 0, 0), new THREE.Vector3(-90, 0, 0), false, mesh, true, new THREE.Vector3(0, 398, -26));
            //scope.Add_Offset(offset + 2, offset + 3, new THREE.Vector3(0, 0, 0), new THREE.Vector3(90, 0, 0), false, mesh, true, new THREE.Vector3(0, 62.46, 0));
        }

        //scope.Add(offset + 0, offset + 1, new THREE.Vector3(0, 1583.23, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 1, offset + 1.5, new THREE.Vector3(344.94, 812.89, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 1.5, offset + 2, new THREE.Vector3(999.75, 300.94, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 1, offset + 2, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -90), false, mesh);

        //scope.Add(offset + 2, offset + 5, new THREE.Vector3(7801.94, 0, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 5, offset + 5.5, new THREE.Vector3(856.12, 270.56, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 5.5, offset + 6, new THREE.Vector3(320.89, 908.23, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 5, offset + 6, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 90), false, mesh);
        //scope.Add(offset + 3, offset + 4, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 6, offset + 8, new THREE.Vector3(0, 3781.29, 0), new THREE.Vector3(0, 0, 0), false, mesh);

        //scope.Add(offset + 8, offset + 8.5, new THREE.Vector3(-287.01, 894.35, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 8.5, offset + 9, new THREE.Vector3(-805.33, 257.64, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 8, offset + 9, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 90), false, mesh);

        //scope.Add(offset + 9, offset + 10, new THREE.Vector3(-2761.2, 62.71, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 10, offset + 10.5, new THREE.Vector3(-1149.01, 363.1, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 10.5, offset + 11, new THREE.Vector3(-299.97, 1051.71, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        //scope.Add(offset + 10, offset + 11, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -90), false, mesh);

        //scope.Add(offset + 11, offset + 12, new THREE.Vector3(0, 1288.45, 0), new THREE.Vector3(0, 0, 0), false, mesh);
        
    };

    function setColor(source, color) {
        
        for (var i = 0; i < source.geometry.attributes.color.array.length; i = i + 4) {
            source.geometry.attributes.color.array[i] = color.r;
            source.geometry.attributes.color.array[i + 1] = color.g;
            source.geometry.attributes.color.array[i + 2] = color.b;
            source.geometry.attributes.color.array[i + 3] = color.a * 255;
        }
        source.geometry.attributes.color.needsUpdate = true;
    };

    function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
        pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;

        if (pointIsWorld) {
            obj.parent.localToWorld(obj.position); // compensate for world coordinate
        }

        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset

        if (pointIsWorld) {
            obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
        }

        obj.rotateOnAxis(axis, theta); // rotate the OBJECT
    }

    this.Start = function () {
        Init();

        if (AnimationPlay !== null) {
            clearInterval(AnimationPlay);
            AnimationPlay = null;
        }

        timeStart = new Date().getTime();
        timeLooplessStart = new Date().getTime();

        var play = function () {

            timePlay = new Date().getTime();
            //timeCurrent = new Date(timePlay - timeStart);
            timeCurrent = (timePlay - timeStart); // 밀리초
            var ms = timeCurrent / 1000;

            //var posBase1 = new THREE.Vector3().copy(new THREE.Vector3(-113284, -7287, 1481));
            var posBase1 = new THREE.Vector3(-101145, -1259, 1088);
            

            var posBaseToLink1Offset = new THREE.Vector3().copy(new THREE.Vector3(62.0988 * 2, -0.7999 * 2, 101.5193 * 2));
            var posBaseToLink1 = new THREE.Vector3().copy(new THREE.Vector3(62.0988 * 2, -0.7999 * 2, 101.5193 * 2));

            var posBaseToLink2Offset = new THREE.Vector3().copy(new THREE.Vector3(2.4805 * 2, 523.2224 * 2, 4.6365 * 2));
            var posBaseToLink2 = new THREE.Vector3().copy(new THREE.Vector3(2.4805 * 2, 523.2224 * 2, 4.6365 * 2));

            var objIdxStart = [0, 3, 6, 9, 12, 15];
            
            if (true) {
                for (var i = 0; i < objectList.length; i++) {

                    var bObject = false;
                    var idxStartOffset = 0;
                    for (var c = 0; c < objIdxStart.length; c++) {
                        if (i >= objIdxStart[c] && i <= objIdxStart[c]+2 ) {
                            bObject = true;
                            idxStartOffset = objIdxStart[c];
                            break;
                        }
                    }

                    if (!bObject)
                        continue;

                    var mesh = objectList[i];

                    var timeLooplessCurrent = (timePlay - timeLooplessStart);
                    var ms2 = timeLooplessCurrent / 2000;
                    var rotateAOffset = 0;

                    // 오프셋 조절
                    {
                        if (i === idxStartOffset)
                        {
                            posBaseToLink1Offset = new THREE.Vector3().copy(new THREE.Vector3(62.0988 * 2, -0.7999 * 2, 101.5193 * 2));
                            posBaseToLink1 = new THREE.Vector3().copy(new THREE.Vector3(62.0988 * 2, -0.7999 * 2, 101.5193 * 2));

                            posBaseToLink2Offset = new THREE.Vector3().copy(new THREE.Vector3(2.4805 * 2, 523.2224 * 2, 4.6365 * 2));
                            posBaseToLink2 = new THREE.Vector3().copy(new THREE.Vector3(2.4805 * 2, 523.2224 * 2, 4.6365 * 2));
                        }
                        if (idxStartOffset === 0) {
                            posBase1 = new THREE.Vector3(-101380.8047, -653.9194, 825.5000);
                            ms2 = timeLooplessCurrent / 2000;
                            rotateAOffset = 3.141592 / 180.0 * 90;
                        }

                        if (idxStartOffset === 3) {
                            posBase1 = new THREE.Vector3(-106528.9375, -125.9180, 825.5000);
                            ms2 = timeLooplessCurrent / 2000 + 2.25;
                            rotateAOffset = 0;
                        }

                        if (idxStartOffset === 6) {
                            posBase1 = new THREE.Vector3(-104245.2578, -125.9108, 825.5000);
                            ms2 = timeLooplessCurrent / 2000 + 5;
                            rotateAOffset = 0;
                        }

                        if (idxStartOffset === 9) {
                            posBase1 = new THREE.Vector3(-105494.4922, -3368.9077, 825.5000);
                            ms2 = timeLooplessCurrent / 2000 + 1;
                            rotateAOffset = 3.141592 / 180.0 * 180;
                        }

                        if (idxStartOffset === 12) {
                            posBase1 = new THREE.Vector3(-104041.6406, -2730.9810, 825.5000);
                            ms2 = timeLooplessCurrent / 2000 + 7.25;
                            rotateAOffset = 3.141592 / 180.0 * 250;
                        }

                        if (idxStartOffset === 15) {
                            posBase1 = new THREE.Vector3(-101380.8047, -3391.4844, 825.5000);
                            ms2 = timeLooplessCurrent / 2000 + 10;
                            rotateAOffset = 3.141592 / 180.0 * 90;
                        }
                    }

                    var rotateA = 0;//ms2 / 2;
                    var rotateB = 3.141592/180.0*(90-10);//ms2 / 5;
                    var rotateC = 3.141592654/180.0*(180-30);//rotateB + ms2 / 10;                    

                    //var rotateB = 3.141592/180.0*(90-40);//ms2 / 5;
                    //var rotateC = 3.141592654 / 180.0 * (180 - 80);//rotateB + ms2 / 10;      

                    // 애니메이션 처리
                    {
                        var loopNum = Math.floor(ms2 / 6);
                        var realms2 = ms2 - loopNum * 6;
                        var stepNum = Math.floor(realms2);
                        var stepms2 = realms2 - stepNum;

                        if (stepNum === 0) {
                            if (stepms2 < 0.5) {
                                rotateA = 0;
                                rotateB = 3.141592 / 180.0 * (90 - (10 + 30 * stepms2 * 2));
                                rotateC = 3.141592654 / 180.0 * (180 - 30);
                            }
                            else {
                                rotateA = 0;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - (30 + 50 * (stepms2-0.5)*2));
                            }
                        }

                        if (stepNum === 1) {
                            if (stepms2 < 0.5) {
                                rotateA = 0;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - 80);
                            }
                            else {
                                rotateA = 0;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - (80 - 50 * (stepms2 - 0.5) * 2));
                            }
                        }

                        if (stepNum === 2) {
                            rotateA = 3.141592 / 180.0 * 45* stepms2;
                            rotateB = 3.141592 / 180.0 * (90 - 40);
                            rotateC = 3.141592654 / 180.0 * (180 - 30);
                        }

                        if (stepNum === 3) {
                            if (stepms2 < 0.5) {
                                rotateA = 3.141592 / 180.0 * 45;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - (30 + 50 * stepms2 * 2));
                            }
                            else {
                                rotateA = 3.141592 / 180.0 * 45;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - 80);
                            }
                        }

                        if (stepNum === 4) {
                            if (stepms2 < 0.5) {
                                rotateA = 3.141592 / 180.0 * 45;
                                rotateB = 3.141592 / 180.0 * (90 - 40);
                                rotateC = 3.141592654 / 180.0 * (180 - (80 - 50 * (stepms2) * 2));
                            }
                            else {
                                rotateA = 3.141592 / 180.0 * 45;
                                rotateB = 3.141592 / 180.0 * (90 - (40 - 30 * (stepms2-0.5) * 2));
                                rotateC = 3.141592654 / 180.0 * (180 - 30);
                            }
                        }

                        if (stepNum === 5) {
                            rotateA = 3.141592 / 180.0 * (45 - 45 * stepms2);
                            rotateB = 3.141592 / 180.0 * (90 - 10);
                            rotateC = 3.141592654 / 180.0 * (180 - 30);
                        }
                    }

                    rotateA += rotateAOffset;

                    // 밑둥 처리
                    if (i - idxStartOffset === 0) {
                        mesh.position.set(posBase1.x, posBase1.y, posBase1.z);
                        //mesh.rotateZ(ms/100);
                        mesh.rotation.set(0, 0, rotateA);

                        // 다음 연결 좌표 계산 
                        var matrixRotate = new THREE.Matrix4();
                        matrixRotate.makeRotationZ(rotateA);

                        posBaseToLink1.applyMatrix4(matrixRotate);
                        posBaseToLink1.add(posBase1);
                    }

                    // 팔1번
                    if (i - idxStartOffset === 1) {
                        mesh.position.copy(posBaseToLink1);
                        mesh.rotation.x = 0;
                        mesh.rotation.y = 0;
                        mesh.rotation.z = 0;
                        
                        mesh.rotateZ(rotateA);
                        mesh.rotateX(rotateB);

                        // 다음 연결 좌표 계산
                        var matrixRotate1 = new THREE.Matrix4();
                        matrixRotate1.makeRotationZ(rotateA);

                        var matrixRotate2 = new THREE.Matrix4();
                        matrixRotate2.makeRotationX(rotateB);

                        posBaseToLink2.applyMatrix4(matrixRotate2);
                        posBaseToLink2.applyMatrix4(matrixRotate1);
                        posBaseToLink2.add(posBaseToLink1);
                    }

                    // 팔2번
                    if (i - idxStartOffset === 2) {
                        mesh.position.copy(posBaseToLink2);
                        mesh.rotation.x = 0;
                        mesh.rotation.y = 0;
                        mesh.rotation.z = 0;

                        mesh.rotateZ(rotateA);
                        mesh.rotateX(rotateB+rotateC);
                    }
                }
            }

            if (ms > timeRepeat) {
                timeStart = new Date().getTime();
                for (var i = 0; i < _AnimationList.length; i++) {
                    var animation = _AnimationList[i];
                    animation.Mesh.Item.position.copy(animation.Base.Move);
                    animation.Mesh.Item.rotation.set(0, 0, 0);
                }
                _OffetMap.clear();
            }
            //var sec = timeCurrent.getSeconds(); //초
            //var milisec = Math.floor(timeCurrent.getMilliseconds() / 10); //밀리초

            for (var i = 0; i < _AnimationList.length; i++) {
                var animation = _AnimationList[i];

                animation.Status = 1;
                if (animation.Time.Start < ms && ms < animation.Time.End) {
                    var play = ms - animation.Time.Start;
                    var total = animation.Time.End - animation.Time.Start;
                    var timeRatio = play / total;

                    if (animation.Action.UseColor) {
                        setColor(animation.Mesh.Item, animation.Action.Color);
                    }

                    var offset = {
                        Move: new THREE.Vector3().copy(animation.Transform.Move).multiplyScalar(timeRatio),
                        Rotate: new THREE.Vector3().copy(animation.Transform.Rotate).multiplyScalar(timeRatio)
                    };
                    //console.log(offset.Move.x + " " + offset.Move.y + " " + offset.Move.z + " ");
                    var value = _OffetMap.get(animation.ID);

                    if (animation.Transform.UsePoint) {
                        if (value === undefined) {

                            var posOff = new THREE.Vector3().copy(animation.Transform.Point);
                            var posMatrix = new THREE.Vector3().copy(posOff);
                            // 특정 위치 회전 
                            var matrix = new THREE.Matrix4();
                            offset.Rotate.x = -10;
                            matrix.makeRotationX((offset.Rotate.x) * Math.PI / 180.0);
                            //matrix.makeRotationY((offset.Rotate.y) * Math.PI / 180.0);
                            //matrix.makeRotationZ((offset.Rotate.z) * Math.PI / 180.0);
                            posMatrix.applyMatrix4(matrix);
                            // 원점 회전
                            animation.Mesh.Item.rotateX((offset.Rotate.x) * Math.PI / 180.0);
                            //animation.Mesh.Item.rotateY((offset.Rotate.y) * Math.PI / 180.0);
                            //animation.Mesh.Item.rotateZ((offset.Rotate.z) * Math.PI / 180.0);
                            // 회전 매트릭스 위치 적용
                            animation.Mesh.Item.position.sub(posMatrix);
                            offset.Move.sub(posMatrix);
                            // Offset 적용
                            animation.Mesh.Item.position.add(posOff); // re-add the offset
                            offset.Move.add(posMatrix);

                            _OffetMap.set(animation.ID, offset);
                        }
                        else {
                            // 위치 복원
                            animation.Mesh.Item.position.x -= offset.Move.x - value.Move.x;
                            animation.Mesh.Item.position.y -= offset.Move.y - value.Move.y;
                            animation.Mesh.Item.position.z -= offset.Move.z - value.Move.z;
                            // 회전 복원
                            animation.Mesh.Item.rotateX((offset.Rotate.x - value.Rotate.x) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateY((offset.Rotate.y - value.Rotate.y) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateZ((offset.Rotate.z - value.Rotate.z) * Math.PI / 180.0);

                            var posOff = new THREE.Vector3().copy(animation.Transform.Point);
                            var posMatrix = new THREE.Vector3().copy(posOff);
                            // 특정 위치 회전 
                            var matrix = new THREE.Matrix4();
                            offset.Rotate.x = -20;
                            matrix.makeRotationX((offset.Rotate.x) * Math.PI / 180.0);
                            //matrix.makeRotationY((offset.Rotate.y) * Math.PI / 180.0);
                            //matrix.makeRotationZ((offset.Rotate.z) * Math.PI / 180.0);
                            posMatrix.applyMatrix4(matrix);
                            // 원점 회전
                            animation.Mesh.Item.rotateX((offset.Rotate.x) * Math.PI / 180.0);
                            //animation.Mesh.Item.rotateY((offset.Rotate.y) * Math.PI / 180.0);
                            //animation.Mesh.Item.rotateZ((offset.Rotate.z) * Math.PI / 180.0);
                            // 회전 매트릭스 위치 적용
                            animation.Mesh.Item.position.sub(posMatrix);
                            offset.Move.sub(posMatrix);
                            // Offset 적용
                            animation.Mesh.Item.position.add(posOff); // re-add the offset
                            offset.Move.add(posMatrix);

                            _OffetMap.set(animation.ID, offset);
                        }
                    }
                    else {
                        if (value === undefined) {
                            animation.Mesh.Item.rotateX((offset.Rotate.x) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateY((offset.Rotate.y) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateZ((offset.Rotate.z) * Math.PI / 180.0);

                            animation.Mesh.Item.position.x += offset.Move.x;
                            animation.Mesh.Item.position.y += offset.Move.y;
                            animation.Mesh.Item.position.z += offset.Move.z;

                            _OffetMap.set(animation.ID, offset);
                        }
                        else {
                            animation.Mesh.Item.rotateX((offset.Rotate.x - value.Rotate.x) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateY((offset.Rotate.y - value.Rotate.y) * Math.PI / 180.0);
                            animation.Mesh.Item.rotateZ((offset.Rotate.z - value.Rotate.z) * Math.PI / 180.0);

                            animation.Mesh.Item.position.x += offset.Move.x - value.Move.x;
                            animation.Mesh.Item.position.y += offset.Move.y - value.Move.y;
                            animation.Mesh.Item.position.z += offset.Move.z - value.Move.z;

                            _OffetMap.set(animation.ID, offset);
                        }
                    }
                }
                else if (ms > animation.Time.End && animation.Status === 1) {
                    var value = _OffetMap.get(animation.ID);
                    if (value !== undefined) {
                        var offset = {
                            Move: new THREE.Vector3().copy(animation.Transform.Move),
                            Rotate: new THREE.Vector3().copy(animation.Transform.Rotate)
                        };

                        animation.Mesh.Item.rotateX((animation.Transform.Rotate.x - value.Rotate.x) * Math.PI / 180.0);
                        animation.Mesh.Item.rotateY((animation.Transform.Rotate.y - value.Rotate.y) * Math.PI / 180.0);
                        animation.Mesh.Item.rotateZ((animation.Transform.Rotate.z - value.Rotate.z) * Math.PI / 180.0);

                        animation.Mesh.Item.position.x += animation.Transform.Move.x - value.Move.x;
                        animation.Mesh.Item.position.y += animation.Transform.Move.y - value.Move.y;
                        animation.Mesh.Item.position.z += animation.Transform.Move.z - value.Move.z;

                        animation.Status = 2;

                        if (animation.Action.UseColor) {
                            var colorBase = animation.Mesh.Item.userData[0].color;
                            var color = {
                                r: colorBase.R, g: colorBase.G, b: colorBase.B, a: colorBase.A / 255
                            };
                            setColor(animation.Mesh.Item, color);
                        }

                        _OffetMap.set(animation.ID, offset);
                    }
                }
            }

            //console.log("Time : " + timeCurrent + "ms");
            view.RenderEvent = true;
        };

        AnimationPlay = setInterval(function () {
            play();
        }, 30);
    };

    this.PlayTime = function () {
        var playtime = 0;
        for (var i = 0; i < _AnimationList.length; i++) {
            var animation = _AnimationList[i];
            playtime = Math.max(playtime, animation.Time.End);
        }
        return playtime;
    };
}