<template>
  <!-- 지도 범위 검색 -->
  <div class="dialog-area">

    <!-- 주소 검색 -->
    <!-- 
		<div class="boxLayout">
      <div class="boxTit">
        <h3>주소 검색</h3>
        <div class="btnSec taR">
          <el-button type="primary" @click="getAddressSearch()">검색</el-button>
        </div>
      </div>
      <div class="boxCnt">
        <el-form :inline="true" :model="state.pageInfo" class="demo-form-inline search-form" label-width="200px" label-position="left">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="주소">
                <el-input v-model="state.pageInfo.address" placeholder="주소 입력" style="max-width:100%"
                  @keydown.enter.prevent="getAddressSearch()" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
     -->

    <!-- 지도 -->
    <div class="boxLayout">
      <div class="boxTit">
        <h3>지도 범위 검색</h3>
        <div class="btnSec taR">
          <el-button type="default" @click="mapRefresh()">초기화</el-button>
          <el-button type="primary" @click="mapSelectComplate()">선택 완료</el-button>
        </div>
      </div>
      <div class="boxCnt">
        <div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="유형">
                <el-radio-group v-model="state.selectType">
                  <el-radio-button label="polygon">범위</el-radio-button>
                  <el-radio-button label="circle">반경</el-radio-button>
                  <el-radio-button label="text">직접 입력</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="지도 위치 이동">
                <el-select v-model="state.location" @change="chgLocation()">
                  <el-option value="" label="지역 선택"></el-option>
                  <el-option value="서울특별시" label="서울특별시"></el-option>
                  <el-option value="부산광역시" label="부산광역시"></el-option>
                  <el-option value="대구광역시" label="대구광역시"></el-option>
                  <el-option value="인천광역시" label="인천광역시"></el-option>
                  <el-option value="광주광역시" label="광주광역시"></el-option>
                  <el-option value="대전광역시" label="대전광역시"></el-option>
                  <el-option value="울산광역시" label="울산광역시"></el-option>
                  <el-option value="세종특별자치시" label="세종특별자치시"></el-option>
                  <el-option value="경기도" label="경기도"></el-option>
                  <el-option value="강원특별자치도" label="강원특별자치도"></el-option>
                  <el-option value="충청북도" label="충청북도"></el-option>
                  <el-option value="충청남도" label="충청남도"></el-option>
                  <el-option value="전북특별자치도" label="전북특별자치도"></el-option>
                  <el-option value="전라남도" label="전라남도"></el-option>
                  <el-option value="경상북도" label="경상북도"></el-option>
                  <el-option value="경상남도" label="경상남도"></el-option>
                  <el-option value="제주특별자치도" label="제주특별자치도"></el-option>
                </el-select>
                <el-input class="ml10" v-model="state.pageInfo.address" placeholder="주소나 지역명을 입력 후 적용하면 해당 위치로 지도가 이동됩니다." style="max-width:50%"
                  @keydown.enter.prevent="getAddressSearch()" />
                  <el-button class="ml10" type="primary" @click="getAddressSearch()">적용</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <span v-if="state.selectType == 'polygon'">※ 지도를 좌클릭하여 2차원 도형으로 범위를 선택해주세요.</span>
        <span v-if="state.selectType == 'circle'">※ 지도를 좌클릭 후 마우스를 이동하여 반경을 설정하고 우클릭하여 반경을 선택해주세요.</span>
        <div v-if="state.selectType == 'text'">
          <span>※ (다중)다각형의 좌표를 입력 후 형식 확인을 진행해 주세요. 경도(-180 ~ 180), 위도(-90 ~ 90)</span>
          <p class="mt10">예시) MULTIPOLYGON (((126.53 33.5, 126.53 33.58, 126.73 33.58, 126.73 33.5, 126.53 33.5), (126.61 33.544, 126.61 33.555, 126.73 33.555, 126.73 33.555, 126.61 33.544)), ((126.53 33.5, 126.53 33.44, 126.63 33.44, 126.53 33.5)))</p>
          <div class="spaceInput">
            <el-input type="textarea" v-model="state.geoData" placeholder="" />
            <el-button type="default" @click="formatChk">형식 확인</el-button>
          </div>
        </div>
        <div id="map" style="width:100%;height:500px;margin-top:5px;"></div> <!-- 스타일은 임시 적용 -->
      </div>
    </div>
  </div>
</template>
<script setup>
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";
import metaCommon from "@/assets/js/metaCommon.js";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);

// const shapesMap = ref(new Map()); // Map
const shapesMap = new Map();
const SHAPE_STROKE_COLOR = '#528FDB';
const SHAPE_FILL_COLOR = '#7DA5D7';
var currentPolygon = null;
var drawingFlag = false; // 원이 그려지고 있는 상태를 가지고 있을 변수입니다
var centerPosition; // 원의 중심좌표 입니다
var drawingCircle; // 그려지고 있는 원을 표시할 원 객체입니다
var drawingLine; // 그려지고 있는 원의 반지름을 표시할 선 객체입니다
var drawingOverlay; // 그려지고 있는 원의 반경을 표시할 커스텀오버레이 입니다
var drawingDot; // 그려지고 있는 원의 중심점을 표시할 커스텀오버레이 입니다
var circles = []; // 클릭으로 그려진 원과 반경 정보를 표시하는 선과 커스텀오버레이를 가지고 있을 배열입니다
const polygonSearchIcon = ref('icon-down');
const polygonSearch = ref(false);

const state = reactive({
  map: {},
  selectType: "polygon",
  pageInfo: {
    address: ""
  },
  latlngs: [],
  wktPolygon: "",
  geoData:"",
  location: ""
});

const props = defineProps({
  dialogCnt: {
    type: Number,
    required: true
  },
});

onMounted(() => {
  mapInfo();
});

watch(() => state.selectType, () => {
  mapRefresh();
  state.wktPolygon = "";
});

watch(() => props.dialogCnt, () => {
  mapRefresh();
  state.selectType = "polygon";
  state.pageInfo.address = "";
});

const mapInfo = () => {
  // 지도 초기 set
  let lat = "36.350556922518145";
  let lng = "127.38483493545483";
  let center;
  let level = 13;
  
  try{
    center = state.map.getCenter();
    lat = center.getLat();
    lng = center.getLng();
    level = state.map.getLevel();
  }
  catch(e){}

  var mapContainer = document.getElementById('map'), 
  mapOption = { 
    center: new kakao.maps.LatLng(lat, lng),
    level: level
  };  
  
  state.map = new kakao.maps.Map(mapContainer, mapOption);

  // 지도 로드 이상현상 방지
  setTimeout(() => {
    state.map.relayout();
    state.map.setCenter(new kakao.maps.LatLng(lat, lng));
  }, 0);


  // 범위 선택
  if(state.selectType == "polygon"){
    kakao.maps.event.addListener(state.map, 'click', function(mouseEvent) {
      state.wktPolygon = "";

      // 클릭한 위치의 좌표값 push
      var latlng = mouseEvent.latLng;
      state.latlngs.push(new kakao.maps.LatLng(latlng.getLat(), latlng.getLng()));
      var polygonPath = state.latlngs;
      
      // 기존에 그려진 도형 지우기
      if (currentPolygon) {
        currentPolygon.setMap(null);
      }
  
      // 도형 그리기
      currentPolygon = new kakao.maps.Polygon({
        path: polygonPath, // 그려질 다각형의 좌표 배열
        strokeWeight: 2, // 선의 두께
        strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔
        strokeOpacity: 0.8, // 선의 불투명도
        strokeStyle: 'solid', // 선의 스타일
        fillColor: SHAPE_FILL_COLOR, // 채우기 색깔
        fillOpacity: 0.5 // 채우기 불투명도
      });
      
      currentPolygon.setMap(state.map);

      // WKT로 변환
      state.wktPolygon = polygonToWKT(state.latlngs);
      console.log("WKT Polygon: ", state.wktPolygon);
    });
  }

  // 반경 선택
  if(state.selectType == "circle") {
    kakao.maps.event.addListener(state.map, 'click', function(mouseEvent) {
      state.wktPolygon = "";

      // 이전에 그려진 원이 있으면 삭제
      for (var i = 0; i < circles.length; i++) {
        circles[i].circle.setMap(null);    
        circles[i].polyline.setMap(null);
        circles[i].overlay.setMap(null);
        drawingCircle = null;
        drawingLine = null;
        drawingOverlay = null;
      }         
      circles = [];

      if (!drawingFlag) {    
        // 상태를 그리고있는 상태로 변경합니다 
        drawingFlag = true; 
        
        // 원이 그려질 중심좌표를 클릭한 위치로 설정합니다 
        centerPosition = mouseEvent.latLng; 
  
        // 그려지고 있는 원의 반경을 표시할 선 객체를 생성합니다
        if (!drawingLine) {
            drawingLine = new kakao.maps.Polyline({
                strokeWeight: 3, // 선의 두께입니다
                strokeColor: '#00a0e9', // 선의 색깔입니다
                strokeOpacity: 1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                strokeStyle: 'solid' // 선의 스타일입니다
            });    
        }
        
        // 그려지고 있는 원을 표시할 원 객체를 생성합니다
        if (!drawingCircle) {                    
            drawingCircle = new kakao.maps.Circle({ 
                strokeWeight: 1, // 선의 두께입니다
                strokeColor: '#00a0e9', // 선의 색깔입니다
                strokeOpacity: 0.1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                strokeStyle: 'solid', // 선의 스타일입니다
                fillColor: '#00a0e9', // 채우기 색깔입니다
                fillOpacity: 0.2 // 채우기 불투명도입니다 
            });     
        }
        
        // 그려지고 있는 원의 반경 정보를 표시할 커스텀오버레이를 생성합니다
        if (!drawingOverlay) {
            drawingOverlay = new kakao.maps.CustomOverlay({
                xAnchor: 0,
                yAnchor: 0,
                zIndex: 1
            });              
        }
      }
    });

    // 지도에 마우스무브 이벤트를 등록합니다
    // 원을 그리고있는 상태에서 마우스무브 이벤트가 발생하면 그려질 원의 위치와 반경정보를 동적으로 보여주도록 합니다
    kakao.maps.event.addListener(state.map, 'mousemove', function (mouseEvent) {
        // 마우스무브 이벤트가 발생했을 때 원을 그리고있는 상태이면
        if (drawingFlag) {
  
          // 마우스 커서의 현재 위치를 얻어옵니다 
          var mousePosition = mouseEvent.latLng; 
          
          // 그려지고 있는 선을 표시할 좌표 배열입니다. 클릭한 중심좌표와 마우스커서의 위치로 설정합니다
          var linePath = [centerPosition, mousePosition];     
          
          // 그려지고 있는 선을 표시할 선 객체에 좌표 배열을 설정합니다
          drawingLine.setPath(linePath);
          
          // 원의 반지름을 선 객체를 이용해서 얻어옵니다 
          var length = drawingLine.getLength();
          
          if(length > 0) {
              
              // 그려지고 있는 원의 중심좌표와 반지름입니다
              var circleOptions = { 
                  center : centerPosition, 
              radius: length,                 
              };
              
              // 그려지고 있는 원의 옵션을 설정합니다
              drawingCircle.setOptions(circleOptions); 
                  
              // 반경 정보를 표시할 커스텀오버레이의 내용입니다
              var radius = Math.round(drawingCircle.getRadius()),   
              content = '<div class="info">반경 <span class="number">' + radius + '</span>m</div>';
              
              // 반경 정보를 표시할 커스텀 오버레이의 좌표를 마우스커서 위치로 설정합니다
              drawingOverlay.setPosition(mousePosition);
              
              // 반경 정보를 표시할 커스텀 오버레이의 표시할 내용을 설정합니다
              drawingOverlay.setContent(content);
              
              // 그려지고 있는 원을 지도에 표시합니다
              drawingCircle.setMap(state.map); 
              
              // 그려지고 있는 선을 지도에 표시합니다
              drawingLine.setMap(state.map);  
              
              // 그려지고 있는 원의 반경정보 커스텀 오버레이를 지도에 표시합니다
              drawingOverlay.setMap(state.map);
              
          } else { 
              
              drawingCircle.setMap(null);
              drawingLine.setMap(null);    
              drawingOverlay.setMap(null);
              
          }
        }     
    });  

    kakao.maps.event.addListener(state.map, 'rightclick', function (mouseEvent) {
      if (drawingFlag) {
        // 마우스로 오른쪽 클릭한 위치입니다 
        var rClickPosition = mouseEvent.latLng; 

        // 원의 반경을 표시할 선 객체를 생성합니다
        var polyline = new kakao.maps.Polyline({
            path: [centerPosition, rClickPosition], // 선을 구성하는 좌표 배열입니다. 원의 중심좌표와 클릭한 위치로 설정합니다
            strokeWeight: 3, // 선의 두께 입니다
            strokeColor: '#00a0e9', // 선의 색깔입니다
            strokeOpacity: 1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
            strokeStyle: 'solid' // 선의 스타일입니다
        });
        
        // 원 객체를 생성합니다
        var circle = new kakao.maps.Circle({ 
            center : centerPosition, // 원의 중심좌표입니다
            radius: polyline.getLength(), // 원의 반지름입니다 m 단위 이며 선 객체를 이용해서 얻어옵니다
            strokeWeight: 1, // 선의 두께입니다
            strokeColor: '#00a0e9', // 선의 색깔입니다
            strokeOpacity: 0.1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
            strokeStyle: 'solid', // 선의 스타일입니다
            fillColor: '#00a0e9', // 채우기 색깔입니다
            fillOpacity: 0.2  // 채우기 불투명도입니다 
        });
        
        var radius = Math.round(circle.getRadius()), // 원의 반경 정보를 얻어옵니다
            content = ""; // 커스텀 오버레이에 표시할 반경 정보입니다

        
        // 반경정보를 표시할 커스텀 오버레이를 생성합니다
        var radiusOverlay = new kakao.maps.CustomOverlay({
            content: content, // 표시할 내용입니다
            position: rClickPosition, // 표시할 위치입니다. 클릭한 위치로 설정합니다
            xAnchor: 0,
            yAnchor: 0,
            zIndex: 1 
        });  

        // 원을 지도에 표시합니다
        circle.setMap(state.map); 
        
        // 선을 지도에 표시합니다
        polyline.setMap(state.map);
        
        // 반경 정보 커스텀 오버레이를 지도에 표시합니다
        radiusOverlay.setMap(state.map);
        
        // 배열에 담을 객체입니다. 원, 선, 커스텀오버레이 객체를 가지고 있습니다
        var radiusObj = {
            'polyline' : polyline,
            'circle' : circle,
            'overlay' : radiusOverlay
        };
        
        // 배열에 추가합니다
        // 이 배열을 이용해서 "모두 지우기" 버튼을 클릭했을 때 지도에 그려진 원, 선, 커스텀오버레이들을 지웁니다
        circles.push(radiusObj);
        
        // 중심 좌표와 반경으로 WKT 변환
        state.wktPolygon = circleToWKT(centerPosition, radius);
        console.log("WKT Polygon: ", state.wktPolygon);

        // 그리기 상태를 그리고 있지 않는 상태로 바꿉니다
        drawingFlag = false;
        
        // 중심 좌표를 초기화 합니다  
        centerPosition = null;
        
        // 그려지고 있는 원, 선, 커스텀오버레이를 지도에서 제거합니다
        drawingCircle.setMap(null);
        drawingLine.setMap(null);   
        drawingOverlay.setMap(null);
      }
    });    
  }
  

  
};
  

const getAddressSearch = () => {
  // 검색한 주소 좌표 가져오기
  var geocoder = new kakao.maps.services.Geocoder();
  geocoder.addressSearch(state.pageInfo.address, function(result, status) {

    if (status === kakao.maps.services.Status.OK) {

        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);

        // 검색한 위치 마커
        var marker = new kakao.maps.Marker({
            map: state.map,
            position: coords
        });

        // 검색한 위치 말풍선
        var infowindow = new kakao.maps.InfoWindow({
              content: '<div style="width:150px;text-align:center;padding:6px 0;">' + state.pageInfo.address + '</div>'
          });
          infowindow.open(state.map, marker);

          state.map.setCenter(coords);
          state.map.setLevel(7);
    } 
  });   
};


const mapSelectComplate = () => {
  emits("wktPolygon", state.wktPolygon);
};

const mapRefresh = () => {
  mapInfo();
  mapInfo();
  state.latlngs = [];
  state.wktPolygon = "";
	state.geoData = "";
  polygonSearch.value = false;
  polygonSearchIcon.value = 'icon-down';
  state.location = "";
  state.pageInfo.address = "";
};

const circleToWKT = (center, radius, numPoints = 64) => {
  let wktPolygon = "POLYGON((";
  let points = [];
  const earthRadius = 6371000; // 지구의 반경 (미터 단위)

  // LatLng 의 내부 필드(.Ma/.La)는 카카오 SDK 배포마다 이름이 바뀌어 NaN 이 된다. 정식 API 로 꺼낸다.
  const centerLat = center.getLat();
  const centerLng = center.getLng();

  for (let i = 0; i <= numPoints; i++) {
    let angle = (i / numPoints) * 2 * Math.PI;
    let dx = radius * Math.cos(angle);
    let dy = radius * Math.sin(angle);

    let deltaLng = (dx / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    let deltaLat = (dy / earthRadius) * (180 / Math.PI);

    let pointLat = centerLat + deltaLat;
    let pointLng = centerLng + deltaLng;

    points.push(`${pointLng} ${pointLat}`);
  }

  wktPolygon += points.join(", ");
  wktPolygon += "))";

  return wktPolygon;
};

const polygonToWKT = (latlngs) => {
  let wktPolygon = "POLYGON((";
  let points = [];

  // 좌표 배열을 순회하면서 WKT 형식의 문자열로 변환
  latlngs.forEach(latlng => {
    let lat = latlng.getLat();
    let lng = latlng.getLng();
    points.push(`${lng} ${lat}`);
  });

  // 폴리곤은 닫혀야 하므로 첫 번째 좌표를 마지막에 다시 추가
  let firstPoint = `${latlngs[0].getLng()} ${latlngs[0].getLat()}`;
  points.push(firstPoint);

  wktPolygon += points.join(", ");
  wktPolygon += "))";

  return wktPolygon;
};

const formatChk = () => {
  if (!state.geoData) {
      alert('WKT(Well-Known Text) POLYGON 또는 MULTIPOLYGON 정보를 입력해주세요.');
      return;
  }

	const wktPattern = /^(POLYGON|MULTIPOLYGON)\s*\((.*)\)$/i;
  let geoData = state.geoData.replace(/\s*(\r\n|\n|\r)\s*/gm, '').replace(/\s+/g, ' ').trim();

  if (wktPattern.test(geoData)) {
    isGeom(geoData);
    geomType(geoData);
  } else {
      alert("WKT POLYGON 또는 MULTIPOLYGON 형식이 잘못되었습니다.");
  }
};

const isGeom = (geoData) => {
	$axios
		.get($apiUrls.publicpage.meta.search.metadata.geometryValidate, {
			params: {
				polygon: geoData
			},
		})
		.then((res) => {
			if(res.data) {
				state.wktPolygon = geoData;
			}
			else {
				alert("WKT POLYGON 또는 MULTIPOLYGON 형식이 잘못되었습니다.");
				return;
			}
		})
		.catch((err) => {
			console.log(err);
			alert('형식 확인 중 오류가 발생했습니다.');
			return;
		});
};

const clickSearchBtn = () => {
	if(polygonSearch.value) {
		polygonSearch.value = false;
		polygonSearchIcon.value = 'icon-down';
	}
	else {
		polygonSearch.value = true;
		polygonSearchIcon.value = 'icon-up';
	}
};

const geomType = (geoData) => {
  console.log(geoData);
  if (geoData.toLowerCase().includes("multipolygon")) {
    const coordinates = parseMultiPolygon(geoData);
    if (coordinates) {
      drawMultiPolygonOnMap(coordinates);
    }
  }
  else {
    const coordinates = parsePolygon(geoData);
    if (coordinates) {
      drawPolygonOnMap(coordinates);
    }
  } 
};

const parsePolygon = (wkt) => {
  const polygonPattern = /POLYGON\s*\(\(\s*(.*?)\s*\)\)/i;
  const match = wkt.match(polygonPattern);
  if (match && match[1]) {
    const coordStrings = match[1].split(',');
    return coordStrings.map(coord => {
      const [lng, lat] = coord.trim().split(' ');
      return [parseFloat(lng), parseFloat(lat)];
    });
  }
  alert('잘못된 POLYGON 형식입니다.');
  return null;
};

const parseMultiPolygon = (wkt) => {
  const multiPolygonPattern = /MULTIPOLYGON\s*\(\(\((.*)\)\)\)/i;
  const match = wkt.match(multiPolygonPattern);

  if (match && match[1]) {
    // 다중 폴리곤을 분리하여 각 폴리곤 좌표 그룹을 배열로 변환
    const polygons = match[1].split(/\)\s*\)\s*,\s*\(\s*\(/); // 다중 폴리곤을 구분
    return polygons.map(polygon => {
      // 각 폴리곤 내의 좌표들을 분리
      const rings = polygon.split(/\)\s*,\s*\(/); // 각 링을 구분
      return rings.map(ring => {
        // 각 링 내의 좌표 분리
        const coordStrings = ring.split(',');
        return coordStrings.map(coord => {
          const coords = coord.trim().split(/\s+/); // 좌표를 공백으로 구분
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);

          // 경도(lng) 또는 위도(lat)가 NaN일 경우 [null, null]로 처리
          if (isNaN(lng) || isNaN(lat)) {
            console.log('Invalid coordinate:', coord);  // 디버깅용 로그
            return [null, null];
          }
          return [lng, lat];
        });
      });
    });
  }

  alert('잘못된 MULTIPOLYGON 형식입니다.');
  return null;
};




const drawPolygonOnMap = (coordinates) => {
  console.log('POLYGON 좌표:', coordinates);
  for(let i=0; i<coordinates.length; i++) {
    state.latlngs.push(new kakao.maps.LatLng(coordinates[i][1], coordinates[i][0]));
  }
  var polygonPath = state.latlngs;
  // 기존에 그려진 도형 지우기
  if (currentPolygon) {
    // currentPolygon = null;
    mapInfo();
  }

  // 도형 그리기
  currentPolygon = new kakao.maps.Polygon({
    path: polygonPath, // 그려질 다각형의 좌표 배열
    strokeWeight: 2, // 선의 두께
    strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔
    strokeOpacity: 0.8, // 선의 불투명도
    strokeStyle: 'solid', // 선의 스타일
    fillColor: SHAPE_FILL_COLOR, // 채우기 색깔
    fillOpacity: 0.5 // 채우기 불투명도
  });
  
  currentPolygon.setMap(state.map);
};

const drawMultiPolygonOnMap = (coordinates) => {
  console.log('MULTIPOLYGON 좌표:', coordinates);
  
  // 기존에 그려진 모든 도형 지우기
  if (currentPolygon) {
    // currentPolygon = null;
    mapInfo();
  }
  currentPolygon = [];

  // MULTIPOLYGON의 각 폴리곤 처리
  coordinates.forEach(polygonCoordinates => {
    const paths = [];

    polygonCoordinates.forEach(ring => {
      const latlngs = ring.map(coord => new kakao.maps.LatLng(coord[1], coord[0]));
      paths.push(latlngs);
    });

    const polygon = new kakao.maps.Polygon({
      path: paths, // 그려질 다각형의 좌표 배열 (외곽 및 내부 링 포함)
      strokeWeight: 2, // 선의 두께
      strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔
      strokeOpacity: 0.8, // 선의 불투명도
      strokeStyle: 'solid', // 선의 스타일
      fillColor: SHAPE_FILL_COLOR, // 채우기 색깔
      fillOpacity: 0.5 // 채우기 불투명도
    });

    polygon.setMap(state.map);
    currentPolygon.push(polygon); // 현재 그려진 폴리곤 저장
  });
};

const chgLocation = () => {
  state.pageInfo.address = JSON.parse(JSON.stringify(state.location)) + " "; 
};



</script>
<style lang="scss">
  .spaceInput{
    display: grid;
    margin-top: 5px;
    > button.el-button{
      margin-top: 1px;
    }
  }
</style>