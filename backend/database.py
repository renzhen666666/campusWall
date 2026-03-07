"""
数据库连接模块 - 用于外部数据库连接
"""
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class Database:
    """数据库连接类 - 使用 HTTP API 连接外部数据库"""
    
    def __init__(self, api_url: str = "", api_key: str = ""):
        self.apiUrl = api_url
        self.apiKey = api_key
        self.login = False
        self.passport = ""
        
        if api_url:
            self.setup()
    
    def checkHealth(self) -> bool:
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(self.apiUrl + 'health')
                res = response.json()
                if res.get("status") == "healthy":
                    return True
        except Exception as e:
            logger.error(f"健康检查失败: {e}")
        return False
    
    def setup(self) -> None:
        cnt = 5
        while cnt > 0:
            cnt -= 1
            if not self.checkHealth():
                continue
            
            try:
                with httpx.Client(timeout=10.0) as client:
                    response = client.post(
                        self.apiUrl + 'login',
                        json={"passport": self.passport}
                    )
                    res = response.json()
                    
                    if res.get("status") == "success":
                        self.passport = res.get("passport", "")
                        self.login = True
                        break
                    else:
                        logger.error("获取数据库令牌失败")
            except Exception as e:
                logger.error(f"数据库连接失败: {e}")
        
        if not self.login:
            logger.error("登录失败，重试次数已用完")
    
    def request(self, path: str, data: dict, method: str = 'POST') -> dict:
        try:
            with httpx.Client(timeout=30.0) as client:
                if method == 'POST':
                    response = client.post(
                        self.apiUrl + path,
                        json=data,
                        headers={"passport": self.passport}
                    )
                else:
                    response = client.get(
                        self.apiUrl + path,
                        json=data,
                        headers={"passport": self.passport}
                    )
                
                res = response.json()
                if res.get("success") == True:
                    return res
                else:
                    logger.error(f"请求失败: {res}")
                    return {"success": False, "error": res}
        except Exception as e:
            logger.error(f"请求异常: {e}")
            return {"success": False, "error": str(e)}
    
    def checkDataFormat(self, data: dict, template: dict) -> bool:
        for key, value in template.items():
            if key not in data:
                return False
            if type(data[key]) != type(value):
                return False
            if type(data[key]) == dict:
                if not self.checkDataFormat(data[key], value):
                    return False
        return True
    
    def batchInsert(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "documents": [dict()],
            "ordered": False
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        return self.request("batch/insert", {
            "collection_name": data.get("collection_name"),
            "documents": data.get("documents"),
            "ordered": data.get("ordered", False)
        })
    
    def batchUpdate(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "updates": [dict()],
            "ordered": False
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        return self.request("batch/update", {
            "collection_name": data.get("collection_name"),
            "updates": data.get("updates"),
            "ordered": data.get("ordered", False)
        })
    
    def batchDelete(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "filters": [dict()],
            "ordered": False
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        return self.request("batch/delete", {
            "collection_name": data.get("collection_name"),
            "filters": data.get("filters"),
            "ordered": data.get("ordered", False)
        })
    
    def batchMixed(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "operations": [dict()],
            "ordered": False
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        return self.request("batch/mixed", {
            "collection_name": data.get("collection_name"),
            "operations": data.get("operations"),
            "ordered": data.get("ordered", False)
        })
    
    def importJson(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "json_data": [dict()]
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        return self.request("batch/import", {
            "collection_name": data.get("collection_name"),
            "json_data": data.get("json_data")
        })
    
    def exportJson(self, data: dict) -> dict:
        template = {
            "collection_name": "",
            "query": dict(),
            "limit": 0
        }
        if not self.checkDataFormat(data, template):
            return {"success": False, "error": "数据格式错误"}
        
        request_data = {
            "collection_name": data.get("collection_name"),
            "query": data.get("query", {})
        }
        if data.get("limit", 0) > 0:
            request_data["limit"] = data["limit"]
        
        return self.request("batch/export", request_data)
