package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.dt.data.platform.admin.service.DataTableService;
import com.stoneitgt.dt.data.platform.domain.DatatableData;
import com.stoneitgt.dt.data.platform.domain.DatatableRender;
import com.stoneitgt.dt.data.platform.domain.PreprocessDatatableRender;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Controller
@RequestMapping("/datatable")
public class DataTableController {

    @Autowired
    private DataTableService dataTableService;

    @PostMapping("/server/render")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderData(HttpServletRequest request, @RequestBody DatatableRender datatableRender) throws IOException {
        String filePath = datatableRender.getFile_path();
        String fileName = datatableRender.getFile_name();
        int target_row_count = datatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");

        //검색이 있을 경우
        dataList = dataTableService.search(datatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(datatableRender, dataList);

        // 페이징 처리
        int start = datatableRender.getStart();
        int length = datatableRender.getLength();
        List<List<String>> paginatedData = dataList.subList(start, Math.min(start + length, dataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(datatableRender.getDraw());
        datatableData.setRecordsTotal(dataList.size());
        datatableData.setRecordsFiltered(dataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }

    @PostMapping("/server/render/validate")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderValidateData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        String targetFileName = preprocessDatatableRender.getTarget_file_name();
        String indexTrgtCol = preprocessDatatableRender.getIndex_trgt_col();
        String vrfcTrgtCol = preprocessDatatableRender.getVrfc_trgt_col();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.filteredValidReadCSV(filePath, targetFileName, fileName, indexTrgtCol, vrfcTrgtCol);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        if (Objects.equals(targetFileName, fileName)) {
            //검색이 있을 경우
            dataList = dataTableService.search(preprocessDatatableRender, dataList);

            //정렬이 있을 경우
            dataList = dataTableService.sort(preprocessDatatableRender, dataList);

            // 페이징 처리
            int start = preprocessDatatableRender.getStart();
            int length = preprocessDatatableRender.getLength();
            List<List<String>> paginatedData = dataList.subList(start, Math.min(start + length, dataList.size()));

            // 응답 데이터 구성
            DatatableData datatableData = new DatatableData();
            datatableData.setDraw(preprocessDatatableRender.getDraw());
            datatableData.setRecordsTotal(dataList.size());
            datatableData.setRecordsFiltered(dataList.size());
            datatableData.setData(paginatedData);

            return ResponseEntity.ok(datatableData);
        } else {
            /**
             * @deprecated 속도 개선 문제 해결 중 현재 해결할 수 없는 부분으로 기존 Validate Total Data 영역은 그대로 한꺼번에 꺼내오고 보는것이 맞다.
             * @solution Python에서 파일로 만들어 줘야한다. (어느 row를 없앴는지에 대한 파일)
             * */
            List<List<String>> newDataList = new ArrayList<List<String>>();
            /**
             * New Data List Data + Before Data
             * */
            {
                int dateIndex = 0;
                for (List<String> row : dataList) {
                    List<String> newDataRow = new ArrayList<String>();
                    for (int i = 0; i < row.size(); i++) {
                        if (i == dateIndex) {
                            newDataRow.add(row.get(dateIndex));
                        } else {
                            newDataRow.add(row.get(i));
                            newDataRow.add("");
                        }
                    }
                    newDataList.add(newDataRow);
                }
            }

            //검색이 있을 경우
            dataList = dataTableService.search(preprocessDatatableRender, newDataList);

            //정렬이 있을 경우
            dataList = dataTableService.sort(preprocessDatatableRender, newDataList);

            // 페이징 처리
            int start = preprocessDatatableRender.getStart();
            int length = preprocessDatatableRender.getLength();
            List<List<String>> paginatedData = newDataList.subList(start, Math.min(start + length, newDataList.size()));

            // 응답 데이터 구성
            DatatableData datatableData = new DatatableData();
            datatableData.setDraw(preprocessDatatableRender.getDraw());
            datatableData.setRecordsTotal(newDataList.size());
            datatableData.setRecordsFiltered(newDataList.size());
            datatableData.setData(paginatedData);

            return ResponseEntity.ok(datatableData);
        }
    }

    @PostMapping("/server/render/outlier")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderOutlierData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        int target_row_count = preprocessDatatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        //검색이 있을 경우
        dataList = dataTableService.search(preprocessDatatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(preprocessDatatableRender, dataList);

        List<List<String>> newDataList = new ArrayList<List<String>>();

        /**
         * New Data List Data + Before Data
         * */
        {
            int dateIndex = 0;
            for (List<String> row : dataList) {
                List<String> newDataRow = new ArrayList<String>();
                for (int i = 0; i < row.size(); i++) {
                    if (i == dateIndex) {
                        newDataRow.add(row.get(dateIndex));
                    } else {
                        newDataRow.add(row.get(i));
                        newDataRow.add("");
                    }
                }
                newDataList.add(newDataRow);
            }
        }

        // 페이징 처리
        int start = preprocessDatatableRender.getStart();
        int length = preprocessDatatableRender.getLength();
        List<List<String>> paginatedData = newDataList.subList(start, Math.min(start + length, newDataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(preprocessDatatableRender.getDraw());
        datatableData.setRecordsTotal(newDataList.size());
        datatableData.setRecordsFiltered(newDataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }

    @PostMapping("/server/render/interpolate")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderInterpolateData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        int target_row_count = preprocessDatatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        //검색이 있을 경우
        dataList = dataTableService.search(preprocessDatatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(preprocessDatatableRender, dataList);

        List<List<String>> newDataList = new ArrayList<List<String>>();

        /**
         * New Data List Data + Before Data
         * */
        {
            int dateIndex = 0;
            for (List<String> row : dataList) {
                List<String> newDataRow = new ArrayList<String>();
                for (int i = 0; i < row.size(); i++) {
                    if (i == dateIndex) {
                        newDataRow.add(row.get(dateIndex));
                    } else {
                        newDataRow.add(row.get(i));
                        newDataRow.add("");
                    }
                }
                newDataList.add(newDataRow);
            }
        }

        // 페이징 처리
        int start = preprocessDatatableRender.getStart();
        int length = preprocessDatatableRender.getLength();
        List<List<String>> paginatedData = newDataList.subList(start, Math.min(start + length, newDataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(preprocessDatatableRender.getDraw());
        datatableData.setRecordsTotal(newDataList.size());
        datatableData.setRecordsFiltered(newDataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }

    @PostMapping("/server/render/brits")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderBritsData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        int target_row_count = preprocessDatatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        //검색이 있을 경우
        dataList = dataTableService.search(preprocessDatatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(preprocessDatatableRender, dataList);

        List<List<String>> newDataList = new ArrayList<List<String>>();

        /**
         * New Data List Data + Before Data
         * */
        {
            int dateIndex = 0;
            for (List<String> row : dataList) {
                List<String> newDataRow = new ArrayList<String>();
                for (int i = 0; i < row.size(); i++) {
                    if (i == dateIndex) {
                        newDataRow.add(row.get(dateIndex));
                    } else {
                        newDataRow.add(row.get(i));
                        newDataRow.add("");
                    }
                }
                newDataList.add(newDataRow);
            }
        }

        // 페이징 처리
        int start = preprocessDatatableRender.getStart();
        int length = preprocessDatatableRender.getLength();
        List<List<String>> paginatedData = newDataList.subList(start, Math.min(start + length, newDataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(preprocessDatatableRender.getDraw());
        datatableData.setRecordsTotal(newDataList.size());
        datatableData.setRecordsFiltered(newDataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }

    @PostMapping("/server/render/resample")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderResampleData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        int target_row_count = preprocessDatatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        //검색이 있을 경우
        dataList = dataTableService.search(preprocessDatatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(preprocessDatatableRender, dataList);

        // 페이징 처리
        int start = preprocessDatatableRender.getStart();
        int length = preprocessDatatableRender.getLength();
        List<List<String>> paginatedData = dataList.subList(start, Math.min(start + length, dataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(preprocessDatatableRender.getDraw());
        datatableData.setRecordsTotal(dataList.size());
        datatableData.setRecordsFiltered(dataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }

    @PostMapping("/server/render/unit")
    @ResponseBody
    public ResponseEntity<?> serverSideRenderUnitData(HttpServletRequest request, @RequestBody PreprocessDatatableRender preprocessDatatableRender) throws IOException {
        String filePath = preprocessDatatableRender.getFile_path();
        String fileName = preprocessDatatableRender.getFile_name();
        int target_row_count = preprocessDatatableRender.getTarget_row_count();
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(filePath + File.separator + fileName, target_row_count);

        List<List<String>> dataList = (List<List<String>>) resultCsv.get("data_list");
        //검색이 있을 경우
        dataList = dataTableService.search(preprocessDatatableRender, dataList);

        //정렬이 있을 경우
        dataList = dataTableService.sort(preprocessDatatableRender, dataList);

        // 페이징 처리
        int start = preprocessDatatableRender.getStart();
        int length = preprocessDatatableRender.getLength();
        List<List<String>> paginatedData = dataList.subList(start, Math.min(start + length, dataList.size()));

        // 응답 데이터 구성
        DatatableData datatableData = new DatatableData();
        datatableData.setDraw(preprocessDatatableRender.getDraw());
        datatableData.setRecordsTotal(dataList.size());
        datatableData.setRecordsFiltered(dataList.size());
        datatableData.setData(paginatedData);

        return ResponseEntity.ok(datatableData);
    }
}