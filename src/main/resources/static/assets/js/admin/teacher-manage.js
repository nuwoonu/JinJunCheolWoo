/**
 * 교사 관리 페이지 전용 스크립트
 */

// 2. 삭제 확인 창
function confirmDelete(uid) {
  if (confirm("정말로 이 계정을 삭제하시겠습니까?")) {
    location.href = `/parkjoon/admin/teachers/delete/${uid}`;
  }
}

// 3. 페이지 로드 후 실행되는 초기화 로직 (순수 JS로 통일)
document.addEventListener("DOMContentLoaded", function () {});

function uploadCsvFile() {
  uploadCsv(
    "/parkjoon/admin/teachers/import-csv",
    "선택한 CSV 파일로 교사를 대량 등록하시겠습니까?",
    "교사 등록이 완료되었습니다.",
  );
}

/**
 * 일괄 상태 변경
 */
function updateStatusBulk(statusName, statusLabel) {
  performBulkStatusUpdate(
    "/parkjoon/admin/teachers/bulk-status",
    statusName,
    statusLabel,
    ".teacher-checkbox",
    "uids",
  );
}
