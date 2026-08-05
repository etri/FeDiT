from __future__ import annotations

import os
from contextlib import AbstractContextManager
from typing import Any, Iterable, Sequence

import psycopg
from psycopg.rows import dict_row


DATABASE_URL_ENV_NAMES = (
    "PREDICTION_MANAGER_DATABASE_URL",
    "DATA_COLLECTION_DATABASE_URL",
)


def database_url() -> str:
    for name in DATABASE_URL_ENV_NAMES:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    raise RuntimeError(
        "PostgreSQL database URL is required. Set PREDICTION_MANAGER_DATABASE_URL."
    )


class PostgresConnection(AbstractContextManager):
    def __init__(self, url: str | None = None):
        self._conn = psycopg.connect(url or database_url(), row_factory=dict_row)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self._conn.commit()
        else:
            self._conn.rollback()
        self._conn.close()
        return False

    @staticmethod
    def _sql(sql: str) -> str:
        return sql.replace("?", "%s")

    def execute(self, sql: str, params: Sequence[Any] | None = None):
        return self._conn.execute(self._sql(sql), params or ())

    def executemany(self, sql: str, params_seq: Iterable[Sequence[Any]]):
        cur = self._conn.cursor()
        cur.executemany(self._sql(sql), params_seq)
        return cur

    def commit(self) -> None:
        self._conn.commit()

    def rollback(self) -> None:
        self._conn.rollback()

    def close(self) -> None:
        self._conn.close()


def connect(url: str | None = None) -> PostgresConnection:
    return PostgresConnection(url)


INTEGRITY_ERROR = psycopg.IntegrityError
