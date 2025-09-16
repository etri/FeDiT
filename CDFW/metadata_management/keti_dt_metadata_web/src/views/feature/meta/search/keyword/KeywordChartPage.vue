<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>최근 1년 동안의 키워드</h3>
        <div class="btnSec taR">				
          <el-button type="primary" @click="getInfluxDBCountByKeyword()">검색</el-button>
        </div>	        
      </div>
      <div class="boxCnt">
        <div id="chartdiv" class=""> </div>
        <div class="btnSec taR">
          <el-button type="default" @click="toggleChart2()">{{ showChart2 ? '접기' : '상세보기' }}</el-button>
        </div>
        <div id="chartdiv2" class="" v-show="showChart2"> </div>        
      </div>
    </div>
  </div>
</template>
                           
<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import {
  getGlobalProperties,
} from "@/assets/js/common.js";
import { useStore } from "vuex";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

const state = reactive({
  dataList: [],
});

onMounted(() => {
  getInfluxDBCountByKeyword();
});

const showChart2 = ref(false);

const toggleChart2 = () => {
  showChart2.value = !showChart2.value;
  if (showChart2.value) {
    drawChart2();
  }
}

const getInfluxDBCountByKeyword = () => {
  $axios.get($apiUrls.meta.datastore.influxdb.getInfluxDBCountByKeyword)
    .then((res) => {
      // influxDB 쿼리에서 sort 가 잘 안되어 여기서 함.
      let list = res.data;
      if (list.length > 1) {
        list.sort((a, b) => {
          if (a.count == b.count) {
            if (a.keyword.toLowerCase() > b.keyword.toLowerCase()) return 1; // asc
            else if (a.keyword.toLowerCase() < b.keyword.toLowerCase()) return -1;
            else return 0;
          } else {
            return b.count - a.count; // desc
          }
        })
      }
      state.dataList = list;
      drawChart();
    })
    .catch((err) => {
      console.log(err);
    });
};

const drawChart = () => {
  let chart = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
  chart.fontFamily = "Courier New";
  let series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());
  series.randomness = 0.1;
  series.rotationThreshold = 0.5;

  series.data = state.dataList;

  series.dataFields.word = "keyword";
  series.dataFields.value = "count";

  series.heatRules.push({
    "target": series.labels.template,
    "property": "fill",
    "min": am4core.color("#24c6dc"),
    "max": am4core.color("#514a9d"),
    "dataField": "value"
  });

  // series.labels.template.url = "https://stackoverflow.com/questions/tagged/{word}";
  // series.labels.template.urlTarget = "_blank";
  series.labels.template.tooltipText = "{word}: {value}";

  let hoverState = series.labels.template.states.create("hover");
  hoverState.properties.fill = am4core.color("#f53535");

  // let subtitle = chart.titles.create();
  // subtitle.text = "(click to open)";

  let title = chart.titles.create();
  title.text = "최근 1년 동안의 키워드";
  title.fontSize = 20;
  title.fontWeight = "800";
}

const drawChart2 = () => {
  let chart = am4core.create("chartdiv2", am4charts.XYChart);
  chart.scrollbarX = new am4core.Scrollbar();

  chart.data = state.dataList;

  let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "keyword";
  categoryAxis.renderer.grid.template.location = 0;
  categoryAxis.renderer.minGridDistance = 30;
  categoryAxis.renderer.labels.template.horizontalCenter = "right";
  categoryAxis.renderer.labels.template.verticalCenter = "middle";
  categoryAxis.renderer.labels.template.rotation = 270;
  categoryAxis.tooltip.disabled = true;
  categoryAxis.renderer.minHeight = 110;

  let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.renderer.minWidth = 50;

  let series = chart.series.push(new am4charts.ColumnSeries());
  series.sequencedInterpolation = true;
  series.dataFields.valueY = "count";
  series.dataFields.categoryX = "keyword";
  // series.tooltipText = "[{categoryX}: bold]{valueY}[/]";
  series.tooltipText = "{categoryX}: {valueY}";
  series.columns.template.strokeWidth = 0;

  series.tooltip.pointerOrientation = "vertical";

  series.columns.template.column.cornerRadiusTopLeft = 10;
  series.columns.template.column.cornerRadiusTopRight = 10;
  series.columns.template.column.fillOpacity = 0.8;

  let hoverState = series.columns.template.column.states.create("hover");
  hoverState.properties.cornerRadiusTopLeft = 0;
  hoverState.properties.cornerRadiusTopRight = 0;
  hoverState.properties.fillOpacity = 1;

  series.columns.template.adapter.add("fill", function(fill, target) {
    return chart.colors.getIndex(target.dataItem.index);
  });

  chart.cursor = new am4charts.XYCursor();
}

/* 예제)
const getDataList = async () => {
  let dataList = [ {
      "keyword": "javascript",
      "count": "1765836"
  }, {
      "keyword": "java",
      "count": "1517355"
  }, {
      "keyword": "c#",
      "count": "1287629"
  }, {
      "keyword": "php",
      "count": "1263946"
  }, {
      "keyword": "android",
      "count": "1174721"
  }, {
      "keyword": "python",
      "count": "1116769"
  }, {
      "keyword": "jquery",
      "count": "944983"
  }, {
      "keyword": "html",
      "count": "805679"
  }, {
      "keyword": "c++",
      "count": "606051"
  }, {
      "keyword": "ios",
      "count": "591410"
  }, {
      "keyword": "css",
      "count": "574684"
  }, {
      "keyword": "mysql",
      "count": "550916"
  }, {
      "keyword": "sql",
      "count": "479892"
  }, {
      "keyword": "asp.net",
      "count": "343092"
  }, {
      "keyword": "ruby-on-rails",
      "count": "303311"
  }, {
      "keyword": "c",
      "count": "296963"
  }, {
      "keyword": "arrays",
      "count": "288445"
  }, {
      "keyword": "objective-c",
      "count": "286823"
  }, {
      "keyword": ".net",
      "count": "280079"
  }, {
      "keyword": "r",
      "count": "277144"
  }, {
      "keyword": "node.js",
      "count": "263451"
  }, {
      "keyword": "angularjs",
      "count": "257159"
  }, {
      "keyword": "json",
      "count": "255661"
  }, {
      "keyword": "sql-server",
      "count": "253824"
  }, {
      "keyword": "swift",
      "count": "222387"
  }, {
      "keyword": "iphone",
      "count": "219827"
  }, {
      "keyword": "regex",
      "count": "203121"
  }, {
      "keyword": "ruby",
      "count": "202547"
  }, {
      "keyword": "ajax",
      "count": "196727"
  }, {
      "keyword": "django",
      "count": "191174"
  }, {
      "keyword": "excel",
      "count": "188787"
  }, {
      "keyword": "xml",
      "count": "180742"
  }, {
      "keyword": "asp.net-mvc",
      "count": "178291"
  }, {
      "keyword": "linux",
      "count": "173278"
  }, {
      "keyword": "angular",
      "count": "154447"
  }, {
      "keyword": "database",
      "count": "153581"
  }, {
      "keyword": "wpf",
      "count": "147538"
  }, {
      "keyword": "spring",
      "count": "147456"
  }, {
      "keyword": "wordpress",
      "count": "145801"
  }, {
      "keyword": "python-3.x",
      "count": "145685"
  }, {
      "keyword": "vba",
      "count": "139940"
  }, {
      "keyword": "string",
      "count": "136649"
  }, {
      "keyword": "xcode",
      "count": "130591"
  }, {
      "keyword": "windows",
      "count": "127680"
  }, {
      "keyword": "reactjs",
      "count": "125021"
  }, {
      "keyword": "vb.net",
      "count": "122559"
  }, {
      "keyword": "html5",
      "count": "118810"
  }, {
      "keyword": "eclipse",
      "count": "115802"
  }, {
      "keyword": "multithreading",
      "count": "113719"
  }, {
      "keyword": "mongodb",
      "count": "110348"
  }, {
      "keyword": "laravel",
      "count": "109340"
  }, {
      "keyword": "bash",
      "count": "108797"
  }, {
      "keyword": "git",
      "count": "108075"
  }, {
      "keyword": "oracle",
      "count": "106936"
  }, {
      "keyword": "pandas",
      "count": "96225"
  }, {
      "keyword": "postgresql",
      "count": "96027"
  }, {
      "keyword": "twitter-bootstrap",
      "count": "94348"
  }, {
      "keyword": "forms",
      "count": "92995"
  }, {
      "keyword": "image",
      "count": "92131"
  }, {
      "keyword": "macos",
      "count": "90327"
  }, {
      "keyword": "algorithm",
      "count": "89670"
  }, {
      "keyword": "python-2.7",
      "count": "88762"
  }, {
      "keyword": "scala",
      "count": "86971"
  }, {
      "keyword": "visual-studio",
      "count": "85825"
  }, {
      "keyword": "list",
      "count": "84392"
  }, {
      "keyword": "excel-vba",
      "count": "83948"
  }, {
      "keyword": "winforms",
      "count": "83600"
  }, {
      "keyword": "apache",
      "count": "83367"
  }, {
      "keyword": "facebook",
      "count": "83212"
  }, {
      "keyword": "matlab",
      "count": "82452"
  }, {
      "keyword": "performance",
      "count": "81443"
  }, {
      "keyword": "css3",
      "count": "78250"
  }, {
      "keyword": "entity-framework",
      "count": "78243"
  }, {
      "keyword": "hibernate",
      "count": "76123"
  }, {
      "keyword": "typescript",
      "count": "74867"
  }, {
      "keyword": "linq",
      "count": "73128"
  }, {
      "keyword": "swing",
      "count": "72333"
  }, {
      "keyword": "function",
      "count": "72043"
  }, {
      "keyword": "amazon-web-services",
      "count": "71155"
  }, {
      "keyword": "qt",
      "count": "69552"
  }, {
      "keyword": "rest",
      "count": "69138"
  }, {
      "keyword": "shell",
      "count": "68854"
  }, {
      "keyword": "azure",
      "count": "67431"
  }, {
      "keyword": "firebase",
      "count": "66411"
  }, {
      "keyword": "api",
      "count": "66158"
  }, {
      "keyword": "maven",
      "count": "66113"
  }, {
      "keyword": "powershell",
      "count": "65467"
  }, {
      "keyword": ".htaccess",
      "count": "65014"
  }, {
      "keyword": "sqlite",
      "count": "64888"
  }, {
      "keyword": "file",
      "count": "62783"
  }, {
      "keyword": "codeigniter",
      "count": "62393"
  }, {
      "keyword": "unit-testing",
      "count": "61909"
  }, {
      "keyword": "perl",
      "count": "61752"
  }, {
      "keyword": "loops",
      "count": "61015"
  }, {
      "keyword": "symfony",
      "count": "60820"
  }, {
      "keyword": "selenium",
      "count": "59855"
  }, {
      "keyword": "google-maps",
      "count": "59616"
  }, {
      "keyword": "csv",
      "count": "59600"
  }, {
      "keyword": "uitableview",
      "count": "59011"
  }, {
      "keyword": "web-services",
      "count": "58916"
  }, {
      "keyword": "cordova",
      "count": "58195"
  }, {
      "keyword": "class",
      "count": "58055"
  }, {
      "keyword": "numpy",
      "count": "57132"
  }, {
      "keyword": "google-chrome",
      "count": "56836"
  }, {
      "keyword": "ruby-on-rails-3",
      "count": "55962"
  }, {
      "keyword": "android-studio",
      "count": "55801"
  }, {
      "keyword": "tsql",
      "count": "55736"
  }, {
      "keyword": "validation",
      "count": "55531"
  } ];

  setTimeout(() => { state.dataList = dataList;   drawChart();  }, 2000);
}
*/

</script>
<style lang="scss">
#chartdiv {
  width: 100%;
  height: 550px;
}
#chartdiv2 {
  width: 100%;
  height: 400px;
}
</style>