package net.jw.twin.data_interface.rest_controller.v1;

import com.google.gson.JsonObject;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.jw.twin.common.response.ResponseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.management.MalformedObjectNameException;
import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.ZoneId;
import java.util.Calendar;

@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/v1")
@Hidden
@Slf4j
public class ManageController {

    private final ResponseService responseService;

    @Autowired
    DataSource datasource;

    @GetMapping(value = "/manage/db/number-current-connection")
    public JsonObject getDbpoolSize() throws MalformedObjectNameException {
        final HikariPoolMXBean hikariPoolMXBean = ((HikariDataSource) datasource).getHikariPoolMXBean();

        JsonObject retObject = new JsonObject();
        retObject.addProperty("total", hikariPoolMXBean.getTotalConnections());
        retObject.addProperty("active", hikariPoolMXBean.getActiveConnections());
        retObject.addProperty("idle", hikariPoolMXBean.getIdleConnections());
        retObject.addProperty("await", hikariPoolMXBean.getThreadsAwaitingConnection());
        return retObject;
    }

    @GetMapping(value = "/test/timestamp")
    public Timestamp testTimestamp(@RequestParam Long millis) {
        Timestamp timestamp = new Timestamp(millis);
        log.info(timestamp.toString());
        return timestamp;
    }

    @GetMapping(value = "/test/timezone")
    public String getTimezone() {
        return ZoneId.systemDefault().toString();
    }

    @GetMapping(value = "/test/calendar")
    public String getCalendar() {
        Calendar calendar = Calendar.getInstance();
        return calendar.getTimeZone().toString();
    }
}
