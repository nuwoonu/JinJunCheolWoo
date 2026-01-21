/**
 * 학생 관리 페이지 통합 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {
  // --- [1] 서버 메시지 알림 처리 ---
  // HTML body의 data-error-message, data-success-message 속성을 읽음
  const msgContainer = document.body;
  const errorMsg = msgContainer.dataset.errorMessage;
  const successMsg = msgContainer.dataset.successMessage;

  if (errorMsg && errorMsg !== "null") alert(errorMsg);
  if (successMsg && successMsg !== "null") alert(successMsg);

  // --- [2] 미재학생 포함 스위치 제어 (목록 페이지) ---
  const inactiveSwitch = document.getElementById("includeInactiveSwitch");
  if (inactiveSwitch) {
    inactiveSwitch.addEventListener("change", function () {
      const hiddenInput = document.getElementById("includeInactiveHidden");
      if (hiddenInput) {
        hiddenInput.value = this.checked;
        document.getElementById("searchForm").submit();
      }
    });
  }

  // --- [3] 모든 모달 공통 포커스 및 초기화 관리 (이벤트 위임) ---
  // 모달이 닫힐 때 포커스 해제
  document.addEventListener("hide.bs.modal", function (event) {
    if (event.target.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });

  // 모달이 완전히 닫힌 후 바디에 포커스 반환 및 폼 리셋
  document.addEventListener("hidden.bs.modal", function (event) {
    document.body.focus();
    const form = event.target.querySelector("form");
    if (form) form.reset();
  });

  // --- [4] 탭 상태 유지 (Hash 기반) ---
  // 1. 페이지 로드 시 URL 해시가 있으면 해당 탭 활성화
  const hash = window.location.hash;
  if (hash) {
    const triggerEl = document.querySelector(`.nav-link[href="${hash}"]`);
    if (triggerEl) {
      bootstrap.Tab.getOrCreateInstance(triggerEl).show();
    }
  }

  // 2. 탭 클릭 시 URL 해시 업데이트 (새로고침 대비)
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

/**
 * [1] 학적 이력 추가 모달 열기
 */
function openCreateAssignmentModal() {
  const modalElement = document.getElementById("createAssignmentModal");
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

/**
 * [2] 학적 이력 수정 모달 열기 (데이터 바인딩)
 */
function openUpdateAssignmentModal(year, grade, classNum, studentNum) {
  const modalElement = document.getElementById("updateAssignmentModal");

  // 수정 모달의 각 필드에 값 주입
  document.getElementById("updateSchoolYear").value = year;
  document.getElementById("updateGrade").value = grade;
  document.getElementById("updateClassNum").value = classNum;
  document.getElementById("updateStudentNum").value = studentNum;

  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

/**
 * 테이블 옆 '삭제' 버튼 클릭 시 호출 (인라인 삭제)
 */
function deleteAssignmentInline(year) {
  if (confirm(`${year}학년도 배정 기록을 삭제하시겠습니까?`)) {
    submitDeleteAssignment(year);
  }
}

/**
 * 모달 내부 '삭제' 버튼 클릭 시 호출
 */
function deleteAssignmentFromModal() {
  const year = document.getElementById("updateSchoolYear").value;
  if (confirm(`${year}학년도 배정 기록을 삭제하시겠습니까?`)) {
    submitDeleteAssignment(year);
  }
}

/**
 * 공통 삭제 실행 함수 (히든 폼 제출)
 */
function submitDeleteAssignment(year) {
  const deleteForm = document.getElementById("deleteAssignmentForm");
  const deleteInput = document.getElementById("deleteSchoolYear");

  if (deleteForm && deleteInput) {
    deleteInput.value = year;
    deleteForm.submit();
  } else {
    alert("삭제 처리를 위한 폼을 찾을 수 없습니다.");
  }
}

/**
 * CSV 일괄 업로드 처리
 */
function uploadStudentCsv() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput || !fileInput.files.length) return;

  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  if (!token || !header) {
    alert("보안 토큰이 누락되었습니다. 페이지를 새로고침하세요.");
    return;
  }

  if (!confirm("CSV 파일을 통해 학생을 일괄 등록하시겠습니까?")) {
    fileInput.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const overlay = document.getElementById("loadingOverlay");
  overlay?.classList.replace("d-none", "d-flex");

  fetch("/parkjoon/admin/students/import-csv", {
    method: "POST",
    headers: { [header]: token },
    body: formData,
  })
    .then(async (res) => {
      if (res.ok) {
        alert("일괄 등록이 완료되었습니다.");
        location.reload();
      } else {
        const errorText = await res.text();
        alert("등록 실패: " + errorText);
      }
    })
    .catch(() => alert("서버 통신 중 에러가 발생했습니다."))
    .finally(() => {
      overlay?.classList.replace("d-flex", "d-none");
      fileInput.value = "";
    });
}

/**
 * [5] 체크박스 전체 선택/해제
 * HTML: <input type="checkbox" onclick="toggleAllCheckboxes(this)">
 */
function toggleAllCheckboxes(source) {
  const checkboxes = document.querySelectorAll(".student-checkbox");
  checkboxes.forEach((cb) => (cb.checked = source.checked));
}

/**
 * [6] 일괄 상태 변경 요청
 * 예: updateStatusBulk('GRADUATED', '졸업')
 */
function updateStatusBulk(statusName, statusLabel) {
  const checkboxes = document.querySelectorAll(".student-checkbox:checked");
  if (checkboxes.length === 0) {
    alert("선택된 학생이 없습니다.");
    return;
  }

  if (
    !confirm(
      `선택한 ${checkboxes.length}명의 학생을 '${statusLabel}' 상태로 변경하시겠습니까?`,
    )
  ) {
    return;
  }

  const uids = Array.from(checkboxes).map((cb) => cb.value);
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  const params = new URLSearchParams();
  uids.forEach((uid) => params.append("uids", uid));
  params.append("status", statusName);

  fetch("/parkjoon/admin/students/bulk-status", {
    method: "POST",
    headers: {
      [header]: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })
    .then(async (res) => {
      if (res.ok) {
        alert("변경되었습니다.");
        location.reload();
      } else {
        const text = await res.text();
        alert("실패: " + text);
      }
    })
    .catch(() => alert("서버 통신 오류"));
}
