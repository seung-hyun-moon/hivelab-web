function custom_datas(data) {
    // importance 필드를 ★로 변환
    if (typeof data.importance === 'string' && !isNaN(data.importance)) {
        if (data.importance < 0 || data.importance > 5) {
            alert('importance는 0에서 5 사이의 숫자여야 합니다.');
            return data;
        }
        data.importance = '★'.repeat(data.importance);
    }

    // move_in_date 필드를 년월일 형식으로 변환
    if (typeof data.move_in_date === 'string' && !isNaN(data.move_in_date)) {
        let dateStr = data.move_in_date.toString();
        if (dateStr.length !== 6) {
            return data;
        }
        data.move_in_date = `${dateStr.slice(0, 2)}년${dateStr.slice(2, 4)}월${dateStr.slice(4, 6)}일`;
    }
}

$(document).ready(function() {
    var table = $('#customerTable').DataTable({
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
        columns: [
            { data: 'id' },
            { data: 'importance' },
            { data: 'move_in_date' },
            { data: 'industry' },
            { data: 'contact_info' },
            { data: 'deposit' },
            { data: 'rent' },
            { data: 'size' },
            { data: 'sector' },
            { data: 'notes' },
            { data: 'contact_person1' },
            { data: 'contact_person2' },
            { data: 'handling_person1' },
            { data: 'handling_person2' },
            { data: 'talk_person1' },
            { data: 'talk_person2' },
            { data: 'property_id' },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    console.log(data, type, row);
                    return '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
        ]
    });

    datatableEdit({
        dataTable: table,
        columnDefs: [
            { targets: 1 },
            { targets: 2 },
            { targets: 3 },
            { targets: 4 },
            { targets: 5 },
            { targets: 6 },
            { targets: 7 },
            { targets: 8 },
            { targets: 9 },
            { targets: 10 },
            { targets: 11 },
            { targets: 12 },
            { targets: 13 },
            { targets: 14 },
            { targets: 15 },
            { targets: 16 },
        ],
        onEdited: function (prev, changed, index, cell) {
            var rowData = cell.row(index.row).data();
            custom_datas(rowData);
            $.ajax({
                url: '/api/customer/' + rowData.id,
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

    $("#close").click(function(){
        $("#closeCustomerModal").modal("hide");
    });

    $('#addCustomerModal form').on('submit', function() {
        var form = $(this);
        var data = {
            importance: form.find('input[name="importance"]').val(),
            move_in_date: form.find('input[name="move_in_date"]').val(),
            industry: form.find('input[name="industry"]').val(),
            contact_info: form.find('input[name="contact_info"]').val(),
            deposit: form.find('input[name="deposit"]').val(),
            rent: form.find('input[name="rent"]').val(),
            size: form.find('input[name="size"]').val(),
            sector: form.find('input[name="sector"]').val(),
            notes: form.find('input[name="notes"]').val(),
            contact_person1: form.find('input[name="contact_person1"]').val(),
            contact_person2: form.find('input[name="contact_person2"]').val(),
            handling_person1: form.find('input[name="handling_person1"]').val(),
            handling_person2: form.find('input[name="handling_person2"]').val(),
            talk_person1: form.find('input[name="talk_person1"]').val(),
            talk_person2: form.find('input[name="talk_person2"]').val(),
            property_id: form.find('input[name="property_id"]').val()
        };
        custom_datas(data);
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