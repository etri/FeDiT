package kr.co.e8ight.ndxpro.translatorRunner.translator;

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

public class Dvm9F extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(Dvm9F.class);

  public Dvm9F(String context) {
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
            if (current == null) {
              continue;
            }
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

        double flowRate = outdoor.optDouble("flowRate");
        Attribute flowRateAttribute = new Attribute.Builder()
            .name("flowRate")
            .type("Property")
            .value(flowRate)
            .md(sampleMd)
            .build();
        attrs.add(flowRateAttribute);
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
    deviceMap.put("00:FF:0E:07:01:01:SDPE8274-292U-15", "PO3_B001_IDU[1]");
    deviceMap.put("00:FF:0E:03:02:01:SDPE8274-292U-15", "PO3_B001_IDU[2]");
    deviceMap.put("00:FF:0E:07:03:01:SDPE8274-292U-15", "PO3_B001_IDU[3]");
    deviceMap.put("00:FF:0E:08:01:01:SDPE8274-292U-15", "PO3_B001_IDU[4]");
    deviceMap.put("00:FF:0E:08:02:01:SDPE8274-292U-15", "PO3_B001_IDU[5]");
    deviceMap.put("00:FF:0E:0A:01:01:SDPE8274-292U-15", "PO3_B001_IDU[6]");
    deviceMap.put("00:FF:0E:06:01:01:SDPE8274-292U-15", "PO3_B001_IDU[7]");
    deviceMap.put("00:FF:0E:07:02:01:SDPE8274-292U-15", "PO3_B001_IDU[8]");
    deviceMap.put("00:FF:0E:09:01:01:SDPE8274-292U-15", "PO3_B001_IDU[9]");
    deviceMap.put("00:FF:0E:06:02:01:SDPE8274-292U-15", "PO3_F001_IDU[10]");
    deviceMap.put("00:FF:0E:09:02:01:SDPE8274-292U-15", "PO3_F001_IDU[11]");
    deviceMap.put("00:FF:0E:04:00:01:SDPE8274-292U-15", "PO3_F001_IDU[12]");
    deviceMap.put("00:FF:0E:05:03:01:SDPE8274-292U-15", "PO3_F001_IDU[13]");
    deviceMap.put("00:FF:0E:05:04:01:SDPE8274-292U-15", "PO3_F001_IDU[14]");
    deviceMap.put("00:FF:0E:05:05:01:SDPE8274-292U-15", "PO3_F001_IDU[15]");
    deviceMap.put("00:FF:0E:05:01:01:SDPE8274-292U-15", "PO3_F001_IDU[16]");
    deviceMap.put("00:FF:0E:05:02:01:SDPE8274-292U-15", "PO3_F001_IDU[17]");
    deviceMap.put("00:FF:0E:03:03:01:SDPE8274-292U-15", "PO3_F001_IDU[18]");
    deviceMap.put("00:FF:0D:09:01:01:SDPE8274-292U-15", "PO3_F001_IDU[19]");
    deviceMap.put("00:FF:0B:01:01:01:SDPE8274-292U-15", "PO3_F001_IDU[20]");
    deviceMap.put("00:FF:0E:0A:02:01:SDPE8274-292U-15", "PO3_F001_IDU[21]");
    deviceMap.put("00:FF:0D:09:02:01:SDPE8274-292U-15", "PO3_F002_IDU[22]");
    deviceMap.put("00:FF:0B:03:1A:01:SDPE8274-292U-15", "PO3_F002_IDU[23]");
    deviceMap.put("00:FF:0E:0A:03:01:SDPE8274-292U-15", "PO3_F002_IDU[24]");
    deviceMap.put("00:FF:0E:06:03:01:SDPE8274-292U-15", "PO3_F002_IDU[25]");
    deviceMap.put("00:FF:0B:01:02:01:SDPE8274-292U-15", "PO3_F002_IDU[26]");
    deviceMap.put("00:FF:0E:09:03:01:SDPE8274-292U-15", "PO3_F002_IDU[27]");
    deviceMap.put("00:FF:0E:03:04:01:SDPE8274-292U-15", "PO3_F002_IDU[28]");
    deviceMap.put("00:FF:0D:09:03:01:SDPE8274-292U-15", "PO3_F002_IDU[29]");
    deviceMap.put("00:FF:0B:02:06:01:SDPE8274-292U-15", "PO3_F002_IDU[30]");
    deviceMap.put("00:FF:0B:02:09:01:SDPE8274-292U-15", "PO3_F002_IDU[31]");
    deviceMap.put("00:FF:0B:02:0A:01:SDPE8274-292U-15", "PO3_F002_IDU[32]");
    deviceMap.put("00:FF:0B:03:01:01:SDPE8274-292U-15", "PO3_F002_IDU[33]");
    deviceMap.put("00:FF:0B:03:02:01:SDPE8274-292U-15", "PO3_F002_IDU[34]");
    deviceMap.put("00:FF:0B:03:03:01:SDPE8274-292U-15", "PO3_F002_IDU[35]");
    deviceMap.put("00:FF:0B:03:04:01:SDPE8274-292U-15", "PO3_F002_IDU[36]");
    deviceMap.put("00:FF:0B:03:05:01:SDPE8274-292U-15", "PO3_F002_IDU[37]");
    deviceMap.put("00:FF:0B:03:10:01:SDPE8274-292U-15", "PO3_F002_IDU[38]");
    deviceMap.put("00:FF:0B:03:11:01:SDPE8274-292U-15", "PO3_F002_IDU[39]");
    deviceMap.put("00:FF:0B:03:12:01:SDPE8274-292U-15", "PO3_F002_IDU[40]");
    deviceMap.put("00:FF:0B:03:18:01:SDPE8274-292U-15", "PO3_F002_IDU[41]");
    deviceMap.put("00:FF:0B:03:19:01:SDPE8274-292U-15", "PO3_F002_IDU[42]");
    deviceMap.put("00:FF:0B:03:14:01:SDPE8274-292U-15", "PO3_F002_IDU[43]");
    deviceMap.put("00:FF:0B:02:07:01:SDPE8274-292U-15", "PO3_F002_IDU[44]");
    deviceMap.put("00:FF:0B:02:08:01:SDPE8274-292U-15", "PO3_F002_IDU[45]");
    deviceMap.put("00:FF:0B:03:06:01:SDPE8274-292U-15", "PO3_F002_IDU[46]");
    deviceMap.put("00:FF:0B:03:07:01:SDPE8274-292U-15", "PO3_F002_IDU[47]");
    deviceMap.put("00:FF:0B:03:0F:01:SDPE8274-292U-15", "PO3_F002_IDU[48]");
    deviceMap.put("00:FF:0B:03:15:01:SDPE8274-292U-15", "PO3_F002_IDU[49]");
    deviceMap.put("00:FF:0B:03:16:01:SDPE8274-292U-15", "PO3_F002_IDU[50]");
    deviceMap.put("00:FF:0B:03:17:01:SDPE8274-292U-15", "PO3_F002_IDU[51]");
    deviceMap.put("00:FF:0B:03:08:01:SDPE8274-292U-15", "PO3_F002_IDU[52]");
    deviceMap.put("00:FF:0B:03:09:01:SDPE8274-292U-15", "PO3_F002_IDU[53]");
    deviceMap.put("00:FF:0B:03:13:01:SDPE8274-292U-15", "PO3_F002_IDU[54]");
    deviceMap.put("00:FF:0B:03:0A:01:SDPE8274-292U-15", "PO3_F002_IDU[55]");
    deviceMap.put("00:FF:0B:03:0B:01:SDPE8274-292U-15", "PO3_F002_IDU[56]");
    deviceMap.put("00:FF:0B:03:0C:01:SDPE8274-292U-15", "PO3_F002_IDU[57]");
    deviceMap.put("00:FF:0B:03:0D:01:SDPE8274-292U-15", "PO3_F002_IDU[58]");
    deviceMap.put("00:FF:0B:03:0E:01:SDPE8274-292U-15", "PO3_F002_IDU[59]");
    deviceMap.put("00:FF:0B:02:01:01:SDPE8274-292U-15", "PO3_F002_IDU[60]");
    deviceMap.put("00:FF:0B:02:02:01:SDPE8274-292U-15", "PO3_F002_IDU[61]");
    deviceMap.put("00:FF:0B:02:03:01:SDPE8274-292U-15", "PO3_F002_IDU[62]");
    deviceMap.put("00:FF:0B:02:04:01:SDPE8274-292U-15", "PO3_F002_IDU[63]");
    deviceMap.put("00:FF:0B:02:05:01:SDPE8274-292U-15", "PO3_F002_IDU[64]");
    deviceMap.put("00:FF:0E:01:01:01:SKGH7200-868O-41", "PO3_F003_IDU[65]");
    deviceMap.put("00:FF:0E:08:03:01:SDPE8274-292U-15", "PO3_F003_IDU[66]");
    deviceMap.put("00:FF:0C:04:05:01:SDPE8274-292U-15", "PO3_F003_IDU[67]");
    deviceMap.put("00:FF:0C:04:06:01:SDPE8274-292U-15", "PO3_F003_IDU[68]");
    deviceMap.put("00:FF:0C:05:01:01:SDPE8274-292U-15", "PO3_F003_IDU[69]");
    deviceMap.put("00:FF:0C:06:05:01:SDPE8274-292U-15", "PO3_F003_IDU[70]");
    deviceMap.put("00:FF:0D:02:01:01:SDPE8274-292U-15", "PO3_F003_IDU[71]");
    deviceMap.put("00:FF:0D:02:02:01:SDPE8274-292U-15", "PO3_F003_IDU[72]");
    deviceMap.put("00:FF:0D:02:03:01:SDPE8274-292U-15", "PO3_F003_IDU[73]");
    deviceMap.put("00:FF:0D:02:04:01:SDPE8274-292U-15", "PO3_F003_IDU[74]");
    deviceMap.put("00:FF:0D:02:05:01:SDPE8274-292U-15", "PO3_F003_IDU[75]");
    deviceMap.put("00:FF:0D:03:01:01:SDPE8274-292U-15", "PO3_F003_IDU[76]");
    deviceMap.put("00:FF:0D:03:02:01:SDPE8274-292U-15", "PO3_F003_IDU[77]");
    deviceMap.put("00:FF:0D:03:03:01:SDPE8274-292U-15", "PO3_F003_IDU[78]");
    deviceMap.put("00:FF:0D:03:04:01:SDPE8274-292U-15", "PO3_F003_IDU[79]");
    deviceMap.put("00:FF:0C:05:02:01:SDPE8274-292U-15", "PO3_F003_IDU[80]");
    deviceMap.put("00:FF:0D:03:05:01:SDPE8274-292U-15", "PO3_F003_IDU[81]");
    deviceMap.put("00:FF:0C:05:03:01:SDPE8274-292U-15", "PO3_F003_IDU[82]");
    deviceMap.put("00:FF:0C:05:04:01:SDPE8274-292U-15", "PO3_F003_IDU[83]");
    deviceMap.put("00:FF:0C:05:05:01:SDPE8274-292U-15", "PO3_F003_IDU[84]");
    deviceMap.put("00:FF:0C:06:00:01:SDPE8274-292U-15", "PO3_F003_IDU[85]");
    deviceMap.put("00:FF:0C:06:01:01:SDPE8274-292U-15", "PO3_F003_IDU[86]");
    deviceMap.put("00:FF:0C:06:02:01:SDPE8274-292U-15", "PO3_F003_IDU[87]");
    deviceMap.put("00:FF:0C:06:04:01:SDPE8274-292U-15", "PO3_F003_IDU[88]");
    deviceMap.put("00:FF:0C:04:01:01:SDPE8274-292U-15", "PO3_F003_IDU[89]");
    deviceMap.put("00:FF:0C:04:02:01:SDPE8274-292U-15", "PO3_F003_IDU[90]");
    deviceMap.put("00:FF:0C:04:03:01:SDPE8274-292U-15", "PO3_F003_IDU[91]");
    deviceMap.put("00:FF:0C:04:04:01:SDPE8274-292U-15", "PO3_F003_IDU[92]");
    deviceMap.put("00:FF:0E:04:01:01:SDPE8274-292U-15", "PO3_F003_IDU[93]");
    deviceMap.put("00:FF:0E:0A:04:01:SDPE8274-292U-15", "PO3_F003_IDU[94]");
    deviceMap.put("00:FF:0E:06:04:01:SDPE8274-292U-15", "PO3_F003_IDU[95]");
    deviceMap.put("00:FF:0B:01:03:01:SDPE8274-292U-15", "PO3_F003_IDU[96]");
    deviceMap.put("00:FF:0E:03:05:01:SDPE8274-292U-15", "PO3_F003_IDU[97]");
    deviceMap.put("00:FF:0D:09:04:01:SDPE8274-292U-15", "PO3_F003_IDU[98]");
    deviceMap.put("00:FF:0E:09:04:01:SDPE8274-292U-15", "PO3_F003_IDU[99]");
    deviceMap.put("00:FF:0E:01:02:01:SKGH7200-868O-41", "PO3_F004_IDU[100]");
    deviceMap.put("00:FF:0D:07:03:01:SDPE8274-292U-15", "PO3_F004_IDU[101]");
    deviceMap.put("00:FF:0D:07:04:01:SDPE8274-292U-15", "PO3_F004_IDU[102]");
    deviceMap.put("00:FF:0D:04:01:01:SDPE8274-292U-15", "PO3_F004_IDU[103]");
    deviceMap.put("00:FF:0D:04:02:01:SDPE8274-292U-15", "PO3_F004_IDU[104]");
    deviceMap.put("00:FF:0E:04:03:01:SDPE8274-292U-15", "PO3_F004_IDU[105]");
    deviceMap.put("00:FF:0E:0A:05:01:SDPE8274-292U-15", "PO3_F004_IDU[106]");
    deviceMap.put("00:FF:0E:06:05:01:SDPE8274-292U-15", "PO3_F004_IDU[107]");
    deviceMap.put("00:FF:0D:09:05:01:SDPE8274-292U-15", "PO3_F004_IDU[108]");
    deviceMap.put("00:FF:0E:09:05:01:SDPE8274-292U-15", "PO3_F004_IDU[109]");
    deviceMap.put("00:FF:0E:03:06:01:SDPE8274-292U-15", "PO3_F004_IDU[110]");
    deviceMap.put("00:FF:0E:02:01:01:SDPE8274-292U-15", "PO3_F004_IDU[111]");
    deviceMap.put("00:FF:0E:02:02:01:SDPE8274-292U-15", "PO3_F004_IDU[112]");
    deviceMap.put("00:FF:0E:02:03:01:SDPE8274-292U-15", "PO3_F004_IDU[113]");
    deviceMap.put("00:FF:0D:06:01:01:SDPE8274-292U-15", "PO3_F004_IDU[114]");
    deviceMap.put("00:FF:0D:06:02:01:SDPE8274-292U-15", "PO3_F004_IDU[115]");
    deviceMap.put("00:FF:0E:02:05:01:SDPE8274-292U-15", "PO3_F004_IDU[116]");
    deviceMap.put("00:FF:0E:01:02:01:SDPE8274-292U-15", "PO3_F004_IDU[117]");
    deviceMap.put("00:FF:0E:02:06:01:SDPE8274-292U-15", "PO3_F004_IDU[118]");
    deviceMap.put("00:FF:0E:01:03:01:SDPE8274-292U-15", "PO3_F004_IDU[119]");
    deviceMap.put("00:FF:0E:02:07:01:SDPE8274-292U-15", "PO3_F004_IDU[120]");
    deviceMap.put("00:FF:0E:02:08:01:SDPE8274-292U-15", "PO3_F004_IDU[121]");
    deviceMap.put("00:FF:0E:02:09:01:SDPE8274-292U-15", "PO3_F004_IDU[122]");
    deviceMap.put("00:FF:0E:02:0A:01:SDPE8274-292U-15", "PO3_F004_IDU[123]");
    deviceMap.put("00:FF:0E:02:04:01:SDPE8274-292U-15", "PO3_F004_IDU[124]");
    deviceMap.put("00:FF:0D:07:01:01:SDPE8274-292U-15", "PO3_F004_IDU[125]");
    deviceMap.put("00:FF:0D:07:02:01:SDPE8274-292U-15", "PO3_F004_IDU[126]");
    deviceMap.put("00:FF:0D:06:03:01:SDPE8274-292U-15", "PO3_F004_IDU[127]");
    deviceMap.put("00:FF:0D:06:04:01:SDPE8274-292U-15", "PO3_F004_IDU[128]");
    deviceMap.put("00:FF:0E:01:05:01:SDPE8274-292U-15", "PO3_F004_IDU[129]");
    deviceMap.put("00:FF:0E:01:06:01:SDPE8274-292U-15", "PO3_F004_IDU[130]");
    deviceMap.put("00:FF:0D:05:01:01:SDPE8274-292U-15", "PO3_F004_IDU[131]");
    deviceMap.put("00:FF:0D:05:02:01:SDPE8274-292U-15", "PO3_F004_IDU[132]");
    deviceMap.put("00:FF:0D:05:03:01:SDPE8274-292U-15", "PO3_F004_IDU[133]");
    deviceMap.put("00:FF:0D:05:04:01:SDPE8274-292U-15", "PO3_F004_IDU[134]");
    deviceMap.put("00:FF:0D:05:05:01:SDPE8274-292U-15", "PO3_F004_IDU[135]");
    deviceMap.put("00:FF:0D:05:06:01:SDPE8274-292U-15", "PO3_F004_IDU[136]");
    deviceMap.put("00:FF:0E:01:01:01:SDPE8274-292U-15", "PO3_F004_IDU[137]");
    deviceMap.put("00:FF:0E:01:04:01:SDPE8274-292U-15", "PO3_F004_IDU[138]");
    deviceMap.put("00:FF:0C:06:01:01:SJXX5740-839V-20", "PO3_F005_IDU[139]");
    deviceMap.put("00:FF:0E:03:01:01:SJXX5740-839V-20", "PO3_F005_IDU[140]");
    deviceMap.put("00:FF:0D:04:01:01:SJXX5740-839V-20", "PO3_F005_IDU[141]");
    deviceMap.put("00:FF:0E:01:01:01:SJXX5740-839V-20", "PO3_F005_IDU[142]");
    deviceMap.put("00:FF:0E:02:01:01:SJXX5740-839V-20", "PO3_F005_IDU[143]");
    deviceMap.put("00:FF:0E:04:01:01:SJXX5740-839V-20", "PO3_F005_IDU[144]");
    deviceMap.put("00:FF:0C:01:09:01:SJXX5740-839V-20", "PO3_F005_IDU[145]");
    deviceMap.put("00:FF:0C:01:0A:01:SJXX5740-839V-20", "PO3_F005_IDU[146]");
    deviceMap.put("00:FF:0C:05:00:01:SJXX5740-839V-20", "PO3_F005_IDU[147]");
    deviceMap.put("00:FF:0C:05:05:01:SJXX5740-839V-20", "PO3_F005_IDU[148]");
    deviceMap.put("00:FF:0C:05:02:01:SJXX5740-839V-20", "PO3_F005_IDU[149]");
    deviceMap.put("00:FF:0C:05:03:01:SJXX5740-839V-20", "PO3_F005_IDU[150]");
    deviceMap.put("00:FF:0C:01:01:01:SJXX5740-839V-20", "PO3_F005_IDU[151]");
    deviceMap.put("00:FF:0C:01:02:01:SJXX5740-839V-20", "PO3_F005_IDU[152]");
    deviceMap.put("00:FF:0C:05:01:01:SJXX5740-839V-20", "PO3_F005_IDU[153]");
    deviceMap.put("00:FF:0C:01:03:01:SJXX5740-839V-20", "PO3_F005_IDU[154]");
    deviceMap.put("00:FF:0C:01:04:01:SJXX5740-839V-20", "PO3_F005_IDU[155]");
    deviceMap.put("00:FF:0C:01:05:01:SJXX5740-839V-20", "PO3_F005_IDU[156]");
    deviceMap.put("00:FF:0C:01:06:01:SJXX5740-839V-20", "PO3_F005_IDU[157]");
    deviceMap.put("00:FF:0C:01:07:01:SJXX5740-839V-20", "PO3_F005_IDU[158]");
    deviceMap.put("00:FF:0C:01:08:01:SJXX5740-839V-20", "PO3_F005_IDU[159]");
    deviceMap.put("00:FF:0C:05:09:01:SJXX5740-839V-20", "PO3_F005_IDU[160]");
    deviceMap.put("00:FF:0C:05:0A:01:SJXX5740-839V-20", "PO3_F005_IDU[161]");
    deviceMap.put("00:FF:0C:05:0B:01:SJXX5740-839V-20", "PO3_F005_IDU[162]");
    deviceMap.put("00:FF:0C:05:06:01:SJXX5740-839V-20", "PO3_F005_IDU[163]");
    deviceMap.put("00:FF:0C:05:07:01:SJXX5740-839V-20", "PO3_F005_IDU[164]");
    deviceMap.put("00:FF:0C:05:08:01:SJXX5740-839V-20", "PO3_F005_IDU[165]");
    deviceMap.put("00:FF:0C:01:0B:01:SJXX5740-839V-20", "PO3_F005_IDU[166]");
    deviceMap.put("00:FF:0B:06:05:01:SKGH7200-868O-41", "PO3_F005_IDU[167]");
    deviceMap.put("00:FF:0E:01:03:01:SKGH7200-868O-41", "PO3_F005_IDU[168]");
    deviceMap.put("00:FF:0B:04:01:01:SKGH7200-868O-41", "PO3_F005_IDU[169]");
    deviceMap.put("00:FF:0B:06:01:01:SKGH7200-868O-41", "PO3_F005_IDU[170]");
    deviceMap.put("00:FF:0B:06:02:01:SKGH7200-868O-41", "PO3_F005_IDU[171]");
    deviceMap.put("00:FF:0D:01:03:01:SKGH7200-868O-41", "PO3_F005_IDU[172]");
    deviceMap.put("00:FF:0D:01:04:01:SKGH7200-868O-41", "PO3_F005_IDU[173]");
    deviceMap.put("00:FF:0D:01:05:01:SKGH7200-868O-41", "PO3_F005_IDU[174]");
    deviceMap.put("00:FF:0D:01:06:01:SKGH7200-868O-41", "PO3_F005_IDU[175]");
    deviceMap.put("00:FF:0B:06:06:01:SKGH7200-868O-41", "PO3_F005_IDU[176]");
    deviceMap.put("00:FF:0E:03:04:01:SKGH7200-868O-41", "PO3_F005_IDU[177]");
    deviceMap.put("00:FF:0C:01:06:01:SKGH7200-868O-41", "PO3_F005_IDU[178]");
    deviceMap.put("00:FF:0C:01:01:01:SKGH7200-868O-41", "PO3_F005_IDU[179]");
    deviceMap.put("00:FF:0E:03:02:01:SKGH7200-868O-41", "PO3_F005_IDU[180]");
    deviceMap.put("00:FF:0C:01:07:01:SKGH7200-868O-41", "PO3_F005_IDU[181]");
    deviceMap.put("00:FF:0B:06:04:01:SKGH7200-868O-41", "PO3_F005_IDU[182]");
    deviceMap.put("00:FF:0C:01:04:01:SKGH7200-868O-41", "PO3_F005_IDU[183]");
    deviceMap.put("00:FF:0E:03:06:01:SKGH7200-868O-41", "PO3_F005_IDU[184]");
    deviceMap.put("00:FF:0C:01:05:01:SKGH7200-868O-41", "PO3_F005_IDU[185]");
    deviceMap.put("00:FF:0E:03:00:01:SKGH7200-868O-41", "PO3_F005_IDU[186]");
    deviceMap.put("00:FF:0E:03:01:01:SKGH7200-868O-41", "PO3_F005_IDU[187]");
    deviceMap.put("00:FF:0C:01:02:01:SKGH7200-868O-41", "PO3_F005_IDU[188]");
    deviceMap.put("00:FF:0C:01:03:01:SKGH7200-868O-41", "PO3_F005_IDU[189]");
    deviceMap.put("00:FF:0E:03:05:01:SKGH7200-868O-41", "PO3_F005_IDU[190]");
    deviceMap.put("00:FF:0D:01:01:01:SKGH7200-868O-41", "PO3_F005_IDU[191]");
    deviceMap.put("00:FF:0D:01:02:01:SKGH7200-868O-41", "PO3_F005_IDU[192]");
    deviceMap.put("00:FF:0B:06:03:01:SKGH7200-868O-41", "PO3_F005_IDU[193]");
    deviceMap.put("00:FF:0B:04:01:01:SDPE8274-292U-15", "PO3_F005_IDU[194]");
    deviceMap.put("00:FF:0C:01:01:01:SDPE8274-292U-15", "PO3_F005_IDU[195]");
    deviceMap.put("00:FF:0C:01:02:01:SDPE8274-292U-15", "PO3_F005_IDU[196]");
    deviceMap.put("00:FF:0B:04:02:01:SDPE8274-292U-15", "PO3_F005_IDU[197]");
    deviceMap.put("00:FF:0B:04:05:01:SDPE8274-292U-15", "PO3_F005_IDU[198]");
    deviceMap.put("00:FF:0B:04:06:01:SDPE8274-292U-15", "PO3_F005_IDU[199]");
    deviceMap.put("00:FF:0B:04:03:01:SDPE8274-292U-15", "PO3_F005_IDU[200]");
    deviceMap.put("00:FF:0B:04:04:01:SDPE8274-292U-15", "PO3_F005_IDU[201]");
    deviceMap.put("00:FF:0C:01:03:01:SDPE8274-292U-15", "PO3_F005_IDU[202]");
    deviceMap.put("00:FF:0C:01:04:01:SDPE8274-292U-15", "PO3_F005_IDU[203]");
    deviceMap.put("00:FF:0C:06:02:01:SJXX5740-839V-20", "PO3_F006_IDU[204]");
    deviceMap.put("00:FF:0E:03:02:01:SJXX5740-839V-20", "PO3_F006_IDU[205]");
    deviceMap.put("00:FF:0D:04:02:01:SJXX5740-839V-20", "PO3_F006_IDU[206]");
    deviceMap.put("00:FF:0E:01:00:01:SJXX5740-839V-20", "PO3_F006_IDU[207]");
    deviceMap.put("00:FF:0E:02:02:01:SJXX5740-839V-20", "PO3_F006_IDU[208]");
    deviceMap.put("00:FF:0E:04:02:01:SJXX5740-839V-20", "PO3_F006_IDU[209]");
    deviceMap.put("00:FF:0D:03:14:01:SJXX5740-839V-20", "PO3_F006_IDU[210]");
    deviceMap.put("00:FF:0C:02:01:01:SJXX5740-839V-20", "PO3_F006_IDU[211]");
    deviceMap.put("00:FF:0C:02:02:01:SJXX5740-839V-20", "PO3_F006_IDU[212]");
    deviceMap.put("00:FF:0D:03:0A:01:SJXX5740-839V-20", "PO3_F006_IDU[213]");
    deviceMap.put("00:FF:0D:03:0B:01:SJXX5740-839V-20", "PO3_F006_IDU[214]");
    deviceMap.put("00:FF:0D:03:08:01:SJXX5740-839V-20", "PO3_F006_IDU[215]");
    deviceMap.put("00:FF:0D:03:09:01:SJXX5740-839V-20", "PO3_F006_IDU[216]");
    deviceMap.put("00:FF:0C:02:0A:01:SJXX5740-839V-20", "PO3_F006_IDU[217]");
    deviceMap.put("00:FF:0C:02:0B:01:SJXX5740-839V-20", "PO3_F006_IDU[218]");
    deviceMap.put("00:FF:0D:03:07:01:SJXX5740-839V-20", "PO3_F006_IDU[219]");
    deviceMap.put("00:FF:0C:02:09:01:SJXX5740-839V-20", "PO3_F006_IDU[220]");
    deviceMap.put("00:FF:0C:02:08:01:SJXX5740-839V-20", "PO3_F006_IDU[221]");
    deviceMap.put("00:FF:0C:02:04:01:SJXX5740-839V-20", "PO3_F006_IDU[222]");
    deviceMap.put("00:FF:0C:02:05:01:SJXX5740-839V-20", "PO3_F006_IDU[223]");
    deviceMap.put("00:FF:0C:02:06:01:SJXX5740-839V-20", "PO3_F006_IDU[224]");
    deviceMap.put("00:FF:0C:02:07:01:SJXX5740-839V-20", "PO3_F006_IDU[225]");
    deviceMap.put("00:FF:0D:03:01:01:SJXX5740-839V-20", "PO3_F006_IDU[226]");
    deviceMap.put("00:FF:0D:03:02:01:SJXX5740-839V-20", "PO3_F006_IDU[227]");
    deviceMap.put("00:FF:0D:03:03:01:SJXX5740-839V-20", "PO3_F006_IDU[228]");
    deviceMap.put("00:FF:0D:03:10:01:SJXX5740-839V-20", "PO3_F006_IDU[229]");
    deviceMap.put("00:FF:0D:03:11:01:SJXX5740-839V-20", "PO3_F006_IDU[230]");
    deviceMap.put("00:FF:0D:03:12:01:SJXX5740-839V-20", "PO3_F006_IDU[231]");
    deviceMap.put("00:FF:0D:03:13:01:SJXX5740-839V-20", "PO3_F006_IDU[232]");
    deviceMap.put("00:FF:0E:04:03:01:SJXX5740-839V-20", "PO3_F006_IDU[233]");
    deviceMap.put("00:FF:0D:03:04:01:SJXX5740-839V-20", "PO3_F006_IDU[234]");
    deviceMap.put("00:FF:0D:03:05:01:SJXX5740-839V-20", "PO3_F006_IDU[235]");
    deviceMap.put("00:FF:0D:03:06:01:SJXX5740-839V-20", "PO3_F006_IDU[236]");
    deviceMap.put("00:FF:0D:03:0C:01:SJXX5740-839V-20", "PO3_F006_IDU[237]");
    deviceMap.put("00:FF:0D:03:0D:01:SJXX5740-839V-20", "PO3_F006_IDU[238]");
    deviceMap.put("00:FF:0D:03:0E:01:SJXX5740-839V-20", "PO3_F006_IDU[239]");
    deviceMap.put("00:FF:0D:03:0F:01:SJXX5740-839V-20", "PO3_F006_IDU[240]");
    deviceMap.put("00:FF:0C:02:03:01:SJXX5740-839V-20", "PO3_F006_IDU[241]");
    deviceMap.put("00:FF:0B:05:05:01:SKGH7200-868O-41", "PO3_F006_IDU[242]");
    deviceMap.put("00:FF:0E:01:04:01:SKGH7200-868O-41", "PO3_F006_IDU[243]");
    deviceMap.put("00:FF:0B:04:02:01:SKGH7200-868O-41", "PO3_F006_IDU[244]");
    deviceMap.put("00:FF:0B:05:01:01:SKGH7200-868O-41", "PO3_F006_IDU[245]");
    deviceMap.put("00:FF:0B:05:02:01:SKGH7200-868O-41", "PO3_F006_IDU[246]");
    deviceMap.put("00:FF:0E:02:02:01:SKGH7200-868O-41", "PO3_F006_IDU[247]");
    deviceMap.put("00:FF:0E:02:03:01:SKGH7200-868O-41", "PO3_F006_IDU[248]");
    deviceMap.put("00:FF:0E:02:04:01:SKGH7200-868O-41", "PO3_F006_IDU[249]");
    deviceMap.put("00:FF:0E:02:05:01:SKGH7200-868O-41", "PO3_F006_IDU[250]");
    deviceMap.put("00:FF:0B:07:01:01:SKGH7200-868O-41", "PO3_F006_IDU[251]");
    deviceMap.put("00:FF:0B:07:02:01:SKGH7200-868O-41", "PO3_F006_IDU[252]");
    deviceMap.put("00:FF:0C:02:03:01:SKGH7200-868O-41", "PO3_F006_IDU[253]");
    deviceMap.put("00:FF:0C:02:04:01:SKGH7200-868O-41", "PO3_F006_IDU[254]");
    deviceMap.put("00:FF:0B:05:06:01:SKGH7200-868O-41", "PO3_F006_IDU[255]");
    deviceMap.put("00:FF:0C:02:05:01:SKGH7200-868O-41", "PO3_F006_IDU[256]");
    deviceMap.put("00:FF:0B:05:04:01:SKGH7200-868O-41", "PO3_F006_IDU[257]");
    deviceMap.put("00:FF:0C:02:07:01:SKGH7200-868O-41", "PO3_F006_IDU[258]");
    deviceMap.put("00:FF:0C:02:08:01:SKGH7200-868O-41", "PO3_F006_IDU[259]");
    deviceMap.put("00:FF:0C:02:01:01:SKGH7200-868O-41", "PO3_F006_IDU[260]");
    deviceMap.put("00:FF:0C:02:02:01:SKGH7200-868O-41", "PO3_F006_IDU[261]");
    deviceMap.put("00:FF:0B:07:03:01:SKGH7200-868O-41", "PO3_F006_IDU[262]");
    deviceMap.put("00:FF:0B:07:04:01:SKGH7200-868O-41", "PO3_F006_IDU[263]");
    deviceMap.put("00:FF:0E:02:01:01:SKGH7200-868O-41", "PO3_F006_IDU[264]");
    deviceMap.put("00:FF:0B:05:03:01:SKGH7200-868O-41", "PO3_F006_IDU[265]");
    deviceMap.put("00:FF:0C:02:01:01:SDPE8274-292U-15", "PO3_F006_IDU[266]");
    deviceMap.put("00:FF:0C:02:02:01:SDPE8274-292U-15", "PO3_F006_IDU[267]");
    deviceMap.put("00:FF:0B:05:01:01:SDPE8274-292U-15", "PO3_F006_IDU[268]");
    deviceMap.put("00:FF:0B:05:02:01:SDPE8274-292U-15", "PO3_F006_IDU[269]");
    deviceMap.put("00:FF:0B:05:05:01:SDPE8274-292U-15", "PO3_F006_IDU[270]");
    deviceMap.put("00:FF:0B:05:06:01:SDPE8274-292U-15", "PO3_F006_IDU[271]");
    deviceMap.put("00:FF:0C:02:04:01:SDPE8274-292U-15", "PO3_F006_IDU[272]");
    deviceMap.put("00:FF:0B:05:03:01:SDPE8274-292U-15", "PO3_F006_IDU[273]");
    deviceMap.put("00:FF:0B:05:04:01:SDPE8274-292U-15", "PO3_F006_IDU[274]");
    deviceMap.put("00:FF:0C:02:03:01:SDPE8274-292U-15", "PO3_F006_IDU[275]");
    deviceMap.put("00:FF:0C:06:03:01:SJXX5740-839V-20", "PO3_F007_IDU[276]");
    deviceMap.put("00:FF:0E:03:03:01:SJXX5740-839V-20", "PO3_F007_IDU[277]");
    deviceMap.put("00:FF:0D:04:03:01:SJXX5740-839V-20", "PO3_F007_IDU[278]");
    deviceMap.put("00:FF:0E:01:05:01:SJXX5740-839V-20", "PO3_F007_IDU[279]");
    deviceMap.put("00:FF:0E:02:03:01:SJXX5740-839V-20", "PO3_F007_IDU[280]");
    deviceMap.put("00:FF:0E:04:04:01:SJXX5740-839V-20", "PO3_F007_IDU[281]");
    deviceMap.put("00:FF:0B:01:02:01:SJXX5740-839V-20", "PO3_F007_IDU[282]");
    deviceMap.put("00:FF:0B:03:05:01:SKGH7200-868O-41", "PO3_F007_IDU[283]");
    deviceMap.put("00:FF:0E:01:05:01:SKGH7200-868O-41", "PO3_F007_IDU[284]");
    deviceMap.put("00:FF:0B:04:03:01:SKGH7200-868O-41", "PO3_F007_IDU[285]");
    deviceMap.put("00:FF:0B:03:01:01:SKGH7200-868O-41", "PO3_F007_IDU[286]");
    deviceMap.put("00:FF:0B:03:02:01:SKGH7200-868O-41", "PO3_F007_IDU[287]");
    deviceMap.put("00:FF:0D:02:01:01:SKGH7200-868O-41", "PO3_F007_IDU[288]");
    deviceMap.put("00:FF:0D:02:02:01:SKGH7200-868O-41", "PO3_F007_IDU[289]");
    deviceMap.put("00:FF:0D:02:03:01:SKGH7200-868O-41", "PO3_F007_IDU[290]");
    deviceMap.put("00:FF:0D:02:05:01:SKGH7200-868O-41", "PO3_F007_IDU[291]");
    deviceMap.put("00:FF:0B:02:01:01:SKGH7200-868O-41", "PO3_F007_IDU[292]");
    deviceMap.put("00:FF:0B:02:02:01:SKGH7200-868O-41", "PO3_F007_IDU[293]");
    deviceMap.put("00:FF:0C:03:06:01:SKGH7200-868O-41", "PO3_F007_IDU[294]");
    deviceMap.put("00:FF:0C:03:03:01:SKGH7200-868O-41", "PO3_F007_IDU[295]");
    deviceMap.put("00:FF:0B:03:06:01:SKGH7200-868O-41", "PO3_F007_IDU[296]");
    deviceMap.put("00:FF:0C:03:07:01:SKGH7200-868O-41", "PO3_F007_IDU[297]");
    deviceMap.put("00:FF:0B:03:04:01:SKGH7200-868O-41", "PO3_F007_IDU[298]");
    deviceMap.put("00:FF:0C:03:04:01:SKGH7200-868O-41", "PO3_F007_IDU[299]");
    deviceMap.put("00:FF:0C:03:05:01:SKGH7200-868O-41", "PO3_F007_IDU[300]");
    deviceMap.put("00:FF:0C:03:01:01:SKGH7200-868O-41", "PO3_F007_IDU[301]");
    deviceMap.put("00:FF:0C:03:02:01:SKGH7200-868O-41", "PO3_F007_IDU[302]");
    deviceMap.put("00:FF:0B:02:03:01:SKGH7200-868O-41", "PO3_F007_IDU[303]");
    deviceMap.put("00:FF:0B:02:04:01:SKGH7200-868O-41", "PO3_F007_IDU[304]");
    deviceMap.put("00:FF:0D:02:00:01:SKGH7200-868O-41", "PO3_F007_IDU[305]");
    deviceMap.put("00:FF:0B:03:03:01:SKGH7200-868O-41", "PO3_F007_IDU[306]");
    deviceMap.put("00:FF:0B:06:02:01:SDPE8274-292U-15", "PO3_F007_IDU[307]");
    deviceMap.put("00:FF:0B:06:05:01:SDPE8274-292U-15", "PO3_F007_IDU[308]");
    deviceMap.put("00:FF:0B:06:06:01:SDPE8274-292U-15", "PO3_F007_IDU[309]");
    deviceMap.put("00:FF:0C:03:01:01:SDPE8274-292U-15", "PO3_F007_IDU[310]");
    deviceMap.put("00:FF:0C:03:02:01:SDPE8274-292U-15", "PO3_F007_IDU[311]");
    deviceMap.put("00:FF:0B:06:01:01:SDPE8274-292U-15", "PO3_F007_IDU[312]");
    deviceMap.put("00:FF:0C:03:03:01:SDPE8274-292U-15", "PO3_F007_IDU[313]");
    deviceMap.put("00:FF:0C:03:04:01:SDPE8274-292U-15", "PO3_F007_IDU[314]");
    deviceMap.put("00:FF:0B:06:03:01:SDPE8274-292U-15", "PO3_F007_IDU[315]");
    deviceMap.put("00:FF:0B:06:04:01:SDPE8274-292U-15", "PO3_F007_IDU[316]");
    deviceMap.put("00:FF:0C:06:04:01:SJXX5740-839V-20", "PO3_F008_IDU[317]");
    deviceMap.put("00:FF:0D:02:0E:01:SJXX5740-839V-20", "PO3_F008_IDU[318]");
    deviceMap.put("00:FF:0D:02:0B:01:SJXX5740-839V-20", "PO3_F008_IDU[319]");
    deviceMap.put("00:FF:0D:02:0D:01:SJXX5740-839V-20", "PO3_F008_IDU[320]");
    deviceMap.put("00:FF:0D:02:0A:01:SJXX5740-839V-20", "PO3_F008_IDU[321]");
    deviceMap.put("00:FF:0D:02:11:01:SJXX5740-839V-20", "PO3_F008_IDU[322]");
    deviceMap.put("00:FF:0C:04:09:01:SJXX5740-839V-20", "PO3_F008_IDU[323]");
    deviceMap.put("00:FF:0C:04:0A:01:SJXX5740-839V-20", "PO3_F008_IDU[324]");
    deviceMap.put("00:FF:0D:02:01:01:SJXX5740-839V-20", "PO3_F008_IDU[325]");
    deviceMap.put("00:FF:0D:02:02:01:SJXX5740-839V-20", "PO3_F008_IDU[326]");
    deviceMap.put("00:FF:0D:02:12:01:SJXX5740-839V-20", "PO3_F008_IDU[327]");
    deviceMap.put("00:FF:0D:02:13:01:SJXX5740-839V-20", "PO3_F008_IDU[328]");
    deviceMap.put("00:FF:0C:04:07:01:SJXX5740-839V-20", "PO3_F008_IDU[329]");
    deviceMap.put("00:FF:0C:04:08:01:SJXX5740-839V-20", "PO3_F008_IDU[330]");
    deviceMap.put("00:FF:0D:02:0C:01:SJXX5740-839V-20", "PO3_F008_IDU[331]");
    deviceMap.put("00:FF:0D:02:14:01:SJXX5740-839V-20", "PO3_F008_IDU[332]");
    deviceMap.put("00:FF:0D:02:06:01:SJXX5740-839V-20", "PO3_F008_IDU[333]");
    deviceMap.put("00:FF:0D:02:0F:01:SJXX5740-839V-20", "PO3_F008_IDU[334]");
    deviceMap.put("00:FF:0C:04:03:01:SJXX5740-839V-20", "PO3_F008_IDU[335]");
    deviceMap.put("00:FF:0C:04:04:01:SJXX5740-839V-20", "PO3_F008_IDU[336]");
    deviceMap.put("00:FF:0C:04:01:01:SJXX5740-839V-20", "PO3_F008_IDU[337]");
    deviceMap.put("00:FF:0C:04:05:01:SJXX5740-839V-20", "PO3_F008_IDU[338]");
    deviceMap.put("00:FF:0D:02:03:01:SJXX5740-839V-20", "PO3_F008_IDU[339]");
    deviceMap.put("00:FF:0D:02:04:01:SJXX5740-839V-20", "PO3_F008_IDU[340]");
    deviceMap.put("00:FF:0D:02:05:01:SJXX5740-839V-20", "PO3_F008_IDU[341]");
    deviceMap.put("00:FF:0D:02:07:01:SJXX5740-839V-20", "PO3_F008_IDU[342]");
    deviceMap.put("00:FF:0D:02:08:01:SJXX5740-839V-20", "PO3_F008_IDU[343]");
    deviceMap.put("00:FF:0D:02:09:01:SJXX5740-839V-20", "PO3_F008_IDU[344]");
    deviceMap.put("00:FF:0C:04:06:01:SJXX5740-839V-20", "PO3_F008_IDU[345]");
    deviceMap.put("00:FF:0D:02:10:01:SJXX5740-839V-20", "PO3_F008_IDU[346]");
    deviceMap.put("00:FF:0C:04:02:01:SJXX5740-839V-20", "PO3_F008_IDU[347]");
    deviceMap.put("00:FF:0C:04:0B:01:SJXX5740-839V-20", "PO3_F008_IDU[348]");
    deviceMap.put("00:FF:0B:01:05:01:SKGH7200-868O-41", "PO3_F008_IDU[349]");
    deviceMap.put("00:FF:0E:01:06:01:SKGH7200-868O-41", "PO3_F008_IDU[350]");
    deviceMap.put("00:FF:0B:04:04:01:SKGH7200-868O-41", "PO3_F008_IDU[351]");
    deviceMap.put("00:FF:0C:04:08:01:SKGH7200-868O-41", "PO3_F008_IDU[352]");
    deviceMap.put("00:FF:0C:04:09:01:SKGH7200-868O-41", "PO3_F008_IDU[353]");
    deviceMap.put("00:FF:0B:01:01:01:SKGH7200-868O-41", "PO3_F008_IDU[354]");
    deviceMap.put("00:FF:0B:01:02:01:SKGH7200-868O-41", "PO3_F008_IDU[355]");
    deviceMap.put("00:FF:0C:04:01:01:SKGH7200-868O-41", "PO3_F008_IDU[356]");
    deviceMap.put("00:FF:0C:04:02:01:SKGH7200-868O-41", "PO3_F008_IDU[357]");
    deviceMap.put("00:FF:0B:01:06:01:SKGH7200-868O-41", "PO3_F008_IDU[358]");
    deviceMap.put("00:FF:0C:05:03:01:SKGH7200-868O-41", "PO3_F008_IDU[359]");
    deviceMap.put("00:FF:0C:05:05:01:SKGH7200-868O-41", "PO3_F008_IDU[360]");
    deviceMap.put("00:FF:0C:04:03:01:SKGH7200-868O-41", "PO3_F008_IDU[361]");
    deviceMap.put("00:FF:0C:05:04:01:SKGH7200-868O-41", "PO3_F008_IDU[362]");
    deviceMap.put("00:FF:0B:01:04:01:SKGH7200-868O-41", "PO3_F008_IDU[363]");
    deviceMap.put("00:FF:0C:05:01:01:SKGH7200-868O-41", "PO3_F008_IDU[364]");
    deviceMap.put("00:FF:0C:05:02:01:SKGH7200-868O-41", "PO3_F008_IDU[365]");
    deviceMap.put("00:FF:0C:05:06:01:SKGH7200-868O-41", "PO3_F008_IDU[366]");
    deviceMap.put("00:FF:0C:05:07:01:SKGH7200-868O-41", "PO3_F008_IDU[367]");
    deviceMap.put("00:FF:0C:04:04:01:SKGH7200-868O-41", "PO3_F008_IDU[368]");
    deviceMap.put("00:FF:0C:04:05:01:SKGH7200-868O-41", "PO3_F008_IDU[369]");
    deviceMap.put("00:FF:0C:04:06:01:SKGH7200-868O-41", "PO3_F008_IDU[370]");
    deviceMap.put("00:FF:0C:04:07:01:SKGH7200-868O-41", "PO3_F008_IDU[371]");
    deviceMap.put("00:FF:0B:01:03:01:SKGH7200-868O-41", "PO3_F008_IDU[372]");
    return deviceMap;
  }

  private static Map<String, String> outdoorIdMappingTable() {
    Map<String, String> deviceMap = new HashMap<>();

    deviceMap.put("00:FF:0E:05:00:02:SDPE8274-292U-15", "PO3_F004_ODU[1]");
    deviceMap.put("00:FF:0B:01:00:02:SDPE8274-292U-15", "PO3_F004_ODU[2]");
    deviceMap.put("00:FF:0D:09:00:02:SDPE8274-292U-15", "PO3_F004_ODU[3]");
    deviceMap.put("00:FF:0E:04:00:02:SDPE8274-292U-15", "PO3_F004_ODU[4]");
    deviceMap.put("00:FF:0B:02:00:02:SDPE8274-292U-15", "PO3_F004_ODU[5]");
    deviceMap.put("00:FF:0B:03:00:02:SDPE8274-292U-15", "PO3_F004_ODU[6]");
    deviceMap.put("00:FF:0D:03:00:02:SDPE8274-292U-15", "PO3_F004_ODU[7]");
    deviceMap.put("00:FF:0C:05:00:02:SDPE8274-292U-15", "PO3_F004_ODU[8]");
    deviceMap.put("00:FF:0D:02:00:02:SDPE8274-292U-15", "PO3_F004_ODU[10]");
    deviceMap.put("00:FF:0C:04:00:02:SDPE8274-292U-15", "PO3_F004_ODU[11]");
    deviceMap.put("00:FF:0E:02:00:02:SDPE8274-292U-15", "PO3_F004_ODU[12]");
    deviceMap.put("00:FF:0D:04:00:02:SDPE8274-292U-15", "PO3_F004_ODU[13]");
    deviceMap.put("00:FF:0D:07:00:02:SDPE8274-292U-15", "PO3_F004_ODU[14]");
    deviceMap.put("00:FF:0D:06:00:02:SDPE8274-292U-15", "PO3_F004_ODU[15]");
    deviceMap.put("00:FF:0D:05:00:02:SDPE8274-292U-15", "PO3_F004_ODU[16]");
    deviceMap.put("00:FF:0E:01:00:02:SDPE8274-292U-15", "PO3_F004_ODU[17]");
    deviceMap.put("00:FF:0D:08:00:02:SDPE8274-292U-15", "PO3_F004_ODU[18]");
    deviceMap.put("00:FF:0E:08:00:02:SDPE8274-292U-15", "PO3_F004_ODU[19]");
    deviceMap.put("00:FF:0B:04:00:02:SDPE8274-292U-15", "PO3_F004_ODU[20]");
    deviceMap.put("00:FF:0C:01:00:02:SDPE8274-292U-15", "PO3_F004_ODU[21]");
    deviceMap.put("00:FF:0B:05:00:02:SDPE8274-292U-15", "PO3_F004_ODU[22]");
    deviceMap.put("00:FF:0C:02:00:02:SDPE8274-292U-15", "PO3_F004_ODU[23]");
    deviceMap.put("00:FF:0B:06:00:02:SDPE8274-292U-15", "PO3_F004_ODU[24]");
    deviceMap.put("00:FF:0C:03:00:02:SDPE8274-292U-15", "PO3_F004_ODU[25]");
    deviceMap.put("00:FF:0E:07:00:02:SDPE8274-292U-15", "PO3_F004_ODU[26]");
    deviceMap.put("00:FF:0E:06:00:02:SDPE8274-292U-15", "PO3_F004_ODU[27]");
    deviceMap.put("00:FF:0E:0A:00:02:SDPE8274-292U-15", "PO3_F004_ODU[28]");
    deviceMap.put("00:FF:0E:03:00:02:SDPE8274-292U-15", "PO3_F004_ODU[29]");
    deviceMap.put("00:FF:0E:09:00:02:SDPE8274-292U-15", "PO3_F004_ODU[30]");
    deviceMap.put("00:FF:0E:01:00:02:SJXX5740-839V-20", "PO3_F008_ODU[31]");
    deviceMap.put("00:FF:0E:02:00:02:SJXX5740-839V-20", "PO3_F009_ODU[32]");
    deviceMap.put("00:FF:0E:03:00:02:SJXX5740-839V-20", "PO3_F009_ODU[33]");
    deviceMap.put("00:FF:0D:04:00:02:SJXX5740-839V-20", "PO3_F009_ODU[34]");
    deviceMap.put("00:FF:0C:06:00:02:SJXX5740-839V-20", "PO3_F009_ODU[35]");
    deviceMap.put("00:FF:0C:01:00:02:SJXX5740-839V-20", "PO3_F009_ODU[36]");
    deviceMap.put("00:FF:0C:05:00:02:SJXX5740-839V-20", "PO3_F009_ODU[37]");
    deviceMap.put("00:FF:0D:03:00:02:SJXX5740-839V-20", "PO3_F009_ODU[38]");
    deviceMap.put("00:FF:0C:02:00:02:SJXX5740-839V-20", "PO3_F009_ODU[39]");
    deviceMap.put("00:FF:0C:03:00:02:SJXX5740-839V-20", "PO3_F009_ODU[40]");
    deviceMap.put("00:FF:0D:01:00:02:SJXX5740-839V-20", "PO3_F009_ODU[41]");
    deviceMap.put("00:FF:0D:02:00:02:SJXX5740-839V-20", "PO3_F009_ODU[42]");
    deviceMap.put("00:FF:0C:04:00:02:SJXX5740-839V-20", "PO3_F009_ODU[43]");
    deviceMap.put("00:FF:0B:04:00:02:SKGH7200-868O-41", "PO3_F009_ODU[44]");
    deviceMap.put("00:FF:0D:03:00:02:SKGH7200-868O-41", "PO3_F009_ODU[45]");
    deviceMap.put("00:FF:0E:01:00:02:SKGH7200-868O-41", "PO3_F009_ODU[46]");
    deviceMap.put("00:FF:0C:01:00:02:SKGH7200-868O-41", "PO3_F009_ODU[47]");
    deviceMap.put("00:FF:0B:06:00:02:SKGH7200-868O-41", "PO3_F009_ODU[48]");
    deviceMap.put("00:FF:0E:03:00:02:SKGH7200-868O-41", "PO3_F009_ODU[49]");
    deviceMap.put("00:FF:0D:01:00:02:SKGH7200-868O-41", "PO3_F009_ODU[50]");
    deviceMap.put("00:FF:0B:07:00:02:SKGH7200-868O-41", "PO3_F009_ODU[51]");
    deviceMap.put("00:FF:0C:02:00:02:SKGH7200-868O-41", "PO3_F009_ODU[52]");
    deviceMap.put("00:FF:0E:02:00:02:SKGH7200-868O-41", "PO3_F009_ODU[53]");
    deviceMap.put("00:FF:0B:05:00:02:SKGH7200-868O-41", "PO3_F009_ODU[54]");
    deviceMap.put("00:FF:0D:02:00:02:SKGH7200-868O-41", "PO3_F009_ODU[55]");
    deviceMap.put("00:FF:0B:03:00:02:SKGH7200-868O-41", "PO3_F009_ODU[56]");
    deviceMap.put("00:FF:0B:02:00:02:SKGH7200-868O-41", "PO3_F009_ODU[57]");
    deviceMap.put("00:FF:0C:03:00:02:SKGH7200-868O-41", "PO3_F009_ODU[58]");
    deviceMap.put("00:FF:0C:04:00:02:SKGH7200-868O-41", "PO3_F009_ODU[59]");
    deviceMap.put("00:FF:0C:05:00:02:SKGH7200-868O-41", "PO3_F009_ODU[60]");
    deviceMap.put("00:FF:0B:01:00:02:SKGH7200-868O-41", "PO3_F009_ODU[61]");

    return deviceMap;
  }

}