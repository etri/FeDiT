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

public class Translator_80_MeasurementOfFloor1Day extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_80_MeasurementOfFloor1Day.class);

    public Translator_80_MeasurementOfFloor1Day(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> dayPredictionValueAttrNames = new LinkedHashMap<>();
        attrNames.put("dayPredictionValue", "e8ight:dayPredictionValue");
        dayPredictionValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

        JSONArray data = jsonObject.getJSONArray("data");

        for (int i = 0; i < data.length(); i++) {

            List<Attribute> attrs = new ArrayList<>();
            List<Attribute> dayPredictionValueAttrs = new ArrayList<>();

            JSONObject object = data.getJSONObject(i);
            String buildingId = "B002";
            if ( EntityIdMapper.floorIdMap.containsKey(object.getString("floorId")) ) {
                String floorId = EntityIdMapper.getFloorId(object.getString("floorId"));
                String id = "EnergyUsageTotal:" + buildingId + "-" + floorId;
                entityId = new EntityId("urn:ngsi-ld:Measurement:" + id, "Measurement", "SS-CNT");

                String observedAt = LocalDateTime.now()
                        .minusHours(9).atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

                double value = object.getDouble("this_day_predicted");

                Attribute dayPredictionValueObservedAt = new Attribute("observedAt", null, observedAt, null, null);
                dayPredictionValueAttrs.add(dayPredictionValueObservedAt);
                Attribute dayPredictionValue = new Attribute("dayPredictionValue", "Property", value, dayPredictionValueAttrNames, dayPredictionValueAttrs);
                attrs.add(dayPredictionValue);

                Entity entity = new Entity(entityId, attrNames, attrs, context);
                entities.add(entity);
            }
        }
        return entities;
    }
}