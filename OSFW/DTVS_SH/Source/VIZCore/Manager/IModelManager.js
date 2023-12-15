/**
 * VIZCore Model 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
 class Model {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * 모델 닫기
         * @example
         * vizwide3d.Model.Close();
         *
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         */
        this.Close = function (callback) {
            scope.Main.Model.Clear(callback);
        };

        /**
         * 특정 모델 닫기
         * @param {Array<String>} fileKeys 
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * models.push({url:"./VIZCore/Model/Sample2_wh.vizw", key:"sample2"});
         * models.push({url:"./VIZCore/Model/Sample3_wh.vizw", key:"sample3"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * let fileKeys = ["sample1", "sample2"];
         * 
         * let callback
         * vizwide3d.Model.CloseFile(fileKeys);
         */
        this.CloseFile = function(fileKeys, callback){
            scope.Main.Model.Close(fileKeys, callback);
        };

        /**
         * 단일 VIZWeb3D 용 VIZW 모델 파일 열기
         * @param {string} model URI String
         * @example
         * vizwide3d.Model.Close();
         *
         * vizwide3d.Model.Open("./VIZCore/Model/Sample.vizw");
         */
        this.Open = function (model) {
            let models = [];
            models.push(model);
            scope.Main.Model.Add(models);
        };

        /**
         * 복수개의 VIZWeb3D 용 VIZW 모델 파일 추가
         * @param {Array} models URI Array
         * @example
         * vizwide3d.Model.Close();
         *
         * let models = [];
         * models.push("./VIZCore/Model/Sample1.vizw");
         * models.push("./VIZCore/Model/Sample2.vizw");
         * models.push("./VIZCore/Model/Sample3.vizw");
         * models.push("./VIZCore/Model/Sample4.vizw");
         *
         * vizwide3d.Model.Add(models);
         */
        this.Add = function (models) {
            scope.Main.Model.Add(models);
        };

        /**
         * 단일 VIZWide3D 용 VIZW 파일의 헤더 열기
         * @param {String} model URI
         * @param {String} key File Key(지정하지 않으면 Guid생성)         
         * @param {function(String, VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME)} onload 개별 다운로드 이벤트 (Key) - 지정하시지 않는 경우 OnModelOpenedEvent() 호출
         * @example
         * 
         *  function onLoadModelSample1(key, loadType) {
         * 
         *     if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.HEADER)
         *         console.log("onLoad Header");
         *     if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.STRUCTURE)
         *         console.log("onLoad Structure");
         *     if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.PROPERTY)
         *         console.log("onLoad Property");
         *     if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MATERIAL)
         *         console.log("onLoad Material");
         *     if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH)
         *         console.log("onLoad Mesh");
         *  }
         * 
         * vizwide3d.Model.Close();
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw", "FileID123", onLoadModelSample1);
         */
        this.OpenHeader = function (model, key, onload) {
            if(scope.Main.IsVIZWide3DProduct() === false)
            {
                console.log("Notification :: ", "OpenHeader", "function is not supported by the current product.");
                return ;
            }
                
            scope.Main.Model.Add_Header(model, key, onload);
        };

        /**
         * VIZWide3D 용 VIZW 파일의 헤더 추가
         * @param {Array} models URI Array
         * @example
         * 
         * function example1 () {
         *      vizwide3d.Model.Close();
         *
         *      let models = [];
         *      models.push("./VIZCore/Model/Sample1_wh.vizw");
         *      models.push("./VIZCore/Model/Sample2_wh.vizw");
         *      models.push("./VIZCore/Model/Sample3_wh.vizw");
         *      models.push("./VIZCore/Model/Sample4_wh.vizw");
         *
         *      vizwide3d.Model.AddHeader(models);
         * }
         * 
         * function example2 () {
         *      //AddHeader Model Key example
         * 
         *      vizwide3d.Model.Close();
         * 
         *      function onLoadModelSample1(key, loadType) {
         * 
         *          if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.STRUCTURE)
         *              console.log("onLoad Structure");
         *          if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.PROPERTY)
         *              console.log("onLoad Property");
         *          if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MATERIAL)
         *              console.log("onLoad Material");
         *          if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.MESH)
         *              console.log("onLoad Mesh");
         *      }
         *
         *      let models = [];
         *      models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1", onload : onLoadModelSample1});
         *      models.push({url:"./VIZCore/Model/Sample2_wh.vizw", key:"sample2"});
         *      models.push({url:"./VIZCore/Model/Sample3_wh.vizw", key:"sample3"});
         *      models.push({url:"./VIZCore/Model/Sample4_wh.vizw", key:"sample4"});
         *
         *      vizwide3d.Model.AddHeader(models);
         * } 
         * 
         */
        this.AddHeader = function (models) {
            if(scope.Main.IsVIZWide3DProduct() === false)
            {
                console.log("Notification :: ", "AddHeader", "function is not supported by the current product.");
                return ;
            }
             
            for (let i = 0; i < models.length; i++) {
                if(typeof models[i] === "string")
                    scope.Main.Model.Add_Header(models[i]);
                else{
                    let obj = models[i];
                    scope.Main.Model.Add_Header(obj.url, obj.key, obj.onload);
                }
            }
        };

        /**
         * 파일 목록 반환
         * @return {Array} Open File Keys
         * @example
         *
         * let files = vizwide3d.Model.GetOpenFiles();
         * console.log(files);
         */
        this.GetOpenFiles = function()
        {
            return scope.Main.Data.GetOpenFiles();
        };

        this.SetDownloadThreadCount = function (count) {
            scope.Main.Configuration.DownloadThreadCount = count;
        };

        /**
         * 로딩된 모델의 BoundBox 반환
         * @return {VIZCore.BBox} BoundBox
         * @example
         * vizwide3d.Model.GetBoundBox();
         */
        this.GetBoundBox = function(){
            if(scope.Main.Data.ObjectsBBox !== undefined)
                return new VIZCore.BBox().copy(scope.Main.Data.ObjectsBBox);
            else
                return new VIZCore.BBox();
        };

        /**
         * 메쉬 로딩 시 이벤트
         * @param {*} key File Key
         * @param {Number} originId Node Origin ID
         * @param {Function} onload event
         * @example         
         *      function onLoadMesh(key, originId) {
         *          console.log("onLoadMesh");
         *      }
         * 
         *      function onLoadModelSample1(key, loadType) {
         *          if(loadType === VIZCore.Enum.CONFIG_KEY.LOADER.COMPLETEDTIME.STRUCTURE) {
         *              vizwide3d.Model.SetMeshLoadByOrigin(key, 10, onLoadMesh);
         *          }
         *      }
         *
         *      let models = [];
         *      models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1", onload : onLoadModelSample1});
         *      vizwide3d.Model.AddHeader(models);
         */
        this.SetMeshLoadByOrigin = function (key, originId, onload) {

        };

        //=======================================
        // Event
        //=======================================
        /**
         * 모델 열기 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Loading Completed Event (로딩 완료 이벤트)
         * vizwide3d.Model.OnModelOpenedEvent(OnModelOpenedEvent);
         *
         * //=======================================
         * // Event :: OnModelOpenedEvent
         * //=======================================
         * let OnModelOpenedEvent = function (event) {
         *     // Enable Xray
         *     vizwide3d.View.Xray.Enable(true);
         * }
         */
        this.OnModelOpenedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.View.Load_Completed, listener);
        };

         /**
         * 모델 로딩 프로그레스 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Progress Event (로딩 이벤트)
         * vizwide3d.Model.OnStreamProgressChangedEvent(OnProgressEvent);
         *
         * //=======================================
         * // Event :: OnProgressEvent
         * //=======================================
         * let OnProgressEvent = function (event) {
         *     console.log("Total : ",  event.data.total, "Current : ", event.data.current, "Percentage : ", event.data.percentage);
         * }
         */
        this.OnStreamProgressChangedEvent = function(listener){
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Progress.Percentage, listener);
        };

        /**
         * 구조정보 로딩 완료 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Structure Completed Event (구조정보 로딩 완료 이벤트)
         * vizwide3d.Model.OnStructureCompletedEvent(OnStructureCompletedEvent);
         *
         * //=======================================
         * // Event :: OnStructureCompletedEvent
         * //=======================================
         * let OnStructureCompletedEvent = function (event) {
         * }
         */
         this.OnStructureCompletedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.View.Structure_Completed, listener);
        };

        /**
         * 속성정보 로딩 완료 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Property Completed Event (구조정보 로딩 완료 이벤트)
         * vizwide3d.Model.OnPropertyCompletedEvent(OnPropertyCompletedEvent);
         *
         * //=======================================
         * // Event :: OnPropertyCompletedEvent
         * //=======================================
         * let OnPropertyCompletedEvent = function (event) {
         * }
         */
         this.OnPropertyCompletedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.View.Property_Completed, listener);
        };

        /**
         * 모델 로딩 실패 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Model Fail Event (모델 로딩 실패 이벤트)
         * vizwide3d.Model.OnExceptionEvent(OnExceptionEvent);
         *
         * //=======================================
         * // Event :: OnExceptionEvent
         * //=======================================
         * let OnExceptionEvent = function (event) {
         * }
         */
        this.OnExceptionEvent = function(listener){
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EXCEPTION_CODE.DOWNLOAD_FAIL, listener);
        };


    }
}

export default Model;