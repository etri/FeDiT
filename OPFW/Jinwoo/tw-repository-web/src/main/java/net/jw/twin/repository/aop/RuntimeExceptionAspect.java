package net.jw.twin.repository.aop;

import lombok.extern.slf4j.Slf4j;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class RuntimeExceptionAspect {
    @Around("@annotation(net.jw.twin.repository.annotation.HandleRuntimeException)")
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
            ErrorStatus errorStatus = annotation.value();

            log.error("RuntimeExceptionAspect.handleException : {}", ex.getMessage());

            throw new CustomException(errorStatus, ex, ex.getMessage());
        }
    }
}
