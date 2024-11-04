package iitp.federatedTwins.DtEvtTracking.detrckGateWay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.cloud.context.environment.EnvironmentChangeEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
@RefreshScope
public class MyRefreshListener implements ApplicationListener<EnvironmentChangeEvent> {

    @Value("${app.version}")
    public String version;

    @Override
    public void onApplicationEvent(EnvironmentChangeEvent environmentChangeEvent) {
        System.err.println("onApplicationEvent: " + environmentChangeEvent);
        System.err.println("version: " + version);
    }
}