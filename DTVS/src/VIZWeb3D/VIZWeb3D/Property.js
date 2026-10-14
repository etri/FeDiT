VIZWeb3D.Property = function (View) {

    var scope = this;
    var view = View;
    this.View = view;
    var datamng = view.Data;
    var visible = false;

    this.Option = {
        get 'Visible'() {
            return visible;
        },
        set 'Visible'(v) {
            visible = v;
            var property = $("#ui_property_drag");
            if (property.length > 0)
                if (visible) {
                    $("#ui_tree_drag").css('height', '70%');

                    $("#ui_property_visible").addClass('clck');
                    //property.fadeIn(500);
                    property.show();
                }
                else {
                    $("#ui_tree_drag").css('height', '100%');

                    $("#ui_property_visible").removeClass('clck');
                    //property.fadeOut(500);
                    property.hide();
                }
        }
    };

    this.Show = function (id) {

        var Index = id * 1;

        var node = datamng.GetNode(Index);

        if (node !== undefined)
            if (node.data.type === ENTITY_TYPES.EntBody)
                Index = node.data.pIndex;

        getProperty(Index);
    };

    init();

    //function create() {
    //    var div_ui_property_drag = document.createElement('div');
    //    div_ui_property_drag.id = 'ui_property_drag';

    //    var parent = document.getElementById('VIZWeb3D');
    //    parent.appendChild(div_ui_property_drag);

    //    var div_ui_property_dragheader = document.createElement('div');
    //    div_ui_property_dragheader.id = 'ui_property_dragheader';
    //    div_ui_property_dragheader.innerHTML = 'Property';

    //    div_ui_property_drag.appendChild(div_ui_property_dragheader);

    //    var div_uinav = document.createElement('div');
    //    div_uinav.id = 'uinav';
    //    div_ui_property_drag.appendChild(div_uinav);

    //    var div_grid = document.createElement('div');
    //    div_grid.className = 'grid-container';
    //    div_uinav.appendChild(div_grid);

    //    var nav_ui_property = document.createElement('nav');
    //    nav_ui_property.id = 'ui_property';
    //    div_grid.appendChild(nav_ui_property);
    //}

    function init() {
        //create();
        scope.Option.Visible = false;

        var property = $("#ui_property_drag");
        if (property.length > 0) {
            $('#ui_property').on('touchstart', function (event) {
                event.stopPropagation();
            });
            $('#ui_property').on('touchmove', function (event) {
                event.stopPropagation();
            });
            $('#ui_property').on('touchend', function (event) {
                event.stopPropagation();
            });

            $("#ui_property_drag").mouseover(function () {
                view.Lock(true);
            }).mouseout(function () {
                view.Lock(false);
            });
        }
    }

    function getProperty(id) {
        var node = datamng.GetNode(id);
        //if (node.data.type === ENTITY_TYPES.EntBody) {
        //}
        //else {
        var property = datamng.GetProperty(id);
        showProperty(property);
        //}
    }

    function showProperty(property) {
        var ui_drag_property = $("#ui_property_drag");
        if (ui_drag_property.length === 0)
            return;

        var ui_property = document.getElementById('ui_property');
        ui_property.innerHTML = "";

        if (property === undefined)
            return;

        var tableData = document.createElement('table');
        //tableData.id = "info-data-back";
        tableData.width = '100%';
        tableData.border = "0";

        for (var u = 0; u < property.arrUserProperties.length; u++) {
            //for (var u = 0; u < 50; u++) {
            var userProperty = property.arrUserProperties[u];

            for (var i = 0; i < userProperty.items.length; i++) {
                var tr = document.createElement('tr');
                var tdKey = document.createElement('td');
                tdKey.className = "ui_property_key";
                tdKey.innerHTML = '<label id="upk' + u + '">' + userProperty.items[i].key + '</label>';
                var tdValue = document.createElement('td');
                tdValue.className = "ui_property_value";
                tdValue.innerHTML = '<label id="upv' + u + '">' + userProperty.items[i].value + '</label>';

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tableData.appendChild(tr);
            }
        }

        ui_property.appendChild(tableData);
    }

    if (scope.View.Configuration.Thema.Type !== THEMA_TYPES.Splitter)
        dragElement(document.getElementById("ui_property_drag"));
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
    var minWidth = 60;
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

    var pane = document.getElementById('ui_property_drag');
    var header = document.getElementById('ui_property_dragheader');

    if (scope.View.Configuration.Thema.Type !== THEMA_TYPES.Splitter) {
        // Mouse events
        pane.addEventListener('mousedown', onMouseDown);
        //document.addEventListener('mousemove', onMove);
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
        return x > 0 && x < b.width && y > 0 && y < b.height
            && y > header.clientHeight;
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

            if (clicked.onRightEdge) pane.style.width = Math.max(x, minWidth) + 'px';
            if (clicked.onBottomEdge) pane.style.height = Math.max(y, minHeight) + 'px';

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
            pane.style.cursor = 'move';
        } else {
            pane.style.cursor = 'default';
        }
    }
};