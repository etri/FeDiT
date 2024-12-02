FROM pytorch/pytorch:latest
WORKDIR /notebooks
RUN apt-get update && apt-get install -y python3 python3-pip && pip3 install jupyter
CMD ["jupyter", "notebook", "--ip=0.0.0.0", "--port=8888", "--allow-root"]
EXPOSE 8888
