/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Configuration_UI = function (VIEW) {
    var scope = this;
    var view = VIEW;
    var visible = false;
    var active_tab = 0;

    var config_div = $('#ui_configuration_div');
    var config_cancle = $('#ui_btn_config_cancel');
    var tab_home = $('#ui_config_home');
    var tab_measure = $('#ui_config_measure');
    var tab_note = $('#ui_config_note');
    var tab_drawing = $('#ui_config_drawing');
    var btn_tab_home = $('#btn_tab_home');
    var btn_tab_measure = $('#btn_tab_measure');
    var btn_tab_note = $('#btn_tab_note');
    var btn_tab_drawing = $('#btn_tab_drawing');
    

    var check_ground = $('#ui_check_ground');
    var check_coordinate = $('#ui_check_coordinate');
    var check_model_outline = $('#ui_check_model_outline');
    var color_model_selection = $('#ui_color_model_selection');
    var color_model_selectionedge = $('#ui_color_model_selectionedge');
    var color_model_outline = $('#ui_color_model_line');
    var select_unit = $('#ui_select_unit');

    var stepper_measure_pointnum = $('#ui_measure_stepper'); 
    var btn_measure_stepper_minus = $('#btn_measure_stepper_minus');
    var btn_measure_stepper_plus = $('#btn_measure_stepper_plus');
    var measure_unit = $('#ui_measure_unit');
    var color_measure_line = $('#ui_color_measure_line');
    var color_measure_point = $('#ui_color_measure_point');
    var color_measure_pick = $('#ui_color_measure_pick');
    var color_measure_back = $('#ui_color_measure_back');
    var color_measure_border = $('#ui_color_measure_border');
    var color_measure_text = $('#ui_color_measure_text');

    var color_note_line = $('#ui_color_note_line');
    var color_note_point = $('#ui_color_note_point');
    var color_note_pick = $('#ui_color_note_pick');
    var color_note_back = $('#ui_color_note_back');
    var color_note_border = $('#ui_color_note_border');
    var color_note_text = $('#ui_color_note_text');

    var stepper_drawing_linewidth = $('#ui_drawing_stepper');
    var btn_drawing_stepper_minus = $('#btn_drawing_stepper_minus');
    var btn_drawing_stepper_plus = $('#btn_drawing_stepper_plus');
    var color_drawing_line = $('#ui_color_drawing_line');

    this.Option = {
        get 'Visible'() {
            return visible;
        },
        set 'Visible'(v) {
            visible = v;
            
            if (config_div.length > 0) {
                if (visible) {
                    config_div.show();
                }
                else {
                    config_div.hide();
                }
                view.Toolbar.Refresh();
            }
        }
    };

    init();

    function init() {
        $('.color_picker').each(function () {
            $(this).minicolors({
                control: $(this).attr('data-control') || 'hue',
                defaultValue: $(this).attr('data-defaultValue') || '',
                format: $(this).attr('data-format') || 'hex',
                keywords: $(this).attr('data-keywords') || '',
                inline: $(this).attr('data-inline') === 'true',
                letterCase: $(this).attr('data-letterCase') || 'lowercase',
                opacity: $(this).attr('data-opacity'),
                position: $(this).attr('data-position') || 'bottom right',
                swatches: $(this).attr('data-swatches') ? $(this).attr('data-swatches').split('|') : [],
                theme: 'default'
            });
        });

        if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
            btn_tab_measure.hide();
            btn_tab_note.hide();
        }

        if (config_div.length > 0) {
            config_div.on('touchstart', function (event) {
                event.stopPropagation();
            });
            config_div.on('touchmove', function (event) {
                event.stopPropagation();
            });
            config_div.on('touchend', function (event) {
                event.stopPropagation();
            });
            config_div.mouseover(function () {
                view.Lock(true);
            }).mouseout(function () {
                view.Lock(false);
            });
        }

        if (config_cancle.length > 0) {
            config_cancle.click(function () {
                scope.Option.Visible = !scope.Option.Visible;    
            });
        }

        if (check_ground.length > 0) {
            check_ground.prop("checked", view.Ground.Option.Visible);

            check_ground.click(function () {
                view.Ground.Option.Visible = !view.Ground.Option.Visible;
                view.Toolbar.Refresh();
            });
        }

        if (check_coordinate.length > 0) {
            check_coordinate.prop("checked", view.Coordinate.Option.Visible);
            check_coordinate.click(function () {
                view.Coordinate.Option.Visible = !view.Coordinate.Option.Visible;
                view.Toolbar.Refresh();
            });
        }

        if (color_model_selection.length > 0) {
            var settings = color_model_selection.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Model.Selection.Color = color;
                view.SetConfiguration();
            };
            color_model_selection.minicolors('value', RGBAToString(view.Configuration.Model.Selection.Color));
        }

        if (color_model_selectionedge.length > 0) {
            var settings = color_model_selectionedge.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Model.Selection.Line.Color = color;
                view.SetConfiguration();
            };
            color_model_selectionedge.minicolors('value', RGBAToString(view.Configuration.Model.Selection.Line.Color));
        }

        if (color_model_outline.length > 0) {
            var settings = color_model_outline.data('minicolors-settings');
            settings.change = function (value, opacity) {
                    var color = StringToRGBA(value);
                    view.Configuration.Model.Edge.Color = color;
                    view.SetConfiguration();
            };

            color_model_outline.minicolors('value', RGBAToString(view.Configuration.Model.Edge.Color));
        }

        if (check_model_outline.length > 0) {
            check_model_outline.prop("checked", view.Configuration.Model.Selection.Line.Enable);
            check_model_outline.click(function () {
                view.Configuration.Model.Selection.Line.Enable = !view.Configuration.Model.Selection.Line.Enable;
                view.SetConfiguration();
            });
        }

        if (select_unit.length > 0) {
            select_unit.val(view.Configuration.Model.Selection.Unit).prop("selected", true);
            select_unit.on("change", function () {
                view.Configuration.Model.Selection.Unit = select_unit.val() * 1;
                view.SetConfiguration(true);
            });
        }

        // Tab
        if (btn_tab_home.length > 0)
            btn_tab_home.click(function () {
                swichingTab(0);
            });
        if (btn_tab_measure.length > 0)
            btn_tab_measure.click(function () {
                swichingTab(1);
            });
        if (btn_tab_note.length > 0)
            btn_tab_note.click(function () {
                swichingTab(2);
            });
        if (btn_tab_drawing.length > 0)
            btn_tab_drawing.click(function () {
                swichingTab(3);
            });

        // Measure
        if (stepper_measure_pointnum.length > 0) {
            var ctrl_measure_pointnum = $("#ui_measure_pointnum");
            ctrl_measure_pointnum.val(view.Configuration.Measure.PositionalNumber);

            var min = ctrl_measure_pointnum.prop('min');
            var max = ctrl_measure_pointnum.prop('max');
            var step = ctrl_measure_pointnum.prop('step');

            btn_measure_stepper_minus.click(function () {
                stepperInput(ctrl_measure_pointnum, step * -1, min);
                view.Configuration.Measure.PositionalNumber = ctrl_measure_pointnum.val() * 1;
                view.SetConfiguration();
            });
            btn_measure_stepper_plus.click(function () {
                stepperInput(ctrl_measure_pointnum, step * 1, max);
                view.Configuration.Measure.PositionalNumber = ctrl_measure_pointnum.val() * 1;
                view.SetConfiguration();
            });
        }


        if (measure_unit.length > 0) {
            measure_unit.val(view.Configuration.Measure.Unit).prop("selected", true);
            measure_unit.on("change", function () {
                var unit = measure_unit.val();
                if (unit === MEASURE_UNIT.mm)
                    view.Configuration.Measure.Unit = MEASURE_UNIT.mm;
                else if (unit === MEASURE_UNIT.cm)
                    view.Configuration.Measure.Unit = MEASURE_UNIT.cm;
                else if (unit === MEASURE_UNIT.inch)
                    view.Configuration.Measure.Unit = MEASURE_UNIT.inch;
                view.SetConfiguration(true);
            });
        }

        if (color_measure_line.length > 0) {
            var settings = color_measure_line.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Line = color;
                view.SetConfiguration();
            };
            color_measure_line.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Line));
        }

        if (color_measure_point.length > 0) {
            var settings = color_measure_point.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Point = color;
                view.SetConfiguration();
            };
            color_measure_point.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Point));
        }

        if (color_measure_pick.length > 0) {
            var settings = color_measure_pick.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Pick = color;
                view.SetConfiguration();
            };
            color_measure_pick.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Pick));
        }

        if (color_measure_back.length > 0) {
            var settings = color_measure_back.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Back = color;
                view.SetConfiguration();
            };
            color_measure_back.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Back));
        }

        if (color_measure_border.length > 0) {
            var settings = color_measure_border.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Border = color;
                view.SetConfiguration();
            };
            color_measure_border.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Border));
        }

        if (color_measure_text.length > 0) {
            var settings = color_measure_text.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Measure.Color.Text = color;
                view.SetConfiguration();
            };
            color_measure_text.minicolors('value', RGBAToString(view.Configuration.Measure.Color.Text));
        }

        // Note
        var color_note_line = $('#ui_color_note_line');
        var color_note_point = $('#ui_color_note_point');
        var color_note_pick = $('#ui_color_note_pick');
        var color_note_back = $('#ui_color_note_back');
        var color_note_border = $('#ui_color_note_border');
        var color_note_text = $('#ui_color_note_text');

        if (color_note_line.length > 0) {
            var settings = color_note_line.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Line = color;
                view.SetConfiguration();
            };
            color_note_line.minicolors('value', RGBAToString(view.Configuration.Note.Color.Line));
        }

        if (color_note_point.length > 0) {
            var settings = color_note_point.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Point = color;
                view.SetConfiguration();
            };
            color_note_point.minicolors('value', RGBAToString(view.Configuration.Note.Color.Point));
        }

        if (color_note_pick.length > 0) {
            var settings = color_note_pick.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Pick = color;
                view.SetConfiguration();
            };
            color_note_pick.minicolors('value', RGBAToString(view.Configuration.Note.Color.Pick));
        }

        if (color_note_back.length > 0) {
            var settings = color_note_back.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Back = color;
                view.SetConfiguration();
            };
            color_note_back.minicolors('value', RGBAToString(view.Configuration.Note.Color.Back));
        }

        if (color_note_border.length > 0) {
            var settings = color_note_border.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Border = color;
                view.SetConfiguration();
            };
            color_note_border.minicolors('value', RGBAToString(view.Configuration.Note.Color.Border));
        }

        if (color_note_text.length > 0) {
            var settings = color_note_text.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Note.Color.Text = color;
                view.SetConfiguration();
            };
            color_note_text.minicolors('value', RGBAToString(view.Configuration.Note.Color.Text));
        }

        // Drawing
        if (stepper_drawing_linewidth.length > 0) {
            var ctrl_drawing_linewidth = $("#ui_drawing_linewidth");
            ctrl_drawing_linewidth.val(view.Configuration.Drawing.Width);

            var min = ctrl_drawing_linewidth.prop('min');
            var max = ctrl_drawing_linewidth.prop('max');
            var step = ctrl_drawing_linewidth.prop('step');

            btn_drawing_stepper_minus.click(function () {
                stepperInput(ctrl_drawing_linewidth, step * -1, min);
                view.Configuration.Drawing.Width = ctrl_drawing_linewidth.val() * 1;
                view.SetConfiguration();
            });
            btn_drawing_stepper_plus.click(function () {
                stepperInput(ctrl_drawing_linewidth, step * 1, max);
                view.Configuration.Drawing.Width = ctrl_drawing_linewidth.val() * 1;
                view.SetConfiguration();
            });
        }

        if (color_drawing_line.length > 0) {
            var settings = color_drawing_line.data('minicolors-settings');
            settings.change = function (value, opacity) {
                var color = StringToRGBA(value);
                view.Configuration.Drawing.Color.Line = color;
                view.SetConfiguration();
            };
            color_drawing_line.minicolors('value', RGBAToString(view.Configuration.Drawing.Color.Line));
        }

        //createElement();
    }

    function stepperInput(el, s, m) {
        
        if (s > 0) {
            if (parseInt(el.val()) < m) {
                var tmp = parseInt(el.val()) + s;
                el.val(tmp);
            }
        } else {
            if (parseInt(el.val()) > m) {
                var tmp = parseInt(el.val()) + s;
                el.val(tmp);
            }
        }
    }


    function swichingTab(tabIndex) {
        if (active_tab === tabIndex)
            return;

        switch (active_tab) {
            case 0:
                tab_home.hide();
                break;
            case 1:
                tab_measure.hide();
                break;
            case 2:
                tab_note.hide();
                break;
            case 3:
                tab_drawing.hide();
                break;
            default:
                break;
        }

        switch (tabIndex) {
            case 0:
                tab_home.show();
                break;
            case 1:
                tab_measure.show();
                break;
            case 2:
                tab_note.show();
                break;
            case 3:
                tab_drawing.show();
                break;
            default:
                break;
        }

        active_tab = tabIndex;
    }

    function RGBAToString(color) {
        return "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    }

    function StringToRGBA(rgba) {
        let sep = rgba.indexOf(",") > -1 ? "," : " ";
        rgba = rgba.substr(5).split(")")[0].split(sep);

        // Strip the slash if using space-separated syntax
        if (rgba.indexOf("/") > -1)
            rgba.splice(3, 1);

        for (let R in rgba) {
            let r = rgba[R];
            if (r.indexOf("%") > -1) {
                let p = r.substr(0, r.length - 1) / 100;

                if (R < 3) {
                    rgba[R] = Math.round(p * 255);
                } else {
                    rgba[R] = p;
                }
            }
        }

        return { r: rgba[0] * 1, g: rgba[1] * 1, b: rgba[2] * 1, a: rgba[3] * 1 };
    }

    function createElement() {
        var vizweb3d = document.getElementById('VIZWeb3D');

        var ui_configuration_div = document.createElement('div');
        ui_configuration_div.id = "ui_configuration_div";

        var ui_bar = document.createElement('div');
        ui_bar.innerHTML =
            "<div class='ui-bar ui-header-color'>" +
                "<button id='tab_home' class='ui-bar-item ui-button'>Home</button>" +
                "<button class='ui-bar-item ui-button'>Measure</button>" +
                "<button class='ui-bar-item ui-button'>Note</button>" +
                "<div id='ui_btn_config_cancel' class='ui-btn-cancel uialone_simple' style='margin: 4px 3px auto 370px'>" +
                    "<img alt='imgfile' src='VIZWeb3D/Image/Toolbar_Cancel_32.png' width='16px'>" +
                "</div>" +
            "</div>";
        ui_configuration_div.appendChild(ui_bar);

        var ui_home = document.createElement('div');
        ui_home.className = 'ui-container ui-white';
        ui_home.innerHTML =
            "<h4 style='margin-block-end:0.5em'>View</h4>" +
            "<div class='ui-cell-row'>" +
            "<div class='ui-container ui-cell ui-half'>" +
            "<label>Ground</label>" +
            "</div>" +
            " <div class='ui-container ui-cell'>" +
            "<input class='ui-check' type='checkbox' style='left: 50%'>" +
            "</div>" +
            "</div>" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "";
        ui_configuration_div.appendChild(ui_home);
        vizweb3d.appendChild(ui_configuration_div);
    }
};