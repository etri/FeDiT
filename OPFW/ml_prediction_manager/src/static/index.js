

//교통트윈
var twin_traffic = [
    '실시간 교통 정보 서비스',
    '노면 기상 정보 서비스',
    '항공 승객 정보 서비스',
    '도로운행 상황 정보 서비스',
    'VVMS 정보 서비스',
    '교차로 CCTV 서비스',
    '주차장 기본 정보 및 현황 정보 서비스',
];

//환경트윈
var twin_env = [
    '날씨 정보 서비스',
    '대기오염 정보 서비스',
    '보건기상지수 서비스',
    '생활기상지수 서비스',
    '미세먼지 시뮬레이터',
];

// 관광트윈
var twin_tour = [
    '관광지 정보 서비스',
    '주차장 정보 서비스',
    '방문객 수 정보 서비스',
    '주차 인지 엔진 서비스',
    'CCTV 서비스',
];

// 나의 현재 아이피를 확인
var remote_docker_cont_ip = '';


const my_ip = () => {
    fetch('rest/my_ip/')
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
            if (data.message) {
                remote_docker_cont_ip = data.message;
                console.log('External IP:', remote_docker_cont_ip);
                const my_ip_html = document.getElementById('my_ip');
                my_ip_html.innerHTML += remote_docker_cont_ip;
            } else {
                throw new Error('IP를 가져오지 못했습니다.');
            }
        })
        .catch((error) => {
            const my_ip_html = document.getElementById('my_ip');
            my_ip_html.innerHTML += "아이피를 가져올 수 없습니다.";
            console.error('Error fetching the IP address:', error);
        });
};

const home_select_cat2 = (self, cat) => {
    var cat2 = document.getElementById('home_cat2');
    var cat2_btn = document.getElementById('home_cat2_btn');
    var cat3 = document.getElementById('home_cat3');
    var cat3_btn = document.getElementById('home_cat3_btn');
    var childs = cat2.children;
    for (var i = 0; i < childs.length; i++) {
        childs[i].classList = '';
    }

    var names = [];
    var html = `<li class="uk-active" onclick="home_select_cat3(this, '서비스 (전체)')"><a href="#">서비스 (전체)</a></li>`;

    if (cat == 'all') {
        cat2_btn.innerText = '단일트윈 (전체)';
        names = twin_env.concat(twin_tour, twin_traffic);
    } else if (cat == 'tour') {
        childs[1].classList = 'uk-active';
        cat2_btn.innerText = '관광트윈';
        names = twin_tour;
        home_set_table([
            { title: '주차장1', desc: '이용시간', data: '10:00~18:00' },
            { title: '주차장1', desc: '요금', data: '1000￦/h' },
            { title: '주차장2', desc: '이용시간', data: '11:00~19:00' },
            { title: '주차장2', desc: '요금', data: '1200￦/h' },
            { title: '주차장3', desc: '이용시간', data: '12:00~20:00' },
            { title: '주차장3', desc: '요금', data: '1400￦/h' },
            { title: '주차장4', desc: '이용시간', data: '12:00~21:00' },
            { title: '주차장4', desc: '요금', data: '1600￦/h' },
        ]);
    } else if (cat == 'traffic') {
        cat2_btn.innerText = '교통트윈';
        names = twin_traffic;
        home_set_table([]);
    } else if (cat == 'env') {
        cat2_btn.innerText = '환경트윈';
        names = twin_env;
        home_set_table([]);
    }
    self.classList = 'uk-active';

    for (var i = 0; i < names.length; i++) {
        var item = names[i];
        html += `<li onclick="home_select_cat3(this, '${item}')" name="${item}"><a href="#">${item}</a></li>`;
    }

    cat3.innerHTML = html;

    cat3_btn.innerText = '서비스 (전체)';
};

const home_select_cat3 = (self, cat) => {
    var cat3 = document.getElementById('home_cat3');
    var cat3_childs = cat3.children;
    var cat3_btn = document.getElementById('home_cat3_btn');
    for (var i = 0; i < cat3_childs.length; i++) {
        cat3_childs[i].classList = '';
    }
    self.classList = 'uk-active';
    cat3_btn.innerText = cat;

    if (cat == '주차장 정보 서비스') {
        home_set_table([
            { title: '주차장1', desc: '이용시간', data: '10:00~18:00' },
            { title: '주차장1', desc: '요금', data: '1000￦/h' },
            { title: '주차장2', desc: '이용시간', data: '11:00~19:00' },
            { title: '주차장2', desc: '요금', data: '1200￦/h' },
            { title: '주차장3', desc: '이용시간', data: '12:00~20:00' },
            { title: '주차장3', desc: '요금', data: '1400￦/h' },
            { title: '주차장4', desc: '이용시간', data: '12:00~21:00' },
            { title: '주차장4', desc: '요금', data: '1600￦/h' },
        ]);
    } else {
        home_set_table([]);
    }
};

const home_set_table = (datas) => {
    var table = document.getElementById('home_table');
    var html = '';
    for (var i = 0; i < datas.length; i++) {
        html += `
            <tr>
                <td>${datas[i].title}</td>
                <td>${datas[i].desc}</td>
                <td>${datas[i].data}</td>
            </tr>
        `;
    }
    table.innerHTML = html;
};

const home_set_recent_services = (datas) => {
    var table = document.getElementById('home_recent_services');
    var html = '';
    for (var i = 0; i < datas.length; i++) {
        html += `
            <div style="display: flex; align-items: center;">
                <span class="material-icons-outlined" style="font-size: 32px;">
                    share
                </span>
                <span style="padding-left: 16px;">
                    <div style="font-size: 16px; font-weight: bold;">
                        ${datas[i].title}
                    </div>
                    <div>
                        ${datas[i].desc}
                    </div>
                </span>
            </div>
            ${i < datas.length - 1 ? '<hr>' : ''}
        `;
    }
    table.innerHTML = html;
};
const home_set_recent_models = (datas) => {
    var table = document.getElementById('home_recent_models');
    var html = '';
    for (var i = 0; i < datas.length; i++) {
        html += `
            <div style="display: flex; align-items: center;">
                <span class="material-icons-outlined" style="font-size: 36px;">
                    memory
                </span>
                <span style="padding-left: 16px;">
                    <div style="font-size: 16px; font-weight: bold;">
                        ${datas[i].title}
                    </div>
                    <div>
                        ${datas[i].desc}
                    </div>
                </span>
            </div>
            ${i < datas.length - 1 ? '<hr>' : ''}
        `;
    }
    table.innerHTML = html;
};
const home_set_recent_pipelines = (datas) => {
    var table = document.getElementById('home_recent_pipelines');
    var html = '';
    for (var i = 0; i < datas.length; i++) {
        html += `
            <div style="display: flex; align-items: center;">
                <span class="material-icons-outlined" style="font-size: 36px;">
                    account_tree
                </span>
                <span style="padding-left: 16px;">
                    <div style="font-size: 16px; font-weight: bold;">
                        ${datas[i].title}
                    </div>
                    <div>
                        ${datas[i].desc}
                    </div>
                </span>
            </div>
            ${i < datas.length - 1 ? '<hr>' : ''}
        `;
    }
    table.innerHTML = html;
};

const clear_tab = () => {
    document.getElementById('tab_home').style.display = 'none';
    document.getElementById('tab_containers').style.display = 'none';
    document.getElementById('tab_images').style.display = 'none';
    document.getElementById('tab_pipelines').style.display = 'none';
    // document.getElementById('tab_run').style.display = 'none';
    // document.getElementById('tab_analysis').style.display = 'none';
    document.getElementById('tab_chatbot').style.display = 'none';
};
// 좌측 메뉴 탭을 누른 경우
const select_tab = (tab) => {
    if (tab == 'home') {
        clear_tab();
        document.getElementById('tab_home').style.display = 'block';
    } else if (tab == 'containers') {

    /** 컨테이너 데이터를 불러와서 리스트에 띄워줌 */
        clear_tab();
        fetch('/rest/get_containers/', {
            method: 'GET',
            headers: {
                // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                setContainerList(data);

                // 리스트 업 후 툴팁 세팅
                const buttons = document.querySelectorAll('.actionBtn');
                const tooltips = document.querySelectorAll('.tooltip');
                let timer;

                buttons.forEach((button, index) => {
                    const tooltip = tooltips[index];

                    console.log('툴팁등록진행');

                    button.addEventListener('mouseover', () => {
                        timer = setTimeout(() => {
                            console.log('테스트');
                            console.log(tooltip);
                            tooltip.classList.add('show-tooltip');
                        }, 100); // 100ms 후에 설명 표시
                    });

                    button.addEventListener('mouseout', () => {
                        clearTimeout(timer);
                        tooltip.classList.remove('show-tooltip');
                    });
                });
            })
            .catch((error) => {
                console.error('ERROR :', error);
            });

        document.getElementById('tab_containers').style.display = 'block';
    } else if (tab == 'images') {

    /** 이미지 데이터를 불러와서 리스트에 띄워줌 */
        clear_tab();
        fetch('/rest/get_images/', {
            method: 'GET',
            headers: {
                // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                setImageList(data);

                const buttons = document.querySelectorAll('.actionBtn');
                const tooltips = document.querySelectorAll('.tooltip');
                let timer;

                buttons.forEach((button, index) => {
                    const tooltip = tooltips[index];

                    console.log('툴팁등록진행');

                    button.addEventListener('mouseover', () => {
                        timer = setTimeout(() => {
                            console.log('테스트');
                            console.log(tooltip);
                            tooltip.classList.add('show-tooltip');
                        }, 100); // 100ms 후에 설명 표시
                    });

                    button.addEventListener('mouseout', () => {
                        clearTimeout(timer);
                        tooltip.classList.remove('show-tooltip');
                    });
                });
            })
            .catch((error) => {
                console.error('ERROR :', error);
            });

        document.getElementById('tab_images').style.display = 'block';
    } else if (tab == 'pipelines') {
        clear_tab();
        document.getElementById('tab_pipelines').style.display = 'block';
    // } else if (tab == 'run') {
    //     clear_tab();
    //     document.getElementById('tab_run').style.display = 'block';
    // } else if ((tab = 'analysis')) {
    //     clear_tab();
    //     document.getElementById('tab_analysis').style.display = 'block';
    } else if ((tab = 'chatbot')) {
        clear_tab();
        document.getElementById('tab_chatbot').style.display = 'block';
    }
};

const model_show_table = (datas) => {
    var table = document.getElementById('models_table');
    var html = table.innerHTML;
    html = ``;
    for (var i = 0; i < datas.length; i++) {
        html += `
            <tr id="${datas[i].id}">    
                <td>${datas[i].name}</td>
                <td>${datas[i].type}</td>
                <td>${datas[i].service}</td>
                <td>${datas[i].status}</td>
                <td>${datas[i].modified}</td>
                <td>${datas[i].action}</td> <!-- 새로운 열 추가됨 (재생, 박스, 삭제 등) -->
            </tr>
        `;
    }
    table.innerHTML = html;
};

// 이미지 또는 컨테이너 패널을 채우는 함수
const setTable = (datas, tableType) => {
    var table;

    if (tableType == 'container') {
        table = document.getElementById('containers_table');
        table.innerHTML = ``;
        for (var i = 0; i < datas.length; i++) {
            table.innerHTML += `
                <tr id=${datas[i].id}>
                    <td>${datas[i].name}</td>
                    <td>${datas[i].image_name}</td>
                    <td>${datas[i].type}</td>
                    <td>${datas[i].service}</td>
                    
                    <td>${datas[i].portOutNb}</td>
                    <td>${datas[i].portOutTb}</td>
                    <td style="display: none;">${datas[i].portInNb}</td>
                    <td style="display: none;">${datas[i].portInTb}</td>                    
                    <td>${datas[i].modified}</td>                
                    <td>${datas[i].action}</td> <!-- 새로운 열 추가됨 (재생, 박스, 삭제 등) -->
                </tr>
            `;
        }
    }
    if (tableType == 'image') {
        table = document.getElementById('models_table');
        table.innerHTML = ``;
        for (var i = 0; i < datas.length; i++) {
            table.innerHTML += `
                <tr id=${datas[i].id}>
                    <td>${datas[i].name}</td>
                    <td>${datas[i].type}</td>
                    <td>${datas[i].service}</td>

                    <td>${datas[i].modified}</td>                
                    <td>${datas[i].action}</td> <!-- 새로운 열 추가됨 (재생, 박스, 삭제 등) -->
                    <td style="display: none;">${datas[i].internalPort_nb}</td>
                    <td style="display: none;">${datas[i].internalPort_tb}</td>
                    <td style="display: none;">${datas[i].workdir}</td>

                </tr>
            `;
        }
    }
};

// const model_init_table = (datas) => {
//     var table = document.getElementById('models_table')
//     var html = ''
//     for (var i = 0; i < datas.length; i++) {
//         html += `
//             <tr>
//                 <td>${datas[i].name}</td>
//                 <td>${datas[i].type}</td>
//                 <td>${datas[i].service}</td>
//                 <td>${datas[i].status}</td>
//                 <td>${datas[i].modified}</td>
//             </tr>
//         `
//     }
//     table.innerHTML = html
// }

const onclick_flowchart_run = () => {
    UIkit.switcher(document.querySelector('.uk-tab')).show(1);
    document.getElementById('pipeline_output').innerText = pipeline_dummy[pipeline_selected].result;
};
const onclick_flowchart_step = (key) => {
    UIkit.switcher(document.querySelector('.uk-tab')).show(0);
    pipeline_selected = key;
    pipeline_set_flowchart(pipeline_dummy);
    document.getElementById('pipeline_source').innerText = pipeline_dummy[key].code;
};

const pipeline_set_flowchart = (datas) => {
    var pipeline_flowchart = document.getElementById('pipeline_flowchart');
    var html = '';
    for (const key in datas) {
        var item = datas[key];
        html += `
            <div class="step ${item.status} ${
            key == pipeline_selected ? `selected` : ``
        }" onclick="onclick_flowchart_step('${key}')">
                <div class="progress"></div>
                <div class="title">${item.title}</div>
                <div class="process">${item.process}</div>
                <div class="time">${item.time} sec</div>
            </div>
        `;
    }

    pipeline_flowchart.innerHTML = html;
};

const init_home = () => {
    home_select_cat2(this, 'all');
    home_set_table([
        { title: '주차장1', desc: '이용시간', data: '10:00~18:00' },
        { title: '주차장1', desc: '요금', data: '1000￦/h' },
        { title: '주차장2', desc: '이용시간', data: '11:00~19:00' },
        { title: '주차장2', desc: '요금', data: '1200￦/h' },
        { title: '주차장3', desc: '이용시간', data: '12:00~20:00' },
        { title: '주차장3', desc: '요금', data: '1400￦/h' },
        { title: '주차장4', desc: '이용시간', data: '12:00~21:00' },
        { title: '주차장4', desc: '요금', data: '1600￦/h' },
    ]);
    home_set_recent_services([{ title: '환경', desc: 'Created 2023-07-02 11:22:31' }]);
    home_set_recent_models([
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 11:28:10' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 11:28:10' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 11:28:10' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 11:28:10' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 11:28:10' },
    ]);
    home_set_recent_pipelines([
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
        { title: '미세먼지 예측', desc: 'Created 2023-07-03 13:18:08' },
    ]);
};

const init_model = () => {};

var pipeline_selected = null;

const pipeline_dummy = {
    data_load: {
        status: 'waitting',
        title: 'Data Load',
        process: '',
        time: '',
        code: `
        import torch
        import torch.nn as nn
        import torch.optim as optim
        import numpy as np
        import pandas as pd
        from sklearn.preprocessing import MinMaxScaler
        from sklearn.model_selection import train_test_split
        from google.colab import files

        uploaded = files.upload()
        
        # 업로드한 파일의 이름 추출
        file_name = list(uploaded.keys())[0]

        # 엑셀 파일 읽어오기
        df = pd.read_excel(file_name)

        # 측정 지점 지정 (예: 서귀포시 성산읍: 10행)
        target_row_number = 10

        # 측정지 선택 (행)
        target_row = df.iloc[target_row_number - 2].tolist()

        data_type = str(target_row[0])
        data_loc = str(target_row[1])
        pm25_data = np.array(target_row[2:])

        # 데이터 전처리
        scaler = MinMaxScaler()
        pm25_data_scaled = scaler.fit_transform(pm25_data.reshape(-1, 1))

        # 시계열 데이터를 활용하여 데이터셋 생성
        def create_sequence_data(data, seq_length):
            sequences = []
            labels = []

            for i in range(len(data) - seq_length):
                seq = data[i:i+seq_length]
                label = data[i+seq_length:i+seq_length+1]
                sequences.append(seq)
                labels.append(label)

            return torch.tensor(sequences), torch.tensor(labels)

        sequence_length = 5  # 시퀀스 길이 조정 가능
        X, y = create_sequence_data(pm25_data_scaled, sequence_length)

        # 데이터를 학습용과 테스트용으로 분리
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

        # LSTM 모델 정의
        class LSTMModel(nn.Module):
            def __init__(self, input_size, hidden_size, num_layers, output_size):
                super(LSTMModel, self).__init__()
                self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
                self.fc = nn.Linear(hidden_size, output_size)

            def forward(self, x):
                out, _ = self.lstm(x)
                out = self.fc(out[:, -1, :])
                return out
        
        # 모델, 손실 함수, 최적화 함수 정의
        input_size = 1
        hidden_size = 50
        num_layers = 2
        output_size = 1
        learning_rate = 0.001
        num_epochs = 200
        
        model = LSTMModel(input_size, hidden_size, num_layers, output_size)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    `,
        result: `
        데이터 타입:  도시대기
        측정 위치:  [제주 서귀포시]성산읍
        측정값(1~31일):  [13  8 10  8 10  7 10  9  8 12 13 10 14 15 15 14  8  8  7  8  8  8  8 10
        11 15 21 14 15 12 16]
    `,
    },
    trainning: {
        status: 'waitting',
        title: 'Trainning',
        process: '',
        time: '',
        code: `
        # Ncube: Tensorboard writer open
        from torch.utils.tensorboard import SummaryWriter
        writer = SummaryWriter()

        # 학습
        for epoch in range(num_epochs):
            model.train()
            outputs = model(X_train.float())
            optimizer.zero_grad()
            loss = criterion(outputs, y_train.float())
            loss.backward()
            optimizer.step()
        
            if (epoch+1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')

        # Ncube: Tensorboard write loss scalar item
        writer.add_scalar("Loss/train", loss.item(), epoch+1)

        # Ncube: Tensorboard writer flush and close
        writer.flush()
        writer.close()
        `,
        result: `
        Epoch [10/200], Loss: 0.0444
        Epoch [20/200], Loss: 0.0407
        Epoch [30/200], Loss: 0.0364
        Epoch [40/200], Loss: 0.0368
        Epoch [50/200], Loss: 0.0364
        Epoch [60/200], Loss: 0.0364
        Epoch [70/200], Loss: 0.0364
        Epoch [80/200], Loss: 0.0364
        Epoch [90/200], Loss: 0.0364
        Epoch [100/200], Loss: 0.0364
        Epoch [110/200], Loss: 0.0364
        Epoch [120/200], Loss: 0.0364
        Epoch [130/200], Loss: 0.0364
        Epoch [140/200], Loss: 0.0364
        Epoch [150/200], Loss: 0.0364
        Epoch [160/200], Loss: 0.0364
        Epoch [170/200], Loss: 0.0364
        Epoch [180/200], Loss: 0.0364
        Epoch [190/200], Loss: 0.0364
        Epoch [200/200], Loss: 0.0364
    `,
    },
    evaluation: {
        status: 'waitting',
        title: 'Evaluation',
        process: '',
        time: '',
        code: `
        # 테스트
        model.eval()
        with torch.no_grad():
            test_outputs = model(X_test.float())
            mse = criterion(test_outputs, y_test.float())
            print(f'테스트 데이터에 대한 MSE(Mean Squared Error): {mse.item():.4f}')
    `,
        result: `
        테스트 데이터에 대한 MSE(Mean Squared Error): 0.1834
    `,
    },
    Predict: {
        status: 'waitting',
        title: 'Evaluation',
        process: '',
        time: '',
        code: `
        # 미래 7일간의 미세먼지 예측
        model.eval()
        with torch.no_grad():
            # 마지막 학습 데이터를 사용하여 미래 7일간의 미세먼지를 예측
            last_sequence = torch.tensor(pm25_data_scaled[-sequence_length:], dtype=torch.float32).view(1, -1, 1)
            future_predictions = []
        
            for _ in range(7):
                prediction = model(last_sequence)
                future_predictions.append(prediction.item())
                last_sequence = torch.cat([last_sequence[:, 1:, :], prediction.view(1, 1, 1)], dim=1)
        
        # 스케일 역변환
        future_predictions = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1))
        
        # 결과 출력
        print("미래 7일간의 미세먼지(PM25) 예측값:")
        for i, prediction in enumerate(future_predictions.flatten(), 1):
            print(f"Day {i}: {prediction:.2f}")
    `,
        result: `
        미래 7일간의 미세먼지(PM25) 예측값:
        Day 1: 10.17
        Day 2: 10.16
        Day 3: 10.15
        Day 4: 10.15
        Day 5: 10.15
        Day 6: 10.15
        Day 7: 10.15
    `,
    },
};

const init_pipeline = () => {
    pipeline_set_flowchart(pipeline_dummy);
};

const modal_type = (self, cat) => {
    var cat2 = document.getElementById('modal_type');
    var cat2_btn = document.getElementById('modal_type_btn');
    // var type_dropdown = document.getElementById('type_dropdown')
    var childs = cat2.children;
    for (var i = 0; i < childs.length; i++) {
        childs[i].classList = '';
    }

    var names = [];
    var type_dropdown = document.getElementById('type_dropdown');
    var type_type_btn_parents = document.getElementById('type_type_btn_parents');

    if (cat == 'tensorflow') {
        // childs[1].classList = 'uk-active'
        cat2_btn.innerText = 'Tensorflow';
        names = twin_tour;

        type_type_btn_parents.addEventListener('mouseover', () => {
            type_dropdown.classList.add('uk-open');
        });
    } else if (cat == 'pytorch') {
        cat2_btn.innerText = 'PyTorch';
        names = twin_traffic;
        var type_dropdown = document.getElementById('type_dropdown');
        type_type_btn_parents.addEventListener('mouseover', () => {
            type_dropdown.classList.add('uk-open');
        });
    } else if (cat == 'keras') {
        cat2_btn.innerText = 'Keras';
        names = twin_env;
        var type_dropdown = document.getElementById('type_dropdown');
        type_type_btn_parents.addEventListener('mouseover', () => {
            type_dropdown.classList.add('uk-open');
        });
    }
    self.classList = 'uk-active';
    type_dropdown.classList.remove('uk-open');
};

const service_type = (self, cat) => {
    var cat2 = document.getElementById('service_type');
    var cat2_btn = document.getElementById('service_type_btn');
    var service_type_btn_parents = document.getElementById('service_type_btn_parents');
    var service_dropdown = document.getElementById('service_dropdown');
    var childs = cat2.children;
    for (var i = 0; i < childs.length; i++) {
        childs[i].classList = '';
    }

    var names = [];

    if (cat == '교통트윈') {
        // childs[1].classList = 'uk-active'
        cat2_btn.innerText = '교통트윈';
        names = twin_tour;
        service_type_btn_parents.addEventListener('mouseover', () => {
            service_dropdown.classList.add('uk-open');
        });
    } else if (cat == '환경트윈') {
        cat2_btn.innerText = '환경트윈';
        names = twin_traffic;
        service_type_btn_parents.addEventListener('mouseover', () => {
            service_dropdown.classList.add('uk-open');
        });
    } else if (cat == '관광트윈') {
        cat2_btn.innerText = '관광트윈';
        names = twin_env;
        service_type_btn_parents.addEventListener('mouseover', () => {
            service_dropdown.classList.add('uk-open');
        });
    }
    self.classList = 'uk-active';
    service_dropdown.classList.remove('uk-open');
};

// 이미지 생성 + 모델 업로드
const upload_image = () => {
    var create_img_btn = document.getElementById('create_modal_btn');
    var modal_image_create = document.getElementById('modal-image-create');
    var name = document.getElementById('modal_name');
    var type = document.getElementById('modal_type_btn');
    var service = document.getElementById('service_type_btn');
    var dockerFile = document.getElementById('dockerFile');
    // var fileInput = document.getElementById('file');
    var workdir = document.getElementById('workdir');
    // var file = fileInput.files[0];

    console.log('name >> ', name);

    // 필수 필드가 비어 있는지 확인
    if (name.value == '') {
        alert('이미지 이름을 작성하지 않았습니다.');
        return;
    }

    if (name.value !== name.value.toLowerCase() || /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(name.value)) {
        alert('입력된 컨테이너 이름은 소문자이며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        return;
    }

    if (dockerFile.value == '') {
        alert('도커 파일의 항목을 입력하지 않았습니다.');
        return;
    }
    // if (!file) {
    //     alert('업로드된 주피터노트북 파일이 없습니다.');
    //     return;
    // }

    if (!workdir.value.startsWith('/')) {
        alert('작업 디렉토리(WORKDIR)는 "/"로 시작해야 합니다.');
        return;
    }

    var cmd = document.getElementById('cmd').value;
    if (!cmd.startsWith('[')) {
        alert('명령어(CMD)는 "[]"로 규격에 맞춰 작성해야 합니다.');
        return;
    }

    var formData = new FormData();
    // formData.append('file', file);
    formData.append('name', name.value);
    formData.append('type', type.innerText);
    formData.append('service', service.innerText);
    formData.append('dockerFile', dockerFile.value);
    formData.append('workdir', workdir.value);

    console.log('> workdir >> ', workdir.value);
    console.log('> 전송 >> ', formData);

    create_img_btn.classList.remove('uk-button-primary');
    create_img_btn.classList.add('uk-active');
    create_img_btn.innerText = '등록 중... 이 작업은 수 분간 진행됩니다.';
    create_img_btn.disabled = true; // 버튼을 비활성화하여 중복 클릭을 방지합니다.

    fetch('/rest/upload_image/', {
        method: 'POST',
        body: formData,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                create_img_btn.classList.add('uk-button-primary');
                create_img_btn.classList.remove('uk-active');
                create_img_btn.disabled = false; // 버튼을 다시 활성화합니다.
                create_img_btn.innerText = '등록하기';

                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            alert(data.message);

            // rest/upload 요청이 성공적으로 완료되면 요청 실행
            return fetch('/rest/get_images/', {
                method: 'GET',
                headers: {
                    // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
            });
        })
        .then((response) => {
            if (!response.ok) {
                create_img_btn.classList.add('uk-button-primary');
                create_img_btn.classList.remove('uk-active');
                create_img_btn.disabled = false; // 버튼을 다시 활성화합니다.
                create_img_btn.innerText = '등록하기';

                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            setImageList(data);

            create_img_btn.classList.add('uk-button-primary');
            create_img_btn.classList.remove('uk-active');
            create_img_btn.disabled = false; // 버튼을 다시 활성화합니다.
            modal_image_create.style.display = 'none'; // 모달을 숨깁니다.
            create_img_btn.innerText = '등록하기';
        })
        .catch((error) => {
            alert(error);
            create_img_btn.classList.add('uk-button-primary');
            create_img_btn.classList.remove('uk-active');
            create_img_btn.disabled = false; // 버튼을 다시 활성화합니다.
            create_img_btn.innerText = '등록하기';
        });
};

// 이미지 페이지의 이미지 리스트 표출
const setImageList = (data) => {
    let modelData = [];
    data.image_list.forEach((item) => {
        let modelItem = {
            id: item.id,
            name: item.name,
            type: item.type,
            service: item.service,
            // status: item.status,
            modified: item.date,
            internalPort_nb: item.internalPort_nb,
            internalPort_tb: item.internalPort_tb,
            workdir: item.workdir,
            action: `
            <div class="tooltip-container">            
                <span uk-toggle="target: #modal-container-run" class="actionBtn" onclick="openConfigContainer.call(this)">
                    <i class="fa-solid fa-box"></i>
                </span>
                <span class="tooltip">컨테이너 실행</span>
            </div>
            
            <div class="tooltip-container">   
                <span class="actionBtn">
                    <i class="fa-solid fa-trash" onclick="delete_image.call(this)"></i>
                </span>
                <span class="tooltip">이미지 삭제</span>
            </div>

            `,
        };
        modelData.push(modelItem);
    });

    setTable(modelData, 'image');
};

// 컨테이너 페이지의 컨테이너 리스트 표출
const setContainerList = (data) => {
    let conatainerDataList = [];
    data.container_list.forEach((item) => {
        let modelItem = {
            id: item.id,
            name: item.name,
            image_name: item.image_name,
            type: item.type,
            service: item.service,
            // status: item.status,
            portOutNb: item.externalPort_nb,
            portOutTb: item.externalPort_tb,
            portInNb: item.internalPort_nb,
            portInTb: item.internalPort_tb,
            modified: item.date,
            action: `
            <div class="tooltip-container">
                <span class="actionBtn" onclick="switchContainer.call(this)">
                    <i class="fa-solid ${item.play ? 'fa-stop' : 'fa-play'}"></i>
                </span> 
                <span class="tooltip">실행 / 종료</span>
            </div>       

            <div class="tooltip-container">
                <span class="actionBtn">
                    <i class="fa-solid fa-laptop-code" onclick="open_jupyter_page.call(this)"></i>
                </span>
                <span class="tooltip">주피터 노트북</span>            
            </div>       

            <div class="tooltip-container">          
                <span class="actionBtn">
                    <i class="fa-solid fa-chart-line" onclick="open_tensorboard_page.call(this)"></i>
                </span>     
                <span class="tooltip">텐서보드</span>
            </div>       
            
            <div class="tooltip-container">                    
                <span class="actionBtn">
                    <i class="fa-solid fa-trash" onclick="delete_container.call(this)"></i>
                </span>     
                <span class="tooltip">컨테이너 삭제</span>
            </div>
            
            <div class="tooltip-container">          
                <span uk-toggle="target: #modal-container-rename" class="actionBtn" onclick="rename_container.call(this)">          
                    <i class="fa-solid fa-wrench"></i>
                </span>     
                <span class="tooltip">이름변경</span>
            </div>       

            `,
        };
        conatainerDataList.push(modelItem);
    });

    setTable(conatainerDataList, 'container');
};

// 버튼이벤트 (컨테이너 이름 수정)
function rename_container() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    // tr의 id와 td의 name을 가져와서 출력
    var id = clickedElement.id;
    var cont_name = clickedElement.querySelector('td:nth-child(1)').innerText;
    var img_name = clickedElement.querySelector('td:nth-child(2)').innerText;

    console.log(`id = ${id}`);
    console.log(`cont_name = ${cont_name}`);
    console.log(`img_name = ${img_name}`);

    document.getElementById('cont_id').value = id;
    document.getElementById('old_name').value = cont_name;

    // var modal_container_rename = document.getElementById('modal-container-rename');
    // modal_container_rename.style.display = 'none'; // 모달을 숨깁니다.



}

// 컨테이너 이름 변경
const rename_container_start = () => {
    var rename_cont_btn = document.getElementById('rename_cont_btn');
    var modal_container_rename = document.getElementById('modal-container-rename');

    var old_name = document.getElementById('old_name');
    var new_name = document.getElementById('new_name');

    if (
        new_name.value !== new_name.value.toLowerCase() ||
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(new_name.value)
    ) {
        alert('입력된 컨테이너 이름은 소문자여야 하며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        new_name.value = '';
        return;
    }

    var formDataToServer = new FormData();
    formDataToServer.append('old_name', old_name.value);
    formDataToServer.append('new_name', new_name.value);

    rename_cont_btn.classList.remove('uk-button-primary');
    rename_cont_btn.classList.add('uk-active');

    rename_cont_btn.innerText = '컨테이너 이름 변경 중...';
    rename_cont_btn.disabled = true; // 버튼을 비활성화하여 중복 클릭을 방지합니다.

    fetch('/rest/change_cont_name/', {
        method: 'POST',
        body: formDataToServer,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                rename_cont_btn.classList.add('uk-button-primary');
                rename_cont_btn.classList.remove('uk-active');
                rename_cont_btn.disabled = false; // 버튼을 다시 활성화합니다.
                rename_cont_btn.innerText = '등록하기';

                throw new Error('네트워크 응답 오류 발생');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success === false) {
                alert(data.message);

                rename_cont_btn.classList.add('uk-button-primary');
                rename_cont_btn.classList.remove('uk-active');
                rename_cont_btn.disabled = false; // 버튼을 다시 활성화합니다.
                modal_container_rename.style.display = 'none'; // 모달을 숨깁니다.
                rename_cont_btn.innerText = '등록하기';

                throw new Error('컨테이너 이름이 변경되지 않았습니다. 관리자에게 문의하세요.');
            }

            // 컨테이너 이름 변경 성공
            alert(data.message);

            // rest/change_cont_name 요청이 성공적으로 완료되면 요청 실행
            // 컨테이너 리스트 받아오기
            return fetch('/rest/get_containers/', {
                method: 'GET',
                headers: {
                    // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
            });
        })
        .then((response) => {
            if (!response.ok) {
                rename_cont_btn.classList.add('uk-button-primary');
                rename_cont_btn.classList.remove('uk-active');
                rename_cont_btn.disabled = false; // 버튼을 다시 활성화합니다.
                rename_cont_btn.innerText = '등록하기';

                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            setContainerList(data);

            // 리스트 업 후 툴팁 세팅
            const buttons = document.querySelectorAll('.actionBtn');
            const tooltips = document.querySelectorAll('.tooltip');
            let timer;

            buttons.forEach((button, index) => {
                const tooltip = tooltips[index];

                console.log('툴팁등록진행');

                button.addEventListener('mouseover', () => {
                    timer = setTimeout(() => {
                        console.log('테스트');
                        console.log(tooltip);
                        tooltip.classList.add('show-tooltip');
                    }, 100); // 100ms 후에 설명 표시
                });

                button.addEventListener('mouseout', () => {
                    clearTimeout(timer);
                    tooltip.classList.remove('show-tooltip');
                });
            });

            rename_cont_btn.classList.add('uk-button-primary');
            rename_cont_btn.classList.remove('uk-active');
            rename_cont_btn.disabled = false; // 버튼을 다시 활성화합니다.
            modal_container_rename.style.display = 'none'; // 모달을 숨깁니다.
            rename_cont_btn.innerText = '등록하기';
        })
        .catch((error) => {
            rename_cont_btn.classList.add('uk-button-primary');
            rename_cont_btn.classList.remove('uk-active');
            rename_cont_btn.disabled = false; // 버튼을 다시 활성화합니다.
            rename_cont_btn.innerText = '등록하기';
            alert(error);
        });
};

// 버튼이벤트 (이미지로 컨테이너 만들기)
function openConfigContainer() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    // tr의 id와 td의 name을 가져와서 출력
    var id = clickedElement.id;
    var name = clickedElement.querySelector('td:nth-child(1)').innerText;
    var _type = clickedElement.querySelector('td:nth-child(2)').innerText;
    var service = clickedElement.querySelector('td:nth-child(3)').innerText;
    var internalPort_nb = clickedElement.querySelector('td:nth-child(6)').innerText;
    var internalPort_tb = clickedElement.querySelector('td:nth-child(7)').innerText;
    var workdir = clickedElement.querySelector('td:nth-child(8)').innerText;

    console.log('>> ' + internalPort_nb);
    console.log('>> ' + internalPort_tb);


    document.getElementById('image_id').value = id;
    document.getElementById('image_name').value = name;
    document.getElementById('image_type').value = _type;
    document.getElementById('image_service').value = service;
    document.getElementById('internalPort_nb').value = internalPort_nb;
    document.getElementById('internalPort_tb').value = internalPort_tb;

    document.getElementById('container_path').value = workdir;
}

// 버튼이벤트 (컨테이너 종료 또는 실행 스위치)
function switchContainer() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    var id = clickedElement.id;
    var container_name = clickedElement.querySelector('td:nth-child(1)').innerText;
    var externalPort_nb = clickedElement.querySelector('td:nth-child(5)').innerText;
    var externalPort_tb = clickedElement.querySelector('td:nth-child(6)').innerText;

    var formData = new FormData();
    formData.append('container_id', id);
    formData.append('container_name', container_name);
    formData.append('externalPort_nb', externalPort_nb);
    formData.append('externalPort_tb', externalPort_tb);

    fetch('/rest/switchContainer/', {
        method: 'POST',
        body: formData,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success == false) {
                alert(data.message);
                return;
            }

            if (data.success == true && data.switch == 0) {
                var iconElement = clickedElement.querySelector('.fa-stop');
                iconElement.classList.remove('fa-stop');
                iconElement.classList.add('fa-play');
                UIkit.notification({
                    message: container_name + '가 종료되었습니다.',
                    pos: 'bottom-right',
                    timeout: 1500,
                });
            } else if (data.success == true && data.switch == 1) {
                var iconElement = clickedElement.querySelector('.fa-play');
                iconElement.classList.remove('fa-play');
                iconElement.classList.add('fa-stop');
                UIkit.notification({
                    message: container_name + '가 실행되었습니다.',
                    pos: 'bottom-right',
                    timeout: 1500,
                });
            }
        })
        .catch((error) => {
            alert(error);
        });
}

var first_forward_port = 39001;
var last_forward_port = 39005;

// 컨테이너 업로드 및 실행
const start_container = () => {
    var create_cont_button = document.getElementById('create_cont_btn');
    var modal_container_run = document.getElementById('modal-container-run');

    var container_name = document.getElementById('container_name');
    var externalPort_nb = document.getElementById('externalPort_nb');
    var externalPort_tb = document.getElementById('externalPort_tb');
    var internalPort_nb = document.getElementById('internalPort_nb');
    var internalPort_tb = document.getElementById('internalPort_tb');
    var container_path = document.getElementById('container_path');
    // var host_path = document.getElementById('host_path')
    var env_variable = document.getElementById('env_variable');
    var env_value = document.getElementById('env_value');
    var image_name = document.getElementById('image_name');
    var image_id = document.getElementById('image_id');
    var image_service = document.getElementById('image_service');
    var image_type = document.getElementById('image_type');

    if (
        container_name.value !== container_name.value.toLowerCase() ||
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(container_name.value)
    ) {
        alert('입력된 컨테이너 이름은 소문자여야 하며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        container_name.value = '';
        return;
    }
    if (!/^[0-9]+$/.test(externalPort_nb.value) && !/^[0-9]+$/.test(externalPort_tb.value)) {
        alert('접속 포트는 숫자로만 이루어져야 합니다.');
        externalPort_nb.value = '';
        externalPort_tb.value = '';
        return;
    }

    // !!! 240705 테스트 후 오픈 전 주석 해제 및 조정 필요 
    // if (parseInt(externalPort.value) < first_forward_port || parseInt(externalPort.value) > last_forward_port) {
    //     // 사용자에게 경고 메시지를 표시하거나 입력 필드를 초기화할 수 있습니다.
    //     alert('접속 포트 번호는 39001에서 39005 사이어야 합니다.');
    //     externalPort.value = ''; // 입력 필드 초기화
    //     return;
    // }


    if (!/^[0-9]+$/.test(internalPort_nb.value) && !/^[0-9]+$/.test(internalPort_tb.value)) {
        alert('내부 포트는 숫자로만 이루어져야 합니다.');
        internalPort_nb.value = '';
        internalPort_tb.value = '';
        return;
    }
    if (
        container_path.value !== container_path.value.toLowerCase() ||
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(container_path.value)
    ) {
        alert('입력된 컨테이너 패스는 소문자여야 하며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        container_path.value = '';
        return;
    }

    if (!container_path.value.startsWith('/')) {
        alert('입력된 컨테이너 패스는 "/"로 시작해야 합니다.');
        container_path.value = '';
        return;
    }

    if (
        env_variable.value !== env_variable.value.toLowerCase() ||
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(env_variable.value)
    ) {
        alert('입력된 환경변수 키는 소문자여야 하며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        env_variable.value = '';
        return;
    }

    if (
        env_value.value !== env_value.value.toLowerCase() ||
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|~!@#$%^&*()+|<>?:{}]/.test(env_value.value)
    ) {
        alert('입력된 환경변수 값은 소문자여야 하며, 한글, 특수문자(언더바 제외), 공백이 포함될 수 없습니다.');
        env_value.value = '';
        return;
    }

    var formDataToServer = new FormData();
    formDataToServer.append('container_name', container_name.value);
    formDataToServer.append('externalPort_nb', externalPort_nb.value);
    formDataToServer.append('externalPort_tb', externalPort_tb.value);
    formDataToServer.append('internalPort_nb', internalPort_nb.value);
    formDataToServer.append('internalPort_tb', internalPort_tb.value);

    formDataToServer.append('container_path', container_path.value);
    // formDataToServer.append('host_path', host_path);
    formDataToServer.append('env_variable', env_variable.value);
    formDataToServer.append('env_value', env_value.value);
    formDataToServer.append('image_name', image_name.value);
    formDataToServer.append('image_id', image_id.value);
    formDataToServer.append('image_service', image_service.value);
    formDataToServer.append('image_type', image_type.value);

    create_cont_button.classList.remove('uk-button-primary');
    create_cont_button.classList.add('uk-active');
    create_cont_button.innerText = '컨테이너를 실행중입니다..';
    create_cont_button.disabled = true; // 버튼을 비활성화하여 중복 클릭을 방지합니다.

    fetch('/rest/start_container/', {
        method: 'POST',
        body: formDataToServer,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                create_cont_button.classList.add('uk-button-primary');
                create_cont_button.classList.remove('uk-active');
                create_cont_button.disabled = false; // 버튼을 다시 활성화합니다.
                create_cont_button.innerText = '등록하기';

                throw new Error('네트워크 응답 오류 발생');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success === false) {
                alert(data.message);

                create_cont_button.classList.add('uk-button-primary');
                create_cont_button.classList.remove('uk-active');
                create_cont_button.disabled = false; // 버튼을 다시 활성화합니다.
                // modal_container_run.style.display = 'none'; // 모달을 숨깁니다.
                create_cont_button.innerText = '등록하기';

                throw new Error('컨테이너가 실행되지 않았습니다.');
            }

            // 컨테이너 생성, 실행 성공
            alert(data.message);

            // rest/start_container 요청이 성공적으로 완료되면 요청 실행
            // 컨테이너 리스트 받아오기
            return fetch('/rest/get_containers/', {
                method: 'GET',
                headers: {
                    // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
            });
        })
        .then((response) => {
            if (!response.ok) {
                create_cont_button.classList.add('uk-button-primary');
                create_cont_button.classList.remove('uk-active');
                create_cont_button.disabled = false; // 버튼을 다시 활성화합니다.
                create_cont_button.innerText = '등록하기';

                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            setContainerList(data);

            // 컨테이너 패널 온
            select_tab('containers');

            // 좌측 컨테이너 버튼 온
            var allTabs = document.querySelectorAll('a');
            allTabs.forEach(function (tab) {
                var parentTab = tab.parentElement;

                // uk-active 클래스가 존재하면 제거
                if (parentTab && parentTab.classList.contains('uk-active')) {
                    parentTab.classList.add('uk-active');
                }
                // aria-selected 속성을 false로 설정
                tab.setAttribute('aria-selected', 'false');
            });

            var contTabElement = document.querySelector(`[onclick="select_tab('containers')"]`);

            // 해당 요소가 존재하면
            if (contTabElement) {
                // 그 아래의 <a> 요소 찾기
                var containerTab = contTabElement.querySelector('a');

                // <a> 요소가 존재하면
                if (containerTab) {
                    // aria-selected 속성을 true로 변경
                    // containerTab.classList.add(containerTab.classList);
                    contTabElement.classList.add('uk-active');
                    containerTab.setAttribute('aria-selected', 'true');
                }
            }

            create_cont_button.classList.add('uk-button-primary');
            create_cont_button.classList.remove('uk-active');
            create_cont_button.disabled = false; // 버튼을 다시 활성화합니다.
            // modal_container_run.style.display = 'none'; // 모달을 숨깁니다.  
            var uikit_cont_run_modal = UIkit.modal('#modal-container-run');         
            uikit_cont_run_modal.hide();
            create_cont_button.innerText = '등록하기';
        })
        .catch((error) => {
            create_cont_button.classList.add('uk-button-primary');
            create_cont_button.classList.remove('uk-active');
            create_cont_button.disabled = false; // 버튼을 다시 활성화합니다.
            create_cont_button.innerText = '등록하기';
            alert(error);
        });
};

// 버튼이벤트 (이미지 삭제)
function delete_image() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    var id = clickedElement.id;
    var image_name = clickedElement.querySelector('td:nth-child(1)').innerText;

    var formData = new FormData();
    formData.append('image_id', id);
    formData.append('image_name', image_name);

    fetch('/rest/delete_image/', {
        method: 'DELETE',
        body: formData,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success == false) {
                alert(data.message);
            } else if (data.success == true) {
                alert(data.message);
                clickedElement.remove();
            }
        })
        .catch((error) => {
            console.error('ERROR :', error);
        });
}

// 버튼이벤트 (컨테이너 삭제)
function delete_container() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    var id = clickedElement.id;
    var container_name = clickedElement.querySelector('td:nth-child(1)').innerText;

    var formData = new FormData();
    formData.append('container_id', id);
    formData.append('container_name', container_name);

    fetch('/rest/delete_container/', {
        method: 'DELETE',
        body: formData,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success == false) {
                alert(data.message);
            } else if (data.success == true) {
                alert(data.message);
                clickedElement.remove();
            }
        })
        .catch((error) => {
            console.error('ERROR :', error);
        });
}

// 주피터노트북팝업
function open_jupyter_page() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    var id = clickedElement.id;
    var container_name = clickedElement.querySelector('td:nth-child(1)').innerText;
    var externalPort_nb = clickedElement.querySelector('td:nth-child(5)').innerText;
    var internalPort_nb = clickedElement.querySelector('td:nth-child(7)').innerText;

    var formData = new FormData();
    formData.append('container_id', id);
    formData.append('container_name', container_name);
    formData.append('externalPort_nb', externalPort_nb);
    formData.append('internalPort_nb', internalPort_nb);

    fetch('/rest/open_jupyter_page/', {
        method: 'POST',
        body: formData,
        headers: {
            // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success == true) {
                var port = data.port;
                var token = data.token;
                var url = `http://${remote_docker_cont_ip}:${port}/tree?token=${token}`;

                // 새 탭에서 주피터 노트북 페이지 열기
                window.open(url);
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error('ERROR :', error);
        });
}

// 텐서보드 팝업
function open_tensorboard_page() {
    // 클릭된 요소를 가져옴
    var clickedElement = this.closest('tr');

    // var id = clickedElement.id;
    // var container_name = clickedElement.querySelector('td:nth-child(1)').innerText;
    var externalPort_tb = clickedElement.querySelector('td:nth-child(6)').innerText;
    // var internalPort_tb = clickedElement.querySelector('td:nth-child(8)').innerText;

    try {
        // 오류가 발생할 수 있는 코드
            
        var url = `http://${remote_docker_cont_ip}:${externalPort_tb}/`;    
        window.open(url);

    } catch (error) {
        alert(error);

    }


    // var formData = new FormData();
    // formData.append('container_id', id);
    // formData.append('container_name', container_name);
    // formData.append('externalPort_tb', externalPort_tb);
    // formData.append('internalPort_tb', internalPort_tb);

    // fetch('/rest/open_tensorboard_page/', {
    //     method: 'POST',
    //     body: formData,
    //     headers: {
    //         // 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
    //     },
    // })
    //     .then((response) => {
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }
    //         return response.json();
    //     })
    //     .then((data) => {
    //         if (data.success == true) {
    //             var port = data.port;
    //             var token = data.token;
    //             var url = `http://${remote_docker_cont_ip}:${port}/tree?token=${token}`;

    //             // 새 탭에서 주피터 노트북 페이지 열기
    //             window.open(url);
    //         } else {
    //             alert(data.message);
    //         }
    //     })
    //     .catch((error) => {
    //         console.error('ERROR :', error);
    //     });
}

const modal_delete = () => {
    model_init_table([
        { name: '미세먼지 예측', type: 'Pytorch', service: '환경', status: 'connect', modified: '2023-12-08 09:04' },
    ]);
};

/************* DOMContentLoaded **************/

document.addEventListener('DOMContentLoaded', function () {
    init_home();
    init_model();
    init_pipeline();
    select_tab('home');
    is_docker_run();
    setInterval(is_docker_run, 10000);
    my_ip();

    const inputs = document.querySelectorAll('input[type=text]');
    const dockerFileTextArea = document.getElementById('dockerFile');
    updateDockerFile();

    // let dockerFileContent = '';
    // const fromValue = document.getElementById('modal_type_btn').innerText.trim();
    // if (fromValue == "Tensorflow") {
    //     console.log("텐서플로")
    //     dockerFileContent += `FROM tensorflow/tensorflow:latest\n`;
    // }else if (fromValue == "PyTorch"){
    //     console.log("파이토치")
    //     dockerFileContent += `FROM pytorch/pytorch:latest\n`;
    // }else{
    //     console.log("fromValue >> ", fromValue)
    // }
    // dockerFileTextArea.value = dockerFileContent;

    // 입력 필드 각각에 대해 이벤트 리스너를 추가합니다.
    inputs.forEach((input) => {
        input.addEventListener('input', updateDockerFile);
    });

    const modalButton = document.getElementById('modal_type');
    modalButton.addEventListener('click', updateDockerFile);

    function updateDockerFile() {
        // Docker 파일 내용을 업데이트합니다.
        let dockerFileContent = '';

        // 각 입력 필드의 값이 있는지 검사하고, 값이 있을 경우 Docker 파일 내용을 생성합니다.
        const fromValue = document.getElementById('modal_type_btn').innerText.trim();
        if (fromValue == 'TENSORFLOW' || fromValue == 'Tensorflow') {
            // console.log("텐서플로")
            dockerFileContent += `FROM tensorflow/tensorflow:latest\n`;
        } else if (fromValue == 'PYTORCH' || fromValue == 'PyTorch') {
            // console.log("파이토치")
            dockerFileContent += `FROM pytorch/pytorch:latest\n`;
        } else {
            console.log('fromValue >> ', fromValue);
        }

        const workdirValue = document.getElementById('workdir').value;
        if (workdirValue) {
            dockerFileContent += `WORKDIR ${workdirValue}\n`;
        }

        const runValue = document.getElementById('run').value;
        if (runValue) {
            dockerFileContent += `RUN ${runValue}\n`;
        }

        const cmdValue = document.getElementById('cmd').value;
        if (cmdValue) {
            dockerFileContent += `CMD ${cmdValue}\n`;
        }

        // Docker 파일 텍스트 에리어의 값을 업데이트합니다.
        dockerFileTextArea.value = dockerFileContent;
    }
});

const is_docker_run = () => {
    const is_docker_run = document.getElementById('is_docker_run');

    fetch('/rest/is_docker_run/', {
        method: 'GET',
    })
        .then((response) => {
            if (!response.ok) {
                is_docker_run.innerText = '서버에 문제가 있습니다.';
                is_docker_run.style.color = 'red'; // 빨간색
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            // console.log(data)
            is_docker_run.innerText = data.message;

            if (data.success) {
                is_docker_run.style.color = 'blue'; // 파란색
            } else {
                is_docker_run.style.color = 'red'; // 빨간색
            }
        });
};


function adjustTextareaHeight(textarea) {
    // textarea.parentElement.height = '10%'

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;    

    // const parentHeight = input_area.offsetHeight;    
    const parentHeight = textarea.parentElement.offsetHeight;
    const maxHeight = parentHeight * 0.8;

    // console.log(parentHeight)
    console.log(textarea.style.height)
    console.log(scrollHeight)

    if (scrollHeight <= maxHeight){
        textarea.style.height = scrollHeight + 'px';
        // console.log(textarea.style.height)
    } else {
        textarea.style.height = maxHeight + 'px';        
        // console.log(textarea.style.height)

    }
}

function handleKeyDown(event, textarea) {
    if (event.key === 'Enter') {


        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // 줄바꿈 막기
            sendMessage();
        }

        textarea.value = '';
        textarea.style.height = 'auto';
    }
}
