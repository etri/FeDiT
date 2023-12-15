//import $ from 'jquery';
class Config {
    constructor(view, VIZCore) {
        let scope = this;

        this.Visible = false;

        this.Visible_WalkthroughPanel = view.Configuration.Walkthrough.Panel.Visible;

        this.EventHandler = undefined;

        initConfig();

        function initConfig() {
            scope.EventHandler = new VIZCore.EventDispatcher();

            let divConfig = document.createElement('div');
            divConfig.id = view.GetViewID() + "div_config_container";
            divConfig.className = "div_config_container";


            let div_title = document.createElement('div');
            div_title.id = view.GetViewID() + "div_config_header";
            div_title.className = "div_config_header";
            div_title.innerHTML = "Configuration";
            divConfig.appendChild(div_title);

            let div_contents = document.createElement('div');
            div_contents.id = view.GetViewID() + "div_config_contents";
            div_contents.className = "config_content";
            div_contents.innerHTML = "";
            divConfig.appendChild(div_contents);

            let div_bar = document.createElement('div');
            div_bar.id = view.GetViewID() + "div_bar";
            div_bar.className = "div_bar";
            div_title.appendChild(div_bar);

            ////let btn_tab_home = document.createElement('button');
            ////btn_tab_home.id = "btn_tab_home";
            ////btn_tab_home.className = "div_bar_item";
            ////btn_tab_home.innerHTML = "Home";
            //let btn_tab_render = document.createElement('button');
            //btn_tab_render.id = "btn_tab_render";
            //btn_tab_render.className = "div_bar_item ui_button";
            //btn_tab_render.innerHTML = "<img alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABhUlEQVRYhe1V0W2DMBA9qg7gEegGbBBGoBOUERjBGzBC1AkYId2AEcgGYYOrkB7Kk/E1MSHKR3kSknU+/J7vzneyY8c9UNVGr2i2DNqbtaGqR1VtVTUXkQNtHSYb9o5PySDI78VDIqwIjAlnpPgukMWMCPtAprOIfGP9JSI57X1kWXZ+RERIPhVcR+EfVNXRvoNtRrdpYUby7iM+PnRay2e+gpfh5SkASR5EeEDYfUCuKFgW59EjpvUF/kWqgDahD7T0X2X4FJYIqwacYTd9QWD1hH76YgVtgltxUBNdrBUHN74gGjXWi2gl4dYwQoiZqKK9ejauIk+ImCMBJdm5Loa/T7lNkuPAHCnim/IA6xGVKojMQsB7ooYBhTZiHoyq+hPxK1B4jE/MlHQgvGVwG4aHT8U5D5/iKnJZ9v4eYrgwuRcU9BIc/FvupmsENHR7LrAetjryz/obRw5zROYl8vQ2IzMElEE+e1qfNh9GhogmyPuM55OTiALT7YR1t2mud/w/iMgvcIdQ3KkqyZgAAAAASUVORK5CYII=\" width=\"20px\" >";
            ////btn_tab_render.innerHTML += "Render";
            //div_bar.appendChild(btn_tab_render);
            let div_render = document.createElement('div');
            div_render.id = view.GetViewID() + "div_render";
            div_render.className = "content";

            let div_content_name_1 = document.createElement('div');
            div_content_name_1.id = view.GetViewID() + "div_content_name_1";
            div_content_name_1.className = "content_name";
            div_content_name_1.innerHTML = "Progressive";
            div_contents.appendChild(div_content_name_1);

            let div_content_group_1 = document.createElement('div');
            div_content_group_1.id = view.GetViewID() + "div_content_group_1";
            div_content_group_1.className = "content_inside";
            div_contents.appendChild(div_content_group_1);

            let div_content_box_1 = document.createElement('div');
            div_content_box_1.id = view.GetViewID() + "div_content_box_1";
            div_content_box_1.className = "content_box";
            div_content_group_1.appendChild(div_content_box_1);

            let div_content_box_1_label_1 = document.createElement('div');
            div_content_box_1_label_1.id = view.GetViewID() + "div_content_box_1_label_1";
            div_content_box_1_label_1.className = "content_label";
            div_content_box_1_label_1.innerHTML = "<label>Enable</label>";
            div_content_box_1.appendChild(div_content_box_1_label_1);

            let div_content_box_1_input_1 = document.createElement('div');
            div_content_box_1_input_1.id = view.GetViewID() + "div_content_box_1_input_1";
            div_content_box_1_input_1.className = "content_input";

            //let inputProgressiveEnable = document.createElement('input');
            //inputProgressiveEnable.id = "input_progressive_enable";
            //inputProgressiveEnable.type = "checkbox";
            //div_content_box_1_input_1.appendChild(inputProgressiveEnable);
            let inputProgressiveEnable = document.createElement('div');
            inputProgressiveEnable.id = view.GetViewID() + "input_progressive_enable";
            inputProgressiveEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_progressive_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC\" width=\"16px\" >";
            div_content_box_1_input_1.appendChild(inputProgressiveEnable);

            div_content_box_1.appendChild(div_content_box_1_input_1);

            let div_content_box_1_label_2 = document.createElement('div');
            div_content_box_1_label_2.id = view.GetViewID() + "div_content_box_1_label_2";
            div_content_box_1_label_2.className = "content_label";
            div_content_box_1_label_2.innerHTML = "<label>LimitCount</label>";
            div_content_box_1.appendChild(div_content_box_1_label_2);

            let div_content_box_1_input_2 = document.createElement('div');
            div_content_box_1_input_2.id = view.GetViewID() + "div_content_box_1_input_2";
            div_content_box_1_input_2.className = "content_input";

            let inputProgressiveRange = document.createElement('input');
            inputProgressiveRange.id = view.GetViewID() + "input_progressive_limitcount";
            inputProgressiveRange.type = "range";
            // inputProgressiveRange.min = 10;
            // inputProgressiveRange.max = 10000;
            inputProgressiveRange.min = 1;
            inputProgressiveRange.max = 10000;
            div_content_box_1_input_2.appendChild(inputProgressiveRange);

            div_content_box_1.appendChild(div_content_box_1_input_2);

            let div_content_name_2 = document.createElement('div');
            div_content_name_2.id = view.GetViewID() + "div_content_name_2";
            div_content_name_2.className = "content_name";
            div_content_name_2.innerHTML = "Cache";
            div_contents.appendChild(div_content_name_2);

            let div_content_group_2 = document.createElement('div');
            div_content_group_2.id = view.GetViewID() + "div_content_group_2";
            div_content_group_2.className = "content_inside";
            div_contents.appendChild(div_content_group_2);

            let div_content_box_2 = document.createElement('div');
            div_content_box_2.id = view.GetViewID() + "div_content_box_2";
            div_content_box_2.className = "content_box";
            div_content_group_2.appendChild(div_content_box_2);

            let div_content_box_2_label_1 = document.createElement('div');
            div_content_box_2_label_1.id = view.GetViewID() + "div_content_box_2_label_1";
            div_content_box_2_label_1.className = "content_label";
            div_content_box_2_label_1.innerHTML = "<label>Enable</label>";
            div_content_box_2.appendChild(div_content_box_2_label_1);

            let div_content_box_2_input_1 = document.createElement('div');
            div_content_box_2_input_1.id = view.GetViewID() + "div_content_box_2_input_1";
            div_content_box_2_input_1.className = "content_input";
            //div_content_box_2_input_1.innerHTML = "<input type=\"checkbox\">";
            //let inputCacheEnable = document.createElement('input');
            //inputCacheEnable.id = "input_cache_enable";
            //inputCacheEnable.type = "checkbox";
            //div_content_box_2_input_1.appendChild(inputCacheEnable);
            let inputCacheEnable = document.createElement('div');
            inputCacheEnable.id = view.GetViewID() + "input_cache_enable";
            inputCacheEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_cache_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC\" width=\"16px\" >";
            div_content_box_2_input_1.appendChild(inputCacheEnable);

            div_content_box_2.appendChild(div_content_box_2_input_1);

            let div_content_box_2_label_2 = document.createElement('div');
            div_content_box_2_label_2.id = view.GetViewID() + "div_content_box_2_label_2";
            div_content_box_2_label_2.className = "content_label";
            div_content_box_2_label_2.innerHTML = "<label>LimitCount</label>";
            div_content_box_2.appendChild(div_content_box_2_label_2);

            let div_content_box_2_input_2 = document.createElement('div');
            div_content_box_2_input_2.id = view.GetViewID() + "div_content_box_2_input_2";
            div_content_box_2_input_2.className = "content_input";
            //div_content_box_2_input_2.innerHTML = "<input type=\"range\">";
            let inputCacheRange = document.createElement('input');
            inputCacheRange.id = view.GetViewID() + "input_cache_limitcount";
            inputCacheRange.type = "range";
            //inputCacheRange.min = 1000000;
            //inputCacheRange.max = 100000000;
            inputCacheRange.min = 1;
            inputCacheRange.max = 10000;
            div_content_box_2_input_2.appendChild(inputCacheRange);

            div_content_box_2.appendChild(div_content_box_2_input_2);

            // WalkthroughPanel
            let div_content_name_3 = document.createElement('div');
            div_content_name_3.id = view.GetViewID() + "div_content_name_3";
            div_content_name_3.className = "content_name";
            div_content_name_3.innerHTML = "Walkthrough Panel";
            div_contents.appendChild(div_content_name_3);

            let div_content_group_3 = document.createElement('div');
            div_content_group_3.id = view.GetViewID() + "div_content_group_3";
            div_content_group_3.className = "content_inside";
            div_contents.appendChild(div_content_group_3);

            let div_content_box_3 = document.createElement('div');
            div_content_box_3.id = view.GetViewID() + "div_content_box_3";
            div_content_box_3.className = "content_box";
            div_content_group_3.appendChild(div_content_box_3);

            let div_content_box_3_label_1 = document.createElement('div');
            div_content_box_3_label_1.id = view.GetViewID() + "div_content_box_3_label_1";
            div_content_box_3_label_1.className = "content_label";
            div_content_box_3_label_1.innerHTML = "<label>Enable</label>";
            div_content_box_3.appendChild(div_content_box_3_label_1);

            let div_content_box_3_input_1 = document.createElement('div');
            div_content_box_3_input_1.id = view.GetViewID() + "div_content_box_3_input_1";
            div_content_box_3_input_1.className = "content_input";
            div_content_box_3.appendChild(div_content_box_3_input_1);

            let inputWalkthroughEnable = document.createElement('div');
            inputWalkthroughEnable.id = view.GetViewID() + "input_walkthrough_enable";
            // inputWalkthroughEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_walkthrough_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC\" width=\"16px\" >";

            if(scope.Visible_WalkthroughPanel)
                inputWalkthroughEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_walkthrough_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC\" width=\"16px\" >";
            else
                inputWalkthroughEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_walkthrough_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=\" width=\"16px\" >";
            div_content_box_3_input_1.appendChild(inputWalkthroughEnable);


            inputWalkthroughEnable.addEventListener('click', function () {
                if (view.useJquery) {
                    if (scope.Visible_WalkthroughPanel) {
                        scope.Visible_WalkthroughPanel = false;
                        $("#" + view.GetViewID() + "ui_walkthrough_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    } else {
                        scope.Visible_WalkthroughPanel = true;
                        $("#" + view.GetViewID() + "ui_walkthrough_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    }
                } else {
                    let ui_walkthrough_enable_img = document.getElementById(view.GetViewID() + "ui_walkthrough_enable_img");
                    if (scope.Visible_WalkthroughPanel) {
                        scope.Visible_WalkthroughPanel = false;
                        ui_walkthrough_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    } else {
                        scope.Visible_WalkthroughPanel = true;
                        ui_walkthrough_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    }
                }
            });

            // FBS Panel
            let div_content_name_4 = document.createElement('div');
            div_content_name_4.id = view.GetViewID() + "div_content_name_4";
            div_content_name_4.className = "content_name";
            div_content_name_4.innerHTML = "FPS";
            div_contents.appendChild(div_content_name_4);

            let div_content_group_4 = document.createElement('div');
            div_content_group_4.id = view.GetViewID() + "div_content_group_4";
            div_content_group_4.className = "content_inside";
            div_contents.appendChild(div_content_group_4);

            let div_content_box_4 = document.createElement('div');
            div_content_box_4.id = view.GetViewID() + "div_content_box_4";
            div_content_box_4.className = "content_box";
            div_content_group_4.appendChild(div_content_box_4);

            let div_content_box_4_label_1 = document.createElement('div');
            div_content_box_4_label_1.id = view.GetViewID() + "div_content_box_4_label_1";
            div_content_box_4_label_1.className = "content_label";
            div_content_box_4_label_1.innerHTML = "<label>Enable</label>";
            div_content_box_4.appendChild(div_content_box_4_label_1);

            let div_content_box_4_input_1 = document.createElement('div');
            div_content_box_4_input_1.id = view.GetViewID() + "div_content_box_4_input_1";
            div_content_box_4_input_1.className = "content_input";
            div_content_box_4.appendChild(div_content_box_4_input_1);

            let inputFPSEnable = document.createElement('div');
            inputFPSEnable.id = view.GetViewID() + "input_fbs_enable";
            inputFPSEnable.innerHTML = "<img id=\"" + view.GetViewID() + "ui_fps_enable_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=\" width=\"16px\" >";
            div_content_box_4_input_1.appendChild(inputFPSEnable);

            let isCheckFPS = false;

            inputFPSEnable.addEventListener('click', function () {
                isCheckFPS = !isCheckFPS;
                if(view.useJquery){
                    if (isCheckFPS) {
                        $("#" + view.GetViewID() + "ui_fps_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                        scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Config.Changed, { param: {id : 'fps', show : true}  });
                        //scope.DrawInfoPanel.Show(true);
                    } else {
                        $("#" + view.GetViewID() + "ui_fps_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                        scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Config.Changed, { param: {id : 'fps', show : false}  });
                        //scope.DrawInfoPanel.Show(false);
                        
                    }
                } else {
                    let ui_fps_enable_img = document.getElementById(view.GetViewID() + "ui_fps_enable_img");
                    if (isCheckFPS) {
                        ui_fps_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                        scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Config.Changed, { param: {id : 'fps', show : true}  });
                    }
                    else {
                        ui_fps_enable_img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                        scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Config.Changed, { param: {id : 'fps', show : false}  });
                    }
                }
            });

            view.Container.appendChild(divConfig);
        }

        function setCookieValue() {

            view.Data.LoadCookie();
            let input_progressive_enable = $("#" + view.GetViewID() + "input_progressive_enable");
            let input_progressive_limitcount = $("#" + view.GetViewID() + "input_progressive_limitcount");
            let input_cache_enable = $("#" + view.GetViewID() + "input_cache_enable");
            let input_cache_limitcount = $("#" + view.GetViewID() + "input_cache_limitcount");

            if (input_progressive_enable.length > 0) {
                input_progressive_enable.prop("checked", view.Configuration.Render.Progressive.Enable);
                view.useRenderLimit = view.Configuration.Render.Progressive.Enable;

                checkBox($("#" + view.GetViewID() + "ui_progressive_enable_img"), view.useRenderLimit);

                // if (view.useRenderLimit) {
                //     $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                // }
                // else {
                //     $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                // }
                input_progressive_enable.click(function () {
                    view.Configuration.Render.Progressive.Enable = !view.Configuration.Render.Progressive.Enable;
                    view.useRenderLimit = view.Configuration.Render.Progressive.Enable;
                    // if (view.useRenderLimit) {
                    //     $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    // }
                    // else {
                    //     $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    // }
                    checkBox($("#" + view.GetViewID() + "ui_progressive_enable_img"), view.useRenderLimit);
                });
            }

            if (input_progressive_limitcount.length > 0) {
                //input_progressive_limitcount.val(view.Configuration.Render.Progressive.LimitCount);
                //view.Renderer.enableRenderLimitCnt = view.Configuration.Render.Progressive.LimitCount;

                {
                    let inputVal = view.Configuration.Render.Progressive.LimitCount * 1;
                    let rateVal = Math.floor(Math.log10(inputVal / 10) / 3 * 10000);
                    input_progressive_limitcount.val(rateVal);

                    view.Renderer.enableRenderLimitCnt = inputVal;
                }

                input_progressive_limitcount.on("input change", function () {


                    // // 환경설정 변경
                    // view.Configuration.Render.Progressive.LimitCount = input_progressive_limitcount.val() * 1;
                    // // 환경설정 값 적용
                    // view.Renderer.enableRenderLimitCnt = view.Configuration.Render.Progressive.LimitCount;

                    let rateVal = (input_progressive_limitcount.val() * 1) / 10000;

                    //Min 10
                    //Max 10000
                    //10 * 10^(3*rateVal); 
                    let inputVal = Math.floor(10 * Math.pow(10, 3 * rateVal));

                    // 환경설정 변경
                    view.Configuration.Render.Progressive.LimitCount = inputVal;
                    // 환경설정 값 적용
                    view.Renderer.enableRenderLimitCnt = inputVal;

                    //console.log("Progressive : " + inputVal);

                    {
                        let szinputVal = inputVal + ""; //meshblock
                        let szCacheInputType = (inputVal * 100000) + "";
                        console.log("Progressive : " +
                            szCacheInputType.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                            " (" + szinputVal.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ")");
                    }



                    if (view.DEBUG) {
                        //백분율로 사용
                        //view.Renderer.enableRenderLimitRate = view.Configuration.Render.Progressive.LimitCount / 10000;
                    }
                });
            }

            //if (input_cache_enable.length > 0) {
            //    input_cache_enable.prop("checked", view.Configuration.Render.Cache.Enable);
            //    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
            //    input_cache_enable.click(function () {
            //        view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
            //        view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
            //    });
            //}
            if (input_cache_enable.length > 0) {
                input_cache_enable.prop("checked", view.Configuration.Render.Cache.Enable);
                view.useFramebufferCache = view.Configuration.Render.Cache.Enable;

                checkBox($("#" + view.GetViewID() + "ui_cache_enable_img"), view.useFramebufferCache);

                // if (view.useFramebufferCache) {
                //     $("#" + view.GetViewID() + "ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                // }
                // else {
                //     $("#" + view.GetViewID() + "ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                // }

                //input_cache_enable.click(function () {
                //    view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
                //    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
                //    if (view.useFramebufferCache) {
                //        $("#ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                //    }
                //    else {
                //        $("#ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                //    }
                //});
                document.querySelector("#" + view.GetViewID() + "input_cache_enable").addEventListener("click", evt => {
                    // 이벤트 처리 ...
                    //console.log("Config : Click");
                    evt.preventDefault();
                    evt.stopPropagation();
                    view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
                    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
                    if (view.IsUseRenderCache()) {
                        $("#" + view.GetViewID() + "ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                    }
                    else {
                        $("#" + view.GetViewID() + "ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                    }

                    // checkBox($("#" + view.GetViewID() + "ui_cache_enable_img"), view.IsUseRenderCache());
                });


            }



            if (input_cache_limitcount.length > 0) {
                //input_cache_limitcount.val(view.Configuration.Render.Cache.LimitCount);
                {
                    let inputVal = view.Configuration.Render.Cache.LimitCount * 1;
                    let rateVal = Math.floor(Math.log10(inputVal / 1000000) / 4 * 10000);
                    input_cache_limitcount.val(rateVal);

                    view.RenderMeshBlockCacheNum = inputVal;
                }

                if (view.IsUseRenderCache())
                    view.Renderer.UpdateCache();

                input_cache_limitcount.on("input change", function () {

                    // // 환경설정 변경
                    // view.Configuration.Render.Cache.LimitCount = input_cache_limitcount.val();
                    // // 환경설정 값 적용
                    // view.RenderMeshBlockCacheNum = view.Configuration.Render.Cache.LimitCount * 1;

                    //min : 100000
                    //max : 1000000000
                    //10000 * 10^(3*rateVal); 
                    let rateVal = (input_cache_limitcount.val() * 1) / 10000;
                    let inputVal = Math.floor(100000 * Math.pow(10, 4 * rateVal));

                    // 환경설정 변경
                    view.Configuration.Render.Cache.LimitCount = inputVal;
                    // 환경설정 값 적용
                    view.RenderMeshBlockCacheNum = inputVal;

                    let szinputVal = inputVal + "";
                    console.log("Cache : " + szinputVal.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                    //console.log("Cache : " + inputVal);


                    if (view.IsUseRenderCache())
                        view.Renderer.UpdateCache();
                });
            }

        }

        function setCookieValueJs() {

            view.Data.LoadCookie();

            let input_progressive_enable = document.getElementById(view.GetViewID() + "input_progressive_enable");
            let input_progressive_limitcount = document.getElementById(view.GetViewID() + "input_progressive_limitcount");
            let input_cache_enable = document.getElementById(view.GetViewID() + "input_cache_enable");
            let input_cache_limitcount = document.getElementById(view.GetViewID() + "input_cache_limitcount");

            let ui_progressive_enable_img = document.getElementById(view.GetViewID() + "ui_progressive_enable_img");

            if (input_progressive_enable) {
                input_progressive_enable.setAttribute("checked", view.Configuration.Render.Progressive.Enable);
                view.useRenderLimit = view.Configuration.Render.Progressive.Enable;

                checkBox(ui_progressive_enable_img, view.useRenderLimit);

                // input_progressive_enable.click(function () {
                //     view.Configuration.Render.Progressive.Enable = !view.Configuration.Render.Progressive.Enable;
                //     view.useRenderLimit = view.Configuration.Render.Progressive.Enable;

                //     checkBox(ui_progressive_enable_img, view.useRenderLimit);
                // });

                input_progressive_enable.addEventListener('click', function(){
                    view.Configuration.Render.Progressive.Enable = !view.Configuration.Render.Progressive.Enable;
                    view.useRenderLimit = view.Configuration.Render.Progressive.Enable;

                    checkBox(ui_progressive_enable_img, view.useRenderLimit);
                });
            }

            if (input_progressive_limitcount) {
                //input_progressive_limitcount.val(view.Configuration.Render.Progressive.LimitCount);
                //view.Renderer.enableRenderLimitCnt = view.Configuration.Render.Progressive.LimitCount;

                {
                    let inputVal = view.Configuration.Render.Progressive.LimitCount * 1;
                    let rateVal = Math.floor(Math.log10(inputVal / 10) / 3 * 10000);
                    // input_progressive_limitcount.val(rateVal);
                    input_progressive_limitcount.value = rateVal;

                    view.Renderer.enableRenderLimitCnt = inputVal;
                }

                input_progressive_limitcount.addEventListener("input", function () {


                    // // 환경설정 변경
                    // view.Configuration.Render.Progressive.LimitCount = input_progressive_limitcount.val() * 1;
                    // // 환경설정 값 적용
                    // view.Renderer.enableRenderLimitCnt = view.Configuration.Render.Progressive.LimitCount;

                    let rateVal = (input_progressive_limitcount.value * 1) / 10000;

                    //Min 10
                    //Max 10000
                    //10 * 10^(3*rateVal); 
                    let inputVal = Math.floor(10 * Math.pow(10, 3 * rateVal));

                    // 환경설정 변경
                    view.Configuration.Render.Progressive.LimitCount = inputVal;
                    // 환경설정 값 적용
                    view.Renderer.enableRenderLimitCnt = inputVal;

                    //console.log("Progressive : " + inputVal);

                    {
                        let szinputVal = inputVal + ""; //meshblock
                        let szCacheInputType = (inputVal * 100000) + "";
                        console.log("Progressive : " +
                            szCacheInputType.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                            " (" + szinputVal.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ")");
                    }



                    if (view.DEBUG) {
                        //백분율로 사용
                        //view.Renderer.enableRenderLimitRate = view.Configuration.Render.Progressive.LimitCount / 10000;
                    }
                });
            }

            //if (input_cache_enable.length > 0) {
            //    input_cache_enable.prop("checked", view.Configuration.Render.Cache.Enable);
            //    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
            //    input_cache_enable.click(function () {
            //        view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
            //        view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
            //    });
            //}
            let ui_cache_enable_img = document.getElementById(view.GetViewID() + "ui_cache_enable_img");

            if (input_cache_enable) {
                input_cache_enable.setAttribute("checked", view.Configuration.Render.Cache.Enable);
                view.useFramebufferCache = view.Configuration.Render.Cache.Enable;

                checkBox(ui_cache_enable_img, view.useFramebufferCache);

                //input_cache_enable.click(function () {
                //    view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
                //    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;
                //    if (view.useFramebufferCache) {
                //        $("#ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                //    }
                //    else {
                //        $("#ui_cache_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                //    }
                //});
                document.querySelector("#" + view.GetViewID() + "input_cache_enable").addEventListener("click", evt => {
                    // 이벤트 처리 ...
                    //console.log("Config : Click");
                    evt.preventDefault();
                    evt.stopPropagation();
                    view.Configuration.Render.Cache.Enable = !view.Configuration.Render.Cache.Enable;
                    view.useFramebufferCache = view.Configuration.Render.Cache.Enable;

                    checkBox(ui_cache_enable_img,view.IsUseRenderCache());
                });
            }



            if (input_cache_limitcount) {
                //input_cache_limitcount.val(view.Configuration.Render.Cache.LimitCount);
                {
                    let inputVal = view.Configuration.Render.Cache.LimitCount * 1;
                    let rateVal = Math.floor(Math.log10(inputVal / 1000000) / 4 * 10000);
                    input_cache_limitcount.value = rateVal;

                    view.RenderMeshBlockCacheNum = inputVal;
                }

                if (view.IsUseRenderCache())
                    view.Renderer.UpdateCache();

                input_cache_limitcount.addEventListener("input", function () {

                    // // 환경설정 변경
                    // view.Configuration.Render.Cache.LimitCount = input_cache_limitcount.val();
                    // // 환경설정 값 적용
                    // view.RenderMeshBlockCacheNum = view.Configuration.Render.Cache.LimitCount * 1;

                    //min : 100000
                    //max : 1000000000
                    //10000 * 10^(3*rateVal); 
                    let rateVal = (input_cache_limitcount.value * 1) / 10000;
                    let inputVal = Math.floor(100000 * Math.pow(10, 4 * rateVal));

                    // 환경설정 변경
                    view.Configuration.Render.Cache.LimitCount = inputVal;
                    // 환경설정 값 적용
                    view.RenderMeshBlockCacheNum = inputVal;

                    let szinputVal = inputVal + "";
                    console.log("Cache : " + szinputVal.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                    //console.log("Cache : " + inputVal);


                    if (view.IsUseRenderCache())
                        view.Renderer.UpdateCache();
                });
            }

        }

        function walkthroughShow(visible) {
            if (document.getElementById(view.GetViewID() + "walkthroughPanel")) {
                if (visible) {
                    document.getElementById(view.GetViewID() + "walkthroughPanel").style.display = 'block';
                }
                else {
                    document.getElementById(view.GetViewID() + "walkthroughPanel").style.display = 'none';
                }
            }
        }

        function checkBox(element, check){
            if(view.useJquery){
                if (check) {
                    $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                }
                else {
                    $("#" + view.GetViewID() + "ui_progressive_enable_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                }
            } else {
                if (check) {
                    element.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxMzo1NDowMyswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OTYzMDVjYjgtZTI1Mi1mZTRjLWI3ZjYtN2Y1ZDgyYjFlMzUwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTM6MjA6MjUrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7hMm9CAAAA50lEQVQ4jZ2TrQrCUBiGHw9bUDgMxCKCSYfBJLi0ZhK9C03eg8kLsM3kNVgMC0aTwaJBjIJolUUFDc6j82dze9s5vM/Dxwdfypq4TWAM5ImXA9ARCWF8ZiwSwkoi4rRNQzJrNWgXC+rvb4FpSBzbQuoa/VpVScRrYWTXkboWCj9SNuRT8CjUctmP4jd4utszXG2egm6lpAqvwC94sFyrd8qauFepazi2hemPBbA9eeQz6VBYTeCdL/TmC7YnLzB6FBxY4jdJFBwQ/JKEwR+Cd0kUDP4SQxsREdyvKmmOAugCxwTwHujcAAeJYmLyhYFqAAAAAElFTkSuQmCC");
                }
                else {
                    element.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDUgNzkuMTY0NTkwLCAyMDIwLzEyLzA5LTExOjU3OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAxLTIxVDEzOjIwOjI1KzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMS0yMVQxNDoxNToyOSswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MGQwNjI0OS0yMjY2LTJiNDQtYmY2NS04OTU1ZWJmOTZkNTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozY2UzZmUxNC0zMGY1LTk0NDQtYjI3Yi04MTFjZGZjNTM5OWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjMwNWNiOC1lMjUyLWZlNGMtYjdmNi03ZjVkODJiMWUzNTAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2MzA1Y2I4LWUyNTItZmU0Yy1iN2Y2LTdmNWQ4MmIxZTM1MCIgc3RFdnQ6d2hlbj0iMjAyMS0wMS0yMVQxMzoyMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGIwNzgyMS1jMzI2LWY2NDMtYTMwYy1iYWRiMGEyYjYyNTIiIHN0RXZ0OndoZW49IjIwMjEtMDEtMjFUMTQ6MTU6MjkrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODBkMDYyNDktMjI2Ni0yYjQ0LWJmNjUtODk1NWViZjk2ZDU4IiBzdEV2dDp3aGVuPSIyMDIxLTAxLTIxVDE0OjE1OjI5KzA5OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8s2kgQAAAGpJREFUOI3tk6EVgCAYBk838FlkChs76Bq+51bOQGUMGEIwCLoBBk22vxm8fvelr9LGDsACKGREYEIbG9yeixS356KNDTWg+rYRjsPjqFpsvvgDf+A7gejTIRZ9OgG2Shs7ct+5EzZWYL4AgMpMFMbuyL4AAAAASUVORK5CYII=");
                }
            }
        }

        this.SetCookieValue = function () {
            if(view.useJquery){
                setCookieValue();
            } else {
                setCookieValueJs();
            }
        };

        this.ResetCacheRange = function(){
            // let id = view.GetViewID() + "input_cache_limitcount";
            // let inputCacheRange = document.getElementById(id);
            // inputCacheRange.min = 1000000;
            // inputCacheRange.max = view.Configuration.Render.Cache.LimitCount;

            let id = view.GetViewID() + "input_cache_limitcount";
            let inputCacheRange = document.getElementById(id);
            inputCacheRange.min = 1;
            inputCacheRange.max = 10000;
        };

        this.Show = function (visible) {
            if (document.getElementById(view.GetViewID() + "div_config_container")) {
                scope.Visible = visible;
                if (visible) {
                    if (view.useJquery) {
                        $("#" + view.GetViewID() + "div_config_container").show();
                    } else {
                        document.getElementById(view.GetViewID() + "div_config_container").style.display = 'block';
                    }
                }
                else {
                    if (view.useJquery) {
                        $("#" + view.GetViewID() + "div_config_container").hide();
                    } else {
                        document.getElementById(view.GetViewID() + "div_config_container").style.display = 'none';
                    }
                }
            }
        };

        this.WalkthroughShow = function (visible) {
            walkthroughShow(visible);
        };

        this.OnChangedEvent = function (listener) {
            scope.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Config.Changed, listener);
        };
    }
}

export default Config;