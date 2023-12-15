/**
 * VIZCore Snapshot 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Snapshot {
    constructor(main, VIZCore) {
        let scope = this;
        this.Main = main;

        //=======================================
        // Method
        //=======================================

        /**
         * Snapshot 추가
         * @example
         * @todo vizwide3d.Render(); // 화면 다시그리기 호출
         */
        this.Add = ()=>{
            let review = scope.New();

            let thumbnail = scope.Main.Interface.View.GetCurrentImage(true);
            review.tag.thumbnail = thumbnail.replace('data:image/png;base64,', '');
            review.tag.cameraId = scope.Main.Camera.Backup();

            review.tag.drawitem = scope.Main.Data.Review.GetReviewByType(VIZCore.Enum.REVIEW_TYPES.RK_SKETCH);

            review.tag.selectedIds = scope.Main.Data.GetSelection();
           
            if (scope.Main.Clipping.IsClipping() === true) {
                review.tag.section.push(scope.Main.Clipping.Get());
            }

            scope.AddItem(review);

            return review;
        };

        this.New = ()=>{
            let review = scope.Main.Data.ReviewItem();
            review.itemType = VIZCore.Enum.REVIEW_TYPES.RK_SNAPSHOT;
            review.tag = scope.Main.Data.Review.GetReviewItemTag(VIZCore.Enum.REVIEW_TYPES.RK_SNAPSHOT);
            return review;
        };

        this.AddItem =(item)=>{
            scope.Main.Data.Reviews.push(item);
            scope.Main.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Review.Changed, scope.Main.Data.Reviews);
        };
    }
}

export default Snapshot;