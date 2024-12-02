package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dbExt.dataCategoryDescExt.service.DataCategoryDescServiceExt;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
public class DataCategoryDescController extends BaseController {
    @Autowired
    @Qualifier("dataCategoryDescServiceExt")
    DataCategoryDescServiceExt dataCategoryDescServiceExt;

    @RequestMapping(value="/public/data-category-desc/get.json", method= RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> get () {
        Map<String, Object> result = new HashMap<String, Object>();

        DataCategoryDescSearch search = new DataCategoryDescSearch();
        result.put("data", dataCategoryDescServiceExt.selectListWithIconFileInfo(search));

        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @PostMapping("/system/data-category/list.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_COMMON__DATACATEGORY)
    public ResponseEntity<?> list(HttpServletRequest request, DataCategoryDescSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");
        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);

        result.put("data", dataCategoryDescServiceExt.selectListWithIconFileInfo(search));

        search.setPagingYn(false);
        int totalCount = dataCategoryDescServiceExt.count(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @PostMapping("/system/data-category/modify.json")
    @ResponseBody
    public ResponseEntity<?> modify(DataCategoryDesc dataCategoryDesc, MultipartFile iconFilePath) throws IOException {
        if( null == iconFilePath || iconFilePath.isEmpty() ) {
            throw new CustomException(ErrorStatus.E_COMMON__DATACATEGORY__NO_ICON_FILE, "dataCategoryDesc id : " + dataCategoryDesc.getCategory());
        }

        dataCategoryDescServiceExt.updateWithFile(dataCategoryDesc, iconFilePath);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/system/data-category/insert.json")
    @ResponseBody
    public ResponseEntity<?> insert(DataCategoryDesc dataCategoryDesc, MultipartFile iconFilePath) throws IOException {
        if( null == iconFilePath || iconFilePath.isEmpty() ) {
            throw new CustomException(ErrorStatus.E_COMMON__DATACATEGORY__NO_ICON_FILE, "dataCategoryDesc id : " + dataCategoryDesc.getCategory());
        }

        dataCategoryDescServiceExt.insertWithFile(dataCategoryDesc, iconFilePath);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/system/data-category/{category}.json")
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_DELETE)
    public ResponseEntity<?> delete(@PathVariable("category") String category) {
        DataCategoryDesc data = DataCategoryDesc.builder()
                .category(category)
                .build();

        int count = dataCategoryDescServiceExt.deleteSoftWithIconFile(data);
        if(count != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_DELETE, "data category desc : " + category);
        }
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
