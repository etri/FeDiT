import ml_collections
import numpy as np

def get_dataset_size():
    config = ml_collections.ConfigDict()
    config.xsize = 101
    config.ysize = 101
    return config
    
def get_dataset_config(ux_data,uy_data,p_data):

    config = get_dataset_size()
    config.ux_max = np.max(ux_data)
    config.uy_max = np.max(uy_data)
    config.p_max = np.max(p_data)
    return config

def operating_condition_max_value_config(operating_data):
    '''운전조건 속성별 최대값'''
    
    config = ml_collections.ConfigDict()
    init_ux_max = np.max(operating_data[:,1,0])
    init_uy_max = np.max(operating_data[:,1,1])
    density_max = np.max(operating_data[:,1,2])
    viscosity_max = np.max(operating_data[:,1,3])

    config.init_ux=init_ux_max
    config.init_uy=init_uy_max
    config.density=density_max
    config.viscosity=viscosity_max

    return config    