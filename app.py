from flask import Flask, request, jsonify, render_template
import requests
import time
from threading import Thread


app = Flask(__name__)

survival_time = 5

base_url = 'http://localhost:541/api/'

class cache:
    def __init__(self):
        self.get_cache = dict()
        self.post_cache = dict()

        Thread(target=self.clear, daemon=True).start()


    def clear(self):
        while True:
            if len(self.get_cache) > 0:
                for key in list(self.get_cache.keys()):
                    if time.time() - self.get_cache[key]['time'] > survival_time:
                        del self.get_cache[key]
            if len(self.post_cache) > 0:
                for key in list(self.post_cache.keys()):
                    if time.time() - self.post_cache[key]['time'] > survival_time:
                        del self.post_cache[key]


    def data_of_get(self, key):
        return self.get_cache.get(key, dict()).get('data', None)

    def data_of_post(self, key):
        return self.post_cache.get(key, dict().get('data', None))
    
    def set_get(self, key, data):
        self.get_cache[key] = {'data': data, "time":time.time()}

    def set_post(self, key, data):
        self.post_cache[key] = {'data': data, "time":time.time()}


requestcache = cache()


@app.route('/<api_name>', methods=['GET'])
def api_get(api_name):
    args = request.args
    url = base_url + api_name

    cache = requestcache.data_of_get(f"{url}{args}")

    if cache is not None:
        return jsonify(cache)

    
    response = requests.get(url, params=args)
    try:
        response.raise_for_status()
        data = response.json()
        requestcache.set_get(f"{url}{args}", data)
        return jsonify(response.json())
    except requests.exceptions.HTTPError as err:
        return jsonify({'error': str(err)}), response.status_code
    

@app.route('/<api_name>', methods=['POST'])
def api_post(api_name):
    data = request.get_json()
    url = base_url + api_name


    cache = requestcache.data_of_post(f"{url}{data}")
    
    if cache is not None:
        return jsonify(cache)

    response = requests.post(url, json=data)
    try:
        response.raise_for_status()
        data = response.json()
        requestcache.set_post(f"{url}{data}", data)
        return jsonify(response.json())
    except requests.exceptions.HTTPError as err:
        return jsonify({'error': str(err)}), response.status_code

if __name__ == '__main__':
    app.run(debug=False, port=6854)
