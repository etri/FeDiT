package kr.co.e8ight.ndxpro_v1_datamanager.util;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor

public class PagingResult<T> {
    private Object data;
    private long totalData;
    private int totalPage;

}

