package net.jw.twin.tw_service_manager.aop;

import lombok.extern.slf4j.Slf4j;
import net.jw.twin.common.config.ErrorStatusCommon;
import net.jw.twin.common.exception.CustomException;
import net.jw.twin.tw_service_manager.annotation.HandleRuntimeException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class RuntimeExceptionAspect {
    @Around("@annotation(net.jw.twin.tw_service_manager.annotation.HandleRuntimeException)")
    public Object handleException(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            return joinPoint.proceed();
        } catch (RuntimeException ex) {
            if(ex instanceof CustomException) {
//                System.err.println("instanceof CustomException");
                throw ex;
            }

            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            HandleRuntimeException annotation = signature.getMethod().getAnnotation(HandleRuntimeException.class);
            String msg = "annotationMsg: " + annotation.value() + ", exceptionMsg: " + ex.getMessage();

            log.error("RuntimeExceptionAspect.handleException : {}", msg);

            throw new CustomException(ErrorStatusCommon.UNCAUGHT, ex, msg);
        }
    }
}
