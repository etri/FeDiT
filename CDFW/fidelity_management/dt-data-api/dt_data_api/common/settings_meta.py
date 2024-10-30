from django.conf import settings

MAIN_PATH_META = getattr(settings, 'MAIN_PATH_META', 'localhost')
MODEL_PATH_META = getattr(settings, 'MODEL_PATH_META', 'localhost')
MODEL_AE_PATH_META = getattr(settings, 'MODEL_AE_PATH_META', 'localhost')
DATA_PATH_META = getattr(settings, 'DATA_PATH_META', 'localhost')
UPLOAD_PATH_META = getattr(settings, 'UPLOAD_PATH_META', 'localhost')