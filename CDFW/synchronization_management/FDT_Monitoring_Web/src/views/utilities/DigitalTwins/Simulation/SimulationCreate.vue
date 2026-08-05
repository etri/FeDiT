<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted, computed } from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  createDialog: Boolean,
  selectedDigitalTwin : String
})
const emit = defineEmits(['update:createDialog', 'createSuccess'])
// 로컬 상태
const dialogVisible = ref(props.createDialog)
const selectedDigitalTwin = ref(props.selectedDigitalTwin)
const newKeyword = ref('')
const newSubject = ref('')
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)

const date = ref()
const request_param = ref()
const response_info = ref()
const err_info = ref()
const preliminary = ref()

const formData = ref({
  digital_twin_id: selectedDigitalTwin.value,
  simulation_identifier: '',
  simulation_name: '',
  description: '',
  keywords: [],
  subjects: [],
  creation_time: '',
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
// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:createDialog', newValue)
})

watch(() => props.createDialog, (newCreate) => {
  dialogVisible.value = newCreate
  clearAll()
})

watch(() => props.selectedDigitalTwin, (newValue) => {
  selectedDigitalTwin.value = newValue
})

// 현재 Dialog를 닫기 위한 함수
const closeDialog = () => {
  dialogVisible.value = false
  clearAll()
}

// axios 성공 / 실패 Dialog를 닫기 위한 함수
const closeSuccessResultDialog = () => {
  resultSuccessDialog.value = false
  closeDialog()
  emit('createSuccess')
}

const closeFailResultDialog = () => {
  resultFailDialog.value = false
  resultFailText.value = ""
}

const handleCreate = async () => {
  if (valid.value) {
    formData.value.modification_time = new Date(Date.now()).toISOString()
    if(date.value == '') {
      formData.value.creation_time = formData.value.modification_time
    } else {
      formData.value.creation_time = new Date(date.value).toISOString()
    }
    request_param.value  !== '' ? formData.value.simulation_request_param = JSON.parse(request_param.value) : null
    response_info.value  !== '' ? formData.value.simulation_response_info = JSON.parse(response_info.value) : null
    err_info.value  !== '' ? formData.value.error_info = JSON.parse(err_info.value) : null
    preliminary.value !== '' ?  formData.value.preliminary_field = JSON.parse(preliminary.value) : null

    $axios.post(`digital-twins/${selectedDigitalTwin.value}/simulations`, formData.value)
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

const clearAll = () => {

  formData.value.digital_twin_id = selectedDigitalTwin.value
  formData.value.simulation_identifier = ''
  formData.value.simulation_name = ''
  formData.value.description = ''
  formData.value.keywords = []
  formData.value.subjects = []
  formData.value.creation_time = ''
  formData.value.modification_time = ''
  formData.value.simulation_access_url = 'http://'
  formData.value.authorization = 'Anonymous'
  formData.value.simulation_request_param = {}
  formData.value.simulation_response_info = {}
  formData.value.response_format_type = 'json'
  formData.value.interface_type = 'REST API'
  formData.value.error_info = {}
  formData.value.preliminary_field = {}

  date.value = ''
  newKeyword.value = ''
  newSubject.value = ''

  request_param.value = ''
  response_info.value = ''
  err_info.value = ''
  preliminary.value = ''
}

</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="700">
    <v-card>
      <v-card-title>
        <span class="headline">Create Simulation</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <!-- DT ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_twin_id" label="digital twin id" disabled variant="underlined"></v-text-field>
                </v-col>
                <!-- Simulation ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.simulation_identifier" label="ID" variant="underlined" :rules="[rules.name]"></v-text-field>
                </v-col>
                <!-- Simulation Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.simulation_name" label="Name *" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description *" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Creation Time -->
                <v-col cols="12" md="12" class="py-0">
                  <div class="text-caption text-disabled">
                    creation time *
                  </div>
                    <Datepicker class="mb-5" v-model="date"></Datepicker>
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
                  <v-text-field v-model="formData.simulation_access_url" label="Simulation access url *" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Authorization -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.authorization" label="Authorization *" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Interface Type -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.interface_type" label="Interface type *" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Simulation Request Parameter -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="request_param" label="Simulation request parameter *" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
                </v-col>
                <!-- Simulation Response Information -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="response_info" label="Simulation response information *" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
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
                  <v-textarea v-model="err_info" label="Error information *" variant="outlined" :rules="[rules.required, rules.json]"></v-textarea>
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
        <v-btn color="blue darken-1" text @click="handleCreate">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.custom-radio-label .v-label {
  font-size: 12px;
}
</style>