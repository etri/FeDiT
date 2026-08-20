package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Translator_80_MeasurementOfZoneByUsage1Month extends EntityTranslator {
    private static final Logger log = LoggerFactory.getLogger(Translator_80_MeasurementOfZoneByUsage1Month.class);

    public Translator_80_MeasurementOfZoneByUsage1Month(String context) {this.context = context;}

    @Override public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();

        JSONArray data = jsonObject.getJSONArray("data");
        for (int i = 0; i < data.length(); i++) {
            JSONObject measurement = data.getJSONObject(i);
            if ( EntityIdMapper.zoneIdMap.containsKey(measurement.getString("zoneId")) ) {
                entities.add(createMeasurement(measurement, "Heating", "heating"));
                entities.add(createMeasurement(measurement, "Cooling", "cooling"));
                entities.add(createMeasurement(measurement, "Lighting", "lighting"));
                entities.add(createMeasurement(measurement, "Ventilation", "ventilation"));
                entities.add(createMeasurement(measurement, "Plug", "plug"));
                entities.add(createMeasurement(measurement, "EnergyUsageEtc", "etc"));
            }
        }
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
        String zoneId = EntityIdMapper.getZoneId(measurement.getString("zoneId"));

        String id = type + ":" + buildingId + "-" + zoneId;
        EntityId entityId = new EntityId("urn:ngsi-ld:Measurement:" + id, "Measurement", "SS-CNT");

        String observedAt = LocalDateTime.parse(measurement.getJSONObject(key).getString("last-update"), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

        double value = measurement.getJSONObject(key).getDouble("usage");

        Attribute thisMonthValueObservedAt = new Attribute("observedAt", null, observedAt, null, null);
        thisMonthValueAttrs.add(thisMonthValueObservedAt);
        Attribute thisMonthValue = new Attribute("thisMonthValue", "Property", value, thisMonthValueAttrNames, thisMonthValueAttrs);
        attrs.add(thisMonthValue);

        return new Entity(entityId, attrNames, attrs, context);
    }
}