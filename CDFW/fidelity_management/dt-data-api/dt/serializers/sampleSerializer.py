from rest_framework import serializers
from dt.models.sampleModel import sampleModel

class sampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = sampleModel
        fields = "__all__"