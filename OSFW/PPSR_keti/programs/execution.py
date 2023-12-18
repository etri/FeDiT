import threading
from enum import Enum
from uuid import uuid4

from django.conf import settings
from django.db import models

from fanta.queue import RedisQueue
from .program import Program


class Execution(models.Model):
    class Meta:
        verbose_name = '실행 요청'
        verbose_name_plural = '실행 요청'

    class Status(Enum):
        REQUESTED = 'requested'
        RUNNING = 'running'
        COMPLETED = 'completed'
        CRASHED = 'crashed'

        @classmethod
        def to_choices(cls):
            return (
                (cls.REQUESTED.value, '요청 생성'),
                (cls.RUNNING.value, '실행 중'),
                (cls.COMPLETED.value, '완료'),
                (cls.CRASHED.value, '실패'),
            )

    # 생성
    request_id = models.CharField('ID', max_length=64, primary_key=True, blank=True, default=uuid4)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='executions', verbose_name='프로그램')

    # 진행 상태
    status = models.CharField('처리 상태', max_length=16, choices=Status.to_choices(), db_index=True, default=Status.REQUESTED.value)
    creation_time = models.DateTimeField('생성 시각', auto_now_add=True, db_index=True)
    start_time = models.DateTimeField('실행 시각', null=True, blank=True)
    finish_time = models.DateTimeField('종료 시각', null=True, blank=True)

    # 실행 정보
    function = models.CharField('Function', max_length=64, default="main")
    parameter = models.JSONField('Parameter', blank=True, default=list)

    # 처리 결과
    return_value = models.JSONField('Return Value', null=True, blank=True)
    stack_trace = models.TextField('Stack Trace', null=True, blank=True)
    stdout = models.TextField('Console', max_length=1024 * 1024, null=True, blank=True)

    def __str__(self):
        return f'[실행] {self.program.title}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        q = RedisQueue(settings.MQ_WORKER, db=settings.MQ_REDIS_DB)
        q.put_json({
            'sender': threading.get_ident(),
            'name': 'ExecutionSaved'
        })


__all__ = [
    'Execution'
]
