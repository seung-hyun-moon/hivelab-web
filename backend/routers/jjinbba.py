import asyncio
import aiohttp
import xml.etree.ElementTree as ET
import html
import zipfile
from io import BytesIO
import tempfile
import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session
from starlette.requests import Request

from backend.schemas.jjinbba import Jjinbba, JjinbbaCreate, JjinbbaUpdate, ImageRequest, AllImagesRequest
from backend.db.models import JjinbbaModel, JjinbbaChildModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD, TUpdate
from backend.utils import get_infos

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
        self.router.add_api_route('/all_down', self.download_all_images_as_zip, response_model=None, methods=['POST'])
        # 새로 추가하는 라우터: 특정 customer 값으로 조회(최근 업데이트순)
        self.router.add_api_route(
            '/by_customer/{customer}',
            self.get_items_by_customer,
            response_model=List[self.get_schema],  # 필요하다면 None 대신 적절한 스키마 지정
            methods=['GET']
        )

    def get_items_by_customer(self, customer: str, db: Session = Depends(get_db)):
        """
        특정 customer 값을 가진 레코드를 updated_at 기준으로 내림차순 정렬하여 반환
        """
        items = (
            db.query(self.model)
            .filter(self.model.customer == customer)
            .order_by(self.model.created_at)
            .all()
        )
        return items

    def patch_item(self, item_id: int, item: JjinbbaUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)

    # ──────────────────────────────────────────
    # 부모 + 자식  ▶  생성
    # ──────────────────────────────────────────
    async def create_item(self, item: JjinbbaCreate, db: Session = Depends(get_db)):
        parent = JjinbbaModel(**item.model_dump(exclude={"id"}))
        db.add(parent)
        db.commit()
        db.refresh(parent)

        try:
            crawl = await get_infos.process_properties(parent.numbers)
        except Exception as exc:
            db.delete(parent)
            db.commit()
            raise HTTPException(500, f"크롤링 실패: {exc}")

        # parent 메타 갱신
        parent.region_info = crawl["region_info"]
        db.commit()

        # children INSERT
        for c in crawl["children"]:
            child = JjinbbaChildModel(parent_id=parent.id, **{
                "number": c["number"],
                "address": c["address"],
                "building_name": c["building_name"],
                "floor": c["floor"],
                "deposit": c["deposit"],
                "rent": c["rent"],
                "management_fee": c["management_fee"],
                "rent_and_mgmt": c["rent_and_mgmt"],
                "rate": c["rate"],
                "noc": c["noc"],
                "rf": c["rf"],
                "exclusive_area": c["exclusive_area"],
                "elevator": c["elevator"],
                "parking": c["parking"],
                "heating": c["heating"],
                "restroom": c["restroom"],
                "lease_area": c["lease_area"],
                "use": c["use"],
                "usage_approval_date": c["usage_approval_date"],
                "scale": c["scale"],
                "direction": c["direction"],
                "land_area": c["land_area"],
                "building_area": c["building_area"],
                "total_area": c["total_area"],
                "main_structure": c["main_structure"],
                "building_coverage": c["building_coverage"],
                "floor_area_ratio": c["floor_area_ratio"],
                "land_price": c["land_price"],
                "feature": c["feature"],
                "note": c["note"],
                "img_urls": c["img_urls"],
                "rocation_url": c["rocation_url"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
            })
            db.add(child)

        db.commit()
        db.refresh(parent)
        return parent

    # ──────────────────────────────────────────
    # 부모 + 자식  ▶  수정
    # ──────────────────────────────────────────
    async def update_item(self, item_id: int, item: JjinbbaUpdate, db: Session = Depends(get_db)):
        parent: JjinbbaModel = db.get(JjinbbaModel, item_id)
        if not parent:
            raise HTTPException(404, "존재하지 않는 레코드")

        # 부모 필드 업데이트
        for k, v in item.model_dump(exclude_unset=True).items():
            setattr(parent, k, v)

        # 자식 전부 삭제
        db.query(JjinbbaChildModel).filter(JjinbbaChildModel.parent_id == parent.id).delete()
        db.commit()

        # 새 매물번호 크롤링
        try:
            crawl = await get_infos.process_properties(parent.numbers)
        except Exception as exc:
            raise HTTPException(500, f"크롤링 실패: {exc}")

        parent.region_info = crawl["region_info"]
        # 자식 재삽입
        for c in crawl["children"]:
            db.add(JjinbbaChildModel(parent_id=parent.id, **{
                "number": c["number"],
                "address": c["address"],
                "building_name": c["building_name"],
                "floor": c["floor"],
                "deposit": c["deposit"],
                "rent": c["rent"],
                "management_fee": c["management_fee"],
                "rent_and_mgmt": c["rent_and_mgmt"],
                "rate": c["rate"],
                "noc": c["noc"],
                "rf": c["rf"],
                "exclusive_area": c["exclusive_area"],
                "elevator": c["elevator"],
                "parking": c["parking"],
                "heating": c["heating"],
                "restroom": c["restroom"],
                "lease_area": c["lease_area"],
                "use": c["use"],
                "usage_approval_date": c["usage_approval_date"],
                "scale": c["scale"],
                "direction": c["direction"],
                "land_area": c["land_area"],
                "building_area": c["building_area"],
                "total_area": c["total_area"],
                "main_structure": c["main_structure"],
                "building_coverage": c["building_coverage"],
                "floor_area_ratio": c["floor_area_ratio"],
                "land_price": c["land_price"],
                "feature": c["feature"],
                "note": c["note"],
                "img_urls": c["img_urls"],
                "rocation_url": c["rocation_url"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
            }))

        db.commit()
        db.refresh(parent)
        return parent



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
                        async with session.get(url) as response:
                            if response.status == 200:
                                image_data = await response.read()
                                file_name = "위치정보.jpg" if idx == len(image_urls) - 1 else f"image_{idx}.jpg"
                                zip_file.writestr(file_name, image_data)  # 이미지 데이터를 직접 zip 파일에 저장
                            else:
                                print(f"Failed to fetch image from {url}. Status code: {response.status}")
                    except Exception as e:
                        print(f"Error downloading {url}: {e}")

        # 버퍼를 처음 위치로 되돌리고 스트리밍 응답으로 반환
        zip_buffer.seek(0)

        zip_filename = f"{zip_name}.zip"
        encoded_zip_filename = urllib.parse.quote(zip_filename)
        return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_zip_filename}"})

    async def download_all_images_as_zip(self, request: AllImagesRequest, background_tasks: BackgroundTasks):
        zip_name = request.zip_name
        properties = request.properties

        # 임시 파일 생성 (삭제되지 않도록 delete=False)
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        zip_path = temp_zip.name
        temp_zip.close()  # zipfile 모듈이 해당 파일을 열 수 있도록 닫아줌

        # 폴더명 중복 처리를 위한 딕셔너리
        folder_name_counts = {}

        # 임시 파일에 ZIP 파일 생성
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            async with aiohttp.ClientSession() as session:
                for prop in properties:
                    original_folder = prop.zip_name  # 원래 폴더명
                    # 중복된 폴더명 처리: 이미 존재하면 (1), (2) 등 붙임
                    if original_folder in folder_name_counts:
                        folder_name_counts[original_folder] += 1
                        folder = f"{original_folder} ({folder_name_counts[original_folder]})"
                    else:
                        folder_name_counts[original_folder] = 0
                        folder = original_folder

                    image_urls = prop.image_urls
                    for idx, url in enumerate(image_urls):
                        try:
                            async with session.get(url) as response:
                                if response.status == 200:
                                    image_data = await response.read()
                                    # 마지막 이미지면 "위치정보.jpg", 아니면 "image_{idx}.jpg"
                                    file_name = "위치정보.jpg" if idx == len(image_urls) - 1 else f"image_{idx}.jpg"
                                    # 폴더 내부에 파일 저장 (경로 형식)
                                    file_path = f"{folder}/{file_name}"
                                    zip_file.writestr(file_path, image_data)
                                else:
                                    print(f"Failed to fetch image from {url}. Status code: {response.status}")
                        except Exception as e:
                            print(f"Error downloading {url}: {e}")

        # 응답 전송 후 임시 파일을 삭제하도록 백그라운드 작업에 등록
        background_tasks.add_task(os.remove, zip_path)

        zip_filename = f"{zip_name}.zip"
        encoded_zip_filename = urllib.parse.quote(zip_filename)
        return FileResponse(
            path=zip_path,
            filename=zip_filename,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_zip_filename}"
            }
        )
