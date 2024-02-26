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
        serverSide: true,
        lengthChange : true,
        order : [[ 3, "asc" ]],
        "pageLength": 25,
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addContactModal').modal('show');
                }
            },
            'copy', 'excel'
        ],
        "initComplete": function(settings, json) {
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
            dataSrc: ''
        },
        columns: [
            { data: 'name' },
            { data: 'phone' },
            { data: 'address' },
            { data: 'registration_date' },
            { data: 'description' },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
        ],
    });

    datatableEdit({
        dataTable: table,
        columnDefs: [
            { targets: 0 },
            { targets: 1 },
            { targets: 2 },
            { targets: 3 },
            { targets: 4 }
        ],
        onEdited: function (prev, changed, index, cell) {
            var rowData = cell.row(index.row).data();
            $.ajax({
                url: '/api/contact/' + rowData.id,
                type: 'PUT',
                accept: 'application/json',
                contentType: 'application/json',
                data: JSON.stringify(rowData),
                success: function(response) {
                    table.ajax.reload();
                }
            });
        }
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

    $("#closeContactModal").click(function(){
        $("#addContactModal").modal("hide");
    });

    $('#addContactModal form').on('submit', function() {
        var form = $(this);
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


    // $("tr td:nth-child(1)").append("<input type='checkbox' />").addClass('class1').table.draw();
});