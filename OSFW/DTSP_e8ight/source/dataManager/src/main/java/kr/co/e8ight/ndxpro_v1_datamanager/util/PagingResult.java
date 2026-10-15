package kr.co.e8ight.ndxpro_v1_datamanager.util;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Schema(description = "페이징 조회 결과")
public class PagingResult<T> {

    @Schema(description = "현재 페이지의 데이터 목록")
    private T data;

    @Schema(description = "검색 조건에 해당하는 전체 데이터 개수", example = "137")
    private long totalData;

    @Schema(description = "전체 페이지 수 (totalData / size 올림)", example = "6")
    private int totalPage;

}
