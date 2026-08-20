package kr.co.e8ight.ndxpro.agentManager.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
@ConditionalOnExpression("${aspect.enabled:true}")
public class ExecutionTimeAdvice {

    @Around("@annotation(kr.co.e8ight.ndxpro.agentManager.config.TrackExecutionTime)")
    public Object executionTime(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();
        Object object = point.proceed();
        long endtime = System.currentTimeMillis();
        log.debug("Class Name: "+ point.getSignature().getDeclaringTypeName() +
                ". Method Name: "+ point.getSignature().getName() +
                ". Time taken for Execution is : " + (endtime-startTime) +"ms");
        return object;
    }
}
