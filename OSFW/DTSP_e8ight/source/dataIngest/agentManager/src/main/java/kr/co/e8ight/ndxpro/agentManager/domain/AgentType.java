package kr.co.e8ight.ndxpro.agentManager.domain;

public enum AgentType {
    HTTP("kr.co.e8ight.ndxpro.dataAdapter.source.HttpSource", true),
    HTTPS("kr.co.e8ight.ndxpro.dataAdapter.source.HttpSource", true),
    KAFKA("org.apache.flume.source.kafka.KafkaSource", false);

    private final String classPath;

    /**
     * SignalProcessor 로 생존 신호를 보내는 컴포넌트를 쓰는 타입인지 여부.
     * KAFKA 는 flume 기본 source/channel 만 쓰므로 신호를 보내지 않고,
     * AgentInspectorService 의 signal 기반 판정 대상에서 제외된다.
     */
    private final boolean signalable;

    AgentType(String classPath, boolean signalable) {
        this.classPath = classPath;
        this.signalable = signalable;
    }

    public String getClassPath() {
        return classPath;
    }

    public boolean isSignalable() {
        return signalable;
    }
}
