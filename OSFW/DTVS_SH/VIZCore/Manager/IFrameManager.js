/**
 * VIZCore Frame 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
 class Frame {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * Frame(SHIP GRID) URI 열기
         * @example
         * let uri = 'http://127.0.0.1/VIZCore/Model/ShipGrid/8222.json';
         * vizwide3d.Frame.OpenUri(uri);
         */
        this.OpenUri = (uri) =>
        {
            this.Main.Grid.Add(uri);
        };

        /**
         * Frame(SHIP GRID) String 열기
         * @example
         * let str = "[{\"axis\":\"X\",\"axisId\":0,\"label\":\"FR\",\"items\":[{\"id\":0,\"offset\":8500},{\"id\":1,\"offset\":10000}]},{\"axis\":\"Y\",\"axisId\":1,\"label\":\"LP\",\"items\":[{\"id\":0,\"offset\":10000},{\"id\":0,\"offset\":20000}]},{\"axis\":\"Z\",\"axisId\":2,\"label\":\"LP\",\"items\":[{\"id\":0,\"offset\":2680},{\"id\":1,\"offset\":5000}]}]"
         * vizwide3d.Frame.OpenString(str);
         */
         this.OpenString = (str) =>
         {
             this.Main.Grid.AddString(str);
         };

        /**
         * Frame 초기화
         * @example
         * vizwide3d.Frame.Clear();
         */
        this.Clear = () => 
        {
            this.Main.Grid.Clear();
        };

        /**
         * Elevation Line 조회
         * @example
         * vizwide3d.Frame.ElevationLine(false);
         */
        this.ElevationLine = (enable) => {
            this.Main.Grid.ElevationLine = enable;
        };

        /**
         * Plan Line 조회
         * @example
         * vizwide3d.Frame.PlanLine(false);
         */
        this.PlanLine = (enable) => {
            this.Main.Grid.PlanLine = enable;
        };

        this.ForeColor = () => {

        };

        this.HasFrame = () => {

        };

        /**
         * Section Line 조회
         * @example
         * vizwide3d.Frame.SectionLine(false);
         */
        this.SectionLine = (enable) => {
            this.Main.Grid.SectionLine = enable;
        };

        /**
         * Show Number
         * @example
         * vizwide3d.Frame.ShowNumber(false);
         */
        this.ShowNumber = (enable) => {
            this.Main.Grid.ShowFrameNumber = enable;
        };

        /**
         * 짝수번째 표시
         * @example
         * vizwide3d.Frame.ShowEvenNumber(false);
         */
        this.ShowEvenNumber = (enable) => {
            this.Main.Grid.ShowEvenNumber = enable;
        };

        /**
         * 자동 숨김(전체 Frame Number 보이기/숨기기). 기본값은 False이며, 화면 비율에 따라 Frame 번호가 일부 조회됨.
         * @example
         * vizwide3d.Frame.ShowNumberAllStep(false);
         */
        this.ShowNumberAllStep = (enable) => {
            this.Main.Grid.ShowNumberAllStep = enable;
        };

        /**
         * 홀수번째 표시
         * @example
         * vizwide3d.Frame.ShowOddNumber(false);
         */
        this.ShowOddNumber = (enable) => {
            this.Main.Grid.ShowOddNumber = enable;
        };
        
        /**
         * XY Plane 조회
         * @example
         * vizwide3d.Frame.XYPlane(false);
         */
        this.XYPlane = (enable) => {
            this.Main.Grid.XYPlane = enable;
        };

        /**
         * YZ Plane 조회
         * @example
         * vizwide3d.Frame.YZPlane(false);
         */
        this.YZPlane = (enable) => {
            this.Main.Grid.YZPlane = enable;
        };

        /**
         * ZX Plane 조회
         * @example
         * vizwide3d.Frame.ZXPlane(false);
         */
        this.ZXPlane = (enable) => {
            this.Main.Grid.ZXPlane = enable;
        };



        /**
         * Frame 추가
         * @param {VIZCore.Enum.Axis} axis 축
         * @param {Number} gridId Grid Id
         * @param {Number} offset 오프셋
         * @example
         * // X축 추가
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.X, 0, 0);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.X, 1, 77800);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.X, 2, 92495);
         * // Y축 추가
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Y, -1, -1820);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Y, 0, 0);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Y, 1, 1820);
         * // Z축 추가
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Z, 0, 0);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Z, 1, 10000);
         * vizwide3d.Frame.AddGridLine(VIZCore.Enum.Axis.Z, 2, 11000);
         */
        this.AddGridLine = (axis, gridId, offset)=>{
            this.Main.Grid.AddGridLine(axis, gridId, offset);
        };

        /**
         * Frame 추가
         * @param {VIZCore.Enum.Axis} axis 축
         * @param {Number} gridId Grid Id
         * @param {Number} offset 오프셋
         * @param {String} label Custom Label
         */
         this.AddGridLineCustom = (axis, gridId, offset, label)=>{
            this.Main.Grid.AddGridLineCustom(axis, gridId, offset, label);
        };

        /**
         * 레벨 그리드 활성화
         * @param {Boolean} visible 보이기 / 숨기기
         * @example
         * 
         * vizwide3d.Frame.ShowLevelGrid(true);
         */
        this.ShowLevelGrid = (visible) => {
            this.Main.Grid.ShowLevelGrid(visible);
        };

          /**
         * 지정 위치에서 가장 가까운 그리드 정보 반환
         * @param {VIZCore.Enum.Axis} nAxis 축
         * @param {Number} point 좌표
         * @return {*} 그리드 반환 (찾기 실패시 undefined)
         */
           this.GetSnapItem = (nAxis, point) => {
            let item = this.Main.Grid.GetSnapItem(nAxis, point);
            return item;
        };  

        /**
         * 지정 축의 그리드 리스트 반환
         * @param {VIZCore.Enum.Axis} nAxis 
         * @returns {Object}
         */
        this.GetGridItem = (nAxis)=>{
            let item = this.Main.Grid.GetGridItem(nAxis);
            return item;
        };

        this.GetGridItemByID = (nAxis, id)=>{
            let result = undefined;
            let info = this.Main.Grid.GetGridItem(nAxis);
            if(info !== undefined)
            {
                for(let i = 0; i < info.items.length; i++)
                {
                    let item = info.items[i];
                    if(item.id === id)
                        result = item;
                }
            }

            return result;
        };

        this.ShowCustomLabel = (show)=>{
            this.Main.Grid.SetShowCustomLabel(show);
        }
        
        //=======================================
        // Event
        //=======================================
    }
}

export default Frame;