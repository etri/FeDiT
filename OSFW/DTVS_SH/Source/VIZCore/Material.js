/**
 * @author ssjo@softhills.net
 */

class Material {
    constructor(view, VIZCore) {

        // Private
        let scope = this;

        //download 관리
        this.MaterialFiles = [];

        //new Map(fileKey, new Map(objectURL, Array(materialsSrcItem)) )
        let loadingMaterialFiles = new Map(); //MeshBlock이 Material보다 다운로드 되어 다운로드 대기

        // setup Material
        let materialMap = new Map();            //(material ID, item)
        let materialFileSrcIDMap = new Map();   //new Map(fileID, new Map(src material ID, material ID)) //파일 다운로드 했을때 원본 ID와 변경된 ID        

        this.currentMaterial = undefined; // use currentMaterial
        let materialNum = 0; // Material 관리 생성번호
        

        /**
         * Uniform 등록 정보
         * @param {*} _value 
         * @param {String} _dataType : shader type = integer, float, vec3
         */
        this.GetUniformItem = function(_value, _dataType){
            let item = {
                value : _value,
                dataType : _dataType
            };
            return item;
        };

        /**
        * 코드 초기화
        */
        function init() {
        }
        init();

        //Material 제거
        this.Clear = function() {

            let keys = Array.from(materialMap.keys());
            for(let i = 0 ; i < keys.length ; i++) {
                scope.RemoveMaterial(keys[i]);
            }

            materialFileSrcIDMap.clear();
            loadingMaterialFiles.clear();

            scope.MaterialFiles = [];
            scope.currentMaterial = undefined;
            materialNum = 0;
        };

        //#region Material Process

        /**
        * Map에 Material 등록
        * @param {Data.MaterialGLItem} item: Data.MaterialGLItem
        * @returns {Number} 등록된 id
        */
        this.AddMaterial = function (item, fileSrc) {
            if (item.id === 0) {
                //자동 등록 id
                //let findID = scope.FindMaterial(item.color, item.roughness, item.metallic, item.diffuseSrc, item.normalSrc);
                let findID = scope.FindMaterialFromItem(item);
                if (findID > 0) {
                    //등록 되어있음
                    return findID;
                }

                //신규 id 생성
                let currentID = materialNum + 1;
                while (materialMap.has(currentID)) {
                    currentID++;
                }

                item.id = currentID;
            }

            let srcID = item.id;
            if (materialMap.has(item.id)) {
                //중복 id 방지
                let currentID = materialNum + 1;
                while (materialMap.has(currentID)) {
                    currentID++;
                }
                item.id = currentID;
            }

            //파일별 Src ID 등록
            if(fileSrc !== undefined) {
                let materialSrcID = undefined;
                if(materialFileSrcIDMap.has(fileSrc)) {
                    materialSrcID = materialFileSrcIDMap.get(fileSrc);
                }
                else{
                    materialSrcID = new Map();
                    materialFileSrcIDMap.set(fileSrc, materialSrcID);
                }

                materialSrcID.set(srcID, item.id);
            }

            materialMap.set(item.id, item);
            materialNum = Math.max(item.id, materialNum);
            return item.id;
        };

        /**
         * MeshBlock이 Material보다 다운로드 되어 등록 대기
         * 로딩 대기         
         * @param {string} fileKey header key
         * @param {number} srcID file에 등록된 Material src ID
         * @param {string} objectURL 형상 개체 url
         */
        this.AddLoadingMaterial = function (fileKey, srcID, objectURL, objectIdx) {

            let fileKeyMap = undefined;
            let materialsSrcID = undefined;

            //header key 검토
            if(loadingMaterialFiles.has(fileKey)) {
                fileKeyMap = loadingMaterialFiles.get(fileKey);
            }
            else{
                fileKeyMap = new Map();
                loadingMaterialFiles.set(fileKey, fileKeyMap);
            }

            //형상 key 등록
            if(fileKeyMap.has(objectURL)) {
                materialsSrcID = fileKeyMap.get(objectURL);
            }
            else{
                materialsSrcID = [];
                fileKeyMap.set(objectURL, materialsSrcID);
            }

            let materialsSrcItem = function(srcID, idx) {
                let item = {
                    srcID : srcID,
                    objectIdx : idx
                };
                return item;
            };

            //materialsSrcID.push(srcID);
            materialsSrcID.push(materialsSrcItem(srcID, objectIdx));
        };

        /**
         * Material 보다 빨리 갱신된 형상 등록
         * @param {string} fileKey header key
         */
        this.UpdateLoadingMaterial = function (fileKey) {

            if(!loadingMaterialFiles.has(fileKey)) return;            
            let fileSrcMap = loadingMaterialFiles.get(fileKey);

            let materialsSrcUpdateProcess = function(materialsSrcItem, objectURL, map){

                //let materialsSrcID = value.get(objectURL);
                
                //srcID와 objects 배열의 순서대로 데이터 적용
                //for(let i = materialsSrcID.length - 1; i >= 0 ; i--)
                {
                    // let materialItem = scope.GetMaterialBySrcID(fileKey, materialsSrcID[i]);
                    // if(materialItem === undefined) continue;

                    //let objects = view.Data.ObjectMap.get(objectURL);

                    //let objects = view.Data.ModelFileManager.GetFileAreaData(fileKey, objectURL);
                    let fileAreaData = view.Data.ModelFileManager.GetFileAreaData(fileKey, objectURL);
                    if(fileAreaData === undefined) return;
                    let objects = fileAreaData.objects;

                    if(objects === undefined) return;

                    for(let j = 0 ; j < materialsSrcItem.length ; j++) {
                        if(materialsSrcItem[j].objectIdx >= objects.length) continue;

                        let object = objects[materialsSrcItem[j].objectIdx];

                        //해당 material 다운로드가 도중 완료 됨
                        //if(j >= materialsSrcItem.length) break;

                        let materialItem = scope.GetMaterialBySrcID(fileKey, materialsSrcItem[j].srcID);
                        if(materialItem === undefined) continue;

                        for(let k = 0 ; k < object.tag.length ; k++) {
                            let body = object.tag[k];

                            //body.action.material = materialItem.id;

                            //let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                            //action.material = materialItem.id;
                            if(body.material === 0)
                                body.material = materialItem.id;
                        }
                        object.flag.updateProcess = true;
                    }
                }
            };
            
            fileSrcMap.forEach(materialsSrcUpdateProcess);

            //등록된 개체 제거
            loadingMaterialFiles.delete(fileKey);

            //로딩 대기된 개체들 새로 그리기필요
            view.MeshBlock.Reset();
            view.Renderer.Render();

        };

        /**
         * Material에 등록된 텍스쳐 생성
         * @param {Data.MaterialGLItem} item 
         */
        this.UpdateMaterialTexture = function(item) {

            //Texture
            for (let i = 0; i < item.textureData.length; i++) {

                let texItem = item.textureData[i];

                if(texItem.texture !== null) continue;

                if (texItem.width <= 0 && texItem.hegith <= 0)
                    continue;
                if (texItem.src === undefined)
                    continue;

                //if(texItem.name.localeCompare("BaseColor_E3_Opacity_E3_alpha_Map__38.png") ===0)
                //    console.log("");

                switch (texItem.itemType) {
                    case VIZCore.Enum.TEXTURE_TYPES.DIFFUSE:
                        {
                            //diffuse Texture 생성

                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            //view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA,
                            //    mat.diffuseWidth, mat.diffuseHeight, 0,
                            //    view.gl.RGBA, view.gl.UNSIGNED_BYTE, new Uint8Array(mat.diffuseSrc));

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image
                    
                            //LINEAR_MIPMAP_NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;
                    case VIZCore.Enum.TEXTURE_TYPES.NORMAL:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image

                            
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;

                    case VIZCore.Enum.TEXTURE_TYPES.BUMP:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image
                            
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;

                    case VIZCore.Enum.TEXTURE_TYPES.ROUGHNESS:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image
                            
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;

                    case VIZCore.Enum.TEXTURE_TYPES.METALNESS:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image

                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;

                    case VIZCore.Enum.TEXTURE_TYPES.SPECLUAR:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image

                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;

                        case VIZCore.Enum.TEXTURE_TYPES.AMBIENT:
                            {
                                const targetTexture = view.gl.createTexture();
                                view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);
    
                                view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image
    
                                view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                                view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                                view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                                view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                                view.gl.generateMipmap(view.gl.TEXTURE_2D);
    
                                texItem.texture = targetTexture;
                                view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                            }
                            break;
                    case VIZCore.Enum.TEXTURE_TYPES.OPACITY:
                        {
                            const targetTexture = view.gl.createTexture();
                            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

                            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, texItem.src); //Image
                            
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR_MIPMAP_NEAREST); //view.gl.LINEAR NEAREST
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.REPEAT);
                            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.REPEAT);
                            view.gl.generateMipmap(view.gl.TEXTURE_2D);

                            texItem.texture = targetTexture;
                            view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                        }
                        break;
                }

            }
        };

        /**
         * Material에 등록된 텍스쳐 다운로드 완료 여부 확인
         * @param {Number} id: Material id
         */
        this.IsFinishMaterialTextureDownalodByID = function (id) {

            if(id < 0)
                return true;

            let item = view.Material.GetMaterial(id);
            return scope.IsFinishMaterialTextureDownalod(item);
        };

        /**
         * Material에 등록된 텍스쳐 다운로드 완료 여부 확인
         * @param {Data.MaterialGLItem} item 
         */
        this.IsFinishMaterialTextureDownalod = function(item) {
            
            if(item === undefined)
                return false;
            
            let bFinish = true;

            //Texture
            for (let i = 0; i < item.textureData.length; i++) {

                let texItem = item.textureData[i];

                if(texItem.texture !== null) continue;

                if (texItem.width <= 0 && texItem.hegith <= 0)
                    continue;
                    
                if (texItem.src === undefined)
                    continue;

                //다운로드 중
                if(texItem.downloading) {
                    bFinish = false;
                    break;
                }

                //texItem 경로는 지정되어있으나 texture를 불러오지 못한 경우...
            }
            return bFinish;
        };

        /**
        * Map 등록된 Material 제거
        * @param {Number} id: Material id
        */
        this.RemoveMaterial = function (id) {
            if (materialMap.has(id)) {

                let mat = materialMap.get(id);
                //GL 제거
                for(let i = 0 ; i < mat.textureData.length; i++) {
                    let texItem = mat.textureData[i];
                    if(texItem.texture === null) continue;

                    view.gl.deleteTexture(texItem.texture);
                }

                materialMap.delete(id);
            }
        };

        /**
         * Material 제거
         * @param {String} fileKey File Key
         */
        this.RemoveMaterialByFile = function (fileKey) {
            let removeIds = [];

            let getRemoveMaterials = function(value, key, map) {
                //if(value.key.localeCompare(fileKey) !== 0) return;
                if(!view.Util.EqualDataTypeValue(fileKey, value.key)) return;

                removeIds.push(value.id);
            };
            
            materialMap.forEach(getRemoveMaterials);

            loadingMaterialFiles.delete(fileKey);
            materialFileSrcIDMap.delete(fileKey);

            for(let i = 0; i < removeIds.length ; i++) {
                scope.RemoveMaterial(removeIds[i]);
            };
        };

        /**
        * Material 반환
        * @param {Number} id : id
        * @returns {Data.MaterialGLItem} item (failed === undefined)
        */
        this.GetMaterial = function (id) {
            return materialMap.get(id);
        };

        /**
         *  Material Alpha Texture 여부 확인
         * @param {Number} id 
         * @returns {Boolean} true : 사용, false : 미사용
         */
        this.IsAlphaMaterial = function (id) {
            let item = scope.GetMaterial(id);
            if(item !== undefined)
            {
                for (let i = 0; i < item.textureData.length; i++) {
                    let texItem = item.textureData[i];
                    if(texItem.itemType === VIZCore.Enum.TEXTURE_TYPES.OPACITY)
                        return true;
                }

                return item.isAlpha;
            }

            return false;
        }

        
       /**
        *  Material 반환
        * @param {*} fileSrc 
        * @param {Number} srcID 원본 ID
        * @returns {Data.MaterialGLItem} item (failed === undefined)
        */
        this.GetMaterialBySrcID = function (fileSrc, srcID) {
            
            //파일 원본 ID 로 검색
            if(materialFileSrcIDMap.has(fileSrc)) {
                let materialSrcID = materialFileSrcIDMap.get(fileSrc);
                if(materialSrcID !== undefined) {
                    //신규 ID
                    let materialID = materialSrcID.get(srcID);
                    if(materialID !== undefined)
                        return scope.GetMaterial(materialID);
                }
            }
            return undefined;
        };

        /**
         * 등록된 Material 중 이름 검색
         * @param {String} szName 
         * @returns id (-1 === Failed)
         */
        this.FindMaterialFromName = function (szName) {

            let currentID = -1;

            let findItem = function (value, key, map) {
                //value == 등록된 Item

                if (currentID > 0)
                    return;

                if(value.name.localeCompare(szName) !== 0) return;
                
                currentID = value.id;
            };

            materialMap.forEach(findItem);

            return currentID;
        };

        /**
        * 등록된 Material 중 동일한 데이터 존재 확인 및 id 반환
        * @param {Data.MaterialGLItem()} materialGLItem : item
        * @returns {Number} id (-1 === Failed)
        */
        this.FindMaterialFromItem = function (materialGLItem) {
            let currentID = -1;

            let findItem = function (value, key, map) {
                //value == 등록된 Item

                if (currentID > 0)
                    return;

                //if (value.key.localeCompare(materialGLItem.key) !== 0)
                if(!view.Util.EqualDataTypeValue(value.key, materialGLItem.key))
                    return;

                if (value.shaderType !== materialGLItem.shaderType)
                    return;

                // if (value.roughness !== materialGLItem.roughness)
                //     return;
                // if (value.metallic !== materialGLItem.metallic)
                //     return;
                if (value.shiness !== materialGLItem.shiness)
                    return;
                if (value.reflectivity !== materialGLItem.reflectivity)
                    return;
                if (value.transparencyFactor !== materialGLItem.transparencyFactor)
                    return;

                if (value.color.equals(materialGLItem.color) === false)
                    return;

                if (value.ambient !== materialGLItem.ambient)
                    return;

                if (value.ambient !== undefined && materialGLItem.ambient !== undefined) {
                    if (value.ambient.equals(materialGLItem.ambient) === false)
                        return;
                }

                if (value.specular !== materialGLItem.specular)
                    return;
                if (value.specular !== undefined && materialGLItem.specular !== undefined) {
                    if (value.specular.equals(materialGLItem.specular) === false)
                        return;
                }

                if (value.emissive !== materialGLItem.emissive)
                    return;
                if (value.emissive !== undefined && materialGLItem.emissive !== undefined) {
                    if (value.emissive.equals(materialGLItem.emissive) === false)
                        return;
                }

                if (value.textureData.length !== materialGLItem.textureData.length)
                    return;

                for (let i = 0; i < value.textureData.length; i++) {
                    let stdTexture = value.textureData[i];
                    let trgTexture = materialGLItem.textureData[i];

                    if (stdTexture.width !== trgTexture.width)
                        return;
                    if (stdTexture.height !== trgTexture.height)
                        return;
                    if (stdTexture.itemType !== trgTexture.itemType)
                        return;
                    if (stdTexture.itemType !== trgTexture.itemType)
                        return;
                    if (stdTexture.tiling.equals(trgTexture.tiling) === false)
                        return;
                    if (stdTexture.offset.equals(trgTexture.offset) === false)
                        return;

                    if (stdTexture.uvChanel !== trgTexture.uvChanel)
                        return;
                    if (stdTexture.name !== trgTexture.name)
                        return;
                    if (stdTexture.URL !== trgTexture.URL)
                        return;
                }
                
                if(value.tag !== undefined && materialGLItem.tag !== undefined) {
                    let valTaglist = [];
                    let compareTaglist = [];

                    for (const [hKey, valObj] of Object.entries(value.tag)) {
                        let szKey = String(hKey);
                        valTaglist.push([szKey, valObj]);
                    }
                    for (const [hKey, valObj] of Object.entries(materialGLItem.tag)) {
                        let szKey = String(hKey);
                        compareTaglist.push([szKey, valObj]);
                    }

                    if(valTaglist.length !== compareTaglist.length) return;
                    
                    //tag 정보 비교 후 다른 경우 return
                    for(let i = 0 ; i < valTaglist.length ; i++) {
                        if(valTaglist[i][0].localeCompare(compareTaglist[i][0]) !== 0) //key
                            return;
                        if(valTaglist[i][1].value !== compareTaglist[i][1].value) //value
                            return;
                        if(valTaglist[i][1].dataType.localeCompare(compareTaglist[i][1].dataType) !== 0) //value dataType
                            return;
                    }
                    //검사 완료

                }
                else if(value.tag === undefined && materialGLItem.tag !== undefined){
                    return;
                }
                else if(value.tag !== undefined && materialGLItem.tag === undefined){
                    return;
                }

                currentID = value.id;
            };

            materialMap.forEach(findItem);

            return currentID;
        };

        /**
         * 지정한 셰이더로 그리기 설정
         * @param {Number} id 
         * @param {VIZCore.Enum.SHADER_TYPES} shaderType  
         */
        this.SetShader = function(id, shaderType) {
            let mat = scope.GetMaterial(id);
            if(mat === undefined) return;

            mat.shaderType = shaderType;

            //기본 정보 등록
            scope.InitMaterialUniform(mat);
        };

        /**
         * 기본값으로 그리기 설정
         * @param {Number} id 
         */
        this.ClearShader = function (id) {
            let mat = scope.GetMaterial(id);
            if(mat === undefined) return;

            mat.shaderType = VIZCore.Enum.SHADER_TYPES.NONE;
            scope.InitMaterialUniform(mat);
        };

        /**
        * 지정한 Shader 에 대한 Material Uniform 초기화
        * @param {Data.MaterialGLItem()} materialGLItem : item
        * @returns {Number} id (-1 === Failed)
        */
        this.InitMaterialUniform = function(materialGLItem) {
            if(materialGLItem === undefined) return;

            materialGLItem.tag = scope.GetDefaultUniform(materialGLItem.shaderType);
        };

        /**
         * 해당 셰이더의 Uniform 초기 값 반환
         * @param {VIZCore.Enum.SHADER_TYPES} shaderType 
         * @returns {Object} 
         */
        this.GetDefaultUniform = function(shaderType) {

            if(shaderType === VIZCore.Enum.SHADER_TYPES.PBR ||
                shaderType === VIZCore.Enum.SHADER_TYPES.ANIMATIONPBR) {
                return {
                    u_Roughness : scope.GetUniformItem(0.5, "float"),
                    u_Metallic : scope.GetUniformItem(0.1, "float"),
                };
            }
            else if(shaderType === VIZCore.Enum.SHADER_TYPES.HORIZONCLOUDS) {
                return {
                    u_Direction : scope.GetUniformItem(new VIZCore.Vector3(1, 1, 1), "vec3"),
                    u_Frequency : scope.GetUniformItem(2.06434, "float"),
                    u_Absorption : scope.GetUniformItem(0.730725, "float"),
                    u_Thickness : scope.GetUniformItem(12.0, "float"),
                    u_CoverageRatio : scope.GetUniformItem(1.0, "float"), //0 ~ 1
                    u_Density : scope.GetUniformItem(1.0, "float"), //0.052242

                    u_Step : scope.GetUniformItem(15, "integer"),
                    u_TimeSpeed : scope.GetUniformItem(1.0, "float")
                };
            }
            
            return undefined;
        };

      
        /**
         * 해당 TextureType 등록 여부 확인
         * @param {Data.MaterialGLItem} materialGLItem 
         * @param {VIZCore.TEXTURE_TYPES} textureType 
         * @returns 0 보다 작으면 해당 textureType 존재 하지 않음
         */
        this.FindTextureFromType = function (materialGLItem, textureType){

            for(let i = 0 ; i < materialGLItem.textureData.length ; i++) {
                let item = materialGLItem.textureData[i];
                if(item.itemType !== texItem.itemType) continue;

                return i;
            }

            return -1;
        }

        /**
         * Texture 등록
         * @param {Data.MaterialGLItem} materialGLItem 
         * @param {Data.TextureDataItem} texItem 
         */
        this.SetTexture = function (materialGLItem, texItem) {

            let findTexture = scope.FindTextureFromType(materialGLItem, texItem.itemType);
            if(findTexture < 0)
                materialGLItem.textureData.push(texItem);
            else
                materialGLItem.textureData[findTexture] = texItem;
        };

        /**
         * Texture 제거
         * @param {Data.MaterialGLItem} materialGLItem 
         * @param {VIZCore.TEXTURE_TYPES} textureType 
         */
        this.DeleteTexture = function (materialGLItem, textureType) {
            let findTexture = scope.FindTextureFromType(materialGLItem, textureType);
            if(findTexture < 0) return;

            if(materialGLItem.textureData[findTexture].texture !== null) {
                view.gl.deleteTexture(materialGLItem.textureData[findTexture].texture);
            }

            materialGLItem.textureData.splice(findTexture, 1);
        };


        //#endregion Material Process
    }
}

export default Material;