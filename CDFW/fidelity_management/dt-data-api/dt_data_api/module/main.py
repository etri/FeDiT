import argparse

from src.auto_train import AutoTrain

def main():
    parser = argparse.ArgumentParser(description='Auto LSTM-AE Script')
    parser.add_argument('-m', '--mode', type=str, choices=['train', 'infer'], default='infer', help='Mode: train or infer')
    parser.add_argument('-w', '--window_size', type=int, default=10, help='Size of the window for the model')
    parser.add_argument('-l', '--layer_size', type=int, default=3, help='Number of layers in the model')
    parser.add_argument('-p', '--patience', type=int, default=5, help='Patience for EarlyStopping')
    args = parser.parse_args()

    print('Mode:', args.mode)
    print('Window Size:', args.window_size)
    print('Number of layers:', args.layer_size)
    print('Patience for EarlyStopping:', args.patience)

    autoTrain = AutoTrain(args.window_size, args.layer_size, args.mode)
    if args.mode == "train":
        autoTrain.train_and_save(args.patience)
    elif args.mode == "infer":
        mae = autoTrain.load_and_infer()
        print("에러:", mae)

if __name__=="__main__":
    main()