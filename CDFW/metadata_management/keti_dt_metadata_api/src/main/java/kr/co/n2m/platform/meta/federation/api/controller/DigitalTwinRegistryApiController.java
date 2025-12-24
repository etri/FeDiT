package kr.co.n2m.platform.meta.federation.api.controller;


import java.util.LinkedHashMap;
import java.util.Map;

import javax.annotation.Nullable;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.federation.api.domain.ApiDigitalTwinDto;
import kr.co.n2m.platform.meta.federation.api.domain.ApiListParamDto;
import kr.co.n2m.platform.meta.federation.api.domain.ApiPageRes;
import kr.co.n2m.platform.meta.federation.api.domain.ApiRes;
import kr.co.n2m.platform.meta.federation.api.domain.ApiResCode;
import kr.co.n2m.platform.meta.federation.api.service.DigitalTwinRegistryApiService;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 디지털 트윈 연합 - 제7부: 레지스트리 인터페이스 및 프로토콜
 * Digital Twin Federation - Part 7: Interface and Protocol for Registry
 * 문서에 적합하게 만든 API 입니다.
 * </pre>
 * @Date        : 2025. 07. 24.
 */
@Tag(name = "레지스트리 인터페이스", description = "디지털 트윈 연합 레지스트리 관련 API")
@Slf4j
@RestController
public class DigitalTwinRegistryApiController extends ResponseComponent {
	
	@Autowired
	DigitalTwinRegistryApiService apiService;	
	
	/**
	 * 디지털 트윈 인스턴스 등록
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 * @param digitalTwinDto
	 * @return
	 */
	/* 2025-08-22 응답 예시. 변경될 수 있음!!
{
    "responseCode": 2001,
    "responseMsg": "Created",
    "responseData": [
        {
            "dtid": "KR-01-R90199-20250009",
            "etcInfo": [
                {
                    "inputData": [
                        {
                            "key": "test-key-20250820-19283828",
                            "desc": "etcInfo 테스트"
                        }
                    ],
                    "outputData": {
                        "relatedIds": {
                            "sensors": [
                                "fibfK-~ujH9c-3s0Dt-SdXMx7"
                            ],
                            "digitalTwinObjects": [
                                "KR-224000-0005"
                            ]
                        }
                    }
                }
            ]
        }
    ]
}
	 */
	@Operation(summary="디지털 트윈 인스턴스 등록")
	@PostMapping("/digitalTwins")
	public ResponseEntity<Object> createDigitalTwin(@RequestBody ApiDigitalTwinDto digitalTwinDto) {
		try {
			log.debug("POST digitalTwinDto : {}", digitalTwinDto);
			// etcInfo 초기화
			digitalTwinDto.initAndSetEtcInfo(digitalTwinDto.getEtcInfo());
			// 등록
			String dtid = apiService.createDigitalTwin(digitalTwinDto);
			return makeApiResEntity(ApiRes.of(ApiResCode.CREATED, resBody(dtid, digitalTwinDto.getEtcInfo())));
		} catch (ResBaseRuntimeException e) {
			log.error("디지털 트윈 인스턴스 등록 - 실패/오류 : {}", e.getReason());
			return makeApiResEntity(ApiRes.of(e.getApiResCode(), resBody(null, digitalTwinDto.getEtcInfo()), e.getReason()));
		} catch (Exception e) {
			log.error("디지털 트윈 인스턴스 등록 - 실패/오류", e);
			return makeApiResEntity(ApiRes.of(ApiResCode.INTERNAL_SERVER_ERROR, resBody(null, digitalTwinDto.getEtcInfo())));
		}
	}

	/**
	 * 디지털 트윈 인스턴스 목록 조회
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 * @param apiListParamDto
	 * @return
	 */
	@Operation(summary="디지털 트윈 인스턴스 목록 조회")
	@GetMapping("/digitalTwins")	
	public ResponseEntity<Object> getDigitalTwinList(ApiListParamDto apiListParamDto) {
		try {
			log.debug("{}", apiListParamDto);
			SearchResultListVo listVo = apiService.getDigitalTwinList(apiListParamDto);
			return makeApiResEntity(ApiPageRes.of(ApiResCode.SUCCESS, listVo.getList(), listVo.getPage()));
		} catch (ResBaseRuntimeException e) {
			log.error("디지털 트윈 인스턴스 목록 조회 - 실패/오류 : {}", e.getReason());
			return makeApiResEntity(ApiPageRes.of(e.getApiResCode(), null, new PageVo(apiListParamDto)));
		} catch (Exception e) {
			log.error("디지털 트윈 인스턴스 목록 조회 - 실패/오류", e);
			return makeApiResEntity(ApiPageRes.of(ApiResCode.INTERNAL_SERVER_ERROR, null, new PageVo(apiListParamDto)));
		}
	}
	
	/**
	 * 디지털 트윈 인스턴스 조회
	 * @Author      : heenim
	 * @Date        : 2025. 08. 13.
	 * @param apiListParamDto
	 * @param params
	 * @return
	 */
	@Operation(summary = "디지털 트윈 인스턴스 조회"
	    , description = "동적 파라미터 규칙: " +
	    "<br />- dTw_attr_{attrName}={value}            : 디지털 트윈 속성 필터" +
	    "<br /> [ 'dtid' | 'type' | 'name' | 'description' | 'owner' | 'contactPoint' " +
	    "<br /> | 'creator' | 'creationTimeAfter' | 'creationTimeBefore' | 'modifyTimeAfter' " +
	    "<br /> | 'modifyTimeBefore' |'subjects' | 'keywords' | 'location' | 'pointOfAccess', ... ]" +
	    "<br />- dTw_objs_attr={objectsAttributeName}   : 트윈 내 객체 컬렉션 속성명" +
	    "<br /> [ 'location', 'digitalTwinObjects', 'services', 'subscriptions', 'simulations'" +
	    "<br /> , 'sensors', 'controllers', 'visualModels', 'behaviorModels' " +
	    "<br /> , 'relationships', 'validationModels', 'fidelityModels', ... ] " +
	    "<br />- obj_attr_{attrName}={value}            : (해당 객체) 속성 필터" +
	    "<br />고정 파라미터:" +
	    "<br />- curPage : 현재 페이지 (기본 1)" +
	    "<br />- pageListSize : 페이지 리스트 크기 (기본 10)" +	    
	    "<br />- arrayDataLimit  : 배열 데이터 조회 제한 건수 (기본 20)" +	    
	    "<br />- objectRefFormat : none | id | object (기본 none)" +
	    "<br />예) /digitalTwins/search?dTw_attr_owner=JEJU&dTw_attr_type=단일&dtw_objs_attr=sensors&objs_attr_description=온도" +
	    "<br />예) /digitalTwins/search?dTw_attr_dtid={{dtid}}&objectRefFormat=object&arrayDataLimit=10" +
	    "<br />예) /digitalTwins/search?dTw_attr_dtid={{dtid}}&objectRefFormat=id&arrayDataLimit=200" )
	@GetMapping("/digitalTwins/search")	
	public ResponseEntity<Object> searchDigitalTwin(
	        ApiListParamDto apiListParamDto,
	        @RequestParam
	        @Parameter(description = "동적 파라미터",
	        	example = "{\"dTw_attr_dtid\":\"KR-01-A01151-20250001\",\"dTw_objs_attr\":\"services\",\"obj_attr_serviceAccessURL\":\"aaa\"}"
	        )
	        MultiValueMap<String, String> params
		) {
		try {
			log.debug("{}", apiListParamDto);
			log.debug("{}", params);
			SearchResultListVo listVo = apiService.searchDigitalTwinList(apiListParamDto, params);
			return makeApiResEntity(ApiPageRes.of(ApiResCode.SUCCESS, listVo.getList(), listVo.getPage()));
		} catch (ResBaseRuntimeException e) {
			log.error("디지털 트윈 인스턴스 조회 - 실패/오류 : {}", e.getReason());
			return makeApiResEntity(ApiPageRes.of(e.getApiResCode(), null, new PageVo(apiListParamDto)));
		} catch (Exception e) {
			log.error("디지털 트윈 인스턴스 조회 - 실패/오류", e);
			return makeApiResEntity(ApiPageRes.of(ApiResCode.INTERNAL_SERVER_ERROR, null, new PageVo(apiListParamDto)));
		}
	}
	
	/**
	 * 디지털 트윈 인스턴스 수정
	 * @Author      : heenim
	 * @Date        : 2025. 08. 21.
	 * @param dtid
	 * @param digitalTwinDto
	 * @return
	 */
	@Operation(summary="디지털 트윈 인스턴스 수정")
	@PutMapping("/digitalTwins/{dtid}")
	public ResponseEntity<Object> putDigitalTwin(@PathVariable String dtid, @RequestBody ApiDigitalTwinDto digitalTwinDto) {
		try {
			log.debug("PUT dtid : {}, digitalTwinDto : {}", dtid, digitalTwinDto);			
			// etcInfo 초기화
			digitalTwinDto.initAndSetEtcInfo(digitalTwinDto.getEtcInfo());
			// 수정
			digitalTwinDto.setDtid(dtid);
			apiService.putDigitalTwin(digitalTwinDto);
			return makeApiResEntity(ApiRes.of(ApiResCode.CHANGED, resBody(dtid, digitalTwinDto.getEtcInfo())));
		} catch (ResBaseRuntimeException e) {
			log.error("디지털 트윈 인스턴스 수정 - 실패/오류 : {}", e.getReason());
			return makeApiResEntity(ApiRes.of(e.getApiResCode(), resBody(null, digitalTwinDto.getEtcInfo()), e.getReason()));
		} catch (Exception e) {
			log.error("디지털 트윈 인스턴스 수정 - 실패/오류", e);
			return makeApiResEntity(ApiRes.of(ApiResCode.INTERNAL_SERVER_ERROR, resBody(null, digitalTwinDto.getEtcInfo())));
		}
	}
	
	/**
	 * 디지털 트윈 인스턴스 삭제
	 * @Author      : heenim
	 * @Date        : 2025. 08. 19.
	 * @param dtid
	 * @param etcInfo
	 * @return
	 */
	@Operation(summary="디지털 트윈 인스턴스 삭제")
	@DeleteMapping("/digitalTwins/{dtid}")
	public ResponseEntity<Object> deleteDigitalTwin(@PathVariable String dtid, @RequestBody(required = false) Map<String, Object> etcInfo) {
		ApiDigitalTwinDto digitalTwinDto = new ApiDigitalTwinDto();
		try {
			log.debug("DELETE dtid : {}", dtid);
			// etcInfo 초기화
			digitalTwinDto.initAndSetEtcInfo(etcInfo);
			// 삭제
			apiService.deleteDigitalTwin(dtid);
			return makeApiResEntity(ApiRes.of(ApiResCode.DELETED, resBody(dtid, digitalTwinDto.getEtcInfo())));
		} catch (ResBaseRuntimeException e) {
			log.error("디지털 트윈 인스턴스 삭제 - 실패/오류 : {}", e.getReason());
			return makeApiResEntity(ApiRes.of(e.getApiResCode(), resBody(null, digitalTwinDto.getEtcInfo()), e.getReason()));
		} catch (Exception e) {
			log.error("디지털 트윈 인스턴스 삭제 - 실패/오류", e);
			return makeApiResEntity(ApiRes.of(ApiResCode.INTERNAL_SERVER_ERROR, resBody(null, digitalTwinDto.getEtcInfo())));
		}
	}
	
	// TODO 시간 남으면??? 별도로 추가
	//@GetMapping("/digitalTwins/{dtid}/children")
	
	/**
	 * 디지털 트윈 연합 - 제7부: 레지스트리 인터페이스 및 프로토콜 API 용 ResponseBody
	 */
	private Map<String, Object> resBody(@Nullable String dtid, @Nullable Object etcInfo) {
	    Map<String, Object> map = new LinkedHashMap<>();
	    map.put("dtid", dtid); 
	    map.put("etcInfo", etcInfo);
	    return map;
	}
	
	/**
	 * 디지털 트윈 연합 - 제7부: 레지스트리 인터페이스 및 프로토콜 API 용 ResponseEntity
	 */
	public static ResponseEntity<Object> makeApiResEntity(Object apiRes) {
		return makeResponseEntity(apiRes, HttpStatus.OK); // 무조건 HTTP 200 성공(OK)으로 보냄
	}

}
