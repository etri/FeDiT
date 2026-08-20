package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;

public class TestResult {
    private Boolean success;
    private Entity result;
    private String error;

    public TestResult(Boolean success, Entity result, String error) {
        this.success = success;
        this.result = result;
        this.error = error;
    }

    public Boolean getSuccess() {
        return success;
    }

    public Entity getResult() {
        return result;
    }

    public String getError() {
        return error;
    }
}
