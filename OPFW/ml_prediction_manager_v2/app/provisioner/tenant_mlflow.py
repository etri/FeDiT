from __future__ import annotations

import os
from urllib.parse import urlparse, urlunparse

import psycopg
from psycopg import sql
from kubernetes import client, config
from kubernetes.client.rest import ApiException


def _required(name: str) -> str:
    value = os.environ.get(name, '').strip()
    if not value:
        raise RuntimeError(f'{name} is required')
    return value


def _namespace_db(namespace: str) -> str:
    return namespace.replace('-', '_')


def _postgres_url_for_admin(backend_uri: str) -> str:
    parsed = urlparse(backend_uri.replace('postgresql+psycopg2://', 'postgresql://', 1))
    return urlunparse(parsed._replace(path='/postgres'))


def _database_name(backend_uri: str) -> str:
    parsed = urlparse(backend_uri.replace('postgresql+psycopg2://', 'postgresql://', 1))
    name = parsed.path.lstrip('/')
    if not name:
        raise RuntimeError('backend URI does not include database name')
    return name


def _ensure_database(backend_uri: str) -> str:
    db_name = _database_name(backend_uri)
    admin_url = _postgres_url_for_admin(backend_uri)
    with psycopg.connect(admin_url, autocommit=True) as conn:
        exists = conn.execute(
            'SELECT 1 FROM pg_database WHERE datname = %s',
            (db_name,),
        ).fetchone()
        if not exists:
            conn.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(db_name)))
    return db_name


def _ensure_secret(namespace: str, name: str, key: str, value: str) -> None:
    try:
        config.load_incluster_config()
    except config.ConfigException:
        config.load_kube_config()
    core_v1 = client.CoreV1Api()
    body = client.V1Secret(
        metadata=client.V1ObjectMeta(
            name=name,
            namespace=namespace,
            labels={'app.kubernetes.io/managed-by': 'prediction-manager'},
        ),
        type='Opaque',
        string_data={key: value},
    )
    try:
        core_v1.read_namespaced_secret(name, namespace)
        core_v1.patch_namespaced_secret(name, namespace, body)
        print(f'secret/{name}:patched namespace={namespace}', flush=True)
    except ApiException as exc:
        if exc.status != 404:
            raise
        core_v1.create_namespaced_secret(namespace, body)
        print(f'secret/{name}:created namespace={namespace}', flush=True)


def main() -> None:
    namespace = _required('TARGET_NAMESPACE')
    template = _required('MLFLOW_BACKEND_STORE_URI_TEMPLATE')
    secret_name = os.environ.get('MLFLOW_SECRET_NAME', 'mlflow-postgres-backend').strip() or 'mlflow-postgres-backend'
    secret_key = os.environ.get('MLFLOW_SECRET_KEY', 'MLFLOW_BACKEND_STORE_URI').strip() or 'MLFLOW_BACKEND_STORE_URI'
    backend_uri = template.format(namespace=namespace, namespace_db=_namespace_db(namespace))
    db_name = _ensure_database(backend_uri)
    _ensure_secret(namespace, secret_name, secret_key, backend_uri)
    print(f'mlflow_database:{db_name}:ready', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        message = str(exc)
        template = os.environ.get('MLFLOW_BACKEND_STORE_URI_TEMPLATE', '')
        if template:
            message = message.replace(template, '<redacted>')
        print(f'provisioner_error:{type(exc).__name__}:{message}', flush=True)
        os._exit(1)
    os._exit(0)
