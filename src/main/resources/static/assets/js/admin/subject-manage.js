/**
 * 교과목 관리 페이지 스크립트
 */

function openCreateModal() {
  const modalEl = document.getElementById("subjectModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "과목 등록";
  document.getElementById("subjectForm").action =
    "/parkjoon/admin/master/subjects/create";
  document.getElementById("originCode").value = "";
  document.getElementById("subjectCode").value = "";
  document.getElementById("subjectName").value = "";

  modal.show();
}

function openUpdateModal(code, name) {
  const modalEl = document.getElementById("subjectModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "과목 수정";
  document.getElementById("subjectForm").action =
    "/parkjoon/admin/master/subjects/update";
  document.getElementById("originCode").value = code;
  document.getElementById("subjectCode").value = code;
  document.getElementById("subjectName").value = name;

  modal.show();
}
