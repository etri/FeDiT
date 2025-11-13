package kr.co.n2m.platform.common.logger;

import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.json.simple.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Aspect
@Component
public class RequestLoggerAspect {

	@Pointcut("execution(* kr.co.n2m.platform..*Controller.*(..))")
	public void dataPointCut() {
	}

	@Around("dataPointCut()")
	public Object methodLogger(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
		try {
			Object result = proceedingJoinPoint.proceed();
			HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest(); // request 정보를 가져온다.

			String controllerName = proceedingJoinPoint.getSignature().getDeclaringType().getSimpleName();
			String methodName = proceedingJoinPoint.getSignature().getName();

			Map<String, Object> params = new HashMap<>();

			try {
				params.put("controller" , controllerName);
				params.put("method"     , methodName);
				params.put("params"     , getParams(request));
				params.put("log_time"   , new Date());
				params.put("request_uri", request.getRequestURI());
				params.put("http_method", request.getMethod());
			} catch (Exception ex) {
				log.error("LoggerAspect error : {}", ex);
			}
			log.debug("params : {}", params);
			return result;
		} catch (Throwable throwable) {
			throw throwable;
		}
	}

	@SuppressWarnings("unchecked")
	private static JSONObject getParams(HttpServletRequest request) {
		JSONObject jsonObject = new JSONObject();

		String param = null;
		String replaceParam = null;

		Enumeration<String> params = request.getParameterNames();
		while (params.hasMoreElements()) {
			param = params.nextElement();
			replaceParam = param.replaceAll("\\.", "-");
			jsonObject.put(replaceParam, request.getParameter(param));
		}

		return jsonObject;
	}
}
