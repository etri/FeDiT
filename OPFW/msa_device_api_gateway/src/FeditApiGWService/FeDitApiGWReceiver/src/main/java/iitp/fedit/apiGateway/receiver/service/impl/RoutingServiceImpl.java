package iitp.fedit.apiGateway.receiver.service.impl;

import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.dto.CtrlCmdExecCodeInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceCmdExecReqResp;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlCmdExecCodeInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceCmdExecReqRespMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceInfoMapper;
import iitp.fedit.apiGateway.receiver.service.RoutingKeyService;

@Service
public class RoutingServiceImpl implements RoutingKeyService {

	@Autowired
	private CtrlDeviceInfoMapper ctrlDeviceInfoMapper;

	@Autowired
	private CtrlDeviceCmdExecReqRespMapper ctrlDeviceCmdExecReqRespMapper;

	@Autowired
	private CtrlCmdExecCodeInfoMapper ctrlCmdExecCodeInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(RoutingServiceImpl.class);

	// 라우팅키 등록
	@Transactional
	public int insertRoutingKey(List<CtrlDeviceCmdExecReqResp> ctrlDeviceCmdExecReqRespList) throws Exception {

		HashMap<String, Object> map = new HashMap<>();
		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();

		for (int i = 0; i < ctrlDeviceCmdExecReqRespList.size(); i++) {

			if (ctrlDeviceCmdExecReqRespList.get(i).getExecRequestUrl() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getExecRequestUrl().equals("")) {
				throw new Exception("execRequestUrl null or Empty");
			}

			if (ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier().equals("")) {
				throw new Exception("deviceIdentifier null or Empty");
			}

			if (ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName().equals("")) {
				throw new Exception("ctrlCmdExecCodeName null or Empty");
			}

			map.put("deviceIdentifier", ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier());
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				ctrlDeviceCmdExecReqRespList.get(i).setCtrlDeviceId(ctrlDeviceInfo.getCtrlDeviceId());
			}

			CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();
			map.put("ctrlCmdExecCodeName", ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName());

			ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

			if (ctrlCmdExecCodeInfo == null) {
				throw new Exception("***ctrlCmdExecCodeName undifined***");
			} else {
				ctrlDeviceCmdExecReqRespList.get(i).setCtrlCmdExecCodeId(ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
			}
		}

		map.put("ctrlDeviceCmdExecReqRespList", ctrlDeviceCmdExecReqRespList);
		return ctrlDeviceCmdExecReqRespMapper.insertCtrlDeviceCmdExecReqRespList(map);
	}

	// 라우팅 키 조회
	public CtrlDeviceCmdExecReqResp getRoutingKeyInfo(HashMap<String, Object> map) throws Exception {
		return ctrlDeviceCmdExecReqRespMapper.getCtrlDeviceCmdExecReqResp(map);
	}

	// 라우팅 키 전체 조회
	public List<CtrlDeviceCmdExecReqResp> getRoutingKeyList(HashMap<String, Object> map) throws Exception {

		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();
		CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();

		if (map.get("deviceIdentifier") != null && !map.get("deviceIdentifier").equals("")) {
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				map.put("ctrlDeviceId", ctrlDeviceInfo.getCtrlDeviceId());
			}

			if (map.get("ctrlCmdExecCodeName") != null && !map.get("ctrlCmdExecCodeName").equals("")) {
				ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

				if (ctrlCmdExecCodeInfo == null) {
					throw new Exception("***ctrlCmdExecCodeName undifined***");
				} else {
					map.put("ctrlCmdExecCodeId", ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
				}

			}
		}

		return ctrlDeviceCmdExecReqRespMapper.getCtrlDeviceCmdExecReqRespList(map);
	}

	// 라우팅 키 수정
	@Transactional
	public int updateRoutingKey(List<CtrlDeviceCmdExecReqResp> ctrlDeviceCmdExecReqRespList) throws Exception {

		HashMap<String, Object> map = new HashMap<String, Object>();
		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();

		for (int i = 0; i < ctrlDeviceCmdExecReqRespList.size(); i++) {

			if (ctrlDeviceCmdExecReqRespList.get(i).getExecRequestUrl() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getExecRequestUrl().equals("")) {
				throw new Exception("execRequestUrl null or Empty");
			}

			if (ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier().equals("")) {
				throw new Exception("deviceIdentifier null or Empty");
			}

			if (ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName() == null
					|| ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName().equals("")) {
				throw new Exception("ctrlCmdExecCodeName null or Empty");
			}

			map.put("deviceIdentifier", ctrlDeviceCmdExecReqRespList.get(i).getDeviceIdentifier());
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				ctrlDeviceCmdExecReqRespList.get(i).setCtrlDeviceId(ctrlDeviceInfo.getCtrlDeviceId());
			}

			CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();
			map.put("ctrlCmdExecCodeName", ctrlDeviceCmdExecReqRespList.get(i).getCtrlCmdExecCodeName());

			ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

			if (ctrlCmdExecCodeInfo == null) {
				throw new Exception("***ctrlCmdExecCodeName undifined***");
			} else {
				ctrlDeviceCmdExecReqRespList.get(i).setCtrlCmdExecCodeId(ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
			}
		}

		map.put("ctrlDeviceCmdExecReqRespList", ctrlDeviceCmdExecReqRespList);
		return ctrlDeviceCmdExecReqRespMapper.updateCtrlDeviceCmdExecReqRespList(map);
	}

	@Transactional
	public int deleteRoutingKey(HashMap<String, Object> map) throws Exception {

		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();
		CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();

		if (map.get("deviceIdentifier") != null && !map.get("deviceIdentifier").equals("")) {
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				map.put("ctrlDeviceId", ctrlDeviceInfo.getCtrlDeviceId());
			}

			if (map.get("ctrlCmdExecCodeName") != null && !map.get("ctrlCmdExecCodeName").equals("")) {
				ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

				if (ctrlCmdExecCodeInfo == null) {
					throw new Exception("***ctrlCmdExecCodeName undifined***");
				} else {
					map.put("ctrlCmdExecCodeId", ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
				}

			}
		}

		map.put("execStatus", "N");
		return ctrlDeviceCmdExecReqRespMapper.removeCtrlDeviceCmdExecReqResp(map);
	}

}
