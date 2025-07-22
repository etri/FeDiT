package com.stoneitgt.dt.data.platform.admin.service;


import com.stoneitgt.dt.data.platform.domain.DatatableRender;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Data
@Slf4j
public class DataTableService {
    public List<List<String>> search(DatatableRender datatableRender, List<List<String>> dataList) {
        // 데이터 필터링 (columns의 search.value 활용)
        List<DatatableRender.Column> columns = datatableRender.getColumns();
        for (int i = 0; i < columns.size(); i++) {
            if (columns.get(i).isSearchable()) {
                String searchValue = columns.get(i).getSearch().getValue();
                if (searchValue != null && !searchValue.isEmpty()) {
                    final int columnIndex = i;
                    dataList = dataList.stream()
                            .filter(row -> row.get(columnIndex).contains(searchValue))
                            .collect(Collectors.toList());  // Collectors.toList() 사용
                }
            }
        }
        return dataList;
    }

    public List<List<String>> sort(DatatableRender datatableRender, List<List<String>> dataList) {
        // 데이터 정렬 (order 정보 활용)
        List<DatatableRender.Order> orders = datatableRender.getOrder();
        if (!orders.isEmpty()) {
            DatatableRender.Order order = orders.get(0); // 첫 번째 정렬 기준만 사용
            int columnIndex = order.getColumn();
            String direction = order.getDir();

            dataList.sort((row1, row2) -> {
                String val1 = row1.get(columnIndex);
                String val2 = row2.get(columnIndex);

                // null 값 처리
                if (val1 == null) val1 = "";
                if (val2 == null) val2 = "";

                // 오름차순 또는 내림차순 정렬
                return "asc".equalsIgnoreCase(direction) ?
                        val1.compareTo(val2) :
                        val2.compareTo(val1);
            });
        }
        return dataList;
    }
}
