package kr.co.e8ight.ndxpro.translatorRunner.translator;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SampleTranslator extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(SampleTranslator.class);

  public SampleTranslator(String context) {
    this.context = context;
  }

  @Override
  public List<Entity> translate(JSONObject jsonObject) {
    List<Entity> entities = new ArrayList<>();

    /*
     * Json 필드 이름으로 데이터 불러오기
     * Array 인 경우 getJSONArray() 사용
     * Object 인 경우 getJsonObject() 사용
     * 값인 경우 get() 또는 getString() 등 타입을 선언할 수 있는 메서드 사용
     */
    JSONArray itemList = jsonObject.getJSONArray("list");
    JSONObject object = jsonObject.getJSONObject("object");
    Object value = jsonObject.get("value");
    String string = jsonObject.getString("string");

    /*
     * NGSI-LD Attribute Name Map 입력
     * "entity attribute name":"attribute type:attribute name" 쌍의 데이터 입력
     * attribute type은 admin UI를 통해 확인할 수 있습니다.
     * 직접 생성한 attribute의 type은 "e8ight"으로 입력합니다.
     * core context에 있는 attribute의 type은 "ngsi-ld"로 입력합니다.
     * ex) "name":"ngsi-ld:name"
     * ndxpro에서 기본적으로 제공하는 common attribute의 type은 "common"으로 입력합니다.
     * ex) "hasComponent":"common:hasComponent"
     */
    Map<String, String> attrNames = new LinkedHashMap<>();
    attrNames.put("sampleAttribute", "e8ight:sampleAttribute");

    /*
     * EntityId 객체 생성
     * @param id  엔티티의 고유 식별자입니다. Input 값으로 urn 형태의 ID가 생성됩니다.
     * 이 경우, "urn:ngsi-ld:{Model Type}:{ID}" 형식으로 변환됩니다.
     * @param type  엔티티의 유형입니다. 이 경우, "Model"입니다.
     * @param provider  엔티티의 제공자입니다. 이 경우, "E8-DEV"입니다.
     */
    EntityId entityId = new EntityId.Builder()
        .id(jsonObject.getString("id"))
        .type("Model")
        .provider("E8-DEV")
        .build();

    /*
     * Attribute 생성
     */
    List<Attribute> attrs = new ArrayList<>();

    /*
     * Attribute에 metadata가 있는 경우 추가 입력합니다.
     */
    Map<String, String> sampleMdNames = new LinkedHashMap<>();
    sampleMdNames.put("observedAt", "e8ight:observedAt");

    List<Attribute> sampleMd = new ArrayList<>();

    /*
     * NGSI-LD Attribute로 입력합니다.
     * type은 Property 또는 Relationship 또는 GeoProperty로 입력합니다.
     * value는 해당 속성의 값으로 입력합니다.
     * mdNames는 해당 속성의 메타데이터 name: Map 으로 입력합니다.
     * md는 해당 속성의 메타데이터 name:Attribute Map 으로 입력합니다.
     */
    Attribute sample = new Attribute.Builder()
        .name("sampleAttribute")
        .type("Property")
        .value(jsonObject.getString("sampleAttribute"))
        .mdNames(sampleMdNames)
        .md(sampleMd)
        .build();

    attrs.add(sample);

    /*
     * 하위 Attribute 생성
     * observedAt 하위 속성의 값은 ZonedDateTime으로 변환하여 입력합니다.
     * 9시간을 더한 후 UTC로 변환합니다.
     * 변환된 ZonedDateTime은 NGSI-LD Attribute로 입력합니다
     */
    ZonedDateTime zonedDateTime = LocalDateTime.parse(jsonObject.getString("timePoint"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"))
        .atZone(ZoneOffset.of("+09:00")).withZoneSameInstant(ZoneOffset.UTC);

    Attribute sampleMd_observedAt = new Attribute.Builder()
        .name("observedAt")
        .value(zonedDateTime)
        .build();
    sampleMd.add(sampleMd_observedAt);

    /*
     * Entity 객체 생성
     */
    Entity entity = new Entity.Builder()
        .id(entityId)
        .attrNames(attrNames)
        .attrs(attrs)
        .context(this.context)
        .build();
    entities.add(entity);

    return entities;
  }
}