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

public class Translator_80_MeasurementOfZoneByUsage15min extends EntityTranslator {
    private static final Logger log = LoggerFactory.getLogger(Translator_80_MeasurementOfZoneByUsage15min.class);

    public Translator_80_MeasurementOfZoneByUsage15min(String context) {this.context = context;}

    @Override public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();

        JSONArray data = jsonObject.getJSONArray("data");
        for (int i = 0; i < data.length(); i++) {
            JSONObject measurement = data.getJSONObject(i);
            if ( EntityIdMapper.zoneIdMap.containsKey(measurement.getString("zoneId")) ) {
                addEntityToList(entities, createMeasurement(measurement, "Heating", "heating"));
                addEntityToList(entities, createMeasurement(measurement, "Cooling", "cooling"));
                addEntityToList(entities, createMeasurement(measurement, "Lighting", "lighting"));
                addEntityToList(entities, createMeasurement(measurement, "Ventilation", "ventilation"));
                addEntityToList(entities, createMeasurement(measurement, "Plug", "plug"));
                addEntityToList(entities, createMeasurement(measurement, "EnergyUsageEtc", "etc"));
            }
        }
        return entities;
    }

    private void addEntityToList(List<Entity> entities, Entity entity) {
        if ( entity != null ) {
            entities.add(entity);
        }
    }

    private Entity createMeasurement(JSONObject measurement, String type, String key) {
        if ( measurement.has(key) && !measurement.getJSONArray(key).isEmpty() && measurement.getJSONArray(key).length() > LocalDateTime.now().getMinute() / 15 ) {
            LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> realTimeValueAttrNames = new LinkedHashMap<>();
            attrNames.put("realTimeValue", "e8ight:realTimeValue");
            realTimeValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

            List<Attribute> attrs = new ArrayList<>();
            List<Attribute> realTimeValueAttrs = new ArrayList<>();

            String buildingId = EntityIdMapper.getBuildingId(measurement.getString("buildingId"));
            String zoneId = EntityIdMapper.getZoneId(measurement.getString("zoneId"));

            String id = type + ":" + buildingId + "-" + zoneId;
            EntityId entityId = new EntityId("urn:ngsi-ld:Measurement:" + id, "Measurement", "SS-CNT");

            JSONObject object = measurement.getJSONArray(key).getJSONObject(LocalDateTime.now().getMinute() / 15);
            String observedAt = LocalDateTime.parse(object.getString("measurement_time"), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                    .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double value = object.getDouble("usage");

            Attribute realTimeValueObservedAt = new Attribute("observedAt", null, observedAt, null, null);
            realTimeValueAttrs.add(realTimeValueObservedAt);
            Attribute realTimeValue = new Attribute("realTimeValue", "Property", value, realTimeValueAttrNames, realTimeValueAttrs);
            attrs.add(realTimeValue);

            return new Entity(entityId, attrNames, attrs, context);
        } else {
            return null;
        }
    }
}