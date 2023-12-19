class Configuration {
    constructor(VIZCore) {
        let scope = this;
        this.AUTHORITY_PARAMS = {
            Data: 'http://127.0.0.1:8901', // HTTP
            // 라이선스 서버 라우팅
            RoutingFilters : [ 
                // { 
                //     Data: 'http://softhills.net', 
                //     Hosts : [ 
                //         'http://127.0.0.1:8901'
                //     ] 
                // }, 
            ]
        };
        this.Default = {
            Path : './', // VIZCore Path
            //Path : '/js/VIZWide3D/', // Sample
            Root : './',
            UseImagePath : false,
            WebAssembly : true,
            EncodeURI : {
				Enable : true, // Encode 사용 여부
				Path : false // Path Encode 사용 여부("/" -> "%2F")
			},
            File : {
                EnableCache : false, // Download파일 새로 요청
                RequestParam : "?/&version=",
                // DownloadAPI : VIZCore.Enum.DOWNLOAD_API.Fetch // Download API 설정
            }
        };
        this.Render = {
            // 화면 조작시 가시화 정보 조정
            Progressive: {
                Enable: true,
                // Rendering Objects Count
                LimitCount: 1500,
                UseLimitCount : true,
                Percentage : 15
            },

            // Object Cache
            Cache: {
                Enable: true,
                // Triangles Count
                LimitCount: 20000000//200000000//50000000
            },

            // Loading Priority
            // LOD, DISTANCE, SHUFFLE(LOD + DISTANCE)
            //Priority: VIZCore.Enum.RENDER_PRIORITY.DISTANCE,
            //Priority: VIZCore.Enum.RENDER_PRIORITY.LOD,
            Priority: VIZCore.Enum.RENDER_PRIORITY.SHUFFLE,

            // Download Thread Count
            // DEFAULT (1), High-Performance(1 < Value)
            DownloadThreadCount: 1,

            DownloadTime : 1,

            // 좌표축
            CoordinateAxis : {
                Visible : true,
                Position : {
                    Horizontal : 0.05, // 0 ~ 1 : 화면 기준 비율
                    Vertical : 0.95, // 0 ~ 1 : 화면 기준 비율
                },
                Length : 0.020 // 화면 넓이 기준 비율
                
            },
            // 3D 방향계
            Compass3D : {
                Visible : false
            },
            // 2D 방향계
            Compass2D : {
                Visible : false,
                Position : {
                    Horizontal : 0.021, // 0 ~ 1 : 화면 기준 비율
                    Vertical : 0.75, // 0 ~ 1 : 화면 기준 비율
                },
                Length : 0.06, // 화면 넓이 기준 비율
                Direction : new VIZCore.Vector3(0.0,1.0,0.0) // 진북 방향 설정
            },

            Pivot : {
                Visible : true,
                Color : new VIZCore.Color(255, 0, 0, 255),
                GuideLine : {
                    Enable : true,
                    Alpha : 25,     // 0 ~ 255
                    Thickness : 1.5
                }
            },

            Background : {
               Mode : VIZCore.Enum.BackgroundModes.COLOR_TWO_HOR_REVERSE, //VIZCore.Enum.BackgroundModes.COLOR_TWO_HOR_REVERSE,
               OneColor : new VIZCore.Color(203, 213, 224, 255),
               TwoColor : new VIZCore.Color(255, 255, 255, 255)
            },

            Edge : {
                Color : new VIZCore.Color(0, 0, 0, 200),

                CustomColor : new VIZCore.Color(0, 0, 0, 255),
                HiddenColor : new VIZCore.Color(0, 0, 0, 50),

                Thickness : 0.2 // 0.1 ~ 1.0
            },

            CustomEdge : {
                Color : new VIZCore.Color(0, 0, 0, 255),
                Thickness : 1.0
            },

            GroupEdge : {
                Color : new VIZCore.Color(0, 0, 0, 255),
                Thickness : 0.3 // 0.2 ~ 1.0
            },
        };

        this.Tree = {
            Use : true,
            Visible: false,
            //Unit : VIZCore.Enum.VISIBLE_UNIT.Part,
            Unit: VIZCore.Enum.VISIBLE_UNIT.Body,
            Event : {
                DoubleClick : true
            },
            Icon : {
                Offset : 16
            },
            Style : {
                Font : {
                    Face: "Arial", // 글꼴
                    Size: 12, // 크기
                    Color: new VIZCore.Color(23, 72, 76, 255) // 색상
                }
            },
            Option : {
                Size:{  //Tree Panel 넓이, 높이 
                    Width : undefined,
                    Height: undefined,
                },
                BgTransparency :{   //Tree Panel 배경 투명도 사용, 투명도 조절
                    Use : false,
                    Value : undefined,
                }
              
            }
            
        };

        this.Toolbar = {
            Visible: false
        };

        this.Model = {
            Selection: {
                Color: new VIZCore.Color(255, 0, 0, 255),
                //Color: new VIZCore.Color(0, 200, 0, 100),
                
                LineColor : new VIZCore.Color(0, 255, 0, 255),
                Thickness : 1.0,
           
                // Body, Part, Assembly, LEVEL
                Unit: VIZCore.Enum.SELECT_UNIT.Body,
                //Unit: VIZCore.Enum.SELECT_UNIT.Part,
                //Unit: VIZCore.Enum.SELECT_UNIT.Assembly,
                //Unit: VIZCore.Enum.SELECT_UNIT.Level,
                Level: 2,
                // All, Opacity-Object
                Kind: VIZCore.Enum.SelectionObject3DTypes.ALL,
                //Kind: VIZCore.Enum.SelectionObject3DTypes.OPAQUE_OBJECT3D,
                //Kind: VIZCore.Enum.SelectionObject3DTypes.CUSTOMCOLOR_OBJECT3D,
                //Kind: VIZCore.Enum.SelectionObject3DTypes.NONE,

                // shaded, Boundbox
                Mode: VIZCore.Enum.SelectionVisibleMode.SHADED,
                //Mode: VIZCore.Enum.SelectionVisibleMode.HIGHLIGHT_SHADED,
                //Mode: VIZCore.Enum.SelectionVisibleMode.BOUNDBOX,
                //Mode: VIZCore.Enum.SelectionVisibleMode.NONE,
                
                Width: 1.5

            },

        };

        this.Property = {
            Use : true,
            NavigateToParentNode: true, //Search parent node properties.
            UseArrayBuffer : true,
            UseTree : true,
        };

        this.Loader = {
            MeshLoadingTime: VIZCore.Enum.CONFIG_KEY.LOADER.MESHLOADINGTIME.HEADER, // 완료 시점 이후 형상 로딩 HEADER, STRUCTURE, PROPERTY, MESH
            LoadingCompletedTime: VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.STRUCTURE, //VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH, STRUCTURE
            //LoadingCompletedTime: VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH//VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH, STRUCTURE
            CompletedEventClear : true  // 모델 다운로드 이벤트 초기화 여부
        };

        this.Control = {
            // 마우스 이벤트의 카메라 화면 제어 잠금
            Lock : false, 
            // 회전 각도 %
            RotateFactor : 65, // 1 ~ 100 : 낮을수록 느리게 반응
            RotateScreenRate : true,    //카메라 회전 비율에 따른 속도활성화

            // Use auto fit when double-clicking the mouse
            UseAutoFit : true,
            FitMargineRate : 0.1,
            InitFitAll : false, // true : 형상 로딩 완료시 화면에 맞춤 , false : 카메라의 위치를 조정 하거나 기본 카메라 사용

            Version : 1, // 0 : 기본, 1 : CUSTOM 1, 2 : CATIA
            Fly : {
                MovementSpeed : 4.0, // Unit : M
                AroundSpeed : 15.0 // Unit : 각도
            },
            Zoom : {
                UseFixed : false,
                Ratio : 0.15, // 0.0 ~ 1.0,
                MinZoomValue : 1.0, // 0.1 ~ 1.0 비율 기준 확대 값 : 낮을수록 근거리에서의 확대 값이 낮아짐
            },
            Update : false, // 마우스 핸들링 시 UI 업데이트

            

        };

        this.ContextMenu = {
            Use : true // false 일경우 마우스 우측 버튼 Pan 기능 동작
        };

        this.Camera = {
            UsePerspectiveScreenFit : false // 원근뷰 Fit All 기능시 화면 비율 적용
        };

        this.Event = {
            EnableCameraChanged : false, // 많이 발생하는 이벤트 제어
            EnableReviewSelectedPosition : true, // 리뷰 선택시 위치 정보 반환
        };

        this.Markup = {
            LineColor : new VIZCore.Color(0, 0, 255, 255),
            LineWidth : 3
        };

        this.Frame = {
            LineColor : new VIZCore.Color(150, 150, 150, 255),
            SplitLineColor : new VIZCore.Color(255, 0, 0, 255),
        };

        this.Walkthrough = {
            Panel : {
                Visible : false
            },
            Position : {
                Visible : true
            }
        };

        this.Section = {
            Style: {
                Color: new VIZCore.Color(255, 255, 255, 1),   
                LineColor: new VIZCore.Color(255, 255, 255, 255)
            },
        };

        this.ViewCube = {
            Language : VIZCore.Enum.LANGUAGE_KEY.KOREAN // VIZCore.Enum.LANGUAGE_KEY.ENGLISH
        };
        
    }
}

export default Configuration;