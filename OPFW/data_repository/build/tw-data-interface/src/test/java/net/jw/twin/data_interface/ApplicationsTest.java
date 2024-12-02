package net.jw.twin.data_interface;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ActiveProfiles;

@ComponentScan(
        basePackages = { "net.jw" },
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASPECTJ, pattern = {
                        "net.jw.twin.db.**.service.**",
                        "net.jw.twin.dbExt.**.service.**",
                        "net.jw.twin.db.**.mapper.**",
                        "net.jw.twin.dbExt.**.mapper.**"
                })
        }
)
@SpringBootTest
@ActiveProfiles("dev")
class ApplicationsTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    public void contextLoads() throws Exception {
        if (applicationContext != null) {
            String[] beans = applicationContext.getBeanDefinitionNames();

            for (String bean : beans) {
                System.out.println("bean : " + bean);
            }
        }
    }
}