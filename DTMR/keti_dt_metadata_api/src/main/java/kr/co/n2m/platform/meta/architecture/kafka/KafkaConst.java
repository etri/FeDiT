package kr.co.n2m.platform.meta.architecture.kafka;

public class KafkaConst {

	/* TOPIC */
	public static final String TOPIC_DT_META_CHANGELOG = "twin-meta-changelog";	// 메타데이터 내용 변경시
	
	/* 메시지 구분 */
	public static final String ACTION_CREATE = "create";
	public static final String ACTION_MODIFY = "modify";
	public static final String ACTION_DELETE = "delete";
	
}
