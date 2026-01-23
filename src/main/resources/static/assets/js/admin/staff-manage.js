/**
 * 교직원 관리 페이지 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {});

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
