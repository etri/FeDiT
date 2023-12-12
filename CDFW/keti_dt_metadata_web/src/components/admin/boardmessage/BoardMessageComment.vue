<template>
  <div class="boxCnt searchForm">
    <div  class="writeWrap" v-if="isWriteYn(route.meta.auth)">
      <el-row>
        <el-col :span="1" :xs="24">
          <h2>내용</h2>
        </el-col>
        <el-col :span="23" :xs="24">
          <div class="rel" style="padding-right: 100px">
            <el-input type="textarea" v-model="comment"></el-input>
            <el-button
              type="primary"
              class="btn btnS whiteBlue abs"
              @click="sendComment"
              style="height: 50px; line-height: 30px; top: 0; right: 0"
              >댓글 등록</el-button
            >
          </div>
        </el-col>
      </el-row>
    </div>
    <br />
    <div>
      <comn-list
        :tableHeader="tableHeader"
        :tableData="comments"
        @row-click="rowClick"
      >
        <template v-slot:cmmtSbst="slotProps">
          <div v-if="slotProps.row.modiValue == 'M'">
            <el-input v-model="slotProps.row.cmmtSbst"></el-input>
          </div>
          <div v-else>
            {{ slotProps.row.cmmtSbst }}
          </div>
        </template>

        <template v-slot:modiDel="slotProps">
          <el-button
            v-if="slotProps.row.modiValue == 'M'"
            plain
            type="primary"
            @click="saveModiComment(slotProps.row)"
            >저장</el-button
          >
          <el-button
            v-else
            v-if="isAmdYn(route.meta.auth)"
            plain
            type="primary"
            @click="modifyComment(slotProps.row)"
            >수정</el-button
          >
          <el-button v-if="isDelYn(route.meta.auth)" @click="deleteComment(slotProps.row)">삭제</el-button>
        </template>
      </comn-list>
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import { ref, defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { isWriteYn, isAmdYn, isDelYn } from "@/assets/js/common.js";

const route = useRoute();

const emits = defineEmits(["saveComment", "modifyComment", "deleteComment"]);
const props = defineProps({
  comments: {
    type: Array,
    required: true,
  },
});

const comment = ref("");

const tableHeader = [
  {
    prop: "cmmtOid",
    label: "번호",
    width: 100,
  },
  {
    prop: "cmmtSbst",
    label: "댓글내용",
    width: 300,
    columnType: "custom",
  },
  {
    prop: "regDt",
    label: "작성일자",
    width: 250,
  },
  {
    prop: "regrId",
    label: "작성자",
    width: 250,
  },
  {
    prop: "modiDel",
    label: "수정/삭제",
    width: 200,
    columnType: "custom",
  },
];

const rowClick = (data) => {
  console.log(data);
};

const sendComment = () => {
  if(comment.value == null || comment.value == "") {
    alert('내용을 입력해주세요.');
  }else 
    emits("saveComment", { comment: comment.value });
};

const saveModiComment = (data) => {
  emits("modifyComment", { comment: data });
};

const modifyComment = (data) => {
  if (data.modiValue == "R") data.modiValue = "M";
};

const deleteComment = (data) => {
  emits("deleteComment", { comment: data });
};
</script>
<style lang="scss"></style>
