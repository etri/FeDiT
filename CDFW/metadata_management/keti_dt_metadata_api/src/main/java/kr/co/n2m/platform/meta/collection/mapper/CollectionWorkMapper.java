package kr.co.n2m.platform.meta.collection.mapper;

import kr.co.n2m.platform.meta.collection.domain.CollectionSearchVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkVo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CollectionWorkMapper {

    /** 수집 작업 목록 건수 조회 */
    int selectCollectionWorkCount(CollectionSearchVo searchVo);

    /** 수집 작업 목록 조회 */
    List<CollectionWorkDto> selectCollectionWorkList(CollectionSearchVo searchVo);

    /** 수집 작업 상세 조회 */
    CollectionWorkDto selectCollectionWork(CollectionSearchVo searchVo);

    /** 수집 작업 등록 */
    int insertCollectionWork(CollectionWorkVo collectionWorkVo);

    /** 수집 작업 수정 */
    int updateCollectionWork(CollectionWorkVo collectionWorkVo);

}