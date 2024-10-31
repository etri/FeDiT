package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dbExt.institutionExt.service.InstitutionServiceExt;
import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
public class InstitutionController extends BaseController {
    @Autowired
    @Qualifier("institutionServiceExt")
    InstitutionServiceExt institutionServiceExt;

    @Autowired
    @Qualifier("userService")
    UserService userService;

    @RequestMapping(value="/system/institution/list.json", method= RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request, InstitutionSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");
        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);

        result.put("data", institutionServiceExt.selectListWithManagerName(search));

        search.setPagingYn(false);
        int totalCount = institutionServiceExt.count(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @PutMapping(value="/system/institution.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_INSERT)
    public ResponseEntity<?> insert(@RequestBody Institution institution) {
        int count = institutionServiceExt.insert(institution);
        if(count != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_INSERT, "institution id : " + institution.getId());
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PatchMapping(value="/system/institution.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_MODIFY)
    public ResponseEntity<?> update(@RequestBody Institution institution) {

        institutionServiceExt.updateInstitution(institution);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/system/institution/{id}.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_DELETE)
    public ResponseEntity<?> delete(@PathVariable Long id) throws IOException {
        Institution institution = Institution.builder()
                .id(id)
                .build();

        int updateCount = institutionServiceExt.deleteSoft(institution);
        if (updateCount != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_DELETE, "institution id : " + institution.getId());
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/institution/list.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_COMMON__UNKNOWN)
    public ResponseEntity<?> list(InstitutionSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();

        result.put("data", institutionServiceExt.selectList(search));

        search.setPagingYn(false);
        int totalCount = institutionServiceExt.count(search);
        result.put("recordsTotal", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }
}
