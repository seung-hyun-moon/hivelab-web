$(document).ready(function() {
    $('#loading-icon').show();
    var table = $('#jjinbbaTable').DataTable({
        columnDefs: [],
        dom : 'Blfrtp',
        lengthChange : true,
        order : [[ 0, "asc" ]],
        "pageLength": 25,
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addJjinbbaListModal').modal('show');
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
            url: '/api/jjinbba/',
            dataSrc: ''
        },
        columns: [
            { data: 'numbers' },
            { data: 'description' },
            { data: 'registration_date' },
            { data: 'person' },
            { data: 'id',
                "render": function ( data, type, row ) {
                    if (row.filename) { // filename 필드가 있는지 확인
                        return '<button class="down-btn btn btn-success" data-id="' + data + '"></button>';
                    } else {
                        return ''; // filename이 없는 경우, 빈 문자열 반환
                    }
                }
            },
            {
                data: 'id',
                "render": function (data, type, row) {
                    return '<button class="edit-btn btn btn-outline-warning" ' +
                            'data-id="' + data + '" ' +
                            'title="수정"></button>'
                }
            },
        ],
        "createdRow": function ( row, data, index ) {
            $('td', row).eq(0).on('click', function () {
                var id = data.id;
                window.location.href = window.location.pathname + '/' + id;
            });
        },
    });



});