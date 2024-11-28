package net.jw.twin.repository.config;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dev.akkinoc.util.YamlResourceBundle;
import net.jcms.framework.weblog.interceptor.WebLogInterceptor;
import net.jw.twin.repository.aop.RuntimeExceptionAspect;
import net.jw.twin.repository.config.converter.GsonLocalDateTimeDeserializer;
import net.jw.twin.repository.config.converter.GsonLocalDateTimeSerializer;
import net.jw.twin.repository.config.converter.LocalDateConverter;
import net.jw.twin.repository.config.converter.LocalDateTimeConverter;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.*;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.GsonHttpMessageConverter;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Controller;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;
import org.springframework.web.servlet.i18n.SessionLocaleResolver;
import org.springframework.web.servlet.view.UrlBasedViewResolver;
import org.springframework.web.servlet.view.tiles3.TilesView;
import org.springframework.web.servlet.view.tiles3.TilesConfigurer;
import org.springframework.web.util.UrlPathHelper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@EnableWebMvc
@Configuration
@PropertySource({ "classpath:/config/application.properties" })
@PropertySource({ "classpath:/config/properties/globals-secret.properties" })
@ComponentScan(
        basePackages = { "net.jcms", "net.jw" },
        useDefaultFilters = false,
        includeFilters = {
                @ComponentScan.Filter(type = FilterType.ANNOTATION,value = {Controller.class})
        }
)
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class WebMvcConfig extends WebMvcConfigurerAdapter {
    private static final String dateFormat = "yyyy-MM-dd";
    private static final String dateTimeFormat = "yyyy-MM-dd HH:mm:ss";

    @Value("${AppConf.files.dir}")
    private String filesDirectory;

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT);
        return modelMapper;
    }

    @Bean
    public RuntimeExceptionAspect customExceptionAspect() {
        return new RuntimeExceptionAspect();
    }

    @Bean
    public CommonsMultipartResolver multipartResolver() {
        CommonsMultipartResolver multipartResolver = new CommonsMultipartResolver();
        return multipartResolver;
    }

    @Bean
    StringHttpMessageConverter StringConverter() {
        StringHttpMessageConverter converter = new StringHttpMessageConverter();
        converter.setWriteAcceptCharset(false);
        return converter;
    }

    @Bean
    ByteArrayHttpMessageConverter ByteArrayConverter() {
        ByteArrayHttpMessageConverter converter = new ByteArrayHttpMessageConverter();

        List<MediaType> mediatype = new ArrayList<MediaType>();

        mediatype.add(MediaType.IMAGE_PNG);
        mediatype.add(MediaType.IMAGE_JPEG);
        mediatype.add(MediaType.IMAGE_GIF);

        converter.setSupportedMediaTypes(mediatype);

        return converter;
    }

    @Bean
    public Jackson2ObjectMapperBuilder jackson2ObjectMapperBuilder() {
        return new Jackson2ObjectMapperBuilder()
                .failOnUnknownProperties(false) // SpringBoot default
                .featuresToDisable(MapperFeature.DEFAULT_VIEW_INCLUSION) // SpringBoot default
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS) // SpringBoot default
                .serializerByType(LocalDateTime.class, new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(dateTimeFormat)))
                .serializerByType(LocalDate.class, new LocalDateSerializer(DateTimeFormatter.ofPattern(dateFormat)));
    }

    @Bean
    MappingJackson2HttpMessageConverter JacksonConverter() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();

        List<MediaType> mediatype = new ArrayList<MediaType>();

        mediatype.add(MediaType.APPLICATION_JSON);

        ObjectMapper objectMapper = jackson2ObjectMapperBuilder().build();

        converter.setObjectMapper(objectMapper);
        converter.setSupportedMediaTypes(mediatype);
        return converter;
    }

    @Bean
    public Gson gson() {
        return new GsonBuilder()
//                .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
                .registerTypeAdapter(LocalDateTime.class, new GsonLocalDateTimeSerializer())
                .registerTypeAdapter(LocalDateTime.class, new GsonLocalDateTimeDeserializer())
//                .registerTypeAdapterFactory(ThrowableAdapterFactory.INSTANCE)
                .create();
    }

    @Bean
    public GsonHttpMessageConverter gsonHttpMessageConverter() {
        Gson gson = gson();

        GsonHttpMessageConverter gsonHttpMessageConverter = new GsonHttpMessageConverter();
        gsonHttpMessageConverter.setGson(gson);
        return gsonHttpMessageConverter;
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
//        converters.add(JacksonConverter());
        converters.add(gsonHttpMessageConverter());
        converters.add(StringConverter());
        converters.add(ByteArrayConverter());
        super.configureMessageConverters(converters);
    }

    @Bean
    public UrlBasedViewResolver viewResolver() {
        UrlBasedViewResolver tilesView = new UrlBasedViewResolver();
        tilesView.setViewClass(TilesView.class);
        tilesView.setOrder(0);
        return tilesView;
    }

    @Bean
    public TilesConfigurer tilesConfigurer() {
        TilesConfigurer tiles = new TilesConfigurer();
        tiles.setDefinitions(new String[] { "/WEB-INF/config/tiles/*.xml"});
        return tiles;
    }

    @Bean
    public JavaMailSender getJavaMailSender(
            @Value("${javamail.username}") String username,
            @Value("${javamail.password}") String password
    ) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);

        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.setProperty("mail.transport.protocol", "smtp");
        props.setProperty("mail.smtp.auth", "true");
        props.setProperty("mail.smtp.starttls.enable", "true");
        props.setProperty("mail.debug", "true");
        props.setProperty("mail.smtp.ssl.protocols", "TLSv1.2");

        return mailSender;
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        UrlPathHelper urlPathHelper = new UrlPathHelper();
        urlPathHelper.setUrlDecode(false);
        urlPathHelper.setAlwaysUseFullPath(true);
        configurer.setUrlPathHelper(urlPathHelper);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
                .addResourceHandler("/static/**")
//                .addResourceLocations("classpath:/static", "file:"+staticDirectory)
                .addResourceLocations("classpath:/static/", "file:"+ filesDirectory)
                .setCachePeriod(3600)
                .resourceChain(true);
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new LocalDateConverter(dateFormat));
        registry.addConverter(new LocalDateTimeConverter(dateTimeFormat));
    }

    @Bean // 세션에 지역설정. default는 KOREAN = 'ko'
    public LocaleResolver localeResolver() {
        SessionLocaleResolver slr = new SessionLocaleResolver();
        slr.setDefaultLocale(Locale.KOREAN);
//        slr.setDefaultLocale(Locale.US);
        return slr;
    }

    @Bean // 지역설정을 변경하는 인터셉터. 요청시 파라미터에 lang 정보를 지정하면 언어가 변경됨.
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor lci = new LocaleChangeInterceptor();
        lci.setParamName("lang");
        return lci;
    }

    @Bean
    public WebLogInterceptor webLogInterceptor(){
        return new WebLogInterceptor();
    }
    @Override // 인터셉터를 시스템 레지스트리에 등록
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
        registry.addInterceptor(webLogInterceptor())
                .addPathPatterns("/system/**/*.mng", "/system/**/*.json", "/public/user/*.mng")
                .excludePathPatterns("/login/*", "/error/*", "/test/*", "/system/mypage/*", "/system/user/insert.json", "/system/login/findPassword.json");
    }

    @Bean // yml 파일을 참조하는 MessageSource 선언
    public MessageSource messageSource(
            @Value("${spring.config.message.basename}") String basename,
            @Value("${spring.config.message.encoding}") String encoding
    ) {
        YamlMessageSource ms = new YamlMessageSource();
        ms.setBasenames(basename.split(","));
        ms.setDefaultEncoding(encoding);
        ms.setAlwaysUseMessageFormat(true);
        ms.setUseCodeAsDefaultMessage(true);
        ms.setFallbackToSystemLocale(true);
        return ms;
    }

    // locale 정보에 따라 다른 yml 파일을 읽도록 처리
    private static class YamlMessageSource extends ResourceBundleMessageSource {
        @Override
        protected ResourceBundle doGetBundle(String basename, Locale locale) throws MissingResourceException {
            return ResourceBundle.getBundle(basename, locale, YamlResourceBundle.Control.INSTANCE);
        }
    }
}
