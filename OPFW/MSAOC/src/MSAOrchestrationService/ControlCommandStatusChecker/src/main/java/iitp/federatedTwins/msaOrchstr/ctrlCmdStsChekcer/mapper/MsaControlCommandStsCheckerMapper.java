package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MsaControlCommandStsCheckerMapper {

	List<Integer> getReqCtrlCmdIdList(HashMap<String, Object> map);

}
