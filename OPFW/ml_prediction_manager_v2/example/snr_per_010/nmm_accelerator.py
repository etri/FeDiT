import importlib.metadata
import numpy as np
import shapely
from shapely.geometry import box
from shapely.strtree import STRtree
import torch

def nmm(predictions,match_metric='IOU',match_threshold=0.5):
    if match_metric not in {'IOU','IOS'}:
        raise ValueError('Invalid match_metric')
    coordinates=predictions[:,:4].detach().cpu().numpy().astype(np.float64)
    scores=predictions[:,4].detach().cpu().numpy()
    areas=((predictions[:,2]-predictions[:,0])*(predictions[:,3]-predictions[:,1])).detach().cpu().numpy()
    boxes=np.asarray([box(*map(float,row)) for row in coordinates],dtype=object)
    tree=STRtree(boxes)
    sorted_indices=torch.argsort(predictions[:,4],descending=True).tolist()
    keep_to_merge={}
    merge_to_keep={}
    for current in sorted_indices:
        candidates=tree.query(boxes[current])
        candidate_scores=scores[candidates]
        greater=np.zeros(len(candidates),dtype=bool)
        equal=np.ones(len(candidates),dtype=bool)
        for dimension in range(4):
            greater|=equal & (coordinates[candidates,dimension]>coordinates[current,dimension])
            equal&=coordinates[candidates,dimension]==coordinates[current,dimension]
        valid=(candidates!=current)&(candidate_scores<=scores[current])&((candidate_scores!=scores[current])|~greater)
        candidates=candidates[valid]
        lower=np.maximum(coordinates[current,:2],coordinates[candidates,:2])
        upper=np.minimum(coordinates[current,2:],coordinates[candidates,2:])
        lengths=np.maximum(upper-lower,0)
        intersections=lengths[:,0]*lengths[:,1]
        if match_metric=='IOU':
            denominators=float(areas[current])+areas[candidates].astype(np.float64)-intersections
        else:
            denominators=np.minimum(float(areas[current]),areas[candidates].astype(np.float64))
        overlaps=np.divide(intersections,denominators,out=np.zeros_like(intersections),where=denominators>0)
        boundary=np.abs(overlaps-match_threshold)<1e-6
        if boundary.any():
            precise=shapely.area(shapely.intersection(boxes[current],boxes[candidates[boundary]]))
            if match_metric=='IOU':
                denominator=float(areas[current])+areas[candidates[boundary]].astype(np.float64)-precise
            else:
                denominator=np.minimum(float(areas[current]),areas[candidates[boundary]].astype(np.float64))
            overlaps[boundary]=np.divide(precise,denominator,out=np.zeros_like(precise),where=denominator>0)
        matches=candidates[overlaps>=match_threshold]
        if current not in merge_to_keep:
            keep_to_merge[current]=[]
            for index in matches:
                index=int(index)
                if index not in merge_to_keep:
                    keep_to_merge[current].append(index)
                    merge_to_keep[index]=current
        else:
            keep=merge_to_keep[current]
            for index in matches:
                index=int(index)
                if index not in keep_to_merge.get(keep,[]) and index not in merge_to_keep:
                    keep_to_merge.setdefault(keep,[]).append(index)
                    merge_to_keep[index]=keep
    return keep_to_merge

def install():
    if importlib.metadata.version('sahi')!='0.11.36':
        raise RuntimeError('SAHI version must be 0.11.36')
    import sahi.postprocess.combine as combine
    combine.nmm=nmm
