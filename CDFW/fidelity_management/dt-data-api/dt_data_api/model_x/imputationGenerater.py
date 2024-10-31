import pandas as pd
import numpy as np
import time
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from keras import backend as K

from sklearn.preprocessing import StandardScaler

class manager:
    data = pd.DataFrame
    BUFFER_SIZE = 900000
    BATCH_SIZE = 128
    
    '''
    초기화
    '''
    def __init__(self, data=None) -> None:
        self.data = data
    
    '''
    데이터 설정
    '''
    def setData(self, data=None):
        self.data = data
    
    def modelTrainning(self):
        print(self.data.head())
        print(self.data.info())
        print(self.data.describe())
        
        df_nans = self.data.loc[:, np.isnan(self.data).sum() > 0]
        np.isnan(df_nans).sum() / df_nans.shape[0]

        columns = df_nans.columns
        fig = plt.figure(figsize=(9, 6))
        plt.bar(x=columns, height = np.isnan(df_nans).sum())
        #plt.show()
        plt.savefig('dt_data_api/data/gain_nan_1.png', dpi=300)

        df_nans.plot.hist(figsize=(9, 6), bins = 50)
        #plt.show()
        plt.savefig('dt_data_api/data/gain_nan_2.png', dpi=300)

        df_nans.hist(figsize=(9, 6))
        #plt.show()
        plt.savefig('dt_data_api/data/gain_nan_3.png', dpi=300)

        #return None

        scaler = StandardScaler()
        #train_data = scaler.fit_transform(self.data.drop('date', axis = 1))
        train_data = scaler.fit_transform(self.data)
        train_dataset = tf.data.Dataset.from_tensor_slices(train_data).shuffle(self.BUFFER_SIZE).batch(self.BATCH_SIZE, drop_remainder=True)

        generator_optimizer = keras.optimizers.SGD(1e-4)
        discriminator_optimizer = keras.optimizers.SGD(1e-4)

        generator = self.generator_builder()
        discriminator = self.discriminator_builder()
        
        gen_loss, disc_loss = self.train(train_dataset, EPOCHS = 1000, generator_optimizer=generator_optimizer, discriminator_optimizer=discriminator_optimizer, generator=generator, discriminator=discriminator)

        plt.figure(figsize = (6, 3))
        plt.plot(gen_loss, color = 'orange')
        plt.title('Generator Loss')
        plt.xlabel('Iter')
        plt.ylabel('Loss')
        #plt.show()
        plt.savefig('dt_data_api/data/gain_loss_1.png', dpi=300)

        plt.figure(figsize = (6, 3))
        plt.plot(disc_loss, color = 'orange')
        plt.title('Disciriminator Loss')
        plt.xlabel('Iter')
        plt.ylabel('Loss')
        #plt.show()
        plt.savefig('dt_data_api/data/gain_loss_2.png', dpi=300)

        m = tf.where(tf.math.is_nan(train_data), tf.zeros_like(train_data), tf.ones_like(train_data))
        train_data_C = tf.where(tf.math.is_nan(train_data), tf.zeros_like(train_data), train_data)
        z = np.random.uniform(0, 0.01, size = train_data.shape)
        train_data = tf.math.multiply(train_data_C, m) + tf.math.multiply((tf.ones_like(m) - m), z)

        X_temp = tf.cast(generator(tf.concat([train_data, m], 1), training = True), tf.float64)
        X_hat = tf.math.multiply(m, train_data) + tf.math.multiply((tf.ones_like(m) - m), X_temp) 

        pred = scaler.inverse_transform(X_hat)
        #df_ = self.data.drop(['date'], axis = 1)
        df_ = self.data
        test = []
        for idx_col, col in enumerate(self.data):
            for idx_row, row in enumerate(self.data.loc[:, col]):
                if np.isnan(row):
                    test.append(f'{idx_row}-{col}')
        res = []
        for col_idx, col in enumerate(df_):
            for row_idx, row in enumerate(df_.loc[:, col]):
                if np.isnan(row):
                    res.append(pred[row_idx, col_idx])

        out = np.array([test, res])
        out = pd.DataFrame(out.T)
        out = out.rename({0: 'row-col', 1: 'value'}, axis = 1)
        out.to_csv('sub3_temp.csv', index = False)


    def generator_builder(self, num_fet = 14):
        # 80 * 2 = 162
        generator = keras.models.Sequential([
            keras.layers.Input(shape = num_fet * 2), 
            keras.layers.Dense(150, 'relu'),
            keras.layers.Dense(100, 'relu'),
            keras.layers.Dense(14, 'sigmoid')
        ])
        return generator
    
    def discriminator_builder(self, num_fet = 14):
        # 80 * 2 = 162
        discriminator = keras.models.Sequential([
            keras.layers.Input(shape = num_fet * 2),
            keras.layers.Dense(150, 'relu'),
            keras.layers.Dense(100, 'relu'),
            keras.layers.Dense(14, 'sigmoid'),
        ])

        return discriminator
    
    def discriminator_loss(self, m, m_hat):
        temp = tf.math.multiply(m, tf.math.log(m_hat + 1e-8))
        temp += tf.math.multiply(tf.ones_like(m) - m , tf.math.log(tf.ones_like(m_hat) - m_hat + 1e-8))
        return -tf.reduce_mean(temp)
    
    def generator_loss(self, m, m_hat, x, x_hat, alpha = 10):
        loss = -tf.math.multiply((tf.ones_like(m)-m), tf.math.log(m_hat+1e-8))
        loss += alpha * tf.multiply(m, (x - x_hat) ** 2)
        return tf.reduce_mean(loss)
    
    def hint_smapler(self, batch_size = 128, num_fet = 14, hint_rate = 0.9):
        A = np.random.uniform(0., 1., size = [batch_size, num_fet])
        B = hint_rate > A
        C = 1.*B
        return C
    
    def train_step(self, batch, epoch_num, generator_optimizer, discriminator_optimizer, generator, discriminator):
        m = tf.where(tf.math.is_nan(batch), tf.zeros_like(batch), tf.ones_like(batch))
        batch_C = tf.where(tf.math.is_nan(batch), tf.zeros_like(batch), batch)
        z = np.random.uniform(0, 0.01, size = batch.shape)
        batch = tf.math.multiply(batch_C, m) + tf.math.multiply((tf.ones_like(m) - m), z)
        with tf.GradientTape() as gen_tape, tf.GradientTape() as disc_tape:

            X_temp = tf.cast(generator(tf.concat([batch, m], 1), training = True), tf.float64)
            X_hat = tf.math.multiply(m, batch) + tf.math.multiply((tf.ones_like(m) - m), X_temp)

            H = tf.math.multiply(self.hint_smapler(),  m)
            M_hat = tf.cast(discriminator(tf.concat([X_hat, H], 1), training = True), tf.float64)

            disc_loss = self.discriminator_loss(m, M_hat)
            gen_loss = self.generator_loss(m, M_hat, batch, X_hat, alpha = 10)

        gen_grad = gen_tape.gradient(gen_loss, generator.trainable_variables)
        disc_grad = disc_tape.gradient(disc_loss, discriminator.trainable_variables)
        generator_optimizer.apply_gradients(zip(gen_grad, generator.trainable_variables))
        discriminator_optimizer.apply_gradients((zip(disc_grad, discriminator.trainable_variables)))
        return gen_loss, disc_loss
    
    def train(self, dataset, EPOCHS, generator_optimizer, discriminator_optimizer, generator, discriminator):
        losses_gen = []
        losses_disc  = []
        gen_loss = None
        disc_loss = None
        for epoch in range(1, EPOCHS+1):
            print(f'Epoch {epoch} / {EPOCHS}:', end=' ')
            t0 = time.time()
            for batch in dataset:
                gen_loss, disc_loss = self.train_step(batch, epoch, generator_optimizer, discriminator_optimizer, generator, discriminator)
                losses_gen.append(gen_loss)
                losses_disc.append(disc_loss)                
            t1 = time.time()
            print(f'gen_loss = {gen_loss}, disc_loss = {disc_loss}, time = {t1 - t0}')
        return losses_gen, losses_disc