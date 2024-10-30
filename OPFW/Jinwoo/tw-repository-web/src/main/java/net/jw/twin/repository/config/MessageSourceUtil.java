package net.jw.twin.repository.config;

import lombok.extern.slf4j.Slf4j;
import net.jw.twin.repository.exception.ErrorStatusInterface;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.text.MessageFormat;
import java.util.Arrays;

@Slf4j
@Component
public class MessageSourceUtil {
    public static MessageSource messageSource;

    @Autowired
    private MessageSourceUtil(MessageSource messageSource){
        MessageSourceUtil.messageSource = messageSource;
    }

    // code정보에 해당하는 메시지를 조회합니다.
    public static String getMessage(String code) {
        return getMessage(code, null);
    }
    // code정보, 추가 argument로 현재 locale에 맞는 메시지를 조회합니다.
    public static String getMessage(String code, Object[] args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }
    private static String getMessagePattern(String resourceName) {
        String msgPattern = MessageSourceUtil.getMessage(resourceName + ".msg");
        if(msgPattern.contains(".msg")) {
            return null;
        }
        return msgPattern;
    }

    private static String getMessageFromPattern(String msgPattern, String[] msgArgs) {
        Object[] args = Arrays.stream(msgArgs).map(MessageSourceUtil::getMessage).toArray(Object[]::new);
        return MessageFormat.format(msgPattern, args);
    }

    public static String getMessageFromErrorStatus(ErrorStatusInterface errorStatusInterface) {
        String msg = "none";
        String resourceName = errorStatusInterface.getResourceName();
        String msgPattern = MessageSourceUtil.getMessagePattern(resourceName);
        if(null==msgPattern) {
            log.error("i18n 메시지가 없습니다. {}.msg", resourceName);
        } else {
            msg = MessageSourceUtil.getMessageFromPattern(msgPattern, errorStatusInterface.getArgs());
        }
        return msg;
    }
}
