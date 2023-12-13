package com.federated.searchRule.restfulApi.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SearchNgsiIdOntology {

	private final Logger logger = LoggerFactory.getLogger(SearchNgsiIdOntology.class);

	public JSONObject searchData(String searchRules) throws Exception {

		JSONArray recordData = new JSONArray();
		JSONArray recordData2 = new JSONArray();
		JSONArray recordData3 = new JSONArray();
		JSONParser jsonParser = new JSONParser();

		JSONObject jsnobject = new JSONObject();
		JSONObject jsnobject2 = new JSONObject();
		JSONObject jsnobject3 = new JSONObject();
		JSONObject jsnobject4 = new JSONObject();
		JSONObject jsnobject5 = new JSONObject();
		JSONObject jsnobject7 = new JSONObject();
		jsnobject = (JSONObject) jsonParser.parse(searchRules);

		recordData = (JSONArray) jsnobject.get("tasks");

		for (int i = 0; i < recordData.size(); i++) {

			jsnobject2 = (JSONObject) recordData.get(i);

			String name = jsnobject2.get("name").toString();
			String category = jsnobject2.get("category").toString();

			HttpGet get = null;
			String requestURL = "http://localhost:8080/ngsi-ld/v1/entities?options=keyValues&type=Category&q=name=="
					+ "'" + category + "'";
			String requestURL2 = "http://localhost:8080/ngsi-ld/v1/entities?options=keyValues&type=Task&q=name=="
					+ "'" + name + "'" + "&q=refCategory==" + "'" + name + "'";

			String method = "GET", charset = "UTF-8";

			try {
				HashMap<String, String> headers = new HashMap<String, String>();
				headers.put("Content-type", "application/ld+json");
				headers.put("Link",
						"https://raw.githubusercontent.com/you359/federated_digital_twin/main/fdt-compound.jsonld");

				get = new HttpGet(requestURL, method, charset, headers);
				get.openHttpConnecion();
				String result = get.connection();

				get = new HttpGet(requestURL2, method, charset, headers);
				get.openHttpConnecion();
				String result2 = get.connection();
				recordData2 = (JSONArray) jsonParser.parse(result2);

				List<JSONObject> list = new ArrayList<>();
				for (int k = 0; k < recordData2.size(); k++) {
					jsnobject3 = (JSONObject) recordData2.get(k);

					String requestURL3 = "http://localhost:8080/ngsi-ld/v1/entities?options=keyValues&type=DigitalTwinBehavior&q=refTask=="
							+ "%22" + jsnobject3.get("id") + "%22";
					get = new HttpGet(requestURL3, method, charset, headers);
					get.openHttpConnecion();
					String result3 = get.connection();

					recordData3 = (JSONArray) jsonParser.parse(result3);
					JSONObject DTBehaviorEntity = null;
					for (int j = 0; j < recordData3.size(); j++) {
						DTBehaviorEntity = new JSONObject();
						jsnobject4 = (JSONObject) recordData3.get(j);

						String behaviorId = (String) jsnobject4.get("id");
						DTBehaviorEntity.put("behaviorId", behaviorId);
						String prototypeId = (String) jsnobject4.get("refDigitalTwinPrototype");
						DTBehaviorEntity.put("prototypeId", prototypeId);

						String requestURL4 = "http://localhost:8080/ngsi-ld/v1/entities/" + prototypeId;
						get = new HttpGet(requestURL4, method, charset, headers);
						get.openHttpConnecion();
						String result4 = get.connection();

						jsnobject5 = (JSONObject) jsonParser.parse(result4);
						jsnobject7 = (JSONObject) jsnobject5.get("dti_accesspoints");

						DTBehaviorEntity.put("dti_accesspoints", jsnobject7.get("value"));
						list.add(DTBehaviorEntity);

					}
				}

				jsnobject2.put("DTPs", list);

			} catch (Exception e) {
				e.printStackTrace();
				jsnobject = null;

			} finally {
				if (get != null) {
					get.closeConnection();
				}

			}

		}
		return jsnobject;
	}

}
