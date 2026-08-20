package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.apache.commons.lang3.math.NumberUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

//관제점 Translator
public class Translator_80_ControlPoint extends EntityTranslator {
  private static final Logger log = LoggerFactory.getLogger(Translator_80_ControlPoint.class);

  public Translator_80_ControlPoint(String context) {this.context = context;}

  @Override public List<Entity> translate(JSONObject jsonObject) {
    List<Entity> entities = new ArrayList<>();

    if ( jsonObject.isNull("measurements") || jsonObject.getJSONArray("measurements").length() == 0) {
      return entities;
    }

    JSONArray measurements = jsonObject.getJSONArray("measurements");

    String deviceId = jsonObject.getString("deviceId");
    String subCategory = jsonObject.getString("subCategory");
    String deviceCode = EntityIdMapper.getDeviceCodeList(deviceId).get(0);

    for (int i = 0; i < measurements.length(); i++) {
      LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
      List<Attribute> attrs = new ArrayList<>();

      JSONObject measurement = measurements.getJSONObject(i);
      String uuid = measurement.getString("pointId");

      EntityId entityId = new EntityId("urn:ngsi-ld:ControlPoint:" + uuid, "ControlPoint", "SS-CNT");
      attrNames.put("name", "ngsi-ld:name");
      attrNames.put("nameKor", "e8ight:nameKor");
      attrNames.put("measurementValue", "e8ight:measurementValue");
      attrNames.put("upperLimitValue", "e8ight:upperLimitValue");
      attrNames.put("lowerLimitValue", "e8ight:lowerLimitValue");
      attrNames.put("referenceId", "e8ight:referenceId");

      LinkedHashMap<String, String> childAttrNames = new LinkedHashMap<>();
      childAttrNames.put("observedAt", "ngsi-ld:observedAt");
      childAttrNames.put("unitCode", "ngsi-ld:unitCode");
      List<Attribute> childAttrs = new ArrayList<>();

      String unitCode = EntityIdMapper.getUnitCode(measurement.getString("unit"));
      if ( unitCode != null ) {
        Attribute unitCodeAttribute = new Attribute("unitCode", null, unitCode, null, null);
        childAttrs.add(unitCodeAttribute);
      } else {
        Attribute unitCodeAttribute = new Attribute("unitCode", null, "N/A", null, null);
        childAttrs.add(unitCodeAttribute);
      }

      String observedAt = LocalDateTime.parse(measurement.getString("time"), DateTimeFormatter.ofPattern("yyyy-MM-dd H:m:s"))
        .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
      Attribute observedAtAttribute = new Attribute("observedAt", null, observedAt, null, null);
      childAttrs.add(observedAtAttribute);

      Object value = measurement.get("value");
      Object upperBound = measurement.get("upperBound");
      Object lowerBound = measurement.get("lowerBound");

      if (value instanceof String valueString) {
        if ( NumberUtils.isCreatable(valueString) ) {
          value = Double.parseDouble(valueString);
        }
      }

      if (upperBound instanceof String valueString) {
        if ( NumberUtils.isCreatable(valueString) ) {
          upperBound = Double.parseDouble(valueString);
        }
      }

      if (lowerBound instanceof String valueString) {
        if ( NumberUtils.isCreatable(valueString) ) {
          lowerBound = Double.parseDouble(valueString);
        }
      }

      attrs.add(new Attribute("measurementValue", "Property", value, childAttrNames, childAttrs));
      attrs.add(new Attribute("upperLimitValue", "Property", upperBound, childAttrNames, childAttrs));
      attrs.add(new Attribute("lowerLimitValue", "Property", lowerBound, childAttrNames, childAttrs));

      String nameKor = measurement.getString("name_kor");
      attrs.add(new Attribute("nameKor", "Property", nameKor, null, null));

      String name = measurement.getString("name");
      attrs.add(new Attribute("name", "Property", name, null, null));

      Attribute referenceIdAttribute = new Attribute("referenceId", "Property", uuid, null, null);
      attrs.add(referenceIdAttribute);

      if ( measurement.get("electricity_use_last_month") != JSONObject.NULL ) {
        attrNames.put("cumulativeElectricityUsageOfLastMonth", "e8ight:cumulativeElectricityUsageOfLastMonth");
        Attribute cumulativeElectricityUsageOfLastMonth = new Attribute("cumulativeElectricityUsageOfLastMonth", "Property", measurement.getDouble("electricity_use_last_month"), null, null);
        attrs.add(cumulativeElectricityUsageOfLastMonth);
      }
      if ( measurement.get("electricity_use_this_month") != JSONObject.NULL ) {
        attrNames.put("cumulativeElectricityUsage", "e8ight:cumulativeElectricityUsage");
        List<Attribute> cumulativeElectricityUsageOfLastMonthChildAttrs = new ArrayList<>();
        Attribute cumulativeElectricityUsageOfLastMonthUnitCodeAttribute = new Attribute("unitCode", null, "KWH", null, null);
        cumulativeElectricityUsageOfLastMonthChildAttrs.add(cumulativeElectricityUsageOfLastMonthUnitCodeAttribute);
        Attribute cumulativeElectricityUsageOfLastMonthObservedAtAttribute = new Attribute("observedAt", null, observedAt, null, null);
        cumulativeElectricityUsageOfLastMonthChildAttrs.add(cumulativeElectricityUsageOfLastMonthObservedAtAttribute);

        Attribute cumulativeElectricityUsage = new Attribute("cumulativeElectricityUsage", "Property", measurement.getDouble("electricity_use_this_month"), childAttrNames, cumulativeElectricityUsageOfLastMonthChildAttrs);
        attrs.add(cumulativeElectricityUsage);
      }
      if ( measurement.get("electricity_use_power") != JSONObject.NULL ) {
        attrNames.put("maximumPower", "e8ight:maximumPower");
        List<Attribute> cumulativeElectricityUsageOfLastMonthChildAttrs = new ArrayList<>();
        Attribute cumulativeElectricityUsageOfLastMonthUnitCodeAttribute = new Attribute("unitCode", null, "KWT", null, null);
        cumulativeElectricityUsageOfLastMonthChildAttrs.add(cumulativeElectricityUsageOfLastMonthUnitCodeAttribute);
        Attribute cumulativeElectricityUsageOfLastMonthObservedAtAttribute = new Attribute("observedAt", null, observedAt, null, null);
        cumulativeElectricityUsageOfLastMonthChildAttrs.add(cumulativeElectricityUsageOfLastMonthObservedAtAttribute);

        Attribute maximumPower = new Attribute("maximumPower", "Property", measurement.getDouble("electricity_use_power"), childAttrNames, cumulativeElectricityUsageOfLastMonthChildAttrs);
        attrs.add(maximumPower);
      }

      Entity entity = new Entity(entityId, attrNames, attrs, context);
      entities.add(entity);
    }

    return entities;
  }
}