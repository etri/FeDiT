package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.schdule;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.URIBuilder;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.CtrlCmdTaskInfoService;

@Component
public class CtrlCmdStsCheckerScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdStsCheckerScheduler.class);

	public CtrlCmdStsCheckerScheduler(CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	//0.5초마다
	@Scheduled(initialDelay = 0, fixedRate = 500)
	public void execCtrlCmdStsCheckerScheduler() throws Exception {
		logger.info("execCtrlCmdStsCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdStsCheckerScheduler => Start Time : " + LocalTime.now());

		HashMap<String, Object> map = new HashMap<>();

		try {
			map.put("reqCtrlCmdStatus", Constant.CTRL_CMD_STATUS_ERROR);

			List<Integer> procReqIdList = this.ctrlCmdTaskInfoService.getReqCtrlCmdIdList(map);
			System.out.println("procReqIdList >>>>>>>>>" + procReqIdList);

			System.out.println("procReqIdList size>>>>>>>>>>>>>>>>>>>>>>>>>>" + procReqIdList.size());

			if (procReqIdList != null && procReqIdList.size() > 0) {
				String url = "";
				for (int i = 0; i < procReqIdList.size(); i++) {
					url = "http://localhost:8000/fdt/msaoc/tsm/transmitter/" + String.valueOf(procReqIdList.get(i));
					HashMap<String, Object> param = new HashMap<String, Object>();

					System.out.println("url >>>>>>>>>>>>>>>>>>>" + url);
					// 메소드 호출 실시
					try {
						httpGetConnection(url, param);
					} catch (Exception e) {
						e.printStackTrace();
					}

				}

			}
			logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
		}

		catch (Exception e) {
			e.printStackTrace();
		}

	}

	protected String statusCode;

	public void httpGetConnection(String baseUrl, HashMap<String, Object> ParamData) throws URISyntaxException {

		HttpGet httpGet = new HttpGet(baseUrl);

		List<NameValuePair> nvps = new ArrayList<>();

		for (Entry<String, Object> entrySet : ParamData.entrySet()) {
			nvps.add(new BasicNameValuePair(entrySet.getKey(), (String) entrySet.getValue()));

			System.out.println(entrySet.getKey() + " : " + entrySet.getValue());
		}

		URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
		httpGet.setUri(uri);

		logger.info("http GetConnection Url ===> " + httpGet.getPath());

		try  {
			try (CloseableHttpResponse response = poolHttpClient.execute(httpGet)) {
				statusCode = String.valueOf(response.getCode());
				logger.info(Thread.currentThread().getName() + " - status code: " + statusCode);

				HttpEntity entity = response.getEntity();
				if (entity != null) {
					try {
						String responseBody = EntityUtils.toString(entity);
						logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);

						if (!"".equals(responseBody)) {
							JSONParser parser = new JSONParser();
							JSONObject json = (JSONObject) parser.parse(responseBody);

							StringBuilder sb = new StringBuilder();
							sb.append("status : " + json.get("statusCode"));
							sb.append("  |  error : " + json.get("httpStatus"));
							statusCode = sb.toString();
						}
					} catch (Exception e) {
						e.printStackTrace();
						statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
					}
				}
				EntityUtils.consume(entity);
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

}
