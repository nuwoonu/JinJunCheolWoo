/**
 * 교사 관리 페이지 전용 스크립트
 */

// 1. 정보 수정 모달 오픈 및 데이터 바인딩
function openEditModal(teacher) {
  // 폼 요소 가져오기
  const form = document.querySelector("#editTeacherModal form");

  // 데이터 바인딩 (ID 기반)
  document.getElementById("edit-uid").value = teacher.uid;
  document.getElementById("edit-name").value = teacher.name;
  document.getElementById("edit-email").value = teacher.email;
  document.getElementById("edit-subject").value = teacher.subject;
  document.getElementById("edit-department").value = teacher.department;
  document.getElementById("edit-position").value = teacher.position;
  document.getElementById("edit-status").value = teacher.statusName;

  // 부트스트랩 모달 띄우기
  const editModal = new bootstrap.Modal(
    document.getElementById("editTeacherModal")
  );
  editModal.show();
}

// 2. 삭제(또는 상태변경) 확인 창 (필요 시 확장)
function confirmDelete(uid) {
  if (confirm("정말로 이 계정을 삭제하시겠습니까?")) {
    location.href = `/parkjoon/admin/teachers/delete/${uid}`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // 모든 모달 요소에 대해
  const modals = document.querySelectorAll(".modal");

  modals.forEach((modal) => {
    // 💡 모달이 숨겨지기 시작할 때 (hide.bs.modal)
    modal.addEventListener("hide.bs.modal", function () {
      // 현재 포커스된 요소가 모달 내부에 있다면 강제로 포커스 해제
      if (modal.contains(document.activeElement)) {
        document.activeElement.blur(); // 포커스 강제 해제
      }
    });

    // 💡 모달이 완전히 숨겨졌을 때 (hidden.bs.modal)
    modal.addEventListener("hidden.bs.modal", function () {
      // 포커스를 본문의 안전한 곳(body)으로 강제 이동
      document.body.focus();
    });
  });
});
