let currentCheckboxes = {};
let propertyList = [];
let first_number = 1;
// 전역에 debounce 타이머 변수 선언
let updateTemplateTimeout = null;

// scheduleTemplateUpdate: 3초 동안 추가 변경 없으면 PUT 요청 실행
// scheduleTemplateUpdate: 3초 동안 추가 변경 없으면 PUT 요청 실행
async function scheduleTemplateUpdate() {
    // 이전 타이머 취소
    if (updateTemplateTimeout) {
        clearTimeout(updateTemplateTimeout);
    }
    updateTemplateTimeout = setTimeout(async () => {
        const templateContent = document.getElementById('id_jjinbba_template').innerHTML;
        try {
            // 현재 레코드의 전체 데이터를 먼저 GET으로 가져옴
            const getResponse = await fetch(`/api/jjinbba/${jjinbba_id}`);
            const currentData = await getResponse.json();
            // 기존 templates 객체를 유지 (없으면 빈 객체)
            const currentTemplates = currentData.templates || {};
            // 현재 매물번호에 해당하는 템플릿만 업데이트
            currentTemplates[number] = templateContent;

            // 병합된 templates를 포함하여 PATCH 요청 보내기
            const patchResponse = await fetch(`/api/jjinbba/${jjinbba_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templates: currentTemplates,
                    updated_at: formatDate(),
                    id: jjinbba_id
                })
            });
            if (patchResponse.ok) {
                console.log('Template updated successfully.');
                // 업데이트 후 id_templates 컨테이너 재갱신 (필요 시)
//                updateTemplateContainer();
            } else {
                console.error('Template update failed, status:', patchResponse.status);
            }
        } catch (error) {
            console.error('Error updating template:', error);
        }
    }, 500);
}

// MutationObserver를 사용하여 id_jjinbba_template 요소의 변경 감지
function setupTemplateObserver() {
    const templateElement = document.getElementById('id_jjinbba_template');
    if (!templateElement) return;
    const observer = new MutationObserver((mutations) => {
        // 변경이 감지되면 debounce 함수 호출
        scheduleTemplateUpdate();
    });
    observer.observe(templateElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// id_templates 컨테이너 업데이트 함수 (이미 있던 코드 참고)
async function updateTemplateContainer() {
    try {
        const response = await fetch(`/api/jjinbba/${jjinbba_id}`);
        const data = await response.json();
        if (data.templates) {
            const templateContainer = document.getElementById('id_templates');
            templateContainer.style.overflowY = 'auto';
            templateContainer.innerHTML = "";  // 기존 내용 초기화
            propertyList.forEach(key => {
                templateContainer.innerHTML = templateContainer.innerHTML + data.templates[key];
            });
        }
    } catch (error) {
        console.error('Error updating template container:', error);
    }
}


/**
 * 공통 Fetch → JSON 호출 함수
 * @param {string} url
 * @returns {Promise<object|null>} 성공 시 JSON, 실패 시 null
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
                        id: jjinbba_id
                    })
                });
                if (response.ok) {
                    console.log(`체크박스 [${key}] 업데이트 성공: ${value}`);
                } else {
                    console.error(`체크박스 [${key}] 업데이트 실패, 상태코드: ${response.status}`);
                }
            } catch (error) {
                console.error(`체크박스 [${key}] 업데이트 중 예외 발생:`, error);
            }
        });
    });
}

/**
 * /api/jjinbba/{number} 에서 매물 정보 가져오기
 * @param {number|string} number
 * @returns {Promise<object|null>}
 */
async function getBuildingData(number) {
    const naver_url = `/api/jjinbba/info/${number}`;
    console.log("naver_url", naver_url);
    return await fetchJSON(naver_url);
}

async function getCheckBoxesData(jjinbba_id) {
    const url = `/api/jjinbba/${jjinbba_id}`;
    console.log("Fetching CheckBoxes data from", url);
    return await fetchJSON(url);
}

/**
 * 건축물대장 API 데이터 가져오기
 * @param {string} pnu
 * @returns {Promise<object|null>}
 */
async function getBuildingReg(pnu) {
    if (!pnu) return null;

    const sigunguCd = pnu.slice(0, 5);
    const bjdongCd  = pnu.slice(5, 10);
    // platGbCd = pnu.slice(10, 11); // 사용하지 않아도 되면 생략 가능
    const bun       = pnu.slice(11, 15);
    const ji        = pnu.slice(15, 19);
    const serviceKey = "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D";

    const apiUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&_type=json&numOfRows=1&pageNo=1`;
    return await fetchJSON(apiUrl);
}

/**
 * 주소 추출 로직:
 * 1. 건축물대장 정보(buildingReg)에 주소가 있으면 사용
 * 2. 없으면 lat,lng로 /api/jjinbba/adr/{lat}_{lng} 조회
 * 3. 둘 다 실패면 빈 문자열
 */
async function getAddress(buildingReg, buildingData) {
    // 1. 건축물대장 정보에서 주소
    const addressFromReg = buildingReg?.response?.body?.items?.item[0]?.platPlc;
    if (addressFromReg) {
        return addressFromReg;
    }
    // 2. 좌표로 주소 조회
    try {
        const lng = buildingData?.articleDetail?.longitude;
        const lat = buildingData?.articleDetail?.latitude;
        if (!lat || !lng) {
            return "";
        }
        const adrUrl = `/api/jjinbba/adr/${lat}_${lng}`;
        const adrData = await fetchJSON(adrUrl);
        return adrData || "";
    } catch (error) {
        console.error("좌표 기반 주소조회 실패:", error);
        return "";
    }
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
 let deposit = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_보증금"]')[0]?.value).replace(",", ""))*10000;
 let interestRate = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_이율(%)"]')[0]?.value))*0.01;
 let rent = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_임대료"]')[0]?.value).replace(",", ""))*10000;
 let rentFree = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_RF(개월)"]')[0]?.value));
 let mgmtCost = Math.floor(formatNumber(document.querySelectorAll('input[name="name_edit_관리비"]')[0]?.value))*10000;
 let areaPyeong = parseFloat(document.querySelectorAll('input[name="name_edit_전용면적"]')[0]?.value);
    console.log(deposit, interestRate, rent, rentFree, mgmtCost, areaPyeong);
    console.log(document.querySelectorAll('input[name="name_edit_임대료"]')[0]?.value, formatNumber(document.querySelectorAll('input[name="name_edit_임대료"]')[0]?.value));
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
 * buildingData(매물 정보), buildingReg(건축물대장) + address를 합쳐 formFields 구성
 *
 * @param {object|null} buildingData
 * @param {object|null} buildingReg
 * @param {string} address
 * @returns {object} formFields
 */
function populateFormFields(buildingData, buildingReg, address) {
    // 필요한 정보가 하나도 없을 수 있으니, optional chaining + 기본값 사용
    const warrantPrc   = buildingData?.articleAddition?.dealOrWarrantPrc  || "";
    const rentPrc      = buildingData?.articleAddition?.rentPrc          || "";
    const mgmtCost     = buildingData?.articleDetail?.monthlyManagementCost;
    const supplySpace  = buildingData?.articleSpace?.supplySpace         || "";
    const exclusiveSpace = buildingData?.articleSpace?.exclusiveSpace    || "";
    const rideUseElvtCnt  = buildingReg?.response?.body?.items?.item[0]?.rideUseElvtCnt  ?? 0;
    const emgenUseElvtCnt = buildingReg?.response?.body?.items?.item[0]?.emgenUseElvtCnt ?? 0;
    const bldNm        = buildingReg?.response?.body?.items?.item[0]?.bldNm?.trim()      || "";
    const ugrndFlrCnt  = buildingReg?.response?.body?.items?.item[0]?.ugrndFlrCnt        || "";
    const grndFlrCnt   = buildingReg?.response?.body?.items?.item[0]?.grndFlrCnt         || "";
    const totArea      = buildingReg?.response?.body?.items?.item[0]?.totArea            || "";
    const useAprDay    = buildingReg?.response?.body?.items?.item[0]?.useAprDay          || "";

    const vlRat           = buildingReg?.response?.body?.items?.item[0]?.vlRat          || "";
    const bcRat         = buildingReg?.response?.body?.items?.item[0]?.bcRat          || "";
    const etcStrct      = buildingReg?.response?.body?.items?.item[0]?.etcStrct || "";
    const platArea      = buildingReg?.response?.body?.items?.item[0]?.platArea || "";

    // 주소에서 "서울특별시 00구 " 이런 부분 제거
    // 또한 "번지"라는 단어 제거
    const finalAddress = address
        .replace(/^서울특별시.*?구\s/, "")
        .replace(/번지/, "");

    return {
        '주소':       finalAddress,
        '건물명':     bldNm,
        '층':         (buildingData?.articleAddition?.floorInfo || "").split('/')[0] + "층",

        '보증금':     formatNumber(warrantPrc) + "만",
        '임대료':     formatNumber(rentPrc) + "만",
        '관리비':     convertToKoreanUnit(mgmtCost) + "만",
        '임+관':         (
            parseInt(formatNumber(rentPrc).replace(/,/g, '')) +
            parseInt(convertToKoreanUnit(mgmtCost).replace(/,/g, ''))
        ).toLocaleString() + "만",

        '임대면적':   (supplySpace*0.3025).toFixed(1) + "평",
        '전용면적':   (supplySpace*0.3025*0.8).toFixed(1) + "평",

        '엘베':       (rideUseElvtCnt+emgenUseElvtCnt) + "대",
        '주차':       ((buildingData?.articleDetail?.parkingPossibleYN || "") === "Y") ? "1" : "0",
        '냉난방':     ((buildingData?.articleFacility?.heatMethodTypeName || "").includes("중앙")) ? "중앙" : "개별",
        '화장실':     "외부 분리", // 고정
        '방향':       buildingData?.articleAddition?.direction || "",
        '특징':       buildingData?.articleAddition?.articleFeatureDesc || "",

        '사용승인일':   formatKoreaDate(useAprDay),
        '대지면적':    (platArea*0.3025).toFixed(1) + "평",
        '연면적':     (totArea*0.3025).toFixed(1) + "평",

        '규모':       `지${ugrndFlrCnt}층 / ${grndFlrCnt}층`,
        '주구조':     etcStrct,
        '건폐율':     bcRat + "%",
        '용적률':     vlRat + "%",
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

            switch (itemKey) {
                default:
                    editInput.value = fieldValue;
                    break;
            }
        });
    }
}

/**
 * 체크된 항목들을 바탕으로 템플릿 HTML 생성 후 id_jjinbba_template에 삽입
 */
function generateTemplate(currentIndex, field) {
    const items = [
      { name: '주소',       checked: document.getElementById('id_checkbox_주소').checked,       value: field["주소"] },
      { name: '건물명',     checked: document.getElementById('id_checkbox_건물명').checked,     value: field["건물명"] },
      { name: '층',         checked: document.getElementById('id_checkbox_층').checked,         value: field["층"] },

      { name: '보증금',     checked: document.getElementById('id_checkbox_보증금').checked,     value: field["보증금"] },
      { name: '임대료',     checked: document.getElementById('id_checkbox_임대료').checked,     value: field["임대료"] },
      { name: '관리비',     checked: document.getElementById('id_checkbox_관리비').checked,     value: field["관리비"] },
      { name: '임+관',      checked: document.getElementById('id_checkbox_임+관').checked,      value: field["임+관"] },

      { name: '이율(%)',    checked: document.getElementById('id_checkbox_이율(%)').checked,    value: field["이율(%)"] },
      { name: 'RF(개월)',   checked: document.getElementById('id_checkbox_RF(개월)').checked,   value: field["RF(개월)"] },
      { name: 'NOC',       checked: document.getElementById('id_checkbox_NOC').checked,       value: field["NOC"] },

      { name: '임대면적',   checked: document.getElementById('id_checkbox_임대면적').checked,   value: field["임대면적"] },
      { name: '전용면적',   checked: document.getElementById('id_checkbox_전용면적').checked,   value: field["전용면적"] },

      { name: '엘베',       checked: document.getElementById('id_checkbox_엘베').checked,       value: field["엘베"] },
      { name: '주차',       checked: document.getElementById('id_checkbox_주차').checked,       value: field["주차"] },
      { name: '냉난방',     checked: document.getElementById('id_checkbox_냉난방').checked,     value: field["냉난방"] },
      { name: '화장실',     checked: document.getElementById('id_checkbox_화장실').checked,     value: field["화장실"] },
      { name: '방향',       checked: document.getElementById('id_checkbox_방향').checked,       value: field["방향"] },
      { name: '특징',       checked: document.getElementById('id_checkbox_특징').checked,       value: field["특징"] },

      { name: '사용승인일', checked: document.getElementById('id_checkbox_사용승인일').checked, value: field["사용승인일"] },
      { name: '대지면적',   checked: document.getElementById('id_checkbox_대지면적').checked,   value: field["대지면적"] },
      { name: '연면적',     checked: document.getElementById('id_checkbox_연면적').checked,     value: field["연면적"] },
      { name: '규모',       checked: document.getElementById('id_checkbox_규모').checked,       value: field["규모"] },
      { name: '주구조',     checked: document.getElementById('id_checkbox_주구조').checked,     value: field["주구조"] },
      { name: '건폐율',     checked: document.getElementById('id_checkbox_건폐율').checked,     value: field["건폐율"] },
      { name: '용적률',     checked: document.getElementById('id_checkbox_용적률').checked,     value: field["용적률"] },
    ];

    const addressItem  = items.find(item => item.name === '주소'   && item.checked)?.value;
    const buildingItem = items.find(item => item.name === '건물명' && item.checked)?.value;
    const floorItem    = items.find(item => item.name === '층'     && item.checked)?.value;

    let combineStr = "";

    if (addressItem) {
      combineStr = addressItem;
    }

    if (buildingItem) {
      if (combineStr) {
        combineStr += `, ${buildingItem}`;
      } else {
        combineStr = buildingItem;
      }
    }

    if (floorItem) {
      if (buildingItem) {
        combineStr += ` ${floorItem}`;
      } else if (addressItem) {
        combineStr += `, ${floorItem}`;
      } else {
        combineStr = floorItem;
      }
    }


    let template = `매물 ${Number(first_number)+currentIndex-1}. ${combineStr}<br><br>`;

    // 보증금, 임대료, 관리비, 환산면적
    if (items.find(item => item.name === '보증금' && item.checked)) {
        template += `보증금 : ${items.find(item => item.name === '보증금' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === '임대료' && item.checked)) {
        template += `임대료 : ${items.find(item => item.name === '임대료' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === '관리비' && item.checked)) {
        template += `관리비 : ${items.find(item => item.name === '관리비' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === '임+관' && item.checked)) {
        template += `임+관 : ${items.find(item => item.name === '임+관' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === 'NOC' && item.checked)) {
        template += `NOC : ${items.find(item => item.name === 'NOC' && item.checked)?.value || ''}<br>`;
    }

    template += "<br>";

    if (items.find(item => item.name === '임대면적' && item.checked)) {
        template += `임대면적 : <font color='red'>${items.find(item => item.name === '임대면적' && item.checked)?.value || ''}</font><br>`;
    }
    if (items.find(item => item.name === '전용면적' && item.checked)) {
        template += `전용면적 : <font color='red'>${items.find(item => item.name === '전용면적' && item.checked)?.value || ''}</font><br>`;
    }

    template += "<br>";

    // 엘베, 주차, 냉난방, 화장실, 특징
    if (items.find(item => item.name === '엘베' && item.checked)) {
        template += `ㆍ엘베 ${items.find(item => item.name === '엘베' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === '주차' && item.checked)) {
        template += `ㆍ주차 <font color='red'>${items.find(item => item.name === '주차' && item.checked)?.value || ''}</font>대<br>`;
    }
    if (items.find(item => item.name === '냉난방' && item.checked)) {
        template += `ㆍ<font color='red'>${items.find(item => item.name === '냉난방' && item.checked)?.value || ''}</font> 냉난방<br>`;
    }
    if (items.find(item => item.name === '화장실' && item.checked)) {
        template += `ㆍ<font color='red'>${items.find(item => item.name === '화장실' && item.checked)?.value || ''}</font> 화장실<br>`;
    }
    if (items.find(item => item.name === '방향' && item.checked)) {
        template += `ㆍ방향(주출입구 기준) : ${items.find(item => item.name === '방향' && item.checked)?.value || ''}<br>`;
    }
    if (items.find(item => item.name === '특징' && item.checked)) {
        template += `ㆍ<font color='red'>${items.find(item => item.name === '특징' && item.checked)?.value || ''}</font><br>`;
    }

    template += '<br>';

    // 나머지 체크된 항목들
    items.forEach(item => {
        if (
            item.checked &&
            ![
                '주소','건물명','층',
                '보증금','임대료','관리비','임+관','NOC',
                '임대면적', '전용면적',
                '엘베','주차','냉난방','화장실','방향','특징',
            ].includes(item.name)
        ) {
            template += `ㆍ${item.name} : ${item.value}<br>`;
        }
    });

    return template;
}

document.getElementById('id_move_number')?.addEventListener('click', function() {
    const inputValue = document.getElementById('id_input_number').value.trim();
    if (inputValue) {
        const newUrl = window.location.origin + "/jjinbba/" + inputValue;
        window.location.href = newUrl;
    }
});

async function fetchPropertyInfo(number) {
    const buildingData = await getBuildingData(number);
    const pnu = buildingData?.articleDetail?.pnu || "";
    const buildingReg = await getBuildingReg(pnu);
    const address = await getAddress(buildingReg, buildingData);
    const formFields = populateFormFields(buildingData, buildingReg, address);
    return { number, address, formFields };
}

/**
 * 메인 진입점
 */
document.addEventListener('DOMContentLoaded', async function() {
    // 1) number 추출 X
    console.log(number, jjinbba_id);

    // Navigation Logic
    let currentIndex = 0;
    let templates;

    function updateNavigation() {
//        document.getElementById('currentPosition').textContent =
//            `매물 ${currentIndex+1}/${propertyList.length}`;

        document.getElementById('prevBtn').disabled = currentIndex === 0;
        document.getElementById('nextBtn').disabled = currentIndex === propertyList.length-1;
    }

    // Initial load
    try {
        const response = await fetch(`/api/jjinbba/${jjinbba_id}`);
        const data = await response.json();
        first_number = data.first_number;
        propertyList = data.numbers;
        const region_info = data.region_info;
        templates = data.templates;
        if (number == 'None') {
            number = propertyList[0];
        }

//        if (data.templates) {
//            const templateContainer = document.getElementById('id_templates');
//            templateContainer.style.overflowY = 'auto';
//            templateContainer.innerHTML = "";  // 기존 내용 초기화
//            propertyList.forEach(key => {
//                templateContainer.innerHTML += data.templates[key];
//            });
//        }

        document.getElementById('id_number').value = number;
        document.getElementById('id_region_info').value = "현재 매물번호들을 종합해봤을 때, ("+ region_info + ") 입니다.";

        const btnContainer = document.getElementById('btn_numbers');
        // propertyList의 각 요소마다 버튼 생성
        propertyList.forEach(property => {
          const btn = document.createElement('button');
          btn.textContent = property;

          // 현재 number와 같은 값이면 파란색, 아니면 외곽선 스타일 적용
          if (Number(property) === Number(number)) {
            btn.className = 'btn btn-primary btn-sm m-1';
          } else {
            btn.className = 'btn btn-outline-primary btn-sm m-1';
          }

          // 좌클릭 시 해당 URL로 이동
          btn.addEventListener('click', () => {
            window.location.href = `/jjinbba_list/${jjinbba_id}/${property}`;
          });

          // 우클릭(컨텍스트 메뉴) 시 사용자 정의 메뉴 표시
          btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // 기존에 표시된 커스텀 컨텍스트 메뉴가 있다면 제거
            const existingMenu = document.querySelector('.custom-context-menu');
            if (existingMenu) {
              existingMenu.remove();
            }

            // 컨텍스트 메뉴 생성
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

            // 메뉴 항목 생성: 삭제
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
            deleteItem.addEventListener('click', async () => {
              $('#loading-icon').show();
              // 현재 리스트에서 해당 property를 제외한 새 리스트 생성
                const updatedNumbers = propertyList.filter(p => Number(p) !== Number(property));
                const results = await Promise.all(updatedNumbers.map(number => fetchPropertyInfo(number)));
                const dongCounts = {};
                results.forEach(item => {
                    const addressWithoutRegion = item.address.replace(/^.*?구\s*/, '');
                    const match = addressWithoutRegion.match(/([가-힣]+동(?:\d가)?)/);
                    console.log(item.address, match);
                    if (match) {
                        const dong = match[1];
                        dongCounts[dong] = (dongCounts[dong] || 0) + 1;
                    }
                });

                // 동별 개수를 문자열로 생성 (예: "논현동 1개, 강남동 2개, ...")
                const region_info = Object.keys(dongCounts)
                    .sort((a, b) => a.localeCompare(b, 'ko'))
                    .map(dong => `${dong} ${dongCounts[dong]}개`)
                    .join(', ');

              try {
                const response = await fetch(`/api/jjinbba/${jjinbba_id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  // 백엔드에서 numbers 필드를 업데이트하도록 처리
                  body: JSON.stringify({
                        numbers: updatedNumbers,
                        updated_at: formatDate(),
                        id: jjinbba_id,
                        region_info: region_info
                    })
                });
                if (!response.ok) {
                  throw new Error('삭제 요청 실패');
                }
                // 삭제 성공 시 버튼 제거 및 전역 리스트 업데이트
                btn.remove();
                propertyList = updatedNumbers;
                document.getElementById('id_region_info').value = "현재 매물번호들을 종합해봤을 때, ("+ region_info + ") 입니다.";
                $('#loading-icon').hide();
                alert(`${property} 번호가 삭제되었습니다.`);
              } catch (error) {
                console.error('삭제 에러:', error);
                alert('삭제에 실패했습니다.');
              }
              menu.remove();
            });
            menu.appendChild(deleteItem);

            // 컨텍스트 메뉴를 body에 추가
            document.body.appendChild(menu);

            // 메뉴 외부 클릭 시 메뉴 제거
            const removeContextMenu = (event) => {
              if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', removeContextMenu);
              }
            };
            document.addEventListener('click', removeContextMenu);
          });

          // 컨테이너에 버튼 추가
          btnContainer.appendChild(btn);
        });


        currentIndex = propertyList.indexOf(Number(number));
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
    } catch (error) {
        console.error('Error loading property list:', error);
    }

    // 1) 체크 박스 정보 가져오기!!!
    const infos = await getCheckBoxesData(jjinbba_id);
    if (infos && infos.checkboxes) {
        currentCheckboxes = infos.checkboxes;
        Object.keys(currentCheckboxes).forEach(key => {
            const checkbox = document.getElementById(`id_checkbox_${key}`);
            if (checkbox) {
                checkbox.checked = currentCheckboxes[key];
            }
        });
    };
    setupCheckboxUpdater(jjinbba_id);

    // 2) 두 가지 API 데이터 가져오기 (실패 시 null 반환)
    const buildingData = await getBuildingData(number);
    const pnu = buildingData?.articleDetail?.pnu || "";
    const buildingReg = await getBuildingReg(pnu);

    // 3) 주소 결정
    const address = await getAddress(buildingReg, buildingData);

    // 4) formFields 생성 (둘 중 하나만 성공해도 partial data 사용 가능)
    const formFields = populateFormFields(buildingData, buildingReg, address);

    // 5) formFields를 화면 input들에 적용
    applyFormFields(formFields);

    // 6) 템플릿 생성(초기 1회)
    document.getElementById('id_jjinbba_template').innerHTML = templates[number];

    setupTemplateObserver();

    // 7) 이벤트 리스너 등록(입력값 변경 시 템플릿 재생성)
    document.querySelectorAll('input[name^="name_edit_"]').forEach(editInput => {
        editInput.addEventListener('input', event => {
//            generateTemplate(currentIndex+1);
        });
        editInput.addEventListener('input', calculateExcelFormula);
    });
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', async event => {
            try {
              // 각 property에 대한 fetch가 완료될 때까지 기다립니다.
              const results = await Promise.all(propertyList.map(number => fetchPropertyInfo(number)));

              // 각 매물에 대해 generateTemplate을 호출하여 템플릿 딕셔너리 생성 (매물번호 : 템플릿)
              let new_templates = {};
              results.forEach((item, index) => {
                // 필요하다면 아래처럼 템플릿을 생성할 수 있습니다.
                 new_templates[item.number] = generateTemplate(index + 1, item.formFields);
              });
              const patchResponse = await fetch(`/api/jjinbba/${jjinbba_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templates: new_templates,
                        updated_at: formatDate(),
                        id: jjinbba_id
                    })
                });
                if (patchResponse.ok) {
                    console.log('Template updated successfully.');
                    // 업데이트 후 id_templates 컨테이너 재갱신 (필요 시)
//                    updateTemplateContainer();
                    document.getElementById('id_jjinbba_template').innerHTML = new_templates[number];
                } else {
                    console.error('Template update failed, status:', patchResponse.status);
                }
            } catch (error) {
              console.error("Error fetching property info:", error);
            }
      });
    });

    // 7-1) 매물번호 처음꺼 바꾸기
    $('#id_number_input').on('input', function() {
        const numberValue = $(this).val();

        // 입력값이 빈 문자열이 아니고, 숫자로 변환했을 때 NaN이면 숫자가 아닌 것으로 간주
        if (numberValue !== '' && isNaN(parseFloat(numberValue))) {
          console.log("입력값이 숫자가 아닙니다:", numberValue);
          return; // 숫자가 아니면 AJAX 요청을 실행하지 않음
        }

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
            console.log("AJAX 요청 성공:", data);
            // 글로벌 변수 first_number 업데이트
            first_number = numberValue;
                try {
                  // 각 property에 대한 fetch가 완료될 때까지 기다립니다.
                  const results = await Promise.all(propertyList.map(number => fetchPropertyInfo(number)));

                  // 각 매물에 대해 generateTemplate을 호출하여 템플릿 딕셔너리 생성 (매물번호 : 템플릿)
                  let new_templates = {};
                  results.forEach((item, index) => {
                    // 필요하다면 아래처럼 템플릿을 생성할 수 있습니다.
                     new_templates[item.number] = generateTemplate(index + 1, item.formFields);
                  });
                  const patchResponse = await fetch(`/api/jjinbba/${jjinbba_id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            templates: new_templates,
                            updated_at: formatDate(),
                            id: jjinbba_id
                        })
                    });
                    if (patchResponse.ok) {
                        console.log('Template updated successfully.');
                        // 업데이트 후 id_templates 컨테이너 재갱신 (필요 시)
//                        updateTemplateContainer();
                        document.getElementById('id_jjinbba_template').innerHTML = new_templates[number];
                    } else {
                        console.error('Template update failed, status:', patchResponse.status);
                    }
                } catch (error) {
                  console.error("Error fetching property info:", error);
                }
          })
          .catch(error => {
            console.error("AJAX 요청 실패:", error);
          });
      });


    document.getElementById('id_naver_info')?.addEventListener('click', async () => {
        // 8) iframe 로드 (NIF)
        try {
            const iframeResponse = await fetch(`/api/jjinbba/nif/${number}`, { method: 'GET' });
            if (!iframeResponse.ok) throw new Error('Network response was not ok');
            const iframeContent = await iframeResponse.json();
            document.getElementById('id_naver_iframe').srcdoc = iframeContent;
        } catch (error) {
            console.error('Error loading iframe content:', error);
        }
    });


      // 클릭 이벤트 리스너 등록
      document.getElementById('id_naver_info_new')?.addEventListener('click', () => {
        // 원하는 링크를 지정 (예: 'https://www.example.com')
        const url = `https://new.land.naver.com/offices?articleNo=${number}`;
        // 새 창(또는 새 탭)으로 링크 열기
        window.open(url, '_blank');
    });


    // 10) 이미지 ZIP 다운로드
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
                ? (formFields['주소'] + ", " + formFields['층'].split("/")[0] + "층")
                : formFields['주소'];

            const imageUrls = buildingData.articlePhotos?.map(photo => `https://landthumb-phinf.pstatic.net${photo.imageSrc}`) || [];
            if (buildingData.articleDetail?.longitude && buildingData.articleDetail?.latitude) {
                const mapUrl = `https://simg.pstatic.net/static.map/v2/map/staticmap.bin?crs=EPSG:4326&markers=type:d|size:mid|pos:${buildingData.articleDetail.longitude}%20${buildingData.articleDetail.latitude}|viewSizeRatio:0.7|color:black&scale=1&caller=mw_land&format=jpg&w=1006&h=493`;
                imageUrls.push(mapUrl);
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

    document.getElementById('id_all_img_download').addEventListener('click', async function() {
        $('#loading-icon').show();
        try {
            // 오늘 날짜를 YYYY.MM.DD 형식으로 생성
            const today = new Date();
            const zipName = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;

            // 모든 매물번호에 대해 폴더명과 이미지 URL 수집
            const propertiesPayload = [];
            let count_num = Number(first_number);
            for (const property of propertyList) {
                // 매물번호에 해당하는 buildingData 가져오기

                const response = await fetch(`/api/jjinbba/info/${property}`);

                // (필요하다면 건축물대장, 주소 조회 등 추가 호출)
                // 예시: buildingData.articleDetail, articleAddition 등에서 주소/층 정보를 추출
                const buildingData = await getBuildingData(property);
                const pnu = buildingData?.articleDetail?.pnu || "";
                const buildingReg = await getBuildingReg(pnu);

                // 3) 주소 결정
                const address = await getAddress(buildingReg, buildingData);
                const finalAddress = address.replace(/^서울특별시.*?구\s/, "").replace(/번지/, "") || "주소없음";

                const floor = buildingData.articleAddition?.floorInfo?.split("/")[0] || "";
                const folderName = floor ? `${count_num}. ${finalAddress}, ${floor}층` : `${count_num}. ${finalAddress}`;

                count_num += 1;

                // 기존 로직과 같이 이미지 URL 구성
                let imageUrls = buildingData.articlePhotos?.map(photo => `https://landthumb-phinf.pstatic.net${photo.imageSrc}`) || [];
                if (buildingData.articleDetail?.longitude && buildingData.articleDetail?.latitude) {
                    const mapUrl = `https://simg.pstatic.net/static.map/v2/map/staticmap.bin?crs=EPSG:4326&markers=type:d|size:mid|pos:${buildingData.articleDetail.longitude}%20${buildingData.articleDetail.latitude}|viewSizeRatio:0.7|color:black&scale=1&caller=mw_land&format=jpg&w=1006&h=493`;
                    imageUrls.push(mapUrl);
                }

                propertiesPayload.push({
                    zip_name: folderName,
                    image_urls: imageUrls
                });
            }

            // 백엔드의 새로운 엔드포인트 (/api/jjinbba/all_down)로 payload 전송
            const zipResponse = await fetch('/api/jjinbba/all_down', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zip_name: zipName,
                    properties: propertiesPayload
                })
            });

            if (!zipResponse.ok) {
                console.error('Failed to download zip file:', zipResponse.statusText);
                return;
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
            URL.revokeObjectURL(url); // 메모리 해제
        } catch (error) {
            console.error('Error downloading ZIP file:', error);
        } finally {
            $('#loading-icon').hide();
        }
    });

});
