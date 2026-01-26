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
});

/**
 * 학적 이력 모달 제어 (추가/수정 모드 통합)
 */
function openEditAssignmentModal(year, grade, classNum, studentNum) {
  const modalElement = document.getElementById("addAssignmentModal");
  const title = document.getElementById("assignmentModalTitle");
  const btnDelete = document.getElementById("btnDeleteAssignment");
  const yearInput = document.getElementById("modalSchoolYear");

  if (year) {
    // [수정 모드]
    title.innerText = "📝 학급 배정 수정";
    yearInput.value = year;
    yearInput.readOnly = true; // 학년도는 기준점이므로 수정 방지
    modalElement.querySelector('input[name="grade"]').value = grade;
    modalElement.querySelector('input[name="classNum"]').value = classNum;
    modalElement.querySelector('input[name="studentNum"]').value = studentNum;
    if (btnDelete) btnDelete.style.display = "block"; // 삭제 버튼 노출
  } else {
    // [신규 추가 모드]
    title.innerText = "🎓 새 학급 배정 추가";
    yearInput.value = new Date().getFullYear();
    yearInput.readOnly = false;
    if (btnDelete) btnDelete.style.display = "none"; // 삭제 버튼 숨김
  }

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
  const year = document.getElementById("modalSchoolYear").value;
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
