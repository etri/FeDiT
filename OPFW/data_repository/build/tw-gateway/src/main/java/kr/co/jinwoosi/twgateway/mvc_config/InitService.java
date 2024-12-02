package kr.co.jinwoosi.twgateway.mvc_config;

import net.jcms.framework.base.JcmsGlobal;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Service;

@Service
public class InitService implements ApplicationListener<ContextRefreshedEvent> {
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        JcmsGlobal.setJcmsUserDataParser( new JcmsUserDataParserImpl() );
    }
}