package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Translator_233_ShortTermForecast extends EntityTranslator {

    private static final Logger log = LoggerFactory.getLogger(Translator_233_ShortTermForecast.class);

    public Translator_233_ShortTermForecast(String context) {
        this.context = context;
    }

    @Override
    public List<Entity> translate(JSONObject jsonObject) throws JSONException {
        List<Entity> entities = new ArrayList<>();
        EntityId entityId;

        String context = "http://172.16.28.221:53005/weather-context.jsonld";
        LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();
        List<Attribute> attrs = new ArrayList<>();

        attrNames.put("name", "ngsi-ld:name");
        attrNames.put("openApiUrl", "e8ight:openApiUrl");

        JSONObject response = jsonObject.getJSONObject("response");
        if ( response.has("body")) {
            JSONArray item = response.getJSONObject("body").getJSONObject("items").getJSONArray("item");

            JSONObject sameValue = item.getJSONObject(0);

            int nx = sameValue.getInt("nx");
            int ny = sameValue.getInt("ny");

            Attribute nameAttribute = new Attribute("name", "Property", "기상청 단기 예보 (서울시 강동구 상일동)", null, null);
            Attribute openApiUrlAttribute = new Attribute("openApiUrl", "Property", "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst", null, null);

            String id = nx + "-" + ny;
            entityId = new EntityId("urn:ngsi-ld:ShortTermForecast:" + id, "ShortTermForecast", "E8-W");

            attrs.add(nameAttribute);
            attrs.add(openApiUrlAttribute);

            LocalDateTime nextHourLocalDateTime = LocalDateTime.now().plusHours(1);
            String fcstDate = nextHourLocalDateTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String fcstTime = nextHourLocalDateTime.format(DateTimeFormatter.ofPattern("HH00"));
            for (int i = 0; i < item.length(); i++) {
                JSONObject weatherInfo = item.getJSONObject(i);
                String category = weatherInfo.getString("category");
                String value = weatherInfo.getString("fcstValue");
                String baseDate = weatherInfo.getString("baseDate");
                String baseTime = weatherInfo.getString("baseTime");

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
                String observedAtValue = LocalDateTime.parse(baseDate+baseTime, formatter).minusHours(9).atZone(ZoneId.of("Asia/Seoul"))
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
                Attribute observedAt = new Attribute("observedAt", null, observedAtValue, null, null);


                if ( weatherInfo.getString("fcstDate").equals(fcstDate) ) {
                    if (category.equals("TMN")) {
                        LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                        chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                        chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                        Attribute unitCode = new Attribute("unitCode", null, "CEL", null, null);
                        List<Attribute> childAttrs = new ArrayList<>();
                        childAttrs.add(observedAt);
                        childAttrs.add(unitCode);
                        attrNames.put("wMinTemperature", "e8ight:wMinTemperature");
                        Attribute wMinTemperature = new Attribute("wMinTemperature", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                        attrs.add(wMinTemperature);
                        continue;
                    }
                    if (category.equals("TMX")) {
                        LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                        chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                        chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                        Attribute unitCode = new Attribute("unitCode", null, "CEL", null, null);
                        List<Attribute> childAttrs = new ArrayList<>();
                        childAttrs.add(observedAt);
                        childAttrs.add(unitCode);
                        attrNames.put("wMaxTemperature", "e8ight:wMaxTemperature");
                        Attribute wMaxTemperature = new Attribute("wMaxTemperature", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                        attrs.add(wMaxTemperature);
                        continue;
                    }

                    if ( weatherInfo.getString("fcstTime").equals(fcstTime)) {
                        if (category.equals("POP")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "P1", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wPrecipitationProbability", "e8ight:wPrecipitationProbability");
                            Attribute wPrecipitationProbability = new Attribute("wPrecipitationProbability", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wPrecipitationProbability);
                        } else if (category.equals("PTY")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            attrNames.put("wPrecipitationType", "e8ight:wPrecipitationType");
                            Attribute precipitationTypeAttribute = new Attribute("wPrecipitationType", "Property", Integer.parseInt(value), chiildAttrNames, childAttrs);
                            attrs.add(precipitationTypeAttribute);
                        } else if (category.equals("PCP")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            attrNames.put("w1hourPrecipitation", "e8ight:w1hourPrecipitation");
                            Attribute w1hourPrecipitation = new Attribute("w1hourPrecipitation", "Property", value, chiildAttrNames, childAttrs);
                            attrs.add(w1hourPrecipitation);
                        } else if (category.equals("REH")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "P1", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wHumidity", "e8ight:wHumidity");
                            Attribute wHumidity = new Attribute("wHumidity", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wHumidity);
                        } else if (category.equals("SNO")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            attrNames.put("wSnowCover", "e8ight:wSnowCover");
                            Attribute wSnowCover = new Attribute("wSnowCover", "Property", value, chiildAttrNames, childAttrs);
                            attrs.add(wSnowCover);
                        } else if (category.equals("SKY")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            attrNames.put("wSkyStatus", "e8ight:wSkyStatus");
                            Attribute wSkyStatus = new Attribute("wSkyStatus", "Property", Integer.parseInt(value), chiildAttrNames, childAttrs);
                            attrs.add(wSkyStatus);
                        } else if (category.equals("TMP")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "CEL", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wTemperature", "e8ight:wTemperature");
                            Attribute wTemperature = new Attribute("wTemperature", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wTemperature);
                        } else if (category.equals("UUU")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "MS", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wEastWestWind", "e8ight:wEastWestWind");
                            Attribute wEastWestWind = new Attribute("wEastWestWind", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wEastWestWind);
                        } else if (category.equals("VEC")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "DEG", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wWindDirection", "e8ight:wWindDirection");
                            Attribute wWindDirection = new Attribute("wWindDirection", "Property", Integer.parseInt(value), chiildAttrNames, childAttrs);
                            attrs.add(wWindDirection);
                        } else if (category.equals("VVV")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "MS", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wSouthNorthWind", "e8ight:wSouthNorthWind");
                            Attribute wSouthNorthWind = new Attribute("wSouthNorthWind", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wSouthNorthWind);
                        } else if (category.equals("WSD")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "MS", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wWindSpeed", "e8ight:wWindSpeed");
                            Attribute wWindSpeed = new Attribute("wWindSpeed", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wWindSpeed);
                        } else if (category.equals("WAV")) {
                            LinkedHashMap<String, String> chiildAttrNames = new LinkedHashMap<>();
                            chiildAttrNames.put("observedAt", "ngsi-ld:observedAt");
                            chiildAttrNames.put("unitCode", "ngsi-ld:unitCode");
                            Attribute unitCode = new Attribute("unitCode", null, "MTR", null, null);
                            List<Attribute> childAttrs = new ArrayList<>();
                            childAttrs.add(observedAt);
                            childAttrs.add(unitCode);
                            attrNames.put("wWaveHeight", "e8ight:wWaveHeight");
                            Attribute wWaveHeight = new Attribute("wWaveHeight", "Property", Double.parseDouble(value), chiildAttrNames, childAttrs);
                            attrs.add(wWaveHeight);
                        }
                    }
                }
            }
            Entity entity = new Entity(entityId, attrNames, attrs, context);
            entities.add(entity);
        }
        return entities;
    }
}