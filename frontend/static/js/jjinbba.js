
document.addEventListener('DOMContentLoaded', function() {
    // Build the URL using the dynamic number
    var current_url = window.location.href;
    // 정규식을 사용하여 /api/jjinbba/ 이후 숫자를 추출
    var match = current_url.match(/\/jjinbba\/(\d+)/);
    if (match) {
        var number = match[1];
    } else {
        return
    }
    var naver_url = `/api/jjinbba/${number}`;

    // Set up the headers based on the information you provided
    var headers = new Headers({
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
    });

    // Fetch the data from the API
    fetch(naver_url, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            const buildingData = data;

            // PNU 값 가져오기
            const pnu = buildingData?.articleDetail?.pnu || "";
            if (!pnu) {
              console.error("PNU 값이 존재하지 않습니다.");
              return;
            }

            // PNU 값 파싱
            const sigunguCd = pnu.slice(0, 5); // 11680
            const bjdongCd = pnu.slice(5, 10); // 10300
            const platGbCd = pnu.slice(10, 11); // 1
            const bun = pnu.slice(11, 15); // 0646
            const ji = pnu.slice(15, 19); // 0008
            const serviceKey = "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D";

            // API URL 생성
            const apiUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&_type=json&numOfRows=1&pageNo=1`;

            // Fetch 요청
            fetch(apiUrl, { method: 'GET' })
                .then(response => response.json())
                .then(result => {
                    console.log(result);
                    let addressPromise;
                    if (!result?.response?.body?.items?.item[0]?.platPlc) {
                    const lng = buildingData?.articleDetail?.longitude;
                    const lat = buildingData?.articleDetail?.latitude;
                    addressPromise = fetch(`/api/jjinbba/adr/${lat}_${lng}`, { method: 'GET' })
                        .then(response => response.json())
                        .catch(err => {
                            console.error("API 요청 중 오류 발생:", err);
                            return "";
                        });
                    } else {
                        addressPromise = Promise.resolve(result.response.body.items.item[0].platPlc);
                    }
                    return addressPromise.then(address => {
                        return { address, result }; // 객체로 묶어서 반환
                    });
                })
                .then(({ address, result }) => {
                    const formFields = {
                      '주소': address.replace(/^서울특별시.*?구\s/, "") || "",
                      '층': buildingData?.articleAddition?.floorInfo || "",
                      '보증금': buildingData?.articleAddition?.dealOrWarrantPrc || "",
                      '임대료': buildingData?.articleAddition?.rentPrc || "",
                      '관리비': buildingData?.articleDetail?.monthlyManagementCost || "",
                      '임대면적': buildingData?.articleSpace?.supplySpace || "",
                      '전용면적': buildingData?.articleSpace?.supplySpace || "",
                      'EV': `승용 ${result?.response?.body?.items?.item[0]?.rideUseElvtCnt || ""} / 비상 ${result?.response?.body?.items?.item[0]?.emgenUseElvtCnt || ""}`,
                      '냉난방': buildingData?.articleFacility?.heatMethodTypeName || "",
                      '화장실': "외부 분리", // Fixed value
                      '특징': buildingData?.articleAddition?.articleFeatureDesc || "",
                      '주차': buildingData?.articleDetail?.parkingPossibleYN || "",
                      '합': (parseInt(buildingData?.articleAddition?.rentPrc) + parseInt(buildingData?.articleDetail?.monthlyManagementCost)) || "",
                      'NOC': "", // Not provided in the API data
                      '건물명': result?.response?.body?.items?.item[0]?.bldNm || "",
                      '규모': `지하 ${result?.response?.body?.items?.item[0]?.ugrndFlrCnt || ""} / 지상 ${result?.response?.body?.items?.item[0]?.grndFlrCnt || ""}`,
                      '연면적': result?.response?.body?.items?.item[0]?.totArea || "",
                      '준공년도': result?.response?.body?.items?.item[0]?.useAprDay || "",
                      '방향': buildingData?.articleAddition?.direction || "",
                      '매물번호': buildingData?.articleAddition?.articleNo || "",
                      '법정총EV': result?.response?.body?.items?.item[0]?.indrMechUtcnt + result?.response?.body?.items?.item[0]?.oudrMechUtcnt + result?.response?.body?.items?.item[0]?.indrAutoUtcnt + result?.response?.body?.items?.item[0]?.oudrAutoUtcnt || "",
                    };

                    for (const itemKey in formFields) {
                        if (formFields.hasOwnProperty(itemKey)) {
                            const fieldValue = formFields[itemKey]; // Get the value for the current key

                            const roInputs = document.getElementsByName(`name_ro_${itemKey}`);
                            const editInputs = document.getElementsByName(`name_edit_${itemKey}`);

                            roInputs.forEach(roInput => {
                                if (roInput) {
                                    roInput.value = fieldValue; // Set the value for read-only input
                                }
                            });

                            // Loop through each element with the name `name_edit_${itemKey}`
                            editInputs.forEach(editInput => {
                                if (editInput) {
                                    editInput.value = fieldValue; // Set the value for editable input
                                }
                            });
                        }
                    }
                })
              .catch(err => {
                console.error("API 요청 중 오류 발생:", err);
              });
        })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
});

document.getElementById('id_move_number').addEventListener('click', function(e) {
    var inputValue = document.getElementById('id_input_number').value.trim();
    if (inputValue) {
        var currentUrl = window.location.origin; // 호스트 정보를 가져옴
        var newUrl = currentUrl + "/jjinbba/" + encodeURIComponent(inputValue);
        window.location.href = newUrl;  // 새로운 URL로 이동
    }
});