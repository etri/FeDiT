package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper;

import java.util.HashMap;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo.CtrlCmdSeqTaskProcVO;

@Mapper
public interface TrackingCommandTaskInfoMapper {

	List<TrackingProcessInfo> getTrackingCommandTaskInfoList(HashMap<String, Object> map);

	List<Integer> getTrackingCmdSeqIdList(HashMap<String, Object> map);

	CtrlCmdSeqTaskProcVO getTrackingCommandSequenceTaskProcInfo(HashMap<String, Object> map);

	HashMap<String, Object> getTotalCountTrackingCmdTaskInfo(HashMap<String, Object> map) throws Exception;

	int updateTrackingCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception;

	int insertTrackingCmdSeqChangeHisMultiProcInfo(HashMap<String, Object> map) throws Exception;

	List<TrackingProcessInfo> getTrackCmdTaskInfoList(HashMap<String, Object> map);
}
