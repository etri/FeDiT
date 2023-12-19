//import $ from 'jquery';

class Compass {
    constructor(view, VIZCore) {
        let scope = this;

        let bInit = false;
        let image = undefined;

        // 가시화 이미지
        let srcImage = "./VIZCore/Resource/Compass.png";

        this.Option = {
            Visible: false,
        };

    
        this.Show = function (show) {
            scope.Option.Visible = show;
        };


        function getMainCameraViewMatrix() {

            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);

            let matMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
            view.Mode.Camera(backupCameraIndex);

            return matMV;
        };

        // 진북 방향 설정
        this.SetDriection = (dir)=>{
            try{
                view.Configuration.Render.Compass2D.Direction = new VIZCore.Vector3().copy(dir);
            }
            catch(e){
            }
        };

        // 이미지 설정
        this.SetImagePath = (path)=>{
            srcImage = path;
            bInit = false;
        };

         
        this.RenderCompass = () => {
            {
                if (bInit === false) {

                    image = new Image();
                    image.src = srcImage;

                    image.onload = () => {
                        bInit = true;
                        scope.RenderCompass();
                    }
                }

                else {
                    if (scope.Option.Visible === false) return;

                    let drawCompass = (ctx) => {

                        let mainMV = getMainCameraViewMatrix();
                        const matMVMatrix = new VIZCore.Matrix4().copy(mainMV);
                        matMVMatrix.setPosition(new VIZCore.Vector3());

                        //let vYAxis = new VIZCore.Vector3(0.0, 1.0, 0.0);
                        let vYAxis = new VIZCore.Vector3().copy(view.Configuration.Render.Compass2D.Direction);
                        vYAxis = vYAxis.applyMatrix4(matMVMatrix);
                        vYAxis.y *= -1.0;

                        let vZAxis = new VIZCore.Vector3(0.0, 0.0, 1.0);
                        vZAxis = vZAxis.applyMatrix4(matMVMatrix);
                        if (vZAxis.z < 0)
                            vYAxis.y *= -1.0;

                        let vYUpAxis = new VIZCore.Vector3(0.0, 0.0, 1.0);

                        let vPos1 = new VIZCore.Vector3().copy(vYAxis);
                        let vPos2 = new VIZCore.Vector3().copy(vYUpAxis);

                        {
                            let p1 = undefined;
                            let p2 = undefined;
                            p1 = new VIZCore.Vector3().copy(vPos1);
                            p2 = new VIZCore.Vector3().copy(vPos2);

                            // 각도 계산
                            let angle = vPos1.get2DAngle() * 180 / Math.PI;
                            //console.log("Angle :: ", angle);


                            function drawImage(ctxTmp, img, x, y, angle = 0, scale = 1) {
                                ctxTmp.save();
                                ctxTmp.translate(x + img.width * scale / 2, y + img.height * scale / 2);
                                ctxTmp.rotate(angle);
                                ctxTmp.translate(- x - img.width * scale / 2, - y - img.height * scale / 2);
                                ctxTmp.drawImage(img, x, y, img.width * scale, img.height * scale);
                                ctxTmp.restore();
                            }

                            // 각도 보정값 및 라디안 변경
                            let rad = (angle + 90) / 180 * Math.PI;
                            //console.log("Radian :: ", rad);

                            let coordPos = new VIZCore.Vector2(0.05, 0.05);
                            coordPos.x = view.Camera.clientWidth * coordPos.x;
                            coordPos.y = view.Camera.clientHeight - (view.Camera.clientWidth * coordPos.y);

                            if (view.Configuration.Render.Compass2D.Position !== undefined)
                            {
                                coordPos = new VIZCore.Vector2(view.Configuration.Render.Compass2D.Position.Horizontal, view.Configuration.Render.Compass2D.Position.Vertical);
                                coordPos.x = view.Camera.clientWidth * coordPos.x;
                                coordPos.y = view.Camera.clientHeight * coordPos.y;
                            }

                            let imageSize = image.width;
                            let configSize = ctx.canvas.clientWidth * view.Configuration.Render.Compass2D.Length;
                            let ratio = configSize / imageSize * 100;

                            drawImage(ctx, image, coordPos.x, coordPos.y, rad, ratio / 100 );
                           // drawImage(ctx, image, 50, ctx.canvas.clientHeight- (image.height * 0.2) - 250, rad, 0.5);
                        }
                    };

                    drawCompass(view.ctx_review);
                }
            }
        };
    }
}

export default Compass;