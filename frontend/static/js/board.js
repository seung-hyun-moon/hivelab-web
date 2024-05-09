var path = window.location.pathname; // 현재 페이지의 URL 경로를 가져옵니다.
var parts = path.split('/'); // URL 경로를 '/'로 분할합니다.

// '/download/' + categoryType + '/' + category.id 형식에 따르면, categoryType은 분할된 경로의 세 번째 부분입니다.
var categoryType = parts[2];
var dataCategoryId = parts[3];
var boardId = parts[4];

$(document).ready(function() {
    $.ajax({
        url: '/api/download/info/' + boardId,
        type: 'GET',
        success: function(data) {
            $('#title').text(data.title);
            $('#registration_date').text(data.registration_date);
            if (data.filename) { // filename이 비어있는지 확인
                $('#filename').text(data.filename).on('click', function() {
                    var url = '/api/download/' + data.id;
                    window.location.href = url;
                });
            } else {
                $('#filename').text(data.filename); // filename이 비어있는 경우, 클릭 이벤트를 바인딩하지 않습니다.
            }
            const viewer = toastui.Editor.factory({
                el: document.querySelector('#viewer'),
                viewer: true,
                initialValue: data.description,
            });
        },
        error: function(error) {
            console.error(error);
        }
    });


    $.ajax({
        url: '/api/data_category/',
        type: 'GET',
        success: function(data) {
            var categoryList = $('#category-list').addClass('btn-group-vertical');

            data.forEach(function(category, index) {
                var categoryItem = $('<input type="radio" class="btn-check" name="btnradio" autocomplete="off">').attr('id', 'btnradio' + (index+1));
                var categoryName = $('<label class="btn btn-outline-secondary"></label>').attr('for', 'btnradio' + (index+1)).text(category.name);

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

                // dataCategoryId 값과 카테고리의 id 값이 일치하면 해당 카테고리를 선택된 상태로 만듭니다.
                if ((category.id).toString() === dataCategoryId) {
                    categoryItem.prop('checked', true);
                }

                categoryList.append(categoryItem, categoryName);
            });
            // 휴지통 카테고리 추가
            var trashCategoryItem = $('<input type="radio" class="btn-check" name="btnradio" autocomplete="off">').attr('id', 'btnradioTrash');
            var trashCategoryName = $('<label class="btn btn-outline-secondary"></label>').attr('for', 'btnradioTrash').text('휴지통');

            trashCategoryItem.on('click', function() {
                window.location.href = '/download/file/0'; // 휴지통 페이지로 이동
            });

            // dataCategoryId 값이 0이면 휴지통 카테고리를 선택된 상태로 만듭니다.
            if (dataCategoryId === '0') {
                trashCategoryItem.prop('checked', true);
            }

            categoryList.append(trashCategoryItem, trashCategoryName);
        },
        error: function(error) {
            // 요청이 실패한 경우 에러 처리를 수행하십시오.
            console.error(error);
        }
    });


    // 카테고리 관리

    var manageButton = $('<button></button>').text('카테고리 관리').addClass('btn btn-sm btn-dark').attr('id', 'manage-category-btn');
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

    $("#closeDataModal").click(function(){
        $("#addDataModal").modal("hide");
    });

    function updateCategoryStatus(id, data_category_id) {
        $.ajax({
            url: '/api/download/' + id,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ "data_category_id": data_category_id }), // 상태 전송
            success: function(response) {
                console.log('Category status update successful');
                table.ajax.reload(); // 페이지 새로 고침
            },
            error: function(error) {
                console.error('Error updating category status:', error);
            }
        });
    }
    $(document).on('click', '#manage-category-list > li > .category-delete-btn', function() {
        var id = $(this).data('id');
        var password = prompt('비밀번호를 입력하세요.');
        if (password === '5125') {
            var confirmDelete = confirm('정말로 이 데이터를 삭제하시겠습니까?');
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
        } else {
            alert('비밀번호가 틀렸습니다.');
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