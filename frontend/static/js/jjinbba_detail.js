let currentCheckboxes = {};
let propertyList = [];
let first_number = 1;

/**
 * 공통 Fetch → JSON 호출 함수
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            console.error(`Fetch error from: ${url}, status: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetch exception from: ${url}`, error);
        return null;
    }
}

// 체크박스 업데이트 리스너 설정
async function setupCheckboxUpdater(jjinbbaId) {
    // id가 "id_checkbox_"로 시작하는 모든 체크박스를 선택
    document.querySelectorAll("input[type=checkbox][id^='id_checkbox_']").forEach(checkbox => {
        checkbox.addEventListener("change", async function() {
            // id에서 체크박스 항목 이름 추출 (예: "id_checkbox_주소" → "주소")
            const key = this.id.replace("id_checkbox_", "");
            const value = this.checked;
            // 변경된 항목만 local 딕셔너리에 반영
            currentCheckboxes[key] = value;
            try {
                const response = await fetch(`/api/jjinbba/${jjinbbaId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        // checkboxes 필드의 해당 항목만 업데이트
                        checkboxes: currentCheckboxes,
                        updated_at: formatDate(),
                        first_number: first_number,
                        id: jjinbba_id
                    })
                });
                if (response.ok) {
                    console.log(`체크박스 [${key}] 업데이트 성공: ${value}`);
                    // 템플릿 갱신 - 체크박스 변경 시 템플릿 갱신
                    generateAndUpdateTemplates();
                } else {
                    console.error(`체크박스 [${key}] 업데이트 실패, 상태코드: ${response.status}`);
                }
            } catch (error) {
                console.error(`체크박스 [${key}] 업데이트 중 예외 발생:`, error);
            }
        });
    });
}

// 체크박스 정보 가져오기
async function getCheckBoxesData(jjinbba_id) {
    const url = `/api/jjinbba/${jjinbba_id}`;
    console.log("Fetching CheckBoxes data from", url);
    return await fetchJSON(url);
}

function formatDate() {
    var date = new Date();
    var year = date.getFullYear().toString();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hour = ('0' + date.getHours()).slice(-2);
    var minute = ('0' + date.getMinutes()).slice(-2);
    var second = ('0' + date.getSeconds()).slice(-2);
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

// NOC(Net Operating Cost) 계산 함수
function calculateExcelFormula() {
    let deposit = Math.floor(document.querySelectorAll('input[name="name_edit_보증금"]')[0]?.value.replace(/[^\d]/g, ""))*10000 || 0;
    let interestRate = parseFloat(document.querySelectorAll('input[name="name_edit_이율(%)"]')[0]?.value) / 100 || 0;
    let rent = Math.floor(document.querySelectorAll('input[name="name_edit_임대료"]')[0]?.value.replace(/[^\d]/g, ""))*10000 || 0;
    let rentFree = parseInt(document.querySelectorAll('input[name="name_edit_RF(개월)"]')[0]?.value) || 0;
    let mgmtCost = Math.floor(document.querySelectorAll('input[name="name_edit_관리비"]')[0]?.value.replace(/[^\d]/g, ""))*10000 || 0;
    let areaPyeong = parseFloat(document.querySelectorAll('input[name="name_edit_전용면적"]')[0]?.value) || 0;

    try {
        // 전용면적(평)이 0이거나 NaN이면 결과가 무의미하므로 "" 반환
        if (!areaPyeong || areaPyeong === 0) {
            return "";
        }

        // (보증금*이율)/12
        const monthlyInterest = (deposit * interestRate) / 12;

        // 임대료*(1-(렌트프리/12))
        const effectiveRent = rent * (1 - rentFree / 12);

        // 월 이자 + 실월세 + 관리비
        const numerator = monthlyInterest + effectiveRent + mgmtCost;

        // 전용면적(평)으로 나눈다.
        const result = numerator / areaPyeong;

        const editInputs = document.getElementsByName(`name_edit_NOC`);
        editInputs.forEach(editInput => {
            if (!editInput) return;
            editInput.value = Math.floor(result).toLocaleString('ko-KR')+"원";
        });
    } catch (error) {
        console.error("NOC 계산 중 오류:", error);
    }
}

// 자식 데이터를 가져와서 현재 보고 있는 매물번호의 데이터 반환
async function getCurrentChildData() {
    try {
        const childrenResponse = await fetch(`/api/jjinbba_child/parent/${jjinbba_id}`);
        const children = await childrenResponse.json();
        const childInfo = children.find(child => child.number == number);

        if (!childInfo) {
            console.warn(`Child record for number=${number} not found`);
            return null;
        }

        // 자식 ID로 조회
        const response = await fetch(`/api/jjinbba_child/${childInfo.id}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Child record with id=${childInfo.id} not found`);
                return null;
            }
            throw new Error(`Failed to fetch child data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching child data:", error);
        return null;
    }
}

// 자식 데이터를 업데이트
async function updateChildData(childId, data) {
    try {
        const response = await fetch(`/api/jjinbba_child/${childId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`Failed to update child data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating child data:", error);
        return null;
    }
}

// 체크된 항목들을 바탕으로 템플릿 HTML 생성
function generateTemplate(currentIndex, field, checkboxes) {
    console.log('generateTemplate 실행', first_number, currentIndex);

    const fieldNames = [
        '주소', '건물명', '층', '보증금', '임대료', '관리비', '임+관', 'NOC', '이율(%)', 'RF(개월)',
        '임대면적', '전용면적',
        '엘베', '주차', '냉난방', '화장실',
        '용도', '사용승인일', '규모', '방향', '대지면적', '건축면적', '연면적', '주구조', '건폐율', '용적률', '개별공시지가', '특징',
        '특이사항'
    ];

    const items = fieldNames.map(name => ({
        name,
        checked: checkboxes[name] || false,
        value: field[name] || ''
    }));

    const addressItem = items.find(i => i.name === '주소' && i.checked)?.value;
    const buildingItem = items.find(i => i.name === '건물명' && i.checked)?.value;
    const floorItem = items.find(i => i.name === '층' && i.checked)?.value;

    const combineStr = [addressItem, buildingItem].filter(Boolean).join(', ') +
                      (floorItem ? (buildingItem || addressItem ? ` ${floorItem}` : floorItem) : '');

    let template = `매물 ${Number(first_number) + currentIndex - 1}. ${combineStr}<br><br>`;

    const sections = [
        ['보증금', '임대료', '관리비', '임+관', 'NOC', '이율(%)', 'RF(개월)'],
        ['임대면적', '전용면적'],
        ['엘베', '주차', '냉난방', '화장실'],
        ['용도', '사용승인일', '규모', '방향', '대지면적', '건축면적', '연면적', '주구조', '건폐율', '용적률', '개별공시지가'],
        ['특이사항']
    ];

    sections.forEach(section => {
        section.forEach(name => {
            const item = items.find(i => i.name === name && i.checked);
            if (item) {
                let itemvalue = "";
                if (item.value) {
                    itemvalue = item.value;
                }
                template += `ㆍ${item.name} : ${itemvalue}<br>`;
            }
        });
        template += "<br>";
    });

    return template;
}

// 모든 자식 데이터로부터 템플릿을 생성하고 현재 표시 중인 템플릿 업데이트
async function generateAndUpdateTemplates() {
    try {
        // 모든 자식 데이터 가져오기
        const childrenResponse = await fetch(`/api/jjinbba_child/parent/${jjinbba_id}`);
        if (!childrenResponse.ok) {
            throw new Error(`Failed to fetch children data: ${childrenResponse.statusText}`);
        }
        const children = await childrenResponse.json();

        if (!children || children.length === 0) {
            console.warn("No child data found for templates");
            return;
        }

        // 부모 데이터에서 체크박스 정보 가져오기
        const parentResponse = await fetch(`/api/jjinbba/${jjinbba_id}`);
        if (!parentResponse.ok) {
            throw new Error(`Failed to fetch parent data: ${parentResponse.statusText}`);
        }
        const parentData = await parentResponse.json();
        const checkboxes = parentData.checkboxes || {};

        // 현재 보고 있는 매물 데이터 찾기
        const currentChild = children.find(child => child.number == number);
        if (!currentChild) {
            console.warn(`Current child with number=${number} not found`);
            return;
        }

        // 자식 데이터를 템플릿에 맞는 형식으로 매핑
        const formFields = {
            '주소': currentChild.address || '',
            '건물명': currentChild.building_name || '',
            '층': currentChild.floor || '',
            '보증금': currentChild.deposit || '',
            '임대료': currentChild.rent || '',
            '관리비': currentChild.management_fee || '',
            '임+관': currentChild.rent_and_mgmt || '',
            'NOC': currentChild.noc || '',
            '이율(%)': currentChild.rate || '',
            'RF(개월)': currentChild.rf || '',
            '임대면적': currentChild.lease_area || '',
            '전용면적': currentChild.exclusive_area || '',
            '엘베': currentChild.elevator || '',
            '주차': currentChild.parking || '',
            '냉난방': currentChild.heating || '',
            '화장실': currentChild.restroom || '',
            '용도': currentChild.use || '',
            '사용승인일': currentChild.usage_approval_date || '',
            '규모': currentChild.scale || '',
            '방향': currentChild.direction || '',
            '대지면적': currentChild.land_area || '',
            '건축면적': currentChild.building_area || '',
            '연면적': currentChild.total_area || '',
            '주구조': currentChild.main_structure || '',
            '건폐율': currentChild.building_coverage || '',
            '용적률': currentChild.floor_area_ratio || '',
            '개별공시지가': currentChild.land_price || '',
            '특징': currentChild.feature || '',
            '특이사항': currentChild.note || ''
        };

        // 현재 매물의 인덱스 찾기
        const currentIndex = children.findIndex(child => child.number == number) + 1;

        // 템플릿 생성
        const template = generateTemplate(currentIndex, formFields, checkboxes);

        // 템플릿 표시
        const templateElement = document.getElementById('id_jjinbba_template');
        if (templateElement) {
            templateElement.innerHTML = template;
        }

    } catch (error) {
        console.error("Error generating templates:", error);
    }
}

// 매물 정보를 화면에 표시
function applyFormFields(child) {
    // 데이터가 없으면 빈 객체로 처리
    if (!child) {
        console.warn("No child data available to apply");
        return;
    }

    // 매핑 정의 (JjinbbaChildModel 필드 → 폼 필드 이름)
    const fieldMapping = {
        'address': '주소',
        'building_name': '건물명',
        'floor': '층',
        'deposit': '보증금',
        'rent': '임대료',
        'management_fee': '관리비',
        'rent_and_mgmt': '임+관',
        'noc': 'NOC',
        'rate': '이율(%)',
        'rf': 'RF(개월)',
        'lease_area': '임대면적',
        'exclusive_area': '전용면적',
        'elevator': '엘베',
        'parking': '주차',
        'heating': '냉난방',
        'restroom': '화장실',
        'use': '용도',
        'usage_approval_date': '사용승인일',
        'scale': '규모',
        'direction': '방향',
        'land_area': '대지면적',
        'building_area': '건축면적',
        'total_area': '연면적',
        'main_structure': '주구조',
        'building_coverage': '건폐율',
        'floor_area_ratio': '용적률',
        'land_price': '개별공시지가',
        'feature': '특징',
        'note': '특이사항'
    };

    // 각 필드별로 폼에 적용
    Object.entries(fieldMapping).forEach(([modelField, formField]) => {
        const value = child[modelField] || '';

        // 읽기 전용 필드 업데이트
        const roInputs = document.getElementsByName(`name_ro_${formField}`);
        roInputs.forEach(input => {
            if (input) input.value = value;
        });

        // 수정 가능 필드 업데이트
        const editInputs = document.getElementsByName(`name_edit_${formField}`);
        editInputs.forEach(input => {
            if (input) input.value = value;
        });
    });

    // 특징 필드가 있으면 특별 처리
    if (child.feature) {
        const featureDiv = document.getElementById('id_feature');
        if (featureDiv) {
            featureDiv.innerHTML = `<p style="color: #808080;">${child.feature}</p>`;
        }
    }
}

// 이전 브리핑한 매물 정보 가져오기
async function get_same_customer(customer_id, my_jjinbba_id) {
    try {
        const response = await fetch(`/api/jjinbba/by_customer/${customer_id}`);
        const data = await response.json();
        if (data) {
            const container = document.getElementById("id_btn_customers");
            container.innerHTML = ""; // 기존 버튼 초기화

            let count = 1;
            data.forEach(item => {
                let className = "btn btn-sm btn-secondary me-2";
                // my_jjinbba_id와 동일한 항목은 생성하지 않음
                if (item.id == my_jjinbba_id) {
                    className = "btn btn-sm btn-dark me-2";
                }

                const btn = document.createElement("button");
                btn.id = `id_btn_${item.id}`;
                btn.className = className;
                // 순차적으로 1차, 2차 ... 브리핑 텍스트와 updated_at 정보 추가
                btn.textContent = `${count}차 브리핑 : ${item.created_at}`;
                btn.addEventListener("click", () => {
                    window.location.href = `/jjinbba_list/${item.id}`;
                });
                container.appendChild(btn);
                count++;
            });
        }
    } catch (error) {
        console.error('Error Get Same Customers:', error);
    }
}

// 매물 이미지 다운로드
async function downloadPropertyImages(childData) {
    $('#loading-icon').show();

    try {
        if (!childData) {
            console.error('No property data available');
            return;
        }

        // zipName 구성 - 주소와 층 정보 사용
        const zipName = childData.floor
            ? (childData.address + ", " + childData.floor)
            : childData.address;

        // 이미지 URL 가져오기 - 저장된 img_urls 사용
        const imageUrls = childData.img_urls || [];

        // 위치 URL이 있으면 추가
        if (childData.rocation_url) {
            imageUrls.push(childData.rocation_url);
        }

        if (!imageUrls.length) {
            console.error('No image URLs available');
            return;
        }

        // ZIP 생성 요청
        const response = await fetch('/api/jjinbba/each_down', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                zip_name: zipName,
                image_urls: imageUrls
            })
        });

        if (!response.ok) {
            console.error('Failed to download zip file:', response.statusText);
            return;
        }

        // 응답 Blob → 다운로드
        const blob = await response.blob();
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `${zipName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error downloading ZIP file:', error);
    } finally {
        $('#loading-icon').hide();
    }
}

// 모든 매물 이미지 다운로드
async function downloadAllPropertyImages() {
    $('#loading-icon').show();

    try {
        // 자식 데이터 모두 가져오기
        const response = await fetch(`/api/jjinbba_child/parent/${jjinbba_id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch child data: ${response.status} - ${response.statusText}`);
        }

        const children = await response.json();
        if (!children || children.length === 0) {
            $('#loading-icon').hide();
            alert("다운로드할 매물 정보가 없습니다.");
            return;
        }

        // 오늘 날짜를 YYYY.MM.DD 형식으로 생성
        const today = new Date();
        const zipName = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;

        // 모든 매물에 대해 폴더명과 이미지 URL 수집
        const propertiesPayload = [];
        children.forEach((child, index) => {
            // 폴더명 생성 - 인덱스, 주소, 층 사용
            const folderName = child.floor
                ? `${Number(first_number) + index}. ${child.address || '주소없음'}, ${child.floor}`
                : `${Number(first_number) + index}. ${child.address || '주소없음'}`;

            // 이미지 URL 목록 구성
            let imageUrls = child.img_urls || [];
            if (child.rocation_url) {
                imageUrls.push(child.rocation_url);
            }

            if (imageUrls.length > 0) {
                propertiesPayload.push({
                    zip_name: folderName,
                    image_urls: imageUrls
                });
            }
        });

        if (propertiesPayload.length === 0) {
            $('#loading-icon').hide();
            alert("다운로드할 이미지가 없습니다.");
            return;
        }

        // 백엔드의 엔드포인트로 payload 전송
        const zipResponse = await fetch('/api/jjinbba/all_down', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                zip_name: zipName,
                properties: propertiesPayload
            })
        });

        if (!zipResponse.ok) {
            throw new Error(`Failed to download zip file: ${zipResponse.status} - ${zipResponse.statusText}`);
        }

        // 응답 Blob → 다운로드 처리
        const blob = await zipResponse.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${zipName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error downloading ZIP file:', error);
        alert(`이미지 다운로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
        $('#loading-icon').hide();
    }
}

// 필드 값 변경 시 처리 함수
async function handleFieldChange(field, value) {
    try {
        // 현재 자식 데이터 가져오기
        const childData = await getCurrentChildData();
        if (!childData) {
            console.error("No child data found for update");
            return;
        }

        // 필드명 매핑 (폼 필드 → 모델 필드)
        const fieldMapping = {
            '주소': 'address',
            '건물명': 'building_name',
            '층': 'floor',
            '보증금': 'deposit',
            '임대료': 'rent',
            '관리비': 'management_fee',
            '임+관': 'rent_and_mgmt',
            'NOC': 'noc',
            '이율(%)': 'rate',
            'RF(개월)': 'rf',
            '임대면적': 'lease_area',
            '전용면적': 'exclusive_area',
            '엘베': 'elevator',
            '주차': 'parking',
            '냉난방': 'heating',
            '화장실': 'restroom',
            '용도': 'use',
            '사용승인일': 'usage_approval_date',
            '규모': 'scale',
            '방향': 'direction',
            '대지면적': 'land_area',
            '건축면적': 'building_area',
            '연면적': 'total_area',
            '주구조': 'main_structure',
            '건폐율': 'building_coverage',
            '용적률': 'floor_area_ratio',
            '개별공시지가': 'land_price',
            '특징': 'feature',
            '특이사항': 'note'
        };

        const modelField = fieldMapping[field];
        if (!modelField) {
            console.warn(`No model field mapping for form field: ${field}`);
            return;
        }

        // 업데이트할 데이터 준비
        const updateData = {
            [modelField]: value
        };

        // NOC, 임+관 등 자동 계산 필드 추가
        if (field === '보증금' || field === '임대료' || field === '관리비' ||
            field === '이율(%)' || field === 'RF(개월)' || field === '전용면적') {
            // NOC 계산
            calculateExcelFormula();
            const nocInput = document.querySelector('input[name="name_edit_NOC"]');
            if (nocInput) {
                updateData['noc'] = nocInput.value;
            }

            // 임+관 계산
            if (field === '임대료' || field === '관리비') {
                const rentInput = document.querySelector('input[name="name_edit_임대료"]');
                const mgmtInput = document.querySelector('input[name="name_edit_관리비"]');

                if (rentInput && mgmtInput) {
                    const rentValue = parseInt(rentInput.value.replace(/[^0-9]/g, '')) || 0;
                    const mgmtValue = parseInt(mgmtInput.value.replace(/[^0-9]/g, '')) || 0;
                    updateData['rent_and_mgmt'] = `${(rentValue + mgmtValue).toLocaleString()}만`;
                }
            }
        }

        // 자식 데이터 업데이트
        await updateChildData(childData.id, updateData);

        // 템플릿 업데이트
        generateAndUpdateTemplates();

    } catch (error) {
        console.error("Error handling field change:", error);
    }
}

// 섹션 토글 함수
function toggleSection(group, btn) {
    const rows = document.querySelectorAll(`[data-group='${group}'].extra-row`);
    rows.forEach(row => row.classList.toggle('hidden'));
    btn.querySelector('svg').classList.toggle('rotate-180');
}

// 메인 진입점
document.addEventListener('DOMContentLoaded', async function() {
    console.log(number, jjinbba_id);

    // 탐색 관련 변수
    let currentIndex = 0;

    function updateNavigation() {
        document.getElementById('prevBtn').disabled = currentIndex === 0;
        document.getElementById('nextBtn').disabled = currentIndex === propertyList.length-1;
    }

    // 초기 데이터 로드
    try {
        // 부모 데이터 로드
        const response = await fetch(`/api/jjinbba/${jjinbba_id}`);
        const data = await response.json();

        first_number = data.first_number || 1;
        $('#id_number_input').val(first_number);

        propertyList = data.numbers || [];
        const region_info = data.region_info || "";

        if (number == 'None' && propertyList.length > 0) {
            number = propertyList[0];
        }

        document.getElementById('id_number').value = number;
        document.getElementById('id_region_info').value = "현재 매물번호들을 종합해봤을 때, ("+ region_info + ") 입니다.";

        // 매물 번호 버튼 생성
        const btnContainer = document.getElementById('btn_numbers');
        if (btnContainer) {
            btnContainer.innerHTML = ''; // 기존 버튼 제거

            // 각 매물 번호마다 버튼 생성
            propertyList.forEach(property => {
                const btn = document.createElement('button');
                btn.textContent = property;

                // 현재 매물 번호와 일치하면 활성화 스타일 적용
                if (Number(property) === Number(number)) {
                    btn.className = 'btn btn-primary btn-sm m-1';
                } else {
                    btn.className = 'btn btn-outline-primary btn-sm m-1';
                }

                // 좌클릭 이벤트 - 해당 매물 페이지로 이동
                btn.addEventListener('click', () => {
                    window.location.href = `/jjinbba_list/${jjinbba_id}/${property}`;
                });

                // 우클릭 이벤트 - 삭제 컨텍스트 메뉴
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();

                    // 기존 컨텍스트 메뉴 제거
                    const existingMenu = document.querySelector('.custom-context-menu');
                    if (existingMenu) {
                        existingMenu.remove();
                    }

                    // 새 컨텍스트 메뉴 생성
                    const menu = document.createElement('div');
                    menu.className = 'custom-context-menu';
                    menu.style.position = 'absolute';
                    menu.style.top = `${e.pageY}px`;
                    menu.style.left = `${e.pageX}px`;
                    menu.style.background = '#fff';
                    menu.style.border = '1px solid #ccc';
                    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
                    menu.style.zIndex = 1000;
                    menu.style.minWidth = '100px';

                    // 삭제 메뉴 아이템
                    const deleteItem = document.createElement('div');
                    deleteItem.textContent = '삭제';
                    deleteItem.style.padding = '8px 12px';
                    deleteItem.style.cursor = 'pointer';
                    deleteItem.addEventListener('mouseover', () => {
                        deleteItem.style.backgroundColor = '#f0f0f0';
                    });
                    deleteItem.addEventListener('mouseout', () => {
                        deleteItem.style.backgroundColor = '#fff';
                    });

                    // 삭제 기능 구현
                    deleteItem.addEventListener('click', async () => {
                        $('#loading-icon').show();

                        try {
                            // 현재 인덱스와 업데이트된 번호 배열 준비
                            const currentIndex = propertyList.findIndex(p => Number(p) === Number(property));
                            const updatedNumbers = propertyList.filter(p => Number(p) !== Number(property));

                            // 해당 자식 레코드 삭제
                            const childrenResponse = await fetch(`/api/jjinbba_child/parent/${jjinbba_id}`);
                            const children = await childrenResponse.json();
                            const childToDelete = children.find(child => child.number == property);

                            if (childToDelete) {
                                await fetch(`/api/jjinbba_child/${childToDelete.id}`, {
                                    method: 'DELETE'
                                });
                            }

                            // 부모 레코드의 numbers 배열 업데이트
                            const response = await fetch(`/api/jjinbba/${jjinbba_id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    numbers: updatedNumbers,
                                    updated_at: formatDate(),
                                    id: jjinbba_id
                                })
                            });

                            if (!response.ok) {
                                throw new Error('삭제 요청 실패');
                            }

                            // 삭제 후 지역 정보 분석 및 업데이트
                            const regionResponse = await fetch(`/api/jjinbba/analyze_region/${jjinbba_id}`);
                            const regionData = await regionResponse.json();

                            // 부모 정보 업데이트
                            await fetch(`/api/jjinbba/${jjinbba_id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    region_info: regionData.region_info,
                                    updated_at: formatDate()
                                })
                            });

                            // 버튼 제거 및 전역 변수 업데이트
                            btn.remove();
                            propertyList = updatedNumbers;

                            // 알림 표시
                            $('#loading-icon').hide();
                            alert(`${property} 번호가 삭제되었습니다.`);

                            // 삭제 후 페이지 이동
                            if (updatedNumbers.length > 0) {
                                let nextProperty;
                                if (currentIndex < updatedNumbers.length) {
                                    nextProperty = updatedNumbers[currentIndex];
                                } else {
                                    nextProperty = updatedNumbers[currentIndex - 1];
                                }
                                window.location.href = `/jjinbba_list/${jjinbba_id}/${nextProperty}`;
                            } else {
                                window.location.href = `/jjinbba_list`;
                            }
                        } catch (error) {
                            console.error('삭제 에러:', error);
                            alert('삭제에 실패했습니다.');
                            $('#loading-icon').hide();
                        }

                        menu.remove();
                    });

                    menu.appendChild(deleteItem);
                    document.body.appendChild(menu);

                    // 메뉴 외부 클릭 시 제거
                    const removeContextMenu = (event) => {
                        if (!menu.contains(event.target)) {
                            menu.remove();
                            document.removeEventListener('click', removeContextMenu);
                        }
                    };
                    document.addEventListener('click', removeContextMenu);
                });

                btnContainer.appendChild(btn);
            });
        }

        // 현재 매물 인덱스 설정
        currentIndex = propertyList.indexOf(Number(number));

        // 매물 번호 입력 필드 설정
        document.getElementById('id_number_input').value = Number(first_number) + currentIndex;

        // 첫 번째 매물이 아니면 번호 입력 필드 비활성화
        if (currentIndex !== 0) {
            document.getElementById('id_number_input').disabled = true;
        }

        // 이전/다음 버튼 이벤트 설정
        document.getElementById('prevBtn').addEventListener('click', () => {
            if(currentIndex > 0) {
                currentIndex = currentIndex - 1;
                window.location.href = `/jjinbba_list/${jjinbba_id}/${propertyList[currentIndex]}`;
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if(currentIndex < propertyList.length - 1) {
                currentIndex = currentIndex + 1;
                window.location.href = `/jjinbba_list/${jjinbba_id}/${propertyList[currentIndex]}`;
            }
        });

        updateNavigation();

        // 체크박스 정보 로드 및 설정
        if (data.checkboxes) {
            currentCheckboxes = data.checkboxes;
            Object.keys(currentCheckboxes).forEach(key => {
                const checkbox = document.getElementById(`id_checkbox_${key}`);
                if (checkbox) {
                    checkbox.checked = currentCheckboxes[key];
                }
            });
        }

        // 체크박스 이벤트 리스너 설정
        setupCheckboxUpdater(jjinbba_id);

        // 동일 고객 브리핑 데이터 로드
        if (data.customer) {
            get_same_customer(data.customer, jjinbba_id);
        }

        // 현재 매물의 자식 데이터 로드
        const childData = await getCurrentChildData();
        if (childData) {
            // 폼 필드에 데이터 적용
            applyFormFields(childData);

            // 특징 섹션 업데이트
            if (childData.feature) {
                const featureDiv = document.getElementById('id_feature');
                if (featureDiv) {
                    featureDiv.innerHTML = `<p style="color: #808080;">${childData.feature}</p>`;
                }
            }
            document.getElementById('id_checkbox_특징').disabled = true;

            // 지도 표시 (위치 정보가 있는 경우)
            if (childData.latitude && childData.longitude) {
                const templatesDiv = document.getElementById('id_templates');
                if (templatesDiv) {
                    // 지도 이미지 업데이트 함수
                    function updateMap() {
                        const w = templatesDiv.offsetWidth;
                        const h = templatesDiv.offsetHeight;
                        const mapUrl = `https://simg.pstatic.net/static.map/v2/map/staticmap.bin?crs=EPSG:4326&markers=type:d|size:mid|pos:${childData.longitude}%20${childData.latitude}|viewSizeRatio:0.7|color:black&scale=1&caller=mw_land&format=jpg&w=${w}&h=${h}`;
                        templatesDiv.innerHTML = `<img src="${mapUrl}" alt="Map Image" style="width: 100%; height: auto;">`;
                    }

                    // 초기 지도 업데이트
                    updateMap();

                    // 크기 변경 시 지도 업데이트
                    const resizeObserver = new ResizeObserver(() => {
                        updateMap();
                    });
                    resizeObserver.observe(templatesDiv);
                }
            }

            // 템플릿 생성 및 표시
            generateAndUpdateTemplates();
        }

        // 필드 변경 이벤트 리스너 설정 (입력값 변경 시 자식 데이터 업데이트)
        document.querySelectorAll('input[name^="name_edit_"], textarea[name^="name_edit_"]').forEach(editInput => {
            editInput.addEventListener('input', event => {
                // 필드명 추출 - name_edit_주소 → 주소
                const fieldName = event.target.name.replace('name_edit_', '');
                const fieldValue = event.target.value;

                // 필드 변경 처리
                handleFieldChange(fieldName, fieldValue);
            });

            // NOC 계산
            editInput.addEventListener('input', calculateExcelFormula);
        });

        // 매물번호 초기값 변경 이벤트
        $('#id_number_input').on('input', function() {
            const numberValue = $(this).val();

            // 입력값 유효성 검사
            if (numberValue !== '' && isNaN(parseFloat(numberValue))) {
                console.log("입력값이 숫자가 아닙니다:", numberValue);
                return;
            }

            // 번호 업데이트
            fetch(`/api/jjinbba/${jjinbba_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ first_number: numberValue })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('네트워크 응답이 올바르지 않습니다: ' + response.statusText);
                }
                return response.json();
            })
            .then(async data => {
                console.log("매물 시작번호 업데이트 성공:", data);
                // 글로벌 변수 업데이트
                first_number = numberValue;
                // 템플릿 업데이트
                generateAndUpdateTemplates();
            })
            .catch(error => {
                console.error("매물 시작번호 업데이트 실패:", error);
            });
        });

        // 네이버 정보 링크 이벤트
        document.getElementById('id_naver_info_new')?.addEventListener('click', () => {
            const url = `https://new.land.naver.com/offices?articleNo=${number}`;
            window.open(url, '_blank');
        });

        // 이미지 다운로드 이벤트
        document.getElementById('id_each_img_download')?.addEventListener('click', async function() {
            const childData = await getCurrentChildData();
            if (childData) {
                downloadPropertyImages(childData);
            } else {
                alert('매물 정보를 불러올 수 없습니다.');
            }
        });

        // 모든 이미지 다운로드 이벤트
        document.getElementById('id_all_img_download')?.addEventListener('click', async function() {
            downloadAllPropertyImages();
        });

    } catch (error) {
        console.error('Error loading property data:', error);
        alert('매물 데이터를 불러오는 중 오류가 발생했습니다.');
    }
});

// 번호 이동 기능
document.getElementById('id_move_number')?.addEventListener('click', function() {
    const inputValue = document.getElementById('id_input_number').value.trim();
    if (inputValue) {
        const newUrl = window.location.origin + "/jjinbba/" + inputValue;
        window.location.href = newUrl;
    }
});