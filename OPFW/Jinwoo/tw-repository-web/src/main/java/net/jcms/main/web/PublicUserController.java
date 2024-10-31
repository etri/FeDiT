package net.jcms.main.web;

import lombok.RequiredArgsConstructor;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dto.DtoUserModifyInfoRequest;
import net.jw.twin.repository.client.dto.DtoUserModifyPwdRequest;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
@Controller
public class PublicUserController extends BaseController {
    private final UserService userService;

    private final PasswordEncoder passwordEncoder;

    private final ModelMapper modelMapper;

    @RequestMapping("/public/user/mypage.mng")
    public String mypage() {
        return "public/repository/MyPage";
    }

    @RequestMapping("/public/user/modifyInfo.mng")
    public String modifyInfo() { return "public/repository/ModifyInfo"; }

    @RequestMapping("/public/user/modifyPwd.mng")
    public String modifyPwd() { return "public/repository/ModifyPwd"; }

    @RequestMapping("/public/user/dataUseRequestList.mng")
    public String dataUseRequestList() { return "public/repository/DataUseRequestList"; }

    @RequestMapping("/public/user/restKeyList.mng")
    public String restKeyList() { return "public/repository/RestKeyList"; }

    @RequestMapping("/public/user/dataRegistList.mng")
    public String dataItemList() { return "public/repository/DataRegistList"; }

    @RequestMapping("/public/user/dataUseRequest.mng")
    public String dataUseRequest() { return "public/repository/DataUseRequest"; }

    @ResponseBody
    @GetMapping(value = "/public/user/getInfo.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getInfo(HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");

        UserSearch userSearch = UserSearch.builder()
                .userId(user.getUserId())
                .build();

        User selectedUser = userService.select(userSearch);

        result.put("data", selectedUser);
        return result;
    }

    @PostMapping(value = "/public/user/modifyInfo.json", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_MODIFY)
    public ResponseEntity<?> modifyInfo(HttpServletRequest request, @RequestBody @Valid DtoUserModifyInfoRequest dto) {

        User user = modelMapper.map(dto, User.class);

        HttpSession session = request.getSession();
        User sessionUser = (User) session.getAttribute("user");
        user.setUserId(sessionUser.getUserId());

        userService.update(user);

        UserSearch userSearch = UserSearch.builder()
                .userId(user.getUserId())
                .build();

        User selectedUser = userService.select(userSearch);

        session.setAttribute ("user", selectedUser);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @ResponseBody
    @PostMapping(value = "/public/user/modifyPwd.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> modifyPwd(HttpServletRequest request, @RequestBody @Valid DtoUserModifyPwdRequest dto) {
        Map<String, Object> result = new HashMap<>();

        try {
            HttpSession session = request.getSession();
            User sessionUser = (User) session.getAttribute("user");

            if (!passwordEncoder.matches(dto.getCurrentPwd(), sessionUser.getUserPwd())) {
                result.put("status", "fail");
                result.put("message", "현재 비밀번호가 올바르지 않습니다.");

                return result;
            }

            userService.update(User.builder()
                    .userId(sessionUser.getUserId())
                    .userPwd(passwordEncoder.encode(dto.getNewPwd()))
                    .build());

            sessionUser.setUserPwd(passwordEncoder.encode(dto.getNewPwd()));
            result.put("status", "success");
        } catch (Exception e) {
            result.put("status", "fail");
            result.put("message", "비밀번호 변경에 실패했습니다.");
        }

        return result;
    }

    @ResponseBody
    @GetMapping("/public/user/reissueRestKey.json")
    public ResponseEntity<?> reissueToken() {
        User user = Optional.ofNullable(getLoggedUser()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "로그인 유저 정보 획득 실패."));

        userService.reissueRestKeyTransactional(user);

        return new ResponseEntity<>(HttpStatus.OK);
    }
}