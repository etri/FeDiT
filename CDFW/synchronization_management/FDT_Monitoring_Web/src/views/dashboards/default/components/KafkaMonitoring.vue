<script setup lang="ts">
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">Kafka Monitoring</h4>
          <div class="ml-auto">
            <v-btn 
              color="primary" 
              variant="text"
              href="https://keti.fedit.or.kr/grafana/d/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=1m&theme=light"
              target="_blank"
              >Go to Grafana Dashboard
              <template v-slot:append>
                <ChevronRightIcon stroke-width="1.5" width="20" />
              </template>
            </v-btn>
          </div>
        </div>


        <div class="d-flex align-center justify-space-between mt-5">
          <v-card variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=647" width="100%" height="140" frameborder="0"></iframe>
          </v-card>
          <v-card  variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=625" width="100%" height="140" frameborder="0"></iframe>
          </v-card>
          <v-card  variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=701" width="100%" height="140" frameborder="0"></iframe>
          </v-card>
          <v-card  variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=192" width="100%" height="140" frameborder="0"></iframe>
          </v-card>
        </div>
        

        <!-- <div class="d-flex align-center justify-space-between mt-5">
          <v-card variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=697" width="100%" height="180" frameborder="0"></iframe>
          </v-card>
          <v-card  variant="outlined" class="v-col mx-1">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/sckEbYTMk-1/kafka-jmx-metrics?orgId=1&refresh=30s&theme=light&panelId=698" width="100%" height="180" frameborder="0"></iframe>
          </v-card>
        </div> -->

        <v-card  variant="outlined" class="mt-2">
          <div class="pa-1">
            <iframe src="https://keti.fedit.or.kr/grafana/d-solo/jwPKIsniz/kafka-exporter-overview?orgId=1&refresh=30s&theme=light&&panelId=16" width="100%" height="220" frameborder="0"></iframe>
          </div>
        </v-card>
        <v-card  variant="outlined" class="mt-2">
          <div class="pa-1">
            <iframe src="https://keti.fedit.or.kr/grafana/d-solo/jwPKIsniz/kafka-exporter-overview?orgId=1&refresh=30s&theme=light&&panelId=18" width="100%" height="220" frameborder="0"></iframe>
          </div>
        </v-card>
      </v-card-text>
    </v-card>
  </v-card>
</template>
