/**
 * 학생 관리 페이지 통합 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {
  // --- [1] 서버 메시지 알림 처리 ---
  // admin-common.js에서 처리하므로 여기서는 제거함 (중복 방지)

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

  // --- [3] 모달 포커스 관리 ---
  // admin-common.js에서 처리하므로 제거함

  // --- [4] 탭 상태 유지 로직 ---
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

  // --- [5] 페이지별 초기화 ---
  if (document.getElementById("student-detail-container")) {
    initStudentDetail();
  }
  if (document.getElementById("student-create-container")) {
    initStudentCreate();
  }
});

/**
 * 학적 이력 수정 모달 열기 및 데이터 바인딩
 */
function openUpdateAssignmentModal(year, classroomId) {
  const modalEl = document.getElementById("updateAssignmentModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("updateSchoolYear").value = year;

  // 학급 목록 로드
  const select = document.getElementById("updateClassroomId");
  select.innerHTML = '<option value="">로딩 중...</option>';

  fetch(`/parkjoon/admin/students/api/classrooms?year=${year}`)
    .then((res) => res.json())
    .then((data) => {
      select.innerHTML = "";
      data.forEach((c) => {
        const option = new Option(`${c.grade}학년 ${c.classNum}반`, c.cid);
        if (c.cid == classroomId) option.selected = true;
        select.appendChild(option);
      });
    });

  modal.show();
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

// ==========================================
// 보호자 관리 관련 로직 (추가됨)
// ==========================================

// 보호자 검색 모달 열기
function openParentSearchModal() {
  const modalEl = document.getElementById("parentSearchModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  document.getElementById("parentSearchKeyword").value = "";
  document.getElementById("parentSearchResult").innerHTML =
    '<div class="text-center text-muted py-3">검색어를 입력하세요.</div>';
  modal.show();
}

// 보호자 검색 실행 (AJAX)
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
    .then((data) => {
      const list = document.getElementById("parentSearchResult");
      list.innerHTML = "";

      if (!data.content || data.content.length === 0) {
        list.innerHTML =
          '<div class="text-center text-muted py-3">검색 결과가 없습니다.</div>';
        return;
      }

      data.content.forEach((p) => {
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
        item.onclick = () => {
          if (typeof window.onParentSelected === "function") {
            window.onParentSelected(p);
          }
        };
        list.appendChild(item);
      });
    })
    .catch((err) => console.error(err));
}

// 관계 설정 확인 버튼 클릭 시 분기 처리
function confirmGuardianRelation() {
  if (document.getElementById("student-detail-container")) {
    confirmGuardianRelationDetail();
  } else if (document.getElementById("student-create-container")) {
    confirmGuardianRelationCreate();
  }
}

// --- [상세 페이지용] 보호자 관리 로직 ---
function initStudentDetail() {
  window.onParentSelected = function (parent) {
    // 보호자 선택 시 관계 설정 모달 열기
    const modalEl = document.getElementById("relationSelectModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    document.getElementById("relationTargetName").innerText =
      parent.name + " 님과의 관계";
    document.getElementById("relationTargetId").value = parent.id;
    document.getElementById("relationActionType").value = "ADD";

    // 검색 모달 닫기
    const searchModal = bootstrap.Modal.getInstance(
      document.getElementById("parentSearchModal"),
    );
    searchModal.hide();

    modal.show();
  };
}

// 관계 수정 모달 열기 (상세 페이지)
function openEditRelationModal(parentId, parentName, currentRelationCode) {
  const modalEl = document.getElementById("relationSelectModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("relationTargetName").innerText =
    parentName + " 님과의 관계 수정";
  document.getElementById("relationTargetId").value = parentId;
  document.getElementById("relationActionType").value = "EDIT";
  document.getElementById("relationSelect").value = currentRelationCode;

  modal.show();
}

// 관계 설정 저장 (상세 페이지)
function confirmGuardianRelationDetail() {
  const studentCode = document.getElementById("student-detail-container")
    .dataset.studentIdNum;
  const parentId = document.getElementById("relationTargetId").value;
  const relation = document.getElementById("relationSelect").value;
  const actionType = document.getElementById("relationActionType").value;

  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  let url = "";
  let successMsg = "";

  if (actionType === "ADD") {
    url = `/parkjoon/admin/students/${studentCode}/add-guardian`;
    successMsg = "보호자가 추가되었습니다.";
  } else {
    url = `/parkjoon/admin/students/${studentCode}/update-guardian-relation`;
    successMsg = "관계가 수정되었습니다.";
  }

  const formData = new FormData();
  formData.append("parentId", parentId);
  formData.append("relationship", relation);

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
        const text = await res.text();
        alert("처리 실패: " + text);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("서버 통신 오류");
    });
}

// 보호자 연동 해제 (상세 페이지)
function removeGuardian(parentId) {
  if (!confirm("정말 연동을 해제하시겠습니까?")) return;

  const studentCode = document.getElementById("student-detail-container")
    .dataset.studentIdNum;
  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  const formData = new FormData();
  formData.append("parentId", parentId);

  fetch(`/parkjoon/admin/students/${studentCode}/remove-guardian`, {
    method: "POST",
    headers: { [header]: token },
    body: formData,
  })
    .then(async (res) => {
      if (res.ok) {
        alert("연동이 해제되었습니다.");
        location.reload();
      } else {
        const text = await res.text();
        alert("해제 실패: " + text);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("서버 통신 오류");
    });
}

// --- [등록 페이지용] 보호자 관리 로직 ---
let createGuardianIndex = 0;
let createTempSelectedParent = null;

function initStudentCreate() {
  window.onParentSelected = function (parent) {
    // 이미 선택된 보호자인지 확인
    if (document.getElementById(`guardian-input-${parent.id}`)) {
      alert("이미 추가된 보호자입니다.");
      return;
    }

    createTempSelectedParent = parent;

    // 관계 설정 모달 열기
    const modalEl = document.getElementById("relationSelectModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    document.getElementById("relationTargetName").innerText =
      parent.name + " 님과의 관계";
    document.getElementById("relationSelect").value = "FATHER"; // 기본값

    // 검색 모달 닫기
    const searchModal = bootstrap.Modal.getInstance(
      document.getElementById("parentSearchModal"),
    );
    searchModal.hide();

    modal.show();
  };
}

// 관계 설정 저장 (등록 페이지 - UI 추가만 함)
function confirmGuardianRelationCreate() {
  const parent = createTempSelectedParent;
  if (!parent) return;

  const relationCode = document.getElementById("relationSelect").value;
  const relationSelect = document.getElementById("relationSelect");
  const relationText =
    relationSelect.options[relationSelect.selectedIndex].text;

  document.getElementById("noGuardianMsg").style.display = "none";

  // UI 배지 추가
  const container = document.getElementById("selectedGuardiansContainer");
  const badge = document.createElement("span");
  badge.className = "badge bg-white text-dark border me-2 mb-2 p-2";
  badge.id = `guardian-badge-${parent.id}`;
  badge.innerHTML = `${parent.name} (${relationText}) <i class="bi bi-x-circle ms-2 text-danger" style="cursor:pointer" onclick="removeGuardianFromCreate(${parent.id})"></i>`;
  container.appendChild(badge);

  // Hidden Input 추가
  const inputs = document.getElementById("hiddenInputsContainer");
  const inputHtml = `
        <div id="guardian-input-${parent.id}">
            <input type="hidden" name="guardians[${createGuardianIndex}].parentId" value="${parent.id}">
            <input type="hidden" name="guardians[${createGuardianIndex}].relationship" value="${relationCode}">
        </div>`;
  inputs.insertAdjacentHTML("beforeend", inputHtml);
  createGuardianIndex++;

  // 모달 닫기
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("relationSelectModal"),
  );
  modal.hide();
}

// 보호자 제거 (등록 페이지)
function removeGuardianFromCreate(parentId) {
  const badge = document.getElementById(`guardian-badge-${parentId}`);
  if (badge) badge.remove();

  const input = document.getElementById(`guardian-input-${parentId}`);
  if (input) input.remove();

  const container = document.getElementById("selectedGuardiansContainer");
  if (container.querySelectorAll("span.badge").length === 0) {
    document.getElementById("noGuardianMsg").style.display = "block";
  }
}
