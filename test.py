import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

def download_image(url, path):
    try:
        response = requests.get(url)
        with open(path, 'wb') as file:
            file.write(response.content)
    except requests.RequestException as e:
        print(f"Error downloading image {url}: {e}")

def main(url):
    try:
        # Setup WebDriver in headless mode
        chrome_options = Options()
        chrome_options.add_argument("headless")
        chrome_options.add_argument('window-size=1920x1080')
        chrome_options.add_argument("disable-gpu")
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        # Create directory on desktop
        desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')
        folder_name = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "#pop_header > div"))).text
        save_path = os.path.join(desktop_path, folder_name)
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        # Download the background image from #map_real
        map_real_element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "#map_real")))
        bg_image_url = map_real_element.value_of_css_property('background-image').replace('url("', '').replace('")', '')
        bg_image_path = os.path.join(save_path, 'map_real_background.jpg')
        download_image(bg_image_url, bg_image_path)

        next_button_css_selector = "#content > div > div.map_section > div.map_area > div.btn_map > a.btn_next._js_btn_main_img_arrow.NPI\\=a\\:next"
        img_css_selector = "#imageDIV > img"
        image_count = 1

        while True:
            img_element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, img_css_selector)))
            img_url = img_element.get_attribute('src')
            img_path = os.path.join(save_path, f'image_{image_count}.jpg')
            download_image(img_url, img_path)
            image_count += 1

            # Check if the next button has 'off' class
            next_button = driver.find_element(By.CSS_SELECTOR, next_button_css_selector)
            if "off" in next_button.get_attribute("class"):
                break
            else:
                next_button.click()
                time.sleep(0.1)

    except (TimeoutException, NoSuchElementException, WebDriverException) as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()
        print(f"{image_count + 1} images have been saved to {save_path}")

if __name__ == "__main__":
    try:
        while True:
            url = input("Enter the URL: ")
            main(url)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
