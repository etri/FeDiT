package iitp.fedit.apiGateway.receiver.service.impl;

import java.util.ArrayList;
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
import iitp.fedit.apiGateway.common.dto.DigitalTwinRequestCtrlCmdInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlCmdExecCodeInfoMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceCmdExecReqRespMapper;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceInfoMapper;
import iitp.fedit.apiGateway.common.mapper.DigitalTwinRequestCtrlCmdInfoMapper;
import iitp.fedit.apiGateway.receiver.service.PTZCommandService;
import iitp.fedit.apiGateway.receiver.service.RoutingKeyService;

@Service
public class PTZCommandServiceImpl implements PTZCommandService {

	@Autowired
	private DigitalTwinRequestCtrlCmdInfoMapper digitalTwinRequestCtrlCmdInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(PTZCommandServiceImpl.class);

//
//
	// 라우팅 키 전체 조회
	public List<HashMap<String, Object>> getReqCtrlCmdList(HashMap<String, Object> map) throws Exception {

		HashMap<String, Object> data = new HashMap<String, Object>();
		List<HashMap<String, Object>> newPtzList = new ArrayList<>();
		List<DigitalTwinRequestCtrlCmdInfo> ptzList = digitalTwinRequestCtrlCmdInfoMapper
				.getDigitalTwinRequestCtrlCmdList(map);

		for (int i = 0; i < ptzList.size(); i++) {
			data.put("respIdentifier", ptzList.get(i).getRespIdentifier());
			data.put("federatedTwinId", ptzList.get(i).getFederatedTwinId());
			data.put("federatedDigitalObjectId", ptzList.get(i).getFederatedDigitalObjectId());
			data.put("digitalTwinId", ptzList.get(i).getDigitalTwinId());
			data.put("digitalObjectId", ptzList.get(i).getDigitalObjectId());
			data.put("reqCtrlCommand", ptzList.get(i).getReqCtrlCommand());
			data.put("reqDate", ptzList.get(i).getReqDate());
			newPtzList.add(data);
		}
		return newPtzList;
	}

	@Transactional
	public int deleteReqCtrlCmd(HashMap<String, Object> map) throws Exception {
		List<DigitalTwinRequestCtrlCmdInfo> ptzList = digitalTwinRequestCtrlCmdInfoMapper
				.getDigitalTwinRequestCtrlCmdList(map);
		ArrayList<Integer> delList = new ArrayList<>();

		if (ptzList == null || ptzList.isEmpty()) {
			throw new Exception("******federatedTwinId or respIdentifier is Undefined******");
		}

		DigitalTwinRequestCtrlCmdInfo ptzInfo = new DigitalTwinRequestCtrlCmdInfo();
		for (int i = 0; i < ptzList.size(); i++) {
			delList.add(ptzList.get(i).getDgtwReqCtrlCmdId());
		}

		ptzInfo.setDgtwReqCtrlCmdIdList(delList);
		return digitalTwinRequestCtrlCmdInfoMapper.deleteDigitalTwinRequestCtrlCmd(ptzInfo);
	}

}
