/**
 * 
 */
package kr.udt.data.job;

import java.io.StringReader;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

import org.apache.logging.log4j.ThreadContext;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import kr.udt.data.constant.UdtCommonConstant;
import kr.udt.data.dto.JobLinkConfigDTO;
import kr.udt.data.dto.JobMstDTO;
import kr.udt.data.dto.JobRunHstDTO;
import kr.udt.data.dto.ProcessMstDTO;
import kr.udt.data.job.abst.UdtJobAbstractClass;
import kr.udt.data.mapper.UdtDataFlowMapper;
import kr.udt.data.util.UdtCommonUtil;
import kr.udt.data.util.UdtRestApiUtil;

/**
 * @설명 : openApiJob001 - 제주일별기상정보 OpenAPI 데이터 수집
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022.11.03
 * @비고 : 제주일별기상정보는 API 요청 주소에 API KEY가 들어감
 */
@Component
public class openApiJob001 extends UdtJobAbstractClass {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(openApiJob001.class);
	
	@Autowired
	private UdtDataFlowMapper mapper;
	
	@Autowired
	private UdtRestApiUtil apiUtil;
	
	private String logTitle;
	
	int apiPage=1;
	
	int apiPagePer;
	
	int apiTotalCount = 0;
	
	JSONArray totalResultArray;
	
	int bulkInsertLimit = 300;
	
	/**
	 * @설명 : openApiJob002 API용 맴버변수 초기화
	 * @생성일 : 2022. 11. 03.
	 * @파라미터 : 
	 * @리턴 : void
	 * @비고 : 매 job이 실행될때마다 초기화 되야할 변수들 지정
	 */
	private void init() {
		logTitle="";
		apiTotalCount=0;
		apiPage = 1;
		apiPagePer = 10; // 페이지당 10건씩 설정 (최대 100건까지 가능) TEST 
		totalResultArray= new JSONArray();
	}
	
	/* 스케줄잡 배치 실행부
	 * @see kr.udt.data.job.abst.UdtJobAbstractClass#execute(kr.udt.data.dto.JobMstDTO)
	 */
	@Override
	public void execute(JobMstDTO jobInfo) {
		
		init();
		long jobStartTime=0;
		long jobEndTime=0;
		long processStartTime=0;
		long processEndTime=0;
		int processStep=0;
		JobRunHstDTO jobRunHstDTO=null;
		Timestamp timeStmp=null;
		List<ProcessMstDTO> processList = new ArrayList<ProcessMstDTO>();
		
		try {
			
			jobStartTime=System.currentTimeMillis();
			
			logTitle = "["+jobInfo.getJobNmKr()+"]";
			
			LOGGER.info(logTitle+"스케줄 프로세스가 시작됩니다.");
			LOGGER.info(logTitle+"실행 프로세스 정보 및 연계설정정보를 읽어옵니다."); 
			
			processList = mapper.getProcessMstWithSnByJobId(jobInfo);
			JobLinkConfigDTO jobConfig = mapper.getOneJobLinkConfig(jobInfo);
			
			LOGGER.info(logTitle+"실행 프로세스 총 ["+processList.size()+"단계]");
			
			for(ProcessMstDTO processInfo : processList) {
				int logSn=processList.indexOf(processInfo)+1;
				LOGGER.info(logTitle+"실행 프로세스 정보("+logSn+"단계) : "+processInfo.toString());
			}
			
			LOGGER.info(logTitle+"잡 설정정보 : "+jobConfig.toString());
			
			// 호출 시점의 시간을 얻어옴
			Calendar cal = Calendar.getInstance();
			timeStmp = new Timestamp(cal.getTimeInMillis());
			
			//프로세스 호출전 job 실행이력 생성(처리상태 N, 시작시간만 등록)
			jobRunHstDTO  = super.processStart(jobInfo, jobStartTime);
			
		//프로세스  시작
			processStep=1;
			super.loggingProcessStart(logTitle, processStep, processList, LOGGER);
			
		//프로세스 1 OpenAPI 데이터 수집
			processStartTime=System.currentTimeMillis();
			//프로세스 1 구현 (api 호출, db저장)
			if(jobConfig.getJobType().equals("OPENAPI")) {
				
				// 데이터 저장 필드 정보
				String udtApiFieldList = jobConfig.getUdtApiFieldList();
				String[] _headers = udtApiFieldList.split(",");
				
				// 제주일별기상정보
				JSONArray apiResultData = callGetApiForJob002(jobConfig, true); // (true: 데이터가 페이징처리 결과로 넘어옴)

				if(apiResultData.length()>0) {
					saveDatabaseByApiResut(apiResultData, _headers, jobInfo.getSaveTbNm(), timeStmp);
				}
				
			}
			processEndTime=System.currentTimeMillis();
			processStep = super.nextStep(processStep,jobRunHstDTO,processList,LOGGER,processStartTime,processEndTime);
		//프로세스 1 끝

		//잡 종료(이력 종료처리+이력에 fileId넣기)
			jobEndTime=System.currentTimeMillis();
			jobRunHstDTO.setJobEndAt("Y");
			jobRunHstDTO.setProcessSn(null);
			jobRunHstDTO.setJobEndDt(UdtCommonUtil.getStringTimeByFormatter(UdtCommonConstant.DB_DATESTRING_FORMAAT,jobEndTime));
			jobRunHstDTO.setJobElapTime(new BigDecimal(jobEndTime-jobStartTime));
			//jobRunHstDTO.setSendFileId(saveFileId);
			//jobRunHstDTO.setSendWriteLine(new BigDecimal(resultCount));
			jobRunHstDTO.setJobEndRslt("S");
			super.processEnd(jobRunHstDTO);
			
			LOGGER.info(logTitle+"스케줄 프로세스가 종료되었습니다. 총 소요시간 :["+TimeUnit.MILLISECONDS.toSeconds(jobEndTime-jobStartTime)+"초]");
		
		}catch(Exception e) {
			//에러처리
			try {
				//데이터셋 db insert됐을경우 삭제  
				if(timeStmp!=null) {
					//[!!!!구현!!!!] 에러 발생시 insert된 가공데이터 delete문 구현
					//mapper.deleteAphusTradeLtrInfoByTimeStmp(timeStmp);
				}

			}catch(Exception e1) {
				LOGGER.error(logTitle+"에러 처리중 오류가 발생하였습니다 로그를 확인해주세요.");
				e1.printStackTrace();
			}finally {
				super.rebJobExceptionHandle(logTitle, processStep, processList, LOGGER, e, jobRunHstDTO,jobStartTime,processStartTime);
			}
			
		}
	}
	
	/**
	 * @설명 : openApiJob002 - REST API 호출
	 * @생성일 : 2022. 11. 03.
	 * @파라미터 : JobLinkConfigDTO - 잡 연계설정정보, boolean - 재귀호출(페이징)용 토탈카운트 변수 초기화여부
	 * @리턴 : JSONArray - api 결과 jsonarray
	 * @비고 : API 호출시 전체가져오기에 대한 기능 및 API목록이 없음, 때문에 페이징 변수를 활용하여 API TOTAL건수에 만족할때까지 재귀호출
	 */
	private JSONArray callGetApiForJob002(JobLinkConfigDTO jobConfig, boolean totalCountResetAt) throws Exception {
		
		if(totalCountResetAt) {
			this.apiTotalCount=0;
			this.totalResultArray= new JSONArray();
			this.apiPage=1;
		}
		
		String jsonStr = apiUtil.callGetApi(jobConfig.getUdtApiEndPoint(),
				makeApiParameters(apiPage, apiPagePer, jobConfig.getUdtApiParam()),
				null,
		logTitle);
		
		//System.out.println(jsonStr);
		
		JSONObject jsonObj = apiUtil.parsingJsonObjects(jsonStr);
		
		int totalCount = jsonObj.getInt("totCnt");
		
		JSONArray jsonArray = jsonObj.getJSONArray("data");
		
		
		for(int i=0; i<jsonArray.length();i++) {
			JSONObject obj = jsonArray.getJSONObject(i);
			totalResultArray.put(obj);
		}
		
		apiTotalCount = apiTotalCount + jsonArray.length();
		
		//API페이징 전체가져오기(재귀호출)
		if(apiTotalCount<totalCount) {
			Thread.sleep(1000);
			this.apiPage = apiPage+1;
			callGetApiForJob002(jobConfig,false);
		}
		
		return totalResultArray;
		
	}
	
	/**
	 * @설명 : API호출결과를 DB에 저장(벌크인서트)
	 * @생성일 : 2022. 11. 03.
	 * @파라미터 : JSONArray-결과 데이터셋(알맹이만), String[] - 컬럼배열, String - 테이블명
	 * @리턴 : void
	 * @비고 : 
	 */
	private void saveDatabaseByApiResut(JSONArray apiResultData, String[] _headers, String tbNm, Timestamp timeStmp) {
		
		Map<String, Object> fieldData = new HashMap<String, Object>();
		fieldData.put("tbNm", tbNm);
		
		// 업데이트 시간 필드 추가
		List<String> headers = new ArrayList<String>(Arrays.asList(_headers));
		headers.add("UPDT_TIME_STEMP");
		fieldData.put("headers", headers);
		
		List<Map<String,Object>> qureyPramList = new ArrayList<Map<String,Object>>();
		
		//원천데이터 테이블 백업 및 트렁케이트
		//mapper.bulkInsertBackupSrcDataTable(tbNm); // 백업 테이블 사용안함
		//mapper.truncateTable(tbNm); // 데이터를 계속 적재
		
		// 원천데이터 파라미터 리스트 셋팅
		// + API 결과 데이터가 스키마에 맞게 왔는지 검사하고 수정/보완
		// + 데이터 텍스트 타입 INSERT를 위해 값에 ''를 추가
		Map<String,Object> qureyPramMap;			
		for(int i=0; i<apiResultData.length(); i++) {
			qureyPramMap = new LinkedHashMap<String,Object>();
			JSONObject obj = (JSONObject)apiResultData.get(i);
			for(String columns: _headers) {
				
				Object value;
				// 필드가 존재하는지 체크
				if(obj.has(columns)) {
					if(obj.isNull(columns)) {
						value="''";
					} else {
						value = "'" + obj.get(columns) + "'"; // 텍스트 타입 데이터 INSERT를 위한 처리
					}
					qureyPramMap.put(columns.toUpperCase(), value);
				} else {
					// 존재하지 않는다면 빈 값 넣기
					value="''";
					qureyPramMap.put(columns.toUpperCase(), value);
				}
			}
			qureyPramMap.put("UPDT_TIME_STEMP", "'" + timeStmp + "'"); // 업데이트 시간 값 추가
			qureyPramList.add(qureyPramMap);
		}
		
		//벌크인서트
		int insertCount=0;
		if(qureyPramList.size()>bulkInsertLimit) { //벌크처리
			//(포스트그래스 파라미터 최대 32767개만 가능)
			int currCount=0;
			int mok = qureyPramList.size()/bulkInsertLimit;
			int nam = qureyPramList.size()%bulkInsertLimit;
			if(nam>0)mok=mok+1;
			
			for(int i=0; i<mok; i++) {
				
				int endListIndex=0;
				if(i==mok-1) {
					endListIndex=bulkInsertLimit*(i)+nam;
				}
				else {
					endListIndex=bulkInsertLimit*(i+1);
				}
				
				List<Map<String,Object>> subDataList=new ArrayList<Map<String,Object>>(qureyPramList.subList(currCount, endListIndex));
				 
				ThreadContext.put("log", "N");
				fieldData.put("values", subDataList);
				insertCount = insertCount+mapper.insertOpenApiData(fieldData);
				ThreadContext.remove("log");
		
				currCount=currCount+bulkInsertLimit;
				try{Thread.sleep(50);}catch(InterruptedException e) {e.printStackTrace();}
			}
		} else {
			ThreadContext.put("log", "N");
			fieldData.put("values", qureyPramList);
			try {
				insertCount = insertCount+mapper.insertOpenApiData(fieldData);
			} catch(Exception e) {
				e.printStackTrace();
			}
			
			ThreadContext.remove("log");
		}
	}
	
	/**
	 * @설명 : API 파라미터 세팅 (제주일별기상정보) 
	 * @생성일 : 2022. 11. 03.
	 * @파라미터 : int - 페이지쪽수, int - 페이지당 로우수
	 * @리턴 : Map<String,Object>
	 * @비고 : 
	 */
	private Map<String,Object> makeApiParameters(int page, int pagePer, String apiParam) throws Exception {
		
		Map<String,Object> getParam = new HashMap<String,Object>();
		
		Properties props = new Properties(); // Properties를 이용해 {키=값,키=값..}형태의 문자열을 쉽게 파싱
		props.load(new StringReader(apiParam.substring(1, apiParam.length() - 1).replace(", ", "\n")));       
		for (Map.Entry<Object, Object> e : props.entrySet()) {
			getParam.put((String)e.getKey(), (String)e.getValue());
		}
		
		getParam.put("number", page);
		getParam.put("limit", pagePer);
		
		return getParam;
	}
	
	
	
}
