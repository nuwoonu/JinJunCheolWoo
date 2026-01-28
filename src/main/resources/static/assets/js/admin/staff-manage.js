/**
 * 교직원 관리 페이지 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {
  // 탭 상태 유지 로직
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
  uploadCsv(
    "/parkjoon/admin/staffs/import-csv",
    "선택한 CSV 파일로 교직원을 대량 등록하시겠습니까?\n(형식: 이름,이메일,비밀번호,사번,부서,직함,근무지,내선번호)",
    "교직원 등록이 완료되었습니다.",
  );
}

function updateStatusBulk(statusName, statusLabel) {
  performBulkStatusUpdate(
    "/parkjoon/admin/staffs/bulk-status",
    statusName,
    statusLabel,
    ".staff-checkbox",
    "uids",
  );
}
