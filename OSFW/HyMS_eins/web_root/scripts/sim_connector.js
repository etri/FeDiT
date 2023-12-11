//여기에 시뮬레이션 서버와 통신할 데이터 주고받는 루틴 작성
class sim_connector extends WSClient{
    constructor(url){
        super(url);
        this.on_data_callback = {};
    }
    OnOpenCallback = function(event){//시뮬레이션 서버와 접속 하였을때
        console.log("서버 연결됨~~");
    }
    OnCloseCallback = function(event){//시뮬레이션 서버가 꺼져서 접속 종료되었을때
        console.log("서버 연결 종료됨~~~");
    }
    OnMessageCallback = function(event){//시뮬레이션 서버에서 데이터 수신 할때
        //console.log(event.data);
        let json = null;
        if(event.data instanceof ArrayBuffer){
            json = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(event.data)))
        }
        else{
            json = JSON.parse(event.data);
        }
        //console.log(typeof(this.on_data_callback[json.Type]));
        if(typeof(this.on_data_callback[json.Type]) !== undefined){
            this.on_data_callback[json.Type](json);
        }
    }

    RunSimulation() {
        let sendData = {
            Type: 'RunSim',
            Data: {
                //testCase : "200615154227",
                startTime : 3600,
                endTime : 4200,
                ext1 : 'text1',
                ext2 : '한글!@#$',
            }
        };
        console.log(JSON.stringify(sendData));
        super.send(JSON.stringify(sendData));
    }
    StopSimulation(){
        let sendData = {
            Type: 'StopSim'
        };
        super.send(JSON.stringify(sendData));
    }
    PauseSimulation(){
        let sendData = {
            Type: 'PauseSim'
        };
        super.send(JSON.stringify(sendData));
    }
    SetParamPos(){
        let sendData = {
            Type: 'SetParam',
            position : {
                lat : 36.1234,
                lon : 127.1234
            }
        };
        super.send(JSON.stringify(sendData));
    }
}

//let ws = new sim_connector('143.248.187.105:8869');
let ws = new sim_connector('143.248.187.105:30001/sim');