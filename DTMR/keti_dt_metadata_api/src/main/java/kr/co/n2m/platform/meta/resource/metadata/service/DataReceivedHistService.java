package kr.co.n2m.platform.meta.resource.metadata.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.resource.metadata.domain.IfLogVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.DataReceivedHistMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DataReceivedHistService{

	@Autowired
	private DataReceivedHistMapper dataReceivedHistMapper;
	
	/**
	 * 인터페이스 로그 등록
	 * @Author      : tklee
	 * @Date        : 2024. 03. 21.
	 * @param ifLogVo
	 * @throws Exception
	 */
	@Transactional(transactionManager = "rdbTransactionManager", propagation = Propagation.REQUIRES_NEW)
	public String createIfLog(IfLogVo ifLogVo) {
		try {
			
			// TODO: 추후 로그 메세지 길이 제한이 필요할 수 있음
//			if (StringUtils.isNotEmpty(ifLogVo.getIfLogMsg()) && ifLogVo.getIfLogMsg().length() > 4000) {
//				ifLogVo.setIfLogMsg(ifLogVo.getIfLogMsg().substring(0, 4000));
//			}
			
			ifLogVo.setIfLogId(ValueUtil.generateLogKey(null));
			
			dataReceivedHistMapper.insertIfLog(ifLogVo);
			return ifLogVo.getIfLogId();
		} catch(NullPointerException e) {
			log.debug(ifLogVo.toString(), e);
			return null;
		}
		catch(Exception e) {
			log.debug(ifLogVo.toString(), e);
			return null;
		}
	}
	
	public String createIfLog(String key, String msg, String logType) {
		IfLogVo ifLogVo = new IfLogVo();
		ifLogVo.setIfLogKey(key);
		ifLogVo.setIfLogMsg(msg);
		ifLogVo.setIfLogType(logType);
		return createIfLog(ifLogVo);
	}
	
	/**
	 * 인터페이스 로그 결과 수정
	 * @Author      : tklee
	 * @Date        : 2024. 03. 21.
	 * @param ifLogId
	 * @param result
	 */
	@Transactional(transactionManager = "rdbTransactionManager", propagation = Propagation.REQUIRES_NEW)
	public void modifyIfLogResult(String ifLogId, String result) {
		IfLogVo ifLogVo = new IfLogVo();
		ifLogVo.setIfLogId(ifLogId);
		ifLogVo.setIfLogResult(result);
		dataReceivedHistMapper.updateIfLog(ifLogVo);
	}	
}
