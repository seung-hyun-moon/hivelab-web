var path = window.location.pathname; // 현재 페이지의 URL 경로를 가져옵니다.
var parts = path.split('/'); // URL 경로를 '/'로 분할합니다.

// '/download/' + categoryType + '/' + category.id 형식에 따르면, categoryType은 분할된 경로의 세 번째 부분입니다.
var categoryType = parts[2];

console.log(categoryType);

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
    var columnDefs = [];

    if (categoryType === 'board') {
        columnDefs.push(
            { targets: [0, 3, 4, 6], visible: false }
        );
    } else if (categoryType === 'image') {
        columnDefs.push(
            { targets: [3, 6], visible: false }
        );
    } else if (categoryType === 'file') {
        columnDefs.push(
            { targets: [3, 6], visible: false }
        );
    }

    $.ajax({
        url: '/api/data_category/',
        type: 'GET',
        success: function(data) {
            var categoryList = $('#category-list');

            data.forEach(function(category) {
                var categoryItem = $('<li></li>').addClass('category-item');
                var categoryName = $('<span></span>').addClass('category-name').text(category.name);
                categoryItem.append(categoryName);
                categoryItem.on('click', function() {
                    var categoryType;
                    if (category.type === 0) {
                        categoryType = 'file';
                    } else if (category.type === 1) {
                        categoryType = 'image';
                    } else if (category.type === 2) {
                        categoryType = 'board';
                    }
                    window.location.href = '/download/' + categoryType + '/' +category.id; // 카테고리 페이지로 이동
                });
                categoryList.append(categoryItem);
            });
        },
        error: function(error) {
            // 요청이 실패한 경우 에러 처리를 수행하십시오.
            console.error(error);
        }
    });
    $('#loading-icon').show();
    var table = $('#downloadTable').DataTable({
        columnDefs: columnDefs,
        dom : 'Blfrtp',
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
            { data: 'data_category_id' },
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
        data.append('description', form.find('textarea[name="description"]').val());
        data.append('registration_date', formatDate());
        data.append('data_category_id', dataCategoryId);

        for (var pair of data.entries()) {
            console.log(pair[0]+ ', ' + pair[1]);
        }

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
                form.find('textarea[name="description"]').val('');
                form.find('input[name="registration_date"]').val('');
                fileInput.value = '';
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });

        return false;
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

    table.columns(6).search(dataCategoryId).draw();

    // 카테고리 관리

    var manageButton = $('<button></button>').text('카테고리 관리').addClass('btn btn-sm btn-secondary').attr('id', 'manage-category-btn');
    $('#category-list').append(manageButton);
    $('#manage-category-btn').on('click', function() {
        $('#listDataCategoryModal').modal('show');
        $.ajax({
            url: '/api/data_category/',
            type: 'GET',
            success: function(data) {
                var categoryList = $('#manage-category-list');
                categoryList.empty();
    
                data.forEach(function(category) {
                    var categoryItem = $('<li></li>').addClass('category-item');
                    var categoryName = $('<span></span>').addClass('category-name',).text(category.name);
                    var modifyButton = $('<button></button>').addClass('btn-outline-warning').addClass('category-edit-btn').text('수정').attr('data-id', category.id);
                    var deleteButton = $('<button></button>').addClass('btn-outline-danger').addClass('category-delete-btn').text('삭제').attr('data-id', category.id);
                    categoryItem.append(categoryName, modifyButton, deleteButton);
                    categoryList.append(categoryItem);
                });
                    
            },
            error: function(error) {
                // 요청이 실패한 경우 에러 처리를 수행하십시오.
                console.error(error);
            }
        });
    });

    $('#add-category-btn').on('click', function() {
        $('#addDataCategoryModal').modal('show');
    });

    $('#addDataCategoryModal form').on('submit', function() {
        var form = $(this);
        var name = form.find('input[name="category_name"]').val();
        var type = form.find('input[name="category_type"]:checked').val();

        // 이름과 타입이 모두 채워져 있는지 확인
        if (!name || !type) {
            alert('모든 필드를 채워주세요.');
            return false;
        }

        var data = {
            name: name,
            type: type,
        };

        $.ajax({
            type: 'POST',
            url: '/api/data_category',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                console.log('Success:', response);
                $('#addDataCategoryModal').modal('hide');
                table.ajax.reload();
                location.reload(true);
                $('#addDataCategoryModal form').find('input').val('');
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    
        return false;
    });

    $("#closeDataCategoryModal").click(function(){
        $("#addDataCategoryModal").modal("hide");
    });

    $("#closeModifyDataCategoryModal").click(function(){
        $("#modifyDataCategoryModal").modal("hide");
    });

    $("#closelistDataCategoryModal").click(function(){
        $("#listDataCategoryModal").modal("hide");
    });

    $(document).on('click', '#manage-category-list > li > .category-delete-btn', function () {
        var id = $(this).data('id');
        var confirmDelete = confirm('정말로 이 카테고리를 삭제하시겠습니까?');
        if (confirmDelete) {
            $.ajax({
                url: '/api/data_category/' + id,
                type: 'DELETE',
                success: function(result) {
                    table.ajax.reload();
                    location.reload(true);
                    console.log('File deleted successfully');
                },
                error: function(request, msg, error) {
                    console.log('Failed to delete file');
                }
            });
        }
    });


    $(document).on('click', '#manage-category-list > li > .category-edit-btn', function () {
        var categoryId = $(this).data('id');
    
        $.ajax({ 
            url: '/api/data_category/' + categoryId, 
            success: function(categoryData) {
                $('#modifyDataCategoryModal').find('input[name="category_name_modify"]').val(categoryData.name);
                $('#modifyDataCategoryModal').find('input[name="category_type_modify"][value="' + categoryData.type + '"]').prop('checked', true);
            }
        });
    
        // 모달 창 열기
        $('#modifyDataCategoryModal').modal('show');
    
        $('#modifyDataCategoryModal form').on('submit', function() {
            var form = $(this);
            var name = form.find('input[name="category_name"]').val();
            var type = form.find('input[name="category_type"]:checked').val();

            // 이름과 타입이 모두 채워져 있는지 확인
            if (!name || !type) {
                alert('모든 필드를 채워주세요.');
                return false;
            }

            var data = {
                name: name,
                type: type,
            };
            $.ajax({
                type: 'PUT',
                url: '/api/data_category/'+categoryId,
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Success:', response);
                    $('#modifyDataCategoryModal').modal('hide');
                    table.ajax.reload();
                    location.reload(true);
                    $('#modifyDataCategoryModal form').find('input').val('');
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });
        
            return false;
        });
    });

});