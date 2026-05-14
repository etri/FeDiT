var data1 = {
    "curPage": 1,
    "pageListSize": 10,
    "startIndex": 0,
    "totalListSize": 7,
    "totalPage": 1,
    "limitListSize": 2000,
    "arrayDataLimit": 200,
    "objectRefFormat": "object",
    "data": [
        {
            "dtid": "KR-01-A01121-20250002",
            "type": "연합",
            "name": "채소 트윈",
            "description": "채소 트윈",
            "owner": null,
            "contactPoint": null,
            "creator": null,
            "creationTime": null,
            "modificationTime": null,
            "subjects": null,
            "keywords": null,
            "location": null,
            "pointOfAccess": null,
            "digitalTwinObjects": null,
            "sensors": null,
            "controllers": null,
            "simulations": null,
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "01",
            "classificationCode": "A01121"
        },
        {
            "dtid": "KR-01-C21101-20250001",
            "type": "단일",
            "name": "화합물 분야 디지털 트윈",
            "description": "화합물 분야 디지털 트윈",
            "owner": null,
            "contactPoint": null,
            "creator": null,
            "creationTime": null,
            "modificationTime": null,
            "subjects": null,
            "keywords": [
                "화합물",
                "안전"
            ],
            "location": null,
            "pointOfAccess": null,
            "digitalTwinObjects": null,
            "sensors": null,
            "controllers": null,
            "simulations": null,
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "01",
            "classificationCode": "C21101"
        },
        {
            "dtid": "KR-01-M70130-20260001",
            "type": "연합",
            "name": "자연과학 및 공학 융합 연구개발 연합 트윈",
            "description": "자연과학 및 공학 융합 연구개발업력의 디지털 트윈을 관리하는 테스트 연합 트윈",
            "owner": "KETI",
            "contactPoint": "031-789-7000",
            "creator": "KETI",
            "creationTime": "2026-01-15T10:00:00.000000+09:00",
            "modificationTime": null,
            "subjects": [
                "연합",
                "융합"
            ],
            "keywords": null,
            "location": null,
            "pointOfAccess": "http://[META API URL]/meta/digitalTwins/KR-01-M70130-20260001",
            "digitalTwinObjects": [
                {
                    "name": "테스트 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0056",
                    "keywords": [
                        "날씨",
                        "예보",
                        "미세먼지",
                        "안전"
                    ],
                    "subjects": [
                        "기상",
                        "날씨",
                        "대기정보"
                    ],
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=142",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                }
            ],
            "sensors": [
                "7lrhY-8ioJL2-wgU4d-xaIByW"
            ],
            "controllers": null,
            "simulations": null,
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "01",
            "classificationCode": "M70130"
        },
        {
            "dtid": "KR-01-R90191-20250001",
            "type": "단일",
            "name": "공연안전 디지털 트윈",
            "description": "공연안전 디지털 트윈",
            "owner": null,
            "contactPoint": null,
            "creator": null,
            "creationTime": null,
            "modificationTime": null,
            "subjects": null,
            "keywords": [
                "공연",
                "안전"
            ],
            "location": null,
            "pointOfAccess": null,
            "digitalTwinObjects": null,
            "sensors": null,
            "controllers": null,
            "simulations": null,
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "01",
            "classificationCode": "R90191"
        },
        {
            "dtid": "KR-02-C20000-20250001",
            "type": "단일",
            "name": "교통 디지털 트윈",
            "description": "제주도 도로교통 상황을 알려주는 디지털 트윈",
            "owner": "제주관광공사",
            "contactPoint": "064-740-6000~1",
            "creator": "제주관광공사",
            "creationTime": "2024-03-04T05:00:00.000000+09:00",
            "modificationTime": "2024-03-04T05:00:00.000000+09:00",
            "subjects": [
                "교통"
            ],
            "keywords": [
                "교통",
                "도로",
                "안전"
            ],
            "location": {
                "type": "MultiPoint",
                "coordinates": [
                    [
                        126.532371,
                        33.500116
                    ],
                    [
                        126.500055,
                        33.48863
                    ],
                    [
                        126.64412,
                        33.539831
                    ],
                    [
                        126.268778,
                        33.409109
                    ],
                    [
                        126.57045614,
                        33.51733013
                    ],
                    [
                        126.56506,
                        33.246244
                    ],
                    [
                        126.91007,
                        33.460229
                    ],
                    [
                        126.715115,
                        33.2843415
                    ],
                    [
                        126.489923,
                        33.2508702
                    ],
                    [
                        126.2473589,
                        33.2277489
                    ],
                    [
                        126.4746922,
                        33.4838002
                    ],
                    [
                        126.162165,
                        33.292471
                    ]
                ]
            },
            "pointOfAccess": "http://[KETI SYNC ENGINE API URL]/fedit/v1/digital-twins/KR-02-C20000-20250001",
            "digitalTwinObjects": [
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0002",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "lUQuX-xDfJ1g-kpEub-eZ_HaG"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.313754&longitude=126.5714914",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0003",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "Qr29Z-F8XGzM-MUb8S-LTR0ga"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.25022&longitude=126.27838",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0004",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "qtKXK-OQ8IUo-8hlEO-qkXEiJ"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.25099&longitude=126.41689",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0005",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "aw5vD-eDrHNo-lwI8z-raT7Xd"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.3402&longitude=126.47921",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0006",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "TncW3-g0PHJk-5gczN-PESjqI"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.39223&longitude=126.49457",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0007",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "qN5uY-V3DIFk-CHXiw-yyFwvH"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "<http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.23834&longitude=126.42586",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0008",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "iFF8c-67gICo-N3wcD-wEDUc9"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.271523&longitude=126.60766",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0009",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "V88yb-mlsJ~c-F7~TP-vOj6Zb"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.45307315&longitude=126.7235079",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0010",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "yYvsF-~EVHQE-TmuQn-FMl3k5"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.5548185&longitude=126.7969015",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0011",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "fqNU4-6DnIZc-FktTt-1a2WxY"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.491318&longitude=126.811386",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0012",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "G7N15-6G4Ha6-2rs0l-D73Jv9"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=3000&latitude=33.37372&longitude=126.59245",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0013",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "BU94l-dxMJl6-IObVD-rbx3zN"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.462147&longitude=126.936424",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0014",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "vPnSN-GjvG~M-iWyr6-1jXVLK"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.2334272&longitude=126.313741",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0015",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "qR7rE-FtJIkE-cEC1x-17NnqJ"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.244854&longitude=126.5718",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0016",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "AxFYD-xeNHEM-wrXhs-0INEGL"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.514103&longitude=126.52193",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0017",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "3AA8~-3sPG9Y-QSniE-jNK~pb"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.500607&longitude=126.65108",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0018",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "6qn4w-f10G12-klk6O-QWHyKN"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.2447173&longitude=126.5598201",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0019",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "aUGBp-f1RI7o-uRDdI-Gt_aEW"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.469604&longitude=126.4918",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                },
                {
                    "name": "교통 디지털 트윈 객체",
                    "dtoid": "KR-104111-0020",
                    "keywords": [
                        "교통",
                        "도로"
                    ],
                    "subjects": [
                        "교통"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 도로교통 상황을 알려주는 디지털 객체",
                    "creationTime": null,
                    "modificationTime": null,
                    "relatedSensors": [
                        "Oo6Yo-MqoIHY-d9Ktv-tjU~Q2"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:18080/api/data/traffic?radial_distance=1000&latitude=33.452126&longitude=126.407455",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "trafficMeasurement"
                            ],
                            "properties": {
                                "trafficMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "tfvl",
                                                    "speed",
                                                    "link_id",
                                                    "trvl_hh",
                                                    "date_time",
                                                    "measure_position_id"
                                                ],
                                                "properties": {
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "trvl_hh": {
                                                        "type": "number"
                                                    },
                                                    "tfvl": {
                                                        "type": "number"
                                                    },
                                                    "speed": {
                                                        "type": "number"
                                                    },
                                                    "link_id": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "04111"
                }
            ],
            "sensors": [
                "ft71M-YOcIV6-J9QaP-ltCPaL",
                "lUQuX-xDfJ1g-kpEub-eZ_HaG",
                "Qr29Z-F8XGzM-MUb8S-LTR0ga",
                "iFF8c-67gICo-N3wcD-wEDUc9",
                "qtKXK-OQ8IUo-8hlEO-qkXEiJ",
                "aw5vD-eDrHNo-lwI8z-raT7Xd",
                "TncW3-g0PHJk-5gczN-PESjqI",
                "qN5uY-V3DIFk-CHXiw-yyFwvH",
                "V88yb-mlsJ~c-F7~TP-vOj6Zb",
                "yYvsF-~EVHQE-TmuQn-FMl3k5",
                "fqNU4-6DnIZc-FktTt-1a2WxY",
                "G7N15-6G4Ha6-2rs0l-D73Jv9",
                "BU94l-dxMJl6-IObVD-rbx3zN",
                "vPnSN-GjvG~M-iWyr6-1jXVLK",
                "qR7rE-FtJIkE-cEC1x-17NnqJ",
                "AxFYD-xeNHEM-wrXhs-0INEGL",
                "3AA8~-3sPG9Y-QSniE-jNK~pb",
                "6qn4w-f10G12-klk6O-QWHyKN",
                "aUGBp-f1RI7o-uRDdI-Gt_aEW",
                "Oo6Yo-MqoIHY-d9Ktv-tjU~Q2"
            ],
            "controllers": null,
            "simulations": [
                "rIvmh-wdJGCE-4_0a1-kgYutK"
            ],
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "02",
            "classificationCode": "C20000"
        },
        {
            "dtid": "KR-02-K10000-20250001",
            "type": "단일",
            "name": "환경 디지털 트윈",
            "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 트윈",
            "owner": "제주지방기상청",
            "contactPoint": "064-909-3900",
            "creator": null,
            "creationTime": "2024-03-04T05:00:00.000000+09:00",
            "modificationTime": "2024-03-04T05:00:00.000000+09:00",
            "subjects": [
                "기상",
                "날씨",
                "대기정보"
            ],
            "keywords": [
                "날씨",
                "예보",
                "미세먼지",
                "안전"
            ],
            "location": {
                "type": "MultiPoint",
                "coordinates": [
                    [
                        126.532371,
                        33.500116
                    ],
                    [
                        126.500055,
                        33.48863
                    ],
                    [
                        126.64412,
                        33.539831
                    ],
                    [
                        126.268778,
                        33.409109
                    ],
                    [
                        126.57045614,
                        33.51733013
                    ],
                    [
                        126.56506,
                        33.246244
                    ],
                    [
                        126.91007,
                        33.460229
                    ],
                    [
                        126.715115,
                        33.2843415
                    ],
                    [
                        126.489923,
                        33.2508702
                    ],
                    [
                        126.2473589,
                        33.2277489
                    ],
                    [
                        126.4746922,
                        33.4838002
                    ],
                    [
                        126.162165,
                        33.292471
                    ]
                ]
            },
            "pointOfAccess": "http://[KETI SYNC ENGINE API URL]/fedit/v1/digital-twins/KR-02-K10000-20250001",
            "digitalTwinObjects": [
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0001",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=142",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0002",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=143",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0003",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=144",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0004",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=145",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0005",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=146",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0006",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Build/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=147",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0007",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=148",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0008",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=149",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0009",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=150",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0010",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=151",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0011",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=152",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0012",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=153",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0013",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=154",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0014",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=155",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0015",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=156",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0016",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=157",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0017",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=158",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0018",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=159",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0019",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=160",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                },
                {
                    "name": "환경 디지털 트윈 날씨 객체",
                    "dtoid": "KR-109941-0020",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=161",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "weatherMeasurement"
                            ],
                            "properties": {
                                "weatherMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "wave",
                                                    "humidity",
                                                    "wind_uuu",
                                                    "wind_vvv",
                                                    "date_time",
                                                    "rain_type",
                                                    "sky_status",
                                                    "wind_speed",
                                                    "temperature",
                                                    "wind_direction",
                                                    "measure_position_id",
                                                    "snow_cover_one_hour",
                                                    "precipitation_percent",
                                                    "precipitation_one_hour"
                                                ],
                                                "properties": {
                                                    "wind_vvv": {
                                                        "type": "number"
                                                    },
                                                    "wind_uuu": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_one_hour": {
                                                        "type": "string"
                                                    },
                                                    "rain_type": {
                                                        "type": "number"
                                                    },
                                                    "measure_position_id": {
                                                        "type": "number"
                                                    },
                                                    "wind_direction": {
                                                        "type": "number"
                                                    },
                                                    "precipitation_percent": {
                                                        "type": "number"
                                                    },
                                                    "wave": {
                                                        "type": "number"
                                                    },
                                                    "date_time": {
                                                        "type": "string"
                                                    },
                                                    "sky_status": {
                                                        "type": "string"
                                                    },
                                                    "temperature": {
                                                        "type": "number"
                                                    },
                                                    "humidity": {
                                                        "type": "number"
                                                    },
                                                    "wind_speed": {
                                                        "type": "number"
                                                    },
                                                    "snow_cover_one_hour": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09941"
                }
            ],
            "sensors": [
                "JXQvK-dlrG4U-6lGet-3cSv4d",
                "op6Kh-9QsHgA-X7liD-taQbL9",
                "6Bcr1-_~ZGNs-wt8iI-OVuKv0",
                "vnKev-jbdGdE-6_nmB-4ewIYv",
                "IFjfy-evcJs~-tRTmN-aNLVEc",
                "q0qWT-7BMHRY-pc~Td-JMATf1",
                "mQNQI-gU~GKg-I~0yq-TNgTMr",
                "OAz~G-rHhGek-IxQzK-S_DOT8",
                "XDuH9-v6DJsA-24kLh-Hk73oW",
                "M~NNO-2AbINs-nrmDh-tsEsWp",
                "7izyv-P~1HVQ-ceyrA-juddc3",
                "VOjkb-VagG9s-7Jk21-gaTmdo",
                "Ej7tp-CCYIDY-xsAsQ-NmBvkM",
                "4W8iT-y7QIrw-hnICp-5dPLAs",
                "fftJt-BSFJAU-ECyUe-oA_eD5",
                "uuSJQ-R0FJXA-r6h0H-KTB9t0",
                "GBGwD-eFPImE-60wJT-trFCIr",
                "HwOef-8EbJBc-9XtnL-bL_ewX",
                "D3xi1-o8iGm2-bDVN3-cpElrp",
                "IaGOe-yqzJwQ-D1iMv-Tn4G5u"
            ],
            "controllers": [
                "QQFz4-ATHJE~-P_jlE-vGtFkf"
            ],
            "simulations": [
                "CNyXi-gsJGFI-zZ_zY-rbHvBm"
            ],
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "02",
            "classificationCode": "K10000"
        },
        {
            "dtid": "KR-02-N10000-20250001",
            "type": "단일",
            "name": "관광 디지털 트윈",
            "description": "제주도 관광지 소개 디지털 트윈",
            "owner": "제주관광공사",
            "contactPoint": "064-740-6000~1",
            "creator": "제주관광공사",
            "creationTime": "2024-03-04T05:00:00.000000+09:00",
            "modificationTime": "2024-03-04T05:00:00.000000+09:00",
            "subjects": [
                "관광"
            ],
            "keywords": [
                "관광",
                "주차장",
                "안전"
            ],
            "location": {
                "type": "MultiPoint",
                "coordinates": [
                    [
                        126.532371,
                        33.500116
                    ],
                    [
                        126.500055,
                        33.48863
                    ],
                    [
                        126.64412,
                        33.539831
                    ],
                    [
                        126.268778,
                        33.409109
                    ],
                    [
                        126.57045614,
                        33.51733013
                    ],
                    [
                        126.56506,
                        33.246244
                    ],
                    [
                        126.91007,
                        33.460229
                    ],
                    [
                        126.715115,
                        33.2843415
                    ],
                    [
                        126.489923,
                        33.2508702
                    ],
                    [
                        126.2473589,
                        33.2277489
                    ],
                    [
                        126.4746922,
                        33.4838002
                    ],
                    [
                        126.162165,
                        33.292471
                    ]
                ]
            },
            "pointOfAccess": "http://[KETI SYNC ENGINE API URL]/fedit/v1/digital-twins/KR-02-N10000-20250001",
            "digitalTwinObjects": [
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0001",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "5AhPm-JjvGxI-qu4kx-D_YcZ0"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=11111111",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0002",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "nefiN-DAJGvY-6KEAK-eCJA_L"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=11251813",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0003",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "gi29r-hR9Gjc-i9HJL-cOomue"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=16488201",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0004",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "cRo4_-s37G2~-lwH6W-S5wsx0"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=16489518",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0005",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": null,
                    "modificationTime": null,
                    "relatedSensors": [
                        "t~gGD-MrMIUo-i0vfY-AE1Y~G"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=17039715",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0006",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "zRsWu-a~OIAI-zC8if-7AuUQo"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=17385794",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0007",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "Dhrvu-ANxGWk-coWvO-QoZUEY"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=17435963",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0008",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "CbGg3-owSJ1w-7Mhl1-YbltT7"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=17680713",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0009",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "sZWPt-zdgHDM-W8UU~-d_5pbW"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=17759313",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "관광 디지털 트윈 객체",
                    "dtoid": "KR-109012-0010",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "제주도 관광지 소개 디지털 객체",
                    "creationTime": "2024-03-04T01:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
                    "relatedSensors": [
                        "NqZxL-x7IJSI-ald3y-XWIj3t"
                    ],
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": {
                        "contextURL": "datamodel.com/Building/context.jsonld",
                        "dataAccessURL": "http://220.124.222.91:38080/api/data/parking?parking_lot_id=20019319",
                        "updateInterval": 600000,
                        "schemaInformation": {
                            "$schema": "http://json-schema.org/draft-07/schema#",
                            "type": "object",
                            "title": "Generated schema for Root",
                            "required": [
                                "id",
                                "type",
                                "@context",
                                "location",
                                "parkingMeasurement"
                            ],
                            "properties": {
                                "parkingMeasurement": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value",
                                        "observedAt"
                                    ],
                                    "properties": {
                                        "observedAt": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "addr",
                                                    "name",
                                                    "x_crdn",
                                                    "y_crdn",
                                                    "add_fare",
                                                    "add_time",
                                                    "lhdy_end",
                                                    "park_day",
                                                    "wkdy_end",
                                                    "whol_npls",
                                                    "basic_fare",
                                                    "basic_time",
                                                    "lhdy_start",
                                                    "wkdy_start"
                                                ],
                                                "properties": {
                                                    "wkdy_start": {
                                                        "type": "string"
                                                    },
                                                    "lhdy_start": {
                                                        "type": "string"
                                                    },
                                                    "wkdy_end": {
                                                        "type": "string"
                                                    },
                                                    "basic_fare": {
                                                        "type": "number"
                                                    },
                                                    "lhdy_end": {
                                                        "type": "string"
                                                    },
                                                    "whol_npls": {
                                                        "type": "number"
                                                    },
                                                    "x_crdn": {
                                                        "type": "number"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "id": {
                                                        "type": "number"
                                                    },
                                                    "addr": {
                                                        "type": "string"
                                                    },
                                                    "y_crdn": {
                                                        "type": "number"
                                                    },
                                                    "add_fare": {
                                                        "type": "number"
                                                    },
                                                    "add_time": {
                                                        "type": "number"
                                                    },
                                                    "park_day": {
                                                        "type": "string"
                                                    },
                                                    "basic_time": {
                                                        "type": "number"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "location": {
                                    "type": "object",
                                    "required": [
                                        "type",
                                        "value"
                                    ],
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "object",
                                            "required": [
                                                "type",
                                                "coordinates"
                                            ],
                                            "properties": {
                                                "coordinates": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "number"
                                                    }
                                                },
                                                "type": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string"
                                },
                                "@context": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "디지털 트윈 주차장 CCTV 객체",
                    "dtoid": "KR-109012-0011",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "디지털 트윈 주차장 CCTV 객체001",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "디지털 트윈 주차장 CCTV 객체",
                    "dtoid": "KR-109012-0012",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "디지털 트윈 주차장 CCTV 객체002",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "한라산관음사코스",
                    "dtoid": "KR-109012-0013",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "한라산관음사코스",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "한라산돈내코코스",
                    "dtoid": "KR-109012-0014",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "한라산돈내코코스",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "천제연폭포",
                    "dtoid": "KR-109012-0016",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "천제연폭포",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "한라산영실코스",
                    "dtoid": "KR-109012-0017",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "한라산영실코스",
                    "creationTime": null,
                    "modificationTime": null,
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "한라산어리목코스",
                    "dtoid": "KR-109012-0018",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "한라산어리목코스",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "주상절리대(중문대포해안)",
                    "dtoid": "KR-109012-0019",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "주상절리대(중문대포해안)",
                    "creationTime": null,
                    "modificationTime": null,
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "감귤박물관",
                    "dtoid": "KR-109012-0020",
                    "keywords": [
                        "관광",
                        "주차장",
                        "안전"
                    ],
                    "subjects": [
                        "관광"
                    ],
                    "countryCode": "KR",
                    "description": "감귤박물관",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                },
                {
                    "name": "거문오름(UNESCO 세계자연유산)",
                    "dtoid": "KR-109012-0021",
                    "keywords": null,
                    "subjects": null,
                    "countryCode": "KR",
                    "description": "거문오름(UNESCO 세계자연유산)",
                    "creationTime": "2024-03-04T05:00:00.000000+09:00",
                    "modificationTime": "2024-03-04T05:00:00.000000+09:00",
                    "relatedSensors": null,
                    "relatedControllers": null,
                    "relatedVisualModels": null,
                    "digitalTwinObjectData": null,
                    "relatedDigitalTwinObjects": null,
                    "objectPrimaryClassificationCode": "1",
                    "objectSecondaryClassificationCode": "09012"
                }
            ],
            "sensors": [
                "5AhPm-JjvGxI-qu4kx-D_YcZ0",
                "nefiN-DAJGvY-6KEAK-eCJA_L",
                "gi29r-hR9Gjc-i9HJL-cOomue",
                "cRo4_-s37G2~-lwH6W-S5wsx0",
                "t~gGD-MrMIUo-i0vfY-AE1Y~G",
                "zRsWu-a~OIAI-zC8if-7AuUQo",
                "Dhrvu-ANxGWk-coWvO-QoZUEY",
                "CbGg3-owSJ1w-7Mhl1-YbltT7",
                "sZWPt-zdgHDM-W8UU~-d_5pbW",
                "rEK2p-0zkHpk-6n7P~-hT48lZ",
                "jtYlY-teeGu2-2oR7L-FDQuop"
            ],
            "controllers": [
                "j0Baf-0QYHQA-JRykq-t4tfIO"
            ],
            "simulations": [
                "bxqZb-NYkGx2-Z6jcz-ybS6Lf"
            ],
            "visualModels": null,
            "services": null,
            "subscriptions": null,
            "behaviorModels": null,
            "digitalTwins": null,
            "federatedDigitalTwinObjects": null,
            "relationships": null,
            "validationModels": null,
            "fidelityModels": null,
            "countryCode": "KR",
            "classificationTypeCode": "02",
            "classificationCode": "N10000"
        }
    ],
    "dtw_objs_attr": "digitalTwinObjects",
    "dtw_attr_name": "트윈",
    "paging": true
}

var data2 = {
    "dtid": "KR-01-A01121-20250002",
    "type": "연합",
    "name": "채소 트윈",
    "description": "채소 트윈",
    "owner": null,
    "contactPoint": null,
    "creator": null,
    "creationTime": null,
    "modificationTime": null,
    "subjects": null,
    "keywords": null,
    "location": null,
    "pointOfAccess": null,
    "digitalTwinObjects": null,
    "sensors": null,
    "controllers": null,
    "simulations": null,
    "visualModels": null,
    "services": null,
    "subscriptions": null,
    "behaviorModels": null,
    "digitalTwins": null,
    "federatedDigitalTwinObjects": null,
    "relationships": null,
    "validationModels": null,
    "fidelityModels": null,
    "countryCode": "KR",
    "classificationTypeCode": "01",
    "classificationCode": "A01121"
}

var data3 = {
    "dtid": "KR-01-A01121-20250002",
    "name": "테스트 디지털 트윈 날씨 객체",
    "dtoid": "KR-109941-0056",
    "keywords": [
        "날씨",
        "예보",
        "미세먼지",
        "안전"
    ],
    "subjects": [
        "기상",
        "날씨",
        "대기정보"
    ],
    "countryCode": "KR",
    "description": "제주도내 날씨와 대기 상태를 알려주는 디지털 객체",
    "creationTime": "2024-03-04T01:00:00.000000+09:00",
    "modificationTime": "2024-03-04T01:00:00.000000+09:00",
    "relatedSensors": null,
    "relatedControllers": null,
    "relatedVisualModels": null,
    "digitalTwinObjectData": {
        "contextURL": "datamodel.com/Building/context.jsonld",
        "dataAccessURL": "http://220.124.222.91:28080/api/data/weather?measure_position_id=142",
        "updateInterval": 600000,
        "schemaInformation": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "title": "Generated schema for Root",
            "required": [
                "id",
                "type",
                "@context",
                "location",
                "weatherMeasurement"
            ],
            "properties": {
                "weatherMeasurement": {
                    "type": "object",
                    "required": [
                        "type",
                        "value",
                        "observedAt"
                    ],
                    "properties": {
                        "observedAt": {
                            "type": "string"
                        },
                        "type": {
                            "type": "string"
                        },
                        "value": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": [
                                    "wave",
                                    "humidity",
                                    "wind_uuu",
                                    "wind_vvv",
                                    "date_time",
                                    "rain_type",
                                    "sky_status",
                                    "wind_speed",
                                    "temperature",
                                    "wind_direction",
                                    "measure_position_id",
                                    "snow_cover_one_hour",
                                    "precipitation_percent",
                                    "precipitation_one_hour"
                                ],
                                "properties": {
                                    "wind_vvv": {
                                        "type": "number"
                                    },
                                    "wind_uuu": {
                                        "type": "number"
                                    },
                                    "precipitation_one_hour": {
                                        "type": "string"
                                    },
                                    "rain_type": {
                                        "type": "number"
                                    },
                                    "measure_position_id": {
                                        "type": "number"
                                    },
                                    "wind_direction": {
                                        "type": "number"
                                    },
                                    "precipitation_percent": {
                                        "type": "number"
                                    },
                                    "wave": {
                                        "type": "number"
                                    },
                                    "date_time": {
                                        "type": "string"
                                    },
                                    "sky_status": {
                                        "type": "string"
                                    },
                                    "temperature": {
                                        "type": "number"
                                    },
                                    "humidity": {
                                        "type": "number"
                                    },
                                    "wind_speed": {
                                        "type": "number"
                                    },
                                    "snow_cover_one_hour": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "location": {
                    "type": "object",
                    "required": [
                        "type",
                        "value"
                    ],
                    "properties": {
                        "type": {
                            "type": "string"
                        },
                        "value": {
                            "type": "object",
                            "required": [
                                "type",
                                "coordinates"
                            ],
                            "properties": {
                                "coordinates": {
                                    "type": "array",
                                    "items": {
                                        "type": "number"
                                    }
                                },
                                "type": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "id": {
                    "type": "string"
                },
                "type": {
                    "type": "string"
                },
                "@context": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            }
        }
    },
    "relatedDigitalTwinObjects": null,
    "objectPrimaryClassificationCode": "1",
    "objectSecondaryClassificationCode": "09941"
}