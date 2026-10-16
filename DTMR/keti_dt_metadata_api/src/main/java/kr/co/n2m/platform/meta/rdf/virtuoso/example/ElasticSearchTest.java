package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLContext;

import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.nio.client.HttpAsyncClientBuilder;
import org.apache.http.message.BasicHeader;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.ssl.SSLContexts;
import org.apache.http.util.EntityUtils;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestClientBuilder.HttpClientConfigCallback;

import com.fasterxml.jackson.databind.ObjectMapper;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.elasticsearch.core.InfoResponse;
import co.elastic.clients.json.JsonData;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.TransportUtils;
import co.elastic.clients.transport.rest_client.RestClientTransport;

public class ElasticSearchTest {
	
	public static String SERVER_IP = "1.234.5.217";
//	public static String SERVER_IP = "heenimw.cafe24.com";
	public static int SERVER_PORT = 9200;
	
	public static String USERNAME = "elastic";
	public static String PASSOWORD = "es_admin1!";
	
	public static String FINGERPRINT = "4cd6a201122ff2ddad6545b074f7d9c38b8d431f4adf66bf7473a6449ab463d7"; 
	// 4609 5ACC 8548 582C 1A26 99A9 D27D 666C D88E 42B4
	
	public static String INDEX_NAME = "test_meta";
	public static String TEST_ID    = "Zzfom-WJpH2w-iS6E1-xs0lme";
	
	public static void main(String[] args) throws IOException, CertificateException, KeyStoreException, NoSuchAlgorithmException, KeyManagementException {
		
//		connectByCrt();         // https OK
		
		connectByFingerprint(); // https OK
		
//		connectByApiKey();      // http OK
		
	}
	
	public static byte[] str2bytes(String input) {
        String [] hex_list = input.split(":");
        byte[] output = new byte[hex_list.length];
        int i = 0;
        for (String hex: hex_list) {
            output[i] = (byte) Integer.parseInt(hex, 16);
            i ++;
        }
        return output;
    }
	
////	public static String getDecodedFingerPrint(String encoded) {
//	public static void convertFingerPrint() {
//		String rawFp = "4C:D6:A2:01:12:2F:F2:DD:AD:65:45:B0:74:F7:D9:C3:8B:8D:43:1F:4A:DF:66:BF:74:73:A6:44:9A:B4:63:D7";
//		System.out.println("rawFp : " + rawFp);
//		System.out.println(" ->   : " + Hashing.sha256().hashBytes(rawFp.getBytes()).toString());
//		// 15a8e4780b41e3f0c2b60f6a4eaa88fc9a159456fdbe250e197e0f7b935c76af
//		String temp = String.join("", rawFp.split(":"));
//		System.out.println("temp : " + temp);
//		System.out.println(" ->   : " + Hashing.sha256().hashBytes(temp.getBytes()).toString());
//		// e9e933cc3e1daf59cb04abb45a59755b59df938417aabd6aec985f02eea22f84
//		System.out.println("str2bytes : ");
//		System.out.println(" ->   : " + Hashing.sha256().hashBytes(str2bytes(rawFp)).toString());
//		// 337881a715ee32b1c918881cb68b202055f5cf10dda6a0d83af117aebba8e511
//		System.out.println("DigestUtils.sha256Hex : ");
//		System.out.println(" ->   : " + DigestUtils.sha256Hex(rawFp));
//		// 15a8e4780b41e3f0c2b60f6a4eaa88fc9a159456fdbe250e197e0f7b935c76af		
////		return Hashing.sha256().hashBytes(encoded.getBytes()).toString();
//	}
	
	public static Path getCrtPath() {
		String curPathName = Paths.get(".").toAbsolutePath().normalize().toString();
		System.out.println("current working dir : " + curPathName);
		System.out.println("current path : " + Paths.get("." +  File.separator + "keystore" + File.separator + "http_ca.crt")); // src 와 동일한 위치에 keystore 폴더 생성. http_ca.crt 넣어둔 경우.
		return Paths.get("." +  File.separator + "keystore" + File.separator + "http_ca.crt");
	}	
	
	public static void connectByCrt() {
		System.out.println("connectByCrt -----------------------------");
		/*
		 * elasticsearch.yml
		 * 
		 * xpack.security.enabled: true
		 * 
		 * xpack.security.http.ssl:
		 *   enabled: true
		 *   keystore.path: certs/http.p12
		 *   
		 * xpack.security.transport.ssl:
		 *   enabled: true
		 *   verification_mode: certificate
		 *   keystore.path: certs/transport.p12
		 *   truststore.path: certs/transport.p12
		 */
		try {
			
			BasicCredentialsProvider credsProv = new BasicCredentialsProvider(); 
			credsProv.setCredentials(
			    AuthScope.ANY, new UsernamePasswordCredentials(USERNAME, PASSOWORD)
			);
			
			CertificateFactory factory = CertificateFactory.getInstance("X.509");
			
			Path caCertificatePath = getCrtPath();
			
			Certificate trustedCa = null;
			try (InputStream is = Files.newInputStream(caCertificatePath)) {
			    trustedCa = factory.generateCertificate(is);
			}
			
			KeyStore trustStore = KeyStore.getInstance("pkcs12");
			trustStore.load(null, null);
			trustStore.setCertificateEntry("ca", trustedCa);
			SSLContextBuilder sslContextBuilder = SSLContexts.custom().loadTrustMaterial(trustStore, null);
			final SSLContext sslContext = sslContextBuilder.build();
			RestClientBuilder builder = RestClient.builder(
			    new HttpHost(SERVER_IP, SERVER_PORT, "https"))
			    .setHttpClientConfigCallback(new HttpClientConfigCallback() {
			        @Override
			        public HttpAsyncClientBuilder customizeHttpClient(
			            HttpAsyncClientBuilder httpClientBuilder) {
			            return httpClientBuilder.setSSLContext(sslContext)
			            		.setDefaultCredentialsProvider(credsProv);
			        }
			    });
			
			RestClient restClient = builder.build();
			
			System.out.println(restClient.isRunning());
			
			ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
			ElasticsearchClient esClient = new ElasticsearchClient(transport);
			
			InfoResponse infoRes = esClient.info();
			System.out.println(infoRes.toString());
			
//			GetResponse<JsonData> getRes = esClient.get(g -> g.index(INDEX_NAME).id(TEST_ID), JsonData.class);
//			System.out.println(getRes.toString());
		
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void connectByFingerprint() {
		System.out.println("connectByFingerprint -----------------------------");
		/*
		 * elasticsearch.yml
		 * 
		 * xpack.security.enabled: true
		 * 
		 * xpack.security.http.ssl:
		 *   enabled: true
		 *   keystore.path: certs/http.p12
		 *   
		 * xpack.security.transport.ssl:
		 *   enabled: true
		 *   verification_mode: certificate
		 *   keystore.path: certs/transport.p12
		 *   truststore.path: certs/transport.p12
		 */		
		try {
			SSLContext sslContext = TransportUtils.sslContextFromCaFingerprint(FINGERPRINT); 
			
			BasicCredentialsProvider credsProv = new BasicCredentialsProvider(); 
			credsProv.setCredentials(
			    AuthScope.ANY, new UsernamePasswordCredentials(USERNAME, PASSOWORD)
			);
			
			RestClient restClient = RestClient
			    .builder(new HttpHost(SERVER_IP, SERVER_PORT, "https")) 
			    .setHttpClientConfigCallback(hc -> hc
			        .setSSLContext(sslContext) 
			        .setDefaultCredentialsProvider(credsProv)
			    )
			    .build();
			
			System.out.println(restClient.isRunning());
			
			// Create the transport and the API client
			ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
			ElasticsearchClient esClient = new ElasticsearchClient(transport);
			
			InfoResponse infoRes = esClient.info();
			System.out.println(infoRes.toString());
			
			GetResponse<JsonData> getRes = esClient.get(g -> g.index(INDEX_NAME).id(TEST_ID), JsonData.class);
			System.out.println(getRes.toString());
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}	
	
	public static void connectByApiKey() {
		System.out.println("connectByApiKey -----------------------------");
		/*
		 * elasticsearch_dtmeta_apikey
		 * U1NIclFvd0JDV1JRMEFwNW1MY086SG01ODE3NlhSNC1nakhQNHVlVDB2QQ==
		 */
		/*
		 * elasticsearch.yml
		 * 
		 * xpack.security.enabled: true
		 * 
		 * xpack.security.http.ssl.enabled: false
		 * xpack.security.transport.ssl.enabled: false
		 */		
		try {
			// Create the low-level client
			RestClient restClient = RestClient
			    .builder(new HttpHost(SERVER_IP, SERVER_PORT, "http")) 
			    .setDefaultHeaders(new Header[]{
			        new BasicHeader("Authorization", "ApiKey " + "U1NIclFvd0JDV1JRMEFwNW1MY086SG01ODE3NlhSNC1nakhQNHVlVDB2QQ==")
			    })
			    .build();
			
			System.out.println(restClient.isRunning());
			
			ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
			ElasticsearchClient esClient = new ElasticsearchClient(transport);
			
			InfoResponse infoRes = esClient.info();
			System.out.println(infoRes.toString());
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}
	
	public static void connectByApiKey_81() {
		System.out.println("connectByApiKey_81 -----------------------------");
		try {
			// Create the low-level client
			RestClient restClient = RestClient
			    .builder(HttpHost.create("http://192.168.123.81:9200"))
			    .setDefaultHeaders(new Header[]{
			        new BasicHeader("Authorization", "ApiKey " + "RDNzdUdvd0JuQXpycENhQ0NfUkM6b3BxWFFqUlhUNGExY1ZBVDlKNnNYdw==")
			    })
			    .build();
			
			System.out.println(restClient.isRunning());
			
			Response response = restClient.performRequest(new Request("GET", "/test_meta"));
			System.out.println(response.getEntity().getContent());
			
			
//			// Create the transport with a Jackson mapper
			ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
	//
//			// And create the API client
			ElasticsearchClient esClient = new ElasticsearchClient(transport);
			GetResponse<JsonData> getRes = esClient.get(g -> g.index("test_meta").id("Zzfom-WJpH2w-iS6E1-xs0lme"), JsonData.class);
			System.out.println(getRes.toString());
			
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}	
	
    public static void insertDocument_81() {
    	System.out.println("insertDocument_81 -----------------------------");
        try {
            RestClient restClient = RestClient
            		.builder(HttpHost.create("http://192.168.123.81:9200"))
                    .setDefaultHeaders(new Header[]{
                            new BasicHeader("Authorization", "ApiKey " + "RDNzdUdvd0JuQXpycENhQ0NfUkM6b3BxWFFqUlhUNGExY1ZBVDlKNnNYdw==")
                    })
                    .build();

            Map<String, Object> document = new HashMap<>();
            document.put("field1", "value1");
            document.put("field2", "value2");

            StringEntity entity = new StringEntity(new ObjectMapper().writeValueAsString(document), ContentType.APPLICATION_JSON);

            Request request = new Request("PUT", "/test_meta/_doc/2");
            request.setEntity(entity);

            Response response = restClient.performRequest(request);	

            System.out.println(response.getStatusLine().getStatusCode());
            System.out.println(EntityUtils.toString(response.getEntity()));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static void updateDocument_81() {
    	System.out.println("updateDocument_81 -----------------------------");
        try {
            RestClient restClient = RestClient
                    .builder(HttpHost.create("http://192.168.123.81:9200"))
                    .setDefaultHeaders(new Header[]{
                            new BasicHeader("Authorization", "ApiKey " + "RDNzdUdvd0JuQXpycENhQ0NfUkM6b3BxWFFqUlhUNGExY1ZBVDlKNnNYdw==")
                    })
                    .build();

            Map<String, Object> document = new HashMap<>();
            document.put("field1", "update_value1");
            document.put("field2", "update_value2");

            StringEntity entity = new StringEntity(new ObjectMapper().writeValueAsString(document), ContentType.APPLICATION_JSON);
            
            Request request = new Request("POST", "/test_meta/_doc/2");
            request.setEntity(entity);

            Response response = restClient.performRequest(request);

            System.out.println(response.getStatusLine().getStatusCode());
            System.out.println(EntityUtils.toString(response.getEntity()));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static void deleteDocument_81() {
    	System.out.println("deleteDocument_81 -----------------------------");
        try {
            RestClient restClient = RestClient
                    .builder(HttpHost.create("http://192.168.123.81:9200"))
                    .setDefaultHeaders(new Header[]{
                            new BasicHeader("Authorization", "ApiKey " + "RDNzdUdvd0JuQXpycENhQ0NfUkM6b3BxWFFqUlhUNGExY1ZBVDlKNnNYdw==")
                    })
                    .build();

            Request request = new Request("DELETE", "/test_meta/_doc/2");

            Response response = restClient.performRequest(request);

            System.out.println(response.getStatusLine().getStatusCode());
            System.out.println(EntityUtils.toString(response.getEntity()));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}

