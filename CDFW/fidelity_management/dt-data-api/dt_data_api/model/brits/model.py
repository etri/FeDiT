import numpy as np
import pandas as pd
import tensorflow as tf

#from .utils import get_inputs
from .modules import RITS

class BRITS:
    
    def __init__(self, x, units, timesteps, strategy=None):
        
        '''
        Implementation of multivariate time series imputation model introduced in Cao, W., Wang, D., Li, J.,
        Zhou, H., Li, L. and Li, Y., 2018. BRITS: Bidirectional recurrent imputation for time series.
        Advances in neural information processing systems, 31.
        
        Parameters:
        __________________________________
        x: np.array.
            Time series, array with shape (samples, features) where samples is the length of the time series
            and features is the number of time series.
        
        units: int.
            Number of hidden units of the recurrent layer.
        timesteps: int.
            Number of time steps.
        '''
        
        self.x = x
        self.x_min = np.nanmin(x, axis=0)
        self.x_max = np.nanmax(x, axis=0)
        self.samples = x.shape[0]
        self.features = x.shape[1]
        self.units = units
        self.timesteps = timesteps
        self.strategy = strategy  # strategy 저장
  
    def fit(self, learning_rate=0.001, batch_size=32, epochs=100, verbose=True):
        
        '''
        Train the model.
        
        Parameters:
        __________________________________
        learning_rate: float.
            Learning rate.
            
        batch_size: int.
            Batch size.
            
        epochs: int.
            Number of epochs.
            
        verbose: bool.
            True if the training history should be printed in the console, False otherwise.
        '''
        
        # Scale the time series.
        x = (self.x - self.x_min) / (self.x_max - self.x_min)

        # Get the inputs in the forward direction.
        forward = self.get_inputs(x)

        # Get the inputs in the backward direction.
        backward = self.get_inputs(np.flip(x, axis=0))

        # Generate the input sequences.
        dataset = tf.keras.utils.timeseries_dataset_from_array(
            data=tf.concat([forward, backward], axis=-1),
            targets=None,
            sequence_length=self.timesteps,
            sequence_stride=self.timesteps,
            batch_size=batch_size,
            shuffle=True
        )


        with self.strategy.scope():  # strategy 범위 내에서 훈련 진행
            model = build_fn(
                timesteps=self.timesteps,
                features=self.features,
                units=self.units
            )
            optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)

            @tf.function
            def distributed_train_step(data):
                def step_fn(inputs):
                    with tf.GradientTape() as tape:
                        _, loss = model(inputs)
                    gradients = tape.gradient(loss, model.trainable_variables)
                    optimizer.apply_gradients(zip(gradients, model.trainable_variables))
                    return loss

                per_replica_losses = self.strategy.run(step_fn, args=(data,))
                return self.strategy.reduce(tf.distribute.ReduceOp.SUM, per_replica_losses, axis=None)

        for epoch in range(epochs):
            for data in dataset:
                loss = distributed_train_step(data)
            if verbose:
                print(f'Epoch {epoch + 1}, Loss: {loss:.6f}')


        '''
        # Build the model.
        model = build_fn(
            timesteps=self.timesteps,
            features=self.features,
            units=self.units
        )
        
        # Define the training loop.
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)

        @tf.function
        def train_step(data):
            with tf.GradientTape() as tape:
                
                # Calculate the loss.
                _, loss = model(data)
            
            # Calculate the gradient.
            gradient = tape.gradient(loss, model.trainable_variables)
        
            # Update the weights.
            optimizer.apply_gradients(zip(gradient, model.trainable_variables))
            
        
            return loss

        # Train the model.
        for epoch in range(epochs):
            for data in dataset:
                loss = train_step(data)
            if verbose:
                print('epoch: {}, loss: {:,.6f}'.format(1 + epoch, loss))

        '''
        # Save the model.
        self.model = model
    
    def impute(self, x):
        
        '''
        Impute the time series.
        
        Parameters:
        __________________________________
        x: np.array.
            Time series, array with shape (samples, features) where samples is the length of the time series
            and features is the number of time series.
            
        Returns:
        __________________________________
        imputed: pd.DataFrame.
            Data frame with imputed time series.
        '''
        
        if x.shape[1] != self.features:
            raise ValueError(f'Expected {self.features} features, found {x.shape[1]}.')
        
        else:
            
            # Scale the time series.
            x = (x - self.x_min) / (self.x_max - self.x_min)
    
            # Get the inputs in the forward direction.
            forward = self.get_inputs(x)
    
            # Get the inputs in the backward direction.
            backward = self.get_inputs(np.flip(x, axis=0))
    
            # Generate the input sequences.
            dataset = tf.keras.utils.timeseries_dataset_from_array(
                data=tf.concat([forward, backward], axis=-1),
                targets=None,
                sequence_length=self.timesteps,
                sequence_stride=self.timesteps,
                batch_size=1,
                shuffle=False
            )
            
            # Generate the imputations.
            imputed = tf.concat([self.model(data)[0] for data in dataset], axis=0).numpy()
            imputed = np.concatenate([imputed[i, :, :] for i in range(imputed.shape[0])], axis=0)
            imputed = self.x_min + (self.x_max - self.x_min) * imputed

            return imputed

    def get_inputs(self, x):
        
        '''
        Derive the masking vectors and calculate the time gaps.
        See Section 3 of the BRITS paper.
        
        Parameters:
        __________________________________
        x: np.array.
            Time series, array with shape (samples, features) where samples is the length of the time series
            and features is the number of time series.
        Returns:
        __________________________________
        inputs: tf.Tensor.
            Model inputs, tensor with shape (samples, features, 3) where 3 is the number of model inputs
            (time series, masking vectors and time gaps).
        '''
        
        # Derive the masking vector.
        m = np.where(np.isnan(x), 0, 1)
        
        # Calculate the time gaps.
        d = np.zeros(x.shape)
        for t in range(1, x.shape[0]):
            d[t, :] = np.where(m[t - 1, :] == 0, d[t - 1, :] + 1, 1)

        # Standardize the time gaps.
        d = (d - d.mean(axis=0)) / (d.std(axis=0) + 1e-5)

        # Mask the inputs.
        x = np.where(m == 0, 0, x)
        
        # Cast the inputs to float tensors.
        x = tf.expand_dims(tf.cast(x, tf.float32), axis=-1)
        m = tf.expand_dims(tf.cast(m, tf.float32), axis=-1)
        d = tf.expand_dims(tf.cast(d, tf.float32), axis=-1)

        # Concatenate the inputs.
        inputs = tf.concat([x, m, d], axis=-1)
        
        return inputs        


    def save_model(self, path="brits_model.h5"):
        '''
        모델을 지정된 경로에 저장.
        
        Parameters:
        __________________________________
        path: str.
            저장할 파일 경로.
        '''
        self.model.save_weights(path)

        # Save custom parameters
        custom_objects = {
            'units': self.units,
            'timesteps': self.timesteps,
            'features': self.features,
        }
        
        import json
        with open(path + '_brits_data.json', 'w') as f:
            json.dump(custom_objects, f)

        print(f"Model saved to '{path}'")

    @staticmethod
    def load_model(path="brits_model.h5", x=None):
        '''
        모델을 지정된 경로에서 불러오기.
        
        Parameters:
        __________________________________
        path: str.
            불러올 모델 파일 경로.
        
        units: int.
            RITS 유닛 수 (모델이 생성된 후 이 값을 알 수 있도록 전달해야 함).
        
        timesteps: int.
            모델이 학습에 사용한 시점 수.
        
        x: np.array.
            학습에 사용된 시계열 데이터 (모델 복원을 위해 필요).
        
        Returns:
        __________________________________
        brits: BRITS object.
            복원된 BRITS 모델 객체.
        '''
        if x is None:
            raise ValueError("units, timesteps, and x must be provided to restore the BRITS model.")

 
        # Load custom parameters
        import json
        with open(path + '_brits_data.json', 'r') as f:
            custom_objects = json.load(f)
        
        # Create a new instance of the BRITS model
        units = custom_objects['units']
        timesteps = custom_objects['timesteps']
        features = custom_objects['features']
        # Restore the BRITS class with saved attributes
        brits = BRITS(x=x, units=units, timesteps=timesteps)

        # Build the model.
        model = build_fn(
            timesteps=timesteps,
            features=features,
            units=units
        )

        # Load the model 
        model.load_weights(path)

        brits.model = model
        print(f"Model loaded from '{path}'")
        return brits            


def build_fn(timesteps, features, units):
    
    '''
    Build the model, see Section 4.2 of the BRITS paper.
    
    Parameters:
    __________________________________
    features: int.
        Number of time series.
    timesteps: int.
        Number of time steps.
    
    units: int.
        Number of hidden units of the recurrent layer.
    '''
    
    # Define the input layer, the model takes 3 inputs (time series, masking
    # vectors and time gaps) for each direction (forward and backward).
    inputs = tf.keras.layers.Input(shape=(timesteps, features, 6))
    
    # Get the imputations and loss in the forward directions.
    forward_imputations, forward_loss = RITS(units=units)(inputs[:, :, :, :3])

    # Get the imputations and loss in the backward directions.
    backward_imputations, backward_loss = RITS(units=units)(inputs[:, :, :, 3:])
    
    # Average the imputations across both directions (forward and backward).
    outputs = (forward_imputations + backward_imputations) / 2

    # Sum the losses (forward loss, backward loss and consistency loss).
    loss = forward_loss + backward_loss + tf.reduce_mean(tf.abs(forward_imputations - backward_imputations))
    
    return tf.keras.Model(inputs, (outputs, loss))


