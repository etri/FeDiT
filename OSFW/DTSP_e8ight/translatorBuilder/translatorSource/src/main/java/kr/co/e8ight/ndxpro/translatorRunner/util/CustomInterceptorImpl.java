package kr.co.e8ight.ndxpro.translatorRunner.util;

import kr.co.e8ight.ndxpro.translatorRunner.exception.CustomInterceptorException;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomInterceptorImpl implements Interceptor {

    private static final Logger log = LoggerFactory.getLogger(CustomInterceptorImpl.class);

    private static final int MAX_TRY_COUNT = 3;
    private static final int RETRY_BACKOFF_DELAY = 3000;

    @Override
    public Response intercept(Chain chain) {
        Request request = chain.request();
        Response response = null;

        int tryCount = 1;
        while (tryCount <= MAX_TRY_COUNT) {
            try {
                response = chain.proceed(request);
                break;
            } catch (Exception exception) {
                if (tryCount == MAX_TRY_COUNT) {
                    throw new CustomInterceptorException(exception);
                } else {
                    log.info("tryCount: {}, msg: {}",tryCount, ExceptionUtils.getStackTrace(exception));
                }

                try {
                    Thread.sleep((long) RETRY_BACKOFF_DELAY * tryCount);
                } catch (InterruptedException interruptedException) {
                    throw new CustomInterceptorException(interruptedException);
                }
                tryCount++;
            }
        }
        return response;
    }
}
