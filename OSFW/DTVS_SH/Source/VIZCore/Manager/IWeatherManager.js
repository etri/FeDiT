/**
 * VIZCore Weather 인터페이스
 * @copyright © 2013 - 2023 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Weather {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================

        /**
         * 정의된 날씨 반복 재생
         * @param {boolean} enable 활성화 여부
         */
        this.SetRepeatRender = function(enable){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetRepeatRender(enable);
        };

        
        /**
         * 정의된 날씨(비) 적용
         * @param {number} level 0 ~ 4 (0 = 맑음, 1 = 조금, 2 = 보통, 3 = 많음, 4 = 매우 많음 )
         */
        this.SetRainTemplate = function(level) {

            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            if(level === 0) {
                scope.Main.Renderer.SetEnableWeatherRain(false);

                scope.Main.Renderer.SetRepeatRender(false);
            }
            if(level === 1) {
                scope.Main.Renderer.SetEnableWeatherRain(true);
                scope.Main.Renderer.SetWeatherRainDrawCount(1000);

                let opt = scope.Main.Renderer.GetWeatherRainOpion();
                opt.length = 8000;
                opt.speed = 400;
                opt.angle = 0;
                scope.Main.Renderer.SetWeatherRainOpion(opt);

                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 2) {
                scope.Main.Renderer.SetEnableWeatherRain(true);
                scope.Main.Renderer.SetWeatherRainDrawCount(2000);

                let opt = scope.Main.Renderer.GetWeatherRainOpion();
                opt.length = 10000;
                opt.speed = 400;
                opt.angle = 0;
                scope.Main.Renderer.SetWeatherRainOpion(opt);

                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 3) {
                scope.Main.Renderer.SetEnableWeatherRain(true);
                scope.Main.Renderer.SetWeatherRainDrawCount(3000);

                let opt = scope.Main.Renderer.GetWeatherRainOpion();
                //opt.length = 5000;
                opt.length = 12000;
                opt.speed = 400;
                opt.angle = 0;
                scope.Main.Renderer.SetWeatherRainOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 4) {
                scope.Main.Renderer.SetEnableWeatherRain(true);
                scope.Main.Renderer.SetWeatherRainDrawCount(4000);

                let opt = scope.Main.Renderer.GetWeatherRainOpion();
                opt.length = 12000;
                //opt.speed = 400;
                opt.speed = 400;
                opt.angle = 0;
                scope.Main.Renderer.SetWeatherRainOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }

            
        };

        /**
         * 환경 날씨 비 활성화
         * @param {boolean} enable 활성화/비활성화
         */
        this.EnableRain = function (enable) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetEnableWeatherRain(enable);
        };

        /**
         * 환경 날씨 비 그려지는 수 설정
         * @param {number} count 
         */
        this.SetRainDrawCount = function(count) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherRainDrawCount(count);
        };

        /**
         * 환경 날씨 비 그려지는 영역 설정
         * @param {VIZCore.BBox} bbox 
         */
        this.SetRainDrawArea = function(bbox) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherRainDrawArea(bbox);
        };

        /**
         * 환경 날씨 비 설정값 반환
         * @returns {*} 날씨 비 설정 파라미터
         */
         this.GetRainOpion = function() {
            if(scope.Main.IsVIZWide3DProduct())
                return undefined;

            return scope.Main.Renderer.GetWeatherRainOpion();
        };

        /**
         * 환경 날씨 비 설정값 적용
         * @param {*} opt : GetRainOpion()
         */
         this.SetRainOpion = function(opt) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherRainOpion(opt);
        };

        /**
         * 정의된 날씨(눈) 적용
         * @param {number} level 0 ~ 4 (0 = 맑음, 1 = 조금, 2 = 보통, 3 = 많음, 4 = 매우 많음 )
         */
        this.SetSnowTemplate = function(level) {

            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            if(level === 0) {
                scope.Main.Renderer.SetEnableWeatherSnow(false);

                scope.Main.Renderer.SetRepeatRender(false);
            }
            if(level === 1) {
                scope.Main.Renderer.SetEnableWeatherSnow(true);
                scope.Main.Renderer.SetWeatherSnowDrawCount(600);

                let opt = scope.Main.Renderer.GetWeatherSnowOpion();
                opt.size = 4000;
                opt.speed = 15;
                opt.angle = -5;
                scope.Main.Renderer.SetWeatherSnowOpion(opt);

                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 2) {
                scope.Main.Renderer.SetEnableWeatherSnow(true);
                scope.Main.Renderer.SetWeatherSnowDrawCount(1500);

                let opt = scope.Main.Renderer.GetWeatherSnowOpion();
                opt.size = 4000;
                opt.speed = 15;
                opt.angle = -5;
                scope.Main.Renderer.SetWeatherSnowOpion(opt);

                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 3) {
                scope.Main.Renderer.SetEnableWeatherSnow(true);
                scope.Main.Renderer.SetWeatherSnowDrawCount(2500);

                let opt = scope.Main.Renderer.GetWeatherSnowOpion();
                opt.size = 4000;
                opt.speed = 15;
                opt.angle = -5;
                scope.Main.Renderer.SetWeatherSnowOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 4) {
                scope.Main.Renderer.SetEnableWeatherSnow(true);
                scope.Main.Renderer.SetWeatherSnowDrawCount(5000);

                let opt = scope.Main.Renderer.GetWeatherSnowOpion();
                opt.size = 4000;
                opt.speed = 15;
                opt.angle = -5;
                scope.Main.Renderer.SetWeatherSnowOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
        };

        /**
         * 환경 날씨 눈 활성화
         * @param {boolean} enable 활성화/비활성화
         */
        this.EnableSnow = function (enable) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetEnableWeatherSnow(enable);
        };

        /**
         * 환경 날씨 눈 그려지는 수 설정
         * @param {number} count 
         */
        this.SetSnowDrawCount = function(count) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherSnowDrawCount(count);
        };


        /**
         * 환경 날씨 눈 그려지는 영역 설정
         * @param {VIZCore.BBox} bbox 
         */
        this.SetSnowDrawArea = function(bbox) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherSnowDrawArea(bbox);
        };

        /**
         * 환경 날씨 눈 설정값 반환
         * @returns {*} 날씨 눈 설정 파라미터
         */
         this.GetSnowOpion = function() {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return undefined;

            return scope.Main.Renderer.GetWeatherSnowOpion();
        };

        /**
         * 환경 날씨 눈 설정값 적용
         * @param {*} opt : GetSnowOpion()
         */
        this.SetSnowOpion = function(opt) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherSnowOpion(opt);
        };


        /**
         * 환경 날씨 구름 적용
         * @param {number} level : 0 ~ 4 (0 = 구름 없음, 1 = 조금, 2 = 보통, 3 = 많음, 4 = 흐린 구름 매우 많음 )
         */
        this.SetCloudTemplate = function (level) {
    
        if(scope.Main.IsVIZWide3DProduct() === false)
            return;

        if(level === 0) {
            scope.Main.Renderer.SetEnableWeatherCloud(false);

            scope.Main.Renderer.SetRepeatRender(false);
        }
        if(level === 1) {
            scope.Main.Renderer.SetEnableWeatherCloud(true);
            scope.Main.Renderer.SetWeatherCloudDrawCount(50);

            let opt = scope.Main.Renderer.GetWeatherCloudOpion();
            opt.size = 1000000;
            opt.speed = 10;
            opt.angle = 0;
            opt.color = new VIZCore.Color(240,240,240,150);
            scope.Main.Renderer.SetWeatherCloudOpion(opt);

            scope.Main.Renderer.SetRepeatRender(true);
        }
        if(level === 2) {
            scope.Main.Renderer.SetEnableWeatherCloud(true);
            scope.Main.Renderer.SetWeatherCloudDrawCount(70);

            let opt = scope.Main.Renderer.GetWeatherCloudOpion();
            //opt.size = 1000000;
            opt.size = 1200000;
            opt.speed = 15;
            opt.angle = 0;
            opt.color = new VIZCore.Color(240,240,240,200);
            scope.Main.Renderer.SetWeatherCloudOpion(opt);
            

            scope.Main.Renderer.SetRepeatRender(true);
        }
        if(level === 3) {
            scope.Main.Renderer.SetEnableWeatherCloud(true);
            scope.Main.Renderer.SetWeatherCloudDrawCount(120);

            let opt = scope.Main.Renderer.GetWeatherCloudOpion();
            opt.size = 1500000;
            opt.speed = 25;
            opt.angle = 0;
            opt.color = new VIZCore.Color(220,220,220,220);
            scope.Main.Renderer.SetWeatherCloudOpion(opt);
            
            scope.Main.Renderer.SetRepeatRender(true);
        }
        if(level === 4) {
            scope.Main.Renderer.SetEnableWeatherCloud(true);
            scope.Main.Renderer.SetWeatherCloudDrawCount(100);

            let opt = scope.Main.Renderer.GetWeatherCloudOpion();
            //opt.size = 3000000;
            opt.size = 2000000;
            opt.speed = 30;
            opt.angle = 0;
            //opt.color = new VIZCore.Color(120,120,120,255);
            opt.color = new VIZCore.Color(150,150,150,255);
            scope.Main.Renderer.SetWeatherCloudOpion(opt);
            
            scope.Main.Renderer.SetRepeatRender(true);
        }

        if(level === 5) {
            scope.Main.Renderer.SetEnableWeatherCloud(true);
            //scope.Main.Renderer.SetWeatherCloudDrawCount(1000);
            scope.Main.Renderer.SetWeatherCloudDrawCount(1000);

            let opt = scope.Main.Renderer.GetWeatherCloudOpion();
            opt.size = 3000000;
            //opt.size = 2100000;
            opt.speed = 20;
            opt.angle = 0;
            //opt.color = new VIZCore.Color(120,120,120,255);
            opt.color = new VIZCore.Color(240,240,240,10);
            scope.Main.Renderer.SetWeatherCloudOpion(opt);
            
            scope.Main.Renderer.SetRepeatRender(true);
        }
        };

        /**
         * 환경 날씨 구름 활성화
         * @param {boolean} enable 활성화/비활성화
         */
        this.EnableCloud = function (enable) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetEnableWeatherCloud(enable);
        };

        /**
         * 환경 날씨 구름 그려지는 수 설정
         * @param {number} count 
         */
        this.SetCloudDrawCount = function(count) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherCloudDrawCount(count);
        };


        /**
         * 환경 날씨 구름 그려지는 영역 설정
         * @param {VIZCore.BBox} bbox 
         */
        this.SetCloudDrawArea = function(bbox) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            scope.Main.Renderer.SetWeatherSnowCloudArea(bbox);
        };

        /**
         * 환경 날씨 구름 설정값 반환
         * @returns {*} 날씨 구름 설정 파라미터
         */
         this.GetCloudOpion = function() {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            return scope.Main.Renderer.GetWeatherCloudOpion();
        };

        /**
         * 환경 날씨 구름 설정값 적용
         * @param {*} opt : GetCloudOpion()
         */
        this.SetCloudOpion = function(opt) {
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;
            
                scope.Main.Renderer.SetWeatherCloudOpion(opt);
        };


        /**
         * 환경 날씨 안개 적용
         * @param {number} level  0 ~ 4 (0 = 없음, 1 = 연함, 2 = 보통, 3 = 짙음, 4 = 매우 짙음 )
         */
        this.SetMistTemplate = function (level) {
            // let szCloudName = "SH_MIST";
            // {
            //      //기존 안개 제거
            //      let ids = scope.Main.CustomObject.FindObjectByName(szCloudName, true);
            //      for(let i = 0 ; i < ids.length ; i++)
            //          scope.Main.CustomObject.DeleteObject(ids[i]);
 
            //      let matID = scope.Main.Material.FindMaterialFromName(szCloudName);
            //      if(matID >= 0) {
            //          scope.Main.Material.RemoveMaterial(matID);
            //      }
            // }
 
            // if(level === 1) {
            //      //연함
            //      let vNormal = new VIZCore.Vector3(0, 0, 1);
            //      let panelColor = new VIZCore.Color(255, 255, 255, 255);
                 
            //      let bbox = scope.Main.Interface.Object3D.GetBoundBox();

            //      let size1 = Math.abs(bbox.max.x - bbox.min.x);
            //      let size2 = Math.abs(bbox.max.y - bbox.min.y);

            //     //  size1 *= 2;
            //     //  size2 *= 3;

            //      let vCenter = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z + 1);
     
            //      let id = scope.Main.Interface.ShapeDrawing.AddPanel(vCenter, vNormal, size1, size2, panelColor);
            //      let customObj = scope.Main.CustomObject.GetObject(id);
            //      customObj.name = szCloudName;
 
            //      scope.Main.Interface.ShapeDrawing.EnableUseSelection([id], false);
     
            //      let cloudColor = new VIZCore.Color(255, 255, 255, 32);    
            //      let material = scope.Main.Interface.ShapeDrawing.Material.Add(szCloudName);
            //      scope.Main.Interface.ShapeDrawing.Material.SetColor(material, cloudColor);
            //      scope.Main.Interface.ShapeDrawing.Material.SetShader(material, VIZCore.Enum.SHADER_TYPES.HORIZONCLOUDS);
            //      let matUniform = scope.Main.Interface.ShapeDrawing.Material.GetUniformData(material);
     
            //      matUniform.u_Direction.value = new VIZCore.Vector3(-1, 0, 0);
     
            //      matUniform.u_Step.value = 10;    
            //      matUniform.u_Absorption.value = 0.7530725;
            //      matUniform.u_Frequency.value = 2.006434;
                 
            //      matUniform.u_Density.value = 0.00000028;
            //      matUniform.u_CoverageRatio.value = 0.70;
            //      matUniform.u_TimeSpeed.value = 0.00005;
 
            //      scope.Main.Interface.ShapeDrawing.Material.SetMaterial(id, material); 
            //  }
            //  else if(level === 2) {
            //      //보통
            //      let vNormal = new VIZCore.Vector3(0, 0, 1);
            //      let panelColor = new VIZCore.Color(255, 255, 255, 255);
                 
            //      let bbox = scope.Main.Interface.Object3D.GetBoundBox();
     
            //      let size1 = Math.abs(bbox.max.x - bbox.min.x);
            //      let size2 = Math.abs(bbox.max.y - bbox.min.y);
            //     //  size1 *= 2;
            //     //  size2 *= 3;
            //      let vCenter = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z + 1);
     
            //      let id = scope.Main.Interface.ShapeDrawing.AddPanel(vCenter, vNormal, size1, size2, panelColor);
            //      let customObj = scope.Main.CustomObject.GetObject(id);
            //      customObj.name = szCloudName;
 
            //      scope.Main.Interface.ShapeDrawing.EnableUseSelection([id], false);
     
            //      let cloudColor = new VIZCore.Color(255, 255, 255, 48);    
            //      let material = scope.Main.Interface.ShapeDrawing.Material.Add(szCloudName);
            //      scope.Main.Interface.ShapeDrawing.Material.SetColor(material, cloudColor);
            //      scope.Main.Interface.ShapeDrawing.Material.SetShader(material, VIZCore.Enum.SHADER_TYPES.HORIZONCLOUDS);
            //      let matUniform = scope.Main.Interface.ShapeDrawing.Material.GetUniformData(material);
     
            //      matUniform.u_Direction.value = new VIZCore.Vector3(-1, 0, 0);
     
            //      matUniform.u_Step.value = 10;    
            //      matUniform.u_Absorption.value = 0.7530725;
            //      matUniform.u_Frequency.value = 2.006434;
                 
            //      matUniform.u_Density.value = 0.00000028;
            //      matUniform.u_CoverageRatio.value = 0.74;
            //      matUniform.u_TimeSpeed.value = 0.00005;
 
                 
            //      scope.Main.Interface.ShapeDrawing.Material.SetMaterial(id, material);
 
            //  }
            //  else if(level === 3) {
            //      //짙음
            //      let vNormal = new VIZCore.Vector3(0, 0, 1);
            //      let panelColor = new VIZCore.Color(255, 255, 255, 255);
                 
            //      let bbox = scope.Main.Interface.Object3D.GetBoundBox();
     
            //      let size1 = Math.abs(bbox.max.x - bbox.min.x);
            //      let size2 = Math.abs(bbox.max.y - bbox.min.y);
            //     //  size1 *= 2;
            //     //  size2 *= 3;
            //      let vCenter = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z + 1);
     
            //      let id = scope.Main.Interface.ShapeDrawing.AddPanel(vCenter, vNormal, size1, size2, panelColor);
            //      let customObj = scope.Main.CustomObject.GetObject(id);
            //      customObj.name = szCloudName;
 
            //      scope.Main.Interface.ShapeDrawing.EnableUseSelection([id], false);
     
            //      let cloudColor = new VIZCore.Color(255, 255, 255, 64);
            //      let material = scope.Main.Interface.ShapeDrawing.Material.Add(szCloudName);
            //      scope.Main.Interface.ShapeDrawing.Material.SetColor(material, cloudColor);
            //      scope.Main.Interface.ShapeDrawing.Material.SetShader(material, VIZCore.Enum.SHADER_TYPES.HORIZONCLOUDS);
            //      let matUniform = scope.Main.Interface.ShapeDrawing.Material.GetUniformData(material);
     
            //      matUniform.u_Direction.value = new VIZCore.Vector3(-1, 0, 0);
     
            //      matUniform.u_Step.value = 10;    
            //      matUniform.u_Absorption.value = 0.7530725;
            //      matUniform.u_Frequency.value = 2.006434;
                 
            //      matUniform.u_Density.value = 0.00000028;
            //      matUniform.u_CoverageRatio.value = 0.76;
            //      matUniform.u_TimeSpeed.value = 0.00005;
 
                 
            //      scope.Main.Interface.ShapeDrawing.Material.SetMaterial(id, material);
            //  }
            //  else if(level === 4) {
            //      //매우 짙음
 
            //      let vNormal = new VIZCore.Vector3(0, 0, 1);
            //      let panelColor = new VIZCore.Color(255, 255, 255, 255);
                 
            //      let bbox = scope.Main.Interface.Object3D.GetBoundBox();
     
            //      let size1 = Math.abs(bbox.max.x - bbox.min.x);
            //      let size2 = Math.abs(bbox.max.y - bbox.min.y);
            //     //  size1 *= 2;
            //     //  size2 *= 3;
            //      let vCenter = new VIZCore.Vector3(bbox.center.x, bbox.center.y, bbox.max.z + 1);
     
            //      let id = scope.Main.Interface.ShapeDrawing.AddPanel(vCenter, vNormal, size1, size2, panelColor);
            //      let customObj = scope.Main.CustomObject.GetObject(id);
            //      customObj.name = szCloudName;
 
            //      scope.Main.Interface.ShapeDrawing.EnableUseSelection([id], false);
     
            //      //let cloudColor = new VIZCore.Color(128, 128, 128, 255);    
            //      let cloudColor = new VIZCore.Color(255, 255, 255, 100);
            //      let material = scope.Main.Interface.ShapeDrawing.Material.Add(szCloudName);
            //      scope.Main.Interface.ShapeDrawing.Material.SetColor(material, cloudColor);
            //      scope.Main.Interface.ShapeDrawing.Material.SetShader(material, VIZCore.Enum.SHADER_TYPES.HORIZONCLOUDS);
            //      let matUniform = scope.Main.Interface.ShapeDrawing.Material.GetUniformData(material);
     
            //      matUniform.u_Direction.value = new VIZCore.Vector3(-1, 0, 0);
     
            //      matUniform.u_Step.value = 10;    
            //      matUniform.u_Absorption.value = 0.7530725;
            //      matUniform.u_Frequency.value = 2.006434;
                 
            //      matUniform.u_Density.value = 0.00000028;
            //      matUniform.u_CoverageRatio.value = 0.78;
            //      matUniform.u_TimeSpeed.value = 0.0001;
                 
            //      scope.Main.Interface.ShapeDrawing.Material.SetMaterial(id, material);
            //  }

            if(scope.Main.IsVIZWide3DProduct() === false)
                return;

            if(level === 0) {
                scope.Main.Renderer.SetEnableWeatherMist(false);
    
                scope.Main.Renderer.SetRepeatRender(false);
            }
            if(level === 1) {
                scope.Main.Renderer.SetEnableWeatherMist(true);
                //scope.Main.Renderer.SetWeatherMistDrawCount(1000);
                scope.Main.Renderer.SetWeatherMistDrawCount(200);
    
                let opt = scope.Main.Renderer.GetWeatherMistOpion();
                opt.size = 1800000;
                //opt.size = 2100000;
                opt.speed = 10;
                opt.angle = 0;
                //opt.color = new VIZCore.Color(120,120,120,255);
                opt.color = new VIZCore.Color(240,240,240,2);
                scope.Main.Renderer.SetWeatherMistOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 2) {
                scope.Main.Renderer.SetEnableWeatherMist(true);
                //scope.Main.Renderer.SetWeatherMistDrawCount(1000);
                scope.Main.Renderer.SetWeatherMistDrawCount(200);
    
                let opt = scope.Main.Renderer.GetWeatherMistOpion();
                opt.size = 1800000;
                //opt.size = 2100000;
                opt.speed = 15;
                opt.angle = 0;
                //opt.color = new VIZCore.Color(120,120,120,255);
                opt.color = new VIZCore.Color(240,240,240,5);
                scope.Main.Renderer.SetWeatherMistOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 3) {
                scope.Main.Renderer.SetEnableWeatherMist(true);
                //scope.Main.Renderer.SetWeatherMistDrawCount(1000);
                scope.Main.Renderer.SetWeatherMistDrawCount(300);
    
                let opt = scope.Main.Renderer.GetWeatherMistOpion();
                opt.size = 1800000;
                //opt.size = 2100000;
                opt.speed = 20;
                opt.angle = 0;
                //opt.color = new VIZCore.Color(120,120,120,255);
                opt.color = new VIZCore.Color(240,240,240,10);
                scope.Main.Renderer.SetWeatherMistOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
            if(level === 4) {
                scope.Main.Renderer.SetEnableWeatherMist(true);
                //scope.Main.Renderer.SetWeatherMistDrawCount(1000);
                scope.Main.Renderer.SetWeatherMistDrawCount(400);
    
                let opt = scope.Main.Renderer.GetWeatherMistOpion();
                opt.size = 1800000;
                //opt.size = 2100000;
                opt.speed = 50;
                opt.angle = 0;
                //opt.color = new VIZCore.Color(120,120,120,255);
                opt.color = new VIZCore.Color(240,240,240,10);
                scope.Main.Renderer.SetWeatherMistOpion(opt);
                
                scope.Main.Renderer.SetRepeatRender(true);
            }
        };

        /**
         * 환경 날씨 거리에 따른 가시화 설정
         * @param {boorean} enable  활성화 / 비활성화
         * @param {number} distance  화면 1Pixel 당 거리
         */
        this.UseViewDistanceEffect = function(enable, distance){
            if(scope.Main.IsVIZWide3DProduct() === false)
                return;
            
            scope.Main.Renderer.UseViewDistanceEffect(enable, distance);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default Weather;