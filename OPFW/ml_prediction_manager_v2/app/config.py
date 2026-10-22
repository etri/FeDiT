from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    registry_url: str = "http://registry.example.local:5000"
    registry_host: str = "registry.example.local:5000"
    default_namespace: str = "kubeflow-user-example-com"
    kubeflow_url: str = "https://kubeflow.example.local"
    notebook_public_url: str = ""
    notebook_proxy_cpu_request: str = ""
    notebook_max_cpu: str = "1"
    notebook_max_memory: str = "4Gi"
    notebook_max_running: int = 2
    notebook_priority_class: str = "prediction-manager-compute"
    docker_socket: str = "unix:///var/run/docker.sock"
    prometheus_url: str = "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090"
    app_title: str = "예측매니저"


settings = Settings()
