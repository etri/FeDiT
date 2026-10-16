package kr.co.n2m.platform.common.keygen;

public abstract interface UniqueKeyGenerator {
    public abstract String getUniqueKey(Object paramObject);
}
