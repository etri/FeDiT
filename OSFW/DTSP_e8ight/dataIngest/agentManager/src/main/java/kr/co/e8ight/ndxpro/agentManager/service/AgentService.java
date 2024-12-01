package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.config.OperaterProvider;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentOperation;
import kr.co.e8ight.ndxpro.agentManager.domain.DataModel;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentResponseDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.repository.AgentRepository;
import kr.co.e8ight.ndxpro.agentManager.service.operater.Operater;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AgentService {
    private final AgentRepository agentRepository;
    private final AgentConfigProvider configProvider;
    private final FileService fileService;
    private final DataModelService dataModelService;
    private final TranslatorManagerService translatorManagerService;
    private final OperaterProvider operaterProvider;
    private final AgentHistoryService agentHistoryService;

    @Transactional
    public AgentResponseDto createAgent(AgentRequestDto requestDto, String memberId) {
        dataModelService.checkDataModels(requestDto.getModels());

        String confPath = configProvider.getConfFilePath();

        if ( agentRepository.findByName(requestDto.getName()).isPresent() ) {
            throw new AgentException(ErrorCode.ALREADY_EXISTS, "This agent name already exists.");
        }

        Agent agent = agentRepository.save(Agent.create(requestDto, confPath));
        agentHistoryService.recordHistory(agent, memberId);

        for (DataModel dataModel : DataModel.of(requestDto.getModels())) {
            dataModel.setAgent(agent);
        }

        if ( !requestDto.getIsCustomTopic() ) {
            agent.setTopic("ndxpro.ingest.agent_" + agent.getId());
        } else {
            if ( requestDto.getTopic() == null || requestDto.getTopic().equals("") ) {
                throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Kafka target topic is required.");
            }
        }

        agent.generateConfigFileName();
        String confFileContents = configProvider.getConfFileContents(agent, requestDto);
        fileService.createOrReplaceFile(agent.getConfigFileFullPath(), confFileContents);

        return AgentResponseDto.from(agent, confFileContents);
    }

    @Transactional
    public AgentResponseDto deleteAgent(Long agentId, String memberId) {
        Agent agent = agentRepository.findById(agentId).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found");
        });

        if ( agent.getStatus().isAlive() ) {
            throw new AgentException(ErrorCode.OPERATION_NOT_SUPPORTED, "Agent id :" + agentId + " is currently running, Stop agent before deleting.");
        }

        if ( translatorManagerService.existByAgentId(agentId) ) {
            throw new AgentException(ErrorCode.OPERATION_NOT_SUPPORTED, "Translator is exist on Agent ID : " + agentId);
        }

        agent.delete();
        agentHistoryService.recordHistory(agent, memberId);
        agent.setName(null);
        return AgentResponseDto.from(agent);
    }

    @Transactional
    public AgentResponseDto operate(Long agentId, String operation, String memberId) {
        Agent agent = agentRepository.findById(agentId).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found");
        });

        if ( agent.getStatus().equals(AgentStatus.DELETED) ) {
            throw new AgentException(ErrorCode.OPERATION_NOT_SUPPORTED, "Agent id :" + agentId + " is Deleted.");
        }
        if (isConfigFileNotExist(agent.getConfigFileFullPath())) {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent config file not found.");
        }

        Operater operater = operaterProvider.getOperater(AgentOperation.getOperation(operation));
        Agent operated = operater.operate(agent);

        translatorManagerService.operateAllByAgentId(agentId, operation);
        agentHistoryService.recordHistory(operated, memberId);

        return AgentResponseDto.from(operated);
    }

    public AgentResponseDto getAgent(Long agentId) {
        Agent agent = agentRepository.findByIdFetchJoinDataModel(agentId).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found");
        });

        String confFileContents = fileService.readFile(agent.getConfigFileFullPath());

        return AgentResponseDto.from(agent, confFileContents);
    }

    public AgentResponseDto getAgentByName(String name) {
        Agent agent = agentRepository.findByNameFetchJoinDataModel(name).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent name :" + name + " not found");
        });

        String confFileContents = fileService.readFile(agent.getConfigFileFullPath());

        return AgentResponseDto.from(agent, confFileContents);
    }

    public AgentListResponseDto getAgentList(String name, String status, Pageable pageable) {
        PageImpl<Agent> agentList = agentRepository.findByStatusAndNameContainsAndNotDeletedOrderByName(AgentStatus.of(status), name, pageable);

        AgentListResponseDto agentListResponseDto = new AgentListResponseDto(agentList.getTotalElements(), agentList.getTotalPages());
        agentList.forEach(agent ->
                agentListResponseDto.getData()
                        .add(AgentResponseDto.from(agent))
        );

        return agentListResponseDto;
    }

    @Transactional
    public AgentResponseDto updateAgent(Long agentId, AgentRequestDto requestDto) {
        dataModelService.checkDataModels(requestDto.getModels());

        Agent agent = agentRepository.findById(agentId).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found");
        });
        if ( agent.getStatus().isAlive() ) {
            throw new AgentException(ErrorCode.OPERATION_NOT_SUPPORTED, "Agent id :" + agentId + " is currently running, Stop agent before update.");
        }

        agent.update(requestDto);

        String confFileContents = configProvider.getConfFileContents(agent, requestDto);
        fileService.createOrReplaceFile(agent.getConfigFileFullPath(), confFileContents);

        return AgentResponseDto.from(agent, confFileContents);
    }

    @Transactional
    public Agent updateLastSignalDatetime(String type, Long agentId) {
        Agent agent = agentRepository.findByIdForUpdate(agentId).orElseThrow(() -> {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Agent id :" + agentId + " not found");
        });
        if ( type.equals("source") ) {
            agent.updateLastSourceSignalDatetime();
        } else if ( type.equals("sink") ) {
            agent.updateLastSinkSignalDatetime();
        } else {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Signal Type :" + type + " is invalid");
        }
        return agent;
    }

    private boolean isConfigFileNotExist(String configFilePath) {
        return !fileService.isExistFile(configFilePath);
    }
}
