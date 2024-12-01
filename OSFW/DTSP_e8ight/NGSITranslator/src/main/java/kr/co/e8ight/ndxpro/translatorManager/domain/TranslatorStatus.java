package kr.co.e8ight.ndxpro.translatorManager.domain;

import java.util.Set;

public enum TranslatorStatus {
    CREATED, RUN, STOP, DELETED, HANG, DIED;

    public static Set<TranslatorStatus> getAliveStatusSet() {
        return Set.of(RUN, HANG);
    }
}
