package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.cd.service.CdDtlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Slf4j
@Controller
public class CodeValueController extends BaseController {

    @Autowired
    @Qualifier("cdDtlService")
    private CdDtlService cdDtlService;

    @GetMapping("/public/code/list.json")
    @ResponseBody
    public ResponseEntity<?> getCodeValueList(@RequestParam String codeId) {
        return ResponseEntity.ok(cdDtlService.selectJson(codeId));
    }
}
