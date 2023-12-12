<template>
  <el-table
    :style="`width: 100%; ${(!height && minHeight) ? 'min-height: ' + minHeight + 'px;' : ''}`"
    v-bind="$attrs"
    v-loading="loading"
    :height="height"
    :data="table.filterTableData"
    :class="className"
    :row-class-name="tableRowClassName"
    :cell-class-name="tableCellClassName"
    :empty-text="emptyText"
    :default-sort="defaultSort"
    @current-change="handleCurrentChange"
    @header-click="clickHeader"
    @row-click="rowClick"
    @selection-change="handleSelectionChange"
    @expand-change="handleExpandChange"
  >
    <template v-for="(item) in tableHeader" :key="item">
      <el-table-column
        v-if="item.columnType === 'custom'"
        :fixed="item.fixed"
        :prop="item.prop"
        :label="item.label"
        :min-width="typeof item.width == 'undefiend' ? table.defaultWidth : item.width"
        :type="item.type"
        :align="item.align"
      >
        <template v-slot="scope">
          <slot :name="item.prop" v-bind="scope"></slot>
        </template>
      </el-table-column>

      <!-- 추가: 2023-08-08 -->
      <el-table-column
        v-else-if="item.columnType === 'expand'"
        type="expand"
        :fixed="item.fixed"
        :prop="item.prop"
      >
        <template v-slot="scope">
          <slot :name="item.prop" v-bind="scope"></slot>
        </template>
      </el-table-column>

      <el-table-column
        v-else
        :fixed="item.fixed"
        :prop="item.prop"
        :label="item.label"
        :min-width="typeof item.width == 'undefiend' ? table.defaultWidth : item.width"
        :type="item.type"
        :align="item.align"
        :show-overflow-tooltip="item.showOverflowTooltip"
        :sortable="item.sortable ? true : false"
      >
        <template v-if="item.headers" v-for="(subItem) in item.headers" :key="subItem">
          <el-table-column
            v-if="subItem.columnType === 'custom'"
            :prop="subItem.prop"
            :label="subItem.label"
            :min-width="typeof subItem.width == 'undefiend' ? table.defaultWidth : subItem.width"
            :type="subItem.type"
            :align="subItem.align"
            :sortable="item.sortable ? true : false"
            >
            <template v-slot="scope">
              <slot :name="subItem.prop" v-bind="scope"></slot>
            </template>
          </el-table-column>
          <el-table-column
            v-else
            :prop="subItem.prop"
            :label="subItem.label"
            :min-width="typeof subItem.width == 'undefiend' ? table.defaultWidth : subItem.width"
            :type="subItem.type"
            :align="subItem.align"
            :show-overflow-tooltip="subItem.showOverflowTooltip"
            :sortable="item.sortable ? true : false"
            >
          </el-table-column>
        </template>
      </el-table-column>
    </template>
  </el-table>
</template>

<script>
import { makeObjectPropertyPusher } from "ol/xml";
import { ref, reactive, toRef, computed, } from "vue";
export default {
  props: {
    tableHeader: {
      type: Array,
      default: () => [],
    },
    tableData: {
      type: Array,
      default: () => [],
    },
    className: {
      type: String,
      default: "",
    },
    emptyText: {
      type: String,
      default: "데이터 없음",
    },
    sortable: {
      type: Boolean,
      default: true,
    },
    height: {
      type: Number,
      default: null,
    },
    searchKeyword: {
      type: String,
      default: ""
    },
    minHeight: {
      type: Number,
      default: 450,
    },
    defaultSort: {
      type: Object,
      default: () => {}
    },    
    customRowFilter: {
      type: Object,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const { sortable, } = toRef(props);

    const table = reactive({
      defaultWidth: 100,
      filterTableData: computed(() => {
        if (props.tableData == null || props.tableData.length == 0) return [];

        // Filter Data
        let filterColumn = [];
        props.tableHeader.forEach(h => {
          if (h.filter) {
            filterColumn.push(h.prop);
          }
        });

        if (filterColumn.length == 0) return props.tableData;

        return props.tableData.filter(data => {
          for (let columnKey of filterColumn) {
            if ( data[columnKey].indexOf(props.searchKeyword) > -1) return data;
          }
        });
      })
    });

    let currentRow = ref(0);
    let currentCell = ref(0);

    const clickHeader = (e) => {
      if (sortable) {
        e.sortable = e.sortable ? false : true;
      }
    };

    const tableRowClassName = (row) => {
      if (props.customRowFilter == null || Object.keys(props.customRowFilter).length == 0) return '';

      const targetObject = props.customRowFilter;
      const targetValue = row.row[targetObject.targetProp];

      let matchIndex = -1;
      for (let idx in targetObject.checkValue) {
        if (targetObject.checkValue[idx] == targetValue) {
          matchIndex = idx;
        }
      }

      if (matchIndex > -1) {
        return targetObject.className[matchIndex];
      }

      return '';
    }

    const handleCurrentChange = (crt) => (currentRow.value = crt);
    const tableCellClassName = (rowIndex, columnIndex) => {
      if (rowIndex === currentRow.value && columnIndex === currentCell.value) {
        return "active";
      }
    };
    const rowClick = (row, col) => emit("clickRow", row, col);

    const handleSelectionChange = (selectionRows) => emit("selectionChange", selectionRows);

    const handleExpandChange = (selectionRow) => emit("expandChange", selectionRow);

    return {
      table,
      currentRow,
      currentCell,
      clickHeader,
      handleCurrentChange,
      tableRowClassName,
      tableCellClassName,
      rowClick,
      handleSelectionChange,
      handleExpandChange,
    };
  },
};
</script>
<style lang="scss"></style>
