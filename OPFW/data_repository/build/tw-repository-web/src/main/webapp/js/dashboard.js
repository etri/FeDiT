(function($) {
  'use strict';
  $(function() {

    if ($("#audience-chart").length) {
      var AudienceChartCanvas = $("#audience-chart").get(0).getContext("2d");
      var AudienceChart = new Chart(AudienceChartCanvas, {
        type: 'bar',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              type: 'line',
              fill: false,
              data: [100, 230, 130, 140, 270, 140],
              borderColor: '#ff4c5b'
            },
            {
              label: 'Offline Sales',
              data: [100, 230, 340, 340, 260, 340],
              backgroundColor: '#6640b2'
            },
            {
              label: 'Online Sales',
              data: [130, 190, 250, 250, 190, 260],
              backgroundColor: '#1cbccd'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 20,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                display: true,
                drawBorder: false,
                color: "#f8f8f8",
                zeroLineColor: "#f8f8f8"
              },
              ticks: {
                display: true,
                min: 0,
                max: 400,
                stepSize: 100,
                fontColor: "#b1b0b0",
                fontSize: 10,
                padding: 10
              }
            }],
            xAxes: [{
              stacked: false,
              ticks: {
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              barPercentage: .9,
              categoryPercentage: .7,
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 3,
              backgroundColor: '#ff4c5b'
            }
          }
        },
      });
    }

    if ($("#audience-chart-dark").length) {
      var AudienceChartCanvas = $("#audience-chart-dark").get(0).getContext("2d");
      var AudienceChart = new Chart(AudienceChartCanvas, {
        type: 'bar',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              type: 'line',
              fill: false,
              data: [100, 230, 130, 140, 270, 140],
              borderColor: '#ff4c5b'
            },
            {
              label: 'Offline Sales',
              data: [100, 230, 340, 340, 260, 340],
              backgroundColor: '#6640b2'
            },
            {
              label: 'Online Sales',
              data: [130, 190, 250, 250, 190, 260],
              backgroundColor: '#1cbccd'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 20,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                display: true,
                drawBorder: false,
                color: "#33374f",
                zeroLineColor: "#33374f"
              },
              ticks: {
                display: true,
                min: 0,
                max: 400,
                stepSize: 100,
                fontColor: "#b1b0b0",
                fontSize: 10,
                padding: 10
              }
            }],
            xAxes: [{
              stacked: false,
              ticks: {
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              barPercentage: .9,
              categoryPercentage: .7,
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 3,
              backgroundColor: '#ff4c5b'
            }
          }
        },
      });
    }

    if ($("#balance-chart").length) {
      var areaData = {
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu"],
        datasets: [
          {
            data: [2600, 1400, 2200, 1200, 2300, 2400, 2700, 1200, 2800, 2600, 1250, 1900, 1800, 2800, 2800, 1200, 2500, 2600, 1800, 1200, 2000, 1800, 2700, 1600, 2800, 2000, 2100, 1200, 2000, 1200, 1200, 2500],
            borderColor: [
              '#1faf47'
            ],
            borderWidth: 3,
            fill: false,
            label: "services"
          },
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          filler: {
            propagate: false
          }
        },
        scales: {
          xAxes: [{
            display: true,
            ticks: {
              display: false,
            },
            gridLines: {
              display: false,
              drawBorder: false,
              color: 'transparent',
              zeroLineColor: '#eeeeee'
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              display: true,
              autoSkip: false,
              maxRotation: 0,
              stepSize: 100,
              fontColor: "#000",
              fontSize: 14,
              padding: 18,
              stepSize: 1000,
              max: 3000,
              fontSize: 10,
              fontColor: "#b1b0b0",
              callback: function(value) {
                var ranges = [
                    { divider: 1e6, suffix: 'M' },
                    { divider: 1e3, suffix: 'k' }
                ];
                function formatNumber(n) {
                    for (var i = 0; i < ranges.length; i++) {
                      if (n >= ranges[i].divider) {
                          return (n / ranges[i].divider).toString() + ranges[i].suffix;
                      }
                    }
                    return n;
                }
                return formatNumber(value);
              }
            },
            gridLines: {
              drawBorder: false,
              color: "#f8f8f8",
              zeroLineColor: "#f8f8f8"
            }
          }]
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        },
        elements: {
          line: {
            tension: 0
          },
          point: {
            radius: 0
          }
        }
      }
      var balanceChartCanvas = $("#balance-chart").get(0).getContext("2d");
      var balanceChart = new Chart(balanceChartCanvas, {
        type: 'line',
        data: areaData,
        options: areaOptions
      });
    }

    if ($("#balance-chart-dark").length) {
      var areaData = {
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu"],
        datasets: [
          {
            data: [2600, 1400, 2200, 1200, 2300, 2400, 2700, 1200, 2800, 2600, 1250, 1900, 1800, 2800, 2800, 1200, 2500, 2600, 1800, 1200, 2000, 1800, 2700, 1600, 2800, 2000, 2100, 1200, 2000, 1200, 1200, 2500],
            borderColor: [
              '#1faf47'
            ],
            borderWidth: 3,
            fill: false,
            label: "services"
          },
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          filler: {
            propagate: false
          }
        },
        scales: {
          xAxes: [{
            display: true,
            ticks: {
              display: false,
            },
            gridLines: {
              display: false,
              drawBorder: false,
              color: 'transparent',
              zeroLineColor: '#eeeeee'
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              display: true,
              autoSkip: false,
              maxRotation: 0,
              stepSize: 100,
              fontColor: "#000",
              fontSize: 14,
              padding: 18,
              stepSize: 1000,
              max: 3000,
              fontSize: 10,
              fontColor: "#b1b0b0",
              callback: function(value) {
                var ranges = [
                    { divider: 1e6, suffix: 'M' },
                    { divider: 1e3, suffix: 'k' }
                ];
                function formatNumber(n) {
                    for (var i = 0; i < ranges.length; i++) {
                      if (n >= ranges[i].divider) {
                          return (n / ranges[i].divider).toString() + ranges[i].suffix;
                      }
                    }
                    return n;
                }
                return formatNumber(value);
              }
            },
            gridLines: {
              drawBorder: false,
              color: "#33374f",
              zeroLineColor: "#33374f"
            }
          }]
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        },
        elements: {
          line: {
            tension: 0
          },
          point: {
            radius: 0
          }
        }
      }
      var balanceChartCanvas = $("#balance-chart-dark").get(0).getContext("2d");
      var balanceChart = new Chart(balanceChartCanvas, {
        type: 'line',
        data: areaData,
        options: areaOptions
      });
    }

    if ($("#task-chart").length) {
      var taskChartCanvas = $("#task-chart").get(0).getContext("2d");
      var taskChart = new Chart(taskChartCanvas, {
        type: 'bar',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May","Jun", "Jul", "Aug"],
          datasets: [{
              label: 'Profit',
              data: [-3, -5, -5, 3, 4, -5, -1, 9],
              backgroundColor: '#f83e37'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                drawBorder: false,
                color: '#f1f3f9',
                zeroLineColor: '#f1f3f9'
              },
              ticks: {
                display: true,
                fontColor: "#9fa0a2",
                fontSize: 10,
                padding: 0,
                stepSize: 10,
                min: -10,
                max: 10
              }
            }],
            xAxes: [{
              display: false,
              stacked: false,
              categoryPercentage: 1,
              ticks: {
                display: false,
                beginAtZero: false,
                display: true,
                padding: 10,
                fontSize: 11
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              position: 'bottom',
              barPercentage: 0.7
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 0
            }
          }
        }
      });
    }

    if ($("#task-chart-dark").length) {
      var taskChartCanvas = $("#task-chart-dark").get(0).getContext("2d");
      var taskChart = new Chart(taskChartCanvas, {
        type: 'bar',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May","Jun", "Jul", "Aug"],
          datasets: [{
              label: 'Profit',
              data: [-3, -5, -5, 3, 4, -5, -1, 9],
              backgroundColor: '#f83e37'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                drawBorder: false,
                color: '#33374f',
                zeroLineColor: '#33374f'
              },
              ticks: {
                display: true,
                fontColor: "#9fa0a2",
                fontSize: 10,
                padding: 0,
                stepSize: 10,
                min: -10,
                max: 10
              }
            }],
            xAxes: [{
              display: false,
              stacked: false,
              categoryPercentage: 1,
              ticks: {
                display: false,
                beginAtZero: false,
                display: true,
                padding: 10,
                fontSize: 11
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              position: 'bottom',
              barPercentage: 0.7
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 0
            }
          }
        }
      });
    }

    if ($("#regional-chart").length) {
      var regionalChartCanvas = $("#regional-chart").get(0).getContext("2d");
      var regionalChart = new Chart(regionalChartCanvas, {
        type: 'horizontalBar',
        data: {
          labels: ["12", "8", "4", "0"],
          datasets: [
            {
              label: 'Income',
              data: [400, 360, 360, 360],
              backgroundColor: '#1cbccd'
            },
            {
              label: 'Expenses',
              data: [320, 190, 180, 140],
              backgroundColor: '#ffbf36'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: -7,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                display: false,
                drawBorder: false
              },
              ticks: {
                display: true,
                min: 0,
                max: 400,
                stepSize: 100,
                fontColor: "#b1b0b0",
                fontSize: 10,
                padding: 10
              },
              barPercentage: 1,
              categoryPercentage: .6,
            }],
            xAxes: [{
              display: true,
              stacked: false,
              ticks: {
                display: false,
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10
              },
              gridLines: {
                display: true,
                drawBorder: false,
                lineWidth: 1,
                color: "#f5f5f5",
                zeroLineColor: "#f5f5f5"
              }
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 3,
              backgroundColor: '#ff4c5b'
            }
          },
          legendCallback : function(chart) {
            var text = [];
              text.push('<div class="item mr-4 d-flex align-items-center">');
                text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[0].backgroundColor + ' "></div><p class="text-black mb-0"> ' + chart.data.datasets[0].label + '</p>');
              text.push('</div>');
              text.push('<div class="item d-flex align-items-center">');
                text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[1].backgroundColor + '"></div><p class="text-black mb-0"> ' + chart.data.datasets[1].label + ' </p>');
              text.push('</div>');
            return text.join('');
          }
        },
      });
      document.querySelector('#regional-chart-legend').innerHTML = regionalChart.generateLegend();
    }

    if ($("#regional-chart-dark").length) {
      var regionalChartCanvas = $("#regional-chart-dark").get(0).getContext("2d");
      var regionalChart = new Chart(regionalChartCanvas, {
        type: 'horizontalBar',
        data: {
          labels: ["12", "8", "4", "0"],
          datasets: [
            {
              label: 'Income',
              data: [400, 360, 360, 360],
              backgroundColor: '#1cbccd'
            },
            {
              label: 'Expenses',
              data: [320, 190, 180, 140],
              backgroundColor: '#ffbf36'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: -7,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                display: false,
                drawBorder: false
              },
              ticks: {
                display: true,
                min: 0,
                max: 400,
                stepSize: 100,
                fontColor: "#b1b0b0",
                fontSize: 10,
                padding: 10
              },
              barPercentage: 1,
              categoryPercentage: .6,
            }],
            xAxes: [{
              display: true,
              stacked: false,
              ticks: {
                display: false,
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10
              },
              gridLines: {
                display: true,
                drawBorder: false,
                lineWidth: 1,
                color: "#33374f",
                zeroLineColor: "#33374f"
              }
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 3,
              backgroundColor: '#ff4c5b'
            }
          },
          legendCallback : function(chart) {
            var text = [];
              text.push('<div class="item mr-4 d-flex align-items-center">');
                text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[0].backgroundColor + ' "></div><p class="texmb-0"> ' + chart.data.datasets[0].label + '</p>');
              text.push('</div>');
              text.push('<div class="item d-flex align-items-center">');
                text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[1].backgroundColor + '"></div><p class="texmb-0"> ' + chart.data.datasets[1].label + ' </p>');
              text.push('</div>');
            return text.join('');
          }
        },
      });
      document.querySelector('#regional-chart-legend').innerHTML = regionalChart.generateLegend();
    }

    if ($("#activity-chart").length) {
      var activityChartCanvas = $("#activity-chart").get(0).getContext("2d");
      var activityChart = new Chart(activityChartCanvas, {
        type: 'bar',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
          datasets: [{
              label: 'Profit',
              data: [320, 300, 340, 320, 315, 270, 290, 310, 340, 335, 300, 320, 300, 340, 320, 315, 270, 290, 310, 340, 335, 300, 320, 300, 340, 320, 315, 270, 290, 310, 340, 335, 300, 320, 300, 340, 320, 315, 270, 290, 310, 340, 335, 300],
              backgroundColor: '#ffbf36'
            },
            {
              label: 'Target',
              data: [540, 500, 600, 540, 535, 470, 490, 510, 540, 535, 500, 540, 500, 450, 570, 535, 470, 490, 510, 540, 535, 500, 540, 500, 470, 500, 535, 470, 490, 510, 540, 535, 500, 540, 500, 490, 590, 505, 470, 490, 510, 540, 535, 500],
              backgroundColor: '#6640b2'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: false,
              gridLines: {
                display: false,
                drawBorder: false
              },
              ticks: {
                display: false,
                min: 0,
                max: 600,
                stepSize: 100,
                fontColor: "#fff"
              }
            }],
            xAxes: [{
              display: false,
              stacked: true,
              ticks: {
                beginAtZero: true,
                fontColor: "#fff"
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              barPercentage: .8,
              categoryPercentage: .9,
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 0
            }
          }
        }
      });
    }

    if ($("#status-chart").length) {
      var areaData = {
        labels: ["IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ", "CA", "TX", "LA", "PQ", "RF", "JG",     "IA", "RI", "NY", "CO", "MI", "FL", "IL", "PA", "LA", "NJ"],
        datasets: [{
            data: [30,40,34,48,35,43,40,48,38,39,35,45,32,33,28,22,24,23,36,28,31,22,32,27,30,25,36,30,38,34,30,27,30,26,26,18,23,31,18,19,17,19,17,17,14,16,15,17,10,15,9,14,13,20,18,15,12,16,17,14,20,10,19,12,12,16,11,17,15,17,9,8,12,15,10,15,16,20,18,20,18,28,28,33,23,38,20,28,23,24,17,14,21,15,24,11,13,13,19,13,15,18,10,20,22,28],
            backgroundColor: [
              '#00cccb'
            ],
            borderColor: "#00cccb",
            borderWidth: 0,
            fill: 'origin',
            label: "purchases"
          },
          {
            data: [60,70,64,78,65,73,70,78,68,69,65,75,62,63,58,52,54,53,66,58,61,52,62,57,60,55,66,60,68,64,60,57,60,56,56,48,53,61,48,49,47,49,47,47,34,36,35,37,40,35,39,44,43,50,48,45,42,46,37,44,50,40,39,42,32,36,41,47,45,47,39,38,42,45,40,45,46,50,48,50,48,58,58,63,53,68,50,58,53,54,47,44,51,45,54,41,43,43,49,43,45,48,40,50,52,58],
            backgroundColor: [
              '#d8d8d8'
            ],
            borderColor: '#d8d8d8',
            borderWidth: 1,
            fill: 'origin',
            label: "services"
          },
          {
            data: [90, 100, 94, 108, 95, 103, 100, 108, 98 ,99, 95, 105, 92, 93, 88, 82, 84, 83, 96, 88, 91, 82, 92, 87, 90, 85, 96, 90, 98, 94, 90, 87, 90, 86, 86, 78, 83, 91, 78, 79, 77, 79, 77, 77, 64, 66, 65, 67, 70, 65, 69, 74, 73, 80, 78, 75, 72, 76, 67, 74, 80, 70, 69, 72, 62, 66, 71, 77, 75, 77, 69, 68, 72, 75, 70, 75, 76, 80, 78, 80, 78, 88, 88, 93, 83, 98, 80, 88, 83, 84, 77, 74, 81, 75, 84, 71, 73, 73, 79, 73, 75, 78, 70, 80, 82, 88],
            backgroundColor: [
              '#6640b2'
            ],
            borderColor: '#6640b2',
            borderWidth: 1,
            fill: 'origin',
            label: "services"
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          filler: {
            propagate: false
          }
        },
        scales: {
          xAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false,
              drawBorder: false,
              color: 'transparent',
              zeroLineColor: '#eeeeee'
            }
          }],
          yAxes: [{
            display: false,
            ticks: {
              display: false,
              autoSkip: false,
              maxRotation: 0,
              stepSize: 10,
              min: 0,
              max: 110
            },
            gridLines: {
              drawBorder: false
            }
          }]
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        },
        elements: {
          line: {
            tension: 0
          },
          point: {
            radius: 0
          }
        }
      }
      var statusChartCanvas = $("#status-chart").get(0).getContext("2d");
      var statusChart = new Chart(statusChartCanvas, {
        type: 'line',
        data: areaData,
        options: areaOptions
      });
    }

    if ($("#customers-chart").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [75, 25],
            backgroundColor: [
              "#ffbf36","#e2e2e3",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var trafficChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.fontStyle = "bold";
      
          var text = "1277",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var customersChartCanvas = $("#customers-chart").get(0).getContext("2d");
      var customersChart = new Chart(customersChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: trafficChartPlugins
      });
    }

    if ($("#customers-chart-dark").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [75, 25],
            backgroundColor: [
              "#ffbf36","#1f2130",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var trafficChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#b1b1b5";
          ctx.fontStyle = "bold";
      
          var text = "1277",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var customersChartCanvas = $("#customers-chart-dark").get(0).getContext("2d");
      var customersChart = new Chart(customersChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: trafficChartPlugins
      });
    }

    if ($("#comments-chart").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [50, 50],
            backgroundColor: [
              "#1cbccd","#e2e2e3",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var commentChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.fontStyle = "bold";
      
          var text = "17.5K+",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var commentChartCanvas = $("#comments-chart").get(0).getContext("2d");
      var commentChart = new Chart(commentChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: commentChartPlugins
      });
    }

    if ($("#comments-chart-dark").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [50, 50],
            backgroundColor: [
              "#1cbccd","#1f2130",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var commentChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#b1b1b5";
          ctx.fontStyle = "bold";
      
          var text = "17.5K+",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var commentChartCanvas = $("#comments-chart-dark").get(0).getContext("2d");
      var commentChart = new Chart(commentChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: commentChartPlugins
      });
    }

    if ($("#total-sales-chart").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [50, 25],
            backgroundColor: [
              "#e2e2e3","#6640b2",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var totalSalesChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.fontStyle = "bold";
      
          var text = "$2230",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var totalSalesChartCanvas = $("#total-sales-chart").get(0).getContext("2d");
      var totalSalesChart = new Chart(totalSalesChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: totalSalesChartPlugins
      });
    }

    if ($("#total-sales-chart-dark").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [50, 25],
            backgroundColor: [
              "#1f2130","#6640b2",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var totalSalesChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#b1b1b5";
          ctx.fontStyle = "bold";
      
          var text = "$2230",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var totalSalesChartCanvas = $("#total-sales-chart-dark").get(0).getContext("2d");
      var totalSalesChart = new Chart(totalSalesChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: totalSalesChartPlugins
      });
    }

    if ($("#orders-chart").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [30, 80],
            backgroundColor: [
              "#e2e2e3", "#f83e37"
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var ordersChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.fontStyle = "bold";
      
          var text = "816",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var ordersChartCanvas = $("#orders-chart").get(0).getContext("2d");
      var ordersChart = new Chart(ordersChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: ordersChartPlugins
      });
    }

    if ($("#orders-chart-dark").length) {
      var areaData = {
        labels: ["Jan", "Feb"],
        datasets: [{
            data: [30, 80],
            backgroundColor: [
              "#1f2130", "#f83e37"
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 77,
        elements: {
          arc: {
              borderWidth: 0
          }
        },      
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var ordersChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;
      
          ctx.restore();
          var fontSize = 1.5;
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#b1b1b5";
          ctx.fontStyle = "bold";
      
          var text = "816",
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var ordersChartCanvas = $("#orders-chart-dark").get(0).getContext("2d");
      var ordersChart = new Chart(ordersChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: ordersChartPlugins
      });
    }

    if ($('#sales-chart').length) {
      var salesChartCanvas = $("#sales-chart").get(0).getContext("2d");

      var data = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: 'Series A',
            data: [5, 23, 10, 25 , 20, 15],
            borderColor: "#f83e37",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(248, 62, 55, .05)"
          },
          {
            label: 'Series B',
            data: [30, 24, 18, 12, 6 , 0],
            borderColor: "#6640b2",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(102, 64, 178, .2)"
          },
          {
            label: 'Series C',
            data: [10, 13, 20, 40, 5 , 10],
            borderColor: "#1faf47",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(31, 175, 71, .05)"
          }

        ]
      };
      var options = {
        scales: {
          yAxes: [{
            display: true,
            gridLines: {
              drawBorder: false,
              lineWidth: 1,
              color: "#f1f3f9",
              zeroLineColor: "#f1f3f9",
              borderDash: [8, 4]
            },
            ticks: {
              min: 0,
              max: 40,
              stepSize: 10,
              fontColor: "#b1b0b0",
              fontSize: 10,
              fontStyle: 400,
              padding: 5
            }
          }],
          xAxes: [{
            display: true,
            gridLines: {
              display: true,
              drawBorder: false,
              lineWidth: 1,
              color: "#f1f3f9",
              zeroLineColor: "#f1f3f9",
              borderDash: [8, 4]
            },
            ticks : {
              fontColor: "#b1b0b0",
              fontSize: 10,
              fontStyle: 400,
              padding: 5,
            }
          }]
        },
        legend: {
          display: false
        },
        legendCallback : function(chart) {
          var text = [];
          text.push('<div class="d-flex align-items-center justify-content-between flex-wrap mb-2">');
            text.push('<p class="card-title mb-0">Sales statistics</p>');
            text.push('<div class="d-flex sales-statitics mt-md-2 mt-xl-0">');
              text.push('<div class="d-flex align-items-center mr-3">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[0].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[0].label + ' </p>');
              text.push('</div>');
              text.push('<div class="d-flex align-items-center mr-3">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[1].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[1].label + ' </p>');
              text.push('</div>');
              text.push('<div class="d-flex align-items-center">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[2].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[2].label + ' </p>');
              text.push('</div>');
            text.push('</div>');
          text.push('</div>');
          return text.join('');
        },
        elements: {
          point: {
            radius: 0,
          },
          line :{
            tension: .35
          }
        },
        stepsize: 1,
        layout : {
          padding : {
            top: 0,
            bottom : 0,
            left : 0,
            right: 0
          }
        }
      };
      var salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: data,
        options: options
      });
      document.getElementById('sales-legend').innerHTML = salesChart.generateLegend();
    }

    if ($('#sales-chart-dark').length) {
      var salesChartCanvas = $("#sales-chart-dark").get(0).getContext("2d");

      var data = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: 'Series A',
            data: [5, 23, 10, 25 , 20, 15],
            borderColor: "#f83e37",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(248, 62, 55, .05)"
          },
          {
            label: 'Series B',
            data: [30, 24, 18, 12, 6 , 0],
            borderColor: "#6640b2",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(102, 64, 178, .2)"
          },
          {
            label: 'Series C',
            data: [10, 13, 20, 40, 5 , 10],
            borderColor: "#1faf47",
            borderWidth: 2,
            fill: true,
            backgroundColor: "rgba(31, 175, 71, .05)"
          }

        ]
      };
      var options = {
        scales: {
          yAxes: [{
            display: true,
            gridLines: {
              drawBorder: false,
              lineWidth: 1,
              color: "#33374f",
              zeroLineColor: "#33374f",
              borderDash: [8, 4]
            },
            ticks: {
              min: 0,
              max: 40,
              stepSize: 10,
              fontColor: "#b1b0b0",
              fontSize: 10,
              fontStyle: 400,
              padding: 5
            }
          }],
          xAxes: [{
            display: true,
            gridLines: {
              display: true,
              drawBorder: false,
              lineWidth: 1,
              color: "#33374f",
              zeroLineColor: "#33374f",
              borderDash: [8, 4]
            },
            ticks : {
              fontColor: "#b1b0b0",
              fontSize: 10,
              fontStyle: 400,
              padding: 5,
            }
          }]
        },
        legend: {
          display: false
        },
        legendCallback : function(chart) {
          var text = [];
          text.push('<div class="d-flex align-items-center justify-content-between flex-wrap mb-2">');
            text.push('<p class="card-title mb-0">Sales statistics</p>');
            text.push('<div class="d-flex sales-statitics mt-md-2 mt-xl-0">');
              text.push('<div class="d-flex align-items-center mr-3">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[0].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[0].label + ' </p>');
              text.push('</div>');
              text.push('<div class="d-flex align-items-center mr-3">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[1].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[1].label + ' </p>');
              text.push('</div>');
              text.push('<div class="d-flex align-items-center">');
                text.push('<div class="color-circle mr-2" style="border-color: ' + chart.data.datasets[2].borderColor + '"></div>');
                text.push('<p class="mb-0"> ' + chart.data.datasets[2].label + ' </p>');
              text.push('</div>');
            text.push('</div>');
          text.push('</div>');
          return text.join('');
        },
        elements: {
          point: {
            radius: 0,
          },
          line :{
            tension: .35
          }
        },
        stepsize: 1,
        layout : {
          padding : {
            top: 0,
            bottom : 0,
            left : 0,
            right: 0
          }
        }
      };
      var salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: data,
        options: options
      });
      document.getElementById('sales-legend').innerHTML = salesChart.generateLegend();
    }

    if ($("#sellers-chart").length) {
      var sellersChartCanvas = $("#sellers-chart").get(0).getContext("2d");
      var sellersChart = new Chart(sellersChartCanvas, {
        type: 'bar',
        data: {
          labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11","12"],
          datasets: [{
              label: 'Income',
              data: [18, 33, 25, 18, 15, 29, 15, 8, 22, 34, 26, 17],
              backgroundColor: '#826af9'
            },
            {
              label: 'Loss',
              data: [24, 37, 29, 20, 17, 32, 20, 10, 26, 36, 28, 20],
              backgroundColor: '#cfc5ff'
            }
          ]
        },
        options: {
          responsive: true,
          barRoundness: 1,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 20,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                drawBorder: false,
                lineWidth: 1,
                color: "#f1f3f9",
                zeroLineColor: "#f1f3f9",
              },
              ticks: {
                min: 0,
                max: 40,
                stepSize: 10,
                fontColor: "#b1b0b0",
                fontSize: 10,
                fontStyle: 400,
                padding: 5

              }
            }],
            xAxes: [{
              stacked: true,
              ticks: {
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10,
                fontStyle: 400,
              },
              gridLines: {
                display: false
              },
              barPercentage: 0.6,
              categoryPercentage: .2
            }]
          },
          legend: {
            display: false
          },
          legendCallback : function(chart) {
            var text = [];
            text.push('<div class="d-flex align-items-center justify-content-between mb-2">');
              text.push('<p class="card-title mb-0">Best Sellers</p>');
              text.push('<div class="d-flex sales-statitics">');
                text.push('<div class="d-flex align-items-center mr-3">');
                  text.push('<div class="item-box mr-2" style="background-color: ' + chart.data.datasets[0].backgroundColor + '"></div>');
                  text.push('<p class="mb-0"> ' + chart.data.datasets[0].label + ' </p>');
                text.push('</div>');
                text.push('<div class="d-flex align-items-center mr-3">');
                  text.push('<div class="item-box mr-2" style="background-color: ' + chart.data.datasets[1].backgroundColor + '"></div>');
                  text.push('<p class="mb-0"> ' + chart.data.datasets[1].label + ' </p>');
                text.push('</div>');
              text.push('</div>');
            text.push('</div>');
            return text.join('');
          },
          elements: {
            point: {
              radius: 0
            }
          }
        }
      });
      document.querySelector('#seller-legend').innerHTML = sellersChart.generateLegend();
    }

    if ($("#sellers-chart-dark").length) {
      var sellersChartCanvas = $("#sellers-chart-dark").get(0).getContext("2d");
      var sellersChart = new Chart(sellersChartCanvas, {
        type: 'bar',
        data: {
          labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11","12"],
          datasets: [{
              label: 'Income',
              data: [18, 33, 25, 18, 15, 29, 15, 8, 22, 34, 26, 17],
              backgroundColor: '#826af9'
            },
            {
              label: 'Loss',
              data: [24, 37, 29, 20, 17, 32, 20, 10, 26, 36, 28, 20],
              backgroundColor: '#cfc5ff'
            }
          ]
        },
        options: {
          responsive: true,
          barRoundness: 1,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 20,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                drawBorder: false,
                lineWidth: 1,
                color: "#33374f",
                zeroLineColor: "#33374f",
              },
              ticks: {
                min: 0,
                max: 40,
                stepSize: 10,
                fontColor: "#b1b0b0",
                fontSize: 10,
                fontStyle: 400,
                padding: 5

              }
            }],
            xAxes: [{
              stacked: true,
              ticks: {
                beginAtZero: true,
                fontColor: "#b1b0b0",
                fontSize: 10,
                fontStyle: 400,
              },
              gridLines: {
                display: false
              },
              barPercentage: 0.6,
              categoryPercentage: .2
            }]
          },
          legend: {
            display: false
          },
          legendCallback : function(chart) {
            var text = [];
            text.push('<div class="d-flex align-items-center justify-content-between mb-2">');
              text.push('<p class="card-title mb-0">Best Sellers</p>');
              text.push('<div class="d-flex sales-statitics">');
                text.push('<div class="d-flex align-items-center mr-3">');
                  text.push('<div class="item-box mr-2" style="background-color: ' + chart.data.datasets[0].backgroundColor + '"></div>');
                  text.push('<p class="mb-0"> ' + chart.data.datasets[0].label + ' </p>');
                text.push('</div>');
                text.push('<div class="d-flex align-items-center mr-3">');
                  text.push('<div class="item-box mr-2" style="background-color: ' + chart.data.datasets[1].backgroundColor + '"></div>');
                  text.push('<p class="mb-0"> ' + chart.data.datasets[1].label + ' </p>');
                text.push('</div>');
              text.push('</div>');
            text.push('</div>');
            return text.join('');
          },
          elements: {
            point: {
              radius: 0
            }
          }
        }
      });
      document.querySelector('#seller-legend').innerHTML = sellersChart.generateLegend();
    }

    if ($('#reports-chart').length) {
      var salesChartCanvas = $("#reports-chart").get(0).getContext("2d");

      var data = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: 'Series C',
            data: [20,30, 13, 38, 38, 28],
            borderColor: "#1cbccd",
            borderWidth: 0,
            fill: true,
            backgroundColor: "rgba(28, 188, 205, .8)"
          },
          {
            label: 'Series A',
            data: [20,42, 8, 58, 23 , 32],
            borderColor: "#f83e37",
            borderWidth: 0,
            fill: true,
            backgroundColor: "#f83e37"
          }
        ]
      };
      var options = {
        scales: {
          yAxes: [{
            display: true,
            gridLines: {
              drawBorder: false,
              lineWidth: 1,
              color: "#f1f3f9",
              zeroLineColor: "#f1f3f9",
            },
            ticks: {
              display: false,
              min: 0,
              max: 60,
              stepSize: 10
            }
          }],
          xAxes: [{
            display: false,
            gridLines: {
              display: false
            },
            ticks : {
            }
          }]
        },
        legend: {
          display: false
        },
        elements: {
          point: {
            radius: 0,
          },
          line :{
            tension: .35
          }
        },
        stepsize: 1,
        layout : {
          padding : {
            top: 0,
            bottom : 0,
            left : -10,
            right: 0
          }
        }
      };
      var salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: data,
        options: options
      });
    }

    if ($('#reports-chart-dark').length) {
      var salesChartCanvas = $("#reports-chart-dark").get(0).getContext("2d");

      var data = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: 'Series C',
            data: [20,30, 13, 38, 38, 28],
            borderColor: "rgba(28, 188, 205, .6)",
            borderWidth: 0,
            fill: true,
            backgroundColor: "rgba(28, 188, 205, .6)"
          },
          {
            label: 'Series A',
            data: [20,42, 8, 58, 23 , 32],
            borderColor: "#f83e37",
            borderWidth: 0,
            fill: true,
            backgroundColor: "#f83e37"
          }
        ]
      };
      var options = {
        scales: {
          yAxes: [{
            display: true,
            gridLines: {
              drawBorder: false,
              lineWidth: 1,
              color: "#33374f",
              zeroLineColor: "#33374f",
            },
            ticks: {
              display: false,
              min: 0,
              max: 60,
              stepSize: 10
            }
          }],
          xAxes: [{
            display: false,
            gridLines: {
              display: false
            },
            ticks : {
            }
          }]
        },
        legend: {
          display: false
        },
        elements: {
          point: {
            radius: 0,
          },
          line :{
            tension: .35
          }
        },
        stepsize: 1,
        layout : {
          padding : {
            top: 0,
            bottom : 0,
            left : -10,
            right: 0
          }
        }
      };
      var salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: data,
        options: options
      });
    }
    
    
  });
})(jQuery);