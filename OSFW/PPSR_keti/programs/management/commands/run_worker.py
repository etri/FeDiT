import json
import threading
import time
import traceback
from _queue import Empty
from copy import deepcopy
from json.decoder import JSONDecodeError
from typing import Any, List

import djclick as click
from django.conf import settings
from django.utils import timezone
from node_vm2 import VM, NodeVM, VMError

from programs.models import Execution
from fanta import logging
from fanta.queue import RedisQueue


@click.command()
def main():
    q = RedisQueue(settings.MQ_WORKER, db=settings.MQ_REDIS_DB)
    logging.info(__name__, 'worker 가 시작되었습니다.')

    try:
        while True:
            # wait for events
            try:
                msg = q.get_json(is_blocking=True, timeout=settings.WORKER_WAIT_TIME)

            except JSONDecodeError:
                logging.warning(__name__, f"JSON 형식에 맞지 않는 알림 메시지가 수신되었습니다.")
                continue

            # update  requests
            if msg:
                sender = msg.get('sender')
                if sender and sender != threading.get_ident():
                    logging.debug(__name__, f"수신된 메시지: {json.dumps(msg)}")
                    handle_message(msg)
                    time.sleep(1.0)  # FIXME: 이렇게 잠깐 쉬어주어야, update 문에서 filter 문장에 걸린다.

            update()

    except KeyboardInterrupt:
        logging.info(__name__, 'worker 를 종료합니다.')


def handle_message(msg):
    # TODO: 메시지 핸들링
    pass


def update():
    for i in Execution.objects.filter(status=Execution.Status.REQUESTED.value):
        # 실행 시각
        i.start_time = timezone.now()
        i.save(update_fields=['start_time'])

        # 실행 환경
        with NodeVM(console="redirect", require={
            "external": True,
            "builtin": ["*"],
        }) as vm:
            try:
                module = i.program.trans_and_run(vm)
                params: List[Any] = deepcopy(i.parameter)
                ret = module.call_member(i.function, params)
                save_return_value(i, ret)

            except VMError as e:
                save_error(i)

            except BaseException as e:
                save_error(i)

            save_events(i, vm)

        # 종료 시각
        i.finish_time = timezone.now()
        i.save(update_fields=['finish_time'])


def save_return_value(i: Execution, return_value):
    i.return_value = return_value
    i.status = Execution.Status.COMPLETED.value
    i.save(update_fields=['status', 'return_value'])


def save_error(i: Execution):
    i.return_value = None
    i.status = Execution.Status.CRASHED.value
    i.stack_trace = traceback.format_exc()
    i.save(update_fields=['return_value', 'status', 'stack_trace'])


def save_events(i: Execution, vm: VM):
    if vm.event_que:
        if i.program.wait_time_on_exit > 0:
            time.sleep(i.program.wait_time_on_exit)

        stdout = []
        try:
            while True:
                e = vm.event_que.get(False)
                stdout.append('[' + e['name'] + '] ' + e['value'])

        except Empty:
            pass

        i.stdout = '\n'.join(stdout)
        i.save(update_fields=['stdout'])
