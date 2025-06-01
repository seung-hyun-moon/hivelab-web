import re
import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import requests

#########################################
# 상수 / 공통 상수
#########################################

# 네이버 부동산 API 호출 시 필요한 헤더 (필요에 맞게 조정)
NAVER_HEADERS = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlJFQUxFU1RBVEUiLCJpYXQiOjE3MzY1NzgxMjIsImV4cCI6MTczNjU4ODkyMn0.8RIgSiPOUAKBKEbskULl5k3VLyHdXLagzr9OJzhXAs4",
    "Connection": "keep-alive",
    "Host": "new.land.naver.com",
    "Referer": "https://new.land.naver.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

# 네이버 Reverse Geocoding용
CLIENT_ID = "aqknd5ytgc"
CLIENT_SECRET = "c6yzSzNsxyR7fsce5b2y3YwIfKmNybDIYFNeqB12"
BLDRGST_KEY = 'BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D'


#########################################
# 동기 유틸 함수
#########################################

def parse_floor(floor_str: str) -> int:
    """
    예) "3층" -> 3, "B1층" -> -1
    """
    clean_str = floor_str.strip().upper()
    if clean_str.startswith("B"):
        digits = re.sub(r'[^\d]', '', clean_str)
        return -int(digits) if digits.isdigit() else -99
    digits = re.sub(r'[^\d]', '', clean_str)
    return int(digits) if digits.isdigit() else 0


def safe_get(d: dict, path: List[Any], default=None):
    """
    딕셔너리 중첩된 key를 안전하게 가져오는 헬퍼 함수.
    path에 int가 섞이면 list 인덱스로 간주.
    """
    current = d
    for p in path:
        if current is None:
            return default
        if isinstance(p, int):
            if not isinstance(current, list) or p < 0 or p >= len(current):
                return default
            current = current[p]
        else:
            if not isinstance(current, dict) or p not in current:
                return default
            current = current[p]
    return current if current is not None else default


def convert_to_korean_unit(num: float) -> str:
    """
    숫자를 만(10,000) 단위로 나누어 한국식 만단위 표기로 변환.
    예) 20000 -> '2', 35000 -> '3.5', "31.9만원" -> "31.9"
    """
    # 문자열이 입력된 경우 처리
    if isinstance(num, str):
        # 이미 "만원" 또는 "만"으로 끝나는 문자열인 경우
        if "만원" in num or "만" in num:
            # "만원" 또는 "만" 제거하고 숫자만 추출
            clean_num = re.sub(r'[^0-9\.]', '', num)
            return clean_num

    # 숫자 타입 처리 (기존 로직)
    if not isinstance(num, (int, float)) or num < 0:
        return "0"
    man_value = num / 10000
    man_str = f"{man_value}"
    # 소수점 제거 (ex: 2.0 -> 2, 3.5 -> 3.5)
    s = man_str.rstrip('0').rstrip('.') if '.' in man_str else man_str
    return s



def format_number(value_str: str) -> str:
    """
    문자열에서 '억', '만' 등을 추출해 전부 '만' 단위로 합산 후, 콤마 붙여 리턴.
    예) "2억 3500" -> "23,500" (만 단위)
        "1억 2천만" -> "12,000"
    """
    if not value_str:
        return "0"

    remaining = value_str
    result = 0

    # 억 처리
    eok_match = re.search(r'([\d,\.]+)\s*억', remaining)
    if eok_match:
        eok_value = float(eok_match.group(1).replace(',', ''))
        result += eok_value * 10000
        remaining = remaining.replace(eok_match.group(0), '')

    # 만 처리
    man_match = re.search(r'([\d,\.]+)\s*만', remaining)
    if man_match:
        man_value = float(man_match.group(1).replace(',', ''))
        result += man_value
        remaining = remaining.replace(man_match.group(0), '')

    # 남은 숫자
    plain_num_str = re.sub(r'[^\d\.]', '', remaining)
    if plain_num_str:
        try:
            result += float(plain_num_str)
        except ValueError:
            pass

    return f"{int(result):,}"


def format_korea_date(yyyymmdd: str) -> str:
    """
    YYYYMMDD -> "YYYY년 M월 D일"
    예) "20230317" -> "2023년 3월 17일"
    """
    if not yyyymmdd or len(yyyymmdd) != 8:
        return ""
    year = yyyymmdd[:4]
    month = int(yyyymmdd[4:6])
    day = int(yyyymmdd[6:8])
    return f"{year}년 {month}월 {day}일"


#########################################
# 비동기 HTTP 통신 함수 (네이버 API 직접 호출)
#########################################

def fetch_json(
        url: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None
) -> Optional[dict]:
    """
    requests를 사용한 동기 GET 요청 후 JSON 응답을 파싱하여 반환.
    """
    if params is None:
        params = {}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[fetch_json] 예외 발생: {e} (URL={url})")
        return None

def fetch_text(
        url: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None
) -> Optional[str]:
    """
    requests를 사용한 동기 GET 요청 후 일반 텍스트(예: XML) 응답을 반환.
    """
    if params is None:
        params = {}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.text
    except Exception as e:
        print(f"[fetch_text] 예외 발생: {e} (URL={url})")
    return None


async def get_naver_article_info(
        session: aiohttp.ClientSession,
        number: int
) -> Optional[dict]:
    """
    네이버 부동산 상세 API를 직접 호출하여 매물 정보 가져오기
    (ex: https://new.land.naver.com/api/articles/2518851595)
    """
    naver_url = f"https://new.land.naver.com/api/articles/{number}"
    data = fetch_json(naver_url, headers=NAVER_HEADERS)
    return data


async def get_naver_reverse_geocode(
        lat: float,
        lng: float
) -> str:
    client_id = CLIENT_ID
    client_secret = CLIENT_SECRET
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
        return f"예외 발생: {str(e)}"


#########################################
# 기존 데이터 매핑/가공 로직 수정:
# get_building_data, get_address → 네이버 직접 호출 사용
#########################################

async def get_building_data(session: aiohttp.ClientSession, number: int) -> Optional[dict]:
    """
    (수정본)
    로컬 API를 부르지 않고, 네이버 부동산 API를 직접 호출해서
    건물 상세정보를 가져오도록 변경.
    """
    data = await get_naver_article_info(session, number)
    return data


async def get_address(session: aiohttp.ClientSession,
                      building_data: dict,
                      building_reg: Optional[dict]) -> str:
    # ① 건축물대장 platPlc
    reg_addr = safe_get(building_reg,
                        ['response', 'body', 'items', 'item', 0, 'platPlc'])
    if reg_addr:
        return reg_addr.strip()

    # ② 역지오코딩
    lng = safe_get(building_data, ['articleDetail', 'longitude'])
    lat = safe_get(building_data, ['articleDetail', 'latitude'])
    if lng and lat:
        addr = await get_naver_reverse_geocode(float(lat), float(lng))
        if addr and not addr.startswith(("주소를 찾을 수", "XML 파싱")):
            return addr.strip()

    # ③ 노출주소
    return safe_get(building_data, ['articleDetail', 'exposureAddress'], "")

#########################################
# 건축물대장 API 호출 함수 수정 - JS와 동일한 방식으로
#########################################

async def fetch_building_register(
        session: aiohttp.ClientSession,
        pnu: str
) -> Optional[dict]:
    """getBrTitleInfo (총괄표제부) – 건축면적·연면적 등"""
    if not pnu or len(pnu) != 19:
        return None

    sigungu, bjdong, bun, ji = pnu[:5], pnu[5:10], pnu[11:15], pnu[15:19]

    # JS코드와 동일하게 URL 구성
    url = (
        "http://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo"
        f"?serviceKey={BLDRGST_KEY}"
        f"&sigunguCd={sigungu}&bjdongCd={bjdong}&bun={bun}&ji={ji}"
        "&_type=json&numOfRows=1&pageNo=1"
    )

    # 딜레이
    await asyncio.sleep(1)

    return fetch_json(url)


async def fetch_floor_outline(
        session: aiohttp.ClientSession,
        pnu: str
) -> list[dict]:
    """getBrFlrOulnInfo (층별 개요) – 층별 etcPurps 반환"""
    if not pnu or len(pnu) != 19:
        return []

    sigungu, bjdong, bun, ji = pnu[:5], pnu[5:10], pnu[11:15], pnu[15:19]

    # JS코드와 동일한 URL 구성 방식 적용
    url = (
        "http://apis.data.go.kr/1613000/BldRgstHubService/getBrFlrOulnInfo"
        f"?serviceKey={BLDRGST_KEY}"
        f"&sigunguCd={sigungu}&bjdongCd={bjdong}&bun={bun}&ji={ji}"
        "&_type=json&numOfRows=100&pageNo=1"
    )

    await asyncio.sleep(1)  # 딜레이

    data = fetch_json(url)

    # JS와 동일하게 아이템 추출 로직 적용
    items = safe_get(data, ['response', 'body', 'items', 'item'], [])

    # 단일 항목인 경우 리스트로 변환 (JS 호환성)
    if items and not isinstance(items, list):
        items = [items]

    return items


async def get_use_info(session: aiohttp.ClientSession, building_data: dict, floor: str) -> str:
    """
    건물의 특정 층 용도 정보를 가져옵니다.
    JS와 동일한 방식으로 층별 용도 정보를 가져오도록 개선
    """
    pnu = safe_get(building_data, ['articleDetail', 'pnu'])

    if not pnu or len(pnu) != 19:
        # PNU가 없으면 네이버 데이터에서 추출 (기존 로직 유지)
        main_purpose = safe_get(building_data, ['articleBuildingRegister', 'mainPurpsCdNm'], "")
        law_usage = safe_get(building_data, ['articleDetail', 'lawUsage'], "")

        # 둘 중 하나라도 있으면 반환
        if main_purpose and law_usage:
            return f"{main_purpose}, {law_usage}"
        elif main_purpose:
            return main_purpose
        elif law_usage:
            return law_usage
        return ""

    # PNU가 있으면 층별개요 API 호출
    items = await fetch_floor_outline(session, pnu)

    # 해당 층에 대한 etcPurps 필터링 (JS 코드처럼)
    matching_items = []
    floor_num = re.sub(r'[^\d-]', '', floor)  # 숫자만 추출 (음수 포함)

    if floor_num:
        for item in items:
            item_floor = str(item.get('flrNo', ''))
            if item_floor == floor_num and item.get('etcPurps'):
                matching_items.append(item.get('etcPurps'))

    # 추출된 용도들을 쉼표로 결합
    floor_usage = ", ".join(matching_items)

    # 층별 용도가 없으면 일반 용도 정보 사용 (fallback)
    if not floor_usage:
        main_purpose = safe_get(building_data, ['articleBuildingRegister', 'mainPurpsCdNm'], "")
        law_usage = safe_get(building_data, ['articleDetail', 'lawUsage'], "")

        if main_purpose and law_usage:
            return f"{main_purpose}, {law_usage}"
        elif main_purpose:
            return main_purpose
        elif law_usage:
            return law_usage

    return floor_usage


#########################################
# 이후 로직은 기존과 동일
#########################################

def populate_form_fields(
    building_data: dict,
    building_reg: Optional[dict],
    address: str
) -> Dict[str, str]:
    """
    네이버 부동산 API 응답 + 건축물대장(getBrTitleInfo) 응답을
    하나로 합쳐서 폼에 채울 field 딕셔너리 생성.
    """

    # ─────────────────────────────
    # 1. 건축물대장(총괄표제부) 값
    # ─────────────────────────────

    breg_item    = safe_get(building_reg, ['response', 'body', 'items', 'item', 0], {})
    bld_nm       = breg_item.get('bldNm', '').strip()
    ugrnd_cnt    = breg_item.get('ugrndFlrCnt', '')
    grnd_cnt     = breg_item.get('grndFlrCnt', '')
    plat_area    = breg_item.get('platArea', 0)        # 대지면적(㎡)
    arch_area    = breg_item.get('archArea', 0)        # 건축면적(㎡)
    tot_area     = breg_item.get('totArea', 0)         # 연면적(㎡)
    use_apr_day  = breg_item.get('useAprDay', '')      # 사용승인일(YYYYMMDD)
    vl_rat       = breg_item.get('vlRat', '')          # 용적률
    bc_rat       = breg_item.get('bcRat', '')          # 건폐율
    etc_strct    = breg_item.get('etcStrct', '')       # 주구조
    ride_elv_cnt = breg_item.get('rideUseElvtCnt', 0) or 0
    emg_elv_cnt  = breg_item.get('emgenUseElvtCnt', 0) or 0

    # ─────────────────────────────
    # 2. 네이버 매물(article*) 값
    # ─────────────────────────────
    warrant_prc  = safe_get(building_data, ['articleAddition', 'dealOrWarrantPrc'], "")
    rent_prc     = safe_get(building_data, ['articleAddition', 'rentPrc'], "")
    mgmt_cost    = safe_get(building_data, ['articleDetail', 'monthlyManagementCost'], 0)
    supply_space = safe_get(building_data, ['articleSpace', 'supplySpace'], 0)      # 공급면적(㎡)
    exclusive_space = safe_get(building_data, ['articleSpace', 'exclusiveSpace'], 0)  # 전용면적(㎡)
    floor_info   = safe_get(building_data, ['articleAddition', 'floorInfo'], "")
    direction    = safe_get(building_data, ['articleAddition', 'direction'], "")
    feature      = safe_get(building_data, ['articleAddition', 'articleFeatureDesc'], "")
    parking_yn   = safe_get(building_data, ['articleDetail', 'parkingPossibleYN'], "")
    heating_mtd  = safe_get(building_data, ['articleFacility', 'heatMethodTypeName'], "")
    lat          = safe_get(building_data, ['articleDetail', 'latitude'], "")
    lng          = safe_get(building_data, ['articleDetail', 'longitude'], "")

    # ─────────────────────────────
    # 3. 공통 가공
    # ─────────────────────────────
    # 3-1. 주소 전처리 : "서울특별시 …구 " 제거, "번지" 제거
    final_address = address
    final_address = re.sub(r'^서울특별시.*?구\s', '', final_address)
    final_address = final_address.replace("번지", "")

    # 3-2. 층
    floor_only = (floor_info.split("/")[0] + "층") if floor_info else ""

    # 3-3. 금액
    deposit_str = format_number(warrant_prc) + "만"
    rent_str = format_number(rent_prc) + "만"
    mgmt_str = convert_to_korean_unit(mgmt_cost) + "만"

    # 소수점을 유지하여 float로 변환
    rent_value = float(format_number(rent_prc).replace(",", "") or 0)
    mgmt_value = float(convert_to_korean_unit(mgmt_cost).replace(",", "") or 0)

    # 소수점 한 자리까지 표시하고, 소수점이 .0인 경우 정수로 표시
    sum_value = rent_value + mgmt_value
    if sum_value == int(sum_value):
        rent_plus_mgmt = f"{int(sum_value):,}만"
    else:
        rent_plus_mgmt = f"{sum_value:,.1f}만"

    # 3-4. 면적(㎡ → 평, 1평≈0.3025㎡)
    supply_area_py   = f"{supply_space * 0.3025:.1f}평" if supply_space else ""
    exclusive_area_py = f"{supply_space * 0.3025 * 0.8:.1f}평" if supply_space else ""

    land_area_py     = f"{plat_area * 0.3025:.1f}평" if plat_area else ""
    building_area_py = f"{arch_area * 0.3025:.1f}평" if arch_area else ""
    total_area_py    = f"{tot_area * 0.3025:.1f}평" if tot_area else ""
    # 3-5. 냉난방·주차
    heating_type = "중앙" if "중앙" in (heating_mtd or "") else "개별"
    parking_cnt  = "1대" if parking_yn == "Y" else "0대"

    # 3-6. 사용승인일 포맷팅
    use_apr_fmt = format_korea_date(use_apr_day) if use_apr_day and len(use_apr_day) == 8 else ""

    # ─────────────────────────────
    # 4. 반환 딕셔너리
    # ─────────────────────────────
    return {
        # 기본 정보
        "주소": final_address,
        "건물명": bld_nm,
        "층": floor_only,

        # 금액
        "보증금": deposit_str,
        "임대료": rent_str,
        "관리비": mgmt_str,
        "임+관": rent_plus_mgmt,
        "NOC": "",
        "이율(%)": "",
        "RF(개월)": "",

        # 면적
        "임대면적": supply_area_py,
        "전용면적": exclusive_area_py,

        # 용도 – 나중에 get_use_info() 결과로 덮어씀
        "용도": "",

        # 시설
        "엘베": f"{ride_elv_cnt + emg_elv_cnt}대",
        "주차": parking_cnt,
        "냉난방": heating_type,
        "화장실": "외부 분리",

        # 추가 설명
        "방향": direction,
        "특징": feature,

        # 건축물대장 기반
        "사용승인일": use_apr_fmt,
        "대지면적": land_area_py,
        "건축면적": building_area_py,
        "연면적": total_area_py,
        "규모": f"지{ugrnd_cnt}층 / {grnd_cnt}층" if ugrnd_cnt and grnd_cnt else "",
        "주구조": etc_strct,
        "건폐율": f"{bc_rat}%" if bc_rat else "",
        "용적률": f"{vl_rat}%" if vl_rat else "",

        # 메타
        "개별공시지가": "",
        "특이사항": "",
        "위도": lat,
        "경도": lng,
    }



def build_image_urls(building_data: dict) -> List[str]:
    """
    articlePhotos 의 imageSrc 경로를 https://landthumb-phinf.pstatic.net … 로 완전한 URL 로 만든다.
    """
    base = "https://landthumb-phinf.pstatic.net"
    photos = safe_get(building_data, ['articlePhotos'], [])
    return [f"{base}{p['imageSrc']}" for p in photos if p.get('imageSrc')]


async def get_building_register(session: aiohttp.ClientSession, pnu: str) -> Optional[dict]:
    """BldRgstHubService getBrTitleInfo 래퍼 – JS getBuildingReg()와 동일"""
    return await fetch_building_register(session, pnu)

async def fetch_property_info(session: aiohttp.ClientSession, number: int) -> Dict[str, Any]:
    b_data = await get_building_data(session, number)
    if not b_data:
        return {"number": number, "address": "", "fields": {}}

    # 🔸 PNU → 건축물대장
    pnu = safe_get(b_data, ['articleDetail', 'pnu'])
    b_reg = await get_building_register(session, pnu) if pnu and len(pnu)==19 else None

    address_val = await get_address(session, b_data, b_reg)

    floor = safe_get(b_data, ['articleAddition', 'floorInfo'], "").split("/")[0]
    use_info = await get_use_info(session, b_data, floor)

    form_fields = populate_form_fields(b_data, b_reg, address_val)
    form_fields["용도"] = use_info
    img_urls = build_image_urls(b_data)
    위도 = form_fields["위도"]
    경도 = form_fields["경도"]
    rocation_url = f"https://simg.pstatic.net/static.map/v2/map/staticmap.bin?crs=EPSG:4326&markers=type:d|size:mid|pos:{경도}%20{위도}|viewSizeRatio:0.7|color:black&scale=1&caller=mw_land&format=jpg&w=1006&h=493"
    return {
        "number": number,
        "address": form_fields["주소"],
        "fields": form_fields,
        "img_urls": img_urls,
        "rocation_url": rocation_url,
    }


async def process_properties(numbers_arr: List[int]) -> Dict[str, Any]:
    """
    기존 로직과 동일하게, 주소별 그룹화 후 층 정렬 등 처리
    """
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_property_info(session, num) for num in numbers_arr]
        results = await asyncio.gather(*tasks)

    # 주소별 그룹화
    grouped = {}
    for r in results:
        addr = r.get("address", "")
        grouped.setdefault(addr, []).append(r)

    # 그룹 내에서 층 순으로 정렬
    sorted_results = []
    for addr, items in grouped.items():
        items.sort(key=lambda x: parse_floor(x["fields"].get("층", "")))
        sorted_results.extend(items)

    # 정렬된 매물번호 리스트
    sorted_numbers_arr = [r["number"] for r in sorted_results]

    # 동별 매물 개수 카운트 예시
    dong_counts = {}
    for item in sorted_results:
        addr = item.get("address", "")
        addr_cleaned = re.sub(r'^.*?구\s*', '', addr)  # '...구 ' 제거
        match = re.search(r'([가-힣]+동(?:\d가)?)', addr_cleaned)
        if match:
            dong = match.group(1)
            dong_counts[dong] = dong_counts.get(dong, 0) + 1

    region_info = ", ".join([f"{dong} {count}개" for dong, count in dong_counts.items()])

    children_data = []
    for r in sorted_results:
        f = r["fields"]
        child_dict = {
            "number": r["number"],
            "address": f.get("주소", ""),
            "building_name": f.get("건물명", ""),
            "floor": f.get("층", ""),
            "deposit": f.get("보증금", ""),
            "rent": f.get("임대료", ""),
            "management_fee": f.get("관리비", ""),
            "rent_and_mgmt": f.get("임+관", ""),
            "rate": "",
            "noc": "",
            "rf": "",
            "exclusive_area": f.get("전용면적", ""),
            "elevator": f.get("엘베", ""),
            "parking": f.get("주차", ""),
            "heating": f.get("냉난방", ""),
            "restroom": f.get("화장실", ""),
            "lease_area": f.get("임대면적", ""),
            "use": f.get("용도", ""),
            "usage_approval_date": f.get("사용승인일", ""),
            "scale": f.get("규모", ""),
            "direction": f.get("방향", ""),
            "land_area": f.get("대지면적", ""),
            "building_area": f.get("건축면적", ""),
            "total_area": f.get("연면적", ""),
            "main_structure": f.get("주구조", ""),
            "building_coverage": f.get("건폐율", ""),
            "floor_area_ratio": f.get("용적률", ""),
            "land_price": "",
            "feature": f.get("특징", ""),
            "note": "",
            "template": "",
            "img_urls": r.get("img_urls", []),
            "rocation_url": r.get("rocation_url", ""),
            "latitude": f.get("위도", ""),
            "longitude": f.get("경도", ""),
        }
        children_data.append(child_dict)

    return {
        "sortedNumbersArr": sorted_numbers_arr,
        "region_info": region_info,
        "children": children_data,
    }


#########################################
# 사용 예시
#########################################
if __name__ == "__main__":
    async def main():
        numbers = [2518870844]  # 예시 매물번호
        result = await process_properties(numbers)
        print("정렬된 매물번호 목록:", result["sortedNumbersArr"])
        print("동별 매물 개수:", result["region_info"])
        for child in result["children"]:
            print(child)


    asyncio.run(main())