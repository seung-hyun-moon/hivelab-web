function formatDateField(data, type) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        if (data.length === 6) {
            return `${data.slice(0, 2)}년${data.slice(2, 4)}월${data.slice(4, 6)}일`;
        }
    }
    return data;
}

function formatData(data, type) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        return String(data).replace(/ /g, '&nbsp;').replace(/\n/g, '<br/>');
    }
    return data;
}

$(document).ready(function() {
    var table = $('#customerTable').DataTable({
        initComplete: function() {
            // 테이블의 모든 셀에 대해 이벤트 리스너를 추가
            $('td').each(function() {
                $(this).dblclick(function() {
                    // 더블 클릭하면 셀을 수정 가능
                    $(this).attr('contenteditable', 'true');
                });
        
                $(this).keydown(function(e) {
                    // Ctrl + Enter 키를 누르면 줄바꿈
                    if (e.keyCode == 13 && e.ctrlKey) {
                        e.preventDefault(); // 기본 동작(줄바꿈)을 방지
                        var selection = window.getSelection();
                        var range = selection.getRangeAt(0);
                        var cursorPos = range.startOffset;
                        var currentVal = $(this).text();
                        var beforeCursor = currentVal.substring(0, cursorPos);
                        var afterCursor = currentVal.substring(cursorPos);
                        $(this).text(beforeCursor + "\n" + afterCursor);
                        range.setStart(this.childNodes[0], cursorPos + 1);
                        range.setEnd(this.childNodes[0], cursorPos + 1);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else if (e.keyCode == 13) { // Enter 키만
                        e.preventDefault(); // 기본 동작(줄바꿈)을 방지
                        $(this).attr('contenteditable', 'false');
                        var id = $(this).parent().data('id');
                        var column = $(this).data('column');
                        var value = $(this).text();
        
                        var data = {};
                        data[column] = value;
                        $.ajax({
                            url: '/api/customer/' + id,
                            type: 'PATCH',
                            contentType: 'application/json',
                            data: JSON.stringify(data),
                            success: function(response) {
                                table.ajax.reload();
                            }
                        });
                    }
                });
            });
        },
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 0, "desc" ]],
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addCustomerModal').modal('show');
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
                            $(td).css('color', '#f12c17');
                            $(td).css('font-weight', 'bold');
                            break;
                        case 'B':
                            $(td).css('color', '#ffc000');
                            break;
                        case 'C':
                            $(td).css('color', '#548235');
                            break;
                        case 'D':
                            $(td).css('color', '#2f75b5');
                            break;
                        case 'F':
                            $(td).css('color', '#f476e2');
                            break;
                        case 'X':
                            $(td).css('color', '#757171');
                            break;
                        default:
                            // 기본 색상 설정
                            $(td).css('color', '#000000');
                    }
                    
                } 
            },
            { data: 'contact_date', render: formatDateField,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'contact_date');
                } 
            },
            { data: 'move_in_date', render: formatDateField,
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

    // datatableEdit({
    //     dataTable: table,
    //     columnDefs: [
    //         { targets: 1 },
    //         { targets: 2 },
    //         { targets: 3 },
    //         { targets: 4 },
    //         { targets: 5 },
    //         { targets: 6 },
    //         { targets: 7 },
    //         { targets: 8 },
    //         { targets: 9 },
    //         { targets: 10 },
    //     ],
    //     onEdited: function (prev, changed, index, cell) {
    //         var rowData = cell.row(index.row).data();
    //         $.ajax({
    //             url: '/api/customer/' + rowData.id,
    //             type: 'PUT',
    //             accept: 'application/json',
    //             contentType: 'application/json',
    //             data: JSON.stringify(rowData),
    //             success: function(response) {
    //                 table.ajax.reload();
    //             }
    //         });
    //     }
    // });
    

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