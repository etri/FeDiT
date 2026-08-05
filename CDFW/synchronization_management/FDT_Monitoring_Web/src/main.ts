import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import '@/scss/style.scss';
import axios from 'axios';
import PerfectScrollbar from 'vue3-perfect-scrollbar';
import VueApexCharts from 'vue3-apexcharts';
import VueTablerIcons from 'vue-tabler-icons';

import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import { fakeBackend } from '@/utils/helpers/fake-backend';

// print
import print from 'vue3-print-nb';

const app = createApp(App);
fakeBackend();
app.use(router);
app.use(PerfectScrollbar);
app.use(createPinia());
app.use(VueTablerIcons);
app.component('VueJsonPretty', VueJsonPretty);
app.component('Datepicker', Datepicker);
app.use(print);
app.use(VueApexCharts);
axios.defaults.baseURL = '/fedit/v1';
axios.interceptors.request.use((config) => {
  const requestUri = axios.getUri(config);
  const fullUrl = requestUri.startsWith('http') ? requestUri : `${window.location.origin}${requestUri}`;
  console.log('[AXIOS REQUEST]', config.method?.toUpperCase(), fullUrl, 'baseURL=', config.baseURL, 'url=', config.url);
  return config;
});

// app.config.globalProperties.$axios = axios;
app.provide('$axios', axios);

app.use(vuetify).mount('#app');
