package kr.co.e8ight.ndxpro.agentManager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.mock;
import static org.mockito.BDDMockito.never;
import static org.mockito.BDDMockito.verify;
import static org.mockito.BDDMockito.willThrow;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import kr.co.e8ight.ndxpro.agentManager.config.Constants;
import kr.co.e8ight.ndxpro.agentManager.config.OperaterProvider;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentOperation;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.HttpAgent;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonField;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.DataModelDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.OperationRequestDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.repository.AgentRepository;
import kr.co.e8ight.ndxpro.agentManager.service.operater.Operater;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @InjectMocks
    private AgentService agentService;

    @Mock
    private AgentRepository agentRepository;
    @Mock
    private AgentConfigProvider configProvider;
    @Mock
    private FileService fileService;
    @Mock
    private TranslatorManagerService translatorManagerService;
    @Mock
    private DataModelService dataModelService;
    @Mock
    private OperaterProvider operaterProvider;
    @Mock
    private AgentHistoryService agentHistoryService;

    @Test
    @DisplayName("Flume 에이전트 생성 성공")
    void createAgent() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.save(any(Agent.class)))
                .willReturn(agent);
        String confFileContents = "test confFileContents";
        given(configProvider.getConfFileContents(eq(agent), any(AgentRequestDto.class)))
                .willReturn(confFileContents);

        //when
        AgentResponseDto responseDto = agentService.createAgent(agentRequestDto, "testuser", "token");

        //then
        verify(fileService).createOrReplaceFile(agent.getConfigFileFullPath(), confFileContents);

        assertThat(responseDto.getName()).isEqualTo(agent.getName());
        assertThat(responseDto.getPid()).isEqualTo(agent.getPid());
        assertThat(responseDto.getStatus()).isEqualTo(agent.getStatus());
        assertThat(responseDto.getLastSourceSignalReceivedAt()).isEqualTo(agent.getLastSourceSignalDatetime());
        assertThat(responseDto.getLastSinkSignalReceivedAt()).isEqualTo(agent.getLastSinkSignalDatetime());
        assertThat(responseDto.getConfFileContents()).isEqualTo(confFileContents);
    }

    @Test
    @DisplayName("Flume 에이전트 생성 실패 (파일 시스템 오류)")
    void createAgentCauseFileSaveError() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        String configPath = "/";
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.save(any(Agent.class)))
                .willReturn(agent);
        String confFileContents = "test confFileContents";
        given(configProvider.getConfFileContents(eq(agent), any(AgentRequestDto.class)))
                .willThrow(new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, configPath + " file save error"));

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> agentService.createAgent(agentRequestDto, "testuser", "token"));

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
        verify(fileService, never()).createOrReplaceFile(agent.getConfigFileFullPath(), confFileContents);
    }

    @Test
    @DisplayName("Flume 에이전트 삭제 성공")
    void deleteAgent() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));

        //when
        AgentResponseDto responseDto = agentService.deleteAgent(agent.getId(), "testuser", "token");

        //then
        verify(translatorManagerService).existByAgentId(agent.getId());
        verify(agentHistoryService).recordHistory(any(Agent.class), eq("testuser"));

        assertThat(responseDto.getId()).isEqualTo(agent.getId());
    }

    @Test
    @DisplayName("Flume 에이전트 삭제 실패 (Agent ID not found)")
    void deleteAgentFailCauseNotFoundId() {

        //given
        long agentId = 1L;
        given(agentRepository.findById(agentId)).willReturn(Optional.empty());

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.deleteAgent(agentId, "testuser", "token");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
        verify(fileService, never()).removeFile(any(String.class));
        verify(agentRepository, never()).deleteById(agentId);
    }

    @Test
    @DisplayName("Flume 에이전트 삭제 실패 (Agent 실행중)")
    void deleteAgentFailCauseRunning() {

        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        long agentId = 1L;
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");
        agent.setStatus(AgentStatus.RUN);

        given(agentRepository.findById(agentId)).willReturn(Optional.of(agent));

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.deleteAgent(agentId, "testuser", "token");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.OPERATION_NOT_SUPPORTED);
        verify(fileService, never()).removeFile(agent.getConfigFileFullPath());
        verify(agentRepository, never()).deleteById(agent.getId());
    }

    @Test
    @DisplayName("Flume 에이전트 운영 작업 성공")
    void operate() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));

        given(fileService.isExistFile(agent.getConfigFileFullPath())).willReturn(true);
        String operation = "run";
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto requestDto = new OperationRequestDto(operation, bodyInfo);

        Operater operater = mock(Operater.class);
        given(operater.operate(any(Agent.class), any()))
                .willReturn(agent);
        given(operaterProvider.getOperater(AgentOperation.getOperation(requestDto)))
                .willReturn(operater);

        //when
        AgentResponseDto responseDto = agentService.operate(agent.getId(), requestDto, "testuser");

        //then
        assertThat(responseDto.getId()).isEqualTo(agent.getId());
        assertThat(responseDto.getName()).isEqualTo(agent.getName());
        assertThat(responseDto.getPid()).isEqualTo(agent.getPid());
        assertThat(responseDto.getStatus()).isEqualTo(agent.getStatus());
        assertThat(responseDto.getLastSourceSignalReceivedAt()).isEqualTo(agent.getLastSourceSignalDatetime());
        assertThat(responseDto.getLastSinkSignalReceivedAt()).isEqualTo(agent.getLastSinkSignalDatetime());
    }

    @Test
    @DisplayName("Flume 에이전트 운영 작업 실패 (Agnet ID Not found)")
    void operateFailCauseNotFound() {
        //given
        Long agentId = 1L;
        given(agentRepository.findById(agentId)).willReturn(Optional.empty());
        String operation = "run";
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto requestDto = new OperationRequestDto(operation, bodyInfo);

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.operate(agentId, requestDto, "testuser");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
        verify(operaterProvider, never()).getOperater(any());
        verify(fileService, never()).isExistFile(any());
    }

    @Test
    @DisplayName("Flume 에이전트 운영 작업 실패 (Agnet config file not found)")
    void operateFailCauseConfigNotFound() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));
        given(fileService.isExistFile(agent.getConfigFileFullPath())).willReturn(false);
        String operation = "start";
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto requestDto = new OperationRequestDto(operation, bodyInfo);

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.operate(agent.getId(), requestDto, "testuser");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
        verify(operaterProvider, never()).getOperater(any());
        verify(fileService).isExistFile(any());
    }

    @Test
    @DisplayName("Flume 에이전트 운영 작업 실패 (invalid operation type)")
    void operateFailCauseInvalidOperationType() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));
        given(fileService.isExistFile(agent.getConfigFileFullPath())).willReturn(true);
        String operation = "invalid";
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto requestDto = new OperationRequestDto(operation, bodyInfo);

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.operate(agent.getId(), requestDto, "testuser");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST_DATA);
        verify(operaterProvider, never()).getOperater(any());
        verify(fileService).isExistFile(agent.getConfigFileFullPath());
    }

    @Test
    @DisplayName("Flume 에이전트 조회 성공")
    void getAgentInfo() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findByIdFetchJoinDataModel(agent.getId())).willReturn(Optional.of(agent));
        String confFileContents = "test confFileContents";
        given(fileService.readFile(agent.getConfigFileFullPath())).willReturn(confFileContents);

        //when
        AgentResponseDto responseDto = agentService.getAgent(agent.getId());

        //then
        assertThat(responseDto.getId()).isEqualTo(agent.getId());
        assertThat(responseDto.getName()).isEqualTo(agent.getName());
        assertThat(responseDto.getPid()).isEqualTo(agent.getPid());
        assertThat(responseDto.getStatus()).isEqualTo(agent.getStatus());
        assertThat(responseDto.getLastSourceSignalReceivedAt()).isEqualTo(agent.getLastSourceSignalDatetime());
        assertThat(responseDto.getLastSinkSignalReceivedAt()).isEqualTo(agent.getLastSinkSignalDatetime());
        assertThat(responseDto.getConfFileContents()).isEqualTo(confFileContents);
    }

    @Test
    @DisplayName("Flume 에이전트 조회 실패 (Agent ID Not found)")
    void getAgentInfoFailCauseNotFound() {
        //given
        long agentId = 1L;
        given(agentRepository.findByIdFetchJoinDataModel(agentId)).willReturn(Optional.empty());

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.getAgent(agentId);
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
        verify(fileService, never()).readFile(any());
    }

    @Test
    @DisplayName("Flume 에이전트 조회 실패 (File Error)")
    void getAgentInfoFailCauseFileError() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findByIdFetchJoinDataModel(agent.getId())).willReturn(Optional.of(agent));
        given(fileService.readFile(agent.getConfigFileFullPath()))
                .willThrow(new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, agent.getConfigFileFullPath() + " file read error"));

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.getAgent(agent.getId());
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("Flume 에이전트 목록 조회 성공")
    void getAgentInfoList() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        List<Agent> agentList = new ArrayList<>();
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");
        agentList.add(agent);
        AgentRequestDto agentRequestDto2 = AgentRequestDto.builder()
                .name("testAgent2")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent2 = new HttpAgent(agentRequestDto2, "/");
        agentList.add(agent2);
        Pageable pageable = PageRequest.of(0, 10);

        given(agentRepository.findByStatusAndNameContainsAndNotDeletedOrderByName(eq(null), eq(null), any(Pageable.class))).willReturn(new PageImpl<>(agentList));

        //when
        AgentListResponseDto responseDto = agentService.getAgentList(null, null, pageable);

        //then
        assertThat(responseDto.getData().size()).isEqualTo(agentList.size());
        assertThat(responseDto.getData().get(0).getId()).isEqualTo(agent.getId());
        assertThat(responseDto.getData().get(0).getName()).isEqualTo(agent.getName());
        assertThat(responseDto.getData().get(0).getPid()).isEqualTo(agent.getPid());
        assertThat(responseDto.getData().get(0).getStatus()).isEqualTo(agent.getStatus());
        assertThat(responseDto.getData().get(0).getLastSourceSignalReceivedAt()).isEqualTo(agent.getLastSourceSignalDatetime());
        assertThat(responseDto.getData().get(0).getLastSinkSignalReceivedAt()).isEqualTo(agent.getLastSinkSignalDatetime());
    }

    @Test
    @DisplayName("Flume 에이전트 수정 성공")
    void updateAgent() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));

        String confFileContents = "test confFileContents";
        given(configProvider.getConfFileContents(eq(agent), any(AgentRequestDto.class)))
                .willReturn(confFileContents);

        //when
        AgentResponseDto responseDto = agentService.updateAgent(agent.getId(), agentRequestDto, "token");

        //then
        verify(configProvider).getConfFileContents(eq(agent), any(AgentRequestDto.class));
        verify(fileService).createOrReplaceFile(agent.getConfigFileFullPath(), confFileContents);

        assertThat(responseDto.getId()).isEqualTo(agent.getId());
        assertThat(responseDto.getName()).isEqualTo(agent.getName());
        assertThat(responseDto.getPid()).isEqualTo(agent.getPid());
        assertThat(responseDto.getStatus()).isEqualTo(agent.getStatus());
        assertThat(responseDto.getLastSourceSignalReceivedAt()).isEqualTo(agent.getLastSourceSignalDatetime());
        assertThat(responseDto.getLastSinkSignalReceivedAt()).isEqualTo(agent.getLastSinkSignalDatetime());
        assertThat(responseDto.getConfFileContents()).isEqualTo(confFileContents);
    }

    @Test
    @DisplayName("Flume 에이전트 수정 실패 (Agent ID not found)")
    void updateAgentFailCauseNotFound() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .connTerm("30")
                .models(models)
                .build();
        long agentId = 1L;

        given(agentRepository.findById(agentId)).willReturn(Optional.empty());

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.updateAgent(agentId, agentRequestDto, "token");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
        verify(configProvider, never()).getConfFileContents(any(), any());
        verify(fileService, never()).createOrReplaceFile(any(), any());
    }

    @Test
    @DisplayName("Flume 에이전트 수정 실패 (Agent is running)")
    void updateAgentFailCauseAgentIsRunning() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");
        agent.setStatus(AgentStatus.RUN);

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.updateAgent(agent.getId(), agentRequestDto, "token");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.OPERATION_NOT_SUPPORTED);
        verify(configProvider, never()).getConfFileContents(any(), any());
        verify(fileService, never()).createOrReplaceFile(any(), any());
    }

    @Test
    @DisplayName("Flume 에이전트 수정 실패 (File replace error)")
    void updateAgentFailCauseFileReplaceError() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findById(agent.getId())).willReturn(Optional.of(agent));
        String confFileContents = "test confFileContents";
        given(configProvider.getConfFileContents(eq(agent), any(AgentRequestDto.class)))
                .willReturn(confFileContents);

        willThrow(new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, agent.getConfigFileFullPath() + " file read error"))
                .given(fileService).createOrReplaceFile("/" + agent.getId() + "_" + agentRequestDto.getName() + Constants.CONF_FILE_EXTENSION, confFileContents);

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.updateAgent(agent.getId(), agentRequestDto, "token");
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
        verify(configProvider).getConfFileContents(eq(agent), any(AgentRequestDto.class));
        verify(fileService).createOrReplaceFile("/" + agent.getId() + "_" + agentRequestDto.getName() + Constants.CONF_FILE_EXTENSION, confFileContents);
    }

    @Test
    @DisplayName("에이전트 last signal time 변경 성공")
    void updateLastSignalDatetime() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findByIdForUpdate(agent.getId())).willReturn(Optional.of(agent));

        //when
        Agent result = agentService.updateLastSignalDatetime("source", agent.getId());

        //then
        assertThat(result.getId()).isEqualTo(agent.getId());
        assertThat(result.getName()).isEqualTo(agent.getName());
        assertThat(result.getPid()).isEqualTo(agent.getPid());
        assertThat(result.getStatus()).isEqualTo(agent.getStatus());
        assertThat(result.getLastSinkSignalDatetime()).isNull();
        assertThat(result.getLastSourceSignalDatetime()).isNotNull();
    }

    @Test
    @DisplayName("에이전트 last signal time 변경 실패 (Agent ID not found)")
    void updateLastSignalDatetimeFailCauseNotFound() {
        //given
        long agentId = 1L;
        given(agentRepository.findByIdForUpdate(agentId)).willReturn(Optional.empty());
        String type = "source";

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.updateLastSignalDatetime(type, agentId);
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    }

    @Test
    @DisplayName("에이전트 last signal time 변경 실패 (invalid type)")
    void updateLastSignalDatetimeFailCauseInvalidType() {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto agentRequestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .urlAddress("http://test.test")
                .isCustomTopic(true)
                .topic("topic")
                .connTerm("30")
                .models(models)
                .build();
        Agent agent = new HttpAgent(agentRequestDto, "/");

        given(agentRepository.findByIdForUpdate(agent.getId())).willReturn(Optional.of(agent));
        String type = "invalid";

        //when
        AgentException exception = Assertions.assertThrows(AgentException.class, () -> {
            agentService.updateLastSignalDatetime(type, agent.getId());
        });

        //then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST_DATA);
    }
}