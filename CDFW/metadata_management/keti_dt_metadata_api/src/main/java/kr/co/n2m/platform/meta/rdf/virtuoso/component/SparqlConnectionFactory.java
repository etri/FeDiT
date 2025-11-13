package kr.co.n2m.platform.meta.rdf.virtuoso.component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.http.auth.AuthEnv;
import org.apache.jena.rdfconnection.RDFConnection;
import org.apache.jena.rdfconnection.RDFConnectionRemote;
import org.apache.jena.rdfconnection.RDFConnectionRemoteBuilder;
import org.springframework.stereotype.Component;

import kr.co.n2m.platform.meta.architecture.property.SparqlProperty;

import java.net.URI;
import java.time.Duration;

import javax.annotation.PostConstruct;

import java.net.http.HttpClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class SparqlConnectionFactory {
	private final SparqlProperty prop;

	@PostConstruct
	public void initAuth() {
		String username = prop.getUsername();
		String password = prop.getPassword();

		if (StringUtils.isNotBlank(username) && StringUtils.isNotBlank(password)) {
			// 엔드포인트의 루트 URI 등록 → 하위 경로 모두 적용
			URI baseUri = URI.create(prop.getQueryEndpoint()).resolve("/");

			AuthEnv.get().registerUsernamePassword(baseUri, username, password);
		}
	}

	public RDFConnection newConn() {
		RDFConnectionRemoteBuilder builder = RDFConnectionRemote.newBuilder() // 반환 타입: RDFConnectionRemoteBuilder
				.queryEndpoint(prop.getQueryEndpoint()).updateEndpoint(prop.getUpdateEndpoint())
				.gspEndpoint(prop.getGspEndpoint());

		HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

		builder.httpClient(client);
		return builder.build();
	}

	// basicAuthHeader()는 백업용으로 유지 (직접 헤더 필요 시)
	public String basicAuthHeader() {
		if (StringUtils.isBlank(prop.getUsername()))
			return null;
		String token = java.util.Base64.getEncoder()
				.encodeToString((prop.getUsername() + ":" + prop.getPassword()).getBytes());
		return "Basic " + token;
	}

	// 편의 getter들
	public String graphDev() {
		return prop.getDevGraphName();
	}

	public String graphUse() {
		return prop.getUseGraphName();
	}

	public String queryEndpoint() {
		return prop.getQueryEndpoint();
	}

	public String username() {
		return prop.getUsername();
	}

	public String password() {
		return prop.getPassword();
	}

	public String conductorUrl() {
		return prop.getConductorUrl();
	}
}
