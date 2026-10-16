package com.federated.ontology.searchRule.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "graph")
public class GraphProperties {

    private final Ttl ttl = new Ttl();
    private final Websocket websocket = new Websocket();

    public Ttl getTtl() {
        return ttl;
    }

    public Websocket getWebsocket() {
        return websocket;
    }

    public static class Ttl {
        @NotBlank
        private String sourcePath;

        @NotBlank
        private String importHostDir;

        @NotBlank
        private String importFileName;

        @NotBlank
        private String importNeo4jUri;

        public String getSourcePath() {
            return sourcePath;
        }

        public void setSourcePath(String sourcePath) {
            this.sourcePath = sourcePath;
        }

        public String getImportHostDir() {
            return importHostDir;
        }

        public void setImportHostDir(String importHostDir) {
            this.importHostDir = importHostDir;
        }

        public String getImportFileName() {
            return importFileName;
        }

        public void setImportFileName(String importFileName) {
            this.importFileName = importFileName;
        }

        public String getImportNeo4jUri() {
            return importNeo4jUri;
        }

        public void setImportNeo4jUri(String importNeo4jUri) {
            this.importNeo4jUri = importNeo4jUri;
        }
    }

    public static class Websocket {
        @NotBlank
        private String topic;

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }
    }
}
