package kr.udt.storage.service.impl;

import java.util.HashMap;
import java.util.List;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import egovframework.rte.fdl.cmmn.EgovAbstractServiceImpl;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import kr.udt.schedule.service.impl.UdtScheduleMapper;
import kr.udt.storage.service.UdtStorageService;


@Service("udtStorageService")
public class UdtStorageServiceImpl extends EgovAbstractServiceImpl implements UdtStorageService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UdtStorageServiceImpl.class);
	
	@Resource(name="udtStorageMapper")
	private UdtStorageMapper udtStorageMapper;
	
	@Resource(name="udtScheduleMapper")
	private UdtScheduleMapper udtScheduleMapper;

	@Override
	public List<EgovMap> selectDatasetTbList() {
		HashMap<String, Object> param = new HashMap<String, Object>();
		param.put("saveTbNm", ""); // 데이터셋 테이블 전체 검색
		return udtScheduleMapper.selectJobSaveTblNmList(param);
	}

	@Override
	public List<EgovMap> selectStorageTblDataByTbNm(HashMap<String, Object> param) {
		return udtStorageMapper.selectStorageTblDataByTbNm(param);
	}

	@Override
	public EgovMap selectOneJobLinkConfig(HashMap<String, Object> param) {
		return udtScheduleMapper.selectOneJobLinkConfig(param);
	}

	@Override
	public int selectSaveCountBySaveTbNm(HashMap<String, Object> param) {
		return udtStorageMapper.selectSaveCountBySaveTbNm(param);
	}
	
}
