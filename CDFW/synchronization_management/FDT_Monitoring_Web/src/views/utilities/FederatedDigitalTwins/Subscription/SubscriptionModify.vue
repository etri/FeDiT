<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject} from 'vue'
import DODialog from '../DigitalObjectSelectDialog.vue'
const $axios = inject('$axios');

const props = defineProps({
  modifyDialog: Boolean,
  itemDetail: Object
})
const emit = defineEmits(['update:modifyDialog', 'modifyConfirmed'])
// 로컬 상태
const dialogVisible = ref(props.modifyDialog)
const itemDetail = ref({...props.itemDetail})
const selectedDigitalObjects = ref([]);
const selectedDOString = ref("");
const selectDODialog = ref(false);

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:modifyDialog', newValue)
})

watch(() => props.modifyDialog, (newModify) => {
  dialogVisible.value = newModify
  initAll()
})

watch(() => props.itemDetail, (newItemDetail) => {
  itemDetail.value = {...newItemDetail}
  initAll()
})

const newKeyword = ref('')
const newURL = ref('')
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)
const date = ref()

const formData = ref({
  subscription_name: '',
  description: '',
  creator_id: '',
  keywords: [],
  subscription_subject: [],
  subscription_protocol: '',
  notification_url : [],
  expiration_time: '',
  expiration_count: '',
  fail_count: ''
})

const rules = {
  required: (value: string) => {
    return value !== null && value !== undefined && value !== '' || 'Field is required';
  },
  name: (value: string) => {
    if (value === '') return true;
    return /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_-]+$/.test(value) || 'Name can only contain letters, numbers, hyphens (-), and underscores (_)';
  },
  location: (value: string) => !isNaN(parseFloat(value)) || 'Location must be a number',
  json: (value: string) => {
    if (value === '') return true;
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return 'Invalid JSON format';
    }
  },
  number: (value: string) => {
    if (value === '') return true; // 빈 값은 허용하지 않으려면 이 라인을 제거
    const num = Number(value);
    return Number.isInteger(num) || 'Value must be an integer';
  }
}

const addKeyword = () => {
  if (newKeyword.value !== '') {
    formData.value.keywords.push(newKeyword.value)
    newKeyword.value = ''
  }
}
const removeKeyword = (keyword, index) => {
  formData.value.keywords.splice(index, 1)
}

const addURL = () => {
  if (newURL.value !== '') {
    formData.value.notification_url.push(newURL.value)
    newURL.value = ''
  }
}
const removeURL = (keyword, index) => {
  formData.value.notification_url.splice(index, 1)
}

// Dialog를 닫기 위한 함수
const closeDialog = () => {
  initAll()
  dialogVisible.value = false
}

// axios 성공 / 실패 Dialog를 닫기 위한 함수
const closeSuccessResultDialog = () => {
  resultSuccessDialog.value = false
  closeDialog()
  emit('modifyConfirmed')
}
const closeFailResultDialog = () => {
  resultFailDialog.value = false
  resultFailText.value = ""
}

const selectClick = () => {
  selectDODialog.value = true
}

const handleSubmitDOs = (selectedDOs) => {
  console.log('submitted DOs : ', selectedDOs)
  selectedDigitalObjects.value= selectedDOs
  selectedDOString.value = selectedDOs.value.join(', ')
}

const handleModify = async () => {
  if (valid.value) {

    date.value != '' ? formData.value.expiration_time = new Date(date.value).toISOString() : delete formData.value.expiration_time
    formData.value.expiration_count == '' ? delete formData.value.expiration_count : null
    formData.value.fail_count == '' ? delete formData.value.fail_count : null
    selectedDigitalObjects.value ? formData.value.subscription_subject = selectedDigitalObjects.value : null
    
    $axios.patch(`federated-twins/${itemDetail.value.federated_digital_twin_id}/subscriptions/${itemDetail.value.subscription_id}`, formData.value)
      .then(response => {
        console.log('Data submitted successfully:', response.data)
        resultSuccessDialog.value = true
      })
      .catch(error => {
        console.error('Error submitting data:', error)
        resultFailDialog.value = true
        resultFailText.value = error.response.data.msg
      })
  } else {
    form.value?.validate()
  }
}

const initAll = () => {
  formData.value.subscription_name = itemDetail.value.subscription_name
  formData.value.description = itemDetail.value.description
  formData.value.creator_id = itemDetail.value.creator_id
  formData.value.keywords = [...itemDetail.value.keywords]
  formData.value.subscription_subject = [...itemDetail.value.subscription_subject]
  formData.value.subscription_protocol = itemDetail.value.subscription_protocol
  formData.value.notification_url  = [...itemDetail.value.notification_url ]
  itemDetail.value.expiration_time != 'null' ? formData.value.expiration_time = itemDetail.value.expiration_time : formData.value.expiration_time = ''
  itemDetail.value.expiration_count != 'null' ? formData.value.expiration_count = itemDetail.value.expiration_count : formData.value.expiration_count = ''
  itemDetail.value.fail_count != 'null' ? formData.value.fail_count = itemDetail.value.fail_count : formData.value.fail_count = ''


  date.value = ''
  newKeyword.value = ''
  newURL.value = ''
  selectedDigitalObjects.value = [...itemDetail.value.subscription_subject]
  selectedDOString.value = [...itemDetail.value.subscription_subject].join(', ')
}
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Modify Subscription</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
               <!-- Subscription Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.subscription_name" label="Name" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <!-- Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Creator ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.creator_id" label="Creator ID" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Keywords -->
                <v-col cols="12" md="9" class="py-0">
                  <v-text-field v-model="newKeyword" label="Keywords" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn @click="addKeyword" elevation="0" variant="outlined" rounded="lg">
                    <PlusIcon size="20" class="mr-2"/> 추가
                  </v-btn>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                    <v-chip class="ma-1" v-for="(keyword, index) in formData.keywords" :key="index">
                      {{ keyword }}
                      <v-btn elevation="0" variant="text" icon @click="removeKeyword(keyword, index)"><XIcon size="15"/></v-btn>
                    </v-chip>
                </v-col>
                <!-- Member of DO ID -->
                <v-col>
                  <div class="filterCardItem d-flex flex-row mr-4 w-100">
                    <p class="searchKeyword h5 text-grey">DO ID : </p>
                      <v-text-field
                        class="dt-selected mt-1"
                        v-model="selectedDOString"
                        variant="regular"
                        density="compact"
                        hide-details
                        disabled
                      ></v-text-field>
                    <v-btn @click="selectClick" class="mt-2 ml-3" color="lightsecondary" rounded="md">
                      <ListSearchIcon size="20" class="mr-2"/>
                      선택
                    </v-btn>
                    <DODialog :selectDODialog="selectDODialog" :selectedDigitalObjects="selectedDigitalObjects" @update:selectDODialog="val => selectDODialog = val" @selectedDOs="handleSubmitDOs" />
                  </div>
                </v-col>
                <!-- Subscription Protocol (HTTP / MQTT) -->
                <v-col cols="12" md="12" class="py-0">
                  <v-radio-group class="custom-radio-label ml-n4 mb-2" label="Subscription Protocol" v-model="formData.subscription_protocol" inline hide-details>
                    <v-radio label="HTTP" value="http" class="ml-3"></v-radio>
                    <v-radio label="MQTT" value="mqtt" class="ml-3"></v-radio>
                  </v-radio-group>
                </v-col>
                <!-- Notification URL -->
                <v-col cols="12" md="9" class="py-0">
                  <v-text-field v-model="newURL" label="Notification URL" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn @click="addURL" elevation="0" variant="outlined" rounded="lg">
                    <PlusIcon size="20" class="mr-2"/> 추가
                  </v-btn>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                    <v-chip class="ma-1" v-for="(keyword, index) in formData.notification_url" :key="index">
                      {{ keyword }}
                      <v-btn elevation="0" variant="text" icon @click="removeURL(keyword, index)"><XIcon size="15"/></v-btn>
                    </v-chip>
                </v-col>
                <!-- Expiration Time -->
                <v-col cols="12" md="12" class="py-0">
                  <div class="text-caption text-disabled">
                    Expiration Time
                  </div>
                    <Datepicker class="mb-5" v-model="date"></Datepicker>
                </v-col>
                <!-- Expiration Count -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.expiration_count" label="Expiration Count" variant="underlined" :rules="[rules.number]"></v-text-field>
                </v-col>
                <!-- Fail Count -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.fail_count" label="Fail Count" variant="underlined" :rules="[rules.number]"></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-container>

          <v-dialog v-model="resultSuccessDialog" max-width="500px">
            <v-card color="green-lighten-5">
              <v-card-title class="headline text-green-darken-4">Success</v-card-title>
              <v-card-text>Your data has been submitted successfully.</v-card-text>
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
        <v-btn color="darken-1" text @click="closeDialog">Cancel</v-btn>
        <v-btn color="blue darken-1" text @click="handleModify">Modify</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.custom-radio-label .v-label {
  font-size: 12px;
}
</style>