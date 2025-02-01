import asyncio
import aiohttp
import xml.etree.ElementTree as ET
import html
import zipfile
from io import BytesIO

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
from sqlalchemy.orm import Session

from backend.schemas.jjinbba import Jjinbba, JjinbbaCreate, JjinbbaUpdate, ImageRequest
from backend.db.models import JjinbbaModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD

import urllib.parse

from jjinbba.new.css_na import css_content

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


class JjinbbaRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Jjinbba, post_schema=JjinbbaCreate, put_schema=JjinbbaUpdate, model=JjinbbaModel)
        self.router.add_api_route('/info/{number}', self.get_naver_info, response_model=None, methods=['GET'])
        self.router.add_api_route('/adr/{lng}_{lat}', self.get_naver_map, response_model=None, methods=['GET'])
        self.router.add_api_route('/nif/{number}', self.get_naver_iframe, response_model=None, methods=['GET'])
        self.router.add_api_route('/each_down', self.download_each_images_as_zip, response_model=None, methods=['POST'])

    def create_item(self, item: JjinbbaCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: JjinbbaUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    async def get_naver_iframe(self, number: str):
        naver_url = f"https://new.land.naver.com/offices?articleNo={number}"

        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode
        driver = webdriver.Chrome(options=chrome_options)

        try:
            driver.get(naver_url)

            # Wait for up to 5 seconds for the element to be present
            element = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="ct"]/div[2]/div[2]/div/div[2]'))
            )
            raw_html = element.get_attribute('outerHTML')
            html_content_with_css = f"<html><head><style>{css_content}</style></head><body>{raw_html}</body></html>"

            # If the element is found, return its HTML content
            return html_content_with_css

        except Exception as e:
            return f"Failed to fetch data: {str(e)}"

        finally:
            driver.quit()

    # Define the async function to make the request
    async def get_naver_info(self, number: str):
        # URL of the Naver API endpoint
        naver_url = f"https://new.land.naver.com/api/articles/{number}"
        try:
            # Use aiohttp for asynchronous HTTP requests
            async with aiohttp.ClientSession() as session:
                async with session.get(naver_url, headers=headers) as response:
                    # Check if the response is successful
                    if response.status == 200:
                        data = await response.json()  # Read the JSON data asynchronously
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

    async def download_each_images_as_zip(self, request: ImageRequest):
        # 오늘 날짜를 "YYYY.MM.DD" 형식으로 구하기
        zip_name = request.zip_name
        print(zip_name)
        image_urls = request.image_urls
        today_date = datetime.today().strftime('%Y.%m.%d')

        # 메모리에서 zip 파일을 생성할 버퍼 준비
        zip_buffer = BytesIO()

        # zip 파일을 메모리에서 생성
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            async with aiohttp.ClientSession() as session:
                for idx, url in enumerate(image_urls):
                    try:
                        # 이미지 파일 다운로드
                        async with session.get(r"https://landthumb-phinf.pstatic.net"+url) as response:
                            if response.status == 200:
                                image_data = await response.read()
                                zip_file.writestr(f"image_{idx}.jpg", image_data)  # 이미지 데이터를 직접 zip 파일에 저장
                            else:
                                print(f"Failed to fetch image from {url}. Status code: {response.status}")
                    except Exception as e:
                        print(f"Error downloading {url}: {e}")

        # 버퍼를 처음 위치로 되돌리고 스트리밍 응답으로 반환
        zip_buffer.seek(0)

        zip_filename = f"{zip_name}.zip"
        encoded_zip_filename = urllib.parse.quote(zip_filename)
        return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_zip_filename}"})