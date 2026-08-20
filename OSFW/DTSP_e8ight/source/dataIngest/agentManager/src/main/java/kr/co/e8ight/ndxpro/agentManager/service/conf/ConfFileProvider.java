package kr.co.e8ight.ndxpro.agentManager.service.conf;

import java.util.List;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;

/**
 * Agent 타입별 flume conf 파일 생성기.
 * 타입을 추가할 때는 이 인터페이스의 구현체를 하나 더 등록하면 되고,
 * AgentConfigProvider 나 AgentService 는 수정할 필요가 없다.
 */
public interface ConfFileProvider {

    List<AgentType> getSupportedTypes();

    /**
     * 해당 타입에서 필수인 요청 필드를 검증한다.
     * 타입마다 필수 필드가 달라 DTO 의 bean validation 으로는 처리할 수 없다.
     */
    void validate(AgentRequestDto requestDto);

    String getConfFileContents(Agent agent, AgentRequestDto requestDto);

    /**
     * 사용자가 직접 편집한 conf 파일이 이 타입의 agent 로 기동 가능한지 검증한다.
     * 필수 키가 빠지면 flume 이 조용히 실패하거나 상태 감시가 오작동한다.
     */
    void validateConfFileContents(Agent agent, String contents);
}
