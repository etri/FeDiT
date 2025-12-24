<template>
  <el-form
    :model="state.ruleForm"
    :rules="state.rules"
    ref="ruleForm"
    label-width="120px"
    class="demo-ruleForm"
  >
    <!-- input : 내용 필수 (rules -> prop 이름 = rules 이름 일치해야함) -->
    <el-form-item label="name" prop="name">
      <el-input v-model="state.ruleForm.name"></el-input>
    </el-form-item>

    <!-- input : 내용 필수 아님 (rules -> prop 이름 = rules 이름 일치해야함) -->
    <el-form-item label="english name" prop="englishName">
      <el-input v-model="state.ruleForm.englishName"></el-input>
    </el-form-item>

    <!-- select input optin 기본 -->
    <el-form-item label="Activity zone">
      <el-select
        v-model="state.ruleForm.region"
        placeholder="please select your zone"
      >
        <el-option label="Zone one" value="shanghai"></el-option>
        <el-option label="Zone two" value="beijing"></el-option>
      </el-select>
    </el-form-item>

    <!-- select input optin for문-->
    <el-form-item label="region" prop="region">
      <el-select v-model="state.ruleForm.region" placeholder="Activity zone">
        <el-option
          v-for="item in state.options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <!-- on off 버튼 기능, 버튼 클릭 시 자동 변동 -->
    <el-form-item label="Instant delivery" prop="delivery">
      <el-switch v-model="state.ruleForm.delivery"></el-switch>
    </el-form-item>

    <!-- checkbox button   -->
    <el-form-item label="Activity type" prop="type">
      <el-checkbox-group v-model="state.ruleForm.type">
        <el-checkbox label="Online activities" name="type"></el-checkbox>
        <el-checkbox label="Promotion activities" name="type"></el-checkbox>
        <el-checkbox label="Offline activities" name="type"></el-checkbox>
        <el-checkbox label="Simple brand exposure" name="type"></el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <!-- radio button -->
    <el-form-item label="Resources" prop="resource">
      <el-radio-group v-model="state.ruleForm.resource">
        <el-radio label="Sponsorship"></el-radio>
        <el-radio label="Venue"></el-radio>
      </el-radio-group>
    </el-form-item>
    <!-- text area -->
    <el-form-item label="Activity form" prop="desc">
      <el-input type="textarea" v-model="state.ruleForm.desc"></el-input>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm('ruleForm')"
        >Create</el-button
      >
    </el-form-item>
  </el-form>
</template>
<script>
import { reactive } from "vue";

export default {
  name: "ComnForm",
  setup() {
    const state = reactive({
      ruleForm: {
        name: "",
        englishName: "",
        region: "",
        delivery: false,
        type: [],
        resource: "",
        desc: "",
      },
      options: [
        {
          value: "Option1",
          label: "Option1",
        },
        {
          value: "Option2",
          label: "Option2",
        },
        {
          value: "Option3",
          label: "Option3",
        },
        {
          value: "Option4",
          label: "Option4",
        },
        {
          value: "Option5",
          label: "Option5",
        },
      ],
      rules: {
        name: [
          {
            required: true,
            message: "내용을 입력하세요.",
            trigger: "blur",
          },
          {
            min: 0,
            message: "내용 입력",
            trigger: "blur",
          },
        ],
        region: [
          {
            required: true,
            message: "Please select Activity zone",
            trigger: "change",
          },
        ],

        type: [
          {
            type: "array",
            required: true,
            message: "Please select at least one activity type",
            trigger: "change",
          },
        ],
        resource: [
          {
            required: true,
            message: "Please select activity resource",
            trigger: "change",
          },
        ],
      },
    });

    const submitForm = (formName) => {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          //emit 작업
          alert("submit!");
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    };
    return { state, submitForm };
  },
};
</script>
<style lang=""></style>
