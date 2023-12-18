import logging

from .admin import register

register()

logger = logging.getLogger('fanta')

__all__ = [
    'logger'
]
