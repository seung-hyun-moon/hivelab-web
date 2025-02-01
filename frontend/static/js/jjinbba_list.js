// 날짜 형식: "YYYY-MM-DD HH:MM:SS"
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
        // 기본적으로 수정일시(updated_at) 기준 내림차순 정렬 (컬럼 인덱스 4)
        order: [[ 4, "desc" ]],
        orderCellsTop: true,
        fixedHeader: true,
        pageLength: 25,
        buttons: [
            {
                text: '추가',
                action: function (e, dt, node, config) {
                    $('#addJjinbbaModal').modal('show');
                }
            }
        ],
        initComplete: function() {
            $('#loading-icon').hide();
            console.log('로딩 완료');
        },
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
            {
                data: 'numbers',
                render: function(data, type, row) {
                    // data가 정수 배열이면 콤마로 join
                    if (Array.isArray(data)) {
                        return data.join(", ");
                    }
                    return data;
                }
            },
            { data: 'updated_at' },
            { 
                data: 'is_completed',
                render: function(data, type, row) {
                    return data ? '완료' : '미완료';
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
            $('td', row).slice(0, 6).on('click', function () {
                var id = data.id;
                window.location.href = window.location.pathname + '/' + id;
            });
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
        $.ajax({
            url: '/api/jjinbba/' + id,
            type: 'GET',
            success: function(itemData) {
                // numbers 배열을 띄어쓰기로 구분된 문자열로 변환
                $('#modifyJjinbbaModal').find('input[name="numbers"]').val(itemData.numbers.join(" "));
                $('#modifyJjinbbaModal').find('input[name="description"]').val(itemData.description);
                $('#modifyJjinbbaModal').find('input[name="person"]').val(itemData.person);
                $('#modifyJjinbbaModal').find('input[name="is_completed"]').prop('checked', itemData.is_completed);
            },
            error: function(err) {
                console.error('항목 데이터 불러오기 실패:', err);
            }
        });
        $('#modifyJjinbbaModal').modal('show');

        // 기존 submit 이벤트 제거 후 재등록
        $('#modifyJjinbbaModal form').off('submit').on('submit', function() {
            var form = $(this);
            // 입력한 numbers 값을 띄어쓰기로 분리한 후 정수 배열로 변환
            var numbersStr = form.find('input[name="numbers"]').val();
            var numbersArr = numbersStr.split(/\s+/).map(function(num) { return parseInt(num, 10); })
                                        .filter(function(n) { return !isNaN(n); });
            var data = {
                numbers: numbersArr,
                description: form.find('input[name="description"]').val(),
                person: form.find('input[name="person"]').val(),
                is_completed: form.find('input[name="is_completed"]').is(':checked'),
                // 수정 시 updated_at은 현재 시간으로 처리
                updated_at: formatDate()
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
        var data = {
            numbers: numbersArr,
            description: form.find('input[name="description"]').val(),
            person: form.find('input[name="person"]').val(),
            is_completed: form.find('input[name="is_completed"]').is(':checked'),
            created_at: formatDate(),
            updated_at: formatDate()
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
    });

    $("#closeUploadModal").click(function(){
        $("#uploadModal").modal("hide");
    });
    $("#closeModifyJjinbbaModal").click(function(){
        $("#modifyJjinbbaModal").modal("hide");
    });
});
