from django.db import models
from django.contrib import admin

class augment1Model(models.Model):
    data_augment_seq = models.AutoField(primary_key=True)
    sdt_seq = models.IntegerField()
    augment_nm = models.CharField(max_length=200)
    augment_tp = models.CharField(max_length=20)
    augment_bgng_ymd = models.CharField(max_length=8)
    augment_end_ymd = models.CharField(max_length=8)
    model_seq = models.IntegerField()
    augment_status = models.CharField(max_length=20)

    class Meta:
        app_label = 'dt_data_platform'
        db_table = 'TB_DATA_AUGMENT'