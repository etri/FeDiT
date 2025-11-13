import tensorflow as tf
import numpy as np
import subprocess

class Estimater():

    def get_array_memory_usage(self, arr):
        try:
        # numpy array의 메모리 사용량을 MB 단위로 반환
            return arr.nbytes / 1024 ** 2
        except Exception as e:
            print(f"nbyte 없음: {e}")
            return None


    def get_gpu_memory(self):
        # GPU의 총 메모리를 MB 단위로 반환
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            # 첫 번째 GPU의 메모리 정보
            memory_info = tf.config.experimental.get_memory_info(gpus[0])
            # 총 메모리를 MB 단위로 반환
            return memory_info['device_memory_limit'] / 1024 ** 2
        else:
            return None

    def get_gpu_memory_info(self):
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=memory.total,memory.used,memory.free', '--format=csv,nounits,noheader'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if result.returncode != 0:
                print(f"nvidia-smi 실행 오류: {result.stderr}")
                return None

            info = result.stdout.strip().split('\n')
            total_memory, used_memory, free_memory = info[0].split(',')
            print(total_memory)

            total_memory_mb = int(total_memory) // 1024
            used_memory_mb = int(used_memory) // 1024
            free_memory_mb = int(free_memory) // 1024

            # return {
            #     'total_memory': total_memory_mb,
            #     'used_memory': used_memory_mb,
            #     'free_memory': free_memory_mb
            # }
            
            return total_memory_mb
        except Exception as e:
            print(f"오류 발생: {e}")
            return None
        
    def estimate_tf_model_memory_usage(self, model):
        # tf 모델의 메모리 사용량을 예측
        total_parameters = np.sum([np.prod(v.get_shape().as_list()) for v in model.trainable_variables])
        total_bytes = total_parameters * 4  # float32로 가정
        return total_bytes / (1024 ** 2)  # MB 단위로 변환
    
    def get_batch_size(self, model, df, base_batch_size=256, memory_usage_factor=2):
        df_memory = self.get_array_memory_usage(df)
        if df_memory == None:
            return base_batch_size
        
        model_memory = self.estimate_tf_model_memory_usage(model)
        #gpu_memory = self.get_gpu_memory()
        gpu_memory = self.get_gpu_memory_info()
        
        if gpu_memory == None: # 사용가능한 GPU 없음. 대신 CPU 사용
            return base_batch_size
        
        available_memory = gpu_memory - model_memory
        
        # 메모리 사용량과 GPU 메모리를 비교하여 배치 사이즈를 결정
        # 메모리 사용량이 GPU 메모리의 memory_usage_factor 배 이상이라면, base_batch_size를 반으로 줄임
        while df_memory > available_memory / memory_usage_factor and base_batch_size > 1:
            base_batch_size //= 2
            df_memory /= 2
        
        return base_batch_size