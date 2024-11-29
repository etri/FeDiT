package kr.co.jinwoosi.twgateway;

import net.jw.twin.repository.db.ext.restKeyExt.service.RestKeyServiceExt;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TwGatewayApplicationTest {
    @Autowired
    private RestKeyServiceExt restKeyServiceExt;

    @Test
    void contextLoads() {

    }

    @Test
    public void getUsageRequestValidate() {
        restKeyServiceExt.validateUsageRequest("data2", "35812a80d9640d98597534088e18adc8e3a4b3dabc3aa7cb6e106789ee32cab8");
    }
}