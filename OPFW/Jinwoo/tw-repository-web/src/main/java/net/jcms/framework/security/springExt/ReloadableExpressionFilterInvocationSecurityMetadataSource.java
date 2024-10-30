package net.jcms.framework.security.springExt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.expression.SecurityExpressionHandler;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.expression.ExpressionBasedFilterInvocationSecurityMetadataSource;
import org.springframework.security.web.access.intercept.DefaultFilterInvocationSecurityMetadataSource;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.*;


@Slf4j
public class ReloadableExpressionFilterInvocationSecurityMetadataSource extends
        DefaultFilterInvocationSecurityMetadataSource {

    private ExpressionBasedFilterInvocationSecurityMetadataSource realSource;

    final SecurityExpressionHandler<FilterInvocation> expressionHandler;

    private final LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>> requestMap;

    private SecuredObjectService securedObjectService;

    public ReloadableExpressionFilterInvocationSecurityMetadataSource(LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>> requestMap,
                                                                      SecurityExpressionHandler<FilterInvocation> expressionHandler){
        super(null);
        this.requestMap = requestMap;
        this.expressionHandler = expressionHandler;
    }

    public void setSecuredObjectService(SecuredObjectService securedObjectService) {
        this.securedObjectService = securedObjectService;
    }


    private void createRealSource() {
        realSource = new ExpressionBasedFilterInvocationSecurityMetadataSource(this.requestMap, this.expressionHandler);
    }

    @Override
    public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
        if( null == realSource ){
            try {
                reload();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return realSource.getAttributes(object);
    }

    @Override
    public Collection<ConfigAttribute> getAllConfigAttributes() {
        if( null == realSource ){
            try {
                reload();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return realSource.getAllConfigAttributes();
    }

    public void reload() throws Exception {
        LinkedHashMap<RequestMatcher, List<ConfigAttribute>> reloadedMap = securedObjectService.getRolesAndUrl();

        Iterator<Map.Entry<RequestMatcher, List<ConfigAttribute>>> iterator = reloadedMap.entrySet().iterator();

        // 이전 데이터 삭제
        requestMap.clear();

        while (iterator.hasNext()) {
            Map.Entry<RequestMatcher, List<ConfigAttribute>> entry = iterator.next();

            requestMap.put(entry.getKey(), entry.getValue());
        }

        if (log.isInfoEnabled()) {
            log.info("Secured Url Resources - Role Mappings reloaded at Runtime!");
        }

        createRealSource();
    }
}