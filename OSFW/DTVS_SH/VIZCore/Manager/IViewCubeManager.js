/**
 * VIZCore ViewCube 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class ViewCube {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * ViewCube 보이기 / 숨기기
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.View.ViewCube.Show(true);
         */
        this.Show = function (visible) {
            scope.Main.ViewCube.Visible = visible;
            scope.Main.Renderer.Render();
        };

        /**
         * ViewCube 보이기 / 숨기기 상태 반환
         * @returns {boolean} 보이기/숨기기 상태
         * @example
         * if(vizwide3d.View.ViewCube.IsVisible() === true)
         *  vizwide3d.View.ViewCube.Show(false);
         * else
         *  vizwide3d.View.ViewCube.Show(true);
         */
        this.IsVisible = function () {
            return scope.Main.ViewCube.Visible;
        };

        /**
         * ViewCube 위치 및 오프셋 설정
         * @param {VIZCore.Enum.VIEWCUBE_POSITIONS} position 위치
         * @param {VIZCore.Enum.VIEWCUBE_POSITIONS} offset 오프셋 (기본값 : 50)
         * @example
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.LEFT_TOP);       // 좌상단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.RIGHT_TOP);      // 우상단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.LEFT_BOTTOM);    // 좌하단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.RIGHT_BOTTOM);   // 우하단
         *
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.LEFT_TOP, 50);       // 좌상단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.RIGHT_TOP, 50);      // 우상단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.LEFT_BOTTOM, 50);    // 좌하단
         * vizwide3d.View.ViewCube.SetPosition(VIZCore.Enum.VIEWCUBE_POSITIONS.RIGHT_BOTTOM, 50);   // 우하단
         */
        this.SetPosition = function (position, offset) {
            scope.Main.ViewCube.SetPosition(position, offset);
            scope.Main.Renderer.Render();
        };

        /**
         * ViewCube 오프셋 설정
         * @param {VIZCore.Enum.VIEWCUBE_POSITIONS} offset 오프셋 (기본값 : 50)
         * @example
         * vizwide3d.View.ViewCube.SetOffset(20);
         * vizwide3d.View.ViewCube.SetOffset(50); // Default
         */
        this.SetOffset = function (offset) {
            scope.Main.ViewCube.SetOffset(offset);
            scope.Main.Renderer.Render();
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default ViewCube;