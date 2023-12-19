import IMeasure from "./IMeasureManager.js";
import INote from "./INoteManager.js";
import IUserView from "./IUserViewManager.js";
import IDrawingMarkup from "./IDrawingMarkupManager.js";
import ISnapshot from "./ISnapshotManager.js";

/**
 * VIZCore Review 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Review {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        scope.Measure = new IMeasure(main, VIZCore);
        scope.Note = new INote(main, VIZCore);
        scope.UserView = new IUserView(main, VIZCore);
        scope.DrawingMarkup = new IDrawingMarkup(main, VIZCore);
        scope.Snapshot = new ISnapshot(main, VIZCore);

        //=======================================
        // Method
        //=======================================

        /**
         * 리뷰 정보 삭제
         * @param {Object} id 개체 아이디(Number or Array)
         * @example
         * vizwide3d.Review.DeleteByID(10);
         * @example
         * let ids = [10, 11];
         * vizwide3d.Review.DeleteByID(ids);
         * @todo vizwide3d.Render(); // 화면 다시그리기 호출
         */
        this.DeleteByID = function (id) {
            scope.Main.Data.Review.DeleteReview(id);
            scope.Main.Renderer.Render();
        };

        /**
         * 모든 리뷰 정보 삭제
         * @example
         * vizwide3d.Review.DeleteAll();
         * @todo vizwide3d.Render(); // 화면 다시그리기 호출
         */
        this.DeleteAll = function()
        {
            scope.Main.Data.Review.DeleteReivewAll();
            scope.Main.Renderer.Render();
        };

        /**
         * 리뷰 정보 반환
         * @param {Number} id 개체 아이디
         * @return {Data.ReviewItem} 리뷰 객체
         * @example
         * let review = vizwide3d.Review.GetReview(10);
         */
        this.GetReview = function (id) {
            return scope.Main.Data.Review.GetReview(id);
        };

        /**
         * 리뷰 정보 반환
         * @param {Number} id 개체 아이디
         * @return {Data.ReviewItem} 리뷰 객체
         * @example
         * let review = vizwide3d.Review.GetItem(10);
         */
        this.GetItem = function (id) {
            //VIZCore.NET 에서 사용하는 방식 맞추기 위해 추가
            return scope.Main.Data.Review.GetReview(id);
        };

        /**
         * 리뷰 보이기/숨기기 설정
         * @param {Number} id 개체 아이디
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.Review.Show(10, true);
         */
        this.Show = function(id, visible) {
            scope.Main.Data.Review.Show(id, visible);
            scope.Main.Renderer.Render();
        };

        /**
         * 전체 리뷰 보이기/숨기기 설정
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.Review.ShowAll(true);
         */
        this.ShowAll = function(visible)
        {
            scope.Main.Data.Review.ShowAll(visible);
            scope.Main.Renderer.Render();
        };

        /**
         * 리뷰 유형 별 보이기/숨기기 설정
         * @param {boolean} visible 보이기/숨기기
         * @param {VIZCore.Enum.REVIEW_TYPES} reviewKind VIZCore.Enum.REVIEW_TYPES 리뷰 타입
         * @example
         * vizwide3d.Review.ShowByKind(true, VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE);
         */
        this.ShowByKind = function(visible, reviewKind)
        {
            scope.Main.Data.Review.ShowByKind(visible, reviewKind);
            scope.Main.Renderer.Render();
        };

        /**
        * 리뷰 선택/선택해제 설정
        * @param {Number} id 개체 아이디
        * @param {boolean} select 선택/선택해제
        * @example
        * vizwide3d.Review.Select(10, true);
        */
        this.Select = function(id, select) {
            scope.Main.Data.Review.Select(id, select);
            scope.Main.Renderer.Render();
        };

         /**
        * 리뷰 선택/선택해제 설정
        * @param {boolean} select 선택/선택해제
        * @example
        * vizwide3d.Review.SelectAll(true);
        */
        this.SelectAll = function(select)
        {
            scope.Main.Data.Review.SelectAll(select);
            scope.Main.Renderer.Render();
        };

        /**
         * 리뷰 유형 별 선택/선택해제 설정
         * @param {boolean} select 선택/선택해제
         * @param {VIZCore.Enum.REVIEW_TYPES} reviewKind VIZCore.Enum.REVIEW_TYPES 리뷰 타입
         * @example
         * vizwide3d.Review.SelectByKind(true, VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE);
         */
        this.SelectByKind = function(select, reviewKind)
        {
            scope.Main.Data.Review.SelectByKind(select, reviewKind);
            scope.Main.Renderer.Render();
        };

        /**
         * 리뷰 파일 다운로드 및 추가
         * @param {string} url 리뷰 파일 경로
         * @callback callback 다운로드 완료시 
         * @example
         * // 다운로드 완료 Callback
         * let callback = function(result){
         *      
         * };
         * vizwide3d.Review.AddByFile("VIZCore/Model/toycar/vizw/toycar.json", callback);
         */
        this.AddByFile = function(url, callback){
            scope.Main.Data.Review.AddFile(url, callback);              
        };

        this.ParseJSON = function(data){
            scope.Main.Data.Review.ParseJSON(data);              
        };

        /**
         * 리뷰 정보 JSON 내보내기
         * @return {string} JSON 문자열
         * @example
         * let json = vizwide3d.Review.ExportJSON();
         * console.log("ExportJSON :: ", json);
         */
        this.ExportJSON = function(){
            return scope.Main.Data.Review.ExportJSON();
        };

        /**
         * 리뷰 안내창 위치 설정
         * @param {Number} top Top Offset
         * @param {Number} left Left Offset
         * @example
         * 
         * vizwide3d.Review.SetAlertLocation(50,100);
         */
        this.SetAlertLocation = function (top, left) {
            scope.Main.UIManager.SetLocation(top, left);
        };

        //=======================================
        // Event
        //=======================================

        /**
         * 리뷰 변경 이벤트
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Review Change Event (리뷰 변경 이벤트)
         * vizwide3d.Review.OnReviewChangedEvent(OnReviewChanged);
         *
         * //=======================================
         * // Event :: OnReviewChangedEvent
         * //=======================================
         * let OnReviewChanged = function (event) {
         * }
         */
        this.OnReviewChangedEvent = function (listener) {
            scope.Main.Data.Review.OnChangedEvent(listener);
        };
    }
}

export default Review;