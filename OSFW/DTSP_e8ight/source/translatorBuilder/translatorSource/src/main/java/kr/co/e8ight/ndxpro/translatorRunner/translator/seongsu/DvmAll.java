package kr.co.e8ight.ndxpro.translatorRunner.translator.seongsu;


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

public class DvmAll extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(DvmAll.class);

  public DvmAll(String context) {
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
    JSONArray itemList = jsonObject.getJSONArray("list");
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
    String type = item.optString("type");
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
      Attribute sampleMd_observedAt = new Attribute.Builder()
          .name("observedAt")
          .value(updatedTime)
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
      }

      // modes
      if (item.has("modes")) {
        JSONArray modesArray = item.getJSONArray("modes");
        for (int i = 0; i < modesArray.length(); i++) {
          JSONObject m = modesArray.getJSONObject(i);
          String modeId = m.optString("id");
          String mode = m.optString("mode");
          JSONArray supportedModes = m.optJSONArray("supportedModes");
          if (supportedModes != null) {
            for (int j = 0; j < supportedModes.length(); j++) {
              String supported = supportedModes.optString(j);
            }
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
        }
      }

      // temperatures
      if (item.has("temperatures")) {
        JSONArray tempsArray = item.getJSONArray("temperatures");
        for (int i = 0; i < tempsArray.length(); i++) {
          JSONObject t = tempsArray.getJSONObject(i);
          String tempId = t.optString("id");
          String unit = t.optString("unit");
          Double desired = t.has("desired") ? t.optDouble("desired") : null;
          Double min = t.has("minimum") ? t.optDouble("minimum") : null;
          Double max = t.has("maximum") ? t.optDouble("maximum") : null;
          Boolean enabled = t.has("enabled") ? t.optBoolean("enabled") : null;
        }
      }

      // winds
      if (item.has("winds")) {
        JSONArray windsArray = item.getJSONArray("winds");
        for (int i = 0; i < windsArray.length(); i++) {
          JSONObject w = windsArray.getJSONObject(i);
          String windId = w.optString("id");
          String wind = w.optString("wind");
        }
      }

      // airConditioner 내부 정보
      JSONObject ac = item.optJSONObject("airConditioner");
      if (ac != null) {
        String indoorUnitType = ac.optString("indoorUnitType");
        String defrost = ac.optString("defrost");
        boolean filterResetRequired = ac.optBoolean("filterResetRequired", false);
        String peakPowerControl = ac.optString("peakPowerControl");
        String stillAir = ac.optString("stillAir");
        String temperatureReference = ac.optString("temperatureReference");
        String longWind = ac.optString("longWind");

        // relatedUnits
        if (ac.has("relatedUnits")) {
          JSONArray relatedArray = ac.getJSONArray("relatedUnits");
          for (int i = 0; i < relatedArray.length(); i++) {
            JSONObject ru = relatedArray.getJSONObject(i);
            String relatedId = ru.optString("id");
            String relatedName = ru.optString("name");
            String locations = ru.optString("locations");
//          String representativeStatus = ru.optString("representativeStatus");
            String mode = ru.optString("mode");
            Boolean power =
                ru.has("power") && ru.get("power") instanceof Boolean ? ru.getBoolean("power")
                    : null;
            String model = ru.optString("model");
          }
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
    Attribute nameAttribute = new Attribute.Builder()
        .name("name")
        .type("Property")
        .value("")
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

    return new Entity.Builder()
        .id(entityId)
        .attrs(attrs)
        .context(this.context)
        .build();
  }

  private Entity processAirConditionerOutdoor(JSONObject item) {

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
      String modelName = info.optString("modelName");

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
        String electricCurrentControl = outdoor.optString("electricCurrentControl");
        boolean coolingCapacityCalibrationSupported = outdoor.optBoolean(
            "coolingCapacityCalibrationSupported", false);
        String coolingCapacityCalibration = outdoor.optString("coolingCapacityCalibration");
        boolean heatingCapacityCalibrationSupported = outdoor.optBoolean(
            "heatingCapacityCalibrationSupported", false);
        String heatingCapacityCalibration = outdoor.optString("heatingCapacityCalibration");

        JSONObject cycleInfo = outdoor.optJSONObject("cycleInformation");
        if (cycleInfo != null) {
          double totalIndoorCapa = cycleInfo.optDouble("totalIndoorCapa");
          int heatingCapa = cycleInfo.optInt("heatingCapa");
          int defrostStatus = cycleInfo.optInt("defrostStatus");
          boolean comp1 = cycleInfo.optBoolean("comp1");
          boolean comp2 = cycleInfo.optBoolean("comp2");
          boolean mainCoolingValve = cycleInfo.optBoolean("mainCoolingValve");
          boolean hotGasValve1 = cycleInfo.optBoolean("hotGasValve1");
          boolean hotGasValve2 = cycleInfo.optBoolean("hotGasValve2");
          int outdoorCapacity = cycleInfo.optInt("outdoorCapacity");
          boolean eviBypassValue = cycleInfo.optBoolean("eviBypassValue");
          double highPressure = cycleInfo.optDouble("highPressure");
          double lowPressure = cycleInfo.optDouble("lowPressure");
          int eev1 = cycleInfo.optInt("eev1");
          int compCurrentFrequency1 = cycleInfo.optInt("compCurrentFrequency1");
          int compCurrentFrequency2 = cycleInfo.optInt("compCurrentFrequency2");
          int compDesiredFrequency1 = cycleInfo.optInt("compDesiredFrequency1");
          int compDesiredFrequency2 = cycleInfo.optInt("compDesiredFrequency2");
          int accumCompOnTime1 = cycleInfo.optInt("accumCompOnTime1");
          int accumCompOnTime2 = cycleInfo.optInt("accumCompOnTime2");
          String outdoorMaster = cycleInfo.optString("outdoorMaster");
        }

        boolean isGhp = outdoor.optBoolean("isGhp", false);
      }

      // relatedUnits
      if (ac.has("relatedUnits")) {
        JSONArray relatedArray = ac.getJSONArray("relatedUnits");
        for (int i = 0; i < relatedArray.length(); i++) {
          JSONObject ru = relatedArray.getJSONObject(i);
          String relatedId = ru.optString("id");
          String relatedName = ru.optString("name");
          String locations = ru.optString("locations");
//          String representativeStatus = ru.optString("representativeStatus");
          String mode = ru.optString("mode");
          Boolean power =
              ru.has("power") && ru.get("power") instanceof Boolean ? ru.getBoolean("power") : null;
          String model = ru.optString("model");
        }
      }
    }
    return null;
  }

  private Map<String, String> indoorIdMappingTable() {
    Map<String, String> deviceMap = new HashMap<>();
    deviceMap.put("00:FF:0B:02:05:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[111]");
    deviceMap.put("00:FF:0B:02:01:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[117]");
    deviceMap.put("00:FF:0B:00:00:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[104]");
    deviceMap.put("00:FF:0B:00:04:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[108]");
    deviceMap.put("00:FF:0B:00:05:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[112]");
    deviceMap.put("00:FF:0B:02:00:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[118]");
    deviceMap.put("00:FF:0B:02:02:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[119]");
    deviceMap.put("00:FF:0B:01:00:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[115]");
    deviceMap.put("00:FF:0B:00:01:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[105]");
    deviceMap.put("00:FF:0B:01:01:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[116]");
    deviceMap.put("00:FF:0B:00:06:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[113]");
    deviceMap.put("00:FF:0B:02:03:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[109]");
    deviceMap.put("00:FF:0B:01:02:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[114]");
    deviceMap.put("00:FF:0B:00:02:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[106]");
    deviceMap.put("00:FF:0B:02:04:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[110]");
    deviceMap.put("00:FF:0B:00:03:01:SQPF7163-512O-27", "FS_F010_Facility_ACS_EIAC[107]");

    return deviceMap;
  }

  private Map<String, String> outdoorIdMappingTable() {
    Map<String, String> deviceMap = new HashMap<>();
    deviceMap.put("00:FF:0B:02:00:02:SQPF7163-512O-27", "FS_F010_Facility_ACS_EOAC[7]");
    deviceMap.put("00:FF:0B:01:00:02:SQPF7163-512O-27", "FS_F010_Facility_ACS_EOAC[8]");
    deviceMap.put("00:FF:0B:00:00:02:SQPF7163-512O-27", "FS_F010_Facility_ACS_EOAC[9]");
    return deviceMap;
  }

  private Map<String, List<String>> relationTable() {

    Map<String, List<String>> outdoorToIndoors = new HashMap<>();
    outdoorToIndoors.put("FS_F010_Facility_ACS_EOAC[9]", List.of(
        "FS_F010_Facility_ACS_EIAC[118]",
        "FS_F010_Facility_ACS_EIAC[117]",
        "FS_F010_Facility_ACS_EIAC[119]",
        "FS_F010_Facility_ACS_EIAC[109]",
        "FS_F010_Facility_ACS_EIAC[110]",
        "FS_F010_Facility_ACS_EIAC[111]"
    ));

    outdoorToIndoors.put("FS_F010_Facility_ACS_EOAC[8]", List.of(
        "FS_F010_Facility_ACS_EIAC[115]",
        "FS_F010_Facility_ACS_EIAC[116]",
        "FS_F010_Facility_ACS_EIAC[114]"
    ));

    outdoorToIndoors.put("FS_F010_Facility_ACS_EOAC[7]", List.of(
        "FS_F010_Facility_ACS_EIAC[104]",
        "FS_F010_Facility_ACS_EIAC[105]",
        "FS_F010_Facility_ACS_EIAC[106]",
        "FS_F010_Facility_ACS_EIAC[107]",
        "FS_F010_Facility_ACS_EIAC[108]",
        "FS_F010_Facility_ACS_EIAC[112]",
        "FS_F010_Facility_ACS_EIAC[113]"
    ));
    return outdoorToIndoors;
  }

}