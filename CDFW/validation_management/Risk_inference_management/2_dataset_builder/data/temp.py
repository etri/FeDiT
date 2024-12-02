import json


with open('keywords.json') as json_file:
    data = json.load(json_file)

    print(data)