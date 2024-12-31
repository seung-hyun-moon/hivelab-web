import copy
import time

from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QLabel, QTextEdit, QGridLayout, QSizePolicy, QComboBox
from PyQt5.QtCore import QThread, pyqtSignal, pyqtSlot
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtGui import QIcon, QClipboard
from datetime import datetime
from webdriver_manager.chrome import ChromeDriverManager

from utils import *
from css_na import css_content

if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    icon_path = os.path.join(sys._MEIPASS, "favicon.ico")
else:
    icon_path = "favicon.ico"


# pyinstaller --onefile --icon="C:\Hivelab\hivelab-web\frontend\static\icon\favicon.ico" --noconsole --add-data "C:\Hivelab\hivelab-web\frontend\static\icon\favicon.ico;." "jjinbba/new/jjinbba_new_v11_bg.py"
# pyinstaller --onefile --icon="C:\Users\coolu\Desktop\Hive\hivelab-web\frontend\static\icon\favicon.ico" --noconsole "jjinbba/new/jjinbba_new_v11_bg.py"
chrome_options = Options()
chrome_options.add_argument("--headless=old")
chrome_options.add_argument("--window-size=1010,710")
chrome_options.add_argument("--window-position=-10000,-10000")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument('--log-level=3')  # 브라우저 로그 레벨을 낮춤
chrome_options.add_argument('--disable-loging')  # 로그를 남기지 않음


def main(article_number):
    info_dict = {"no": "1", "address": "", "parcel_address": ""}
    # 전체 함수 시작 시간
    start_time_total = time.time()
    image_count = 1
    folder_count = 1
    url = f"https://new.land.naver.com/offices?articleNo={article_number}"
    floor = ""
    html_content = ""
    print(url)
    # WebDriver 설정 및 URL 접속 시작 시간
    start_time_webdriver_setup = time.time()
    try:
        crawling_success = False
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        wait = WebDriverWait(driver, 3)
        driver.set_page_load_timeout(3)
        for i in range(5):
            print(f'==try count:[{i + 1}]')
            try:
                driver.get(url=url)
                # driver.set_window_position(10000, 10000)
                WebDriverWait(driver, 3).until(EC.presence_of_element_located((By.XPATH, '//*[@id="detailContents1"]/div[1]')))
                crawling_success = True
            except Exception as ex:
                logger1.exception(f"시도: {i + 1} {article_number}")
                print(f'==try count:[{i + 1}] => exception:\n{ex}')
            if crawling_success == True:
                break
            time.sleep(0.1)
        if crawling_success == False:
            logger1.exception(f"매물 번호 : {article_number} 저장 실패")
            return f"매물 번호 : {article_number} 저장 실패", html_content, info_dict

        # Create directory on desktop
        today = datetime.today().strftime("%Y.%m.%d")
        desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop', today)
        # WebDriver 설정 및 URL 접속 종료 시간 및 출력
        print(f"WebDriver 설정 및 URL 접속 시간: {time.time() - start_time_webdriver_setup}초")

        # 층 정보 가져오기 시작 시간
        start_time_floor_info = time.time()
        floor_element = get_xpath_element('//*[@id="detailContents1"]/div[1]/table/tbody/tr[4]/td', driver)
        try:
            if floor_element:
                floor = ", " + floor_element.text.split('/')[0] + "층"
        except Exception as e:
            logger1.exception(f"{article_number}, 층 정보를 가져올 수 없음! {e}")
            print(f"층 정보를 가져올 수 없음!", e)

        # 층 정보 가져오기 종료 시간 및 출력
        print(f"층 정보 가져오기 시간: {time.time() - start_time_floor_info}초")

        ### 매물 정보 html 가져오기
        element = get_xpath_element('//*[@id="ct"]/div[2]/div[2]/div/div[2]', driver)
        # //*[@id="ct"]/div[2]/div[2]/div/div[2]
        html_content = element.get_attribute('outerHTML')


        # 위쪽 정보에서 보증금, 월세 가져오기
        fee = get_xpath_element('//*[@id="ct"]/div[2]/div[2]/div/div[2]/div[2]/div[1]/div[3]/span[2]', driver)
        if not fee:
            fee = get_xpath_element('//*[@id="ct"]/div[2]/div[2]/div/div[2]/div[2]/div[1]/div[3]/span[2]', driver)
        try:
            if fee:
                deposit, rent = fee.text.split("/")
                info_dict["deposit"], info_dict["rent"] = convert_korean_number(deposit) + "만", convert_korean_number(rent) + "만"
            else:
                fee = get_xpath_element('//*[@id="ct"]/div[2]/div[2]/div/div[2]/div[1]/div[1]/div[3]/span[2]', driver)
                try:
                    if fee:
                        deposit, rent = fee.text.split("/")
                        info_dict["deposit"], info_dict["rent"] = convert_korean_number(deposit) + "만", convert_korean_number(rent) + "만"
                    else:
                        info_dict["deposit"], info_dict["rent"] = "", ""
                except Exception as e:
                    info_dict["deposit"], info_dict["rent"] = "", ""
                    logger1.exception(f"{article_number}, 보증금, 월세 정보 없는 것으로 추정: {e}")
                    print("보증금, 월세 정보 없는 것으로 추정", e)
        except Exception as e:
            info_dict["deposit"], info_dict["rent"] = "", ""
            logger1.exception(f"{article_number}, 보증금, 월세 정보 없는 것으로 추정 1차 재시도: {e}")
            print("보증금, 월세 정보 없는 것으로 추정", e)

        # 테이블에서 정보 가져오기
        table_element = get_xpath_element('//*[@id="detailContents1"]/div[1]/table', driver)

        maintenance_fee = get_matching_td_content(table_element, '월관리비')
        try:
            if maintenance_fee:
                info_dict["maintenance_fee"] = maintenance_fee[:-1]
            else:
                info_dict["maintenance_fee"] = ""
        except Exception as e:
            info_dict["maintenance_fee"] = ""
            logger1.exception(f"{article_number}, 월관리비 정보 없는 것으로 추정: {e}")
            print("월관리비 정보 없는 것으로 추정", e)

        private_area = get_matching_td_content(table_element, '계약/전용면적')
        try:
            if private_area:
                info_dict["private_area"] = str(int(float(private_area.split("/")[0][:-1]) * 0.3025 * 0.8)) + "평"
            else:
                info_dict["private_area"] = ""
        except Exception as e:
            info_dict["private_area"] = ""
            logger1.exception(f"{article_number}, 전용면적 정보 없는 것으로 추정: {e}")
            print("전용면적 정보 없는 것으로 추정", e)

        parking = get_matching_td_content(table_element, '주차가능여부')
        try:
            if parking:
                info_dict["parking"] = "1" if "가능" == parking else "0"
            else:
                info_dict["parking"] = ""
        except Exception as e:
            info_dict["parking"] = ""
            logger1.exception(f"{article_number}, 주차가능여부 정보 없는 것으로 추정: {e}")
            print("주차가능여부 정보 없는 것으로 추정", e)

        air_conditioner = get_matching_td_content(table_element, '난방(방식/연료)')
        try:
            if air_conditioner:
                info_dict["air_conditioner"] = "중앙" if "중앙" in air_conditioner else "개별"
            else:
                info_dict["air_conditioner"] = ""
        except Exception as e:
            info_dict["air_conditioner"] = ""
            logger1.exception(f"{article_number}, 난방(방식/연료) 정보 없는 것으로 추정: {e}")
            print("난방(방식/연료) 정보 없는 것으로 추정", e)

        feature = get_matching_td_content(table_element, '매물특징')
        try:
            if feature:
                info_dict["feature"] = feature
            else:
                info_dict["feature"] = ""
        except Exception as e:
            info_dict["feature"] = ""
            logger1.exception(f"{article_number}, 매물특징 정보 없는 것으로 추정: {e}")
            print("매물특징 정보 없는 것으로 추정", e)

        try:
            info_dict["elevator"] = "X" if "0" in get_xpath_element('//*[@id="detailContents1"]/div[3]/ul/li[10]/span', driver, 3).text else "O"
        except Exception as e:
            info_dict["elevator"] = "?"
            print("건축물 대장 정보 없는 것으로 추정", e, info_dict["elevator"])
            logger1.exception(f"{article_number}, 건축물 대장 정보 없는 것으로 추정: {e}")
        # 갤러리 열기 시도 시작 시간
        start_time_gallery_open = time.time()

        try:
            time.sleep(0.5)
            gallery_opened = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ct"]/div[2]/div[2]/div/div[2]/div[1]/div/button[1]')))
            time.sleep(0.5)
            if gallery_opened:
                driver.find_element(By.XPATH, '//*[@id="ct"]/div[2]/div[2]/div/div[2]/div[1]/div/button[1]').click()
                if len(driver.window_handles) == 2:
                    driver.switch_to.window(driver.window_handles[1])

                    # 갤러리 열기 시도 종료 시간 및 출력
                    print(f"갤러리 열기 시도 시간: {time.time() - start_time_gallery_open}초")

                    map_real_element = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="map_real"]')))
                    bg_image_url = map_real_element.value_of_css_property('background-image').replace('url("',
                                                                                                      '').replace('")',
                                                                                                                  '')
                    lng, lat = extract_lat_lng(bg_image_url)
                    folder_name = get_naver_api(lng, lat)

                    if folder_name is None:
                        folder_name = wait.until(
                            EC.presence_of_element_located((By.XPATH, '//*[@id="pop_header"]/div'))).text

                    info_dict["parcel_address"] = folder_name
                    folder_name += floor
                    info_dict["address"] = folder_name
                    save_path = os.path.join(desktop_path, folder_name)
                    while os.path.exists(save_path):
                        save_path = os.path.join(desktop_path, f"{folder_name} ({folder_count})")
                        folder_count += 1

                    if not os.path.exists(save_path):
                        os.makedirs(save_path)

                    bg_image_path = os.path.join(save_path, '위치정보.jpg')
                    download_image(bg_image_url, bg_image_path)

                    while True:
                        try:
                            img_element = wait.until(
                                EC.presence_of_element_located((By.XPATH, '//*[@id="imageDIV"]/img')))
                            img_url = img_element.get_attribute('src')
                            img_path = os.path.join(save_path, f'image_{image_count}.jpg')
                            download_image(img_url, img_path)
                            image_count += 1
                        except Exception as e:
                            logger1.exception(f"{article_number}, 이미지 다운로드 불가 (ex 동영상): {e}")
                            print("이미지 다운로드 불가")

                        next_button = driver.find_element(By.XPATH, '//*[@id="content"]/div/div[2]/div[2]/div[3]/a[2]')
                        if "off" in next_button.get_attribute("class"):
                            break
                        else:
                            next_button.click()
                            time.sleep(0.2)

                    print(f"전체 실행 시간: {time.time() - start_time_total}초")

                    print(f"{len(os.listdir(save_path))}개의 이미지가 {save_path}에 저장되었습니다.")
                    driver.quit()
                    return f"매물 번호 : {article_number} / {len(os.listdir(save_path))}개의 이미지 저장 성공", html_content, info_dict
                else:
                    driver.quit()
                    return f"매물 번호 : {article_number} / 0개의 이미지 저장 성공", html_content, info_dict
            else:
                driver.quit()
                return f"매물 번호 : {article_number} / 0개의 이미지 저장 성공", html_content, info_dict

        except Exception as e:
            logger1.exception(f"{article_number}, 이미지 갤러리를 열 수 없음: {e}")
            print("이미지 갤러리를 열 수 없습니다.")

    except (TimeoutException, NoSuchElementException, WebDriverException) as e:
        print(f"{article_number}, 에러 발생: {e}")
        driver.quit()
        return f"매물 번호 : {article_number} 저장 실패", html_content, info_dict


# 매물 <font id='mno' color='red'>[매물번호!]</font>. {kwargs["address"]}<br><br>
def make_template(**kwargs):
    print('-'*100)
    print(kwargs)
    print('-' * 100)
    try:
        temp_template = f"""
        매물 [매물번호!]. {kwargs["address"]}<br><br>
    
        보증금 : {kwargs["deposit"]}<br>
        임대료 : {kwargs["rent"]}<br>
        관리비 : {kwargs["maintenance_fee"]}<br>
        전용면적 : <font color='red'>{kwargs["private_area"]}</font><br><br>
    
        * 엘베 {kwargs["elevator"]}<br>
        * 주차 <font color='red'>{kwargs["parking"]}</font>대<br>
        * <font color='red'>{kwargs["air_conditioner"]}</font> 냉난방<br>
        * <font color='red'>외부 분리</font> 화장실<br>
        * <font color='red'>{kwargs["feature"]}</font>
        """
    except Exception as e:
        print(e)
        temp_template = f"""
                매물 [매물번호!]. 가져오기 실패.
                """
    return temp_template


class MainLogicThread(QThread):
    result_signal = pyqtSignal(int, str, str, str, dict)

    def __init__(self, article_numbers):
        super().__init__()
        self.article_numbers = article_numbers

    def run(self):
        for i, article_number in enumerate(self.article_numbers):
            result, html_content, info_dict = main(article_number)
            self.result_signal.emit(i, article_number, result, html_content, info_dict)


class MyApp(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()
        self.results = []  # Store the results
        self.current_index = 0  # Index of the currently displayed result


    def initUI(self):
        self.setWindowTitle('New 찐빠 v11! (25.01.01)')
        self.setWindowIcon(QIcon(icon_path))
        self.setGeometry(0, 0, 700, 600)

        self.layout = QGridLayout()
        self.setLayout(self.layout)

        self.label = QLabel('매물번호를 띄어쓰기 구분으로 입력 (추가는 +)', self)
        self.layout.addWidget(self.label, 0, 0, 1, 3)
        self.label.setFixedHeight(15)

        self.line_edit = QTextEdit(self)
        self.line_edit.setAcceptRichText(False)
        self.layout.addWidget(self.line_edit, 1, 0, 1, 3)
        self.line_edit.setFixedHeight(80)
        self.line_edit.setFixedWidth(300)

        self.submit_button = QPushButton('제출', self)
        self.submit_button.clicked.connect(self.submit)
        self.submit_button.setStyleSheet("background-color: #808080;")
        self.layout.addWidget(self.submit_button, 2, 0, 1, 3)
        self.submit_button.setFixedHeight(20)
        self.submit_button.setFixedWidth(300)

        self.log_widget = QTextEdit(self)  # Create a QTextEdit widget for logs
        self.log_widget.setReadOnly(True)  # Make the log widget read-only
        self.log_widget.setFixedWidth(300)

        self.layout.addWidget(self.log_widget, 3, 0, 1, 3)
        self.log_widget.setFixedHeight(100)

        self.template = QTextEdit(self)  # Create a QTextEdit widget for logs
        self.template.textChanged.connect(self.on_template_changed)
        self.layout.addWidget(self.template, 7, 0, 2, 3)
        self.template.setFixedWidth(300)

        self.html_display = QWebEngineView(self)
        self.layout.addWidget(self.html_display, 0, 3, 9, 2)

        # Add a label to display the current index
        self.index_label = QLabel(self)
        self.index_label.setFixedHeight(20)
        self.layout.addWidget(self.index_label, 6, 0, 1, 2)

        # 시작 인덱스 버튼
        self.start_index_button = QPushButton('→', self)
        self.start_index_button.setFixedHeight(25)
        self.start_index_button.setFixedWidth(100)
        self.layout.addWidget(self.start_index_button, 6, 2, 1, 1)
        self.start_index_button.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self.start_index_button.setStyleSheet("text-align:right;")
        self.start_index_button.clicked.connect(self.first_result)

        # 시작 인덱스 입력
        self.start_index = QTextEdit(self)
        self.start_index.setFixedHeight(25)
        self.start_index.setFixedWidth(80)
        self.layout.addWidget(self.start_index, 6, 2, 1, 1)

        # Add previous, next, and delete buttons
        self.prev_button = QPushButton('이전', self)
        self.prev_button.clicked.connect(self.prev_result)
        self.layout.addWidget(self.prev_button, 4, 0)
        self.prev_button.setFixedWidth(90)

        self.next_button = QPushButton('다음', self)
        self.next_button.clicked.connect(self.next_result)
        self.layout.addWidget(self.next_button, 4, 1)
        self.next_button.setFixedWidth(90)

        self.delete_button = QPushButton('삭제', self)
        self.delete_button.clicked.connect(self.delete_result)
        self.delete_button.setStyleSheet("color: red;")  # Make the text red
        self.layout.addWidget(self.delete_button, 4, 2)
        self.delete_button.setFixedWidth(90)

        self.copy_address_button = QPushButton('지번 복사', self)
        self.copy_address_button.setStyleSheet("background-color: #808080;")
        self.copy_address_button.clicked.connect(self.save_clipboard_address)
        self.layout.addWidget(self.copy_address_button, 5, 0)
        self.copy_address_button.setFixedWidth(90)

        self.temp_button2 = QPushButton('임시버튼', self)
        self.temp_button2.setStyleSheet("background-color: #808080;")
        self.temp_button2.clicked.connect(self.save_memo_template)
        self.layout.addWidget(self.temp_button2, 5, 1)
        self.temp_button2.setFixedWidth(90)
        self.temp_button2.setDisabled(True)

        self.temp_button3 = QPushButton('임시버튼', self)
        self.temp_button3.setStyleSheet("background-color: #808080;")
        self.layout.addWidget(self.temp_button3, 5, 2)
        self.temp_button3.setFixedWidth(90)
        self.temp_button3.setDisabled(True)

    #     self.comboBox = QComboBox(self)
    #     self.layout.addWidget(self.comboBox, 8, 0, 1, 2)
    #     self.comboBox.setFixedHeight(25)
    #
    #     self.comboBox.activated[str].connect(self.onActivated)
    #
    # def onActivated(self, text):
    #     index = text.split(".")[0]
    #     self.display_result(int(index)-1)

    def submit(self):
        # 사용자 입력을 가져옴
        self.submit_button.setDisabled(True)
        article_numbers = self.line_edit.toPlainText().split()
        logger2.error(self.line_edit.toPlainText())
        # 입력된 내용이 없을 경우
        if not article_numbers:
            self.log_widget.append("매물번호를 입력하세요.")
            return

        # '+' 기호 뒤의 요소들을 캡쳐
        plus_articles = []
        last_plus_index = None
        for i, num in enumerate(article_numbers):
            if '+' in num:
                last_plus_index = i

        # 선택된 '+' 기호 뒤의 요소들이 있는 경우만 article_numbers를 갱신
        if last_plus_index is not None:
            plus_articles = [num.replace('+', '') for num in article_numbers[last_plus_index:] if
                             '+' in num or (last_plus_index != i and num.isdigit())]
            article_numbers = plus_articles
            article_numbers = [num for num in article_numbers if num]
        else:
            self.results = []

        # 결과 확인용 출력 (실제 사용시에는 필요에 맞게 조정)
        print(article_numbers)

        QApplication.processEvents()
        self.log_widget.append(f"총 {len(article_numbers)}개의 매물 처리 시작")

        self.thread = MainLogicThread(article_numbers)
        self.thread.result_signal.connect(self.add_result)
        self.thread.finished.connect(self.on_thread_finished)
        self.thread.start()

    def on_thread_finished(self):
        self.log_widget.append(f"완료! 총 {(len(self.results))}개의 매물 처리")
        self.submit_button.setDisabled(False)

    @pyqtSlot(int, str, str, str, dict)
    def add_result(self, index, article_number, result, html_content, info_dict):
        # self.comboBox.addItem(f"{index +1}. {article_number}")
        """Display the result at the given index."""
        self.results.append((result, article_number, html_content, make_template(**info_dict), info_dict["parcel_address"]))
        print("results 1개 추가")
        self.index_label.setText(f"매물 ({self.current_index+1} / {len(self.results)})  매물번호 {article_number}")
        if index == 0:  # 이동에서 고정으로 바꿈
            self.display_result(index)

        if "저장 실패" in result:
            self.log_widget.append(f"{index + 1} 번째 매물 처리 실패 ({article_number})")
        else:
            self.log_widget.append(f"{index + 1} 번째 매물 처리 완료 ({article_number})")

    def save_clipboard_address(self):
        clipboard = QApplication.clipboard()
        if 0 <= self.current_index < len(self.results):
            clipboard.setText(self.results[self.current_index][4], QClipboard.Clipboard)


    def display_result(self, index):
        """Display the result at the given index."""
        if 0 <= index < len(self.results):
            self.current_index = index
            result, article_number, html_content, info_dict, address = self.results[index]
            html_content_with_css = f"""
            <html>
            <head>
            <style>
            {css_content}
            </style>
            </head>
            <body>
            {replace_button_with_img(html_content)}
            </body>
            </html>
            """
            print(html_content)

            self.html_display.setHtml(html_content_with_css)
            show_index = index + 1
            print(self.start_index.toPlainText())
            print(show_index)
            show_info = copy.deepcopy(info_dict)
            try:
                if self.start_index.toPlainText():
                    show_index = index + int(self.start_index.toPlainText())
                    show_info = show_info.replace("[매물번호!]", str(show_index))

                    def replace_match(match):
                        return match.group(1) + str(show_index) + match.group(3)
                    show_info = re.sub(r"(매물\s)(.*?)(\.)", replace_match, show_info)
                else:
                    show_info = show_info.replace("[매물번호!]", str(show_index))
            except Exception as e:
                print(e)
            show_info = show_info.replace("[매물번호!]", str(show_index))
            print(show_info)
            self.template.setHtml(show_info)
            self.index_label.setText(f"매물 ({index + 1} / {len(self.results)})  매물번호 {article_number}")

    def on_template_changed(self):
        current_text = self.template.toHtml()
        # 이제 current_text에는 현재 QTextEdit의 내용이 있습니다.
        # 이를 info_dict 또는 다른 곳에 저장하면 됩니다.
        if self.results and 0 <= self.current_index < len(self.results):
            current_tuple = self.results[self.current_index]
            new_tuple = current_tuple[:3] + (current_text,) + current_tuple[4:]
            self.results[self.current_index] = new_tuple

    def save_memo_template(self):
        if self.results:
            for each_result in self.results:
                result, article_number, html_content, info_dict, address = each_result
                print(html_content)
                print(info_dict)

    def prev_result(self):
        """Display the previous result."""
        if self.current_index > 0:
            self.display_result(self.current_index - 1)

    def next_result(self):
        """Display the next result."""
        if self.current_index + 1 < len(self.results):
            self.display_result(self.current_index + 1)

    def first_result(self):
        """Display the previous result."""
        if self.current_index >= 0:
            self.display_result(0)

    def delete_result(self):
        """Delete the current result."""
        if self.results:
            del self.results[self.current_index]
            # If the current index is out of range, display the last result
            if self.current_index >= len(self.results):
                self.current_index = max(0, len(self.results) - 1)
            self.display_result(self.current_index)

    def closeEvent(self, event):
        """
        This method is automatically called when the window is about to close.
        """
        event.accept()  # Accept the close event to let the window close.


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = MyApp()
    ex.show()
    sys.exit(app.exec_())
