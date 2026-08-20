package kr.co.e8ight.ndxpro.translatorRunner.translator;

import java.util.*;

public class EntityIdMapper {

    public static Map<String, String> zoneIdMap;
    public static Map<String, String> buildingIdMap;
    public static Map<String, String> floorIdMap;
    public static Map<String, String> roomIdMap;
    public static Map<String, String> deviceIdMap;
    public static Map<String, String> unitCodeMap;
    public static List<String> pipeCodes;
    public static List<String> ductCodes;
    public static Set<String> coolingWaterPumpCodes;
    public static Set<String> chilledWaterPumpCodes;

    static {
        buildingIdMap = new HashMap<>();
        buildingIdMap.put("325147ca-ef41-473b-84b1-b26d8b097bf7", "B002");

        floorIdMap = new HashMap<>();
        floorIdMap.put("3f791172-767c-4789-83a9-40aaa6121356", "F015");
        floorIdMap.put("f2996392-b0ca-4ded-80ad-43514f6f70bc", "F014");
        floorIdMap.put("9d0b0ce1-bdec-4cec-933f-f87fc961479d", "F012");
        floorIdMap.put("ea406752-bd86-4823-9faf-24bdede11b3a", "F011");
        floorIdMap.put("d0fc5f54-72a6-428b-991b-9bfd7a4257bf", "F010");
        floorIdMap.put("39358390-72bf-430e-a840-022df75be81b", "F009");
        floorIdMap.put("9446a021-7b66-45df-8fd1-5e4fa7e1e67b", "F008");
        floorIdMap.put("4a5f9af0-4b3f-4b51-baeb-78d1367d0556", "F007");
        floorIdMap.put("11badc27-0ea8-4e60-82f1-f74e462421bc", "F006");
        floorIdMap.put("e2d1fe3c-8b05-4faa-bfa7-5a270ff349be", "F005");
        floorIdMap.put("91df8352-1d2f-44a8-a1f2-bb0b0792e78b", "F003");
        floorIdMap.put("62f8e8d3-e38f-4954-9c28-0be59cd53a70", "F002");
        floorIdMap.put("b7af13e2-b6f2-43ba-83eb-003c1d017080", "F001");
        floorIdMap.put("899c796d-9b81-4ee0-b56a-15db6b487f6d", "F0B1");
        floorIdMap.put("9dadb3f0-766c-45b9-ba97-dd1e77e568bc", "F0B2");
        floorIdMap.put("f37bae7d-f42a-484f-950a-271c52db2dbc", "F0B3");
        floorIdMap.put("8d0c2307-977c-4ea5-b647-1511409737dd", "F0B4");

        zoneIdMap = new HashMap<>();
        zoneIdMap.put("fab69fc3-d20c-4505-8bc8-9e1e63da95e3", "Z001");
        zoneIdMap.put("74be37d9-9be7-4b7e-aa17-6b2800bb63d0", "Z002");
        zoneIdMap.put("6dfc85e3-f188-4f7a-bcb0-9e82c9ab4bc8", "Z003");
        zoneIdMap.put("2be1650d-c2db-438b-b385-ad77193ca0b1", "Z004");
        zoneIdMap.put("23b7f7e5-9aee-446d-a69d-31f6fcfbb2a1", "Z005");
        zoneIdMap.put("46991e81-4a76-447e-87b2-bd45a5aa88a4", "Z006");
        zoneIdMap.put("293eb96f-86a3-4986-867e-1a3aa918d9b1", "Z007");
        zoneIdMap.put("1009d49a-28cf-49c1-a2be-e56810f43650", "Z008");
        zoneIdMap.put("d01a7c8d-0413-42b2-ab14-d353d5892d17", "Z009");
        zoneIdMap.put("4201af86-84d7-4ee0-80f3-8d05d565d208", "Z010");
        zoneIdMap.put("b937607d-0d82-496f-b27a-cdd940b80ec7", "Z011");
        zoneIdMap.put("39352bf0-e24c-402b-beb9-08999cdf5f43", "Z012");
        zoneIdMap.put("38618481-de4e-4704-bd7c-8330fbc83b21", "Z013");
        zoneIdMap.put("8443024f-b9bc-4383-9f35-64bd4402a2ff", "Z014");
        zoneIdMap.put("3704acf1-1cdd-4aee-9ee7-074cdd583641", "Z015");
        zoneIdMap.put("a5b7dd3f-a5ba-40b7-a463-4359b396c52a", "Z016");
        zoneIdMap.put("e1d85ff8-f132-4af3-98bd-c7e727b60bec", "Z017");
        zoneIdMap.put("a5afbe0f-7210-49c9-92fe-cd54a35991c6", "Z018");
        zoneIdMap.put("944020a7-b709-41b1-a5f8-027ca597fba9", "Z019");
        zoneIdMap.put("cac71796-58a0-43cb-94e5-827aada8656b", "Z020");
        zoneIdMap.put("2e2f0477-24ca-49f4-9565-a62351f2ca78", "Z021");
        zoneIdMap.put("5b970962-1d00-4ef5-96ec-4ae61193607b", "Z022");
        zoneIdMap.put("ec04fa2c-7217-45e8-9bbf-ce4b96cfca1d", "Z023");
        zoneIdMap.put("48dce74f-6de9-4837-bd72-a4d188d0076b", "Z024");
        zoneIdMap.put("d5de5816-e387-4b18-919f-140331cb331f", "Z025");
        zoneIdMap.put("fa988b00-b230-4710-b5c7-2a024091f582", "Z026");
        zoneIdMap.put("5a4b8783-14f2-4782-a22f-e392791648d3", "Z027");
        zoneIdMap.put("47428028-b30a-41bc-80b7-28ea86064227", "Z028");
        zoneIdMap.put("7f17665c-fe4e-4932-aacc-08e378cc8282", "Z029");
        zoneIdMap.put("9c70c9c7-b060-4c6c-ad82-8d9c4a391ecd", "Z030");
        zoneIdMap.put("7448e48c-0c8a-4db4-9d4f-2c27255c791f", "Z031");
        zoneIdMap.put("f04d9fa9-8cfe-4e3a-a21a-e54e47daedae", "Z032");
        zoneIdMap.put("115728a7-091c-47b6-9dd7-fec5199b4211", "Z033");
        zoneIdMap.put("9c07731d-3015-489d-b9a9-1a423d45cb36", "Z034");
        zoneIdMap.put("2cafb129-b166-49a0-827a-089b2b54bfc3", "Z035");
        zoneIdMap.put("0eff15cf-e2f0-445b-8cd9-b254b31f509f", "Z036");
        zoneIdMap.put("2b4ac7c2-d195-4538-9bad-1f641bafb7c6", "Z037");
        zoneIdMap.put("5c78f942-3524-4847-a260-9bea343738d7", "Z038");
        zoneIdMap.put("090ef7bb-8772-40f5-83ac-23d1a7a4c38a", "Z039");
        zoneIdMap.put("bb861a2f-706a-468b-8c75-17a6d666e3c2", "Z040");
        zoneIdMap.put("592ed6f3-ac85-47a3-8778-b2cf3e83915f", "Z041");
        zoneIdMap.put("28aa33af-fa61-49ba-bee2-60341a74db05", "Z042");
        zoneIdMap.put("f663e0cb-c38f-43cf-9188-9f4329518442", "Z043");
        zoneIdMap.put("7d410179-4fe5-4f56-a8db-0e0841d5e2cf", "Z044");
        zoneIdMap.put("5925a566-e149-438f-907e-902dd68f2b9c", "Z045");
        zoneIdMap.put("1d957c6e-a8a0-4826-b0e6-97afd8cf44e3", "Z046");
        zoneIdMap.put("deaa7b69-b613-4c11-b861-3548e43b4910", "Z047");
        zoneIdMap.put("ea00c4fb-ad95-4499-9e58-e1bf4eaab6cf", "Z048");
        zoneIdMap.put("f4c4f74f-d510-4d14-a4de-58ac28e9cd47", "Z049");
        zoneIdMap.put("870229e9-2044-4000-bbe5-d98528019741", "Z050");
        zoneIdMap.put("41eabf22-8c30-4d58-89cc-dcbff95e6821", "Z051");
        zoneIdMap.put("475590cc-51f7-4ad2-ae81-8d4530a8f819", "Z052");
        zoneIdMap.put("1a8dbf13-2e25-4e7f-bde6-b5bac586cef8", "Z053");
        zoneIdMap.put("8c8c70cf-8ee9-4e92-9808-ab24060d59b8", "Z054");
        zoneIdMap.put("272fdfcc-537c-4cd8-ae60-c17b0ce0f6ec", "Z055");
        zoneIdMap.put("5a8ee571-7c4b-4d51-bb97-ca41f6083e4c", "Z056");
        zoneIdMap.put("8df451b2-4cd3-40be-95a4-ef3071d34182", "Z057");
        zoneIdMap.put("66c38242-a7a0-4342-add2-6bd96c7b27b2", "Z058");
        zoneIdMap.put("7be858ac-7a68-4c65-90a3-277fc9be5180", "Z059");
        zoneIdMap.put("9e59727b-6c9f-4dac-b9b7-9d2b3d845984", "Z060");
        zoneIdMap.put("01ab68d1-a345-44ae-998c-1956c95dfe9d", "Z061");
        zoneIdMap.put("1ac26509-e02c-42c6-833d-b4878cefba88", "Z062");
        zoneIdMap.put("617d7edb-9473-4914-9ebf-19f4d8322619", "Z063");
        zoneIdMap.put("49d3bd1c-b0d5-4553-a472-06e7b1f01cb2", "Z064");
        zoneIdMap.put("600c1cea-1fc3-4e79-a970-a07bec49ec43", "Z065");
        zoneIdMap.put("8ff5aa14-2809-40c1-8e49-01d3d41cb6ae", "Z066");
        zoneIdMap.put("41392292-fae6-407c-9e1c-2eb5bdc905c7", "Z067");
        zoneIdMap.put("e1fceed2-4b35-49f1-bf72-62f3f7521866", "Z068");

        roomIdMap = new HashMap<>();
        roomIdMap.put("d80644f3-66b0-4f2d-b0bb-6e312cb0c38a", "R215");
        roomIdMap.put("3923f64a-0d33-453b-b1e9-2308cfa042e7", "R214");
        roomIdMap.put("1e36253f-f109-47d3-a31e-02eda4c8e211", "R213");
        roomIdMap.put("0956aedf-9178-447e-8ba3-8f35b60f2f63", "R212");
        roomIdMap.put("a16bfba7-4047-48ee-ab1b-0696703e2468", "R211");
        roomIdMap.put("f5e8d535-d2ff-4dd4-8831-20bcc4e73223", "R210");
        roomIdMap.put("334572b2-b922-4b22-a185-0036fc495b70", "R209");
        roomIdMap.put("18321bc9-4251-4f33-af53-b52292e1bf4d", "R208");
        roomIdMap.put("49205e3e-fd2c-4f2b-bba3-3b3aab889631", "R207");
        roomIdMap.put("4d78ebf5-8ce9-465b-bd5c-1c85b1a8a2f6", "R206");
        roomIdMap.put("51d3e819-293e-4952-aeea-af21cc01d5f2", "R205");
        roomIdMap.put("8424b6d3-e791-454e-b3a7-11f14796b10c", "R204");
        roomIdMap.put("b5e22bc0-1d3e-4662-b4cf-2a53f26a436d", "R203");
        roomIdMap.put("5448cfac-9d27-4b1f-81f1-def6d7d6e7ca", "R202");
        roomIdMap.put("54cf4536-00c7-4996-ad1d-f1a24ef8857b", "R201");
        roomIdMap.put("2f357985-916b-41a8-a9b5-26357158505b", "R200");
        roomIdMap.put("5f7bd4d2-3ba5-46e0-a908-15a741a473ad", "R199");
        roomIdMap.put("fd17b700-167f-4f37-9d2b-af84cb1cbc4a", "R198");
        roomIdMap.put("80b1f667-311f-440c-89ce-824cfc8f2904", "R197");
        roomIdMap.put("8f5c6e62-2700-42f0-89bd-4a047ed69a57", "R196");
        roomIdMap.put("5127cd65-07b7-4e5a-98cf-35a39e8d6d77", "R195");
        roomIdMap.put("10cd7b4d-a14d-4700-a2f7-63f335adf0e6", "R194");
        roomIdMap.put("bae648f6-2693-4a04-a8bc-83f488921916", "R193");
        roomIdMap.put("70c31816-6a2c-462a-b28c-644ad0084d30", "R192");
        roomIdMap.put("c1e97509-a6aa-4941-890c-e0bfc0adc0a6", "R191");
        roomIdMap.put("0c2f4b9e-5aba-487c-a68f-1d8f6f7f8028", "R190");
        roomIdMap.put("4cb4c7bb-6d01-4b00-9023-3dddf9adbc25", "R189");
        roomIdMap.put("45260746-599d-48ec-b3fb-0fcffa8491ca", "R188");
        roomIdMap.put("ba50db0c-555b-4a66-8f41-4865df9bd703", "R187");
        roomIdMap.put("24825367-e839-4e25-8f13-0c36a287eadc", "R186");
        roomIdMap.put("17c3599d-55d9-443a-936e-15f5ac3c88be", "R185");
        roomIdMap.put("dd5b91d9-1970-459c-9b60-8f1201428646", "R184");
        roomIdMap.put("285f399f-cdad-4160-832c-0c4f0482ba74", "R183");
        roomIdMap.put("a359f402-c573-4293-987a-f57a216a488f", "R182");
        roomIdMap.put("e7225ea6-33f9-4908-9376-36e5aed63c91", "R181");
        roomIdMap.put("a2a626c7-7a5e-4aff-9ebc-1f0a20b6db8a", "R180");
        roomIdMap.put("ca0eee6e-01d5-473b-8785-87f3a7743784", "R179");
        roomIdMap.put("68d1f1a3-eb98-4233-bbb4-864fd67e5503", "R178");
        roomIdMap.put("ba58f9c6-2cc2-4512-a497-58ae84643f91", "R177");
        roomIdMap.put("84d88368-9816-42b1-84c1-fc81ed5e059e", "R176");
        roomIdMap.put("d84653d6-9eb4-49ea-bf11-d226c67b4e94", "R175");
        roomIdMap.put("46d5dc25-3786-412c-8ae1-6fecf3d32485", "R174");
        roomIdMap.put("34e481c7-a513-43b8-adb3-2c2d26b30f2a", "R173");
        roomIdMap.put("3c1c7f05-8c4d-410d-a6f9-a0bcb1725350", "R172");
        roomIdMap.put("f0f1f3dc-de99-4441-b746-4d865bbf5c86", "R171");
        roomIdMap.put("2b3a02e6-998a-47f8-b19e-b39abb2ffee9", "R170");
        roomIdMap.put("5def807d-fee7-43ca-89cf-32b13ce04f6f", "R169");
        roomIdMap.put("e4cb60d7-a496-46be-aba9-f4f0e1eebe62", "R168");
        roomIdMap.put("3f30764a-2da6-4395-8d13-838ac1ac7402", "R167");
        roomIdMap.put("273c3178-80c6-42a2-96f1-a550ed9c7185", "R166");
        roomIdMap.put("d15f3681-e10a-4f45-92ba-82e901668221", "R165");
        roomIdMap.put("9fc84a3a-4990-4108-ab79-c2c8d2eeed0d", "R164");
        roomIdMap.put("4dc7533c-ea69-4f11-9e15-63e554b399c0", "R163");
        roomIdMap.put("bc43505b-b6bd-42ed-9fc8-152788e07558", "R162");
        roomIdMap.put("ee39df26-c9b1-4946-a598-7fc347567dca", "R161");
        roomIdMap.put("73df7b45-1e08-430f-96e9-bcce4dda6a09", "R160");
        roomIdMap.put("f3f6435b-2afe-49e3-986a-4a144325adad", "R159");
        roomIdMap.put("64b04d83-392d-41e4-b2b6-6762be0c7f55", "R158");
        roomIdMap.put("c6744386-ee54-44cc-97b4-b5c61a82e729", "R157");
        roomIdMap.put("920980be-5665-4525-9de3-a9bdf2069009", "R156");
        roomIdMap.put("fa284daf-5200-4733-8a4e-bf7d3a23c959", "R155");
        roomIdMap.put("60c3e171-bcc6-4762-a99e-6a15f331b618", "R154");
        roomIdMap.put("4bb130f5-d6d8-4165-aa75-94b2ef83a02f", "R153");
        roomIdMap.put("40d7ef54-42ea-4717-b2fa-1f97003f23c8", "R152");
        roomIdMap.put("a6c59818-ded6-46dd-971f-e2e3890fc218", "R151");
        roomIdMap.put("bae3db6d-2127-4f6e-9a39-d192a403b613", "R150");
        roomIdMap.put("4f20fc93-c5f6-4538-9746-5a9d4fd1f9d5", "R149");
        roomIdMap.put("206467b4-1935-474a-9e30-2b162d74ebe2", "R148");
        roomIdMap.put("2b7ec96e-d669-4320-acc0-dd2334d09001", "R147");
        roomIdMap.put("b6699138-77be-4495-bede-6cd35d6d2cac", "R146");
        roomIdMap.put("f2bb4c53-fa00-45ca-ba92-b3aeb44f5fe1", "R145");
        roomIdMap.put("94bedcbb-3a60-4a12-bd82-4dcb67cb5562", "R144");
        roomIdMap.put("a4a7bfc5-b1cf-4cf1-adf4-3ea9c73af9c9", "R143");
        roomIdMap.put("b8aa0a06-d879-4e6f-b7ce-a939bea6add0", "R142");
        roomIdMap.put("c470d7c4-12e0-4972-a1bd-049f4f073d24", "R141");
        roomIdMap.put("39ebf685-ff2d-4915-b4a8-2e335a7b47d8", "R140");
        roomIdMap.put("514c7342-a889-4b51-a143-5ac0b297ff26", "R139");
        roomIdMap.put("5dbe30f2-803e-45dc-8997-524065ff7afa", "R138");
        roomIdMap.put("bf6de22b-0b64-40f0-9dcd-5be3c25dbee2", "R137");
        roomIdMap.put("6391d67c-3dad-4f90-bd55-eed6f1efc293", "R136");
        roomIdMap.put("29745116-f24f-4927-95d7-d1a3a005036f", "R135");
        roomIdMap.put("8c16df9a-2b55-4186-b7a0-90eb7b0f5e24", "R134");
        roomIdMap.put("87cd639c-48c8-4a77-8d86-bfcc8d1627b2", "R133");
        roomIdMap.put("7b291fca-5fbd-42c3-b89c-c44cc37f8d23", "R132");
        roomIdMap.put("e5077643-9bfb-403c-9f23-347578ac45c1", "R131");
        roomIdMap.put("95ad35d3-2f14-4df0-88fd-479054c04a1f", "R130");
        roomIdMap.put("70382413-cb40-4698-b227-ca6648c3c3a7", "R129");
        roomIdMap.put("158e02ec-c591-412d-a9fa-e994e7804c82", "R128");
        roomIdMap.put("19682de0-6a06-418c-a9c8-2711439dd189", "R127");
        roomIdMap.put("b6374cf0-3d6f-498f-a679-ed673f34d9db", "R126");
        roomIdMap.put("a04b2017-4688-4928-94bf-b6eabeda7778", "R125");
        roomIdMap.put("f223180d-f8b6-4bc6-a410-706155e8e81d", "R124");
        roomIdMap.put("e9931dfe-714d-41de-918f-e098d0fcf50f", "R123");
        roomIdMap.put("1aad216c-0443-49b5-9907-28edbbe058ed", "R122");
        roomIdMap.put("ecd6b4e6-c514-482e-ae75-6ef75e70e928", "R121");
        roomIdMap.put("78d73f40-25fb-46af-a54f-9e736199a89e", "R120");
        roomIdMap.put("590721aa-d9a8-49a4-908f-0a1f79a310f9", "R119");
        roomIdMap.put("5fc6a1a3-f48e-4744-b118-f00e1e82daf0", "R118");
        roomIdMap.put("d104967d-0312-4aa9-a330-5626501b9729", "R117");
        roomIdMap.put("d71c1aa2-8092-4093-8029-15736ed5c757", "R116");
        roomIdMap.put("8b1a35c6-675f-432b-a5fc-978284bb2782", "R115");
        roomIdMap.put("e8212c4a-73f1-4504-9289-f8600899d605", "R114");
        roomIdMap.put("02e9948b-70e2-4792-ab32-50995304b0f1", "R113");
        roomIdMap.put("437b4345-9d6f-4202-8de0-5965fa8ce708", "R112");
        roomIdMap.put("3291b20b-8dc1-4be6-b43f-eb3641c906c7", "R111");
        roomIdMap.put("016a5cc8-0461-4aca-98a9-32c433f05c28", "R110");
        roomIdMap.put("beae11ba-02e3-421c-a16c-438c1d6d5f37", "R109");
        roomIdMap.put("7e8cfdbd-9015-47c5-818c-a5588e7fb695", "R108");
        roomIdMap.put("01fc8ff0-f0cb-4bfa-804f-03ea755d2068", "R107");
        roomIdMap.put("d17fe58d-5f6d-483e-a750-45b923df53a0", "R106");
        roomIdMap.put("f00f20eb-24a8-463f-b339-e8f776b8fc5d", "R105");
        roomIdMap.put("78f7e925-09e0-4656-a0c7-74f81dbf748c", "R104");
        roomIdMap.put("9cf1c27b-d0a5-425a-9e58-b8e837152191", "R103");
        roomIdMap.put("05bcaa85-e0f9-48db-9107-83a6a06e22ac", "R102");
        roomIdMap.put("1475e661-ed74-45eb-a06a-fe14f0aefc93", "R101");
        roomIdMap.put("aed8f71f-6929-4e26-bdf5-3d65f04bd7e1", "R100");
        roomIdMap.put("a6847855-a15c-4a8e-bf88-ee41f14b7358", "R099");
        roomIdMap.put("a16a3db7-ecb6-46d0-aba2-fd4447b0c5d8", "R098");
        roomIdMap.put("76386167-0d0c-47a4-851d-4a5303b71cf7", "R097");
        roomIdMap.put("d3187762-2f8d-4590-9404-aa09b9d232c9", "R096");
        roomIdMap.put("53ddb3d0-8652-4609-8a2f-548bcf49281a", "R095");
        roomIdMap.put("532ae785-98a2-4b04-919a-96d72adf9744", "R094");
        roomIdMap.put("9bf57cf4-243e-44e7-b270-1e25999739a6", "R093");
        roomIdMap.put("64af73ef-218a-4a2f-a6d4-f0fdf7522b0a", "R092");
        roomIdMap.put("bef89e9a-712c-4e21-8bdf-52682a5f88d0", "R091");
        roomIdMap.put("c947e3b6-b958-4823-9331-6b8a99c5fc82", "R090");
        roomIdMap.put("7d41fd3b-c55e-4b17-8503-eda4df5fdab7", "R089");
        roomIdMap.put("3aab98e0-3e8d-46c3-88c6-a7c0c1120618", "R088");
        roomIdMap.put("231e4b99-153b-4aa4-bc9f-b52f952a2303", "R087");
        roomIdMap.put("582c8650-08aa-4c99-9101-00c5b1199111", "R086");
        roomIdMap.put("ccc6a3c2-81be-45a8-83a6-6e652c6b8a41", "R085");
        roomIdMap.put("fe9a9528-de5d-4fa4-9610-34f5833bd052", "R084");
        roomIdMap.put("9fd22f2f-4ac3-455f-8be8-553be5de2291", "R083");
        roomIdMap.put("c3041dad-5ea8-40b7-b1d7-c6d1e8740444", "R082");
        roomIdMap.put("b08c2ae0-b727-499f-b162-cdbc5ec106b8", "R081");
        roomIdMap.put("cb4d0f98-0ef8-45f7-b281-971d484a6e97", "R080");
        roomIdMap.put("0005bbc0-e61f-4cbb-a971-58a07d6f004e", "R079");
        roomIdMap.put("520d77be-a4b6-420a-a424-0b2158baf130", "R078");
        roomIdMap.put("73952567-f50c-4749-a427-486de9cc0b35", "R077");
        roomIdMap.put("bf1641c9-a2c5-468a-9c52-de9419191a83", "R076");
        roomIdMap.put("be82b5d3-25e8-4039-89ca-ae6d78b92c58", "R075");
        roomIdMap.put("98d491e6-a0c9-4e16-94ef-90713cd1cb0f", "R074");
        roomIdMap.put("5c44e9cb-69a5-4a74-aae4-a9abf7acc720", "R073");
        roomIdMap.put("19f120b9-a032-43b9-9b8d-c5b576862d19", "R072");
        roomIdMap.put("800ed869-84e2-4b64-8358-ab94aa2acb4f", "R071");
        roomIdMap.put("81d26acf-f47f-47c9-870c-de7a808e4cc5", "R070");
        roomIdMap.put("bd18c19e-48d4-4cd7-a1e7-dae0d43489cd", "R069");
        roomIdMap.put("1bd619a3-e90c-48bc-8a9d-fecce30fd49a", "R068");
        roomIdMap.put("9c238d01-89a7-4938-a6c3-5475c73431cc", "R067");
        roomIdMap.put("caed76d3-0bc1-49bc-ac53-0f304f23653b", "R066");
        roomIdMap.put("1ada58c5-be04-459d-b53f-aa6c45f7a513", "R065");
        roomIdMap.put("f9b8d38d-010e-446d-8967-2480274331e9", "R064");
        roomIdMap.put("250129c6-8e96-4cf1-bed8-b12da7b4257f", "R063");
        roomIdMap.put("9cc2bec7-07cb-4e75-9176-db67c6479de7", "R062");
        roomIdMap.put("93dc4792-75ab-438e-a43f-8d5333982ad2", "R061");
        roomIdMap.put("194ff1dd-533f-4f27-9112-ec2f34ccc549", "R060");
        roomIdMap.put("604180e5-8029-42d6-87c8-3228a17712c1", "R059");
        roomIdMap.put("7baa2970-f1b1-4eec-b1cd-71757843f180", "R058");
        roomIdMap.put("5a6c47ec-ccc8-4531-936d-6c545664405f", "R057");
        roomIdMap.put("d53f4670-9396-4fad-bb08-1a0e66f4a0be", "R056");
        roomIdMap.put("281a9caf-a2aa-4a80-a155-1b601966814c", "R055");
        roomIdMap.put("d7bdb635-7ea2-4581-b0be-fcc264abb6ba", "R054");
        roomIdMap.put("5b59039d-f1bd-4f2d-a129-57153f4ecc31", "R053");
        roomIdMap.put("ed81489e-11e5-46ef-a5b0-954ac488e30d", "R052");
        roomIdMap.put("631b7eab-6ab4-4883-9887-9735a3ab0532", "R051");
        roomIdMap.put("25ce69ad-77bd-4455-80ee-8ff28d035414", "R050");
        roomIdMap.put("32f469af-6864-448e-9500-21ee2193ac62", "R049");
        roomIdMap.put("20c38a01-ead1-47b1-a4a7-6ebe54f3c2b0", "R048");
        roomIdMap.put("a59cea5a-f510-4d2c-83ac-477df324bb84", "R047");
        roomIdMap.put("d6e37e6e-7ee2-4379-a1ac-0ccb12877126", "R046");
        roomIdMap.put("23081615-a858-4f12-8d31-143729bab165", "R045");
        roomIdMap.put("22383c92-eef3-4033-937a-ae1c2c8c35f5", "R044");
        roomIdMap.put("ff37186c-59db-445c-9fb2-94bd7503ca11", "R043");
        roomIdMap.put("c2950f5a-ff75-4f02-ab41-c5515ffe6c86", "R042");
        roomIdMap.put("bd7f6926-dd5f-4f4d-8cec-9b5b355b511c", "R041");
        roomIdMap.put("4d4b944c-f486-4f03-897b-6531f1c75160", "R040");
        roomIdMap.put("8c207a44-1af3-4545-8fdf-ca49a1326737", "R039");
        roomIdMap.put("50089604-896e-4cdc-81dc-641efa7829fd", "R038");
        roomIdMap.put("6598feca-ea1d-464d-8534-d39a60c867b3", "R037");
        roomIdMap.put("15348daa-34f1-47d1-9e03-2b3014605cf7", "R036");
        roomIdMap.put("3fa0768a-9d6c-4c64-9343-b4dfffbfc4ea", "R035");
        roomIdMap.put("23cf66f0-caab-4749-8452-c1a39c347e02", "R034");
        roomIdMap.put("a5c4e457-7518-4411-8eff-d866d4b2f792", "R033");
        roomIdMap.put("b413a41a-9435-4667-a1f8-ae4a9d1301fc", "R032");
        roomIdMap.put("f54e73f8-8868-480f-bc03-8f20f83ae6fe", "R031");
        roomIdMap.put("d1f4e197-d690-4a83-a409-259bbd8a2d0a", "R030");
        roomIdMap.put("a53073cb-b421-4805-a116-e93ebd9cbe54", "R029");
        roomIdMap.put("220ea200-95dd-48c4-a742-b49557866831", "R028");
        roomIdMap.put("0d214d29-96a0-452d-907b-4ada8cf0cfca", "R027");
        roomIdMap.put("aff0b06b-5435-486d-81d9-c6165dba68cd", "R026");
        roomIdMap.put("6b046830-244a-4d84-a348-3b73c06686f7", "R025");
        roomIdMap.put("4fe6d896-b096-41fa-8f56-3981bf086ba7", "R024");
        roomIdMap.put("a5d4b478-3aec-422a-9480-fa7adbec68e6", "R023");
        roomIdMap.put("ba405bd1-7821-4246-8d90-66b21e253c30", "R022");
        roomIdMap.put("b854f479-9d19-4e41-a562-6dea42304142", "R021");
        roomIdMap.put("13e7e98e-6e00-4809-a549-a8cafa3990b7", "R020");
        roomIdMap.put("6fe2dd06-471d-40ff-9a03-b0b2ee7d82bf", "R019");
        roomIdMap.put("3f8d47f8-c9e8-43fb-8ca7-a31da0e82248", "R018");
        roomIdMap.put("a0869c44-e7e6-4558-a8c3-6034857e1ab6", "R017");
        roomIdMap.put("34246334-83f1-4085-bfc1-0434348cc915", "R016");
        roomIdMap.put("9ca6cf20-0ae0-4bda-8ea1-30b1f5979b35", "R015");
        roomIdMap.put("ca97486b-0caa-461f-84f3-b763770cc955", "R014");
        roomIdMap.put("2d840be0-a6d8-4983-ac54-b13ba7185c8a", "R013");
        roomIdMap.put("6cf0f0f8-1b02-4735-83b1-ccbdb442bdc6", "R012");
        roomIdMap.put("c7fbc059-09a3-4c93-88be-53e2789c894e", "R011");
        roomIdMap.put("0b79009c-0af1-4767-8098-8790d5851429", "R010");
        roomIdMap.put("ae11f1fa-cab8-439a-8bb4-ffeb7ee13cb5", "R009");
        roomIdMap.put("a74ba97e-a200-4f40-b8b5-b35c74b7e98f", "R008");
        roomIdMap.put("1e8535c8-b12c-45cc-b11d-f30bd037a282", "R007");
        roomIdMap.put("3e179a95-f099-4b5b-8536-54b887865b40", "R006");
        roomIdMap.put("9d498ff6-05db-447b-bff8-7744f5391e52", "R005");
        roomIdMap.put("a5a48099-31ad-41ef-ab44-cf1875e546ff", "R004");
        roomIdMap.put("8366e75a-1fa4-4c9c-a657-99b0dd8f1dc0", "R003");
        roomIdMap.put("e8b2de53-f2ff-47ba-aedb-3488ba29638f", "R002");
        roomIdMap.put("c66bca58-5fcd-4c87-9e4e-7d0c4247c0ee", "R001");

        deviceIdMap = new HashMap<>();
        //냉각탑
        deviceIdMap.put("f1ac8c88-bc37-42b7-9c6d-b5546c56a0ae",	"EQM-CLT-101A1");
        deviceIdMap.put("485efc6a-e51d-40ec-9f8b-f9573f993701",	"EQM-CLT-101A2");
        deviceIdMap.put("1e0575fb-3d2c-453a-b6fa-0c29f2c42893",	"EQM-CLT-101A3");
        deviceIdMap.put("fad6c20c-b11f-4fc0-9320-ad3b2e7c41ca",	"EQM-CLT-101B1");
        deviceIdMap.put("2c2e798c-a90f-4a7c-a978-df37c47591de",	"EQM-CLT-101B2");
        deviceIdMap.put("76f05d8b-fc53-484e-bf18-b0d5e8a7a133",	"EQM-CLT-101B3");
        deviceIdMap.put("ea27ccf4-9fc9-492c-b56e-e0ad18c342b9",	"EQM-CLT-101C1");
        deviceIdMap.put("ff9217ab-6bed-4fe3-a6fe-0b6d3fd01205",	"EQM-CLT-101C2");
        deviceIdMap.put("802756e8-1ee0-4c9f-b7eb-14b2c2e40c8b",	"EQM-CLT-101C3");
        deviceIdMap.put("3fbc40ae-26ad-4934-b734-a81103f0e075",	"EQM-CLT-101D1");
        deviceIdMap.put("66923af7-bf91-452e-9037-373bfd01a4a6",	"EQM-CLT-101D2");
        deviceIdMap.put("70a88345-3587-4624-b294-afea7f6a65fb",	"EQM-CLT-101D3");
        deviceIdMap.put("04beabad-cd88-4ddf-9b12-24c527527d79",	"EQM-CLT-10301");
        deviceIdMap.put("7c7f451f-ec20-4395-93b9-7e3588d9540d",	"EQM-CLT-10302");
        deviceIdMap.put("c80cd368-67f6-4de2-a052-a3926778963b",	"EQM-CLT-102A1");
        deviceIdMap.put("8a517a3e-0c85-4fb0-914c-a1d7cccf45d1",	"EQM-CLT-102A2");
        deviceIdMap.put("44f9fc04-f38b-4eab-861f-df04a8acfbb2",	"EQM-CLT-102B1");
        deviceIdMap.put("1d70f98e-fe60-4748-baa7-8caa089377f7",	"EQM-CLT-102B2");

        //터보 냉동기
        deviceIdMap.put("4aa4c96a-2eb4-422b-8b76-222772547478",	"EQM-TBC-0102A");
        deviceIdMap.put("8677ad55-a3ed-45d2-9fc2-2521a7d96f9a",	"EQM-TBC-0102B");

        //흡수식 냉온수기
        deviceIdMap.put("3228d058-d4a1-4b26-a26e-64be51f526b9",	"EQM-AHC-0101A");
        deviceIdMap.put("4f45f6d1-e0c2-4c00-9187-1d5703c9a723",	"EQM-AHC-0101B");
        deviceIdMap.put("516bba63-b413-4aa3-a53e-c56b86cdaf02",	"EQM-AHC-0101C");
        deviceIdMap.put("0b323919-09b7-4d12-b463-4299256c8d06",	"EQM-AHC-0101D");

        //관류형 보일러
        deviceIdMap.put("368991e4-8d9b-4456-8660-b69543fb229f",	"EQM-STB-0101A");
        deviceIdMap.put("f689bc38-8b79-47ba-8198-c8ca16a0940e",	"EQM-STB-0101B");
        deviceIdMap.put("2e2be0c9-afac-4e6f-a014-002d33d70701",	"EQM-STB-0101C");
        deviceIdMap.put("a6446b9f-0e9d-498c-a6c4-882b4cd12493",	"EQM-STB-0101D");

        //열교환기
        deviceIdMap.put("c468a5f0-f7ed-4c20-a3e0-722c62219c76", "EQM-CHU-0101C");
        deviceIdMap.put("e12959c1-8671-4b59-be1c-6820e3f6f6d9", "EQM-CHU-0101A");
        deviceIdMap.put("807d438d-af02-4391-a273-65502143787a", "EQM-CHU-0101B");
        deviceIdMap.put("9e5401d3-1010-493a-bc1f-3254fdd2eac8", "EQM-CHU-0102C");
        deviceIdMap.put("c7743f6c-8a70-4fda-a393-284000b153d2", "EQM-CHU-0102A");
        deviceIdMap.put("6ca34120-2950-462c-b589-b72f609bf481", "EQM-CHU-0102B");
        deviceIdMap.put("c0ba7c5f-7157-4aba-946f-1b332e900aaf", "EQM-CHU-0103C");
        deviceIdMap.put("7506fbf7-237a-4802-941b-4924c04f886a", "EQM-CHU-0103A");
        deviceIdMap.put("a3102e73-054f-4f84-97c0-6fd2f3605216", "EQM-CHU-0103B");

        //순환 펌프
        deviceIdMap.put("16c47e05-ec2b-442c-885c-50dacc34d297",	"EQM-PUM-0113A");
        deviceIdMap.put("57098479-a237-41da-9c9d-90e74dfa2ac8",	"EQM-PUM-0113B");
        deviceIdMap.put("5e6bf44c-2c36-4004-b81f-9a660eef2ebf",	"EQM-PUM-0111A");
        deviceIdMap.put("bc125696-781e-4ae2-ad81-873bf9d0d0e7",	"EQM-PUM-0111B");
        deviceIdMap.put("c0a799d0-bced-481d-8ac0-f078d9b5b943",	"EQM-PUM-0111C");
        deviceIdMap.put("b2bd9604-c409-43d0-b809-2a2df6e05e5c",	"EQM-PUM-0111D");
        deviceIdMap.put("d5f55731-6f5b-4b6e-8a3b-b20e2d5ad166",	"EQM-PUM-0112A");
        deviceIdMap.put("0019b65c-e185-4945-94e8-3759b93798a4",	"EQM-PUM-0112B");
        deviceIdMap.put("1d75915a-ba0a-4ba8-85e9-298a2f8874a4",	"EQM-PUM-0115A");
        deviceIdMap.put("e89198b7-049d-4675-8a68-0b44b26d6a17",	"EQM-PUM-0115B");
        deviceIdMap.put("099c46c5-7f42-4437-8047-1098c297dc3f",	"EQM-PUM-0114A");
        deviceIdMap.put("e19ea31d-32d2-4028-8ed9-5e38d2387e8d",	"EQM-PUM-0114B");
        deviceIdMap.put("baabf1b0-28a2-4a19-8922-6906883f8e06",	"EQM-PUM-0114C");
        deviceIdMap.put("b9793a85-ece8-430d-9764-db7d650c9ae5",	"EQM-PUM-0114D");
        deviceIdMap.put("d3ba9b40-5a9a-454d-8bee-50d7672b91e5",	"EQM-PUM-0118A");
        deviceIdMap.put("ca1add3c-aee2-45e6-8fd9-1b9eec955ac5",	"EQM-PUM-0118B");
        deviceIdMap.put("69a168ee-4e1f-4564-88fd-8debf6ae51a9",	"EQM-PUM-0118C");

        //수배관
        deviceIdMap.put("7c542a6a-0e90-40b1-b480-3ef9de33e46c",	"PPS-CLW-00015");
        deviceIdMap.put("950d6ad5-b174-4d83-b353-d07b23153aee",	"PPR-CLW-00026");
        deviceIdMap.put("faec6fa4-d010-40aa-ad88-11e9271d9126",	"PPS-CDW-00005");
        deviceIdMap.put("ba2690e3-f0cf-4c3e-9336-63ae52b4fda2",	"PPS-CDW-00011");

        //스팀 헤더
        deviceIdMap.put("7fe2b79c-a581-4eb5-93f9-6fd715d7685a",	"EQM-STH-00101");

        //외기조화기
        deviceIdMap.put("25b20870-3cfc-47e0-a87a-490318f8e2ff",	"EQM-OAU-00113");
        deviceIdMap.put("debc62c1-8c1e-4775-a818-cf5e41f776b1",	"EQM-OAU-0112A");
        deviceIdMap.put("c179920e-fecd-48c3-a1e7-1f56b9354702",	"EQM-OAU-0112B");

        //공기조화기
        deviceIdMap.put("57fc529f-a454-4cc8-a802-11ad39c9b3b9",	"EQM-AHU-14154D");
        deviceIdMap.put("1e6cd560-f447-4366-bc02-c5fc746eba7f",	"EQM-AHU-14154E");
        deviceIdMap.put("f45e29e6-0508-4e49-baa8-c12c2f5a0d0d",	"EQM-AHU-141550");
        deviceIdMap.put("13426da4-a31e-4c60-9b22-f4eba3307344",	"EQM-AHU-14154A");
        deviceIdMap.put("999361ae-aed8-479d-94c7-3a4e400fd1a3",	"EQM-AHU-14154B");
        deviceIdMap.put("c5c915d9-6c01-48bf-86f2-9f197236cd59",	"EQM-AHU-14154C");
        deviceIdMap.put("781d75fb-5e2b-4193-8801-b63693b902c7",	"EQM-AHU-12152D");
        deviceIdMap.put("cfa1c781-f51a-4c11-a2dd-ccdc04b2a3d9",	"EQM-AHU-12152E");
        deviceIdMap.put("04db96e6-7b17-4f2a-9b47-82c152e63ba6",	"EQM-AHU-12152A");
        deviceIdMap.put("27e5d6ac-6ee9-462b-a460-80646c57fe24",	"EQM-AHU-121530");
        deviceIdMap.put("bba84095-11c8-4e29-97ac-3bb3c69ba834",	"EQM-AHU-12152B");
        deviceIdMap.put("7f5a30ce-ca50-4f4b-b27d-e26124ddc10d",	"EQM-AHU-12152C");
        deviceIdMap.put("410c2d94-f5cc-4fc1-b95f-93360bfdeb2f",	"EQM-AHU-11152D");
        deviceIdMap.put("35f091c1-2515-46f0-9c46-b12a60eff503",	"EQM-AHU-11152E");
        deviceIdMap.put("9137f5ed-3d21-45b8-b56b-b3850fd747f9",	"EQM-AHU-11152A");
        deviceIdMap.put("677ac878-c184-4b0a-865a-b85486237283",	"EQM-AHU-111530");
        deviceIdMap.put("b1315ca2-9e90-4c37-9bca-730a8334eb07",	"EQM-AHU-11152B");
        deviceIdMap.put("30cb9147-6a0c-4d61-9933-ec196dc219cd",	"EQM-AHU-11152C");
        deviceIdMap.put("13feeae4-83c4-4f63-aece-fd71a11a73c9",	"EQM-AHU-10152D");
        deviceIdMap.put("b2d6c2ea-384c-4d26-b8f1-d816bc76e6c3",	"EQM-AHU-10152E");
        deviceIdMap.put("c409e8a7-b74e-44d0-801b-1e771d6c35bb",	"EQM-AHU-10152A");
        deviceIdMap.put("35fe4537-3ba4-4844-aff4-c14336ffca0a",	"EQM-AHU-101530");
        deviceIdMap.put("80eb4266-7d98-4d20-8e57-0650d3e27031",	"EQM-AHU-10152B");
        deviceIdMap.put("3c899bdd-bf48-4e0f-9ab8-88c7ecec79c0",	"EQM-AHU-10152C");
        deviceIdMap.put("eb59cecf-c20d-41d7-ae3f-4d41e2079faa",	"EQM-AHU-9152D");
        deviceIdMap.put("f117ed90-5ee8-4969-9e36-2913482bd879",	"EQM-AHU-9152E");
        deviceIdMap.put("6e9b3a05-a06b-41eb-b354-28411d25b52a",	"EQM-AHU-9152A");
        deviceIdMap.put("8c47d5b5-cb9e-4e30-87d4-2e9b76a53e2c",	"EQM-AHU-91530");
        deviceIdMap.put("7e0347c1-1b4c-4319-a01d-eec9571c1462",	"EQM-AHU-9152B");
        deviceIdMap.put("2822e433-3f6c-41bc-9638-f16f878cdd39",	"EQM-AHU-9152C");
        deviceIdMap.put("ccc73520-87a8-4c19-8ccc-b1e85c53a239",	"EQM-AHU-8152D");
        deviceIdMap.put("222cc200-9c17-4310-b049-8ea1b1aed2d2",	"EQM-AHU-8152E");
        deviceIdMap.put("1681242b-acd3-4368-94cf-abf4ef250e4b",	"EQM-AHU-8152A");
        deviceIdMap.put("5c908280-a856-47bb-9644-5906c2e7ca42",	"EQM-AHU-81530");
        deviceIdMap.put("53d00e72-63f3-4541-8a59-4f5e26c32621",	"EQM-AHU-8152B");
        deviceIdMap.put("a33009c7-da5d-41c8-b840-35a0048160c6",	"EQM-AHU-8152C");
        deviceIdMap.put("5b6dcff4-0865-46e3-bfcb-dbb3eb5195ba",	"EQM-AHU-7152D");
        deviceIdMap.put("0a76549b-1eb9-491e-b7ec-5ae267946602",	"EQM-AHU-7152E");
        deviceIdMap.put("30e26aa7-1203-4da9-b681-5515ebae8186",	"EQM-AHU-7152A");
        deviceIdMap.put("646cb3dc-5fca-45fe-aa6e-91b2f30a59c4",	"EQM-AHU-71530");
        deviceIdMap.put("035dc7dd-7fe5-40c1-96b6-c1a9f7dd3058",	"EQM-AHU-7152B");
        deviceIdMap.put("8faf1a60-a52f-4e59-a7a1-f54fdee0f48b",	"EQM-AHU-7152C");
        deviceIdMap.put("747c6458-6f54-494c-8ec7-8763f1200f21",	"EQM-AHU-6152D");
        deviceIdMap.put("0d69b0f7-8f07-40cd-8103-17017ea878a5",	"EQM-AHU-6152E");
        deviceIdMap.put("b2d70823-236b-4751-b363-084520a5851d",	"EQM-AHU-6152A");
        deviceIdMap.put("adf1b158-c505-4a14-8cd5-35f918e84db3",	"EQM-AHU-61530");
        deviceIdMap.put("13ebaa73-95bc-42a1-b032-890672dcfd94",	"EQM-AHU-6152B");
        deviceIdMap.put("2a3bd564-ac0c-4c55-9418-d62eb79bc6b0",	"EQM-AHU-6152C");
        deviceIdMap.put("d3b2e555-94a7-40a1-aac3-035c33125674",	"EQM-AHU-5151F");
        deviceIdMap.put("62ef4b7b-a7cd-4145-89f0-50362a31a4d8",	"EQM-AHU-5151E");
        deviceIdMap.put("f384e389-e7db-4e5b-a5ea-fc7d7549f2b7",	"EQM-AHU-5151B");
        deviceIdMap.put("8f8c9863-7809-4ff1-b0e7-309f72fc26da",	"EQM-AHU-5151A");
        deviceIdMap.put("eda0d420-f961-49a3-9df0-00dc996f4550",	"EQM-AHU-5151C");
        deviceIdMap.put("b22226c3-5ae9-4959-a6af-97f2210f0680",	"EQM-AHU-5151D");

        //FCU
        deviceIdMap.put("284f8d9e-c807-4174-a643-056b1cccd142", "EQM-FCU-14E111");
        deviceIdMap.put("47a159c8-c062-4f96-b4d0-41a1979a24a7", "EQM-FCU-14W111");
        deviceIdMap.put("5aab440a-f5a9-4e5f-a796-24a84e1b389b", "EQM-FCU-14S111");
        deviceIdMap.put("e360e914-a4a7-4200-92c0-ca988ce03bd9", "EQM-FCU-14N111");
        deviceIdMap.put("b387f78f-91b4-45da-ba89-1047b36099fd", "EQM-FCU-12E111");
        deviceIdMap.put("3e384c64-dbb1-41f9-a9c8-f1b0d05eeb87", "EQM-FCU-12W111");
        deviceIdMap.put("f74e8e96-3012-4721-b6fd-d537f91d6539", "EQM-FCU-12S111");
        deviceIdMap.put("72121c8c-26c5-45cd-9a5d-36a89db66789", "EQM-FCU-12N111");
        deviceIdMap.put("5605df50-11d3-44bf-aecd-eda54a11e4d0", "EQM-FCU-11E111");
        deviceIdMap.put("c30ebc79-06e5-49ee-8e32-d176af57e1e9", "EQM-FCU-11W111");
        deviceIdMap.put("7a6bce10-87a0-460f-9a89-1d2d038b1034", "EQM-FCU-11S111");
        deviceIdMap.put("58ec2449-51f5-457f-99f4-ec4a35cd6e69", "EQM-FCU-11N111");
        deviceIdMap.put("bdf75676-beb0-470d-8281-80a8e3728f66", "EQM-FCU-10E111");
        deviceIdMap.put("e029e42b-d74e-4a2c-a132-670a99922820", "EQM-FCU-10W111");
        deviceIdMap.put("23a8a1cf-e55b-4d89-a066-a78303bfbe11", "EQM-FCU-10S111");
        deviceIdMap.put("84526404-94f0-4596-ad3a-eb180f037fca", "EQM-FCU-10N111");
        deviceIdMap.put("a0826071-3afe-4b98-a1be-ded392e75985", "EQM-FCU-09E111");
        deviceIdMap.put("14692f9c-8c8a-4bfc-9b54-0616e282ef45", "EQM-FCU-09W111");
        deviceIdMap.put("b07a42eb-cef9-4c31-9473-21cdf691cd28", "EQM-FCU-09S111");
        deviceIdMap.put("84a71812-6052-469f-acdd-7110d2feba2c", "EQM-FCU-09N111");
        deviceIdMap.put("f2b7b6d1-1c7d-4833-ac4c-74b2abaa070f", "EQM-FCU-08E111");
        deviceIdMap.put("5e51ffd8-64c9-4f01-86b1-4d1ac21c656c", "EQM-FCU-08W111");
        deviceIdMap.put("3470e58d-df13-4eba-8e8c-17b0d5d41c5a", "EQM-FCU-08S111");
        deviceIdMap.put("187d5894-69bc-4e5d-894f-ff813f5338a3", "EQM-FCU-08N111");
        deviceIdMap.put("84a865a8-229e-4dd7-ade0-3b07d49b8618", "EQM-FCU-07E111");
        deviceIdMap.put("f874f065-8500-4cd1-8450-106f37d2f359", "EQM-FCU-07W111");
        deviceIdMap.put("d9bf3d2c-8cc9-498c-a759-e5fcdf490648", "EQM-FCU-07S111");
        deviceIdMap.put("e3f72cef-0201-4505-b0d4-cacc5dd5d01f", "EQM-FCU-07N111");
        deviceIdMap.put("dffd2cee-1278-4d0e-83bf-fe755fb90b9a", "EQM-FCU-06E111");
        deviceIdMap.put("283a2c70-5431-4cff-bb91-2c8fa6dab56c", "EQM-FCU-06W111");
        deviceIdMap.put("912c93e5-94dd-443f-ba11-4b8d4b1d7e5d", "EQM-FCU-06S111");
        deviceIdMap.put("7f531a21-61d5-43ed-bf66-418cdc8c8197", "EQM-FCU-06N111");
        deviceIdMap.put("54834059-1f56-44fb-952e-b44fed75e593", "EQM-FCU-05E111");
        deviceIdMap.put("0e5a7f2d-e22b-498c-a01c-b71b05325675", "EQM-FCU-05W111");
        deviceIdMap.put("4d776cc6-7de4-4cbc-8b4b-4c722a04b2af", "EQM-FCU-05S111");
        deviceIdMap.put("20612849-dc1f-42cc-ae81-846c95829b1f", "EQM-FCU-05N111");

        //IAQ
        deviceIdMap.put("31dfb92f-b351-4600-b7b5-4505bbdbe032",	"EQM-IAQ-B14E1");
        deviceIdMap.put("5c692210-82bc-481f-a16c-293ed0928cdc",	"EQM-IAQ-B14E2");
        deviceIdMap.put("83e26534-bf18-4fcc-95af-e74dee07973e",	"EQM-IAQ-B14W1");
        deviceIdMap.put("1e886792-a736-450c-97c8-bf7aef439327",	"EQM-IAQ-B12E1");
        deviceIdMap.put("e70951d4-8dab-4bf4-83fa-4bc0c2cb111c",	"EQM-IAQ-B12E2");
        deviceIdMap.put("fc8c0eeb-4315-4f56-844f-462069907b59",	"EQM-IAQ-B12E3");
        deviceIdMap.put("07b15556-5701-4fa4-9ddf-7b8ac3a11e6d",	"EQM-IAQ-B12E4");
        deviceIdMap.put("c4db7d1b-f1c1-4eea-904d-0f935ae1ef39",	"EQM-IAQ-B12W1");
        deviceIdMap.put("63bf28ea-7436-47d3-9e12-ba0da0cf9569",	"EQM-IAQ-B12W2");
        deviceIdMap.put("72fbae0b-d402-4333-b40f-17405390c078",	"EQM-IAQ-B12W3");
        deviceIdMap.put("8a1eca64-aa7e-419d-8b80-5a42b523471f",	"EQM-IAQ-B12W4");
        deviceIdMap.put("87e81fb5-061e-406a-b97f-8ce516b617a7",	"EQM-IAQ-B11E1");
        deviceIdMap.put("6fa555e0-14d2-4af3-80d7-c222c0b769b1",	"EQM-IAQ-B11E2");
        deviceIdMap.put("a2142a09-15a7-4593-862c-973b51c4b60e",	"EQM-IAQ-B11E3");
        deviceIdMap.put("d8d7093b-76b3-423e-9dc9-0eda12387c72",	"EQM-IAQ-B11E4");
        deviceIdMap.put("d7a52790-9d6e-4d77-91c1-6009fc3e16ea",	"EQM-IAQ-B11W1");
        deviceIdMap.put("73258fa5-a533-43ea-88a7-c4bc96f0a683",	"EQM-IAQ-B11W2");
        deviceIdMap.put("56f9cb6c-3b23-4aaf-994c-ffa87cadf0c9",	"EQM-IAQ-B11W3");
        deviceIdMap.put("d0f47408-7d18-4a5a-be43-e838ff0a82f0",	"EQM-IAQ-B11W4");
        deviceIdMap.put("0916a1ea-28c8-4cd0-ace0-a207b1818f07",	"EQM-IAQ-B10E1");
        deviceIdMap.put("a9d73374-5d74-4de7-88fa-a5ad75c9b9ca",	"EQM-IAQ-B10E2");
        deviceIdMap.put("6d1f9090-28e9-4854-865c-6d8a6d21609e",	"EQM-IAQ-B10E3");
        deviceIdMap.put("e63ec545-e799-4978-bf3a-79ec634ca4f7",	"EQM-IAQ-B10E4");
        deviceIdMap.put("a35ff432-c604-41d5-ad2b-6c529eb4af3f",	"EQM-IAQ-B09E1");
        deviceIdMap.put("13a720e6-9295-46d1-b525-80144fd1d145",	"EQM-IAQ-B09E2");
        deviceIdMap.put("208bd665-6034-4959-ad29-283a8aa03815",	"EQM-IAQ-B09E3");
        deviceIdMap.put("6da88e22-82f5-457e-b2da-b8ffdd1ead59",	"EQM-IAQ-B09W1");
        deviceIdMap.put("0342599b-60e3-497c-9c47-b2c0442edf98",	"EQM-IAQ-B09W2");
        deviceIdMap.put("27cfbb5e-5d7c-4dfe-9be0-3d8c1667eedf",	"EQM-IAQ-B08E1");
        deviceIdMap.put("d9d4d86f-491c-446a-8b21-c845f583b284",	"EQM-IAQ-B08E2");
        deviceIdMap.put("9cafd983-f1db-47e6-8ccd-d09e15fece01",	"EQM-IAQ-B08E3");
        deviceIdMap.put("af79c051-302e-46a9-b570-4a104a516740",	"EQM-IAQ-B08E4");
        deviceIdMap.put("f9764e81-3b13-4520-a570-c4dfdbf7fbab",	"EQM-IAQ-B08W1");
        deviceIdMap.put("8c66577f-006d-4ff9-a3ea-bace1a811362",	"EQM-IAQ-B08W2");
        deviceIdMap.put("a9c1fb8d-8830-42a8-8fe3-a78ed37cdf47",	"EQM-IAQ-B08W3");
        deviceIdMap.put("f209acda-d545-4320-806c-3c0211b51f43",	"EQM-IAQ-B08W4");
        deviceIdMap.put("2fbcd74b-eff6-41c2-bf2a-aadc0ec5b818",	"EQM-IAQ-B07E1");
        deviceIdMap.put("99d0d596-15c3-46d2-8e88-18576c291f04",	"EQM-IAQ-B07E2");
        deviceIdMap.put("26ed1be2-15b0-4ccd-830d-d8fd9f0fc8a0",	"EQM-IAQ-B07E3");
        deviceIdMap.put("d237c62f-f02f-4299-9366-3d924f6478f5",	"EQM-IAQ-B07E4");
        deviceIdMap.put("1b043fb5-e60a-4a1f-a75f-cd23ec31f1de",	"EQM-IAQ-B07W1");
        deviceIdMap.put("654357b0-1ec3-4736-97c0-7d61f14d1c2c",	"EQM-IAQ-B07W2");
        deviceIdMap.put("0a45d2f0-f1c9-4b07-8e1a-610bd15f990d",	"EQM-IAQ-B07W3");
        deviceIdMap.put("3a744fc4-976a-4924-b01e-10798abc07ec",	"EQM-IAQ-B07W4");
        deviceIdMap.put("dc4f6a99-c030-42af-b717-e9039590fad2",	"EQM-IAQ-B06E1");
        deviceIdMap.put("8be59872-427e-4e30-abe0-ef527a77b1d0",	"EQM-IAQ-B06E2");
        deviceIdMap.put("72cd41b3-6e5e-48f3-a785-4d87d5ea92e6",	"EQM-IAQ-B06E3");
        deviceIdMap.put("0821f1b0-77c9-4eea-ae0d-ce6ed560db35",	"EQM-IAQ-B06E4");
        deviceIdMap.put("10454b25-152c-4715-8a24-ad7380952dbd",	"EQM-IAQ-B06E5");
        deviceIdMap.put("131d0bcf-e02d-4d36-b65f-53fbf44b9ef9",	"EQM-IAQ-B06E6");
        deviceIdMap.put("44263619-abfb-41c9-b0c6-30bb264d8f5e",	"EQM-IAQ-B06E7");
        deviceIdMap.put("326a7fc3-7c03-41af-a96e-f5fac566a34f",	"EQM-IAQ-B06W1");
        deviceIdMap.put("9afd2372-8d45-4eb1-8415-50402e46fdec",	"EQM-IAQ-B06W2");
        deviceIdMap.put("3a731d0b-73a6-474b-beaa-f0b280e42a5b",	"EQM-IAQ-B06W3");
        deviceIdMap.put("40ceca3a-cbd3-4018-b6a7-29c1b283477c",	"EQM-IAQ-B06W4");
        deviceIdMap.put("7f5e076d-867f-49ce-9b03-4bb8f6e0a6cd",	"EQM-IAQ-B06W5");
        deviceIdMap.put("121e2af8-2039-4cc9-bdca-3935e90993bd",	"EQM-IAQ-B06W6");
        deviceIdMap.put("a92b397b-61ca-4873-90f8-a8a5c980818a",	"EQM-IAQ-B06W7");
        deviceIdMap.put("db944d03-1b69-4bac-b669-e5cac196ec3a",	"EQM-IAQ-B06W8");
        deviceIdMap.put("cf1e3eec-a3c0-4ec8-b450-fefbcbead753",	"EQM-IAQ-B06W9");
        deviceIdMap.put("415ccd54-8249-4ac2-8fab-23079c7ba330",	"EQM-IAQ-B05E1");
        deviceIdMap.put("e09bdb74-8841-4c2e-8f99-0c9d30384b08",	"EQM-IAQ-B05E2");
        deviceIdMap.put("b3e8a937-1e93-4a70-9da5-c4f3bd55a4df",	"EQM-IAQ-B05E3");
        deviceIdMap.put("8bce16b1-3f8c-41dd-8e1e-55652935c0d2",	"EQM-IAQ-B05E4");
        deviceIdMap.put("b9748218-89fb-4535-a517-a96eb299d427",	"EQM-IAQ-B05E5");
        deviceIdMap.put("f315fb2d-3897-4162-a227-fa6829c25ecd",	"EQM-IAQ-B05E6");
        deviceIdMap.put("1fb0739c-ec4c-4329-b22b-730253a73432",	"EQM-IAQ-B05E7");
        deviceIdMap.put("02537a48-4375-44b6-a372-c3d818dd17de",	"EQM-IAQ-B05E8");
        deviceIdMap.put("bc33f684-b782-445e-aad5-7284a8e2ec1e",	"EQM-IAQ-B05E9");
        deviceIdMap.put("58530222-0abf-4797-9779-0b4977f08306",	"EQM-IAQ-B05W1");
        deviceIdMap.put("4a88cd43-0d40-402f-b3e4-ece0ed2bc868",	"EQM-IAQ-B05W2");
        deviceIdMap.put("e15bbf19-669f-41df-8ce6-3b57271ffacb",	"EQM-IAQ-B05W3");
        deviceIdMap.put("c5407366-6148-49df-97cc-907a0d5dfbe5",	"EQM-IAQ-B05W4");
        deviceIdMap.put("22f43885-b238-4eb5-af60-cf98d0effa00",	"EQM-IAQ-B05W5");
        deviceIdMap.put("087a64b5-6e73-4642-9107-780a32fb157f",	"EQM-IAQ-B05W6");
        deviceIdMap.put("1c9b62af-77a3-4ef0-a251-80ba1e19f4e1",	"EQM-IAQ-B05W7");
        deviceIdMap.put("a88af923-8321-4afc-821d-bf7f06551597",	"EQM-IAQ-B05W8");

        //GEMS
        deviceIdMap.put("c3e05c2f-d496-4b20-8e38-4ad0775b1b57",	"EQM-GEM-RF107");
        deviceIdMap.put("10da6a29-39d4-4051-9be8-9da7a4e64a79",	"EQM-GEM-RF108");
        deviceIdMap.put("83a9c138-5e03-4d56-ab03-65662b987c08",	"EQM-GEM-RF109");
        deviceIdMap.put("fe264fed-a48f-4d28-9597-fdf4c3525d3d",	"EQM-GEM-RF110");
        deviceIdMap.put("6c9f9e08-448e-4c0b-a3cc-8b97f520c8e2",	"EQM-GEM-RF111");
        deviceIdMap.put("a5a3ab5f-cb68-41c2-901c-47f49a16adb9",	"EQM-GEM-RF112");
        deviceIdMap.put("39ce02a9-5d61-46cb-b61f-e2520e0d75d9",	"EQM-GEM-RF105");
        deviceIdMap.put("fbf8694e-595e-4cfe-b966-e8c8cda3129a",	"EQM-GEM-RF106");
        deviceIdMap.put("b3f24600-62e2-4f1a-b6bc-ff7e9d7ab904",	"EQM-GEM-RF113");
        deviceIdMap.put("36ddd6ef-0b85-4b1f-8f47-f7483547ef9d",	"EQM-GEM-RF114");
        deviceIdMap.put("e0d5a6e8-a266-4101-901a-95f0527f1dfa",	"EQM-GEM-14099");
        deviceIdMap.put("bb5b0150-8203-4711-b17c-d35fb262ce9f",	"EQM-GEM-14100");
        deviceIdMap.put("f3a6ca02-e181-4174-9d71-6225daf3b909",	"EQM-GEM-14101");
        deviceIdMap.put("dce9cbcf-abdf-4028-88e5-52dc00ddbfd2",	"EQM-GEM-14102");
        deviceIdMap.put("0315ec18-321b-4acb-a276-33ab012dff0b",	"EQM-GEM-14103");
        deviceIdMap.put("bd945e01-e214-4cf5-85fd-5f9ef67038c9",	"EQM-GEM-14104");
        deviceIdMap.put("2a275b16-2bb9-4f8e-be92-638557ed3aee",	"EQM-GEM-12093");
        deviceIdMap.put("c7fbf9fe-e7df-4a0c-ab1f-439332a8025b",	"EQM-GEM-12094");
        deviceIdMap.put("2f1b70c8-a6db-4e72-97b6-47c390c6e2d5",	"EQM-GEM-12095");
        deviceIdMap.put("9ba04e70-f41a-4d4a-9d3e-f234ffcc9872",	"EQM-GEM-12096");
        deviceIdMap.put("1b644797-0dd6-49a2-956c-7eb42579657c",	"EQM-GEM-12097");
        deviceIdMap.put("9d516fff-e435-4bcd-af9b-c13c97f0f645",	"EQM-GEM-12098");
        deviceIdMap.put("5f39c038-d8f7-483e-8252-df086763fb7c",	"EQM-GEM-11087");
        deviceIdMap.put("4690e1af-4302-4358-bbd5-e2931262abd5",	"EQM-GEM-11088");
        deviceIdMap.put("7b4c2218-6cb7-4b12-bfa5-0f8f936a85f3",	"EQM-GEM-11089");
        deviceIdMap.put("637f57e8-aa24-4919-8c8e-42ef7fedd9b6",	"EQM-GEM-11090");
        deviceIdMap.put("850ebb89-62c6-4fbc-bd05-c6d54dd74979",	"EQM-GEM-11091");
        deviceIdMap.put("6376bb4e-f08f-4e83-8b92-52e562399563",	"EQM-GEM-11092");
        deviceIdMap.put("1fa6ef8c-2a2c-4634-8462-3c424c48a75e",	"EQM-GEM-10081");
        deviceIdMap.put("c36d1160-3cda-4976-8414-445eeef72854",	"EQM-GEM-10082");
        deviceIdMap.put("f599ea33-16f8-436d-bbfa-54b817c1aed0",	"EQM-GEM-10083");
        deviceIdMap.put("a9cc080c-4936-4af0-952f-d20605dc544c",	"EQM-GEM-10084");
        deviceIdMap.put("7fd0f034-dbd6-4502-81af-c66847fabca7",	"EQM-GEM-10085");
        deviceIdMap.put("8f6c2134-c469-45c8-b3f9-6b052f7b38ae",	"EQM-GEM-10086");
        deviceIdMap.put("353787dd-0964-48f5-8b20-7cef3ac88d3c",	"EQM-GEM-09075");
        deviceIdMap.put("f3284497-e8f4-423c-aa7b-dbd74dd17a90",	"EQM-GEM-09076");
        deviceIdMap.put("119ea4ad-233b-4b15-9dc3-c4a89b994d08",	"EQM-GEM-09077");
        deviceIdMap.put("bf49e920-6a50-45ca-a6ed-dffb7c019567",	"EQM-GEM-09078");
        deviceIdMap.put("22322507-8abe-447c-9aaf-d674cf1c1eb8",	"EQM-GEM-09079");
        deviceIdMap.put("7c26f334-4f59-4acb-8242-61e7b8f8bf88",	"EQM-GEM-09080");
        deviceIdMap.put("aa528580-ba40-4e35-a460-b8dfc16f7392",	"EQM-GEM-08069");
        deviceIdMap.put("1e5b5c65-de29-4382-b61d-db6b1413872b",	"EQM-GEM-08070");
        deviceIdMap.put("cae4e1a0-21de-4d49-a5d9-69f56bbe341e",	"EQM-GEM-08071");
        deviceIdMap.put("75f2af97-d2f8-4c91-9c7e-46799ebad834",	"EQM-GEM-08072");
        deviceIdMap.put("02c703af-5119-42d1-91f2-9b9e0aec8925",	"EQM-GEM-08073");
        deviceIdMap.put("2b72547f-b36b-460b-98bd-ddc708d9fee7",	"EQM-GEM-08074");
        deviceIdMap.put("6ea5579f-9461-4ffb-86e1-223737f21c4b",	"EQM-GEM-07063");
        deviceIdMap.put("67a20a4c-87bd-4e67-9ec4-c4b90ac31ae0",	"EQM-GEM-07064");
        deviceIdMap.put("97d91f51-fcff-4933-aab7-52676c54b1fb",	"EQM-GEM-07065");
        deviceIdMap.put("f6e26747-ddad-44d1-ad76-a64d3251f68a",	"EQM-GEM-07066");
        deviceIdMap.put("1027ae92-6b1d-47d6-9cdf-639ea9df18dd",	"EQM-GEM-07067");
        deviceIdMap.put("8a5bd33a-5d01-4807-b29f-9f8b5d41c55c",	"EQM-GEM-07068");
        deviceIdMap.put("033b82d9-0ad7-4dbf-991e-9891ea2bf189",	"EQM-GEM-06057");
        deviceIdMap.put("d174c9ce-b1e9-451b-8e06-502460007cea",	"EQM-GEM-06058");
        deviceIdMap.put("af965a49-940d-4db4-9997-1e02cd2e0de3",	"EQM-GEM-06059");
        deviceIdMap.put("c040b693-fc7b-4def-a83d-58b165fb3dfa",	"EQM-GEM-06060");
        deviceIdMap.put("523f367a-fb44-47fe-b49f-e334ed6b7d85",	"EQM-GEM-06061");
        deviceIdMap.put("694a61be-75aa-4d99-b518-4f07d2849ea3",	"EQM-GEM-06062");
        deviceIdMap.put("da6b2323-0aad-4f45-bd5e-a167c22d91aa",	"EQM-GEM-05051");
        deviceIdMap.put("6d0498d9-4907-4dda-84f3-fdcd12662954",	"EQM-GEM-05052");
        deviceIdMap.put("1114ae38-a5bc-40de-a94e-7ad5e791a468",	"EQM-GEM-05053");
        deviceIdMap.put("dbf9af54-5bad-4f33-8f09-9654b6b1bfc6",	"EQM-GEM-05054");
        deviceIdMap.put("3994c12e-8b43-48e1-95b4-25586a9a22f7",	"EQM-GEM-05055");
        deviceIdMap.put("be365f56-5379-4a88-acee-68d6e723c96f",	"EQM-GEM-05056");
        deviceIdMap.put("f3edaad8-71a4-41e2-a6da-5dca4fb83840",	"EQM-GEM-01046");
        deviceIdMap.put("15d18413-2f2e-4541-86d4-e887bb88c41e",	"EQM-GEM-01047");
        deviceIdMap.put("0c35193a-9aa4-4c1e-a66b-40d7304b6c72",	"EQM-GEM-01048");
        deviceIdMap.put("d861695e-a098-4ba8-b617-ef5a0ba5073a",	"EQM-GEM-01049");
        deviceIdMap.put("10695e62-2764-4eae-a2c6-55a026742b69",	"EQM-GEM-01050");
        deviceIdMap.put("0c795fd5-6781-4e2f-87b9-8f1aadb4e804",	"EQM-GEM-B1030");
        deviceIdMap.put("babd0edf-0d20-490f-b02d-6510297b3dbe",	"EQM-GEM-B1031");
        deviceIdMap.put("3b4e187d-9d0f-4bb9-a960-47ddbc6c61e7",	"EQM-GEM-B1036");
        deviceIdMap.put("bf857f46-1f3b-435c-b79b-949e4b89c71a",	"EQM-GEM-B1037");
        deviceIdMap.put("b94f47ec-fffb-405d-9eed-623bb7a09c08",	"EQM-GEM-B2028");
        deviceIdMap.put("0e07817c-0986-4203-adda-b343e51970eb",	"EQM-GEM-B2029");
        deviceIdMap.put("b4d21c6d-61ae-4481-ac44-e529d03c9f9a",	"EQM-GEM-B2034");
        deviceIdMap.put("6338315a-0b2c-4ffb-9b71-1e612b0281ac",	"EQM-GEM-B2035");
        deviceIdMap.put("81a5559c-c3fa-4f7c-b84a-809bbf534b6c",	"EQM-GEM-B2040");
        deviceIdMap.put("4c52b6dc-ce53-4c9c-a090-9f1df86518bf",	"EQM-GEM-B2041");
        deviceIdMap.put("2d3f9e71-056d-45c7-9eb0-cdfeca8e101d",	"EQM-GEM-B2044");
        deviceIdMap.put("c9deb986-ac46-40ba-8ede-47d5dd710408",	"EQM-GEM-B2045");
        deviceIdMap.put("a4f1f4c8-0536-4afd-96c6-69869f6814fd",	"EQM-GEM-B3026");
        deviceIdMap.put("a54fba21-e4ce-4df9-9f1d-8543710dfab9",	"EQM-GEM-B3027");
        deviceIdMap.put("dd08b0bd-4f24-4dc3-96b9-c19c38a884a9",	"EQM-GEM-B3032");
        deviceIdMap.put("d79018f4-1f5a-4889-ad2a-faa72c7d18f6",	"EQM-GEM-B3033");
        deviceIdMap.put("abf6b74c-8433-4097-acd6-fcfaac725724",	"EQM-GEM-B3038");
        deviceIdMap.put("78320a30-4d10-4d5d-ba3b-c3b386685d75",	"EQM-GEM-B3039");
        deviceIdMap.put("18482434-8f7a-46da-b5ce-4a164a7b50a1",	"EQM-GEM-B3042");
        deviceIdMap.put("77f83115-62ff-436d-882d-4fc5be6536fc",	"EQM-GEM-B3043");
        deviceIdMap.put("ae81e67f-c09b-49b2-b922-bf48af4edd82",	"EQM-GEM-B3025");
        deviceIdMap.put("1f1cb54b-d147-4a6a-9341-d0c9100087d2",	"EQM-GEM-B4006");
        deviceIdMap.put("b57d7eca-b8e1-4fa3-8c3e-3f7c6fcc632d",	"EQM-GEM-B4007");
        deviceIdMap.put("2cf9554e-dc6a-4c36-b0c0-8d19cb2e73ae",	"EQM-GEM-B4008");
        deviceIdMap.put("f823f041-8c3b-4e6b-a623-71caa705e639",	"EQM-GEM-B4009");
        deviceIdMap.put("06496332-79dc-4733-a66b-2348eb978a40",	"EQM-GEM-B4001");
        deviceIdMap.put("fc46bdc7-32db-4c55-bea4-7150a855f73b",	"EQM-GEM-B4002");
        deviceIdMap.put("5ac0e9e4-5bf8-408e-a390-70011a7d7174",	"EQM-GEM-B4003");
        deviceIdMap.put("f8ce93fd-ae75-41ad-b70a-2133b1c9c859",	"EQM-GEM-B4004");
        deviceIdMap.put("ccd77fc7-2d8c-4144-9170-f4f172075a3c",	"EQM-GEM-B4010");
        deviceIdMap.put("e39bd835-2208-4f50-a33a-4aae09ce9ee0",	"EQM-GEM-B4011");
        deviceIdMap.put("f57e9a1b-3299-41d6-98af-13b1099d96db",	"EQM-GEM-B4012");
        deviceIdMap.put("df9c66c6-39fd-41a6-8cc3-3f6a61894379",	"EQM-GEM-B4013");
        deviceIdMap.put("3d1467b2-1799-4b33-b825-d9aaca0cda40",	"EQM-GEM-B4014");
        deviceIdMap.put("34e62438-080e-4a0b-9236-7eab2da466e2",	"EQM-GEM-B4015");
        deviceIdMap.put("6b6b86de-0497-4720-bf36-7e5ae7597649",	"EQM-GEM-B4016");
        deviceIdMap.put("eb81aba0-9c46-4775-8ced-e4fbf79c675f",	"EQM-GEM-B4017");
        deviceIdMap.put("d079713c-b59f-407a-be9a-24362e678775",	"EQM-GEM-B4018");
        deviceIdMap.put("71884607-f355-4cfc-9a32-59a7cdb3c957",	"EQM-GEM-B4019");
        deviceIdMap.put("10e7dbe4-4001-437f-93c2-b58d3b517a80",	"EQM-GEM-B4020");
        deviceIdMap.put("850b86ca-1eb9-4fb2-b25f-67bd7f4fe665",	"EQM-GEM-B4021");
        deviceIdMap.put("ecbd004e-9b3a-42a4-bbca-d325fafb6af7",	"EQM-GEM-B4022");
        deviceIdMap.put("0ca09b01-795d-4c99-a086-d8d3edef1d26",	"EQM-GEM-B4024");
        deviceIdMap.put("8afa77b5-3608-4e14-8f12-a67b204448ca",	"EQM-GEM-B4023");
        deviceIdMap.put("7d80c5a0-7e22-4c89-8e7e-9b38b820969a",	"EQM-GEM-B4005");

        unitCodeMap = new HashMap<>();
        unitCodeMap.put("mmAq", "MMAQ");
        unitCodeMap.put("m3/hr", "M3H");
        unitCodeMap.put("ppb", "61");
        unitCodeMap.put("kwh", "KWH");
        unitCodeMap.put("㎍/㎥", "MGM3");
        unitCodeMap.put("cmh", "CMH");
        unitCodeMap.put("lux", "LUX");
        unitCodeMap.put("ppm", "59");
        unitCodeMap.put("celsius", "CEL");
        unitCodeMap.put("℃", "CEL");
        unitCodeMap.put("kcal/hr", "E15");
        unitCodeMap.put("%", "P1");
        unitCodeMap.put("lpm", "L2");
        unitCodeMap.put("nm3/hr", "NM3H");
        unitCodeMap.put("kg/cm^2", "E42");
        unitCodeMap.put("kg/hr", "KGH");
        unitCodeMap.put("cop", "COP");
        unitCodeMap.put("kw", "KWT");

        pipeCodes = new ArrayList<>();

        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 30; i++) {
            if ( i == 5 || i == 11) {
//                1차측 냉수 메인 배관, Tower B 냉수 말단 공급 배관 생략
                continue;
            }
            sb.setLength(0);
            sb.append(i);
            while (sb.length() < 5) {
                sb.insert(0, "0");
            }
            pipeCodes.add("PPS-CDW-" + sb);
        }

        for (int i = 1; i <= 32; i++) {
//            if ( i == 2 ) {
//                //1차측 메인 배관 생략
//                continue;
//            }
            sb.setLength(0);
            sb.append(i);
            while (sb.length() < 5) {
                sb.insert(0, "0");
            }
            pipeCodes.add("PPR-CDW-" + sb);
        }

        for (int i = 1; i <= 5; i++) {
            sb.setLength(0);
            sb.append(i);
            while (sb.length() < 5) {
                sb.insert(0, "0");
            }
            pipeCodes.add("PPS-GAS-" + sb);
        }

        for (int i = 1; i <= 25; i++) {
//            if ( i == 26 ) {
//                //냉각수(PAC용) 말단 환수배관 생략
//                continue;
//            }
            sb.setLength(0);
            sb.append(i);
            while (sb.length() < 5) {
                sb.insert(0, "0");
            }
            pipeCodes.add("PPR-CLW-" + sb);
        }

        for (int i = 1; i <= 19; i++) {
            if ( i == 15 ) {
                //냉각수 메인 공급 배관 생략
                continue;
            }
            sb.setLength(0);
            sb.append(i);
            while (sb.length() < 5) {
                sb.insert(0, "0");
            }
            pipeCodes.add("PPS-CLW-" + sb);
        }

        ductCodes = new ArrayList<>();
        ductCodes.add("DUC-OAD-00001");
        ductCodes.add("DUC-OAD-00002");
        ductCodes.add("DUC-OAD-00003");
        ductCodes.add("DUC-EAD-00001");
        ductCodes.add("DUC-EAD-00002");
        ductCodes.add("DUC-EAD-00003");
        ductCodes.add("DUC-SAD-00001");
        ductCodes.add("DUC-SAD-00002");
        ductCodes.add("DUC-SAD-00003");
        ductCodes.add("DUC-SAD-00004");
        ductCodes.add("DUC-SAD-00005");
        ductCodes.add("DUC-SAD-00006");
        ductCodes.add("DUC-SAD-00007");
        ductCodes.add("DUC-SAD-00008");
        ductCodes.add("DUC-SAD-00009");
        ductCodes.add("DUC-RAD-00001");
        ductCodes.add("DUC-RAD-00002");
        ductCodes.add("DUC-RAD-00003");
        ductCodes.add("DUC-RAD-00004");
        ductCodes.add("DUC-RAD-00005");
        ductCodes.add("DUC-RAD-00006");
        ductCodes.add("DUC-RAD-00007");
        ductCodes.add("DUC-RAD-00008");
        ductCodes.add("DUC-RAD-00009");

        coolingWaterPumpCodes = new HashSet<>();
        coolingWaterPumpCodes.add("EQM-PUM-0115A");
        coolingWaterPumpCodes.add("EQM-PUM-0115B");
        coolingWaterPumpCodes.add("EQM-PUM-0114A");
        coolingWaterPumpCodes.add("EQM-PUM-0114B");
        coolingWaterPumpCodes.add("EQM-PUM-0114C");
        coolingWaterPumpCodes.add("EQM-PUM-0114D");
        coolingWaterPumpCodes.add("EQM-PUM-0118A");
        coolingWaterPumpCodes.add("EQM-PUM-0118B");
        coolingWaterPumpCodes.add("EQM-PUM-0118C");

        chilledWaterPumpCodes = new HashSet<>();
        chilledWaterPumpCodes.add("EQM-PUM-0113A");
        chilledWaterPumpCodes.add("EQM-PUM-0113B");
        chilledWaterPumpCodes.add("EQM-PUM-0111A");
        chilledWaterPumpCodes.add("EQM-PUM-0111B");
        chilledWaterPumpCodes.add("EQM-PUM-0111C");
        chilledWaterPumpCodes.add("EQM-PUM-0111D");
        chilledWaterPumpCodes.add("EQM-PUM-0112A");
        chilledWaterPumpCodes.add("EQM-PUM-0112B");
    }

    public static String getBuildingId(String buildingId) {
        if ( buildingIdMap.containsKey(buildingId) ) {
            return buildingIdMap.get(buildingId);
        } else {
            throw new RuntimeException(buildingId + " not exist.");
        }
    }

    public static String getFloorId(String floorId) {
        if ( floorIdMap.containsKey(floorId) ) {
            return floorIdMap.get(floorId);
        } else {
            throw new RuntimeException(floorId + " not exist.");
        }
    }

    public static String getZoneId(String zoneId) {
        if ( zoneIdMap.containsKey(zoneId) ) {
            return zoneIdMap.get(zoneId);
        } else {
            throw new RuntimeException(zoneId + " not exist.");
        }
    }

    public static String getRoomCode(String roomId) {
        return roomIdMap.get(roomId);
    }

    public static List<String> getDeviceCodeList(String deviceId) {
        return List.of(deviceIdMap.get(deviceId));
    }

    public static String getRandomFloorCode() {
        List<String> list = floorIdMap.values().stream().toList();
        int index = new Random().nextInt(18 + 1);
        return list.get(index);
    }

    public static String getUnitCode(String orgin) {
        return unitCodeMap.get(orgin);
    }
}
