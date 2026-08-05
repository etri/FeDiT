<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject} from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  modifyDialog: Boolean,
  itemDetail: Object
})
const emit = defineEmits(['update:modifyDialog', 'modifyConfirmed'])
// 로컬 상태
const dialogVisible = ref(props.modifyDialog)
const itemDetail = ref({...props.itemDetail})

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
const newSubject = ref('')
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)
const request_param = ref()
const response_info = ref()
const err_info = ref()
const preliminary = ref()

const formData = ref({
  simulation_name: '',
  description: '',
  keywords: [],
  subjects: [],
  modification_time: '',
  simulation_access_url: '',
  authorization: '',
  simulation_request_param: {},
  simulation_response_info: {},
  response_format_type: '',
  interface_type: '',
  error_info: {},
  preliminary_field: {},
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
  }
}

const addKeyword = () => {
  if (newKeyword.value !== '') {
    formData.value.keywords.push(newKeyword.value)
    newKeyword.value = ''
  }
}
const addSubject = () => {
  if (newSubject.value !== '') {
    formData.value.subjects.push(newSubject.value)
    newSubject.value = ''
  }
}

const removeKeyword = (keyword, index) => {
  formData.value.keywords.splice(index, 1)
}
const removeSubject = (keyword, index) => {
  formData.value.subjects.splice(index, 1)
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

const getCurrentTimeInISOFormat = () => {
  const now = new Date();
  return now.toISOString();
}

const handleModify = async () => {
  if (valid.value) {
    formData.value.modification_time = getCurrentTimeInISOFormat();
    request_param.value  ? formData.value.simulation_request_param = JSON.parse(request_param.value) : delete formData.value.simulation_request_param
    response_info.value ? formData.value.simulation_response_info = JSON.parse(response_info.value) : delete formData.value.simulation_response_info
    err_info.value ? formData.value.error_info = JSON.parse(err_info.value) : delete formData.value.error_info
    preliminary.value ? formData.value.preliminary_field = JSON.parse(preliminary.value) : delete formData.value.preliminary_field

    $axios.patch(`digital-twins/${itemDetail.value.digital_twin_id}/simulations/${itemDetail.value.simulation_id}`, formData.value)
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
  formData.value.simulation_name =  itemDetail.value.simulation_name
  formData.value.description =  itemDetail.value.description
  formData.value.keywords =  [...itemDetail.value.keywords]
  formData.value.subjects =  [...itemDetail.value.subjects]
  formData.value.simulation_access_url =  itemDetail.value.simulation_access_url
  formData.value.authorization =  itemDetail.value.authorization
  formData.value.simulation_request_param =  {}
  formData.value.simulation_response_info =  {}
  formData.value.response_format_type = itemDetail.value.response_format_type
  formData.value.interface_type = itemDetail.value.interface_type
  formData.value.error_info = {}
  formData.value.preliminary_field = {}

  newKeyword.value = ''
  newSubject.value = ''
  request_param.value = JSON.stringify(itemDetail.value.simulation_request_param)
  response_info.value = JSON.stringify(itemDetail.value.simulation_response_info)
  err_info.value = JSON.stringify(itemDetail.value.error_info)
  if(itemDetail.value.preliminary_field == null){
    preliminary.value = ''
  } else {
    preliminary.value = JSON.stringify(itemDetail.value.preliminary_field)
  }

}

</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Modify Simulation</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <!-- DT ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="itemDetail.digital_twin_id" label="digital twin id" disabled variant="underlined"></v-text-field>
                </v-col>
                <!-- Simulation ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="itemDetail.simulation_id" label="ID" variant="underlined" disabled></v-text-field>
                </v-col>
                <!-- Simulation Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.simulation_name" label="Name" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description" variant="underlined" :rules="[rules.required]"></v-text-field>
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
                <v-col cols="12" md="12" class="py-0 mb-5">
                    <v-chip class="ma-1" v-for="(keyword, index) in formData.keywords" :key="index">
                      {{ keyword }}
                      <v-btn elevation="0" variant="text" icon @click="removeKeyword(keyword, index)"><XIcon size="15"/></v-btn>
                    </v-chip>
                </v-col>
                <!-- Subjects -->
                <v-col cols="12" md="9" class="py-0">
                  <v-text-field v-model="newSubject" label="Subjects" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn @click="addSubject" elevation="0" variant="outlined" rounded="lg">
                    <PlusIcon size="20" class="mr-2"/> 추가
                  </v-btn>
                </v-col>
                <v-col cols="12" md="12" class="py-0 mb-5">
                    <v-chip class="ma-1" v-for="(keyword, index) in formData.subjects" :key="index">
                      {{ keyword }}
                      <v-btn elevation="0" variant="text" icon @click="removeSubject(keyword, index)"><XIcon size="15"/></v-btn>
                    </v-chip>
                </v-col>
                <!-- Simulation Access URL -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.simulation_access_url" label="Simulation access url" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Authorization -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.authorization" label="Authorization" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Interface Type -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.interface_type" label="Interface type" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Simulation Request Paramaeter -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="request_param" label="Simulation request parameter" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
                </v-col>
                <!-- Simulation Response Information -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="response_info" label="Simulation response information" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
                </v-col>
                <!-- Response Format Type -->
                <v-col cols="12" md="12" class="py-0">
                  <v-radio-group class="custom-radio-label ml-n4 mb-2" v-model="formData.response_format_type" label="Response format type" inline hide-details>
                    <v-radio label="JSON" value="json" class="ml-3"></v-radio>
                    <v-radio label="XML" value="xml" class="ml-3"></v-radio>
                  </v-radio-group>
                </v-col>
                <!-- Error Information -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="err_info" label="Error information" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
                </v-col>
                <!-- Preliminary Field -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="preliminary" label="Preliminary field" variant="outlined" :rules="[rules.json]"></v-textarea>
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
        <v-btn color="darken-1" text @click="closeDialog">Cancle</v-btn>
        <v-btn color="blue darken-1" text @click="handleModify">Modify</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
