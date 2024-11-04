package kr.co.e8ight.ndxpro_v1_datamanager.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import javax.annotation.PostConstruct;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.ContextRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeSchemaService;
import kr.co.e8ight.ndxpro_v1_datamanager.service.ContextService;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile("prod")
@Component
public class DbInit {

    private final ContextService contextService;
    private final ContextRepository contextRepository;

    private final AttributeRepository attributeRepository;

    private final AttributeSchemaRepository attributeSchemaRepository;

    private final AttributeSchemaService attributeSchemaService;

    private final ObjectMapper objectMapper;

        private static final String path = "/app/resources/InitData/";
//    private static final String path = "src/main/resources/InitData/";

    public DbInit(ContextService contextService, ContextRepository contextRepository,
            AttributeRepository attributeRepository,
            AttributeSchemaRepository attributeSchemaRepository,
            AttributeSchemaService attributeSchemaService, ObjectMapper objectMapper) {
        this.contextService = contextService;
        this.contextRepository = contextRepository;
        this.attributeRepository = attributeRepository;
        this.attributeSchemaRepository = attributeSchemaRepository;
        this.attributeSchemaService = attributeSchemaService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    private void initCoreContext() throws IOException, ParseException {
        Reader reader = new FileReader(path + "context.json");
        String coreContextUrl = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld";
        JSONParser parser = new JSONParser();
        Object obj = parser.parse(reader);

        JSONArray jsonArr = (JSONArray) obj;

        contextService.importContext(coreContextUrl);
        Context context;
        if (jsonArr.size() > 0) {
            for (int i = 0; i < jsonArr.size(); i++) {
                JSONObject jsonObj = (JSONObject) jsonArr.get(i);
                context = objectMapper.readValue(jsonObj.toJSONString(), Context.class);
                if (contextRepository.findByUrl(context.getUrl()).isEmpty()) {
                    contextRepository.save(context);
                }

            }
        }
    }

    @PostConstruct
    private void initCoreAttribute() throws IOException, ParseException {

        Reader reader = new FileReader(path + "attribute.json");

        JSONParser parser = new JSONParser();
        Object obj = parser.parse(reader);

        JSONArray jsonArr = (JSONArray) obj;

        Attribute attribute;
        if (jsonArr.size() > 0) {
            for (int i = 0; i < jsonArr.size(); i++) {
                JSONObject jsonObj = (JSONObject) jsonArr.get(i);
                attribute = objectMapper.readValue(jsonObj.toJSONString(), Attribute.class);
                if (attributeRepository.findByid(attribute.getId()).isEmpty()) {
                    attributeRepository.save(attribute);
                }
            }
        }
    }

    @PostConstruct
    private void initCoreAttributeSchema() throws IOException, ParseException {

        Reader reader = new FileReader(path + "attributeSchema.json");

        JSONParser parser = new JSONParser();
        Object obj = parser.parse(reader);

        JSONArray jsonArr = (JSONArray) obj;

        AttributeSchemaRequestDto attributeSchemaRequestDto;
        if (jsonArr.size() > 0) {
            for (int i = 0; i < jsonArr.size(); i++) {
                JSONObject jsonObj = (JSONObject) jsonArr.get(i);
                attributeSchemaRequestDto = objectMapper.readValue(jsonObj.toJSONString(),
                        AttributeSchemaRequestDto.class);
                if (attributeSchemaRepository.findByid(attributeSchemaRequestDto.getId())
                        .isEmpty()) {
                    attributeSchemaService.createAttributeSchema(attributeSchemaRequestDto);
                }
            }
        }
    }
    LocalDateTime dateTime = LocalDateTime.from(

            Instant.from(
                    DateTimeFormatter.ISO_DATE_TIME.parse("2018-09-21T12:00:00Z")
            ).atZone(ZoneId.of("Asia/Seoul")));

}
