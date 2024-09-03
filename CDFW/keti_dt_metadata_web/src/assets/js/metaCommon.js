// --------------------------------------------------
// meta 플랫폼 공통 js
// --------------------------------------------------

import router from '@/router';
import { routerPush } from '@/assets/js/common.js';

/**
 * 공개 리소스 페이지 새 창에서 보여주기
 * @param {*} medataSetId 
 */
const showMetadataResourcePage = (medataSetId) => {
  if (medataSetId) {
    const url = window.location.origin + "/meta/resource/page/" + medataSetId;
    window.open(url, "winMetadataResourcePage");
  }
}

/**
 * 공개 ketidt turtle info 페이지 새 창에서 보여주기
 */
const showKetidtInfoPage = () => {
  const url = window.location.origin + "/meta/ns/digitaltwin#";
  window.open(url, "winKetidtInfoPage");
}

/**
 * 공개 ketidtskos turtle info 페이지 새 창에서 보여주기
 */
const showKetidtskosInfoPage = () => {
  const url = window.location.origin + "/meta/skos/digitaltwin#";
  window.open(url, "winKetidtskosInfoPage");
}

/**
 * 메타데이터 정보 JSON 파일 다운로드
 * @param {*} publicMedataSetInfo, medataSetNm
 */
const downloadMetadataFile = (publicMedataSetInfo, medataSetNm) => {
  const text = JSON.stringify(publicMedataSetInfo, null, 2);
  const filename = medataSetNm;
  const element = document.createElement("a");
  const extension = ".json";
  const mediaType = "application/json";

  element.setAttribute("href", "data:" + mediaType + ";charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename + extension);
  document.body.appendChild(element);
  element.click();
}

/**
 * RDF 정보 파일 다운로드
 * @param {*} rdfStr, mtcd, fileName
 */
const downloadRdfFile = (rdfStr, mtcd, fileName) => {
  const text = rdfStr;
  const writeType = mtcd;
  const element = document.createElement("a");

  let extension = ".txt";
  let mediaType = "text/plain";

  if (writeType == "xml" || writeType == "xml_abbrev") {
    extension = ".rdf";
    mediaType = "application/rdf+xml";
  }
  if (writeType == "turtle" || writeType == "turtle_flat") {
    extension = ".ttl";
    mediaType = "text/turtle";
  }
  if (writeType == "n_triple") {
    extension = ".nt";
    mediaType = "application/n-triples";
  }
  if (writeType == "n3") {
    extension = ".n3";
    mediaType = "text/n3";
  }
  if (writeType == "json_ld") {
    extension = ".jsonld";
    mediaType = "application/ld+json";
  }
  if (writeType == "json") {
    extension = ".json";
    mediaType = "application/json";
  }

  element.setAttribute("href", "data:" + mediaType + ";charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", fileName + extension);
  document.body.appendChild(element);
  element.click();
}


const Buttons = {
  metadataResourcePage : {
    label: "메타데이터 한번에 보기",
    click: showMetadataResourcePage
  },
  ketidtInfoPage : {
    label: "디지털트윈 네임스페이스 정의 보기",
    click: showKetidtInfoPage
  },
  ketidtskosInfoPage : {
    label: "디지털트윈 카테고리 개념 정의 보기",
    click: showKetidtskosInfoPage
  },
  metadataFileDownload : {
    label: "다운로드", // 메타데이터 파일 다운로드
    click: downloadMetadataFile
  }
}

//router에 등록한 페이지명
// [managePageNameArr] 관리용 메뉴 (디지털트윈 관리 상세, 메타데이터 관리 상세)
// [retrievalPageNameArr] 검색용 메뉴 (디지털트윈 검색, 메타데이터셋 검색, 메타데이터 검색)
// [externalPageNameArr] 외부제공용 메타데이터 통합 검색
// [intgrdataPageNameArr] 메타데이터 통합 검색
const managePageNameArr = ['DigitalTwinDetailManagePage', 'MetadataDetailManagePage'];
const retrievalPageNameArr = ['RetrievalMetadataSetPage', 'RetrievalDigitalTwinDatasetPage', 'RetrievalMetadataPage'];
const externalPageNameArr =  ['ExSearchListPage', 'ExMetadataPage'];
const intgrdataPageNameArr =  ['IntgrdataListPage', 'IntgrdataPage'];

/**
 * 디지털 트윈 상세 (관리/조회) 페이지로 이동
 * @param { medataSetId 이동 대상 ID
 *          backPageName 관리/조회 페이지 구분
 *        }
 * @returns 
 */
const goToDigitalTwinManagePage = ({medataSetId, backPageName}) => {
  if (!medataSetId) {
    console.log('goToDigitalTwinManagePage : medataSetId 가 없습니다!');
    return;
  }

  goToMetadataManagePage({
    medataSetId: medataSetId,
    typeModelId: 'DigitalTwin',
    backPageName: backPageName
  });
};

/**
 * 메타데이터 셋 상세 (관리/조회) 페이지로 이동
 * @param { medataSetId 이동 대상 ID
 *          typeModelId 이동 대상 유형 모델 ID
 *          backPageName 관리/조회 페이지 구분
 *        }
 * @returns 
 */
const goToMetadataManagePage = ({medataSetId, typeModelId, backPageName}) => {
  if (!medataSetId) {
    console.log('goToMetadataManagePage : medataSetId 가 없습니다!');
    return;
  }

  //let platform = getCookie("pltfrmId");
  let platform = 'meta';
  let query = { medataSetId: medataSetId };

  if (!backPageName) backPageName = 'RetrievalMetadataSetPage'; // 기본값

  if ('DigitalTwin' === typeModelId) {

    if (managePageNameArr.includes(backPageName)) { //관리용 메뉴 (디지털트윈 관리 상세)
      routerPush(platform, "DigitalTwinDetailManagePage", query);
    } else if (retrievalPageNameArr.includes(backPageName)) { //검색용 메뉴 (디지털트윈 셋조회 상세)
      routerPush(platform, "RetrievalDigitalTwinDatasetPage", query);
//    } else if (externalPageNameArr.includes(backPageName)) { //외부제공용 메타데이터 통합 검색
//      router.push({path: `/meta/exsearch/page/${medataSetId}`});
//    } else if (intgrdataPageNameArr.includes(backPageName)) { //메타데이터 통합 검색
//      router.push({path: `/meta/search/intgrdata/page/${medataSetId}`});
    } else { // 메타데이터 통합 검색 (외부제공용, 메타데이터 통합 검색 상세)
      router.push({ name: platform + "_" + backPageName, params: query });
    }

  } else {

    if (managePageNameArr.includes(backPageName)) { //관리용 메뉴 (메타데이터셋 관리 상세)
      routerPush(platform, "MetadataDetailManagePage", query);
    } else if (retrievalPageNameArr.includes(backPageName)) { //검색용 메뉴 (메타데이터셋 셋조회 상세)
      routerPush(platform, "RetrievalMetadataSetPage", query);
//    } else if (externalPageNameArr.includes(backPageName)) { //외부제공용 메타데이터 통합 검색
//      router.push({path: `/meta/exsearch/page/${medataSetId}`});
//    } else if (intgrdataPageNameArr.includes(backPageName)) { //메타데이터 통합 검색
//       router.push({path: `/meta/search/intgrdata/page/${medataSetId}`});
    } else { // 메타데이터 통합 검색 (외부제공용, 메타데이터 통합 검색 상세)
      router.push({ name: platform + "_" + backPageName, params: query });
    }

  }
};

// ----------------------------------------------------------------
// Kakao Map Api 관련

// 카카오 맵 API 존재 여부 확인
const existKakaoMapApi = () =>{
  if (!window.kakao || !window.kakao.maps) {
    console.error('Kakao Map API is not loaded.');
    return false;
  } else {
    return true;
  }
}

// 지도 생성
const createKakaoMapWithGeo = (mapId, geometryObj) => {
  // console.log(`createKakaoMapWithGeo --------- mapId: ${mapId} type: ${geometryObj.type}`);
  if (!existKakaoMapApi()) return null;

  const mapContainer = document.getElementById(mapId);
  let bounds = null;
  let mapOptions = { 
    center: new kakao.maps.LatLng(33.450701, 126.570667),  // 지도 중심 좌표
    level: 5   // 지도 확대 레벨 (MapTypeId - ROADMAP:일반지도 - 1 ~ 14)
  };

  if (geometryObj) {
    switch(geometryObj.type) {
      case "Point": {
          const lat = geometryObj.coordinates[1];
          const lng = geometryObj.coordinates[0];
          mapOptions = {
            center: new kakao.maps.LatLng(lat, lng),
            level: 2,
          };
        }
        break;

      case "MultiPoint": {
          const lat = geometryObj.coordinates[0][1];
          const lng = geometryObj.coordinates[0][0];			
          const { centerLat, centerLng, minLat, maxLat, minLng, maxLng } = calcLatLng(geometryObj.coordinates, lat, lat, lng, lng);
          mapOptions = {
            center: new kakao.maps.LatLng(centerLat, centerLng),
            level: 5,
          };			
          bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(minLat, minLng),
            new kakao.maps.LatLng(maxLat, maxLng)
          );
        }
        break;

      case "LineString": {
          const lat = geometryObj.coordinates[0][1];
          const lng = geometryObj.coordinates[0][0];			
          const { centerLat, centerLng, minLat, maxLat, minLng, maxLng } = calcLatLng(geometryObj.coordinates, lat, lat, lng, lng);
          mapOptions = {
            center: new kakao.maps.LatLng(centerLat, centerLng),
            level: 5,
          };			
          bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(minLat, minLng),
            new kakao.maps.LatLng(maxLat, maxLng)
          );
        }
        break;

      case "MultiLineString": {
          const lat = geometryObj.coordinates[0][0][1];
          const lng = geometryObj.coordinates[0][0][0];
          const opts = { centerLat: lat, centerLng: lng, minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
          for (let coordinates of geometryObj.coordinates) {
            let calcObj = calcLatLng(coordinates, opts.minLat, opts.maxLat, opts.minLng, opts.maxLng);
            Object.assign(opts, calcObj);
          }
          mapOptions = {
            center: new kakao.maps.LatLng(opts.centerLat, opts.centerLng),
            level: 5,
          };			
          bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(opts.minLat, opts.minLng),
            new kakao.maps.LatLng(opts.maxLat, opts.maxLng)
          );          
        }
        break;

      case "Polygon": {
          const lat = geometryObj.coordinates[0][0][1];
          const lng = geometryObj.coordinates[0][0][0];
          const opts = { centerLat: lat, centerLng: lng, minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
          for (let coordinates of geometryObj.coordinates) {
            let calcObj = calcLatLng(coordinates, opts.minLat, opts.maxLat, opts.minLng, opts.maxLng);
            Object.assign(opts, calcObj);
          }
          mapOptions = {
            center: new kakao.maps.LatLng(opts.centerLat, opts.centerLng),
            level: 5,
          };			
          bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(opts.minLat, opts.minLng),
            new kakao.maps.LatLng(opts.maxLat, opts.maxLng)
          );          
        }
        break;

      case "MultiPolygon": {
          const lat = geometryObj.coordinates[0][0][0][1];
          const lng = geometryObj.coordinates[0][0][0][0];
          const opts = { centerLat: lat, centerLng: lng, minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
          for (let polygonPath of geometryObj.coordinates) {
            for (let coordinates of polygonPath) {
              let calcObj = calcLatLng(coordinates, opts.minLat, opts.maxLat, opts.minLng, opts.maxLng);
              Object.assign(opts, calcObj);
            }
          }
          mapOptions = {
            center: new kakao.maps.LatLng(opts.centerLat, opts.centerLng),
            level: 5,
          };			
          bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(opts.minLat, opts.minLng),
            new kakao.maps.LatLng(opts.maxLat, opts.maxLng)
          );          
        }
        break;

      default:
        console.log(`createKakaoMapWithGeo : geometry type: ${geometryObj.type} 정의되지 않음!`);
        break;
    }
  }

  const map = new kakao.maps.Map(mapContainer, mapOptions);
  if (bounds) {
    map.setBounds(bounds); // 바운드에 맞게 지도 이동
  }
  return map;	
}

// 중심 좌표, 경계 좌표 계산
const calcLatLng = (coordinates, minLat, maxLat, minLng, maxLng) => {
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const lat = coordinate[1];
    const lng = coordinate[0];
    if (minLat > lat) minLat = lat;
    if (maxLat < lat) maxLat = lat;
    if (minLng > lng) minLng = lng;
    if (maxLng < lng) maxLng = lng;
  }
  // console.log(`calcLatLng --------- min: ${minLat}, ${minLng}  max: ${maxLat}, ${maxLng}`);

  const centerLat = (maxLat + minLat) / 2;
  const centerLng = (maxLng + minLng) / 2;
  // console.log(`calcLatLng --------- center: ${centerLat}, ${centerLng}`);

  return {
    centerLat: centerLat,
    centerLng: centerLng,
    minLat: minLat,
    maxLat: maxLat,
    minLng: minLng,
    maxLng: maxLng
  };
}

// 도형 지우기
const clearShapes = (shapesMap, shapesId) => {
  // console.log(`clearShapes --------- shapesId: ${shapesId}`);
  const shapes = shapesMap.get(shapesId);
  // console.log('clear shapes', shapes);
  if (Array.isArray(shapes)) {
    for (let shape of shapes) {
      shape.setMap(null); // 지도에서 제거
    }
  } else {
    shapes.setMap(null); // 지도에서 제거
  }
  shapesMap.delete(shapesId);
}

// 도형 그리기
const drawShapesOnMap = (map, shapesMap, shapesId, geometryObj) => {
  // console.log(`drawShapesOnMap --------- type: ${geometryObj.type}  shapesId: ${shapesId}`);
  switch(geometryObj.type) {
    case "Point": // "{"type":"Point","coordinates":[126.620537765085,33.2501096216477]}"
      const lat = geometryObj.coordinates[1];
      const lng = geometryObj.coordinates[0];
      const point = drawPoint(map, lat, lng);
      shapesMap.set(shapesId, point);
      break;

    case "MultiPoint": // {"type":"MultiPoint","coordinates":[[126.532371,33.500116],[126.500055,33.48863],[126.4746922,33.4838002],[126.162165,33.292471]]}
      const points = [];
      for (let coordinate of geometryObj.coordinates) {
        const lat = coordinate[1];
        const lng = coordinate[0];
        const point = drawPoint(map, lat, lng);
        points.push(point);
      }
      shapesMap.set(shapesId, points);
      break;

    case "LineString": // {"type":"LineString","coordinates":[[126.92408,37.49124],[126.92401,37.49101],[126.92307,37.49075]]}
      const polyline = drawPolyline(map, geometryObj.coordinates);
      shapesMap.set(shapesId, polyline);
      break;

    case "MultiLineString": // {"type":"MultiLineString","coordinates":[[[126.92408,37.49124],[126.92401,37.49101],[126.92307,37.49075]],[[126.92408,37.49124],[126.9251,37.49103]]]}
      const polylines = [];
      for (let coordinates of geometryObj.coordinates) {
        const polyline = drawPolyline(map, coordinates);
        polylines.push(polyline);
      }
      shapesMap.set(shapesId, polylines);
      break;

    case "Polygon": // {"type":"Polygon","coordinates":[[[126.0, 33.0],[126.0, 38.6],[135.1, 38.6],[135.1, 33.0],[126.0, 33.0]]]}
      const polygon = drawPolygon(map, geometryObj.coordinates);
      shapesMap.set(shapesId, polygon);
      break;

    case "MultiPolygon": // {"type":"MultiPolygon","coordinates":[[[[102.0,2.0],[103.0,2.0],[103.0,3.0],[102.0,3.0],[102.0,2.0]]],[[[100.0,0.0],[101.0,0.0],[101.0,1.0],[100.0,1.0],[100.0,0.0]],[[100.2,0.2],[100.8,0.2], [100.8,0.8], [100.2,0.8], [100.2,0.2]]]]}
      const polygons = [];
      for (let coordinates of geometryObj.coordinates) {
        const polygon = drawPolygon(map, coordinates);
        polygons.push(polygon);
      }
      shapesMap.set(shapesId, polygons);
      break;

    default:
      console.log(`drawShapesOnMap : geometry type: ${geometryObj.type} 정의되지 않음!`);
      break;
  }
}

/*
  zoomLevel 0 ~ 14
  표기 / 축척
  10m / 1:475
  20m / 1:950
  30m / 1:1,900
  50m / 1:3,800
  100m / 1:7,600
  250m / 1:15,200
  500m / 1:30,400
  1km / 1:60,800
  2km / 1:121,600
  4km / 1:243,200
  8km / 1:486,400
  16km / 1:972,800
  32km / 1:1,945,600
  64km / 1:3,891,200
  128km / 1:7,782,400
*/
const KAKAOMAP_SCALE_ARR = [10, 20, 30, 50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000];
const SHAPE_STROKE_COLOR = '#528FDB';
const SHAPE_FILL_COLOR = '#7DA5D7';

// 점(원) 그리기
const drawPoint = (map, lat, lng) => {
  // {"type":"Point","coordinates":[126.620537765085,33.2501096216477]}
  const zoomLevel = map.getLevel();
  const radiusSize = KAKAOMAP_SCALE_ARR[zoomLevel] / 10;

  // 지도에 표시할 원을 생성합니다
  var circle = new kakao.maps.Circle({
    center : new kakao.maps.LatLng(lat, lng),  // 원의 중심좌표 입니다 
    radius: radiusSize, // 미터 단위의 원의 반지름입니다 
    strokeWeight: 2, // 선의 두께입니다 
    strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔입니다
    strokeOpacity: 0.9, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: 'solid', // 선의 스타일 입니다
    fillColor: SHAPE_FILL_COLOR, // 채우기 색깔입니다
    fillOpacity: 0.5  // 채우기 불투명도 입니다   
  }); 

  // 지도에 원을 표시합니다 
  circle.setMap(map);
  return circle;
}

// 선 그리기 (Polyline)
const drawPolyline = (map, coordinates) => {
  // {"type":"LineString","coordinates":[[126.92408,37.49124],[126.92401,37.49101],[126.92307,37.49075]]}
  // console.log(`drawPolyline coordinates: `, coordinates);
  let linePath = [];

  // 선을 구성하는 좌표 배열입니다. 이 좌표들을 이어서 선을 표시합니다
  for (let coordinate of coordinates) {
    const lat = coordinate[1];
    const lng = coordinate[0];
    const coord = new kakao.maps.LatLng(lat, lng);
    linePath.push(coord);
  }

  // 지도에 표시할 선을 생성합니다
  var polyline = new kakao.maps.Polyline({
    path: linePath, // 선을 구성하는 좌표배열 입니다
    strokeWeight: 2, // 선의 두께 입니다
    strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔입니다
    strokeOpacity: 0.9, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: 'solid' // 선의 스타일입니다
  });

  // 지도에 선을 표시합니다 
  polyline.setMap(map);
  return polyline;
}

// 다각형 그리기
const drawPolygon = (map, coordinates) => {
  // {"type": "Polygon","coordinates": [[[126.0, 33.0],[126.0, 38.6],[135.1, 38.6],[135.1, 33.0],[126.0, 33.0]]]}
  // console.log(`drawPolygon coordinates: `, coordinates);
  let polygonPath = [];
  const outlinePath = [];
  const holePath = [];

  // 다각형을 구성하는 좌표 배열입니다. 이 좌표들을 이어서 다각형을 표시합니다
  for (let coordinate of coordinates[0]) {
    const lat = coordinate[1];
    const lng = coordinate[0];
    const coord = new kakao.maps.LatLng(lat, lng);
    outlinePath.push(coord);
  }
  if (coordinates.length > 1) {
    for (let coordinate of coordinates[1]) {
      const lat = coordinate[1];
      const lng = coordinate[0];
      const coord = new kakao.maps.LatLng(lat, lng);
      holePath.push(coord);
    }
  }
  
  if (holePath.length > 0) {
    polygonPath = [outlinePath, holePath];
  } else {
    polygonPath = [outlinePath];
  }

  // 지도에 표시할 다각형을 생성합니다
  var polygon = new kakao.maps.Polygon({
    path: polygonPath, // 그려질 다각형의 좌표 배열입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: SHAPE_STROKE_COLOR, // 선의 색깔입니다
    strokeOpacity: 0.9, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: 'solid', // 선의 스타일입니다
    fillColor: SHAPE_FILL_COLOR, // 채우기 색깔입니다
    fillOpacity: 0.5 // 채우기 불투명도 입니다
  });

  // 지도에 다각형을 표시합니다
  polygon.setMap(map);
  return polygon;
}

export default {
  Buttons,
  downloadRdfFile,
  goToDigitalTwinManagePage,
  goToMetadataManagePage,
  existKakaoMapApi,
  createKakaoMapWithGeo,
  clearShapes,
  drawShapesOnMap,
}




