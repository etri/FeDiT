package net.jcms.framework.security.web;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dbExt.dataItemExt.service.DataItemServiceExt;
import net.jw.twin.repository.client.dbExt.dataUseExt.service.DataUseServiceExt;
import net.jw.twin.repository.client.dto.DtoCheckIdDuplicate;
import net.jw.twin.repository.client.dto.DtoDataItemRequest;
import net.jw.twin.repository.client.dto.DtoFindPasswordRequest;
import net.jw.twin.repository.client.dto.DtoPublicSignUpRequest;
import net.jw.twin.repository.config.MessageSourceUtil;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.FrontGlobal;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Controller
@RequiredArgsConstructor
public class PublicController extends BaseController {

    private final Environment environment;

    private final UserService userService;

    private final DataItemServiceExt dataItemServiceExt;

    private final DataUseServiceExt dataUseServiceExt;

    private final ModelMapper modelMapper;

    @Value("${AppConf.mok.enabled}")
    private Boolean idAuthEnabled;

    @RequestMapping("/index.mng")
    public String publicIndex(HttpServletRequest request,
                              Model model) throws IOException {
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        String userName = user != null ? user.getUserNm() : null;

        String msg = MessageSourceUtil.getMessage("test.msg");

        model.addAttribute("userName", userName);
        model.addAttribute("msg", msg);

        return "public/repository/Index";
    }

    @RequestMapping("/public/login-info.json")
    @ResponseBody
    public Map<String, Object> loginInfo(HttpServletRequest request, Model modal) throws IOException {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> map = new HashMap<String, Object>();

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        String userName = user != null ? user.getUserNm() : null;

        map.put("userName", userName);

        result.put("data", map);
        result.put("result", "success");

        return result;
    }

    @RequestMapping("/detail.mng")
    public String detail(HttpServletRequest request, Long id) throws IOException {
        if (!dataItemServiceExt.isValid(id)) {
            throw new CustomException(ErrorStatus.E_DB__NOT_FOUND, "invalid data item");
        }

        return "public/repository/DataDetail";
    }

    @RequestMapping("/find-data.mng")
    public String dataList(Model modal) throws IOException {
        return "public/repository/DataList";
    }

    @RequestMapping("/user-guide.mng")
    public String userGuide(Model modal) throws IOException {
        return "public/repository/UserGuide";
    }

    @RequestMapping("/public/data-regist-request.mng")
    public String dataRegist(Model modal) throws IOException {
        return "public/repository/DataRegistRequest";
    }

    @PostMapping("/public/data-item-regist-request.json")
    @ResponseBody
    public Map<String, Object> insertDataItem(HttpServletRequest request, @RequestBody @Valid DtoDataItemRequest dto) throws IOException {

        DataItem dataItem = modelMapper.map(dto, DataItem.class);

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        if(user == null) {
            throw new CustomException(ErrorStatus.E_COMMON__SESSION_USER, "");
        }

        if(null!=user.getInstitutionId()) {
            dataItem.setInstitutionId(user.getInstitutionId());
        }

        Map<String, Object> result = new HashMap<String, Object>();

        dataItemServiceExt.requestDataRegist(dataItem);

        result.put("result", "success");

        return result;
    }

    @PatchMapping("/public/data-use-request.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_MODIFY)
    public ResponseEntity<?> updateDataUseRequest(@RequestBody DataUse dataUse) throws IOException {
        int updateCount = dataUseServiceExt.update(dataUse);
        if(updateCount != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_MODIFY, "dataUse id : " + dataUse.getId());
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/public/data-use-request/{id}.json")
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_MODIFY)
    public ResponseEntity<?> deleteDataUseRequest(@PathVariable Long id) throws IOException {
        Long userId = Optional.ofNullable(getUserId()).orElseThrow(() -> new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        DataUse dataUse = DataUse.builder()
                .id(id)
                .regId(userId)
                .build();

        int updateCount = dataUseServiceExt.deleteSoft(dataUse);
        if (updateCount != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_DELETE, "dataUse id : " + dataUse.getId());
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @RequestMapping(value = "/loginForm.mng")
    public String loginForm(HttpServletRequest request, Model model) {
        model.addAttribute("path", request.getParameter("path"));
        return "public/repository/Login";
    }

    @RequestMapping("/public/signup.do")
    public String signup(HttpServletRequest request, Model model) {
        String[] activeProfiles = environment.getActiveProfiles();
        String activeProfile = "dev";

        for (String profile : activeProfiles) {
            if (profile.equals("prod")) {
                activeProfile = "prod";
            }
        }

        model.addAttribute("path", request.getParameter("path"));
        model.addAttribute("activeProfile", activeProfile);
        return "public/repository/Signup";
    }

    @RequestMapping (value="/public/signup/initial.json"
            , method= RequestMethod.POST
            , consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public Map<String, Object> initial(HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> map = new HashMap<String, Object>();

        map.put("idAuthEnabled", idAuthEnabled);

        result.put("data", map);
        result.put("result", "success");

        return result;
    }

    @RequestMapping(value = {"/public/check-id-duplicate.json"}, method = RequestMethod.POST)
    @ResponseBody
    public Map<String, String> checkIdDuplicate(@RequestBody @Valid DtoCheckIdDuplicate dto) {
        Map<String, String> result = new HashMap<String, String>();
        UserSearch userSearch = modelMapper.map(dto, UserSearch.class);
        if (userService.checkIdDuplicate(userSearch) > 0) {
            result.put("result", "exist");
            result.put("message", "이미 사용중인 아이디입니다. 다른 아이디를 입력해주세요.");
        } else {
            result.put("result", "nonExist");
            result.put("message", "사용가능한 아이디입니다.");
        }
        return result;
    }

    @RequestMapping(value = "/public/signup.json", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> signup(@RequestBody @Valid DtoPublicSignUpRequest dto) {
        User user = modelMapper.map(dto, User.class);
        return userService.insertRoleUserTransactional(user);
    }

    @RequestMapping("/public/findPassword.do")
    public String findPassword(HttpServletRequest request, Model model) {
        model.addAttribute("path", request.getParameter("path"));
        return "public/repository/FindPassword";
    }

    @RequestMapping(value = "/public/findPassword.json", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> findPassword(@RequestBody @Valid DtoFindPasswordRequest dto) {
        Map<String, Object> result = new HashMap<>();
        userService.findPw(
                UserSearch.builder()
                        .userLoginId(dto.getUserLoginId())
                        .build()
        );

        result.put("result", "success");
        return result;
    }
}
