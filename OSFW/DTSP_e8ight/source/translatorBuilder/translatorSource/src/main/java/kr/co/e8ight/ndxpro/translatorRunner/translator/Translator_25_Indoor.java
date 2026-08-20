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

public class Translator_25_Indoor extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_25_Indoor.class);

    public Translator_25_Indoor(String context) {
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

                putEntityToList(entities, createIndoorCoolingHeatingEntity(id, object));
                putEntityToList(entities, createIndoorVentilationEntity(id, object));
                putEntityToList(entities, createIndoorLightingEntity(id, object));
            }
        }
        return entities;
    }

    private void putEntityToList(List<Entity> entities, Entity entity) {
        if ( entity != null ) {
            entities.add(entity);
        }
    }

    private Entity createIndoorVentilationEntity(String id, JSONObject object) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        List<Attribute> attrs = new ArrayList<>();

        EntityId entityId = new EntityId("urn:ngsi-ld:IndoorVentilation:" + id, "IndoorVentilation", "SS-CNT");
        JSONArray co2Array = object.getJSONArray("co2");
        JSONArray pm25Array = object.getJSONArray("pm25");
        JSONArray pm10Array = object.getJSONArray("pm10");
        JSONArray tvocArray = object.getJSONArray("tvoc");

        if ( co2Array.length() > 0 ) {
            LinkedHashMap<String, String> co2AttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> co2StateAttrNames = new LinkedHashMap<>();
            attrNames.put("co2", "e8ight:co2");
            attrNames.put("co2State", "e8ight:co2State");
            co2AttrNames.put("unitCode", "ngsi-ld:unitCode");
            co2AttrNames.put("observedAt", "ngsi-ld:observedAt");
            co2StateAttrNames.put("observedAt", "ngsi-ld:observedAt");

            List<Attribute> co2Attrs = new ArrayList<>();
            List<Attribute> co2StateAttrs = new ArrayList<>();

            JSONObject co2Object = co2Array.getJSONObject(co2Array.length() - 1);
            String observedAtValue = LocalDateTime.parse(co2Object.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double co2Value = co2Object.getDouble("value");
            String co2State = co2Object.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            co2Attrs.add(observedAt);
            co2StateAttrs.add(observedAt);

            Attribute co2UnitCode = new Attribute("unitCode", null, "59", null, null);
            co2Attrs.add(co2UnitCode);
            Attribute co2Attr = new Attribute("co2", "Property", co2Value, co2AttrNames, co2Attrs);
            attrs.add(co2Attr);
            Attribute co2StateAttr = new Attribute("co2State", "Property", co2State, co2StateAttrNames, co2StateAttrs);
            attrs.add(co2StateAttr);
        }

        if ( pm25Array.length() > 0 ) {
            LinkedHashMap<String, String> pm2_5AttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> pm2_5StateAttrNames = new LinkedHashMap<>();
            attrNames.put("pm2_5", "e8ight:pm2_5");
            attrNames.put("pm2_5State", "e8ight:pm2_5State");
            pm2_5AttrNames.put("unitCode", "ngsi-ld:unitCode");
            pm2_5AttrNames.put("observedAt", "ngsi-ld:observedAt");
            pm2_5StateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> pm2_5Attrs = new ArrayList<>();
            List<Attribute> pm2_5StateAttrs = new ArrayList<>();

            JSONObject pm25Object = pm25Array.getJSONObject(pm25Array.length() - 1);
            String observedAtValue = LocalDateTime.parse(pm25Object.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double pm25Value = pm25Object.getDouble("value");
            String pm25State = pm25Object.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            pm2_5Attrs.add(observedAt);
            pm2_5StateAttrs.add(observedAt);

            Attribute pm2_5UnitCode = new Attribute("unitCode", null, "GQ", null, null);
            pm2_5Attrs.add(pm2_5UnitCode);
            Attribute pm2_5Attr = new Attribute("pm2_5", "Property", pm25Value, pm2_5AttrNames, pm2_5Attrs);
            attrs.add(pm2_5Attr);
            Attribute pm2_5StateAttr = new Attribute("pm2_5State", "Property", pm25State, pm2_5StateAttrNames, pm2_5StateAttrs);
            attrs.add(pm2_5StateAttr);
        }

        if ( pm10Array.length() > 0 ) {
            LinkedHashMap<String, String> pm10AttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> pm10StateAttrNames = new LinkedHashMap<>();
            attrNames.put("pm10", "e8ight:pm10");
            attrNames.put("pm10State", "e8ight:pm10State");
            pm10AttrNames.put("unitCode", "ngsi-ld:unitCode");
            pm10AttrNames.put("observedAt", "ngsi-ld:observedAt");
            pm10StateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> pm10Attrs = new ArrayList<>();
            List<Attribute> pm10StateAttrs = new ArrayList<>();

            JSONObject pm10Object = pm10Array.getJSONObject(pm10Array.length() - 1);
            String observedAtValue = LocalDateTime.parse(pm10Object.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double pm10Value = pm10Object.getDouble("value");
            String pm10State = pm10Object.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            pm10Attrs.add(observedAt);
            pm10StateAttrs.add(observedAt);

            Attribute pm10UnitCode = new Attribute("unitCode", null, "GQ", null, null);
            pm10Attrs.add(pm10UnitCode);
            Attribute pm10Attr = new Attribute("pm10", "Property", pm10Value, pm10AttrNames, pm10Attrs);
            attrs.add(pm10Attr);
            Attribute pm10StateAttr = new Attribute("pm10State", "Property", pm10State, pm10StateAttrNames, pm10StateAttrs);
            attrs.add(pm10StateAttr);
        }

        if ( tvocArray.length() > 0 ) {
            LinkedHashMap<String, String> tvocAttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> tvocStateAttrNames = new LinkedHashMap<>();
            attrNames.put("tvoc", "e8ight:tvoc");
            attrNames.put("tvocState", "e8ight:tvocState");
            tvocAttrNames.put("unitCode", "ngsi-ld:unitCode");
            tvocAttrNames.put("observedAt", "ngsi-ld:observedAt");
            tvocStateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> tvocAttrs = new ArrayList<>();
            List<Attribute> tvocStateAttrs = new ArrayList<>();


            JSONObject tvocObject = tvocArray.getJSONObject(tvocArray.length() - 1);
            String observedAtValue = LocalDateTime.parse(tvocObject.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double tvocValue = tvocObject.getDouble("value");
            String tvocState = tvocObject.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            tvocAttrs.add(observedAt);
            tvocStateAttrs.add(observedAt);

            Attribute tvocUnitCode = new Attribute("unitCode", null, "61", null, null);
            tvocAttrs.add(tvocUnitCode);
            Attribute tvocAttr = new Attribute("tvoc", "Property", tvocValue, tvocAttrNames, tvocAttrs);
            attrs.add(tvocAttr);
            Attribute tvocStateAttr = new Attribute("tvocState", "Property", tvocState, tvocStateAttrNames, tvocStateAttrs);
            attrs.add(tvocStateAttr);
        }

        if ( attrs.size() > 0 ) {
            return new Entity(entityId, attrNames, attrs, context);
        } else {
            return null;
        }
    }

    private Entity createIndoorCoolingHeatingEntity(String id, JSONObject object) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        List<Attribute> attrs = new ArrayList<>();

        EntityId entityId = new EntityId("urn:ngsi-ld:IndoorCoolingHeating:" + id, "IndoorCoolingHeating", "SS-CNT");
        JSONArray temperatures = object.getJSONArray("temperature");
        JSONArray humidityArray = object.getJSONArray("humidity");

        if ( temperatures.length() > 0 ) {
            LinkedHashMap<String, String> temperatureAttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> temperatureStateAttrNames = new LinkedHashMap<>();
            attrNames.put("temperature", "e8ight:temperature");
            attrNames.put("temperatureState", "e8ight:temperatureState");
            temperatureAttrNames.put("unitCode", "ngsi-ld:unitCode");
            temperatureAttrNames.put("observedAt", "ngsi-ld:observedAt");
            temperatureStateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> temperatureAttrs = new ArrayList<>();
            List<Attribute> temperatureStateAttrs = new ArrayList<>();

            JSONObject temperaturesObject = temperatures.getJSONObject(temperatures.length() - 1);
            String observedAtValue = LocalDateTime.parse(temperaturesObject.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double temperatureValue = temperaturesObject.getDouble("value");
            String temperatureState = temperaturesObject.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            temperatureAttrs.add(observedAt);
            temperatureStateAttrs.add(observedAt);

            Attribute temperatureUnitCode = new Attribute("unitCode", null, "CEL", null, null);
            temperatureAttrs.add(temperatureUnitCode);

            Attribute temperatureValueAttr = new Attribute("temperature", "Property", temperatureValue, temperatureAttrNames, temperatureAttrs);
            attrs.add(temperatureValueAttr);
            Attribute temperatureStateAttr = new Attribute("temperatureState", "Property", temperatureState, temperatureStateAttrNames, temperatureStateAttrs);
            attrs.add(temperatureStateAttr);
        }

        if ( humidityArray.length() > 0 ) {
            LinkedHashMap<String, String> humidityAttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> humidityStateAttrNames = new LinkedHashMap<>();
            attrNames.put("humidity", "e8ight:humidity");
            attrNames.put("humidityState", "e8ight:humidityState");
            humidityAttrNames.put("unitCode", "ngsi-ld:unitCode");
            humidityAttrNames.put("observedAt", "ngsi-ld:observedAt");
            humidityStateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> humidityAttrs = new ArrayList<>();
            List<Attribute> humidityStateAttrs = new ArrayList<>();
            JSONObject humidityObject = humidityArray.getJSONObject(humidityArray.length() - 1);
            String observedAtValue = LocalDateTime.parse(humidityObject.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double humidityValue = humidityObject.getDouble("value");
            String humidityState = humidityObject.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            humidityAttrs.add(observedAt);
            humidityStateAttrs.add(observedAt);

            Attribute relativeHumidityUnitCode = new Attribute("unitCode", null, "P1", null, null);
            humidityAttrs.add(relativeHumidityUnitCode);

            Attribute humidityValueAttr = new Attribute("humidity", "Property", humidityValue, humidityAttrNames, humidityAttrs);
            attrs.add(humidityValueAttr);
            Attribute humidityStateAttr = new Attribute("humidityState", "Property", humidityState, humidityStateAttrNames, humidityStateAttrs);
            attrs.add(humidityStateAttr);
        }

        if ( attrs.size() > 0 ) {
            return new Entity(entityId, attrNames, attrs, context);
        } else {
            return null;
        }
    }

    private Entity createIndoorLightingEntity(String id, JSONObject object) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        List<Attribute> attrs = new ArrayList<>();

        EntityId entityId = new EntityId("urn:ngsi-ld:IndoorLighting:" + id, "IndoorLighting", "SS-CNT");
        JSONArray illuminances = object.getJSONArray("illuminance");

        if ( illuminances.length() > 0 ) {
            LinkedHashMap<String, String> illuminanceAttrNames = new LinkedHashMap<>();
            LinkedHashMap<String, String> illuminanceStateAttrNames = new LinkedHashMap<>();
            attrNames.put("illuminance", "e8ight:illuminance");
            attrNames.put("illuminanceState", "e8ight:illuminanceState");
            illuminanceAttrNames.put("unitCode", "ngsi-ld:unitCode");
            illuminanceAttrNames.put("observedAt", "ngsi-ld:observedAt");
            illuminanceStateAttrNames.put("observedAt", "ngsi-ld:observedAt");
            List<Attribute> illuminanceAttrs = new ArrayList<>();
            List<Attribute> illuminanceStateAttrs = new ArrayList<>();

            JSONObject illuminanceObject = illuminances.getJSONObject(illuminances.length() - 1);
            String observedAtValue = LocalDateTime.parse(illuminanceObject.getString("time"), DateTimeFormatter.ofPattern("yyyy-M-d H:m"))
                    .minusHours(9).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";

            double illuminanceValue = illuminanceObject.getDouble("value");
            String illuminanceState = illuminanceObject.getString("status");

            Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);

            illuminanceAttrs.add(observedAt);
            illuminanceStateAttrs.add(observedAt);

            Attribute illuminanceUnitCode = new Attribute("unitCode", null, "LUX", null, null);
            illuminanceAttrs.add(illuminanceUnitCode);

            Attribute illuminanceValueAttr = new Attribute("illuminance", "Property", illuminanceValue, illuminanceAttrNames, illuminanceAttrs);
            attrs.add(illuminanceValueAttr);
            Attribute illuminanceStateAttr = new Attribute("illuminanceState", "Property", illuminanceState, illuminanceStateAttrNames, illuminanceStateAttrs);
            attrs.add(illuminanceStateAttr);
        }

        if ( attrs.size() > 0 ) {
            return new Entity(entityId, attrNames, attrs, context);
        } else {
            return null;
        }
    }
}