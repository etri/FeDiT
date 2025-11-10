package kr.co.n2m.platform.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

@Configuration
public class SwaggerConfig {

	@Bean
	public Docket allApi() {
        return getDocket("전체", "/*.*");
	}

	@Bean
	public Docket menuApi() {
        return getDocket("메뉴 관리", "/menu/*.*");
	}

	@Bean
	public Docket authGroupApi() {
        return getDocket("권한 관리", "/auth/*.*");
	}

	@Bean
	public Docket codeGroupApi() {
        return getDocket("코드 그룹 관리", "/codegroup/*.*");
	}
	
	@Bean
	public Docket userApi() {
        return getDocket("사용자 관리", "/user/*.*");
	}
	
	@Bean
	public Docket apigroupApi() {
        return getDocket("API 그룹 관리", "/apigroup/*.*");
	}
	
	@Bean
	public Docket boardApi() {
        return getDocket("게시판 관리", "/board/*.*");
	}

	@Bean
	public Docket noticeApi() {
        return getDocket("공지사항 관리", "/notice/*.*");
	}

	@Bean
	public Docket qnaApi() {
        return getDocket("QnA 관리", "/qna/*.*");
	}
	
	@Bean
	public Docket faqApi() {
        return getDocket("FAQ 관리", "/faq/*.*");
	}
	
	@Bean
	public Docket attachFileApi() {
        return getDocket("첨부 파일 관리", "/attachfile/*.*");
	}
	
	@Bean
	public Docket platformApi() {
        return getDocket("플랫폼 관리", "/platform/*.*");
	}

    public Docket getDocket(String groupName, String pathRegex) {
		return new Docket(DocumentationType.SWAGGER_2)
				.useDefaultResponseMessages(false)
				.groupName(groupName)
				.select()
				.apis(RequestHandlerSelectors.basePackage("kr.co.n2m.platform.admin.feature"))
                .paths(PathSelectors.regex(pathRegex))
				.build()
				.apiInfo(apiInfo())
				// .globalResponseMessage(RequestMethod.GET, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.POST, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.GET, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.POST, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.DELETE, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.PUT, getCustomizedResponseMessages())
				// .globalResponseMessage(RequestMethod.PATCH, getCustomizedResponseMessages())
				;
	}

	private ApiInfo apiInfo() {
		return new ApiInfoBuilder()
				.title("Platform Admin MS API")
				.description("<strong>Platform Admin MS API Docs</strong>")
				.version("0.0.1")
				.contact(new Contact("N2M", "http://www.n2m.co.kr", ""))
				.build();
	}

//	private List<ResponseMessage> getCustomizedResponseMessages() {
//		List<ResponseMessage> responseMessages = new ArrayList<>();
//		responseMessages.add(new ResponseMessageBuilder().code(400).message("잘못된 접근입니다.").build());
//		responseMessages.add(new ResponseMessageBuilder().code(404).message("페이지를 찾을 수 없습니다.").build());
//		responseMessages.add(new ResponseMessageBuilder().code(500).message("내부 서버 오류가 발생하였습니다.").build());
//
//		return responseMessages;
//	}
}
