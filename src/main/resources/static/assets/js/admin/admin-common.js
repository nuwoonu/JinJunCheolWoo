/**
 * Admin Common Utilities
 * 관리자 페이지 공통 스크립트 (알림, CSV, 체크박스 등)
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. 서버 메시지 알림 처리 (data-error-message, data-success-message)
  const msgContainer = document.body;
  if (msgContainer) {
    const errorMsg = msgContainer.dataset.errorMessage;
    const successMsg = msgContainer.dataset.successMessage;

    if (errorMsg && errorMsg !== "null") alert(errorMsg);
    if (successMsg && successMsg !== "null") alert(successMsg);
  }

  // 2. 모달 포커스 및 폼 초기화 관리 (Bootstrap 공통)
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    // 모달 닫힐 때 포커스 해제
    modal.addEventListener("hide.bs.modal", function (event) {
      if (event.target.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
    // 모달 닫힌 후 바디 포커스 및 폼 리셋
    modal.addEventListener("hidden.bs.modal", function (event) {
      document.body.focus();
      const form = event.target.querySelector("form");
      if (form) form.reset();
    });
  });
});

/**
 * 공통 CSV 일괄 업로드
 * @param {string} url - 업로드 요청 URL
 * @param {string} confirmMsg - 확인 메시지
 * @param {string} successMsg - 성공 메시지
 */
function uploadCsv(url, confirmMsg, successMsg) {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput || !fileInput.files.length) return;

  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  if (!token || !header) {
    alert("보안 토큰이 누락되었습니다. 페이지를 새로고침하세요.");
    return;
  }

  if (!confirm(confirmMsg)) {
    fileInput.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const overlay = document.getElementById("loadingOverlay");
  overlay?.classList.replace("d-none", "d-flex");

  fetch(url, {
    method: "POST",
    headers: { [header]: token },
    body: formData,
  })
    .then(async (res) => {
      if (res.ok) {
        alert(successMsg);
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
 * 체크박스 전체 선택/해제
 * @param {HTMLInputElement} source - 전체 선택 체크박스 요소 (this)
 * @param {string} targetClass - 제어할 체크박스들의 클래스명 (예: '.student-checkbox')
 */
function toggleCheckboxes(source, targetClass) {
  const checkboxes = document.querySelectorAll(targetClass);
  checkboxes.forEach((cb) => (cb.checked = source.checked));
}

/**
 * 공통 일괄 상태 변경 요청
 * @param {string} url - 요청 URL
 * @param {string} statusName - 변경할 상태 코드 (ENUM)
 * @param {string} statusLabel - 변경할 상태 한글명 (표시용)
 * @param {string} checkboxClass - 체크박스 클래스명
 * @param {string} idParamName - 서버로 보낼 ID 파라미터명 (기본값: 'ids')
 */
function performBulkStatusUpdate(
  url,
  statusName,
  statusLabel,
  checkboxClass,
  idParamName = "ids",
) {
  const checkboxes = document.querySelectorAll(checkboxClass + ":checked");
  if (checkboxes.length === 0) {
    alert("선택된 항목이 없습니다.");
    return;
  }

  if (
    !confirm(
      `선택한 ${checkboxes.length}명의 상태를 '${statusLabel}'(으)로 변경하시겠습니까?`,
    )
  ) {
    return;
  }

  const ids = Array.from(checkboxes).map((cb) => cb.value);
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  const params = new URLSearchParams();
  ids.forEach((id) => params.append(idParamName, id));
  params.append("status", statusName);

  fetch(url, {
    method: "POST",
    headers: {
      [header]: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })
    .then(async (res) => {
      if (res.ok) {
        alert("상태가 변경되었습니다.");
        location.reload();
      } else {
        const text = await res.text();
        alert("변경 실패: " + text);
      }
    })
    .catch(() => alert("서버 통신 오류가 발생했습니다."));
}
