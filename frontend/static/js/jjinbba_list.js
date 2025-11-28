function fetchCustomers(query = '') {
  return new Promise((resolve, reject) => {
    $.ajax({
      // ✅ 새로 만든 우선순위 라우터 사용
      url: '/api/customer/prioritized',
      method: 'GET',
      success: function(response) {
        // ✅ 백엔드에서 이미 정렬했으므로 프런트에서 다시 sort 하지 않음
        const customers = response;

        const filteredCustomers = customers.filter(customer =>
          customer.id.toString().startsWith(query) ||
          (customer.industry || '').includes(query)
        );

        const dropdown = $('select[name="customer"]');
        dropdown.empty();
        dropdown.append('<option value="">고객을 선택하세요</option>');

        filteredCustomers.forEach(function(customer) {
          dropdown.append(
            `<option value="${customer.id}">${customer.id} / ${customer.industry} / ${customer.head} / ${customer.deputy}</option>`
          );
        });

        resolve();
      },
      error: function() {
        console.log("Error fetching customer data.");
        reject();
      }
    });
  });
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

// 전역 변수로 현재 사용자 이름 저장
var currentUserName = '송재민'; // 기본값
var permissionLevel = 'STAFF'; // 기본값

// 사용자 정보 가져오기
function fetchCurrentUser() {
    return $.ajax({
        url: '/oauth/hive_user',
        type: 'GET',
        success: function(response) {
            if (response?.db_user?.name) {
                currentUserName = response.db_user.name;
                permissionLevel = response?.db_user?.permission_level;
                const canSeePublic = ["MANAGER", "ADMIN"].includes(permissionLevel);
                console.log("User Permission Level:", permissionLevel, canSeePublic);
                if (canSeePublic) {
                    // hidden 처리된 요소 보이기
                    $('#publicCheckboxContainer').removeAttr('hidden');
                    $('#publicCheckboxContainer2').removeAttr('hidden');
                } else {
                    // hidden 처리된 요소 숨기기
                    $('#publicCheckboxContainer').attr('hidden', true);
                    $('#publicCheckboxContainer2').attr('hidden', true);
                }
            }
        },
        error: function(error) {
            console.error("Failed to fetch user data:", error);
            // 실패 시 기본값 '송재민' 사용
        }
    });
}

$(document).ready(function() {
    // 페이지 로드 시 로딩바 표시
    $('#loading-icon').show();

    fetchCurrentUser().done(function() {

    var table = $('#jjinbbaTable').DataTable({
        dom: 'Blfrtip',
        lengthChange: true,
        // 기본적으로 수정일시(updated_at) 기준 내림차순 정렬 (컬럼 인덱스 6)
        order: [[ 6, "desc" ]],
        orderCellsTop: true,
        fixedHeader: true,
        responsive: true,
        autoWidth: false,
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
            // 테이블 초기화 완료 시 로딩바 숨김
            console.log('로딩 완료');
            $('#customerTable').animate({ opacity: 1 }, 500);
            $('#customerTable thead .filters').show();
            $('#loading-icon').hide();
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
                        // console.log('Invalid customer value:', customerValue);
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
            $('#loading-icon').show();
            // 삭제 중 중복 클릭 방지를 위해 테이블 내의 모든 버튼 비활성화 (선택사항)
            // $('.delete-btn').prop('disabled', true);

            $.ajax({
                url: '/api/jjinbba/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('항목 삭제 성공');
                },
                error: function(request, msg, error) {
                    console.error('삭제 실패:', error);
                    alert("삭제에 실패했습니다.");
                },
                complete: function() {
                    $('#loading-icon').hide(); // ✅ 성공/실패 상관없이 실행
                    // $('.delete-btn').prop('disabled', false); // 버튼 복구
                }
            });
        }
    });

    // ★ 수정 버튼 클릭 이벤트
    $('#jjinbbaTable tbody').on('click', 'button.edit-btn', function () {
        var id = $(this).data('id');
        $.ajax({
            url: '/api/jjinbba/' + id,
            type: 'GET',
            success: function(itemData) {

                // 고객 정보 조회
                $.ajax({
                    url: '/api/customer/' + itemData.customer,
                    type: 'GET',
                    success: function(customerData) {
                        // PO와 PA를 배열로 만들기 (띄어쓰기, 쉼표 등 구분)
                        var poList = (customerData.head || '').split(/[\s,]+/).map(s => s.trim());
                        var paList = (customerData.deputy || '').split(/[\s,]+/).map(s => s.trim());
                        var allowedUsers = [...poList, ...paList, customerData.creator]; // creator 추가

                        // 현재 사용자 체크
                        if (!allowedUsers.includes(currentUserName)) {
                            alert('권한이 없습니다.');
                            return; // 여기서 종료
                        }

                        // 권한이 있으면 기존 모달 로직 실행
                        fetchCustomers().then(() => {
                            $('#modifyJjinbbaModal').find('textarea[name="numbers"]').val(itemData.numbers.join(" "));
                            $('#modifyJjinbbaModal').find('input[name="description"]').val(itemData.description);
                            $('#modifyJjinbbaModal').find('select[name="person"]').val(itemData.person);
                            $('#modifyJjinbbaModal').find('select[name="customer"]').val(itemData.customer);

                            $('#modifyJjinbbaModal').modal('show');
                        });

                    },
                    error: function() {
                        alert('고객 정보를 불러오는데 실패했습니다.');
                    }
                });
            },
            error: function() {
                alert('항목 데이터를 불러오는데 실패했습니다.');
            }
        });

        // ★ [수정됨] 수정 폼 제출 (async 및 processProperties 호출 제거)
        $('#modifyJjinbbaModal form').off('submit').on('submit', function() {
            var form = $(this);
            var $submitBtn = form.find('button[type="submit"]'); // [수정] 제출 버튼 선택

            // [수정] 로딩 아이콘 표시 및 버튼 비활성화
            $('#loading-icon').show();
            $submitBtn.prop('disabled', true).text('수정중...'); // 텍스트 변경은 선택사항

            var numbersStr = form.find('textarea[name="numbers"]').val();
            var numbersArr = numbersStr.split(/\s+/).map(function(num) {
                return parseInt(num, 10);
            }).filter(function(n) { return !isNaN(n); });

            // 백엔드로 보낼 데이터
            var data = {
                numbers: numbersArr,
                description: form.find('input[name="description"]').val(),
                person: form.find('select[name="person"]').val(),
                customer: form.find('select[name="customer"]').val(),
                is_completed: true,
                updated_at: formatDate(),
            };

            $.ajax({
                type: 'PUT',
                url: '/api/jjinbba/' + id,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('수정 성공:', response);
                    $('#modifyJjinbbaModal').modal('hide'); // 성공 시에만 모달 닫기
                    table.ajax.reload();
                },
                error: function(error) {
                    console.error('수정 실패:', error);
                    alert("수정에 실패했습니다.");
                },
                complete: function() {
                    // [수정] 요청 완료 시 로딩 아이콘 숨기고 버튼 복구
                    $('#loading-icon').hide();
                    $submitBtn.prop('disabled', false).text('수정'); // 텍스트 원복
                }
            });
            return false;
        });
    });


    // ★ 신규 등록 폼 제출 이벤트
    $("#closeAddJjinbbaModal").click(function(){
        $("#addJjinbbaModal").modal("hide");
    });

    // ★ [수정됨] 신규 등록 폼 제출 (async 및 processProperties 호출 제거)
    $('#addJjinbbaModal form').on('submit', function() {
        var form = $(this);
        var $submitBtn = form.find('button[type="submit"]'); // [수정] 제출 버튼 선택

        // [수정] 로딩 아이콘 표시 및 버튼 비활성화
        $('#loading-icon').show();
        $submitBtn.prop('disabled', true).text('등록중...'); // 텍스트 변경은 선택사항

        var numbersStr = form.find('textarea[name="numbers"]').val();
        var numbersArr = numbersStr.split(" ").map(function(num) { return parseInt(num, 10); })
                                    .filter(function(n) { return !isNaN(n); });

        var checkboxes = {
          "주소": true, "건물명": true, "층": true, "보증금": true, "임대료": true,
          "관리비": true, "임+관": false, "이율(%)": false, "RF(개월)": false, "NOC": false,
          "임대면적": false, "전용면적": true, "엘베": true, "주차": true, "냉난방": true,
          "화장실": false, "방향": false, "특징": false, "사용승인일": false, "대지면적": false,
          "연면적": false, "규모": false, "주구조": false, "건폐율": false, "용적률": false
        };

        // 백엔드로 보낼 데이터
        var data = {
            numbers: numbersArr,
            description: form.find('input[name="description"]').val(),
            person: form.find('select[name="person"]').val(),
            customer: form.find('select[name="customer"]').val(),
            is_completed: true,
            created_at: formatDate(),
            updated_at: formatDate(),
            checkboxes: checkboxes
        };

        $.ajax({
            type: 'POST',
            url: '/api/jjinbba/',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                console.log('등록 성공:', response);
                $('#addJjinbbaModal').modal('hide'); // 성공 시에만 모달 닫기
                table.ajax.reload();
                // 폼 초기화 (성공했을 때만)
                form[0].reset();
            },
            error: function(error) {
                console.error('등록 에러:', error);
                alert("등록에 실패했습니다.");
            },
            complete: function() {
                // [수정] 요청 완료 시 로딩 아이콘 숨기고 버튼 복구
                $('#loading-icon').hide();
                $submitBtn.prop('disabled', false).text('등록'); // 텍스트 원복
            }
        });
        return false;
    });

    $("#closeUploadModal").click(function(){
        $("#uploadModal").modal("hide");
    });
    $("#closeModifyJjinbbaModal").click(function(){
        $("#modifyJjinbbaModal").modal("hide");
    });

    $(window).on('resize', function() {
        table.columns.adjust();
    });

    });
});