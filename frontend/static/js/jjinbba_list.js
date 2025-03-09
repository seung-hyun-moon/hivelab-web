function fetchCustomers(query = '') {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/api/customer/',
      method: 'GET',
      success: function(response) {
        const customers = response.sort((a, b) => b.id - a.id); // Sort by ID in descending order
        const filteredCustomers = customers.filter(customer =>
          customer.id.toString().startsWith(query) || customer.industry.includes(query)
        );

        // Populate the dropdown with filtered customers
        const dropdown = $('select[name="customer"]');
        dropdown.empty();
        dropdown.append('<option value="">고객을 선택하세요</option>');

        filteredCustomers.forEach(function(customer) {
          dropdown.append(
            `<option value="${customer.id}">${customer.id} / ${customer.industry} / ${customer.head} / ${customer.deputy}</option>`
          );
        });

        resolve(); // Resolve the promise once the dropdown is populated
      },
      error: function() {
        console.log("Error fetching customer data.");
        reject(); // Reject the promise if there is an error
      }
    });
  });
}


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

async function getBuildingData(number) {
    const naver_url = `/api/jjinbba/info/${number}`;
    return await fetchJSON(naver_url);
}

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

async function getUseInfo(pnu, floor) {
    if (!pnu) return "";

    const sigunguCd = pnu.slice(0, 5);
    const bjdongCd  = pnu.slice(5, 10);
    const bun       = pnu.slice(11, 15);
    const ji        = pnu.slice(15, 19);
    const serviceKey = "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D";

    const apiUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrFlrOulnInfo?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&_type=json&numOfRows=100&pageNo=1`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const items = data?.response?.body?.items?.item;

        if (!items || !Array.isArray(items)) return "";

        return items
            .filter(item => String(item.flrNo) === String(floor)) // 층 번호가 같은 경우 필터링
            .map(item => item.etcPurps) // etcPurps 값만 추출
            .filter(Boolean) // 빈 값 제거
            .join(", "); // 쉼표로 연결
    } catch (error) {
        console.error("API 호출 오류:", error);
        return "";
    }
}

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

function populateFormFields(buildingData, buildingReg, address, useInfo) {
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

        "용도":       useInfo,

        '엘베':       (rideUseElvtCnt+emgenUseElvtCnt) + "대",
        '주차':       ((buildingData?.articleDetail?.parkingPossibleYN || "") === "Y") ? "1대" : "0대",
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

// 예: numbersArr의 각 매물에 대해 buildingData, 주소, formFields를 가져오는 함수
async function fetchPropertyInfo(number) {
    const buildingData = await getBuildingData(number);
    const pnu = buildingData?.articleDetail?.pnu || "";
    const buildingReg = await getBuildingReg(pnu);
    const floor = buildingData.articleAddition?.floorInfo?.split("/")[0] || "";
    const useInfo = await getUseInfo(pnu, floor);
    const address = await getAddress(buildingReg, buildingData);
    const formFields = populateFormFields(buildingData, buildingReg, address);
    return { number, address, formFields };
}

// numbersArr를 받아서 정렬 및 동별 개수를 만드는 함수
async function processProperties(numbersArr) {
    // 각 매물정보를 병렬로 가져오기
    const results = await Promise.all(numbersArr.map(number => fetchPropertyInfo(number)));

    // 주소를 기준으로 그룹화
    const groupedResults = results.reduce((acc, current) => {
        const address = current.formFields["주소"];
        // 주소가 이미 그룹화된 목록에 존재하면 해당 주소의 배열에 추가, 없으면 새로 배열을 생성
        if (!acc[address]) {
            acc[address] = [];
        }
        acc[address].push(current);
        return acc;
    }, {});

    // 각 주소별로 층을 기준으로 정렬하고, 결과 배열을 순차적으로 합침
    const sortedResults = Object.keys(groupedResults).reduce((acc, address) => {
        const groupedByAddress = groupedResults[address];

        // "층" 기준으로 정렬
        groupedByAddress.sort((a, b) => {
            const floorA = parseInt(a.formFields["층"]);
            const floorB = parseInt(b.formFields["층"]);
            return floorA - floorB;
        });

        // 정렬된 결과를 최종 배열에 추가
        acc.push(...groupedByAddress);
        return acc;
    }, []);

    // 정렬된 매물번호 배열 (매물번호만 추출)
    const sortedNumbersArr = sortedResults.map(item => item.number);

    numbersArr = sortedNumbersArr;

    // 각 매물에 대해 generateTemplate을 호출하여 템플릿 딕셔너리 생성 (매물번호 : 템플릿)
    const templates = {};
    sortedResults.forEach((item, index) => {
        // index는 0부터 시작하므로 index+1을 넘겨줍니다.
        templates[item.number] = generateTemplate(index + 1, item.formFields);
    });

    // 주소에서 'OO동' 패턴을 추출하여 동별 개수를 카운트
    const dongCounts = {};
    sortedResults.forEach(item => {
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

    // 두 값을 반환
    return { sortedNumbersArr, region_info, templates };
}

function generateTemplate(currentIndex, field) {

  const fieldNames = [
    '주소', '건물명', '층', '보증금', '임대료', '관리비', '임+관', 'NOC', '이율(%)', 'RF(개월)',
    '임대면적', '전용면적',
    '엘베', '주차', '냉난방', '화장실',
    '용도', '사용승인일', '규모', '방향', '대지면적', '건축면적', '연면적', '주구조', '건폐율', '용적률', '개별공시지가', '특징',
    '특이사항'
  ];

  const items = [
        { name: '주소',       checked: true,       value: field["주소"] },
        { name: '건물명',     checked: true,     value: field["건물명"] },
        { name: '층',         checked: true,         value: field["층"] },

        { name: '보증금',     checked: true,     value: field["보증금"] },
        { name: '임대료',     checked: true,     value: field["임대료"] },
        { name: '관리비',     checked: true,     value: field["관리비"] },
        { name: '임+관',         checked: false,         value: field["임+관"] },
        { name: 'NOC',         checked: false,         value: field["NOC"] },
        { name: '이율(%)',         checked: false,         value: field["이율(%)"] },
        { name: 'RF(개월)',         checked: false,         value: field["RF(개월)"] },

        { name: '임대면적',        checked: false,        value: field["임대면적"] },
        { name: '전용면적',        checked: true,        value: field["전용면적"] },

        { name: '엘베',         checked: true,         value: field["엘베"] },
        { name: '주차',       checked: true,       value: field["주차"] },
        { name: '냉난방',     checked: true,     value: field["냉난방"] },
        { name: '화장실',     checked: true,     value: field["화장실"] },

        { name: '용도',       checked: false,       value: field["용도"] },
        { name: '사용승인일',   checked: false,   value: field["사용승인일"] },
        { name: '규모',       checked: false,       value: field["규모"] },
        { name: '방향',       checked: false,       value: field["방향"] },
        { name: '대지면적',   checked: false,   value: field["대지면적"] },
        { name: '건축면적',   checked: false,   value: field["건축면적"] },
        { name: '연면적',     checked: false,     value: field["연면적"] },
        { name: '주구조',   checked: false,   value: field["주구조"] },
        { name: '건폐율',   checked: false,   value: field["건폐율"] },
        { name: '용적률',   checked: false,   value: field["용적률"] },
        { name: '개별공시지가',       checked: false,       value: field["개별공시지가"] },
        { name: '특징',       checked: false,       value: field["특징"] },

        { name: '특이사항',       checked: false,       value: field["특이사항"] },
    ];

  const addressItem = items.find(i => i.name === '주소' && i.checked)?.value;
  const buildingItem = items.find(i => i.name === '건물명' && i.checked)?.value;
  const floorItem = items.find(i => i.name === '층' && i.checked)?.value;

  const combineStr = [addressItem, buildingItem].filter(Boolean).join(', ') +
                     (floorItem ? (buildingItem || addressItem ? ` ${floorItem}` : floorItem) : '');

  let template = `매물 ${currentIndex}. ${combineStr}<br><br>`;

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
            itemvalue = item.value
        }
        template += `ㆍ${item.name} : ${itemvalue}<br>`;
      }
    });
    template += "<br>";
  });

  return template;
}

$(document).ready(function() {
    $('#loading-icon').show();

    var table = $('#jjinbbaTable').DataTable({
        dom: 'Blfrtip',
        lengthChange: true,
        // 기본적으로 수정일시(updated_at) 기준 내림차순 정렬 (컬럼 인덱스 6)
        order: [[ 6, "desc" ]],
        orderCellsTop: true,
        fixedHeader: true,
        pageLength: 25,
        buttons: [
            {
                text: '추가',
                action: function (e, dt, node, config) {
                    $('#addJjinbbaModal').modal('show');
                    fetchCustomers();
                }
            }
        ],
        initComplete: function() {
            $('#loading-icon').hide();
            console.log('로딩 완료');
        },
        columnDefs: [
            {
                targets: [0, 1, 2, 3, 4],
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).css('background-color', 'rgba(224, 247, 250, 0.2)'); // Adjust the color as needed
                }
            }
        ],
        language: {
            emptyTable: "데이터가 없습니다.",
            lengthMenu: "_MENU_ 개씩 보기",
            info: "현재 _START_ - _END_ / _TOTAL_건",
            infoEmpty: "데이터 없음",
            infoFiltered: "( _MAX_건의 데이터에서 필터링됨 )",
            search: "",
            zeroRecords: "일치하는 데이터가 없습니다.",
            loadingRecords: "로딩중...",
            processing: "잠시만 기다려 주세요.",
            paginate: {
              next: "다음",
              previous: "이전",
            },
        },
        ajax: {
            url: '/api/jjinbba/',
            dataSrc: ''
        },
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-id', data.id);
        },
        columns: [
            { data: 'person' },
            { data: 'customer' },
            { data: 'description' },
            {
                data: 'numbers',
                render: function(data, type, row) {
                    // data가 정수 배열이면 콤마로 join
                    if (Array.isArray(data)) {
                        return data.length;
                    }
                    return data;
                }
            },
            { data: 'region_info' },
            {
                data: 'numbers',
                render: function(data, type, row) {
                    // data가 정수 배열이면 콤마로 join
                    if (Array.isArray(data)) {
                        return data.join(" ");
                    }
                    return data;
                }
            },
            { data: 'updated_at',

            },
            {
                data: 'is_completed',
                render: function(data, type, row) {
                    return '완료';
                }
            },
            {
                data: 'id',
                render: function(data, type, row) {
                    return '<button class="edit-btn btn btn-outline-warning" data-id="' + data + '"></button>' +
                           '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>';
                }
            },
        ],
        "createdRow": function ( row, data, index ) {
            $('td', row).slice(0, 5).on('click', function () {
                var id = data.id;
                window.location.href = window.location.pathname + '/' + id;
            });

            // Handle hover on the 'customer' column (index 1)
            $('td', row).eq(1).hover(
                function(event) {
                    var $this = $(this);
                    var customerValue = $this.text().trim();

                    if (!customerValue || isNaN(customerValue)) {
                        console.log('Invalid customer value:', customerValue); // You can log it or handle this case however you'd like
                        return; // Exit early if the value is invalid
                    }

                    // 툴팁 요소를 생성하고 body에 추가
                    var $tooltip = $('<div class="tooltip" style="opacity: 1;position: absolute; z-index: 999999; background-color: white; padding: 10px; border: 1px solid #ccc; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); visibility: hidden; white-space: nowrap;"></div>').appendTo('body');

                    $.ajax({
                        url: '/api/customer/' + customerValue,
                        method: 'GET',
                        success: function(response) {
                            $tooltip.html(`
                                <p>${response.industry}</p>
                                <p>PO : ${response.head}</p>
                                <p>PA : ${response.deputy}</p>
                            `);

                            // 마우스 움직임에 따라 툴팁 위치 업데이트
                            $this.mousemove(function(e) {
                                $tooltip.css({
                                    top: e.pageY + 10,
                                    left: e.pageX + 10,
                                    visibility: 'visible'
                                });
                            });
                        },
                        error: function() {
                            console.log('Failed to fetch customer data');
                            return;
                        }
                    });
                },
                function() {
                    // 마우스가 떠나면 툴팁 제거
                    $('.tooltip').remove();
                }
            );
        },
    });

    // ★ 삭제 버튼 클릭 이벤트
    $('#jjinbbaTable tbody').on('click', 'button.delete-btn', function () {
        var id = $(this).data('id');
        if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
            $.ajax({
                url: '/api/jjinbba/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('항목 삭제 성공');
                },
                error: function(request, msg, error) {
                    console.error('삭제 실패:', error);
                }
            });
        }
    });

    // ★ 수정 버튼 클릭 이벤트
    $('#jjinbbaTable tbody').on('click', 'button.edit-btn', function () {
        var id = $(this).data('id');
        var checkboxes;
        var created_at;
        var existingTemplates;
        var existingRegionInfo;
        var first_number;
        $.ajax({
            url: '/api/jjinbba/' + id,
            type: 'GET',
            success: function(itemData) {
                fetchCustomers().then(() => {
                    // 기존 매물번호를 기존 textarea에 설정
                    $('#modifyJjinbbaModal').find('textarea[name="numbers"]').val(itemData.numbers.join(" "));
                    // 추가 매물번호는 빈칸으로 설정
//                    $('#modifyJjinbbaModal').find('textarea[name="additional_numbers"]').val("");
                    $('#modifyJjinbbaModal').find('input[name="description"]').val(itemData.description);
                    $('#modifyJjinbbaModal').find('select[name="person"]').val(itemData.person);
                    checkboxes = itemData.checkboxes;
                    created_at = itemData.created_at;
                    existingTemplates = itemData.templates;
                    first_number = itemData.first_number;
                    existingRegionInfo = itemData.region_info || "";
                    $('#modifyJjinbbaModal').find('select[name="customer"]').val(itemData.customer);
                });
            },
            error: function(err) {
                console.error('항목 데이터 불러오기 실패:', err);
            }
        });
        $('#modifyJjinbbaModal').modal('show');

        $('#modifyJjinbbaModal form').off('submit').on('submit', async function() {
            var form = $(this);
            // 기존 매물번호 (순서 유지)
            var numbersStr = form.find('textarea[name="numbers"]').val();
            var numbersArr = numbersStr.split(/\s+/).map(function(num) {
                return parseInt(num, 10);
            }).filter(function(n) { return !isNaN(n); });

            const { sortedNumbersArr, region_info, templates } = await processProperties(numbersArr);

            var data = {
                numbers: sortedNumbersArr,
                description: form.find('input[name="description"]').val(),
                person: form.find('select[name="person"]').val(),
                customer: form.find('select[name="customer"]').val(),
                is_completed: true,
                updated_at: formatDate(),
                created_at: created_at,
                checkboxes: checkboxes,
                region_info: region_info,
                templates: templates,
                first_number: first_number
            };

            $.ajax({
                type: 'PUT',
                url: '/api/jjinbba/' + id,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('수정 성공:', response);
                    $('#modifyJjinbbaModal').modal('hide');
                    table.ajax.reload();
                },
                error: function(error) {
                    console.error('수정 실패:', error);
                }
            });
            return false;
        });

    });


    // ★ 신규 등록 폼 제출 이벤트
    $("#closeAddJjinbbaModal").click(function(){
        $("#addJjinbbaModal").modal("hide");
    });
    $('#addJjinbbaModal form').on('submit', function() {
        var form = $(this);
        var numbersStr = form.find('textarea[name="numbers"]').val();
        var numbersArr = numbersStr.split(" ").map(function(num) { return parseInt(num, 10); })
                                    .filter(function(n) { return !isNaN(n); });
        var checkboxes = {
          "주소": true,
          "건물명": true,
          "층": true,
          "보증금": true,
          "임대료": true,
          "관리비": true,
          "임+관": false,
          "이율(%)": false,
          "RF(개월)": false,
          "NOC": false,
          "임대면적": false,
          "전용면적": true,
          "엘베": true,
          "주차": true,
          "냉난방": true,
          "화장실": true,
          "방향": false,
          "특징": false,
          "사용승인일": false,
          "대지면적": false,
          "연면적": false,
          "규모": false,
          "주구조": false,
          "건폐율": false,
          "용적률": false
        };

        (async function() {
            // processProperties는 비동기 함수이므로 await가 필요합니다.
            const { sortedNumbersArr, region_info, templates } = await processProperties(numbersArr);

            var data = {
                numbers: sortedNumbersArr,
                description: form.find('input[name="description"]').val(),
                person: form.find('select[name="person"]').val(),
                customer: form.find('select[name="customer"]').val(),
                is_completed: true,
                created_at: formatDate(),
                updated_at: formatDate(),
                checkboxes: checkboxes,
                region_info: region_info,
                templates: templates
            };

            $.ajax({
                type: 'POST',
                url: '/api/jjinbba/',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('등록 성공:', response);
                    $('#addJjinbbaModal').modal('hide');
                    table.ajax.reload();
                },
                error: function(error) {
                    console.error('등록 에러:', error);
                }
            });
            return false;
        })();
    });

    $("#closeUploadModal").click(function(){
        $("#uploadModal").modal("hide");
    });
    $("#closeModifyJjinbbaModal").click(function(){
        $("#modifyJjinbbaModal").modal("hide");
    });
});
