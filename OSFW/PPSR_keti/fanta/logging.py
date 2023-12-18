import logging
import sys
from typing import Dict

from colorlog import ColoredFormatter

__loggers: Dict[str, logging.Logger] = {}


def instance(name: str) -> logging.Logger:
    assert isinstance(name, str)

    if name in __loggers:
        return __loggers[name]

    else:
        logger = logging.getLogger(name)
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        formatter = ColoredFormatter('%(log_color)s[%(processName)s][%(threadName)s] %(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setFormatter(formatter)
        handler.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        __loggers[name] = logger
        return logger


def info(name: str, message: str, *args, **keyw) -> None:
    return instance(name).info(message, *args, **keyw)


def debug(name: str, message: str, *args, **keyw) -> None:
    return instance(name).debug(message, *args, **keyw)


def warning(name: str, message: str, *args, **keyw) -> None:
    return instance(name).warning(message, *args, **keyw)


def error(name: str, message: str, *args, **keyw) -> None:
    return instance(name).error(message, *args, **keyw)


def exception(name: str, message: str, *args, **keyw) -> None:
    return instance(name).exception(message, *args, **keyw)


__all__ = ['info', 'debug', 'warning', 'error', 'exception']
