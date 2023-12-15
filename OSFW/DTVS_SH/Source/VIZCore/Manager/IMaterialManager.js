/**
 * VIZCore Material 인터페이스
 * @copyright © 2013 - 2023 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @param {Object} VIZCore parent Instance
 * @class
 */
 class Material {
    //materialClassType 0 == Object3D, 1 == ShapeDrawing
    constructor(main, VIZCore, parentInstance) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        
        /**
         * Material 추가
         * @param {String} materialName 
         * @returns {Number} materialID (생성 실패시 -1)
         */
        this.Add = function(materialName) {

            //외부 생성의 경우 
            //동일 이름 생성 불가
            let id = scope.Main.Material.FindMaterialFromName(materialName);
            if(id > 0) {
                return -1;
            }
            
            let item = scope.Main.Data.MaterialGLItem();
            item.name = materialName;
            item.key = materialName;
            return scope.Main.Material.AddMaterial(item);
        };

        // /**
        //  * Material 반환
        //  * @param {Number} id 
        //  */
        // this.Get = function (id) {

        // };

        /**
         * Material 여부 확인
         * @param {Number} id 
         * @returns 
         */
        this.IsMaterial = function(id) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return false;

            return true;
        };

        /**
         * 메테리얼 이름으로 검색
         * @param {String} materialName 
         * @returns {Number}materialID (생성 실패시 -1)
         */
        this.FindMaterialFromName = function(materialName) {
            return scope.Main.Material.FindMaterialFromName(materialName);
        };

        /**
         * Material 삭제
         * @param {Number} id 
         */
        this.Delete = function (id) {
            scope.Main.Material.RemoveMaterial(id);
        };

        /**
         * Material 색상 지정
         * @param {Number} id 
         * @param {VIZCore.Color} color 
         */
        this.SetColor = function (id, color) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return;

            mat.color = color;
        };

          /**
         * Material 색상 반환
         * @param {Number} id 
         * @returns {VIZCore.Color} color 
         */
        this.GetColor = function (id, color) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return undefined;

            return mat.color;
        };

         /**
         * Material Roughness 설정
         * @param {Number} id 
         * @param {Number} roughness 
         */
        this.SetRoughness = function (id, roughness) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return;

            mat.roughness = roughness;
        };

        /**
         * Material Roughness 반환
         * @param {Number} id 
         * @returns {Number} roughness
         */
        this.GetRoughness = function (id) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return 0;

            return mat.roughness;
        };

        /**
         * Material Metallic 설정
         * @param {Number} id 
         * @param {Number} metallic 
         */
        this.SetMetallic = function (id, metallic) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return;

            mat.metallic = metallic;
        };

        /**
         * Material Metallic 반환
         * @param {Number} id 
         * @returns {Number} metallic 
         */
        this.GetMetallic = function (id) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return 0;

            return mat.metallic;
        };

        /**
         * 지정한 Material에 Texture 설정
         * @param {Number} id 
         * @param {VIZCore.TEXTURE_TYPES} textureType 
         * @param {String} textureURL
         */
        this.SetTexture = function (id, textureType, textureURL) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return;

            let texItem = scope.Main.Data.TextureDataItem();
            texItem.itemType = textureType;
            texItem.downloading = true;
            texItem.URL = textureURL;

            let imageTextureSrc = new Image();
            //Failed to execute 'texImage2D' on 'WebGL2RenderingContext': The image element contains cross-origin data, and may not be loaded
            // 해당 이슈 수정
            imageTextureSrc.crossOrigin = "anonymous";
            //imageTextureSrc.src = encodeURIComponent(texItem.URL);
            imageTextureSrc.src = texItem.URL;
            imageTextureSrc.onload = function () {
                texItem.src = imageTextureSrc;
                texItem.width = imageTextureSrc.width;
                texItem.height = imageTextureSrc.height;
                texItem.downloading = false;
                scope.Main.Material.SetTexture(mat, texItem);

                console.log("[Shw3DCore] Material SetTexture :" + texItem.URL);
                scope.Main.ViewRefresh();
            };
            imageTextureSrc.onerror = function () {
                texItem.downloading = false;

                console.log("[Shw3DCore] Material SetTexture Error :" + texItem.URL);
            }
        };

        /**
         * 지정한 Material에 Texture 제거
         * @param {Number} id 
         * @param {VIZCore.TEXTURE_TYPES} textureType 
         */
        this.DeleteTexture = function (id, textureType) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return;

            scope.Main.Material.DeleteTexture(mat, textureType);
        };


        /**
         * 지정한 셰이더로 그리기 설정
         * @param {Number} id 
         * @param {VIZCore.Enum.SHADER_TYPES} shaderType  
         * @returns 
         */
        this.SetShader = function (id, shaderType) {
            scope.Main.Material.SetShader(id, shaderType);
            scope.Main.ViewRefresh();
        };

        /**
         * 기본값으로 그리기 설정
         * @param {Number} id 
         * @returns 
         */
        this.ClearShader = function (id) {
            scope.Main.Material.ClearShader(id);
            scope.Main.ViewRefresh();
        };

        /**
         * 설정 가능한 Material의 tag 설정
         * @param {Number} id 
         * @returns {Object}
         * 
         */
        this.GetUniformData = function (id) {
            let mat = scope.Main.Material.GetMaterial(id);
            if(mat === undefined) return undefined;
            return mat.tag;
        };

        //=======================================
        // Method::Object3D
        //=======================================

        //Object3D
        if(parentInstance.constructor.name.localeCompare("Object3D") === 0) {
            /**
             * 개체 Material 적용
             * @param {Array<Number>} ids Node ID Array
             * @param {Number} materialID 등록할 Material ID
             */
            this.SetMaterial = function(ids, materialID) {
                
                let mat = scope.Main.Material.GetMaterial(materialID);
                if(mat !== undefined)
                    scope.Main.Data.SetObjectMaterial(ids, materialID);
                else 
                    scope.Main.Data.SetObjectMaterial(ids, -1);

                scope.Main.ViewRefresh();
            };

            /**
             * 개체 Material 반환
             * @param {Number} id Node ID
             * @returns {Number} Material ID (찾지 못한 경우 -1)
             */
            this.GetMaterial = function(id) {
                return scope.Main.Data.GetObjectMaterial(id);
            };
            
            /**
             * 개체 Material 반환
             * @param {*} fileId file File ID
             * @param {Number} id Node ID
             * @returns {Number} Material ID (찾지 못한 경우 -1)
             */
             this.GetMaterialByOrigin = function(fileId, originId) {

                let id = scope.Main.Data.GetNodeID(fileId, originId);
                return scope.GetMaterial(id);
            };
        }
        //ShapeDrawing
        else if(parentInstance.constructor.name.localeCompare("ShapeDrawingManager") === 0) {
            /**
             * 개체 Material 적용
             * @param {Number} id 개체 ID
             * @param {Number} materialID 등록할 Material ID
             */
            this.SetMaterial = function(id, materialID) {
                let mat = scope.Main.Material.GetMaterial(materialID);

                if(mat !== undefined)
                    scope.Main.CustomObject.SetObjectMaterial(id, materialID);
                else 
                    scope.Main.CustomObject.SetObjectMaterial(id, -1);

                scope.Main.ViewRefresh();
            };

            /**
             * 개체 Material 반환
             * @param {Number} id 개체 ID
             * @returns {Number} Material ID (찾지 못한 경우 -1)
             */
             this.GetMaterial = function(id) {
                return scope.Main.CustomObject.GetObjectMaterial(id);
            };
        }
        

        //=======================================
        // Event
        //=======================================
    }
}

export default Material;