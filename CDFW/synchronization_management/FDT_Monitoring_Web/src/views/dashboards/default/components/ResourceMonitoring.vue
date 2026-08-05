<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loadGrafanaImage = () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const from = oneDayAgo.getTime();
  const to = now.getTime();

  const grafanaInstance = 'http://10.252.73.36:3000';
  const dashboardUID = 'rYdddlPWk';
  const apiKey = 'glsa_MaXzvudB8KdYggOHkh5YzaDP2170l2rK_13b60604';

  const url = `${grafanaInstance}/render/d-solo/` +
              `${dashboardUID}/node-exporter-full` +
              `?orgId=1&from=${from}&to=${to}&theme=light&panelId=77&width=620&height=150&tz=Asia%2FSeoul`;
  // API Key를 사용해 요청
  grafanaImageURL.value = `${url}&apikey=${apiKey}`;
};
const grafanaImageURL = ref();
onMounted(() => {
  loadGrafanaImage();
});
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">System Resource</h4>
          <div class="ml-auto">
            <v-btn 
              color="primary" 
              variant="text"
              href="https://keti.fedit.or.kr/grafana/d/rYdddlPWk/node-exporter-full?orgId=1&refresh=1m&theme=light"
              target="_blank"
              >Go to Grafana Dashboard
              <template v-slot:append>
                <ChevronRightIcon stroke-width="1.5" width="20" />
              </template>
            </v-btn>
          </div>
        </div>

        <v-card  variant="outlined" class="mt-5">
          <div class="pa-1">
            <iframe src="https://keti.fedit.or.kr/grafana/d-solo/rYdddlPWk/node-exporter-full?orgId=1&refresh=30s&theme=light&panelId=77" width="100%" height="150" frameborder="0"></iframe>
            <!-- <img :src="grafanaImageURL" alt="Grafana Dashboard" width="100%" height="150" /> -->
          </div>
        </v-card>
        <v-card  variant="outlined" class="mt-2">
          <div class="pa-1">
            <iframe src="https://keti.fedit.or.kr/grafana/d-solo/rYdddlPWk/node-exporter-full?orgId=1&refresh=30s&theme=light&panelId=78" width="100%" height="150" frameborder="0"></iframe>
          </div>
        </v-card>
        <v-card  variant="outlined" class="mt-2">
          <div class="pa-1">
            <iframe src="https://keti.fedit.or.kr/grafana/d-solo/rYdddlPWk/node-exporter-full?orgId=1&refresh=30s&theme=light&panelId=152" width="100%" height="150" frameborder="0"></iframe>
          </div>
        </v-card>

      </v-card-text>
    </v-card>
  </v-card>
</template>
