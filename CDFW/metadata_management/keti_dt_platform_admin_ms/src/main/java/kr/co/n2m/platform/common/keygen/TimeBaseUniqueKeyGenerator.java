package kr.co.n2m.platform.common.keygen;

import org.springframework.stereotype.Component;

@Component("timeBaseUniqueKeyGenerator")
public class TimeBaseUniqueKeyGenerator implements UniqueKeyGenerator {
	private static String lastKey = String.valueOf(System.currentTimeMillis());

	public String getUniqueKey(Object keyObj) {
		String uniqueKey = "";

		synchronized (this) {
			do {
				uniqueKey = String.valueOf(System.currentTimeMillis());
				if (!lastKey.equals(uniqueKey)) {
					lastKey = uniqueKey;
					return uniqueKey;
				}

				try {
					Thread.sleep(20L);
				} catch (InterruptedException ex) { }
			} while (true);
		}
	}

	/*
	public static void main(String[] args) {
		TimeBaseUniqueKeyGenerator gen = new TimeBaseUniqueKeyGenerator();
		System.out.println(gen.getUniqueKey(null));
	}
	*/
}
