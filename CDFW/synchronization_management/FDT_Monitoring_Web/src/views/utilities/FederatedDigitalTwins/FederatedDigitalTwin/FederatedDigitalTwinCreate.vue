<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject } from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  createDialog: Boolean,
})
const emit = defineEmits(['update:createDialog', 'createSuccess'])
// 로컬 상태
const dialogVisible = ref(props.createDialog)
const newKeyword = ref('')
const resultSuccessDialog = ref(false)
const resultFailDialog = ref(false)
const resultFailText = ref("")
const form = ref(null)
const valid = ref(false)
const formData = ref({
  federated_digital_twin_identifier: '',
  federated_digital_twin_name: '',
  description: '',
  owner: '',
  keywords: [],
  point_of_access: '',
  // location: {
  //   lat: '',
  //   lng: ''
  // }
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
    $axios.post('/federated-twins', formData.value)
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
  formData.value.federated_digital_twin_identifier = ''
  formData.value.federated_digital_twin_name = ''
  formData.value.description= ''
  formData.value.owner= ''
  formData.value.keywords= []
  formData.value.point_of_access= ''
  // formData.value.location= {
  //   lat: '',
  //   lng: ''
  // }

  newKeyword.value = ''
}
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <v-card>
      <v-card-title>
        <span class="headline">Create Federated Digital Twin</span>
      </v-card-title>
      <v-card-text>
        <v-container>
            <v-form v-model="valid" ref="form">
              <v-row>
                <!-- FDT ID -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.federated_digital_twin_identifier" label="ID" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <!-- FDT Name -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.federated_digital_twin_name" label="Name" variant="underlined" :rules="[rules.required, rules.name]"></v-text-field>
                </v-col>
                <!-- FDT Description -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.description" label="Description" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- Owner -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.owner" label="Owner" variant="underlined" :rules="[rules.required]"></v-text-field>
                </v-col>
                <!-- POI -->
                <v-col cols="12" md="12" class="py-0">
                  <v-text-field v-model="formData.point_of_access" label="Point of Access" variant="underlined" :rules="[rules.required]"></v-text-field>
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
                <!-- <v-col cols="12" md="3" class="pt-5 pl-3 text-inputBorder">
                  Location :
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.location.lat" label="Latitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-text-field v-model="formData.location.lng" label="Longitude" variant="underlined" :rules="[rules.required, rules.location]"></v-text-field>
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
