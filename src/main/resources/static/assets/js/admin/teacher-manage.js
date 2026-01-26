/**
 * 교사 관리 페이지 전용 스크립트
 */

// 1. 정보 수정 모달 오픈 및 데이터 바인딩
function openEditModal(teacher) {
  // 폼 요소 가져오기
  const form = document.querySelector("#editTeacherModal form");

  // 데이터 바인딩 (ID 기반)
  // 안전하게 요소가 있는지 확인 후 값 할당 (선택적)
  // 코드 더러워서 수정 예정
  if (document.getElementById("edit-uid"))
    document.getElementById("edit-uid").value = teacher.uid;
  if (document.getElementById("edit-name"))
    document.getElementById("edit-name").value = teacher.name;
  if (document.getElementById("edit-email"))
    document.getElementById("edit-email").value = teacher.email;
  if (document.getElementById("edit-subject"))
    document.getElementById("edit-subject").value = teacher.subject;
  if (document.getElementById("edit-department"))
    document.getElementById("edit-department").value = teacher.department;
  if (document.getElementById("edit-position"))
    document.getElementById("edit-position").value = teacher.position;
  if (document.getElementById("edit-status"))
    document.getElementById("edit-status").value = teacher.statusName;

  // 부트스트랩 모달 띄우기
  const modalEl = document.getElementById("editTeacherModal");
  if (modalEl) {
    const editModal = new bootstrap.Modal(modalEl);
    editModal.show();
  }
}

// 2. 삭제 확인 창
function confirmDelete(uid) {
  if (confirm("정말로 이 계정을 삭제하시겠습니까?")) {
    location.href = `/parkjoon/admin/teachers/delete/${uid}`;
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

  fetch("/parkjoon/admin/teachers/import-csv", {
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
