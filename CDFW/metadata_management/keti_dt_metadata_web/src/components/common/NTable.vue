<template>
  <el-table
    style="width: 100%"
    v-bind="$attrs"
    :class="className"
    :data="table.filterTableData"
    :empty-text="emptyText"
    @row-click="rowClick"
    ><!-- :cell-class-name="tableCellClassName" -->
    <template v-for="(item) in tableHeader" :key="item">
      <el-table-column
        v-if="item.columnType === 'custom'"
        :fixed="item.fixed"
        :prop="item.prop"
        :label="item.label"
        :width="typeof item.width == 'undefiend' ? table.defaultWidth : item.width">
        <template v-slot="scope">
          <slot :name="item.prop" v-bind="scope"></slot>
        </template>
      </el-table-column>
      <el-table-column
        v-else
        :fixed="item.fixed"
        :prop="item.prop"
        :label="item.label"
        :width="typeof item.width == 'undefiend' ? table.defaultWidth : item.width">
        <template v-if="item.headers" v-for="(subItem) in item.headers" :key="subItem">
          <el-table-column
            v-if="subItem.columnType === 'custom'"
            :prop="subItem.prop"
            :label="subItem.label"
            :width="typeof subItem.width == 'undefiend' ? table.defaultWidth : subItem.width">
            <template v-slot="scope">
              <slot :name="subItem.prop" v-bind="scope"></slot>
            </template>
          </el-table-column>
          <el-table-column
            v-else
            :prop="subItem.prop"
            :label="subItem.label"
            :width="typeof subItem.width == 'undefiend' ? table.defaultWidth : subItem.width">
          </el-table-column>
        </template>
      </el-table-column>
    </template>
  </el-table>
</template>

<script>
import { reactive } from '@vue/reactivity';
import { computed, onMounted } from 'vue';

export default {
  props: {
    tableHeader: {
      type: Array,
      required: true,
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
      default: "Empty Data.",
    },
    searchKeyword: {
      type: String,
      default: ""
    }
  },
  setup(props, { emit }) {
    const table = reactive({
      defaultWidth: 100,
      filterTableData: computed(() => {
        if (props.tableData == null || props.tableData.length == 0) return [];

        return props.tableData.filter(data => {
          return data;
        });
      })
    });

    const rowClick = (row, col) => emit("clickRow", row, col);

    onMounted(() => {
      // TODO onMounted
    });

    return { table, rowClick };
  },
}

</script>