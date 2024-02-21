
//교통트윈
var twin_traffic = [
    "실시간 교통 정보 서비스",
    "노면 기상 정보 서비스",
    "항공 승객 정보 서비스",
    "도로운행 상황 정보 서비스",
    "VVMS 정보 서비스",
    "교차로 CCTV 서비스",
    "주차장 기본 정보 및 현황 정보 서비스"
]

//환경트윈
var twin_env = [
    "날씨 정보 서비스",
    "대기오염 정보 서비스",
    "보건기상지수 서비스",
    "생활기상지수 서비스",
    "미세먼지 시뮬레이터"
]

// 관광트윈
var twin_tour = [
    "관광지 정보 서비스",
    "주차장 정보 서비스",
    "방문객 수 정보 서비스",
    "주차 인지 엔진 서비스",
    "CCTV 서비스"
]

const home_select_cat2 = (self, cat)=>{
    console.log(cat)
    var cat2 = document.getElementById('home_cat2')
    var cat2_btn = document.getElementById('home_cat2_btn')
    var cat3 = document.getElementById('home_cat3')
    var cat3_btn = document.getElementById('home_cat3_btn')
    var childs = cat2.children
    console.log(childs)
    for(var i = 0; i < childs.length; i++){
        childs[i].classList = ''
    }

    var names = []
    var html = `<li class="uk-active" onclick="home_select_cat3(this, '서비스 (전체)')"><a href="#">서비스 (전체)</a></li>`

    if(cat == 'all'){
        cat2_btn.innerText = "단일트윈 (전체)"
        names = twin_env.concat(twin_tour,twin_traffic)
    }
    else if(cat == 'tour'){
        childs[1].classList = 'uk-active'
        cat2_btn.innerText = "관광트윈"
        names = twin_tour
    }
    else if(cat == 'traffic'){
        cat2_btn.innerText = "교통트윈"
        names = twin_traffic
    }
    else if(cat == 'env'){
        cat2_btn.innerText = "환경트윈"
        names = twin_env
    }
    self.classList = 'uk-active'

    for(var i = 0 ; i < names.length; i++){
        var item = names[i]
        html+=`<li onclick="home_select_cat3(this, '${item}')" name="${item}"><a href="#">${item}</a></li>`
    }

    cat3.innerHTML = html

    cat3_btn.innerText = '서비스 (전체)'

}

const home_select_cat3 = (self, cat)=>{
    var cat3 = document.getElementById("home_cat3")
    var cat3_childs = cat3.children
    var cat3_btn = document.getElementById("home_cat3_btn")
    for(var i = 0 ; i < cat3_childs.length; i++){
        cat3_childs[i].classList = ''
    }
    self.classList = 'uk-active'
    cat3_btn.innerText = cat
    
}

const home_set_table = (datas)=>{
    var table = document.getElementById('home_table')
    var html = ''
    for(var i = 0; i < datas.length; i++){
        html += `
            <tr>
                <td>${datas[i].title}</td>
                <td>${datas[i].desc}</td>
                <td>${datas[i].data}</td>
            </tr>
        `
    }
    table.innerHTML = html
}

const home_set_recent_services = (datas)=>{
    var table = document.getElementById('home_recent_services')
    var html = ''
    for(var i = 0; i < datas.length; i++){
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
            ${i < (datas.length -1) ? '<hr>':''}
        `
    }
    table.innerHTML = html
}
const home_set_recent_models = (datas)=>{
    var table = document.getElementById('home_recent_models')
    var html = ''
    for(var i = 0; i < datas.length; i++){
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
            ${i < (datas.length -1) ? '<hr>':''}
        `
    }
    table.innerHTML = html
}
const home_set_recent_pipelines = (datas)=>{
    var table = document.getElementById('home_recent_pipelines')
    var html = ''
    for(var i = 0; i < datas.length; i++){
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
            ${i < (datas.length -1) ? '<hr>':''}
        `
    }
    table.innerHTML = html
}


const clear_tab = () =>{
    document.getElementById('tab_home').style.display='none'
    document.getElementById('tab_models').style.display='none'
    document.getElementById('tab_pipelines').style.display='none'
    document.getElementById('tab_run').style.display='none'
    console.log("cleared.")
}

const select_tab = (tab) => {
    console.log(tab)
    if(tab == "home"){
        clear_tab()
        console.log('home cond')
        document.getElementById('tab_home').style.display='block'
    }
    else if(tab == "notebook"){
        console.log('note cond')
        
    }
    else if(tab == "models"){
        clear_tab()
        console.log('model cond')
        document.getElementById('tab_models').style.display='block'
    }
    else if(tab == "pipelines"){
        clear_tab()
        console.log('pipe cond')
        document.getElementById('tab_pipelines').style.display='block'
    }
    else if(tab == "run"){
        clear_tab()
        console.log('run cond')
        document.getElementById('tab_run').style.display='block'
    }
    else if(tab = "analysis"){
        
    }
}

const model_set_table = (datas)=>{
    var table = document.getElementById('models_table')
    var html = ''
    for(var i = 0; i < datas.length; i++){
        html += `
            <tr>
                <td>${datas[i].name}</td>
                <td>${datas[i].type}</td>
                <td>${datas[i].service}</td>
                <td>${datas[i].status}</td>
                <td>${datas[i].modified}</td>
            </tr>
        `
    }
    table.innerHTML = html
}


const onclick_flowchart_run = ()=>{
    UIkit.switcher(document.querySelector('.uk-tab')).show(1);
    document.getElementById('pipeline_output').innerText = pipeline_dummy[pipeline_selected].result
}
const onclick_flowchart_step = (key)=>{
    console.log(key)
    UIkit.switcher(document.querySelector('.uk-tab')).show(0);
    pipeline_selected = key;
    pipeline_set_flowchart(pipeline_dummy)
    document.getElementById('pipeline_source').innerText = pipeline_dummy[key].code
}

const pipeline_set_flowchart = (datas)=>{
    var pipeline_flowchart = document.getElementById('pipeline_flowchart')
    var html = ''
    for(const key in datas ){
        var item = datas[key]
        html += `
            <div class="step ${item.status} ${key == pipeline_selected ? `selected`:``}" onclick="onclick_flowchart_step('${key}')">
                <div class="progress"></div>
                <div class="title">${item.title}</div>
                <div class="process">${item.process}</div>
                <div class="time">${item.time} sec</div>
            </div>
        `
    }

    pipeline_flowchart.innerHTML = html
}

const init_home = ()=>{
    home_select_cat2(this,'all')
    home_set_table([
        {title:"주차장1", desc:"이용시간", data:"10:00~18:00"},
        {title:"주차장1", desc:"요금", data:"1000￦/h"},
        {title:"주차장2", desc:"이용시간", data:"11:00~19:00"},
        {title:"주차장2", desc:"요금", data:"1200￦/h"},
        {title:"주차장3", desc:"이용시간", data:"12:00~20:00"},
        {title:"주차장3", desc:"요금", data:"1400￦/h"},
        {title:"주차장4", desc:"이용시간", data:"12:00~21:00"},
        {title:"주차장4", desc:"요금", data:"1600￦/h"},
    ])
    home_set_recent_services([
        {title:"서비스명 1", desc:"서비스 상세정보 1"},
        {title:"서비스명 2", desc:"서비스 상세정보 2"},
    ])
    home_set_recent_models([
        {title:"모델명 1", desc:"모델 상세정보 1"},
        {title:"모델명 2", desc:"모델 상세정보 2"},
    ])
    home_set_recent_pipelines([
        {title:"파이프라인명 1", desc:"파이프라인 상세정보 1"},
        {title:"파이프라인명 2", desc:"파이프라인 상세정보 2"},
    ])    
}

const init_model = ()=>{
    model_set_table([
        {name:"service name A",  type:"A",  service:"service A",  status:"connect",  modified:"2023-12-04 10:00"},
        {name:"service name B",  type:"B",  service:"service B",  status:"connect",  modified:"2023-12-04 10:00"},
        {name:"service name C",  type:"C",  service:"service C",  status:"connect",  modified:"2023-12-04 10:00"},
        {name:"service name D",  type:"D",  service:"service D",  status:"connect",  modified:"2023-12-04 10:00"},
        {name:"service name E",  type:"E",  service:"service E",  status:"connect",  modified:"2023-12-04 10:00"}
    ])
}

var pipeline_selected = null

const pipeline_dummy = {
    "data_load": {status:"waitting", title:"Data Load", process:"", time:"", code:`
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
    `,result:`
    
    `},
    "trainning": {status:"waitting", title:"Trainning", process:"", time:"", code:`
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
    `,result:`
    
    `},
    "evaluation": {status:"waitting", title:"Evaluation", process:"", time:"", code:`
        # 테스트
        model.eval()
        with torch.no_grad():
            test_outputs = model(X_test.float())
            mse = criterion(test_outputs, y_test.float())
            print(f'테스트 데이터에 대한 MSE(Mean Squared Error): {mse.item():.4f}')
    `,result:`
    
    `},
    "Predict": {status:"waitting", title:"Evaluation", process:"", time:"", code:`
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
    `,result:`
    
    `},
    
}

const init_pipeline = ()=>{
    pipeline_set_flowchart(pipeline_dummy)

}

document.addEventListener('DOMContentLoaded', function() {
    console.log('loaded.')
    init_home()
    init_model()
    init_pipeline()
    select_tab('pipelines')
});