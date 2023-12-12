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
package kr.udt.user.service;

import java.util.List;
import java.util.Map;

import egovframework.rte.psl.dataaccess.util.EgovMap;

public interface UdtUserManageService {
	
	public List<EgovMap> selectUdtWebUserList(Map<String,Object> parameterMap);
	
	public int doUserIdCheck(String userId);
	
	public int insertUdtWebUser(Map<String,Object> parameterMap);
	
	public EgovMap selectOneUdtWebUser(Map<String,Object> parameterMap);

	public int updateUdtWebUser(Map<String,Object> parameterMap);
}
