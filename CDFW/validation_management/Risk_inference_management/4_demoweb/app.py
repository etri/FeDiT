from flask import Flask, Blueprint, request, jsonify, Response
import requests
from model import model

app = Flask(__name__, static_url_path='/static')
app.register_blueprint(model, url_prefix='/model')


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)  # send_static_file will guess the correct MIME type


if __name__ == '__main__':
    # app.run()
    app.run(host='0.0.0.0', port=8080)
