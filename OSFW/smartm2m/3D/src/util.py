import numpy as np
import matplotlib.pyplot as plt
import pyvista as pv
import pandas as pd


def plotting(df,plot_value,setting_lst):
    '''plotting 함수'''
    # setting_lst : [plot크기(가로),plot크기(세로),값 세기,투명도,최소값,최대값,앵글각도(고도),앵글각도(방위)]
    
    x = np.asarray(df['x'])
    y = np.asarray(df['y'])
    z = np.asarray(df['z'])
    
    fig = plt.figure(figsize=(setting_lst[0],setting_lst[1]))
    ax1 = plt.axes(projection="3d")
    im = ax1.scatter3D(x,y,z,zdir='z', c=plot_value, cmap='jet',s=setting_lst[2], alpha=setting_lst[3], vmin=setting_lst[4], vmax=setting_lst[5])
    plt.colorbar(im)

    ax1.view_init(setting_lst[6],setting_lst[7])
    ax1.set_xlabel("x-dim")
    ax1.set_ylabel("y-dim")
    ax1.set_zlabel("z-dim")



def pyvista_plot(plot_array,opt_list,array_list):
    '''pyvista plot 하는 함수'''
    # plot : 플롯할 배열 (numpy array)
    # opt_list : [플롯시작값,플롯마지막값,개수,투명도,플롯시작범위,플롯마지막범위]
    # array_list : [x배열,y배열,z배열]
    
    value_1,value_2,value_num,value_opa,clim_1,clim2 = opt_list    
    x,y,z = array_list
    grid = pv.StructuredGrid(x, y, z)    
    grid["velocity"] = plot_array
    
    values = np.linspace(value_1,value_2 ,num=value_num)
    surfaces = [grid.contour([v]) for v in values]
    
    pt = pv.Plotter(notebook=0,shape=(1,1),border=False)
    pt.subplot(0,0)
    
    for i in range(len(values)):
        pt.add_mesh(surfaces[i], opacity=value_opa, clim=[clim_1,clim2],cmap='jet')
    pt.add_text("Interpolatiing Data",position='upper_edge',font_size=12)
    pt.show_bounds(grid='front') # 좌표값 표시 유무
    pt.add_bounding_box() # 전체 박스 표시유무
    pt.link_views(views=(0,0)) # 카메라 각도 / 근데 숫자바꾸니까 에러나네..(list index out of range)
    pt.show()
