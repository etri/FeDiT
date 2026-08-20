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

public class Translator_dataSourceId_CarbonEmissions extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_dataSourceId_CarbonEmissions.class);

    public Translator_dataSourceId_CarbonEmissions(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> todayValueAttrNames = new LinkedHashMap<>();
        attrNames.put("todayValue", "e8ight:todayValue");
        attrNames.put("monitorTo", "e8ight:monitorTo");
        todayValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

        List<Attribute> attrs = new ArrayList<>();
        List<Attribute> todayValueAttrs = new ArrayList<>();

        String buildingId = EntityIdMapper.getBuildingId(jsonObject.getString("buildingId"));
        entityId = new EntityId("urn:ngsi-ld:Measurement:CarbonEmissions:" + buildingId, "Measurement", "SS-CNT");

        if ( !jsonObject.isNull("last-update") ) {
            String observedAtValue = LocalDateTime.parse(jsonObject.getString("last-update").substring(0, 19), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
            double value = jsonObject.getDouble("carbon_emission");

            Attribute todayValueObservedAt = new Attribute("observedAt", null, observedAtValue, null, null);
            todayValueAttrs.add(todayValueObservedAt);
            Attribute todayValue = new Attribute("todayValue", "Property", value, todayValueAttrNames, todayValueAttrs);
            attrs.add(todayValue);
            Attribute monitorTo = new Attribute("monitorTo", "Relationship", List.of("urn:ngsi-ld:CarbonEmissions:" + buildingId), null, null);
            attrs.add(monitorTo);

            Entity entity = new Entity(entityId, attrNames, attrs, context);
            entities.add(entity);
        }

        return entities;
    }
}