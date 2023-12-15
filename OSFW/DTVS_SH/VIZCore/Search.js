class Search {
    constructor(view, VIZCore) {
        let scope = this;

        this.BindContainer = undefined;


        function init() {
            scope.BindContainer = document.getElementById("view_info");

            let div_search = document.createElement('div');
            div_search.id = "VIZCore_Search";
            div_search.className = "search_control";
            scope.BindContainer.appendChild(div_search);

            let div_setting = document.createElement('div');
            div_setting.id = "VIZCore_Setting";
            div_setting.className = "search_control";
            scope.BindContainer.appendChild(div_setting);

            let div_title = document.createElement('div');
            div_title.id = "div_title_search";
            div_title.className = "div_header";
            div_title.innerHTML = "Search";
            div_search.appendChild(div_title);

            let div_item = document.createElement('div');
            div_item.id = "div_item";
            div_item.className = "";
            div_search.appendChild(div_item);

            let div_content_group_find = document.createElement('div');
            div_content_group_find.id = "div_content_group_find";
            div_content_group_find.className = "content_inside";
            div_item.appendChild(div_content_group_find);

            let div_content_box_find = document.createElement('div');
            div_content_box_find.id = "div_content_box_find";
            div_content_box_find.className = "content_box";
            div_content_group_find.appendChild(div_content_box_find);

            let div_label_search = document.createElement('div');
            div_label_search.id = "div_label_search";
            div_label_search.className = "div_label_search";
            div_label_search.innerHTML = "Car Name";
            //div_label_search.for = "div_text_search";
            div_content_box_find.appendChild(div_label_search);

            let div_text_search = document.createElement('textarea');
            div_text_search.id = "div_text_search";
            div_text_search.name = "div_text_search";
            div_text_search.className = "div_text_search";
            div_text_search.rows = 1;
            div_text_search.innerHTML = "AAA 000003";
            div_content_box_find.appendChild(div_text_search);

            let div_button_search = document.createElement('button');
            div_button_search.id = "div_button_search";
            div_button_search.className = "div_button_search";
            div_button_search.innerHTML = "Find";
            div_content_box_find.appendChild(div_button_search);

            if(view.useJquery){
                if ($('#div_button_search').length > 0) {
                    $('#div_button_search').bind("contextmenu", function (e) {
                        e.preventDefault();
                    });
                    $("#div_button_search").click(function () {
                        let text = $('#div_text_search').val();
                        text = text.toUpperCase();
    
                        let key = view.Animation.Hyundai_GetSeqKeyByText(text);
                        if (key === -1) {
                            alert("검색 대상이 없습니다.");
                            return;
                        }
                        let objects = view.Animation.Hyundai_GetSeqObjects(key);
    
                        if (objects.length === 0) {
                            alert("검색 대상이 없습니다.");
                            return;
                        }
    
                        //포커스 해야 하는 대상 바운드 박스
                        let focusObject = [];
                        let focusObjectNum = 0;
                        for (let j = 0; j < 5; j++) {
                            if (objects[j] === undefined)
                                continue;
    
                            let carObjNum = objects[j].length;
                            for (let k = 0; k < carObjNum; k++) {
                                focusObject[focusObjectNum] = objects[j][k];
                                focusObjectNum++;
                            }
                        }
    
                        if(focusObjectNum.length > 0)
                        {
                            if(focusObjectNum.length > 1)
                            {
                                let action = view.Data.ShapeAction.GetAction(focusObject[1].object.id_file, focusObject[1].origin_id);                        
                                action.selection = true;
                                focusObject[1].object.flag.updateProcess = true;
                            }
    
                            let boundBox = view.Data.GetBBoxFormMatrix(focusObject);
                            //view.Camera.cameraAnimation = true;
                            view.Camera.FocusBBox(boundBox);
                            //view.Camera.cameraAnimation = false;
                        }
                    });
                }
            } else {
                let div_button_search = document.getElementById('div_button_search');
                if (div_button_search) {
                    div_button_search.addEventListener('contextmenu', function(e){
                        e.preventDefault();
                    });

                    div_button_search.addEventListener('click', function () {
                        let text = document.getElementById('div_text_search').value;
                        text = text.toUpperCase();
    
                        let key = view.Animation.Hyundai_GetSeqKeyByText(text);
                        if (key === -1) {
                            alert("검색 대상이 없습니다.");
                            return;
                        }
                        let objects = view.Animation.Hyundai_GetSeqObjects(key);
    
                        if (objects.length === 0) {
                            alert("검색 대상이 없습니다.");
                            return;
                        }
    
                        //포커스 해야 하는 대상 바운드 박스
                        let focusObject = [];
                        let focusObjectNum = 0;
                        for (let j = 0; j < 5; j++) {
                            if (objects[j] === undefined)
                                continue;
    
                            let carObjNum = objects[j].length;
                            for (let k = 0; k < carObjNum; k++) {
                                focusObject[focusObjectNum] = objects[j][k];
                                focusObjectNum++;
                            }
                        }
    
                        if(focusObjectNum.length > 0)
                        {
                            if(focusObjectNum.length > 1)
                            {
                                let action = view.Data.ShapeAction.GetAction(focusObject[1].object.id_file, focusObject[1].origin_id);                        
                                action.selection = true;
                                focusObject[1].object.flag.updateProcess = true;
                            }
    
                            let boundBox = view.Data.GetBBoxFormMatrix(focusObject);
                            //view.Camera.cameraAnimation = true;
                            view.Camera.FocusBBox(boundBox);
                            //view.Camera.cameraAnimation = false;
                        }
                    });
                }
            }

            let div_title_setting = document.createElement('div');
            div_title_setting.id = "div_title_search";
            div_title_setting.className = "div_header";
            div_title_setting.innerHTML = "Setting";
            div_setting.appendChild(div_title_setting);

            let div_content_group_animation = document.createElement('div');
            div_content_group_animation.id = "div_content_group_animation";
            div_content_group_animation.className = "content_inside";
            div_setting.appendChild(div_content_group_animation);

            let div_content_box_animation = document.createElement('div');
            div_content_box_animation.id = "div_content_box_animation";
            div_content_box_animation.className = "content_box";
            div_content_group_animation.appendChild(div_content_box_animation);

            let div_content_box_animation_label_1 = document.createElement('div');
            div_content_box_animation_label_1.id = "div_content_box_animation_label_1";
            div_content_box_animation_label_1.className = "content_label";
            div_content_box_animation_label_1.innerHTML = "<label>AGV screen focus</label>";
            div_content_box_animation.appendChild(div_content_box_animation_label_1);

            let div_content_box_animation_input_1 = document.createElement('div');
            div_content_box_animation_input_1.id = "div_content_box_animation_input_1";
            div_content_box_animation_input_1.className = "content_input";
            //div_content_box_animation_input_1.innerHTML = "<input type=\"checkbox\">";
            let inputAnimationEnable = document.createElement('div');
            inputAnimationEnable.id = "inputAnimationEnable";
            inputAnimationEnable.innerHTML = "<img id=\"ui_animation_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC\" width=\"16px\" >";
            div_content_box_animation_input_1.appendChild(inputAnimationEnable);

            div_content_box_animation.appendChild(div_content_box_animation_input_1);

            if(view.useJquery){
                let input_animation_enable = $("#inputAnimationEnable");
                if (input_animation_enable.length > 0) {
                    input_animation_enable.prop("checked", view.Animation.useAGVFocus);
                    if (view.Animation.useAGVFocus) {
                        $("#ui_animation_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    }
                    else {
                        $("#ui_animation_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    }
                    input_animation_enable.click(function () {
                        view.Animation.Hyundai_UseAGVFocus(!view.Animation.useAGVFocus);
                        if (view.Animation.useAGVFocus) {
                            $("#ui_animation_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                        }
                        else {
                            $("#ui_animation_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                        }
                    });
                }
            } else {
                let input_animation_enable = document.getElementById('inputAnimationEnable');
                if (input_animation_enable) {
                    input_animation_enable.setAttribute("checked", view.Animation.useAGVFocus);
                    let ui_animation_enable_img = document.getElementById('ui_animation_enable_img');
                    if (view.Animation.useAGVFocus) {
                        ui_animation_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    }
                    else {
                        ui_animation_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    }
                    input_animation_enable.addEventListener('click',function () {
                        view.Animation.Hyundai_UseAGVFocus(!view.Animation.useAGVFocus);
                        if (view.Animation.useAGVFocus) {
                            ui_animation_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                        }
                        else {
                            ui_animation_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                        }
                    });
                }
            }
        }

        this.FindObject = function (text) {
        };

        this.Init = function () {
            if (!view.useSearch)
                return;
            init();
        };
    }
}

export default Search;

