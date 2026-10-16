<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ props.medataSetId }} {{ props.medataSetNm }}</h3>
      </div>
      <!-- horizental timestamp -->
      <div class="boxCnt">
        <div class="mb15">
          <div class="horizontalWrap">
            <el-text>before 선택</el-text>
            <vue-horizontal v-if="state.jsonMeasurementlist.length > 0" responsive>
              <section v-for="(item, index) in state.jsonMeasurementlist" :key="index">
                <el-tag class="custom-tag" effect="plain" type="info"
                  @click="handleBeforeTagClick(item)">
                  <h3 :class="{ 'custom-tag selected-time-text' : selectedBeforeTimeJson.time === item.time }" >
                    {{ item.time }}
                  </h3>
                </el-tag>
              </section>
            </vue-horizontal>

            <div v-else> 
              <el-row  :gutter="20">
                <el-col :span="11">
                <el-input
                  style="width: 240px"
                  disabled
                  placeholder="No Data"
                />
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <div class="mb20">
          <div class="horizontalWrap">
            <el-text>after 선택</el-text>
            <vue-horizontal v-if="state.jsonMeasurementlist.length > 0" responsive class="horizontal">
              <section v-for="item in state.jsonMeasurementlist" :key="item.time">
                <el-tag class="custom-tag" effect="plain" type="info" :checked="true"
                  @click="handleAfterTagClick(item)">
                  <h3 :class="{ 'custom-tag selected-time-text' : selectedAfterTimeJson.time === item.time }">
                    {{ item.time }}
                  </h3>
                </el-tag>
              </section>
            </vue-horizontal>
            
            <div v-else> 
              <el-row  :gutter="20">
                <el-col :span="11">
                <el-input
                  style="width: 240px"
                  disabled
                  placeholder="No Data"
                />
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
        <div class="ly-table">
          <el-form label-width="120px" label-position="right">
            <el-row class="timeLists" v-if="state.jsonMeasurementlist.length > 1">
              <el-col class="beforeT">
                <el-form-item label="before time">{{ selectedBeforeTimeJson.time }}</el-form-item>
              </el-col>
              <el-col class="afterT">
                <el-form-item label="after time">{{ selectedAfterTimeJson.time }}</el-form-item>
              </el-col>
            </el-row>
            <el-row class="timeLists" v-else-if="state.jsonMeasurementlist.length == 1">
              <el-col :span="12" class="afterT">
                <el-form-item label="after time">{{ selectedAfterTimeJson.time }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="state.jsonMeasurementlist.length > 1">
          <CodeDiff
            :language="'json'"
            :old-string="formattedOldString" 
            :new-string="formattedNewString" 
            :output-format="codeDiffOutputFormat" 
            :filename="selectedBeforeTimeJson.time" 
            :newFilename="selectedAfterTimeJson.time"
            :theme="'light'"
            diffStyle="word" />
        </div>

        <div class="mt20" v-else-if="state.jsonMeasurementlist.length == 1">
          <JsonEditorVue class="dialog_jsonEditor_setting" 
          v-model="formattedNewJson" 
          v-bind="{
            readOnly: true,
            mode: 'text',
            theme: 'light',
            mainMenuBar: false,
            navigationBar: false,
            parser: undefined,
          }" 
          />
        </div>

      </div>
    </div>
  </div>
</template>
<script setup>
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { CodeDiff } from 'v-code-diff'
import VueHorizontal from "vue-horizontal";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const props = defineProps({
  medataSetId: {
    type: Object,
    required: true,
  },
  medataSetNm: {
    type: String,
    required: false
  }
});

const selectedBeforeTimeJson = ref({});
const selectedAfterTimeJson = ref({});

const formattedOldString = computed(() => {
  return parseInfluxValueFormattedStr(selectedBeforeTimeJson.value.value);
});

const formattedNewString = computed(() => {
  return parseInfluxValueFormattedStr(selectedAfterTimeJson.value.value);
});

const formattedNewJson = computed(() => {
  return parseInfluxValue(selectedAfterTimeJson.value.value);
});

const state = reactive({
  jsonMeasurementlist: [],
  timeList: []
});

const codeDiffOutputFormat = ref('side-by-side');

onMounted(() => {
  getJsonMeasurementListBySetId();
});

const getJsonMeasurementListBySetId = () => {
  $axios
    .get(util.format($apiUrls.meta.datastore.influxdb.getJsonMeasurementBySetId, props.medataSetId), {
      params: {
        isPaging: false,
        srchStartDd: '',
        srchEndDd: '',
        sortOrder: 'descending' // 시간순 내림차순 정렬
      }
    })
    .then((res) => {
      state.jsonMeasurementlist = [ ...res.data.list ];
      initSelectedValue([ ...res.data.list ]);
    })
    .catch((err) => {
      console.log(err);
    });
};

watch(
  props.medataSetId, 
  (newValue, oldValue) => {
    getJsonMeasurementListBySetId();
  },
);

const initSelectedValue = (jsonMeasurementlist) => {
  if (jsonMeasurementlist != null && jsonMeasurementlist.length > 1) {
    selectedAfterTimeJson.value =  jsonMeasurementlist[0];
    selectedBeforeTimeJson.value = jsonMeasurementlist[1];
  } else if (jsonMeasurementlist.length == 1) {
    selectedAfterTimeJson.value =  jsonMeasurementlist[0];
    selectedBeforeTimeJson.value =  jsonMeasurementlist[0];
  }
};

const timeValidate = (beforeTime, afterTime) => {
  let parsedBeforeTime = new Date(beforeTime);
  let parsedAfterTime = new Date(afterTime);
  if (parsedBeforeTime > parsedAfterTime) {
    return false;
  } else if (parsedBeforeTime <= parsedAfterTime) {
    return true;
  }
  return false;
};

const handleBeforeTagClick = (item) => {
  if (false == timeValidate(item.time, selectedAfterTimeJson.value.time)) {
    alert('afterTime 은 beforeTime보다 이후의 시간이어야 합니다.');
    return;
  }
  selectedBeforeTimeJson.value = item;
};

const handleAfterTagClick = (item) => {
  if (false == timeValidate(selectedBeforeTimeJson.value.time, item.time)) {
    alert('afterTime 은 beforeTime보다 이후의 시간이어야 합니다.');
    return;
  }
  selectedAfterTimeJson.value = item;
};

/**
 * Influx DB 에서 조회한 JSON string 을 parsing 하는 함수.
 * @param {string} rawValue - Influx DB에서 조회한, \ 로 escaped된 JSON 문자열.
 * @returns {string} - outer JSON, 필요 시 내부 중첩된 JSON 문자열을 포함해 모두 객체 형태로 변환한 후, 다시 JSON 문자열 반환.
 * 
*/
const parseInfluxValueFormattedStr = (rawValue) => {
  let obj;
  try {
    obj = JSON.parse(rawValue);
  } catch (err) {
    console.error('[parseInfluxValueFormattedStr] Outer JSON parse failed:', err);
    return '{}';
  }

  // 중첩 JSON 문자열만 골라서 파싱
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      const s = val.trim();
      if (s.startsWith('{') && s.endsWith('}')) {
        try {
          obj[key] = JSON.parse(s);
        } catch {
          // 파싱 실패 시 원래 문자열 유지
        }
      }
    }
  }
  return JSON.stringify(obj, null, 4);
};

/**
 * Influx DB 에서 조회한 JSON string 을 parsing 하는 함수.
 * @param {string} rawValue
 *  Influx DB에서 조회한, \ 로 escaped된 JSON 문자열.
 * @returns {Object}
 *  outer JSON, 필요 시 내부 중첩된 JSON 문자열을 포함해 모두 객체 형태로 변환한 obj.
 * 
*/
const parseInfluxValue = (rawValue) => {
  let obj;
  try {
    obj = JSON.parse(rawValue);
  } catch (err) {
    console.error('[parseInfluxValue] Outer JSON parse failed:', err);
    return {};
  }

  // 중첩 JSON 문자열만 골라서 파싱
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      const s = val.trim();
      if (s.startsWith('{') && s.endsWith('}')) {
        try {
          obj[key] = JSON.parse(s);
        } catch {
          // 파싱 실패 시 원래 문자열 유지
        }
      }
    }
  }
  return obj;
};

</script>
<style lang="scss" scoped>
.custom-tag {
  overflow:hidden;
  display:flex;
  align-items: center;
  justify-content: center;
  width: 194px;
  height: 34px;
  font-size: 14px;
  padding: 12px;
  margin:0 10px;
  border-radius: 5px;
  border-color:#eaeef6;
  transition:all .4s;
  cursor: pointer;
  .el-tag__content{
    h3{
      font-weight:normal;
    }
  }
  &:hover{
    font-weight:bold;
    background-color:rgba(8, 162, 183, 0.1);
    transition:all .4s;
  }
  .selected-time-text{
    text-align:center;
    font-size:12px;
    font-weight:bold;
    color:#555;
    background-color:rgba(8, 162, 183, 0.1);
  }
}
.horizontalWrap{  
  display:flex;
  .el-text{
    width:auto;
    min-width:100px;
  }
  .vue-horizontal {
    width:100%;
    min-width:500px;
    max-width:1120px;
    // margin-left:10px;
    // padding:0 10px;
  }
  .vue-horizontal ::v-deep(.v-hl-btn){
    top:-4px !important;
    padding-bottom:0 !important;
    margin-bottom:0 !important;
    min-height:40px !important;
    clip-path:none !important;
    background-color:transparent !important;
    svg{
      border-radius: 0 !important;
      margin: 0 !important;
      padding: 8px !important;
      height: 100% !important;
      color:#555 !important;
      box-shadow: none !important;
      background: none !important;
    }
  }
}
.timeLists{
  width:100%;
  display:flex;
  border-top:1px dashed #ccc;
  .afterT,.beforeT{
    flex:1;
    //padding:0 290px 0 0;
    box-sizing:border-box;
    .el-form-item{
      display:flex;
      align-items: center;
      position:relative;
      left:0;
      bottom:-9px;
      font-weight:600;
      color:#000;
      background-color:#eee;
      border-left: 2px solid #000;
    }
  }
}
</style>