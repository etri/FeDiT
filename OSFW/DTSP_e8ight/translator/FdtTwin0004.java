package kr.co.e8ight.ndxpro.translatorRunner.translator;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FdtTwin0004 extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(FdtTwin0004.class);

    public FdtTwin0004(String modelType) {
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) {
        List<Entity> entities = new ArrayList<>();

        // "data" 객체에서 키 추출;
        String dataObjectJsonString = jsonObject.getString("data");
        String cleanedData = dataObjectJsonString.replaceAll("\\n", "");
        JSONObject dataObjectJson = new JSONObject(cleanedData);

        // "data" 객체의 키들 순회
        Iterator<String> keys = dataObjectJson.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            JSONObject krObject = dataObjectJson.getJSONObject(key);
            setEntity(key, entities, krObject);
        }
        return entities;
    }

    private void setEntity(String key, List<Entity> entities, JSONObject krObject) {
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        List<Attribute> attrs = new ArrayList<>();
        EntityId entityId = null;
        String type = krObject.getString("type");
        if (type.equals("AirQuality")) {
            entityId = new EntityId("urn:ngsi-ld:FdtAirQuality:" + key, "FdtAirQuality", "FDT");
            setAirQuality(attrNames, attrs, krObject);
        } else if (type.equals("Weather")) {
            entityId = new EntityId("urn:ngsi-ld:FdtWeather:" + key, "FdtWeather", "FDT");
            setWeather(attrNames, attrs, krObject);
        } else if (type.equals("Parking")) {
            entityId = new EntityId("urn:ngsi-ld:FdtParking:" + key, "FdtParking", "FDT");
            setParking(attrNames, attrs, krObject);
        } else if (type.equals("Traffic")) {
            entityId = new EntityId("urn:ngsi-ld:FdtTraffic:" + key, "FdtTraffic", "FDT");
            setTraffic(attrNames, attrs, krObject);
        }
        Entity entity = new Entity(entityId, attrNames, attrs);
        entity.setContext("http://172.16.28.222:53005/fdt-twin-context-v1.0.1.jsonld");
        entities.add(entity);
    }

    private void setAirQuality(LinkedHashMap<String, String> attrNames, List<Attribute> attrs,
            JSONObject krObject) {

        setLocation(attrNames, attrs, krObject);
        JSONObject airQualityMeasurementObject = krObject.getJSONObject("airQualityMeasurement");

        LinkedHashMap<String, String> mdNames = new LinkedHashMap<>();
        List<Attribute> mds = new ArrayList<>();
        setObservedAt(airQualityMeasurementObject, mds, mdNames);

        JSONArray values = airQualityMeasurementObject.getJSONArray("value");
        if (!values.isEmpty()) {
            JSONObject airQualityMeasurementValue = values.getJSONObject(0);
            Attribute airQualityMeasurement = new Attribute("airQualityMeasurement", "Property",
                    airQualityMeasurementValue, mdNames, mds);
            attrNames.put("airQualityMeasurement", "e8ight:airQualityMeasurement");
            attrs.add(airQualityMeasurement);
        }
    }

    private void setWeather
            (LinkedHashMap<String, String> attrNames, List<Attribute> attrs, JSONObject krObject) {

        setLocation(attrNames, attrs, krObject);
        JSONObject weatherMeasurementObject = krObject.getJSONObject("weatherMeasurement");

        LinkedHashMap<String, String> mdNames = new LinkedHashMap<>();
        List<Attribute> mds = new ArrayList<>();
        setObservedAt(weatherMeasurementObject, mds, mdNames);

        JSONArray values = weatherMeasurementObject.getJSONArray("value");
        if (!values.isEmpty()) {
            JSONObject weatherMeasurementValue = values.getJSONObject(0);
            Attribute weatherMeasurement = new Attribute("weatherMeasurement", "Property",
                    weatherMeasurementValue, mdNames, mds);
            attrNames.put("weatherMeasurement", "e8ight:weatherMeasurement");
            attrs.add(weatherMeasurement);
        }

    }

    private void setParking
            (LinkedHashMap<String, String> attrNames, List<Attribute> attrs, JSONObject krObject) {
        setLocation(attrNames, attrs, krObject);
        JSONObject parkingMeasurementObject = krObject.getJSONObject("parkingMeasurement");

        LinkedHashMap<String, String> mdNames = new LinkedHashMap<>();
        List<Attribute> mds = new ArrayList<>();
        setObservedAt(parkingMeasurementObject, mds, mdNames);

        JSONArray values = parkingMeasurementObject.getJSONArray("value");
        if (!values.isEmpty()) {
            JSONObject parkingMeasurementValue = values.getJSONObject(0);
            Attribute parkingMeasurement = new Attribute("parkingMeasurement", "Property",
                    parkingMeasurementValue, mdNames, mds);
            attrNames.put("parkingMeasurement", "e8ight:parkingMeasurement");
            attrs.add(parkingMeasurement);
        }
    }

    private void setTraffic
            (LinkedHashMap<String, String> attrNames, List<Attribute> attrs, JSONObject krObject) {
        setLocation(attrNames, attrs, krObject);

        JSONObject trafficMeasurementObject = krObject.getJSONObject("trafficMeasurement");

        LinkedHashMap<String, String> mdNames = new LinkedHashMap<>();
        List<Attribute> mds = new ArrayList<>();
        setObservedAt(trafficMeasurementObject, mds, mdNames);

        JSONArray values = trafficMeasurementObject.getJSONArray("value");

        if (!values.isEmpty()) {
            Attribute trafficMeasurement = new Attribute("trafficMeasurement", "Property", values,
                    mdNames, mds);
            attrNames.put("trafficMeasurement", "e8ight:trafficMeasurement");
            attrs.add(trafficMeasurement);
        }

    }

    private void setLocation
            (LinkedHashMap<String, String> attrNames, List<Attribute> attrs, JSONObject krObject) {
        attrNames.put("location", "ngsi-ld:location");

        JSONObject locationObject = krObject.getJSONObject("location");
        JSONObject locationValue = locationObject.getJSONObject("value");
        Attribute location = new Attribute("location", "GeoProperty", locationValue, null,
                null);
        attrs.add(location);
    }

    private void setObservedAt(JSONObject airQualityMeasurementObject, List<Attribute> mds,
            LinkedHashMap<String, String> mdNames) {

        String observedAtValue = airQualityMeasurementObject.getString("observedAt");
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime dateTime = LocalDateTime.parse(observedAtValue, inputFormatter).minusHours(9);
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'");
        String observedAt = dateTime.format(outputFormatter);

        mdNames.put("observedAt", "ngsi-ld:observedAt");
        Attribute observedAtAttribute = new Attribute("observedAt", null, observedAt, null, null);
        mds.add(observedAtAttribute);
    }


}