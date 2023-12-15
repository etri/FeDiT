class ConfigPanel {
    constructor(view, vizwide3d, VIZCore) {
        let scope = this;

        this.ConfigPanel = undefined;

        this.ConfigLayer = new Map(); // key: button_element, value:content_element

        this.ConfigContent = [];

        this.ConfigLayerItem = new Map(); // key: layerId, value: layer_content_element

        // 패널 생성
        function initElement(){
            const color = { r: 240, g: 240, b: 240, a: 255 };
            // 패널 설정
            let panel = new vizwide3d.Panel(view);
            panel.id = "Config_Panel";
            panel.SetTitleText('Configuration');
            panel.SetContentBackgroundColor(color);
            panel.SetSize(400, 570);
            panel.SetLocationLeft(400);
            panel.SetLocationTop(500);
            panel.Show(false);

            scope.ConfigPanel = panel;
        }

        // 패널에 들어갈 element 생성
        function initPanelItem(){
            let home = scope.GetLayerObj();
            home.id = "Home";
            home.text = "Home";

            let control = scope.GetLayerObj();
            control.id = "Control";
            control.text = "Control";

            // 보류
            let frame = scope.GetLayerObj();
            frame.id = "Frame";
            frame.text = "Frame";

            let model = scope.GetLayerObj();
            model.id = "Model";
            model.text = "Model";

            let review = scope.GetLayerObj();
            review.id = "Review";
            review.text = "Review";
            
            let layer = [home, control, model, review];

            scope.AddLayers(layer);

            initPanelHomeItem();
            initPanelFrameItem();
            initPanleControlItem();
            initPanelModelItem();
            initPanelReviewItem();
        }

        function initPanelModelItem(){
            let selection = vizwide3d.Main.Configuration.Model.Selection;

            // LineColor
            let cb_selection_line_color = function(color){
                selection.LineColor = color;
            };

            let selection_line_color = scope.GetItemObject();
            selection_line_color.id = 'selection_line_color';
            selection_line_color.text = 'LineColor';
            selection_line_color.type = 2;
            selection_line_color.setting = scope.ColorPickSetting(selection.LineColor);
            selection_line_color.callback = cb_selection_line_color;

            // Color
            let cb_selection_color = function(color){
                selection.Color = color;
            };

            let selection_color = scope.GetItemObject();
            selection_color.id = 'selection_color';
            selection_color.text = 'Color';
            selection_color.type = 2;
            selection_color.setting = scope.ColorPickSetting(selection.Color);
            selection_color.callback = cb_selection_color;

            // Thickness
            let cb_selection_thickness = function(value){
                selection.Thickness = value / 100;
            };

            let selection_thickness = scope.GetItemObject();
            selection_thickness.id = 'selection_thickness';
            selection_thickness.text = 'Thickness';
            selection_thickness.type = 3;
            selection_thickness.setting = scope.SliderSetting(10, 100, selection.Thickness * 100);
            selection_thickness.callback = cb_selection_thickness;

            //Unit
            let cb_selection_unit = function(value){
                selection.Unit = value;
            };

            let unitItemMap = new Map();

            for (let objKey in VIZCore.Enum.SELECT_UNIT) {
                if (VIZCore.Enum.SELECT_UNIT.hasOwnProperty(objKey)) {
                    unitItemMap.set(VIZCore.Enum.SELECT_UNIT[objKey], objKey);
                }
            }

            let selection_unit = scope.GetItemObject();
            selection_unit.id = 'selection_unit';
            selection_unit.text = 'Unit';
            selection_unit.type = 4;
            selection_unit.setting = scope.SelectboxSetting(unitItemMap.get(selection.Unit), unitItemMap);
            selection_unit.callback = cb_selection_unit;

            //Kind
            let cb_selection_kind = function (value) {
                selection.Kind = value;
            };

            let kindItemMap = new Map();

            for (let objKey in VIZCore.Enum.SelectionObject3DTypes) {
                if (VIZCore.Enum.SelectionObject3DTypes.hasOwnProperty(objKey)) {
                    kindItemMap.set(VIZCore.Enum.SelectionObject3DTypes[objKey], objKey);
                }
            }

            let selection_kind = scope.GetItemObject();
            selection_kind.id = 'selection_kind';
            selection_kind.text = 'Kind';
            selection_kind.type = 4;
            selection_kind.setting = scope.SelectboxSetting(kindItemMap.get(selection.Kind), kindItemMap);
            selection_kind.callback = cb_selection_kind;

            //Mode
            let cb_selection_mode = function (value) {
                selection.Mode = value;
            };

            let modeItemMap = new Map();

            for (let objKey in VIZCore.Enum.SelectionVisibleMode) {
                if (VIZCore.Enum.SelectionVisibleMode.hasOwnProperty(objKey)) {
                    modeItemMap.set(VIZCore.Enum.SelectionVisibleMode[objKey], objKey);
                }
            }

            let selection_mode = scope.GetItemObject();
            selection_mode.id = 'selection_mode';
            selection_mode.text = 'Mode';
            selection_mode.type = 4;
            selection_mode.setting = scope.SelectboxSetting(modeItemMap.get(selection.Mode), modeItemMap);
            selection_mode.callback = cb_selection_mode;

            let selection_div = scope.GetItemObject();
            selection_div.id = 'Selection';
            selection_div.text = 'Selection';
            selection_div.type = 0;
            selection_div.tab = "Model";
            selection_div.child = [selection_color, selection_line_color, selection_thickness];

            scope.AddItems(selection_div);

        }

        // 패널 Home에 들어갈 element 생성
        function initPanelHomeItem(){
            let configuration = vizwide3d.Main.Configuration;

            // -----------------------------------------------------Progressive
            let progressive = configuration.Render.Progressive;

            let cb_progressive_limitCount = function(value){
                let rateVal = (value * 1) / 10000;

                let inputVal = Math.floor(10 * Math.pow(10, 3 * rateVal));

                // 환경설정 변경
                progressive.LimitCount = inputVal;
                // 환경설정 값 적용
                vizwide3d.Main.Renderer.enableRenderLimitCnt = inputVal;
            };

            // 초기 설정 값 구하기
            let inputProgressiveVal = progressive.LimitCount * 1;
            let rateProgressiveVal = Math.floor(Math.log10(inputProgressiveVal / 10) / 3 * 10000);

            vizwide3d.Main.Renderer.enableRenderLimitCnt = inputProgressiveVal;

            let progressive_limitCount = scope.GetItemObject();
            progressive_limitCount.id = 'progressive_limitCount';
            progressive_limitCount.text = 'LimitCount';
            progressive_limitCount.type = 3;
            progressive_limitCount.setting = scope.SliderSetting(10, 10000, rateProgressiveVal);
            progressive_limitCount.callback = cb_progressive_limitCount;

            let cb_progressive_enable = function(value){
                // 환경설정 값 적용
                progressive.Enable = value;
                // 환경설정 변경
                vizwide3d.Main.useRenderLimit = value;
            };

            let progressive_enable = scope.GetItemObject();
            progressive_enable.id = 'progressive_enable';
            progressive_enable.text = 'Enable';
            progressive_enable.type = 1;
            progressive_enable.callback = cb_progressive_enable;
            progressive_enable.setting = scope.CheckboxSetting(progressive.Enable);

            let progressive_div = scope.GetItemObject();
            progressive_div.id = 'progressive';
            progressive_div.text = 'Progressive';
            progressive_div.type = 0;
            progressive_div.tab = "Home";
            progressive_div.child = [progressive_enable, progressive_limitCount];

            scope.AddItems(progressive_div);

            // -----------------------------------------------------Cache
            let cache = configuration.Render.Cache;

            let cb_cache_limitCount = function (value) {
                let rateVal = (value * 1) / 10000;
                let inputVal = Math.floor(100000 * Math.pow(10, 4 * rateVal));

                // 환경설정 변경
                cache.LimitCount = inputVal;
                // 환경설정 값 적용
                vizwide3d.Main.RenderMeshBlockCacheNum = inputVal;
            };

            // 초기 설정 값 구하기
            let inputVal = cache.LimitCount * 1;
            let rateVal = Math.floor(Math.log10(inputVal / 1000000) / 4 * 10000);

            vizwide3d.Main.RenderMeshBlockCacheNum = inputVal;

            let cache_limitCount = scope.GetItemObject();
            cache_limitCount.id = 'cache_limitCount';
            cache_limitCount.text = 'LimitCount';
            cache_limitCount.type = 3;
            cache_limitCount.setting = scope.SliderSetting(1000, 10000, rateVal);
            cache_limitCount.callback = cb_cache_limitCount;

            let cb_cache_enable = function (value) {
                console.log(value)
                // 환경설정 값 적용
                cache.Enable = value;

                // 환경설정 변경
                vizwide3d.Main.useFramebufferCache = value;
            };

            let cache_enable = scope.GetItemObject();
            cache_enable.id = 'cache_enable';
            cache_enable.text = 'Enable';
            cache_enable.type = 1;
            cache_enable.callback = cb_cache_enable;
            cache_enable.setting = scope.CheckboxSetting(cache.Enable);

            let cache_div = scope.GetItemObject();
            cache_div.id = 'Cache';
            cache_div.text = 'Cache';
            cache_div.type = 0;
            cache_div.tab = "Home";
            cache_div.child = [cache_enable, cache_limitCount];

            scope.AddItems(cache_div);

            // -----------------------------------------------------Background
            let background = configuration.Render.Background;

            let cb_background_one_color = function(color){
                background.OneColor = color;
                vizwide3d.Render();
            };

            let background_one_color = scope.GetItemObject();
            background_one_color.id = 'background_one_color';
            background_one_color.text = 'One Color';
            background_one_color.type = 2;
            background_one_color.setting = scope.ColorPickSetting(background.OneColor);
            background_one_color.callback = cb_background_one_color;

            let cb_background_two_color = function(color){
                background.TwoColor = color;
                vizwide3d.Render();
            };

            let background_two_color = scope.GetItemObject();
            background_two_color.id = 'background_two_color';
            background_two_color.text = 'Two Color';
            background_two_color.setting = scope.ColorPickSetting(background.TwoColor);
            background_two_color.type = 2;
            background_two_color.callback = cb_background_two_color;

            let cb_background_mode = function(value){
                background.Mode = value;
                vizwide3d.Render();
            };

            let backgroundModeMap = new Map();

            for (let objKey in VIZCore.Enum.BackgroundModes) {
                if (VIZCore.Enum.BackgroundModes.hasOwnProperty(objKey)) {
                    backgroundModeMap.set(VIZCore.Enum.BackgroundModes[objKey], objKey);
                }
            }

            let background_mode = scope.GetItemObject();
            background_mode.id = 'background_mode';
            background_mode.text = 'Mode';
            background_mode.type = 4;
            background_mode.setting = scope.SelectboxSetting(backgroundModeMap.get(background.Mode), backgroundModeMap);
            background_mode.callback = cb_background_mode;

            let background_div = scope.GetItemObject();
            background_div.id = 'background';
            background_div.text = 'Background';
            background_div.type = 0;
            background_div.tab = "Home";
            background_div.child = [background_mode, background_one_color, background_two_color];

            scope.AddItems(background_div);

            // -----------------------------------------------------Edge
            let edge = configuration.Render.Edge;

            let cb_edge_color = function(color){
                edge.Color = color;
            };

            let edge_color = scope.GetItemObject();
            edge_color.id = 'edge_color';
            edge_color.text = 'Color';
            edge_color.type = 2;
            edge_color.setting = scope.ColorPickSetting(edge.Color);
            edge_color.callback = cb_edge_color;

            let cb_edge_custom_color = function(color){
                edge.CustomColor = color;
            };

            let edge_custom_color = scope.GetItemObject();
            edge_custom_color.id = 'edge_custom_color';
            edge_custom_color.text = 'CustomColor';
            edge_custom_color.type = 2;
            edge_custom_color.setting = scope.ColorPickSetting(edge.CustomColor);
            edge_custom_color.callback = cb_edge_custom_color;

            let cb_edge_hidden_color = function(color){
                edge.HiddenColor = color;
            };

            let edge_hidden_color = scope.GetItemObject();
            edge_hidden_color.id = 'edge_hidden_color';
            edge_hidden_color.text = 'HiddenColor';
            edge_hidden_color.type = 2;
            edge_hidden_color.setting = scope.ColorPickSetting(edge.HiddenColor);
            edge_hidden_color.callback = cb_edge_hidden_color;

            let cb_edge_thickness = function(value){
                edge.Thickness = value / 100;
                vizwide3d.Render();
            };

            let edge_thickness = scope.GetItemObject();
            edge_thickness.id = 'edge_thickness';
            edge_thickness.text = 'Thickness';
            edge_thickness.type = 3;
            edge_thickness.setting = scope.SliderSetting(10, 100, edge.Thickness * 100);
            edge_thickness.callback = cb_edge_thickness;

            let edge_div = scope.GetItemObject();
            edge_div.id = 'Edge';
            edge_div.text = 'Edge';
            edge_div.type = 0;
            edge_div.tab = "Home";
            edge_div.child = [edge_color, edge_thickness];

            scope.AddItems(edge_div);

            // -----------------------------------------------------Pivot
            let render = vizwide3d.Configuration.Render;

            let cb_pivot_enable_div = function(value){
                render.Pivot.Visible = value;
            };

            let pivot_enable_div = scope.GetItemObject();
            pivot_enable_div.id = 'pivot_enable_div';
            pivot_enable_div.text = 'Show';
            pivot_enable_div.type = 1;
            pivot_enable_div.callback = cb_pivot_enable_div;
            pivot_enable_div.setting = scope.CheckboxSetting(render.Pivot.Visible);

            let cb_pivot_color_div = function(color){
                render.Pivot.Color = color;
            };

            let pivot_color_div = scope.GetItemObject();
            pivot_color_div.id = 'pivot_color_div';
            pivot_color_div.text = 'Color';
            pivot_color_div.type = 2;
            pivot_color_div.setting = scope.ColorPickSetting(render.Pivot.Color);
            pivot_color_div.callback = cb_pivot_color_div;

            let pivot_div = scope.GetItemObject();
            pivot_div.id = 'Pivot_div';
            pivot_div.text = 'Pivot';
            pivot_div.type = 0;
            pivot_div.tab = "Home";
            pivot_div.child = [pivot_enable_div, pivot_color_div];

            scope.AddItems(pivot_div);

            // -----------------------------------------------------Pivot GuideLine
            let cb_pivot_guideline_enable = function(value){
                render.Pivot.GuideLine.Enable = value;
            };

            let pivot_guideline_enable = scope.GetItemObject();
            pivot_guideline_enable.id = 'pivot_guideline_enable';
            pivot_guideline_enable.text = 'Show';
            pivot_guideline_enable.type = 1;
            pivot_guideline_enable.callback = cb_pivot_guideline_enable;
            pivot_guideline_enable.setting = scope.CheckboxSetting(render.Pivot.GuideLine.Enable);

            let cb_pivot_guideline_alpha = function(value){
                render.Pivot.GuideLine.Alpha = value;
            };

            let pivot_guideline_alpha = scope.GetItemObject();
            pivot_guideline_alpha.id = 'pivot_guideline_alpha';
            pivot_guideline_alpha.text = 'Alpha';
            pivot_guideline_alpha.type = 3;
            pivot_guideline_alpha.setting = scope.SliderSetting(0, 255, render.Pivot.GuideLine.Alpha);
            pivot_guideline_alpha.callback = cb_pivot_guideline_alpha;

            // min, max 임시 1~5
            let cb_pivot_guideline_thickness = function(value){
                render.Pivot.GuideLine.Thickness = value / 10;
            };

            let pivot_guideline_thickness = scope.GetItemObject();
            pivot_guideline_thickness.id = 'pivot_guideline_thickness';
            pivot_guideline_thickness.text = 'Thickness';
            pivot_guideline_thickness.type = 3;
            pivot_guideline_thickness.setting = scope.SliderSetting(10, 50, render.Pivot.GuideLine.Thickness * 10);
            pivot_guideline_thickness.callback = cb_pivot_guideline_thickness;

            let pivot_guideline_div = scope.GetItemObject();
            pivot_guideline_div.id = 'Pivot_GuideLine_div';
            pivot_guideline_div.text = 'Pivot GuideLine';
            pivot_guideline_div.type = 0;
            pivot_guideline_div.tab = "Home";
            pivot_guideline_div.child = [pivot_guideline_enable, pivot_guideline_alpha, pivot_guideline_thickness];

            scope.AddItems(pivot_guideline_div);

            // -----------------------------------------------------Compass3D
            let cb_compass3D_enable_div = function(value){
                render.Compass3D.Visible = value;
            };

            let compass3D_enable_div = scope.GetItemObject();
            compass3D_enable_div.id = 'compass3D_enable_div';
            compass3D_enable_div.text = 'Show';
            compass3D_enable_div.type = 1;
            compass3D_enable_div.callback = cb_compass3D_enable_div;
            compass3D_enable_div.setting = scope.CheckboxSetting(render.Compass3D.Visible);

            let compass3D_div = scope.GetItemObject();
            compass3D_div.id = 'compass3D_div';
            compass3D_div.text = 'Compass3D';
            compass3D_div.type = 0;
            compass3D_div.tab = "Home";
            compass3D_div.child = [compass3D_enable_div];

            // scope.AddItems(compass3D_div);

            // -----------------------------------------------------Compass2D
            let cb_compass2D_enable_div = function(value){
                render.Compass2D.Visible = value;
            };

            let compass2D_enable_div = scope.GetItemObject();
            compass2D_enable_div.id = 'compass2D_enable_div';
            compass2D_enable_div.text = 'Show';
            compass2D_enable_div.type = 1;
            compass2D_enable_div.callback = cb_compass2D_enable_div;
            compass2D_enable_div.setting = scope.CheckboxSetting(render.Compass2D.Visible);

            let compass2D_div = scope.GetItemObject();
            compass2D_div.id = 'Compass2D_div';
            compass2D_div.text = 'Compass2D';
            compass2D_div.type = 0;
            compass2D_div.tab = "Home";
            compass2D_div.child = [compass2D_enable_div];

            // scope.AddItems(compass2D_div);
        }

        // 패널 Control에 들어갈 element 생성
        function initPanleControlItem(){
            let control = vizwide3d.Main.Configuration.Control;
            // --------------------------------------------Lock
            let cb_control_pivot_lock = function(value){
                control.Lock = value;
            };

            let control_pivot_lock = scope.GetItemObject();
            control_pivot_lock.id = 'control_pivot_lock';
            control_pivot_lock.text = 'Lock';
            control_pivot_lock.type = 1;
            control_pivot_lock.callback = cb_control_pivot_lock;
            control_pivot_lock.setting = scope.CheckboxSetting(control.Lock);

            let control_pivot = scope.GetItemObject();
            control_pivot.id = 'control_pivot';
            control_pivot.text = 'Pivot';
            control_pivot.type = 0;
            control_pivot.tab = "Control";
            control_pivot.child = [control_pivot_lock];

            //scope.AddItems(control_pivot);

            // --------------------------------------------Rotate
            let cb_rotate_factor = function(value){
                control.RotateFactor = value;
            };

            let rotate_factor = scope.GetItemObject();
            rotate_factor.id = 'rotate_factor';
            rotate_factor.text = 'Factor';
            rotate_factor.type = 3;
            rotate_factor.callback = cb_rotate_factor;
            rotate_factor.setting = scope.SliderSetting(1,100, control.RotateFactor);

            let cb_rotate_screenrate = function(value){
                control.RotateScreenRate = value;
            };

            let rotate_screenrate = scope.GetItemObject();
            rotate_screenrate.id = 'rotate_screenrate';
            rotate_screenrate.text = 'ScreenRate';
            rotate_screenrate.type = 1;
            rotate_screenrate.callback = cb_rotate_screenrate;
            rotate_screenrate.setting = scope.CheckboxSetting(control.RotateScreenRate);

            let rotate_div = scope.GetItemObject();
            rotate_div.id = 'rotate_div';
            rotate_div.text = 'Rotate';
            rotate_div.type = 0;
            rotate_div.tab = "Control";
            rotate_div.child = [rotate_factor, rotate_screenrate];

            // scope.AddItems(rotate_div);

            // --------------------------------------------Fit
            let cb_fit_initfitall = function(value){
                control.InitFitAll = value;
            };

            let fit_initfitall = scope.GetItemObject();
            fit_initfitall.id = 'fit_initfitall';
            fit_initfitall.text = 'InitFitAll';
            fit_initfitall.type = 1;
            fit_initfitall.callback = cb_fit_initfitall;
            fit_initfitall.setting = scope.CheckboxSetting(control.InitFitAll);

            let cb_fit_marginerate = function(value){
                control.FitMargineRate = value / 100;
            };

            let fit_marginerate = scope.GetItemObject();
            fit_marginerate.id = 'fit_marginerate';
            fit_marginerate.text = 'FitMargineRate';
            fit_marginerate.type = 3;
            fit_marginerate.callback = cb_fit_marginerate;
            fit_marginerate.setting = scope.SliderSetting(0,100,control.FitMargineRate * 100);

            let cb_fit_useauto = function(value){
                control.UseAutoFit = value;
            };

            let fit_useauto = scope.GetItemObject();
            fit_useauto.id = 'fit_useauto';
            fit_useauto.text = 'UseAutoFit';
            fit_useauto.type = 1;
            fit_useauto.callback = cb_fit_useauto;
            fit_useauto.setting = scope.CheckboxSetting(control.UseAutoFit);

            let fit_div = scope.GetItemObject();
            fit_div.id = 'fit_div';
            fit_div.text = 'Fit';
            fit_div.type = 0;
            fit_div.tab = "Control";
            fit_div.child = [fit_useauto, fit_marginerate, fit_initfitall];

            // scope.AddItems(fit_div);

            // --------------------------------------------Fly
            let cb_fly_movementSpeed = function(value){
                control.Fly.MovementSpeed = value;
            };

            let fly_movementSpeed = scope.GetItemObject();
            fly_movementSpeed.id = 'fly_movementSpeed';
            fly_movementSpeed.text = 'MovementSpeed';
            fly_movementSpeed.type = 3;
            fly_movementSpeed.callback = cb_fly_movementSpeed;
            fly_movementSpeed.setting = scope.SliderSetting(0,10,control.Fly.MovementSpeed);

            let cb_fly_aroundSpeed = function(value){
                control.Fly.AroundSpeed = value;
            };

            let fly_aroundSpeed = scope.GetItemObject();
            fly_aroundSpeed.id = 'fly_aroundSpeed';
            fly_aroundSpeed.text = 'AroundSpeed';
            fly_aroundSpeed.type = 3;
            fly_aroundSpeed.callback = cb_fly_aroundSpeed;
            fly_aroundSpeed.setting = scope.SliderSetting(0, 100, control.Fly.AroundSpeed);

            let fly_div = scope.GetItemObject();
            fly_div.id = 'fly_div';
            fly_div.text = 'Fly';
            fly_div.type = 0;
            fly_div.tab = "Control";
            fly_div.child = [fly_movementSpeed, fly_aroundSpeed];

            scope.AddItems(fly_div);

            // --------------------------------------------Walkthrough
            let cb_walkthrough_enable_div = function(value){
                vizwide3d.Configuration.Walkthrough.Panel.Visible = value;
            };

            let walkthrough_enable_div = scope.GetItemObject();
            walkthrough_enable_div.id = 'fit_useauto';
            walkthrough_enable_div.text = 'Show';
            walkthrough_enable_div.type = 1;
            walkthrough_enable_div.callback = cb_walkthrough_enable_div;
            walkthrough_enable_div.setting = scope.CheckboxSetting(vizwide3d.Configuration.Walkthrough.Panel.Visible);

            let walkthrough_div = scope.GetItemObject();
            walkthrough_div.id = 'Walkthrough_div';
            walkthrough_div.text = 'Walkthrough Panel';
            walkthrough_div.type = 0;
            walkthrough_div.tab = "Control";
            walkthrough_div.child = [walkthrough_enable_div];

            scope.AddItems(walkthrough_div);

            // --------------------------------------------Zoom
            let cb_zoom_minvalue = function(value){
                control.Zoom.MinZoomValue = value / 100;
            };

            let zoom_minvalue = scope.GetItemObject();
            zoom_minvalue.id = 'zoom_useFixed';
            zoom_minvalue.text = 'MinZoomValue';
            zoom_minvalue.type = 3;
            zoom_minvalue.callback = cb_zoom_minvalue;
            zoom_minvalue.setting = scope.SliderSetting(0,100, control.Zoom.MinZoomValue * 100);

            let cb_zoom_ratio = function(value){
                control.Zoom.Ratio = value / 100;
            };

            let zoom_ratio = scope.GetItemObject();
            zoom_ratio.id = 'zoom_useFixed';
            zoom_ratio.text = 'Ratio';
            zoom_ratio.type = 3;
            zoom_ratio.callback = cb_zoom_ratio;
            zoom_ratio.setting = scope.SliderSetting(0, 100, control.Zoom.Ratio * 100);

            let cb_zoom_useFixed = function(value){
                control.Zoom.UseFixed = value;
            };

            let zoom_useFixed = scope.GetItemObject();
            zoom_useFixed.id = 'zoom_useFixed';
            zoom_useFixed.text = 'UseFixed';
            zoom_useFixed.type = 1;
            zoom_useFixed.callback = cb_zoom_useFixed;
            zoom_useFixed.setting = scope.CheckboxSetting(control.Zoom.UseFixed);

            let zoom_div = scope.GetItemObject();
            zoom_div.id = 'zoom_div';
            zoom_div.text = 'Zoom';
            zoom_div.type = 0;
            zoom_div.tab = "Control";
            zoom_div.child = [zoom_useFixed, zoom_ratio, zoom_minvalue];

            // scope.AddItems(zoom_div);
        }

        // 패널 Frame에 들어갈 element 생성
        function initPanelFrameItem(){
            let frame = vizwide3d.Main.Configuration.Frame;

            let cb_frame_split_color = function(color){
                frame.SplitLineColor = color;
            };

            let frame_split_color = scope.GetItemObject();
            frame_split_color.id = 'frame_split_color';
            frame_split_color.text = 'SplitLineColor';
            frame_split_color.type = 2;
            frame_split_color.setting = scope.ColorPickSetting(frame.SplitLineColor);
            frame_split_color.callback = cb_frame_split_color;

            let cb_frame_line_color = function(color){
                frame.LineColor = color;
            };

            let frame_line_color = scope.GetItemObject();
            frame_line_color.id = 'frame_line_color';
            frame_line_color.text = 'LineColor';
            frame_line_color.type = 2;
            frame_line_color.setting = scope.ColorPickSetting(frame.LineColor);
            frame_line_color.callback = cb_frame_line_color;

            let frame_div = scope.GetItemObject();
            frame_div.id = 'Frame';
            frame_div.text = 'Frame';
            frame_div.type = 0;
            frame_div.tab = "Frame";
            frame_div.child = [];

            scope.AddItems(frame_div);
        }

        // 패널 Review에 들어갈 element 생성
        function initPanelReviewItem(){
            let markUp = vizwide3d.Main.Configuration.Markup;

            let cb_markup_color = function(color){
                markUp.LineColor = color;
            };

            let markup_color = scope.GetItemObject();
            markup_color.id = 'markup_color';
            markup_color.text = 'LineColor';
            markup_color.type = 2;
            markup_color.setting = scope.ColorPickSetting(markUp.LineColor);
            markup_color.callback = cb_markup_color;

            let cb_markup_width = function(value){
                markUp.LineWidth = value;
            };

            let markup_width = scope.GetItemObject();
            markup_width.id = 'markup_width';
            markup_width.text = 'LineWidth';
            markup_width.type = 3;
            markup_width.setting = scope.SliderSetting(1, 10, markUp.LineWidth);
            markup_width.callback = cb_markup_width;

            let markup_div = scope.GetItemObject();
            markup_div.id = 'markup_div';
            markup_div.text = 'MarkUp';
            markup_div.type = 0;
            markup_div.tab = "Review";
            markup_div.child = [markup_color, markup_width];

            scope.AddItems(markup_div);
        }
        
        // item type이 1인 경우 checkbox 생성
        function checkBox(){
            let element = document.createElement("div");
            element.type = "button";
            element.className = "config_child_type_checkbox";

            return element;
        }

        // item type이 2인 경우 color pick 생성
        function color_picker(setting){
            let element = document.createElement("input");
            element.type = "color";
            element.value = setting;
            element.className = "config_child_type_colorpicker";
            element.style.position = "relative"
            element.style.opacity = 100;
            element.style.visibility = "unset";
            element.style.padding = "none";
            element.style.width = "calc(100% - 8px)";
            element.style.height = "25px";
            element.style.top = "0px";
            element.style.border = "solid 1px #36AFB8";
            element.style.marginLeft = "4px";
            element.style.borderRadius = "2px";
            return element;
        }

        // item type이 3인 경우 slider 생성
        function slider(setting){

            let div = document.createElement("div");
            div.className = "config_child_type_slider_div";

            let element = document.createElement("input");
            element.type = "range";
            if(setting){
                element.min = setting.min;
                element.max = setting.max;
                element.value = setting.value;   
            } else {
                element.min = 0;
                element.max = 100;
                element.value = 0;
            }
            element.className = "config_child_type_slider";
            div.appendChild(element);

            return div;
        }

        // item type이 4인 경우 selectbox 생성
        function selectbox(setting) {
            let field = document.createElement('div');
            field.className = "config_child_type_select_field";

            let field_text = document.createElement('div');
            field_text.id = "config_child_type_select_field_text";
            field_text.className = "config_child_type_select_field_text";
            field_text.innerText = setting.value;

            field.appendChild(field_text);


            let field_child_group = document.createElement('div');
            field_child_group.id = "config_child_type_select_field_group";
            field_child_group.className = "config_child_type_select_field_group";
            setting.child.forEach(function(value, key){
                let field_child = document.createElement('div');
                field_child.id = value;
                field_child.value = key;
                field_child.className = "config_child_type_select_field_child";

                // 텍스트
                let field_child_text = document.createElement('div');
                field_child_text.textContent = value;
                field_child_text.className = "config_child_type_select_field_child_text";
                field_child.appendChild(field_child_text);

                field_child_group.appendChild(field_child);
            });

            field.appendChild(field_child_group);

            // 체크 박스 이외의 영역 선택 시 체크박스 닫기
            window.addEventListener("click", function (e) {
                if (e.target !== field_text) {
                    field.style.borderRadius = "2px 2px 0px 0px";
                    field_child_group.style.display = "";
                    field_child_group.style.borderRadius = "";
                }
            });

            let isclick = false;
            field.addEventListener('click', function () {
                isclick = !isclick;
                if (isclick) {
                    field_child_group.style.display = "block";
                    field_child_group.style.borderRadius = "2px 2px 0px 0px";
                    field.style.borderRadius = "2px 2px 0px 0px";
                }
                else {
                    field_child_group.style.display = "";
                    field_child_group.style.borderRadius = "";
                    field.style.borderRadius = "";
                }
            });

            return field;
        }

        // 색상 hex인 경우 rgb로 변경
        function hexToRgb(hexType) {
            //"#" 기호를 삭제
            var hex = hexType.trim().replace("#", "");

            // rgb로 각각 분리해서 배열에 담기
            var rgb = (3 === hex.length) ?
                hex.match(/[a-f\d]/gi) : hex.match(/[a-f\d]{2}/gi);

            rgb.forEach(function (str, x, arr) {
                // rgb 각각의 헥사값이 한자리일 경우, 두자리로 변경
                if (str.length == 1) str = str + str;

                // 10진수로 변환
                arr[x] = parseInt(str, 16);
            });
            // return rgb.join(", ") + ", " + 255; 
            let rgbObject = { r: rgb[0], g: rgb[1], b: rgb[2]};
            return rgbObject;
        }

        // 색상 rgb인 경우 hex로 변경
        function rgbToHex (rgbType){ 
            var rgb = rgbType.replace( /[^%,.\d]/g, "" ).split( "," ); 
            
            rgb.forEach(function (str, x, arr){ 
            
                /* 컬러값이 "%"일 경우, 변환하기. */ 
                if ( str.indexOf( "%" ) > -1 ) str = Math.round( parseFloat(str) * 2.55 ); 
                
                /* 16진수 문자로 변환하기. */ 
                str = parseInt( str, 10 ).toString( 16 ); 
                if ( str.length === 1 ) str = "0" + str; 
                
                arr[ x ] = str; 
            }); 
            
            return "#" + rgb.join( "" ); 
        } 

        let init = function (){
            initElement();
            initPanelItem();
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

                const layer = document.createElement('div');
                layer.id = vizwide3d.Main.GetViewID() + "config" + layer_id;
                layer.className = "review_layer";

                const layer_content = document.createElement('div');
                layer_content.id = vizwide3d.Main.GetViewID() + "_config_content" + layer_id;
                layer_content.className = "review_layer_content";
                layer.appendChild(layer_content);

                scope.ConfigContent.push(layer_content);
    
                const layer_button = document.createElement('div');
                layer_button.id = vizwide3d.Main.GetViewID() + "_config_button" + layer_id;
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

                scope.ConfigLayer.set(layer_button, layer_content);

                element.appendChild(layer);


                scope.ConfigLayerItem.set(layer_id, layer_content);
            }

            scope.ConfigPanel.SetContent(element);  
            
            layer_buttons.addEventListener('click', function(e){
                if(e.target === layer_buttons) return;
                scope.ConfigLayer.forEach((content, btn) => {
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

        // Conifg 패널 보이기/숨기기
        this.Show = function(bool){
            if(bool === true){
                scope.ConfigPanel.Show(true);
            } else {
                scope.ConfigPanel.Show(false);
            }
        };

        // Conifg 패널 X 버튼 이벤트
        this.OnCloseButtonEvent = function(event){
            scope.ConfigPanel.OnCloseButtonEvent(event);
        };

        /**
         * Checkbox 기본셋팅
         * @param {boolean} value 
         */
        this.CheckboxSetting = function(value){
            let setItem = {
                value: value
            }

            return setItem;
        };

        /**
         * ColorPick 기본셋팅
         * @param {VIZCore.Color} color
         */
        this.ColorPickSetting = function(color){
            let setItem = {
                value: color,  // viz rgba
            }

            return setItem;
        };

        /**
         * Slider 기본셋팅
         * @param {Number} min // 최솟값
         * @param {Number} max // 최댓값  
         * @param {Number} value // 초기값
         */
        this.SliderSetting = function(min, max, value){
            let setItem = {
                min: min,
                max: max,
                value: value
            }

            return setItem;
        };

        /**
         * Selectbox 기본셋팅
         * @param {String} value // 초기값
         * @param {Array} child // selectbox에 들어갈 값
         */
        this.SelectboxSetting = function(value, child){
            let setItem = {
                value: value,
                child: child
            }
            return setItem;
        };

        /**
         * item object
         * @param {String} id : item id
         * @param {String} text : item text
         * @param {Number} type : item type(0: parent, 1: checkbox, 2: colorpicker 3: slider, 4: selectbox)
         * @param {String} tab : tab id
         * @param {Object} callback : callback
         * @param {Object} setting : item setting
         * @param {Array} child : item child
         * @example
         * 
         * let cb_child = function(value){
         *      console.log(value);
         * }
         * 
         * let child = scope.GetItemObject();
         * child.id = 'Child';
         * child.text = 'Child';
         * child.type = 1;
         * child.setting = scope.CheckboxSetting(false);
         * child.callback = cb_child;
         * 
         * let parent = scope.GetItemObject();
         * parent.id = 'Parent';
         * parent.text = 'Parent';
         * parent.type = 0;
         * parent.tab = "Home";
         * parent.child = [child];
         * 
         * scope.AddItems(parent);
         */
        this.GetItemObject = function(){
            let item = {
                id: undefined,
                text: undefined,
                type: undefined,    // 타입이름
                tab: undefined,   // 탭 아이디
                callback: undefined,
                setting: undefined,
                child: [],
            };

            return item;
        };

        /**
         * ...
         * @param {object} item
         * @example
         * 
         * let cb_child = function(value){
         *      console.log(value);
         * }
         * 
         * let child = scope.GetItemObject();
         * child.id = 'Child';
         * child.text = 'Child';
         * child.type = 1;
         * child.setting = scope.CheckboxSetting(false);
         * child.callback = cb_child;
         * 
         * let parent = scope.GetItemObject();
         * parent.id = 'Parent';
         * parent.text = 'Parent';
         * parent.type = 0;
         * parent.tab = "Home";
         * parent.child = [child];
         * 
         * scope.AddItems(parent);
         */
        this.AddItems = function(item){
            if(scope.ConfigLayerItem.get(item.tab)){
                let layer_content = scope.ConfigLayerItem.get(item.tab);

                // 타입이 0 -> 부모
                let parent_content = document.createElement('div');
                parent_content.id = vizwide3d.Main.GetViewID() + "_config" + item.id;
                parent_content.className = "config_parent_content";
                layer_content.appendChild(parent_content);

                let parent_text_content = document.createElement('div');
                parent_text_content.textContent = item.text;
                parent_text_content.className = "config_parent_text_content";
                parent_content.appendChild(parent_text_content);

                for (let index = 0; index < item.child.length; index++) {
                    const child = item.child[index];
                    let child_content = document.createElement('div');
                    child_content.id = vizwide3d.Main.GetViewID() + "_config_child" + child.id;
                    child_content.className = "config_child_content";
                    parent_content.appendChild(child_content);

                    let child_text_content = document.createElement('div');
                    child_text_content.id = vizwide3d.Main.GetViewID() + "_config_child_text" + child.id;
                    child_text_content.textContent = child.text;
                    child_text_content.className = "config_child_text_content";
                    child_content.appendChild(child_text_content);

                    let child_type_content = document.createElement('div');
                    child_type_content.id = vizwide3d.Main.GetViewID() + "_config_child_type" + child.id;
                    child_type_content.className = "config_child_type_content";
                    child_content.appendChild(child_type_content);

                    if(child.type === 1){    //체크박스
                        let checkBox_element = checkBox();
                        child_type_content.appendChild(checkBox_element);

                        let settingValue = false;
                        
                        if(child.setting){
                            settingValue = child.setting.value;
                        }

                        if (settingValue) {
                            checkBox_element.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                        } else {
                            checkBox_element.style.backgroundImage = '';
                        }

                        checkBox_element.addEventListener('click', function(){
                            if (settingValue) {
                                checkBox_element.style.backgroundImage = "";
                            } else {
                                checkBox_element.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjU2KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjAxNWQ5NmRkLWNiNjYtNjA0MC1iN2U1LWVjYmM1OTY2YzhiNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MGFlMThiLTM4MzAtMmE0OC1iNTcwLTM4NjEzNjJhNDZlNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTVkOTZkZC1jYjY2LTYwNDAtYjdlNS1lY2JjNTk2NmM4YjQiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6NTYrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ZUbakAAAAh0lEQVRIiWP8//8/Ay0BE01NHxYWsGAT1O6ZRHbEXC3JYyRoARQw4pHDBTAcRo0gwutbSi34j0ZT1QKi4olcC9ANxxlfxFiAbhjRhhNjAXoYk2Q4MRZgs4xow4mxAJchROcRYnyAbhhJGZDYIGJEo6luAVmGk2oBWQBfYUeVqo5xtMoc/hYAAIYRFy6fjtkoAAAAAElFTkSuQmCC')";
                            }
                            settingValue = !settingValue;
                            child.callback(settingValue);
                        });
                    } else if(child.type === 2){    // color pick
                        let settingValue = "#000000";
                        if(child.setting){
                            let rgb = "rgb(" + child.setting.value.r + "," + child.setting.value.g + "," + child.setting.value.b + ")";
                            settingValue = rgbToHex(rgb);
                        }

                        let colorpicker_element = color_picker(settingValue);
                        child_type_content.appendChild(colorpicker_element);
                        colorpicker_element.addEventListener('input', function(){
                            let rgbColor = hexToRgb(colorpicker_element.value);
                            let vizrgbColor = new VIZCore.Color(rgbColor.r, rgbColor.g, rgbColor.b, 255);
                            child.callback(vizrgbColor);
                        });
                    } else if(child.type === 3){    // slider
                        let slider_div = slider(child.setting);
                        child_type_content.appendChild(slider_div);

                        let slider_element = slider_div.childNodes[0];
                        slider_element.addEventListener('change', function(){
                            child.callback(slider_element.value);
                        });
                    } else if(child.type === 4){    // select box
                        if(!child.setting){
                            return;
                        }
                        let selectbox_element = selectbox(child.setting);
                        child_type_content.appendChild(selectbox_element);

                        let field_text = selectbox_element.childNodes[0];
                        let field_group = selectbox_element.childNodes[1];
                        for (let index = 0; index < field_group.childNodes.length; index++) {
                            const element = field_group.childNodes[index];
                            element.addEventListener('click', function(){
                                // 선택한 값 추가- 이전 값과 같을 시 이벤트 발생X
                                if(field_text.textContent.localeCompare(element.value) !== 0){
                                    field_text.textContent = element.id;
                                    child.callback(element.value);
                                }
                            });
                        }
                    }
                }
            }
        };

        init();
    }
}
export default ConfigPanel;