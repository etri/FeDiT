package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class MemberResponseDto {
    Long id;
    String memberId;
    String hp;
}
