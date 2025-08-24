/**
 * 공통 Fetch → JSON 호출 함수
 * @param {string} url
 * @returns {Promise<object|null>} 성공 시 JSON, 실패 시 null
 */
async function fetchJSON(url) {
    $('#loading-icon').show(); // 요청 시작 시 로딩 표시
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
    } finally {
        $('#loading-icon').hide(); // 성공/실패 상관없이 요청 끝나면 숨김
    }
}

/**
 * /api/jjinbba/single/{number} 에서 매물 정보 가져오기
 * @param {number|string} number
 * @returns {Promise<object|null>}
 */
async function getBuildingData(number) {
    const api_url = `/api/jjinbba/single/${number}`;
    return await fetchJSON(api_url);
}

/**
 * 건축물대장 API 데이터 가져오기 (기존 코드 유지)
 * @param {string} pnu
 * @returns {Promise<object|null>}
 */
async function getBuildingReg(pnu) {
    if (!pnu) return null;

    const sigunguCd = pnu.slice(0, 5);
    const bjdongCd  = pnu.slice(5, 10);
    const bun       = pnu.slice(11, 15);
    const ji        = pnu.slice(15, 19);
    const serviceKey = "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D";

    const apiUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&_type=json&numOfRows=1&pageNo=1`;
    return await fetchJSON(apiUrl);
}

/**
 * 주소는 API 응답에서 직접 가져옴 (기존 복잡한 로직 제거)
 */
function getAddress(buildingData) {
    return buildingData?.address || "";
}

/**
 * 숫자를 만(10000) 단위로 나누어 한국식 표기(만 단위)로 변환
 */
function convertToKoreanUnit(num) {
    if (typeof num !== 'number' || isNaN(num) || num < 0) {
        return "0";
    }
    const manValue = num / 10000;
    return manValue % 1 === 0
        ? `${manValue}`
        : manValue.toString().replace(/\.0$/, '');
}

/**
 * 문자열에서 숫자만 추출하고, 1억 이상이면 10000 단위로 나누어 표기
 */
function formatNumber(str) {
  let result = 0;
  let remaining = str;

  // "억" 단위를 먼저 처리: 앞의 숫자에 10,000을 곱합니다.
  const eokMatch = remaining.match(/([\d,\.]+)\s*억/);
  if (eokMatch) {
    // 콤마 제거 후 숫자로 변환
    const eokValue = parseFloat(eokMatch[1].replace(/,/g, ''));
    result += eokValue * 10000;
    // 처리한 부분은 문자열에서 제거합니다.
    remaining = remaining.replace(eokMatch[0], '');
  }

  // "만" 단위 처리: 앞의 숫자는 그대로 더합니다.
  const manMatch = remaining.match(/([\d,\.]+)\s*만/);
  if (manMatch) {
    const manValue = parseFloat(manMatch[1].replace(/,/g, ''));
    result += manValue;
    remaining = remaining.replace(manMatch[0], '');
  }

  // 남은 문자열에서 숫자(콤마 포함)만 추출합니다.
  const plainNumStr = remaining.replace(/[^\d,\.]/g, '');
  if (plainNumStr) {
    result += parseFloat(plainNumStr.replace(/,/g, ''));
  }

  // 항상 toLocaleString()을 사용하여 천단위 구분 쉼표를 적용합니다.
  return result.toLocaleString();
}

/**
 * YYYYMMDD → YYYY년 M월 D일
 */
function formatKoreaDate(dateStr) {
    if (dateStr?.length !== 8) return "";
    const year = dateStr.slice(0, 4);
    const month = parseInt(dateStr.slice(4, 6), 10);
    const day = parseInt(dateStr.slice(6, 8), 10);
    return `${year}년 ${month}월 ${day}일`;
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

function calculateExcelFormula() {
 console.log(document.querySelectorAll('input[name="name_edit_보증금"]')[0]?.value);
 let deposit = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_보증금"]')[0]?.value).replace(",", ""))*10000;
 let interestRate = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_이율(%)"]')[0]?.value))*0.01;
 let rent = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_임대료"]')[0]?.value))*10000;
 let rentFree = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_RF(개월)"]')[0]?.value));
 let mgmtCost = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_관리비"]')[0]?.value))*10000;
 let areaPyeong = parseFloat(document.querySelectorAll('input[name="name_edit_전용면적"]')[0]?.value);

  try {
    // 숫자로 변환 및 유효성 검사
    const d = Number(deposit);
    const r = Number(interestRate);
    const rm = Number(rent);
    const rf = Number(rentFree);
    const m = Number(mgmtCost);
    const ap = Number(areaPyeong);

    // 전용면적(평)이 0이거나 NaN이면 결과가 무의미하므로 "" 반환
    if (!ap || ap === 0) {
      return "";
    }

    // (보증금*이율)/12
    const monthlyInterest = (d * r) / 12;

    // 임대료*(1-(렌트프리/12))
    const effectiveRent = rm * (1 - rf / 12);

    // 월 이자 + 실월세 + 관리비
    const numerator = monthlyInterest + effectiveRent + m;

    // 전용면적(평)으로 나눈다.
    const result = numerator / ap;

    const editInputs = document.getElementsByName(`name_edit_NOC`);
    editInputs.forEach(editInput => {
        if (!editInput) return;
        editInput.value = Math.floor(result).toLocaleString('ko-KR')+"원";
    });

    // 계산 성공 시 숫자 그대로 리턴(혹은 소수점 처리)
    return ;
  } catch (error) {
    // 계산 중 어떠한 예외라도 발생하면 ""
    return;
  }
}

/**
 * 새로운 API 응답 구조에 맞춰 formFields 구성
 * @param {object|null} buildingData - /api/jjinbba/single/{number}의 응답
 * @param {object|null} buildingReg - 건축물대장 정보 (필요시 추가 정보용)
 * @returns {object} formFields
 */
function populateFormFields(buildingData, buildingReg) {
    console.log("Building Data:", buildingData);
    console.log("Building Reg:", buildingReg?.response?.body?.items?.item[0]);

    if (!buildingData) {
        return {};
    }

    // 새로운 API 응답 구조에 맞춰 데이터 추출
    const address = buildingData.address || "";
    const buildingName = buildingData.building_name || "";
    const floor = buildingData.floor || "";
    const deposit = buildingData.deposit || "";
    const rent = buildingData.rent || "";
    const managementFee = buildingData.management_fee || "";
    const rentAndMgmt = buildingData.rent_and_mgmt || "";
    const rate = buildingData.rate || "";
    const noc = buildingData.noc || "";
    const rf = buildingData.rf || "";
    const exclusiveArea = buildingData.exclusive_area || "";
    const leaseArea = buildingData.lease_area || "";
    const elevator = buildingData.elevator || "";
    const parking = buildingData.parking || "";
    const heating = buildingData.heating || "";
    const restroom = buildingData.restroom || "";
    const use = buildingData.use || "";
    const usageApprovalDate = buildingData.usage_approval_date || "";
    const scale = buildingData.scale || "";
    const direction = buildingData.direction || "";
    const landArea = buildingData.land_area || "";
    const buildingArea = buildingData.building_area || "";
    const totalArea = buildingData.total_area || "";
    const mainStructure = buildingData.main_structure || "";
    const buildingCoverage = buildingData.building_coverage || "";
    const floorAreaRatio = buildingData.floor_area_ratio || "";
    const landPrice = buildingData.land_price || "";
    const feature = buildingData.feature || "";

    return {
        '주소': address,
        '건물명': buildingName,
        '층': floor,
        '보증금': deposit,
        '임대료': rent,
        '관리비': managementFee,
        '임+관': rentAndMgmt,
        '이율(%)': rate,
        'NOC': noc,
        'RF(개월)': rf,
        '전용면적': exclusiveArea,
        '임대면적': leaseArea,
        '엘베': elevator,
        '주차': parking,
        '냉난방': heating,
        '화장실': restroom,
        '용도': use,
        '사용승인일': usageApprovalDate,
        '규모': scale,
        '방향': direction,
        '대지면적': landArea,
        '건축면적': buildingArea,
        '연면적': totalArea,
        '주구조': mainStructure,
        '건폐율': buildingCoverage,
        '용적률': floorAreaRatio,
        '개별공시지가': landPrice,
        '특징': feature
    };
}

/**
 * 최종적으로 formFields를 사용해 화면의 input들을 채우는 함수
 * @param {object} formFields
 */
function applyFormFields(formFields) {
    // formFields에 들어있는 키에 따라 DOM에 값 채우기
    for (const itemKey in formFields) {
        if (!formFields.hasOwnProperty(itemKey)) continue;
        const fieldValue = formFields[itemKey];

        // 읽기 전용
        const roInputs = document.getElementsByName(`name_ro_${itemKey}`);
        roInputs.forEach(roInput => {
            if (roInput) {
                roInput.value = fieldValue;
            }
        });

        // 수정 가능
        const editInputs = document.getElementsByName(`name_edit_${itemKey}`);
        editInputs.forEach(editInput => {
            if (!editInput) return;
            editInput.value = fieldValue;
        });
    }
}

/**
 * 체크된 항목들을 바탕으로 템플릿 HTML 생성 후 id_jjinbba_template에 삽입
 */
function generateTemplate() {
    const fieldNames = [
        '주소', '건물명', '층', '보증금', '임대료', '관리비', '임+관', 'NOC', '이율(%)', 'RF(개월)',
        '임대면적', '전용면적',
        '엘베', '주차', '냉난방', '화장실',
        '용도', '사용승인일', '규모', '방향', '대지면적', '건축면적', '연면적', '주구조', '건폐율', '용적률', '개별공시지가', '특징',
        '특이사항'
    ];

    const items = fieldNames.map(name => ({
        name,
        checked: document.getElementById(`id_checkbox_${name}`)?.checked || false,
        value: document.getElementsByName(`name_edit_${name}`)[0]?.value || ''
    }));

    const addressItem = items.find(item => item.name === '주소' && item.checked)?.value;
    const buildingItem = items.find(item => item.name === '건물명' && item.checked)?.value;
    const floorItem = items.find(item => item.name === '층' && item.checked)?.value;

    const combineStr = [addressItem, buildingItem].filter(Boolean).join(', ') +
                      (floorItem ? (buildingItem || addressItem ? ` ${floorItem}` : floorItem) : '');

    let template = `매물 1. ${combineStr}<br><br>`;

    const sections = [
        ['보증금', '임대료', '관리비', '임+관', 'NOC', '이율(%)', 'RF(개월)'],
        ['임대면적', '전용면적'],
        ['엘베', '주차', '냉난방', '화장실'],
        ['용도', '사용승인일', '규모', '방향', '대지면적', '건축면적', '연면적', '주구조', '건폐율', '용적률', '개별공시지가'],
        ['특이사항', '특징']
    ];

    sections.forEach(section => {
        section.forEach(name => {
            const item = items.find(i => i.name === name && i.checked);
            if (item) {
                template += `ㆍ${item.name} : ${item.value}<br>`;
            }
        });
        template += "<br>";
    });
    document.getElementById('id_jjinbba_template').innerHTML = template;
}

document.getElementById('id_move_number')?.addEventListener('click', function() {
    const inputValue = document.getElementById('id_input_number').value.trim();
    if (inputValue) {
        const newUrl = window.location.origin + "/jjinbba/" + inputValue;
        window.location.href = newUrl;
    }
});

/**
 * 메인 진입점
 */
document.addEventListener('DOMContentLoaded', async function() {
    // 1) URL에서 number 추출
    const currentUrl = window.location.href;
    const match = currentUrl.match(/\/jjinbba\/(\d+)/);
    if (!match) return;
    const number = match[1];

    document.getElementById('id_number').value = number;

    // 2) 새로운 API에서 매물 정보 가져오기
    const buildingData = await getBuildingData(number);

    // 필요한 경우 건축물대장 정보도 가져오기 (현재는 사용하지 않음)
    const buildingReg = null; // await getBuildingReg(pnu);

    // 3) formFields 생성
    const formFields = populateFormFields(buildingData, buildingReg);

    // 4) 특징 표시
    if (buildingData?.feature) {
        const featureDiv = document.getElementById('id_feature');
        featureDiv.innerHTML = `<p style="color: #808080;">${buildingData.feature}</p>`;
    }
    document.getElementById('id_checkbox_특징').disabled = true;

    // 5) 위치 정보 가져오기 (rocation_url 사용)
    if (buildingData?.rocation_url) {
        const templatesDiv = document.getElementById('id_templates');

        // API에서 제공하는 지도 이미지 URL 직접 사용
        templatesDiv.innerHTML = `<img src="${buildingData.rocation_url}" alt="Map Image" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    // 6) formFields를 화면 input들에 적용
    applyFormFields(formFields);

    // 7) 템플릿 생성(초기 1회)
    generateTemplate();

    // 8) 이벤트 리스너 등록(입력값 변경 시 템플릿 재생성)
    document.querySelectorAll('input[name^="name_edit_"]').forEach(editInput => {
        editInput.addEventListener('input', generateTemplate);
        editInput.addEventListener('input', calculateExcelFormula);
    });
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', generateTemplate);
    });

    // 9) 네이버 정보 가져오기 (기존 코드 유지)
    document.getElementById('id_naver_info')?.addEventListener('click', async () => {
        try {
            const iframeResponse = await fetch(`/api/jjinbba/nif/${number}`, { method: 'GET' });
            if (!iframeResponse.ok) throw new Error('Network response was not ok');
            const iframeContent = await iframeResponse.json();
            document.getElementById('id_naver_iframe').srcdoc = iframeContent;
        } catch (error) {
            console.error('Error loading iframe content:', error);
        }
    });

    // 10) 네이버 새탭 열기
    document.getElementById('id_naver_info_new')?.addEventListener('click', () => {
        const url = `https://new.land.naver.com/offices?articleNo=${number}`;
        window.open(url, '_blank');
    });

    // 11) 이미지 ZIP 다운로드 (img_urls 사용)
    document.getElementById('id_each_img_download').addEventListener('click', async function() {
        // 클릭 시작 시 로딩 아이콘 표시
        $('#loading-icon').show();

        try {
            if (!buildingData) {
                console.error('No buildingData available');
                return;
            }

            // zipName 구성
            const zipName = formFields['층']
                ? (formFields['주소'] + ", " + formFields['층'])
                : formFields['주소'];

            // API에서 제공하는 이미지 URL들 사용
            const imageUrls = buildingData.img_urls || [];

            // 지도 이미지도 추가
            if (buildingData.rocation_url) {
                imageUrls.push(buildingData.rocation_url);
            }

            if (!imageUrls.length) {
                console.error('No imageUrls available');
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
        } catch (error) {
            console.error('Error downloading ZIP file:', error);
        } finally {
            // 다운로드 완료 또는 에러 시 로딩 아이콘 감추기
            $('#loading-icon').hide();
        }
    });
});