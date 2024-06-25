import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export const createChart = (options) => {
    let _chart = null;
    
    switch (options.chartType) {
        case 'column':
        case 'bar':
        case 'line': {
            _chart = am4core.create(options.chartElement, am4charts.XYChart);
            break;
        }
        case 'pie': 
        case 'donut': {
            _chart = am4core.create(options.chartElement, am4charts.PieChart);
            break;
        }
        case 'gauge': {
            _chart = am4core.create(options.chartElement, am4charts.GaugeChart);
            break;
        }
    }

    return _chart
}

export const getChartCore = () => {
    return am4core;
}

export const getLegend = () => {
    return new am4charts.Legend();
}

export const getCategoryAxis = () => {
    return new am4charts.CategoryAxis();
}

export const getDateAxis = () => {
    return new am4charts.DateAxis();
}

export const getValueAxis = () => {
    return new am4charts.ValueAxis();
}

export const getColumnSeries = () => {
    return new am4charts.ColumnSeries();
}

export const getLineSeries = () => {
    return new am4charts.LineSeries();
}

export const getPieSeries = () => {
    return new am4charts.PieSeries();
}

export const getXYCursor = () => {
    return new am4charts.XYCursor()
}

export const getClockHand = () => {
    return new am4charts.ClockHand();
}

export const getLinearGradient = () => {
    return new am4core.LinearGradient();
}

export const createChartLabelBullet = () => {
    return new am4charts.LabelBullet();
}

export const createChartCircleBullet = () => {
    return new am4charts.CircleBullet();
}

export const getChartCircleBullet = () => {
    return am4charts.CircleBullet;
}

export const getChartLabel = () => {
    return am4core.Label;
}

export const getChartColor = (value) => {
    if ( !value.startsWith("#") ) {
        value += "#";
    }
    return am4core.color(value);
}

export const getChartPercent = (value) => {
    return am4core.percent(value);
}

export const getTopRadius = (radius, target, type) => {
    switch (type) {
        case 'column': {
            return (target.dataItem && (target.dataItem.valueY < 0)) ? 0: 5;
        }
        case 'bar': {
            return (target.dataItem && (target.dataItem.valueX < 0)) ? 0: 5;
        }
    }
    return null;
}

export const getBottomRadius = (radius, target, type) => {
    switch (type) {
        case 'column': {
            return (target.dataItem && (target.dataItem.valueY > 0)) ? 0: 5;
        }
        case 'bar': {
            return (target.dataItem && (target.dataItem.valueX > 0)) ? 0: 5;
        }
    }
    return null;
}
