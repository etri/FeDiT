import torch.nn as nn
import torch

class Conv(nn.Module):
    '''Convolution'''
    def __init__(self, in_channel, out_channel, mid_channel=None):
        super(Conv,self).__init__()

        # 중간 채널 사이즈 지정X 일경우 "중간채널크기 = 출력채널크기"
        if mid_channel:
            pass
        else:
            mid_channel = out_channel
        
        # 레이어정의 
        self.conv_layer = nn.Sequential(
            nn.Conv2d(in_channel,mid_channel,kernel_size=3,stride=1,padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channel,out_channel,kernel_size=3,stride=1,padding=1),
            nn.ReLU(inplace=True),
        )
    def forward(self,x):
        return self.conv_layer(x)

class Down(nn.Module):
    '''Down Sampling'''
    def __init__(self,in_channel,out_channel):
        super(Down,self).__init__()
        self.DownSampling = nn.Sequential(
            nn.MaxPool2d(2), # 숫자값 한개 기입시, kernel_size=2, stride=2 의미를 지님
            # nn.LayerNorm(in_channel),
            Conv(in_channel,out_channel)
        )
    def forward(self,x):
        return self.DownSampling(x)

class Up(nn.Module):
    '''Up Sampling'''
    def __init__(self,in_channel,out_channel,kernel_size_num,stride_num):
        super(Up,self).__init__()
        self.ConvT = nn.ConvTranspose2d(in_channel, in_channel // 2, kernel_size=kernel_size_num, stride=stride_num) # 채널 수 줄임
        self.Conv = Conv(in_channel,out_channel)
    
    def forward(self,older,new):
        new = self.ConvT(new)
        new = torch.cat([older,new],dim=1)    
        result = self.Conv(new)
        return result

class OutConv(nn.Module):
    '''Out Convolution'''
    def __init__(self,in_channel,out_channel):
        super(OutConv,self).__init__()
        self.OutConv = nn.Sequential(
            nn.Conv2d(in_channel,out_channel,kernel_size=1)
        )
    
    def forward(self,x):
        return self.OutConv(x)

class embedding(nn.Module):
    '''embedding operating condition'''
    def __init__(self):
        super(embedding,self).__init__()

        # 스페셜 토큰을 임베딩 layers     
        self.special_token_embedding_layer = nn.Embedding(5, 256)
        
        # 운전정보 숫자파악 Dense layers
        self.special_value_embedding_layer = nn.Sequential(
            nn.Linear(1,256),
            nn.ReLU(),
        )
        
        # 레이어정의
        self.embedding_layer = nn.Sequential(
            nn.Flatten(),
            nn.Linear(1024,1024),
            nn.ReLU(),
            nn.Linear(1024,512),
            nn.ReLU(),      
            nn.Linear(512,256),  
        )

    def forward(self, inp1, inp2):     

        tokens,values = inp1,inp2 # (batch,5), (batch,5)

        # 스페셜 토큰 임베딩
        toks = self.special_token_embedding_layer(tokens) # (batch, 5, 256)
        
        # 운전정보 숫자 임베딩
        vals = torch.unsqueeze(values,2) # (batch, 5, 1) 
        vals = self.special_value_embedding_layer(vals) # (batch,5,256)
        
        # 운전정보 + 스페셜토큰 
        x = vals+toks
        
        # layer 통과
        outputs = self.embedding_layer(x)

        # shape 변경
        outputs = torch.reshape(outputs, [-1, 1, 256]) # batch size x 1 x 256 

        return outputs



class TransUNet(nn.Module):
    '''Main Class'''
    def __init__(self):
        super(TransUNet,self).__init__()
        
        self.first_conv = Conv(4,32)
        self.Down_1 = Down(32,64)
        self.Down_2 = Down(64,128)
        self.Down_3 = Down(128,256)
        self.numeric_model = embedding()
        self.dense_layer = nn.Linear(256,256)
        self.Up_1 = Up(256,128,2,2)
        self.Up_2 = Up(128,64,3,2)
        self.Up_3 = Up(64,32,3,2)
        self.Out = OutConv(32,3)

    def forward(self,inp):
        
        x, text1, text2= inp
        
        # Down Sampling 
        x_1 = self.first_conv(x)
        x_2 = self.Down_1(x_1)
        x_3 = self.Down_2(x_2)
        x_4 = self.Down_3(x_3)

        shape_batch = x_4.shape[0] # batch
        shape_0 = x_4.shape[1] # channel
        shape_1 = x_4.shape[2] # width
        shape_2 = x_4.shape[3] # height

        temp = torch.reshape(x_4,[shape_batch,shape_0,shape_1*shape_2])
        text = self.numeric_model(text1,text2)
        text = text.permute(0,2,1)
        text = torch.concat([text]*shape_1*shape_2,axis=2)
        temp = temp+text
        temp = torch.reshape(temp,[shape_batch,shape_0,shape_1,shape_2])

        # Up Sampling
        x_up_1 = self.Up_1(x_3,temp)
        x_up_2 = self.Up_2(x_2,x_up_1)
        x_up_3 = self.Up_3(x_1,x_up_2)

        # Output
        x = self.Out(x_up_3)

        return x