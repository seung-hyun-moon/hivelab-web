function toggleDropdown(dropdownId, btnId) {
    const dropdown = document.getElementById(dropdownId);
    const icon = document.querySelector(`#${btnId} svg:last-child`);

    if (dropdown && icon) {
        dropdown.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // --- 사이드바 UI 토글 로직 (기존 유지) ---
    const sidebar = document.getElementById('id_sidebar');
    const mainContent = document.getElementById('id_main_content'); // base.html에 이 ID가 있어야 작동합니다.
    const toggleButton = document.getElementById('id_btn_toggle_sidebar');
    const toggleBtnFixed = document.getElementById('id_btn_toggle_sidebar_fixed');

    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        if(toggleBtnFixed) toggleBtnFixed.classList.toggle('hidden');

        // mainContent가 존재할 때만 class 조작
        if (mainContent) {
            if (sidebar.classList.contains('hidden')) {
                mainContent.classList.remove('ml-64');
            } else {
                mainContent.classList.add('ml-64');
            }
        }
    }

    function handleResize() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('hidden');
            if(mainContent) mainContent.classList.remove('ml-64');
            if(toggleBtnFixed) toggleBtnFixed.classList.remove('hidden');
        } else {
            sidebar.classList.remove('hidden');
            if(mainContent) mainContent.classList.add('ml-64');
            if(toggleBtnFixed) toggleBtnFixed.classList.add('hidden');
        }
    }

    // 이벤트 리스너 등록
    if(toggleButton) {
        toggleButton.addEventListener('click', toggleSidebar);
        toggleButton.addEventListener('mouseover', () => toggleButton.querySelector('svg path').setAttribute('d', 'm15 19-7-7 7-7'));
        toggleButton.addEventListener('mouseout', () => toggleButton.querySelector('svg path').setAttribute('d', 'M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z'));
    }

    if(toggleBtnFixed) {
        toggleBtnFixed.addEventListener('click', toggleSidebar);
        toggleBtnFixed.addEventListener('mouseover', () => toggleBtnFixed.querySelector('svg path').setAttribute('d', 'm9 5 7 7-7 7'));
        toggleBtnFixed.addEventListener('mouseout', () => toggleBtnFixed.querySelector('svg path').setAttribute('d', 'M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z'));
    }

    handleResize();
    window.addEventListener('resize', handleResize);
});

$(document).ready(function() {
    // --- 데이터 렌더링 함수들 ---

    // 1. 사용자 정보 렌더링 함수
    function renderUserInfo(response) {
        const user = response.user;
        const db_user = response.db_user || {};
        const position = db_user.position || '직책';
        const permission_level = db_user.permission_level || 'STAFF';
        const nickname = (user.kakao_account?.profile?.nickname || '이름') + ' ' + position;
        const defaultImageUrl = '/static/images/user.png';
        const thumbnailUrl = user.kakao_account?.profile?.thumbnail_image_url || defaultImageUrl;

        $('#id_sidebar_user_name').text(nickname);
        $('#id_sidebar_profile_img').attr('src', thumbnailUrl);

        if (permission_level === 'ADMIN') {
            $('#id_admin_page').removeAttr('hidden');
        } else {
            $('#id_admin_page').attr('hidden', true);
        }

        if (permission_level === 'ADMIN' || permission_level === 'MANAGER') {
            $('#id_menu_calendar').removeAttr('hidden');
        } else {
            $('#id_menu_calendar').attr('hidden', true);
        }
    }

    // 2. 카테고리 렌더링 함수
    function renderCategories(data) {
        var categoryList = $('#id_dropdown_board');

        // 이미 렌더링 된 내용이 있다면 비우기 (중복 방지)
        categoryList.empty();
        categoryList.addClass('py-2 space-y-2');

        data.forEach(function(category) {
            var categoryType;
            if (category.type === 0) categoryType = 'file';
            else if (category.type === 1) categoryType = 'image';
            else if (category.type === 2) categoryType = 'board';

            var categoryItem = $('<li></li>');
            var categoryLink = $('<a></a>')
                .attr('href', '/download/' + categoryType + '/' + category.id)
                .addClass('flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700')
                .text(category.name);

            categoryItem.append(categoryLink);
            categoryList.append(categoryItem);
        });

        // 휴지통 카테고리 추가
        var trashCategoryItem = $('<li></li>');
        var trashCategoryLink = $('<a></a>')
            .attr('href', '/download/file/0')
            .addClass('flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700')
            .text('휴지통');

        trashCategoryItem.append(trashCategoryLink);
        categoryList.append(trashCategoryItem);
    }

    // --- 실행 로직 (캐싱 적용) ---

    // [1] 사용자 정보 로드
    const cachedUserData = sessionStorage.getItem('hive_user_data');
    if (cachedUserData) {
        // 캐시된 데이터가 있으면 API 호출 없이 바로 렌더링
        renderUserInfo(JSON.parse(cachedUserData));
    } else {
        // 캐시된 데이터가 없으면 API 호출 후 저장
        $.ajax({
            url: '/oauth/hive_user',
            type: 'GET',
            success: function(response) {
                renderUserInfo(response);
                // 세션 스토리지에 저장 (브라우저 닫으면 삭제됨)
                sessionStorage.setItem('hive_user_data', JSON.stringify(response));
            },
            error: function(error) {
                console.error("Failed to fetch user data:", error);
            }
        });
    }

    // [2] 카테고리 정보 로드
    const cachedCategoryData = sessionStorage.getItem('hive_category_data');
    if (cachedCategoryData) {
        renderCategories(JSON.parse(cachedCategoryData));
    } else {
        $.ajax({
            url: '/api/data_category/',
            type: 'GET',
            success: function(data) {
                renderCategories(data);
                sessionStorage.setItem('hive_category_data', JSON.stringify(data));
            },
            error: function(error) {
                console.error(error);
            }
        });
    }

    // [3] 로그아웃 버튼 클릭 시 스토리지 초기화
    // 로그아웃 링크를 클릭하면 저장된 정보를 지워야 다음 로그인 시 꼬이지 않습니다.
    $('a[href="/oauth/logout"]').on('click', function() {
        sessionStorage.removeItem('hive_user_data');
        sessionStorage.removeItem('hive_category_data');
    });
});