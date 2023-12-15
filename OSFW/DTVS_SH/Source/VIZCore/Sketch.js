/**
 * @author jhjang@softhills.net
 */

class Sketch {
    constructor(view, VIZCore) {
        // Private
        let scope = this;

        let sizeText = 12;
        let positionalNum = 2;
        let colLine = new VIZCore.Color(255, 255, 255, 255);
        let colArrow = new VIZCore.Color(255, 0, 0, 255);
        let colPoint = new VIZCore.Color(255, 0, 0, 255);

        let colBack = new VIZCore.Color(255, 255, 255, 255);
        let colBorder = new VIZCore.Color(41, 143, 194, 255);
        let colText = new VIZCore.Color(0, 0, 0, 255);

        //reviewItem, data = []
        this.UpdateReviewText = function (review, data) {
            if (review === undefined)
                return;

            scope.UpdateReviewTextByType(review.itemType, review.text.value, data);
        };

        //type , [out] StringArray, data
        this.UpdateReviewTextByType = function (reviewType, textValue, data) {
            //switch (reviewType) {
            //case VIZCore.Enum.REVIEW_TYPES.RK_MEASURE_POS:
            //    {
            //        textValue.length = 0; //초기화
            //        textValue.push("X = " + data[0].x.toFixed(positionalNum));
            //        textValue.push("Y = " + data[0].y.toFixed(positionalNum));
            //        textValue.push("Z = " + data[0].z.toFixed(positionalNum));
            //    }
            //    break;
            //}
        };

        this.UpdateReviewStyle = function (review) {

            review.style.font.color.copy(colText);
            review.style.font.size = sizeText;
            review.style.border.color.copy(colBorder);
            review.style.background.color.copy(colBack);
            review.style.line.color.copy(colLine);
            review.style.point.color.copy(colPoint);

            switch (review.itemType) {
                case VIZCore.Enum.REVIEW_TYPES.RK_SKETCH_FREE:
                    {
                    }
                    break;
            }
        };
    }
}

export default Sketch;