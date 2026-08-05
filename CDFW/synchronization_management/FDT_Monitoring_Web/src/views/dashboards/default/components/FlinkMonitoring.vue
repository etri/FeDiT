<script setup lang="ts">
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">Flink Monitoring</h4>
          <div class="ml-auto">
             <v-btn 
              color="primary" 
              variant="text"
              href="https://keti.fedit.or.kr/grafana/d/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&refresh=1m&theme=light"
              target="_blank"
              >Go to Grafana Dashboard
              <template v-slot:append>
                <ChevronRightIcon stroke-width="1.5" width="20" />
              </template>
            </v-btn>
          </div>
        </div>

        <!-- <v-card variant="default" class="v-col mx-2"> -->
          <v-card-title class="text-h4">Job Manager</v-card-title>
          <div class="d-flex align-center justify-space-between">
            <v-card variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=114" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
            <v-card  variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=115" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
            <v-card variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=123" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
          </div>
        <!-- </v-card> -->
        <!-- <v-card variant="default" class="v-col mx-2"> -->
          <v-card-title class="text-h4">Task Manager</v-card-title>
          <div class="d-flex align-center justify-space-between">
            <v-card variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=93" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
            <v-card  variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=94" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
            <v-card variant="outlined" class="v-col mx-2">
              <iframe src="https://keti.fedit.or.kr/grafana/d-solo/wKbnD5Gnk/apache-flink-2021-dashboard-for-job-task-manager?orgId=1&var-Source=Prometheus&var-tm_id=All&var-jm_instance=All&var-job_name=All&theme=light&panelId=27" width="100%" height="260" frameborder="0"></iframe>
            </v-card>
          </div>
        <!-- </v-card> -->

      </v-card-text>
    </v-card>
  </v-card>
</template>
