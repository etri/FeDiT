package kr.co.e8ight.ndxpro.translatorManager.domain;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;

import java.util.Arrays;
import java.util.stream.Collectors;

public enum TranslatorOperation {
    RUN("translatorRunOperater"),
    RERUN("translatorRerunOperater"),
    STOP("translatorStopOperater"),
    CHECK("translatorCheckOperater");

    private String operaterName;

    TranslatorOperation(String operaterName) {
        this.operaterName = operaterName;
    }

    public static TranslatorOperation getOperation(String name) {
        try {
            return TranslatorOperation.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            // 클라이언트가 보낸 값이 잘못된 것이므로 500 이 아니라 400 이어야 한다.
            throw new TranslatorException(ErrorCode.BAD_REQUEST_DATA,
                    "Unsupported operation : " + name + ". supported : " + supportedNames());
        }
    }

    private static String supportedNames() {
        return Arrays.stream(values())
                .map(operation -> operation.name().toLowerCase())
                .collect(Collectors.joining(", "));
    }

    public String getOperaterName() {
        return operaterName;
    }
}
