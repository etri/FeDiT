package kr.co.e8ight.ndxpro.translatorRunner.translator;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Translator_331_Waste1Day extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_331_Waste1Day.class);

    public Translator_331_Waste1Day(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> wasteValueAttrNames = new LinkedHashMap<>();
        attrNames.put("todayWasteValue", "e8ight:todayWasteValue");
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
                    String observedAt = adjustObservedAt();
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
                    Attribute todayWasteValue = new Attribute("todayWasteValue", "Property", sumOfMeasurement, wasteValueAttrNames, wasteValueAttrs);
                    attrs.add(todayWasteValue);

                    Entity entity = new Entity(entityId, attrNames, attrs, context);
                    entities.add(entity);
                }
            }
        }
        return entities;
    }

    // 현재 시간에서 가장 가까운 15분 단위로 observedAt 값을 조정함
    private static @NotNull String adjustObservedAt() {
        LocalDateTime now = LocalDateTime.now();
        int minutes = now.getMinute();
        int adjustedMinutes = (minutes / 15) * 15;
        LocalDateTime adjustedNow = now.truncatedTo(ChronoUnit.HOURS).plusMinutes(adjustedMinutes);

        return adjustedNow
            .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
    }

}