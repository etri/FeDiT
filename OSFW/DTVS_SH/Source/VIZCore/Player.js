/**
 * VIZCore Animation Player 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} element HTML Element
 * @param {Object} view VIZWide3D Instance
 * @param {Object} VIZCore VIZCore Instance
 * @class
 */
 class Player {
    /**
     * Toolbar 생성
     * @param {Object} view HTML Element
     * @param {Object} vizwide3d VIZWide3D Instance
     * @param {Object} VIZCore VIZCore Instance
     * @example
     * let view = document.getElementById("view");
     * let player = new vizwide3d.Player(view, vizwide3d, VIZCore);
     */
    constructor(element, view, VIZCore) {
        let scope = this;

        // ElementID 관리
        this.ElementID = {
            Parent : undefined,
            Container : undefined,
            Back : undefined,
            Next : undefined,
            Play : undefined,
            Stop : undefined,
            Pause : undefined,
            Range : undefined,
            Text : undefined,
            StartDate : undefined,
            EndDate : undefined,
            Bar : undefined,
            Duration : undefined
        };
        // Element 관리
        this.Element = new Map();

        // 연동 함수 관리
        this.Function = {
            SetDuration : undefined,
            GetPlayTime : undefined,
            SetPlayTime : undefined,
            Play : undefined,
            Stop : undefined,
            Pause : undefined,
        };

        // Element 반환
        function getElement(elementID){
            return scope.Element.get(elementID);
        }
        this.Visible = false;

        this.Visible_DateTime = false;

        // 애니메이션 프레임 이동 Offset
        let offsetTick = 1000;

        // GUID 생성
        function guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // element id 생성
        function shguid(){
            return "vizwide3D_" + guid();
        }

        // Display Time 계산
        function displayTime(ticksInSecs) {
            let ticks = ticksInSecs;
            if (isNaN(ticks))
                ticks = 0;

            let hh = Math.floor(ticks / 3600);
            let mm = Math.floor((ticks % 3600) / 60);
            let ss = ticks % 60;
            ss = Math.floor(ss);

            return pad(hh, 2) + ":" + pad(mm, 2) + ":" + pad(ss, 2);
        }

        // Display Time 수정
        function pad(n, width) {
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
        }

        // Animation 전체 재생 시간 변경 이벤트
        function onChangedAnimationTime(e)
        {
            //console.log("Animation Changed ::", e);
            let element = getElement(scope.ElementID.Range);
            element.max = e.data;// / 1000;
        }

        // Animation 재생 시간 이벤트
        function onChangedFrameEvent(e)
        {
            //console.log("Animation Frame ::", e);
            let input = getElement(scope.ElementID.Range); 
            input.value = e.data.CurrentTime;
            
            let label_time = getElement(scope.ElementID.Text);
            label_time.innerHTML = e.data.DateString;//displayTime(e.data.CurrentTime / 1000);
            let ratio = (e.data.CurrentTime / e.data.TotalTime);

            //let bar = getElement(scope.ElementID.Bar);
            //console.log(bar.clientWidth);

            // let left = (bar.clientWidth - 28 ) * ratio;
            // let labelWidth = label_time.clientWidth;
            
            // if(left < labelWidth / 2)
            //     left = 0;

            // if((left + labelWidth) < bar.clientWidth)
            //     label_time.style.left = left + 'px';
            

            let label_startdate = getElement(scope.ElementID.StartDate);
            label_startdate.innerHTML = e.data.StartDate;

            let label_enddate = getElement(scope.ElementID.EndDate);
            label_enddate.innerHTML = e.data.EndDate;

            let txt_duration = getElement(scope.ElementID.Duration);
            txt_duration.value = e.data.Duration;

            offsetTick = e.data.Duration * 1000;
        }

        // UI 초기화
        function init() {
            // Animation Event
            view.Animation.OnChangedPlayTimeEvent(onChangedAnimationTime);
            view.Animation.OnChangedFrameEvent(onChangedFrameEvent);

            // Parent Element 관리
            scope.ElementID.Parent = element.id;
            scope.Element.set(element.id, element);

            let div_player = document.createElement('div');
            div_player.id = shguid();
            div_player.className = "player";
            getElement(scope.ElementID.Parent).appendChild(div_player);

            // player Element 관리
            scope.ElementID.Container = div_player.id;
            scope.Element.set(scope.ElementID.Container, div_player);
            show(scope.Visible);

            let div_player_control = document.createElement('div');
            div_player_control.id = shguid();
            div_player_control.className = "player_control";
            div_player.appendChild(div_player_control);

            let div_player_control_menu = document.createElement('div');
            div_player_control_menu.id = shguid();
            div_player_control_menu.className = "player_control_menu";
            div_player_control.appendChild(div_player_control_menu);

            let div_player_control_bar = document.createElement('div');
            div_player_control_bar.id = shguid();
            div_player_control_bar.className = "player_control_bar";

            let txtDuration = document.createElement('input');
            txtDuration.type = "text";
            txtDuration.id = shguid();
            txtDuration.style.top = 6 + "px";
            txtDuration.style.left = -32 + "px";
            txtDuration.style.position = "absolute";
            txtDuration.style.width = '20px';
            txtDuration.style.borderColor = 'rgba(54, 175, 184, 1)';
            txtDuration.value = 7;
            
            div_player_control_bar.appendChild(txtDuration);
            scope.ElementID.Duration = txtDuration.id;
            scope.Element.set(scope.ElementID.Duration, txtDuration);

            let input_player_cb = document.createElement('input');
            input_player_cb.id = shguid();
            input_player_cb.type = "range";
            input_player_cb.className = "player_cb_input";
            input_player_cb.min = 0;
            input_player_cb.max = 28800;
            input_player_cb.value = 0;

            scope.ElementID.Range = input_player_cb.id;
            scope.Element.set(scope.ElementID.Range, input_player_cb);

            div_player_control_bar.appendChild(input_player_cb);
            div_player_control.appendChild(div_player_control_bar);

            scope.ElementID.Bar = div_player_control_bar.id;
            scope.Element.set(scope.ElementID.Bar, div_player_control_bar);

            let div_player_time = document.createElement('div');
            div_player_time.id = shguid();
            div_player_time.className = "player_control_text";
            div_player_control.appendChild(div_player_time);
            let label_time = document.createElement('label');
            label_time.id = shguid();
            //label_time.innerHTML = "00:00:00";
            label_time.innerHTML = "";
            div_player_time.appendChild(label_time);
            scope.ElementID.Text = div_player_time.id;
            scope.Element.set(scope.ElementID.Text, div_player_time);

            let div_player_enddate = document.createElement('div');
            div_player_enddate.id = shguid();
            div_player_enddate.className = "player_control_enddate";
            div_player_control.appendChild(div_player_enddate);
            let label_enddate = document.createElement('label');
            label_enddate.id = shguid();
            label_enddate.innerHTML = "";
            div_player_enddate.appendChild(label_enddate);
            scope.ElementID.EndDate = div_player_enddate.id;
            scope.Element.set(scope.ElementID.EndDate, div_player_enddate);

            let div_player_startdate = document.createElement('div');
            div_player_startdate.id = shguid();
            div_player_startdate.className = "player_control_startdate";
            div_player_control.appendChild(div_player_startdate);
            let label_startdate = document.createElement('label');
            label_startdate.id = shguid();
            label_startdate.innerHTML = "";
            div_player_startdate.appendChild(label_startdate);
            scope.ElementID.StartDate = div_player_startdate.id;
            scope.Element.set(scope.ElementID.StartDate, div_player_startdate);
            

            let div_player_cm_box = document.createElement('div');
            div_player_cm_box.id = shguid();
            div_player_cm_box.className = "player_cm_box";
            div_player_control_menu.appendChild(div_player_cm_box);

            let div_player_back = document.createElement('div');
            div_player_back.id = shguid();
            div_player_back.className = "player_cm_button";
            div_player_back.innerHTML = "<img id=\"ui_player_back_img\" alt = \"back\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAA40lEQVRYhe2UzwnCMBxGn+IAdQPdQC856ynHuIIb6AY6gW5QV8gxt55zcQQ7QkeQQIQikthULUgeBEr//L7XLxAymUzmbxHarNyK/d8k9FBoMwOuQOFvNVbJ6RvflMAjfBR6fxwRnLXCebp+FX4Abq3wKMEG3sVXXXrhTvQSENoUPniTOiO2BaHwna87OdyR1IDQ5gTs+gQ/SG7gUyQJWCX3gFtNX4/kBqySZ2AOXAYR8BLuYNoCa6D+uUBLpLJKujaOXbclJlA/DQwOt0q6k3AJVF0kvoLQZuHW4CKZTCYTBLgD9M0zdBwgywgAAAAASUVORK5CYII=\" >";
            div_player_cm_box.appendChild(div_player_back);
            scope.ElementID.Back = div_player_back.id;
            scope.Element.set(scope.ElementID.Back, div_player_back);

            let div_player_play = document.createElement('div');
            div_player_play.id = shguid();
            div_player_play.className = "player_cm_button";
            div_player_play.innerHTML = "<img id=\"ui_player_play_img\" alt = \"play\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAA4klEQVRYhe2VsQ3CMBBFH4gBGAE2oHKdzmUYAUZgAmACskGyAbh0Reo0sAGwASOgk2yJLglxkgK/2tZ/vjv5iEQif8+kSQGUsXPgBLyArEr1O1Thpg3PrYANsAduytjN0ALfLIBcGXtVxiZjCHgkXCRy16LBBTzSjocy9jCWgCAV2CtjRWQ9hoBH5uPs5mMxhoAncW2plehLwFM7nH0JlMCySvW97uAscPAT2FapLpteCCUgX/OxSnXW9mIIgQLY/bofugiULri2z6EFni740iW4rYC8MnPruAi5jiORyJ8DfABboT1XtqNSaAAAAABJRU5ErkJggg==\" >";
            div_player_cm_box.appendChild(div_player_play);
            scope.ElementID.Play = div_player_play.id;
            scope.Element.set(scope.ElementID.Play, div_player_play);

            let div_player_pause = document.createElement('div');
            div_player_pause.id = shguid();
            div_player_pause.className = "player_cm_button";
            div_player_pause.innerHTML = "<img id=\"ui_player_pause_img\" alt = \"pause\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAlElEQVRYhe2VsQ2DMBBFX6IMQDYgG0DjFSiZ1aVXoAkbhBEYAUVyJMtJxG8QzX/V+b7ke9UdxhhzNhd1foipAbqiNU/jsO5le9zE4S3wBJqi/R5wz/WrzkJMD0XiqggAbTWA6v0r6xBQBQ7DAhawgAVUgSWv3pL1T03OZuVj6RZM47CEmPq8kkupD1+ZeoyMMeZcgA1ImiJCKN1orQAAAABJRU5ErkJggg==\" >";
            div_player_cm_box.appendChild(div_player_pause);
            scope.ElementID.Pause = div_player_pause.id;
            scope.Element.set(scope.ElementID.Pause, div_player_pause);

            let div_player_stop = document.createElement('div');
            div_player_stop.id = shguid();
            div_player_stop.className = "player_cm_button";
            div_player_stop.innerHTML = "<img id=\"ui_player_stop_img\" alt = \"stop\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAATklEQVRYhe3RsREAEBBE0aUCmtGCUK1CLWiGErRwF1zkv3hn/DkCgO8l6wHaXEdSMc7vHr1ahtnxA9bHXVtPQAgCCCCAAE/ADdoCwM8kPS0EBxia1o9kAAAAAElFTkSuQmCC\" >";
            div_player_cm_box.appendChild(div_player_stop);
            scope.ElementID.Stop = div_player_stop.id;
            scope.Element.set(scope.ElementID.Stop, div_player_stop);

            let div_player_next = document.createElement('div');
            div_player_next.id = shguid();
            div_player_next.className = "player_cm_button";
            div_player_next.innerHTML = "<img id=\"ui_player_next_img\" alt = \"next\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAA4klEQVRYhe2UwQ3CMAxFDWKAsgFswMlnbjmGERgBJoANKiaAEfDRJzjnAhuUEToCipRKOZRGdYrag58UyUlj+8dWDYqiKJMHibd+/UvnrOsjEq8AoArbOwAcnTWfjvtFuF+Eo9pZs+zKMU8IXEX2DgBeSHxO+BQ/bJGAtuAnJK7a2uKsqXvG6y2gwVfmgcTXUHYxUgENe99zJD6MJQBCW0okLscSkMVigBh1+D1vEufcCvika2lyj7QC7/DqpzSxVIAv98VZkxpGgwmIB0tyFEc+RWTngcQbv7IDKYqiTBIA+AJC2DtNZ/4VpAAAAABJRU5ErkJggg==\" >";
            div_player_cm_box.appendChild(div_player_next);
            scope.ElementID.Next = div_player_next.id;
            scope.Element.set(scope.ElementID.Next, div_player_next);
            scope.div_player = div_player;
            
            //div_player.addEventListener('mousedown', mousedown, false);

            //scope.ShowPlayTime(false);


            // 버튼 링크 함수 설정
            scope.Function.SetDuration = view.Animation.SetDuration,
            scope.Function.GetPlayTime = view.Animation.GetPlayTime,
            scope.Function.SetPlayTime = view.Animation.SetPlayTime,
            scope.Function.Play = view.Animation.Start,
            scope.Function.Stop = view.Animation.Stop,
            scope.Function.Pause = view.Animation.Pause,
            


            // Event
            getElement(scope.ElementID.Duration).addEventListener("change", function () {
                let element = getElement(scope.ElementID.Duration);
                let duration = element.value * 1;
                //view.Animation.SetDuration(duration);
                scope.Function.SetDuration(duration);
                
            });

            getElement(scope.ElementID.Back).addEventListener("click", function () {
                //console.log('scope.ElementID.Back');
                back();
            });

            getElement(scope.ElementID.Next).addEventListener("click", function () {
                //console.log('scope.ElementID.Next');
                next();
            });

            getElement(scope.ElementID.Play).addEventListener("click", function () {
                //console.log('scope.ElementID.Play');
                play();
            });

            getElement(scope.ElementID.Stop).addEventListener("click", function () {
                //console.log('scope.ElementID.Stop');
                stop();
            });

            getElement(scope.ElementID.Pause).addEventListener("click", function () {
                console.log('scope.ElementID.Pause');
                pause();
            });

            getElement(scope.ElementID.Range).addEventListener("change", function () {
                //console.log('scope.ElementID.Range');
                change();
            });
        }

        // 재생 시작
        function play(){
            //view.Animation.Start();
            scope.Function.Play();
        }
        // Back
        function back(){
            //let tick = view.Animation.GetPlayTime();
            let tick = scope.Function.GetPlayTime();
            tick -= offsetTick;
            if (tick < 0)
                tick = 0;
            //view.Animation.SetPlayTime(tick);
            scope.Function.SetPlayTime(tick);
        }
        // Stop
        function stop(){
            //view.Animation.SetPlayTime(0);
            //view.Animation.Stop();
            scope.Function.SetPlayTime(0);
            scope.Function.Stop();
        }
        // Pause
        function pause(){
            //view.Animation.Pause();
            scope.Function.Pause();
        }
        // next
        function next(){
            //let tick = view.Animation.GetPlayTime();
            let tick = scope.Function.GetPlayTime();
            tick += offsetTick;
            if (tick > 28800000)
                tick = 28800000;
            //view.Animation.SetPlayTime(tick);
            scope.Function.SetPlayTime(tick);
        }
        // range 변경
        function change(){
            let tick = getElement(scope.ElementID.Range).value;
            //view.Animation.Pause();
            scope.Function.Pause();
            //view.Animation.SetPlayTime(tick);
            scope.Function.SetPlayTime(tick);
        }

        // 보이기/숨기기
        function show(visible){
            scope.Visible = visible;

            let element = getElement(scope.ElementID.Container);
            if (visible == true) {
                element.style.display = "block";
            }
            else {
                element.style.display = "none";
            }
        }

        /**
         * Animation Player 보이기/숨기기
         * @param {Boolean} visible : 패널 보이기/숨기기
         * @example
         * let player = new vizwide3d.Player(view, vizwide3d, VIZCore);
         * player.Show(true);
         */
        this.Show = function (visible) {
            show(visible);
        };

        /**
         * Animation Play Date 보이기/숨기기
         * @param {Boolean} visible : 재생 날짜 보이기/숨기기
         * @example
         * let player = new vizwide3d.Player(view, vizwide3d, VIZCore);
         * player.ShowPlayTime(false);
         */
        this.ShowPlayTime = function(visible){
            scope.Visible_DateTime = visible;

            let element = getElement(scope.ElementID.Text);
            if (visible == true) {
                element.style.display = "block";
            }
            else {
                element.style.display = "none";
            }
        };

        init();
    }
}

export default Player;