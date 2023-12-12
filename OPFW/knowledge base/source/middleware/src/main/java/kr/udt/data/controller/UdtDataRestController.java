package kr.udt.data.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.udt.data.service.UdtSchedulerService;
import kr.udt.data.svo.UdtApiReturnSVO;

/**
 * @설명 : REST API 컨트롤러 
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2021. 11. 03.
 * @API 목록
 * 	1) /contorllJob/.. : 스케줄 관리 
 *  2) /
 * 
 */
@RestController
public class UdtDataRestController {
	@Autowired
	private UdtSchedulerService schedulService;
	
	@RequestMapping("/controllJob/pause/{jobNm}")
    public UdtApiReturnSVO doPause(@PathVariable String jobNm,HttpServletRequest request, HttpServletResponse response) {
		
		Map<String,Object> resultMap = new HashMap<String,Object>();
		
		try {
			boolean result = schedulService.pause(jobNm);
			String resultCode =(result)?"200":"500";
			String resultStatus =(result)?"SUCCESS":"FAILED";
			String resultMsg =(result)?"["+jobNm+"] 잡 정지에 성공 하였습니다.":"["+jobNm+"] 잡 정지에 실패 하였습니다. jobNm을 확인해주세요";
			
			return UdtApiReturnSVO.builder().resultStatus(resultStatus).resultMsg(resultMsg).resultStatusCode(resultCode).resultMap(resultMap).build();
		}catch(Exception e){
			String eStactTrace = ExceptionUtils.getStackTrace(e);
			return UdtApiReturnSVO.builder().resultStatus("FAILED").resultMsg("서버측 에러가 발생하였습니다.").resultStatusCode("500").errorContent(eStactTrace).resultMap(resultMap).build();
		}
		
    }
	@RequestMapping("/controllJob/restart/{jobNm}")
    public UdtApiReturnSVO doRestart(@PathVariable String jobNm,HttpServletRequest request, HttpServletResponse response) {
		
		Map<String,Object> resultMap = new HashMap<String,Object>();
		
		try {
			boolean result = schedulService.restart(jobNm);
			String resultCode =(result)?"200":"500";
			String resultStatus =(result)?"SUCCESS":"FAILED";
			String resultMsg =(result)?"["+jobNm+"] 잡 재시작에 성공 하였습니다.":"["+jobNm+"] 잡 재시작에 실패 하였습니다. jobNm을 확인해주세요";
			
			return UdtApiReturnSVO.builder().resultStatus(resultStatus).resultMsg(resultMsg).resultStatusCode(resultCode).resultMap(resultMap).build();
		}catch(Exception e){
			String eStactTrace = ExceptionUtils.getStackTrace(e);
			return UdtApiReturnSVO.builder().resultStatus("FAILED").resultMsg("서버측 에러가 발생하였습니다.").resultStatusCode("500").errorContent(eStactTrace).resultMap(resultMap).build();
		}
    }
	
	@RequestMapping("/controllJob/immediateExexcute/{jobNm}")
    public UdtApiReturnSVO doImmediateExexcute(@PathVariable String jobNm,HttpServletRequest request, HttpServletResponse response) {
		
		Map<String,Object> resultMap = new HashMap<String,Object>();
		
		try {
			boolean result = schedulService.immediateExexcute(jobNm);
			String resultCode =(result)?"200":"500";
			String resultStatus =(result)?"SUCCESS":"FAILED";
			String resultMsg =(result)?"["+jobNm+"] 잡 즉시시작(1회)에 성공 하였습니다.":"["+jobNm+"] 잡 즉시시작(1회)에 실패 하였습니다. jobNm을 확인해주세요";
			
			return UdtApiReturnSVO.builder().resultStatus(resultStatus).resultMsg(resultMsg).resultStatusCode(resultCode).resultMap(resultMap).build();
		}catch(Exception e){
			String eStactTrace = ExceptionUtils.getStackTrace(e);
			return UdtApiReturnSVO.builder().resultStatus("FAILED").resultMsg("서버측 에러가 발생하였습니다.").resultStatusCode("500").errorContent(eStactTrace).resultMap(resultMap).build();
		}
    }
	@RequestMapping("/controllJob/delete/{jobNm}")
    public UdtApiReturnSVO doDelete(@PathVariable String jobNm,HttpServletRequest request, HttpServletResponse response) {
		
		Map<String,Object> resultMap = new HashMap<String,Object>();
		
		try {
			schedulService.delete(jobNm);
			return UdtApiReturnSVO.builder().resultStatus("SUCCESS").resultStatusCode("200").resultMap(resultMap).build();
		}catch(Exception e){
			String eStactTrace = ExceptionUtils.getStackTrace(e);
			return UdtApiReturnSVO.builder().resultStatus("FAILED").resultStatusCode("500").errorContent(eStactTrace).resultMap(resultMap).build();
		}
    }
	@RequestMapping("/controllJob/update/{jobNm}")
    public UdtApiReturnSVO doUpdate(@PathVariable String jobNm,HttpServletRequest request, HttpServletResponse response) {
		
		Map<String,Object> resultMap = new HashMap<String,Object>();
		
		try {
			boolean result = schedulService.update(jobNm);
			String resultCode =(result)?"200":"500";
			String resultStatus =(result)?"SUCCESS":"FAILED";
			String resultMsg =(result)?"["+jobNm+"] 잡 크론주기 변경에 성공 하였습니다.":"["+jobNm+"] 잡 크론주기 변경에 실패 하였습니다. jobNm을 확인해주세요";
			
			return UdtApiReturnSVO.builder().resultStatus(resultStatus).resultMsg(resultMsg).resultStatusCode(resultCode).resultMap(resultMap).build();
		}catch(Exception e){
			String eStactTrace = ExceptionUtils.getStackTrace(e);
			return UdtApiReturnSVO.builder().resultStatus("FAILED").resultMsg("서버측 에러가 발생하였습니다.").resultStatusCode("500").errorContent(eStactTrace).resultMap(resultMap).build();
		}
    }
	
	
	
}
