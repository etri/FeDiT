import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export const createChart = (options) => {
    let _chart = null;
    
    _chart = am4core.create(options.chartElement, am4charts.XYChart);
    return _chart
};

export const getChartCore = () => {
    return am4core;
}

export const getDateAxis = () => {
    return new am4charts.DateAxis();
}

export const getValueAxis = () => {
    return new am4charts.ValueAxis();
}

export const getLineSeries = () => {
    return new am4charts.LineSeries();
}

export const getLinearGradient = () => {
    return new am4core.LinearGradient();
}

export const createChartCircleBullet = () => {
    return new am4charts.CircleBullet();
}

export const getChartCircleBullet = () => {
    return am4charts.CircleBullet;
}

export const getChartColor = (value) => {
    if ( !value.startsWith("#") ) {
        value += "#";
    }
    return am4core.color(value);
}
