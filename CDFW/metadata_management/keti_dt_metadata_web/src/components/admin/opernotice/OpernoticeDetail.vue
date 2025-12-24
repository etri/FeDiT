<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="(notice, fileList)">
      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="번호">{{ notice.ntfOid }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="조회수">{{ notice.retvNum == null ? 0 :  notice.retvNum }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록자">{{ notice.regrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록일시">{{ notice.regDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정자">{{ notice.amdrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정일시">{{ notice.amdDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="구분">
            <el-radio-group v-model="notice.typeNtcTF" class="ml-4" disabled>
              <el-radio label="1">공지사항</el-radio>
              <el-radio label="2">메인화면 팝업</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="공지대상 포탈">
            <el-radio-group v-model="notice.ntcOperTF" class="ml-4" disabled>
              <el-radio label="1"> IoT 플랫폼 관리포탈</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="notice.typeNtcTF == '1'">
        <el-row>
          <el-col :span="20" :xs="24">
            <el-form-item label="우선 공지여부">
              <el-checkbox
                disabled
                label="항상 목록의 최상위에 표시 됩니다."
                name="prevNtf"
                v-model="notice.prevNtf"
              ></el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-if="notice.typeNtcTF == '2'">
        <el-row>
          <el-col :span="20" :xs="24">
            <el-form-item label="팝업 사이즈">
              <span>가로 :</span>{{ notice.popupWdth }} px
              <span style="margin-left: 10px"> 세로 : </span>
              {{ notice.popupHght }} px
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="20" :xs="24">
            <el-form-item label="팝업 기간">
              {{ notice.popupStDt }} ~ {{ notice.popupFnsDt }}
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="20" :xs="24">
            <el-form-item label="팝업 옵션">
              <el-row>
                <el-col :span="10" :xs="24">
                  <el-checkbox
                    label="* 닫기 버튼 표시 여부"
                    v-model="notice.clsButtIndc"
                    disabled
                  ></el-checkbox>
                </el-col>
                <el-col :span="7" :xs="24">
                  <el-checkbox
                    label="* [오늘 하루 이창을 열지 않음] 표시 여부"
                    v-model="notice.todayPopupIndc"
                    disabled
                  ></el-checkbox>
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="제목">{{ notice.ntfTitle }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="내용">
            <p v-html="notice.ntfSbst"></p>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="첨부파일">
            <ul v-if="fileList.length == 0" class="fileList">
              <span> 첨부파일이 없습니다.</span>
            </ul>
            <ul v-else class="fileList">
              <li v-for="file in fileList">
                <a
                  class="download"
                  @click="downloadFile(file)"
                  title="파일 다운로드"
                  >{{ file.fileOriginNm }}</a
                >
              </li>
            </ul>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from "vue";
const emits = defineEmits(["downloadFile"]);
const props = defineProps({
  notice: {
    type: Object,
    required: true,
  },
  fileList: {
    type: Array,
    required: true,
  },
});

const downloadFile = (file) => {
  emits("downloadFile", file);
};
</script>
<style lang="scss">
.el-radio__input.is-disabled {
  color: rgb(250, 14, 14);
}
</style>
