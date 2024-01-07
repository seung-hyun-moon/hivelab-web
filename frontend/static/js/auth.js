document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert("로그인 성공!"); // 성공 메시지 표시
        window.location.href = '/customer'; // 고객정보 페이지로 리디렉트
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let newUsername = document.getElementById('newUsername').value;
    let newPassword = document.getElementById('newPassword').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: newUsername, password: newPassword})
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert("회원가입 성공! 로그인 해주세요."); // 성공 메시지 표시
        window.location.href = '/'; // 로그인 페이지로 리디렉트
    })
    .catch(error => {
        console.error('Error:', error);
        alert("회원가입 실패."); // 오류 메시지 표시
    });
});
