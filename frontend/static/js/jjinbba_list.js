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
            $('#loading-icon').show();
            $.ajax({
                url: '/api/jjinbba/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('항목 삭제 성공');
                },
                error: function(request, msg, error) {
                    console.error('삭제 실패:', error);
                },
                complete: function() {
                    $('#loading-icon').hide(); // ✅ 성공/실패 상관없이 실행
                }
            });
        }
    });

    // ★ 수정 버튼 클릭 이벤트
    $('#jjinbbaTable tbody').on('click', 'button.edit-btn', function () {
        var id = $(this).data('id');
        // '수정' 모달에서는 더 이상 created_at, checkboxes 등을 미리 로드할 필요가 없습니다.
        // 백엔드가 PUT 요청 시 numbers 배열만 받아서 새로 처리하기 때문입니다.
        $.ajax({
            url: '/api/jjinbba/' + id,
            type: 'GET',
            success: function(itemData) {
                fetchCustomers().then(() => {
                    // 기존 매물번호를 기존 textarea에 설정
                    $('#modifyJjinbbaModal').find('textarea[name="numbers"]').val(itemData.numbers.join(" "));
                    $('#modifyJjinbbaModal').find('input[name="description"]').val(itemData.description);
                    $('#modifyJjinbbaModal').find('select[name="person"]').val(itemData.person);
                    $('#modifyJjinbbaModal').find('select[name="customer"]').val(itemData.customer);
                });
            },
            error: function(err) {
                console.error('항목 데이터 불러오기 실패:', err);
            }
        });
        $('#modifyJjinbbaModal').modal('show');

        // ★ [수정됨] 수정 폼 제출 (async 및 processProperties 호출 제거)
        $('#modifyJjinbbaModal form').off('submit').on('submit', function() {
            $('#loading-icon').show();
            var form = $(this);

            var numbersStr = form.find('textarea[name="numbers"]').val();
            var numbersArr = numbersStr.split(/\s+/).map(function(num) {
                return parseInt(num, 10);
            }).filter(function(n) { return !isNaN(n); });

            // 백엔드로 보낼 데이터 (region_info, templates 등 제거)
            // 백엔드의 update_item이 numbersArr를 기반으로 모든 것을 새로고침합니다.
            var data = {
                numbers: numbersArr,
                description: form.find('input[name="description"]').val(),
                person: form.find('select[name="person"]').val(),
                customer: form.find('select[name="customer"]').val(),
                is_completed: true,
                updated_at: formatDate(),
                // created_at, checkboxes 등은 백엔드가 알아서 처리하므로 보낼 필요 없음
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
                },
                complete: function() {
                    $('#loading-icon').hide(); // ✅ 요청 완료 후
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
        $('#loading-icon').show();
        var form = $(this);
        var numbersStr = form.find('textarea[name="numbers"]').val();
        var numbersArr = numbersStr.split(" ").map(function(num) { return parseInt(num, 10); })
                                    .filter(function(n) { return !isNaN(n); });

        //
        // 🚨 참고: checkboxes는 이제 백엔드 create_item에서 처리해야 합니다.
        // (현재 jjinbba.py는 create_item에서 checkboxes를 설정하지 않고 있음)
        // 이 로직을 백엔드로 옮기거나, 여기서 기본값을 전송해야 합니다.
        // 여기서는 '전송' 방식을 유지하되, 로직은 단순화합니다.
        //
        var checkboxes = {
          "주소": true, "건물명": true, "층": true, "보증금": true, "임대료": true,
          "관리비": true, "임+관": false, "이율(%)": false, "RF(개월)": false, "NOC": false,
          "임대면적": false, "전용면적": true, "엘베": true, "주차": true, "냉난방": true,
          "화장실": false, "방향": false, "특징": false, "사용승인일": false, "대지면적": false,
          "연면적": false, "규모": false, "주구조": false, "건폐율": false, "용적률": false
        };

        // 백엔드로 보낼 데이터 (region_info, templates 등 제거)
        // 백엔드의 create_item이 numbersArr를 기반으로 모든 것을 생성합니다.
        var data = {
            numbers: numbersArr,
            description: form.find('input[name="description"]').val(),
            person: form.find('select[name="person"]').val(),
            customer: form.find('select[name="customer"]').val(),
            is_completed: true,
            created_at: formatDate(),
            updated_at: formatDate(),
            checkboxes: checkboxes // 기본 체크박스 값
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
            },
            complete: function() {
                $('#loading-icon').hide(); // ✅ 요청 완료 후
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
});