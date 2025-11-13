<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>목록1</h3>
      </div>
      <div class="boxCnt">
        <comn-list 
          :tableHeader="tableHeader" 
          :tableData="tableData" 
          :height="400"
          @row-click="rowClick"
          ></comn-list>
      </div>

      <div class="boxTit">
        <h3>목록2 - 수정진행중</h3>
      </div>
      <div class="boxCnt">
        <comn-list 
          :tableHeader="tableHeader1" 
          :tableData="tableData" 
          :height="400"
          @row-click="rowClick"
          >
          <template v-slot:name="slotProps">
            <el-input
              v-model="slotProps.row.name"
            >
            </el-input>
          </template>
          <template v-slot:address="slotProps">
            <el-input
              v-model="slotProps.row.address"
            >
            </el-input>
          </template>
        </comn-list>
      </div>
    </div>
  </div>
</template>

<script>
import ComnList from "@/components/common/ComnList";

export default {
  components: {
    ComnList
  },
  setup() {
    const tableHeader = [
        {
          prop: "date",
          label: "등록일시",
          width: 250,
        },
        {
          prop: "name",
          label: "이름",
          width: 250,
        },
        {
          prop: "address",
          label: "주소",
          width: 250,
        },
      ];
    
      const tableHeader1 = [
        {
          prop: "date",
          label: "등록일시",
          width: 250,
        },
        {
          prop: "name",
          label: "이름",
          width: 250,
          columnType: "custom"
        },
        {
          prop: "address",
          label: "주소",
          width: 250,
          columnType: "custom"
        },
      ];
      const tableData = [{
          date: '2016-05-03',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-02',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-04',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-01',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        }];

      const rowClick = (row, cell) => {
        alert("row click => " + row);
      };
      return { tableHeader, tableHeader1, tableData, rowClick};
  }
}
</script>

<style>
</style>