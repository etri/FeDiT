package net.jcms.framework.security.service.impl;

import com.dreamsecurity.json.JSONObject;
import com.dreamsecurity.mobileOK.MobileOKException;
import com.dreamsecurity.mobileOK.mobileOKKeyManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonObject;
import net.jcms.framework.security.service.MobileOKService;
import net.jcms.framework.util.PropertiesUtil;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpSession;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service(value = "mobileOKService")
public class MobileOKServiceImpl implements MobileOKService {
    public Object mobileOkStdRequest(mobileOKKeyManager mobileOK, HttpSession session, String clientPrefix, String hostUrl) {
        Calendar cal = Calendar.getInstance();
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");

        String clientTxId = clientPrefix + UUID.randomUUID().toString().replaceAll("-", "");
        session.setAttribute("sessionClientTxId", clientTxId);

        String reqClientInfo = clientTxId + "|" + formatter.format(cal.getTime());

        String encryptReqClientInfo;
        try {
            encryptReqClientInfo = mobileOK.RSAEncrypt(reqClientInfo);
        } catch (MobileOKException e) {
            return e.getErrorCode() + "|" + e.getMessage();
        }

        try {
            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("usageCode", "01001");
            jsonObject.addProperty("serviceId", mobileOK.getServiceId());
            jsonObject.addProperty("encryptReqClientInfo", encryptReqClientInfo);
            jsonObject.addProperty("serviceType", "telcoAuth");

            jsonObject.addProperty("retTransferType", "MOKToken");
            jsonObject.addProperty("returnUrl", hostUrl + "/mok/mok-result.json");

            return new ObjectMapper().readValue(jsonObject.toString(), Object.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Object mobileOkStdResult(String result, mobileOKKeyManager mobileOK, HttpSession session) {
        try {
            String targetUrl = PropertiesUtil.getProperty("AppConf.mok.rstDreamSecurityUrl");

            JSONObject resultJSON = new JSONObject(result);
            String encryptMOKKeyToken = resultJSON.optString("encryptMOKKeyToken", null);
            String encryptMOKResult = resultJSON.optString("encryptMOKResult", null);

            /* 2.1 본인확인 결과 타입 : MOKToken */
            if (encryptMOKKeyToken != null) {
                JSONObject requestData = new JSONObject();
                requestData.put("encryptMOKKeyToken", encryptMOKKeyToken);
                String responseData = sendPost(targetUrl, requestData.toString());
                if (responseData == null) {
                    return "-1|본인확인 MOKToken 인증결과 응답이 없습니다.";
                }
                JSONObject responseJSON = new JSONObject(responseData);
                encryptMOKResult = responseJSON.getString("encryptMOKResult");
            }
            else {
                /* 2.2 본인확인 결과 타입 : MOKResult */
                if (encryptMOKResult == null) {
                    return "-2|본인확인 MOKResult 값이 없습니다.";
                }
            }

            JSONObject decryptResultJson = null;
            try {
                decryptResultJson = new JSONObject(mobileOK.getResultJSON(encryptMOKResult));
            } catch (MobileOKException e) {
                return e.getErrorCode() + "|" + e.getMessage();
            }

            /* 사용자 이름 */
            String userName = decryptResultJson.optString("userName", null);
            /* 이용기관 ID */
            String siteID = decryptResultJson.optString("siteID", null);
            /* 이용기관 거래 ID */
            String clientTxId = decryptResultJson.optString("clientTxId", null);
            /* 본인확인 거래 ID */
            String txId = decryptResultJson.optString("txId", null);
            /* 서비스제공자(인증사업자) ID */
            String providerId = decryptResultJson.optString("providerId", null);
            /* 이용 서비스 유형 */
            String serviceType = decryptResultJson.optString("serviceType", null);
            /* 시용자 CI */
            String ci = decryptResultJson.optString("ci", null);
            /* 사용자 DI */
            String di = decryptResultJson.optString("di", null);
            /* 사용자 전화번호 */
            String userPhone = decryptResultJson.optString("userPhone", null);
            /* 사용자 생년월일 */
            String userBirthday = decryptResultJson.optString("userBirthday", null);
            /* 사용자 성별 (1: 남자, 2: 여자) */
            String userGender = decryptResultJson.optString("userGender", null);
            /* 사용자 국적 (0: 내국인, 1: 외국인) */
            String userNation = decryptResultJson.optString("userNation", null);
            /* 본인확인 인증 종류 */
            String reqAuthType = decryptResultJson.getString("reqAuthType");
            /* 본인확인 요청 시간 */
            String reqDate = decryptResultJson.getString("reqDate");
            /* 본인확인 인증 서버 */
            String issuer = decryptResultJson.getString("issuer");
            /* 본인확인 인증 시간 */
            String issueDate = decryptResultJson.getString("issueDate");

            String sessionClientTxId = (String) session.getAttribute("sessionClientTxId");

            if (!sessionClientTxId.equals(clientTxId)) {
                return "-4|세션값에 저장된 거래ID 비교 실패";
            }

            String dataFormat = "yyyy-MM-dd HH:mm:ss";
            SimpleDateFormat formatter = new SimpleDateFormat(dataFormat);

            Date currentTime = formatter.parse(formatter.format(new Date()));
            Date targetTime = formatter.parse(issueDate);

            long diff = (currentTime.getTime() - targetTime.getTime()) / 1000;
            if (diff > 600) {
                return "-5|검증결과 토큰 생성 10분 경과 오류";
            }

            Pattern tellPattern = Pattern.compile( "^(01\\d{1}|02|0505|0502|0506|0\\d{1,2})-?(\\d{3,4})-?(\\d{4})");

            Matcher matcher = tellPattern.matcher(userPhone);
            if(matcher.matches()) {
                //정규식에 적합하면 matcher.group으로 리턴
                userPhone = matcher.group(1) + '-' + matcher.group(2) + '-' + matcher.group(3);
            }else{
                //정규식에 적합하지 않으면 substring으로 휴대폰 번호 나누기

                String str1 = userPhone.substring(0, 3);
                String str2 = userPhone.substring(3, 7);
                String str3 = userPhone.substring(7, 11);
                userPhone = str1 + '-' + str2 + '-' + str3;
            }

            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("resultCode", "2000");
            jsonObject.addProperty("resultMsg", "success");
            jsonObject.addProperty("userName", userName);
            jsonObject.addProperty("userPhone", userPhone);
            return new ObjectMapper().readValue(jsonObject.toString(), Object.class);
        } catch (Exception e) {
            e.printStackTrace();
            return "-999|서버 오류";
        }
    }

    private String sendPost(String dest, String jsonData) {
        HttpURLConnection connection = null;
        DataOutputStream dataOutputStream = null;
        BufferedReader bufferedReader = null;

        try {
            URL url = new URL(dest);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
            connection.setDoOutput(true);

            dataOutputStream = new DataOutputStream(connection.getOutputStream());
            dataOutputStream.write(jsonData.getBytes("UTF-8"));

            bufferedReader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuffer responseData = new StringBuffer();
            String info;
            while ((info = bufferedReader.readLine()) != null) {
                responseData.append(info);
            }
            return responseData.toString();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (bufferedReader != null) {
                    bufferedReader.close();
                }

                if (dataOutputStream != null) {
                    dataOutputStream.close();
                }

                if (connection != null) {
                    connection.disconnect();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return null;
    }
}