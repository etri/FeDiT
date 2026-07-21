FROM apache/airflow:2.9.3-python3.11

USER root

RUN mkdir -p /opt/airflow/dags /opt/airflow/plugins /opt/airflow/logs /opt/airflow/data

COPY --chown=airflow:0 ./docker/airflow/requirements.txt /requirements.txt
COPY --chown=airflow:0 ./airflow/dags /opt/airflow/dags
COPY --chown=airflow:0 ./airflow/plugins /opt/airflow/plugins
COPY --chown=airflow:0 ./docker/airflow/airflow.cfg /opt/airflow/airflow.cfg

RUN chmod -R ug+rwX /opt/airflow/dags /opt/airflow/plugins /opt/airflow/logs /opt/airflow/data \
    && chmod ug+rw /opt/airflow/airflow.cfg /requirements.txt

USER airflow

RUN pip install --no-cache-dir -r /requirements.txt