from django.db import models

class sampleModel(models.Model):
    sample_seq = models.AutoField(db_column='SAMPLE_SEQ', primary_key=True)
    sample_id = models.CharField(db_column='SAMPLE_ID', max_length=200)
    sample_name = models.CharField(db_column='SAMPLE_NAME', max_length=200)
    sample_bgng_ymd = models.CharField(db_column='SAMPLE_BGNG_YMD', max_length=8, blank=True, null=True)
    sample_end_ymd = models.CharField(db_column='SAMPLE_END_YMD', max_length=8, blank=True, null=True)
    sample_status = models.CharField(db_column='SAMPLE_STATUS', max_length=20)

    #blank=True, null=True 시리얼라이즈때 필드 비교 에러 발생 안하고 null로 값 밀어 넣음


    class Meta:
        app_label = 'dt_data_platform'
        managed = False
        db_table = 'TB_DJANGO_SAMPLE_TABLE'
