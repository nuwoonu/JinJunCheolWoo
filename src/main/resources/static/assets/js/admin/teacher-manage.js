/**
 * 교사 관리 페이지 전용 스크립트
 */

// 1. 정보 수정 모달 오픈 및 데이터 바인딩
function openEditModal(teacher) {
  const modalEl = document.getElementById("editTeacherModal");
  if (!modalEl) return;

  // 모달 내부의 모든 input/select 요소를 찾아서 teacher의 필드와 매칭
  modalEl.querySelectorAll("[name]").forEach((el) => {
    const key = el.getAttribute("name");
    if (teacher[key] !== undefined) {
      el.value = teacher[key];
    }
  });

  new bootstrap.Modal(modalEl).show();
}

// 2. 삭제 확인 창
function confirmDelete(uid) {
  if (confirm("정말로 이 계정을 삭제하시겠습니까?")) {
    location.href = `${ADMIN_URLS.ADMIN_TEACHERS}/delete/${uid}`;
  }
}

// 3. 페이지 로드 후 실행되는 초기화 로직 (순수 JS로 통일)
document.addEventListener("DOMContentLoaded", function () {
  // --- [A] 모달 포커스 관련 처리 ---
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("hide.bs.modal", function () {
      if (modal.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
    modal.addEventListener("hidden.bs.modal", function () {
      document.body.focus();
    });
  });

  // --- [B] 퇴직자 포함 토글 스위치 처리 (jQuery -> Vanilla JS 변환됨) ---
  const switchEl = document.getElementById("includeRetiredSwitch");
  const hiddenInput = document.getElementById("includeRetiredHidden");
  const searchForm = document.getElementById("searchForm");

  // 요소들이 실제로 존재하는지 확인 후 이벤트 연결
  if (switchEl && hiddenInput && searchForm) {
    switchEl.addEventListener("change", function () {
      // 1. 스위치 상태(true/false) 가져오기
      const isChecked = this.checked;

      // 2. hidden input 값 업데이트
      hiddenInput.value = isChecked;

      // 3. 폼 제출
      searchForm.submit();
    });
  }

  // --- [C] 탭 상태 유지 로직 ---
  const hash = window.location.hash;
  if (hash) {
    const triggerEl = document.querySelector(`.nav-link[href="${hash}"]`);
    if (triggerEl) {
      bootstrap.Tab.getOrCreateInstance(triggerEl).show();
    }
  }
  const tabLinks = document.querySelectorAll('a[data-bs-toggle="tab"]');
  tabLinks.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", function (event) {
      const href = event.target.getAttribute("href");
      if (href) {
        history.replaceState(null, null, href);
      }
    });
  });
});

function uploadCsvFile() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput.files.length) return;

  // CSRF 토큰 추출
  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  if (!confirm("선택한 CSV 파일로 교사를 대량 등록하시겠습니까?")) return;

  // [추가] 로딩 오버레이 표시
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.remove("d-none");
  overlay.classList.add("d-flex"); // Bootstrap d-flex로 중앙 정렬 유지

  fetch(`${ADMIN_URLS.ADMIN_TEACHERS}/import-csv`, {
    method: "POST",
    headers: {
      [header]: token,
    },
    body: formData,
  })
    .then((res) => {
      if (res.ok) {
        alert("교사 등록이 완료되었습니다.");
        location.reload();
      } else {
        res.text().then((text) => alert("오류 발생: " + text));
        // 에러 발생 시 오버레이 해제
        overlay.classList.add("d-none");
        overlay.classList.remove("d-flex");
      }
    })
    .catch((err) => {
      console.error("네트워크 에러:", err);
      alert("서버 통신 중 에러가 발생했습니다.");
      // 에러 발생 시 오버레이 해제
      overlay.classList.add("d-none");
      overlay.classList.remove("d-flex");
    });
}
