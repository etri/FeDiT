from django.conf import settings

MAIN_PATH = getattr(settings, 'MAIN_PATH', 'localhost')
MODEL_PATH = getattr(settings, 'MODEL_PATH', 'localhost')
DATA_PATH = getattr(settings, 'DATA_PATH', 'localhost')
UPLOAD_PATH = getattr(settings, 'UPLOAD_PATH', 'localhost')
