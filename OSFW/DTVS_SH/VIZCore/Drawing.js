class Drawing {
    constructor(view, VIZCore) {
        let scope = this;

        let ui_custom_img = undefined;
        this.mapCustomImage = new Map();
        /*
        this.Add = function () {
            return;
            let path = LGDpathFinder();
    
            if (view.DEBUG) {
               // Draw Path
                let review = view.Data.ReviewItem();
                review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_PATH;
                review.style.border.color.set(41, 143, 194, 255);
                review.style.background.color.set(255, 255, 255, 100);
                review.style.point.size = 5;
                review.style.point.color.set(255, 255, 0, 255);
                review.style.line.thickness = 3;
                review.style.line.color.set(255, 255, 0, 200);
                review.style.line.dash = [];
                review.style.arrow.size = 15;
                review.style.arrow.color.set(255, 100, 0, 255);
                let position = LGDpathFinder();
                
                //position.push(new VIZCore.Vector3(-257656.20, -15434.97, 300.0));
                //position.push(new VIZCore.Vector3(-258110.07, -22633.96, 300.0));
                //position.push(new VIZCore.Vector3(-270545.14, -23470.10, 300.0));
                //position.push(new VIZCore.Vector3(-326939.02, -23415.21, 300.0));
                //position.push(new VIZCore.Vector3(-327588.31, -6626.52, 300.0));
                //position.push(new VIZCore.Vector3(-336842.46, -5662.63, 300.0));
                for (let i = 1; i < position.length; i++) {
                    let path = view.Data.PathInfo();
                    path.start = new VIZCore.Vector3().copy(position[i - 1]);
                    path.end = new VIZCore.Vector3().copy(position[i]);
    
                    if (i === 1) {
                        path.drawType = VIZCore.Enum.LINE_TYPES.USER; // dash
                    }
                    else if (i === position.length - 1) {
                        path.drawType = VIZCore.Enum.LINE_TYPES.USER; // dash
                    }
                    else {
                        path.drawType = VIZCore.Enum.LINE_TYPES.SOLID; // 실선
                    }
    
                    review.drawitem.position.push(path);
    
                    if (i === 1) {
                        let pathPoint = view.Data.PathInfo();
                        pathPoint.start = new VIZCore.Vector3().copy(position[i - 1]);
                        pathPoint.end = new VIZCore.Vector3().copy(position[i - 1]);
                        pathPoint.drawType = VIZCore.Enum.LINE_TYPES.POINT; //point
    
                        review.drawitem.position.push(pathPoint);
                    }
                    else if (i === position.length - 1) {
                        let pathPoint = view.Data.PathInfo();
                        pathPoint.start = new VIZCore.Vector3().copy(position[i]);
                        pathPoint.end = new VIZCore.Vector3().copy(position[i]);
                        pathPoint.drawType = VIZCore.Enum.LINE_TYPES.POINT; //point
    
                        review.drawitem.position.push(pathPoint);
                    }
                }
    
                view.Data.Reviews.push(review);
            }
        };
        */
        this.AddPath = function (start, end) {
            let path = LGDpathFinder(start, end);

            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_PATH;
            review.style.border.color.set(41, 143, 194, 255);
            review.style.background.color.set(255, 255, 255, 100);
            review.style.point.size = 5;
            review.style.point.color.set(255, 255, 0, 255);
            review.style.line.thickness = 3;
            review.style.line.color.set(255, 255, 0, 200);
            review.style.line.dash = [2, 4];
            review.style.arrow.size = 15;
            review.style.arrow.color.set(255, 100, 0, 255);
            let position = path;

            for (let i = 1; i < position.length; i++) {
                let path = view.Data.PathInfo();
                path.start = new VIZCore.Vector3().copy(position[i - 1]);
                path.end = new VIZCore.Vector3().copy(position[i]);

                if (i === 1) {
                    path.drawType = VIZCore.Enum.LINE_TYPES.USER; // dash
                }
                else if (i === position.length - 1) {
                    path.drawType = VIZCore.Enum.LINE_TYPES.USER; // dash
                }
                else {
                    path.drawType = VIZCore.Enum.LINE_TYPES.SOLID; // 실선
                }

                review.drawitem.position.push(path);

                if (i === 1) {
                    let pathPoint = view.Data.PathInfo();
                    pathPoint.start = new VIZCore.Vector3().copy(position[i - 1]);
                    pathPoint.end = new VIZCore.Vector3().copy(position[i - 1]);
                    pathPoint.drawType = VIZCore.Enum.LINE_TYPES.POINT; //point

                    review.drawitem.position.push(pathPoint);
                }
                else if (i === position.length - 1) {
                    let pathPoint = view.Data.PathInfo();
                    pathPoint.start = new VIZCore.Vector3().copy(position[i]);
                    pathPoint.end = new VIZCore.Vector3().copy(position[i]);
                    pathPoint.drawType = VIZCore.Enum.LINE_TYPES.POINT; //point

                    review.drawitem.position.push(pathPoint);
                }
            }
            view.Data.Reviews.push(review);
        };


        /**
        * Drawing Lines 추가
        * @param {[VIZCore.Vector3]} position : lines Type Position [0, 1, 2, 3, ...]
        * @param {VIZCore.Enum.LINE_TYPES} lineType : draw Line Type
        * @returns {Data.ReviewItem} reviewItem 반환;
        */
        this.Add = function (position, lineType) {

            if (position === undefined)
                return undefined;

            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_PATH;
            review.style.border.color.set(41, 143, 194, 255);
            review.style.background.color.set(255, 255, 255, 100);
            review.style.point.size = 5;
            review.style.point.color.set(100, 0, 255, 255);
            review.style.line.thickness = 2;
            review.style.line.color.set(255, 255, 0, 200);
            review.style.line.dash = [];
            review.style.arrow.size = 10;
            review.style.arrow.color.set(255, 100, 0, 255);

            // Lines 타입으로 생성
            for (let i = 0; i < position.length; i += 2) {

                let path = view.Data.PathInfo();
                path.start = new VIZCore.Vector3().copy(position[i]);
                path.end = new VIZCore.Vector3().copy(position[i + 1]);
                path.drawType = lineType;

                review.drawitem.position.push(path);
            }

            view.Data.Reviews.push(review);
            return review;
        };

        /**
        * Drawing Line 추가 (Path Info 방식)
        * @param {[Data.Data.PathInfo()]} pathInfo : Path 정보
        * @returns {Data.ReviewItem()} reviewItem 반환;
        */
        this.AddByPath = function (path) {

            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_PATH;
            review.style.border.color.set(41, 143, 194, 255);
            review.style.background.color.set(255, 255, 255, 100);
            review.style.point.size = 5;
            review.style.point.color.set(255, 255, 0, 255);
            review.style.line.thickness = 1;
            review.style.line.color.set(100, 0, 255, 255);
            review.style.line.dash = [];
            review.style.arrow.size = 10;
            review.style.arrow.color.set(255, 100, 0, 255);

            for (let i = 0; i < path.length; i++) {
                review.drawitem.position.push(path);
            }

            view.Data.Reviews.push(review);
            return review;
        };

        /**
        * Drawing 타입 제거
        */
        this.Clear = function (kind) {
            for (let k = view.Data.Reviews.length - 1; k >= 0; k--) {
                if (kind === undefined) {
                    if (view.Data.Reviews[k].itemType === VIZCore.Enum.REVIEW_TYPES.RK_PATH
                        || view.Data.Reviews[k].itemType === VIZCore.Enum.REVIEW_TYPES.RK_CUSTOM) {
                        view.Data.Reviews.splice(k, 1);
                    }
                }
                else {
                    if (view.Data.Reviews[k].itemType === kind) {
                        view.Data.Reviews.splice(k, 1);
                    }
                }
            }
        };





        this.FindObjectsNAddPath = function (key, value, start) {
            let nodes = view.Property.GetNodeIDsByKeyValue(key, value);

            if (nodes.length === 0)
                return;

            let bbox = new VIZCore.BBox();
            let bFind = false;
            // 중심점 계산
            for (let i = 0; i < nodes.length; i++) {
                if (!bFind) {
                    let result = view.Property.GetBBoxInfoByID(nodes[i]);
                    if (result.result) {
                        bbox = result.bbox;
                        bFind = true;
                    }
                }
                else {
                    let result = view.Property.GetBBoxInfoByID(nodes[i]);
                    if (result.result) {
                        bbox.append(result.bbox);
                    }
                }
            }

            let path = LGDpathFinder(start, bbox.center);

            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_PATH;
            review.style.border.color.set(41, 143, 194, 255);
            review.style.background.color.set(255, 255, 255, 100);
            review.style.point.size = 5;
            review.style.point.color.set(255, 255, 0, 255);
            review.style.line.thickness = 3;
            review.style.line.color.set(255, 255, 0, 200);
            review.style.line.dash = [2, 4];
            review.style.arrow.size = 15;
            review.style.arrow.color.set(255, 100, 0, 255);
            let position = path;

            for (let i = 1; i < position.length; i++) {
                let path = view.Data.PathInfo();
                path.start = new VIZCore.Vector3().copy(position[i - 1]);
                path.end = new VIZCore.Vector3().copy(position[i]);
                review.drawitem.position.push(path);
            }
            view.Data.Reviews.push(review);

        };

        function LGDpathFinder(vStart, vEnd) {
            //vStart = new VIZCore.Vector3(-398679.0, 21042.0, 1500);
            //vEnd = new VIZCore.Vector3(-353203, 34426, 1500);
            // 길찾기 시작 
            let pathNum = 15;
            let vMapPath = [
                new VIZCore.Vector3(-403341, 27843, 1500), new VIZCore.Vector3(-394153, 27852, 1500),
                new VIZCore.Vector3(-403073, 18792, 1500), new VIZCore.Vector3(-394132, 18813, 1500),
                new VIZCore.Vector3(-394153, 27852, 1500), new VIZCore.Vector3(-394132, 18813, 1500),
                new VIZCore.Vector3(-394153, 27852, 1500), new VIZCore.Vector3(-377380, 27843, 1500),
                new VIZCore.Vector3(-394132, 18813, 1500), new VIZCore.Vector3(-372973, 18792, 1500),
                new VIZCore.Vector3(-377380, 27843, 1500), new VIZCore.Vector3(-377333, 32405, 1500),
                new VIZCore.Vector3(-377333, 32405, 1500), new VIZCore.Vector3(-344341, 32452, 1500),

                new VIZCore.Vector3(-377333, 32405, 1500), new VIZCore.Vector3(-377333, 50559, 1500),
                new VIZCore.Vector3(-377333, 50559, 1500), new VIZCore.Vector3(-395031, 50559, 1500),
                new VIZCore.Vector3(-377333, 50559, 1500), new VIZCore.Vector3(-353587, 50559, 1500),

                new VIZCore.Vector3(-344341, 32452, 1500), new VIZCore.Vector3(-344341, -5795, 1500),
                new VIZCore.Vector3(-344341, -5795, 1500), new VIZCore.Vector3(-319013, -5795, 1500),
                new VIZCore.Vector3(-319013, -5795, 1500), new VIZCore.Vector3(-319013, -23200, 1500),
                new VIZCore.Vector3(-319013, -23200, 1500), new VIZCore.Vector3(-259014, -23200, 1500),
                new VIZCore.Vector3(-259014, -23200, 1500), new VIZCore.Vector3(-259014, -14323, 1500)
            ];

            // 연결 정보
            let mapPreLink = [
                [-1, -1, -1],
                [-1, -1, -1],
                [0, 3, -1],
                [0, 2, -1],
                [1, 2, -1],
                [3, -1, -1],
                [5, 7, -1],

                [5, 6, -1],
                [7, -1, -1],
                [7, -1, -1],

                [6, -1, -1],
                [10, -1, -1],
                [11, -1, -1],
                [12, -1, -1],
                [13, -1, -1]
            ];

            let mapPostLink = [
                [2, 3, -1],
                [2, 4, -1],
                [1, 4, -1],
                [5, -1, -1],
                [-1, -1, -1],
                [6, 7, -1],
                [10, -1, -1],
                [8, 9, -1],
                [-1, -1, -1],
                [-1, -1, -1],
                [11, -1, -1],
                [12, -1, -1],
                [13, -1, -1],
                [14, -1, -1],
                [-1, -1, -1]
            ];

            let pathStep = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

            // 시작/끝 인덱스 찾는다
            let startPathIndex = -1;
            let endPathIndex = -1;
            let vStartProjPos = new VIZCore.Vector3(0, 0, 0);
            let vEndProjPos = new VIZCore.Vector3(0, 0, 0);

            for (let t = 0; t < 2; t++) {
                let vTargetPos = new VIZCore.Vector3();
                if (t == 0)
                    vTargetPos = new VIZCore.Vector3().copy(vStart);

                else
                    vTargetPos = new VIZCore.Vector3().copy(vEnd);

                let findIdx = -1;
                let vFindPos = new VIZCore.Vector3(0, 0, 0);
                let fLinkDist = 0.0;

                for (let i = 0; i < pathNum; i++) {
                    let vBase = new VIZCore.Vector3().copy(vMapPath[i * 2 + 0]);
                    let vDir = new VIZCore.Vector3().copy(vMapPath[i * 2 + 1]).sub(vMapPath[i * 2 + 0]);
                    vDir.normalize();
                    let fBaseHeight = 0;
                    let fTallHeight = new VIZCore.Vector3().copy(vMapPath[i * 2 + 1]).sub(vMapPath[i * 2 + 0]).dot(vDir);
                    let fCurrentHeight = new VIZCore.Vector3().copy(vTargetPos).sub(vMapPath[i * 2 + 0]).dot(vDir);

                    if (fCurrentHeight >= fBaseHeight && fCurrentHeight <= fTallHeight) {
                        let vProjPos = new VIZCore.Vector3().copy(vTargetPos).sub(new VIZCore.Vector3().copy(vDir).multiplyScalar(fCurrentHeight));
                        let fCurrentDist = new VIZCore.Vector3().copy(vProjPos).sub(vMapPath[i * 2 + 0]).length();
                        if (findIdx < 0 || (findIdx >= 0 && fCurrentDist < fLinkDist)) {
                            fLinkDist = fCurrentDist;
                            findIdx = i;
                            vFindPos = new VIZCore.Vector3().copy(vMapPath[i * 2 + 0]).add(new VIZCore.Vector3().copy(vDir).multiplyScalar(fCurrentHeight));
                        }
                    }
                }

                // 정점에서 가까운놈도 검색
                for (let i = 0; i < pathNum * 2; i++) {
                    let fCurrentDist = new VIZCore.Vector3().copy(vTargetPos).sub(vMapPath[i]).length();

                    if (findIdx < 0 || (findIdx >= 0 && fCurrentDist < fLinkDist)) {
                        fLinkDist = fCurrentDist;
                        findIdx = Math.floor(i / 2);
                        vFindPos = new VIZCore.Vector3().copy(vMapPath[i]);
                    }
                }

                if (t == 0) {
                    startPathIndex = findIdx;
                    vStartProjPos = vFindPos;
                }
                else {
                    endPathIndex = findIdx;
                    vEndProjPos = vFindPos;
                }
            }

            // 길 찾는다
            let pRetPath = [];
            let retPathNum = 0;

            if (startPathIndex == endPathIndex) {
                retPathNum = 4;
                pRetPath[0] = new VIZCore.Vector3().copy(vStart);
                pRetPath[1] = new VIZCore.Vector3().copy(vStartProjPos);
                pRetPath[2] = new VIZCore.Vector3().copy(vEndProjPos);
                pRetPath[3] = new VIZCore.Vector3().copy(vEnd);
            }
            else {
                let start = startPathIndex;
                pathStep[start] = 0;
                let currentPathStep = 0;

                let bEnd = false;

                while (!bEnd) {
                    // 인접 칠한다
                    for (let i = 0; i < pathNum; i++) {
                        if (pathStep[i] >= 0)
                            continue;

                        // 앞 조사
                        for (let j = 0; j < 3; j++) {
                            if (mapPreLink[i][j] < 0)
                                break;

                            if (pathStep[mapPreLink[i][j]] == currentPathStep) {
                                pathStep[i] = currentPathStep + 1;

                                if (i == endPathIndex) {
                                    // 완료
                                    let curIdx = i;

                                    retPathNum = currentPathStep + 5;

                                    pRetPath[retPathNum - 1] = new VIZCore.Vector3().copy(vEnd);
                                    pRetPath[retPathNum - 2] = new VIZCore.Vector3().copy(vEndProjPos);

                                    pRetPath[0] = new VIZCore.Vector3().copy(vStart);
                                    pRetPath[1] = new VIZCore.Vector3().copy(vStartProjPos);

                                    for (let k = currentPathStep; k >= 0; k--) {
                                        let bProcessed = false;

                                        // 앞 조사
                                        for (let d1 = 0; d1 < 3; d1++) {
                                            if (mapPreLink[curIdx][d1] < 0)
                                                break;

                                            if (pathStep[mapPreLink[curIdx][d1]] == k) {
                                                bProcessed = true;
                                                pRetPath[retPathNum - 3 - (currentPathStep - k)] = new VIZCore.Vector3().copy(vMapPath[curIdx * 2 + 0]);
                                                curIdx = mapPreLink[curIdx][d1];
                                                break;
                                            }
                                        }

                                        // 뒤 조사
                                        if (!bProcessed)
                                            for (let d1 = 0; d1 < 3; d1++) {
                                                if (mapPostLink[curIdx][d1] < 0)
                                                    break;

                                                if (pathStep[mapPostLink[curIdx][d1]] == k) {
                                                    bProcessed = true;
                                                    pRetPath[retPathNum - 3 - (currentPathStep - k)] = new VIZCore.Vector3().copy(vMapPath[curIdx * 2 + 1]);
                                                    curIdx = mapPostLink[curIdx][d1];
                                                    break;
                                                }
                                            }
                                    }

                                    bEnd = true;
                                }
                            }
                        }

                        if (bEnd)
                            break;

                        // 뒤 조사
                        for (let j = 0; j < 3; j++) {
                            if (mapPostLink[i][j] < 0)
                                break;

                            if (pathStep[mapPostLink[i][j]] == currentPathStep) {
                                pathStep[i] = currentPathStep + 1;

                                if (i == endPathIndex) {
                                    // 완료
                                    let curIdx = i;

                                    retPathNum = currentPathStep + 5;

                                    pRetPath[retPathNum - 1] = new VIZCore.Vector3().copy(vEnd);
                                    pRetPath[retPathNum - 2] = new VIZCore.Vector3().copy(vEndProjPos);

                                    pRetPath[0] = new VIZCore.Vector3().copy(vStart);
                                    pRetPath[1] = new VIZCore.Vector3().copy(vStartProjPos);

                                    for (let k = currentPathStep; k >= 0; k--) {
                                        let bProcessed = false;

                                        // 앞 조사
                                        for (let d1 = 0; d1 < 3; d1++) {
                                            if (mapPreLink[curIdx][d1] < 0)
                                                break;

                                            if (pathStep[mapPreLink[curIdx][d1]] == k) {
                                                bProcessed = true;
                                                pRetPath[retPathNum - 3 - (currentPathStep - k)] = new VIZCore.Vector3().copy(vMapPath[curIdx * 2 + 0]);
                                                curIdx = mapPreLink[curIdx][d1];
                                                break;
                                            }
                                        }

                                        // 뒤 조사
                                        if (!bProcessed)
                                            for (let d1 = 0; d1 < 3; d1++) {
                                                if (mapPostLink[curIdx][d1] < 0)
                                                    break;

                                                if (pathStep[mapPostLink[curIdx][d1]] == k) {
                                                    bProcessed = true;
                                                    pRetPath[retPathNum - 3 - (currentPathStep - k)] = new VIZCore.Vector3().copy(vMapPath[curIdx * 2 + 1]);
                                                    curIdx = mapPostLink[curIdx][d1];
                                                    break;
                                                }
                                            }
                                    }

                                    bEnd = true;
                                }
                            }
                        }
                    }

                    currentPathStep++;
                }
            }

            //console.log(retPathNum);
            return pRetPath;
        };

        init();
        function init() {
            //22.10.05 ssjo
            // 불필요한 초기화 이미지 제거

            let ui_custom_img = document.createElement('div');
            ui_custom_img.id = "ui_custom_img";
            ui_custom_img.style.display = "none";

            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAbklEQVRoge3aQQ2EQBBFwYHgCQd7xBLBEkccrKoh6KhXDn7nHXuZc84R1vYN3+/nKgHP//idq34EXQHgCgBXALgCwBUArgBwBYArAFwB4AoAVwC4AsAVAK4AcAWAKwBcAeAKAFcAuALA9RYuG2O8Q6QMKanATJ4AAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress1\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAVklEQVRoge3aMQGAQAwEwUjFf4OE0CKA5tkZCbftDQDMzO7e+53LpocRP078OPHjxI8TP078OPHjxI8TP078OPHjxI8TP078OPHjxI97HULEB4Afm5kHcKAtpP95U0gAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress2\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAb0lEQVRoge3aoQHAIAxFwYzK/qYjUFOBLjHw7wb45kWmAKCq5pzP7DO+zdG4uRqaNRM/XGcc8Q/UFUf8Q3XEEf9gu3HEP9xOHPEv8DeO+JcQP5z4DkD8ZOKHEz+c+OHEDyd+OPHDLQ8h4gPAxarqBdn8iSqpKjgBAAAAAElFTkSuQmCC\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress3\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAhklEQVRoge3asRHAMAgEQUpV/4lLwIkD5Wb4l7gtgIAjJAAAiIjMfLLO+mauwpm7lvmjVC+P+IepXB7xZx4A8U9WsTzizzwA4t/gz/KIP/MAiH8TxzjEb+QWh/jNnOIQX8AlDvFFHOIQX0gdh/hiyjjEN6CKQ3wTijjEN7I9hBAfAICLRcQL7xrksFjJUtIAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress4\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAnElEQVRoge2SsQ3AQAjEGPX3b34E0qRIhVCC8geyB7AEPgMAADAzd99ex7qdq9D5ZIRfiurjiB/7pw6A+Am/JFXHET/2Tx0A8RN+ab4eR/zYP3UAxE/4W/D2OOLH/qkDIH7C3wq15xH/Z5SeR3zNARA/4W+LwvOIf5DTzyO+5gCIn/CP4NTziC/CiecRX2sA+3kc8WM/AABAV8zsAq/6QEV7zImCAAAAAElFTkSuQmCC\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress5\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAmElEQVRoge2SoRHAMAzEPGr2JxnBJQWB7Z1bPdAPoAdSOeecc1XV3bvntm7mGmSek/+A/2rT58pn+VQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAP7fAezzXDks3znnnPtqVXUBHJybyzAJOicAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress6\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAp0lEQVRoge2awQ3AIAzEMir7fzoC/bRSP1QFkooL9gBGyvmJAQAAmFmt9ah+lMtZHJ1P8I/5j2brPzyOfwF/dACMv7g/MgDGEfBHBcA4Iv6IABhHyO8dAOOI+T0DYBxBv1cAjCPq9wiAcYT9swEwjrh/JoDtj5fBPxoAx0viHwmA4yXy9wbA8ZL5ewLgeAn9XwPgeEn9bwHcH0I4Xl5/+0MIAABsg5mdRpZY7afxIiEAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAcElEQVRoge3aQQ3CABBFwYWgCRxwrCVSSe2tOEBVG3TMGwd/8457e27HOWE9/sN/y3stAc9r/37u+hF0BYArAFwB4AoAVwC4AsAVAK4AcAWAKwBcAeAKAFcAuALAFQCuAHAFgCsAXAHgCgDXW7hsZi5uIglvj7BQmQAAAABJRU5ErkJggg==\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery1\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAnklEQVRoge3SsRlAMBRF4ccE5tGYxQ7GMIRVNNZhBI3Cl4LgFd7N+Zu0Sc41AECpqvO7x6Vbzaxx+ot+aOeJZf1bndyO+IVJB+CB+IF4D4D4wXgOgPgBeQ2A+EF5DID4gX0dAPGD+zIA4gt4OwDii3gzAOILeToA4ot5MgDiC8odAPFF5QyA+MLuBkB8cVcDIH4B0gFsx0l8AACEmdkOJVQvlLoi6ogAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery2\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAr0lEQVRoge3SvQ3CMBRF4QsTZJ40WQV2yBjZIaxCk3VgBCSUInIB+Xkp3vX5GneW7HMFAKjVZfnuYepekpqgv7j37fMxTN1N0njC/37vP+HeqlyLxxK/MuUAIhA/kegBED+ZyAEQP6GoARA/qYgBED+xowMgfnJHBkB8A3sHQHwTewZAfCNbB0B8M1sGQHxDawdAfFNrBkB8Y/8GQHxzvwZA/AqUA3jPJ/EBADAm6QNuPImUkJz2LwAAAABJRU5ErkJggg==\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery3\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAvUlEQVRoge3SzQ2CUBRE4dEKrIcNNdiB9EAZ9CAl2AIb2sESWEqIUX7uS3jD+Qq4gXdGAICzukz/u+nLQdIt6C2quujapi8fkp4J3jf1/XtddK8Edw/lOvsY4n/u28fXlwFEcIjfJrh7SNEDIH5mIgdA/AxFDYD4mYoYAPEztncAxM/cngEQ38DWARDfxJYBEN/I2gEQ38yaARDf0NIBEN/UkgEQ39i/ARDf3K8BEP8E5gN4Tx+P+AAAeJI0AmST46QCTRYzAAAAAElFTkSuQmCC\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery4\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA80lEQVRoge2SwRGCMBQFv1ZgPVyowQ60B8qgBy3BFrjQjpbgUYZx8BH+ywF3z5mdJPsCAAD+lcP03f3YPiPilPQX164Z7v3YXiLiZvhft//cNcPDfX+DdxXH2WHif/y7jx9fBpDBHuLb/QZvEdkDIL7gN3iLyRwA8QW/wbuJrAEQX/AbvJvJGADxBb/Bm8LWARBf8Bu8aWwZAPEFv8GbSukAiC/4Dd50SgZAfMFv8FpYOwDiC36D18aaARBf8Bu8VtQBEF/wG7x2lAEQX/AbvFX4NQDiC36DtxpLAyC+4Dd4qzIfwGv6OOIv+w1eAACAKkTEGymOPbOYKmLVAAAAAElFTkSuQmCC\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery5\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA70lEQVRoge2SwQ2CQBQFv1ZgPVyowQ60B8qgBy3BFrzQjpZgwkGRGGF3/48PmXczYQfcGWOMMbbWbYb/u+3qm5ntnO7i2FTXc9vVBzM7BdxvNH/fVNfLgr+/5089tB39Rv6L//fy7UMAbi9f+uWtQb4FBIAcAX7KAc8AkCPATz3kFQByBPg5Bz0CQI4AP/dwaQDIEeCXAEoCQI4AvxSSGwByBPgeoJwAkCPA94KlBoAcAb4nMCUA5AjwvaFzA0COAD+AOysA5AjwA7j9pgJAjgA/gPvctwCQI8AP4L5tHMB9+HLk/JYfwGWMMcb6mdkDLIuXs82HYQwAAAAASUVORK5CYII=\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery6\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA2UlEQVRoge2S0Q2CMBRFn06g6/SHGdhAd+gY7KAjuEJ/WMeOYGI0miZqgTaxl3N/CAkcyr3HCCGErDWb9/8exu5qZrtCXRy9C+dh7A5mdqrQb21+7124NHz+T/zoXdg/b7bJS4z/4iuOb+nGqQC1Pw7/z/ilBWD8xvglBWCcBvmlBGCcRvklBGCchvlLBWCcxvlLBFh9eQr8uQJQngh/jgCUJ8SfKgDlifGnCEB5gvxcAShPlJ8jAOUJ838JQHna/K8CUJ42/55UgPi4Up4uP2Y8QwghRDxmdgOtFslDadhGgAAAAABJRU5ErkJggg==\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_car\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABVElEQVRYhe2VQU7DMBBFHxUHgBuw9gpOUHMC6A3KCUwXWZeus6h8gnKE3qC5AVllC0fIDUCWJpIbasdGod3kS5GT0Xz/yXhmzIQJEy6Nq1x9Vdo3wAA3A67vwKopTBtzygpAlfYA3AMWqCKud8AacOKPsSCuM8RfAQ08NIWpE/z3wAewBV5CfkkZUKV16f50aW0Ks8oIegnsgNtQFmaJe61l3aSKC/ay6pDDYACqtO48Xfo3QwXVh/i7WnkK+aTUwE6KqValDf5JBF+xDPyqARFxbfb8B7EYWjmSo9Y8CsArmv9E7bfmzBPXZxBH5si2+/CL0JxBvMOye/GL8NSZt72ppxPGcBYn1oZuowUwBw7yzMUWasdsTiwAKwPIbyEtNjsWJxZAFehfLb09Cid6F6jSfp+yN4UJ8nI5Q6P41JUbu4azOUMBLHrkSmxjcyZMmHAhAD/gY2j9tzX/4wAAAABJRU5ErkJggg==\" >";
            // ui_custom_img.innerHTML += "<img id=\"ui_custom_img_bike\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABUklEQVRYhe2WzVHDMBCFPxgKMB1w1gkqwOkgKSEVCA4+E846eFQBUAHpgFABnHwlHeASmGXWMyZRLGUG4QN+F4+s0dtP++QfJk0aWydD9Y3zK+DuwPR9U9nVn/Eb5z+N8ze/7XuaWPwSKIDNKABACbRNZd/HArjOsftjAKQDr6MA5Mw/CSBn/qkA2fJPBciWfxQgd/5RgNz5pwBkzT8FoMxZXHTwa6j5v0kEwBaYNZVtY4bG+QugBua924/AbWj9UAdKLX6l4+fE4gIt14VAA0v1+jDOF1EA4/xcPr26C9Ts20TmIgy1dusJeABe9N5SN1PvLtiLQIv3SeUpODfOd3EMvRPk52WtO/7hIREIgHj1F5wFTHbb1I1bNY4dzFCXCu3MXgQhgDZAL/JHvBFtoIubUMdDAAs9cIUWlzFNZdfa3qiM81vNu/OYJYJPmvTfBHwBZYFjHnwRPhAAAAAASUVORK5CYII=\" >";

            view.Container.appendChild(ui_custom_img);

            // let img_progress = document.getElementById('ui_custom_img_progress');
            // let img_progress1 = document.getElementById('ui_custom_img_progress1');
            // let img_progress2 = document.getElementById('ui_custom_img_progress2');
            // let img_progress3 = document.getElementById('ui_custom_img_progress3');
            // let img_progress4 = document.getElementById('ui_custom_img_progress4');
            // let img_progress5 = document.getElementById('ui_custom_img_progress5');
            // let img_progress6 = document.getElementById('ui_custom_img_progress6');
            // let img_battery = document.getElementById('ui_custom_img_battery');
            // let img_battery1 = document.getElementById('ui_custom_img_battery1');
            // let img_battery2 = document.getElementById('ui_custom_img_battery2');
            // let img_battery3 = document.getElementById('ui_custom_img_battery3');
            // let img_battery4 = document.getElementById('ui_custom_img_battery4');
            // let img_battery5 = document.getElementById('ui_custom_img_battery5');
            // let img_battery6 = document.getElementById('ui_custom_img_battery6');

            // let img_car = document.getElementById('ui_custom_img_car');
            // let img_bike = document.getElementById('ui_custom_img_bike');


            // scope.mapCustomImage.set('progress', [img_progress, img_progress1, img_progress2, img_progress3, img_progress4, img_progress5, img_progress6]);
            // scope.mapCustomImage.set('battery', [img_battery, img_battery1, img_battery2, img_battery3, img_battery4, img_battery5, img_battery6]);

            // scope.mapCustomImage.set('car', [img_car]);
            // scope.mapCustomImage.set('bike', [img_bike]);
        }

        this.GetCustomImage = function (customName) {
            let ui_custom_img = document.getElementById('ui_custom_img');
            //생성이 안되어 있는경우 생성
            if(customName.localeCompare("progress") === 0) {
                if(scope.mapCustomImage.has(customName) === false) {
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAbklEQVRoge3aQQ2EQBBFwYHgCQd7xBLBEkccrKoh6KhXDn7nHXuZc84R1vYN3+/nKgHP//idq34EXQHgCgBXALgCwBUArgBwBYArAFwB4AoAVwC4AsAVAK4AcAWAKwBcAeAKAFcAuALA9RYuG2O8Q6QMKanATJ4AAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress1\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAVklEQVRoge3aMQGAQAwEwUjFf4OE0CKA5tkZCbftDQDMzO7e+53LpocRP078OPHjxI8TP078OPHjxI8TP078OPHjxI8TP078OPHjxI97HULEB4Afm5kHcKAtpP95U0gAAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress2\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAb0lEQVRoge3aoQHAIAxFwYzK/qYjUFOBLjHw7wb45kWmAKCq5pzP7DO+zdG4uRqaNRM/XGcc8Q/UFUf8Q3XEEf9gu3HEP9xOHPEv8DeO+JcQP5z4DkD8ZOKHEz+c+OHEDyd+OPHDLQ8h4gPAxarqBdn8iSqpKjgBAAAAAElFTkSuQmCC\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress3\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAhklEQVRoge3asRHAMAgEQUpV/4lLwIkD5Wb4l7gtgIAjJAAAiIjMfLLO+mauwpm7lvmjVC+P+IepXB7xZx4A8U9WsTzizzwA4t/gz/KIP/MAiH8TxzjEb+QWh/jNnOIQX8AlDvFFHOIQX0gdh/hiyjjEN6CKQ3wTijjEN7I9hBAfAICLRcQL7xrksFjJUtIAAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress4\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAnElEQVRoge2SsQ3AQAjEGPX3b34E0qRIhVCC8geyB7AEPgMAADAzd99ex7qdq9D5ZIRfiurjiB/7pw6A+Am/JFXHET/2Tx0A8RN+ab4eR/zYP3UAxE/4W/D2OOLH/qkDIH7C3wq15xH/Z5SeR3zNARA/4W+LwvOIf5DTzyO+5gCIn/CP4NTziC/CiecRX2sA+3kc8WM/AABAV8zsAq/6QEV7zImCAAAAAElFTkSuQmCC\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress5\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAmElEQVRoge2SoRHAMAzEPGr2JxnBJQWB7Z1bPdAPoAdSOeecc1XV3bvntm7mGmSek/+A/2rT58pn+VQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAD4VgHIC+FQAygngUwEoJ4BPBaCcAP7fAezzXDks3znnnPtqVXUBHJybyzAJOicAAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_progress6\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAp0lEQVRoge2awQ3AIAzEMir7fzoC/bRSP1QFkooL9gBGyvmJAQAAmFmt9ah+lMtZHJ1P8I/5j2brPzyOfwF/dACMv7g/MgDGEfBHBcA4Iv6IABhHyO8dAOOI+T0DYBxBv1cAjCPq9wiAcYT9swEwjrh/JoDtj5fBPxoAx0viHwmA4yXy9wbA8ZL5ewLgeAn9XwPgeEn9bwHcH0I4Xl5/+0MIAABsg5mdRpZY7afxIiEAAAAASUVORK5CYII=\" >";

                    let img_progress = document.getElementById('ui_custom_img_progress');
                    let img_progress1 = document.getElementById('ui_custom_img_progress1');
                    let img_progress2 = document.getElementById('ui_custom_img_progress2');
                    let img_progress3 = document.getElementById('ui_custom_img_progress3');
                    let img_progress4 = document.getElementById('ui_custom_img_progress4');
                    let img_progress5 = document.getElementById('ui_custom_img_progress5');
                    let img_progress6 = document.getElementById('ui_custom_img_progress6');

                    let item = [img_progress, img_progress1, img_progress2, img_progress3, img_progress4, img_progress5, img_progress6];
                    scope.mapCustomImage.set('progress', item);
                    
                }
            }
            else if(customName.localeCompare("battery") === 0) {
                if(scope.mapCustomImage.has(customName) === false) {
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAcElEQVRoge3aQQ3CABBFwYWgCRxwrCVSSe2tOEBVG3TMGwd/8457e27HOWE9/sN/y3stAc9r/37u+hF0BYArAFwB4AoAVwC4AsAVAK4AcAWAKwBcAeAKAFcAuALAFQCuAHAFgCsAXAHgCgDXW7hsZi5uIglvj7BQmQAAAABJRU5ErkJggg==\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery1\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAnklEQVRoge3SsRlAMBRF4ccE5tGYxQ7GMIRVNNZhBI3Cl4LgFd7N+Zu0Sc41AECpqvO7x6Vbzaxx+ot+aOeJZf1bndyO+IVJB+CB+IF4D4D4wXgOgPgBeQ2A+EF5DID4gX0dAPGD+zIA4gt4OwDii3gzAOILeToA4ot5MgDiC8odAPFF5QyA+MLuBkB8cVcDIH4B0gFsx0l8AACEmdkOJVQvlLoi6ogAAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery2\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAr0lEQVRoge3SvQ3CMBRF4QsTZJ40WQV2yBjZIaxCk3VgBCSUInIB+Xkp3vX5GneW7HMFAKjVZfnuYepekpqgv7j37fMxTN1N0njC/37vP+HeqlyLxxK/MuUAIhA/kegBED+ZyAEQP6GoARA/qYgBED+xowMgfnJHBkB8A3sHQHwTewZAfCNbB0B8M1sGQHxDawdAfFNrBkB8Y/8GQHxzvwZA/AqUA3jPJ/EBADAm6QNuPImUkJz2LwAAAABJRU5ErkJggg==\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery3\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAAvUlEQVRoge3SzQ2CUBRE4dEKrIcNNdiB9EAZ9CAl2AIb2sESWEqIUX7uS3jD+Qq4gXdGAICzukz/u+nLQdIt6C2quujapi8fkp4J3jf1/XtddK8Edw/lOvsY4n/u28fXlwFEcIjfJrh7SNEDIH5mIgdA/AxFDYD4mYoYAPEztncAxM/cngEQ38DWARDfxJYBEN/I2gEQ38yaARDf0NIBEN/UkgEQ39i/ARDf3K8BEP8E5gN4Tx+P+AAAeJI0AmST46QCTRYzAAAAAElFTkSuQmCC\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery4\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA80lEQVRoge2SwRGCMBQFv1ZgPVyowQ60B8qgBy3BFrjQjpbgUYZx8BH+ywF3z5mdJPsCAAD+lcP03f3YPiPilPQX164Z7v3YXiLiZvhft//cNcPDfX+DdxXH2WHif/y7jx9fBpDBHuLb/QZvEdkDIL7gN3iLyRwA8QW/wbuJrAEQX/AbvJvJGADxBb/Bm8LWARBf8Bu8aWwZAPEFv8GbSukAiC/4Dd50SgZAfMFv8FpYOwDiC36D18aaARBf8Bu8VtQBEF/wG7x2lAEQX/AbvFX4NQDiC36DtxpLAyC+4Dd4qzIfwGv6OOIv+w1eAACAKkTEGymOPbOYKmLVAAAAAElFTkSuQmCC\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery5\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA70lEQVRoge2SwQ2CQBQFv1ZgPVyowQ60B8qgBy3BFrzQjpZgwkGRGGF3/48PmXczYQfcGWOMMbbWbYb/u+3qm5ntnO7i2FTXc9vVBzM7BdxvNH/fVNfLgr+/5089tB39Rv6L//fy7UMAbi9f+uWtQb4FBIAcAX7KAc8AkCPATz3kFQByBPg5Bz0CQI4AP/dwaQDIEeCXAEoCQI4AvxSSGwByBPgeoJwAkCPA94KlBoAcAb4nMCUA5AjwvaFzA0COAD+AOysA5AjwA7j9pgJAjgA/gPvctwCQI8AP4L5tHMB9+HLk/JYfwGWMMcb6mdkDLIuXs82HYQwAAAAASUVORK5CYII=\" >";
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_battery6\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAYCAYAAAAyC/XlAAAACXBIWXMAAAsSAAALEgHS3X78AAAA2UlEQVRoge2S0Q2CMBRFn06g6/SHGdhAd+gY7KAjuEJ/WMeOYGI0miZqgTaxl3N/CAkcyr3HCCGErDWb9/8exu5qZrtCXRy9C+dh7A5mdqrQb21+7124NHz+T/zoXdg/b7bJS4z/4iuOb+nGqQC1Pw7/z/ilBWD8xvglBWCcBvmlBGCcRvklBGCchvlLBWCcxvlLBFh9eQr8uQJQngh/jgCUJ8SfKgDlifGnCEB5gvxcAShPlJ8jAOUJ838JQHna/K8CUJ42/55UgPi4Up4uP2Y8QwghRDxmdgOtFslDadhGgAAAAABJRU5ErkJggg==\" >";
                    
                    let img_battery = document.getElementById('ui_custom_img_battery');
                    let img_battery1 = document.getElementById('ui_custom_img_battery1');
                    let img_battery2 = document.getElementById('ui_custom_img_battery2');
                    let img_battery3 = document.getElementById('ui_custom_img_battery3');
                    let img_battery4 = document.getElementById('ui_custom_img_battery4');
                    let img_battery5 = document.getElementById('ui_custom_img_battery5');
                    let img_battery6 = document.getElementById('ui_custom_img_battery6');

                    let item = [img_battery, img_battery1, img_battery2, img_battery3, img_battery4, img_battery5, img_battery6];
                    scope.mapCustomImage.set('battery', item);
                    
                }
            }
            else if(customName.localeCompare("car") === 0) {
                if(scope.mapCustomImage.has(customName) === false) {
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_car\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABVElEQVRYhe2VQU7DMBBFHxUHgBuw9gpOUHMC6A3KCUwXWZeus6h8gnKE3qC5AVllC0fIDUCWJpIbasdGod3kS5GT0Xz/yXhmzIQJEy6Nq1x9Vdo3wAA3A67vwKopTBtzygpAlfYA3AMWqCKud8AacOKPsSCuM8RfAQ08NIWpE/z3wAewBV5CfkkZUKV16f50aW0Ks8oIegnsgNtQFmaJe61l3aSKC/ay6pDDYACqtO48Xfo3QwXVh/i7WnkK+aTUwE6KqValDf5JBF+xDPyqARFxbfb8B7EYWjmSo9Y8CsArmv9E7bfmzBPXZxBH5si2+/CL0JxBvMOye/GL8NSZt72ppxPGcBYn1oZuowUwBw7yzMUWasdsTiwAKwPIbyEtNjsWJxZAFehfLb09Cid6F6jSfp+yN4UJ8nI5Q6P41JUbu4azOUMBLHrkSmxjcyZMmHAhAD/gY2j9tzX/4wAAAABJRU5ErkJggg==\" >";
                    let img_car = document.getElementById('ui_custom_img_car');

                    let item = [img_car];
                    scope.mapCustomImage.set('car', item);
                    
                }
            }
            else if(customName.localeCompare("bike")) {
                if(scope.mapCustomImage.has(customName) === false) {
                    ui_custom_img.innerHTML += "<img id=\"ui_custom_img_bike\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABUklEQVRYhe2WzVHDMBCFPxgKMB1w1gkqwOkgKSEVCA4+E846eFQBUAHpgFABnHwlHeASmGXWMyZRLGUG4QN+F4+s0dtP++QfJk0aWydD9Y3zK+DuwPR9U9nVn/Eb5z+N8ze/7XuaWPwSKIDNKABACbRNZd/HArjOsftjAKQDr6MA5Mw/CSBn/qkA2fJPBciWfxQgd/5RgNz5pwBkzT8FoMxZXHTwa6j5v0kEwBaYNZVtY4bG+QugBua924/AbWj9UAdKLX6l4+fE4gIt14VAA0v1+jDOF1EA4/xcPr26C9Ts20TmIgy1dusJeABe9N5SN1PvLtiLQIv3SeUpODfOd3EMvRPk52WtO/7hIREIgHj1F5wFTHbb1I1bNY4dzFCXCu3MXgQhgDZAL/JHvBFtoIubUMdDAAs9cIUWlzFNZdfa3qiM81vNu/OYJYJPmvTfBHwBZYFjHnwRPhAAAAAASUVORK5CYII=\" >";
                    let img_bike = document.getElementById('ui_custom_img_bike');

                    let item = [img_bike];
                    scope.mapCustomImage.set('bike', item);
                    
                }
            }

            return scope.mapCustomImage.get(customName);
        };

        this.AddCustom = function (point, obj) {
            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_CUSTOM;
            review.style.border.color.set(255, 255, 255, 255);
            //review.style.background.color.set(220, 220, 220, 255);
            review.style.background.color.set(255, 255, 255, 255);
            review.drawitem.custom = obj;
            review.drawitem.position.push(point);
            //review.style.point.size = 5;
            //review.style.point.color.set(255, 255, 0, 255);
            review.style.line.thickness = 1;
            review.style.line.color.set(41, 143, 194, 255);
            review.style.line.dash = [];

            review.text.value.length = 0; //초기화

            if (obj.progress !== undefined) {
                if (obj.progress < 10)
                    review.text.value.push("공정 진행률 : " + "  " + obj.progress + "%");
                else if (obj.progress < 100)
                    review.text.value.push("공정 진행률 : " + " " + obj.progress + "%");

                else
                    review.text.value.push("공정 진행률 : " + obj.progress + "%");
            }
            if (obj.battery !== undefined) {

                review.text.value.push(obj.name);
                review.text.value.push("X : " + point.x.toFixed(2));
                review.text.value.push("Y : " + point.y.toFixed(2));
                review.text.value.push(obj.battery + "%");
            }
            //review.text.value.push("Z = " + data[0].z.toFixed(positionalNum));
            //review.style.arrow.size = 15;
            //review.style.arrow.color.set(255, 100, 0, 255);
            view.Data.Reviews.push(review);
        };

        this.UpdateCustom = function (point, obj) {
            for (let k = view.Data.Reviews.length - 1; k >= 0; k--) {
                let review = view.Data.Reviews[k];
                if (review.itemType === VIZCore.Enum.REVIEW_TYPES.RK_CUSTOM) {
                    review.drawitem.position[0].copy(point);
                    review.drawitem.custom = obj;

                    review.text.value.length = 0; //초기화
                    if (obj.progress !== undefined) {
                        if (obj.progress < 10)
                            review.text.value.push("공정 진행률 : " + "  " + obj.progress + "%");
                        else if (obj.progress < 100)
                            review.text.value.push("공정 진행률 : " + " " + obj.progress + "%");

                        else
                            review.text.value.push("공정 진행률 : " + obj.progress + "%");
                    }
                    if (obj.battery !== undefined) {
                        review.text.value.push("X : " + point.x.toFixed(2));
                        review.text.value.push("Y : " + point.y.toFixed(2));
                        review.text.value.push(obj.battery + "%");
                    }
                }
            }
        };

        this.AddCustom_Sign = function (point, obj) {
            // Draw Path
            let review = view.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_CUSTOM;
            review.style.border.color.set(255, 255, 255, 255);
            //review.style.background.color.set(220, 220, 220, 255);
            review.style.background.color.set(255, 255, 255, 255);
            review.drawitem.custom = obj;
            review.drawitem.position.push(point);
            //review.style.point.size = 5;
            //review.style.point.color.set(255, 255, 0, 255);
            review.style.line.thickness = 1;
            review.style.line.color.set(41, 143, 194, 255);
            review.style.line.dash = [];

            review.text.value.length = 0; //초기화

            if (obj.sign !== undefined) {
                review.text.value.push("       ");
            }

            //if (obj.progress !== undefined) {
            //    if (obj.progress < 10)
            //        review.text.value.push("공정 진행률 : " + "  " + obj.progress + "%");
            //    else if (obj.progress < 100)
            //        review.text.value.push("공정 진행률 : " + " " + obj.progress + "%");
            //    else
            //        review.text.value.push("공정 진행률 : " + obj.progress + "%");
            //}
            //if (obj.battery !== undefined) {
            //    review.text.value.push(obj.name);
            //    review.text.value.push("X : " + point.x.toFixed(2));
            //    review.text.value.push("Y : " + point.y.toFixed(2));
            //    review.text.value.push(obj.battery + "%");
            //}
            view.Data.Reviews.push(review);

            return review;
        };
    }
}

export default Drawing;