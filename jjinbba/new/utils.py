import os
import logging
import sys
import re
import requests

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import xml.etree.ElementTree as ET


# 로그

# 첫 번째 로그 파일 설정
log_file1 = 'D:/jjinbba.log'
if not os.path.isfile(log_file1):
    open(log_file1, 'w').close()

logger1 = logging.getLogger('Logger1')
logger1.setLevel(logging.ERROR)

handler1 = logging.FileHandler(log_file1)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')
handler1.setFormatter(formatter)

logger1.addHandler(handler1)

# 두 번째 로그 파일 설정
log_file2 = 'D:/jjinbba_inputs.log'
if not os.path.isfile(log_file2):
    open(log_file2, 'w').close()

logger2 = logging.getLogger('Logger2')
logger2.setLevel(logging.ERROR)

handler2 = logging.FileHandler(log_file2)
formatter = logging.Formatter('%(asctime)s\n%(message)s', datefmt='%Y-%m-%d %H:%M')
handler2.setFormatter(formatter)

logger2.addHandler(handler2)


# CSS 가져오기

def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath("..")
    return os.path.join(base_path, relative_path)


def load_css(css_file_path):
    with open(css_file_path, 'r', encoding='utf-8') as css_file:
        return css_file.read()


# 네이버지도 API로 주소 가져오기

def extract_address_and_number_correctly(xml_data):
    try:
        # XML 파싱
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
        logging.exception(f"An error occurred: {e}")
        return f"예외 발생: {str(e)}"


def extract_lat_lng(url):
    pattern = r'pos:([0-9.]+)%20([0-9.]+)'
    match = re.search(pattern, url)
    if match:
        return match.group(1), match.group(2)
    else:
        return None, None


def download_image(url, path):
    try:
        response = requests.get(url)
        with open(path, 'wb') as file:
            file.write(response.content)
    except requests.RequestException as e:
        print(f"이미지 다운로드 에러 {url}: {e}")


def get_naver_api(lng, lat):
    client_id = "aqknd5ytgc"
    client_secret = "c6yzSzNsxyR7fsce5b2y3YwIfKmNybDIYFNeqB12"
    url = f"https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords={lng},{lat}&orders=legalcode,admcode,addr,roadaddr&output=xml"
    headers = {
        "X-NCP-APIGW-API-KEY-ID": client_id,
        "X-NCP-APIGW-API-KEY": client_secret,
    }

    # API 요청
    response = requests.get(url, headers=headers)

    # 응답 결과 확인
    if response.status_code == 200:
        return extract_address_and_number_correctly(response.text)
    else:
        print("에러 코드:", response.status_code)


# XPATH로 정보 가져오기
def get_xpath_element(xpath: str, driver: webdriver.Chrome, timeout=3):
    try:
        opened_session = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, xpath)))
        if opened_session:
            element = driver.find_element(By.XPATH, xpath)
            return element
        else:
            logging.exception(f"get_xpath_element session Timeout: {xpath}")
            print("get_xpath_string error", xpath)
            return None
    except Exception as e:
        logging.exception(f"get_xpath_element Exception Timeout: {xpath}")
        print("get_xpath_string error", xpath, e)
        return None


def get_matching_td_content(table_element, target_th_text):
    try:
        th_elements = table_element.find_elements(By.XPATH, './/th')
        for th in th_elements:
            if th.text == target_th_text:
                # Get the following td element
                td = th.find_element(By.XPATH, 'following-sibling::td')
                return td.text
    except Exception as e:
        logging.exception(f"get_matching_td_content Exception: {target_th_text}")
        print("Error", target_th_text, e)
        return None
    return None


def convert_korean_number(input_string):
    try:
        # 숫자 단위 사전
        units = {'억': 10000}

        # 쉼표 제거
        input_string = input_string.replace(',', '')

        # 정규식을 사용하여 숫자와 단위 분리
        numbers = re.findall(r'(\d+)(억)?', input_string)

        result = 0

        for num, unit in numbers:
            num = int(num)  # 문자열을 정수로 변환
            if unit:  # '억' 단위가 있으면
                num *= units[unit]  # 단위 적용하여 값 변경
            result += num

        return f"{result:,}"

    except Exception as e:
        logging.exception(f"convert_korean_number Exception: {e}")
        return "?"


def replace_button_with_img(html_string):
    pattern = r'<button class="main_photo_item"[^>]*style="background-image: url\(&quot;([^&]*)&quot;\);"[^>]*></button>'
    replacement = r'<img class="main_photo_item" src="\1" alt="사진">'
    return re.sub(pattern, replacement, html_string)