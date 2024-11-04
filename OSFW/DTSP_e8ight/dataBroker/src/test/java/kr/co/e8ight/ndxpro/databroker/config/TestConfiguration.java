package kr.co.e8ight.ndxpro.databroker.config;

public class TestConfiguration {

    public static final String testEntityString = "{\n" +
            "      \"_id\": {\n" +
            "        \"id\": \"urn:e8ight:SimulationVehicle:1010\",\n" +
            "        \"type\": \"SimulationVehicle\",\n" +
            "        \"servicePath\": \"UOS\"\n" +
            "      },\n" +
            "      \"attrNames\": {\n" +
            "        \"vehicleType\": \"e8ight:vehicleType\",\n" +
            "        \"speed\": \"e8ight:speed\",\n" +
            "        \"linkTo\": \"e8ight:linkTo\",\n" +
            "        \"lane\": \"e8ight:lane\",\n" +
            "        \"orgLocation\": \"e8ight:orgLocation\",\n" +
            "        \"location\": \"ngsi-ld:location\",\n" +
            "        \"destination\": \"e8ight:destination\",\n" +
            "        \"scenarioId\": \"e8ight:scenarioId\",\n" +
            "        \"scenarioType\": \"e8ight:scenarioType\"\n" +
            "      },\n" +
            "      \"attrs\": [\n" +
            "        {\n" +
            "          \"name\": \"vehicleType\",\n" +
            "          \"type\": \"Property\",\n" +
            "          \"value\": \"car\"\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"speed\",\n" +
            "          \"type\": \"Property\",\n" +
            "          \"value\": 50.2541763970735,\n" +
            "          \"mdNames\": {\n" +
            "            \"unitCode\": \"ngsi-ld:unitCode\",\n" +
            "            \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "          },\n" +
            "          \"md\": [\n" +
            "            {\n" +
            "              \"name\": \"unitCode\",\n" +
            "              \"value\": \"KMH\"\n" +
            "            },\n" +
            "            {\n" +
            "              \"name\": \"observedAt\",\n" +
            "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
            "            }\n" +
            "          ]\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"linkTo\",\n" +
            "          \"type\": \"Relationship\",\n" +
            "          \"value\": \"urn:e8ight:Link:86\"\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"lane\",\n" +
            "          \"type\": \"Property\",\n" +
            "          \"value\": 1\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"scenarioId\",\n" +
            "          \"type\": \"Property\",\n" +
            "          \"value\": 1\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"scenarioType\",\n" +
            "          \"type\": \"Property\",\n" +
            "          \"value\": \"RTSC\"\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"orgLocation\",\n" +
            "          \"type\": \"GeoProperty\",\n" +
            "          \"value\": {\n" +
            "            \"type\": \"Point\",\n" +
            "            \"coordinates\": [\n" +
            "              -20044926.090140723,\n" +
            "              -4729197.746368586\n" +
            "            ]\n" +
            "          },\n" +
            "          \"mdNames\": {\n" +
            "            \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "          },\n" +
            "          \"md\": [\n" +
            "            {\n" +
            "              \"name\": \"observedAt\",\n" +
            "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
            "            }\n" +
            "          ]\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"location\",\n" +
            "          \"type\": \"GeoProperty\",\n" +
            "          \"value\": {\n" +
            "            \"type\": \"Point\",\n" +
            "            \"coordinates\": [\n" +
            "              -20044926.090140723,\n" +
            "              -4729197.746368586\n" +
            "            ]\n" +
            "          },\n" +
            "          \"mdNames\": {\n" +
            "            \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "          },\n" +
            "          \"md\": [\n" +
            "            {\n" +
            "              \"name\": \"observedAt\",\n" +
            "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
            "            }\n" +
            "          ]\n" +
            "        },\n" +
            "        {\n" +
            "          \"name\": \"destination\",\n" +
            "          \"type\": \"GeoProperty\",\n" +
            "          \"value\": {\n" +
            "            \"type\": \"Point\",\n" +
            "            \"coordinates\": [\n" +
            "              -20044934.031399086,\n" +
            "              -4729207.305211626\n" +
            "            ]\n" +
            "          },\n" +
            "          \"mdNames\": {\n" +
            "            \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "          },\n" +
            "          \"md\": [\n" +
            "            {\n" +
            "              \"name\": \"observedAt\",\n" +
            "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
            "            }\n" +
            "          ]\n" +
            "        }\n" +
            "      ],\n" +
            "      \"@context\": \"http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld\"\n" +
            "    }";

    public static final String testEntityDtoString = "{\n" +
            "        \"id\": \"urn:e8ight:SimulationVehicle:1010\",\n" +
            "        \"type\": \"SimulationVehicle\",\n" +
            "        \"@context\": \"http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld\",\n" +
            "        \"vehicleType\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": \"car\"\n" +
            "        },\n" +
            "        \"speed\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 50.2541763970735,\n" +
            "            \"unitCode\": \"KMH\",\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\",\n" +
            "            \"verify\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": true\n" +
            "            }\n" +
            "        },\n" +
            "        \"linkTo\": {\n" +
            "            \"type\": \"Relationship\",\n" +
            "            \"object\": \"urn:e8ight:Link:86\"\n" +
            "        },\n" +
            "        \"lane\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 1\n" +
            "        },\n" +
            "        \"scenarioId\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 1\n" +
            "        },\n" +
            "        \"scenarioType\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": \"RTSC\"\n" +
            "        },\n" +
            "        \"orgLocation\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044926090140723E7,\n" +
            "                    -4729197.746368586\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        },\n" +
            "        \"location\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044926090140723E7,\n" +
            "                    -4729197.746368586\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        },\n" +
            "        \"destination\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044934031399086E7,\n" +
            "                    -4729207.305211626\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        }\n" +
            "    }";

    public static final String testEntityDtoWithProviderString = "{\n" +
            "\"provider\" : \"UOS\","+
            "\"entity\" : {"+
            "        \"id\": \"urn:e8ight:SimulationVehicle:1010\",\n" +
            "        \"type\": \"SimulationVehicle\",\n" +
            "        \"@context\": \"http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld\",\n" +
            "        \"vehicleType\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": \"car\"\n" +
            "        },\n" +
            "        \"speed\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 50.2541763970735,\n" +
            "            \"unitCode\": \"KMH\",\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\",\n" +
            "            \"verify\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": true\n" +
            "            }\n" +
            "        },\n" +
            "        \"linkTo\": {\n" +
            "            \"type\": \"Relationship\",\n" +
            "            \"object\": \"urn:e8ight:Link:86\"\n" +
            "        },\n" +
            "        \"lane\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 1\n" +
            "        },\n" +
            "        \"scenarioId\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": 1\n" +
            "        },\n" +
            "        \"scenarioType\": {\n" +
            "            \"type\": \"Property\",\n" +
            "            \"value\": \"RTSC\"\n" +
            "        },\n" +
            "        \"orgLocation\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044926090140723E7,\n" +
            "                    -4729197.746368586\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        },\n" +
            "        \"location\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044926090140723E7,\n" +
            "                    -4729197.746368586\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        },\n" +
            "        \"destination\": {\n" +
            "            \"type\": \"GeoProperty\",\n" +
            "            \"value\": {\n" +
            "                \"type\": \"Point\",\n" +
            "                \"coordinates\": [\n" +
            "                    -2.0044934031399086E7,\n" +
            "                    -4729207.305211626\n" +
            "                ]\n" +
            "            },\n" +
            "            \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "        }\n" +
            "    }" +
            "}";

    public static final String testIoTEntityDtoString = "{\n" +
            "        \"historyId\": \"640fc7bd564f7778f58f1a9f\",\n" +
            "        \"observedAt\": \"2023-03-14T10:00:59.285\",\n" +
            "        \"provider\": \"UOS\",\n" +
            "        \"entity\": {\n" +
            "            \"id\": \"urn:e8ight:SimulationVehicle:1010\",\n" +
            "            \"type\": \"SimulationVehicle\",\n" +
            "            \"@context\": \"http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld\",\n" +
            "            \"vehicleType\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": \"car\"\n" +
            "            },\n" +
            "            \"speed\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": 50.2541763970735,\n" +
            "                \"unitCode\": \"KMH\",\n" +
            "                \"observedAt\": \"2023-03-14T10:00:59.285\",\n" +
            "                \"verify\": {\n" +
            "                    \"type\": \"Property\",\n" +
            "                    \"value\": true\n" +
            "                }\n" +
            "            },\n" +
            "            \"linkTo\": {\n" +
            "                \"type\": \"Relationship\",\n" +
            "                \"object\": \"urn:e8ight:Link:86\"\n" +
            "            },\n" +
            "            \"lane\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": 1\n" +
            "            },\n" +
            "            \"scenarioId\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": 1\n" +
            "            },\n" +
            "            \"scenarioType\": {\n" +
            "                \"type\": \"Property\",\n" +
            "                \"value\": \"RTSC\"\n" +
            "            },\n" +
            "            \"orgLocation\": {\n" +
            "                \"type\": \"GeoProperty\",\n" +
            "                \"value\": {\n" +
            "                    \"type\": \"Point\",\n" +
            "                    \"coordinates\": [\n" +
            "                        -2.0044926090140723E7,\n" +
            "                        -4729197.746368586\n" +
            "                    ]\n" +
            "                },\n" +
            "                \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "            },\n" +
            "            \"location\": {\n" +
            "                \"type\": \"GeoProperty\",\n" +
            "                \"value\": {\n" +
            "                    \"type\": \"Point\",\n" +
            "                    \"coordinates\": [\n" +
            "                        -2.0044926090140723E7,\n" +
            "                        -4729197.746368586\n" +
            "                    ]\n" +
            "                },\n" +
            "                \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "            },\n" +
            "            \"destination\": {\n" +
            "                \"type\": \"GeoProperty\",\n" +
            "                \"value\": {\n" +
            "                    \"type\": \"Point\",\n" +
            "                    \"coordinates\": [\n" +
            "                        -2.0044934031399086E7,\n" +
            "                        -4729207.305211626\n" +
            "                    ]\n" +
            "                },\n" +
            "                \"observedAt\": \"2023-03-14T10:00:59.285\"\n" +
            "            }\n" +
            "        }\n" +
            "    }";

    public static final String testDataModelString = "{\n" +
            "  \"id\": \"urn:e8ight:SimulationVehicle:\",\n" +
            "  \"type\": \"SimulationVehicle\",\n" +
            "  \"title\": \"NDX-PRO - Simulation Vehicle DataModel\",\n" +
            "  \"description\": \"VISSIM Simulation Vehicle\",\n" +
            "  \"attributeNames\": {\n" +
            "    \"destination\": \"e8ight:destination\",\n" +
            "    \"location\": \"ngsi-ld:location\",\n" +
            "    \"linkTo\": \"e8ight:linkTo\",\n" +
            "    \"lane\": \"e8ight:lane\",\n" +
            "    \"orgLocation\": \"e8ight:orgLocation\",\n" +
            "    \"speed\": \"e8ight:speed\",\n" +
            "    \"vehicleType\": \"e8ight:vehicleType\",\n" +
            "    \"scenarioId\": \"e8ight:scenarioId\",\n" +
            "    \"scenarioType\": \"e8ight:scenarioType\"\n" +
            "  },\n" +
            "  \"attributes\": {\n" +
            "    \"linkTo\": {\n" +
            "      \"type\": \"Relationship\",\n" +
            "      \"description\": \"Relationship. The ID of the link or connector individually in place.\",\n" +
            "      \"valueType\": \"String\",\n" +
            "      \"modelType\": [\n" +
            "        \"e8ight:Link\"\n" +
            "      ]\n" +
            "    },\n" +
            "    \"destination\": {\n" +
            "      \"type\": \"GeoProperty\",\n" +
            "      \"description\": \"GeoProperty. It means the direction of the vehicle.\",\n" +
            "      \"valueType\": \"POINT\",\n" +
            "      \"format\": \"GeoJSON\",\n" +
            "      \"childAttributeNames\": {\n" +
            "        \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "      },\n" +
            "      \"childAttributes\": {\n" +
            "        \"observedAt\": {\n" +
            "          \"valueType\": \"String\",\n" +
            "          \"format\": \"DateTime\"\n" +
            "        }\n" +
            "      }\n" +
            "    },\n" +
            "    \"orgLocation\": {\n" +
            "      \"type\": \"GeoProperty\",\n" +
            "      \"description\": \"GeoProperty. Original vehicle location\",\n" +
            "      \"valueType\": \"POINT\",\n" +
            "      \"format\": \"GeoJSON\",\n" +
            "      \"childAttributeNames\": {\n" +
            "        \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "      },\n" +
            "      \"childAttributes\": {\n" +
            "        \"observedAt\": {\n" +
            "          \"valueType\": \"String\",\n" +
            "          \"format\": \"DateTime\"\n" +
            "        }\n" +
            "      }\n" +
            "    },\n" +
            "    \"location\": {\n" +
            "      \"type\": \"GeoProperty\",\n" +
            "      \"description\": \"GeoProperty. Geojson reference to the item.\",\n" +
            "      \"valueType\": \"POINT\",\n" +
            "      \"format\": \"GeoJSON\",\n" +
            "      \"childAttributeNames\": {\n" +
            "        \"observedAt\": \"ngsi-ld:observedAt\"\n" +
            "      },\n" +
            "      \"childAttributes\": {\n" +
            "        \"observedAt\": {\n" +
            "          \"valueType\": \"String\",\n" +
            "          \"format\": \"DateTime\"\n" +
            "        }\n" +
            "      }\n" +
            "    },\n" +
            "    \"scenarioId\": {\n" +
            "      \"type\": \"Property\",\n" +
            "      \"description\": \"VISSIM 시나리오 숫자 ID 값\",\n" +
            "      \"valueType\": \"Integer\",\n" +
            "      \"valid\": {}\n" +
            "    },\n" +
            "    \"lane\": {\n" +
            "      \"type\": \"Property\",\n" +
            "      \"description\": \"Property. The lane of a vehicle.\",\n" +
            "      \"valueType\": \"Integer\",\n" +
            "      \"valid\": {\n" +
            "        \"minimum\": 1,\n" +
            "        \"maximum\": 20\n" +
            "      }\n" +
            "    },\n" +
            "    \"speed\": {\n" +
            "      \"type\": \"Property\",\n" +
            "      \"description\": \"Property. Current direction of the vehicle.\",\n" +
            "      \"valueType\": \"Double\",\n" +
            "      \"valid\": {\n" +
            "        \"minimum\": 0,\n" +
            "        \"maximum\": 500\n" +
            "      },\n" +
            "      \"childAttributeNames\": {\n" +
            "        \"observedAt\": \"ngsi-ld:observedAt\",\n" +
            "        \"unitCode\": \"ngsi-ld:unitCode\"\n" +
            "      },\n" +
            "      \"childAttributes\": {\n" +
            "        \"observedAt\": {\n" +
            "          \"valueType\": \"String\",\n" +
            "          \"format\": \"DateTime\"\n" +
            "        },\n" +
            "        \"unitCode\": {\n" +
            "          \"valueType\": \"String\",\n" +
            "          \"type\": \"speed\",\n" +
            "          \"enum\": [\n" +
            "            \"MTS\",\n" +
            "            \"M60\",\n" +
            "            \"M62\",\n" +
            "            \"KMH\",\n" +
            "            \"IU\"\n" +
            "          ],\n" +
            "          \"format\": \"UN/CEFACT\"\n" +
            "        }\n" +
            "      }\n" +
            "    },\n" +
            "    \"vehicleType\": {\n" +
            "      \"type\": \"Property\",\n" +
            "      \"description\": \"Property. Type of vehicle from the point of view of its structural characteristics.\",\n" +
            "      \"valueType\": \"String\",\n" +
            "      \"valid\": {\n" +
            "        \"minLength\": 1,\n" +
            "        \"maxLength\": 256\n" +
            "      },\n" +
            "      \"enum\": [\n" +
            "        \"bus\",\n" +
            "        \"truck\",\n" +
            "        \"car\",\n" +
            "        \"bike\",\n" +
            "        \"sedan\"\n" +
            "      ]\n" +
            "    },\n" +
            "    \"scenarioType\": {\n" +
            "      \"type\": \"Property\",\n" +
            "      \"description\": \"VISSIM scenario ID\",\n" +
            "      \"valueType\": \"String\",\n" +
            "      \"valid\": {}\n" +
            "    }\n" +
            "  },\n" +
            "  \"required\": [\n" +
            "    \"speed\"\n" +
            "  ],\n" +
            "  \"isUsing\": false,\n" +
            "  \"isDynamic\": true,\n" +
            "  \"isReady\": true\n" +
            "}";
}