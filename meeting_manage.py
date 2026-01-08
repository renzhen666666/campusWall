import json
import os
import uuid
import random
import time
from threading import Thread
import datetime

DATA_PATH = os.path.join('meetings', "meeting_data.json" )
TEMP_PATH = os.path.join('meetings', "temp")


class MeetingManager:
    def __init__(self):
        self.meeting_data_path = DATA_PATH
        self.meeting_data = {}
        
        self.stop_cleanup = False

        self.load_meeting_data()
        self.start_cleanup_thread()  # 启动清理线程

    def start_cleanup_thread(self):
        thread = Thread(target=self.cleanup_expired_meetings, daemon=True)
        thread.start()

    def cleanup_expired_meetings(self):
        while not self.stop_cleanup:
            current_time = datetime.datetime.now()
            expired_ids = [
                mid for mid, data in self.meeting_data.items()
                if data.get("timeout") and current_time > datetime.datetime.fromisoformat(data["timeout"])
            ]
            for mid in expired_ids:
                del self.meeting_data[mid]
            if expired_ids:
                self.save_meeting_data()
            time.sleep(60) 

    def save_meeting_data(self):
        with open(self.meeting_data_path, 'w', encoding='utf-8') as f:
            json.dump(self.meeting_data, f, ensure_ascii=False, indent=4)


    def set_meeting_data(self, meeting_id, **kwargs):
        if meeting_id not in self.meeting_data:
            return {"success": False, "message": "Meeting ID does not exist."}
        for key, value in kwargs.items():
            self.meeting_data[meeting_id][key] = value
        self.save_meeting_data()
        return {"success": True, "message": "Meeting data updated successfully."}

    def create_meeting(self, timeout=10):
        id = self.create_meeting_id()
        self.meeting_data[id] = {"timeout": (datetime.datetime.now() + datetime.timedelta(minutes=timeout)).isoformat()}
        self.save_meeting_data()
        return id


    def create_meeting_id(self):
        meeting_id = str(uuid.uuid4())
        while meeting_id in self.meeting_data:
            meeting_id = str(uuid.uuid4())
        return meeting_id
    
    
    def get_meeting_info(self, meeting_id):
        if meeting_id in self.meeting_data:
            return self.meeting_data[meeting_id]
        else:
            return None

    def get_meeting_data(self):
        return self.meeting_data

    def load_meeting_data(self):
        with open(self.meeting_data_path, 'r', encoding='utf-8') as f:
            self.meeting_data = json.load(f)

    def shutdown(self):
        self.stop_cleanup = True
        self.save_meeting_data()