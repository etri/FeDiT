package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.file.FileReader;

import java.io.File;
import java.util.List;
import java.util.Map;

public class Test {
    public static void main(String[] args) throws Exception {
        String path = "C:\\Users\\dev\\Downloads";
        List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(path + File.separator + "admin1770369079181_origin_20260206181119_set_row.csv");
        String findColumnKey = "rowtime";
        boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
        if (duplicateDataCheck) {
            System.out.println("Duplicate data found based on the key: " + findColumnKey);
            List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
            //removedDuplicatedData.parallelStream().forEach(System.out::println);
        }
    }
}
