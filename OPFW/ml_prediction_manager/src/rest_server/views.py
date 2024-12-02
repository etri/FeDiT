import io
import shutil
import socket
from django.conf import settings
from django.shortcuts import render
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import docker
import subprocess
import re
# docker API : https://docker-py.readthedocs.io/en/stable/index.html

from .models import Container, Image
from django.core.files.storage import FileSystemStorage  
from django.http import JsonResponse



# 다른 서버의 IP 주소
remote_docker_ip = '192.168.0.174'

# 원격 Docker 서버에 연결
# client = docker.DockerClient(base_url=f'tcp://{remote_docker_ip}:2375')
# 내 도커 데스트탑에 연결
client = docker.from_env()


@api_view(['GET'])
def my_ip(req):

    print("my_ip 실행")

    try:
        response = requests.get('https://api.ip.pe.kr/json/')
        print(response)
        external_ip = response.json().get('ip')
        print(f"get_IP_1 : {external_ip}")

        return Response({'success': True, 'message': external_ip})
    
    except Exception as e :
        return Response({'success': False, 'message': f'네트워크에 문제가 있습니다 : {e}'})



@api_view(['POST'])
def change_cont_name(req):

    try:

        print("change_cont_name")

        old_cont_name = req.data.get('old_name')
        new_cont_name = req.data.get('new_name')

        dc_container = client.containers.get(old_cont_name)
        dc_container.rename(new_cont_name)

        print(f"컨테이너 이름이 '{old_cont_name}'에서 '{new_cont_name}'으로 변경되었습니다.")

        renamed_container = client.containers.get(new_cont_name)

        if renamed_container != None:            
            container = Container.objects.get(name=old_cont_name)
            container.name = new_cont_name
            container.save()

        return Response({'success': True, 'message': f'컨테이너 이름이 {old_cont_name}에서 {new_cont_name}으로 변경되었습니다.'})

    except Exception as e :

        return Response({'success': False, 'message': f'네트워크에 문제가 있습니다 : {e}'})




@api_view(['POST'])
def upload_image(req):

    try:
        # 도커파일 내용
        dockerfile_content = req.data.get('dockerFile')

        type = req.data.get('type')
        service = req.data.get('service')
        name = req.data.get('name')
        # file = req.FILES.get('file')
        workdir = req.data.get('workdir')

        if dockerfile_content == '':
            return Response({'success': False, 'message': '도커 파일을 작성하지 않았습니다.'})
        elif name == '':
            return Response({'success': False, 'message': '이미지 이름을 입력하지 않았습니다.'})
        # elif file == None:
        #     return Response({'success': False, 'message': '업로드된 주피터노트북 파일이 없습니다.'})
        elif workdir == None:
            return Response({'success': False, 'message': 'workdir를 입력하지 않았습니다.'})

        internalPort_tb = None
        internalPort_nb = None

        port_pattern = re.compile(r'--port=(\d+)')

        # Dockerfile 내용 줄 단위로 처리
        for line in dockerfile_content.split('\n'):
            matches = port_pattern.findall(line)
            if matches:
                if len(matches) > 0:
                    internalPort_nb = int(matches[0])  # 첫 번째 포트 번호 저장
                if len(matches) > 1:
                    internalPort_tb = int(matches[1])  # 두 번째 포트 번호 저장
                break

        # 기본 포트 설정
        if internalPort_nb is None:
            internalPort_nb = 9500
        if internalPort_tb is None:
            internalPort_tb = 10500

        img_obj = Image.objects.filter(name=name).first()
        if img_obj != None:
            return Response({'success': False, 'message': '이미 같은 이름의 이미지가 존재합니다.'})

        print("도커 이미지 빌드 중...")
        image, build_logs = client.images.build(
            fileobj=io.BytesIO(dockerfile_content.encode('utf-8')),
            tag=name,
        )

        # 데이터베이스에 새로운 레코드 생성
        Image.objects.create(
            name=name,
            type=type,
            service=service,
            status="CREATE",
            internalPort_tb=internalPort_tb,
            internalPort_nb=internalPort_nb,
            workdir=workdir,
            # date 필드는 자동으로 현재 시간이 저장됩니다.
        )

        image = Image.objects.get(name=name)
        image_id = str(image.id)

        return Response({'success': True, 'message': '도커파일로 이미지가 생성되었습니다.'})
    except Exception as e:
        return Response({'success': False, 'message': f'네트워크에 문제가 있습니다 : {e}'})




    
# 컨테이너 실행 API
@api_view(['POST'])
def start_container(req):

    network_basic_ex_port = 39001

    print(req.data)

    # POST 요청에서 컨테이너 이름 가져오기    
    container_name = req.data.get('container_name')
    externalPort_tb = req.data.get('externalPort_tb')
    externalPort_nb = req.data.get('externalPort_nb')
    internalPort_tb = req.data.get('internalPort_tb')
    internalPort_nb = req.data.get('internalPort_nb')    
    container_path = req.data.get('container_path')
    # host_path = req.data.get('host_path')
    service = req.data.get('image_service')
    env_variable = req.data.get('env_variable')    
    env_value = req.data.get('env_value')   
    image_name = req.data.get('image_name')    
    image_id = req.data.get('image_id')
    image_type = req.data.get('image_type')

    if not container_name:
        return Response({'success': False, 'message': '도커 컨테이너 이름을 제공해야 합니다.'})
    if not externalPort_tb:
        return Response({'success': False, 'message': '텐서보드 포트(외부네트워크)를 제공해야 합니다.'})    
    if not externalPort_nb:
        return Response({'success': False, 'message': '주피터노트북 포트(외부네트워크)를 제공해야 합니다.'})    
    if not internalPort_tb:
        return Response({'success': False, 'message': '텐서보드 포트(도커내부)를 제공해야 합니다.'})            
    if not internalPort_nb:
        return Response({'success': False, 'message': '주피터노트북 포트(도커내부)를 제공해야 합니다.'})
    if not container_path:
        return Response({'success': False, 'message': '볼륨의 컨테이너 패스를 제공해야 합니다.'})        

    
    
    
    # 호스트 = os.path.join(settings.BASE_DIR, 'uploads', 'test.ipynb')
    # 주피터노트북파일위치 = '/notebooks/test.ipynb'

    try:
        # 도커 클라이언트를 사용하여 컨테이너 실행


        exist_container_obj = Container.objects.filter(name=container_name).first()
        if exist_container_obj != None : return Response({'success': False, 'message': "이미 존재하는 컨테이너 이름입니다. 다른 컨테이너 이름을 적어주세요."})

        port_check = True

        containers_list = client.containers.list()
        for container in containers_list:
            print('컨테이너 목록')
            container_ports = container.attrs['NetworkSettings']['Ports']
            print(container_ports)
            # 각 포트 매핑을 순회하며 외부 포트와 비교
            for container_port, mappings in container_ports.items():
                if mappings is not None:  # 매핑 정보가 있는 경우만 검사
                    for mapping in mappings:
                        if mapping['HostPort'] == externalPort_tb:
                            port_check = False  # 매핑된 호스트 포트가 주어진 포트와 일치
                            if port_check == False : return Response({'success': False, 'message': f'이미 사용 중인 접속포트(텐서보드 : {externalPort_tb})입니다. 다른 포트를 적어주세요.'})

                        if mapping['HostPort'] == externalPort_nb:
                            port_check = False  # 매핑된 호스트 포트가 주어진 포트와 일치
                            if port_check == False : return Response({'success': False, 'message': f'이미 사용 중인 접속포트(주피터노트북 : {externalPort_nb})입니다. 다른 포트를 적어주세요.'})
                        
        


        print("> 호스트 볼륨을 생성합니다 >>")

        # 컨테이너 디렉토리 생성(볼륨마운트 용도)
        folder_path = os.path.join(settings.MEDIA_ROOT, container_name)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)    
                

        # 볼륨 마운트 호스트 패스
        host_path = os.path.join(settings.BASE_DIR, 'uploads', container_name)
        # 환경변수 세팅
        environment_vars = {env_variable : env_value}


        print("> 컨테이너 생성 시작 >>")        

        # !!! 240705 포트포워딩 내부 포트 결정 (41001~50000) !!! 잠시 주석처리 (현재는 내외부 동일하게 코딩)
        # internalPortFwd_nb = int(externalPort_nb) - network_basic_ex_port + 41001
        # internalPortFwd_tb = int(externalPort_tb) - network_basic_ex_port + 41001
        internalPortFwd_nb = internalPort_nb
        internalPortFwd_tb = internalPort_tb


        # 컨테이너 생성 및 옵션
        if env_variable != '' and env_variable != None :
            containers = client.containers.create(
                image=image_name,
                name=container_name,
                ports = {internalPort_nb + '/tcp': externalPort_nb, 
                         internalPort_tb + '/tcp': externalPort_tb},
                volumes={
                    host_path: {
                        'bind': container_path,
                        'mode': 'rw'
                    }
                },
                environment = environment_vars,
                # detach=True  # 컨테이너를 백그라운드에서 실행
            )

        else :
            containers = client.containers.create(
                image=image_name,
                name=container_name,
                ports = {internalPort_nb + '/tcp': externalPort_nb, 
                         internalPort_tb + '/tcp': externalPort_tb},
                volumes={
                    host_path: {
                        'bind': container_path,
                        'mode': 'rw'
                    }
                },
                # detach=True  # 컨테이너를 백그라운드에서 실행
            )            
        
        

        # 데이터베이스에 새로운 레코드 생성
        new_container = Container.objects.create(
            # id=image_id,
            name=container_name,
            type=image_type,
            service=service,
            status="SAMPLE",
            play=0,
            image_name=image_name,
            internalPort_nb=internalPort_nb,
            internalPort_tb=internalPort_tb,
            externalPort_nb=externalPort_nb,
            externalPort_tb=externalPort_tb,
            internalPortFwd_nb = internalPortFwd_nb,
            internalPortFwd_tb = internalPortFwd_tb,

            # date 필드는 자동으로 현재 시간이 저장됩니다.
        )                

        print("_컨테이너를 생성하였습니다. : ", containers)
        print("_컨테이너를 실행시도 : ", containers)

        running_container_obj_tb = Container.objects.filter(externalPort_tb=externalPort_tb, play=1).first()
        running_container_obj_nb = Container.objects.filter(externalPort_nb=externalPort_nb, play=1).first()
        print("running tb port >> ", running_container_obj_tb)
        print("running nb port >> ", running_container_obj_nb)
        if running_container_obj_tb != None : 
            return Response({'success': False, 'message': f"컨테이너가 생성되었으나, 이미 사용 중인 포트(텐서보드 : {running_container_obj_tb})가 존재하여 컨테이너가 실행되지 않았습니다."})      
        if running_container_obj_nb!= None: 
            return Response({'success': False, 'message': f"컨테이너가 생성되었으나, 이미 사용 중인 포트(주피터노트북 : {running_container_obj_nb})가 존재하여 컨테이너가 실행되지 않았습니다."})    

        container = client.containers.get(container_name)        
        container.start()   

        new_container.play = 1
        new_container.save()

        print("_컨테이너가 실행되었습니다. : ", containers)

        return Response({'success': True, 'message': '컨테이너를 성공적으로 생성 후 실행하였습니다.'})
    except docker.errors.NotFound as e:
        return Response({'success': False, 'message': f'컨테이너를 찾을 수 없습니다: {e}'})
    except docker.errors.APIError as e:
        return Response({'success': False, 'message': f'컨테이너 실행 중 오류 발생: {e}'})


# 컨테이너 시동, 종료 스위치
@api_view(['POST'])
def switchContainer(req):
    # POST 요청에서 컨테이너 정보 가져오기    
    container_id = req.data.get('container_id')
    container_name = req.data.get('container_name')
    externalPort_nb = req.data.get('externalPort_nb')
    externalPort_tb = req.data.get('externalPort_tb')
    # internalPort_nb = req.data.get('internalPort_nb')
    # internalPort_tb = req.data.get('internalPort_tb')

    if not container_name:
        return Response({'success': False, 'message': '도커 컨테이너 이름을 제공해야 합니다.'})
    if not externalPort_tb:
        return Response({'success': False, 'message': '텐서보드 포트(외부네트워크)를 제공해야 합니다.'})    
    if not externalPort_nb:
        return Response({'success': False, 'message': '주피터노트북 포트(외부네트워크)를 제공해야 합니다.'})    
    # if not internalPort_tb:
    #     return Response({'success': False, 'message': '텐서보드 포트(도커내부)를 제공해야 합니다.'})            
    # if not internalPort_nb:
    #     return Response({'success': False, 'message': '주피터노트북 포트(도커내부)를 제공해야 합니다.'})
    
    try:
        print("_컨테이너를 찾습니다...")

        # 도커 클라이언트를 사용하여 컨테이너 찾기
        container = client.containers.get(container_name)

        container_obj = Container.objects.get(id=container_id)

        print(container_obj.__dict__)

        if container_obj.play is True:
            print("_컨테이너를 중지합니다...")            
            container.stop()
            container_obj.play = False
            container_obj.save()
            print("_컨테이너가 중지되었습니다.")
            return Response({'success': True, 'switch': 0 , 'message': '컨테이너가 중지되었습니다.'})



        elif container_obj.play is False:
            
            running_container_obj_tb = Container.objects.filter(externalPort_tb=externalPort_tb, play=1).first()
            running_container_obj_nb = Container.objects.filter(externalPort_nb=externalPort_nb, play=1).first()
            print("running nb port >> ", running_container_obj_tb)
            print("running nb port >> ", running_container_obj_nb)
            if running_container_obj_tb != None : 
                return Response({'success': False, 'message': f"이미 사용 중인 포트(텐서보드 : {externalPort_tb})가 존재하여 컨테이너가 실행되지 않았습니다."})                        
            if running_container_obj_nb!= None :
                return Response({'success': False, 'message': f"이미 사용 중인 포트(주피터노트북 : {externalPort_nb})가 존재하여 컨테이너가 실행되지 않았습니다."})            
                

            print("_컨테이너를 시작합니다...")  
            container.start()
            container_obj.play = True
            container_obj.save()            
            print("_컨테이너를 시작하였습니다.")  
            return Response({'success': True, 'switch': 1, 'message': '컨테이너가 시작되었습니다.'})

        return Response({'success': False, 'message': '컨테이너 동작에 문제가 있습니다.'})
    except docker.errors.NotFound as e:
        return Response({'success': False, 'message': f'컨테이너를 찾을 수 없습니다: {e}'})
    except docker.errors.APIError as e:
        return Response({'success': False, 'message': f'컨테이너 중지 중 오류 발생: {e}'})


# 도커 이미지 리스트를 받아오는 API
@api_view(['GET'])
def get_images(req_no_use):
    try:
        # 도커 클라이언트를 사용하여 이미지 리스트를 가져오기
        # image_list = []
        # for image in client.images.list():
        #     image_list.append(image.tags)

        image_qs = Image.objects.all()

        image_list = []
        for data in image_qs:
            data_dict = {
                'id' : data.id,
                'name': data.name,
                'type': data.type,
                'service': data.service,
                'status': data.status,
                'date': data.date,
                'internalPort_nb' : data.internalPort_nb ,
                'internalPort_tb' : data.internalPort_tb ,
                'workdir' : data.workdir,
            }
            image_list.append(data_dict)        


        print(image_list)
        print("---------------------------------------------")        

        client = docker.from_env()
        images = client.images.list()

        print(images)

        for image in images:
            print(f"이미지 ID: {image.id}")
            print(f"이미지 태그: {image.tags}")
            print("---------------------------------------------")

        containers = client.containers.list()

        for container in containers:
            print(f"컨테이너 ID: {container.id}")
            print(f"컨테이너 이름: {container.name}")
            print(f"컨테이너 상태: {container.status}")
            print(f"컨테이너 종류: {container.attrs['Config']['Image']}")
            print("---------------------------------------------")            

        return Response({'success': True, 'image_list': image_list})
    except docker.errors.APIError as e:
        # API 오류 발생 시 처리
        return Response({'success': False, 'message': f'도커 API 오류 발생: {e}'})


# 도커 컨테이너 리스트를 받아오는 API
@api_view(['GET'])
def get_containers(req):
    try:
        # 도커 클라이언트를 사용하여 컨테이너 리스트를 가져오기
        # container_list = []
        # for container in client.containers.list(all=True):
        #     container_list.append(container.name)

        container_qs = Container.objects.all()

        container_list = []
        for data in container_qs:
            data_dict = {
                'id' : data.id,
                'name': data.name,
                'type': data.type,
                'service': data.service,
                'status': data.status,
                'date': data.date,
                'play': data.play,
                'externalPort_nb': data.externalPort_nb,
                'externalPort_tb': data.externalPort_tb,                
                'internalPort_nb': data.internalPort_nb,
                'internalPort_tb': data.internalPort_tb,                
                'image_name' : data.image_name,
            }
            container_list.append(data_dict)        


        return Response({'success': True, 'container_list': container_list})
    except docker.errors.APIError as e:
        # API 오류 발생 시 처리
        return Response({'success': False, 'message': f'도커 API 오류 발생: {e}'})

@api_view(['DELETE'])
def delete_container(req):
    # DELETE 요청에서 컨테이너 이름 가져오기
    container_name = req.data.get('container_name')
    container_id = req.data.get('container_id')
    if not container_name:
        return Response({'success': False, 'message': '컨테이너 이름을 제공해야 합니다.'})

    try:

        container_obj = Container.objects.get(id=container_id)

        if container_obj.play is True:
             return Response({'success': False, 'message': '컨테이너를 삭제할 수 없습니다. 종료 후 삭제해주세요.'})



        # 도커 클라이언트를 사용하여 컨테이너 가져오기
        client = docker.from_env()
        container = client.containers.get(container_name)

        # 컨테이너 삭제
        container.remove(force=True)
        container_obj.delete()

        # # 컨테이너와 관련된 디렉토리 삭제
        # folder_path = os.path.join(settings.MEDIA_ROOT, container_name)
        # if os.path.exists(folder_path):
        #     shutil.rmtree(folder_path)        

        return Response({'success': True, 'message': '컨테이너가 성공적으로 삭제되었습니다.'})
    except docker.errors.NotFound as e:
        return Response({'success': False, 'message': f'컨테이너를 찾을 수 없습니다: {e}'})
    except docker.errors.APIError as e:
        return Response({'success': False, 'message': f'컨테이너 삭제 중 오류 발생: {e}'})


@api_view(['DELETE'])
def delete_image(req):
    # DELETE 요청에서 이미지 이름 가져오기
    image_name = req.data.get('image_name')
    image_id = req.data.get('image_id')
    if not image_name:
        return Response({'success': False, 'message': '이미지 이름을 제공해야 합니다.'})

    try:

        container_objs = Container.objects.filter(image_name=image_name)

        # 모든 container_objs에 대해 반복
        if len(container_objs) != 0 :
            return Response({'success': False, 'message': '이미지를 삭제할 수 없습니다. 컨테이너 삭제 후 삭제해주세요.'})


        # 도커 클라이언트를 사용하여 이미지 가져오기
        client = docker.from_env()

        print("이미지 찾기")
        try : 
            image = client.images.get(image_name)
            client.images.remove(image.id, force=True)
        except docker.errors.NotFound as e: print(f"해당 이미지 [{image_name}]는 도커 서버에 없습니다.")

        # print("해당 이미지")
        # print(image)

        # 이미지 삭제
        
        # container_obj = Container.objects.filter(id=image_id).first()

        image_obj = Image.objects.filter(id=image_id)
        image_obj.delete()

        return Response({'success': True, 'message': '이미지가 성공적으로 삭제되었습니다.'})
    
        
    except docker.errors.APIError as e:
        return Response({'success': False, 'message': f'이미지 삭제 중 오류 발생: {e}'})
    


def get_container_id(container_name):
    client = docker.from_env()
    containers = client.containers.list()
    for container in containers:
        if container_name in container.name:
            return container.id
    return None


@api_view(['POST'])
def open_jupyter_page(req):

    container_name = req.data.get('container_name')
    externalPort_nb = req.data.get('externalPort_nb')
    internalPort_nb = req.data.get('internalPort_nb')

    running_container_obj = Container.objects.filter(internalPort_nb=internalPort_nb, externalPort_nb=externalPort_nb, play=1).first()
    print("------주피터노트북실행------")
    print(externalPort_nb)
    print(internalPort_nb)
    print(running_container_obj)
    if running_container_obj == None : return Response({'success': False, 'message': "컨테이너가 실행 중이지 않습니다."})  

    if not container_name:
        return Response({'success': False, 'message': 'Container name is required'})

    try:
        # 컨테이너 객체 가져오기
        container = client.containers.get(container_name)
        port_bindings = container.attrs['HostConfig']['PortBindings']
        print('호스트 컨피그')
        print(container.attrs['HostConfig'])
        jupyter_port = port_bindings[internalPort_nb + '/tcp'][0]['HostPort']

        
        
        # 컨테이너 로그 가져오기
        logs = container.logs()

        # print("로그를 출력합니다.")
        # print(logs)

        # Jupyter URL 추출을 위한 정규 표현식
        token_pattern = re.compile(r"\?token=([a-zA-Z0-9]+)")
        # print("토큰패턴 타입")
        # print(type(token_pattern))
        matches = token_pattern.findall(logs.decode('utf-8'))  # 로그를 문자열로 디코딩
        print("matches 리스트")
        # print(type(matches))
        print(matches)

        if matches:
            # Jupyter URL 정보 추출
            latest_token = matches[-1]
            return Response({'success': True, 'token': latest_token, 'port' : externalPort_nb})
        else:
            return Response({'success': False, 'message': '주피터 노트북의 포트와 토큰을 받아올 수 없습니다.'})
    except docker.errors.NotFound:
        # 컨테이너를 찾을 수 없는 경우
        return Response({'success': False, 'message': '컨테이너가 존재하지 않습니다.'})
    except Exception as e:
        # 기타 예외 처리
        return Response({'success': False, 'message': str(e)})


# @api_view(['POST'])
# def open_tensorboard_page(req):

#     container_name = req.data.get('container_name')
#     externalPort_tb = req.data.get('externalPort_tb')
#     internalPort_tb = req.data.get('internalPort_tb')

#     running_container_obj = Container.objects.filter(internalPort_tb=internalPort_tb, externalPort_tb=externalPort_tb, play=1).first()
#     print("------텐서보드실행------")
#     print(externalPort_tb)
#     print(internalPort_tb)
#     print(running_container_obj)
#     if running_container_obj == None : return Response({'success': False, 'message': "컨테이너가 실행 중이지 않습니다."})  

#     if not container_name:
#         return Response({'success': False, 'message': 'Container name is required'})

#     try:
#         # 컨테이너 객체 가져오기
#         container = client.containers.get(container_name)
#         port_bindings = container.attrs['HostConfig']['PortBindings']
#         print('호스트 컨피그')
#         print(container.attrs['HostConfig'])
#         jupyter_port = port_bindings[internalPort_tb + '/tcp'][0]['HostPort']

        
        
#         # 컨테이너 로그 가져오기
#         logs = container.logs()

#         print("로그를 출력합니다.")
#         print(logs)

#         # Jupyter URL 추출을 위한 정규 표현식
#         token_pattern = re.compile(r"\?token=([a-zA-Z0-9]+)")
#         print("토큰패턴 타입")
#         print(type(token_pattern))
#         matches = token_pattern.search(logs.decode('utf-8'))  # 로그를 문자열로 디코딩
#         print("matches 타입")
#         print(type(matches))

#         if matches:
#             # Jupyter URL 정보 추출
#             token = matches.group(1)
#             print('_____token')
#             print(token)
#             return Response({'success': True, 'token': token, 'port' : externalPort_tb})
#         else:
#             return Response({'success': False, 'message': '주피터 노트북의 포트와 토큰을 받아올 수 없습니다.'})
#     except docker.errors.NotFound:
#         # 컨테이너를 찾을 수 없는 경우
#         return Response({'success': False, 'message': '컨테이너가 존재하지 않습니다.'})
#     except Exception as e:
#         # 기타 예외 처리
#         return Response({'success': False, 'message': str(e)})
    

@api_view(['GET'])
def is_docker_run(req):
    try:
        client = docker.from_env()
        client.ping()
        print("도커 실행여부 확인..")
        return Response({'success': True, 'message': ' * 서버의 도커가 실행 중 입니다.'})
    except docker.errors.DockerException:
        return Response({'success': False, 'message': ' * 서버의 도커가 실행 중이지 않습니다.'})