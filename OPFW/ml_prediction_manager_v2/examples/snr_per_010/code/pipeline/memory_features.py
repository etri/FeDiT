import numpy as np


class JoinedFeatures:
    def __init__(self, geometry, embeddings):
        self.geometry = geometry
        self.embeddings = embeddings

    def __len__(self):
        return len(self.geometry)

    def __getitem__(self, index):
        return np.concatenate([self.geometry[index], np.asarray(self.embeddings[index], dtype=np.float32)], axis=1)
