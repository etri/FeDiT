class WSClient{
    websocket;
    OnOpenCallback = undefined;
    OnCloseCallback = undefined;
    OnMessageCallback = undefined;
    timer_id = 0;
    constructor(server_url){
        console.log(server_url);
        // 페이지가 https 로 서비스되면 wss, http 면 ws 를 사용한다.
        // (server_url 에 ws://, wss:// 가 이미 포함된 경우 그대로 사용)
        let ws_url = server_url;
        if(!/^wss?:\/\//i.test(ws_url)){
            ws_url = ((location.protocol === 'https:') ? 'wss://' : 'ws://') + ws_url;
        }
        console.log('WSClient connect :', ws_url);
        this.websocket = new WebSocket(ws_url);
        this.websocket.binaryType = 'arraybuffer';
        this.websocket.onopen = (event) => {
            if(this.OnOpenCallback != undefined)
                this.OnOpenCallback(event);
            this.keepAlive(20000);
        }
        this.websocket.onclose = (event) => {
            if(this.OnCloseCallback != undefined)
                this.OnCloseCallback(event);
            cancelKeepAlive();
        }
        this.websocket.onmessage = (event) => {
            if(this.OnMessageCallback != undefined)
                this.OnMessageCallback(event);
        }
        
    }
    send(stringdata){
        this.websocket.send(stringdata);
    }

    keepAlive(timeout = 20000) { 
        let thisd = this;
        this.timer_id = setInterval(() => {
            console.log("send idle", thisd.websocket.readyState);
            if (thisd.websocket.readyState == WebSocket.OPEN) {  
                thisd.websocket.send('');  
            }      
        }, timeout);
    }

    cancelKeepAlive() {  
        if (this.timer_id) {  
            clearInterval(this.timer_id);  
        }  
    }
    /*
    ws.onmessage = (event) => {
        console.log(event.data.byteLength);
        var type = new Uint32Array(event.data, 0, 1);
        console.log("type : " + type[0]);
        if(type[0] == 1){
            var siminfo = new Float32Array(event.data, 4, 3);
            var simTime = siminfo[0];
            var windDir = siminfo[1];
            var windVel = siminfo[2];
            var density = new Float32Array(event.data, 16);
            console.log("density : "  + simTime + ", " + windDir + ", " + windVel + ", " + density.length);
        }
        else if(type[0] == 2){//u
            var u = new Float32Array(event.data, 4);
            console.log("u : " + u.length)
        }
        else if(type[0] == 3){//v
            var v = new Float32Array(event.data, 4);
            console.log("v : " + v.length)
        }
        
    }
    
    */
    
}//end of class