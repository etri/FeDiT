package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser;

import java.util.HashMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.controller.CtrlCmdRcvController;

@Component
public class CtrlCmdValidatorParser {


	private final Logger logger = LoggerFactory.getLogger(CtrlCmdValidatorParser.class);


	public HashMap<String, Object> ctrlConditionValidator(String ctrlCondition) throws Exception {

		HashMap<String, Object> resultData = new HashMap<>();
		String ctrlStatement = "";		

		JSONParser jsonParser = new JSONParser();
		JSONObject jsonObject = new JSONObject();
		JSONObject expression = new JSONObject();


		logger.info("ctrlCondition : {} " , ctrlCondition);

		if (ctrlCondition == null || ctrlCondition.equals("")) {
			throw new Exception("========= ctrlCondition is Null or Empty ========= ");
		}

		jsonObject = (JSONObject) jsonParser.parse(ctrlCondition);

		if (jsonObject.get("checkable") == null || jsonObject.get("checkable").equals("")) {
			throw new Exception("========= checkable is not defiend ========= ");
		}

		if (jsonObject.get("type") == null || !jsonObject.get("type").equals("CP")) {
			throw new Exception("========= type is Empty or not equal CP ========= ");
		}

		if (Boolean.class.isInstance(jsonObject.get("checkable")) == false) {
			throw new Exception("========= checkable is not defiend ========= ");			
		}

		boolean checkable = (boolean) jsonObject.get("checkable");

		if (checkable == true) {

			if (jsonObject.get("expression") == null || jsonObject.get("expression").equals("")) {
				throw new Exception("========= expression is null Or Empty ========= ");
			}

			expression = (JSONObject) jsonObject.get("expression");			
			ctrlStatement = (String) expression.get("ctrlStatement");

			if (expression.get("ctrlStatement") == null || expression.get("ctrlStatement").equals("")) {
				throw new Exception("========= ctrlStatement is Null or Empty ========= ");
			}

			resultData.put("res", true);
			resultData.put("data", ctrlStatement);
			logger.info("ctrlStatement : {} " , ctrlStatement);

		} else {
			resultData.put("res", true);
		}

		return resultData; 		
	}

	public void ctrlCommandValidator(String ctrlCommand) throws Exception {

		logger.info("ctrlCommand : {} " , ctrlCommand);

		JSONParser jsonParser = new JSONParser();
		JSONObject ctrlCommandJson = new JSONObject();
		JSONArray commandArr = new JSONArray();
		JSONObject commandObj = new JSONObject();


		// 파라미터 null / 공백 체크
		if (ctrlCommand == null || ctrlCommand.equals("")) {
			throw new Exception("========= CtrlCommand is Null or Empty ========= ");
		}

		ctrlCommandJson = (JSONObject) jsonParser.parse(ctrlCommand);

		// name 체크
		if (ctrlCommandJson.get("name") == null || ctrlCommandJson.get("name").equals("")) {
			throw new Exception("========= Name is Null Or Empty ========= ");
		}

		// commands 체크
		if (ctrlCommandJson.get("commands") == null || ctrlCommandJson.get("commands").equals("")) {
			throw new Exception("========= commands is Null Or Empty ========= ");
		}

		//이제 commands 내부 속성 체크
		commandArr = (JSONArray) ctrlCommandJson.get("commands");
		if (commandArr == null || commandArr.size() < 1) {
			throw new Exception("========= Commands is Null or Size is 0 ========= ");
		}

		for (int i = 0; i < commandArr.size(); i++) {
			commandObj = (JSONObject) commandArr.get(i);

			if (commandObj.get("control_type") == null || commandObj.get("control_type").equals("")) {
				throw new Exception("========= Control_type is null or Empty ========= ");
			}

			if (commandObj.get("command") == null || commandObj.get("command").equals("")) {
				throw new Exception("========= command is null or Empty ========= ");
			}

			if (commandObj.get("control_value") == null || commandObj.get("control_value").equals("")) {
				throw new Exception("========= control_value is null or Empty ========= ");
			}

			System.out.println("******************* SUCCESS *******************");
		}
	}

}
