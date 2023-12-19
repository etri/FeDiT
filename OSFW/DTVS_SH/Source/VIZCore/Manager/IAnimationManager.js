/**
 * VIZCore Animation 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Animation {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * Animation 초기화
         * @example
         * vizwide3d.Animation.Init();
         */
        this.Init = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
            
            scope.Main.Animation.InitAnimation();
        }

        /**
         * Animation 시작
         * @example
         * vizwide3d.Animation.Start();
         */
        this.Start = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.StartAnimation();
        };

        // this.Play = function(){
        //     scope.Main.Animation.Play();
        // };

        /**
         * 
         * @param {Array} ids : Body IDs(Array or Number)
         * @param {Number} time : 시작 시간
         * @param {Number} duration : 재생 시간
         * @param {VIZCore.Color} color_start : 시작 색상
         * @param {VIZCore.Color} color_end : 종료 색상
         * @example
         * // 애니메이션 초기화
         * vizwide3d.Animation.Init();
         * // 애니메이션 시작일 지정
         * vizwide3d.Animation.SetStartDate(new Date(2022,7,9), 1);
         * // 애니메이션 추가
         * vizwide3d.Animation.AddAnimationItem([2],0,2,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
         * vizwide3d.Animation.AddAnimationItem(3,1,3,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
         * vizwide3d.Animation.AddAnimationItem(17,2,1,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
         * vizwide3d.Animation.AddAnimationItem(24,3,4,new VIZCore.Color(255,0,0,255),new VIZCore.Color(0,255,0,255));
         */
        this.AddAnimationItem = function(ids, time, duration, color_start, color_end){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.AddAnimationItem(ids, time, duration, color_start, color_end);
        };

        /**
         * Animation 재생 시간 반환
         * @returns Number
         * @example
         * let time = vizwide3d.Animation.GetPlayTime();
         */
        this.GetPlayTime = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return undefined;

            return scope.Main.Animation.GetPlayTime();
        };  

        /**
         * Animation 재생 시간 설정
         * @param {Number} tick : Animation 재생 시간
         */
        this.SetPlayTime = function(tick){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.SetPlayTime(tick);
        };

        /**
         * Animation 재생 상태 확인
         * @return {Boolean} 재생 상태
         * @example
         * let play = vizwide3d.Animation.IsAnimationPlay();
         */
        this.IsAnimationPlay = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            return scope.Main.Animation.IsAnimationPlay();
        };

        /**
         * Animation 이벤트 발생 시간 설정
         * @param {Number} val : 이벤트 발생 시간(ms)
         * @example
         * // 이벤트 발생시간 3초 설정
         * vizwide3d.Animation.SetEventInterval(3000);
         */
        this.SetEventInterval = function(val){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.SetEventInterval(val);
        };

        /**
         * Animation 재생 시 자동 색상 복원 설정
         * @param {Boolean} enable : 활성화/비활성화
         * @example
         * // 자동 색상 복원 설정
         * vizwide3d.Animation.SetRestoreStatus(true);
         */
        this.SetRestoreStatus = function(enable){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.SetRestoreStatus(enable);
        };

        

        /**
         * Animation 시작일 지정
         * @param {Date} date : 시작일
         * @param {Number} offset : 재생시간(1초)에 따른 Date 변화량(Day)
         * @example
         * // 시작일 2022-08-09
         * // 1초 재생시간 기준 1 Day 변화
         * vizwide3d.Animation.SetStartDate(new Date(2022,7,9), 1);
         */
        this.SetStartDate = function(date, offset){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.SetStartDate(date, offset);
        };

        this.SetDuration = function(offset){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.SetDuration(offset);
        };

        /**
         * 애니메이션 정지
         * @example
         * vizwide3d.Animation.StopAnimation();
         */
        this.Stop = function () {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.StopAnimation();
        };

        /**
         * 애니메이션 일시 정지
         * @example
         * vizwide3d.Animation.PauseAnimation();
         */
        this.Pause = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
            
            scope.Main.Animation.PauseAnimation();
        };

        /**
         * 애니메이션 이벤트 제어
         * 활성화 시 이벤트 발생
         * @param {Boolean} enable : 활성화/비활성화
         * @example
         * vizwide3d.Animation.EnableEvent(true);
         */
        this.EnableEvent = function(enable){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.EnableEvent(enable);
        };

        /**
         * 노트 애니메이션 초기화(삭제)
         * @example
         * vizwide3d.Animation.ClearNoteAnimation();
         */
        this.ClearNoteAnimation = function () {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            for (let i = 0; i < scope.Main.Data.Reviews.length; i++) {
                scope.Main.Data.Reviews[i].action = undefined;
            }
        };

        /**
         * 노트 애니메이션 키 등록
         * @example
         * let text = [];
         * text.push('3D Note 1');
         * text.push('3D Note 2');
         *
         * let position = new VIZCore.Vector3(1000, 2000, 3000);
         *
         * let fontColor = new VIZCore.Color(0, 56, 101, 255); // R, G, B, A
         * let borderColor = new VIZCore.Color(41, 143, 194, 255); // R, G, B, A
         * let backgroundColor = new VIZCore.Color(255, 255, 255, 200); // R, G, B, A
         *
         * let noteID = vizwide3d.Review.Note.AddCustomNote3D(
         *      text
         *      , position
         *      , 10
         *      , fontColor
         *      , borderColor
         *      , backgroundColor
         *  );
         *
         *  let noteIDs = [];
         *  noteIDs.push(noteID);
         *
         *  vizwide3d.Animation.AddNoteAnimation2DTemplate(
         *      "ANIMATION1"                     // Animation Key
         *      , noteIDs                        // Note ID Array
         *      , 0                              // Action Kind
         *      , 1000                           // Duration (ms.)
         *      , new VIZCore.Vector3(0.3, 0, 0) // 시작 위치 ( -1 ~ +1 )
         *      , new VIZCore.Vector3(0, 0, 0)   // 종료 위치 ( -1 ~ +1 )
         *  );
         *
         *  vizwide3d.Animation.AddNoteAnimation("ANIMATION1");
         *
         *  vizwide3d.Animation.StartNoteAnimation();
         */
        this.AddNoteAnimation = function (key) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.hhi_AddNoteAnimation(key, "");
        };

        /**
         * 노트 애니메이션 재생(시작)
         * @example
         * let text = [];
         * text.push('3D Note 1');
         * text.push('3D Note 2');
         *
         * let position = new VIZCore.Vector3(1000, 2000, 3000);
         *
         * let fontColor = new VIZCore.Color(0, 56, 101, 255); // R, G, B, A
         * let borderColor = new VIZCore.Color(41, 143, 194, 255); // R, G, B, A
         * let backgroundColor = new VIZCore.Color(255, 255, 255, 200); // R, G, B, A
         *
         * let noteID = vizwide3d.Review.Note.AddCustomNote3D(
         *      text
         *      , position
         *      , 10
         *      , fontColor
         *      , borderColor
         *      , backgroundColor
         *  );
         *
         *  let noteIDs = [];
         *  noteIDs.push(noteID);
         *
         *  vizwide3d.Animation.AddNoteAnimation2DTemplate(
         *      "ANIMATION1"                     // Animation Key
         *      , noteIDs                        // Note ID Array
         *      , 0                              // Action Kind
         *      , 1000                           // Duration (ms.)
         *      , new VIZCore.Vector3(0.3, 0, 0) // 시작 위치 ( -1 ~ +1 )
         *      , new VIZCore.Vector3(0, 0, 0)   // 종료 위치 ( -1 ~ +1 )
         *  );
         *
         *  vizwide3d.Animation.AddNoteAnimation("ANIMATION1");
         *
         *  vizwide3d.Animation.StartNoteAnimation();
         */
        this.StartNoteAnimation = function () {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.hhi_StartAnimation();
        };

        /**
         * 노트 애니메이션 템플릿 등록
         * @param {String} key Animation Key
         * @param {Array.Number} noteIDs Note IDs Array
         * @param {Number} actionKind Action Kind
         * @param {Number} duration Duration
         * @param {VIZCore.Vector3} start Start Position
         * @param {VIZCore.Vector3} end End Position
         * @example
         * let text = [];
         * text.push('3D Note 1');
         * text.push('3D Note 2');
         *
         * let position = new VIZCore.Vector3(1000, 2000, 3000);
         *
         * let fontColor = new VIZCore.Color(0, 56, 101, 255); // R, G, B, A
         * let borderColor = new VIZCore.Color(41, 143, 194, 255); // R, G, B, A
         * let backgroundColor = new VIZCore.Color(255, 255, 255, 200); // R, G, B, A
         *
         * let noteID = vizwide3d.Review.Note.AddCustomNote3D(
         *      text
         *      , position
         *      , 10
         *      , fontColor
         *      , borderColor
         *      , backgroundColor
         *  );
         *
         *  let noteIDs = [];
         *  noteIDs.push(noteID);
         *
         *  vizwide3d.Animation.AddNoteAnimation2DTemplate(
         *      "ANIMATION1"                     // Animation Key
         *      , noteIDs                        // Note ID Array
         *      , 0                              // Action Kind
         *      , 1000                           // Duration (ms.)
         *      , new VIZCore.Vector3(0.3, 0, 0) // 시작 위치 ( -1 ~ +1 )
         *      , new VIZCore.Vector3(0, 0, 0)   // 종료 위치 ( -1 ~ +1 )
         *  );
         *
         *  vizwide3d.Animation.AddNoteAnimation("ANIMATION1");
         *
         *  vizwide3d.Animation.StartNoteAnimation();
         */
        this.AddNoteAnimation2DTemplate = function (key, noteIDs, actionKind, duration, start, end) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            let item = scope.Main.Animation.LS_AnimationItem();

            item.key = key;
            item.object = [];

            item.duration = duration;

            item.reviewAction.start.ox = start.x;
            item.reviewAction.start.oy = start.y;

            item.reviewAction.end.ox = end.x;
            item.reviewAction.end.oy = end.y;

            item.reviewAction.item = noteIDs;
            item.reviewAction.actionType = actionKind;

            // 등록
            scope.Main.Animation.hhi_AddAnimationKey(item.key, item);
        };

        this.AddNoteAnimation3DTemplate = function (key, noteIDs, actionKind, duration, start, end, rotate) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            let item = scope.Main.Animation.LS_AnimationItem();

            item.key = key;
            item.object = [];

            item.duration = duration;

            item.start.tx = start.x;
            item.start.ty = start.y;
            item.start.tz = start.z;

            item.end.tx = end.x;
            item.end.ty = end.y;
            item.end.tz = end.z;

            item.start.cx = 0;
            item.start.cy = 0;
            item.start.cz = 0;

            item.end.cx = 0;
            item.end.cy = 0;
            item.end.cz = 0;

            item.start.ax = rotate.x;
            item.start.ay = rotate.y;
            item.start.az = rotate.z;

            item.end.ax = rotate.x;
            item.end.ay = rotate.y;
            item.end.az = rotate.z;

            item.reviewAction.item = noteIDs;
            item.reviewAction.actionType = actionKind;

            // 등록
            scope.Main.Animation.LS_mapAnimation_Key.set(item.key, item);
            scope.Main.Animation.LS_mapAnimation_ID.set(item.key, item);
        };

        /**
         * 애니메이션 데이터 초기화
         * @example
         * vizwide3d.Animation.Clear();
         */
        this.Clear = function(){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.Animation.Clear();
        };

        

        //=======================================
        // Event
        //=======================================
        /**
         * Animation 재생 시간 변경 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Animation 재생 시간 변경 이벤트
         * vizwide3d.View.OnChangedPlayTimeEvent(onChangedPlayTimeEvent);
         *
         * //=======================================
         * // Event :: OnChangedPlayTimeEvent
         * //=======================================
         * let onChangedPlayTimeEvent = function (event) {
         * }
         */
         this.OnChangedPlayTimeEvent = function (listener) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;

            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Animation.PlayTime, listener);
        };

        /**
         * Animation 재생 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Animation 재생 이벤트
         * vizwide3d.View.OnChangedFrameEvent(onChangedFrameEvent);
         *
         * //=======================================
         * // Event :: OnEmptyMeshBlockEvent
         * //=======================================
         * let onChangedFrameEvent = function (event) {
         *      console.log(event.data);
         * }
         */
         this.OnChangedFrameEvent = function (listener) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
            
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Animation.Frame, listener);
        };
    }
}

export default Animation;