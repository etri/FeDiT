package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.impl;

import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;

import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.mapper.MsaControlCommandStsCheckerMapper;
import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.CtrlCmdTaskInfoService;

@Service
public class CtrlCmdTaskInfoServiceImpl implements CtrlCmdTaskInfoService {

	private final MsaControlCommandStsCheckerMapper reqCtrlCmdStsMapper;

	public CtrlCmdTaskInfoServiceImpl(MsaControlCommandStsCheckerMapper reqCtrlCmdStsMapper,
			MsaRequestControlCommandInfoMapper reqCtrlCmdMapper,
			MsaControlCommandStatusChangeRecordMapper CtrlCmdStsChgHisMapper) {
		this.reqCtrlCmdStsMapper = reqCtrlCmdStsMapper;
	}

	public List<Integer> getReqCtrlCmdIdList(HashMap<String, Object> map) throws Exception {
		return this.reqCtrlCmdStsMapper.getReqCtrlCmdIdList(map);
	}

}
