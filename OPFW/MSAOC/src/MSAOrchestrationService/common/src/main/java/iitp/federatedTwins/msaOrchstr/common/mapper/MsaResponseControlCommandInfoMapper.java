package iitp.federatedTwins.msaOrchstr.common.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaResponseControlCommandInfo;

@Mapper
public interface MsaResponseControlCommandInfoMapper {

	List<MsaResponseControlCommandInfo> getResponseControlCommandList(HashMap<String, Object> map) throws Exception;

	int insertResponseControlCommand(MsaResponseControlCommandInfo msaRi) throws Exception;

	int updateResponseControlCommand(MsaResponseControlCommandInfo msaRi) throws Exception;

	int deleteResponseControlCommand(HashMap<String, Object> map) throws Exception;

}
