package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.filter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//@Component
public class MultiReadFilter implements Filter {
	 
	private final Logger logger = LoggerFactory.getLogger(MultiReadFilter.class);
	
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

    	MultiReadHttpServletRequest multiReadRequest = new MultiReadHttpServletRequest((HttpServletRequest) request);
    	
    	logger.info("====================doFilter====================");
    	logger.info("================= " + request.getParameter("requestIdtifier") + " ====================");
    	
        chain.doFilter(multiReadRequest, response);
    }
}