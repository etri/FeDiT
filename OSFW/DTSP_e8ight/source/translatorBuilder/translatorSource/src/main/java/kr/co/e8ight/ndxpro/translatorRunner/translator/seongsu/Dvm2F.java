package kr.co.e8ight.ndxpro.translatorRunner.translator.seongsu;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro.translatorRunner.translator.EntityTranslator;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Dvm2F extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(Dvm2F.class);

  public Dvm2F(String context) {
    this.context = context;
  }

  @Override
  public List<Entity> translate(JSONObject jsonObject) {
    List<Entity> entities = new ArrayList<>();

    /*
     * Json 필드 이름으로 데이터 불러오기
     * Array 인 경우 getJSONArray() 사용
     * Object 인 경우 getJsonObject() 사용
     * 값인 경우 get() 또는 getString() 등 타입을 선언할 수 있는 메서드 사용
     */
    JSONArray itemList = jsonObject.getJSONArray("data");
    for (int i = 0; i < itemList.length(); i++) {
      JSONObject item = itemList.getJSONObject(i);
      String type = item.getString("type");
      if (type.equals("AirConditioner.Indoor")) {
        Entity entity = processAirConditionerIndoor(item);
        entities.add(entity);
      } else if (type.equals("AirConditionerOutdoor")) {
        Entity entity = processAirConditionerOutdoor(item);
        entities.add(entity);
      }
    }
    return entities;
  }

  private Entity processAirConditionerIndoor(JSONObject item) {

    List<Attribute> attrs = new ArrayList<>();
    List<Attribute> sampleMd = new ArrayList<>();

    // 기본 정보
    String id = item.optString("id");
    String name = item.optString("name");
//    String type = item.optString("type");
//    String parentId = item.optString("parentId");
//    String parentName = item.optString("parentName");
//    String parentType = item.optString("parentType");
    String registrationStatus = item.optString("registrationStatus");
    String representativeStatus = item.optString("representativeStatus");

    // locations
//    if (item.has("locations")) {
//      JSONArray locArray = item.getJSONArray("locations");
//      for (int i = 0; i < locArray.length(); i++) {
//        JSONObject locObj = locArray.getJSONObject(i);
//        String locId = locObj.optString("id");
//        String description = locObj.optString("description");
//        int buildingId = locObj.optInt("foundation_space_buildings_id");
//        int floorId = locObj.optInt("foundation_space_floors_id");
//
//        JSONObject geom = locObj.optJSONObject("geometry");
//        if (geom != null) {
//          JSONArray coords = geom.optJSONArray("coordinates");
//          double x = coords.optDouble(0);
//          double y = coords.optDouble(1);
//        }
//      }
//    }

    // groups
//    if (item.has("groups")) {
//      JSONArray groupArray = item.getJSONArray("groups");
//      for (int i = 0; i < groupArray.length(); i++) {
//        JSONObject g = groupArray.getJSONObject(i);
//        int groupId = g.optInt("dms_groups_id");
//        String groupName = g.optString("dms_groups_name");
//      }
//    }

    // information
    JSONObject info = item.optJSONObject("information");
    if (info != null) {
      String manufacturer = info.optString("manufacturer");
      Attribute manufacturerAttribute = new Attribute.Builder()
          .name("manufacturer")
          .type("Property")
          .value(manufacturer)
          .build();
      attrs.add(manufacturerAttribute);

      String updatedTime = info.optString("updatedTime");
      OffsetDateTime seoulTime = OffsetDateTime.parse(updatedTime,
          DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      OffsetDateTime utcTime = seoulTime.withOffsetSameInstant(ZoneOffset.UTC);
      String observedAt =
          utcTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
      Attribute sampleMd_observedAt = new Attribute.Builder()
          .name("observedAt")
          .value(observedAt)
          .build();
      sampleMd.add(sampleMd_observedAt);

      String modelName = info.optString("modelName");
      Attribute modelNameAttribute = new Attribute.Builder()
          .name("modelName")
          .type("Property")
          .value(modelName)
          .build();
      attrs.add(modelNameAttribute);

//      if (info.has("versions")) {
//        JSONArray versionsArray = info.getJSONArray("versions");
//        for (int i = 0; i < versionsArray.length(); i++) {
//          JSONObject v = versionsArray.getJSONObject(i);
//          String versionType = v.optString("type");
//          String versionNumber = v.optString("number");
//        }
//      }
//    }

      // configuration
      JSONObject config = item.optJSONObject("configuration");
      if (config != null) {
        String remoteControl = config.optString("remoteControl");
        Attribute remoteControlAttribute = new Attribute.Builder()
            .name("remoteControl")
            .type("Property")
            .value(remoteControl)
            .md(sampleMd)
            .build();
        attrs.add(remoteControlAttribute);
      }

      // modes
      if (item.has("modes")) {
        JSONArray modesArray = item.getJSONArray("modes");
        for (int i = 0; i < modesArray.length(); i++) {
          JSONObject m = modesArray.getJSONObject(i);
          String modeId = m.optString("id");
          if (modeId.equals("AirConditioner.Indoor.General")) {
            String mode = m.optString("mode");
            Attribute modeAttribute = new Attribute.Builder()
                .name("mode")
                .type("Property")
                .value(mode)
                .md(sampleMd)
                .build();
            attrs.add(modeAttribute);
          }
//          JSONArray supportedModes = m.optJSONArray("supportedModes");
//          if (supportedModes != null) {
//            for (int j = 0; j < supportedModes.length(); j++) {
//              String supported = supportedModes.optString(j);
//            }
//          }
        }
      }

      // operations
      if (item.has("operations")) {
        JSONArray opsArray = item.getJSONArray("operations");
        for (int i = 0; i < opsArray.length(); i++) {
          JSONObject op = opsArray.getJSONObject(i);
          String opId = op.optString("id");
          String power = op.optString("power");
          Attribute powerAttribute = new Attribute.Builder()
              .name("power")
              .type("Property")
              .value(power)
              .md(sampleMd)
              .build();
          attrs.add(powerAttribute);
        }
      }

      // temperatures
      if (item.has("temperatures")) {
        JSONArray tempsArray = item.getJSONArray("temperatures");
        for (int i = 0; i < tempsArray.length(); i++) {
          JSONObject t = tempsArray.getJSONObject(i);
          String tempId = t.optString("id");
          if (tempId.equals("AirConditioner.Indoor.Room")) {
            Double desired = t.has("desired") ? t.optDouble("desired") : null;
            Attribute desiredAttribute = new Attribute.Builder()
                .name("desiredTemperature")
                .type("Property")
                .value(desired)
                .md(sampleMd)
                .build();
            attrs.add(desiredAttribute);

            // current 추가
            Double current = t.has("current") ? t.optDouble("current") : null;
            Attribute currentAttribute = new Attribute.Builder()
                .name("currentTemperature")
                .type("Property")
                .value(current)
                .md(sampleMd)
                .build();
            attrs.add(currentAttribute);
          }
          if (tempId.equals("AirConditioner.Indoor.Room.Cool.Limit")) {
            Double min = t.has("minimum") ? t.optDouble("minimum") : null;
            Attribute coolLimitAttribute = new Attribute.Builder()
                .name("coolLimit")
                .type("Property")
                .value(min)
                .md(sampleMd)
                .build();
            attrs.add(coolLimitAttribute);

          }
          if (tempId.equals("AirConditioner.Indoor.Room.Heat.Limit")) {
            Double max = t.has("maximum") ? t.optDouble("maximum") : null;
            Attribute heatLimitAttribute = new Attribute.Builder()
                .name("heatLimit")
                .type("Property")
                .value(max)
                .md(sampleMd)
                .build();
            attrs.add(heatLimitAttribute);

          }
//          String unit = t.optString("unit");
//          Boolean enabled = t.has("enabled") ? t.optBoolean("enabled") : null;
        }
      }

      // winds
      if (item.has("winds")) {
        JSONArray windsArray = item.getJSONArray("winds");
        for (int i = 0; i < windsArray.length(); i++) {
          JSONObject w = windsArray.getJSONObject(i);
          String windId = w.optString("id");

          if (windId.equals("AirConditioner.Indoor.General.Speed")) {
            String wind = w.optString("wind");
            Attribute windSpeedAttribute = new Attribute.Builder()
                .name("windSpeed")
                .type("Property")
                .value(wind)
                .md(sampleMd)
                .build();
            attrs.add(windSpeedAttribute);
          }
          if (windId.equals("AirConditioner.Indoor.General.Direction")) {
            String wind = w.optString("wind");
            Attribute windDirectionAttribute = new Attribute.Builder()
                .name("windDirection")
                .type("Property")
                .value(wind)
                .md(sampleMd)
                .build();
            attrs.add(windDirectionAttribute);
          }

        }
      }

      // airConditioner 내부 정보
      JSONObject ac = item.optJSONObject("airConditioner");
      if (ac != null) {
//        String indoorUnitType = ac.optString("indoorUnitType");
//        String defrost = ac.optString("defrost");
//        boolean filterResetRequired = ac.optBoolean("filterResetRequired", false);
//        String peakPowerControl = ac.optString("peakPowerControl");
//        String stillAir = ac.optString("stillAir");
//        String temperatureReference = ac.optString("temperatureReference");
//        Attribute temperatureReferenceAttribute = new Attribute.Builder()
//            .name("temperatureReference")
//            .type("Property")
//            .value(temperatureReference)
//            .build();
//        attrs.add(temperatureReferenceAttribute);
//
//        String longWind = ac.optString("longWind");

        // relatedUnits
        if (ac.has("relatedUnits")) {
          JSONArray relatedArray = ac.getJSONArray("relatedUnits");
          List<String> relatedIds = new ArrayList<>();
          for (int i = 0; i < relatedArray.length(); i++) {
            JSONObject ru = relatedArray.getJSONObject(i);
            String relatedId = ru.optString("id");
            String outdoorEntityId =
                "urn:ngsi-ld:DvmOutdoor:" + outdoorIdMappingTable().get(relatedId);
            relatedIds.add(outdoorEntityId);
//            String relatedName = ru.optString("name");
//            String locations = ru.optString("locations");
//          String representativeStatus = ru.optString("representativeStatus");
//            String mode = ru.optString("mode");
//            Boolean power =
//                ru.has("power") && ru.get("power") instanceof Boolean ? ru.getBoolean("power")
//                    : null;
//            String model = ru.optString("model");
          }

          Attribute connetToAttribute = new Attribute.Builder()
              .name("connectTo")
              .type("Relationship")
              .value(relatedIds)
              .build();
          attrs.add(connetToAttribute);
        }
      }

      /*
       * 하위 Attribute 생성
       * observedAt 하위 속성의 값은 ZonedDateTime으로 변환하여 입력합니다.
       * 9시간을 더한 후 UTC로 변환합니다.
       * 변환된 ZonedDateTime은 NGSI-LD Attribute로 입력합니다
       */
//    ZonedDateTime zonedDateTime = LocalDateTime.parse(jsonObject.getString("timePoint"),
//            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"))
//        .atZone(ZoneOffset.of("+09:00")).withZoneSameInstant(ZoneOffset.UTC);
//
    }
    Attribute registrationStatusAttribute = new Attribute.Builder()
        .name("registrationStatus")
        .type("Property")
        .value(registrationStatus)
        .md(sampleMd)
        .build();
    attrs.add(registrationStatusAttribute);

    Attribute representativeStatusAttribute = new Attribute.Builder()
        .name("representativeStatus")
        .type("Property")
        .value(representativeStatus)
        .md(sampleMd)
        .build();
    attrs.add(representativeStatusAttribute);

    Attribute nameAttribute = new Attribute.Builder()
        .name("name")
        .type("Property")
        .value(name)
        .build();
    attrs.add(nameAttribute);

    Attribute deviceIdAttribute = new Attribute.Builder()
        .name("deviceId")
        .type("Property")
        .value(id)
        .build();
    attrs.add(deviceIdAttribute);

    String indoorEntityId = indoorIdMappingTable().get(id);
    EntityId entityId = new EntityId.Builder()
        .id(indoorEntityId)
        .type("DvmIndoor")
        .provider("SSF")
        .build();

    Map<String, String> attrNames = new HashMap<>();
    for (Attribute attr : attrs) {
      if (!attr.getName().equals("name")) {
        attrNames.put(attr.getName(), "e8ight:" + attr.getName());
      }
    }
    return new Entity.Builder()
        .id(entityId)
        .attrNames(attrNames)
        .attrs(attrs)
        .context(this.context)
        .build();
  }

  private Entity processAirConditionerOutdoor(JSONObject item) {

    List<Attribute> attrs = new ArrayList<>();
    List<Attribute> sampleMd = new ArrayList<>();

    // 기본 정보
    String id = item.optString("id");
    String name = item.optString("name");
    String type = item.optString("type");
//    String parentId = item.optString("parentId");
//    String parentName = item.optString("parentName");
//    String parentType = item.optString("parentType");
    String registrationStatus = item.optString("registrationStatus");
    String representativeStatus = item.optString("representativeStatus");

    // nameDisplayCoordinate
    if (item.has("nameDisplayCoordinate")) {
      JSONArray displayCoords = item.getJSONArray("nameDisplayCoordinate");
      double displayX = displayCoords.optDouble(0);
      double displayY = displayCoords.optDouble(1);
    }

    // locations
//    if (item.has("locations")) {
//      JSONArray locArray = item.getJSONArray("locations");
//      for (int i = 0; i < locArray.length(); i++) {
//        JSONObject locObj = locArray.getJSONObject(i);
//        String locId = locObj.optString("id");
//        String description = locObj.optString("description");
//        int buildingId = locObj.optInt("foundation_space_buildings_id");
//        int floorId = locObj.optInt("foundation_space_floors_id");
//
//        JSONObject geom = locObj.optJSONObject("geometry");
//        if (geom != null) {
//          JSONArray coords = geom.optJSONArray("coordinates");
//          double x = coords.optDouble(0);
//          double y = coords.optDouble(1);
//        }
//      }
//    }

    // information
    JSONObject info = item.optJSONObject("information");
    if (info != null) {
      String updatedTime = info.optString("updatedTime");
      OffsetDateTime seoulTime = OffsetDateTime.parse(updatedTime,
          DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      OffsetDateTime utcTime = seoulTime.withOffsetSameInstant(ZoneOffset.UTC);
      String observedAt =
          utcTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")) + "+00:00";
      Attribute sampleMd_observedAt = new Attribute.Builder()
          .name("observedAt")
          .value(observedAt)
          .build();
      sampleMd.add(sampleMd_observedAt);

      String modelName = info.optString("modelName");
      Attribute modelNameAttribute = new Attribute.Builder()
          .name("modelName")
          .type("Property")
          .value(modelName)
          .build();
      attrs.add(modelNameAttribute);

      if (info.has("versions")) {
        JSONArray versionsArray = info.getJSONArray("versions");
        for (int i = 0; i < versionsArray.length(); i++) {
          JSONObject v = versionsArray.getJSONObject(i);
          String versionType = v.optString("type");
          String versionNumber = v.optString("number");
        }
      }
    }

    // operations
    if (item.has("operations")) {
      JSONArray opsArray = item.getJSONArray("operations");
      for (int i = 0; i < opsArray.length(); i++) {
        JSONObject op = opsArray.getJSONObject(i);
        String opId = op.optString("id");
        String power = op.optString("power");
        Attribute powerAttribute = new Attribute.Builder()
            .name("power")
            .type("Property")
            .value(power)
            .md(sampleMd)
            .build();
        attrs.add(powerAttribute);
      }
    }

    // airConditioner
    JSONObject ac = item.optJSONObject("airConditioner");
    if (ac != null) {

      // outdoorUnit
      JSONObject outdoor = ac.optJSONObject("outdoorUnit");
      if (outdoor != null) {
        boolean electricCurrentControlSupported = outdoor.optBoolean(
            "electricCurrentControlSupported", false);
        Attribute electricCurrentControlSupportedAttribute = new Attribute.Builder()
            .name("electricCurrentControlSupported")
            .type("Property")
            .value(electricCurrentControlSupported)
            .md(sampleMd)
            .build();
        attrs.add(electricCurrentControlSupportedAttribute);

        String electricCurrentControl = outdoor.optString("electricCurrentControl");
        Attribute electricCurrentControlAttribute = new Attribute.Builder()
            .name("electricCurrentControl")
            .type("Property")
            .value(electricCurrentControl)
            .md(sampleMd)
            .build();
        attrs.add(electricCurrentControlAttribute);

        boolean coolingCapacityCalibrationSupported = outdoor.optBoolean(
            "coolingCapacityCalibrationSupported", false);
        Attribute coolingCapacityCalibrationSupportedAttribute = new Attribute.Builder()
            .name("coolingCapacityCalibrationSupported")
            .type("Property")
            .value(coolingCapacityCalibrationSupported)
            .md(sampleMd)
            .build();
        attrs.add(coolingCapacityCalibrationSupportedAttribute);

        String coolingCapacityCalibration = outdoor.optString("coolingCapacityCalibration");
        Attribute coolingCapacityCalibrationAttribute = new Attribute.Builder()
            .name("coolingCapacityCalibration")
            .type("Property")
            .value(coolingCapacityCalibration)
            .md(sampleMd)
            .build();
        attrs.add(coolingCapacityCalibrationAttribute);

        boolean heatingCapacityCalibrationSupported = outdoor.optBoolean(
            "heatingCapacityCalibrationSupported", false);
        Attribute heatingCapacityCalibrationSupportedAttribute = new Attribute.Builder()
            .name("heatingCapacityCalibrationSupported")
            .type("Property")
            .value(heatingCapacityCalibrationSupported)
            .md(sampleMd)
            .build();
        attrs.add(heatingCapacityCalibrationSupportedAttribute);

        String heatingCapacityCalibration = outdoor.optString("heatingCapacityCalibration");
        Attribute heatingCapacityCalibrationAttribute = new Attribute.Builder()
            .name("heatingCapacityCalibration")
            .type("Property")
            .value(heatingCapacityCalibration)
            .md(sampleMd)
            .build();
        attrs.add(heatingCapacityCalibrationAttribute);

        JSONObject cycleInfo = outdoor.optJSONObject("cycleInformation");
        if (cycleInfo != null) {
          double totalIndoorCapa = cycleInfo.optDouble("totalIndoorCapa");
          Attribute totalIndoorCapaAttribute = new Attribute.Builder()
              .name("totalIndoorCapa")
              .type("Property")
              .value(totalIndoorCapa)
              .md(sampleMd)
              .build();
          attrs.add(totalIndoorCapaAttribute);

          int heatingCapa = cycleInfo.optInt("heatingCapa");
          Attribute heatingCapaAttribute = new Attribute.Builder()
              .name("heatingCapa")
              .type("Property")
              .value(heatingCapa)
              .md(sampleMd)
              .build();
          attrs.add(heatingCapaAttribute);

          int defrostStatus = cycleInfo.optInt("defrostStatus");
          Attribute defrostStatusAttribute = new Attribute.Builder()
              .name("defrostStatus")
              .type("Property")
              .value(defrostStatus)
              .md(sampleMd)
              .build();
          attrs.add(defrostStatusAttribute);

          boolean comp1 = cycleInfo.optBoolean("comp1");
          Attribute comp1Attribute = new Attribute.Builder()
              .name("comp1")
              .type("Property")
              .value(comp1)
              .md(sampleMd)
              .build();
          attrs.add(comp1Attribute);
          boolean comp2 = cycleInfo.optBoolean("comp2");

          Attribute comp2Attribute = new Attribute.Builder()
              .name("comp2")
              .type("Property")
              .value(comp2)
              .md(sampleMd)
              .build();
          attrs.add(comp2Attribute);

          boolean mainCoolingValve = cycleInfo.optBoolean("mainCoolingValve");
          Attribute mainCoolingValveAttribute = new Attribute.Builder()
              .name("mainCoolingValve")
              .type("Property")
              .value(mainCoolingValve)
              .md(sampleMd)
              .build();
          attrs.add(mainCoolingValveAttribute);

          boolean hotGasValve1 = cycleInfo.optBoolean("hotGasValve1");
          Attribute hotGasValve1Attribute = new Attribute.Builder()
              .name("hotGasValve1")
              .type("Property")
              .value(hotGasValve1)
              .md(sampleMd)
              .build();
          attrs.add(hotGasValve1Attribute);

          boolean hotGasValve2 = cycleInfo.optBoolean("hotGasValve2");
          Attribute hotGasValve2Attribute = new Attribute.Builder()
              .name("hotGasValve2")
              .type("Property")
              .value(hotGasValve2)
              .md(sampleMd)
              .build();
          attrs.add(hotGasValve2Attribute);

          int outdoorCapacity = cycleInfo.optInt("outdoorCapacity");
          Attribute outdoorCapacityAttribute = new Attribute.Builder()
              .name("outdoorCapacity")
              .type("Property")
              .value(outdoorCapacity)
              .md(sampleMd)
              .build();
          attrs.add(outdoorCapacityAttribute);

          boolean eviBypassValue = cycleInfo.optBoolean("eviBypassValue");
          Attribute eviBypassValueAttribute = new Attribute.Builder()
              .name("eviBypassValue")
              .type("Property")
              .value(eviBypassValue)
              .md(sampleMd)
              .build();
          attrs.add(eviBypassValueAttribute);

          double highPressure = cycleInfo.optDouble("highPressure");
          Attribute highPressureAttribute = new Attribute.Builder()
              .name("highPressure")
              .type("Property")
              .value(highPressure)
              .md(sampleMd)
              .build();
          attrs.add(highPressureAttribute);

          double lowPressure = cycleInfo.optDouble("lowPressure");
          Attribute lowPressureAttribute = new Attribute.Builder()
              .name("lowPressure")
              .type("Property")
              .value(lowPressure)
              .md(sampleMd)
              .build();
          attrs.add(lowPressureAttribute);

          int eev1 = cycleInfo.optInt("eev1");
          Attribute eev1Attribute = new Attribute.Builder()
              .name("eev1")
              .type("Property")
              .value(eev1)
              .md(sampleMd)
              .build();
          attrs.add(eev1Attribute);

          int compCurrentFrequency1 = cycleInfo.optInt("compCurrentFrequency1");
          Attribute compCurrentFrequency1Attribute = new Attribute.Builder()
              .name("compCurrentFrequency1")
              .type("Property")
              .value(compCurrentFrequency1)
              .md(sampleMd)
              .build();
          attrs.add(compCurrentFrequency1Attribute);

          int compCurrentFrequency2 = cycleInfo.optInt("compCurrentFrequency2");
          Attribute compCurrentFrequency2Attribute = new Attribute.Builder()
              .name("compCurrentFrequency2")
              .type("Property")
              .value(compCurrentFrequency2)
              .md(sampleMd)
              .build();
          attrs.add(compCurrentFrequency2Attribute);

          int compDesiredFrequency1 = cycleInfo.optInt("compDesiredFrequency1");
          Attribute compDesiredFrequency1Attribute = new Attribute.Builder()
              .name("compDesiredFrequency1")
              .type("Property")
              .value(compDesiredFrequency1)
              .md(sampleMd)
              .build();
          attrs.add(compDesiredFrequency1Attribute);

          int compDesiredFrequency2 = cycleInfo.optInt("compDesiredFrequency2");
          Attribute compDesiredFrequency2Attribute = new Attribute.Builder()
              .name("compDesiredFrequency2")
              .type("Property")
              .value(compDesiredFrequency2)
              .md(sampleMd)
              .build();
          attrs.add(compDesiredFrequency2Attribute);

          int accumCompOnTime1 = cycleInfo.optInt("accumCompOnTime1");
          Attribute accumCompOnTime1Attribute = new Attribute.Builder()
              .name("accumCompOnTime1")
              .type("Property")
              .value(accumCompOnTime1)
              .md(sampleMd)
              .build();
          attrs.add(accumCompOnTime1Attribute);
          int accumCompOnTime2 = cycleInfo.optInt("accumCompOnTime2");
          Attribute accumCompOnTime2Attribute = new Attribute.Builder()
              .name("accumCompOnTime2")
              .type("Property")
              .value(accumCompOnTime2)
              .md(sampleMd)
              .build();
          attrs.add(accumCompOnTime2Attribute);

//          String outdoorMaster = cycleInfo.optString("outdoorMaster");
          double ct1 = cycleInfo.optDouble("ct1");
          Attribute ct1Attribute = new Attribute.Builder()
              .name("ct1")
              .type("Property")
              .value(ct1)
              .md(sampleMd)
              .build();
          attrs.add(ct1Attribute);

          double ct2 = cycleInfo.optDouble("ct2");
          Attribute ct2Attribute = new Attribute.Builder()
              .name("ct2")
              .type("Property")
              .value(ct2)
              .md(sampleMd)
              .build();
          attrs.add(ct2Attribute);
        }

        boolean isGhp = outdoor.optBoolean("isGhp", false);
        Attribute isGhpAttribute = new Attribute.Builder()
            .name("isGhp")
            .type("Property")
            .value(isGhp)
            .md(sampleMd)
            .build();
        attrs.add(isGhpAttribute);
      }

      // relatedUnits
      if (ac.has("relatedUnits")) {
        JSONArray relatedArray = ac.getJSONArray("relatedUnits");
        List<String> relatedIds = new ArrayList<>();
        for (int i = 0; i < relatedArray.length(); i++) {
          JSONObject ru = relatedArray.getJSONObject(i);
          String relatedId = ru.optString("id");
          String indoorEntityId = "urn:ngsi-ld:DvmIndoor:" + indoorIdMappingTable().get(relatedId);
          relatedIds.add(indoorEntityId);
        }
        Attribute connetToAttribute = new Attribute.Builder()
            .name("connectsTo")
            .type("Relationship")
            .value(relatedIds)
            .build();
        attrs.add(connetToAttribute);
      }
    }
    Attribute registrationStatusAttribute = new Attribute.Builder()
        .name("registrationStatus")
        .type("Property")
        .value(registrationStatus)
        .md(sampleMd)
        .build();
    attrs.add(registrationStatusAttribute);

    Attribute representativeStatusAttribute = new Attribute.Builder()
        .name("representativeStatus")
        .type("Property")
        .value(representativeStatus)
        .md(sampleMd)
        .build();
    attrs.add(representativeStatusAttribute);

    Attribute nameAttribute = new Attribute.Builder()
        .name("name")
        .type("Property")
        .value(name)
        .build();
    attrs.add(nameAttribute);

    Attribute deviceIdAttribute = new Attribute.Builder()
        .name("deviceId")
        .type("Property")
        .value(id)
        .build();
    attrs.add(deviceIdAttribute);

    String indoorEntityId = outdoorIdMappingTable().get(id);
    EntityId entityId = new EntityId.Builder()
        .id(indoorEntityId)
        .type("DvmOutdoor")
        .provider("SSF")
        .build();

    Map<String, String> attrNames = new HashMap<>();
    for (Attribute attr : attrs) {
      if (!attr.getName().equals("name")) {
        attrNames.put(attr.getName(), "e8ight:" + attr.getName());
      }
    }
    return new Entity.Builder()
        .id(entityId)
        .attrNames(attrNames)
        .attrs(attrs)
        .context(this.context)
        .build();
  }

  private static Map<String, String> indoorIdMappingTable() {
    Map<String, String> deviceMap = new HashMap<>();

    // FS_F002_Facility_DVMS_ACS_EIAC[80] 그룹
    deviceMap.put("00:FF:0E:01:02:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[75]");
    deviceMap.put("00:FF:0E:02:03:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[76]");
    deviceMap.put("00:FF:0E:01:01:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[77]");
    deviceMap.put("00:FF:0E:02:01:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[78]");
    deviceMap.put("00:FF:0E:02:02:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[79]");
    deviceMap.put("00:FF:0E:02:00:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[80]");
    deviceMap.put("00:FF:0E:04:03:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[81]");
    deviceMap.put("00:FF:0E:04:02:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[82]");
    deviceMap.put("00:FF:0E:04:01:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[83]");
    deviceMap.put("00:FF:0E:03:00:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[84]");
    deviceMap.put("00:FF:0E:04:00:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[85]");
    deviceMap.put("00:FF:0E:03:03:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[89]");
    deviceMap.put("00:FF:0E:03:02:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[90]");
    deviceMap.put("00:FF:0E:03:01:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[91]");
    deviceMap.put("00:FF:0E:00:07:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[86]");
    deviceMap.put("00:FF:0E:00:00:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[87]");
    deviceMap.put("00:FF:0E:00:03:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[88]");
    deviceMap.put("00:FF:0E:00:02:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[73]");
    deviceMap.put("00:FF:0E:00:05:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[74]");
    deviceMap.put("00:FF:0E:00:01:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[93]");
    deviceMap.put("00:FF:0E:00:04:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[72]");
    deviceMap.put("00:FF:0E:00:06:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[70]");
    deviceMap.put("00:FF:0E:01:00:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[71]");
    deviceMap.put("00:FF:0E:00:08:01:STHP7090-438O-74", "FS_F002_Facility_DVMS_ACS_EIAC[92]");

    return deviceMap;
  }

  private static Map<String, String> outdoorIdMappingTable() {
    Map<String, String> deviceMap = new HashMap<>();

    return deviceMap;
  }


}