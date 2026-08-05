<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject } from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  deleteDialog: Boolean,
  itemDetail: Object,
})
const emit = defineEmits(['update:deleteDialog', 'deleteConfirmed'])
// 로컬 상태
const dialogVisible = ref(props.deleteDialog)
const itemDetail = ref({...props.itemDetail})
const deleteItem = ref("")
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:deleteDialog', newValue)
})

watch(() => props.deleteDialog, (newDelete) => {
  dialogVisible.value = newDelete
})

watch(() => props.itemDetail, (newItemDetail) => {
  itemDetail.value = newItemDetail
  console.log(itemDetail.value)
  deleteItem.value = itemDetail.value["subscription_name"]
})

// axios 성공 / 실패 Dialog를 닫기 위한 함수
const closeSuccessResultDialog = () => {
  resultSuccessDialog.value = false
  emit('deleteConfirmed')
  closeDialog()
}

const closeFailResultDialog = () => {
  resultFailDialog.value = false
  resultFailText.value = ""
  closeDialog()
}

const handleDelete = async () => {
  $axios.delete(`/federated-twins/${itemDetail.value.federated_digital_twin_id}/subscriptions/${itemDetail.value.subscription_id}`)
    .then(response => {
      console.log('Data deleted successfully:', response.data)
      resultSuccessDialog.value = true
    })
    .catch(error => {
      console.error('Error submitting data:', error)
      resultFailDialog.value = true
      resultFailText.value = error
    })
}

// Dialog를 닫기 위한 함수
const closeDialog = () => {
  dialogVisible.value = false
}
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Confirm Delete</span>
      </v-card-title>
      <v-card-text>
        <!-- Dialog 내용 -->
        Are you sure you want to delete <strong>{{deleteItem}}</strong>

        <v-dialog v-model="resultSuccessDialog" max-width="500px">
          <v-card color="green-lighten-5">
            <v-card-title class="headline text-green-darken-4">Success</v-card-title>
            <v-card-text>Delete resource successfully.</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="darken-1" text @click="closeSuccessResultDialog">OK</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="resultFailDialog" max-width="500px">
          <v-card color="red-lighten-5">
            <v-card-title class="headline text-red-darken-4">Fail</v-card-title>
            <v-card-text>
              <div class="mb-2"><strong>Request Failed</strong></div>
              {{resultFailText}}
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="darken-1" text @click="closeFailResultDialog">OK</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" text @click="handleDelete">Delete</v-btn>
        <v-btn color="darken-1" text @click="closeDialog">Cancle</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>