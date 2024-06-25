package kr.co.n2m.platform.meta.portal.mypage.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.apicatalog.jsonld.StringUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResUnauthorizedException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcMySearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSettingVo;
import kr.co.n2m.platform.meta.portal.notifc.service.NotifcService;
import kr.co.n2m.platform.meta.portal.pat.domain.PatSearchVo;
import kr.co.n2m.platform.meta.portal.pat.service.PatService;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "마이페이지", description = "마이페이지 API")
@Slf4j
@RestController
public class MyPageController extends ResponseComponent {
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	PatService patService;
	
	@Autowired	
	NotifcService notifcService;

	@Operation(summary="내 디지털트윈 목록")
	@GetMapping("/api/v1/portal/mypage/dts")
	public ResponseEntity<Object> getMyMetadataSetList(MetadataSearchVo metadataSearchVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		metadataSearchVo.setMedataSetRegrId(loginUserId);
		
		return makeResponseEntity(metadataSetService.getMetadataSetList(metadataSearchVo));
	}
	
	@Operation(summary="내 PAT 목록")
	@GetMapping("/api/v1/portal/mypage/pats")
	public ResponseEntity<Object> getPatList(PatSearchVo patSearchVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		patSearchVo.setPatkRegrId(loginUserId);
		
		return makeResponseEntity(patService.getPatList(patSearchVo));
	}
	
	@Operation(summary="내 알림 목록")
	@GetMapping("/api/v1/portal/mypage/notifcs")
	public ResponseEntity<Object> getMyNotifcList(NotifcMySearchVo notifcMySearchVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		notifcMySearchVo.setLoginUserId(loginUserId);
		
		return makeResponseEntity(notifcService.getMyNotifcList(notifcMySearchVo));
	}
	
	@Operation(summary="내 확인된 알림 목록")
	@GetMapping("/api/v1/portal/mypage/confirmednotifcs")
	public ResponseEntity<Object> getMyNotifcConfirmedList(NotifcMySearchVo notifcMySearchVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		notifcMySearchVo.setLoginUserId(loginUserId);
		
		return makeResponseEntity(notifcService.getMyNotifcConfirmedList(notifcMySearchVo));
	}
	
	@Operation(summary="내 알림 확인")
	@PutMapping("/api/v1/portal/mypage/confirmednotifcs")
	public ResponseEntity<Object> saveMyConfirmedNotifc(@RequestBody List<String> notifcIdList) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		notifcService.saveMyConfirmedNotifc(notifcIdList);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}
	
	@Operation(summary="내 알림 설정 목록")
	@GetMapping("/api/v1/portal/mypage/notifcsettings")
	public ResponseEntity<Object> getMyNotifcSettingList(NotifcMySearchVo notifcMySearchVo) {
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		if (loginUserVo == null) throw new ResUnauthorizedException();
		notifcMySearchVo.setLoginUserId(loginUserVo.getUserId());
		notifcMySearchVo.setMyAuthList(loginUserVo.getRoleList());
		
		return makeResponseEntity(notifcService.getMyNotifcSettingList(notifcMySearchVo));
	}
	
	@Operation(summary="내 알림 설정 등록")
	@PostMapping("/api/v1/portal/mypage/notifcsettings")
	public ResponseEntity<Object> createMyNotifcSetting(@RequestBody NotifcSettingVo notifcSettingVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		notifcSettingVo.setUserId(loginUserId);		
		String newId = notifcService.createNotifcSetting(notifcSettingVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED);
	}

	@Operation(summary="내 알림 설정 수정")
	@PutMapping("/api/v1/portal/mypage/notifcsettings/{notifcSetupId}")
	public ResponseEntity<Object> modifyMyNotifcSetting(@PathVariable String notifcSetupId, @RequestBody NotifcSettingVo notifcSettingVo) {
		String loginUserId = AuthUtil.getLoginUserId();
		if (StringUtils.isBlank(loginUserId)) throw new ResUnauthorizedException();
		if (StringUtils.isNotBlank(notifcSettingVo.getNotifcSetupId())) {
			compareUniqueId(notifcSetupId, notifcSettingVo.getNotifcSetupId());
		}
		notifcSettingVo.setNotifcSetupId(notifcSetupId);
		notifcSettingVo.setUserId(loginUserId);
		notifcService.modifyNotifcSetting(notifcSettingVo);
		return makeResponseEntity(new ResultIdVo(notifcSetupId));
	}
	
}
