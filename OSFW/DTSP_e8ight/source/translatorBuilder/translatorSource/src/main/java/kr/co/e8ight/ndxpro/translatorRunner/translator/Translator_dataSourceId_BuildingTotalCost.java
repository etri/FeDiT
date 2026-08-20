package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Translator_dataSourceId_BuildingTotalCost extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_dataSourceId_BuildingTotalCost.class);

    public Translator_dataSourceId_BuildingTotalCost(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> todayCostAttrNames = new LinkedHashMap<>();
        attrNames.put("todayCost", "e8ight:todayCost");
        attrNames.put("chargedFor", "e8ight:chargedFor");
        todayCostAttrNames.put("observedAt", "ngsi-ld:observedAt");

        List<Attribute> attrs = new ArrayList<>();
        List<Attribute> todayCostAttrs = new ArrayList<>();

        String buildingId = EntityIdMapper.getBuildingId(jsonObject.getString("buildingId"));
        entityId = new EntityId("urn:ngsi-ld:Cost:EnergyUsageTotal:" + buildingId, "Cost", "SS-CNT");

        if ( !jsonObject.isNull("last-update") ) {
            String observedAtValue = LocalDateTime.parse(jsonObject.getString("last-update").substring(0, 19), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
            double value = jsonObject.getDouble("energy_cost");

            Attribute todayCostObservedAt = new Attribute("observedAt", null, observedAtValue, null, null);
            todayCostAttrs.add(todayCostObservedAt);
            Attribute todayCost = new Attribute("todayCost", "Property", value, todayCostAttrNames, todayCostAttrs);
            attrs.add(todayCost);
            Attribute chargedFor = new Attribute("chargedFor", "Relationship", List.of("urn:ngsi-ld:EnergyUsageTotal:" + buildingId), null, null);
            attrs.add(chargedFor);

            Entity entity = new Entity(entityId, attrNames, attrs, context);
            entities.add(entity);
        }

        return entities;
    }
}