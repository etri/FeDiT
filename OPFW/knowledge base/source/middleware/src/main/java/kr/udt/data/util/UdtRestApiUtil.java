/**
 * 
 */
package kr.udt.data.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;

import org.apache.commons.compress.utils.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import kr.udt.data.constant.UdtCommonConstant;

/**
 * @설명 : HTTP(REST) API 서비스 공통유틸
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 11. 03.
 * @비고 : 스프링 컴포넌트로 등록하여 하나의 객체만 사용한다. 때문에 기능에 필요한 vo성 변수는 메소드의 파라미터로만 받고 클래스 내 멤버변수는 최대한 피한다.
 */

@Component
public class UdtRestApiUtil {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(UdtRestApiUtil.class);
	
	
	public String callGetApi(String endPoint, Map<String, Object> params, String authorization, String logTitle) throws Exception {
		
		HttpURLConnection huc = null;
		BufferedReader in = null;
		String result  = "";
		String fullApiUrl = endPoint+"?"+processRequestParameters(params);
		try
		{
			URL url = new URL(fullApiUrl);
			
			if(logTitle!=null)LOGGER.info(logTitle+"REST API를 호출합니다. [요청 URL(GET) : "+ fullApiUrl+"]");
			
			huc = (HttpURLConnection) url.openConnection();
			huc.setRequestMethod("GET");
			huc.setConnectTimeout(UdtCommonConstant.API_TIMEOUT); 
			huc.setReadTimeout(UdtCommonConstant.API_TIMEOUT);
			huc.setDoOutput(true);

			if(authorization != null) huc.setRequestProperty("Authorization", authorization);
			

			in = new BufferedReader(new InputStreamReader(huc.getInputStream()));
			String inputLine = "";
			while((inputLine = in.readLine()) != null)
			{
				result += inputLine;
			}
			
		}
		catch(Exception e)
		{
			if(logTitle!=null)LOGGER.info(logTitle+"API를 호출에 실패하였습니다. [요청 URL(GET) : "+ fullApiUrl+"]");
			else LOGGER.info("API를 호출에 실패하였습니다. [요청 URL(GET) : "+ fullApiUrl+"]");
			throw e;
		}
		finally
		{
			IOUtils.closeQuietly(in);
			huc.disconnect();
		}

		return result;
	}
	
	public String callPostApi(String endPoint, Map<String, Object> params, String authorization, String logTitle) throws Exception {
		
		HttpURLConnection huc = null;
		OutputStream os = null;
		BufferedReader in = null;
		String result  = "";
		String postParams = processRequestParameters(params);
		try
		{
			URL url = new URL(endPoint);
			LOGGER.info(logTitle+"REST API를 호출합니다. [요청 URL(POST) : "+ endPoint+"]");

			huc = (HttpURLConnection) url.openConnection();
			huc.setRequestMethod("POST");
			if(authorization != null) huc.setRequestProperty("Authorization", authorization);
			huc.setReadTimeout(UdtCommonConstant.API_TIMEOUT);
			huc.setDoOutput(true);

			os = huc.getOutputStream();
			if(params != null) os.write(postParams.getBytes("UTF-8"));
			os.flush();

			in = new BufferedReader(new InputStreamReader(huc.getInputStream()));
			String inputLine = "";
			while((inputLine = in.readLine()) != null)
			{
				result += inputLine;
			}
			//UdtRestApiUtil.System.out.println(result);
		}
		catch(Exception e)
		{
			LOGGER.info(logTitle+"API를 호출에 실패하였습니다. [요청 URL(POST) : "+ endPoint+"], [요청 파라미터 : "+postParams+"]");
			throw e;
		}
		finally
		{
			IOUtils.closeQuietly(os);
			IOUtils.closeQuietly(in);
			huc.disconnect();
		}

		return result;
		
	}
	
	public JSONObject parsingJsonObjects(String jsonStr)throws JSONException {
		return new JSONObject(jsonStr);
	}
	
	private String processRequestParameters(Map<String, Object> parameters) throws UnsupportedEncodingException{
		
		if(parameters == null) return "";
	
		StringBuilder sb = new StringBuilder();
		for(String parameterName : parameters.keySet())
		{
			sb.append(parameterName).append("=").append(parameters.get(parameterName) == null ? "" :URLEncoder.encode( parameters.get(parameterName).toString(), "UTF-8") + "").append("&");
		}
		return sb.substring(0, sb.length() - 1);
	}
}
