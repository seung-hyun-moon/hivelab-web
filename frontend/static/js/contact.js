const copyRecords = [];
const WINDOW_MS = 60 * 1000; // 예: 1분
const MAX_COPIES = 5;

document.addEventListener('copy', () => {
  const now = Date.now();
  copyRecords.push(now);
  // 윈도우 밖 타임스탬프 제거
  while (copyRecords.length && copyRecords[0] < now - WINDOW_MS) {
    copyRecords.shift();
  }

  if (copyRecords.length > MAX_COPIES) {
    // 서버 로그 호출 등 추가 조치
    var id = null;
    $.ajax({
        url: '/oauth/hive_user',
        type: 'GET',
        success: function(response) {
            const id = response?.db_user?.id || null;
            $.ajax({
                url: `/api/users/${id}`,
                type: 'PATCH',
                data: JSON.stringify({ is_active: false }),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Admin notified successfully');
                },
            });
        },
        error: function(error) {
            console.error("Failed to fetch user data:", error);
            // 사용자 정보 로딩 실패 시 기본 이미지/이름 유지
        }
    });

    alert('복사 횟수가 제한을 초과하여 관리자에게 알림이 전송됩니다.');
  } else {
    // 기록 로그 또는 UI 표시 가능
    console.log(`복사 횟수: ${copyRecords.length}`);
  }
});

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
    var table = $('#contactTable').DataTable({
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 4, "desc" ]],
        orderCellsTop: true,
        fixedHeader: true,
        "pageLength": 25,
        serverSide: true,
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addContactModal').modal('show');
                }
            },
            {
                text: 'Excel 업로드',
                action: function ( e, dt, node, config ) {
                    $('#uploadModal').modal('show');
                }
            },
//            'copy', 'excel'
        ],
        initComplete: function() {
            $('#loading-icon').hide();
            console.log('loading-icon');
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
            url: '/api/contact/',
            type: 'GET',
            data: function(d) {
                return $.extend({}, d, {
                    // 추가로 필요한 파라미터를 여기에 추가 가능
                });
            },
            dataSrc: function(json) {
                $('#loading-icon').hide();
                return json.data; // 서버에서 전달한 데이터의 위치
            },
            beforeSend: function() {
                $('#loading-icon').show();
            },
            complete: function() {
                $('#loading-icon').hide();
            }
        },
        columns: [
            { data: 'name' },
            { data: 'phone' },
            { data: 'address' },
            { data: 'description' },
            { data: 'registration_date' },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="edit-btn btn btn-outline-warning" data-id="' + data + '"></button>' +
       '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>';
                }
            },
        ],
    });

    $('#contactTable tbody').on('click', 'button.delete-btn', function () {
        var id = $(this).data('id');
        var confirmDelete = confirm('정말로 이 연락처를 삭제하시겠습니까?');
        if (confirmDelete) {
            $.ajax({
                url: '/api/contact/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('Contact deleted successfully');
                },
                error: function(request, msg, error) {
                    console.log('Failed to delete contact');
                }
            });
        }
    });

    $('#contactTable tbody').on('click', 'button.edit-btn', function () {
        var contactId = $(this).data('id');

        $.ajax({
            url: '/api/contact/' + contactId,
            type: 'GET',
            success: function(contactData) {
                $('#modifyContactModal').find('input[name="name"]').val(contactData.name);
                $('#modifyContactModal').find('input[name="phone"]').val(contactData.phone);
                $('#modifyContactModal').find('input[name="address"]').val(contactData.address);
                $('#modifyContactModal').find('input[name="description"]').val(contactData.description);
            }
        });

        // Open the modal
        $('#modifyContactModal').modal('show');

        $('#modifyContactModal form').off('submit').on('submit', function() {
            var form = $(this);
            var $submitBtn = form.find('button[type="submit"]');
            $submitBtn.prop('disabled', true); // 중복 방지
            var data = {
                name: form.find('input[name="name"]').val(),
                phone: form.find('input[name="phone"]').val(),
                address: form.find('input[name="address"]').val(),
                description: form.find('input[name="description"]').val(),
                registration_date: formatDate()
            };

            $.ajax({
                type: 'PUT',
                url: '/api/contact/' + contactId,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Success:', response);
                    $('#modifyContactModal').modal('hide');
                    table.ajax.reload();
                },
                error: function(error) {
                    console.error('Error:', error);
                },
                complete: function() {
                    $submitBtn.prop('disabled', false); // 다시 활성화
                }
            });

            return false;
        });
    });


    $("#closeContactModal").click(function(){
        $("#addContactModal").modal("hide");
    });

    $('#addContactModal form').off('submit').on('submit', function() {
        var form = $(this);
        var $submitBtn = form.find('button[type="submit"]');
        $submitBtn.prop('disabled', true); // 중복 방지
        var data = {
            name: form.find('input[name="name"]').val(),
            phone: form.find('input[name="phone"]').val(),
            address: form.find('input[name="address"]').val(),
            description: form.find('input[name="description"]').val(),
            registration_date: formatDate()
        };
    
        $.ajax({
            type: 'POST',
            url: '/api/contact/',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                console.log('Success:', response);
                $('#addContactModal').modal('hide');
                table.ajax.reload();
            },
            error: function(error) {
                console.error('Error:', error);
            },
            complete: function() {
                $submitBtn.prop('disabled', false); // 다시 활성화
            }
        });
    
        return false;
    });


    // 업로드 데이터
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        var fileInput = $('#fileUpload')[0];
        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('file', file);
    
        $.ajax({
            url: '/api/contact/upload',
            type: 'POST',
            data: formData,
            processData: false,  // tell jQuery not to process the data
            contentType: false,  // tell jQuery not to set contentType
            success: function(data) {
                // 업로드 완료 후 모달 닫기
                $('#uploadModal').modal('hide');
                table.ajax.reload();
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    });

    $("#closeUploadModal").click(function(){
        $("#uploadModal").modal("hide");
    });

    $("#closeModifyContactModal").click(function(){
        $("#modifyContactModal").modal("hide");
    });


    // $("tr td:nth-child(1)").append("<input type='checkbox' />").addClass('class1').table.draw();
});