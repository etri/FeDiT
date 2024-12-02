package net.jw.twin.repository.config;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.JcmsGlobal;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class InitService implements ApplicationListener<ContextRefreshedEvent> {
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        String activeProfile = System.getProperty("spring.profiles.active");
        log.info("!!!!! spring.profiles.active = " + activeProfile);
        JcmsGlobal.setJcmsUserDataParser( new JcmsUserDataParserImpl() );
    }
}