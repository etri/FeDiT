/**
 * @author jhjang@softhills.net
 */


class Enum {
    constructor(VIZCore) {

        VIZCore.namespace("VIZCore.Enum.LANGUAGE_KEY");
        VIZCore.Enum.LANGUAGE_KEY = {
            /// <summary>
            /// Korean
            /// </summary>
            KOREAN: 0,
            /// <summary>
            /// English
            /// </summary>
            ENGLISH: 1,
        };

        VIZCore.namespace("VIZCore.Enum.OBJECT3D_FILTER");
        VIZCore.Enum.OBJECT3D_FILTER = {
            /// <summary>
            /// ROOT NODE
            /// </summary>
            ROOT: 0,
            /// <summary>
            /// FILE NODE
            /// </summary>
            FILE: 1,
            /// <summary>
            /// ALL
            /// </summary>
            ALL: 2,
            /// <summary>
            /// PART
            /// </summary>
            PART: 3,
            /// <summary>
            /// Selected Top Node
            /// </summary>
            SELECTED_TOP: 4,
            /// <summary>
            /// Selected All Node
            /// </summary>
            SELECTED_ALL: 5,
            /// <summary>
            /// Selected All Node (Include Body)
            /// </summary>
            SELECTED_ALL_INCLUDE_BODY: 6,
            /// <summary>
            /// Locked Hidden
            /// </summary>
            LOCKED_HIDDEN: 7,
            /// <summary>
            /// 보이는 파트 노드
            /// </summary>
            VISIBLE_PART: 8,
            /// <summary>
            /// 숨겨진 노드
            /// </summary>
            HIDDEN_NODE: 9,
            /// <summary>
            /// 선택된 파트 노드
            /// </summary>
            SELECTED_PART: 10,
            /// <summary>
            /// 최하위 어셈블리 노드
            /// </summary>
            LEAF_ASSEMBLY: 11,
            /// <summary>
            /// 최하위 어셈블리 노드의 부모노드
            /// </summary>
            PARENT_LEAF_ASSEMBLY: 12,
            /// <summary>
            /// 어셈블리 노드
            /// </summary>
            ASSEMBLY: 13,
            /// <summary>
            /// ALL (Include Body)
            /// </summary>
            ALL_INCLUDE_BODY: 14,

            /// <summary>
            /// 보이는 바디 노드
            /// </summary>
            VISIBLE_BODY: 15
        };

        VIZCore.namespace("VIZCore.Enum.CLIPPING_MODES");
        VIZCore.Enum.CLIPPING_MODES = {
            X: 'X',
            Y: 'Y',
            Z: 'Z',
            BOX: 'Box',
            SELECTBOX: 'SELECTBOX'
        };

        VIZCore.namespace("VIZCore.Enum.RENDER_MODES");
        VIZCore.Enum.RENDER_MODES = {
            Smooth: 'Smooth',
            Xray: 'Xray',
            WireFrame: 'WireFrame',
            HiddenLine: 'HiddenLine',
            HiddenLineDashed: 'HiddenLineDashed',
            Plastic: 'Plastic',
            GrayScale: 'GrayScale',
            //SmoothEdge: 'SmoothEdge',
            //HiddenLine_Elimination: 'HiddenLine_Elimination',
            Flat: 'Flat',
        };

        VIZCore.namespace("VIZCore.Enum.RENDER_MODES_TEXT");
        VIZCore.Enum.RENDER_MODES_TEXT = {
            Wireframe: '와이어프레임',
            Smooth: '부드러운음영',
            Flat: '거친음영'
        };

        VIZCore.namespace("VIZCore.Enum.EVENT_TYPES");
        VIZCore.Enum.EVENT_TYPES = {
            View: {
                Init: 'View.Init',
                Load_Completed: 'View.Load_Completed',
                Structure_Completed: 'View.Structure_Completed',
                Property_Completed: 'View.Proeprty_Completed',
                Alert_EmptyMeshBlock: 'View.Load_EmptyMeshBlock',
                Load_File_Completed: 'View.Load_File_Completed',
                DrawInfo: 'View.Drawinfo'
            },
            Model: {
                Select: 'Model.Select',
                BoxSelect: 'Model.BoxSelect'
            },
            Data: {
                Selected: 'Data.Selected',
                MultiSelected: 'Data.MultiSelected',
                BoxSelected: 'Data.BoxSelected',
                Deselect_All: 'Data.Deselect_All'
            },
            Toolbar: {
                Show: 'Toolbar.Show',
                Hide: 'Toolbar.Hide'
            },
            Progress: {
                Percentage: 'Progress.Percentage'
            },
            Control: {
                Changed: 'Control.Changed'
            },
            Pivot: {
                DrawRender: 'Pivot.DrawRender'
            },
            Keyboard: {
                Down: 'Keyboard.Down',
                Up: 'Keyboard.Up',
                Press: 'Keyboard.Press'
            },
            Keyboard_SystemKey: {
                Down: 'Keyboard.Down.SystemKey'
            },
            Mouse: {
                Down: 'Mouse.Down',
                Up: 'Mouse.Up',
                Move: 'Mouse.Move',
                Wheel: 'Mouse.Wheel',
                DbClick: 'Mouse.DbClick',
                ContextMenu: 'Mouse.ContextMenu',
            },
            Animation: {
                PlayTime: 'Animation.PlayTime',
                Frame: 'Animation.Frame'
            },
            Review: {
                Selected: 'Review.Selected',
                Click: 'Review.Click',
                ImageClick: 'Review.Image.Click',
                Changed: 'Review.Changed',
            },
            Object: {
                Selected: 'Object.Selected', // 선택 이벤트 통합
            },
            Transform: {
                Changed: 'Transform.Changed',
            },
            Config: {
                Changed: 'Config.Changed'
            }
        };

        VIZCore.namespace("VIZCore.Enum.EXCEPTION_CODE");
        VIZCore.Enum.EXCEPTION_CODE = {
            DOWNLOAD_FAIL: 'DOWNLOAD_FAIL',
            FILE_ERROR: 'FILE_ERROR',
        };

        VIZCore.namespace("VIZCore.Enum.MEASURE_UNIT");
        VIZCore.Enum.MEASURE_UNIT = {
            mm: 'mm',
            cm: 'cm',
            m: 'm',
            inch: 'inch'
        };

        VIZCore.namespace("VIZCore.Enum.ACCUMULATION_UNIT");
        VIZCore.Enum.ACCUMULATION_UNIT = {
            //mm: 0,
            //cm: 1,
            //m: 2,
            //inch: 3
            UNKNOWN: 0,
            MICROMETERS: 1,
            MILLIMETERS: 2,
            CENTIMETERS: 3,
            DECIMETERS: 4,
            METERS: 5,
            KILOMETERS: 6,
            INCHES: 7,
            FEET: 8,
            YARDS: 9,
            MILES: 10,
            MILS: 11
        };

        VIZCore.namespace("VIZCore.Enum.PROGRESS_TYPES");
        VIZCore.Enum.PROGRESS_TYPES = {
            File_Downloading: 0,
            Data_Loading: 1,
            Edge_Loading: 2
        };

        VIZCore.namespace("VIZCore.Enum.VIEW_MODES");
        VIZCore.Enum.VIEW_MODES = {
            PlusX: 0,
            MinusX: 1,
            PlusY: 2,
            MinusY: 3,
            PlusZ: 4,
            MinusZ: 5,
            PlusISO: 6,
            MinusISO: 7,
            CustomView: 8,
            CustomViewMatrix: 9,
            ISORightBackTop: 10            
        };

        VIZCore.namespace("VIZCore.Enum.PROJECTION_MODES");
        VIZCore.Enum.PROJECTION_MODES = {
            Orthographic: 0,
            Perspective: 1
        };

        VIZCore.namespace("VIZCore.Enum.ENTITY_TYPES");
        VIZCore.Enum.ENTITY_TYPES = {
            EntUnknown: 0,
            EntFileHeader: 100,

            EntAssembly: 500,
            EntPart: 501,
            EntCurveBSpline: 502,
            EntSurfNurbs: 503,
            EntRefNode: 504,
            EntSurfGeneric: 505,
            EntInstCurve: 506,
            EntBody: 507,
            EntCurveLine: 508,
            EntCurveCircle: 509,
            EntMeshBlock: 510,
            EntBinaryBlock: 511,
            EntCFLBody: 512,

            EntFolder: 513,
            EntPoint: 514,
            EntPolyline: 515,
            EntCircle: 516,

            BST_STYLING_MODEL: 800,
            BST_DRAWING_MODEL: 900,

            BST_ANALYSIS: 1000,
            BST_INSPECTION: 2000,
            EntEdgeBlock: 3000,
        };

        VIZCore.namespace("VIZCore.Enum.SELECT_UNIT");
        VIZCore.Enum.SELECT_UNIT = {
            Body: 0,
            Part: 1,
            Assembly: 2,
            Level: 3
        };

        VIZCore.namespace("VIZCore.Enum.VISIBLE_UNIT");
        VIZCore.Enum.VISIBLE_UNIT = {
            Body: 0,
            Part: 1,
        };



        VIZCore.namespace("VIZCore.Enum.SelectionObject3DTypes");
        VIZCore.Enum.SelectionObject3DTypes = {
            ALL: 0,
            OPAQUE_OBJECT3D: 1,
            NONE: 2,
            CUSTOMCOLOR_OBJECT3D: 3
        };

        VIZCore.namespace("VIZCore.Enum.ViewUnderControlVisibleMode");
        VIZCore.Enum.ViewUnderControlVisibleMode = {
            SHADED: 0,
            BOUNDBOX: 1,
            NONE: 2
        };

        VIZCore.namespace("VIZCore.Enum.SelectionVisibleMode");
        VIZCore.Enum.SelectionVisibleMode = {
            SHADED: 0,
            BOUNDBOX: 1,
            NONE: 2,
            HIGHLIGHT_SHADED: 3
        };

        VIZCore.namespace("VIZCore.Enum.SelectionModes");
        VIZCore.Enum.SelectionModes = {
            SELECT_ALL: 0,
            INVERT_SELECTION: 1,
            DESELECT_ALL: 2
        };


        VIZCore.namespace("VIZCore.Enum.REVIEW_TYPES");
        VIZCore.Enum.REVIEW_TYPES = {
            NONE: 0,
            RK_MEASURE_POS: 1,
            RK_MEASURE_DISTANCE: 2,
            RK_MEASURE_ANGLE: 3,
            RK_SURFACE_NOTE: 4,
            RK_2D_NOTE: 5,
            RK_3D_NOTE: 6,
            RK_PATH: 7,
            RK_TOOLTIP_NOTE: 8,
            RK_MEASURE_OBJECTMINDISTANCE: 9,
            RK_MEASURE_NORMALDISTANCE: 10,
            RK_MEASURE_HORIZONTALITYDISTANCE: 11,
            RK_MEASURE_ORTHOMINDISTANCE: 12,
            RK_MEASURE_X_AXIS_DISTANCE: 13,
            RK_MEASURE_Y_AXIS_DISTANCE: 14,
            RK_MEASURE_Z_AXIS_DISTANCE: 15,
            RK_MEASURE_XY_AXIS_DISTANCE: 16,
            RK_MEASURE_YZ_AXIS_DISTANCE: 17,
            RK_MEASURE_ZX_AXIS_DISTANCE: 18,
            RK_SKETCH: 19,
            RK_MEASURE_SMART_AXIS_DISTANCE: 20,
            RK_MEASURE_LINKEDAREA: 21,
            RK_MEASURE_SURFACEDISTANCE: 22,
            RK_MEASURE_LINKED_DISTANCE: 23,
            RK_MEASURE_LINKED_AXIS_DISTANCE: 24,
            RK_MEASURE_LINKED_X_AXIS_DISTANCE: 25,
            RK_MEASURE_LINKED_Y_AXIS_DISTANCE: 26,
            RK_MEASURE_LINKED_Z_AXIS_DISTANCE: 27,
            RK_MEASURE_ONE_POINT_FIXED_DISTANCE: 28,
            RK_MEASURE_CUSTOM_AXIS_DISTANCE: 29,
            RK_MEASURE_CYLINDER_PLANE_DISTANCE: 30,
            RK_MEASURE_CYLINDER_CYLINDER_CROSS_POINT: 31,
            RK_MEASURE_NORMAL_PLANE_CROSS_POINT: 32,
            RK_HEADER_NOTE: 33,

            RK_MEASURE_BOUNDBOX: 34,
            RK_MEASURE_PICKITEM: 35,

            RK_SNAPSHOT: 36,

            RK_UTIL_TRANSFORM : 37, 

            RK_CUSTOM: 1000,
            RK_IMAGE_NOTE: 1001
        };

        VIZCore.namespace("VIZCore.Enum.DRAW_TYPES");
        VIZCore.Enum.DRAW_TYPES = {
            NONE: 0,
            RECT: 1,
            CIRCLE: 2,
            TRIANGLE: 3
        };

        VIZCore.namespace("VIZCore.Enum.SKETCH_TYPES");
        VIZCore.Enum.SKETCH_TYPES = {
            NONE: 0,
            FREE: 1,
            LINE: 2,
            RECT: 3,
            CIRCLE: 4,
            TEXT: 5,
        };

        VIZCore.namespace("VIZCore.Enum.MARKUP_FLAG");
        VIZCore.Enum.MARKUP_FLAG = {
            PRESELECT: 0,
            ROTATE: 1,
            ZOOM: 2,
            SURFACE: 3,
            POINT: 4,
            LINE: 5,
            CIRCLE: 6,
            CIRCLE_CENTER: 7,
            AXIS_CENTER: 8,

        };

        VIZCore.namespace("VIZCore.Enum.SCREENBOX_TYPES");
        VIZCore.Enum.SCREENBOX_TYPES = {
            NONE: 0,
            BOXZOOM: 1,
            SELECTBOX: 2
        };

        VIZCore.namespace("VIZCore.Enum.LINE_TYPES");
        VIZCore.Enum.LINE_TYPES = {

            SOLID: 0,
            SHORT_DASHED: 1,

            SOLID_ARROW: 100,
            SHORT_DASHED_ARROW: 101,

            POINT: 500,

            USER: 1000,
            USER_ARROW: 2000,
        };

        VIZCore.namespace("VIZCore.Enum.BROWSER_TYPES");
        VIZCore.Enum.BROWSER_TYPES = {
            Unknown: 0,
            Internet_Explorer: 1,
            Edge: 2,
            Chrome: 3,
            Firefox: 4,
            Safari: 5,
            Opera: 6
        };

        VIZCore.namespace("VIZCore.Enum.PLATFORM_TYPES");
        VIZCore.Enum.PLATFORM_TYPES = {
            PC: 0,
            Mobile: 1
        };

        VIZCore.namespace("VIZCore.Enum.THEMA_TYPES");
        VIZCore.Enum.THEMA_TYPES = {
            Basic: 0,
            Splitter: 1
        };

        VIZCore.namespace("VIZCore.Enum.DRAWING_TYPES");
        VIZCore.Enum.DRAWING_TYPES = {
            NONE: 0,
            FREE: 1,
            LINE: 2,
            QUADRANGLE: 3,
            CIRCLE: 4
        };

        VIZCore.namespace("VIZCore.Enum.PROCESS_TYPES");
        VIZCore.Enum.PROCESS_TYPES = {
            NONE: 0,
            MOVE: 1
        };

        VIZCore.namespace("VIZCore.Enum.SHADER_TYPES");
        VIZCore.Enum.SHADER_TYPES = {
            NONE: -1,

            PHONG: 0,
            PBR: 1,
            PICKING: 2,
            TEXTURE2D: 3,
            BASIC2D: 4,
            FXAA: 5,
            DEPTH: 6,
            EDGE: 7,
            BACKGROUND: 8,
            SKYBOX: 9,
            PREFILTEREDENVIRONMENT: 10,
            PHONGUTIL: 11,
            ANIMATIONPBR: 12,
            FRAMEBUFFERMARGE: 13,
            NORMAL: 14,
            POSITION: 15,
            BLUR: 16,
            SSAO: 17,
            MARGE: 18,
            PREPROCESSING: 19,
            PREPROCESSINGSHADOW: 35,

            TEXTURE2D_SUB: 20,
            BRDF: 21,
            IRRADIANCEENVIRONMENT: 22,
            EQUIRECTANGULARSKYBOX: 23,
            ANIMATIONBASIC2D: 24,
            BASICLINES2D: 25,
            TEXTURE2D_SSAO: 26,

            BASIC2DCOLOR: 27,
            TEXTURE2DCOLOR: 28,

            PERLINNOISE: 29,
            VOLUMETRIC: 30,
            HORIZONCLOUDS: 31,

            OCEAN: 32,
            WORLDY3D: 33,
            BASIC3D: 34,

            BMFONT: 36,
        };

        VIZCore.namespace("VIZCore.Enum.FB_RENDER_TYPES");
        VIZCore.Enum.FB_RENDER_TYPES = {
            MAIN: 0,
            UI: 1,
            PICK: 2,
            DEPTH: 3,
            SELECTED: 4,
            LOD: 5,
            AFTEREFFECT: 6,
            MODELAFTER: 7,
            COLOROBJECT: 8,
            COLORCUSTOMOBJECT: 9,
            AVATAROBJECT: 10,
            PRESELECT: 11,
            CUSTOMAFTEREFFECT: 12,
            CUSTOM_EDGE: 13,
            COLOROBJECTGROUP: 14,

            NORMAL: 50,
            POSITION: 51,
            SSAO: 52,

            PREPROCESSING: 100,
            PREPROCESSING_DISABLE_DEPTH: 101,
            PREPROCESSINGSHADOW: 110,

            CUSTOM: 500,
            CUSTOM2: 501,
            CUSTOM1024: 502,
            CUSTOMSAMPLING: 510,
            END: 1000
        };

        VIZCore.namespace("VIZCore.Enum.TEXTURE_TYPES");
        VIZCore.Enum.TEXTURE_TYPES = {
            NONE: -1,

            ALBEDO: 0,
            ROUGHNESS: 1,
            METALNESS: 2,
            BUMP: 3,
            EMISSIVE: 4,
            DIFFUSE: 5,
            NORMAL: 6,
            SPECLUAR: 7,
            REFLECTION: 8,
            AMBIENT: 9,
            OPACITY: 10
        };

        VIZCore.namespace("VIZCore.Enum.CONTROL_STATE");
        VIZCore.Enum.CONTROL_STATE = {
            NORMAL: 0,
            MARKUP: 1,
            WALKTHROUGH: 2,
            FLY: 3,
            OBJECTTRANSFORM: 4,
            SCREENBOX: 5,
        };

        VIZCore.namespace("VIZCore.Enum.ACTION_STATE");
        VIZCore.Enum.ACTION_STATE = {
            FORWARD: 0,
            BACKWARD: 1,
            LEFT: 2,
            RIGHT: 3,
            UP: 4,
            DOWN: 5,
            TURN_LEFT: 6,
            TURN_RIGHT: 7,
            ZOOM_IN: 8,
            ZOOM_OUT: 9
        };

        VIZCore.namespace("VIZCore.Enum.MOUSE_STATE");
        VIZCore.Enum.MOUSE_STATE = {
            NONE: -1,
            ROTATE: 0,
            ZOOM: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_ZOOM_PAN: 4,
            ORBIT: 5,
            ROTATE_CAMERA: 6,
            MOUSE_ZOOM: 7
        };

        VIZCore.namespace("VIZCore.Enum.MOUSE_CONTROL_SUB_TYPE");
        VIZCore.Enum.MOUSE_CONTROL_SUB_TYPE = {
            NONE: -1,
            ROTATE_FIXEDZ: 100,
            ORBIT: 101,
            ROTATE: 102,
            ROTATE_WFIXEDZ: 103,
            PAN: 104,
            ROTATE_CAMERA: 105,
            SELECT: 105,
            FLY: 106
        };


        VIZCore.namespace("VIZCore.Enum.HANDLER_TYPE");
        VIZCore.Enum.HANDLER_TYPE = {
            NONE: -1,
            MODEL: 0,
            CLIPPING: 1,
            MEASURE: 2
        };

        VIZCore.namespace("VIZCore.Enum.HANDLE_MOUSE_STATE");
        VIZCore.Enum.HANDLE_MOUSE_STATE = {
            NONE: -1,
            OVER: 0,
            DOWN: 1
        };

        VIZCore.namespace("VIZCore.Enum.RENDER_PRIORITY");
        VIZCore.Enum.RENDER_PRIORITY = {
            DISTANCE: 0,
            LOD: 1,
            SHUFFLE: 2
        };

        VIZCore.namespace("VIZCore.Enum.VIEWCUBE_POSITIONS");
        VIZCore.Enum.VIEWCUBE_POSITIONS = {
            LEFT_TOP: 0,
            RIGHT_TOP: 1,
            LEFT_BOTTOM: 2,
            RIGHT_BOTTOM: 3
        };

        VIZCore.namespace("VIZCore.Enum.PRESELECT_EDGE_KIND");
        VIZCore.Enum.PRESELECT_EDGE_KIND = {
            EDGE: 0,
            CIRCLE: 1
        };

        VIZCore.namespace("VIZCore.Enum.PRESELECT_PICK_KIND");
        VIZCore.Enum.PRESELECT_PICK_KIND = {
            NONE: -1,

            EDGE: 0,
            EDGE_START: 1,
            EDGE_END: 2,
            EDGE_MID: 3,
            CIRCLE: 4,
            CIRCLE_CENTER: 5
        };


        VIZCore.namespace("VIZCore.Enum.CONFIG_KEY");
        VIZCore.Enum.CONFIG_KEY = {
            RENDER: {
                PROGRESSIVE: {
                    ENABLE: "Configuration.Render.Progressive.Enable",
                    LIMITCOUNT: "Configuration.Render.Progressive.LimitCount",
                },
                CACHE: {
                    ENABLE: "Configuration.Render.Cache.Enable",
                    LIMITCOUNT: "Configuration.Render.Cache.LimitCount",
                },
                PRIORITY: "Configuration.Render.Priority"
            },
            LOADER: {
                COMPLETEDTIME: {
                    HEADER: 0,
                    STRUCTURE: 1,
                    PROPERTY: 2,
                    MATERIAL: 3,
                    MESH: 4
                },
                MESHLOADINGTIME: {
                    HEADER: 0,
                    STRUCTURE: 1,
                    PROPERTY: 2,
                    MATERIAL: 3,
                }
            }
        };



        VIZCore.namespace("VIZCore.Enum.FileInfoType");
        VIZCore.Enum.FILEINFOTYPE = {
            NONE: 0,
            HEADER: 1,
            STRUCTURE: 2,
            PROPERTY: 3,
            MATERIAL: 4,
            MESH: 5,
            LINE : 6,
            PMI : 7
        };

        VIZCore.namespace("VIZCore.Enum.Axis");
        VIZCore.Enum.Axis = {
            X: 0,
            Y: 1,
            Z: 2
        };

        /**
         * 카메라 방향
         */
        VIZCore.namespace("VIZCore.Enum.CameraDirection");
        VIZCore.Enum.CameraDirection = {
            /**
             * ISO +
             */
            ISO_PLUS: 0,
            /**
             * ISO -
             */
            ISO_MINUS: 1,
            /**
             * X +
             */
            X_PLUS: 2,
            /**
             * X -
             */
            X_MINUS: 3,
            /**
             * Y +
             */
            Y_PLUS: 4,
            /**
             * Y -
             */
            Y_MINUS: 5,
            /**
             * Z +
             */
            Z_PLUS: 6,
            /**
             * Z -
             */
            Z_MINUS: 7
        };

        VIZCore.namespace("VIZCore.Enum.ALIGN");
        VIZCore.Enum.ALIGN = {
            TOP_LEFT: 0,
            TOP_CENTER: 1,
            TOP_RIGHT: 2,
            MIDDLE_LEFT: 3,
            MIDDLE_CENTER: 4,
            MIDDLE_RIGHT: 5,
            BOTTOM_LEFT: 6,
            BOTTOM_CENTER: 7,
            BOTTOM_RIGHT: 8
        };


        VIZCore.namespace("VIZCore.Enum.BackgroundModes");
        VIZCore.Enum.BackgroundModes = {
            COLOR_ONE: 0,
            COLOR_TWO_HOR: 1,
            COLOR_TWO_HOR_REVERSE: 2,
            COLOR_TWO_VER: 3,
            COLOR_TWO_VER_REVERSE: 4,
            COLOR_TWO_CHOR: 5,
            COLOR_TWO_CHOR_REVERSE: 6,
            COLOR_TWO_CVER: 7,
            COLOR_TWO_CVER_REVERSE: 8,
            COLOR_TWO_CENTER: 9,
            COLOR_TWO_CORNER: 10
        };

        VIZCore.namespace("VIZCore.Enum.ANIMATION_PLAY_MODE");
        VIZCore.Enum.ANIMATION_PLAY_MODE = {
            NONE: 0,
            HIDE_ALL: 1,
            HIDE_TARGET: 2,
            HIDE_END: 3 // 종료 숨김
        };


        VIZCore.namespace("VIZCore.Enum.AngleFormat");
        VIZCore.Enum.AngleFormat = {
            RADIAN: 0,
            DEGREE: 1
        };



        VIZCore.namespace("VIZCore.Enum.LightKind");
        VIZCore.Enum.LightKind = {
            Directional: 0,
            Point: 1
        };

        VIZCore.namespace("VIZCore.Enum.DOWNLOAD_API");
        VIZCore.Enum.DOWNLOAD_API = {
            Fetch: 0,
            XHR: 1,
            Jquery: 2
        };



    }
}

export default Enum;
