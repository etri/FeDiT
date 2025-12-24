package kr.co.n2m.platform.admin.feature.auth.controller;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.auth.entity.Auth;
import kr.co.n2m.platform.admin.feature.auth.service.AuthService;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.AuthorizationProperty;
import kr.co.n2m.platform.common.property.OauthProperty;
import kr.co.n2m.platform.common.utils.CacheServiceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.PublicKey;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@Api(tags = "나의 권한 관리")
@ApiResponses(value = {@ApiResponse(code = 404, message = "Not Found"),
        @ApiResponse(code = 500, message = "Internal Server Error")})
@RequiredArgsConstructor
public class MyAuthController {

    private final AuthService authService;

    private final AuthorizationProperty authProperty;

    private final CacheServiceUtil cache;

    private final OauthProperty property;


    private  Claims parseClaimsJws(String authToken) throws Exception {
        String[] jwtDataArr = authToken.split(" ");
        String jwtData = jwtDataArr[1];
        PublicKey publicKey = cache.getPublicKey(property.getPublicKey());
        Claims claim = null;
        try {
            claim = Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(jwtData).getBody();
        } catch(JwtException e) {
            throw e;
        }
        return claim;
    }

    private String getUserId(String authToken){
        String userId = null;
        try {
            Claims claim = parseClaimsJws(authToken);
            if(claim != null){
                userId = claim.get(Constants.SESSION_ATTR_USER_ID).toString();
            }
        }catch (Exception e){
            log.error(e.getMessage());
        }
        return userId;
    }

    /** 나의 권한 목록 조회 */
    @ApiOperation(value = "나의 권한 목록 조회", notes = "<strong>나의 권한 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
    @GetMapping(value = "/myauthlist")
    public ResponseEntity<List<Auth>> getMyAuthList(
            @RequestParam(name = "pltfrmId", required = false) String pltfrmId,
            @RequestHeader(Constants.AUTHTOKEN_HEADER) String authToken) {
        List<Auth> authList = authService.getAuthListByPltfrmIdAndUserId(pltfrmId, getUserId(authToken));
        return new ResponseEntity<>(authList, HttpStatus.OK);
    }


    /** 나의 권한 조회 */
    @ApiOperation(value = "나의 권한 조회", notes = "<strong>나의 권한을 조회합니다.</strong>")
    @ApiResponses({ @ApiResponse(code = 200, message = "OK") })
    @GetMapping(value = "/myauthrization")
    public ResponseEntity<Map<String, Object>> getMyAuth(
            @RequestParam Map<String, String>  params,
        @RequestHeader(Constants.AUTHTOKEN_HEADER) String authToken) {
        boolean checkAuth = false;

        if(params.get("url") == null || params.get("method") == null){
            throw new RuntimeException("url과 method는 필수로 입력하셔야합니다.");
        }
        try {
            params.put("userId", getUserId(authToken));
            params.put("url", params.get("url"));
            params.put("method", params.get("method"));
            List<String> defaultAutOidList = new ArrayList<>();
            if (Boolean.parseBoolean(authProperty.getDefaultAuthUseFlag())) {
                authProperty.getDefaultAuthList().forEach(str -> defaultAutOidList.add(str));
            }
            checkAuth = authService.getAuthorizationData(params, defaultAutOidList);

        } catch (Exception e) {
            log.error(e.getMessage());
            checkAuth = false;
        }
        Map<String, Object> res = new HashMap<>();
        res.put("authorization", checkAuth);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

}