/*
 * Copyright 2008-2009 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package kr.udt.data.service.impl;

import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import egovframework.rte.fdl.cmmn.EgovAbstractServiceImpl;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import kr.udt.data.service.UdtDataWebService;

/**
 * @Class Name : EgovSampleServiceImpl.java
 * @Description : Sample Business Implement Class
 * @Modification Information
 * @
 * @  수정일      수정자              수정내용
 * @ ---------   ---------   -------------------------------
 * @ 2009.03.16           최초생성
 *
 * @author 개발프레임웍크 실행환경 개발팀
 * @since 2009. 03.16
 * @version 1.0
 * @see
 *
 *  Copyright (C) by MOPAS All right reserved.
 */

@Service("udtDataWebService")
public class UdtDataWebServiceImpl extends EgovAbstractServiceImpl implements UdtDataWebService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UdtDataWebServiceImpl.class);
	
	@Resource(name="udtDataWebMapper")
	private UdtDataWebMapper dao;

	@Override
	public List<EgovMap> selectJobRunHstStatis(Map<String, Object> parameterMap) {
		List<EgovMap> returnList = dao.selectJobRunHstStatis(parameterMap);
		for(EgovMap row: returnList) {
			Long totalYealLinkCnt = (long)row.get("yearLinkSuccessCnt")+(long)row.get("yearLinkFaileCnt");
			row.put("totalYealLinkCnt", totalYealLinkCnt.intValue());
			
			if(totalYealLinkCnt==0) 
				row.put("totalYealLinkPer", "0%");
			else {
				int successCnt = ((Long)row.get("yearLinkSuccessCnt")).intValue();
				int perCent = getPercent((float)successCnt,(float)totalYealLinkCnt);
				row.put("totalYealLinkPer", String.valueOf(perCent)+"%");
			}
		}
		return returnList;
	}
	
	@Override
	public List<EgovMap> selectJobRunHstList(Map<String, Object> parameterMap) {
		return dao.selectJobRunHstList(parameterMap);
	}

	@Override
	public EgovMap selectJobRunHstStatisIndicators(Map<String, Object> parameterMap) {
		return dao.selectJobRunHstStatisIndicators(parameterMap);
	}
	
	@Override
	public List<EgovMap> selectJobMntlyAccumulateData(Map<String, Object> parameterMap) {
		return dao.selectJobMntlyAccumulateData(parameterMap);
	}


	@Override
	public void callRetoreJobRunHstStatis(Map<String, Object> parameterMap) {
		dao.callRetoreJobRunHstStatis(parameterMap);
	}

	private int getPercent(float f1, float f2) {
		return Math.round(f1/f2*100);
	}

	@Override
	public List<EgovMap> selectJobRunHstDetailByExecId(Map<String, Object> parameterMap) {
		return dao.selectJobRunHstDetailByExecId(parameterMap);
	}

}
