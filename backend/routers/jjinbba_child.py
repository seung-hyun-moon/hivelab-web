import aiohttp
import requests

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import xml.etree.ElementTree as ET

from backend.schemas.jjinbba import JjinbbaChild, JjinbbaChildCreate, JjinbbaChildUpdate
from backend.db.models import JjinbbaChildModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD

headers = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlJFQUxFU1RBVEUiLCJpYXQiOjE3MzY1NzgxMjIsImV4cCI6MTczNjU4ODkyMn0.8RIgSiPOUAKBKEbskULl5k3VLyHdXLagzr9OJzhXAs4",
    "Connection": "keep-alive",
    "Host": "new.land.naver.com",
    "Referer": "https://new.land.naver.com",
    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
}


def extract_address_and_number_correctly(xml_data):
    try:
        root = ET.fromstring(xml_data)
        for order in root.findall('.//order'):
            area3 = order.find(".//area3")
            if area3 is not None:
                land = order.find(".//land")
                if land is not None:
                    number1 = land.find("number1")
                    number2 = land.find("number2")
                    if (number2 is not None and number2.text) and (number1 is not None and number1.text):
                        return f"{area3.find('name').text} {number1.text}-{number2.text}"
                    if number1 is not None and number1.text:
                        return f"{area3.find('name').text} {number1.text}"

        return "주소를 찾을 수 없습니다."
    except ET.ParseError:
        return "XML 파싱 에러"
    except Exception as e:
        return f"예외 발생: {str(e)}"

class JjinbbaChildRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=JjinbbaChild, post_schema=JjinbbaChildCreate, put_schema=JjinbbaChildUpdate, model=JjinbbaChildModel)
        # self.router.add_api_route('/info/{number}', self.get_number_info, response_model=None, methods=['GET'])

    def create_item(self, item: JjinbbaChildCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)
    #
    # async def get_number_info(self, number: str):
    #     naver_data = await self.get_naver_info(number)
    #     pnu = naver_data['articleDetail']['pnu']
    #     building_reg = await self.get_building_reg(pnu)
    #     print(naver_data)
    #     print(pnu)
    #     print(building_reg)
    #
    # @staticmethod
    # def get_building_reg(pnu: str):
    #     if not pnu:
    #         return None
    #
    #     sigungu_cd = pnu[:5]
    #     bjdong_cd = pnu[5:10]
    #     bun = pnu[11:15]
    #     ji = pnu[15:19]
    #     service_key = "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D"
    #
    #     api_url = (f"https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo"
    #                f"?serviceKey={service_key}&sigunguCd={sigungu_cd}"
    #                f"&bjdongCd={bjdong_cd}&bun={bun}&ji={ji}&_type=json&numOfRows=1&pageNo=1")
    #
    #     response = requests.get(api_url)
    #
    #     if response.status_code == 200:
    #         return response.json()
    #     else:
    #         return None
    #
    # @staticmethod
    # async def get_naver_info(number: str):
    #     # URL of the Naver API endpoint
    #     naver_url = f"https://new.land.naver.com/api/articles/{number}"
    #     try:
    #         # Use aiohttp for asynchronous HTTP requests
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(naver_url, headers=headers) as response:
    #                 # Check if the response is successful
    #                 if response.status == 200:
    #                     data = await response.json()  # Read the JSON data asynchronously
    #                 else:
    #                     print(f"Failed to fetch data from Naver. Status code: {response.status}")
    #         return data
    #
    #     except Exception as e:
    #         print(f"An error occurred: {str(e)}")
    #
    #
    # @staticmethod
    # async def get_naver_map(lng, lat):
    #     client_id = "aqknd5ytgc"
    #     client_secret = "c6yzSzNsxyR7fsce5b2y3YwIfKmNybDIYFNeqB12"
    #     url = f"https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords={lat},{lng}&orders=legalcode,admcode,addr,roadaddr&output=xml"
    #     headers = {
    #         "X-NCP-APIGW-API-KEY-ID": client_id,
    #         "X-NCP-APIGW-API-KEY": client_secret,
    #     }
    #
    #     try:
    #         # Use aiohttp for asynchronous HTTP requests
    #         async with aiohttp.ClientSession() as session:
    #             async with session.get(url, headers=headers) as response:
    #                 # Check if the response is successful
    #                 if response.status == 200:
    #                     xml_data = await response.text()  # Read the JSON data asynchronously
    #                     data = extract_address_and_number_correctly(xml_data)
    #                 else:
    #                     print(f"Failed to fetch data from Naver. Status code: {response.status}")
    #         return data
    #
    #     except Exception as e:
    #         print(f"An error occurred: {str(e)}")


