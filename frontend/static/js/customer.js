function formatDateField(data, type, row) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        if (data.length === 6) {
            // var retext = `${data.slice(0, 2)}년${data.slice(2, 4)}월${data.slice(4, 6)}일`;
            return '<textarea readonly class="data-cell" onclick="this.style.height = this.scrollHeight + \'px\';" ondblclick="this.readOnly = false;" onkeydown="handleKeyDown(event, this, \'' + row.id + '\')">' + data + '</textarea>';
        }
    }
    return data;
}

function formatData(data, type, row) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        // var retext = String(data).replace(/ /g, '&nbsp;').replace(/\n/g, '<br/>');
        return '<textarea readonly class="data-cell" onclick="this.style.height = this.scrollHeight + \'px\';" ondblclick="this.readOnly = false;" onkeydown="handleKeyDown(event, this, \'' + row.id + '\', \'' + row.status + '\')">' + data + '</textarea>';
    }
    return data;
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

function handleKeyDown(e, textarea, id, status) {
    if (e.keyCode == 13 && e.ctrlKey) {
        e.preventDefault();
        var cursorPos = textarea.selectionStart;
        var currentVal = $(textarea).val();
        var beforeCursor = currentVal.substring(0, cursorPos);
        var afterCursor = currentVal.substring(cursorPos);
        $(textarea).val(beforeCursor + "\n" + afterCursor);
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
    } else if (e.keyCode == 13) {
        e.preventDefault();
        var column = $(textarea).parent().data('column');
        var value = $(textarea).val();

        var data = {};
        data[column] = value;
        data['status'] = status;
        $.ajax({
            url: '/api/customer/' + id,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                textarea.readOnly = true;
                localStorage.setItem('status', status);
                location.reload(); // 페이지 새로 고침
            }
        });
    }
}

$(document).ready(function() {
    $('#customerTable thead tr')
        .clone(true)
        .addClass('filters')
        .appendTo('#customerTable thead');

    var table = $('#customerTable').DataTable({
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 11, "desc" ], [ 2, "asc" ],  [3, "asc"]],
        orderCellsTop: true,
        fixedHeader: true,
        columnDefs: [
            {
                targets: [12], // 상태 열의 인덱스
                visible: false,
            }
        ],
        initComplete: function () {
            var api = this.api();

            // For each column
            api
                .columns()
                .eq(0)
                .each(function (colIdx) {
                    // Set the header cell to contain the input element
                    var cell = $('.filters th').eq(
                        $(api.column(colIdx).header()).index()
                    );
                    var title = $(cell).text();
                    $(cell).html('<input type="text" placeholder="' + title + '" />');

                    // On every keypress in this input
                    $(
                        'input',
                        $('.filters th').eq($(api.column(colIdx).header()).index())
                    )
                        .off('keyup change')
                        .on('change', function (e) {
                            // Get the search value
                            $(this).attr('title', $(this).val());
                            var regexr = '({search})'; //$(this).parents('th').find('select').val();

                            var cursorPosition = this.selectionStart;
                            // Search the column for that value
                            api
                                .column(colIdx)
                                .search(
                                    this.value != ''
                                        ? regexr.replace('{search}', '(((' + this.value + ')))')
                                        : '',
                                    this.value != '',
                                    this.value == ''
                                )
                                .draw();
                        })
                        .on('keyup', function (e) {
                            e.stopPropagation();

                            $(this).trigger('change');
                            $(this)
                                .focus()[0]
                                .setSelectionRange(cursorPosition, cursorPosition);
                        });
                });
        },
        buttons: [
            {
                text: "추가",
                action: function ( e, dt, node, config ) {
                    $('#addCustomerModal').modal('show');
                }
            },
            'copy', 'excel',
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
            url: '/api/customer/',
            dataSrc: ''
        },
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-id', data.id);
        },
        columns: [
            { 
                data: null,
                render: function (data, type, row) {
                    return '<input type="checkbox" class="row-checkbox" data-id="' + row.id + '">';
                }
            },            
            { data: 'id',
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'id');
                } 
            },
            { data: 'importance', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'importance');
                    switch(cellData) {
                        case 'A':
                            $(td).children().css('color', '#f12c17');
                            $(td).children().css('font-weight', 'bold');
                            break;
                        case 'B':
                            $(td).children().css('color', '#ffc000');
                            break;
                        case 'C':
                            $(td).children().css('color', '#548235');
                            break;
                        case 'D':
                            $(td).children().css('color', '#2f75b5');
                            break;
                        case 'F':
                            $(td).children().css('color', '#f476e2');
                            break;
                        case 'X':
                            $(td).children().css('color', '#757171');
                            break;
                        default:
                            // 기본 색상 설정
                            $(td).children().css('color', '#000000');
                    }
                    
                } 
            },
            { data: 'contact_date', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'contact_date');
                } 
            },
            { data: 'move_in_date', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'move_in_date');
                } 
            },
            { data: 'industry', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'industry');
                } 
            },
            { data: 'contact_info', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'contact_info');
                } 
            },
            { data: 'notes', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'notes');
                    $(td).children().css('resize', 'vertical');
                } 
            },
            { data: 'contact_person', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'contact_person');
                } 
            },
            { data: 'head', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'head');
                } 
            },
            { data: 'deputy', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'deputy');
                } 
            },
            { data: 'customer_page', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'customer_page');
                } 
            },
            { data: 'status' },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="edit-btn btn btn-outline-warning" data-id="' + data + '"'+'data-status=' + row.status + '></button>'+'<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
        ]
    });

    $('#customerTable tbody').on('click', 'button.delete-btn', function () {
        var id = $(this).data('id');
        var confirmDelete = confirm('정말로 이 고객 정보를 삭제하시겠습니까?');
        if (confirmDelete) {
            $.ajax({
                url: '/api/customer/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    console.log('Customer deleted successfully');
                },
                error: function(request, msg, error) {
                    console.log('Failed to delete customer');
                }
            });
        }
    });

    $("#closeCustomerModal").click(function(){
        $("#addCustomerModal").modal("hide");
    });

    $('#addCustomerModal form').on('submit', function() {
        var form = $(this);
        var data = {
            importance: form.find('input[name="importance"]').val(),
            contact_date: form.find('input[name="contact_date"]').val(),
            move_in_date: form.find('input[name="move_in_date"]').val(),
            industry: form.find('input[name="industry"]').val(),
            contact_info: form.find('input[name="contact_info"]').val(),
            notes: form.find('textarea[name="notes"]').val(),
            contact_person: form.find('textarea[name="contact_person"]').val(),
            head: form.find('textarea[name="head"]').val(),
            deputy: form.find('textarea[name="deputy"]').val(),
            customer_page: formatDate(),
        };
        $.ajax({
            type: 'POST',
            url: '/api/customer/',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                console.log('Success:', response);
                $('#addCustomerModal').modal('hide');
                table.ajax.reload();
                $('#addCustomerModal form').find('input, textarea').val('');
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    
        return false;
    });

    $('#customerTable').on('click', '.edit-btn', function() {
        var customerId = $(this).data('id');
        var status = $(this).data('status');
    
        $.ajax({ url: '/api/customer/' + customerId, success: function(customerData) {
            $('#modifyCustomerModal').find('input[name="industry"]').val(customerData.industry);
            $('#modifyCustomerModal').find('input[name="importance"]').val(customerData.importance),
            $('#modifyCustomerModal').find('input[name="contact_date"]').val(customerData.contact_date),
            $('#modifyCustomerModal').find('input[name="move_in_date"]').val(customerData.move_in_date),
            $('#modifyCustomerModal').find('input[name="industry"]').val(customerData.industry),
            $('#modifyCustomerModal').find('input[name="contact_info"]').val(customerData.contact_info),
            $('#modifyCustomerModal').find('textarea[name="notes"]').val(customerData.notes),
            $('#modifyCustomerModal').find('textarea[name="contact_person"]').val(customerData.contact_person),
            $('#modifyCustomerModal').find('textarea[name="head"]').val(customerData.head),
            $('#modifyCustomerModal').find('textarea[name="deputy"]').val(customerData.deputy)
        }});
    
        // 모달 창 열기
        $('#modifyCustomerModal').modal('show');

        $('#modifyCustomerModal form').on('submit', function() {
            var form = $(this);
            var data = {
                importance: form.find('input[name="importance"]').val(),
                contact_date: form.find('input[name="contact_date"]').val(),
                move_in_date: form.find('input[name="move_in_date"]').val(),
                industry: form.find('input[name="industry"]').val(),
                contact_info: form.find('input[name="contact_info"]').val(),
                notes: form.find('textarea[name="notes"]').val(),
                contact_person: form.find('textarea[name="contact_person"]').val(),
                head: form.find('textarea[name="head"]').val(),
                deputy: form.find('textarea[name="deputy"]').val(),
                status: status,
                customer_page: formatDate(),
            };
            $.ajax({
                type: 'PUT',
                url: '/api/customer/'+customerId,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Success:', response);
                    $('#modifyCustomerModal').modal('hide');
                    table.ajax.reload();
                    $('#modifyCustomerModal form').find('input, textarea').val('');
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });
        
            return false;
        });

    });

    $("#closeModifyCustomerModal").click(function(){
        $("#modifyCustomerModal").modal("hide");
    });


    $('#customerTable_filter').prepend('<div id="custombtn" class="btn-group" role="group" aria-label="Basic radio toggle button group"></div>');

    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="progress" autocomplete="off" checked><label class="btn btn-sm btn-outline-secondary" for="progress">진행</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="complete" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="complete">완료</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="hold" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="hold">보류</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="discard" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="discard">폐기</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="all" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="all">전체보기</label>');

    // 버튼을 필터의 앞에 추가
    var dropdown = '<div class="btn-group">' +
        '<button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">' +
            '이동' +
        '</button>' +
        '<ul class="dropdown-menu">' +
            '<li><a class="dropdown-item" href="#" data-status="0">진행</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="1">완료</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="2">보류</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="3">폐기</a></li>' +
        '</ul>' +
        '</div>';
    $('#customerTable_filter').prepend(dropdown);

    // 버튼 클릭 이벤트
    $('#all').on('click', function() {
        table.columns(12).search('').draw();
    });

    $('#progress').on('click', function() {
        table.columns(12).search('0').draw();
    });

    $('#complete').on('click', function() {
        table.columns(12).search('1').draw();
    });

    $('#hold').on('click', function() {
        table.columns(12).search('2').draw();
    });

    $('#discard').on('click', function() {
        table.columns(12).search('3').draw();
    });

    // 전체 선택 체크박스 클릭 이벤트
    $('#checkAll').on('click', function() {
        $('.row-checkbox').prop('checked', $(this).prop('checked'));
    });

    // 각 행의 체크박스 클릭 이벤트
    $('#customerTable tbody').on('click', '.row-checkbox', function() {
        if (!$(this).prop('checked')) {
            $('#checkAll').prop('checked', false);
        }
    });

    // 선택된 각 항목에 대해 개별 PATCH 요청을 보내는 함수
    function updateCustomerStatus(id, status) {
        $.ajax({
            url: '/api/customer/' + id,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ status: status }), // 상태 전송
            success: function(response) {
                console.log('Customer status update successful');
                table.ajax.reload(); // 페이지 새로 고침
            },
            error: function(error) {
                console.error('Error updating customer status:', error);
            }
        });
    }

    $('#customerTable_filter .dropdown-menu a').on('click', function() {
        var status = $(this).data('status'); // 선택된 상태 추출
        var selectedRows = $('.row-checkbox:checked').map(function() {
            return $(this).data('id');
        }).get();

        if (selectedRows.length === 0) {
            alert('선택된 항목이 없습니다.');
            return;
        }

        // 선택된 각 항목에 대해 개별 PATCH 요청 보내기
        selectedRows.forEach(function(id) {
            updateCustomerStatus(id, status);
        });
    });


    // 특정 헤더(예: 첫 번째 컬럼)에 HTML 콘텐츠를 포함한 툴팁 추가
    $('#customerTable thead th').eq(2).attr('title', '<span style="color: #f12c17;">A : 매일</span><br><span style="color: #ffc000;">B : 주2회</span><br><span style="color: #548235;">C : 주1회</span><br><span style="color: #2f75b5;">D : 대기1</span><br><span style="color: #f476e2;">F : 대기2</span><br><span style="color: #757171;">X : 처분 후</span>').attr('data-html', 'true');

    // Bootstrap 툴팁 초기화 및 HTML 옵션 활성화
    $('[data-toggle="tooltip"]').tooltip({
        html: true
    });

    // DataTables가 로드된 후 툴팁 활성화
    $('#customerTable thead th').tooltip({
        container: 'body', // 툴팁을 body 태그에 추가하여 포지셔닝 문제 방지
        html: true // HTML 콘텐츠 해석 활성화
    });
    var status = localStorage.getItem('status');

    status = status ? status : '1';
    // Clear the status value from localStorage
    localStorage.removeItem('status');
    // Use the status value in your function
    if (status === '1') {
        $('#progress').click();
    } else if (status === '2') {
        $('#hold').click();
    } else if (status === '3') {
        $('#discard').click();
    } else {
        $('#all').click();
    }
});