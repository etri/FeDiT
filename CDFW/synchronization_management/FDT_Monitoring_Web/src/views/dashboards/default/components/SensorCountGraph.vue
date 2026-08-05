<script setup lang="ts">
import { ref, onMounted, computed, inject, watch  } from 'vue';
import { format, subDays, startOfWeek, endOfWeek, subWeeks, addDays  } from 'date-fns';

const $axios = inject('$axios');
const select = ref({ state: 'A Week', abbr: 'FL' });
const items = [
  { state: 'A Week', abbr: 'FL' },
  { state: 'A Month', abbr: 'GA' },
  { state: 'A Year', abbr: 'NE' }
];
const totalCount = ref("")
const now = new Date();
const currentDate = format(now, 'yyyy-MM-dd');
const oneWeekAgo = format(subDays(now, 7), 'yyyy-MM-dd');
const currentMonthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
const weeksInMonth = () => {
  const weeks = [
    {
      label: '1st Week',
      start: format(startOfWeek(subWeeks(now, 3), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(subWeeks(now, 3), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    },
    {
      label: '2nd Week',
      start: format(startOfWeek(subWeeks(now, 2), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(subWeeks(now, 2), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    },
    {
      label: '3rd Week',
      start: format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    },
    {
      label: '4th Week',
      start: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    },
  ];

  return weeks;
};

const monthWeeks = weeksInMonth();
// console.log('Weeks in This Month:', monthWeeks);
const currentYearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');

const chartOptions = ref({
    chart: {
      type: 'bar',
      height: 480,
      fontFamily: `inherit`,
      foreColor: '#a1aab2',
      stacked: true
    },
    colors: ['#3949AB', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33'],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        dataLabels: {
          orientation: 'horizontal',
          position: 'top'
        }
      }
    },
    xaxis: {
      label: {rotate: 0},
      type: 'category',
      categories: []
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return formatNumber(value); // y축에 표시되는 숫자
        }
      },
    },
    legend: {
      show: true,
      fontFamily: `'Roboto', sans-serif`,
      position: 'bottom',
      offsetX: 20,
      labels: {
        useSeriesColors: false
      },
      markers: {
        width: 16,
        height: 16,
        radius: 5
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    fill: {
      type: 'solid'
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        const dataPointIndex = opts.dataPointIndex;

        // Calculate the sum for the current data point across all series
        let sum = 0;
        opts.w.config.series.forEach(series => {
          sum += series.data[dataPointIndex];
        });

        // Only display the label for the topmost bar (last series)
        if (opts.seriesIndex === opts.w.config.series.length - 1) {
          return formatNumber(sum);
        } else {
          return ''; // Return empty string for other bars
        }
      },
      offsetY:-20,
      style: {
        colors: ['#000'] // Set the color of the labels
      }
    },
    grid: {
      show: true
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return formatNumber(val); //마우스 호버링 툴팁에 표시되는 숫자
        }
      }
    }
});

// chart 1
const lineChart = ref({
  series: []
});

// UTC 시간을 한국 시간으로 변환하는 함수
function convertToKoreanTime(utcTime) {
    const date = new Date(utcTime);
    const offset = 9 * 60; // 한국 시간대 (UTC+9)
    return new Date(date.getTime() + offset * 60 * 1000);
    // return localTime.toISOString().split('T')[0];
}

const getSensorTotalCount = async () => {
  try {
    const result = await $axios.get('/digital-twins/data_count_all');
    // const result = {data :  [
    //     {
    //         "count": "10855516"
    //     }
    // ]}
    if(Array.isArray(result.data) && result.data.length > 0){
      totalCount.value = formatNumber(result.data[0].count);
    } else {
      totalCount.value = 0;
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

// 3개의 ChartOption 만들고
// select 바뀔 때 마다 chartoptions, data 바꾸기
const getSensorWeekData = async () => {
  try {
    const params={from : oneWeekAgo}
    const result = await $axios.get('/digital-twins/data_count', {params});
//     const result = {data: [
//     {
//         "rowtime": "2024-09-16T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "86157"
//     },
//     {
//         "rowtime": "2024-09-17T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "86194"
//     },
//     {
//         "rowtime": "2024-09-18T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "97595"
//     },
//     {
//         "rowtime": "2024-09-19T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "325879"
//     },
//     {
//         "rowtime": "2024-09-20T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "86244"
//     },
//     {
//         "rowtime": "2024-09-21T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "86364"
//     },
//     {
//         "rowtime": "2024-09-22T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "97306"
//     },
//     {
//         "rowtime": "2024-09-23T15:00:00.000Z",
//         "digital_twin_id": "KR-02-K10000-20240001",
//         "count": "8663"
//     }
// ]}
    if(Array.isArray(result.data) && result.data.length > 0){
      // 한국 시간으로 변경
      const localData = result.data.map(item => ({
        ...item,
        rowtime: format(convertToKoreanTime(new Date(item.rowtime)), 'yyyy-MM-dd')
      }));
      const uniqueRowTimes = [...new Set(localData.map(item => item.rowtime))];
      chartOptions.value = {...chartOptions.value, ...{xaxis: {type: 'category', categories: uniqueRowTimes}}}
      // DT grouping
      const groupedData = localData.reduce((acc, { rowtime, digital_twin_id, count }) => {
          if (!acc[digital_twin_id]) {
              acc[digital_twin_id] = {
                  name: digital_twin_id,
                  data: new Array(uniqueRowTimes.length).fill(0)
              };
          }
          const index = uniqueRowTimes.indexOf(rowtime);
          // 날짜별로 count 값을 추가하거나 0으로 채움
           acc[digital_twin_id].data[index] = parseInt(count);
          return acc;
      }, {});
      // 날짜 기준 오름차순으로 정렬된 새로운 배열 생성
      const returnData = Object.values(groupedData).map(item => ({
          name: item.name,
          data: item.data
      }));

      lineChart.value.series =  returnData;
    } else {
      const digital_twins = await $axios.get('/digital-twins');
      let data = digital_twins.data.map(item => {
        return {
            name: item.digital_twin_id,  // 'digital_twin_id'를 'name'으로 설정
            data: [0, 0, 0, 0, 0, 0, 0, 0]  // 기본값으로 0이 채워진 배열 설정
        };
      });
      let startDate = new Date(oneWeekAgo);
      const endDate = new Date(currentDate);
      let uniqueRowTimes = [];
      while (startDate <= endDate) {
        uniqueRowTimes.push(format(startDate, "yyyy-MM-dd"));
        startDate = addDays(startDate, 1); // 하루씩 더하기
      }
      chartOptions.value = {...chartOptions.value, ...{xaxis: {type: 'category', categories: uniqueRowTimes}}}
      lineChart.value.series = data
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
// Helper function to parse date strings and check if a date is within a range
function isDateInRange(date, start, end) {
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
}

const getSensorMonthData = async () => {
  try {
    const params={from: monthWeeks[0].start}
    const result = await $axios.get('/digital-twins/data_count', {params});
    // console.log(result)

    const uniqueRowTimes = [...new Set(monthWeeks.map(item => `${item.start} ~ ${item.end}`))]
    chartOptions.value = {...chartOptions.value, ...{xaxis: {label :  {rotate: -45}, type: 'category', categories: uniqueRowTimes}}}
    
    if(Array.isArray(result.data) && result.data.length > 0){
      // 한국 시간으로 변경
      const localData = result.data.map(item => ({
        ...item,
        rowtime: format(convertToKoreanTime(new Date(item.rowtime)), 'yyyy-MM-dd')
      }));
      // DT grouping
      const groupedData = localData.reduce((acc, { rowtime, digital_twin_id, count }) => {
          if (!acc[digital_twin_id]) {
              acc[digital_twin_id] = {
                  name: digital_twin_id,
                  data: new Array(uniqueRowTimes.length).fill(0)
              };
          }
          monthWeeks.forEach((week, index) =>{
            if(isDateInRange(rowtime, week.start, week.end)){
              acc[digital_twin_id].data[index] += parseInt(count);
            }
          })
          return acc;
      }, {});
      // 날짜 기준 오름차순으로 정렬된 새로운 배열 생성
      const returnData = Object.values(groupedData).map(item => ({
          name: item.name,
          data: item.data
      }));
      lineChart.value.series =  returnData;
    } else {
      const digital_twins = await $axios.get('/digital-twins');
      let data = digital_twins.data.map(item => {
        return {
            name: item.digital_twin_id,  // 'digital_twin_id'를 'name'으로 설정
            data: new Array(uniqueRowTimes.length).fill(0) // 기본값으로 0이 채워진 배열 설정
        };
      });
      lineChart.value.series = data
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
const getSensorYearData = async () => {
  try {
    const params={from: currentYearStart}
    const result = await $axios.get('/digital-twins/data_count', {params});
    // console.log(result)
    const uniqueRowTimes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    chartOptions.value = {...chartOptions.value, ...{xaxis: {type: 'category', categories: uniqueRowTimes}}}

    if(Array.isArray(result.data) && result.data.length > 0){
      // 한국 시간으로 변경
      const localData = result.data.map(item => ({
        ...item,
        rowtime: format(convertToKoreanTime(new Date(item.rowtime)), 'yyyy-MM-dd')
      }));
      
      // DT grouping
      const groupedData = localData.reduce((acc, { rowtime, digital_twin_id, count }) => {
          if (!acc[digital_twin_id]) {
              acc[digital_twin_id] = {
                  name: digital_twin_id,
                  data: new Array(uniqueRowTimes.length).fill(0)
              };
          }
          const month = parseInt(rowtime.split('-')[1]);

           acc[digital_twin_id].data[month-1] += parseInt(count);
          return acc;
      }, {});
      // 날짜 기준 오름차순으로 정렬된 새로운 배열 생성
      const returnData = Object.values(groupedData).map(item => ({
          name: item.name,
          data: item.data
      }));
      lineChart.value.series =  returnData;
    } else {
      const digital_twins = await $axios.get('/digital-twins');
      let data = digital_twins.data.map(item => {
        return {
            name: item.digital_twin_id,  // 'digital_twin_id'를 'name'으로 설정
            data: new Array(uniqueRowTimes.length).fill(0) // 기본값으로 0이 채워진 배열 설정
        };
      });
      lineChart.value.series = data
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

// Function to format number with commas
const formatNumber = (number) => {
  return parseInt(number).toLocaleString();
};

watch (select, (newSelect) =>{
  if(newSelect.abbr == 'FL'){
    getSensorTotalCount();
    getSensorWeekData();
  } else if ( newSelect.abbr == 'GA') {
    getSensorTotalCount();
    getSensorMonthData();
  } else {
    getSensorTotalCount();
    getSensorYearData();
  }
})

onMounted(() => {
  getSensorTotalCount();
  getSensorWeekData();
});


</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="9">
            <span class="text-h text-disabled font-weight-bold">Sensor Data Creation Count</span>
            <h3 class="text-h3 mt-1">{{totalCount}}</h3>
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              color="primary"
              variant="outlined"
              hide-details
              v-model="select"
              :items="items"
              item-title="state"
              item-value="abbr"
              label="Select"
              persistent-hint
              return-object
              single-line
            >
            </v-select>
          </v-col>
        </v-row>
        <div class="mt-4">
          <apexchart  type="bar" height="480" :options="chartOptions" :series="lineChart.series"> </apexchart>
        </div>
      </v-card-text>
    </v-card>
  </v-card>
</template>
