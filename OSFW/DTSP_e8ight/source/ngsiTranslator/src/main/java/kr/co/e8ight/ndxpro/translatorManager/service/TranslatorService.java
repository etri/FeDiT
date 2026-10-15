package kr.co.e8ight.ndxpro.translatorManager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorManager.config.Constants;
import kr.co.e8ight.ndxpro.translatorManager.config.OperaterProvider;
import kr.co.e8ight.ndxpro.translatorManager.domain.*;
import kr.co.e8ight.ndxpro.translatorManager.dto.*;
import kr.co.e8ight.ndxpro.translatorManager.exception.TranslatorException;
import kr.co.e8ight.ndxpro.translatorManager.repository.TranslatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class TranslatorService {

    private final TranslatorRepository translatorRepository;
    private final OperaterProvider operaterProvider;
    private final FileService fileService;
    private final TranslatorLogService logService;
    private final BuildService buildService;
    private final AgentService agentService;
    private final TranslatorHistoryService translatorHistoryService;
    private final ObjectMapper objectMapper;
    private final DataModelService dataModelService;
    private final MemberService memberService;

    /** target topic 미지정 시 사용할 기본값. 브로커가 실제로 consume 하는 토픽이어야 한다. */
    @Value("${translator.default.target-topic}")
    private String defaultTargetTopic;

    @Transactional
    public TranslatorResponseDto register(TranslatorRegisterDto translatorRegisterDto, String token) {
        if ( !agentService.exist(translatorRegisterDto.getAgentId(), token) ) {
            throw new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "Agent " + translatorRegisterDto.getAgentId() + " is not exist.");
        }
        if ( translatorRepository.findByName(translatorRegisterDto.getName()).isPresent() ) {
            throw new TranslatorException(ErrorCode.ALREADY_EXISTS, "Translator name is already exists.");
        }
        if ( translatorRegisterDto.getTransferObservedAt() ) {
            if ( translatorRegisterDto.getObservedAtTopicScenarioId() == null ) {
                throw new TranslatorException(ErrorCode.BAD_REQUEST_DATA, "'ObservedAt Topic Scenario Id' is required.");
            }
            if ( translatorRegisterDto.getObservedAtTopicScenarioType() == null || translatorRegisterDto.getObservedAtTopicScenarioType().equals("")) {
                throw new TranslatorException(ErrorCode.BAD_REQUEST_DATA, "'ObservedAt Topic Scenario Type' is required.");
            }
        }

        // 저장/이력 기록 전에 source topic 을 확정한다. 뒤에서 검증하면 미완성 상태가 이력에 남는다.
        String sourceTopic = resolveSourceTopic(translatorRegisterDto, token);
        String targetTopic = resolveTargetTopic(translatorRegisterDto, sourceTopic);

        String memberId = memberService.getMemberId(token);

        Translator savedTranslator = translatorRepository.save(Translator.create(translatorRegisterDto, memberId));
        savedTranslator.setSourceTopic(sourceTopic);
        savedTranslator.setTargetTopic(targetTopic);
        translatorHistoryService.recordHistory(savedTranslator, memberId);

        ResponseEntity<ProcessResultDto> responseEntity = build(translatorRegisterDto, token);
        fileService.saveJarFileOnTranslatorDir(savedTranslator.getFileName(), Objects.requireNonNull(responseEntity.getBody()).getSavedFile());

        return TranslatorResponseDto.from(savedTranslator);
    }

    /**
     * 사용자 지정 토픽이면 요청값을, 아니면 agent 의 target topic 을 source topic 으로 쓴다.
     */
    private String resolveSourceTopic(TranslatorRegisterDto translatorRegisterDto, String token) {
        if ( translatorRegisterDto.getIsCustomTopic() ) {
            if ( translatorRegisterDto.getSourceTopic() == null || translatorRegisterDto.getSourceTopic().equals("") ) {
                throw new TranslatorException(ErrorCode.BAD_REQUEST_DATA, "Kafka source topic is required.");
            }
            return translatorRegisterDto.getSourceTopic();
        }
        return agentService.getTargetTopic(translatorRegisterDto.getAgentId(), token);
    }

    /**
     * 요청에 target topic 이 있으면 그 값을, 없으면 설정된 기본 토픽을 쓴다.
     * source 와 같은 토픽이면 변환 결과를 자기가 다시 consume 하는 무한 루프가 되므로 막는다.
     */
    private String resolveTargetTopic(TranslatorRegisterDto translatorRegisterDto, String sourceTopic) {
        String targetTopic = translatorRegisterDto.getTargetTopic();
        if ( targetTopic == null || targetTopic.equals("") ) {
            targetTopic = defaultTargetTopic;
        }
        if ( targetTopic.equals(sourceTopic) ) {
            throw new TranslatorException(ErrorCode.BAD_REQUEST_DATA,
                    "Kafka target topic must differ from source topic. (" + targetTopic + ")");
        }
        return targetTopic;
    }

    private synchronized ResponseEntity<ProcessResultDto> build(TranslatorRegisterDto translatorRegisterDto, String token) {
        return buildService.build(translatorRegisterDto, token);
    }

    public ResponseEntity<ProcessResultDto> compile(TranslatorCompileRequestDto translatorRegisterDto, String token) {
        return buildService.compile(translatorRegisterDto, token);
    }

    @Transactional
    public TranslatorResponseDto operate(Long translatorId, String operation, String token) {
        String memberId = memberService.getMemberId(token);
        Translator translator = translatorRepository.findByIdForUpdate(translatorId)
                .orElseThrow(() -> new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "not found translator"));
        if ( translator.getStatus().equals(TranslatorStatus.DELETED) ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator id :" + translatorId + " is Deleted.");
        }
        if ( !translator.getIsReady() ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator id :" + translatorId + " is not ready, check translator first.");
        }

        TranslatorOperation translatorOperation = TranslatorOperation.getOperation(operation);
        Operater operater = operaterProvider.getOperater(translatorOperation);
        Translator operated = operater.operate(translator);

        translatorHistoryService.recordHistory(operated, memberId);

        return TranslatorResponseDto.from(operated);
    }

    public TranslatorListResponseDto getTranslatorList(Long agentId, Pageable pageable) {
        Page<Translator> translatorList;
        if ( agentId == null ) {
            translatorList = translatorRepository.findByNameIsNotNull(pageable);
        } else {
            translatorList = translatorRepository.findByAgentIdAndNameIsNotNull(agentId, pageable);
        }

        TranslatorListResponseDto translatorResponseDtoList = new TranslatorListResponseDto(translatorList.getTotalElements(), translatorList.getTotalPages());
        translatorList.forEach(agentInfo ->
                translatorResponseDtoList.getData()
                        .add(TranslatorResponseDto.from(agentInfo))
        );

        return translatorResponseDtoList;
    }

    @Transactional
    public TranslatorResponseDto delete(Long translatorId, String token) {
        String memberId = memberService.getMemberId(token);

        Translator translator = translatorRepository.findById(translatorId)
                .orElseThrow(() -> new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "not found translator"));

        if ( TranslatorStatus.getAliveStatusSet().contains(translator.getStatus()) ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator ( Id :" + translatorId + ") is currently running, Stop translator before deleting.");
        }

        translator.delete(memberId);
        translatorHistoryService.recordHistory(translator, memberId);
        // getFileName() 이 id_name 이므로 반드시 이름을 비우기 전에 지워야 한다.
        fileService.deleteJarFileOnTranslatorDir(translator.getFileName());
        translator.setName(null);
        return TranslatorResponseDto.from(translator);
    }

    @Transactional
    public TranslatorResponseDto update(Long translatorId, TranslatorRegisterDto translatorRegisterDto, String token) {
        String memberId = memberService.getMemberId(token);
        Translator translator = translatorRepository.findById(translatorId)
                .orElseThrow(() -> new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "not found translator"));

        if ( TranslatorStatus.getAliveStatusSet().contains(translator.getStatus()) ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator (Id :" + translatorId + ") is currently running, Stop translator before update.");
        }

        translator.update(translatorRegisterDto, memberId);
        String updatedSourceTopic = resolveSourceTopic(translatorRegisterDto, token);
        translator.setSourceTopic(updatedSourceTopic);
        translator.setTargetTopic(resolveTargetTopic(translatorRegisterDto, updatedSourceTopic));

        ResponseEntity<ProcessResultDto> responseEntity = build(translatorRegisterDto, token);
        fileService.replaceJarFileOnTranslatorDir(translator.getFileName(), Objects.requireNonNull(responseEntity.getBody()).getSavedFile());

        return TranslatorResponseDto.from(translator);
    }

    /**
     * 저장된 코드 그대로 jar 만 다시 빌드한다.
     * translator jar 에는 runner 코드가 함께 들어가므로, builder 의 runner 를 고친 뒤 기존 translator 에 반영할 때 쓴다.
     * 실행 중인 jar 를 교체하면 아직 로드하지 않은 클래스를 읽다 깨질 수 있어 정지 상태에서만 허용한다.
     */
    @Transactional
    public TranslatorResponseDto rebuild(Long translatorId, String token) {
        String memberId = memberService.getMemberId(token);
        Translator translator = translatorRepository.findById(translatorId)
                .orElseThrow(() -> new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "not found translator"));

        if ( translator.getStatus().equals(TranslatorStatus.DELETED) ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator id :" + translatorId + " is Deleted.");
        }
        if ( TranslatorStatus.getAliveStatusSet().contains(translator.getStatus()) ) {
            throw new TranslatorException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator (Id :" + translatorId + ") is currently running, Stop translator before rebuild.");
        }

        ResponseEntity<ProcessResultDto> responseEntity = build(TranslatorRegisterDto.from(translator), token);
        fileService.replaceJarFileOnTranslatorDir(translator.getFileName(), Objects.requireNonNull(responseEntity.getBody()).getSavedFile());
        translatorHistoryService.recordHistory(translator, memberId);

        return TranslatorResponseDto.from(translator);
    }

    @Transactional
    public TranslatorCheckResponseDto check(Long translatorId, TranslatorCheckRequestDto requestdto, String token) {
        TranslatorOperation translatorOperation = TranslatorOperation.CHECK;
        Operater operater = operaterProvider.getOperater(translatorOperation);
        Translator translator = getById(translatorId);
        operater.operate(translator, requestdto);

        String testResultJson = readTestResultJson(translatorId);
        TestResult testResult = parseTestResultJson(testResultJson, TestResult.class);
        JsonNode result = parseTestResultJson(testResultJson, JsonNode.class).get("result");

        if ( testResult.getSuccess() ) {
            // @context 필드에 값이 있는지
            if ( testResult.getResult().getContext() == null || testResult.getResult().getContext().equals("") ) {
                return new TranslatorCheckResponseDto(false, "@context is empty.", result);
            }

            // _id.type이 컨버터에 정의된 타입과 같은지
            if ( !testResult.getResult().getId().getType().equals(translator.getModelType()) ) {
                return new TranslatorCheckResponseDto(false, "Test result entity's model type : " + testResult.getResult().getId().getType() + " is invalid.", result);
            }

            // attrs 필드(리스트)의 요소 수와 attrNames(맵)의 요소 수의 크기가 같고 이름이 일치하는지
            List<Attribute> attrs = testResult.getResult().getAttrs();
            if ( attrs.size() != testResult.getResult().getAttrNames().size() ) {
                return new TranslatorCheckResponseDto(false, "The size of the attribute list and the size of the attribute name list are different.", result);
            }
            for (Attribute attr : attrs) {
                if ( !testResult.getResult().getAttrNames().containsKey(attr.getName()) ) {
                    return new TranslatorCheckResponseDto(false, "List of attribute names doesn't have " + attr.getName() + ".", result);
                }
            }

            // 변환 결과 Attribute가 모델에 있는지
            DataModelDto dataModelDto = dataModelService.getDataModel(translator.getModelType(), token);
            for (Attribute attr : attrs) {
                if ( !dataModelDto.getAttributeNames().containsKey(attr.getName()) ) {
                    return new TranslatorCheckResponseDto(false, translator.getModelType() + " model does not have " + attr.getName() + " attribute.", result);
                }
            }

            // Model 정보의 필수 Attribute가 결과에 있는지
            List<String> requiredAttrNameList = dataModelDto.getRequired();
            for (String requiredAttrName : requiredAttrNameList) {
                if ( !testResult.getResult().getAttrNames().containsKey(requiredAttrName) ) {
                    return new TranslatorCheckResponseDto(false, requiredAttrName + " attribute is required on Model Type " + translator.getModelType() + ".", result);
                }
            }

            //success
            translator.ready();
            return new TranslatorCheckResponseDto(true, testResult.getResult().toString(), result);
        } else {
            return new TranslatorCheckResponseDto(false, testResult.getError(), null);
        }
    }

    private String readTestResultJson(Long translatorId) {
        String filePath = logService.getTranslatorLogPath() + "/translator_" + translatorId + Constants.JSON_FILE_EXTENSION;
        return fileService.readFile(filePath);
    }

    private <T> T parseTestResultJson(String jsonString, Class<T> type) {
        try {
            return objectMapper.readValue(jsonString, type);
        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
            log.error(e.getOriginalMessage());
            throw new TranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, "json parse error.");
        }
    }

    @Transactional
    public void updateLastSignalDatetime(String type, Long translatorId) {
        Translator translator = translatorRepository.findById(translatorId).orElseThrow(() -> {
            throw new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "Translator id :" + translatorId + " not found");
        });
        translator.updateLastSignalDatetime();
    }

    public Translator getById(Long translatorId) {

        return translatorRepository.findById(translatorId)
                .orElseThrow(() -> new TranslatorException(ErrorCode.RESOURCE_NOT_FOUND, "not found translator"));
    }

    public void stopAgent(Long agentId, String token) {
        agentService.stop(agentId, token);
    }

    public String getSampleCode(String translatorName) {
        return "package kr.co.e8ight.ndxpro.translatorRunner.translator;\n" +
                "\n" +
                "import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;\n" +
                "import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;\n" +
                "import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;\n" +
                "import org.json.JSONArray;\n" +
                "import org.json.JSONObject;\n" +
                "import org.slf4j.Logger;\n" +
                "import org.slf4j.LoggerFactory;\n" +
                "\n" +
                "import java.time.LocalDateTime;\n" +
                "import java.time.ZoneOffset;\n" +
                "import java.time.ZonedDateTime;\n" +
                "import java.time.format.DateTimeFormatter;\n" +
                "import java.util.*;\n" +
                "\n" +
                "public class " + translatorName + " extends EntityTranslator {\n" +
                "\tprivate static final Logger log = LoggerFactory.getLogger(" + translatorName + ".class);\n" +
                "\n" +
                // TranslatorRunner.getTranslator() 가 getConstructor(String.class) 로 찾으므로
                // String 파라미터 생성자가 반드시 있어야 한다. 없으면 NoSuchMethodException 이
                // 삼켜지고 translator 가 null 이 되어 레코드마다 NPE 가 난다.
                "\tpublic " + translatorName + "(String modelType) { }\n" +
                "\n" +
                "\t@Override\n" +
                "\tpublic List<Entity> translate(JSONObject jsonObject) {\n" +
                "\t\tList<Entity> entities = new ArrayList<>();\n" +
                "\n" +
                "\t\t//// 수정 구간 시작\n" +
                "\n" +
                "\t\t//// Json 필드 이름으로 데이터 불러오기\n" +
                "\t\t// Array 인 경우 getJSONArray() 사용\n" +
                "\t\tJSONArray itemList = jsonObject.getJSONArray(\"samples\");\n" +
                "\t\t// Object 인 경우 getJsonObject() 사용\n" +
                "\t\t// JSONObject jsonObject = jsonObject.getJSONObject(\"vehicleSignal\");\n" +
                "\n" +
                "\t\t//// NGSI-LD Attribute Name Map 입력\n" +
                "\t\t// \"entity attribute name\":\"context:attribute name\" 쌍의 데이터 입력\n" +
                "\t\tLinkedHashMap<String, String> attrNames = new LinkedHashMap<>();\n" +
                "\t\tattrNames.put(\"sampleAttribute\", \"e8ight:sampleAttribute\");\n" +
                "\n" +
                "\t\tfor (int i = 0; i < itemList.length(); i++) {\n" +
                "\t\t\tJSONObject item = itemList.getJSONObject(i);\n" +
                "\n" +
                "\t\t\t// entity ID 입력\n" +
                "\t\t\tEntityId entityId = new EntityId(\"urn:ngsi-ld:SimulationVehicleSignal:\" + item.getInt(\"id\"), \"SimulationVehicleSignal\", \"UOS\");\n" +
                "\n" +
                "\t\t\tList<Attribute> attrs = new ArrayList<>();\n" +
                "\n" +
                "\t\t\t// Attribute의 metadata가 있는 경우 추가 입력\n" +
                "\t\t\tLinkedHashMap<String, String> sampleMdNames = new LinkedHashMap<>();\n" +
                "\t\t\tsampleMdNames.put(\"observedAt\", \"e8ight:observedAt\");\n" +
                "\n" +
                "\t\t\tList<Attribute> sampleMd = new ArrayList<>();\n" +
                "\t\t\tZonedDateTime zonedDateTime = LocalDateTime.parse(jsonObject.getString(\"timePoint\"), DateTimeFormatter.ofPattern(\"yyyy-MM-dd'T'HH:mm:ss.SSS\"))\n" +
                "\t\t\t\t.atZone(ZoneOffset.of(\"+09:00\")).withZoneSameInstant(ZoneOffset.UTC);\n" +
                "\t\t\tAttribute sampleMd_observedAt = new Attribute(\"observedAt\", null, zonedDateTime, null, null);\n" +
                "\t\t\tsampleMd.add(sampleMd_observedAt);\n" +
                "\t\t\t//// 불러온 Json 데이터를 NGSI-LD Attribute로 변환\n" +
                "\t\t\tAttribute sample = new Attribute(\"sample\", \"Property\", 1, sampleMdNames, sampleMd); \n" +
                "\t\t\tattrs.add(sample); \n" +
                "\t\t\t// entity 생성 및 추가 \n" +
                "\t\t\tEntity entity = new Entity(entityId, attrNames, attrs); \n" +
                "\t\t\tentities.add(entity); \n" +
                "\t\t} \n" +
                "\t\t//수정 구간 종료 \n" +
                "\t\treturn entities; \n" +
                "\t} \n" +
                "}";
    }
}
