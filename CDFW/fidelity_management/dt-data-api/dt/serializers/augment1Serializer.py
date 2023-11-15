from rest_framework import serializers
from dt.models.augment1Model import augment1Model

class augment1Serializer(serializers.ModelSerializer):
    class Meta:
        model = augment1Model
        fields = "__all__"