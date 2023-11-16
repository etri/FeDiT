from torch.utils.data import Dataset
import numpy as np

class CustomDataset(Dataset):
    def __init__(self, transform=None, target_transform=None): 
            
        PROCESSED_PATH = 'dataset/processed/'
        IN = "IN/"
        OUT = "OUT/"
        
        self.ux_inputs = np.load(PROCESSED_PATH+IN+"ux.npy")[:,:,:,np.newaxis]
        self.uy_inputs = np.load(PROCESSED_PATH+IN+"uy.npy")[:,:,:,np.newaxis]
        self.p_inputs = np.load(PROCESSED_PATH+IN+"p.npy")[:,:,:,np.newaxis]
        self.bdr_inputs = np.load(PROCESSED_PATH+IN+"bdr.npy")[:,:,:,np.newaxis]
        self.st_inputs = np.load(PROCESSED_PATH+IN+"special_token.npy")
        self.sv_inputs = np.load(PROCESSED_PATH+IN+"special_value.npy")
        self.ux_outputs = np.load(PROCESSED_PATH+OUT+"ux.npy")[:,:,:,np.newaxis]
        self.uy_outputs = np.load(PROCESSED_PATH+OUT+"uy.npy")[:,:,:,np.newaxis]
        self.p_outputs = np.load(PROCESSED_PATH+OUT+"p.npy")[:,:,:,np.newaxis]
        
        self.transform = transform
        self.target_transform = target_transform

    def __len__(self):
        return len(self.ux_inputs)

    def __getitem__(self,idx):
        
        # 데이터 전처리
        if self.transform:
            ux_input = self.transform(self.ux_inputs[idx])
            uy_input = self.transform(self.uy_inputs[idx])
            p_input = self.transform(self.p_inputs[idx])
            bdr_input = self.transform(self.bdr_inputs[idx])
        if self.target_transform:
            ux_output = self.target_transform(self.ux_outputs[idx])
            uy_output = self.target_transform(self.uy_outputs[idx])
            p_output = self.target_transform(self.p_outputs[idx])
        
        st_input = self.st_inputs[idx]
        sv_input = self.sv_inputs[idx]
        
        return ux_input,uy_input,p_input,bdr_input,st_input,sv_input,\
                ux_output,uy_output,p_output

