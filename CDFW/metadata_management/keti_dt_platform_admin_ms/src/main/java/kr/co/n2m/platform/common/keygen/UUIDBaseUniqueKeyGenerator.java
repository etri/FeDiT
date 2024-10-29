package kr.co.n2m.platform.common.keygen;

import java.util.UUID;

import org.springframework.stereotype.Component;

@Component("uuidBaseUniqueKeyGenerator")
public class UUIDBaseUniqueKeyGenerator implements UniqueKeyGenerator {
	public String getUniqueKey(Object keyObj) {
		return UUID.randomUUID().toString();
	}
}
