package kr.co.e8ight.ndxpro.translatorRunner.translator.seongsu;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CongestionTranslator extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(CongestionTranslator.class);

  public CongestionTranslator(String context) {
    this.context = context;
  }

  @Override
  public List<Entity> translate(JSONObject jsonObject) {

    String provider = "SSF";
    String model = "CongestionCapacity";

    Map<String, String> entityIdMap = Map.ofEntries(
        Map.entry("1_165", "FS_B001_ZCI[1]"),
        Map.entry("1_166", "FS_B001_ZCI[2]"),
        Map.entry("1_168", "FS_B001_ZCI[3]"),
        Map.entry("1_169", "FS_B001_ZCI[4]"),
        Map.entry("1_170", "FS_B001_ZCI[5]")
    );

    Map<String, String> nameMap = Map.ofEntries(
        Map.entry("1_165", "핫데스크"),
        Map.entry("1_166", "카페 라운지"),
        Map.entry("1_168", "타운홀1"),
        Map.entry("1_169", "타운홀2"),
        Map.entry("1_170", "에어드롭")
    );

    List<Entity> entities = new ArrayList<>();
    JSONArray list = jsonObject.getJSONArray("data");

    for (Object o : list) {
      JSONObject object = (JSONObject) o;
      JSONObject details = object.getJSONObject("eventDetails");

      String cameraId = details.getString("cameraId");
      String entityIdStr = entityIdMap.get(cameraId);

      EntityId entityId = new EntityId.Builder()
          .id(entityIdStr)
          .type(model)
          .provider(provider)
          .build();

      String observedAt = LocalDateTime
          .parse(object.getString("eventTime"), DateTimeFormatter.ISO_DATE_TIME)
          .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

      // observedAt metadata
      Attribute observedAtAttr = new Attribute(
          "observedAt",
          null,
          observedAt,
          null,
          null
      );

      List<Attribute> mdAttrs = List.of(observedAtAttr);

      LinkedHashMap<String, String> mdNames = new LinkedHashMap<>();
      mdNames.put("observedAt", "ngsi-ld:observedAt");

      Attribute stateAttr = new Attribute.Builder()
          .name("state")
          .type("Property")
          .value("exist")
          .build();

      Attribute deviceIdAttr = new Attribute.Builder()
          .name("deviceId")
          .type("Property")
          .value(cameraId)
          .build();

      Attribute nameAttr = new Attribute.Builder()
          .name("name")
          .type("Property")
          .value(nameMap.get(cameraId))
          .build();

      Attribute locationCodeAttr = new Attribute.Builder()
          .name("locationCode")
          .type("Property")
          .value(object.getString("locationCode"))
          .build();

      Attribute congestionCapacityAttr = new Attribute.Builder()
          .name("congestionCapacity")
          .type("Property")
          .value(object.getString("congestionCapacity"))
          .md(mdAttrs)
          .build();

      Attribute peopleCountAttr = new Attribute.Builder()
          .name("peopleCount")
          .type("Property")
          .value(object.getString("count"))
          .md(mdAttrs)
          .build();

      Attribute floorNameAttr = new Attribute.Builder()
          .name("floorName")
          .type("Property")
          .value(object.getString("floorNum"))
          .build();



      LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
      attrNames.put("state", "e8ight:state");
      attrNames.put("deviceId", "e8ight:deviceId");
      attrNames.put("name", "e8ight:name");
      attrNames.put("locationCode", "e8ight:locationCode");

      Entity entity = new Entity(
          entityId,
          attrNames,
          List.of(stateAttr, deviceIdAttr,nameAttr,locationCodeAttr, congestionCapacityAttr, peopleCountAttr, floorNameAttr),
          context
      );

      entities.add(entity);
    }

    return entities;
  }


}