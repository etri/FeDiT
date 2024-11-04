package iitp.fedit.apiGateway.receiver.service.impl;

import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.fedit.apiGateway.common.config.MSAConfigurationProperties;
import iitp.fedit.apiGateway.common.dto.CtrlDeviceInfo;
import iitp.fedit.apiGateway.common.mapper.CtrlDeviceInfoMapper;
import iitp.fedit.apiGateway.receiver.component.RabbitMQComponent;
import iitp.fedit.apiGateway.receiver.service.DeviceService;

@Service
public class DeviceServiceImpl implements DeviceService {

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	RabbitMQComponent rabbitMQComponent;

	@Autowired
	private CtrlDeviceInfoMapper ctrlDeviceInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(DeviceServiceImpl.class);

	@Transactional
	public int createDevice(List<CtrlDeviceInfo> ctrlDeviceList) throws Exception {

		HashMap<String, Object> map = new HashMap<>();
		for (int i = 0; i < ctrlDeviceList.size(); i++) {

			if (ctrlDeviceList.get(i).getDeviceIdentifier() == null
					|| ctrlDeviceList.get(i).getDeviceIdentifier().equals("")) {
				throw new Exception("DeviceIdentifier null or Empty");
			}
			if (ctrlDeviceList.get(i).getDeviceType() == null || ctrlDeviceList.get(i).getDeviceType().equals("")) {
				throw new Exception("DeviceType null or Empty");
			}
			if (ctrlDeviceList.get(i).getProtocolType() == null || ctrlDeviceList.get(i).getProtocolType().equals("")) {
				throw new Exception("ProtocolType null or Empty");
			}
		}

		map.put("ctrlDeviceList", ctrlDeviceList);

		return ctrlDeviceInfoMapper.insertCtrlDeviceList(map);

	}

	public List<CtrlDeviceInfo> getDeviceInfoList(HashMap<String, Object> map) throws Exception {
		return ctrlDeviceInfoMapper.getCtrlDeviceInfoList(map);
	}

	public CtrlDeviceInfo getDeviceInfo(HashMap<String, Object> map) throws Exception {
		return ctrlDeviceInfoMapper.getCtrlDeviceInfo(map);
	}

	@Transactional
	public int removeDevice(HashMap<String, Object> map) throws Exception {

		CtrlDeviceInfo ctrlDeviceInfo = new CtrlDeviceInfo();

		if (map.get("deviceIdentifier") != null && !map.get("deviceIdentifier").equals("")) {
			ctrlDeviceInfo.setDeviceIdentifier(map.get("deviceIdentifier").toString());
			ctrlDeviceInfo.setDeviceStatus("N");
		} else {
			throw new Exception("DeviceIdentifier null or Empty");
		}

		return ctrlDeviceInfoMapper.updateCtrlDeviceInfo(ctrlDeviceInfo);
	}

	@Transactional
	public int updateDevice(CtrlDeviceInfo ctrlDeviceInfo) throws Exception {
		return ctrlDeviceInfoMapper.updateCtrlDeviceInfo(ctrlDeviceInfo);
	}

}
