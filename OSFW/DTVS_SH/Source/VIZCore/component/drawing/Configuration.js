class Configuration {
    constructor(VIZCore) {
        let scope = this;
        this.AUTHORITY_PARAMS = {
            Data: 'http://127.0.0.1:8901' // HTTP
            //Data : 'https://127.0.0.1:443/softhills-license-server/'
            
        };
        this.Default = {
            Path : './', // VIZCore Path
        };
    }
}

export default Configuration;