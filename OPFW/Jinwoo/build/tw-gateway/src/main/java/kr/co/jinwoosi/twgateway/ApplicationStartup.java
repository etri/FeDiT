package kr.co.jinwoosi.twgateway;

import jakarta.annotation.PostConstruct;
import kr.co.jinwoosi.twgateway.config.TwRoutesLocator;
import kr.co.jinwoosi.twgateway.util.JsonUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.lang.reflect.InvocationTargetException;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ApplicationStartup {
    private final WebClient repositoryWeb;
    private final TwRoutesLocator routesLocator;

    @Value("${jcms.repository.node-list-path}")
    private String nodeListPath;
    private List<HostServiceInfo> hostServices = null;

    public ApplicationStartup(WebClient repositoryWeb, TwRoutesLocator routesLocator) {
        this.repositoryWeb = repositoryWeb;
        this.routesLocator = routesLocator;
    }

    @PostConstruct
    @Scheduled(cron = "47 3/10 * * * *")
    public void start() {
        try {
            if(needsHostServices(getHostServices())) {
                routesLocator.getAllUpdate(hostServices);
            }
        } catch (Exception e) {
            log.error("게이트웨이 서비스 등록 실패.." + e);
        }
   }

   private boolean needsHostServices(List<HostServiceInfo> list) {
        if(list==null || list.isEmpty()) {
            log.error("list==null || list.isEmpty() : " + list );
            return false;
        }
        if(hostServices==null || hostServices.isEmpty() || hostServices.size()!= list.size()) {
            hostServices = list;
            return true;
        }
        for(HostServiceInfo now : list) {
            boolean same = false;
            for(HostServiceInfo old : hostServices) {
                if(old.equals(now)) {
                    same = true;
                    break;
                }
            }
            if(!same) {
                hostServices = list;
                return true;
            }
        }
        log.error("return false;");
        return false;
   }

   private List<HostServiceInfo> getHostServices() throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
       log.info("[getHostServices] started");
       String rst = repositoryWeb
               .get()
               .uri(nodeListPath)
               .retrieve()
               .bodyToMono(String.class)
               .onErrorResume( e -> {
                   throw new RuntimeException(e.getMessage());
               })
               .block();

       Map<String,String> maps = JsonUtil.getMap(rst);
       List<HostServiceInfo> list = JsonUtil.getList(HostServiceInfo.class, maps.get("list"));

       Iterator<HostServiceInfo> it = list.iterator();
       while (it.hasNext()) {
           HostServiceInfo hsi = (HostServiceInfo)it.next();
           if(hsi.getServiceId()==null || hsi.getServiceId().isEmpty() ||
                   hsi.getStatus()==null || !hsi.getStatus().equals("approved")) it.remove();
       }
       log.info("list count : " + list.size());
       log.info("[getHostServices] end");
       return list;
   }
}

