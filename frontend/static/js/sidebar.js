function toggleDropdown(dropdownId, btnId) {
    const dropdown = document.getElementById(dropdownId);
    const icon = document.querySelector(`#${btnId} svg:last-child`);
    dropdown.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('id_sidebar');
    const mainContent = document.getElementById('id_main_content');
    const toggleButton = document.getElementById('id_btn_toggle_sidebar');
    const toggleBtnFixed = document.getElementById('id_btn_toggle_sidebar_fixed');

    // Ensure everything is initialized in the hidden state for mobile
    if (window.innerWidth < 768) {
        // Force the correct initial state for mobile
        sidebar.classList.add('hidden');
        mainContent.classList.remove('ml-64');
        toggleBtnFixed.classList.remove('hidden');
    }

    // Toggle sidebar with buttons
    toggleButton.addEventListener('click', function() {
        toggleSidebar();
    });

    toggleBtnFixed.addEventListener('click', function() {
        toggleSidebar();
    });

    // Function to toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        toggleBtnFixed.classList.toggle('hidden');
        if (sidebar.classList.contains('hidden')) {
            mainContent.classList.remove('ml-64');
        } else {
            mainContent.classList.add('ml-64');
        }
    }

    // Button hover effects
    toggleButton.addEventListener('mouseover', function() {
        toggleButton.querySelector('svg path').setAttribute('d', 'm15 19-7-7 7-7');
    });

    toggleButton.addEventListener('mouseout', function() {
        toggleButton.querySelector('svg path').setAttribute('d', 'M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z');
    });

    toggleBtnFixed.addEventListener('mouseover', function() {
        toggleBtnFixed.querySelector('svg path').setAttribute('d', 'm9 5 7 7-7 7');
    });

    toggleBtnFixed.addEventListener('mouseout', function() {
        toggleBtnFixed.querySelector('svg path').setAttribute('d', 'M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z');
    });

    // Add responsive behavior
    function handleResize() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('hidden');
            mainContent.classList.remove('ml-64');
            toggleBtnFixed.classList.remove('hidden');
        } else {
            sidebar.classList.remove('hidden');
            mainContent.classList.add('ml-64');
            toggleBtnFixed.classList.add('hidden');
        }
    }

    // Initial check on page load
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);
});

$(document).ready(function() {
    console.log(document.cookie);
    $.ajax({
        url: '/oauth/hive_user',
        type: 'GET',
        success: function(response) {
            const user = response.user;
            const nickname = user.kakao_account?.profile?.nickname || '이름';
            const defaultImageUrl = '/static/images/user.png';
            const thumbnailUrl = user.kakao_account?.profile?.thumbnail_image_url || defaultImageUrl;
            // 1-1. 사이드바 프로필 업데이트
            $('#id_sidebar_user_name').text(nickname);
            $('#id_sidebar_profile_img').attr('src', thumbnailUrl);
        },
        error: function(error) {
            console.error("Failed to fetch user data:", error);
            // 사용자 정보 로딩 실패 시 기본 이미지/이름 유지
        }
    });

    // 게시판 내에 카테고리 불러오기
    $.ajax({
        url: '/api/data_category/',
        type: 'GET',
        success: function(data) {
            var categoryList = $('#id_dropdown_board').addClass('py-2 space-y-2');

            data.forEach(function(category, index) {
                var categoryType;
                if (category.type === 0) {
                    categoryType = 'file';
                } else if (category.type === 1) {
                    categoryType = 'image';
                } else if (category.type === 2) {
                    categoryType = 'board';
                }

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
        },
        error: function(error) {
            // 요청이 실패한 경우 에러 처리를 수행하십시오.
            console.error(error);
        }
    });
});