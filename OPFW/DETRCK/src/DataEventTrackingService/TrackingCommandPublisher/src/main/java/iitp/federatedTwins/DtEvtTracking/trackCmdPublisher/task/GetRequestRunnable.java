package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.URIBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GetRequestRunnable implements Runnable {
	private final Logger logger = LoggerFactory.getLogger(GetRequestRunnable.class);

	private final CloseableHttpClient httpClient;
	private final String baseUrl;
	private final String offset;
	private final String limit;

	public GetRequestRunnable(CloseableHttpClient httpClient, String baseUrl, String offset, String limit) {
		this.httpClient = httpClient;
		this.baseUrl = baseUrl;
		this.offset = offset;
		this.limit = limit;
	}

	@Override
	public void run() {
		HttpGet httpGet = new HttpGet(baseUrl);

		List<NameValuePair> nvps = new ArrayList<>();
		nvps.add(new BasicNameValuePair("startDate", "2022-10-01"));
		nvps.add(new BasicNameValuePair("endDate", "2022-11-10"));
		nvps.add(new BasicNameValuePair("offset", offset));
		nvps.add(new BasicNameValuePair("limit", limit));

		try {
			URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
			httpGet.setUri(uri);
			logger.info("URL: " + httpGet.getUri().toString());
		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		}

		try {
			httpClient.execute(httpGet, response -> {

				int statusCode = response.getCode();
				logger.info(Thread.currentThread().getName() + " Status code: " + statusCode);

				HttpEntity entity = response.getEntity();
				if (entity != null) {
					String responseBody = EntityUtils.toString(entity);
					logger.info(Thread.currentThread().getName() + " | responseBody: " + responseBody);
				}
				EntityUtils.consume(entity);

				return null;
			});
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

	}

}
