package iitp.fedit.apiGateway.receiver.service.impl;

import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.dto.CtrlCmdExecCodeInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceRoutingServiceInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlCmdExecCodeInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceRoutingServiceInfoMapper;
import iitp.fedit.apiGateway.receiver.service.DeviceRoutingKeyService;

@Service
public class DeviceRoutingServiceImpl implements DeviceRoutingKeyService {

	@Autowired
	private CtrlDeviceInfoMapper ctrlDeviceInfoMapper;

	@Autowired
	private CtrlDeviceRoutingServiceInfoMapper ctrlDeviceRoutingServiceInfoMapper;

	@Autowired
	private CtrlCmdExecCodeInfoMapper ctrlCmdExecCodeInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(DeviceRoutingServiceImpl.class);

	// 라우팅키 등록
	@Transactional
	public int insertDeviceRoutingKey(List<CtrlDeviceRoutingServiceInfo> ctrlDeviceRoutingServiceList)
			throws Exception {

		HashMap<String, Object> map = new HashMap<>();
		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();

		for (int i = 0; i < ctrlDeviceRoutingServiceList.size(); i++) {

			if (ctrlDeviceRoutingServiceList.get(i).getRequestRouting() == null
					|| ctrlDeviceRoutingServiceList.get(i).getRequestRouting().equals("")) {
				throw new Exception("execRequestUrl null or Empty");
			}

			if (ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier() == null
					|| ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier().equals("")) {
				throw new Exception("deviceIdentifier null or Empty");
			}

			if (ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName() == null
					|| ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName().equals("")) {
				throw new Exception("ctrlCmdExecCodeName null or Empty");
			}

			map.put("deviceIdentifier", ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier());
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				ctrlDeviceRoutingServiceList.get(i).setCtrlDeviceId(ctrlDeviceInfo.getCtrlDeviceId());
			}

			CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();
			map.put("ctrlCmdExecCodeName", ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName());

			ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

			if (ctrlCmdExecCodeInfo == null) {
				throw new Exception("***ctrlCmdExecCodeName undifined***");
			} else {
				ctrlDeviceRoutingServiceList.get(i).setCtrlCmdExecCodeId(ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
			}

		}

		map.put("devRtServiceList", ctrlDeviceRoutingServiceList);

		return ctrlDeviceRoutingServiceInfoMapper.insertCtrlDeviceRoutingServiceList(map);
	}

	// 라우팅 키 조회
	public CtrlDeviceRoutingServiceInfo getDeviceRoutingKeyInfo(HashMap<String, Object> map) throws Exception {
		return ctrlDeviceRoutingServiceInfoMapper.getCtrlDeviceRoutingServiceInfo(map);
	}

	// 라우팅 키 전체 조회
	public List<CtrlDeviceRoutingServiceInfo> getDeviceRoutingKeyList(HashMap<String, Object> map) throws Exception {

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

		return ctrlDeviceRoutingServiceInfoMapper.getCtrlDeviceRoutingServiceInfoList(map);
	}

	// 라우팅 키 수정
	@Transactional
	public int updateDeviceRoutingKey(List<CtrlDeviceRoutingServiceInfo> ctrlDeviceRoutingServiceList)
			throws Exception {

		HashMap<String, Object> map = new HashMap<String, Object>();
		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();

		for (int i = 0; i < ctrlDeviceRoutingServiceList.size(); i++) {

			if (ctrlDeviceRoutingServiceList.get(i).getRequestRouting() == null
					|| ctrlDeviceRoutingServiceList.get(i).getRequestRouting().equals("")) {
				throw new Exception("execRequestUrl null or Empty");
			}

			if (ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier() == null
					|| ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier().equals("")) {
				throw new Exception("deviceIdentifier null or Empty");
			}

			if (ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName() == null
					|| ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName().equals("")) {
				throw new Exception("ctrlCmdExecCodeName null or Empty");
			}

			map.put("deviceIdentifier", ctrlDeviceRoutingServiceList.get(i).getDeviceIdentifier());
			ctrlDeviceInfo = ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);

			if (ctrlDeviceInfo == null) {
				throw new Exception("***deviceIdentifier undifined***");
			} else {
				ctrlDeviceRoutingServiceList.get(i).setCtrlDeviceId(ctrlDeviceInfo.getCtrlDeviceId());
			}

			CtrlCmdExecCodeInfo ctrlCmdExecCodeInfo = new CtrlCmdExecCodeInfo();
			map.put("ctrlCmdExecCodeName", ctrlDeviceRoutingServiceList.get(i).getCtrlCmdExecCodeName());

			ctrlCmdExecCodeInfo = ctrlCmdExecCodeInfoMapper.getCtrlCmdExecCodeInfo(map);

			if (ctrlCmdExecCodeInfo == null) {
				throw new Exception("***ctrlCmdExecCodeName undifined***");
			} else {
				ctrlDeviceRoutingServiceList.get(i).setCtrlCmdExecCodeId(ctrlCmdExecCodeInfo.getCtrlCmdExecCodeId());
			}
		}

		map.put("devRtServiceList", ctrlDeviceRoutingServiceList);
		return ctrlDeviceRoutingServiceInfoMapper.updateCtrlDeviceRoutingServiceList(map);
	}

	@Transactional
	public int deleteDeviceRoutingKey(HashMap<String, Object> map) throws Exception {

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

		map.put("routingStatus", "N");
		return ctrlDeviceRoutingServiceInfoMapper.removeCtrlDeviceRoutingServiceInfo(map);
	}

}
