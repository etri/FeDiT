from django.db import models
from django.utils import timezone
from django.core.validators import MaxValueValidator



class Image(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    date = models.DateTimeField(default=timezone.now)
    internalPort_nb = models.IntegerField(validators=[MaxValueValidator(65535)], default=0)
    internalPort_tb = models.IntegerField(validators=[MaxValueValidator(65535)], default=0)
    workdir = models.CharField(max_length=100)


    class Meta:
        db_table = 'tb_image'


class Container(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    status = models.CharField(max_length=100)    
    date = models.DateTimeField(default=timezone.now)
    play = models.BooleanField()
    image_name = models.CharField(max_length=100)
    internalPort_nb = models.IntegerField(validators=[MaxValueValidator(65535)])
    internalPort_tb = models.IntegerField(validators=[MaxValueValidator(65535)])
    internalPortFwd_nb = models.IntegerField(validators=[MaxValueValidator(65535)])
    internalPortFwd_tb = models.IntegerField(validators=[MaxValueValidator(65535)])
    externalPort_nb = models.IntegerField(validators=[MaxValueValidator(65535)])
    externalPort_tb = models.IntegerField(validators=[MaxValueValidator(65535)])
    # externalPortFwd = models.IntegerField(validators=[MaxValueValidator(65535)])



    class Meta:
        db_table = 'tb_container'        