package kr.co.e8ight.ndxpro.databroker.config;

/**
 * Swagger(OpenAPI) 파라미터/설명에 공통으로 사용하는 문구 모음
 */
public final class SwaggerDescription {

    private SwaggerDescription() {}

    public static final String LINK_HEADER = "context URL (선택). <code>&lt;context url&gt;;</code> 형식으로 넣어주세요. " +
            "지정하면 해당 context 의 데이터만 조회하고, 생략하면 id 만으로 조회합니다.";

    public static final String ENTITY_ID = "NGSI-LD Entity id. <code>urn:ngsi-ld:{DataModelType}:{식별자}</code> 형식 (예: <code>urn:ngsi-ld:SimulationVehicle:695</code>)";

    public static final String TYPE = "Entity type (데이터 모델 이름)";

    public static final String Q = "속성 필터. <code>속성명==값</code> 형식이며 <code>;</code> 로 여러 조건을 연결합니다. " +
            "(예: <code>vehicleType==car;speed>=30</code>)";

    public static final String Q_OPERATORS = "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다.<br>" +
            "== : String, DateTime String, Boolean, Integer, Double<br>" +
            "~= : String<br>" +
            "<= 또는 >= : DateTime String, Integer, Double";

    public static final String Q_OPERATORS_WITH_ID = "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
            " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
            "== : String, DateTime String, Boolean, Integer, Double<br>" +
            "~= : String<br>" +
            "<= 또는 >= : DateTime String, Integer, Double";

    public static final String OFFSET = "페이지 번호 (0부터 시작)";

    public static final String LIMIT = "페이지 당 건수";

    public static final String SORT = "정렬 방향";

    public static final String SORT_PROPERTY = "정렬 기준 속성";

    public static final String OPTIONS = "<code>count</code> 지정 시 응답 헤더 <code>totalPage</code>, <code>totalData</code> 에 전체 건수를 담아 반환합니다.";

    public static final String TIME_PROPERTY = "시계열 기준 속성. <code>{속성명}.observedAt</code> 형식";

    public static final String TIMEREL = "시간 조건. <code>before</code>(time 이전) / <code>after</code>(time 이후) / <code>between</code>(time ~ endTime). " +
            "생략 시 시간 조건 없이 조회합니다.";

    public static final String TIME = "기준 일시 (<code>yyyy-MM-ddTHH:mm:ss.SSS</code>, UTC). timerel 지정 시 필수";

    public static final String END_TIME = "종료 일시 (<code>yyyy-MM-ddTHH:mm:ss.SSS</code>, UTC). timerel=between 인 경우 필수";

    public static final String TEMPORAL_TIME = "조회할 시점 (<code>yyyy-MM-ddTHH:mm:ss.SSS</code>, UTC). timerel 을 생략하면 이 시점과 정확히 일치하는 데이터를 조회합니다.";

    public static final String HISTORY_ID = "이력 조회(<code>/entities/iot/history</code>) 응답의 historyId";

    public static final String SAVE_ENTITY_RULES = "<b>요청 Body 는 데이터 관리자(DataManager)에 등록된 데이터 모델 스키마를 따라야 합니다.</b> " +
            "저장 전에 아래 항목을 검증하며, 하나라도 맞지 않으면 <code>400 (BAD_REQUEST_DATA)</code> 로 실패합니다.<br>" +
            "<ol>" +
            "<li><b>id</b> : <code>urn:ngsi-ld:{DataModelType}:{식별자}</code> 형식. 마지막 <code>:</code> 앞부분(<code>urn:ngsi-ld:{DataModelType}:</code>)이 데이터 모델 id 와 정확히 일치해야 합니다.</li>" +
            "<li><b>type</b> : 데이터 모델의 type 과 동일해야 합니다.</li>" +
            "<li><b>@context</b> : 필수. 데이터 모델의 context URL 을 넣어주세요.</li>" +
            "<li><b>필수 속성</b> : 데이터 모델의 <code>required</code> 에 정의된 속성은 모두 포함해야 합니다.</li>" +
            "<li><b>속성명</b> : 데이터 모델에 정의되지 않은 속성이 있으면 실패합니다.</li>" +
            "<li><b>속성 type</b> : 데이터 모델과 동일한 <code>Property</code> / <code>GeoProperty</code> / <code>Relationship</code> 이어야 합니다.</li>" +
            "<li><b>value</b> : 데이터 모델의 <code>valueType</code>(String, Integer, Double, Boolean, DateTime, Object, Array 등)과 " +
            "제약(enum, min/max, format, objectMember 등)을 만족해야 합니다. DateTime 은 <code>yyyy-MM-ddTHH:mm:ss.SSS</code> 형식입니다.</li>" +
            "<li><b>child attribute</b> (observedAt, unitCode 등) : 데이터 모델의 childAttributes 에 정의된 것만 허용되며, required 로 지정된 것은 필수입니다.</li>" +
            "</ol>" +
            "데이터 모델 스키마는 <code>GET {datamanager}/ndxpro/v1/manager/data-models/{type}</code> 로 확인할 수 있습니다.";
}
