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
import java.util.Set;

public class Translator_25_Waste1Month extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_25_Waste1Month.class);

    public Translator_25_Waste1Month(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> wasteValueAttrNames = new LinkedHashMap<>();
        attrNames.put("monthWasteValue", "e8ight:monthWasteValue");
        wasteValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

        String buildingId = EntityIdMapper.getBuildingId(jsonObject.getString("buildingId"));
        JSONArray data = jsonObject.getJSONArray("data");
        String usage = jsonObject.getString("usage");

        for (int i = 0; i < data.length(); i++) {
            List<Attribute> attrs = new ArrayList<>();
            List<Attribute> wasteValueAttrs = new ArrayList<>();

            JSONObject object = data.getJSONObject(i);
            if ( EntityIdMapper.zoneIdMap.containsKey(object.getString("zoneId")) ) {
                JSONArray measurements = object.getJSONArray("measurements");

                if ( !measurements.isEmpty() ) {
                    String observedAt = LocalDateTime.now()
                            .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

                    JSONObject measurement = measurements.getJSONObject(0);
                    double sumOfMeasurement = measurement.getDouble("value");

                    String zoneId = EntityIdMapper.getZoneId(object.getString("zoneId"));

                    String id;
                    Set<String> usageSet = Set.of("heating", "cooling", "ventilation", "lighting", "plug");
                    if ( usageSet.contains(usage) ) {
                        id = usage.substring(0, 1).toUpperCase() + usage.substring(1) + ":" + buildingId + "-" + zoneId;
                    } else {
                        throw new RuntimeException("invalid usage type.");
                    }

                    entityId = new EntityId("urn:ngsi-ld:Measurement:" + id, "Measurement", "SS-CNT");

                    Attribute wasteValueObservedAt = new Attribute("observedAt", null, observedAt, null, null);
                    wasteValueAttrs.add(wasteValueObservedAt);
                    Attribute monthWasteValue = new Attribute("monthWasteValue", "Property", sumOfMeasurement, wasteValueAttrNames, wasteValueAttrs);
                    attrs.add(monthWasteValue);

                    Entity entity = new Entity(entityId, attrNames, attrs, context);
                    entities.add(entity);
                }
            }
        }
        return entities;
    }
}