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

import * as echarts from 'echarts';
import 'echarts-wordcloud';

const state = reactive({
  dataList: [],
});

onMounted(() => {
  getInfluxDBCountByKeyword();
  //getDataList(); // 테스트용
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

const attachResize = (chart, el) => {
  // 컨테이너 크기 변화 감지(숨김 탭 → 보임 등)
  const ro = new ResizeObserver(() => chart.resize())
  ro.observe(el)
  // 창 리사이즈도 한 번 더(호환성)
  const onWinResize = () => chart.resize()
  window.addEventListener('resize', onWinResize)

  chart.__cleanup = () => {
    ro.disconnect()
    window.removeEventListener('resize', onWinResize)
    chart.dispose()
  }
}

const drawChart = () => {
  const el = document.getElementById("chartdiv");
  if (!el) return;

  const chart = echarts.init(el);
  const data = state.dataList;

  // const values = data.map(d => d.count)
  // const min = Math.min(...values, 0)
  // const max = Math.max(...values, 1)  
  // 데이터 값에 따라서 글자 크기의 차이가 표시나도록 함.

  // 상위 N개만 (너무 많으면 산만)
  const TOP_K = 80; // 40~80 사이로 취향 조절
  const dataSorted = [...(state.dataList || [])]
    .sort((a,b) => b.count - a.count)
    .slice(0, TOP_K);

  // 실제 값 범위 (색상/툴팁용)
  const valuesRaw = dataSorted.map(d => d.count);
  const minRaw = Math.min(...valuesRaw);
  const maxRaw = Math.max(...valuesRaw);
  const norm = v => (maxRaw === minRaw) ? 1 : (v - minRaw) / (maxRaw - minRaw);

  // 크기 스케일(감마): 큰 건 더 크게, 작은 건 더 작게
  const gamma   = 0.55;  // 0.45~0.8: 작을수록 큰 값이 더 커짐
  const minFrac = 0.16;  // 0.12~0.22: 작을수록 작은 글자가 더 작아짐
  const scaled = t => minFrac + (1 - minFrac) * Math.pow(Math.max(0, Math.min(1, t)), gamma);

  // 워드클라우드용 데이터
  const seriesData = dataSorted.map(d => ({
    name: d.keyword,
    value: scaled(norm(d.count)), // ★ 크기 산정 전용(0.16~1)
    raw: d.count                  // ★ 실제 값(툴팁/색상)
  }));

  // 색상 보간
  const start = [0x73, 0xB6, 0xE8]; // #73B6E8
  const end   = [0xE8, 0x73, 0x7B]; // #E8737B  == [232, 115, 123]  
  const toHex = (n) => n.toString(16).padStart(2, '0')
  const lerpColor = (t) => {
    const c = [0,1,2].map(i => Math.round(start[i] + (end[i] - start[i]) * t))
    return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`
  }

  // 대비용 텍스트 색 자동 선택
  const getTextColor = (hex) => {
    const toRGB = (c) => {
      if (typeof c !== 'string') return [255,255,255];
      if (c.startsWith('#')) {
        const n = c.length === 4
          ? c.replace(/#/,'').split('').map(x=>x+x).join('')
          : c.replace('#','');
        const r = parseInt(n.slice(0,2),16), g = parseInt(n.slice(2,4),16), b = parseInt(n.slice(4,6),16);
        return [r,g,b];
      }
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return m ? [+m[1],+m[2],+m[3]] : [255,255,255];
    };
    const [r,g,b] = toRGB(hex);
    const L = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
    return L < 0.6 ? '#fff' : '#111';
  };  

  const option = {
    title: {
      text: '최근 1년 동안의 키워드',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 20,
        fontWeight: 800,
        fontFamily: 'Courier New'
      }
    },
    tooltip: {
      show: true,
      trigger: 'item',
      // 바깥 래퍼 숨기기
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'background:transparent;border:none;padding:0;box-shadow:none;',      
      // 워드클라우드용 커스텀 툴팁: 배경=단어색, 보더=흰색, 글자색=가독성 자동
      formatter: (p) => {
        // eCharts가 넘겨주는 색(단어 텍스트 컬러)
        let wordColor = typeof p.color === 'string' ? p.color : '#3CABFF';
        if (!wordColor) {
          // 색이 비어있으면 raw 기준으로 재보간
          const tRaw = (maxRaw === minRaw) ? 1 : (p.data.raw - minRaw) / (maxRaw - minRaw);
          const t = Math.max(0, Math.min(1, tRaw));
          wordColor = lerpColor(t);
        }
        const textColor = getTextColor(wordColor);
        const val = p.data.raw;

        return `
          <div style="
            background:${wordColor};
            color:${textColor};
            border:1px solid #fff;
            border-radius:8px;
            padding:8px 10px;
            box-shadow:0 4px 12px rgba(0,0,0,0.6);
            pointer-events:none;
            opacity:.95;
          ">
            <div style="display:flex;gap:8px;align-items:center;">
              <span>${p.name} : ${val}</span>
            </div>
          </div>
        `;
      }
    },
    series: [{
      type: 'wordCloud',
      // ECharts에서는 배치 랜덤성/회전을 rotationRange/rotationStep/gridSize 등으로 조절
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '93%',   // 배치 영역 확대
      height: '93%',  // 배치 영역 확대      
      gridSize: 8,                 // 단어 간격
      sizeRange: [12, 80],         // 폰트 크기 범위
      rotationRange: [0, 90],      // 회전 범위
      rotationStep: 90,            // 회전 간격
      textStyle: {
        fontFamily: 'Courier New',
        // 색상은 실제 값(raw)로 보간 → 크기와 독립
        color: (params) => {
          const v = params?.data?.raw ?? 0;
          const tRaw = (maxRaw === minRaw) ? 1 : (v - minRaw) / (maxRaw - minRaw);
          const t = Math.max(0, Math.min(1, tRaw));
          return lerpColor(t); // #73B6E8 → #0B2E59 (이전 답에서 정의한 보간 함수)
        }
      },
      // hover 시 너무 튀지 않게 약한 하이라이트만
      emphasis: {
        textStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.25)' }
      },
      data: seriesData
    }]
  }

  chart.setOption(option)

  // 클릭 시 URL 열고 싶을 때(주석 해제)
  // chart.on('click', params => {
  //   if (params.data && params.data.url) {
  //     window.open(params.data.url, '_blank')
  //   }
  // })

  attachResize(chart, el);
  return chart;
}

const drawChart2 = () => {
  const el = document.getElementById("chartdiv2");
  if (!el) return;

  const chart = echarts.init(el);
  const data = state.dataList;

  const dzTop = 10;     // 슬라이더를 컨테이너 상단에서 10px
  const dzHeight = 22;  // 슬라이더 높이
  const gap = 20;       // 슬라이더와 차트 사이 여백(요청사항)

  const count = data.length;
  const colorCycleSize = count <= 36 ? Math.max(count, 1) : 24;
  const pastel = ['#73B6E8', '#8C73E8', '#E8737B', '#E8C573', '#73E8B5']; // 스펙트럼

  const source = data.map((d, i) => ({
    phase: i % colorCycleSize,  // 막대색 스텍트럼
    name: d.keyword,            // x축 레이블
    val: Number(d.count || 0)   // y 값
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      renderMode: 'html',          // HTML 모드(동적 배경/보더 가능)
      backgroundColor: '#fff',
      borderWidth: 0,
      padding: 0,
      appendToBody: true,          // 스크롤 컨테이너일 때 위치 더 안정적
      confine: true,               // 차트 영역 밖으로 튀어나가지 않게

      // 커서 위로 위치시키는 핵심
      position: function (point, params, dom, rect, size) {
        const mouseX = point[0];
        const mouseY = point[1];
        const contentSize = size.contentSize; // [w, h]
        const viewSize = size.viewSize;       // [vw, vh]

        // 기본: 커서 위 12px
        let x = mouseX - contentSize[0] / 2;
        let y = mouseY - contentSize[1] - 12;

        // 왼/오 바운더리 보정
        if (x < 0) x = 0;
        if (x + contentSize[0] > viewSize[0]) x = viewSize[0] - contentSize[0];

        // 위로 못 올라가면(상단에 너무 가까우면) 아래로 플립
        if (y < 0) y = mouseY + 12;

        return [x, y];
      },

      formatter: (p) => {
        //console.log(p.value);
        const val = p.value.val;

        // 막대 색 추출 (그라데이션이면 중간 스톱 색 사용)
        let barColor = '#3CABFF';
        if (typeof p.color === 'string') {
          barColor = p.color;
        } else if (p.color && Array.isArray(p.color.colorStops) && p.color.colorStops.length) {
          const mid = Math.floor(p.color.colorStops.length / 2);
          barColor = p.color.colorStops[mid].color;
        }

        // (선택) 배경색에 따라 글자색 가독성 보정
        const getTextColor = (hex) => {
          // hex나 rgb/rgba 모두 대충 처리
          const toRGB = (c) => {
            if (c.startsWith('#')) {
              const n = c.length === 4
                ? c.replace(/#/,'').split('').map(x=>x+x).join('')
                : c.replace('#','');
              const r = parseInt(n.slice(0,2),16), g = parseInt(n.slice(2,4),16), b = parseInt(n.slice(4,6),16);
              return [r,g,b];
            }
            const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            return m ? [+m[1],+m[2],+m[3]] : [255,255,255];
          };
          const [r,g,b] = toRGB(hex);
          // 상대 휘도 기준 (단순화)
          const L = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
          return L < 0.6 ? '#fff' : '#111';
        };

        const textColor = getTextColor(barColor);

        // 배경=막대색, 보더=흰색
        return `
          <div style="
            background:${barColor};
            color:${textColor};
            border:1px solid #fff;
            border-radius:8px;
            padding:8px 10px;
            box-shadow:0 4px 12px rgba(0,0,0,1);
            pointer-events:none;
            opacity:.95;
          ">
            <div style="display:flex;gap:8px;align-items:center;">
              <span>${p.name} : ${val}</span>
            </div>
          </div>
        `;
      }
    },
    grid: { left: 70, right: 20, top: dzTop + dzHeight + gap, bottom: 110 },
    dataset: { source },
    xAxis: {
      type: 'category',
      axisLabel: { rotate: 90, interval: 0, margin: 10, align: 'right', verticalAlign: 'middle' },
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      boundaryGap: [0, 0.1]  // 위로 10% 여유
    },
    // dataZoom: [
    //   { type: 'slider', xAxisIndex: 0, top: dzTop, height: dzHeight },
    //   { type: 'inside', xAxisIndex: 0 }
    // ],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        top: dzTop,
        height: dzHeight,

        // 아주 연한 트랙
        backgroundColor: 'rgba(248,248,248,0.95)', // 거의 흰색

        // 원본 데이터 라인/영역 (연한 회색)
        dataBackground: {
          lineStyle: { color: '#dcdcdc' },       // 밝은 라인
          areaStyle: { color: 'rgba(230,230,230,0.6)' } // 아주 연한 영역
        },

        // 선택 구간 채움 (연-회색, 더 투명)
        fillerColor: 'rgba(200,200,200,0.25)',

        // 테두리도 최대한 연하게
        borderColor: '#eeeeee',

        // 핸들(그립)도 연회색 + 얕은 그림자
        handleStyle: {
          color: '#d9d9d9',
          borderColor: '#ffffff',
          borderWidth: 1,
          shadowBlur: 1.5,
          shadowColor: 'rgba(0,0,0,0.08)'
        },
        moveHandleStyle: {
          color: '#d0d0d0',
          borderColor: '#ffffff'
        },

        // 라벨 텍스트도 연하게
        textStyle: { color: '#8c8c8c' },

        // hover 시 살짝만 진하게
        emphasis: {
          handleStyle: { color: '#c8c8c8' },
          moveHandleStyle: { color: '#c8c8c8' }
        }
      },
      { type: 'inside', xAxisIndex: 0 }
    ],
    visualMap: {
      type: 'continuous',
      show: false,
      dimension: 'phase',       // 색 매핑 기준
      min: 0,
      max: colorCycleSize - 1,
      inRange: {
        color: pastel,
        colorAlpha: [0.65, 0.65]  // 파스텔 느낌 살짝 투명
      }
    },
    series: [{
      type: 'bar',
      // dataset 컬럼 매핑
      encode: { x: 'name', y: 'val' },
      itemStyle: {
        borderRadius: [10, 10, 0, 0]  // 상단 라운드
      },
      emphasis: {
        itemStyle: {
          // hover 시만 불투명하게 강조하고 싶다면:
          opacity: 1
        }
      },
      // (선택) 값 라벨
      // label: { show: true, position: 'top' }
      barCategoryGap: '16%', // 카테고리 폭의 16%를 간격으로 => 막대는 84%
      barGap: '0%',          // (다중 시리즈일 때) 서로 겹치지 않고 꽉 차게          
      //barMaxWidth: 44,  
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut'
  };

  chart.setOption(option)
  attachResize(chart, el);
  return chart;
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