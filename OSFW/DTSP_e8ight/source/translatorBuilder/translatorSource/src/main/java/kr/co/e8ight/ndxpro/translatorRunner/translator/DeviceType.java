package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.exception.DeviceTypeException;
import kr.co.e8ight.ndxpro.translatorRunner.exception.TranslateException;

import java.util.Arrays;
import java.util.Optional;

import static kr.co.e8ight.ndxpro.translatorRunner.translator.ModelId.*;

public enum DeviceType {
    AirHandlingUnit("air_handling_unit", "AirHandlingUnit",AIR_HANDLING_UNIT_MODEL_ID),
    OutAirHandlingUnit("outdoor_air_handling_unit", "OutAirHandlingUnit",OUT_AIR_HANDLING_UNIT_MODEL_ID),
    CoolingTower("cooling_tower", "CoolingTower",COOLING_TOWER_MODEL_ID),
    DirectFiredAbsorptionChiller("absorption_chiller", "DirectFiredAbsorptionChillerHeater", DIRECT_FIRED_ABSORPTION_CHILLER_MODEL_ID),
    WaterPipe("water_pipe", "Pipe", PIPE_MODEL_ID),
    SteamPipe("steam_pipe", "SteamHeader", STEAM_PIPE_MODEL_ID),
//    CirculationPump("circulation_pump", "Pump", PUMP_MODEL_ID),
    CoolingWaterCirculationPump("circulation_pump", "CoolingWaterCirculationPump", COOLING_WATER_CIRCULATION_PUMP_MODEL_ID),
    ChilledWaterCirculationPump("circulation_pump", "ChilledWaterCirculationPump", CHILLED_WATER_CIRCULATION_PUMP_MODEL_ID),
    AirQualitySensor("indoor_air_quality", "AirQualitySensor", AIR_QUALITY_SENSOR_MODEL_ID),
    PowerMeter("power_meter", "PowerMeter", POWER_METER_MODEL_ID),
    SteamBoiler("steam_boiler", "SteamBoiler", STEAM_BOILER_MODEL_ID),
    FanCoilUnit("fan_coil_unit", "FanCoilUnit", FAN_COIL_UNIT_MODEL_ID),
    TurboChiller("turbo_chiller", "TurboChiller", TURBO_CHILLER_MODEL_ID),
    CompactUnit("compact_unit", "CompactUnit", COMPACT_UNIT_MODEL_ID),
    AirConditioner("water_cooled_electric_chiller", "AirConditioner", AIR_CONDITIONER_MODEL_ID),

    OutAirDuct("out_air_duct", "OutAirDuct", OUT_AIR_DUCT_MODEL_ID),
    ExhaustAirDuct("exhaust_air_duct", "ExhaustAirDuct", EXHAUST_AIR_DUCT_MODEL_ID),
    SupplyAirDuct("supply_air_duct", "SupplyAirDuct", SUPPLY_AIR_DUCT_MODEL_ID),
    ReturnAirDuct("return_air_duct", "ReturnAirDuct", RETURN_AIR_DUCT_MODEL_ID);

    private String subCategory;
    private String modelName;
    private String modelId;

    DeviceType(String subCategory, String modelName, String modelId) {
        this.subCategory = subCategory;
        this.modelName = modelName;
        this.modelId = modelId;
    }

    public static DeviceType getDetailPumpType(String deviceId) {
        String deviceCode = EntityIdMapper.getDeviceCodeList(deviceId).get(0);
        if ( EntityIdMapper.coolingWaterPumpCodes.contains(deviceCode) ) {
            return CoolingWaterCirculationPump;
        } else if ( EntityIdMapper.chilledWaterPumpCodes.contains(deviceCode) ) {
            return ChilledWaterCirculationPump;
        } else {
            throw new TranslateException(deviceId + "'s device type is invalid.");
        }
    }

    public String getSubCategory() {
        return subCategory;
    }

    public String getModelId() {
        return modelId;
    }

    public String getModelName() {
        return modelName;
    }

    public static DeviceType getDeviceTypeOfSubCategory(String subCategory, String id) {
        if ( subCategory == null ) {
            throw new DeviceTypeException("subCategory is null.");
        }
        DeviceType deviceType;
        if ( subCategory.equals("circulation_pump")) {
            deviceType = DeviceType.getDetailPumpType(id);
        } else {
            deviceType = Arrays.stream(DeviceType.values())
                    .filter(type -> type.getSubCategory().equals(subCategory))
                    .findFirst().orElseThrow(
                            () -> new DeviceTypeException(subCategory + " device type not found.")
                    );
        }

        return deviceType;
    }
}