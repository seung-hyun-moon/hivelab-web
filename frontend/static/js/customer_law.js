function formatData(data, type, row) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        return '<textarea readonly class="data-cell" onclick="toggleHeight(this);">' + data + '</textarea>';
    }
    return data;
}

function formatData2(data, type, row) {
    if (type === 'display') {
        data = data || '';
        var special_notes = row.special_notes ? row.special_notes : '특이사항 : -';
        return '<textarea readonly class="data-cell" onclick="toggleHeight(this);">' + special_notes + '\n\n' + data + '</textarea>';
    }
    return data;
}

function formatData3(data, type, row) {
    if (type === 'display') {
        data = data || ''; // data가 null이나 undefined인 경우 빈 문자열로 대체
        return '<textarea readonly class="data-cell" onclick="toggleHeight(this);">' + data + '명</textarea>';
    }
    return data;
}

function toggleHeight(element) {
    if (element.style.height !== element.scrollHeight + 'px') {
        element.style.height = element.scrollHeight + 'px';
    } else {
        element.style.height = ''; // 원래 높이로 복원
    }
}


function formatYYMMDD() {
    var date = new Date();
    var year = date.getFullYear().toString().slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return year + '.' + month + '.' + day;
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
    $('#customerLawTable thead tr')
        .clone(true)
        .addClass('filters')
        .appendTo('#customerLawTable thead').hide();

    var table = $('#customerLawTable').DataTable({
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 9, "desc" ], ],
        orderCellsTop: true,
        fixedHeader: true,
        columnDefs: [
            {
                targets: [12],
                visible: false,
            },
            {
                targets: '_all',
                searchable: true,
            }
        ],
        initComplete: function () {
            var api = this.api();
            $('#customerLawTable thead .filters').show();
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
                    $('#addCustomerLawModal').modal('show');
                }
            },
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
            url: '/api/customer_law/',
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
            { data: 'industry', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'industry');
                }
            },
            { data: 'company_name', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'company_name');
                }
            },
            { data: 'grade', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'grade');
                }
            },
            { data: 'contact_info', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'contact_info');
                }
            },
            { data: 'personnel', render: formatData3,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'personnel');
                }
            },
            { data: 'move_in_date', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'move_in_date');
                }
            },
            { data: 'notes', render: formatData2,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'notes');
                    $(td).children().css('resize', 'vertical');
                }
            },
            { data: 'edit_date', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    var date = new Date(cellData);
                    var year = date.getFullYear().toString().slice(-2);
                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                    var day = ('0' + date.getDate()).slice(-2);
                    var formattedDate = year + '.' + month + '.' + day;
                    $(td).attr('data-column', 'edit_date');
                    if (rowData.create_date) {
                        var createDateParts = rowData.create_date.split(' ');
                        var timeParts = createDateParts[1].split(':');
                        var formattedCreateDate = '등록일\n' + createDateParts[0] + '\n' + timeParts[0] + ':' + timeParts[1];
                        $(td).attr('title', formattedCreateDate);
                    }
                    $(td).html(formattedDate);
                }
            },
            { data: 'counsel', render: formatData,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).attr('data-column', 'counsel');
                } 
            },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="edit-btn btn btn-outline-warning" data-id="' + data + '"'+'data-status=' + row.status + ' data-create_date="' + row.create_date + '"></button><br>'+'<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
            { data: 'status',}
        ]
    });

    $('#customerLawTable tbody').on('click', 'button.delete-btn', function () {
        var id = $(this).data('id');
        var password = prompt('비밀번호를 입력하세요.');
        if (password === '5125') {
            var confirmDelete = confirm('정말로 이 고객 정보를 삭제하시겠습니까?');
            if (confirmDelete) {
                $.ajax({
                    url: '/api/customer_law/' + id,
                    type: 'DELETE',
                    success: function(result) {
                        table.ajax.reload();
                        console.log('CustomerLaw deleted successfully');
                    },
                    error: function(request, msg, error) {
                        console.log('Failed to delete customer');
                    }
                });
            }
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    });

    $("#closeCustomerLawModal").click(function(){
        $("#addCustomerLawModal").modal("hide");
    });

    $('#addCustomerLawModal').on('show.bs.modal', function() {
        var currentDate = formatYYMMDD();
        $(this).find('input[name="contact_date"]').val(currentDate);
    });

    $('#addCustomerLawModal form').on('submit', function() {
        var form = $(this);
        var contact_date = form.find('input[name="contact_date"]').val();

        // contact_date가 YY.MM.DD 형식인지 확인
        var datePattern = /^\d{2}\.\d{2}\.\d{2}$/;
        if (!datePattern.test(contact_date)) {
            alert("컨택일은 YY.MM.DD 형식이어야 합니다.");
            return false; // AJAX 요청 중단
        }

        var data = {
            industry: form.find('select[name="industry"]').val(),
            company_name: form.find('input[name="company_name"]').val(),
            grade: form.find('input[name="grade"]').val(),
            contact_info: form.find('input[name="contact_info"]').val(),
            personnel: form.find('input[name="personnel"]').val(),
            move_in_date: form.find('input[name="move_in_date"]').val(),

            notes: form.find('textarea[name="notes"]').val(),
            special_notes: form.find('textarea[name="special_notes"]').val(),
            edit_date: formatDate(),
            counsel: form.find('select[name="counsel"]').val(),

            create_date: formatDate(),
            gender: form.find('input[name="gender"]:checked').val(),
            status: form.find('select[name="group"]').val(),
            contact_date: contact_date,
        };

        $.ajax({
            type: 'POST',
            url: '/api/customer_law/',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                console.log('Success:', response);
                $('#addCustomerLawModal').modal('hide');
                table.ajax.reload();
                $('#addCustomerLawModal form').find('input, textarea').not('[name="head"], [name="deputy"]').val('');
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });

        return false;
    });

    $('#customerLawTable').on('click', '.edit-btn', function() {
        var customerId = $(this).data('id');
        var status = $(this).data('status');
        var create_date = $(this).data('create_date');

        $.ajax({ url: '/api/customer_law/' + customerId, success: function(customerData) {
            $('#modifyCustomerLawModal').find('select[name="industry"]').val(customerData.industry)
            $('#modifyCustomerLawModal').find('input[name="company_name"]').val(customerData.company_name)
            $('#modifyCustomerLawModal').find('input[name="grade"]').val(customerData.grade)
            $('#modifyCustomerLawModal').find('input[name="contact_info"]').val(customerData.contact_info)
            $('#modifyCustomerLawModal').find('input[name="personnel"]').val(customerData.personnel)
            $('#modifyCustomerLawModal').find('input[name="move_in_date"]').val(customerData.move_in_date)

            $('#modifyCustomerLawModal').find('textarea[name="notes"]').val(customerData.notes)
            $('#modifyCustomerLawModal').find('textarea[name="special_notes"]').val(customerData.special_notes)
            $('#modifyCustomerLawModal').find('select[name="counsel"]').val(customerData.counsel)

            $('#modifyCustomerLawModal').find('input[name="gender"][value="' + customerData.gender + '"]').prop('checked', true);
            $('#modifyCustomerLawModal').find('select[name="group"]').val(customerData.status)
            $('#modifyCustomerLawModal').find('input[name="contact_date"]').val(customerData.contact_date)
        }});

        // 모달 창 열기
        $('#modifyCustomerLawModal').modal('show');

        $('#modifyCustomerLawModal form').off('submit').on('submit', function() {
            var form = $(this);
            var contact_date = form.find('input[name="contact_date"]').val();

            // contact_date가 YY.MM.DD 형식인지 확인
            var datePattern = /^\d{2}\.\d{2}\.\d{2}$/;
            if (!datePattern.test(contact_date)) {
                alert("컨택일은 YY.MM.DD 형식이어야 합니다.");
                return false; // AJAX 요청 중단
            }
            var data = {
                industry: form.find('select[name="industry"]').val(),
                company_name: form.find('input[name="company_name"]').val(),
                grade: form.find('input[name="grade"]').val(),
                contact_info: form.find('input[name="contact_info"]').val(),
                personnel: form.find('input[name="personnel"]').val(),
                move_in_date: form.find('input[name="move_in_date"]').val(),

                notes: form.find('textarea[name="notes"]').val(),
                special_notes: form.find('textarea[name="special_notes"]').val(),
                edit_date: formatDate(),
                counsel: form.find('select[name="counsel"]').val(),

                create_date: create_date,
                gender: form.find('input[name="gender"]:checked').val(),
                status: form.find('select[name="group"]').val(),
                contact_date: contact_date,
            };

            $.ajax({
                type: 'PUT',
                url: '/api/customer_law/'+customerId,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Success:', response);
                    $('#modifyCustomerLawModal').modal('hide');
                    table.ajax.reload();
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });

            return false;
        });

    });

    $("#closeModifyCustomerLawModal").click(function(){
        $("#modifyCustomerLawModal").modal("hide");
    });


    $('#customerLawTable_filter').prepend('<div id="custombtn" class="btn-group" role="group" aria-label="Basic radio toggle button group"></div>');

    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="progress" autocomplete="off" checked><label class="btn btn-sm btn-outline-secondary" for="progress">진행</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="potential" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="potential">대기</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="hold" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="hold">보류</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="complete" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="complete">완료</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="discard" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="discard">폐기</label>');
    $('#custombtn').append('<input type="radio" class="btn-check" name="btnradio" id="all" autocomplete="off"><label class="btn btn-sm btn-outline-secondary" for="all">전체보기</label>');

    // 버튼을 필터의 앞에 추가
    var dropdown = '<div class="btn-group">' +
        '<button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">' +
            '이동' +
        '</button>' +
        '<ul class="dropdown-menu">' +
            '<li><a class="dropdown-item" href="#" data-status="0">진행</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="4">대기</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="2">보류</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="1">완료</a></li>' +
            '<li><a class="dropdown-item" href="#" data-status="3">폐기</a></li>' +

        '</ul>' +
        '</div>';
    $('#customerLawTable_filter').prepend(dropdown);

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

    $('#potential').on('click', function() {
        table.columns(12).search('4').draw();
    });

    // 전체 선택 체크박스 클릭 이벤트
    $('#checkAll').on('click', function() {
        $('.row-checkbox').prop('checked', $(this).prop('checked'));
    });

    // 각 행의 체크박스 클릭 이벤트
    $('#customerLawTable tbody').on('click', '.row-checkbox', function() {
        if (!$(this).prop('checked')) {
            $('#checkAll').prop('checked', false);
        }
    });

    // 선택된 각 항목에 대해 개별 PATCH 요청을 보내는 함수
    function updateCustomerLawStatus(id, status) {
        $.ajax({
            url: '/api/customer_law/' + id,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ status: status }), // 상태 전송
            success: function(response) {
                console.log('CustomerLaw status update successful');
                table.ajax.reload(); // 페이지 새로 고침
            },
            error: function(error) {
                console.error('Error updating customer status:', error);
            }
        });
    }

    $('#customerLawTable_filter .dropdown-menu a').on('click', function() {
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
            updateCustomerLawStatus(id, status);
        });
    });

    // Bootstrap 툴팁 초기화 및 HTML 옵션 활성화
    $('[data-toggle="tooltip"]').tooltip({
        html: true
    });

    // DataTables가 로드된 후 툴팁 활성화
    $('#customerLawTable thead th').tooltip({
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

    document.getElementById('toggleBasicInfo').addEventListener('click', function() {
        var basicInfoContent = document.getElementById('basicInfoContent');
        var arrowIcon = this.querySelector('.arrow-icon');
        var notesTextarea = document.getElementById('notes'); // 필요하다면 가져옴

        if (basicInfoContent.classList.contains('collapsed')) {
            // 펼치기
            basicInfoContent.classList.remove('collapsed');
            arrowIcon.classList.remove('rotated');
            notesTextarea.rows = 4; // 필요하다면 활성화
        } else {
            // 접기
            basicInfoContent.classList.add('collapsed');
            arrowIcon.classList.add('rotated');
            notesTextarea.rows = 13; // 필요하다면 활성화
        }
    });

    document.getElementById('toggleBasicInfo2').addEventListener('click', function() {
        var basicInfoContent = document.getElementById('basicInfoContent2');
        var arrowIcon = this.querySelector('.arrow-icon');
        var notesTextarea = document.getElementById('notes2'); // 필요하다면 가져옴

        if (basicInfoContent.classList.contains('collapsed')) {
            // 펼치기
            basicInfoContent.classList.remove('collapsed');
            arrowIcon.classList.remove('rotated');
            notesTextarea.rows = 4; // 필요하다면 활성화
        } else {
            // 접기
            basicInfoContent.classList.add('collapsed');
            arrowIcon.classList.add('rotated');
            notesTextarea.rows = 13; // 필요하다면 활성화
        }
    });

    var dropdowns = document.querySelectorAll('.dropdown_person');

    dropdowns.forEach(function(dropdown) {
        var dropdownButton = dropdown.querySelector('.dropdown-toggle');
        var dropdownItems = dropdown.querySelectorAll('.dropdown-item');

        dropdownItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                updateButtonText(dropdown);
            });

            // 체크박스 클릭 시 이벤트 반응
            var checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation(); // 클릭이 dropdown-item으로 전파되지 않도록
                updateButtonText(dropdown);
            });
        });
    });

    function updateButtonText(dropdown) {
        var dropdownButton = dropdown.querySelector('.dropdown-toggle');
        var selectedItems = dropdown.querySelectorAll('.dropdown-item input[type="checkbox"]:checked');
        if (selectedItems.length > 0) {
            var selectedNames = Array.from(selectedItems).map(item => item.value);
            dropdownButton.textContent = selectedNames.join(', ');
        } else {
            dropdownButton.textContent = '선택하세요';
        }
    }

    // 각 textarea에 이벤트 리스너 추가
    document.querySelectorAll('textarea').forEach(function(textarea) {
        textarea.addEventListener('keydown', function(event) {
            // Shift + D 키가 눌렸는지 확인
            if (event.shiftKey && event.code === 'ControlRight') {
                event.preventDefault(); // 기본 동작을 방지

                // 현재 날짜를 yy.mm.dd 형식으로 구하기
                const currentDate = new Date();
                const year = currentDate.getFullYear().toString().slice(-2); // 년도 마지막 두 자
                const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 월
                const day = String(currentDate.getDate()).padStart(2, '0'); // 일

                const formattedDate = `${year}.${month}.${day}`;

                // 현재 커서 위치에 날짜 삽입
                const cursorPosition = textarea.selectionStart;
                const textBefore = textarea.value.substring(0, cursorPosition);
                const textAfter = textarea.value.substring(cursorPosition);
                textarea.value = textBefore + formattedDate + textAfter;

                // 커서가 날짜 뒤에 오도록 설정
                textarea.selectionStart = textarea.selectionEnd = cursorPosition + formattedDate.length;
            }
        });
    });

    function adjustTextareaHeight(id) {
      const textarea = document.getElementById(id);
      textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 10 * parseFloat(getComputedStyle(this).lineHeight));
        this.style.height = newHeight + 'px';
      });
    }

    ['special_notes', 'special_notes2', 'notes', 'notes2'].forEach(adjustTextareaHeight);
});