package kr.co.n2m.platform.meta.collection.domain;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "메타데이터 수집 작업 정보 Vo")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Alias("collectionWorkVo")
public class CollectionWorkVo extends BaseVo {

    @Schema(description = "수집 작업 아이디")
    private String colecWrkId;

    @Schema(description = "수집 작업 상태 메타코드")
    private String colecWrkSttusMtcd;

    @Schema(description = "수집 로그 아이디")  // 수정 금지
    private String colecLogId;

    @Schema(description = "루트 메타데이터셋 아이디")
    private String rootMedataSetId;

    @Schema(description = "생성 메타데이터셋 아이디 목록 (JSON)")
    private String cretMedataSetIdList;

    @Schema(description = "수집 작업 메시지")
    private String colecWrkMsg;

    @Schema(description = "수집 작업 등록 일시")
    private String colecWrkRegDt;

    @Schema(description = "수집 작업 수정 일시")
    private String colecWrkAmdDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
 
    public void makeCretMedataSetIdList(Set<String> idSet) {
    	Map<String, Object> map = new HashMap<>();
    	if (idSet != null && !idSet.isEmpty()) {
    		map.put("idList", idSet.toArray());
    	} else {
    		map.put("idList", null);
    	}
    	this.cretMedataSetIdList = JsonUtil.toJsonWithNull(map);
    }
    
}