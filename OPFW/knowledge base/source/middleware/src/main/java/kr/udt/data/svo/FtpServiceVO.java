package kr.udt.data.svo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * @설명 : (S)FTP파일 서비스 유틸클래스에 사용될 공통 VO 정의
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 15.
 * @비고 : 롬복 빌더 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FtpServiceVO {

	
	//JOB_LINK_CONFIG의 JOB_TYPE, 1은 FTP 2는 SFTP
	private String ftpType;
	
	private String ftpOsUser;
	
	private String ftpUserPass;
	
	private String ftpLinkIp;
	
	private int ftpPort;

	private String ftpFileDir;
	
	private String ftpFileNm;
	
	private String ftpFileExt;
	
	private String ftpRecvFileSaveDir;
	
	private String ftpUploadDir;
	
	private String ftpUploadFileFullPath;
	
}
