import asyncio
import aiohttp
import xml.etree.ElementTree as ET

from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# from backend.schemas._jjinbba import Jjinbba, JjinbbaCreate, JjinbbaUpdate
# from backend.db.models import JjinbbaModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class JjinbbaRouter():
    def __init__(self):
        self.router = APIRouter()
        self.router.add_api_route('/{number}', self.get_naver_info, response_model=None, methods=['GET'])
        self.router.add_api_route('/adr/{lng}_{lat}', self.get_naver_map, response_model=None, methods=['GET'])

    # Define the async function to make the request
    async def get_naver_info(self, number: str):
        # URL of the Naver API endpoint
        naver_url = f"https://new.land.naver.com/api/articles/{number}"

        # Headers for the Naver request
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

        try:
            # Use aiohttp for asynchronous HTTP requests
            async with aiohttp.ClientSession() as session:
                async with session.get(naver_url, headers=headers) as response:
                    # Check if the response is successful
                    if response.status == 200:
                        data = await response.json()  # Read the JSON data asynchronously
                        print(data)  # Print the response data
                    else:
                        print(f"Failed to fetch data from Naver. Status code: {response.status}")
            return data

        except Exception as e:
            print(f"An error occurred: {str(e)}")

    async def get_naver_map(self, lng, lat):
        client_id = "aqknd5ytgc"
        client_secret = "c6yzSzNsxyR7fsce5b2y3YwIfKmNybDIYFNeqB12"
        url = f"https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords={lat},{lng}&orders=legalcode,admcode,addr,roadaddr&output=xml"
        headers = {
            "X-NCP-APIGW-API-KEY-ID": client_id,
            "X-NCP-APIGW-API-KEY": client_secret,
        }
        print(url)

        try:
            # Use aiohttp for asynchronous HTTP requests
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    # Check if the response is successful
                    if response.status == 200:
                        xml_data = await response.text()  # Read the JSON data asynchronously
                        data = self.extract_address_and_number_correctly(xml_data)
                    else:
                        print(f"Failed to fetch data from Naver. Status code: {response.status}")
            return data

        except Exception as e:
            print(f"An error occurred: {str(e)}")

    @staticmethod
    def extract_address_and_number_correctly(xml_data):
        try:
            # XML 파싱
            print("xml_data", xml_data)
            root = ET.fromstring(xml_data)
            print("root", root)
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