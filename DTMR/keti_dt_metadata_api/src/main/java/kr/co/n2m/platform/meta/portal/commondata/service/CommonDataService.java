package kr.co.n2m.platform.meta.portal.commondata.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonAuthApiUrlDto;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonAuthDto;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonSearchVo;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonUserDto;
import kr.co.n2m.platform.meta.portal.commondata.mapper.CommonDataMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.HttpUrl;
import okhttp3.HttpUrl.Builder;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@Slf4j
@Service
public class CommonDataService {

	@Autowired
	CommonDataMapper commonDataMapper;

	@Value("${platform.common.api.url}")
	private String platformCommonServerUrl;

	/**
	 * common platform admin 서버로 Okhttp 요청 - 나의 권한 (목록) 조회
	 * @Author      : Ran
	 * @Date        : 2023. 11. 16.
	 * @param uri
	 * @param authToken
	 * @param params
	 * @return Response
	 */
	public Response getCommonApi(String uri, String authToken, Map<String, String> params)  {
		OkHttpClient client = new OkHttpClient.Builder()
		        .connectTimeout(180, TimeUnit.SECONDS)
		        .writeTimeout(180, TimeUnit.SECONDS)
		        .readTimeout(180, TimeUnit.SECONDS)
		        .build();
		
		Builder urlBuilder = HttpUrl.parse(platformCommonServerUrl + uri).newBuilder();
		if(params != null) {
			for(Map.Entry<String, String> param : params.entrySet()) {
				urlBuilder.addQueryParameter(param.getKey(), param.getValue());
			}
		}		
		
		Request request = new Request.Builder()
				.addHeader("Authorization", authToken)
				.addHeader("Accept", "*/*")
				.url(urlBuilder.build())
				.get()
				.build();
		try {
			return client.newCall(request).execute();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * 내 권한 목록 조회
	 * @Author      : Ran
	 * @Date        : 2023. 11. 16.
	 * @param commonSearchVo
	 * @param authToken
	 * @return
	 */
	public List<CommonAuthDto> getMyAuthList(CommonSearchVo commonSearchVo, String authToken) {
//		log.debug("[내 권한 목록 조회] 서비스 시작");
		List<CommonAuthDto> list;
		try {
			Map<String, String> params = new HashMap<>();
			params.put("pltfrmId", commonSearchVo.getPltfrmId());
			params.put("userId", commonSearchVo.getUserId());
			
			Response response = getCommonApi("/admin/myauthlist", authToken, params);
			String jsonStr = response.body().string();
			JSONArray jsonArray = new JSONArray(jsonStr);
			
			list = new ArrayList<>();
			for(int i = 0; i < jsonArray.length(); ++i){
				CommonAuthDto commonAuthDto = new CommonAuthDto();
				commonAuthDto.setAutOid((String) jsonArray.getJSONObject(i).get("autOid"));
				commonAuthDto.setAutId((String) jsonArray.getJSONObject(i).get("autId"));
				commonAuthDto.setAutNm((String) jsonArray.getJSONObject(i).get("autName"));
				list.add(commonAuthDto);
			}
			
		} catch (Exception e){
			log.debug("[내 권한 목록 조회] 서비스 실패/오류 {}", e.getMessage());
			throw new ResBaseRuntimeException(e);
		}
//		log.debug("[내 권한 목록 조회] 서비스 종료");
		return list;
	}
	
	/**
	 * 내 권한 API 체크
	 * @Author      : Ran
	 * @Date        : 2023. 11. 16.
	 * @param requestUri
	 * @param method
	 * @param authToken
	 * @return
	 */
	public boolean checkAuthorization(String requestUri, String method, String authToken) {
//		log.debug("[내 권한 API 체크] 서비스 시작");
		try {
			Map<String, String> params = new HashMap<>();
			params.put("url", requestUri);
			params.put("method", method);			
			
			Response response = getCommonApi("/admin/myauthrization", authToken, params);
			String jsonStr = response.body().string().replaceAll("\"", "\\\"");
			Map<String, Object> result = JsonUtil.toMap(jsonStr);
			
			if((boolean) result.get("authorization") == true){
				return true;
			}
		} catch (IOException e) {
			log.error("[내 권한 API 체크] 서비스 실패/오류 : {}", e.getMessage());
			return false;
		}
//		log.debug("[내 권한 API 체크] 서비스 종료");
		return false;
	}

	/**
	 * 권한 사용자 목록 조회 (페이징 안함)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
	 * @param commonSearchVo
	 * @return
	 */
	public List<CommonUserDto> getDistinctAuthUserListWithoutPaging(CommonSearchVo commonSearchVo) {
		log.debug("[권한 사용자 목록 조회 (페이징 안함)] 서비스 시작");
		List<CommonUserDto> list = null;

		try {
			commonSearchVo.setIsPaging(false);
			list = commonDataMapper.selectDistinctAuthUserList(commonSearchVo);

		} catch (Exception e) {
			log.error("[권한 사용자 목록 조회 (페이징 안함)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}

		log.debug("[권한 사용자 목록 조회 (페이징 안함)] 서비스 종료");
		return list;
	}
	
    /**
     * 내 권한 목록 조회
     * @Author      : heenim
     * @Date        : 2023. 08. 24.
     * @param commonSearchVo
     * @return
     */
    public List<CommonAuthDto> getMyAuthList(CommonSearchVo commonSearchVo) {
        log.debug("[내 권한 목록 조회] 서비스 시작");
        List<CommonAuthDto> list = null;
        
        try {
            list = commonDataMapper.selectMyAuthList(commonSearchVo);
            
        } catch (Exception e) {
            log.error("[내 권한 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        
        log.debug("[내 권한 목록 조회] 서비스 종료");
        return list;
    }
    
    /**
     * API 권한 체크
     * @Author      : heenim
     * @Date        : 2023. 08. 24.
     * @param requestUri
     * @param method
     * @param roleList
     * @return
     */
    public boolean checkAuthorization(String requestUri, String method, List<String> roleList) {
        /**
         * Common MSA AuthService.getAuthorizationFormUrl 동일 로직 구현
         */
        for (String roleId : roleList) {
            List<CommonAuthApiUrlDto> apiUrlList = this.getApiUrlsByAutOid(roleId);
            
            if (apiUrlList != null && apiUrlList.size() > 0) {
                for (CommonAuthApiUrlDto tDto : apiUrlList) {
                    String regex = tDto.getApiUrl();
                    // DB URL에 %s가 존재하는 경우
                    if (tDto.getApiUrl().contains("%s")) {
                        regex = tDto.getApiUrl().replaceAll("%s", "(.*)");
                    }
                    
                    // 정규식을 사용하여 DB URL에서 추출한 부분과 method 데이터를 비교
                    if (requestUri.matches(regex)) {
                        if(method.equals(tDto.getMthdCd())) {
//                            log.debug("{} {} : authorization = {}", method, requestUri, true);
                            return true;
                        }
                    }
                }
            }
        }
        
//        log.debug("{} {} : authorization = {}", method, requestUri, false);
        return false;
    }
    
    /**
     * 권한 ID로 API URL 목록 조회
     * @Author      : heenim
     * @Date        : 2023. 10. 11.
     * @param autOid
     * @return
     */
    public List<CommonAuthApiUrlDto> getApiUrlsByAutOid(String autOid) {
        List<CommonAuthApiUrlDto> list = null;
        
        try {
            List<String> autOidList = new ArrayList<>();
            autOidList.add(autOid);
            
            CommonSearchVo paramVo = new CommonSearchVo();
            paramVo.setAutOidList(autOidList);
            list = commonDataMapper.selectDistinctAuthApiUrlList(paramVo);
            
        } catch (Exception e) {
            log.error("getApiUrlsByAutOid DB 조회 실패! : " + autOid, e);
            throw e;
        }
        
        return list;
    }    

}
