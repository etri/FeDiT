package kr.co.e8ight.ndxpro.translatorManager.dto;

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
