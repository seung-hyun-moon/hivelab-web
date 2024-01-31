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
        return '<textarea readonly class="data-cell" onclick="this.style.height = this.scrollHeight + \'px\';" ondblclick="this.readOnly = false;" onkeydown="handleKeyDown(event, this, \'' + row.id + '\')">' + data + '</textarea>';
    }
    return data;
}

function handleKeyDown(e, textarea, id) {
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
        $.ajax({
            url: '/api/customer/' + id,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                textarea.readOnly = true;
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
        order : [[ 1, "asc" ],  [2, "asc"]],
        orderCellsTop: true,
        fixedHeader: true,
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
                text: '추가',
                action: function ( e, dt, node, config ) {
                    var data = {
                        importance: "",
                        contact_date: "",
                        move_in_date: "",
                        industry: "",
                        contact_info: "",
                        notes: "",
                        contact_person: "",
                        head: "",
                        deputy: "",
                        customer_page: "",
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
                        },
                        error: function(error) {
                            console.error('Error:', error);
                        }
                    });
                }
            }, 'copy', 'excel'
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
            { data: 'id', render: formatData,
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
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
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
            notes: form.find('input[name="notes"]').val(),
            contact_person: form.find('input[name="contact_person"]').val(),
            head: form.find('input[name="head"]').val(),
            deputy: form.find('input[name="deputy"]').val(),
            customer_page: form.find('input[name="customer_page"]').val(),
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
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    
        return false;
    });

    // $("tr td:nth-child(1)").append("<input type='checkbox' />").addClass('class1').table.draw();
});