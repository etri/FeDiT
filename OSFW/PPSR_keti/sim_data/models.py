import os
from typing import *

from django.conf import settings
from django.db.models import *
from django.utils import timezone as tz
from numpy.typing import *


class SimData(Model):
    class Meta:
        verbose_name = '시뮬레이션 데이터'
        verbose_name_plural = verbose_name

    src = FileField('원본 파일', null=True, blank=True, upload_to='data/src/')
    dest = FileField('변환 파일', null=True, blank=True, upload_to='data/dest/')
    creation_time = DateTimeField('생성 시각', auto_now_add=True)

    def __str__(self):
        return f'원본:{self.src.name} 생성:{self.creation_time.strftime("%Y-%m-%d %H:%M:%S")}'

    def convert_if_not(self) -> bool:
        if self.dest:
            return False

        src_name, _ = os.path.splitext(os.path.basename(self.src.name))
        dest_name = settings.DATA_DEST_DIR / f"{src_name}_{self.creation_time.astimezone(tz.get_current_timezone()).strftime('%Y%m%d_%H%M%S')}.dat"
        dest_path = settings.MEDIA_ROOT / dest_name

        # TODO: 데이터 변환

        # 일단, 그대로 생성한다.
        with open(self.src.path, 'rb') as f:
            data = f.read()

        with open(dest_path, 'wb') as f:
            f.write(data)

        self.dest.name = str(dest_name)
        self.save()
        return True

    def remove_converted_data(self) -> bool:
        if self.dest:
            os.remove(self.dest.path)
            self.dest = None
            self.save()
            return True

        return False


__all__ = [
    'SimData',
]
