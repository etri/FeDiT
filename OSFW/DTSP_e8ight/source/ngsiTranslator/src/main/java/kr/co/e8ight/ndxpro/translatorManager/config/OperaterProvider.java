package kr.co.e8ight.ndxpro.translatorManager.config;

import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorOperation;
import kr.co.e8ight.ndxpro.translatorManager.domain.Operater;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class OperaterProvider {

    Logger log = LoggerFactory.getLogger(OperaterProvider.class);

    private Map<TranslatorOperation, Operater> operaterMap = new HashMap<>();

    @Autowired
    public OperaterProvider(ApplicationContext applicationContext) {
        for (TranslatorOperation operation : TranslatorOperation.values()) {
            log.debug(operation.name() + "Operation set Operater : " + operation.getOperaterName());
            operaterMap.put(operation, (Operater) applicationContext.getBean(operation.getOperaterName()));
        }
    }

    public Operater getOperater(TranslatorOperation operation) {
        return this.operaterMap.get(operation);
    }
}
