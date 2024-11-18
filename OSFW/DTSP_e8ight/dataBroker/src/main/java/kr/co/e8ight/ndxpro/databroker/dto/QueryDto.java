package kr.co.e8ight.ndxpro.databroker.dto;

import kr.co.e8ight.ndxpro.databroker.util.SortTypeCode;
import lombok.*;

@Getter
@Setter
@Builder
public class QueryDto {

    private String id;

    private String type;

    private String link;

    private String q;

    private String timerel;

    private String time;

    private String endTime;

    private String timeproperty;

    private int offset;

    private int limit;

    private SortTypeCode sort;

    private String sortproperty;
}
