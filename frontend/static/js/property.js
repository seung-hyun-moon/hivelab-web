$(document).ready(function() {
    var table = $('#propertyTable').DataTable({
        dom : 'Blfrtip',
        lengthChange : true,
        order : [[ 0, "desc" ]],
        buttons: [
            {
                text: '추가',
                action: function ( e, dt, node, config ) {
                    $('#addPropertyModal').modal('show');
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
            url: '/api/property/',
            dataSrc: ''
        },
        columns: [
            { data: 'id', title: '매물번호' },
            { data: 'thumbnail_path', title: '대표이미지',
                "render": function ( data, type, row ) { 
                    return '<img src="api/image/' + row.id + '/' + data + '" alt="Image" width="100%">';
                }
            },
            {
                data: 'address',
                title: '주소 등',
                render: function (data, type, row) {
                    const tableRow = (label, value) => `<tr><td><b>${label}</b></td><td>${value}</td></tr>`;
                    return `
                        <table>
                            ${tableRow('주소', row.address)}
                            ${tableRow('준공년도', row.year_built)}
                            ${tableRow('규모', row.size)}
                            ${tableRow('주용도', row.usage)}
                        </table>
                    `;
                }
            },
            {
                data: 'building_name',
                title: '건물명 등',
                render: function (data, type, row) {
                    const tableRow = (label, value) => `<tr><td><b>${label}</b></td><td>${value}</td></tr>`;
                    return `
                        <table>
                            ${tableRow('건물명', row.building_name)}
                            ${tableRow('해당층', row.floor)}
                            ${tableRow('공급면적', row.supply_area)}
                            ${tableRow('전용면적', row.private_area)}
                        </table>
                    `;
                }
            },
            {
                data: 'deposit',
                title: '임대조건',
                render: function (data, type, row) {
                    const tableRow = (label, value) => `<tr><td><b>${label}</b></td><td>${value}</td></tr>`;
                    return `
                        <table>
                            <tr><td colspan='2'><b>임대조건</td></tr>
                            ${tableRow('보증금', row.deposit)}
                            ${tableRow('임대료', row.rent)}
                            ${tableRow('관리비', row.maintenance_fee)}
                        </table>
                    `;
                }
            },
            { data: 'details', title: '물건정보' },
            {
                data: 'manager1',
                title: '담당자',
                render: function (data, type, row) {
                    const tableRow = (value) => `<tr><td>${value}</tr></td>`;
                    return `
                        <table>
                            <tr><td><b>담당자</b></td></tr>
                            ${tableRow(row.manager1)}
                            ${tableRow(row.manager2)}
                        </table>
                    `;
                }
            },
            { data: 'id',
                "render": function ( data, type, row ) { 
                    return '<button class="delete-btn btn btn-outline-danger" data-id="' + data + '"></button>'
                }
            },
        ],
    });

    // datatableEdit({
    //     dataTable: table,
    //     columnDefs: [
    //         { targets: 5 },
    //     ],
    //     onEdited: function (prev, changed, index, cell) {
    //         var rowData = cell.row(index.row).data();
    //         $.ajax({
    //             url: '/api/property/' + rowData.id,
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

    $('#propertyTable tbody').on('click', 'button.delete-btn', function () {
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

    $("#closePropertyModal").click(function(){
        $("#addPropertyModal").modal("hide");
    });

    $('#addPropertyModal form').on('submit', function(event) {
        event.preventDefault(); // 기본 submit 동작 방지
        var formData = new FormData(this);
    
        $.ajax({
            type: 'POST',
            url: '/api/property/',
            data: formData,
            contentType: false, // contentType을 false로 설정
            processData: false, // processData를 false로 설정
            success: function(response) {
                console.log('Success:', response);
                $('#addPropertyModal').modal('hide');
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