package kr.co.n2m.platform.meta.collection.controller;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.collection.domain.CollectionInputDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionLogVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionResultDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionSearchVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkVo;
import kr.co.n2m.platform.meta.collection.service.CollectionLogService;
import kr.co.n2m.platform.meta.collection.service.CollectionMainService;
import kr.co.n2m.platform.meta.collection.service.CollectionWorkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "메타데이터 수집", description = "메타데이터 수집 API")
@RestController
@RequiredArgsConstructor
public class CollectionController extends ResponseComponent {

	private final CollectionLogService collectionLogService;

	private final CollectionWorkService collectionWorkService;
	
	private final CollectionMainService collectionMainService;
	
	@Autowired
	private Executor collectExecutor;

	@Operation(summary="메타데이터 수집. 매핑 정보로 원본 데이터를 디지털트윈 메타데이터로 변환하여 등록 및 활성화.")
	@PostMapping("/api/v1/collection/data")
	public ResponseEntity<Object> collectAndCreateMetadataSet(@RequestBody CollectionInputDto collectionInputDto) {
		log.debug("{}", collectionInputDto);
		
		// 1. 로그는 무조건 등록
		CollectionLogVo logVo = new CollectionLogVo();
		logVo.setColecLogData(collectionInputDto.toString());
		String colecLogId = collectionLogService.createLog(logVo);
		log.debug("colecLogId: {}", colecLogId);
		
		// 2. 유효성 체크 (Exception 발생)
		collectionMainService.validate(colecLogId, collectionInputDto);
		
		// 3. 최소 유효성 체크 후 작업 등록
		CollectionWorkVo workVo = new CollectionWorkVo();
		workVo.setColecLogId(colecLogId);
		String colecWrkId = collectionWorkService.createWork(workVo);
		log.debug("colecWrkId: {}", colecWrkId);
		
		// 4. 수집 실행 비동기 처리
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		CompletableFuture.runAsync(() -> {
			try {
				collectionMainService.collectAndCreateMetadataSet(workVo, collectionInputDto, loginUserVo);
				
				// 수집 작업 수정.
				workVo.setColecWrkSttusMtcd("succ");
				collectionWorkService.modifyWork(workVo);
			
			} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
				// 수집 작업 수정.
				workVo.setColecWrkSttusMtcd("fail");
				workVo.setColecWrkMsg(e.getReason());
				collectionWorkService.modifyWork(workVo);
				
			} catch (Exception e) {
				// 수집 작업 수정.
				workVo.setColecWrkSttusMtcd("fail");
				workVo.setColecWrkMsg(e.getMessage());
				collectionWorkService.modifyWork(workVo);
				
			}
		}, collectExecutor);
		
		// 결과는 비동기 처리이므로 작업 ID로 조회하도록 한다. 따라서 작업 ID 반환.
		return makeResponseEntity(new ResultIdVo(colecWrkId));
	}
	
	@Operation(summary="메타데이터 수집 결과 조회")
	@GetMapping("/api/v1/collection/data/{colecWrkId}")
	public ResponseEntity<Object> getCollectResult(@PathVariable String colecWrkId) {
		CollectionWorkDto workDto = collectionWorkService.getWork(colecWrkId);
		return makeResponseEntity(new CollectionResultDto(workDto));
	}

	@Operation(summary="메타데이터 수집 로그 목록 조회")
	@GetMapping("/api/v1/collection/logs")
	public ResponseEntity<Object> getLogList(CollectionSearchVo searchVo) {
		return makeResponseEntity(collectionLogService.getLogList(searchVo));
	}

	@Operation(summary="메타데이터 수집 로그 상세 조회")
	@GetMapping("/api/v1/collection/logs/{colecLogId}")
	public ResponseEntity<Object> getLog(@PathVariable String colecLogId) {
		return makeResponseEntity(collectionLogService.getLog(colecLogId));
	}

//	@Operation(summary="메타데이터 수집 로그 등록")
//	@PostMapping("/api/v1/collection/logs")
//	public ResponseEntity<Object> createLog(@RequestBody CollectionLogVo logVo) {
//		return makeResponseEntity(collectionLogService.createLog(logVo));
//	}

	@Operation(summary="메타데이터 수집 작업 목록 조회")
	@GetMapping("/api/v1/collection/works")
	public ResponseEntity<Object> getWorkList(CollectionSearchVo searchVo) {
		return makeResponseEntity(collectionWorkService.getWorkList(searchVo));
	}

	@Operation(summary="메타데이터 수집 작업 상세 조회")
	@GetMapping("/api/v1/collection/works/{colecWrkId}")
	public ResponseEntity<Object> getWork(@PathVariable String colecWrkId) {
		return makeResponseEntity(collectionWorkService.getWork(colecWrkId));
	}

//	@Operation(summary="메타데이터 수집 작업 등록")
//	@PostMapping("/api/v1/collection/works")
//	public ResponseEntity<Object> createWork(@RequestBody CollectionWorkVo workVo) {
//		return makeResponseEntity(collectionWorkService.createWork(workVo));
//	}

//	@Operation(summary="메타데이터 수집 작업 수정")
//	@PutMapping("/api/v1/collection/works/{colecWrkId}")
//	public ResponseEntity<Object> updateWork(@PathVariable String colecWrkId, @RequestBody CollectionWorkVo workVo) {
//		collectionWorkService.modifyWork(workVo);
//		return makeResponseEntity(new ResultIdVo(workVo.getColecWrkId()));
//	}
}