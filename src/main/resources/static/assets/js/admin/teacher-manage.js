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
document.addEventListener("DOMContentLoaded", function () {
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
