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
                    $('#uploadModal').modal('show');
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
        columns: [
            { data: 'filename' },
            { data: 'description' },
            { data: 'registration_date' },
            { data: 'file_path' },
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
});