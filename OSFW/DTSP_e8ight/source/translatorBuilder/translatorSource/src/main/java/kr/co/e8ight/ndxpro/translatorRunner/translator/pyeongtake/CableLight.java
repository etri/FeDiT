package kr.co.e8ight.ndxpro.translatorRunner.translator.pyeongtake;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CableLight extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(CableLight.class);
  private static String provider = "POF";
  private static String model = "Light";

  public CableLight(String context) {
    this.context = context;
  }

  @Override
  public List<Entity> translate(JSONObject jsonObject) {
    List<Entity> entities = new ArrayList<>();

    // values 배열 파싱
    if (!jsonObject.has("values")) {
      return entities;
    }

    JSONArray values = jsonObject.getJSONArray("values");

    for (int i = 0; i < values.length(); i++) {
      JSONObject valueObject = values.getJSONObject(i);

      Entity entity = processLight(valueObject);
      if (entity != null) {
        entities.add(entity);
      }
    }

    return entities;
  }

  private Entity processLight(JSONObject valueObject) {
    try {
      // JSON에서 데이터 추출
      String utilityName = valueObject.optString("utilityName");
      String address = valueObject.optString("address");
      int value = valueObject.optInt("value");

      // 필수값 검증
      if (utilityName == null || utilityName.isEmpty()) {
        return null;
      }

      List<Attribute> attrs = new ArrayList<>();
      List<Attribute> childAttrs = new ArrayList<>();

      // observedAt 생성
      String observedAt = LocalDateTime.now()
          .atZone(ZoneId.of("Asia/Seoul"))
          .minusHours(9)
          .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

      Attribute observedAtAttribute = new Attribute("observedAt", null, observedAt, null, null);
      childAttrs.add(observedAtAttribute);

      // onOff (value: 0 또는 1)
      Attribute onOffAttribute = new Attribute.Builder()
          .name("onOff")
          .type("Property")
          .value(value)
          .md(childAttrs)
          .build();
      attrs.add(onOffAttribute);

      // // name
      // Attribute nameAttribute = new Attribute.Builder()
      //     .name("name")
      //     .type("Property")
      //     .value(utilityName)
      //     .build();
      // attrs.add(nameAttribute);

      // deviceId
      Attribute deviceIdAttribute = new Attribute.Builder()
          .name("deviceId")
          .type("Property")
          .value(address)
          .build();
      attrs.add(deviceIdAttribute);

      Attribute deviceTypeAttribute = new Attribute.Builder()
          .name("deviceType")
          .type("Property")
          .value("modbus")
          .build();
      attrs.add(deviceTypeAttribute);

      // EntityId 생성 (utilityName을 ID로 사용)
      EntityId entityId = new EntityId.Builder()
          .id(utilityName)
          .type(model)
          .provider(provider)
          .build();

      // attrNames 매핑
      Map<String, String> attrNames = new HashMap<>();
      for (Attribute attr : attrs) {
        if (!attr.getName().equals("name")) {
          attrNames.put(attr.getName(), "e8ight:" + attr.getName());
        }
      }

      // Entity 생성
      Entity entity = new Entity.Builder()
          .id(entityId)
          .attrNames(attrNames)
          .attrs(attrs)
          .context(this.context)
          .build();

      return entity;

    } catch (Exception e) {
      return null;
    }
  }


}