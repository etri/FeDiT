package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.component;

import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;

@Component
@Endpoint(id = "customEndpoint")
public class CustomEndpoint {

    @ReadOperation
    public CustomInfo customInfo() {
        return new CustomInfo("This is a custom endpoint", "v1.0");
    }

    public static class CustomInfo {
        private final String description;
        private final String version;

        public CustomInfo(String description, String version) {
            this.description = description;
            this.version = version;
        }

        public String getDescription() {
            return description;
        }

        public String getVersion() {
            return version;
        }
    }
}