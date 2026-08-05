<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted } from 'vue'
import { PlusIcon, XIcon} from 'vue-tabler-icons';
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
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)
const formData = ref({
  digital_twin_id: selectedDigitalTwin.value,
  controller_name: '',
  description: '',
  owner: '',
  tags: [],
  install_location: {
    lat: '',
    lng: ''
  },
  control_access_type: 'http',
  control_access_url: 'url:port',
  delivery_timeout : 30000,
  execution_timeout : 30000,
  timeout_notification: "http://",
  install_time:'',
  // data_model_id: '',
})

const rules = {
  required: (value: string) => !!value || 'Field is required',
  name: (value: string) => /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_-]+$/.test(value) || 'Name can only contain letters, numbers, hyphens (-), and underscores (_)',
  location: (value: string) => !isNaN(parseFloat(value)) || 'Location must be a number'
}

// Tag 에 들어갈 Keyword 추가 및 삭제
const addKeyword = () => {
  if (newKeyword.value !== '') {
    formData.value.tags.push(newKeyword.value)
    newKeyword.value = ''
  }
}

const removeKeyword = (keyword, index) => {
  formData.value.tags.splice(index, 1)
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
    $axios.post(`/${selectedDigitalTwin.value}/controllers`, formData.value)
      .then(response => {
        console.log('Data submitted successfully:', response.data)
        resultSuccessDialog.value = true
      })
      .catch(error => {
        console.error('Error submitting data:', error)
        resultFailDialog.value = true
        resultFailText.value = error
      })
  } else {
    form.value?.validate()
  }
}

const clearAll = () => {
  formData.value.digital_twin_id = selectedDigitalTwin.value;
  formData.value.controller_name = '';
  formData.value.description = '';
  formData.value.owner = '';
  formData.value.tags = [];
  formData.value.install_location = {
    lat: '',
    lng: ''
  };
  formData.value.control_access_type = 'http';
  formData.value.control_access_url = 'url:port';
  formData.value.delivery_timeout = 30000;
  formData.value.execution_timeout = 30000;
  formData.value.timeout_notification = "http://";
  formData.value.install_time ='';
  // formData.value.data_model_id = '';
}

</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Create Control</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_twin_id" label="digital twin id" disabled variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.controller_name" label="Name" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.owner" label="Owner" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="9" class="py-0">
                  <v-text-field v-model="newKeyword" label="Keyword" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn @click="addKeyword" elevation="0" variant="outlined" rounded="lg">
                    <PlusIcon size="20" class="mr-2"/> 추가
                  </v-btn>
                </v-col>
                <v-col cols="12" md="12" class="py-0 mb-5">
                    <v-chip class="ma-1" v-for="(keyword, index) in formData.tags" :key="index">
                      {{ keyword }}
                      <v-btn elevation="0" variant="text" icon @click="removeKeyword(keyword, index)"><XIcon size="15"/></v-btn>
                    </v-chip>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-radio-group class="text-subtitle-2 ml-n4" label="Control Access Type" v-model="formData.control_access_type" inline hide-details>
                    <v-radio label="HTTP" value="http" class="ml-3"></v-radio>
                    <v-radio label="MQTT" value="mqtt" class="ml-3"></v-radio>
                  </v-radio-group>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.control_access_url" label="Control Access Url" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="3" class="pt-5 pl-3 text-inputBorder">
                  Location :
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.install_location.lat" label="Latitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.install_location.lng" label="Longitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.delivery_timeout" label="Delivery Timeout" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.execution_timeout" label="Execution Timeout" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.timeout_notification" label="Timeout Notification URL" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.install_time" label="Install Time" variant="underlined"></v-text-field>
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
