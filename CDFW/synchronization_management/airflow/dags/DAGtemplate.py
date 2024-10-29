# UI user:password = admin:admin
from airflow import DAG
# Operator
from airflow.operators.bash_operator import BashOperator
from airflow.utils.dates import days_ago
from airflow.operators.python_operator import PythonOperator
from airflow.decorators import task
from airflow.models import Variable

import requests
from datetime import datetime, timedelta
import json
import logging

# Passing Parameters to Operator
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 16),
    # 'email': ['airflow@example.com'],
    # 'email_on_failure': False,
    # 'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    # 'queue': 'bash_queue',
    # 'pool': 'backfill',
    # 'priority_weight': 10,
    # 'end_date': datetime(2016, 1, 1),
    # 'wait_for_downstream': False,
    # 'dag': dag,
    # 'sla': timedelta(hours=2),
    # 'execution_timeout': timedelta(seconds=300),
    # 'on_failure_callback': some_function,
    # 'on_success_callback': some_other_function,
    # 'on_retry_callback': another_function,
    # 'sla_miss_callback': yet_another_function,
    # 'trigger_rule': 'all_success'
}

#############################################################################
# User input required
# Enter registered digital twin object information
#############################################################################
federated_Digital_connector_server_adress = "YOUR_SERVER_ADRESS"
federated_digital_twin_id = "YOUR_FDT_ID"
digital_twin_id = "YOUR_DT_ID"
digital_object_id = "YOUR_DO_ID"


#############################################################################
# User input required
# Enter the creation information required to run DAG
#############################################################################
DAG_ID = "polling_digital_object_data"
schedule_interval_time_minutes = 10


#############################################################################
# User input required
# Please implement the polling_do_data() function including return data.
#############################################################################
def polling_do_data():
    # HTTP GET request to fetch data from API
    url = "YOUR_POST_API_URL_HERE"
    
    response = requests.get(url)
    
    data = response.json()

    return data


def postRequest(**kwargs):
    # HTTP POST request to send data to FDT platform's create data API
    url = "http://"+ federated_Digital_connector_server_adress +":1219/fedit/v1/federated-twins/"+federated_digital_twin_id+"/digital-twins/"+digital_twin_id+"/digital-objects/"+digital_object_id+"/data"
    headers = {
    'Content-Type': 'application/json',
    }

    data = kwargs['task_instance'].xcom_pull(task_ids='polling_do_data')
    response = requests.post(url, json=data, headers=headers)


with DAG(
    dag_id=DAG_ID, 
    default_args=default_args,
    schedule_interval=timedelta(minutes=schedule_interval_time_minutes),
    catchup=False
) as dag:

    polling_task = PythonOperator(
        task_id='polling_do_data',
        python_callable=polling_do_data,
    )

    post_request_task = PythonOperator(
        task_id='post_do_data',
        python_callable=postRequest,
        provide_context=True,
    )

    polling_task >> post_request_task