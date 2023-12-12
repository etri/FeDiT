package kr.udt.api;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Iterator;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class ApiController {

	@RequestMapping(value = "/udt/api/callApi.do", method = RequestMethod.POST)
	public String callApi(@RequestBody HashMap<String, Object> param, Model model) {
		
		String apiUrl = param.get("apiUrl").toString();
		HashMap apiOptionParam = (HashMap) param.get("apiOptionParam");
		//{typename=TL_SCCO_CTPRVN, sidoCode=11, maxFeatures=10, resultType=results, srsName=EPSG:5186}
		StringBuffer result = new StringBuffer();
		
		try {
			StringBuilder urlBuilder = new StringBuilder(apiUrl + "?");
			Iterator<String> keys = apiOptionParam.keySet().iterator();
			while(keys.hasNext()) {
				String strKey = keys.next();
				String strValue = apiOptionParam.get(strKey).toString();
				urlBuilder.append("&" + URLEncoder.encode(strKey, "UTF-8") + "=" + URLEncoder.encode(strValue, "UTF-8"));
			}
			URL url = new URL(urlBuilder.toString());
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("GET");
			BufferedReader rd;
			if(conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
				rd = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
			} else {
				rd = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
			}
			String line;
			while((line = rd.readLine()) != null) {
				result.append(line + "\n");
			}
			rd.close();
			conn.disconnect();
			
		} catch (Exception e) {
			//e.printStackTrace();
			result.append("{\"Exception Class\": \"" + e.getClass() + "\",");
			result.append("\"Exception Message\": \"에러가 발생하였습니다. 요청 파라미터를 확인해주세요.\"}");
		}
		
		model.addAttribute("result", result);
		
		return "jsonView";
	}
	
}
