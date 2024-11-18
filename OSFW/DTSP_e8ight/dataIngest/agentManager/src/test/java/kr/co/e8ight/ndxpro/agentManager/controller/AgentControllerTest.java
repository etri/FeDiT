package kr.co.e8ight.ndxpro.agentManager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentOperation;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonField;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.*;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.service.AgentService;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import kr.co.e8ight.ndxpro.agentManager.service.MemberService;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.common.exception.handler.ControllerAdvice;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AgentController.class)
@Import(ControllerAdvice.class)
class AgentControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private AgentService agentService;

    @MockBean
    private MemberService memberService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("POST /ndxpro/v1/ingest/agents : Flume 에이전트 생성 API 성공")
    void createAgentSuccess() throws Exception {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto requestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .models(models)
                .urlAddress("http://test:8080")
                .connTerm("30")
                .method("GET")
                .isCustomTopic(true)
                .topic("lji.dev.pintel.simul.org")
                .build();
        String requestBody = objectMapper.writeValueAsString(requestDto);

        AgentResponseDto responseDto = AgentResponseDto.builder()
                .id(1L)
                .name(requestDto.getName())
                .status(AgentStatus.STOP)
                .type(requestDto.getType())
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();

        String token = "test token";
        String username = "testuser";

        given(memberService.getMemberId(token))
                .willReturn(username);
        given(agentService.createAgent(any(AgentRequestDto.class), eq(username), "token"))
                .willReturn(responseDto);

        //when
        mvc.perform(post("/ndxpro/v1/ingest/agents").content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", token))
                .andDo(print())
                //then
                .andExpect(status().isCreated())
                .andExpect(jsonPath("id").value(responseDto.getId()))
                .andExpect(jsonPath("name").value(responseDto.getName()))
                .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                .andExpect(jsonPath("type").value(responseDto.getType().name()))
                .andExpect(jsonPath("pid").value(responseDto.getPid()))
                .andExpect(jsonPath("confFileContents").value(responseDto.getConfFileContents()));
    }

    @Test
    @DisplayName("POST /ndxpro/v1/ingest/agents : Flume 에이전트 생성 API 실패 (필수 요청 데이터 누락)")
    void createAgentFailCauseRequestParamNull() throws Exception {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto requestDto = AgentRequestDto.builder()
                .type(AgentType.HTTP)
                .models(models)
                .urlAddress("http://test:8080")
                .connTerm("30")
                .build();
        String requestBody = objectMapper.writeValueAsString(requestDto);

        //when
        mvc.perform(post("/ndxpro/v1/ingest/agents").content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.INVALID_REQUEST.getStatus().value()))
                .andExpect(jsonPath("type").value(ErrorCode.INVALID_REQUEST.getType()))
                .andExpect(jsonPath("code").value(ErrorCode.INVALID_REQUEST.getCode()));
    }

    @Test
    @DisplayName("PATCH /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 운영 API 성공")
    void startAgentSuccess() throws Exception {
        //given
        String operation = AgentOperation.RUN.name();
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto operationRequestDto = new OperationRequestDto(operation, bodyInfo);

        String requestBody = objectMapper.writeValueAsString(operationRequestDto);

        AgentResponseDto responseDto = AgentResponseDto.builder()
                .id(1L)
                .name("testAgent")
                .status(AgentStatus.RUN)
                .type(AgentType.HTTP)
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();

        String token = "test token";
        String username = "testuser";

        given(memberService.getMemberId(token))
                .willReturn(username);
        given(agentService.operate(eq(responseDto.getId()), any(OperationRequestDto.class), eq(username)))
                .willReturn(responseDto);

        //when
        mvc.perform(patch("/ndxpro/v1/ingest/agents/"+responseDto.getId())
                        .content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", token))
                .andDo(print())
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("id").value(responseDto.getId()))
                .andExpect(jsonPath("name").value(responseDto.getName()))
                .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                .andExpect(jsonPath("type").value(responseDto.getType().name()))
                .andExpect(jsonPath("pid").value(responseDto.getPid()))
                .andExpect(jsonPath("confFileContents").value(responseDto.getConfFileContents()));
    }

    @Test
    @DisplayName("PATCH /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 운영 API 실패 (필수 요청 데이터 누락)")
    void startAgentFailCauseRequestParamNull() throws Exception {
        //given
        String operation = null;
        OperationRequestDto operationRequestDto = new OperationRequestDto(operation);
        String requestBody = objectMapper.writeValueAsString(operationRequestDto);

        //when
        mvc.perform(patch("/ndxpro/v1/ingest/agents/1")
                        .content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.INVALID_REQUEST.getStatus().value()))
                .andExpect(jsonPath("type").value(ErrorCode.INVALID_REQUEST.getType()))
                .andExpect(jsonPath("code").value(ErrorCode.INVALID_REQUEST.getCode()));
    }

    @Test
    @DisplayName("PATCH /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 운영 API 실패 (존재하지 않는 Agent ID)")
    void startAgentFailCauseNotFound() throws Exception {
        //given
        String operation = AgentOperation.RUN.name();
        Map<String , JsonField> bodyInfo = new HashMap<>();
        bodyInfo.put("fromDtm", new JsonField("20230502000000", JsonType.STRING, true));
        bodyInfo.put("toDtm", new JsonField("20230502000001", JsonType.STRING, true));
        OperationRequestDto operationRequestDto = new OperationRequestDto(operation, bodyInfo);
        long agentId = 1L;
        String requestBody = objectMapper.writeValueAsString(operationRequestDto);
        String token = "test token";
        String username = "testuser";

        given(memberService.getMemberId(token))
                .willReturn(username);
        given(agentService.operate(eq(agentId), any(OperationRequestDto.class), eq(username)))
                .willThrow(new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found"));

        //when
        mvc.perform(patch("/ndxpro/v1/ingest/agents/" + agentId)
                        .content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.RESOURCE_NOT_FOUND.getStatus().value()))
                .andExpect(jsonPath("title").value(ErrorCode.RESOURCE_NOT_FOUND.getTitle()))
                .andExpect(jsonPath("code").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("DELETE /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 제거 API 성공")
    void deleteAgentSuccess() throws Exception {
        //given
        AgentResponseDto responseDto = AgentResponseDto.builder()
                .id(1L)
                .name("testAgent")
                .status(AgentStatus.STOP)
                .type(AgentType.HTTP)
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();
        String token = "test token";
        String username = "testuser";

        given(memberService.getMemberId(token))
                .willReturn(username);
        given(agentService.deleteAgent(responseDto.getId(), username, token))
                .willReturn(responseDto);

        //when
        mvc.perform(delete("/ndxpro/v1/ingest/agents/"+responseDto.getId())
                        .header("Authorization", token))
                .andDo(print())
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("id").value(responseDto.getId()))
                .andExpect(jsonPath("name").value(responseDto.getName()))
                .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                .andExpect(jsonPath("type").value(responseDto.getType().name()))
                .andExpect(jsonPath("pid").value(responseDto.getPid()))
                .andExpect(jsonPath("confFileContents").value(responseDto.getConfFileContents()));
    }

    @Test
    @DisplayName("DELETE /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 제거 API 실패 (존재하지 않는 Agent ID)")
    void deleteAgentFailCauseNotFound() throws Exception {
        //given
        long agentId = 1L;
        String token = "test token";
        String username = "testuser";

        given(memberService.getMemberId(token))
                .willReturn(username);
        given(agentService.deleteAgent(agentId, username, token))
                .willThrow(new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found"));

        //when
        mvc.perform(delete("/ndxpro/v1/ingest/agents/"+agentId)
                        .header("Authorization", token))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.RESOURCE_NOT_FOUND.getStatus().value()))
                .andExpect(jsonPath("title").value(ErrorCode.RESOURCE_NOT_FOUND.getTitle()))
                .andExpect(jsonPath("code").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("GET /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 조회 API 성공")
    void getAgentInfoSuccess() throws Exception {
        //given
        AgentResponseDto responseDto = AgentResponseDto.builder()
                .id(1L)
                .name("testAgent")
                .status(AgentStatus.STOP)
                .type(AgentType.HTTP)
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();

        given(agentService.getAgent(responseDto.getId()))
                .willReturn(responseDto);

        //when
        mvc.perform(get("/ndxpro/v1/ingest/agent/"+responseDto.getId()))
                .andDo(print())
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("id").value(responseDto.getId()))
                .andExpect(jsonPath("name").value(responseDto.getName()))
                .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                .andExpect(jsonPath("type").value(responseDto.getType().name()))
                .andExpect(jsonPath("pid").value(responseDto.getPid()))
                .andExpect(jsonPath("confFileContents").value(responseDto.getConfFileContents()));
    }

    @Test
    @DisplayName("GET /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 조회 API 실패 (존재하지 않는 Agent ID)")
    void getAgentInfoFailCauseNotFound() throws Exception {
        //given
        long agentId = 1L;
        given(agentService.getAgent(agentId))
                .willThrow(new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found"));

        //when
        mvc.perform(get("/ndxpro/v1/ingest/agent/" + agentId))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.RESOURCE_NOT_FOUND.getStatus().value()))
                .andExpect(jsonPath("title").value(ErrorCode.RESOURCE_NOT_FOUND.getTitle()))
                .andExpect(jsonPath("code").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("GET /ndxpro/v1/ingest/agents : Flume 에이전트 목록 조회 API 성공")
    void getAgentInfoListSuccess() throws Exception {
        //given
        AgentResponseDto responseDto1 = AgentResponseDto.builder()
                .id(1L)
                .name("testAgent1")
                .status(AgentStatus.STOP)
                .type(AgentType.HTTP)
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();
        AgentResponseDto responseDto2 = AgentResponseDto.builder()
                .id(2L)
                .name("testAgent2")
                .status(AgentStatus.STOP)
                .type(AgentType.HTTP)
                .pid(2L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();
        List<AgentResponseDto> responseDtoList = new ArrayList<>();
        responseDtoList.add(responseDto1);
        responseDtoList.add(responseDto2);
        AgentListResponseDto agentListResponseDto = new AgentListResponseDto(responseDtoList, 2L, 1);

        given(agentService.getAgentList(eq(null), eq(null), any(Pageable.class)))
                .willReturn(agentListResponseDto);

        //when
        mvc.perform(get("/ndxpro/v1/ingest/agents"))
                .andDo(print())
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("data").isArray())
                .andExpect(jsonPath("data.size()").value(2))
                .andExpect(jsonPath("data[0].id").value(responseDto1.getId()))
                .andExpect(jsonPath("data[0].name").value(responseDto1.getName()))
                .andExpect(jsonPath("data[0].status").value(responseDto1.getStatus().name()))
                .andExpect(jsonPath("data[0].type").value(responseDto1.getType().name()))
                .andExpect(jsonPath("data[0].pid").value(responseDto1.getPid()))
                .andExpect(jsonPath("data[0].confFileContents").value(responseDto1.getConfFileContents()));
    }

    @Test
    @DisplayName("PUT /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 수정 API 성공")
    void updateAgentSuccess() throws Exception {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        AgentRequestDto requestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .models(models)
                .urlAddress("http://test:8080")
                .connTerm("30")
                .isCustomTopic(true)
                .method("GET")
                .topic("lji.dev.pintel.simul.org")
                .build();
        String requestBody = objectMapper.writeValueAsString(requestDto);

        AgentResponseDto responseDto = AgentResponseDto.builder()
                .id(1L)
                .name(requestDto.getName())
                .status(AgentStatus.STOP)
                .type(requestDto.getType())
                .pid(1L)
                .lastSourceSignalReceivedAt(null)
                .lastSinkSignalReceivedAt(null)
                .confFileContents("test conf file contexts")
                .build();

        given(agentService.updateAgent(eq(responseDto.getId()), any(AgentRequestDto.class)))
                .willReturn(responseDto);

        //when
        mvc.perform(put("/ndxpro/v1/ingest/agents/"+responseDto.getId()).content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("id").value(responseDto.getId()))
                .andExpect(jsonPath("name").value(responseDto.getName()))
                .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                .andExpect(jsonPath("type").value(responseDto.getType().name()))
                .andExpect(jsonPath("pid").value(responseDto.getPid()))
                .andExpect(jsonPath("confFileContents").value(responseDto.getConfFileContents()));
    }

    @Test
    @DisplayName("PUT /ndxpro/v1/ingest/agents/{id} : Flume 에이전트 수정 API 실패 (존재하지 않는 Agent ID)")
    void updateAgentFailCauseNotFound() throws Exception {
        //given
        List<DataModelDto> models = new ArrayList<>();
        models.add(new DataModelDto("vehicle", "context"));
        long agentId = 1L;
        AgentRequestDto requestDto = AgentRequestDto.builder()
                .name("testAgent")
                .type(AgentType.HTTP)
                .models(models)
                .urlAddress("http://test:8080")
                .connTerm("30")
                .isCustomTopic(true)
                .method("GET")
                .topic("lji.dev.pintel.simul.org")
                .build();
        String requestBody = objectMapper.writeValueAsString(requestDto);

        given(agentService.updateAgent(eq(agentId), any(AgentRequestDto.class)))
                .willThrow(new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found"));

        //when
        mvc.perform(put("/ndxpro/v1/ingest/agents/"+agentId).content(requestBody)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                //then
                .andExpect(status().is(ErrorCode.RESOURCE_NOT_FOUND.getStatus().value()))
                .andExpect(jsonPath("title").value(ErrorCode.RESOURCE_NOT_FOUND.getTitle()))
                .andExpect(jsonPath("code").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
    }
}