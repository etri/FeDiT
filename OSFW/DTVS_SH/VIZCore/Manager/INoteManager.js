/**
 * VIZCore Note 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Note {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        this.UseEffect = function(enable){
            scope.Main.Renderer.useNoteEffect = enable;
        };


        //=======================================
        // Method
        //=======================================
        
        /**
         * 노트 전체 삭제
         * @example
         * vizwide3d.Review.Note.DeleteAll();
         * @todo vizwide3d.Render(); // 화면 다시그리기 호출
         */
        this.DeleteAll = function(){
            scope.Main.Data.Review.DeleteReviewByType(0);
        };

        /**
         * 노트 정보 삭제
         * @param {Object} id 개체 아이디(Number or Array)
         * @example
         * vizwide3d.Review.Note.DeleteByID(10);
         * @example
         * let ids = [10, 11];
         * vizwide3d.Review.Note.DeleteByID(ids);
         * @todo vizwide3d.Render(); // 화면 다시그리기 호출
         */
        this.DeleteByID = function (id) {
            scope.Main.Data.DeleteReview(id);
        };

        /**
         * 2D 노트 추가
         * @param {String[]} text 노트 텍스트
         * @example
         * let text = [];
         * text.push('2D Note #1');
         * text.push('2D Note #2');
         *
         * vizwide3d.Review.Note.AddNote2D(text);
         */
        this.AddNote2D = function (text) {
            scope.Main.Review.Add2DNote(text);
        };

        /**
         * 3D 노트 추가
         * @param {String[]} text 노트 텍스트
         * @example
         * let text = [];
         * text.push('3D Note #1');
         * text.push('3D Note #2');
         *
         * vizwide3d.Review.Note.AddNote3D(text);
         */
        this.AddNote3D = function (text) {
            scope.Main.Review.Add3DNote(text);
        };

        /**
         * 표면 노트 추가
         * @param {String[]} text 노트 텍스트 (== undefined or [] 일경우 Body 이름으로 생성)
         * @example
         * let text = [];
         * text.push('Surface Note #1');
         * text.push('Surface Note #2');
         *
         * vizwide3d.Review.Note.AddNoteSurface(text);
         */
        this.AddNoteSurface = function (text) {
            scope.Main.Review.AddSurfaceNote(text);
        };



        /**
         * 3D 노트 추가
         * @return {Object} Note Object
         * @example
         * let note = vizwide3d.Review.Note.NewNote3D();
         *
         * let text = [];
         * text.push('3D Note #1');
         * text.push('3D Note #2');
         *
         * note.text.value = text;
         * note.text.position = new VIZCore.Vector3(1000, 2000, 3000);
         *
         * note.style.font.size = 10;
         * note.style.font.color.set(0, 56, 101, 255);          // R, G, B, A
         * note.style.border.type = 1;                          // 0 (Rectangle), 1(Rounded Rectangle)
         * note.style.border.color.set(41, 143, 194, 255);      // R, G, B, A
         * note.style.background.color.set(255, 255, 255, 200); // R, G, B, A
         *
         * let noteId = vizwide3d.Review.Note.AddNote(note);
         */
        this.NewNote3D = function () {
            let review = scope.Main.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE;

            return review;
        };

        /**
         * 3D 노트 추가
         * @param {Object} note Note Object
         * @returns {String} Note ID
         * @example
         * let note = vizwide3d.Review.Note.NewNote3D();
         *
         * let text = [];
         * text.push('3D Note #1');
         * text.push('3D Note #2');
         *
         * note.text.value = text;
         * note.text.position = new VIZCore.Vector3(1000, 2000, 3000);
         *
         * note.style.font.size = 10;
         * note.style.font.color.set(0, 56, 101, 255);          // R, G, B, A
         * note.style.border.type = 1;                          // 0 (Rectangle), 1(Rounded Rectangle)
         * note.style.border.color.set(41, 143, 194, 255);      // R, G, B, A
         * note.style.background.color.set(255, 255, 255, 200); // R, G, B, A
         *
         * let noteId = vizwide3d.Review.Note.AddNote(note);
         */
        this.AddNote = function (note) {
            scope.Main.Data.Reviews.push(note);

            return note.id;
        };



        /**
         * 표면 노트 추가
         * @return {Object} Note Object
         * @example
         * let note = vizwide3d.Review.Note.NewNoteSurface();
         *
         * let text = [];
         * text.push('Surface Note #1');
         * text.push('Surface Note #2');
         *
         * note.text.value = text;
         * note.text.position = new VIZCore.Vector3(1000, 2000, 3000);          // Text
         * note.drawitem.position.push(new VIZCore.Vector3(1000, 6000, 6000));  // Arrow
         *
         * note.style.font.size = 10;
         * note.style.font.color.set(0, 56, 101, 255);          // R, G, B, A
         * note.style.border.type = 1;                          // 0 (Rectangle), 1(Rounded Rectangle)
         * note.style.border.color.set(41, 143, 194, 255);      // R, G, B, A
         * note.style.background.color.set(255, 255, 255, 200); // R, G, B, A
         *
         * note.style.arrow.color.set(255, 0, 0, 255);          // R, G, B, A
         * note.style.arrow.size = 10;
         *
         * note.style.line.color.set(0, 0, 0, 255);             // R, G, B, A
         * note.style.line.thickness = 4;
         *
         * let noteId = vizwide3d.Review.Note.AddNote(note);
         */
        this.NewNoteSurface = function () {
            let review = scope.Main.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE;

            return review;
        };

        /**
         * 이미지 노트 추가
         * @param {Object} image Image Object
         * @param {VIZCore.Vector2} size image size (기본값 : 이미지 원본 사이즈)
         * @return {Object} Note Object
         * @example
         *
         * let img = new Image();
         * img.src = 'image.jpg';
         * img.onload = function () {
         *      let note = vizwide3d.Review.Note.NewImageNote(img); //image src size
         *      //let note = vizwide3d.Review.Note.NewImageNote(img, new VIZCore.Vector2(128, 128)); //set image Size
         *
         *      let text = [];
         *      text.push('Image Note #1');
         *      text.push('Image Note #2');
         *
         *      note.text.value = text;
         *      note.text.position = new VIZCore.Vector3(0, 0, 0);          // Text
         *      note.drawitem.position.push(new VIZCore.Vector3(1000, 6000, 6000));  // Image Postion
         *
         *      note.style.font.size = 10;
         *      note.style.font.color.set(0, 56, 101, 255);          // R, G, B, A
         *
         *      note.style.border.enable = false;
         *      note.style.border.type = 1;                          // 0 (Rectangle), 1(Rounded Rectangle)
         *      note.style.border.color.set(41, 143, 194, 255);      // R, G, B, A
         *
         *      note.style.background.enable = false;
         *      note.style.background.color.set(255, 255, 255, 200); // R, G, B, A
         *
         *      note.style.arrow.color.set(255, 0, 0, 255);          // R, G, B, A
         *      note.style.arrow.size = 10;
         *
         *      note.style.line.color.set(0, 0, 0, 255);             // R, G, B, A
         *      note.style.line.thickness = 4;
         *
         *      let noteId = vizwide3d.Review.Note.AddNote(note);
         * };
         */
        this.NewImageNote = function (image, size) {

            let review = scope.Main.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_IMAGE_NOTE;

            review.drawitem.custom = scope.Main.Data.ImageDataItem();
            review.drawitem.custom.image = image;
            if (size !== undefined)
                review.drawitem.custom.size.copy(size);

            return review;
        };


        //=======================================
        // Event
        //=======================================

        /**
         * 노트 선택 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Note Selected Event (노트 선택 이벤트)
         * vizwide3d.Review.Note.OnSelectedEvent(onSelected);
         *
         * //=======================================
         * // Event :: OnSelectedEvent
         * //=======================================
         * let onSelected = function (event) {
         * }
         */
        this.OnSelectedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Review.Selected, listener);
        };

        /**
         * 노트 선택 위치 반환 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Note Selected Position Event (노트 선택 위치 반환 이벤트)
         * vizwide3d.Review.Note.OnSelectedPositionEvent(onSelectedPosition);
         *
         * //=======================================
         * // Event :: OnSelectedPositionEvent
         * //=======================================
         * let onSelectedPosition = function (event) {
         * }
         */
        this.OnSelectedPositionEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Review.SelectedPosition, listener);
        };
    }
}

export default Note;