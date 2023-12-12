package kr.udt.data.job.abst;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import kr.udt.data.constant.UdtCommonConstant;
import kr.udt.data.dto.JobLinkConfigDTO;
import kr.udt.data.dto.JobMstDTO;
import kr.udt.data.dto.JobRunDetailHstDTO;
import kr.udt.data.dto.JobRunHstDTO;
import kr.udt.data.dto.ProcessMstDTO;
import kr.udt.data.dto.UdtFileDTO;
import kr.udt.data.mapper.UdtDataFlowMapper;
import kr.udt.data.svo.FtpServiceVO;
import kr.udt.data.util.UdtCommonUtil;
import kr.udt.data.util.UdtFileUtil;

/**
 * @설명 : 스케줄러가 실행시킬 Job Class에 대한 추상클래스 정의
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 11. 03.
 * @비고 : execute 추상 메서드를 오버라이딩하여 실제 배치 실행부를 구현한다, 또한 각 Job Class가 공통적으로 쓰는 함수에 대해 기본 공통메소드로 정의한다.
 */
public abstract class UdtJobAbstractClass {
	
	@Value("${udt.ftp.user}")
	private String ftpUser;
	
	@Value("${udt.ftp.pass}")
	private String ftpUserPass;
	
	@Value("${udt.sftp.upload.user}")
	private String sftpUploadUser;
	
	@Value("${udt.sftp.upload.pass}")
	private String sftpUploadPass;
	
	@Value("${udt.sftp.upload.ip}")
	private String sftpUploadrIp;
	
	@Value("${udt.sftp.upload.port}")
	private String sftpUploadrPort;
	
	@Value("${udt.smpt.mailsvr.ip}")
	private String smptMailsvrIp;
	
	@Value("${udt.smpt.mailsvr.pass}")
	private String smptMailsvrPass;
	
	@Value("${udt.smpt.mailsvr.user}")
	private String smptMailsvrUser;
	
	@Value("${udt.smpt.mailsvr.port}")
	private String smptMailsvrPort;
	
	@Value("${udt.smpt.mailsvr.sender}")
	private String smptMailsvrSender;

	@Autowired
	private UdtDataFlowMapper mapper;
	
	@Autowired
	private UdtFileUtil fileUtil;
	
	/**
	 * @설명 : 배치 실행부 작성
	 * @생성일 : 2022. 10. 12.
	 * @파라미터 : JobMstDTO - 잡 정보 DTO
	 * @리턴 : void
	 * @비고 : execute 추상 메서드를 오버라이딩하여 실제 배치 실행부를 구현
	 */
	 public abstract void execute(JobMstDTO jobInfo);
	 
	 
	/**
	 * @설명 : 프로세스 시작시 잡 실행이력(JOB_RUN_HST)을 등록한다.
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : JobMstDTO - 잡 정보 DTO
	 * @리턴 : jobRunHstDTO - insert된 잡 실행이력 DTO
	 * @비고 : 
	 */
	 public JobRunHstDTO processStart(JobMstDTO jobInfo, long jobStartTime) {
		 JobRunHstDTO jobRunHstDTO = this.settingJobRunHstDTO(jobInfo);
		 String jobStartDt = UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,jobStartTime);
		 jobRunHstDTO.setJobStartDt(jobStartDt);
		 mapper.insertJobRunHstCreate(jobRunHstDTO);
		 return jobRunHstDTO;
	 }
	 
	 /**
	 * @설명 : 프로세스 종료시 잡 실행이력(JOB_RUN_HST)을 저장한다.
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : JobRunHstDTO - 잡 실행이력 DTO
	 * @리턴 : JobRunHstDTO - 업데이트된 잡 실행이력 DTO
	 * @비고 : 
	 */
	 public JobRunHstDTO processEnd(JobRunHstDTO jobRunHstDTO) {
		 mapper.updateJobRunHst(jobRunHstDTO);
		 return jobRunHstDTO;
	 }
		
		
	/**
	 * @설명 : 각 프로세스 단계가 완료될 때 호출된다.(모니터링을 위해 처리완료된 프로세스 단계를 기록하며 로그생성 및 프로세스 스텝 다음단계 설정)
	 * @생성일 : 2022. 10. 10.
	 * @파라미터 : int 현 진행중인 프로세스 단계, JobRunHstDTO 잡실행이력 dto, List<ProcessMstDTO> 해당 잡 내부 프로세스리스트, Logger 해당 잡(상속받은 클래스)의 로거
	 * 			long 프로세스시작시간(ms),  long 프로세스 종료시간(ms)
	 * @리턴 : int - 다음 프로세스단계
	 * @비고 : 배치 실행부(execute) 내 각 프로세스가 끝날때마다 호출
	 */
	 public int nextStep(int processStep,JobRunHstDTO jobRunHstDTO,List<ProcessMstDTO> processList
			 	, Logger logger, long processStartTime, long processEndTime) {
		 
		 boolean isFinalStep = (processStep==processList.size())?true:false;
		 
		 //잡 실행이력 실행단계 갱신
		 jobRunHstDTO.setJobEndAt("N");
		 jobRunHstDTO.setProcessSn(new BigDecimal(processStep));
		 mapper.updateJobRunHst(jobRunHstDTO);
		 
		 //잡 상세 실행이력(프로세스)등록
		 JobRunDetailHstDTO jobRunDetailHstDTO = settingJobRunDetailHstDTO(jobRunHstDTO,processList.get(processStep-1));
		 String processStartDt = UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,processStartTime);
		 String processEndDt = UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,processEndTime);
		 jobRunDetailHstDTO.setProcessStartDt(processStartDt);
		 jobRunDetailHstDTO.setProcessEndDt(processEndDt);
		 jobRunDetailHstDTO.setProcessElapTime(new BigDecimal(processEndTime-processStartTime));
		 jobRunDetailHstDTO.setProcessEndRslt("S");
		 mapper.insertJobRunDetailHst(jobRunDetailHstDTO);
		 
		 
		 //현재 프로세스 단계 종료로그
		 String logTitle = "["+jobRunHstDTO.getJobNmKr()+"]";
		 loggingProcessEnd(logTitle, processStep, processList, logger);
		 
		 
		 //다음 프로세스 단계 진입 로그
		 if(!isFinalStep) {
			 processStep = processStep+1;
			 loggingProcessStart(logTitle, processStep, processList, logger);
		 }else {
			 processStep=0;
		 }
		 return processStep;
	 }
	 
	 
	/**
	 * @설명 : 배치 실행부(execute)에서 예외 발생시 해당 잡과 프로세스 단계에 대한 로그기록 (연계 모니터링에 사용)
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : String 로그제목, int 현 프로세스단계, List 해당잡의 프로세스리스트, Logger 해당 잡클래스의 로거, 
	 * 			 Exception 발생 예외, JobRunHstDto 해당 잡의 실행이력 DTO(nullable), long 잡 실행시간, long 현 프로세스단계 실행시간 
	 * @리턴 : void
	 * @비고 : 배치 실행부(execute)에서 예외를 공통적으로 처리하기위해, execute() 내부에서 호출되는 다른 메소드들은 예외처리없이 익셉션을 throw해야함.
	 */
	 public void rebJobExceptionHandle(String logTitle, int processStep, List<ProcessMstDTO> processList,
				Logger logger, Exception e, JobRunHstDTO jobRunHstDTO, long jobStartTime, long processStartTime) {
			
		String eMessage = ExceptionUtils.getMessage(e);
		String eStactTrace = ExceptionUtils.getStackTrace(e);
		
		if(!processList.isEmpty()) {
			logger.error(logTitle+"프로세스 "+processStep+"단계("+ processList.get(processStep-1).getProcessNmKr()+") 실행중 에러가 발생하였습니다.\n"
					+ "에러메시지: ["+eMessage+"]");
		}else {
			logger.error(logTitle+"프로세스 로딩중 에러가 발생하였습니다. 에러메시지: ["+eMessage+"]");
		}
		
		if(jobRunHstDTO!=null&&processStep!=0) {
			 //잡실행이력 실패처리 (UPDATE)
			 long jobEndTime =System.currentTimeMillis();
			 long jobElapTime = jobEndTime-jobStartTime;
			 String jobEndDt = UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,jobEndTime);
			 jobRunHstDTO.setJobEndAt("Y");
			 jobRunHstDTO.setJobEndRslt("F");
			 jobRunHstDTO.setProcessSn(null);
			 jobRunHstDTO.setJobEndDt(jobEndDt);
			 jobRunHstDTO.setJobElapTime(new BigDecimal(jobElapTime));
			 mapper.updateJobRunHst(jobRunHstDTO);
			
			 //잡 실행 상세이력(프로세스 단계정보)실패로 INSERT
			 String processStartDt = UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,processStartTime);
			 JobRunDetailHstDTO jobRunDetailHstDTO = settingJobRunDetailHstDTO(jobRunHstDTO,processList.get(processStep-1));
			 jobRunDetailHstDTO.setProcessEndRslt("F");
			 jobRunDetailHstDTO.setProcessErrCont(eStactTrace);
			 jobRunDetailHstDTO.setProcessStartDt(processStartDt);
			 mapper.insertJobRunDetailHst(jobRunDetailHstDTO);
		}
		
		e.printStackTrace();
	 }
	 
	/**
	 * @설명 : 각 프로세스 단계 실행시 로그를 남긴다.
	 * @생성일 : 2022. 10. 15.
	 * @파라미터 : String 로그제목([+실행중인 잡의 한글명+]), int 프로세스단계, List<ProcessMstDTO> 해당 잡 내부 프로세스리스트, 해당 잡(상속받은 클래스)의 로거
	 * @리턴 : void
	 * @비고 : 
	 */
	 public void loggingProcessStart(String logTitle, int processStep, List<ProcessMstDTO> processList, Logger logger) {
		logger.info(logTitle+"프로세스 "+processStep+"단계를 시작합니다. ["+ processList.get(processStep-1).getProcessNmKr()+"]");
	 }
	 
	 
	 /**
	 * @설명 : 각 프로세스 단계 종료시 로그를 남긴다.
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : String 로그제목([+실행중인 잡의 한글명+]), int 프로세스단계, List<ProcessMstDTO> 해당 잡 내부 프로세스리스트, 해당 잡(상속받은 클래스)의 로거
	 * @리턴 : void
	 * @비고 : 
	 */
	public void loggingProcessEnd(String logTitle, int processStep, List<ProcessMstDTO> processList, Logger logger) {
			logger.info(logTitle+"프로세스 "+processStep+"단계가 종료되었습니다. ["+ processList.get(processStep-1).getProcessNmKr()+"]");
		 }
	 
	 
	 
	/**
	 * @설명 : JobConfig DTO to FTP Service VO 컨버팅
	 * @생성일 : 2022. 10. 15.
	 * @파라미터 : JobLinkConfigDTO - 잡 연계 설정정보 DTO
	 * @리턴 : FtpServiceVO
	 * @비고 : 유저와 비밀번호는 db 및 ui로 관리하기엔 위험부담이 있어 application.properties에 기입하여 수동관리한다.
	 */
	 public FtpServiceVO settingFtpServiceVO(JobLinkConfigDTO jobConfig) {
		 return 
			 FtpServiceVO.builder().ftpOsUser(ftpUser).ftpUserPass(ftpUserPass).ftpType(jobConfig.getJobType())
				.ftpLinkIp(jobConfig.getUdtFtpLinkIp()).ftpPort(jobConfig.getUdtFtpPort().intValue())
					.ftpFileDir(jobConfig.getUdtFtpFileDir()).ftpFileNm(jobConfig.getUdtFtpFileNm())
						.ftpFileExt(jobConfig.getUdtFtpFileExt()).ftpRecvFileSaveDir(jobConfig.getUdtFtpRecvFileSaveDir())
							.build();
	 }
	 
	/**
	 * @설명 : 중계서버 SFTP 업로드  서비스VO리턴
	 * @생성일 : 2022 . 10. 08
	 * @파라미터 : String 업로드할 경로, String 보낼 파일의 로컬 풀경로(파일명포함) 
	 * @리턴 : FtpServiceVO
	 * @비고 : 
	 */
	 public FtpServiceVO settingUploadSftpServiceVO(String uploadDir, String localFilePath) {
		 return 
				FtpServiceVO.builder().ftpLinkIp(sftpUploadrIp)
					.ftpPort(Integer.parseInt(sftpUploadrPort)).ftpOsUser(sftpUploadUser).ftpUserPass(sftpUploadPass)
						.ftpUploadDir(uploadDir).ftpUploadFileFullPath(localFilePath).build();
	 }
	 
	/**
	 * @설명 : JobMstDTO to JobRunHstDTO 컨버팅
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : JobMstDTO - 잡 정보 DTO
	 * @리턴 : JobRunHstDTO - 잡 실행 이력 DTO
	 * @비고 : 
	 */
	public JobRunHstDTO settingJobRunHstDTO(JobMstDTO jobInfo) {
		 return
			JobRunHstDTO.builder().jobId(jobInfo.getJobId()).jobNmKr(jobInfo.getJobNmKr()).saveTbNm(jobInfo.getSaveTbNm()).build();
	 }
	
	
	/**
	 * @설명 : JobRunDetailHstDTO 세팅
	 * @생성일 : 2022. 10. 17.
	 * @파라미터 : JobRunHstDTO - 잡실행이력 DTO, ProcessMstDTO - 프로세스 DTO
	 * @리턴 : JobRunDetailHstDTO - 잡 상새이력 DTO
	 * @비고 : 
	 */
	public JobRunDetailHstDTO settingJobRunDetailHstDTO(JobRunHstDTO jobRunHstDTO,ProcessMstDTO processDTO) {
		return
			JobRunDetailHstDTO.builder().execId(jobRunHstDTO.getExecId())
				.jobId(jobRunHstDTO.getJobId()).processId(processDTO.getProcessId())
					.processNmKr(processDTO.getProcessNmKr()).processSn(processDTO.getProcessSn()).build();
		
	}
	
	
	
	/**
	 * @설명 : 업로드까지 끝난 로컬의 csv파일과 rdf파일을 성공 or 실패 경로로 보냄
	 * @생성일 : 2022. 12. 8.
	 * @파라미터 : String 로컬에저장된csv파일경로(파일명포함), String 로컬에저장된rdf파일경로(파일명포함), bool 잡 성공여부
	 * @리턴 : DB저장한 FILE ID
	 * @비고 : 성공파일 저장경로  > {jobnfig dataset저장경로}/SUCCESS/YYYY/MM/DD/파일 (업로드 순서까지 제대로 끝난경우)
	 * 		    실패파일 저장경로  > {jobnfig dataset저장경로}/FAILED/YYYY/MM/DD/파일 (CSV,RDF파일 만들기까진 되었는데 업로드순서까지 에러가 있는경우)
	 */
	public BigDecimal moveFileAndSaveDataBase(String csvFilePath, String rdfFilePath, boolean isSucceed) throws Exception {
		
		BigDecimal returnFileId=null;
		
		String addFolder =(isSucceed)?"/SUCCESS/":"/FAILED/";
		addFolder+=fileUtil.genYYYYMMDDDirectory();
		boolean isMoveCsvFile=false;
		boolean isMoveRdfFile=false;
		
		try {
			
			String orgCsvFileNm=fileUtil.getOnlyFileNm(csvFilePath);
			String saveCsvFileNm=fileUtil.genMilitimeSaveFileName(orgCsvFileNm);
			
			String saveCsvFilePath=fileUtil.getOnlyPath(csvFilePath);
			saveCsvFilePath+=addFolder;
			isMoveCsvFile=fileUtil.moveFile(saveCsvFileNm, csvFilePath, saveCsvFilePath);
		
		
		
			String orgRdfFileNm=fileUtil.getOnlyFileNm(rdfFilePath);
			String saveRdfFileNm=fileUtil.genMilitimeSaveFileName(orgRdfFileNm);
			String saveRdfFilePath=fileUtil.getOnlyPath(rdfFilePath);
			saveRdfFilePath+=addFolder;
			isMoveRdfFile=fileUtil.moveFile(saveRdfFileNm, rdfFilePath, saveRdfFilePath);
			
		
			if(isMoveCsvFile&&isMoveRdfFile) {
				UdtFileDTO csvFileDTO=this.makeRebFileDTO(saveCsvFilePath, orgCsvFileNm, saveCsvFileNm, "SEND_CSV");
				mapper.insertUdtFile(csvFileDTO);
				UdtFileDTO rdfFileDTO=this.makeRebFileDTO(saveRdfFilePath, orgRdfFileNm, saveRdfFileNm, "SEND_RDF");
				rdfFileDTO.setFileId(csvFileDTO.getFileId());
				mapper.insertUdtFile(rdfFileDTO);
				returnFileId=rdfFileDTO.getFileId();
			}else {
				throw new IOException("파일이동 중 오류가 있습니다. 로그를 확인해주세요");
			}
		}catch(Exception e) {
			throw e;
		}
		return returnFileId;
	}
	
	public UdtFileDTO makeRebFileDTO(String dir, String orgFileNm, String saveFileNm, String fileTipe) throws IOException{
		return
			UdtFileDTO.builder().fileDir(dir).fileOrgNm(orgFileNm).fileSaveNm(saveFileNm)
				.fileExt(fileUtil.getExtName(saveFileNm)).fileSize(Long.toString(Files.size(Paths.get(dir+saveFileNm))))
					.fileType(fileTipe).build();
	}
	
}
