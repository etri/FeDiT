# DTVS
3차원 디지털 연합트윈 서비스 표출 기술 개발
- 디지털 연합트윈 3차원 시각화 엔진
- 브라우저 내에서 3D 모델을 시각화하고 상호작용할 수 있는 클라이언트 기반 JavaScript 애플리케이션입니다.
- 모든 주요 데스크탑 및 모바일 플랫폼에서 HTML5를 지원하는 모든 주요 브라우저에서 작동합니다.
- 웹 브라우저 내에서 CAD 모델을 조회하고 상호작용할 수 있는 무설치(Zero-Install) 클라이언트 측 구성 요소입니다.
- 변환된 HMF 파일에 포함된 3D 형상의 지오메트리 데이터는 클라이언트의 웹 브라우저로 모두 전송되어 WebGL을 통해 렌더링되며, 사용자의 상호작용 처리 성능이 향상됩니다.
# GetStart
JS(JavaScript)에서 구성하기
- 기본 제공되는 index.html 파일에 대한 설명입니다.
1.  main.js에 시각화 엔진 초기화 코드가 작성되어 있습니다.
```javascript
require({
    baseUrl: '.',
    paths: {
        VIZWeb3D: 'VIZWeb3D',
    }
}, [
        'VIZWeb3D/Softhills'
        ],
    function (Softhills) {


        var ViewContainer = document.getElementById("VIZWeb3D");
        if (ViewContainer) {
            SOFTHILLS = new Softhills(ViewContainer);

            // Event
            SOFTHILLS.VIZCore.View.EventHandler.addEventListener(EVENT_TYPES.View.Init, onInitEvent);
            SOFTHILLS.VIZCore.View.EventHandler.addEventListener(EVENT_TYPES.Model.Select, onSelectEvent);
            SOFTHILLS.VIZCore.View.EventHandler.addEventListener(EVENT_TYPES.Progress.Percentage,
                function (event) {
                    var str = '';
                    if (event.data.type === PROGRESS_TYPES.File_Downloading)
                        str = 'File Downloading : ';
                    else if (event.data.type === PROGRESS_TYPES.Data_Loading)
                        str = 'Data Loading : ';
                    else
                        str = 'Edge Loading : ';

                    console.log("Progress : " + str + " value : " + event.data.value);
                });
            SOFTHILLS.VIZCore.View.EventHandler.addEventListener(EVENT_TYPES.Keyboard.Down,
                function (event) {
                    console.log("KeyDown : Key : " + event.data.key + " ctrl : " + event.data.ctrl + " alt : " + event.data.alt + " shift : " + event.data.shift);

                    if (event.data.key === 'A'.charCodeAt(0)) {
                        SOFTHILLS.VIZCore.View.Control.Camera.InitPos();
                    }
                    else if (event.data.key === 27) {
                        SOFTHILLS.VIZCore.View.ClearMode();
                    }
                });
            SOFTHILLS.VIZCore.View.EventHandler.addEventListener(EVENT_TYPES.View.Loading_Complete,
                function (event) {
                    console.log("Loading Complete");
                    //SOFTHILLS.VIZCore.View.Control.Model.RenderMode = RENDER_MODES.SmoothEdge;

                    // 조명 방향 설정
                    SOFTHILLS.VIZCore.View.Control.Light.SetDirection(0.0, -0.1, 1.0);
                    // 조명 강도 설정
                    SOFTHILLS.VIZCore.View.Control.Light.SetShininess(0.5);
                });

            // Initialize
            SOFTHILLS.Init();
        }
    }
);
```

2. 구성된 Html 페이지를 Web Server에서 동작 합니다.
<img width="701" alt="image" src="https://github.com/user-attachments/assets/3eb26816-2091-46f7-874b-5255300ca33f">

# Funding
This work was supported by Institute of Information & communications Technology Planning & Evaluation (IITP) grant funded by the Korea government (MSIT) (No.2022-0-00431, Development of open service platform and creation technology of federated intelligent digital twin, 100%).
