package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;

@Mapper
public interface MsaRequestControlTaskInfoMapper {

	List<MsaRequestControlCommandInfo> getMsaRequestControlTaskInfo(HashMap<String, Object> paramMap);
	
	MsaRequestControlCommandInfo getMsaTransmitterRequestControlTaskInfo(HashMap<String, Object> paramMap);

}
