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
const data_model = ref();
const control_model= ref();
const metadata=ref();

const formData = ref({
  digital_twin_id: '',
  digital_object_identifier: '',
  digital_object_name: '',
  description: '',
  creation_time: '',
  modification_time: '',
  keywords: [],
  subjects: [],
  digital_object_data_access_type: '',
  digital_object_data_access_url: '',
  digital_object_data_source_type: '',
  digital_object_data_source_url: '',
  digital_object_data_model: null,
  digital_object_data_interval: 0,
  digital_object_control_url: '',
  digital_object_control_request_model: null,
  do_metadata: null,
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
    formData.value.digital_object_data_model = JSON.parse(data_model.value)
    formData.value.digital_object_control_request_model = JSON.parse(control_model.value)
    formData.value.do_metadata = JSON.parse(metadata.value)

    $axios.patch(`/digital-twins/${itemDetail.value.digital_twin_id}/digital-objects/${itemDetail.value.digital_object_id}`, formData.value)
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

  formData.value.digital_twin_id = itemDetail.value.digital_twin_id
  formData.value.digital_object_identifier = itemDetail.value.digital_object_id
  formData.value.digital_object_name = itemDetail.value.digital_object_name
  formData.value.description = itemDetail.value.description
  formData.value.creation_time = itemDetail.value.creation_time
  formData.value.keywords = [...itemDetail.value.keywords]
  formData.value.subjects = [...itemDetail.value.subjects]
  formData.value.digital_object_data_access_type = itemDetail.value.digital_object_data_access_type
  formData.value.digital_object_data_access_url = itemDetail.value.digital_object_data_access_url
  formData.value.digital_object_data_source_type = itemDetail.value.digital_object_data_source_type
  formData.value.digital_object_data_source_url = itemDetail.value.digital_object_data_source_url
  formData.value.digital_object_data_model = null
  formData.value.digital_object_data_interval = itemDetail.value.digital_object_data_interval
  formData.value.digital_object_control_url = itemDetail.value.digital_object_control_url
  formData.value.digital_object_control_request_model = null
  formData.value.do_metadata = null

  newKeyword.value = ''
  newSubject.value = ''

  data_model.value = JSON.stringify(itemDetail.value.digital_object_data_model);
  control_model.value = JSON.stringify(itemDetail.value.digital_object_control_request_model);
  if(itemDetail.value.do_metadata.visual_models == null) {
    itemDetail.value.do_metadata.visual_models = {};
  }
  metadata.value = JSON.stringify(itemDetail.value.do_metadata);
}
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Modify Digital Twin</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <!-- DT ID -->
                 <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_twin_id" label="Digital twin id" disabled variant="underlined"></v-text-field>
                </v-col>
                <!-- DO ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_identifier" label="ID" disabled variant="underlined" :rules="[rules.name]"></v-text-field>
                </v-col>
                <!-- DO Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_name" label="Name *" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <!-- Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description *" variant="underlined" :rules="[rules.required]"></v-text-field>
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
                <!-- DO Data Interval -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_data_interval" label="Digital object data interval" variant="underlined"></v-text-field>
                </v-col>
                <!-- DO Data Access URL -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_data_access_url" label="Digital object data access url" variant="underlined"></v-text-field>
                </v-col>
                <!-- DO Data Access Type (HTTP / MQTT) -->
                <v-col cols="12" md="12" class="py-0">
                  <v-radio-group class="custom-radio-label ml-n4 mb-2" label="Digital object data access type" v-model="formData.digital_object_data_access_type" inline hide-details>
                    <v-radio label="HTTP" value="http" class="ml-3"></v-radio>
                    <v-radio label="MQTT" value="mqtt" class="ml-3"></v-radio>
                  </v-radio-group>
                </v-col>
                <!-- DO Data Model (JSON) -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="data_model" label="Digital object data model" variant="outlined" :rules="[rules.json]"></v-textarea>
                </v-col>
                <!-- DO Control URL -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_control_url" label="Digital object control url" variant="underlined"></v-text-field>
                </v-col>
                <!-- DO Control Model -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="control_model" label="Digital object control request model" variant="outlined" :rules="[rules.json]"></v-textarea>
                </v-col>
                <!-- DO Data Source Type (POLL / PUSH) -->
                <v-col cols="12" md="12" class="py-0">
                  <v-radio-group class="custom-radio-label ml-n4 mb-2" v-model="formData.digital_object_data_source_type" label="Digital object data source type" inline hide-details>
                    <v-radio label="POLL" value="POLL" class="ml-3"></v-radio>
                    <v-radio label="PUSH" value="PUSH" class="ml-3"></v-radio>
                  </v-radio-group>
                </v-col>
                <!-- DO Data Source URL -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.digital_object_data_source_url" label="Digital object data source url" variant="underlined"></v-text-field>
                </v-col>
                <!-- DO Metadata -->
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="metadata" label="DO metadata" variant="outlined" :rules="[rules.json]"></v-textarea>
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