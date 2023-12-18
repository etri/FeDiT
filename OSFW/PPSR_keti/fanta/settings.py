import os
from pathlib import Path

try:
    IS_DEV_SERVER = os.environ['DEV_SERVER']
except KeyError:
    print("환경 변수 DEV_SERVER 가 정의되어 있지 않습니다: 운영 서버를 가정합니다.")
    IS_DEV_SERVER = False

# 개발 중이니, 당분간 무조건 Debug 모드로.
# DEBUG = IS_DEV_SERVER
DEBUG = True

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = '2trht!1m(8@!1^03xvsi0@axutg(*qa!7(9xng&l!!#f)g!9r0'

ALLOWED_HOSTS = [
    'fanta.local',
]

CSRF_TRUSTED_ORIGINS = [
]

INSTALLED_APPS = [
    'admin_interface',
    'colorfield',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'constance',

    # 'crispy_forms',
    'rest_framework',
    'django_filters',

    'drf_yasg2',
    'import_export',
    'django_extensions',
    'rangefilter',
    'django_json_widget',

    'users.apps.UsersConfig',
    'programs.apps.ProgramsConfig',
    'cli.apps.CliConfig',
    'sim_data.apps.SimDataConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'fanta.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'fanta.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'fanta',
        'USER': 'fanta_user',
        'PASSWORD': 'fanta_user',
        'HOST': 'localhost',
        'PORT': '3306',
        'CONN_MAX_AGE': 10,
    },
}

DATABASE_CONNECTION_POOLING = True

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'ko-KR'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_L10N = False

USE_TZ = True

STATIC_URL = '/static/'  # baton 이 static/baton 으로 하드 코딩 되어 있어서, 변경하면 안된다.

STATICFILES_DIRS = [
    BASE_DIR / "static"
]

STATIC_ROOT = BASE_DIR / 'collected-statics'

MEDIA_ROOT = BASE_DIR / "media"

DATA_SRC_DIR = Path("data/src")
DATA_DEST_DIR = Path("data/dest")

os.makedirs(MEDIA_ROOT / DATA_SRC_DIR, exist_ok=True)
os.makedirs(MEDIA_ROOT / DATA_DEST_DIR, exist_ok=True)

MEDIA_URL = "/media/"

AUTH_USER_MODEL = 'users.User'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}

LOGIN_URL = '/fanta/auth/login/'
LOGIN_REDIRECT_URL = '/'

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

REST_FRAMEWORK = {
    'DATETIME_FORMAT': "%Y-%m-%d %H:%M:%S",
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication'
    ],
    # 'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    # 'PAGE_SIZE': 1000
}

CONSTANCE_CONFIG = {
    'USER_INITIAL_GROUPS': ('G_READ', '회원 가입 시, 초기 권한', str),
}

CONSTANCE_CONFIG_FIELDSETS = {
    '99. 사용자 관리': {
        'fields': (
            'USER_INITIAL_GROUPS',
        ),
        'collapse': False
    }
}

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

MQ_WORKER = 'worker'
MQ_REDIS_DB = 3
WORKER_WAIT_TIME = 30

# used by django-admin-interface
X_FRAME_OPTIONS = "SAMEORIGIN"
SILENCED_SYSTEM_CHECKS = ["security.W019"]

DATETIME_FORMAT = 'Y-m-d H:i:s'

FONT_ROOT = os.path.join(BASE_DIR, 'static', 'fonts')

SWAGGER_SETTINGS = {
    "DEFAULT_GENERATOR_CLASS": "rest_framework.schemas.openapi.SchemaGenerator"
}
