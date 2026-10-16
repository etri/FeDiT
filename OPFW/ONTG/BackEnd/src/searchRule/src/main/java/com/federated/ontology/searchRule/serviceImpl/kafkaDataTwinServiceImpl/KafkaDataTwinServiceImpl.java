package com.federated.ontology.searchRule.serviceImpl.kafkaDataTwinServiceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.component.KeywordGraph;
import com.federated.ontology.searchRule.component.OwlGenerator;
import com.federated.ontology.searchRule.dto.kafkaDto.DigitalTwinMetaInfo;
import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import com.federated.ontology.searchRule.service.kafkaDataTwinService.KafkaDataTwinService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.File;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class KafkaDataTwinServiceImpl implements KafkaDataTwinService {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final KeywordGraph keywordGraph;
    private final OwlGenerator owlGenerator;

    @Value("${setInit.dataSource:http}")
    private String dataSourceType;

    public KafkaDataTwinServiceImpl(RestTemplate restTemplate,
                                    ObjectMapper objectMapper,
                                    KeywordGraph keywordGraph,
                                    OwlGenerator owlGenerator) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.keywordGraph = keywordGraph;
        this.owlGenerator = owlGenerator;
    }

    @Override
    public List<Map<String, Object>> createOntology(DigitalTwinMetaInfo metaInfo) {

        List<Map<String, Object>> result = new ArrayList<>();

        return result;
    }
}
