package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import java.util.List;

/** dtmeta 스코렘(URN) 카테고리 및 도우미 */
public final class DtmetaSkolem {
    private DtmetaSkolem() {}

    public static final String URN_BASE      = "urn:dtmeta:";
    public static final String CONTACT_BASE  = URN_BASE + "contact:"; // "urn:dtmeta:contact:"
    public static final String ADDRESS_BASE  = URN_BASE + "address:"; // "urn:dtmeta:address:"

    /** 우리가 쓰는 스코렘 ‘베이스 프리픽스’ 목록 (STRSTARTS 필터 등에서 사용) */
    public static List<String> prefixes() {
        return List.of(CONTACT_BASE, ADDRESS_BASE);
    }
}
