<template>
  <div class="pagination-area">
    <div :class="`${platformNm=='Datacore' ? 'datacore-pagination-total' : 'pagination-total'}`"> 
      <p class="cntPage">{{ $t('common.lblTotalItems', [$common.commaFormat(state.totalCnt)]) }}</p>
      <div>
        <el-input size="small" v-model="state.selectPage"
          @input="valiDatePage"
          @keyup.enter="movePage(state.selectPage)"
          style="width: 50px;"
        ></el-input>&nbsp;/&nbsp;{{ totalPageCnt }}&nbsp;&nbsp;&nbsp;
        <el-button type="primary" size="small" @click="movePage(state.selectPage)">{{ $t('common.btnMove') }}</el-button>
      </div>
    </div>  
   
    <div class="ly-pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="state.curPage"
        :total="state.totalCnt"
        :page-size="state.pageSize"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>
     <div class="pagination-total"></div>
  </div>
</template>

<script>
import { reactive, computed, watch, toRefs } from "vue";
import { useI18n } from 'vue-i18n';

export default {
  name: "ComnPagination",
  props: {
    curPage: {
      type: Number,
      required: false,
      default: 1,
    },
    totalPage: {
      type: Number,
      required: true,
    },
    pageSize: {
      type: Number,
      required: false,
      default: 10,
    },
    platformNm: {
      type: String,
      required: false,
      default: '',
    }    
  },
  setup(props, { emit }) {    
    const { t } = useI18n();

    const state = reactive({
      totalCnt: props.totalPage,
      curPage: props.curPage,
      pageSize: props.pageSize,
      selectPage: props.curPage,    
    });

    const propsRefs = toRefs(props);
    watch(
      [propsRefs.curPage, propsRefs.totalPage],
      () => {
        if(isNaN(props.curPage)){
          state.curPage = 1;
          state.selectPage = 1;
        }else{
          state.selectPage = props.curPage;
          state.curPage = props.curPage;
        }
        state.totalCnt = props.totalPage;
      },
      { deep: true }
    );

    //Data Core 플랫폼은 리스트 갯수가 15개
    if(props.platformNm == 'Datacore'){
      state.pageSize = 15;
    }

    const totalPageCnt = computed (()=> {
      return Math.floor((state.totalCnt - 1)/state.pageSize) + 1;
    })    

    const handleCurrentChange = (page) => {
      //emit("pagemove", page);
      movePage(page);
    };
    
    const movePage = (page) => {
      var format = /^-[0-9]+g/;
      let pageNo = 1;

      if(Number(page) <= 0 || format.test(page)){
        pageNo = 1;
      }else if(Number(page) >= totalPageCnt.value){
        pageNo = totalPageCnt.value;      
      }else {
        pageNo = Number(page);
      }

      state.curPage = pageNo;
      state.selectPage = pageNo;
      emit("pagemove", pageNo);
    };

    const valiDatePage = (text) => {
      var format = /[^-0-9]/g;
      if (format.test(text)) {
        state.selectPage = state.selectPage.replace(format, '');
      }
    };

    return { t, state, handleCurrentChange, movePage, valiDatePage, totalPageCnt };
  },
};
</script>

<style lang="scss" scoped>
.pagination-area {
  margin-top:15px;
  display: inline-flex;
  align-items: center;
  justify-content:space-between;
  width:100%;
  height:48px;
  //justify-content: space-between;
  .ly-pagination {
    display: inline-flex;
  }
}
.pagination-total {
  display:flex;
  margin-right:auto;
  min-width: 300px;
  width:450px;
  color: #606878;  
  font-weight: 700;
  font-size: 12px;
  line-height: 32px;
}
.datacore-pagination-total {
  width: 300px;  
  display: inline-flex;  
  color: #606878;  
  font-weight: 700;
  font-size: 12px;
  line-height: 32px;
  margin: 16px 50px 16px 30px;
  align-items: center;
  // margin-left:50px;
}

.cntPage{
  margin-right: 10px;
  float: right;
}
</style>
