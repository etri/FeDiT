package net.jw.twin.tw_service_manager.config;

import net.jw.twin.common.config.WebMvcConfigAbstract;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
public class WebMvcConfig extends WebMvcConfigAbstract {

//    @Override
//    @Bean
//    public Gson gson() {
//        return new GsonBuilder()
//                .setExclusionStrategies(new ExcludeStrategy())
//                .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
//                .registerTypeAdapter(DataItem.class, new DataItemSerializer())
//                .registerTypeAdapter(LocalDateTime.class, new GsonLocalDateTimeSerializer())
//                .registerTypeAdapter(LocalDateTime.class, new GsonLocalDateTimeDeserializer())
//                .registerTypeAdapterFactory(ThrowableAdapterFactory.INSTANCE)
//                .create();
//    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/v1/**")
                .allowedOrigins("*")
                .allowedMethods("GET","POST");

        // Add more mappings...
    }
}
