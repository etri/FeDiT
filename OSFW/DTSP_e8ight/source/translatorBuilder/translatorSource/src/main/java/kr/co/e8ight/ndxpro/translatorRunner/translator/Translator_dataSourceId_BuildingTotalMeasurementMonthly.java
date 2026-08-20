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

public class Translator_dataSourceId_BuildingTotalMeasurementMonthly extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_dataSourceId_BuildingTotalMeasurementMonthly.class);

    public Translator_dataSourceId_BuildingTotalMeasurementMonthly(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        LinkedHashMap<String, String> thisMonthValueAttrNames = new LinkedHashMap<>();
        attrNames.put("thisMonthValue", "e8ight:thisMonthValue");
        thisMonthValueAttrNames.put("observedAt", "ngsi-ld:observedAt");

        List<Attribute> attrs = new ArrayList<>();
        List<Attribute> thisMonthValueAttrs = new ArrayList<>();

        String buildingId = EntityIdMapper.getBuildingId(jsonObject.getString("buildingId"));
        entityId = new EntityId("urn:ngsi-ld:Measurement:EnergyUsageTotal" + buildingId, "Measurement", "SS-CNT");

        String observedAtValue = LocalDateTime.parse(jsonObject.getString("last-update").substring(0, 19), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
        double value = jsonObject.getDouble("energy_use");

        Attribute thisMonthValueObservedAt = new Attribute("observedAt", null, observedAtValue, null, null);
        thisMonthValueAttrs.add(thisMonthValueObservedAt);
        Attribute thisMonthValue = new Attribute("thisMonthValue", "Property", value, thisMonthValueAttrNames, thisMonthValueAttrs);
        attrs.add(thisMonthValue);

        Entity entity = new Entity(entityId, attrNames, attrs, context);
        entities.add(entity);

        return entities;
    }
}