package net.jw.twin.tw_service_manager.rest;

import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyService;
import net.jw.twin.tw_service_manager.global.CodeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class HelloController {

    @Autowired
    private RestKeyService restKeyService;


    @GetMapping("/hello")
    public ResponseEntity<?> hello() {
        RestKeySearch search = RestKeySearch.builder()
                .status(CodeValue.RestKeyStatus.issued.toString())
                .build();

        return ResponseEntity.ok(restKeyService.selectList(search));
    }

    @GetMapping("/time")
    public String hello2() {
        return LocalDateTime.now().toString();
    }
}
