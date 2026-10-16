package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.ngsi;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Component
public class NdxproClient {

	private static final Logger logger = LoggerFactory.getLogger(NdxproClient.class);

	private static final DateTimeFormatter KST =
			DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

	private final RestTemplate restTemplate;

	public NdxproClient(@Value("${ndxpro.connect-timeout-ms:3000}") int connectTimeoutMs,
			@Value("${ndxpro.read-timeout-ms:10000}") int readTimeoutMs) {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(connectTimeoutMs);
		factory.setReadTimeout(readTimeoutMs);
		this.restTemplate = new RestTemplate(factory);
	}

	@Value("${ndxpro.base-url:http://{ndxproIp}:{ndxproPort}}")
	private String baseUrl;

	@Value("${ndxpro.access-token:}")
	private String accessToken;

	private String service() {
		return baseUrl + "/ndxpro/v1/service";
	}

	private String manager() {
		return baseUrl + "/ndxpro/v1/manager";
	}

	public JSONObject getEntity(String entityId, String contextUrl) throws Exception {
		String url = service() + "/entities/iot/" + entityId;

		ResponseEntity<String> res = restTemplate.exchange(URI.create(url), HttpMethod.GET,
				new HttpEntity<>(linkHeaders(contextUrl)), String.class);

		JSONObject body = (JSONObject) new JSONParser().parse(res.getBody());
		return (JSONObject) body.get("entity");
	}

	public JSONObject getDataModel(String type) {
		try {
			String url = manager() + "/data-models/" + type;
			ResponseEntity<String> res = restTemplate.exchange(URI.create(url), HttpMethod.GET,
					new HttpEntity<>(authHeaders()), String.class);
			return (JSONObject) new JSONParser().parse(res.getBody());
		} catch (HttpClientErrorException.NotFound e) {
			return null;
		} catch (Exception e) {
			logger.warn("getDataModel failed. type={}, cause={}", type, e.getMessage());
			return null;
		}
	}

	@SuppressWarnings("unchecked")
	public List<String> getContexts() {
		try {
			String url = manager() + "/contexts";
			ResponseEntity<List> res = restTemplate.exchange(URI.create(url), HttpMethod.GET,
					new HttpEntity<>(authHeaders()), List.class);
			return res.getBody();
		} catch (Exception e) {
			logger.warn("getContexts failed. cause={}", e.getMessage());
			return null;
		}
	}

	public JSONObject getHistories(String entityId, String contextUrl, String timeproperty,
			LocalDateTime from, LocalDateTime to, int limit) throws Exception {

		StringBuilder url = new StringBuilder(service()).append("/entities/iot/history")
				.append("?entityId=").append(enc(entityId))
				.append("&timeproperty=").append(enc(timeproperty))
				.append("&offset=0&limit=").append(limit);

		if (from != null && to != null) {
			url.append("&timerel=between")
					.append("&time=").append(enc(KST.format(from)))
					.append("&endTime=").append(enc(KST.format(to)));
		}

		ResponseEntity<String> res = restTemplate.exchange(URI.create(url.toString()),
				HttpMethod.GET, new HttpEntity<>(linkHeaders(contextUrl)), String.class);

		return (JSONObject) new JSONParser().parse(res.getBody());
	}

	public JSONObject getHistory(String historyId, String timeproperty) throws Exception {
		String url = service() + "/entities/iot/history/" + historyId
				+ "?timeproperty=" + enc(timeproperty);

		ResponseEntity<String> res = restTemplate.exchange(URI.create(url), HttpMethod.GET,
				new HttpEntity<>(authHeaders()), String.class);

		return (JSONObject) new JSONParser().parse(res.getBody());
	}

	@SuppressWarnings("unchecked")
	public static List<Map<String, Object>> historyRefs(JSONObject listResponse) {
		List<Map<String, Object>> out = new ArrayList<>();
		if (listResponse == null) {
			return out;
		}
		Object list = listResponse.get("entityHistoryList");
		if (!(list instanceof JSONArray)) {
			return out;
		}
		for (Object o : (JSONArray) list) {
			if (o instanceof Map) {
				out.add((Map<String, Object>) o);
			}
		}
		out.sort((a, b) -> String.valueOf(a.get("observedAt"))
				.compareTo(String.valueOf(b.get("observedAt"))));
		return out;
	}

	@SuppressWarnings("unchecked")
	public static Object extractValue(JSONObject entity, String path) {
		if (entity == null || path == null) {
			return null;
		}
		String[] seg = path.split("\\.\\.");
		Object node = entity.get(seg[0]);
		if (!(node instanceof Map)) {
			return null;
		}
		Object cur = ((Map<String, Object>) node).get("value");
		for (int i = 1; i < seg.length; i++) {
			if (!(cur instanceof Map)) {
				return null;
			}
			cur = ((Map<String, Object>) cur).get(seg[i]);
		}
		return cur;
	}

	@SuppressWarnings("unchecked")
	public static String observedAtOf(JSONObject entity, String path) {
		if (entity == null || path == null) {
			return null;
		}
		Object node = entity.get(path.split("\\.\\.")[0]);
		if (!(node instanceof Map)) {
			return null;
		}
		Object observedAt = ((Map<String, Object>) node).get("observedAt");
		return observedAt == null ? null : observedAt.toString();
	}

	private HttpHeaders linkHeaders(String contextUrl) {
		HttpHeaders headers = authHeaders();
		headers.set("Link", "<" + contextUrl + ">; rel=\"http://www.w3.org/ns/json-ld#context\";"
				+ " type=\"application/ld+json\"");
		return headers;
	}

	private HttpHeaders authHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", "Bearer " + accessToken);
		return headers;
	}

	private static String enc(String v) {
		try {
			return URLEncoder.encode(v, StandardCharsets.UTF_8.name());
		} catch (Exception e) {
			return v;
		}
	}
}
