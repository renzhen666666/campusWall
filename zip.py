from subprocess import run
from threading import Thread
import time
import os

start_time = time.time()

js_path = os.path.join(os.getcwd(), 'static', 'js')
css_path = os.path.join(os.getcwd(), 'static', 'css')
js_file_list = [os.path.join(os.getcwd(), js_path, file) for file in os.listdir(js_path) if file.endswith('.js') and not ('_min' in file)]
css_file_list = [os.path.join(os.getcwd(), css_path, file) for file in os.listdir(css_path) if file.endswith('.css') and not ('_min' in file)]

thread_list = []


for js_file in js_file_list:
    print(f"当前文件{js_file}")
    order = f"npx uglify-js {js_file} -o {js_file.replace('.js', '_min.js')}"
    zip_thread = Thread(target=run, args=(order,), kwargs={'shell': True}, name=js_file)
    zip_thread.start()
    thread_list.append(zip_thread)



for css_file in css_file_list:
    print(f"当前文件{css_file}")
    order = f"npx cssnano {css_file} {css_file.replace('.css', '_min.css')}"
    zip_thread = Thread(target=run, args=(order,), kwargs={'shell': True}, name=css_file)
    zip_thread.start()
    thread_list.append(zip_thread)


for thread in thread_list:
    thread.join()
    print(f"{thread.name}线程结束")


print(f"压缩完成，耗时{time.time() - start_time}秒")