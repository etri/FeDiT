import json
from typing import Any, Optional

import redis


class RedisQueue:
    """
        Redis Lists are an ordered list, First In First Out Queue
        Redis List pushing new elements on the head (on the left) of the list.
        The max length of a list is 4,294,967,295
    """

    def __init__(self, name: str, **redis_kwargs):
        self.key = name
        self.rq = redis.Redis(**redis_kwargs)

    def size(self) -> int:
        return self.rq.llen(self.key)

    def is_empty(self) -> bool:
        return self.size() == 0

    def clear(self):
        self.rq.delete(self.key)

    def put(self, element: Any) -> Any:
        return self.rq.lpush(self.key, element)  # left push

    def put_json(self, element: Any) -> Any:
        return self.put(json.dumps(element))

    def get(self, is_blocking: bool = False, timeout: Optional[int] = None) -> Any:
        if is_blocking:
            element = self.rq.brpop(self.key, timeout=timeout)  # blocking right pop
            return element[1] if element else None  # key[0], value[1]
        else:
            return self.rq.rpop(self.key)  # right pop

    def get_json(self, is_blocking: bool = False, timeout: Optional[int] = None) -> Any:
        res = self.get(is_blocking=is_blocking, timeout=timeout)
        if res:
            return json.loads(res)

    def get_without_pop(self) -> Any:  # 꺼낼 데이터 조회
        if self.is_empty():
            return None

        return self.rq.lindex(self.key, -1)


__all__ = [
    'RedisQueue'
]
