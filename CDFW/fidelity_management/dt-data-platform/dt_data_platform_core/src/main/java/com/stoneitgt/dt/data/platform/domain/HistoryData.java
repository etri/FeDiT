package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.ArrayList;

@Data
public class HistoryData {
    private ArrayList<String> xAxisLabels;
    private ArrayList<HistoryItem> historyItems;
}
