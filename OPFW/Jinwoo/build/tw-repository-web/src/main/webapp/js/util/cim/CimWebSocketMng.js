export default class CimWebSocketMng{
    static #waitingTimes = [3000, 1500, 1500];

    constructor(url, sendMsg, cbOnReceive, cbOnTimeout) {
        this._url = url;
        this._sendMsg = sendMsg;
        this._cbOnReceive = cbOnReceive;
        this._cbOnTimeout = cbOnTimeout;

        this._currentTryIndex = 0;
        this._waitTimerId = null;
        this._ws = null;
    }

    connect = () => {
        this.clearTimer();
        this._waitTimerId = setTimeout(() => {
            this.onerror();
        }, CimWebSocketMng.#waitingTimes[this._currentTryIndex]);

        this._ws = new WebSocket(this._url);
        this._ws.onopen = this.onopen;
        this._ws.onmessage = this.onmessage;
        this._ws.onclose = this.onclose;
        this._ws.onerror = this.onerror;
    }

    reconnect = () => {
        this._currentTryIndex++;
        this.closeWebSocket();
        this.connect();
    }

    closeWebSocket = () => {
        if(null!=this._ws) {
            this._ws.onopen = null;
            this._ws.onmessage = null;
            this._ws.onclose = null;
            this._ws.onerror = null;
            this._ws.close();
            this._ws = null;
        }
    }

    onopen = () => {
        this._ws.send(this._sendMsg);
    }

    onmessage = (event) => {
        this.clearTimer();
        this.closeWebSocket();
        this._cbOnReceive(event.data);
    }

    onclose = () => {
        if( this._currentTryIndex >= CimWebSocketMng.#waitingTimes.length-1 ){
            this.clearTimer();
            this.closeWebSocket();
            this._cbOnTimeout();
            return;
        }
        this.reconnect();
    }

    onerror = () => {
        this.onclose();
    }

    clearTimer = () => {
        if( null != this._waitTimerId ) {
            clearTimeout(this._waitTimerId);
            this._waitTimerId = null;
        }
    }
}