//import $ from 'jquery';
class Property {
    constructor(view, VIZCore) {
        let scope = this;
        let cbClose = undefined;

        this.Visible = false;

        this.PropertyFiles = [];

        // let PropertyItem = {
        //     nodeId: -1,
        //     nNodeProps: 0,
        //     items: [],
        //     key : data.ID, // nodeId와 byteArray 연계 정보
        //     offset : -1,
        //     id_file : data.Key
        // };

        this.PropertyMap = new Map();
        this.PropertyArrayBufferMap = new Map(); // ID기준 Byte Array 관리
        this.PropertyArrayFileInfoMap = new Map(); // File별 속성 관리 
        this.CustomPropertyMap = new Map(); // 사용자 추가 속성 관리

        this.Element = {
            Panel : undefined
            
        }

        this.Info = {
            img_Expand : "<img id=\"ui_tree_img_expand\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmJkYjFjZTgzLWM1MDUtYjU0MS05YWE5LWM3MGU1MDljMmYzMCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjgwZWJlNGU2LTcxYTYtYjM0MC04YmViLTk1ZGEyNTRjMDNhYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZGIxY2U4My1jNTA1LWI1NDEtOWFhOS1jNzBlNTA5YzJmMzAiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6MzQrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7ge+U5AAAAWUlEQVRIiWP8//8/Ay0BE01NH7VgZFjAgk9Su2cSPun/V0vyGAlZQK4PiM485FhAUs4k1QKSsz0pFpBVphBrAdkFFjEWUFQaErKA4qKWcbS4HrVg1ALaWwAAYM8RJIpsTCIAAAAASUVORK5CYII=\" width=\"16px\" >",
            img_Collapse : "<img id=\"ui_tree_img_collapse\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjMwKzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjMwKzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmUyNzYxNjI5LTAxMzYtZjE0Zi1hMmQxLTY2YzI3MDYzODM4ZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY3MWUxMzY4LTZkNDctMDU0Ni05NGJjLTgxZGNjZDQ2YjEyNSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplMjc2MTYyOS0wMTM2LWYxNGYtYTJkMS02NmMyNzA2MzgzOGYiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6MzArMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7Kt1c6AAAAa0lEQVRIiWP8//8/Ay0BE01NH7VgZFjAQowi7Z5J/xkYGBjRxa+W5BHUS4oPyMowpAYRyZaQEwckWUJuJBNtCSWpiChLKLEAI1VR0wKiDCfXAqINJ8cCkgwn1QKSDWdgYGBgHK3RRi2gGAAAWDwPK3f419wAAAAASUVORK5CYII=\" width=\"16px\" >"
        }

        initProperty();


        function initProperty() {
            let divProperty = document.createElement('div');
            divProperty.id = view.GetViewID() + "div_property_container";
            divProperty.className = "div_property_container";

            let div_title = document.createElement('div');
            div_title.id = view.GetViewID() + "div_property_header";
            div_title.className = "div_property_header";
            //divProperty.appendChild(div_title);

            let div_header_text = document.createElement('div');
            div_header_text.id = view.GetViewID() + "ui_property_title";
            div_header_text.className = "ui_property_title";
            div_header_text.innerHTML = "Property";
            //div_title.appendChild(div_header_text);

            let div_contents = document.createElement('div');
            div_contents.id = view.GetViewID() + "div_property_contents";
            div_contents.className = "div_property_contents";
            div_contents.innerHTML = "";
            divProperty.appendChild(div_contents);

            //view.Container.appendChild(divProperty);
            let panel = new view.Interface.Panel(view.Container);
            panel.SetContent(divProperty);
            panel.Show(false);
            //panel.SetBorderColorFromRGBA(255, 255, 255, 255);
            panel.SetContentBackgroundColor(new VIZCore.Color(240, 240, 240, 255));
            panel.SetTitleText("Object Info.");
            let width = view.Container.clientWidth;
            let height = view.Container.clientHeight;

            let width_panel = 400;

            panel.SetLocationLeft(width - width_panel - 50);
            panel.SetSize(width_panel, height - 500);

            function PanelClose() {
                if(cbClose !== undefined)
                    cbClose();
            };
            panel.OnCloseButtonEvent(PanelClose);
            scope.Element.Panel = panel;
        }

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

        this.Show = function (visible) {
            // if ($("#" + view.GetViewID() + "div_property_container").length > 0) {
            //     scope.Visible = visible;
            //     if (visible) {
            //         $("#" + view.GetViewID() + "div_property_container").show();
            //     }
            //     else {
            //         $("#" + view.GetViewID() + "div_property_container").hide();
            //     }
            // }

            scope.Element.Panel.Show(visible);
        };

        this.Request = function (id) {
            let startTime = new Date();
            
            //console.log("Property :: Request Start");
            if (view.useVIZOn) {
                let request = {
                    parse: function (url, callback) {
                        let result = "";
                        $.ajax({
                            type: "GET",
                            url: url,
                            async: true,
                            success: function (txt) {
                                result = txt;

                                if (result) {
                                    let rows = result.split('↕');
                                    let properties = [];
                                    for (let i = 0; i < rows.length; i++) {
                                        let col = rows[i].split('§');
                                        properties.push({ key: col[0], value: col[1] });
                                    }

                                    callback(properties);

                                }
                                else {
                                    let properties = [];
                                    callback(properties);
                                }
                            },
                            error: function (xhr, ajaxOptions, thrownError) {
                                console.log(xhr.status);
                            }
                            //}).responseText;
                        });
                        //return result;
                    }
                };
                //let url = id;
                let url = view.VIZOnParam + id;
                //let url = "http://192.168.0.217:80/VIZPub/?CMD=ATTRIBUTE&PUID=281&VUID=301&FUID=8761&NODEID=" + id;
                //let url = "http://192.168.0.217:80/VIZPub/?CMD=ATTRIBUTE&PUID=281&VUID=301&FUID=8762&NODEID=" + id;
                //let url = "http://118.32.166.69:21101/VIZPub/?CMD=ATTRIBUTE&PUID=281&VUID=301&FUID=8762&NODEID=" + id;
                let result = request.parse(url, scope.set);
                //if (result) {
                //    let rows = result.split('↕');
                //    let properties = [];
                //    for (let i = 0; i < rows.length; i++) {
                //        let col = rows[i].split('§');
                //        properties.push({ key: col[0], value: col[1] });
                //    }
                //    scope.set(properties);
                //}
                //else {
                //    let properties = [];
                //    scope.set(properties);
                //}
            }
            else {
                let property = scope.GetPropertyByID(id);
                if (property !== undefined)
                    scope.Set(property, id);

                else
                    scope.ClearUI();
            }
            let currentTime = new Date();
            let timeSpan = currentTime.getTime() - startTime.getTime();
            //console.log("Property :: Request End :: ", timeSpan);
        };

        this.Set = function (properties, id) {
            let div_property = $("#" + view.GetViewID() + "div_property_container");
            if (div_property.length === 0)
                return;

            let ui_contents = document.getElementById(view.GetViewID() + 'div_property_contents');
            ui_contents.innerHTML = "";

            let customCollapsible = document.createElement('button');
            customCollapsible.className = 'vizwide3D_collapsible';
            //customCollapsible.innerHTML += "Custom Properties";
            
            let customCollapsibleImage = document.createElement('div');
            customCollapsibleImage.innerHTML = scope.Info.img_Collapse;
            customCollapsible.appendChild(customCollapsibleImage);
            let customCollapsibleText = document.createElement('label');
            customCollapsibleText.style.margin = "-18px 20px";
            customCollapsibleText.style.position = "absolute";

            customCollapsibleText.innerHTML = "Custom Properties";
            customCollapsible.appendChild(customCollapsibleText);


            let divStandard = document.createElement('div');
            let divCustom = document.createElement('div');
            

            let standardCollapsible = document.createElement('button');
            standardCollapsible.className = 'vizwide3D_collapsible';
            //standardCollapsible.innerHTML = "Properties";


            let standardCollapsibleImage = document.createElement('div');
            standardCollapsibleImage.innerHTML = scope.Info.img_Collapse;
            standardCollapsible.appendChild(standardCollapsibleImage);
            let standardCollapsibleText = document.createElement('label');
            standardCollapsibleText.style.margin = "-18px 20px";
            standardCollapsibleText.style.position = "absolute";

            standardCollapsibleText.innerHTML = "Properties";
            standardCollapsible.appendChild(standardCollapsibleText);


            let customContent = document.createElement('div');
            customContent.className = 'vizwide3D_collapsible_content';
            let standardContent = document.createElement('div');
            standardContent.className = 'vizwide3D_collapsible_content';

            let tableData = document.createElement('table');
            tableData.width = '100%';
            tableData.border = "0";

            let tableCustomData = document.createElement('table');
            tableCustomData.width = '100%';
            tableCustomData.border = "0";

            let addPropertyElement = function(key, value, element){
                let tr = document.createElement('tr');
                let tdKey = document.createElement('td');
                tdKey.className = "ui_property_key";
                tdKey.innerHTML = '<label id="upk' + key + '">' + key + '</label>';
                let tdValue = document.createElement('td');
                tdValue.className = "ui_property_value";
                //<a href="https://example.com">Website</a>
                if (value.includes('http://') || value.includes('HTTP://')) {
                    tdValue.innerHTML = '<a href="' + value + '" target="_blank">' + value + '</a>';
                    //tdValue.innerHTML = '<a href="javascript:void(0);" onclick="window.open(\'' + properties[i].value + '\', \'UDA_LINK\', \'top=20,left=20,width=1024,height=768,menubar=no,toolbar=no,status=no\')"; >' + properties[i].value + '</a>';
                }
                else
                    tdValue.innerHTML = '<label id="upv' + key + '">' + value + '</label>';

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                element.appendChild(tr);
            }

            let addCustomPropertyElement = function(value, key){
                if(key !== id)
                    return;
                for (let index = 0; index < value.length; index++) {
                    const element = value[index];
                    addPropertyElement(element.key, element.value, tableCustomData);    
                }
                
            }
            scope.CustomPropertyMap.forEach(addCustomPropertyElement);

            for (let i = 0; i < properties.length; i++) {
                addPropertyElement(properties[i].key, properties[i].value, tableData);
            }

            
            divStandard.appendChild(standardCollapsible);
            divStandard.appendChild(standardContent);
            standardContent.appendChild(tableData);

            divCustom.appendChild(customCollapsible);
            divCustom.appendChild(customContent);
            customContent.appendChild(tableCustomData);

            if(scope.CustomPropertyMap.size > 0)
                ui_contents.appendChild(divCustom);
            if(properties.length > 0)
                ui_contents.appendChild(divStandard);

            let toggle = function(element, child, image){
                element.classList.toggle("active");
                {
                    let content = child;
                    if (content.style.display === "block") {
                        content.style.display = "none";
                        image.innerHTML = scope.Info.img_Collapse;
                    } 
                    else {
                        content.style.display = "block";
                        image.innerHTML = scope.Info.img_Expand;
                    }
                }
            }

            toggle(standardCollapsible, standardContent, standardCollapsibleImage);

            customCollapsible.addEventListener("click", function() {
                toggle(customCollapsible, customContent, customCollapsibleImage);
            });

            standardCollapsible.addEventListener("click", function() {
                toggle(standardCollapsible, standardContent, standardCollapsibleImage);
            });
        };

        this.ClearUI = function(){
            let properties = [];
            scope.Set(properties);
        };
    
        this.Clear = function () {
            let properties = [];
            scope.Set(properties);

            scope.PropertyFiles = [];
            scope.PropertyMap.clear();
            scope.PropertyArrayBufferMap.clear(); // ID기준 Byte Array 관리
            scope.CustomPropertyMap.clear(); // 사용자 추가 속성 관리
            
        };

        this.Init = function () {
            //initProperty();
        };

        /**
         * 속성 키 목록 반환
         * @returns {Array} 키 목록 배열
         * @example
         * let keys = [];
         *
         * keys = vizwide3d.Object3D.UDA.GetKeys();
         */
        this.GetKeys = function () {
            let keys = new Map();

            if(view.Configuration.Property.UseArrayBuffer)
            {
                for (let pVals of scope.PropertyMap.values()) {
                    let buffer = scope.PropertyArrayBufferMap.get(pVals.key);
                    let proeprty = readPropertyByBuffer(pVals, buffer, 1);

                    for (let i = 0; i < proeprty.length; i++) {
                        if (!keys.has(proeprty[i].key)) {
                            keys.set(proeprty[i].key, proeprty[i].key);
                        }
                    }
                }
            }
            else{
                for (let pVals of scope.PropertyMap.values()) {
                    for (let i = 0; i < pVals.length; i++) {
                        if (!keys.has(pVals[i].key)) {
                            keys.set(pVals[i].key, pVals[i].key);
                            //console.log(pVals[i].key);
                        }
                    }
                }
            }

            let keyArray = [];
            for (let item of keys.keys()) {
                keyArray.push(item);
            }

            return keyArray;
        };

        /**
         * 속성 키에 해당하는 값 목록 반환
         * @returns {Array} 값(Value) 목록 배열
         * @example
         * let values = [];
         *
         * values = vizwide3d.Object3D.UDA.GetValues("TYPE");
         */
        this.GetValues = function (key) {
            let values = new Map();

            if(view.Configuration.Property.UseArrayBuffer)
            {
                for (let pVals of scope.PropertyMap.values()) {
                    let buffer = scope.PropertyArrayBufferMap.get(pVals.key);
                    let proeprty = readPropertyByBuffer(pVals, buffer);

                    for (let i = 0; i < proeprty.length; i++) {
                        if (proeprty[i].key.localeCompare(key) === 0) {
                            if (!values.has(proeprty[i].value)) {
                                values.set(proeprty[i].value, proeprty[i].value);
                            }
                        }
                    }
                }
            }
            else{
                for (let pVals of scope.PropertyMap.values()) {
                    for (let i = 0; i < pVals.length; i++) {
                        if (pVals[i].key.localeCompare(key) === 0) {
                            if (!values.has(pVals[i].value)) {
                                values.set(pVals[i].value, pVals[i].value);
                                //console.log(pVals[i].value);
                            }
                        }
                    }
                }
            }

            let valueArray = [];
            for (let item of values.keys()) {
                valueArray.push(item);
            }

            return valueArray;
        };

        this.Add = function (arrproperty, key, buffer, data) {
            if(view.Configuration.Property.UseArrayBuffer)
            {
                for (let i = 0; i < arrproperty.length; i++) {
                    let property = arrproperty[i];
                    scope.PropertyMap.set(property.nodeId, property);
                }
    
                // byteArray 관리
                scope.PropertyArrayBufferMap.set(key, buffer);

                if(scope.PropertyArrayFileInfoMap.has(data.Key))
                {
                    let arr = scope.PropertyArrayFileInfoMap.get(data.Key);
                    arr.push(key);
                    scope.PropertyArrayFileInfoMap.set(data.Key, arr);
                }
                else{
                    let arr = [];
                    arr.push(key);
                    scope.PropertyArrayFileInfoMap.set(data.Key, arr);
                }
            }
            else{
                for (let i = 0; i < arrproperty.length; i++) {
                    let property = arrproperty[i];
                    scope.PropertyMap.set(property.nodeId, property.items);
                }
    
                // byteArray 관리
                scope.PropertyArrayBufferMap.set(key, buffer);
            }
        };

        /**
         * 해당 Node에 속성 설정
         * @param {Number} nodeId 
         * @param {Array<PropertyValueItem>} items 
         */
        this.SetPropertyByItem = function (nodeId, items) {
            if(view.Configuration.Property.UseArrayBuffer)
            {
                scope.CustomPropertyMap.set(nodeId, items);
            }
                
            else
                scope.PropertyMap.set(nodeId, items);
        };

        
        /**
         * 해당 Node에 속성 설정
         * @param {Number} nodeId 
         * @param {String} key
         * @param {String} value
         */
         this.AddProperty = function (nodeId, key, value) {

            let item = view.Data.PropertyValueItem(key, value);
            scope.AddPropertyByItem(nodeId, [ item ] );
        };
        
        /**
         * 해당 Node에 속성 추가
         * @param {Number} nodeId 
         * @param {Array<PropertyValueItem>} items 
         */
         this.AddPropertyByItem = function (nodeId, items) {
            if(view.Configuration.Property.UseArrayBuffer)
            {
                scope.SetPropertyByItem(nodeId, items);
            }
            else if(scope.PropertyMap.has(nodeId)) {
                //기존 데이터에서 추가
                let propertiesData = scope.PropertyMap.get(nodeId);
                for(let i = 0 ; i < items.length ; i++) {
                    propertiesData.push(items[i]);
                }
            }
            else {
                scope.SetPropertyByItem(nodeId, items);
            }
        };

        /**
         * 해당 Node의 속성을 모두 삭제
         * @param {Number} nodeId 
         */
        this.DeletePropertyID = function (nodeId){

            scope.PropertyMap.delete(nodeId);
            scope.CustomPropertyMap.delete(nodeId);
            
        };

        /**
         * 해당 Node의 속성 key 삭제
         * @param {Number} nodeId 
         * @param {String} iKey 속성 키
         */
        this.DeletePropertyKeyByID = function (nodeId, iKey) {

            if(scope.PropertyMap.has(nodeId)) {
                //기존 데이터에서 추가
                let items = scope.PropertyMap.get(nodeId);
                for(let i = 0 ; i < items.length ; i++) {
                    if(items[i].key.localeCompare(iKey) !== 0) {
                        continue;
                    }
                    
                    items.splice(i, 1);
                    break;
                }
            }

        };

        let decode_utf8 = function (s) {
            return decodeURIComponent(escape(s));
        };

        /**
         * Buffer 읽기
         * @param {*} property PropertyItem
         * @param {DataView} dataView Array<Byte>
         * @param {Number} readOnlyType 0 or undefined = Key, Value 읽기, 1 = Key 만 읽기, 2 = Value만 읽기
         * @returns 
         */
        function readPropertyByBuffer(property, dataView, readOnlyType){
            let items = [];
            let offset = property.offset;

            //속도 향상을 위해 각각 읽기 파라미터 추가
            // 22-12-08
            if(readOnlyType === undefined)
                readOnlyType = 0;

            for (let pi = 0; pi < property.nNodeProps; pi++) {
                let item = {
                    key: null,
                    value: null
                    //valueType: null
                };
                let len = dataView.getUint32(offset, true);
                offset += 4;

                //let keyBuffer = new Uint8Array(len);
                //for (let m = 0; m < len; m++) {
                //    keyBuffer[m] = dataView.getUint8(offset + m, true);
                //}
                if(readOnlyType === 0 || readOnlyType === 1) {
                    let keyBuffer = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, len);
                    item.key = String.fromCharCode.apply(null, keyBuffer);
                    try {
                        item.key = decode_utf8(item.key);
                    } catch (e) {
                    }
                }
                offset += len;

                len = dataView.getUint16(offset, true);
                offset += 2;

                len = dataView.getUint32(offset, true);
                offset += 4;

                //let valueBuffer = new Uint8Array(len);
                //for (let m = 0; m < len; m++) {
                //    valueBuffer[m] = dataView.getUint8(offset + m, true);
                //}
                if(readOnlyType === 0 || readOnlyType === 2) {
                    let valueBuffer = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, len);
                    item.value = String.fromCharCode.apply(null, valueBuffer);
                    try {
                        item.value = decode_utf8(item.value);
                    } catch (e) {
                    }
                }
                offset += len;

                //item.valType = dataView.getUint16(offset, true);
                offset += 2;

                //Property.items.push(item);
                items[pi] = item;
            }
            return items;
        }

        this.GetPropertyByID = function (id) {
            if(view.Configuration.Property.UseArrayBuffer)
            {
                // 구조 정보를 가지는 item
                let item = scope.PropertyMap.get(id);
                if(item !== undefined)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(item.key);
                    let proeprty = readPropertyByBuffer(item, buffer);
                    return proeprty;
                }
                else{
                    if (view.Configuration.Property.NavigateToParentNode) {
                        // 재귀
                        let property = scope.GetRecursiveProperty(id);
                        return property;
                    }
                }
            }
            else{
                // 환경 설정에 따른 부모 노드 속성 검색
                let property = scope.PropertyMap.get(id);
                if (property === undefined || property.length === 0) {
                    if (view.Configuration.Property.NavigateToParentNode) {
                        // 재귀
                        property = scope.GetRecursiveProperty(id);
                    }
                }

                return property;
            }
        };

        this.GetRecursiveProperty = function (id) {
            let node = view.Tree.GetNodeInfo(id);
            if (node !== undefined) {

                let node_parent = view.Tree.GetParentNodeInfo(node);
                if (node_parent !== undefined) {
                    let property = scope.GetPropertyByID(node_parent.node_id);//scope.PropertyMap.get(node_parent.node_id);
                    if (property !== undefined && property.length > 0) {
                        return property;
                    }
                    else {
                        return scope.GetRecursiveProperty(node_parent.node_id);
                    }
                }
                else {
                    return undefined;
                }
            }
            else {
                return undefined;
            }
        };

        this.GetPropertyValue = function (id, iKey) {

            if(view.Configuration.Property.UseArrayBuffer)
            {
                let result = "";
                // 구조 정보를 가지는 item
                let item = scope.PropertyMap.get(id);
                if(item !== undefined)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(item.key);
                    let proeprty = readPropertyByBuffer(item, buffer);
                   
                    for (let i = 0; i < proeprty.length; i++) {
                        if (proeprty[i].key.localeCompare(iKey) === 0) 
                        {
                            result = proeprty[i].value;
                            break;
                        }
                    }
                }
                return result;
            }
            else{
                let result = "";
                let items = scope.PropertyMap.get(id);
                if (items !== undefined) {
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        if (item.key.localeCompare(iKey) === 0) {
                            result = item.value;
                            break;
                        }
                    }
                    return result;
                }
                else {
                    return "";
                }
            }
        };

        this.GetNodeIDsByKeyValue = function (iKey, iValue) {
            let mapNode = new Map();
            let nodes = [];
            let search = function (items, nodeid, map) {
                if(view.Configuration.Property.UseArrayBuffer)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(items.key);
                    let proeprty = readPropertyByBuffer(items, buffer);

                    for (let i = 0; i < proeprty.length; i++) {
                        if (proeprty[i].key.localeCompare(iKey) === 0 && 
                            (iValue === undefined || proeprty[i].value.localeCompare(iValue) === 0) ) 
                        {
                            // 중복 제외
                            if (!mapNode.has(nodeid)) {
                                mapNode.set(nodeid, nodeid);
                                nodes.push(nodeid);
                            }
                            break;
                        }
                    }
                }
                else{
                    // let bodies = view.Data.GetBody(nodeid);
                    // // 파트 제외
                    // if (bodies === undefined)
                    //     return;

                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        //iValue === undefined 인경우 iKey만 검색
                        if (item.key.localeCompare(iKey) === 0 && 
                            (iValue === undefined || item.value.localeCompare(iValue) === 0) ) {
                            //nodes.push(nodeid);
                            // 중복 제외
                            if (!mapNode.has(nodeid)) {
                                mapNode.set(nodeid, nodeid);
                                nodes.push(nodeid);
                            }
                            break;
                        }
                    }
                }
            };
            scope.PropertyMap.forEach(search);

            return nodes;
        };

        /**
         * 
         * @param {String} iValue 속성 Value
         * @param {Boolean} fullMatch
         * @returns {Array<Number>}
         */
        this.GetNodeIDsByValue = function(iValue, fullMatch){
            let mapNode = new Map();
            let nodes = [];
            let compareValue = iValue.toUpperCase();
            let search = function (items, nodeid, map) {
                if(view.Configuration.Property.UseArrayBuffer)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(items.key);
                    let proeprty = readPropertyByBuffer(items, buffer, 2);

                    for (let i = 0; i < proeprty.length; i++) {
                        if(fullMatch)
                        {
                            if (proeprty[i].value.toUpperCase().localeCompare(compareValue) === 0) 
                            {
                                // 중복 제외
                                if (!mapNode.has(nodeid)) {
                                    mapNode.set(nodeid, nodeid);
                                    nodes.push(nodeid);
                                }
                                break;
                            }
                        }
                        else{
                            if (proeprty[i].value.toUpperCase().includes(compareValue) ) 
                            {
                                // 중복 제외
                                if (!mapNode.has(nodeid)) {
                                    mapNode.set(nodeid, nodeid);
                                    nodes.push(nodeid);
                                }
                                break;
                            }
                        }
                    }
                }
                else{
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        //iValue === undefined 인경우 iKey만 검색
                        if(fullMatch){
                                if (item.value.toUpperCase().localeCompare(compareValue) === 0) {
                                // 중복 제외
                                if (!mapNode.has(nodeid)) {
                                    mapNode.set(nodeid, nodeid);
                                    nodes.push(nodeid);
                                }
                                break;
                            }
                        }
                        else{
                            if (item.value.toUpperCase().includes(compareValue)) {
                                // 중복 제외
                                if (!mapNode.has(nodeid)) {
                                    mapNode.set(nodeid, nodeid);
                                    nodes.push(nodeid);
                                }
                                break;
                            }
                        }
                        
                    }
                }
            };
            scope.PropertyMap.forEach(search);

            return nodes;
        };

        this.GetBodyIDsByKeyValue = function (iKey, iValue) {
            let mapIDs = new Map();
            let ids = [];
            let search = function (items, nodeid, map) {

            if(view.Configuration.Property.UseArrayBuffer)
            {
                let buffer = scope.PropertyArrayBufferMap.get(items.key);
                let proeprty = readPropertyByBuffer(items, buffer);

                for (let i = 0; i < proeprty.length; i++) {
                    if (proeprty[i].key.localeCompare(iKey) === 0 && 
                        (iValue === undefined || proeprty[i].value.localeCompare(iValue) === 0) ) 
                    {
                        let id_body = view.Tree.GetBodyId(nodeid);
                        for (let j = 0; j < id_body.length; j++) {
                            // 중복 제외
                            if (!mapIDs.has(id_body[j])) {
                                mapIDs.set(id_body[j], id_body[j]);
                                ids.push(id_body[j]);
                            }
                        }
                        break;
                    }
                }
            }
            else{
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        //iValue === undefined 인경우 iKey만 검색
                        //  if(item.key.localeCompare(iKey) === 0
                        //     )
                        //     {
                        //         console.log("ID ::", [iKey, item.value]);
                        //         //return;
                        //     }
                        if (item.key.localeCompare(iKey) === 0 && 
                            (iValue === undefined || item.value.localeCompare(iValue) === 0) ) {

                            let id_body = view.Tree.GetBodyId(nodeid);
                            for (let j = 0; j < id_body.length; j++) {
                                // 중복 제외
                                if (!mapIDs.has(id_body[j])) {
                                    mapIDs.set(id_body[j], id_body[j]);
                                    ids.push(id_body[j]);
                                }
                            }
                            break;
                        }
                    }
                }
            };
            scope.PropertyMap.forEach(search);

            return ids;
        };

        this.GetPropertyTreeMap = function(){
            let mapTree = new Map();

            let addTreeMap = function(key, value, nodeid){

                if(value.localeCompare('') !== 0)
                {
                    

                if(mapTree.has(key))
                {
                    let mv = mapTree.get(key);
                    let nodes = mv.get(value);
                    if(nodes !== undefined)
                    {
                        nodes.push(nodeid);
                        // mv.set(value, nodes);
                        // mapTree.set(key, mv);
                    }
                    else{
                        nodes = [];
                        nodes.push(nodeid);
                        mv.set(value, nodes);
                        //mapTree.set(key, mv);    
                    }
                }
                else{
                    let mv = new Map();
                    let nodes = [];
                    nodes.push(nodeid);
                    mv.set(value, nodes);
                    mapTree.set(key, mv);
                }
            }
            }

            let search = function (items, nodeid, map) {
                if(view.Configuration.Property.UseArrayBuffer)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(items.key);
                    let property = readPropertyByBuffer(items, buffer);

                    for (let i = 0; i < property.length; i++) {
                        let key = property[i].key;
                        let value = property[i].value;
                        addTreeMap(key, value, nodeid);
                    }
                }
                else{
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];

                        let key = item.key;
                        let value = item.value;
                        addTreeMap(key, value, nodeid);
                    }
                }
            };

            scope.PropertyMap.forEach(search);

            return {
                treeMap : mapTree
            };
        };

        this.GetPropertyMap = function(){
            let mapKey = new Map();
            let mapValue = new Map();
            let mapKeyValue = new Map();

            let mapTree = new Map();

            let addTreeMap = function(key, value, nodeid){
                if(mapTree.has(key))
                {
                    let mv = mapTree.get(key);
                    let nodes = mv.get(value);
                    if(nodes !== undefined)
                    {
                        nodes.push(nodeid);
                        mv.set(value, nodes);
                        mapTree.set(key, mv);
                    }
                    else{
                        nodes = [];
                        nodes.push(nodeid);
                        mv.set(value, nodes);
                        mapTree.set(key, mv);    
                    }
                }
                else{
                    let mv = new Map();
                    let nodes = [];
                    nodes.push(nodeid);
                    mv.set(value, nodes);
                    mapTree.set(key, mv);
                }
            }

            let addMap = function(key, value, nodeid)
            {
                let keyvalue = key + value;
                
                addTreeMap(key, value, nodeid);

                if(mapKey.has(key))
                {
                    let nodes = mapKey.get(key);
                    nodes.push(nodeid);
                    mapKey.set(key, nodes);
                }
                else{
                    let nodes = [];
                    nodes.push(nodeid);
                    mapKey.set(key, nodes);
                }

                if(mapValue.has(value))
                {
                    let nodes = mapValue.get(value);
                    nodes.push(nodeid);
                    mapValue.set(value, nodes);
                }
                else{
                    let nodes = [];
                    nodes.push(nodeid);
                    mapValue.set(value, nodes);
                }

                if(mapKeyValue.has(keyvalue))
                {
                    let nodes = mapKeyValue.get(keyvalue);
                    nodes.push(nodeid);
                    mapKeyValue.set(keyvalue, nodes);
                }
                else{
                    let nodes = [];
                    nodes.push(nodeid);
                    mapKeyValue.set(keyvalue, nodes);
                }
            }
            
            let search = function (items, nodeid, map) {
                if(view.Configuration.Property.UseArrayBuffer)
                {
                    let buffer = scope.PropertyArrayBufferMap.get(items.key);
                    let property = readPropertyByBuffer(items, buffer);

                    for (let i = 0; i < property.length; i++) {
                        let key = property[i].key;
                        let value = property[i].value;
                        addMap(key, value, nodeid);
                    }
                }
                else{
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];

                        let key = item.key;
                        let value = item.value;
                        addMap(key, value, nodeid);
                    }
                }
            };

            scope.PropertyMap.forEach(search);

            return {
                keyMap : mapKey,
                valueMap : mapValue,
                keyvalueMap : mapKeyValue,
                treeMap : mapTree
            };
        };

        // 23) SB_TAG 입력시 - ex) LK034
        // 노드 추출
        // 면적 정보로 파이프 "03) S5_UTLITY" = PIPE 추출
        this.GetInnerObjectsByProperty = function (targetKey, targetValue, sourceKey, sourceValue) {
            let result = [];
            // targetKey에 맞는 노드 검색
            let targetNodes = scope.GetNodeIDsByKeyValue(targetKey, targetValue);
            // sourceKey에 맞는 노드 검색
            let sourceNodes = scope.GetNodeIDsByKeyValue(sourceKey, sourceValue);

            if (targetNodes.length !== 0 && sourceNodes.length !== 0) {
                // 면적 계산
                for (let i = 0; i < targetNodes.length; i++) {
                    let target = targetNodes[i];

                    //let targetBBox = view.Data.GetObjectBBox(target);
                    let targetResult = getBodiesBBox(target);
                    if (targetResult.result === undefined)
                        continue;
                    let targetBBox = targetResult.bbox;

                    for (let j = 0; j < sourceNodes.length; j++) {
                        // 영역 포함 확인
                        let source = sourceNodes[j];
                        //let sourceBBox = view.Data.GetObjectBBox(source);
                        let sourceResult = getBodiesBBox(source);
                        if (sourceResult.result === undefined)
                            continue;
                        let sourceBBox = sourceResult.bbox;

                        if (((sourceBBox.min.x <= targetBBox.min.x && (sourceBBox.max.x >= targetBBox.min.x && sourceBBox.max.x <= targetBBox.max.x))
                            || ((sourceBBox.min.x >= targetBBox.min.x && sourceBBox.min.x <= targetBBox.max.x) && sourceBBox.max.x >= targetBBox.max.x)
                            || (sourceBBox.min.x >= targetBBox.min.x && sourceBBox.max.x <= targetBBox.max.x)
                            || (sourceBBox.min.x <= targetBBox.min.x && sourceBBox.max.x >= targetBBox.max.x))
                            && ((sourceBBox.min.y <= targetBBox.min.y && (sourceBBox.max.y >= targetBBox.min.y && sourceBBox.max.y <= targetBBox.max.y))
                                || ((sourceBBox.min.y >= targetBBox.min.y && sourceBBox.min.y <= targetBBox.max.y) && sourceBBox.max.y >= targetBBox.max.y)
                                || (sourceBBox.min.y >= targetBBox.min.y && sourceBBox.max.y <= targetBBox.max.y)
                                || (sourceBBox.min.y <= targetBBox.min.y && sourceBBox.max.y >= targetBBox.max.y))) {
                            result.push(source);
                        }
                    }
                }
            }
            return result;
        };

        function getBodiesBBox(id) {
            let result = {
                result: undefined,
                bbox: undefined
            };
            let bbox = new VIZCore.BBox();
            let bodies = view.Data.GetBody(id);
            if (bodies === undefined || bodies.length === 0)
                return result;

            let firstBBox = true;
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];

                if (firstBBox) {
                    bbox.min.copy(body.BBox.min);
                    bbox.max.copy(body.BBox.max);
                    firstBBox = false;
                }
                else {
                    bbox.min.min(body.BBox.min);
                    bbox.max.max(body.BBox.max);
                }
            }

            bbox.update();
            
            result.result = true;
            result.bbox = bbox;

            return result;
        }

        this.GetInnerObjects = function (targetKey, targetValue) {
            let result = [];
            // targetKey에 맞는 노드 검색
            let targetNodes = scope.GetNodeIDsByKeyValue(targetKey, targetValue);
            if (targetNodes.length !== 0) {
                // 면적 계산
                for (let t = 0; t < targetNodes.length; t++) {
                    let target = targetNodes[t];
                    //let targetBBox = view.Data.GetObjectBBox(target);
                    // let targetResult = getBodiesBBox(target);
                    // if (targetResult.result === undefined)
                    //     continue;
                    // let targetBBox = targetResult.bbox;
                    let targetBBox = view.Tree.GetBBox(target);

                    // 바디 검색
                    for (let i = 0; i < view.Data.Objects.length; i++) {
                        let object = view.Data.Objects[i];
                        for (let j = 0; j < object.tag.length; j++) {
                            let body = object.tag[j];

                            //let sourceBBox = view.Data.GetObjectBBox(body.bodyId);
                            // let sourceResult = getBodiesBBox(body.bodyId);
                            // if (sourceResult.result === undefined)
                            //     continue;
                            // let sourceBBox = sourceResult.bbox;
                            let sourceBBox = view.Tree.GetBBox(body.bodyId);

                            if (((sourceBBox.min.x < targetBBox.min.x && (sourceBBox.max.x > targetBBox.min.x && sourceBBox.max.x < targetBBox.max.x))
                                || ((sourceBBox.min.x > targetBBox.min.x && sourceBBox.min.x < targetBBox.max.x) && sourceBBox.max.x > targetBBox.max.x)
                                || (sourceBBox.min.x > targetBBox.min.x && sourceBBox.max.x < targetBBox.max.x)
                                || (sourceBBox.min.x < targetBBox.min.x && sourceBBox.max.x > targetBBox.max.x))
                                && ((sourceBBox.min.y < targetBBox.min.y && (sourceBBox.max.y > targetBBox.min.y && sourceBBox.max.y < targetBBox.max.y))
                                    || ((sourceBBox.min.y > targetBBox.min.y && sourceBBox.min.y < targetBBox.max.y) && sourceBBox.max.y > targetBBox.max.y)
                                    || (sourceBBox.min.y > targetBBox.min.y && sourceBBox.max.y < targetBBox.max.y)
                                    || (sourceBBox.min.y < targetBBox.min.y && sourceBBox.max.y > targetBBox.max.y))) {
                                result.push(body.bodyId);
                            }
                        }
                    }
                }
            }
            return result;
        };

        // 03) S5_UTLITY 명 입력시 전체 선택
        this.SelectByProperty = function (iKey, iValue) {
            let nodes = scope.GetNodeIDsByKeyValue(iKey, iValue);

            view.Tree.SelectMulti(nodes, true, false);

            return nodes;
        };

        this.GetBBoxByID = function (id) {
            return getBodiesBBox(id).bbox;
        };

        this.GetBBoxInfoByID = function (id) {
            return getBodiesBBox(id);
        };

        this.DataClear = function () {
            scope.PropertyMap.Clear();
        };

        this.OnCloseButtonEvent = function(cbclclick) {
            cbClose = cbclclick;
        };
    }
}

export default Property;