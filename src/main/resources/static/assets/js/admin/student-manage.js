/**
 * 학생 관리 페이지 통합 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {
  // 서버 메시지 및 모달 처리는 admin-common.js에서 자동 수행됨
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
  uploadCsv(
    "/parkjoon/admin/students/import-csv",
    "CSV 파일을 통해 학생을 일괄 등록하시겠습니까?",
    "일괄 등록이 완료되었습니다.",
  );
}

/**
 * [6] 일괄 상태 변경 요청
 * 예: updateStatusBulk('GRADUATED', '졸업')
 */
function updateStatusBulk(statusName, statusLabel) {
  performBulkStatusUpdate(
    "/parkjoon/admin/students/bulk-status",
    statusName,
    statusLabel,
    ".student-checkbox",
    "uids",
  );
}

// --- [7] 보호자 검색 및 연동 로직 (상세/등록 공용) ---
let parentSearchModal = null;
let relationSelectModal = null;
let tempSelectedParent = null;

// 상세 페이지용 변수
let detailStudentIdNum = null;

// 등록 페이지용 변수
let createGuardianIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
  // 상세 페이지 초기화
  const detailContainer = document.getElementById("student-detail-container");
  if (detailContainer) {
    detailStudentIdNum = detailContainer.dataset.studentIdNum;
  }

  // 모달 초기화
  const searchModalEl = document.getElementById("parentSearchModal");
  if (searchModalEl) parentSearchModal = new bootstrap.Modal(searchModalEl);

  const relationModalEl = document.getElementById("relationSelectModal");
  if (relationModalEl)
    relationSelectModal = new bootstrap.Modal(relationModalEl);
});

function openParentSearchModal() {
  document.getElementById("parentSearchKeyword").value = "";
  document.getElementById("parentSearchResult").innerHTML =
    '<div class="text-center text-muted py-3">검색어를 입력하세요.</div>';
  if (parentSearchModal) parentSearchModal.show();
}

function searchParents() {
  const keyword = document.getElementById("parentSearchKeyword").value;
  if (!keyword.trim()) {
    alert("검색어를 입력해주세요.");
    return;
  }

  fetch(
    `/parkjoon/admin/students/search-parent?keyword=${encodeURIComponent(keyword)}`,
  )
    .then((res) => res.json())
    .then((page) => {
      const list = document.getElementById("parentSearchResult");
      list.innerHTML = "";

      if (page.content.length === 0) {
        list.innerHTML =
          '<div class="text-center text-muted py-3">검색 결과가 없습니다.</div>';
        return;
      }

      page.content.forEach((p) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
        item.innerHTML = `
          <div>
            <span class="fw-bold">${p.name}</span>
            <small class="text-muted ms-2">${p.phone}</small>
          </div>
          <span class="badge bg-primary rounded-pill">선택</span>
        `;
        item.onclick = () => onParentSelected(p);
        list.appendChild(item);
      });
    })
    .catch((err) => console.error(err));
}

function onParentSelected(parent) {
  // 중복 체크 (등록 페이지)
  if (document.getElementById(`guardian-input-${parent.id}`)) {
    alert("이미 추가된 보호자입니다.");
    return;
  }

  tempSelectedParent = parent;
  document.getElementById("relationTargetName").innerText =
    parent.name + "님과의 관계";
  document.getElementById("relationTargetId").value = parent.id;
  document.getElementById("relationActionType").value = "ADD";
  document.getElementById("relationSelect").value = "FATHER"; // 기본값

  if (parentSearchModal) parentSearchModal.hide();
  if (relationSelectModal) relationSelectModal.show();
}

function openEditRelationModal(parentId, name, currentCode) {
  document.getElementById("relationTargetName").innerText =
    name + "님과의 관계 수정";
  document.getElementById("relationTargetId").value = parentId;
  document.getElementById("relationActionType").value = "EDIT";
  document.getElementById("relationSelect").value = currentCode;

  if (relationSelectModal) relationSelectModal.show();
}

function confirmGuardianRelation() {
  const type = document.getElementById("relationActionType").value || "ADD";
  const relationCode = document.getElementById("relationSelect").value;

  if (detailStudentIdNum) {
    // [상세 페이지] 즉시 서버 전송
    if (type === "ADD") {
      if (tempSelectedParent) {
        addGuardianToDetail(tempSelectedParent.id, relationCode);
      }
    } else {
      const parentId = document.getElementById("relationTargetId").value;
      updateGuardianRelation(parentId, relationCode);
    }
  } else {
    // [등록 페이지] UI에 추가
    if (tempSelectedParent) {
      const relationText =
        document.getElementById("relationSelect").options[
          document.getElementById("relationSelect").selectedIndex
        ].text;
      addGuardianToCreateUI(tempSelectedParent, relationCode, relationText);
    }
  }

  if (relationSelectModal) relationSelectModal.hide();
}

// [상세 페이지] 서버 전송
function addGuardianToDetail(parentId, relation) {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(
    `/parkjoon/admin/students/${detailStudentIdNum}/add-guardian?parentId=${parentId}&relationship=${relation}`,
    {
      method: "POST",
      headers: { [header]: token },
    },
  ).then(async (res) => {
    if (res.ok) {
      alert("보호자가 추가되었습니다.");
      location.reload();
    } else {
      alert("추가 실패");
    }
  });
}

// [상세 페이지] 관계 수정
function updateGuardianRelation(parentId, relation) {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(
    `/parkjoon/admin/students/${detailStudentIdNum}/update-guardian-relation?parentId=${parentId}&relationship=${relation}`,
    {
      method: "POST",
      headers: { [header]: token },
    },
  ).then(async (res) => {
    if (res.ok) {
      alert("관계가 수정되었습니다.");
      location.reload();
    } else {
      alert("수정 실패");
    }
  });
}

// [상세 페이지] 연동 해제
function removeGuardian(parentId) {
  if (!confirm("정말 연동을 해제하시겠습니까?")) return;
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(
    `/parkjoon/admin/students/${detailStudentIdNum}/remove-guardian?parentId=${parentId}`,
    {
      method: "POST",
      headers: { [header]: token },
    },
  ).then(async (res) => {
    if (res.ok) {
      alert("해제되었습니다.");
      location.reload();
    } else {
      alert("해제 실패");
    }
  });
}

// [등록 페이지] UI 추가
function addGuardianToCreateUI(parent, relationCode, relationText) {
  document.getElementById("noGuardianMsg").style.display = "none";
  const container = document.getElementById("selectedGuardiansContainer");
  const badge = document.createElement("span");
  badge.className = "badge bg-white text-dark border me-2 mb-2 p-2";
  badge.id = `guardian-badge-${parent.id}`;
  badge.innerHTML = `${parent.name} (${relationText}) <i class="bi bi-x-circle ms-2 text-danger" style="cursor:pointer" onclick="removeGuardianUI(${parent.id})"></i>`;
  container.appendChild(badge);

  const inputs = document.getElementById("hiddenInputsContainer");
  const inputHtml = `<div id="guardian-input-${parent.id}"><input type="hidden" name="guardians[${createGuardianIndex}].parentId" value="${parent.id}"><input type="hidden" name="guardians[${createGuardianIndex}].relationship" value="${relationCode}"></div>`;
  inputs.insertAdjacentHTML("beforeend", inputHtml);
  createGuardianIndex++;
}

function removeGuardianUI(parentId) {
  document.getElementById(`guardian-badge-${parentId}`).remove();
  document.getElementById(`guardian-input-${parentId}`).remove();
  const container = document.getElementById("selectedGuardiansContainer");
  if (container.querySelectorAll("span.badge").length === 0) {
    document.getElementById("noGuardianMsg").style.display = "block";
  }
}
