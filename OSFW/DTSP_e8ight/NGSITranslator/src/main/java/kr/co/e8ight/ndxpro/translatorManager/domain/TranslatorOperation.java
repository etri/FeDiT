package kr.co.e8ight.ndxpro.translatorManager.domain;

public enum TranslatorOperation {
    RUN("translatorRunOperater"),
    RERUN("translatorRerunOperater"),
    STOP("translatorStopOperater"),
    CHECK("translatorCheckOperater");

    private Operater operater;
    private String operaterName;

    TranslatorOperation(String operaterName) {
        this.operaterName = operaterName;
    }

    public static TranslatorOperation getOperation(String name) {
        try {
            return TranslatorOperation.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(e);
        }
    }

    public Operater getOperater() {
        return operater;
    }

    public String getOperaterName() {
        return operaterName;
    }

    public void setOperater(Operater operater) {
        this.operater = operater;
    }
}
