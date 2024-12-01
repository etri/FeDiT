package kr.co.e8ight.ndxpro_gateway.exception;

import java.util.Map;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;

@Component
public class GlobalErrorAttributes extends DefaultErrorAttributes{
	@Override
	public Map<String, Object> getErrorAttributes(ServerRequest request, ErrorAttributeOptions options) {
		Map<String, Object> map = super.getErrorAttributes(request, options);
		
		Throwable throwable = getError(request);
        if (throwable instanceof AuthorizationException) {
        	AuthorizationException ex = (AuthorizationException) getError(request);
            map.put("exception", ex.getClass().getSimpleName());
            map.put("message", ex.getMessage());
            map.put("status", ex.getErrorCode().getStatus().value());
            map.put("errorCode", ex.getErrorCode().getCode());
        }

		return map;
	}

	
}