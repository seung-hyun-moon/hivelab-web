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
    var table = $('#downloadTable').DataTable({
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 1, "asc" ]],
        "pageLength": 25,
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addDataModal').modal('show');
                }
            }
        ],
        "initComplete": function(settings, json) {
            $('#loading-icon').hide();
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
            url: '/api/download/',
            dataSrc: ''
        },
        columnDefs: [
            {
                targets: [3], // 상태 열의 인덱스
                visible: false,
            }
        ],
        columns: [
            { data: 'description' },
            { data: 'filename' },
            { data: 'registration_date' },
            { data: 'file_path' },
            { data: 'id',
                "render": function ( data, type, row ) {
                    return '<button class="down-btn btn btn-success" data-id="' + data + '"></button>'
                }
            },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
        ],
    });

    $('#downloadTable tbody').on('click', 'button.delete-btn', function () {
        var id = $(this).data('id');
        var confirmDelete = confirm('정말로 이 연락처를 삭제하시겠습니까?');
        if (confirmDelete) {
            $.ajax({
                url: '/api/download/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('File deleted successfully');
                },
                error: function(request, msg, error) {
                    console.log('Failed to delete file');
                }
            });
        }
    });

    $('#downloadTable tbody').on('click', 'button.down-btn', function () {
        var id = $(this).data('id');
        $.ajax({
            url: '/api/download/' + id,
            type: 'GET',
            success: function(result) {
                console.log('File Download successfully');
                var url = '/api/download/' + id;
                window.location.href = url;
            },
            error: function(request, msg, error) {
                console.log('Failed to download file');
            }
        });
    });

    $("#closeDatatModal").click(function(){
        $("#addDataModal").modal("hide");
    });

    $('#addDataModal form').on('submit', function() {
        var form = $(this);
        var fileInput = $('#fileUpload')[0];
        var file = fileInput.files[0];
        var data = new FormData();
        
        data.append('file', file);
        data.append('description', form.find('input[name="description"]').val());
        data.append('registration_date', formatDate());
        

        $.ajax({
            type: 'POST',
            url: '/api/download/',
            data: data,
            contentType: false,  // multipart/form-data; boundary=...를 사용하도록 jQuery에 지시
            processData: false,  // jQuery가 data를 문자열로 변환하지 않도록 지시
            success: function(response) {
                console.log('Success:', response);
                $('#addDataModal').modal('hide');
                table.ajax.reload();

                // 입력 필드를 비웁니다.
                form.find('input[name="description"]').val('');
                form.find('input[name="registration_date"]').val('');
                fileInput.value = '';
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });

        return false;
    });

    $("#closeDataModal").click(function(){
        $("#addDataModal").modal("hide");
    });

    var dropzone = document.getElementById('dropzone');
    dropzone.ondragover = function() {
        this.className = 'dragover';
        return false;
    };
    dropzone.ondragleave = function() {
        this.className = '';
        return false;
    };
    dropzone.ondrop = function(e) {
        e.preventDefault();
        this.className = '';
        var file = e.dataTransfer.files[0];
        document.getElementById('fileUpload').files = e.dataTransfer.files;
    };

});