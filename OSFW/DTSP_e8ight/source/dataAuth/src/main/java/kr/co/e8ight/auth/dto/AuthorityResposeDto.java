package kr.co.e8ight.auth.dto;

import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter @Getter
public class AuthorityResposeDto

{
    private Integer id;
    private String memberId;
    private AuthType authType;
    private ApproveLevel approveLevel;
    private String rjReason;
    private LocalDateTime updateAt;
}
