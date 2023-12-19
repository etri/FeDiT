/**
 * VIZCore Model File 관리 모듈
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @param {Object} view View.js Instance
 * @param {Object} VIZCore ValueObject.js Instance
 * @class
 */
class ModelFileManager {
    constructor(view, VIZCore) {
        let scope = this;

        // 파일 별 Url 관리
        //Key: File Header Key, value : Data.FileInfoItem
        // map.forEach 잦은 호출 속도 개선을 위해 Array로 변경
        //this.FileInfoMap = new Map();  //Header Key, []

        this.ListFileInfoItem = [];  //Array<Data.FileInfoItem>
        this.FileInfoIdxMap = new Map();  //Header Key, ListFileInfoItem idx
        

        this.LODDownloadMap = new Map(); // LOD 데이터 다운로드 목록 관리
        // 20230425 추가
        this.HeaderDownloadMap = new Map(); // 헤더 파일 다운로드 목록 관리
        this.StructureDownloadMap = new Map(); // 구조 정보 파일 다운로드 목록 관리
        this.PropertyDownloadMap = new Map(); // 속성 정보 파일 다운로드 목록 관리
        this.LineDownloadMap = new Map(); // Line 정보 파일 다운로드 목록 관리
        this.PMIDownloadMap = new Map(); // PMI 정보 파일 다운로드 목록 관리

        //All node List 관리
        this.listNodeID = []; //  index, id
        this.listIndexByID = []; //id, index
        this.listDataOffset = [];   //index, offset

        this.FileType = {
            Header : 100,
            Structure : 21,
            Property : 30,
            Material : 50,
            Mesh : 42,
            Line : 48,
            PMI : 49
        };

        // 파일 다운로드 완료 이벤트 상태
        this.DownloadEventStatus = {
            Header : false,
            Structure : false,
            Property : false,
            Material : false,
            Line : false,
            PMI : false
        };

        //Data.FileInfoItem 
        //하위 URL 및 Tree 정보 등록

        //22.12.09  더 이상 사용하지 않음
        //this.LODDownloadMap = new Map(); // LOD 데이터 다운로드 목록 관리
        //this.LODMap = new Map();  //다운로드 완료된 LOD Object 관리
        //this.LODMeshMap = new Map(); // 구조 정보 로딩 후 AreaMap에 추가될 목록 관리

        //22.12.09  더 이상 사용하지 않음
        //scope.FileInfoMap Mesh 데이터로 이동
        ///this.AreaListMap

        //영역별 리스트 > 22.12.09 더 이상 사용하지 않음
        ///this.AreaListMap = new Map(); 

        //더 이상 사용하지 않음
        ///this.AreaMap = new Map();

        ///this.AreaSequenceMap = new Map(); // 가시화 판별 맵
        ///this.AreaCacheMap = new Map(); // 캐쉬 관리 맵

        function getDownloadMap(fileType)
        {
            let map = undefined;
            if(fileType === scope.FileType.Header)
            {
                map = scope.HeaderDownloadMap;
            }
            else if(fileType === scope.FileType.Structure)
            {
                map = scope.StructureDownloadMap;
            }
            else if(fileType === scope.FileType.Property)
            {
                map = scope.PropertyDownloadMap;
            }
            else if(fileType === scope.FileType.Mesh)
            {
                map = scope.LODDownloadMap;
            }
            else if(fileType === scope.FileType.Line)
            {
                map = scope.LineDownloadMap;
            }
            else if(fileType === scope.FileType.PMI)
            {
                map = scope.PMIDownloadMap;
            }
            return map;
        }

        // header : 100, structure : 21, property : 30
        // Status : None(0), Downloading(1), Completed(2), Cancel(3)
        this.IsDownloading = function(fileType){
            let isDownloading = false;
            let map = undefined;
            let check = function (value, key, map) {
                if (value.Status === 1) {
                    isDownloading = true;
                }
                if(value.Status === 3) {
                    console.log("Status :: ", value);
                }
            };
            map = getDownloadMap(fileType);

            // if(fileType === scope.FileType.Header)
            // {
            //     map = scope.HeaderDownloadMap;
            // }
            // else if(fileType === scope.FileType.Structure)
            // {
            //     map = scope.StructureDownloadMap;
            // }
            // else if(fileType === scope.FileType.Property)
            // {
            //     map = scope.PropertyDownloadMap;
            // }
            // else if(fileType === scope.FileType.Mesh)
            // {
            //     map = scope.LODDownloadMap;
            // }

            map.forEach(check);

            return isDownloading;
        };

        this.DownloadingCount = function(fileType){
            let isDownloading = false;
            let map = undefined;
            let cnt = 0;
            let check = function (value, key, map) {
                if (value.Status === 1) {
                    isDownloading = true;
                    cnt++;
                }
                if(value.Status === 3) {
                    console.log("Status :: ", value);
                }
            };

            map = getDownloadMap(fileType);
            // if(fileType === scope.FileType.Header)
            // {
            //     map = scope.HeaderDownloadMap;
            // }
            // else if(fileType === scope.FileType.Structure)
            // {
            //     map = scope.StructureDownloadMap;
            // }
            // else if(fileType === scope.FileType.Property)
            // {
            //     map = scope.PropertyDownloadMap;
            // }
            // else if(fileType === scope.FileType.Mesh)
            // {
            //     map = scope.LODDownloadMap;
            // }

            map.forEach(check);

            return cnt;
        };

        this.GetDownloadFile = function(fileType){
            let item = undefined;
            let map = undefined;
            map = getDownloadMap(fileType);
            // if(fileType === scope.FileType.Header)
            // {
            //     map = scope.HeaderDownloadMap;
            // }
            // else if(fileType === scope.FileType.Structure)
            // {
            //     map = scope.StructureDownloadMap;
            // }
            // else if(fileType === scope.FileType.Property)
            // {
            //     map = scope.PropertyDownloadMap;
            // }
            // else if(fileType === scope.FileType.Mesh)
            // {
            //     map = scope.LODDownloadMap;
            // }

            let getItem = function (value, key, map) {
                if(value.Status === 0)
                if(item === undefined)
                    item = value;
            };

            map.forEach(getItem);

            return item;
        };

        this.GetDownloadCurrentFile = function(fileType){
            let item = undefined;
            let map = undefined;
            map = getDownloadMap(fileType);
            // if(fileType === scope.FileType.Header)
            // {
            //     map = scope.HeaderDownloadMap;
            // }
            // else if(fileType === scope.FileType.Structure)
            // {
            //     map = scope.StructureDownloadMap;
            // }
            // else if(fileType === scope.FileType.Property)
            // {
            //     map = scope.PropertyDownloadMap;
            // }
            // else if(fileType === scope.FileType.Mesh)
            // {
            //     map = scope.LODDownloadMap;
            // }

            let getItem = function (value, key, map) {
                if(value.Current === true)
                if(item === undefined)
                    item = value;
            };

            map.forEach(getItem);

            return item;
        };

        this.DeleteDownloadFile = function(data){
            let map = undefined;
            let del = function (value, key, map) {
                if (value.ID.localeCompare(data.ID) === 0) {
                    map.delete(key);
                }
            };

            try{
                map = getDownloadMap(data.DataType);
                // if(data.DataType === scope.FileType.Header)
                // {
                //     map = scope.HeaderDownloadMap;
                // }
                // else if(data.DataType === scope.FileType.Structure)
                // {
                //     map = scope.StructureDownloadMap;
                // }
                // else if(data.DataType === scope.FileType.Property)
                // {
                //     map = scope.PropertyDownloadMap;
                // }
                // else if(data.DataType === scope.FileType.Mesh)
                // {
                //     map = scope.LODDownloadMap;
                // }

    
                map.forEach(del);
            }
            catch(e)
            {
                console.log(e);
            }
            
        };

        /**
         * 다운로드 목록 FileKey 기준 제거
         * @param {*} fileKey 
         */
        this.DeleteDownloadFileByFileKey = function (fileKey) {

            let del = function (value, key, map) {   

                if(!view.Util.EqualDataTypeValue(value.Key, fileKey)) return;

                value.Status = 3;

                map.delete(key);
            };

            scope.HeaderDownloadMap.forEach(del);
            scope.StructureDownloadMap.forEach(del);
            scope.PropertyDownloadMap.forEach(del);
            scope.LineDownloadMap.forEach(del);
            scope.PMIDownloadMap.forEach(del);

            scope.DownloadEventStatus = {
                Header : false,
                Structure : false,
                Property : false,
                Material : false,
                Line : false,
                PMI : false
            };
        };

        this.IsDownloadFile = function(fileType){
            let map = undefined;
            map = getDownloadMap(fileType);
            // if(fileType === scope.FileType.Header)
            // {
            //     map = scope.HeaderDownloadMap;
            // }
            // else if(fileType === scope.FileType.Structure)
            // {
            //     map = scope.StructureDownloadMap;
            // }
            // else if(fileType === scope.FileType.Property)
            // {
            //     map = scope.PropertyDownloadMap;
            // }
            // else if(fileType === scope.FileType.Mesh)
            // {
            //     map = scope.LODDownloadMap;
            // }

            if(map.size > 0)
                return true;
            else
                return false;
        };

        this.GetDownloadEventStatus = function(fileType){
            if(fileType === scope.FileType.Header)
            {
                return scope.DownloadEventStatus.Header;
            }
            else if(fileType === scope.FileType.Structure)
            {
                return scope.DownloadEventStatus.Structure;
            }
            else if(fileType === scope.FileType.Property)
            {
                return scope.DownloadEventStatus.Property;
            }
            else if(fileType === scope.FileType.Line)
            {
                return scope.DownloadEventStatus.Line;
            }
            else if(fileType === scope.FileType.PMI)
            {
                return scope.DownloadEventStatus.PMI;
            }
        };

        this.SetDownloadEventStatus = function(fileType, status){
            if(fileType === scope.FileType.Header)
            {
                return scope.DownloadEventStatus.Header = status;
            }
            else if(fileType === scope.FileType.Structure)
            {
                return scope.DownloadEventStatus.Structure = status;
            }
            else if(fileType === scope.FileType.Property)
            {
                return scope.DownloadEventStatus.Property = status;
            }
            else if(fileType === scope.FileType.Line)
            {
                return scope.DownloadEventStatus.Line = status;
            }
            else if(fileType === scope.FileType.PMI)
            {
                return scope.DownloadEventStatus.PMI = status;
            }
        };

        this.ClearEventStatus = function() {            
            scope.DownloadEventStatus = {
                Header : false,
                Structure : false,
                Property : false,
                Material : false,
                Line : false,
                PMI : false,
            };
        }

         /**
         * FileKey 해당하는 다운로드 목록 등록 여부 확인
         * @param {*} fileKey 
         * @param {view.Data.ModelFileManager.FileType} fileType 
         */
        this.IsDownloadFileByFileKey = function(fileKey, fileType) {
            let result = false;

            let del = function (value, key, map) {   

                if(!view.Util.EqualDataTypeValue(value.Key, fileKey)) return;

                result = true;
            };

            if(fileType !== undefined || fileType === scope.FileType.Header)
                scope.HeaderDownloadMap.forEach(del);

            if(result) return result;
            if(fileType !== undefined || fileType === scope.FileType.Structure)
                scope.StructureDownloadMap.forEach(del);

            if(result) return result;
            if(fileType !== undefined || fileType === scope.FileType.Property)
                scope.PropertyDownloadMap.forEach(del);

            if(result) return result;
            if(fileType !== undefined || fileType === scope.FileType.Line)
                scope.LineDownloadMap.forEach(del);

            if(result) return result;
            if(fileType !== undefined || fileType === scope.FileType.PMI)
                scope.PMIDownloadMap.forEach(del);

            return result;
        };

        /**
         * 초기화
         */
        this.Clear = function() {
            scope.ListFileInfoItem = [];
            scope.FileInfoIdxMap.clear();

            scope.LODDownloadMap.clear();

            // 20230425 추가
            scope.HeaderDownloadMap.clear();
            scope.StructureDownloadMap.clear();
            scope.PropertyDownloadMap.clear();
            scope.LineDownloadMap.clear();
            scope.PMIDownloadMap.clear();

            scope.DownloadEventStatus = {
                Header : false,
                Structure : false,
                Property : false,
                Material : false,
                Line : false,
                PMI : false,
            };

            scope.listNodeID.splice(0, scope.listNodeID.length);
            scope.listIndexByID.splice(0, scope.listIndexByID.length);
            scope.listDataOffset.splice(0, scope.listDataOffset.length);
        };

//#region FileInfo 및 FileDataInfo 관리

        /**
         * 관리 파일 생성
         * @param {Data.FileData} fileData Header File Data Item
         * @param {Array<String>} listStructure URL List
         * @param {Array<Data.AreaDataItem>} listMesh AreaDataItem List
         * @param {Array<String>} listProperty URL List
         * @param {Array<String>} listMaterial URL List
         * @returns 
         */
        this.CreateFileInfoAndFileDataInfo = function(fileData, listStructure, listMesh, listProperty, listMaterial, listLine, listPMI) {
            
            let fileInfo = view.Data.FileInfoItem();
            fileInfo.IsFileHeader = true;
            fileInfo.Header = fileData.Header;
            fileInfo.id_file = fileData.Key;

            if(listStructure)
            for (let index = 0; index < listStructure.length; index++) {
                const url = listStructure[index];

                scope.AddFileDataInfo(fileInfo, url, VIZCore.Enum.FILEINFOTYPE.STRUCTURE);
            }

            if(listMesh)
            for (let index = 0; index < listMesh.length; index++) {

                const meshFileData = listMesh[index];
                const url = meshFileData.file;

                //Tag 추가하기 위해 따로 설정
                let fileDataInfo = view.Data.FileDataInfoItem();
                fileDataInfo.Url = url;
                fileDataInfo.tag = meshFileData;      
                fileDataInfo.fileInfoType = VIZCore.Enum.FILEINFOTYPE.MESH;

                fileInfo.Mesh.push(url);
                fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);

                // for (let i = 0; i < meshFileData.length; i++) {
                //     //fileInfo.Mesh.push(meshFileData[i].file);
                //     const url = meshFileData[i].file;

                //     let fileDataInfo = view.Data.FileDataInfoItem();
                //     fileDataInfo.Url = url;
                //     fileDataInfo.tag = meshFileData[i];
    
                //     fileInfo.Mesh.set(url, fileDataInfo);
                // }
            }

            if(listProperty)
            for (let index = 0; index < listProperty.length; index++) {
                const url = listProperty[index];

                scope.AddFileDataInfo(fileInfo, url, VIZCore.Enum.FILEINFOTYPE.PROPERTY);
            }

            if(listMaterial)
            for (let index = 0; index < listMaterial.length; index++) {
                const url = listMaterial[index];

                scope.AddFileDataInfo(fileInfo, url, VIZCore.Enum.FILEINFOTYPE.MATERIAL);
            }

            if(listLine)
            for (let index = 0; index < listLine.length; index++) {
                const url = listLine[index];

                scope.AddFileDataInfo(fileInfo, url, VIZCore.Enum.FILEINFOTYPE.LINE);
            }

            if(listPMI)
            for (let index = 0; index < listPMI.length; index++) {
                const url = listPMI[index];

                scope.AddFileDataInfo(fileInfo, url, VIZCore.Enum.FILEINFOTYPE.PMI);
            }

            return fileInfo;
        };

        /**
         * 관리 파일 생성 (빈 파일 정보)
         * FILEINFOTYPE Mesh 추가
         * @param {Data.fileData} fileData  : File
         */
        this.CreateFileInfoEmpty = function(fileData) {
            let fileInfo = view.Data.FileInfoItem();
            fileInfo.IsFileHeader = false;
            fileInfo.id_file = fileData.Key;

            //fileInfo.Header = undefined;
            //fileInfo.Header.GUID = fileData.ID;

            let meshFileData = view.Data.AreaDataItem(fileData.Key);
            meshFileData.file = fileData.Url;
            //meshFileData.cache = true;

            {
                const url = fileData.Url;

                let fileDataInfo = view.Data.FileDataInfoItem();
                fileDataInfo.Url = url;
                fileDataInfo.tag = meshFileData;
                fileDataInfo.fileInfoType = VIZCore.Enum.FILEINFOTYPE.MESH;

                fileInfo.Mesh.push(url);
                fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
            }

            return fileInfo;
        };

        /**
         * 관리 파일 정보 추가
         * @param {Data.FileInfoItem} fileInfo 
         * @param {String} url 
         * @param {VIZCore.Enum.FILEINFOTYPE} fileInfoType 
         */
        this.AddFileDataInfo = function(fileInfo, url, fileInfoType)
        {
            if(fileInfo === undefined) return undefined; //추가 실패

            let fileDataInfo = view.Data.FileDataInfoItem();
            fileDataInfo.Url = url;
            fileDataInfo.fileInfoType = fileInfoType; //VIZCore.Enum.FILEINFOTYPE.MESH

            switch(fileDataInfo.fileInfoType)
            {
                case VIZCore.Enum.FILEINFOTYPE.STRUCTURE:
                    {
                        fileInfo.Structure.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    }
                break;
                case VIZCore.Enum.FILEINFOTYPE.PROPERTY:
                    {                    
                        fileInfo.Property.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    }
                break;
                case VIZCore.Enum.FILEINFOTYPE.MATERIAL:
                    {
                        fileInfo.Material.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    
                    }
                break;
                case VIZCore.Enum.FILEINFOTYPE.MESH:
                    {
                        fileInfo.Mesh.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    
                    }
                break;
                case VIZCore.Enum.FILEINFOTYPE.LINE:
                    {
                        fileInfo.Line.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    
                    }
                break;
                case VIZCore.Enum.FILEINFOTYPE.PMI:
                    {
                        fileInfo.PMI.push(url);
                        fileInfo.mapFileDataInfoItem.set(url, fileDataInfo);
                    
                    }
                break;
            }

            return fileDataInfo;
        };

         /**
         * 관리 파일 추가
         * @param {*} fileKey Model Key
         * @param {Data.FileInfoItem} infoItem 
         * @returns 관리 추가 성공 여부
         */
        this.AddFileInfo = function(fileKey, infoItem) {
            if(scope.FileInfoIdxMap.has(fileKey)) return false;

            let idx = scope.ListFileInfoItem.length;

            scope.ListFileInfoItem.push(infoItem);
            scope.FileInfoIdxMap.set(fileKey, idx);

            return true;
        };

        /**
         * 관리 파일 반환
         * @param {*} fileKey 
         * @returns {Data.FileInfoItem}
         */
        this.GetFileInfo = function(fileKey) {
            let idx = scope.FileInfoIdxMap.get(fileKey);
            if(idx !== undefined) {
                return scope.ListFileInfoItem[idx];
            }

            return undefined;
        };
        
        /**
         *  관리 파일 반환
         * @param {String} fileUrl 다운로드 기준 Key 반환
         * @returns {Data.FileInfoItem}
         */
        this.GetFileInfoByUrl = function(fileUrl) {
            let fileKey = scope.GetFileKeyByUrl(fileUrl);
            if(fileKey === undefined) return undefined;
            
            if(typeof fileKey === "string") {
                if(fileKey.localeCompare("") === 0) return undefined;
            }
            
            return scope.GetFileInfo(fileKey);
        };

        /**
         * 다운로드 Header URL 기준 Key 반환
         * @param {String} fileUrl 
        * @returns {String}
         */
        this.GetFileKeyByUrl = function(fileUrl) {

            let findFileKey = false;
            let fileKey = undefined;

            //Key 기준으로 검색
            for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                if(findFileKey) return;

                let fileInfo = scope.ListFileInfoItem[i];
                if(!fileInfo.IsFileHeader) continue;

                if(fileInfo.Header.Url.localeCompare(fileUrl) !== 0) continue;

                fileKey = fileInfo.id_file;
                findFileKey = true;
                break;
            }
            
            return fileKey;
        };

        /**
         * 전체 Node index 에서 File Key 추출
         * @param {Number} nodeIndex 전체 nodeindex
         * @returns File Key
         */
        this.GetFileKeyByNodeIndex = function (nodeIndex) {
            
            let findFileKey = false;
            let fileKey = undefined;

            //Key 기준으로 검색
            // for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
            //     if(findFileKey) break;

            //     let fileInfo = scope.ListFileInfoItem[i];
            //     //fileInfo.Structure.forEach(funStructureFind);

            //     for(let j = 0 ; j < fileInfo.Structure.length ; j++) {
            //         let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[j]);

            //         if(fileDataInfo.tag === undefined) continue;
            //         if(nodeIndex >= fileDataInfo.tag.idx_start && 
            //             nodeIndex < fileDataInfo.tag.idx_end) {
                    
            //             fileKey = fileDataInfo.tag.key;
            //             findFileKey = true;
            //             break;
            //         }
            //     }
            // }

            for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                if(findFileKey) break;

                let fileInfo = scope.ListFileInfoItem[i];

                if(nodeIndex >= fileInfo.idx_start && 
                    nodeIndex < fileInfo.idx_end) {
                
                    fileKey = fileInfo.id_file;
                    findFileKey = true;
                    break;
                }
            }

            return fileKey;
        };

        /**
         * 전체 Node ID 에서 File Key 추출
         * @param {Number} nodeID 전체 NodeID
         * @returns File Key
         */
        this.GetFileKeyByNodeID = function (nodeID) {
            
            let nodeIdx = scope.GetNodeIndex(nodeID);
            if(nodeIdx === undefined) return undefined;

            return scope.GetFileKeyByNodeIndex(nodeIdx);
        };
        
        /**
         * 모델 파일 FileDataInfo 반환
         * @param {*} fileKey Model Key 
         * @param {String} fileUrl URL
         * @param {VIZCore.Enum.FILEINFOTYPE} fileInfoType 다운로드 파일 타입 (undefined 인경우 모든 파일에서 찾기)
         * @returns {Data.FileDataInfoItem}
         */
        this.GetFileDataInfoItem = function(fileKey, fileUrl, fileInfoType) {
            
            let fileDataInfo = undefined;

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return fileDataInfo;

            let findFileDataInfo = fileInfo.mapFileDataInfoItem.get(fileUrl);
            
            if(findFileDataInfo !== undefined) {
                if(fileInfoType === undefined || findFileDataInfo.fileInfoType === fileInfoType)
                    fileDataInfo = findFileDataInfo;
            }

            return fileDataInfo;
        };

        /**
         * 관리 파일 제거
         * @param {*} fileKey 
         */
        this.DeleteFileInfo = function(fileKey) {
            if(!scope.FileInfoIdxMap.has(fileKey)) return;

            let idx = scope.FileInfoIdxMap.get(fileKey);

            scope.FileInfoIdxMap.delete(fileKey);            
            scope.ListFileInfoItem.splice(idx, 1);
            
            for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++)
            {
                scope.FileInfoIdxMap.set(scope.ListFileInfoItem[i].id_file, i);
            }
        };

        /**
         * 해당 vizw파일 다운로드 완료 (1회)
         * @param {*} fileKey Model Key
         * @param {Data.FileData} fileData 
         * @returns 
         */
        this.SetDownloadFileData = function(fileKey, fileData) { 
            if(fileData === undefined) return;
            if (fileData.Status === 3 || fileData.Crash) return;
            
            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return;

            let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileData.Url);            
            if(fileDataInfo !== undefined) {
                fileDataInfo.Download = true;
            }

            //DEUBG LOG
            // if(bFindFileData) {
            //     console.log("[Shw3DCore] Download Key :" + fileKey + ", URL : " +  fileData.Url);
            // }
        };
       
        /**
         * VZIW 파일 모두 다운로드 완료 여부 확인
         * @param {*} fileKey fileKey Model Key
         * @param {VIZCore.Enum.FILEINFOTYPE} fileInfoType 
         */
        this.IsCompletedDownloadFileData = function(fileKey, fileInfoType) {
            //VIZCore.Enum.FILEINFOTYPE.STRUCTURE

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return;

            let downNum = 0;
            let fileDataNum = 0;
            if(fileInfoType === undefined ||
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.STRUCTURE) {
                fileDataNum += fileInfo.Structure.length;

                if(fileInfo.StructureCompleted) {
                    downNum += fileInfo.Structure.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.Structure.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }
            if(fileInfoType === undefined ||
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.PROPERTY) {
                fileDataNum += fileInfo.Property.length;

                if(fileInfo.PropertyCompleted) {
                    downNum += fileInfo.Property.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.Property.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Property[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }
            if(fileInfoType === undefined || 
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.MATERIAL) {
                fileDataNum += fileInfo.Material.length;

                if(fileInfo.MaterialCompleted) {
                    downNum += fileInfo.Material.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.Material.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Material[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }
            if(fileInfoType === undefined || 
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.MESH ) {                
                fileDataNum += fileInfo.Mesh.length;

                if(fileInfo.MeshCompleted) {
                    downNum += fileInfo.Mesh.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.Mesh.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }

            if(fileInfoType === undefined || 
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.LINE ) {                
                fileDataNum += fileInfo.Line.length;

                if(fileInfo.LineCompleted) {
                    downNum += fileInfo.Line.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.Line.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Line[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }

            if(fileInfoType === undefined || 
                fileInfoType === VIZCore.Enum.FILEINFOTYPE.PMI ) {                
                fileDataNum += fileInfo.PMI.length;

                if(fileInfo.PMICompleted) {
                    downNum += fileInfo.PMI.length;
                }
                else {
                    for(let i = 0 ; i < fileInfo.PMI.length ; i++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.PMI[i]);
        
                        if(fileDataInfo.Download) downNum++;
                    }
                }
            }

            // if(completedTime === undefined) {
            //     console.log("donwload : " + downNum + "/" + fileDataNum);
            //     if(downNum > 0 && downNum === fileDataNum) {
            //         console.log(fileInfo);
            //     }
            // } 
            
            // if(downNum > 0 && downNum === fileDataNum) {
            //     return true;
            // }
            if(downNum === fileDataNum) {
                return true;
            }

            return false;
        };

//#endregion FileInfo 및 FileDataInfo 관리

//#region FileDataInfo Tag 
        
        /**
         * Meshblock AreaItem 반환
         * 형상 개체 정보
         * @param {*} fileKey Model Key 
         * @param {String} fileUrl URL
         * @returns {Data.AreaDataItem}
         */
        this.GetFileAreaData = function (fileKey, fileUrl) {
            let fileArea = undefined;

            let fileDataInfo = scope.GetFileDataInfoItem(fileKey, fileUrl, VIZCore.Enum.FILEINFOTYPE.MESH);
            if(fileDataInfo === undefined) return fileArea;
            if(fileDataInfo.tag === undefined) return fileArea;

            fileArea = fileDataInfo.tag;
            return fileArea;
        };

           
        // /**
        //  * Meshblock AreaItem 반환
        //  * 형상 개체 정보
        //  * @param {Number} offset 전체 Node Binary Offset
        //  * @returns {Data.AreaDataItem}
        //  */
        //  this.GetFileAreaDataByOffset = function (offset) {
        //     if(offset === undefined || offset < 0) return undefined;

        //     for(let ii = 0 ; ii < scope.ListFileInfoItem.length ; ++ii) {
        //         let fileInfo = scope.ListFileInfoItem[ii];

        //         for (let i = 0; i < fileInfo.Structure.length; i++) {
        //             let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
        //             if(fileDataInfo === undefined) continue;
        //             if(fileDataInfo.tag === undefined) continue;

        //             let maxOffset = fileDataInfo.tag.listNodeID.length * fileDataInfo.tag.size;
        //             if(offset >= maxOffset) {
        //                 offset = offset - maxOffset;
        //             }
        //             else {
        //                 return fileDataInfo;
        //             }
        //         }                
        //     }

        //     return undefined;
        // };


        /**
         * Structure Binary Item 반환
         * @param {*} fileKey 
         * @return {Data.TreeBinaryInfoItem}
         */
        this.GetFileStructureBinary = function (fileKey) {
            //첫번째 Binary 정보 반환
            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return undefined;

            for (let i = 0; i < fileInfo.Structure.length; i++) {
                let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
                if(fileDataInfo === undefined) continue;
                if(fileDataInfo.tag === undefined) continue;

                return fileDataInfo.tag;
            };
            return undefined;
        };

        /**
         * Structure Binary Item 반환
         * @param {Number} offset 전체 Node Binary Offset
         * @returns {Data.TreeBinaryInfoItem} 
         */
        this.GetFileStructureBinaryByOffset = function(offset) {
            //let idx = getIndex(offset);

            let binary = undefined;
            if(offset === undefined || offset < 0) return binary;

            for(let ii = 0 ; ii < scope.ListFileInfoItem.length ; ++ii) {
                let fileInfo = scope.ListFileInfoItem[ii];

                for (let i = 0; i < fileInfo.Structure.length; i++) {
                    let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
                    if(fileDataInfo === undefined) continue;
                    if(fileDataInfo.tag === undefined) continue;

                    //if(fileDataInfo.tag.idx_start <= idx && fileDataInfo.tag.idx_end > idx) {
                    //    binary = fileDataInfo.tag;
                    //    break;
                    //}

                    let maxOffset = fileDataInfo.tag.listNodeID.length * fileDataInfo.tag.size;
                    if(offset >= maxOffset) {
                        offset = offset - maxOffset;
                    }
                    else {
                        binary = fileDataInfo.tag;
                        break;
                    }
                }
                if(binary !== undefined) break;
            }

            return binary;
        };

        /**
         * Structure 단위 Offset 반환
         * @param {Number} offset 전체 Node Binary Offset
         * @returns {Number} 
         */
         this.GetFileStructureOffsetByOffset = function(offset) {
            //let idx = getIndex(offset);

            let currentOffset = -1;
            if(offset === undefined || offset < 0) return currentOffset;

            for(let ii = 0 ; ii < scope.ListFileInfoItem.length ; ++ii) {
                let fileInfo = scope.ListFileInfoItem[ii];

                for (let i = 0; i < fileInfo.Structure.length; i++) {
                    let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
                    if(fileDataInfo === undefined) continue;
                    if(fileDataInfo.tag === undefined) continue;

                    //if(fileDataInfo.tag.idx_start <= idx && fileDataInfo.tag.idx_end > idx) {
                    //    binary = fileDataInfo.tag;
                    //    break;
                    //}

                    let maxOffset = fileDataInfo.tag.listNodeID.length * fileDataInfo.tag.size;
                    if(offset >= maxOffset) {
                        offset = offset - maxOffset;
                    }
                    else {
                        currentOffset = offset;
                        break;
                    }
                }
                if(currentOffset >= 0) break;
            }

            return currentOffset;
        };
        
//#endregion FileDataInfo Tag

//#region Node List 관리


        /**
         * 추가 Node Index
         */
         this.AddNodeIndexList = function(fileInfo) {
                        
            let nodeidx = scope.listNodeID.length;
            let nodeOffset = 0;

            //Offset 계산
            if(scope.ListFileInfoItem.length > 0) {

                let lastOffset = 0;
                for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                    let listfileInfo = scope.ListFileInfoItem[i];
                    if(view.Util.EqualDataTypeValue(fileInfo.id_file, listfileInfo.id_file)) break;

                    for(let j = 0 ; j < listfileInfo.Structure.length ; j++) {
                        let fileDataInfo = listfileInfo.mapFileDataInfoItem.get(listfileInfo.Structure[j]);

                        //구조 정보가 없는 개체
                        if(fileDataInfo.tag === undefined) continue;

                        let currentNodeLength = fileDataInfo.tag.listNodeID.length;
                        let currentOffset = fileDataInfo.tag.size;

                        lastOffset += currentNodeLength * currentOffset;
                    }
                }
                nodeOffset = lastOffset;
                //nodeOffset = scope.listDataOffset[nodeidx - 1];                
            }

            let nodeStartID = view.Data.GetStartID(fileInfo.id_file);

            let fildInfo_idx_start = nodeidx;

            for(let j = 0 ; j < fileInfo.Structure.length ; j++) {
                let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[j]);

                //구조 정보가 없는 개체
                if(fileDataInfo.tag === undefined) continue;

                let idx_start = nodeidx;
                let offset_start = nodeOffset;
                let currentNodeLength = fileDataInfo.tag.listNodeID.length;
                let currentOffset = fileDataInfo.tag.size;

                //전체 노드
                for(let k = 0 ; k < currentNodeLength ; k++) 
                {
                    let node_src_id = fileDataInfo.tag.listNodeID[k]; //원본 아이디
                    let node_id = node_src_id + nodeStartID;

                    //전체 노드 ID 등록                  
                    scope.listNodeID[nodeidx] = node_id;
                    //전체 노드 Index 등록
                    scope.listIndexByID[node_id] = nodeidx;
                    //전체 노드 Offset 등록
                    scope.listDataOffset[nodeidx] = nodeOffset;                        
                    
                    nodeidx++;
                    nodeOffset += currentOffset;
                }
                //마지막 개체 바이너리 끝
                nodeOffset += currentOffset;

                //해당 구조정보의 검색 index범위 등록
                fileDataInfo.tag.idx_start = idx_start;
                fileDataInfo.tag.idx_end = nodeidx
                fileDataInfo.tag.offset_start = offset_start;

            }

            fileInfo.idx_start = fildInfo_idx_start;
            fileInfo.idx_end = nodeidx;
        };

        /**
         * 전체 Node Index 갱신
         */
        this.RefreshNodeIndexList = function() {
            scope.listNodeID.splice(0, scope.listNodeID.length);
            scope.listIndexByID.splice(0, scope.listIndexByID.length);
            scope.listDataOffset.splice(0, scope.listDataOffset.length);
            
            let nodeidx = 0;
            let nodeOffset = 0;
            let lastOffsetSize = 0;

            for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                let fileInfo = scope.ListFileInfoItem[i];

                let nodeStartID = view.Data.GetStartID(fileInfo.id_file);

                let fildInfo_idx_start = nodeidx;
                let fildInfo_offset_start = nodeOffset + lastOffsetSize;

                for(let j = 0 ; j < fileInfo.Structure.length ; j++) {
                    let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[j]);

                    //구조 정보가 없는 개체
                    if(fileDataInfo.tag === undefined) continue;

                    let idx_start = nodeidx;
                    let offset_start = nodeOffset;
                    let currentNodeLength = fileDataInfo.tag.listNodeID.length;
                    let currentOffset = fileDataInfo.tag.size;
                    
                    //전체 노드
                    for(let k = 0 ; k < currentNodeLength ; k++) 
                    {
                        let node_src_id = fileDataInfo.tag.listNodeID[k]; //원본 아이디
                        let node_id = node_src_id + nodeStartID;

                        //전체 노드 ID 등록                  
                        scope.listNodeID[nodeidx] = node_id;
                        //전체 노드 Index 등록
                        scope.listIndexByID[node_id] = nodeidx;
                        //전체 노드 Offset 등록
                        scope.listDataOffset[nodeidx] = nodeOffset;                        
                        
                        nodeidx++;
                        nodeOffset += currentOffset;
                    }

                    //해당 구조정보의 검색 index범위 등록
                    fileDataInfo.tag.idx_start = idx_start;
                    fileDataInfo.tag.idx_end = nodeidx;
                    fileDataInfo.tag.offset_start = offset_start;

                    lastOffsetSize = currentOffset;
                }

                fileInfo.idx_start = fildInfo_idx_start;
                fileInfo.idx_end = nodeidx;
            }
        };

        /**
         * 전체 Node 수 반환
         * @returns {Number} 
         */
        this.GetNodeCount = function() {
            return scope.listNodeID.length;
        };
        
        /**
         * Node ID 반환
         * @param {Number} nodeIndex 통합 Node Index
         * @returns {Number} Node ID 
         */
        this.GetNodeID = function (nodeIndex) {
            return scope.listNodeID[nodeIndex];
        };

        /**
         * Node Index 반환
         * @param {Number} nodeId 통합 Node ID
         * @returns {Number} Node Index
         */
        this.GetNodeIndex = function (nodeId) {
            return scope.listIndexByID[nodeId];
        };

        
        /**
         * Node Offset 반환
         * @param {Number} nodeIndex 통합 Node Index
         * @returns {Number} Node Data Offset
         */
        this.GetNodeDataOffset = function (nodeIndex) {
            return scope.listDataOffset[nodeIndex];
        };
        
        /**
         *  Binary Offset 기준 Node Index 반환
         * @param {Number} offset Binary Offset 
         * @returns {Number} Node index
         */
         this.GetNodeIndexByOffset = function(offset) {
            let resultIdx = -1;
            let idxNum = 0;

            if(offset === undefined || offset < 0) return resultIdx;

            //다른 버전의 구조정보 Buffer 읽기
            for(let ii = 0 ; ii < scope.ListFileInfoItem.length ; ++ii) {
                if(resultIdx >= 0) break;

                let fileInfo = scope.ListFileInfoItem[ii];

                for (let i = 0; i < fileInfo.Structure.length; i++) {
                    let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
                    if(fileDataInfo === undefined) continue;
                    if(fileDataInfo.tag === undefined) continue;
                    if(fileDataInfo.tag.size === 0) continue;

                    let maxOffset = fileDataInfo.tag.listNodeID.length * fileDataInfo.tag.size;
                    if(offset >= maxOffset) {
                        offset = offset - maxOffset;
                        idxNum += fileDataInfo.tag.listNodeID.length;
                    }
                    else {
                        resultIdx = offset / fileDataInfo.tag.size;
                        break;
                    }
                };
            }

            return resultIdx + idxNum;
        };

        /**
         * 원본 Index 반환
         * @param {*} fileKey 
         * @param {Number} origin_id 
         * @returns 
         */
        this.GetNodeOriginIndex = function(fileKey, origin_id) {
            let findValue = false;
            let origin_index = -1;

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) {
                return origin_index;
            }
            if(fileInfo.Structure.length <= 0) return origin_index;

            return fileInfo.listIndexByID[origin_id];
            
            // for(let j = 0 ; j < fileInfo.Structure.length ; j++) {
            //     let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[j]);

            //     if(fileDataInfo.tag === undefined) continue;

            //     origin_index = fileDataInfo.tag.listIndexByID[origin_id];
            //     if(origin_index !== undefined) 
            //     {
            //         findValue = true;
            //         break;
            //     }
            // }

            return origin_index;
        };

        /**
         * Binary Offset 기준 Node Origin Index 반환
         * @param {Number} offset Binary Offset 
         * @returns {Number} Node Origin index
         */
        this.GetNodeOriginIndexByOffset = function(offset) {
            let resultIdx = -1;
            if(offset === undefined || offset < 0) return resultIdx;

            //다른 버전의 구조정보 Buffer 읽기
            for(let ii = 0 ; ii < scope.ListFileInfoItem.length ; ++ii) {
                if(resultIdx >= 0) break;

                let fileInfo = scope.ListFileInfoItem[ii];

                for (let i = 0; i < fileInfo.Structure.length; i++) {
                    let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[i]);
                    if(fileDataInfo === undefined) continue;
                    if(fileDataInfo.tag === undefined) continue;
                    if(fileDataInfo.tag.size === 0) continue;

                    let maxOffset = fileDataInfo.tag.listNodeID.length * fileDataInfo.tag.size;
                    if(offset >= maxOffset) {
                        offset = offset - maxOffset;
                    }
                    else {
                        resultIdx = offset / fileDataInfo.tag.size;
                        break;
                    }
                };
            }

            return resultIdx;
        };

        /**
         * 원본 ID 반환
         * @param {*} fileKey 
         * @param {Number} origin_index 
         * @returns 
         */
        this.GetNodeOriginID = function(fileKey, origin_index) {
            let origin_id = -1;

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) {
                return origin_index;
            }

            for(let j = 0 ; j < fileInfo.Structure.length ; j++) {
                let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Structure[j]);

                if(fileDataInfo.tag === undefined) continue;

                origin_id = fileDataInfo.tag.listNodeID[origin_index];
                if(origin_id !== undefined) 
                {
                    break;
                }
            }

            return origin_id;
        };


        /**
         * 
         * @param {*} binary 
         * @param {Number} nodeId 
         */
        this.GetNodeData = function (binary, nodeId, kind) {

            //let offset_add = binary.idx_start * SHTREE_INFO.Size;
            let offset_add = binary.offset_start;

            //let nodeid_add = binary.idx_start;
            let nodeid_add = view.Data.GetStartID(binary.key);

            // 로딩된 파일에서의 offset
            let offset_current = offset;

            offset = offset - offset_add;

            let dTree = binary.structure;
            let dName = binary.name;

            //view.Tree.getTreeDataByBinary 코드를 옮길 필요있음.
        };

//#endregion Node List 관리


//#region LOD Process

          /**
         * 항상 Cache 사용 적용
         * @param {*} fileKey 
         */
        this.LockMeshCache = function(fileKey) {

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return;

            fileInfo.LockCahceData = true;
        };

        /**
         * 항상 Cache 사용 해제
         * @param {*} fileKey 
         */
        this.UnlockMeshCache = function(fileKey) {

            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return;

            fileInfo.LockCahceData = false;
        };

        /**
         * 형상 거리 별 가시화 여부 
         *  (특정 거리보다 먼 경우 BBox로 표현)
         * @param {*} fileKey 
         * @param {Number} fDist :  (-1 = 거리 해제)
         */
        this.SetMeshViewDistance = function (fileKey, fDist) {
            
            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return false;

            let updateObject = false;
            if(fDist === undefined || fDist < 0) {
                if(fileInfo.UseViewDistance) {
                    updateObject = true;
                }

                fileInfo.UseViewDistance = false;
                fileInfo.ViewDistance = 0;
            }
            else {
                if(!fileInfo.UseViewDistance || 
                    fileInfo.ViewDistance !== fDist) {
                    updateObject = true;
                }

                fileInfo.UseViewDistance = true;
                fileInfo.ViewDistance = fDist;
            }

            if(updateObject)
                view.Renderer.SetViewDistanceBBox(true);

            return updateObject;
        };

        this.GetViewDistance = function(){
            
            let distance = 0;
            let check = function(value, key, map){
                let fileInfo = scope.GetFileInfo(key);
                if(fileInfo === undefined)
                    return;
                if(fileInfo.UseViewDistance) {
                    if(distance === 0)
                        distance = fileInfo.ViewDistance;
                    else
                        distance = Math.min(distance, fileInfo.ViewDistance);
                }
            }

            scope.FileInfoIdxMap.forEach(check);
            return distance;
        };

        this.IsViewDistance = function(){
            let enable = false;
            let check = function(value, key, map){
                let fileInfo = scope.GetFileInfo(key);
                if(fileInfo === undefined)
                    return;
                if(fileInfo.UseViewDistance) {
                    enable = true
                }
            }

            scope.FileInfoIdxMap.forEach(check);
            return enable;
        };
        /**
         * 지정한 개체 거리에 따른 형상 변경 미적용 설정
         * SetMeshViewDistance 로 지정한 개체만 적용가능
         * @param {*} fileKey 
         * @param {array<Number>} origin_ids : [] 
         * @param {Boolean} bDisable 미적용 여부 설정 (true = 미적용, false = 적용)
         * @param {Boolean} updateObject bbox 갱신 여부 (undefined == true)
         */
        this.SetDisableViewDistanceBBox = function (fileKey, origin_ids, bDisable, updateObject) {
            let fileInfo = scope.GetFileInfo(fileKey);
            if(fileInfo === undefined) return;
            if(!fileInfo.UseViewDistance) return;

            //전체 기준으로 변경하기 위한 ID
            let bodiesID = view.Tree.GetBodyOriginIdsFormOriginIds(fileKey, origin_ids); 

            for(let i = 0 ; i < bodiesID.length ; i++) {
                let action = view.Data.ShapeAction.GetAction(fileKey, bodiesID[i]);
                if(action === undefined) {
                    action = view.Data.ActionItem();
                    view.Data.ShapeAction.SetAction(fileKey, bodiesID[i], action);
                }

                action.disableViewDistaceBBox = bDisable;
            };

            if(updateObject === undefined)
                updateObject = true;

            if(updateObject)
                view.Renderer.SetViewDistanceBBox(true);

        };

        /**
         * LOD FileURL 리스트  반환
         * @returns {Array<Data.ModelFileUrlInfo>}
         */
        this.GetAreaObjectsURL_LOD = function () {

            if (view.IsUseRenderCache() === false) {
                // Cache Limit 사용하지 않는경우
                // Cache가 없는 경우에 다운로드
    
                let cacheFile = [];
                for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                    let fileInfo = scope.ListFileInfoItem[i];
                    if(!fileInfo.IsFileHeader) continue;    //단일 VIZW 포함하지 않음

                    //calAddCacheFile
                    for(let j = 0 ; j < fileInfo.Mesh.length ; j++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[j]);
                        if(fileDataInfo === undefined || fileDataInfo.tag === undefined) continue;

                        let fileAreaItem = fileDataInfo.tag;
                        fileAreaItem.cache = true;
    
                        //if (info.lod === 0) return;
                        if(view.DemoType === 3) {
                            if (info.lod === 1) continue;
                        }                        
    
                        let meshFileInfo = view.Data.ModelFileUrlInfo();
    
                        meshFileInfo.Key = fileAreaItem.id_file;
                        meshFileInfo.Url = fileAreaItem.file;
    
                        cacheFile.push(meshFileInfo);
                    }

                    //fileInfo.Mesh.forEach(calAddCacheFile);
                }

                view.Renderer.SetViewDistanceBBox();

                return cacheFile;
            }

            let lod = 0;
    
            //if (view.Camera.cameraZoom > 0.2)
                //return [];
    
            if (view.DemoType === 0) {
                // SK
                //if (view.Camera.cameraZoom < 0.015803197027277356)
                //    lod = 5;
                //else if (view.Camera.cameraZoom < 0.025599448334722736)
                //    lod = 4;
                //else if (view.Camera.cameraZoom < 0.05735421910125164)
                //    lod = 3;
                //else if (view.Camera.cameraZoom < 0.10734324368961417)
                //    lod = 2;
                //else if (view.Camera.cameraZoom < 1.014125)
                //    lod = 1;
    
                if (view.Camera.cameraZoom < 0.05735421910125164)
                    lod = 5;
                else if (view.Camera.cameraZoom < 0.075599448334722736)
                    lod = 4;
                else if (view.Camera.cameraZoom < 0.10734324368961417)
                    lod = 3;
                else if (view.Camera.cameraZoom < 0.30734324368961417)
                    lod = 2;
                else if (view.Camera.cameraZoom < 1.514125)
                    lod = 1;
    
                //if (view.Camera.cameraZoom < 0.0065)
                //    lod = 5;
                //else if (view.Camera.cameraZoom < 0.009)
                //    lod = 4;
                //else if (view.Camera.cameraZoom < 0.012)
                //    lod = 3;
                //else if (view.Camera.cameraZoom < 0.015803197027277356)
                //    lod = 2;
                //else if (view.Camera.cameraZoom < 1.014125)
                //    lod = 1;
            }
            else if (view.DemoType === 1) {
                // Daelim
                if (view.Camera.cameraZoom < 0.00763075959478948)
                    lod = 5;
                else if (view.Camera.cameraZoom < 0.01363075959478948)
                    lod = 4;
                else if (view.Camera.cameraZoom < 0.02763075959478948)
                    lod = 3;
                else if (view.Camera.cameraZoom < 0.052945601421837174)
                    lod = 2;
                else if (view.Camera.cameraZoom < 1.014125)
                    lod = 1;
    
                //if (view.Camera.cameraZoom < 0.01719780985220789)
                //    lod = 5;
                //else if (view.Camera.cameraZoom < 0.032945601421837174)
                //    lod = 4;
                //else if (view.Camera.cameraZoom < 0.05364640980555616)
                //    lod = 3;
                //else if (view.Camera.cameraZoom < 0.08735421910125164)
                //    lod = 2;
                //else if (view.Camera.cameraZoom < 1.014125)
                //    lod = 1;
    
                //if (view.Camera.cameraZoom < 0.01719780985220789)
                //    lod = 5;
                //else if (view.Camera.cameraZoom < 0.032945601421837174)
                //    lod = 4;
                //else if (view.Camera.cameraZoom < 0.05364640980555616)
                //    lod = 3;
                //else if (view.Camera.cameraZoom < 1.014125)
                //    lod = 2;
                //else if (view.Camera.cameraZoom < 1.014125)
                //    lod = 1;
            }
            else
            {
                if (view.Camera.cameraZoom < 0.05735421910125164)
                    lod = 5;
                else if (view.Camera.cameraZoom < 0.075599448334722736)
                    lod = 4;
                else if (view.Camera.cameraZoom < 0.10734324368961417)
                    lod = 3;
                else if (view.Camera.cameraZoom < 0.30734324368961417)
                    lod = 2;
                else if (view.Camera.cameraZoom < 1.514125)
                    lod = 1;
            }
    
            
            //if (lod === 0)
            //    return [];
    
            //if (lod > 1)
            //    lod = 1;
    
            let arrAreaInfo = [];

            let getAreaFileInfo = function (info) {
                let cellInfo = {
                    index: [],
                    screenXY: [],
                    screenDepth: 0,
                    distFromCenter: 0,
                    
                    Key : info.id_file,
                    Url : info.file,

                    lod: info.lod,
                    lod_sequence : info.lod_sequence,
                    
                    tri_num : info.tri_num

                };
                return cellInfo;
            };
    
            let MVPmatrix = new VIZCore.Matrix4().copy(view.Camera.matMVP);
    
            //let lodCnt = 0;
            let matMV = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
            let matMVinv = new VIZCore.Matrix4().getInverse(matMV);
            let vCamWorldPosition = matMVinv.multiplyVector(view.Camera.cameraPosition);
            let vCamWorldTarget = matMVinv.multiplyVector(view.Camera.cameraTarget);
            let nearPlaneDist = view.Camera.near;
            let vCamDirection = new VIZCore.Vector3().subVectors(vCamWorldTarget, vCamWorldPosition);
            vCamDirection.normalize();
            // 니어플랜 평면 방정식 만든다
            let nearPlane = [vCamDirection.x, vCamDirection.y, vCamDirection.z, 0.0];
            let vNearPlanePos = new VIZCore.Vector3().addVectors(vCamWorldPosition, vCamDirection.multiplyScalar(nearPlaneDist));
            nearPlane[3] = -(nearPlane[0] * vNearPlanePos.x + nearPlane[1] * vNearPlanePos.y + nearPlane[2] * vNearPlanePos.z);
            //let nearTest = nearPlane[0] * vNearPlanePos.x + nearPlane[1] * vNearPlanePos.y + nearPlane[2] * vNearPlanePos.z + nearPlane[3];
            //let MVPMatTest = MVPmatrix.multiplyVector(vNearPlanePos);            
    
            let calLoadingFile = function (fileDataInfo) {
                if(fileDataInfo === undefined) return;
                if(fileDataInfo.tag === undefined) return;

                let info = fileDataInfo.tag;
                let hitCnt = 0;
    
                let cornerPosList = [];

                let xMin = info.bbox.min.x;
                let xMax = info.bbox.max.x;

                let yMin = info.bbox.min.y;
                let yMax = info.bbox.max.y;

                let zMin = info.bbox.min.z;
                let zMax = info.bbox.max.z;

                if (view.Clipping.IsClipping) {
                    let clipInfo = view.Clipping.Get();
                    if (clipInfo !== undefined) {
                        if (clipInfo.planes.length === 1) {
                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.X) {
                                if (clipInfo.planes[0].normal.x < 0) // x-
                                {
                                    if (xMin > clipInfo.planes[0].center.x)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.x > 0) // x+
                                {
                                    if (xMax < clipInfo.planes[0].center.x)
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Y) {
                                if (clipInfo.planes[0].normal.y < 0) // y-
                                {
                                    if (yMin > clipInfo.planes[0].center.y)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.y > 0) // y+
                                {
                                    if (yMax < clipInfo.planes[0].center.y)
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Z) {
                                if (clipInfo.planes[0].normal.z < 0) // z-
                                {
                                    if (zMin > clipInfo.planes[0].center.z)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.z > 0) // z+
                                {
                                    if (zMax < clipInfo.planes[0].center.z)
                                        return;
                                }
                            }
                        }
                        else {
                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.BOX) {
                                if (xMax < clipInfo.planes[0].center.x)
                                    return;
                                if (xMin > clipInfo.planes[1].center.x)
                                    return;
                                if (yMax < clipInfo.planes[2].center.y)
                                    return;
                                if (yMin > clipInfo.planes[3].center.y)
                                    return;
                                if (zMax < clipInfo.planes[4].center.z)
                                    return;
                                if (zMin > clipInfo.planes[5].center.z)
                                    return;
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Y) {
                                if (clipInfo.planes[0].normal.y < 0) // y-
                                {
                                    if (yMin > clipInfo.planes[0].center.y)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.y > 0) // y+
                                {
                                    if (yMax < clipInfo.planes[0].center.y)
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Z) {
                                if (clipInfo.planes[0].normal.z < 0) // z-
                                {
                                    if (zMin > clipInfo.planes[0].center.z)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.z > 0) // z+
                                {
                                    if (zMax < clipInfo.planes[0].center.z)
                                        return;
                                }
                            }
                        }
                    }
                }

                let screenMinX = 0, screenMaxX = 0, screenMinY = 0, screenMaxY = 0;
                let screenMinZ = -1;

                {
                    let cornerTestPosList = [];
                    cornerTestPosList.push(new VIZCore.Vector3(xMin, yMin, zMin));
                    cornerTestPosList.push(new VIZCore.Vector3(xMax, yMin, zMin));
                    cornerTestPosList.push(new VIZCore.Vector3(xMax, yMax, zMin));
                    cornerTestPosList.push(new VIZCore.Vector3(xMin, yMax, zMin));
                    cornerTestPosList.push(new VIZCore.Vector3(xMin, yMin, zMax));
                    cornerTestPosList.push(new VIZCore.Vector3(xMax, yMin, zMax));
                    cornerTestPosList.push(new VIZCore.Vector3(xMax, yMax, zMax));
                    cornerTestPosList.push(new VIZCore.Vector3(xMin, yMax, zMax));

                    let posLineIdxList = [[0, 3, 4], [0, 1, 5], [1, 2, 6], [2, 3, 7], [4, 8, 11], [5, 8, 9], [6, 9, 10], [7, 10, 11]];
                    let linePosIdxList = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [7, 4]];

                    // 실제 사용될 포인트 등록 
                    for (let j = 0; j < cornerTestPosList.length; j++) {
                        let vCornerScreenPosZ = nearPlane[0] * cornerTestPosList[j].x + nearPlane[1] * cornerTestPosList[j].y + nearPlane[2] * cornerTestPosList[j].z + nearPlane[3];
                        if (vCornerScreenPosZ >= -1) {
                            cornerPosList.push(new VIZCore.Vector3(cornerTestPosList[j].x, cornerTestPosList[j].y, cornerTestPosList[j].z));
                        }
                        else {
                            for (let k = 0; k < 3; k++) {
                                let idx1 = linePosIdxList[posLineIdxList[j][k]][0];
                                let idx2 = linePosIdxList[posLineIdxList[j][k]][1];

                                let vCornerScreenPosZ1 = nearPlane[0] * cornerTestPosList[idx1].x + nearPlane[1] * cornerTestPosList[idx1].y + nearPlane[2] * cornerTestPosList[idx1].z + nearPlane[3];
                                let vCornerScreenPosZ2 = nearPlane[0] * cornerTestPosList[idx2].x + nearPlane[1] * cornerTestPosList[idx2].y + nearPlane[2] * cornerTestPosList[idx2].z + nearPlane[3];

                                if (vCornerScreenPosZ1 < -1 && vCornerScreenPosZ2 < -1)
                                    continue;

                                let projLen1 = nearPlane[0] * cornerTestPosList[idx1].x + nearPlane[1] * cornerTestPosList[idx1].y + nearPlane[2] * cornerTestPosList[idx1].z + nearPlane[3];
                                let projLen2 = nearPlane[0] * cornerTestPosList[idx2].x + nearPlane[1] * cornerTestPosList[idx2].y + nearPlane[2] * cornerTestPosList[idx2].z + nearPlane[3];

                                projLen1 = Math.abs(projLen1);
                                projLen2 = Math.abs(projLen2);

                                let projLenSum = projLen1 + projLen2;

                                if (Math.abs(projLenSum) < 0.000001) {
                                    cornerPosList.push(new VIZCore.Vector3(cornerTestPosList[j].x, cornerTestPosList[j].y, cornerTestPosList[j].z));
                                    continue;
                                }

                                let vCornerScreenPosProj = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(cornerTestPosList[idx1]).multiplyScalar(projLen2 / projLenSum),
                                    new VIZCore.Vector3().copy(cornerTestPosList[idx2]).multiplyScalar(projLen1 / projLenSum));

                                //let projTest = nearPlane[0] * vCornerScreenPosProj.x + nearPlane[1] * vCornerScreenPosProj.y + nearPlane[2] * vCornerScreenPosProj.z + nearPlane[3];
                                //let vCornerScreenPos = MVPmatrix.multiplyVector(vCornerScreenPosProj);

                                cornerPosList.push(new VIZCore.Vector3(vCornerScreenPosProj.x, vCornerScreenPosProj.y, vCornerScreenPosProj.z));
                            }
                        }
                    }

                    let vModelCenter = new VIZCore.Vector3().copy(info.bbox.center);
                    let vModelCenterScreenPos = MVPmatrix.multiplyVector(vModelCenter);

                    for (let j = 0; j < cornerPosList.length; j++) {
                        let vCornerScreenPos = MVPmatrix.multiplyVector(cornerPosList[j]);

                        if (j === 0) {
                            screenMinX = screenMaxX = vCornerScreenPos.x;
                            screenMinY = screenMaxY = vCornerScreenPos.y;
                            screenMinZ = vCornerScreenPos.z;
                        }
                        else {
                            screenMinX = Math.min(screenMinX, vCornerScreenPos.x);
                            screenMaxX = Math.max(screenMaxX, vCornerScreenPos.x);
                            screenMinY = Math.min(screenMinY, vCornerScreenPos.y);
                            screenMaxY = Math.max(screenMaxY, vCornerScreenPos.y);
                            screenMinZ = Math.min(screenMinZ, vCornerScreenPos.z);
                        }
                    }
                }

                let minScreenSize = [0.005, 0.005];
                let bbScreenWidth = screenMaxX - screenMinX;
                let bbScreenHeight = screenMaxY - screenMinY;

                if (cornerPosList.length > 0 && bbScreenWidth > minScreenSize[0] && bbScreenHeight > minScreenSize[1]) {
                    let cx = xMin + (xMax - xMin) * (0.5);
                    let cy = yMin + (yMax - yMin) * (0.5);
                    let cz = zMin + (zMax - zMin) * (0.5);

                    let vScreen = new VIZCore.Vector3((screenMinX + screenMaxX) / 2.0, (screenMinY + screenMaxY) / 2.0, screenMinZ);

                    if (screenMaxX < -1.0 || screenMinX > 1.0 || screenMaxY < -1.0 || screenMinY > 1.0)
                        ;
                    else {
                        hitCnt++;

                        let tmp = getAreaFileInfo(info);

                        tmp.screenXY.push(vScreen.x);
                        tmp.screenXY.push(vScreen.y);

                        tmp.screenDepth = vScreen.z;

                        let vDist = new VIZCore.Vector3(vScreen.x, vScreen.y, 0);
                        tmp.distFromCenter = 0;

                        arrAreaInfo.push(tmp);
                    }
                }
            };
    
            //let calLoadingFileByFB = function (value, key, map) {
            //    let hitCnt = 0;
    
            //    if (value[0].lod > lod)
            //        return;
    
            //    view.Shader.BeginFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.LOD);
    
            //    gl.disable(gl.BLEND);
            //    gl.enable(gl.DEPTH_TEST);
    
            //    for (let i = 0; i < value.length; i++) {
            //        let info = value[i];
    
            //        let xMin = info.bbox.min.x;
            //        let xMax = info.bbox.max.x;
    
            //        let yMin = info.bbox.min.y;
            //        let yMax = info.bbox.max.y;
    
            //        let zMin = info.bbox.min.z;
            //        let zMax = info.bbox.max.z;
    
            //        gl.clearColor(0, 0, 0, 0);
            //        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
            //        // 셀영역의 가로/세로 길이 측정
            //        let xCellLen = 1.0, yCellLen = 1.0, cellLenMax = 1.0;
            //        let cellBoundRadius = 1.0;
            //        let depthThickness = 0.0;
            //        {
            //            let lenX = (xMax - xMin) / 2.0;  // 반지름
            //            let lenY = (yMax - yMin) / 2.0;  // 반지름
            //            let lenZ = (zMax - zMin) / 2.0;  // 반지름
            //            let lenMax = Math.max(lenZ, (Math.max(lenX, lenY)));
            //            cellBoundRadius = lenMax;
    
            //            let vCenter = new VIZCore.Vector3(0, 0, 0);
            //            let vCorner = new VIZCore.Vector3(lenMax, lenMax, 0);
    
            //            let vScreenCenter = view.Camera.projectionMatrix.multiplyVector(vCenter);
            //            let vScreenCorner = view.Camera.projectionMatrix.multiplyVector(vCorner);
    
            //            xCellLen = Math.abs(vScreenCorner.x - vScreenCenter.x);
            //            yCellLen = Math.abs(vScreenCorner.y - vScreenCenter.y);
    
            //            cellLenMax = Math.max(xCellLen, cellLenMax);
    
            //            let vec1 = new VIZCore.Vector3(0, 0, 0);
            //            let vec2 = new VIZCore.Vector3(0, 0, cellBoundRadius);
            //            let vThick1 = view.Camera.projectionMatrix.multiplyVector(vec1);
            //            let vThick2 = view.Camera.projectionMatrix.multiplyVector(vec2);
            //            depthThickness = Math.abs(vThick2.z - vThick1.z);
            //        }
    
            //        let getInfo = function () {
            //            let cellInfo = {
            //                index: [],
            //                screenXY: [],
            //                screenDepth: 0,
            //                distFromCenter: 0,
            //                file: "",
            //                key: ""
            //            };
            //            return cellInfo;
            //        };
    
            //        let cx = xMin + (xMax - xMin) * (0.5);
            //        let cy = yMin + (yMax - yMin) * (0.5);
            //        let cz = zMin + (zMax - zMin) * (0.5);
    
            //        let vec = new VIZCore.Vector3(cx, cy, cz);
            //        let vScreen = MVPmatrix.multiplyVector(vec);
    
            //        if (vScreen.x + xCellLen < -1 || vScreen.x - xCellLen > 1 || vScreen.y + yCellLen < -1 || vScreen.y - yCellLen > 1)
            //            ;
            //        else {
            //            hitCnt++;
    
            //            let tmp = getInfo();
    
            //            tmp.screenXY.push(vScreen.x);
            //            tmp.screenXY.push(vScreen.y);
    
            //            tmp.screenDepth = vScreen.z - depthThickness;
    
            //            let vDist = new VIZCore.Vector3(vScreen.x, vScreen.y, 0);
            //            tmp.distFromCenter = vDist.length() - cellLenMax;
    
            //            let srcURL = key;
            //            let filePath = view.Data.GetStringLeft(srcURL, 0, srcURL.length - 5);
            //            //let url = filePath + '_' + info.list[0] + '.vizw';
            //            let url = srcURL;
            //            tmp.file = url;
            //            tmp.key = info.id_file;
    
            //            arrAreaInfo.push(tmp);
            //        }
            //    }
    
            //    view.Shader.EndFramebuffer();
            //};
    
            let calLoadingFileWithPersView = function (fileDataInfo) {
                if(fileDataInfo === undefined) return;
                if(fileDataInfo.tag === undefined) return;

                let info = fileDataInfo.tag;
                let hitCnt = 0;

                let cornerPosList = [];
        
                let xMin = info.bbox.min.x;
                let xMax = info.bbox.max.x;

                let yMin = info.bbox.min.y;
                let yMax = info.bbox.max.y;

                let zMin = info.bbox.min.z;
                let zMax = info.bbox.max.z;
    
                if (view.Clipping.IsClipping) {
                    let clipInfo = view.Clipping.Get();
                    if (clipInfo !== undefined) {
                        if (clipInfo.planes.length === 1) {
                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.X) {
                                if (clipInfo.planes[0].normal.x < 0) // x-
                                {
                                    if (xMin > clipInfo.planes[0].center.x)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.x > 0) // x+
                                {
                                    if (xMax < clipInfo.planes[0].center.x)
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Y) {
                                if (clipInfo.planes[0].normal.y < 0) // y-
                                {
                                    if (yMin > clipInfo.planes[0].center.y)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.y > 0) // y+
                                {
                                    if (yMax < clipInfo.planes[0].center.y) 
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Z) {
                                if (clipInfo.planes[0].normal.z < 0) // z-
                                {
                                    if (zMin > clipInfo.planes[0].center.z)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.z > 0) // z+
                                {
                                    if (zMax < clipInfo.planes[0].center.z)
                                        return;
                                }
                            }
                        }
                        else {
                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.BOX) {
                                if (xMax < clipInfo.planes[0].center.x)
                                    return;
                                if (xMin > clipInfo.planes[1].center.x)
                                    return;
                                if (yMax < clipInfo.planes[2].center.y)
                                    return;
                                if (yMin > clipInfo.planes[3].center.y)
                                    return;
                                if (zMax < clipInfo.planes[4].center.z)
                                    return;
                                if (zMin > clipInfo.planes[5].center.z)
                                    return;
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Y) {
                                if (clipInfo.planes[0].normal.y < 0) // y-
                                {
                                    if (yMin > clipInfo.planes[0].center.y)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.y > 0) // y+
                                {
                                    if (yMax < clipInfo.planes[0].center.y)
                                        return;
                                }
                            }

                            if (clipInfo.itemType === VIZCore.Enum.CLIPPING_MODES.Z) {
                                if (clipInfo.planes[0].normal.z < 0) // z-
                                {
                                    if (zMin > clipInfo.planes[0].center.z)
                                        return;
                                }

                                if (clipInfo.planes[0].normal.z > 0) // z+
                                {
                                    if (zMax < clipInfo.planes[0].center.z)
                                        return;
                                }
                            }
                        }
                    }
                }
    
                let screenMinX = 0, screenMaxX = 0, screenMinY = 0, screenMaxY = 0;
                let screenMinZ = -1;

                {
                    let cornerTestPosList = [];
                    //cornerTestPosList.push(new VIZCore.Vector3(xMin, yMin, zMin));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMax, yMin, zMin));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMax, yMax, zMin));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMin, yMax, zMin));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMin, yMin, zMax));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMax, yMin, zMax));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMax, yMax, zMax));
                    //cornerTestPosList.push(new VIZCore.Vector3(xMin, yMax, zMax));
                    cornerTestPosList[0] = (new VIZCore.Vector3(xMin, yMin, zMin));
                    cornerTestPosList[1] = (new VIZCore.Vector3(xMax, yMin, zMin));
                    cornerTestPosList[2] = (new VIZCore.Vector3(xMax, yMax, zMin));
                    cornerTestPosList[3] = (new VIZCore.Vector3(xMin, yMax, zMin));
                    cornerTestPosList[4] = (new VIZCore.Vector3(xMin, yMin, zMax));
                    cornerTestPosList[5] = (new VIZCore.Vector3(xMax, yMin, zMax));
                    cornerTestPosList[6] = (new VIZCore.Vector3(xMax, yMax, zMax));
                    cornerTestPosList[7] = (new VIZCore.Vector3(xMin, yMax, zMax));

                    let posLineIdxList = [[0, 3, 4], [0, 1, 5], [1, 2, 6], [2, 3, 7], [4, 8, 11], [5, 8, 9], [6, 9, 10], [7, 10, 11]];
                    let linePosIdxList = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [7, 4]];

                    // 실제 사용될 포인트 등록 
                    for (let j = 0; j < cornerTestPosList.length; j++) {
                        let vCornerScreenPosZ = nearPlane[0] * cornerTestPosList[j].x + nearPlane[1] * cornerTestPosList[j].y + nearPlane[2] * cornerTestPosList[j].z + nearPlane[3];
                        if (vCornerScreenPosZ >= -1) {
                            cornerPosList.push(new VIZCore.Vector3(cornerTestPosList[j].x, cornerTestPosList[j].y, cornerTestPosList[j].z));
                        }
                        else {
                            for (let k = 0; k < 3 ; k++ )
                            {
                                let idx1 = linePosIdxList[posLineIdxList[j][k]][0];
                                let idx2 = linePosIdxList[posLineIdxList[j][k]][1];

                                let vCornerScreenPosZ1 = nearPlane[0] * cornerTestPosList[idx1].x + nearPlane[1] * cornerTestPosList[idx1].y + nearPlane[2] * cornerTestPosList[idx1].z + nearPlane[3];
                                let vCornerScreenPosZ2 = nearPlane[0] * cornerTestPosList[idx2].x + nearPlane[1] * cornerTestPosList[idx2].y + nearPlane[2] * cornerTestPosList[idx2].z + nearPlane[3];

                                if (vCornerScreenPosZ1 < -1 && vCornerScreenPosZ2 < -1)
                                    continue;

                                let projLen1 = nearPlane[0] * cornerTestPosList[idx1].x + nearPlane[1] * cornerTestPosList[idx1].y + nearPlane[2] * cornerTestPosList[idx1].z + nearPlane[3];
                                let projLen2 = nearPlane[0] * cornerTestPosList[idx2].x + nearPlane[1] * cornerTestPosList[idx2].y + nearPlane[2] * cornerTestPosList[idx2].z + nearPlane[3];

                                projLen1 = Math.abs(projLen1);
                                projLen2 = Math.abs(projLen2);

                                let projLenSum = projLen1 + projLen2;

                                if (Math.abs(projLenSum) < 0.000001) {
                                    cornerPosList.push(new VIZCore.Vector3(cornerTestPosList[j].x, cornerTestPosList[j].y, cornerTestPosList[j].z));
                                    continue;
                                }

                                let vCornerScreenPosProj = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(cornerTestPosList[idx1]).multiplyScalar(projLen2 / projLenSum),
                                    new VIZCore.Vector3().copy(cornerTestPosList[idx2]).multiplyScalar(projLen1 / projLenSum));

                                //let projTest = nearPlane[0] * vCornerScreenPosProj.x + nearPlane[1] * vCornerScreenPosProj.y + nearPlane[2] * vCornerScreenPosProj.z + nearPlane[3];
                                //let vCornerScreenPos = MVPmatrix.multiplyVector(vCornerScreenPosProj);

                                cornerPosList.push(new VIZCore.Vector3(vCornerScreenPosProj.x, vCornerScreenPosProj.y, vCornerScreenPosProj.z));
                            }
                        }
                    }

                    let vModelCenter = new VIZCore.Vector3().copy(info.bbox.center);
                    let vModelCenterScreenPos = MVPmatrix.multiplyVector(vModelCenter);

                    for (let j = 0; j < cornerPosList.length; j++) {
                        let vCornerScreenPos = MVPmatrix.multiplyVector(cornerPosList[j]);

                        if (j === 0) {
                            screenMinX = screenMaxX = vCornerScreenPos.x;
                            screenMinY = screenMaxY = vCornerScreenPos.y;
                            screenMinZ = vCornerScreenPos.z;
                        }
                        else {
                            screenMinX = Math.min(screenMinX, vCornerScreenPos.x);
                            screenMaxX = Math.max(screenMaxX, vCornerScreenPos.x);
                            screenMinY = Math.min(screenMinY, vCornerScreenPos.y);
                            screenMaxY = Math.max(screenMaxY, vCornerScreenPos.y);
                            screenMinZ = Math.min(screenMinZ, vCornerScreenPos.z);
                        }
                    }
                }

                let minScreenSize = [0.005, 0.005];
                let bbScreenWidth = screenMaxX - screenMinX;
                let bbScreenHeight = screenMaxY - screenMinY;

                if (cornerPosList.length > 0 && bbScreenWidth > minScreenSize[0] && bbScreenHeight > minScreenSize[1]) {
                    let cx = xMin + (xMax - xMin) * (0.5);
                    let cy = yMin + (yMax - yMin) * (0.5);
                    let cz = zMin + (zMax - zMin) * (0.5);

                    let vScreen = new VIZCore.Vector3((screenMinX + screenMaxX) / 2.0, (screenMinY + screenMaxY) / 2.0, screenMinZ);
                    
                    if (screenMaxX < -1.0 || screenMinX > 1.0 || screenMaxY < -1.0 || screenMinY > 1.0 )
                        ;
                    else {
                        hitCnt++;

                        let tmp = getAreaFileInfo(info);

                        tmp.screenXY.push(vScreen.x);
                        tmp.screenXY.push(vScreen.y);

                        tmp.screenDepth = vScreen.z;

                        let vDist = new VIZCore.Vector3(vScreen.x, vScreen.y, 0);
                        tmp.distFromCenter = 0;

                        //let srcURL = key;
                        //let filePath = view.Data.GetStringLeft(srcURL, 0, srcURL.length - 5);
                        //let url = filePath + '_' + info.list[0] + '.vizw';
                        //let url = srcURL;

                        arrAreaInfo.push(tmp);
                    }
                }
            };
    
            let fnSort_LOD = function (a, b) {
                // LOD 정렬
                if (a.lod > b.lod)
                    return 1;
                if (a.lod < b.lod)
                    return -1;
    
                if (a.lod_sequence > b.lod_sequence)
                    return 1;
                else if (a.lod_sequence < b.lod_sequence)
                    return -1;
    
    
                return 0;
            };
    
            let fnSort_Distance = function (a, b) {
                if (a.screenDepth > b.screenDepth)
                    return 1;
                else if (a.screenDepth < b.screenDepth)
                    return -1;
                return 0;
            };
    
            let fnSort = function (a, b) {
                if (view.Configuration.Render.Priority === VIZCore.Enum.RENDER_PRIORITY.LOD) {
                    // LOD 정렬
                    if (a.lod > b.lod)
                        return 1;
                    if (a.lod < b.lod)
                        return -1;
    
                    //// 2차 거리 정렬
                    //if (a.screenDepth > b.screenDepth)
                    //    return 1;
                    //if (a.screenDepth < b.screenDepth)
                    //    return -1;
    
                    return 0;
                }
                else
                {
                    //if (a.screenDepth > b.screenDepth)
                    //    return 1;
                    //else if (a.screenDepth < b.screenDepth)
                    //    return -1;
                    //return 0;
                    // LOD 정렬
                    if (a.lod > b.lod)
                        return 1;
                    if (a.lod < b.lod)
                        return -1;
    
                    // 2차 거리 정렬
                    if (a.screenDepth > b.screenDepth)
                        return 1;
                    if (a.screenDepth < b.screenDepth)
                        return -1;
                }
            };

              
            //Key: modelFile Key, 
            //value : true
            let mapLockCache = new Map();
        
            if (view.Camera.perspectiveView) 
            {
                // 원근
                for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                    let fileInfo = scope.ListFileInfoItem[i];
                    if(!fileInfo.IsFileHeader) continue;    //단일 VIZW 포함하지 않음

                    if(mapLockCache.has(fileInfo.id_file) === false) {
                        if(fileInfo.LockCahceData) {    //Cache 항상 사용

                            for(let j = 0 ; j < fileInfo.Mesh.length ; j++) {
                                let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[j]);
                                if(fileDataInfo === undefined) continue;
                                if(fileDataInfo.tag === undefined) continue;
                                let info = fileDataInfo.tag;

                                let tmp = getAreaFileInfo(info);
                                tmp.screenXY[0] = 0;
                                tmp.screenXY[1] = 0;

                                arrAreaInfo.push(tmp);
                            }
                            mapLockCache.set(fileInfo.id_file, true);
                            continue;
                        }
                    }
                    else 
                        continue;

                    for(let j = 0 ; j < fileInfo.Mesh.length ; j++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[j]);
                        
                        calLoadingFileWithPersView(fileDataInfo);
                    }
                }
            }
            else {

                // 평행
                for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                    let fileInfo = scope.ListFileInfoItem[i];
                    if(!fileInfo.IsFileHeader) continue;    //단일 VIZW 포함하지 않음

                    if(mapLockCache.has(fileInfo.id_file) === false) {
                        if(fileInfo.LockCahceData) {    //Cache 항상 사용

                            for(let j = 0 ; j < fileInfo.Mesh.length ; j++) {
                                let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[j]);
                                if(fileDataInfo === undefined) continue;
                                if(fileDataInfo.tag === undefined) continue;
                                let info = fileDataInfo.tag;

                                let tmp = getAreaFileInfo(info);
                                tmp.screenXY[0] = 0;
                                tmp.screenXY[1] = 0;

                                arrAreaInfo.push(tmp);
                            }
                            mapLockCache.set(fileInfo.id_file, true);
                            continue;
                        }
                    }
                    else 
                        continue;

                    for(let j = 0 ; j < fileInfo.Mesh.length ; j++) {
                        let fileDataInfo = fileInfo.mapFileDataInfoItem.get(fileInfo.Mesh[j]);

                        calLoadingFile(fileDataInfo);
                    }
                }
            }

            {
                
                //Key: modelFile Key, 
                //value : new Map() //URL
                let mapSelection = new Map();
                let mapISOlateView = new Map();
                let mapHide = new Map();

                // 선택 정보 소팅
                for (let i = 0; i < view.Data.Objects.length; i++) {
                    let object = view.Data.Objects[i];
                    let hidecnt = 0;
                    
                    if(mapLockCache.has(object.id_file)) { 
                        continue;
                    }

                    for (let j = 0; j < object.tag.length; j++) {
                        let body = object.tag[j];

                        let bodyAction = view.Data.ShapeAction.GetAction(object.id_file, body.origin_id);

                        if(bodyAction === undefined)
                        {
                            console.log("[VIZCore] DELETE : " + object.id_file + ", id : "+ body.origin_id);
                            //continue;
                        }

                        if (bodyAction.selection === true) {
                            //mapSelection.set(object.link, object.link);

                            let mapSelectFileKeyURL = undefined;

                            if(mapSelection.has(object.id_file)) {
                                mapSelectFileKeyURL = mapSelection.get(object.id_file);
                            }
                            else {
                                mapSelectFileKeyURL = new Map();
                                mapSelection.set(object.id_file, mapSelectFileKeyURL);
                            }

                            if(!mapSelectFileKeyURL.has(object.link))
                                mapSelectFileKeyURL.set(object.link, object.link);

                            break;
                        }
                        else {
                            // 0 은 메인뷰이므로 검사하지 않음
                            for(let j = 1 ; j < view.MultiView.length ; j++) {
                                if(!view.MultiView[j].Visible()) continue;
                                if(!view.MultiView[j].UseisolateView) continue;
                                if(view.MultiView[j].ObjectIDs.findIndex(e => e === body.bodyId) < 0) continue;
                                //mapISOlateView.set(object.link, object.link);\

                                let mapISOlateFileKeyURL = undefined;
                                if(mapISOlateView.has(object.id_file)) {
                                    mapISOlateFileKeyURL = mapISOlateView.get(object.id_file);
                                }
                                else {
                                    mapISOlateFileKeyURL = new Map();
                                    mapISOlateView.set(object.id_file, mapISOlateFileKeyURL);

                                }
    
                                if(!mapISOlateFileKeyURL.has(object.link))
                                    mapISOlateFileKeyURL.set(object.link, object.link);

                                break;
                            }
                        }
    
                        if (bodyAction.visible === false) {
                            hidecnt++;
                        }
                    }
    
                    if(hidecnt === object.tag.length) {
                        //mapHide.set(object.link, object.link);
                        let mapHideFileKeyURL = undefined;
                        if(mapHide.has(object.id_file)) {
                            mapHideFileKeyURL = mapHide.get(object.id_file);
                        }
                        else {
                            mapHideFileKeyURL = new Map();
                            mapHide.set(object.id_file, mapHideFileKeyURL);
                        }

                        if(!mapHideFileKeyURL.has(object.link))
                            mapHideFileKeyURL.set(object.link, object.link);
                    }
                        
                }

                // 선택 정보일 경우 screenDepth를 -2로 설정(다운로드 순서 정의에 사용)                
                //예외 형상 우선 순위 
                for (let i = arrAreaInfo.length -1; i >=0; i--) {


                    if(mapLockCache.has(arrAreaInfo[i].Key)) {
                        arrAreaInfo[i].screenDepth = -3;
                        continue;
                    }

                    if (mapHide.has(arrAreaInfo[i].Key)) {                        
                        if(mapHide.get(arrAreaInfo[i].Key).has(arrAreaInfo[i].Url)) {

                            //23.03.07 메쉬블록에서 일부 숨겨진 개체만 있는 경우 목록에서 제외되는 오류가 발생
                            // 일시적 오류 방지처리
                            //arrAreaInfo.splice(i, 1);

                            //arrAreaInfo[i].screenDepth = 2;
                            continue;
                        }

                    }
                    else if (mapSelection.has(arrAreaInfo[i].Key)) {
                        if(mapSelection.get(arrAreaInfo[i].Key).has(arrAreaInfo[i].Url))
                            arrAreaInfo[i].screenDepth = -2;
                    }
                    else if (mapISOlateView.has(arrAreaInfo[i].Key)) {
                        if(mapISOlateView.get(arrAreaInfo[i].Key).has(arrAreaInfo[i].Url))
                            arrAreaInfo[i].screenDepth = -2;
                    }
                }
    
                // screenDepth이 작은 순서데로 소팅
                if (arrAreaInfo.length > 0) {
                    //arrAreaInfo.sort(fnSort);
    
                    if (view.Configuration.Render.Priority === VIZCore.Enum.RENDER_PRIORITY.DISTANCE) {
                        arrAreaInfo.sort(fnSort_Distance);
                    }
                    else if (view.Configuration.Render.Priority === VIZCore.Enum.RENDER_PRIORITY.SHUFFLE) {
                        // lod 정렬
                        arrAreaInfo.sort(fnSort_LOD);
                        let arrLOD = arrAreaInfo.slice(0, arrAreaInfo.length);
    
                        // 거리 정렬
                        arrAreaInfo.sort(fnSort_Distance);
                        let arrDistance = arrAreaInfo.slice(0, arrAreaInfo.length);
    
                        // map 셔플 작업
                        let mapSort = new Map();
                        // for (let s = 0; s < arrLOD.length; s++) {
                        //     if(!mapSort.has(arrLOD[s].file))
                        //     {
                        //         mapSort.set(arrLOD[s].file, arrLOD[s]);
                        //     }
    
                        //     if (!mapSort.has(arrDistance[s].file)) {
                        //         mapSort.set(arrDistance[s].file, arrDistance[s]);
                        //     }
                        // }
                        let arrDistanceCnt = 1;
                        let arrLODCnt = 1;
    
                        while(arrLOD.length !== 0 || arrDistance.length !== 0)
                        {
                            let addLOD = false;
                            let addDistance = false;
                            
                            if(arrDistance.length > 0) {
                                let dcnt = arrDistanceCnt;
                                
                                while(!addDistance && arrDistance.length !== 0)
                                {
                                    let szDistanceKey = arrDistance[0].Key + arrDistance[0].Url;

                                    if(!mapSort.has(szDistanceKey))
                                    {
                                        mapSort.set(szDistanceKey, arrDistance[0]);
                                        arrDistance.splice(0, 1);
        
                                        dcnt--;
                                        if(dcnt <= 0)
                                            addDistance = true;
                                    }
                                    else
                                    {
                                        arrDistance.splice(0, 1);
                                    }
                                }
                            }
    
                            if(arrLOD.length > 0) {
                                let lcnt = arrLODCnt;                                
                                while(!addLOD && arrLOD.length !== 0)
                                {
                                    let szLodKey = arrLOD[0].Key + arrLOD[0].Url;

                                    if(!mapSort.has(szLodKey))
                                    {
                                        mapSort.set(szLodKey, arrLOD[0]);
                                        arrLOD.splice(0, 1);
        
                                        lcnt--;
                                        if(lcnt <= 0)
                                            addLOD = true;
                                    }
                                    else
                                    {
                                        arrLOD.splice(0, 1);
                                    }
                                }
                            }
                            
                        }
    
                        arrAreaInfo.splice(0, arrAreaInfo.length);
                        let shuffle = function (value, key, map) {
                            arrAreaInfo.push(value);
                        };
    
                        //mapSort.forEach(shuffle);
                        arrAreaInfo = Array.from(mapSort.values());
                    }
                    else {
                        // lod 정렬
                        arrAreaInfo.sort(fnSort_LOD);
                    }
                }
    
                if (view.IsUseProgressive()) 
                {
                    // let secClear = function (value, key, map) {
                    //     value = view.Data.Objects.length;
                    //     map.set(key, value);
                    // };
                    // view.Data.AreaSequenceMap.forEach(secClear);
    
                    // // 렌더링 제약 시퀀스 업데이트(선택 정보 우선, 거리순 정렬)
                    // for (let i = 0; i < arrAreaInfo.length; i++) {
                    //     if (mapSelection.has(arrAreaInfo[i].file)) {
                    //         view.Data.AreaSequenceMap.set(arrAreaInfo[i].file, -2);
                    //     }
                    //     else
                    //     view.Data.AreaSequenceMap.set(arrAreaInfo[i].file, i);
                    // }

                    // 렌더링 제약 스퀀스 초기화
                    let secClearNum = view.Data.Objects.length;
                    let clearFileInfo = undefined;
                    let secClear = function (url, key, map) {
                        let fileDataInfo = clearFileInfo.mapFileDataInfoItem.get(url);
                        if(fileDataInfo.tag === undefined) return;

                        fileDataInfo.tag.lod_sequence = secClearNum;
                    };

                    for(let i = 0 ; i < scope.ListFileInfoItem.length ; i++) {
                        clearFileInfo = scope.ListFileInfoItem[i];
                        clearFileInfo.Mesh.forEach(secClear);
                    }


                     // 렌더링 제약 시퀀스 업데이트(선택 정보 우선, 거리순 정렬)
                    for (let i = 0; i < arrAreaInfo.length; i++) {

                        let sec = i;
                        //선택개체 순위 변경
                        if (mapSelection.has(arrAreaInfo[i].Key)) {
                            if(mapSelection.get(arrAreaInfo[i].Key).has(arrAreaInfo[i].Url)) {
                                sec = -2;
                            }
                        }

                        let fileAreaData = scope.GetFileAreaData(arrAreaInfo[i].Key, arrAreaInfo[i].Url);
                        if(fileAreaData === undefined) continue;
                        
                        fileAreaData.lod_sequence = sec;
                    }
                }
    
                // Objects 정렬
                view.Renderer.Sort();
                view.Renderer.SetViewDistanceBBox();
                //console.log("request file num " + arr.length);
            }
    
            //let cnt = Math.min(3000, arrAreaInfo.length);
            let cnt = arrAreaInfo.length;
            if(view.Configuration.Render.Cache.Enable === true)
            {
                cnt = Math.min(3000, arrAreaInfo.length);
            }

            let result = [];
    
            let tri_num = 0;

            for (let i = 0; i < cnt; i++) {
                //result[i] = arrAreaInfo[i].Url;

                let fileInfo = scope.GetFileInfo(arrAreaInfo[i].Key);
                if(fileInfo === undefined) continue;
                //단일 파일 제거
                if(!fileInfo.IsFileHeader) continue;

                let meshFileInfo = view.Data.ModelFileUrlInfo();
                meshFileInfo.Key = arrAreaInfo[i].Key;
                meshFileInfo.Url = arrAreaInfo[i].Url;
                
                //22-12-02 ssjo 
                // 최소 값으로 하는 경우 모든 캐쉬를 지워서 깜빡거리기 때문에
                // 추가 후 기준으로 캐쉬 여부 설정
                //if(view.IsUseRenderCache() && tri_num + arr[i].tri_num > view.Configuration.Render.Cache.LimitCount) {

                
                let fileAreaItem = scope.GetFileAreaData(meshFileInfo.Key, meshFileInfo.Url);
                if(fileAreaItem !== undefined) {
                    if( view.IsUseRenderCache() && tri_num > view.Configuration.Render.Cache.LimitCount){
                        //view.Data.AreaCacheMap.set(result[i], false);
                        fileAreaItem.cache = false;
                    }
                    else{
                        //view.Data.AreaCacheMap.set(result[i], true);
                        fileAreaItem.cache = true; 
                    }
                }
    
                tri_num += arrAreaInfo[i].tri_num;

                
                result.push(meshFileInfo);
    
                //메쉬블록 별 정점 표시
                //console.log("MeshBlock[" + i + "] : " + arr[i].tri_num);
            }
    
            view.Renderer.UpdateCache();
            return result;
        };
        
        /**
         * 
         * @param {Array<Data.ModelFileUrlInfo>} fileUrlInfoList 
         * @param {Boolean} updateCacheList 
         * @returns 
         */
        this.SetDownloadObjectCache = function (fileUrlInfoList, updateCacheList) {

            const startNum = view.RenderMeshBlockCacheNum;

            //LOD object 정점데이터 cache 관리
            if (!updateCacheList) 
            {
                if (view.IsUseRenderCache() && !view.lockMeshBlockCache) {
                    // 최초 다운로드로 cache 갯수로 확인
                    for (let i = 0; i < fileUrlInfoList.length; i++) {
                        
                        let fileDataInfo = scope.GetFileDataInfoItem(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url, VIZCore.Enum.FILEINFOTYPE.MESH);
                        if(fileDataInfo === undefined) continue;
                        // 로딩되어 있으면 cache 상태값 확인
                        if(fileDataInfo.Download) {
                            let fileArea = scope.GetFileAreaData(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url);

                            //Object로 연결
                            let objectsCache = fileArea.cache;
                            for (let jj = 0; jj < fileArea.objects.length; jj++) {
                                fileArea.objects[jj].flag.cache = objectsCache;
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i < fileUrlInfoList.length; i++) {
                        let fileDataInfo = scope.GetFileDataInfoItem(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url, VIZCore.Enum.FILEINFOTYPE.MESH);
                        if(fileDataInfo === undefined) continue;
                        // 로딩되어 있으면 cache 상태값 확인
                        if(fileDataInfo.Download) {
                            let fileArea = scope.GetFileAreaData(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url);
                            
                            //Object로 연결
                            let objectsCache = true; //fileArea.cache
                            for (let jj = 0; jj < fileArea.objects.length; jj++) {
                                //fileArea.objects[jj].flag.cache = objectsCache;
                                fileArea.objects[jj].flag.cache = objectsCache;
                            }
                        }                        
                    }
                }
                return;
            }

            // Object List 삭제
            let deleteList = [];

            //let mapUrl = new Map();

            {
                for (let i = fileUrlInfoList.length - 1; i >= 0; i--) {

                    let fileDataInfo = scope.GetFileDataInfoItem(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url, VIZCore.Enum.FILEINFOTYPE.MESH);
                        
                    // 로딩되어 있으면 cache 상태값 확인
                    if(fileDataInfo.Download) {
                        let fileArea = scope.GetFileAreaData(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url);

                        //Object로 연결
                        let oldCache = fileArea.cache;
                        if(oldCache) {
                            //Cache 활성화 상태에서 다운로드가 아직 이뤄지지 않았을 경우는 제외하지 않음.
                            if(fileArea.objects.length > 0) {
                                if (fileArea.objects[0].attribs.a_index.buffer !== null) {
                                    fileUrlInfoList.splice(i, 1);
                                    continue;
                                }
                            }
                        }
                    }

                    let downloadingKey = fileUrlInfoList[i].Key + fileUrlInfoList[i].Url;

                    let downloading = scope.LODDownloadMap.get(downloadingKey);
                    // 다운로드 중이면 제거
                    if (downloading !== undefined && downloading.Status === 1) {
                        fileUrlInfoList.splice(i, 1);
                        continue;
                    }

                    // 캐시 재다운로드 삭제 리스트
                    deleteList.push(fileUrlInfoList[i]);
                }
            }

            // let checkDelete = function (value, key, map) {
            //     // 다운로드해야 할 목록에 없으면 삭제
            //     if (!mapUrl.has(key)) {
            //         // Objects 삭제
            //         deleteList.push(key);
            //         //console.log("DeleteData : " + key);
            //     }
            // };

            //view.Data.LODMap.forEach(checkDelete);
            view.Renderer.ClearProcess(deleteList);
            //view.Data.ClearProcess(deleteList, view.Data.LODMap);

            // 다운로드 중인 데이터 중 취소 해야 하는 데이터 변경
            for (let d = 0; d < deleteList.length; d++) {
                let download = scope.LODDownloadMap.get(deleteList[d]);
                if (download !== undefined && download.Status === 1) {
                    download.Status = 3; // Cancel
                    //console.log("CancelData : " + download.Url);
                    //view.Data.LODDownloadMap.delete(deleteList[d]);
                }
            }

            // 다운로드 요청 대기중인 목록 삭제
            let deletelist = function (value, key, map) {
                if (value.Status === 0)
                    map.delete(key);
                else if(value.Status === 1)
                {
                    console.log("다운로드 목록 있음");
                }
            };
            scope.LODDownloadMap.forEach(deletelist);

            //for (let i = 0; i < view.Data.Objects.length; i++) {
            //    if (view.Data.Objects[i].flag.cache) {
            //        view.CurrentRenderMeshBlockCacheNum++;
            //    }
            //}
        };

        /**
         * 
         * @param {Array<Data.ModelFileUrlInfo>} fileUrlInfoList 
         * @param {*} deleteCacheList 
         * @returns 
         */
        this.UpdateObjectCache = function (fileUrlInfoList, deleteCacheList) {

            const startNum = view.RenderMeshBlockCacheNum;
    
            for (let ii = fileUrlInfoList.length - 1; ii >= 0; ii--) {
                let fileDataInfo = scope.GetFileDataInfoItem(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url, VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH);
                        
                // 로딩되어 있으면 cache 상태값 확인
                if(fileDataInfo.Download) {
                    let fileArea = scope.GetFileAreaData(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url);
    
                    //Object로 연결
                    let oldCache = fileArea.cache;
                    if(oldCache && deleteCacheList) {
                        //Cache 활성화 상태에서 다운로드가 아직 이뤄지지 않았을 경우는 제외하지 않음.
                        if(fileArea.objects.length > 0) {
                            if (fileArea.objects[0].attribs.a_index.buffer !== null) {
                                fileUrlInfoList.splice(ii, 1);
                            }
                        }
                    }
                }
            }//  //for(urlList.length .. )
    
            if (view.lockMeshBlockCache && deleteCacheList) {
                for (let ii = 0; ii < urlList.length; ii++) {
                    let fileDataInfo = scope.GetFileDataInfoItem(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url, VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH);
                    // 로딩되어 있으면 cache 상태값 확인
                    if(fileDataInfo.Download) {
                        let fileArea = scope.GetFileAreaData(fileUrlInfoList[i].Key, fileUrlInfoList[i].Url);

                        if(fileArea.objects.length > 0) {
                            let objectsCache = (view.CurrentRenderMeshBlockCacheNum + objects.length < startNum) ? true : false;
                            for (let jj = 0; jj < objects.length; jj++) {
                                objects[jj].flag.cache = objectsCache;
                            }
                            view.CurrentRenderMeshBlockCacheNum += objects.length;
                        }
                    }
                    view.CurrentRenderMeshBlockCacheNum += objects.length;
                }//  //for(urlList.length .. )
            }
            return;
        };

//#endregion LOD Process

    }    
}

export default ModelFileManager

 