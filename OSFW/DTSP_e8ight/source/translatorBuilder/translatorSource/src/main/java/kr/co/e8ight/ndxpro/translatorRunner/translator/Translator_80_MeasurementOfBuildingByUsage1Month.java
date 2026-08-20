package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Translator_80_MeasurementOfBuildingByUsage1Month extends EntityTranslator {
    private static final Logger log = LoggerFactory.getLogger(Translator_80_MeasurementOfBuildingByUsage1Month.class);

    public Translator_80_MeasurementOfBuildingByUsage1Month(String context) {this.context = context;}

    @Override public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();

        entities.add(createMeasurement(jsonObject, "Heating", "heating"));
        entities.add(createMeasurement(jsonObject, "Cooling", "cooling"));
        entities.add(createMeasurement(jsonObject, "Lighting", "lighting"));
        entities.add(createMeasurement(jsonObject, "Ventilation", "ventilation"));
        entities.add(createMeasurement(jsonObject, "Plug", "plug"));
        entities.add(createMeasurement(jsonObject, "EnergyUsageEtc", "etc"));
        return entities;
    }

    private Entity createMeasurement(JSONObject measurement, String type, String key) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> thisMonthValueAttrNames = new LinkedHashMap<>();
        attrNames.put("thisMonthValue", "e8ight:thisMonthValue");
        thisMonthValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

        List<Attribute> attrs = new ArrayList<>();
        List<Attribute> thisMonthValueAttrs = new ArrayList<>();

        String buildingId = EntityIdMapper.getBuildingId(measurement.getString("buildingId"));

        String id = type + ":" + buildingId;
        EntityId entityId = new EntityId("urn:ngsi-ld:Measurement:" + id, "Measurement", "SS-CNT");

        String datetimeString = measurement.getJSONObject(key).getString("last-update");
        String observedAt = LocalDateTime.parse(datetimeString.substring(0, 19), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

        double value = measurement.getJSONObject(key).getDouble("usage");

        Attribute thisMonthValueObservedAt = new Attribute("observedAt", null, observedAt, null, null);
        thisMonthValueAttrs.add(thisMonthValueObservedAt);
        Attribute thisMonthValue = new Attribute("thisMonthValue", "Property", value, thisMonthValueAttrNames, thisMonthValueAttrs);
        attrs.add(thisMonthValue);

        return new Entity(entityId, attrNames, attrs, context);
    }
}