package kr.co.n2m.platform.meta.collection.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.*;
import org.apache.ibatis.type.Alias;

import java.io.Serializable;


/**
 * 메타데이터 수집 검색 parameter Vo
 *
 * @author n2m
 */
@Schema(description = "메타데이터 수집 검색 parameter Vo")
@Getter
@Setter
@Alias("collectionSearchVo")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionSearchVo extends SearchVo implements Serializable {

    private String colecWrkId;

    private String colecWrkSttusMtcd;

    private String colecLogId;

    private String colecLogData;

    private String colecWrkMsg;

    private String cretMedataSetId; // cretMedataSetId가 cretMedataSetIdList에 포함되어있는지 확인

}