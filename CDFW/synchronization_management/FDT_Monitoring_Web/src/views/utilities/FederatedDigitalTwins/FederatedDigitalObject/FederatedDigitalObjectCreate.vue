<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject} from 'vue'
import DODialog from '../DigitalObjectSelectDialog.vue'
const $axios = inject('$axios');

const props = defineProps({
  createDialog: Boolean,
  selectedFederatedTwin : String
})
const emit = defineEmits(['update:createDialog', 'createSuccess'])
const dialogVisible = ref(props.createDialog)
const selectedFederatedTwin = ref(props.selectedFederatedTwin)
const selectedDigitalObjects = ref([]);
const selectedDOString = ref("");
const selectDODialog = ref(false);

const newKeyword = ref('')
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)
const time_sync = ref(null)
// const spatial_sync = ref(null)
// const preliminary = ref(null)

const formData = ref({
  federated_digital_twin_id: selectedFederatedTwin.value,
  // federated_digital_object_identifier: '',
  federated_digital_object_name: '',
  description: '',
  keywords: [],
  access_protocol: '',
  creator_id: '',
  member_digital_twin_object_ids: [],
  time_sync_cond: {time_interval: 0},
  // access_url: '',
  // location: {
  //   lat: '',
  //   lng: ''
  // },
  // spatial_sync_cond: {},
  // data_model_id: '',
  // preliminary_field: {},
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
const removeKeyword = (keyword, index) => {
  formData.value.keywords.splice(index, 1)
}
// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:createDialog', newValue)
})

watch(() => props.createDialog, (newCreate) => {
  dialogVisible.value = newCreate
  clearAll()
})

watch(() => props.selectedFederatedTwin, (newValue) => {
  selectedFederatedTwin.value = newValue
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

const selectClick = () => {
  selectDODialog.value = true
}

const handleSubmitDOs = (selectedDOs) => {
  console.log('submitted DOs : ', selectedDOs)
  selectedDigitalObjects.value= selectedDOs
  selectedDOString.value = selectedDOs.value.join(', ')
}

const handleCreate = async () => {
  if (valid.value) {
    time_sync.value ? formData.value.time_sync_cond = JSON.parse(time_sync.value) : formData.value.time_sync_cond = {time_interval: 0}
    selectedDigitalObjects.value ? formData.value.member_digital_twin_object_ids = selectedDigitalObjects.value : null
    // formData.value.spatial_sync_cond = JSON.parse(spatial_sync.value)
    // formData.value.preliminary_field = JSON.parse(preliminary.value)
    $axios.post(`federated-twins/${selectedFederatedTwin.value}/federated-digital-objects/`, formData.value)
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

  formData.value.federated_digital_twin_id = selectedFederatedTwin.value
  // formData.value.federated_digital_object_identifier = ''
  formData.value.federated_digital_object_name = ''
  formData.value.description = ''
  formData.value.keywords = []
  formData.value.access_protocol = 'kafka'
  formData.value.creator_id = ''
  formData.value.member_digital_twin_object_ids = []
  formData.value.time_sync_cond = {}

  newKeyword.value = ''
  time_sync.value = JSON.stringify({time_interval: 0})

  // formData.value.access_url = ''
  // formData.value.location= {
  //   lat: '',
  //   lng: ''
  // }
  // formData.value.spatial_sync_cond = {}
  // formData.value.data_model_id = ''
  // formData.value.preliminary_field = {}
  // spatial_sync.value = ''
  // preliminary.value = ''

  selectedDigitalObjects.value = []
  selectedDOString.value = ''
}

</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="700">
    <v-card>
      <v-card-title>
        <span class="headline">Create Federated Digital Object</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <!-- FDT ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.federated_digital_twin_id" label="Federated Digital twin id" disabled variant="underlined"></v-text-field>
                </v-col>
                <!-- FDO ID -->
                <!-- <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.federated_digital_object_identifier" label="ID" variant="underlined" :rules="[rules.name]"></v-text-field>
                </v-col> -->
                <!-- FDO Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.federated_digital_object_name" label="Name *" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <!-- Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description" variant="underlined"></v-text-field>
                </v-col>
                <!-- Access Protocol -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.access_protocol" label="Access Protocol" variant="underlined"></v-text-field>
                </v-col>
                <!-- Creator ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.creator_id" label="Creator ID" variant="underlined"></v-text-field>
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
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="time_sync" label="Time Sync Cond" variant="outlined" :rules="[rules.json]"></v-textarea>
                </v-col>
                <!-- <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.access_url" label="Access URL" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.data_model_id" label="Data Model ID" variant="underlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="3" class="pt-5 pl-3 text-inputBorder">
                  Location :
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.location.lat" label="Latitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.location.lng" label="Longitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="spatial_sync" label="Spatial Sync Cond" variant="outlined" :rules="[rules.json]"></v-textarea>
                </v-col>
                <v-col cols="12" md="12" class="py-0">
                  <v-textarea v-model="preliminary" label="Preliminary Field" variant="outlined" :rules="[rules.json]"></v-textarea>
                </v-col> -->
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