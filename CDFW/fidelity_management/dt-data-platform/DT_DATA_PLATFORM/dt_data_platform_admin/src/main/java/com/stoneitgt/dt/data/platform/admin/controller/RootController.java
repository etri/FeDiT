package com.stoneitgt.dt.data.platform.admin.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.script.ScriptEngineManager;
import javax.script.ScriptEngine;
import javax.script.ScriptException;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.domain.LoginForm;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

import lombok.extern.slf4j.Slf4j;

import org.json.simple.JSONObject;
import org.hibernate.validator.spi.scripting.ScriptEvaluator;
import org.json.simple.JSONArray;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;


@Slf4j
@Controller
public class RootController extends BaseController {


	@RequestMapping(value = "/login", method = { RequestMethod.GET, RequestMethod.POST })
	public String login(@ModelAttribute LoginForm loginForm, Model model) {

		if (authenticationFacade.isAdmin()) {
			return "redirect:/main";
		}
		model.addAttribute("loginForm", loginForm);
		return "pages/login";
	}

	@GetMapping(value = { "/", "/admin" })
	public String index(Model model) {
		return "redirect:/main";
	}

	@GetMapping("/main")
	public String main(Model model) {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("yyyymm", StoneUtil.getToday("yyyy-MM"));

		
		return "pages/main";
	}
	
	@RequestMapping(value = "/error", method = { RequestMethod.GET, RequestMethod.POST })
	public String error() {
		return "error/error";
	}

	@PostMapping("/session/extention")
	@ResponseBody
	public Map<String, Object> sessionExtention(HttpServletRequest request) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
		result.put("session_time", request.getSession().getMaxInactiveInterval());
		return result;
	}
	
	/*	
	@PostMapping("/main/count")
	@ResponseBody
	public Map<String, Object> countCard(@RequestBody Map<String, Object> params,
			HttpServletRequest request) {
		Map<String, Object> result = new HashMap<String, Object>();
		
		
		result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
		return result;
	}
	*/
	
	@GetMapping("/test")
	public String test(Model model){
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("yyyymm", StoneUtil.getToday("yyyy-MM"));
		
		String json = "{" +
				"\"columns\": [\"m00\",\"m10\",\"m20\",\"m30\",\"m40\",\"m50\",\"m60\",\"w00\",\"w10\",\"w20\",\"w30\",\"w40\",\"w50\",\"w60\"]," +
//				+ "\"info\": {\"m00\":{\"count\":82.0,\"mean\":1.6341463415,\"std\":0.8959744695,\"min\":0.0,\"25%\":1.0,\"50%\":1.0,\"75%\":2.0,\"max\":4.0,\"unique\":5.0,\"nan\":0.0,\"duplicate\":77.0,\"dtype\":\"int64\"},\"m10\":{\"count\":82.0,\"mean\":41.8292682927,\"std\":19.5825601915,\"min\":16.0,\"25%\":27.25,\"50%\":32.5,\"75%\":54.0,\"max\":87.0,\"unique\":42.0,\"nan\":0.0,\"duplicate\":40.0,\"dtype\":\"int64\"},\"m20\":{\"count\":82.0,\"mean\":362.1097560976,\"std\":175.8415396433,\"min\":164.0,\"25%\":217.25,\"50%\":282.0,\"75%\":494.5,\"max\":769.0,\"unique\":73.0,\"nan\":0.0,\"duplicate\":9.0,\"dtype\":\"int64\"},\"m30\":{\"count\":82.0,\"mean\":168.987804878,\"std\":54.6514192608,\"min\":104.0,\"25%\":120.0,\"50%\":149.0,\"75%\":214.75,\"max\":295.0,\"unique\":63.0,\"nan\":0.0,\"duplicate\":19.0,\"dtype\":\"int64\"},\"m40\":{\"count\":82.0,\"mean\":93.1951219512,\"std\":27.4740906114,\"min\":55.0,\"25%\":68.25,\"50%\":90.0,\"75%\":111.5,\"max\":158.0,\"unique\":61.0,\"nan\":0.0,\"duplicate\":21.0,\"dtype\":\"int64\"},\"m50\":{\"count\":82.0,\"mean\":65.5975609756,\"std\":19.6919860594,\"min\":40.0,\"25%\":48.0,\"50%\":62.0,\"75%\":78.0,\"max\":119.0,\"unique\":46.0,\"nan\":0.0,\"duplicate\":36.0,\"dtype\":\"int64\"},\"m60\":{\"count\":82.0,\"mean\":67.1707317073,\"std\":22.1959872238,\"min\":39.0,\"25%\":47.0,\"50%\":64.5,\"75%\":78.75,\"max\":120.0,\"unique\":50.0,\"nan\":0.0,\"duplicate\":32.0,\"dtype\":\"int64\"},\"w00\":{\"count\":82.0,\"mean\":1.8536585366,\"std\":1.0198275238,\"min\":1.0,\"25%\":1.0,\"50%\":1.5,\"75%\":3.0,\"max\":5.0,\"unique\":5.0,\"nan\":0.0,\"duplicate\":77.0,\"dtype\":\"int64\"},\"w10\":{\"count\":82.0,\"mean\":40.5365853659,\"std\":21.0954299199,\"min\":16.0,\"25%\":24.25,\"50%\":33.0,\"75%\":54.0,\"max\":90.0,\"unique\":44.0,\"nan\":0.0,\"duplicate\":38.0,\"dtype\":\"int64\"},\"w20\":{\"count\":82.0,\"mean\":257.1585365854,\"std\":100.7190775402,\"min\":155.0,\"25%\":171.0,\"50%\":205.0,\"75%\":333.5,\"max\":512.0,\"unique\":65.0,\"nan\":0.0,\"duplicate\":17.0,\"dtype\":\"int64\"},\"w30\":{\"count\":82.0,\"mean\":112.2073170732,\"std\":46.7691303184,\"min\":59.0,\"25%\":71.25,\"50%\":95.5,\"75%\":145.25,\"max\":225.0,\"unique\":58.0,\"nan\":0.0,\"duplicate\":24.0,\"dtype\":\"int64\"},\"w40\":{\"count\":82.0,\"mean\":60.5243902439,\"std\":25.5358501853,\"min\":26.0,\"25%\":35.5,\"50%\":52.0,\"75%\":80.5,\"max\":132.0,\"unique\":46.0,\"nan\":0.0,\"duplicate\":36.0,\"dtype\":\"int64\"},\"w50\":{\"count\":82.0,\"mean\":63.5243902439,\"std\":22.758108369,\"min\":31.0,\"25%\":44.0,\"50%\":56.5,\"75%\":80.5,\"max\":117.0,\"unique\":50.0,\"nan\":0.0,\"duplicate\":32.0,\"dtype\":\"int64\"},\"w60\":{\"count\":82.0,\"mean\":57.4146341463,\"std\":16.9414031657,\"min\":28.0,\"25%\":42.25,\"50%\":56.0,\"75%\":68.0,\"max\":97.0,\"unique\":46.0,\"nan\":0.0,\"duplicate\":36.0,\"dtype\":\"int64\"}}"
				"\"info\": [\r\n" + 
				"            \"{\\\"m00\\\":{\\\"count\\\":82.0,\\\"mean\\\":1.6341463415,\\\"std\\\":0.8959744695,\\\"min\\\":0.0,\\\"25%\\\":1.0,\\\"50%\\\":1.0,\\\"75%\\\":2.0,\\\"max\\\":4.0,\\\"unique\\\":5.0,\\\"nan\\\":0.0,\\\"duplicate\\\":77.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m10\\\":{\\\"count\\\":82.0,\\\"mean\\\":41.8292682927,\\\"std\\\":19.5825601915,\\\"min\\\":16.0,\\\"25%\\\":27.25,\\\"50%\\\":32.5,\\\"75%\\\":54.0,\\\"max\\\":87.0,\\\"unique\\\":42.0,\\\"nan\\\":0.0,\\\"duplicate\\\":40.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m20\\\":{\\\"count\\\":82.0,\\\"mean\\\":362.1097560976,\\\"std\\\":175.8415396433,\\\"min\\\":164.0,\\\"25%\\\":217.25,\\\"50%\\\":282.0,\\\"75%\\\":494.5,\\\"max\\\":769.0,\\\"unique\\\":73.0,\\\"nan\\\":0.0,\\\"duplicate\\\":9.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m30\\\":{\\\"count\\\":82.0,\\\"mean\\\":168.987804878,\\\"std\\\":54.6514192608,\\\"min\\\":104.0,\\\"25%\\\":120.0,\\\"50%\\\":149.0,\\\"75%\\\":214.75,\\\"max\\\":295.0,\\\"unique\\\":63.0,\\\"nan\\\":0.0,\\\"duplicate\\\":19.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m40\\\":{\\\"count\\\":82.0,\\\"mean\\\":93.1951219512,\\\"std\\\":27.4740906114,\\\"min\\\":55.0,\\\"25%\\\":68.25,\\\"50%\\\":90.0,\\\"75%\\\":111.5,\\\"max\\\":158.0,\\\"unique\\\":61.0,\\\"nan\\\":0.0,\\\"duplicate\\\":21.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m50\\\":{\\\"count\\\":82.0,\\\"mean\\\":65.5975609756,\\\"std\\\":19.6919860594,\\\"min\\\":40.0,\\\"25%\\\":48.0,\\\"50%\\\":62.0,\\\"75%\\\":78.0,\\\"max\\\":119.0,\\\"unique\\\":46.0,\\\"nan\\\":0.0,\\\"duplicate\\\":36.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"m60\\\":{\\\"count\\\":82.0,\\\"mean\\\":67.1707317073,\\\"std\\\":22.1959872238,\\\"min\\\":39.0,\\\"25%\\\":47.0,\\\"50%\\\":64.5,\\\"75%\\\":78.75,\\\"max\\\":120.0,\\\"unique\\\":50.0,\\\"nan\\\":0.0,\\\"duplicate\\\":32.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w00\\\":{\\\"count\\\":82.0,\\\"mean\\\":1.8536585366,\\\"std\\\":1.0198275238,\\\"min\\\":1.0,\\\"25%\\\":1.0,\\\"50%\\\":1.5,\\\"75%\\\":3.0,\\\"max\\\":5.0,\\\"unique\\\":5.0,\\\"nan\\\":0.0,\\\"duplicate\\\":77.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w10\\\":{\\\"count\\\":82.0,\\\"mean\\\":40.5365853659,\\\"std\\\":21.0954299199,\\\"min\\\":16.0,\\\"25%\\\":24.25,\\\"50%\\\":33.0,\\\"75%\\\":54.0,\\\"max\\\":90.0,\\\"unique\\\":44.0,\\\"nan\\\":0.0,\\\"duplicate\\\":38.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w20\\\":{\\\"count\\\":82.0,\\\"mean\\\":257.1585365854,\\\"std\\\":100.7190775402,\\\"min\\\":155.0,\\\"25%\\\":171.0,\\\"50%\\\":205.0,\\\"75%\\\":333.5,\\\"max\\\":512.0,\\\"unique\\\":65.0,\\\"nan\\\":0.0,\\\"duplicate\\\":17.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w30\\\":{\\\"count\\\":82.0,\\\"mean\\\":112.2073170732,\\\"std\\\":46.7691303184,\\\"min\\\":59.0,\\\"25%\\\":71.25,\\\"50%\\\":95.5,\\\"75%\\\":145.25,\\\"max\\\":225.0,\\\"unique\\\":58.0,\\\"nan\\\":0.0,\\\"duplicate\\\":24.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w40\\\":{\\\"count\\\":82.0,\\\"mean\\\":60.5243902439,\\\"std\\\":25.5358501853,\\\"min\\\":26.0,\\\"25%\\\":35.5,\\\"50%\\\":52.0,\\\"75%\\\":80.5,\\\"max\\\":132.0,\\\"unique\\\":46.0,\\\"nan\\\":0.0,\\\"duplicate\\\":36.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w50\\\":{\\\"count\\\":82.0,\\\"mean\\\":63.5243902439,\\\"std\\\":22.758108369,\\\"min\\\":31.0,\\\"25%\\\":44.0,\\\"50%\\\":56.5,\\\"75%\\\":80.5,\\\"max\\\":117.0,\\\"unique\\\":50.0,\\\"nan\\\":0.0,\\\"duplicate\\\":32.0,\\\"dtype\\\":\\\"int64\\\"}}\",\r\n" + 
				"            \"{\\\"w60\\\":{\\\"count\\\":82.0,\\\"mean\\\":57.4146341463,\\\"std\\\":16.9414031657,\\\"min\\\":28.0,\\\"25%\\\":42.25,\\\"50%\\\":56.0,\\\"75%\\\":68.0,\\\"max\\\":97.0,\\\"unique\\\":46.0,\\\"nan\\\":0.0,\\\"duplicate\\\":36.0,\\\"dtype\\\":\\\"int64\\\"}}\"\r\n" + 
				"        ]" +
				"}";
				
		
		try {
			JSONParser parser = new JSONParser();
	        Object obj = parser.parse(json); 
	        JSONObject jsonObj = (JSONObject)obj;	        
	        log.info(jsonObj.toString());
	        
	        
	        //배열인 경우
	        JSONArray columns = (JSONArray)jsonObj.get("columns");
	        log.info(columns.toString());
	        
	        JSONArray info = (JSONArray)jsonObj.get("info");
	        log.info(info.toString());
	        
	        for(int i=0; i<info.size(); i++){
	        	//log.info(info.get(i).toString());
	        	
	        	Object da = (Object)parser.parse(info.get(i).toString());
        		JSONObject da_json = (JSONObject)da;
        		//log.info(da_json.toString());
        		
        		JSONObject m = (JSONObject)da_json.get(columns.get(i).toString());
		        log.info(m.toString());
		        
        		String std = m.get("std").toString();
		        log.info(std.toString());
		        
		        String _25 = m.get("25%").toString();
		        log.info(_25.toString());        		
		        
		        String dtype = m.get("dtype").toString();
		        log.info(dtype.toString());
	        }
	        
	        
	        /*
	        //배열이 아닌 경우
	        JSONArray columns = (JSONArray)jsonObj.get("columns");
	        log.info(columns.toString());
	        
	        JSONObject info = (JSONObject)jsonObj.get("info");
	        log.info(info.toString());
	        
	        
	        for(int i=0; i<columns.size(); i++){
	        	//log.info(columns.get(i).toString());
	        	JSONObject m = (JSONObject)info.get(columns.get(i).toString());
		        log.info(m.toString());
		        
		        String std = m.get("std").toString();
		        log.info(std.toString());
		        
		        String _25 = m.get("25%").toString();
		        log.info(_25.toString());
	        }
	        
	        JSONObject m = (JSONObject)info.get("m60");
	        log.info(m.toString());
	        
	        String std = m.get("std").toString();
	        log.info(std.toString());
	        */
	        
		} catch(Exception e) {
			log.error(e.getMessage());
		}
		
		
		try {
			ScriptEngineManager mgr = new ScriptEngineManager();
	        ScriptEngine engine = mgr.getEngineByName("JavaScript");
	        String expression = String.format("%s * 9.0 / 5.0 + 32.0", "50");
			Object result = engine.eval(expression);
			log.info(result.toString());
			
		} catch (ScriptException e) {
			e.printStackTrace();
		}
        
        
		//String str = String.format("%s * 9.0 / 5.0 + 32.0", "50");
		//log.info(str);
		
		return "pages/test";
	}
	
	@GetMapping("/test2")
	public String test2(Model model){
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("yyyymm", StoneUtil.getToday("yyyy-MM"));
		
		
		return "pages/test2";
	}
}

