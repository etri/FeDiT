
class ReviewPanel {
    constructor(view, vizwide3d, VIZCore) {
        let scope = this;

        this.ReviewPanel = undefined;

        this.ReviewLayer = new Map(); // key: button_element, content_element

        this.ReviewContent = [];

        this.ReivewItems = new Map(); // key: Tab, value: element

        function initElement(){
            const color = { r: 240, g: 240, b: 240, a: 255 };
            // 패널 설정
            let panel = new vizwide3d.Panel(view);
            panel.id = "Review_Panel";
            panel.SetTitleText('Review');
            panel.SetContentBackgroundColor(color);
            panel.SetSize(315, 400);
            panel.SetLocationLeft(400);
            panel.SetLocationTop(50);
            panel.Show(false);

            scope.ReviewPanel = panel;

            let note = scope.GetLayerObj();
            note.id = "Note";
            note.text = "Note";

            let measure = scope.GetLayerObj();
            measure.id = "Measure";
            measure.text = "Measure";

            let userView = scope.GetLayerObj();
            userView.id = "UserView";
            userView.text = "Snapshot";
            
            let layer = [note, measure, userView];

            scope.AddLayers(layer);
            
            deleteReviewPanelItems();
        }
    
        function deleteReviewPanelItems() {
            let del = document.createElement('div');
            del.className = 'review_panel_title_delete_button';
            scope.ReviewPanel.Element.Title.appendChild(del);

            del.addEventListener('click', function () {
                // DeleteByID
                scope.ReviewLayer.forEach(function (value, key) {
                    if (value.style.display === "block") {
                        if (value.id.includes("UserView")) {
                            let item = scope.ReivewItems.get(value);
                            if (item) {
                                for (let index = 0; index < item.length; index++) {
                                    const element = item[index];
                                    if (element.ischeck === true) {
                                        let review = vizwide3d.Review.GetReview(element.id);
                                        vizwide3d.Review.DeleteByID(review.id);
                                        if(review.tag.cameraId !== undefined)
                                            vizwide3d.View.DeleteCameraBackupData(review.tag.cameraId);
                                    }
                                }
                            }
                        } else if (value.id.includes("Measure")) {
                            let item = scope.ReivewItems.get(value);
                            if (item) {
                                for (let index = 0; index < item.length; index++) {
                                    const element = item[index];
                                    if (element.ischeck === true) {
                                        let measureId = element.id.replace('MeasureList', '');
                                        vizwide3d.Review.DeleteByID(measureId);
                                    }
                                }
                            }
                        } else if (value.id.includes("Note")) {
                            let item = scope.ReivewItems.get(value);
                            if (item) {
                                for (let index = 0; index < item.length; index++) {
                                    const element = item[index];
                                    if (element.ischeck === true) {
                                        let noteId = element.id.replace('NoteList', '');
                                        console.log(noteId)
                                        vizwide3d.Review.DeleteByID(noteId);
                                    }
                                }
                            }
                        }
                    }
                });
            });
        }

        let OnReviewChanged = function(e){
            scope.ReivewItems = new Map();
            for (let index = 0; index < scope.ReviewContent.length; index++) {
                const element = scope.ReviewContent[index];
                element.innerHTML = '';
            }

            let reivewItems = vizwide3d.Main.Data.Reviews;
            // let reivewUserViewItems = vizwide3d.Main.Camera.GetBackupCameraList();
            //let reivewUserViewItems = vizwide3d.Main.Data.Review.GetSnapshotList;

            addReview(reivewItems);
            //addUserView(reivewItems);
        };

        // 리뷰 변경 이벤트(추가, 삭제)
        vizwide3d.Review.OnReviewChangedEvent(OnReviewChanged);

        // 노트, 측정 추가
        function addReview(items){
            let noteListElement = document.createElement('div');
            let measureListElement = document.createElement('div');
            let listElement = document.createElement('div');
            let noteItemMap = new Map();
            let noteArray = [];
            let measureItemMap = new Map();
            let measureArray = [];
            let itemMap = new Map();
            let itemArray = [];
            let seqSnapshot = 1;
            for (let index = 0; index < items.length; index++) {
                let review = items[index];
                // 노트랑 측정 구분
                //if(review.itemType === VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE || review.itemType === VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE || review.itemType === VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE)
                if(vizwide3d.Main.Data.Review.GetReviewType(review.itemType) === 0)
                {   
                    let list = document.createElement('div');
                    list.id = 'NoteList' + review.id;
                    list.className = "review_list";
                    list.ischeck = review.selection;
    
                    let checkbox = document.createElement("div");
                    checkbox.type = "button";
                    checkbox.id = review.id;
                    checkbox.className = "review_checkbox";
                    checkbox.ischeck = review.visible; // 리뷰가 보이는지 보이지 않는지에 따라 변경 되어야함
                    list.appendChild(checkbox);
    
                    if(!checkbox.ischeck){
                        checkbox.style.backgroundImage = "";
                    } else {
                        checkbox.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                    }

                    if(list.ischeck){
                        list.style.backgroundColor = "#9ADEE3";
                    } else {
                        list.style.backgroundColor = "";
                    }

                    let text = "";
                    for (let index = 0; index < review.text.value.length; index++) {
                        const element = review.text.value[index];
                        text += element;
                    }
    
                    let label = document.createElement('label');
                    label.textContent = text;
                    label.id = 'NoteLabel' + review.id;
                    label.className = "review_checkbox_label";
                    label.ischeck = false;
                    list.appendChild(label);
    
                    noteListElement.appendChild(list);
    
                    checkbox.addEventListener('click', function(e){
                        if(checkbox.ischeck){
                            vizwide3d.Review.Show(checkbox.id, false);
                            checkbox.style.backgroundImage = "";
                        } else {
                            vizwide3d.Review.Show(checkbox.id, true);
                            checkbox.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                        }
                        checkbox.ischeck = !checkbox.ischeck;
                    });
                    // label.addEventListener('click', function(e){
                    //     if(label.ischeck){
                    //         let noteId = label.id.replace('NoteLabel','');
                    //         vizwide3d.Review.Select(noteId, false);
                    //         checkbox.style.backgroundImage = "";
                    //     } else {
                    //         let noteId = label.id.replace('NoteLabel','');
                    //         vizwide3d.Review.Select(noteId, true);
                    //     }
                    //     // label.ischeck = !label.ischeck;
                    // });

                    noteArray.push(list);

                    // noteItemMap.set(checkbox, list);
                    noteItemMap.set(label, list);
                    noteItemMap.set(list, list);
                } 
                else if(vizwide3d.Main.Data.Review.GetReviewType(review.itemType) === 1){
                    // Measure
                    let list = document.createElement('div');
                    list.id = 'MeasureList' + review.id;
                    list.className = "review_list";
                    list.ischeck = review.selection;
    
                    let checkbox = document.createElement("div");
                    checkbox.type = "button";
                    checkbox.id = review.id;
                    checkbox.className = "review_checkbox";
                    checkbox.ischeck = review.visible; // 리뷰가 보이는지 보이지 않는지에 따라 변경 되어야함
                    list.appendChild(checkbox);

                    if(list.ischeck){
                        list.style.backgroundColor = "#9ADEE3";
                    } else {
                        list.style.backgroundColor = "";
                    }
    
                    if(!checkbox.ischeck){
                        checkbox.style.backgroundImage = "";
                    } else {
                        checkbox.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                    }
    
                    let label = document.createElement('label');

                    let text = "";
                    for (let index = 0; index < review.text.value.length; index++) {
                        const element = review.text.value[index];
                        text += element;
                    }

                    label.textContent = text;
                    label.className = "review_checkbox_label";
                    list.appendChild(label);
    
                    measureListElement.appendChild(list);
    
                    checkbox.addEventListener('click', function(e){
                        if(checkbox.ischeck){
                            vizwide3d.Review.Show(checkbox.id, false);
                            checkbox.style.backgroundImage = "";
                        } else {
                            vizwide3d.Review.Show(checkbox.id, true);
                            checkbox.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                        }
                        checkbox.ischeck = !checkbox.ischeck;
                    });

                    measureArray.push(list);

                    // measureItemMap.set(checkbox, list);
                    measureItemMap.set(label, list);
                    measureItemMap.set(list, list);
                }
                else if (vizwide3d.Main.Data.Review.GetReviewType(review.itemType) === 2){
                    // Snapshot
                    //addUserView();
                    let imageCheckBoxDiv = document.createElement('div');
                    imageCheckBoxDiv.id = review.id;
                    imageCheckBoxDiv.className = "review_image_checkbox_div";
                    //imageCheckBoxDiv.ischeck = false;
                    imageCheckBoxDiv.ischeck = review.selection;

                    if(imageCheckBoxDiv.ischeck){
                        imageCheckBoxDiv.style.border = 'solid 2px #36afb8';
                    } else {
                        imageCheckBoxDiv.style.border = '';
                    }
        
                    let image = document.createElement('div');
                    image.className = "review_image";

                    if(review.tag.thumbnail === ''){
                        image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAB8kAAAfJAEBXLhIAAAD2ElEQVR4nO2dPXLaQBSAnzOZSYnLdLhID65UmlRqdQN8g4QTJDcwN8DcYFOqMilVxbkBuUE8k57MZt4SSUho/97D2nnfjAsjaUEfYvXe24W9OhwOINDzRhzz8NbmWTJVLhI4VzKqIt8Ntd3bdWSqnAPAZwBYjuWEL8wWANZVkT93vYxO0ZkqteCHtL2QsaqKfN1u/KSPFsnBPKDDBo0rGruLH2M8u1fIbb0baV/RJ++E4E3DZTvq6Lvx/QKAR3HeyT0ATDs2LHHbP45dB4ZwTx0HaMnzqsh/c776sZCp8hoAnntkfzShn03C8iiS+0E3g592yQyZENFMiGgmRDQTIpoJq+pdKmSqvAEA/bevinwvoiOCca4u8hQAMDEtZ6p8wcfXHOFr0l0H1m72mKVNWpv1/1/0dtyPlGRFo7xdh+A2evsOuxUyUr6i1xaSDRPqWk6SovFqvnM87I6yC0n1ii48jyMbG5U4usk1VcMimgkR3YQsnk5VtGI+bpAkReOg6HfHw7aUaXnKXYeOPF4s9/1JPTB9UdGU2RjWLxYo8Rx6+4K63nGRohIWenR/eKOTBKqTxC5knqnyHkek60nMN/0aqiJnGd1nF42SdQ1ihg/pOgPpFYUyLzpdgrXrqFXTZrWHZwFRwmhgE43zRvqqabrOkPQEHRbR2Ec+DVTTlpkqT2ZhpgK56EyVXwFgY7n7J3xTkoNUNHYHehTDhU2KsklE68giU+Uu4NsCa47hJU6ii66Fb66F9zpmeCkZ2VFF94RvvmjZCt+40RNN9ED45ssUr+zRy44i2jJ884UlodGfxkyVZFMPgkU7hm++kCY0takJU6p7Q5Boz/DNF5KEpmP+B8mN2Et0hPDNl6gJzZlJNtFlO4uOFL6FECWhsZjJFFW2k+jI4VsIQQmNx3SxYNnWoonCN1+8BThINkSRbSWaOHzzxTmh8ZBsCJZtI3rBEL75Yp3QBEg2BMm2EX2pm54tgwlNBMkGb9mpTDfoTWgiSjZ4yU5pXsdJQkMg2eAsO7UJNMeEhlCywUl2ijOVNlh/4QhFJ/g874d2TPVbWVz1F0DZg5mqTNuNw7uhVkQ0EyKaCRHNhIim5YNpXUTTcgz7RDQtf0zrIpqW3h8YFIgQ0UyIaCZENBMimgkRzYSIZkJEMyGimRDRTIhoJkQ0EyKaCRHNhIhmQkQzIaKZaC/hJKtIRqQq8ivTWvuK3o71pF4hDZdt0cn+MMkFaLhsiMZf1VolLoCDVXsByZObIS56KLL9sVs4Ev7LvpU+24ktrmHY2f1aLVcti/ueJ2hxXyEukrBwAAB/AW7DXmy30C8hAAAAAElFTkSuQmCC'>";
                    }
                    else {
                        image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,"+ review.tag.thumbnail+"'>";
                    }
                    imageCheckBoxDiv.appendChild(image);
        
                    let label = document.createElement('label');
    
                    if(review.tag.text === '' || review.tag.text === undefined){
                        label.textContent = "Sanpshot" + seqSnapshot;
                        seqSnapshot++;
                    } else {
                        label.textContent = review.tag.text;
                    }
                    label.className = "review_image_checkbox_label";
                    imageCheckBoxDiv.appendChild(label);
        
                    listElement.appendChild(imageCheckBoxDiv);
                    itemArray.push(imageCheckBoxDiv);
    
                    itemMap.set(image, imageCheckBoxDiv);
                    itemMap.set(image.childNodes[0], imageCheckBoxDiv);
                    itemMap.set(label, imageCheckBoxDiv);
                    itemMap.set(imageCheckBoxDiv, imageCheckBoxDiv);
                }
            }

            // 노트 리스트 선택
            noteListElement.addEventListener('click', function(e){
                for (let index = 0; index < noteArray.length; index++) {
                    const element = noteArray[index];
                    if(element === noteItemMap.get(e.target)){
                        if(element.ischeck){
                            element.style.backgroundColor = '';
                            let noteId = element.id.replace('NoteList','');
                            vizwide3d.Review.Select(noteId, false);
                        } else {
                            element.style.backgroundColor = '#9ADEE3';
                            let noteId = element.id.replace('NoteList','');
                            vizwide3d.Review.Select(noteId, true);
                        }
                        element.ischeck = !element.ischeck;
                    }
                }
            });

            // 측정 리스트 선택
            measureListElement.addEventListener('click', function(e){
                for (let index = 0; index < measureArray.length; index++) {
                    const element = measureArray[index];
                    if(element === measureItemMap.get(e.target)){
                        if(element.ischeck){
                            element.style.backgroundColor = '';
                            let noteId = element.id.replace('MeasureList','');
                            vizwide3d.Review.Select(noteId, false);
                        } else {
                            element.style.backgroundColor = '#9ADEE3';
                            let noteId = element.id.replace('MeasureList','');
                            vizwide3d.Review.Select(noteId, true);
                        }
                        element.ischeck = !element.ischeck;
                    }
                }
            });

            // // Snapshot 리스트 선택
            listElement.addEventListener('click', function(e){
                for (let index = 0; index < itemArray.length; index++) {
                    const element = itemArray[index];
                    if(element === itemMap.get(e.target)){
                        element.style.border = 'solid 2px #36afb8';
                        
                        // 리뷰 반환
                        let review = vizwide3d.Review.GetReview(element.id);
                        element.ischeck = true;
                        if(review !== undefined)
                        {
                            element.ischeck = review.selection;
                            vizwide3d.Review.Select(review.id, true);
                            vizwide3d.Main.Data.Review.RestoreSnapShotReview(review.id);                            
                        }
                    } else {
                        element.style.border = '';
                        element.ischeck = false;
                        // 리뷰 반환
                        let review = vizwide3d.Review.GetReview(element.id);
                        if(review !== undefined)
                            vizwide3d.Review.Select(review.id, false);
                    }
                }
            });

            for (let index = 0; index < scope.ReviewContent.length; index++) {
                const element = scope.ReviewContent[index];
                if(element.id.includes('Note')){
                    element.appendChild(noteListElement);
                    scope.ReivewItems.set(element, noteArray);
                } else if(element.id.includes('Measure')) {
                    element.appendChild(measureListElement);
                    scope.ReivewItems.set(element, measureArray);
                }
                else if(element.id.includes('UserView')){
                    element.appendChild(listElement);
                    scope.ReivewItems.set(element, itemArray);
                }
            }
        }

        // 사용자 뷰 추가
        function addUserView(items){
            let listElement = document.createElement('div');
            
            let itemMap = new Map();
            let itemArray = [];
            let seqSnapshot = 1;
            for (let index = 0; index < items.length; index++) {
                let review = items[index];
                // let imageCheckBoxDiv = document.createElement('div');
                // imageCheckBoxDiv.id = review.id;
                // imageCheckBoxDiv.className = "review_image_checkbox_div";
                // imageCheckBoxDiv.ischeck = false;
    
                // let image = document.createElement('div');
                // image.className = "review_image";
                // if(review.thumbnail === ''){
                //     image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAB8kAAAfJAEBXLhIAAAD2ElEQVR4nO2dPXLaQBSAnzOZSYnLdLhID65UmlRqdQN8g4QTJDcwN8DcYFOqMilVxbkBuUE8k57MZt4SSUho/97D2nnfjAsjaUEfYvXe24W9OhwOINDzRhzz8NbmWTJVLhI4VzKqIt8Ntd3bdWSqnAPAZwBYjuWEL8wWANZVkT93vYxO0ZkqteCHtL2QsaqKfN1u/KSPFsnBPKDDBo0rGruLH2M8u1fIbb0baV/RJ++E4E3DZTvq6Lvx/QKAR3HeyT0ATDs2LHHbP45dB4ZwTx0HaMnzqsh/c776sZCp8hoAnntkfzShn03C8iiS+0E3g592yQyZENFMiGgmRDQTIpoJq+pdKmSqvAEA/bevinwvoiOCca4u8hQAMDEtZ6p8wcfXHOFr0l0H1m72mKVNWpv1/1/0dtyPlGRFo7xdh+A2evsOuxUyUr6i1xaSDRPqWk6SovFqvnM87I6yC0n1ii48jyMbG5U4usk1VcMimgkR3YQsnk5VtGI+bpAkReOg6HfHw7aUaXnKXYeOPF4s9/1JPTB9UdGU2RjWLxYo8Rx6+4K63nGRohIWenR/eKOTBKqTxC5knqnyHkek60nMN/0aqiJnGd1nF42SdQ1ihg/pOgPpFYUyLzpdgrXrqFXTZrWHZwFRwmhgE43zRvqqabrOkPQEHRbR2Ec+DVTTlpkqT2ZhpgK56EyVXwFgY7n7J3xTkoNUNHYHehTDhU2KsklE68giU+Uu4NsCa47hJU6ii66Fb66F9zpmeCkZ2VFF94RvvmjZCt+40RNN9ED45ssUr+zRy44i2jJ884UlodGfxkyVZFMPgkU7hm++kCY0takJU6p7Q5Boz/DNF5KEpmP+B8mN2Et0hPDNl6gJzZlJNtFlO4uOFL6FECWhsZjJFFW2k+jI4VsIQQmNx3SxYNnWoonCN1+8BThINkSRbSWaOHzzxTmh8ZBsCJZtI3rBEL75Yp3QBEg2BMm2EX2pm54tgwlNBMkGb9mpTDfoTWgiSjZ4yU5pXsdJQkMg2eAsO7UJNMeEhlCywUl2ijOVNlh/4QhFJ/g874d2TPVbWVz1F0DZg5mqTNuNw7uhVkQ0EyKaCRHNhIim5YNpXUTTcgz7RDQtf0zrIpqW3h8YFIgQ0UyIaCZENBMimgkRzYSIZkJEMyGimRDRTIhoJkQ0EyKaCRHNhIhmQkQzIaKZaC/hJKtIRqQq8ivTWvuK3o71pF4hDZdt0cn+MMkFaLhsiMZf1VolLoCDVXsByZObIS56KLL9sVs4Ev7LvpU+24ktrmHY2f1aLVcti/ueJ2hxXyEukrBwAAB/AW7DXmy30C8hAAAAAElFTkSuQmCC'>";
                // }
                // else {
                //     image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,"+ review.thumbnail+"'>";
                // }
                // imageCheckBoxDiv.appendChild(image);
    
                // let label = document.createElement('label');

                // if(review.title === '' || review.title === undefined){
                //     label.textContent = "Sanpshot" + index;
                // } else {
                //     label.textContent = review.title;
                // }
                // label.className = "review_image_checkbox_label";
                // imageCheckBoxDiv.appendChild(label);
    
                // listElement.appendChild(imageCheckBoxDiv);
                // itemArray.push(imageCheckBoxDiv);

                // itemMap.set(image, imageCheckBoxDiv);
                // itemMap.set(image.childNodes[0], imageCheckBoxDiv);
                // itemMap.set(label, imageCheckBoxDiv);
                // itemMap.set(imageCheckBoxDiv, imageCheckBoxDiv);

                let imageCheckBoxDiv = document.createElement('div');
                    imageCheckBoxDiv.id = review.id;
                    imageCheckBoxDiv.className = "review_image_checkbox_div";
                    imageCheckBoxDiv.ischeck = false;
        
                    let image = document.createElement('div');
                    image.className = "review_image";
                    if(review.thumbnail === ''){
                        image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAB8kAAAfJAEBXLhIAAAD2ElEQVR4nO2dPXLaQBSAnzOZSYnLdLhID65UmlRqdQN8g4QTJDcwN8DcYFOqMilVxbkBuUE8k57MZt4SSUho/97D2nnfjAsjaUEfYvXe24W9OhwOINDzRhzz8NbmWTJVLhI4VzKqIt8Ntd3bdWSqnAPAZwBYjuWEL8wWANZVkT93vYxO0ZkqteCHtL2QsaqKfN1u/KSPFsnBPKDDBo0rGruLH2M8u1fIbb0baV/RJ++E4E3DZTvq6Lvx/QKAR3HeyT0ATDs2LHHbP45dB4ZwTx0HaMnzqsh/c776sZCp8hoAnntkfzShn03C8iiS+0E3g592yQyZENFMiGgmRDQTIpoJq+pdKmSqvAEA/bevinwvoiOCca4u8hQAMDEtZ6p8wcfXHOFr0l0H1m72mKVNWpv1/1/0dtyPlGRFo7xdh+A2evsOuxUyUr6i1xaSDRPqWk6SovFqvnM87I6yC0n1ii48jyMbG5U4usk1VcMimgkR3YQsnk5VtGI+bpAkReOg6HfHw7aUaXnKXYeOPF4s9/1JPTB9UdGU2RjWLxYo8Rx6+4K63nGRohIWenR/eKOTBKqTxC5knqnyHkek60nMN/0aqiJnGd1nF42SdQ1ihg/pOgPpFYUyLzpdgrXrqFXTZrWHZwFRwmhgE43zRvqqabrOkPQEHRbR2Ec+DVTTlpkqT2ZhpgK56EyVXwFgY7n7J3xTkoNUNHYHehTDhU2KsklE68giU+Uu4NsCa47hJU6ii66Fb66F9zpmeCkZ2VFF94RvvmjZCt+40RNN9ED45ssUr+zRy44i2jJ884UlodGfxkyVZFMPgkU7hm++kCY0takJU6p7Q5Boz/DNF5KEpmP+B8mN2Et0hPDNl6gJzZlJNtFlO4uOFL6FECWhsZjJFFW2k+jI4VsIQQmNx3SxYNnWoonCN1+8BThINkSRbSWaOHzzxTmh8ZBsCJZtI3rBEL75Yp3QBEg2BMm2EX2pm54tgwlNBMkGb9mpTDfoTWgiSjZ4yU5pXsdJQkMg2eAsO7UJNMeEhlCywUl2ijOVNlh/4QhFJ/g874d2TPVbWVz1F0DZg5mqTNuNw7uhVkQ0EyKaCRHNhIim5YNpXUTTcgz7RDQtf0zrIpqW3h8YFIgQ0UyIaCZENBMimgkRzYSIZkJEMyGimRDRTIhoJkQ0EyKaCRHNhIhmQkQzIaKZaC/hJKtIRqQq8ivTWvuK3o71pF4hDZdt0cn+MMkFaLhsiMZf1VolLoCDVXsByZObIS56KLL9sVs4Ev7LvpU+24ktrmHY2f1aLVcti/ueJ2hxXyEukrBwAAB/AW7DXmy30C8hAAAAAElFTkSuQmCC'>";
                    }
                    else {
                        image.innerHTML = "<img class = 'review_image_src' src='data:image/png;base64,"+ review.tag.thumbnail+"'>";
                    }
                    imageCheckBoxDiv.appendChild(image);
        
                    let label = document.createElement('label');
    
                    if(review.tag.text === '' || review.tag.text === undefined){
                        label.textContent = "Sanpshot" + seqSnapshot;
                        seqSnapshot++;
                    } else {
                        label.textContent = review.tag.text;
                    }
                    label.className = "review_image_checkbox_label";
                    imageCheckBoxDiv.appendChild(label);
        
                    listElement.appendChild(imageCheckBoxDiv);
                    itemArray.push(imageCheckBoxDiv);
    
                    itemMap.set(image, imageCheckBoxDiv);
                    itemMap.set(image.childNodes[0], imageCheckBoxDiv);
                    itemMap.set(label, imageCheckBoxDiv);
                    itemMap.set(imageCheckBoxDiv, imageCheckBoxDiv);
            }

            // listElement.addEventListener('click', function(e){
            //     for (let index = 0; index < itemArray.length; index++) {
            //         const element = itemArray[index];
            //         if(element === itemMap.get(e.target)){
            //             element.style.border = 'solid 2px #36afb8';
            //             element.ischeck = true;
            //             vizwide3d.View.RollbackCamera(element.id);
            //         } else {
            //             element.style.border = '';
            //             element.ischeck = false;
            //         }
            //     }
            // });

            listElement.addEventListener('click', function(e){
                for (let index = 0; index < itemArray.length; index++) {
                    const element = itemArray[index];
                    if(element === itemMap.get(e.target)){
                        element.style.border = 'solid 2px #36afb8';
                        element.ischeck = true;

                        // 리뷰 반환
                        let review = vizwide3d.Review.GetReview(element.id);
                        if(review !== undefined)
                        {
                            // 카메라 수정
                            if(review.tag.cameraId !== undefined)
                                vizwide3d.View.RollbackCamera(review.tag.cameraId);

                            // 선택 정보 복원
                            if(review.tag.selectedIds !== undefined && review.tag.selectedIds.length > 0)
                            {
                                vizwide3d.Object3D.SelectByNodeID(review.tag.selectedIds, true, false);
                            }
                            else
                            {
                                vizwide3d.Object3D.SelectAll(false);
                            }

                            // 그리기 마크업 복원
                            if(review.tag.drawitem !== undefined && review.tag.drawitem.length > 0)
                            {
                                vizwide3d.Review.DrawingMarkup.ExitDrawMode();
                                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                                vizwide3d.Main.Data.Reviews = vizwide3d.Main.Data.Reviews.concat(review.tag.drawitem);
                                vizwide3d.Render();
                            }
                            else{
                                vizwide3d.Review.DrawingMarkup.ExitDrawMode();
                            }
                        }

                       

                    } else {
                        element.style.border = '';
                        element.ischeck = false;
                    }
                }
            });

            for (let index = 0; index < scope.ReviewContent.length; index++) {
                const element = scope.ReviewContent[index];

                if(element.id.includes('UserView')){
                    element.appendChild(listElement);
                    scope.ReivewItems.set(element, itemArray);
                }
            }
        };

        // 레이어 생성 시 필요한 정보
        this.GetLayerObj = function(){
            let layer = {
                id: undefined,
                content: undefined,
                text: undefined,
            }
            return layer;
        };

        // 레이어 추가
        this.AddLayers = function(layers){
            const element = document.createElement('div');

            const layer_buttons = document.createElement('div');
            layer_buttons.className = "review_layer_buttons";
            element.appendChild(layer_buttons); 

            for (let index = 0; index < layers.length; index++) {
                const layer_id = layers[index].id;
                const layer_text = layers[index].text;
                // const layer_element = layers[index].content;

                const layer = document.createElement('div');
                layer.id = vizwide3d.Main.GetViewID() + "_review" + layer_id;
                layer.className = "review_layer";

                const layer_content = document.createElement('div');
                layer_content.id = vizwide3d.Main.GetViewID() + "_review_content" + layer_id;
                layer_content.className = "review_layer_content";
                // layer_content.textContent = layer_text;
                layer.appendChild(layer_content);

                scope.ReviewContent.push(layer_content);
                // if(layer_element){
                //     layer_content.appendChild(layer_element);
                // }
    
                const layer_button = document.createElement('div');
                layer_button.id = vizwide3d.Main.GetViewID() + "_review_button" + layer_id;
                layer_button.className = "review_layer_button";
                layer_button.textContent = layer_text;
                layer_buttons.appendChild(layer_button);

                const layer_button_sub = document.createElement('div');
                layer_button_sub.className = "review_layer_button_sub";
                layer_button.appendChild(layer_button_sub);

                if(index === 0){
                    layer_content.style.display = "block";
                    layer_button.style.backgroundColor = "rgb(61 192 202)";
                    layer_button_sub.style.display = "block";
                }

                scope.ReviewLayer.set(layer_button, layer_content);

                element.appendChild(layer);
            }

            scope.ReviewPanel.SetContent(element);  
            
            layer_buttons.addEventListener('click', function(e){
                if(e.target === layer_buttons) return;
                scope.ReviewLayer.forEach((content, btn) => {
                    if(btn === e.target){
                        btn.style.backgroundColor = "rgb(61 192 202)";
                        content.style.display = "block";
                        btn.lastChild.style.display = "block";
                    } else {
                        btn.style.backgroundColor = "";
                        content.style.display = "none";
                        btn.lastChild.style.display = "";
                    }
                });
            });
        };

        this.RefreshPanel = function() {
            OnReviewChanged();
        };

        // 보이기/숨기기
        this.Show = function(bool){
            if(bool === true){
                scope.ReviewPanel.Show(true);
            } else {
                scope.ReviewPanel.Show(false);
            }
        };

        // X 버튼 
        this.OnCloseButtonEvent = function(event){
            scope.ReviewPanel.OnCloseButtonEvent(event);
        };

        let init = function (){
            initElement();
        };

        init();
    }
}
export default ReviewPanel;