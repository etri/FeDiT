package com.federated.searchRule.restfulApi.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.Map;

public class HttpGet {
	private HttpURLConnection httpConn;
	private String charset, requestURL, method;
	private OutputStreamWriter wr = null;
	private BufferedReader rd = null;
	private Map<String, String> headers;

	public HttpGet(String requestURL, String method, String charset, Map<String, String> headers) throws IOException {
		this.requestURL = requestURL;
		this.method = method;
		this.charset = charset;
		this.headers = headers;
	}

	public void openHttpConnecion() throws IOException {
		URL url = new URL(requestURL);
		httpConn = (HttpURLConnection) url.openConnection();
		httpConn.setUseCaches(false);
		httpConn.setRequestMethod("GET");
		httpConn.setDoInput(true);

		if (headers != null && headers.size() > 0) {
			Iterator<String> it = headers.keySet().iterator();
			while (it.hasNext()) {
				String key = it.next();
				String value = headers.get(key);

				httpConn.setRequestProperty(key, value);
			}
		}

	}

	public String connection() {
		String result = null;
		try {
			StringBuilder sb = new StringBuilder();

			// Response 수신
			if (httpConn.getResponseCode() >= 200 && httpConn.getResponseCode() <= 300) {
				rd = new BufferedReader(new InputStreamReader(httpConn.getInputStream()));
			} else {
				rd = new BufferedReader(new InputStreamReader(httpConn.getErrorStream()));
			}

			String line;
			while ((line = rd.readLine()) != null) {
				sb.append(line);
			}
			result = sb.toString();
			System.out.println("result >>>>>>>>>>>>>>>" + result);

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			return result;
		}

	}

	public void closeConnection() {
		if (wr != null) {
			try {
				wr.close();
				httpConn = null;
			} catch (final Exception e) {
				wr = null;
			}
		}

		if (rd != null) {
			try {
				rd.close();
				rd = null;
			} catch (final Exception e) {
				rd = null;
			}
		}

		if (httpConn != null) {
			try {
				httpConn.disconnect();
				httpConn = null;
			} catch (final Exception e) {
				httpConn = null;
			}
		}
	}
}