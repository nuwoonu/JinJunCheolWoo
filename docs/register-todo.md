# 회원가입 페이지 추가 구현 목록

## 1. 이메일 가입 폼 (필수)
"이메일 주소로 계속하기" 버튼 클릭 시 표시될 폼

```html
<!-- 이메일 가입 폼 (버튼 클릭 시 표시) -->
<div id="emailForm" style="display: none;">
  <form th:action="@{/register}" method="post">
    <!-- 이름 -->
    <div class="mb-3">
      <label class="form-label">이름 <span class="text-danger">*</span></label>
      <input type="text" name="name" class="form-control" placeholder="이름을 입력하세요" required />
    </div>

    <!-- 이메일 -->
    <div class="mb-3">
      <label class="form-label">이메일 <span class="text-danger">*</span></label>
      <input type="email" name="email" class="form-control" placeholder="example@email.com" required />
    </div>

    <!-- 비밀번호 -->
    <div class="mb-3">
      <label class="form-label">비밀번호 <span class="text-danger">*</span></label>
      <input type="password" name="password" class="form-control" placeholder="8자 이상 입력하세요" required />
    </div>

    <!-- 비밀번호 확인 -->
    <div class="mb-3">
      <label class="form-label">비밀번호 확인 <span class="text-danger">*</span></label>
      <input type="password" name="passwordConfirm" class="form-control" placeholder="비밀번호를 다시 입력하세요" required />
    </div>

    <!-- 역할 선택 -->
    <div class="mb-3">
      <label class="form-label">사용자 유형 <span class="text-danger">*</span></label>
      <select name="role" class="form-select" required>
        <option value="">선택하세요</option>
        <option value="STUDENT">학생</option>
        <option value="TEACHER">교사</option>
        <option value="PARENT">학부모</option>
      </select>
    </div>

    <!-- 전화번호 -->
    <div class="mb-3">
      <label class="form-label">전화번호</label>
      <input type="tel" name="phone" class="form-control" placeholder="010-0000-0000" />
    </div>

    <!-- 약관 동의 -->
    <div class="form-check mb-3">
      <input type="checkbox" class="form-check-input" id="terms" required />
      <label class="form-check-label" for="terms">
        <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의합니다
      </label>
    </div>

    <!-- 가입 버튼 -->
    <button type="submit" class="btn btn-primary w-100">가입하기</button>
  </form>

  <!-- 뒤로가기 -->
  <button type="button" class="btn btn-link w-100 mt-2" onclick="hideEmailForm()">
    다른 방법으로 가입하기
  </button>
</div>
```

---

## 2. JavaScript (폼 토글)

```html
<script>
  function showEmailForm() {
    document.getElementById('socialButtons').style.display = 'none';
    document.getElementById('emailForm').style.display = 'block';
  }

  function hideEmailForm() {
    document.getElementById('socialButtons').style.display = 'block';
    document.getElementById('emailForm').style.display = 'none';
  }
</script>
```

이메일 버튼에 onclick 추가:
```html
<button type="button" class="btn-social" onclick="showEmailForm()">
```

---

## 3. 에러/성공 메시지

```html
<!-- 에러 메시지 -->
<div th:if="${error}" class="alert alert-danger" role="alert">
  <span th:text="${error}"></span>
</div>

<!-- 성공 메시지 -->
<div th:if="${success}" class="alert alert-success" role="alert">
  <span th:text="${success}"></span>
</div>
```

---

## 4. 역할별 추가 필드 (선택)

학생인 경우:
```html
<div id="studentFields" style="display: none;">
  <div class="mb-3">
    <label class="form-label">학번</label>
    <input type="text" name="studentId" class="form-control" placeholder="학번을 입력하세요" />
  </div>
  <div class="mb-3">
    <label class="form-label">학년/반</label>
    <div class="d-flex gap-2">
      <select name="grade" class="form-select">
        <option value="">학년</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>
      <select name="classNum" class="form-select">
        <option value="">반</option>
        <option value="1">1반</option>
        <option value="2">2반</option>
        <!-- ... -->
      </select>
    </div>
  </div>
</div>
```

교사인 경우:
```html
<div id="teacherFields" style="display: none;">
  <div class="mb-3">
    <label class="form-label">담당 과목</label>
    <input type="text" name="subject" class="form-control" placeholder="담당 과목을 입력하세요" />
  </div>
</div>
```

역할 선택 시 필드 표시 JS:
```html
<script>
  document.querySelector('select[name="role"]').addEventListener('change', function() {
    document.getElementById('studentFields').style.display = this.value === 'STUDENT' ? 'block' : 'none';
    document.getElementById('teacherFields').style.display = this.value === 'TEACHER' ? 'block' : 'none';
  });
</script>
```

---

## 5. 비밀번호 유효성 검사 (선택)

```html
<script>
  document.querySelector('form').addEventListener('submit', function(e) {
    const password = document.querySelector('input[name="password"]').value;
    const passwordConfirm = document.querySelector('input[name="passwordConfirm"]').value;

    if (password.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      e.preventDefault();
      return;
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      e.preventDefault();
      return;
    }
  });
</script>
```

---

## 6. 소셜 로그인 연동 (나중에)

카카오 로그인:
```html
<a th:href="@{/oauth2/authorization/kakao}" class="btn-kakao">
  <!-- ... -->
</a>
```

Google 로그인:
```html
<a th:href="@{/oauth2/authorization/google}" class="btn-social">
  <!-- ... -->
</a>
```

---

## 구현 우선순위

1. **필수**: 이메일 가입 폼 + 서버 연동
2. **필수**: 에러/성공 메시지
3. **권장**: 비밀번호 유효성 검사
4. **선택**: 역할별 추가 필드
5. **나중에**: 소셜 로그인 OAuth 연동
