<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ props.medataSetId }}</h3> <el-button type="primary" @click="goToDiffDialog">diff</el-button>
      </div>
      <div class="boxCnt">
        <div class="mb15">
          <JsonEditorVue class="dialog_jsonEditor_setting" v-model="metadataRevisionInfo" v-bind="{
            readOnly: true,
            mode: 'text',
            theme: 'light',
            mainMenuBar: false,
            navigationBar: false,
            parser: undefined,
          }" />
        </div>
      </div>

      <el-dialog v-model="dialogVisibleDiff" title="diff" :key="diffDialogKey">
        <MetadataDiffDialog :medataSetId="props.medataSetId" :medataSetNm="''" />
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import MetadataDiffDialog from "@/components/meta/dataset/MetadataDiffDialog.vue";

import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, watch, onMounted } from "vue";
import { nowTimestamp } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const props = defineProps({
  medataSetId: {
    type: Object,
    required: true,
  },
  time: {
    type: String,
    required: true
  }
});

const metadataRevisionInfo = ref({});

onMounted(() => {
  getJsonMeasurementBySetIdAndTimestamp();
});

const getJsonMeasurementBySetIdAndTimestamp = () => {
  $axios
    .get(
      util.format(
        $apiUrls.meta.datastore.influxdb.getJsonMeasurementBySetIdAndTimestamp, props.medataSetId, props.time),
      { params: {} })
    .then((res) => {
      if (res.data) {
        metadataRevisionInfo.value = parseInfluxValue(res.data.value);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
watch(
  [() => props.medataSetId, () => props.time], 
  ([newMedataSetId, newTime], [oldMedataSetId, oldTime]) => {
    if (newMedataSetId !== oldMedataSetId || newTime !== oldTime) {
      getJsonMeasurementBySetIdAndTimestamp();
    }
  }
);

const dialogVisibleDiff = ref(false);
const diffDialogKey = ref('');
const goToDiffDialog = () => {
  dialogVisibleDiff.value = true;
  diffDialogKey.value = nowTimestamp();
};


/**
 * Influx DB 에서 조회한 JSON string 을 parsing 하는 함수.
 * @param {string} rawValue - Influx DB에서 조회한, \ 로 escaped된 JSON 문자열.
 * @returns {Object} - outer JSON, 필요 시 내부 중첩된 JSON 문자열을 포함해 모두 객체 형태로 변환한 obj.
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
<style lang="scss"></style>