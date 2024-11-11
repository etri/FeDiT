package net.jcms.framework.security.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import net.jcms.framework.base.model.BaseModel;

import java.util.Date;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
public class User extends BaseModel {
	private Long userId;
	private String userLoginId;
	private Long institutionId;
	private String userNm;
	private String userPwd;
	private String userDi;
	private String birth;
	private String gender;
	private Boolean adultYn;
	private String email;
	private String addr;
	private String mobile;
	private int failCnt;
	private String userSt;
	private String userOutRsn;
}
