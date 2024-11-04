package com.federated.searchRule.restfulApi.util;

import java.util.HashMap;

public class CreateEntitiy {

	public String createData(String bodyStr) {

		HttpPost post = null;
		String requestURL = "http://localhost:8080/ngsi-ld/v1/entityOperations/create";
		String method = "POST", charset = "UTF-8";
		String result = null;

		try {
			HashMap<String, String> headers = new HashMap<String, String>();
			headers.put("Content-type", "application/ld+json");

			post = new HttpPost(requestURL, method, charset, headers);

			post.openHttpConnecion();
			result = post.writeBody(bodyStr);

			if (result.contains("error") == true || result.contains("404") == true) {
				throw new Exception("***error***");
			}

		} catch (Exception e) {
			e.printStackTrace();
			result = null;

		} finally {
			if (post != null) {
				post.closeConnection();
			}

		}

		return result;
	}

}
