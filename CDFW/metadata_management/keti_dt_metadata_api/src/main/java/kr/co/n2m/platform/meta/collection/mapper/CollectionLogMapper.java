package kr.co.n2m.platform.meta.collection.mapper;

import kr.co.n2m.platform.meta.collection.domain.CollectionLogDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionLogVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionSearchVo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CollectionLogMapper {

    /** 수집 로그 목록 건수 조회 */
    int selectCollectionLogCount(CollectionSearchVo searchVo);

    /** 수집 로그 목록 조회 */
    List<CollectionLogDto> selectCollectionLogList(CollectionSearchVo searchVo);

    /** 수집 로그 상세 조회 */
    CollectionLogDto selectCollectionLog(CollectionSearchVo searchVo);

    /** 수집 로그 등록 */
    int insertCollectionLog(CollectionLogVo collectionLogVo);

    /** 수집 로그 아이디 존재 확인 */
    boolean isLogExist(String colecLogId);

}