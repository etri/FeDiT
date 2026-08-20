package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Translator_25_Occupancy extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_25_Occupancy.class);

    public Translator_25_Occupancy(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();

        JSONArray data = jsonObject.getJSONArray("data");

        for (int i = 0; i < data.length(); i++) {
            JSONObject object = data.getJSONObject(i);
            String buildingId = EntityIdMapper.getBuildingId(object.getString("buildingId"));
            if ( EntityIdMapper.zoneIdMap.containsKey(object.getString("zoneId")) ) {
                String zoneId = EntityIdMapper.getZoneId(object.getString("zoneId"));
                String id = buildingId + "-" + zoneId;

                entities.add(createIndoorPlugEntity(id, object));
            }
        }
        return entities;
    }

    private Entity createIndoorPlugEntity(String id, JSONObject object) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> occupancyAttrNames = new LinkedHashMap<>();
        attrNames.put("occupancy", "e8ight:occupancy");
        occupancyAttrNames.put("observedAt", "ngsi-ld:observedAt");

        List<Attribute> attrs = new ArrayList<>();
        List<Attribute> occupancyAttrs = new ArrayList<>();

        EntityId entityId = new EntityId("urn:ngsi-ld:IndoorPlug:" + id, "IndoorPlug", "SS-CNT");
        JSONArray occupancies = object.getJSONArray("occupancy");

        if ( occupancies.length() > 0 ) {
            JSONObject occupancyObject = occupancies.getJSONObject(occupancies.length() - 1);
            String observedAtValue = LocalDateTime.parse(occupancyObject.getString("time"), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double occupancy = occupancyObject.getDouble("occupancy");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);
            occupancyAttrs.add(observedAt);

            Attribute occupancyAttr = new Attribute("occupancy", "Property", occupancy, occupancyAttrNames, occupancyAttrs);
            attrs.add(occupancyAttr);

            return new Entity(entityId, attrNames, attrs, context);
        }
        return null;
    }
}