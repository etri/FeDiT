VIZWeb3D.Tree = function (View) {

    var scope = this;
    var view = View;
    this.View = view;
    var datamng = view.Data;
    var visible = false;
    var init = false;

    this.SetOption = function (parameters) {
        if (parameters === undefined) parameters = {};
        scope.Option.Visible = parameters.hasOwnProperty("Option") ? parameters["Option"].Visible : visible;
    };

    this.trigger_event = true;
    this.Option = {
        get 'Visible'() {
            return visible;
        },
        set 'Visible'(v) {
            visible = v;
            var tree = $("#uinav_drag");
            if (tree.length > 0) {
                if (visible) {
                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeIn(500);
                    //if ($("#ui_tree_visible").length > 0)
                    //    $("#ui_tree_visible").addClass('clck');
                }
                else {
                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeOut(500);
                    //if ($("#ui_tree_visible").length > 0)
                    //    $("#ui_tree_visible").removeClass('clck');
                }
            }

            tree = $("#ui_tree_drag");
            if (tree.length > 0) {
                if (visible) {
                    if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter) {
                        if ($("#ui_info_expand").length > 0) {
                            $('#ui_info_expand').addClass('clck');
                        }
                    }
                }
                else {
                    if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter) {
                        if ($("#ui_info_expand").length > 0) {
                            $('#ui_info_expand').removeClass('clck');
                        }
                    }
                }
            }
        }
    };

    this.subNodes = function (id) {
        var nodes = null;
        var datas = [];
        nodes = datamng.GetSubNodes(id);
        for (var i = 0; i < nodes.length; i++) {
            datas.push(scope.item(nodes[i]));
        }
        return datas;
    };
    this.icon = function (type) {
        var path = '';
        if (type === ENTITY_TYPES.EntAssembly)
            path = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAC10lEQVQ4jX1TXUiTURh+vu/s82c697m/VHKbJmpqhEGmQmAQEkE3dVHihZWBF1Yaqd10nWYZGFR4VxcZmBFCVGQRhVZmYUOWWkvNOf/mps7Pzf2cndiqxQx94T0X533Oc57znucFY2zTbKy78PJ2S3P3VhgutGyMpvqL7fq01FMVxKoIlUyGUqfVNttaVVd/dSM2iuBOS/OhICPd6lhBfsD+gaOOufA+UafgRkI+KyzIXpVWHMfPVNU+jyK4drPDkKPg7+cohL3KvocxTGfAorEEEy4XG15eglKj4s6eTgHYIqyzWb7hr45B86izsvF8zU9ZiMXT1dWr2ZmZKWpchLolYNIMi9IAatBzWf4h5BWKALOFb0xPtcaIvrli+5SlF6jJDhNwdod7ZGaGzItKf9LhMjJTWMCX7ElDlt4CoAhzIwGYno1DTE8NqhKGqCJZEtK2y9yhs/zftyzTIMYdS0L/7ABfvu0R9MoJAN5wajNUMOQSzFkGeIV8XIB3IdK3sAIaGysSrweUAcGAD9L0BLzSPch1eYjRGoHAKMRkL/xx8QDWAU6GNS+niyh4rTaKowoVkslvQdRHYR+exuqPj2DOQSTFWgHmD9dcfjXaHyfgzZepuIgCZ27ZZL+T2z0z2cN2yNY5EkPCYL/HD57QP/8loPfdIl6ZOaYtW+JSxwJTEYJQMLcH47pyzo41qrd9IqUZKyCBpZALYFnJxFsTg5loacn+98RDEd2DgGteJijTEVxxQWIqdtd8FC++j+BkkQkyUyKeSAVYUBWD4EHYdQqBYTkI378mSvYKFufvFNKNOfAGeDDAatPhSt8JaAozISVqoQEFx4HTrFPf/BgbXJhilRGCbz23hgHsyj5SW8XL5B3xxn2E2h1Rnhf5VUg+t9f8mR1rbeiLtvLGyK++fokkaZtkglplzE6CnNqcq/bF1p7L5/4bpi3HOb+6rfNgQ9vTTTGM4RcGToRpXE7cBgAAAABJRU5ErkJggg==';
            //path = 'VIZWeb3D/Image/treeList_Assembly_16.png';
        if (type === ENTITY_TYPES.EntPart)
            path = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAABpUlEQVQ4jWP8//8/AyWACZ/eOQuneoAwPjVYXdA9aaa8gY74Jg01Dg0Q/8atHzcuXHnpV5qX/pCgAes2LVuvpiLqpqP+jIuB4RNUlI/hyk2pb7fuvN4V5BcViNWA6b0pfbpWwUk25t/5Gf4/xeFeaYYjJzk/Xj65fV5mwaQiBuQwkOC65aH2awLX18f3/jIwsGPRzc7w68PHv/qiO7mUVb7Dw4UFyS2/Hp+6zSrx5cOfb4+kfvNr+7Cy8X8DS/39Icrw7fm532ycnxh5uZ6xMrJI/cI0AApeXHvNwsz2juH315e/uMS1GdjElBkYfl9j4OV+ycbw/w+GuzAMANv46y/D88sv2IQ+/2AQYnrHwC/6m4EBR3LBmw5+f//NwMT8F58S/AYQA+AGPH71f85bSbmPvOLcuLWxCTIcua348eGTb3NgQhgJadkU+/UKov/deN++4mLnYWWQNFJm4BVlZ7jyVPzbrfs/dwUFz8SekJBBd5uzvLr4300qkgxaTPyKjI+/cF29cOOnX2n+HIykzAAyABee1GzjsWSSdzw+NZRlZwYGBgDnQtDH6ar3AgAAAABJRU5ErkJggg==';
            //path = 'VIZWeb3D/Image/treeList_Part_16.png';
        if (type === ENTITY_TYPES.EntBody)
            path = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAABAklEQVQ4jWP8//8/AyWAiRS9zZ2J4ehiLMRonLcgLU9VWaDB3kLoFwMDw0qiDWjvS7Yx1eWZHuItqcr3/w77oesSL4lyQffEFHk1BbaZMYEytrJ8T7kYft6HykhgqMUwYMaspB4PB8kUXcVv/AxfzjMw/MTvPQwDtNQFY3TFrvMzfPmDXycUYI+F/8RpZiA1GikzgBF7hBFnAI8yw+VXmh+v3Xy/BF0Kf0JiF2N4/En627nTrw/fevA5vTR/3kPiDGDhZfjEqPLz1LkPt09ffpJZWTT3CC47MDLToYPFLxiZmNlu3/3QkJQwaxJ+v4Fi7P9/FJxfFpGCLoYPU5adGRgYAEOOfvJabkwyAAAAAElFTkSuQmCC';
            //path = 'VIZWeb3D/Image/treeList_Body_16.png';

        return path;
    };

    this.item = function (obj) {
        //var children = scope.subNodes(obj.index);
        var children = [];
        var name = obj.name === null ? 'Body ' + obj.index : obj.name;
        var child = true;

        if (view.Configuration.Model.Selection.Unit === SELECT_UNIT.Part) {
            var node = datamng.GetNode(obj.index);
            if (node.data.type === ENTITY_TYPES.EntPart)
                child = false;
        }

        var data = {
            text: name,//text: "<button>Press</button>" + name,
            id: obj.index,
            //children: children.length === 0 ? false : children,
            children: obj.cCount === 0 || obj.cCount === -1 ? false : child,
            state: { opened: false, disabled: false, selected: false, checked: true },
            icon: scope.icon(obj.type)
        };
        return data;
    };

    this.Select = function (id) {
        scope.trigger_event = false;

        if ($('#ui_tree').length > 0) {
            $('#ui_tree').jstree().deselect_all();

            var bbind = $('#ui_tree').jstree(true).get_node(id);
            if (!bbind) {
                // create
                var Nodes = [];
                scope.View.Data.GetNodePath(id, Nodes);
                var load = function (id, Nodes) {
                    var parent = null;
                    for (var i = Nodes.length - 1; i >= 0; i--) {
                        var created = $('#ui_tree').jstree(true).get_node(Nodes[i].index);
                        if (created === false) {
                            $('#ui_tree').jstree(true).load_node(Nodes[i].pIndex, function () {
                                Nodes.splice(i, 1);
                                load(id, Nodes);
                            });
                            break;
                        }
                        else {
                            parent = created;
                            Nodes.splice(i, 1);
                        }
                    }

                    if (Nodes.length === 0) {
                        $('#ui_tree').jstree(true)._open_to(id).focus();
                        $('#ui_tree').jstree(true).select_node(id, false, false);
                        SetScrollTop(id);

                        scope.trigger_event = true;
                    }
                };
                load(id, Nodes);
            }
            else {
                $('#ui_tree').jstree(true)._open_to(id).focus();

                $('#ui_tree').jstree(true).select_node(id, false, false);
                SetScrollTop(id);

                scope.trigger_event = true;
            }
        }

        scope.View.Property.Show(id);
    };

    function SetScrollTop(id) {
        try {
            var treeOffsetHeight = $('#ui_tree').jstree(true).element.context.offsetHeight;
            var node = $("#ui_tree #" + id)[0];
            $('#ui_tree').jstree(true).element.context.scrollTop = node.offsetTop - treeOffsetHeight / 2;
        } catch (e) {
            $("#ui_tree #" + id)[0].scrollIntoView();
        }
        
    }

    this.Deselect = function (id) {
        scope.trigger_event = false;

        scope.trigger_event = true;
    };

    this.DeselectAll = function () {

        if (init === false)
            return;

        if ($('#ui_tree').length > 0)
            $('#ui_tree').jstree(true).deselect_all();

        scope.View.Property.Show(-1);
    };

    this.Check = function (id) {
        scope.trigger_event = false;
        if ($('#ui_tree').length > 0)
            $('#ui_tree').jstree().check_node(id, false);
        scope.trigger_event = true;
    };
    this.UnCheck = function (id) {
        scope.trigger_event = false;
        if ($('#ui_tree').length > 0)
            $('#ui_tree').jstree().uncheck_node(id, false);

        

        scope.trigger_event = true;
    };
    this.Refresh = function () {
        if ($("#ui_tree").length > 0) {
            $('#ui_tree').jstree(true).refresh();
        }
    };

    //this.Init();

    this.Init = function () {
        if ($("#ui_tree_test").length > 0)
            $("#ui_tree_test").click(function () {
                scope.Select(1);
                scope.UnCheck(3);
            });

        if ($("#ui_tree_visible").length > 0) {
            //$("#ui_tree_visible").addClass('clck');
            $('#ui_tree_visible').attr('data-tooltip-text', 'Model Tree');

            $("#ui_tree_visible").click(function () {
                scope.Option.Visible = !scope.Option.Visible;
                //visible = !visible;
                if (scope.Option.Visible) {
                    //$("#uinav").fadeIn(500);
                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeIn(500);
                    $(this).addClass('clck');
                }
                else {
                    //$("#uinav").fadeOut(500);
                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeOut(500);
                    $(this).removeClass('clck');
                }
            });
        }
        if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter) {
            scope.Option.Visible = true;
            if ($("#ui_info_expand").length > 0) {
                $('#ui_info_expand').attr('data-tooltip-text', 'Show Info');
                //$('#ui_tree_collapse').attr('data-tooltip-text', 'Hide Tree');
                $('#ui_info_expand').addClass('clck');

                $("#ui_info_expand").click(function () {
                    scope.Option.Visible = !scope.Option.Visible;
                    if (scope.Option.Visible) {
                        $('#ui_info_expand').addClass('clck');
                    }
                    else {
                        $('#ui_info_expand').removeClass('clck');
                    }
                    scope.View.Toolbar.SetSplitterPos(scope.Option.Visible);
                });
            }
        }
        else {
            if ($("#ui_tree_expand").length > 0
                && $("#ui_tree_collapse").length > 0
            ) {
                $('#ui_tree_expand').attr('data-tooltip-text', 'Show Tree');
                //$('#ui_tree_collapse').attr('data-tooltip-text', 'Hide Tree');

                $("#ui_tree_expand").click(function () {
                    scope.Option.Visible = true;
                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeIn(500);
                    $("#ui_tree_expand").fadeOut(500);
                    $("#ui_tree_collapse").fadeIn(500);
                });

                $("#ui_tree_collapse").click(function () {
                    scope.Option.Visible = false;

                    if ($("#uinav_drag").length > 0)
                        $("#uinav_drag").fadeOut(500);

                    $("#ui_tree_collapse").fadeOut(500);
                    $("#ui_tree_expand").fadeIn(500);
                });
            }
        }
        


        if ($("#ui_tree").length > 0)
            $('#ui_tree')
                .on("changed.jstree", function (e, data) {
                    if (data.selected.length) {
                        //alert('The selected node is: ' + data.instance.get_node(data.selected[0]).text);
                    }
                })
                .jstree({
                    //"initially_open": ["#"],
                    //"rtl": true,
                    "animation": 0,
                    'plugins': ["checkbox", "changed"],//["wholerow", "checkbox", "changed"],
                    //"plugins": ["wholerow", "types", "checkbox", "ui", "crrm", "sort"],
                    'checkbox': {
                        tie_selection: false,
                        whole_node: false,
                        striped : true
                    },
                    'core': {
                        "themes": {
                            responsive: true,
                            // stripes : true // background stripes
                            // dots : false
                        },
                        'multiple': false,
                        'data': function (node, cb) {
                            if (node.id === "#") {
                                var datas = [];
                                var sub = datamng.GetSubNodes(-1);
                                for (var i = 0; i < sub.length; i++) {
                                    datas.push(scope.item(sub[i]));
                                }
                                cb(datas);
                            }
                            else {
                                var id = node.id;
                                if (id === undefined)
                                    id = node;

                                var datas = [];
                                var sub = datamng.GetSubNodes(id * 1);

                                for (var i = 0; i < sub.length; i++) {
                                    datas.push(scope.item(sub[i]));
                                }
                                cb(datas);
                            }
                        }
                    }

                });
        //$("#ui_tree").jstree(this).set_theme("default-dark", true);

        $(function () {
            $('#ui_tree').on('check_node.jstree Event', function (e, data) {
                if (!scope.trigger_event)
                    return;

                view.Control.Model.Show(data.node.id * 1, true);
                //console.log('check_node' + data.node.id);
            });
        });

        $(function () {
            $('#ui_tree').on('uncheck_node.jstree Event', function (e, data) {
                if (!scope.trigger_event)
                    return;

                view.Control.Model.Show(data.node.id * 1, false);
                //console.log('uncheck_node' + data.node.id);
            });
        });

        $(function () {
            $('#ui_tree').on('deselect_node.jstree Event', function (e, data) {
                if (!scope.trigger_event)
                    return;
                //console.log('deselect_node' + data.node.id);
            });
        });

        $(function () {
            $('#ui_tree').on('select_node.jstree Event', function (e, data) {
                if (!scope.trigger_event)
                    return;

                view.Control.Model.Select(data.node.id * 1);

                scope.View.Property.Show(data.node.id * 1);
            });
        });

        $('#ui_tree').on("hover_node.jstree", function (node) {
            view.Lock(true);
        });

        $("#ui_tree").mouseover(function () {
            view.Lock(true);
            //console.log("over");
        }).mouseout(function () {
            //console.log("out");
            view.Lock(false);
            }).mouseenter(function () {
                view.Lock(true);
            //console.log("enter");
            });

        //$("#ui_tree").bind("ready.jstree", function (event) {
        //    $("#ui_tree li a").addTouch();
        //});

        //$('#ui_tree').on('mouseover', function (event) {
        //    view.Lock(true);
        //});
        //$('#ui_tree').on('mouseout', function (event) {
        //    view.Lock(false);
        //});
        //$('#ui_tree').on('mouseenter', function (event) {
        //    view.Lock(true);
        //});

        $('#ui_tree').on('touchstart', function (event) {
            event.stopPropagation();
        });
        $('#ui_tree').on('touchmove', function (event) {
            event.stopPropagation();
        });
        $('#ui_tree').on('touchend', function (event) {
            event.stopPropagation();
        });

        $("#uinav_drag").mouseover(function () {
            //view.Lock(true);
        }).mouseout(function () {
            view.Lock(false);
            }).mouseenter(function () {
                view.Lock(true);
        });

        init = true;
    };

    dragElement(document.getElementById("uinav_drag"));
    function dragElement(elmnt) {
        if (elmnt === null)
            return;

        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();

            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            view.Lock(true);
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            //console.log(elmnt.style.top + ":" + elmnt.style.left);
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            view.Lock(false);
        }
    }

    function setBounds(element, x, y, w, h) {
        //element.style.left = x + 'px';
        //element.style.top = y + 'px';
        //element.style.width = w + 'px';
        //element.style.height = h + 'px';
    }

    // Minimum resizable area
    var minWidth = 100;
    var minHeight = 40;

    // Thresholds
    var FULLSCREEN_MARGINS = -10;
    var MARGINS = 4;

    // End of what's configurable.
    var clicked = null;
    var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

    var rightScreenEdge, bottomScreenEdge;

    var preSnapped;

    var b, x, y;

    var redraw = false;

    var e;

    var pane = document.getElementById('uinav_drag');
    var header = document.getElementById('uinav_dragheader');
    if (pane) {
        // Mouse events
        pane.addEventListener('mousedown', onMouseDown);
        pane.addEventListener('mousemove', onMove);
        pane.addEventListener('mouseup', onUp);

        // Touch events	
        //pane.addEventListener('touchstart', onTouchDown);
        //document.addEventListener('touchmove', onTouchMove);
        //document.addEventListener('touchend', onTouchEnd);
    }
        function onTouchDown(e) {
            onDown(e.touches[0]);
            e.preventDefault();
        }

        function onTouchMove(e) {
            onMove(e.touches[0]);
        }

        function onTouchEnd(e) {
            if (e.touches.length === 0) onUp(e.changedTouches[0]);
        }

        function onMouseDown(e) {
            onDown(e);
            if (clicked && clicked.isResizing) {
                document.addEventListener('mousemove', onMove);
            }
            e.preventDefault();
        }

        function onDown(e) {
            calc(e);

            var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

            if (onTopEdge)
                return;

            clicked = {
                x: x,
                y: y,
                cx: e.clientX,
                cy: e.clientY,
                w: b.width,
                h: b.height,
                isResizing: isResizing,
                isMoving: !isResizing && canMove(),
                onTopEdge: onTopEdge,
                onLeftEdge: onLeftEdge,
                onRightEdge: onRightEdge,
                onBottomEdge: onBottomEdge
            };
        }

        function canMove() {
            return x > 0 && x < b.width && (y > 0 && y < b.height
                && y < header.clientHeight);
        }

        function calc(e) {
            b = pane.getBoundingClientRect();
            x = e.clientX - b.left;
            y = e.clientY - b.top - header.clientHeight;

            onTopEdge = y < MARGINS;
            onLeftEdge = x < MARGINS;
            onRightEdge = x >= b.width - MARGINS;
            onBottomEdge = y >= b.height - MARGINS;

            rightScreenEdge = window.innerWidth - MARGINS;
            bottomScreenEdge = window.innerHeight - MARGINS;

            //console.log("Top" + onTopEdge + " Left" + onLeftEdge + " Right" + onRightEdge + " Bottom" + onBottomEdge + " RightScreen" + rightScreenEdge + " BottomScreen" + bottomScreenEdge);
        }

        function onMove(ee) {
            calc(ee);

            e = ee;

            redraw = true;

            draw();
        }

        function onUp(e) {
            calc(e);

            if (clicked && clicked.isMoving) {
                // Snap
                var snapped = {
                    width: b.width,
                    height: b.height
                };

                if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS) {
                    // hintFull();
                    setBounds(pane, 0, 0, window.innerWidth, window.innerHeight);
                    preSnapped = snapped;
                } else if (b.top < MARGINS) {
                    // hintTop();
                    setBounds(pane, 0, 0, window.innerWidth, window.innerHeight / 2);
                    preSnapped = snapped;
                } else if (b.left < MARGINS) {
                    // hintLeft();
                    setBounds(pane, 0, 0, window.innerWidth / 2, window.innerHeight);
                    preSnapped = snapped;
                } else if (b.right > rightScreenEdge) {
                    // hintRight();
                    setBounds(pane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
                    preSnapped = snapped;
                } else if (b.bottom > bottomScreenEdge) {
                    // hintBottom();
                    setBounds(pane, 0, window.innerHeight / 2, window.innerWidth, window.innerWidth / 2);
                    preSnapped = snapped;
                } else {
                    preSnapped = null;
                }
            }

            clicked = null;

            document.removeEventListener('mousemove', onMove);
        }

        function draw() {
            if (!redraw) return;

            redraw = false;

            if (clicked && clicked.isResizing) {

                if (clicked.onRightEdge) {
                    pane.style.width = Math.max(x, minWidth) + 'px';
                }
                if (clicked.onBottomEdge) {
                    pane.style.height = Math.max(y, minHeight) + 'px';
                }

                if (clicked.onLeftEdge) {
                    var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
                    if (currentWidth > minWidth) {
                        pane.style.width = currentWidth + 'px';
                        pane.style.left = e.clientX + 'px';
                    }
                }

                if (clicked.onTopEdge) {
                    var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
                    if (currentHeight > minHeight) {
                        pane.style.height = currentHeight + 'px';
                        pane.style.top = e.clientY + 'px';
                    }
                }
                return;
            }

            // style cursor
            if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
                pane.style.cursor = 'nwse-resize';
            } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
                pane.style.cursor = 'nesw-resize';
            } else if (onRightEdge || onLeftEdge) {
                pane.style.cursor = 'ew-resize';
            } else if (onBottomEdge || onTopEdge) {
                pane.style.cursor = 'ns-resize';
            } else if (canMove()) {
                //pane.style.cursor = 'move';
            } else {
                pane.style.cursor = 'default';
            }
        }
    

    
};