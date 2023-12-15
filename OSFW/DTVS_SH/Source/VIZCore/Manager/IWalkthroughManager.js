/**
 * [VIZWide3D] VIZCore Walkthrough 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Walkthrough {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * WalkThrough 사용 설정
         * @param {boolean} enable 사용/미사용
         * @example
         * vizwide3d.View.Walkthrough.Enable(true);
         */
        this.Enable = function (enable) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
            
            if(enable) {
                scope.Main.Mode.WalkThrough();
            }
            else {
                scope.Main.Mode.Normal();
            }
        };

        /**
         * WalkThrough 아바타 사용 설정
         * @param {boolean} enable 사용/미사용
         * @example
         * vizwide3d.View.Walkthrough.Avatar(true);
         */
        this.Avatar = function (enable){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
        
            scope.Main.Avatar.Visible(enable);
            //scope.Main.Avatar.ShowAvatar = enable;
        };

        /**
         * WalkThrough 아바타 위치 설정
         * @param {VIZCore.Vector3} pos 이동 위치
         * @example
         * vizwide3d.View.Walkthrough.MoveAvatarPosition(new VIZCore.Vector3(83720,-9762,22561));
         */
        this.MoveAvatarPosition = function(pos){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
        
            let controlMode = scope.Main.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;

            if(scope.Main.Avatar.ShowAvatar)
            {
                scope.Main.Avatar.InitPosAndDirection(pos);
                for (let i = 0; i < 16; i++)
                    scope.Main.Camera.SetZAxis2Up();
                scope.Main.Avatar.UpdateCamera();

                scope.Main.MeshBlock.Reset();
                scope.Main.Renderer.Render();
            }
        };

         /**
         * WalkThrough 이동
         * Key down, key press, Mouse down등의 이벤트 연동
         * @param {VIZCore.Enum.ACTION_STATE} state WalkThrough Action
         * @example
         * // 앞으로 이동
         * vizwide3d.View.Walkthrough.Action(VIZCore.Enum.ACTION_STATE.FORWARD);
         */
        this.Action = function(state){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
        
            let controlMode = scope.Main.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;

            let control = scope.Main.Control.GetUIMode();
                
            switch(state){
                case VIZCore.Enum.ACTION_STATE.FORWARD : {
                    control.keyPress(38);
                }break;
                case VIZCore.Enum.ACTION_STATE.BACKWARD : {
                    control.keyPress(40);
                }break;
                case VIZCore.Enum.ACTION_STATE.LEFT : {
                    control.keyPress(113);
                }break;
                case VIZCore.Enum.ACTION_STATE.RIGHT : {
                    control.keyPress(101);
                }break;
                case VIZCore.Enum.ACTION_STATE.UP : {
                    control.keyPress(114);
                }break;
                case VIZCore.Enum.ACTION_STATE.DOWN : {
                    control.keyPress(102);
                }break;
                case VIZCore.Enum.ACTION_STATE.TURN_LEFT : {
                    control.keyPress(37);
                }break;
                case VIZCore.Enum.ACTION_STATE.TURN_RIGHT : {
                    control.keyPress(39);
                }break;
                case VIZCore.Enum.ACTION_STATE.ZOOM_IN : {
                    control.keyPress(39);
                }break;
                case VIZCore.Enum.ACTION_STATE.ZOOM_OUT : {
                    control.keyPress(39);
                }break;
            }
        };

        /**
         * WalkThrough 이동 종료
         * Key up, Mouse up등의 이벤트 연동
         * @param {VIZCore.Enum.ACTION_STATE} state WalkThrough Action
         * @example
         * // 앞으로 이동
         * vizwide3d.View.Walkthrough.EndAction(VIZCore.Enum.ACTION_STATE.FORWARD);
         */
        this.EndAction = function(state){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
        
            let controlMode = scope.Main.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;

            let control = scope.Main.Control.GetUIMode();
                
            switch(state){
                case VIZCore.Enum.ACTION_STATE.FORWARD : {
                    control.keyUp(38);
                }break;
                case VIZCore.Enum.ACTION_STATE.BACKWARD : {
                    control.keyUp(40);
                }break;
                case VIZCore.Enum.ACTION_STATE.LEFT : {
                    control.keyUp(113);
                }break;
                case VIZCore.Enum.ACTION_STATE.RIGHT : {
                    control.keyUp(101);
                }break;
                case VIZCore.Enum.ACTION_STATE.UP : {
                    control.keyUp(114);
                }break;
                case VIZCore.Enum.ACTION_STATE.DOWN : {
                    control.keyUp(102);
                }break;
                case VIZCore.Enum.ACTION_STATE.TURN_LEFT : {
                    control.keyUp(37);
                }break;
                case VIZCore.Enum.ACTION_STATE.TURN_RIGHT : {
                    control.keyUp(39);
                }break;
                case VIZCore.Enum.ACTION_STATE.ZOOM_IN : {
                    control.keyUp(39);
                }break;
                case VIZCore.Enum.ACTION_STATE.ZOOM_OUT : {
                    control.keyUp(39);
                }break;
            }
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default Walkthrough;