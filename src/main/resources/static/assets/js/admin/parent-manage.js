/**
 * 학부모 관리 페이지 스크립트
 */

document.addEventListener("DOMContentLoaded", function () {
  // 상세 페이지 초기화 (ID가 있는 경우 자동 실행)
  const detailContainer = document.getElementById("parent-detail-container");
  if (detailContainer) {
    const parentId = detailContainer.dataset.parentId;
    if (parentId) initParentDetail(parentId);
  }

  // 등록 페이지 초기화
  const createContainer = document.getElementById("parent-create-container");
  if (createContainer) {
    initParentCreate();
  }
});

/**
 * CSV 일괄 업로드 처리
 */
function uploadParentCsv() {
  uploadCsv(
    "/parkjoon/admin/parents/import-csv",
    "CSV 파일을 통해 학부모를 일괄 등록하시겠습니까?\n(형식: 이름,이메일,비밀번호,연락처)",
    "일괄 등록이 완료되었습니다.",
  );
}

/**
 * 일괄 상태 변경
 */
function updateStatusBulk(statusName, statusLabel) {
  performBulkStatusUpdate(
    "/parkjoon/admin/parents/bulk-status",
    statusName,
    statusLabel,
    ".parent-checkbox",
    "ids",
  );
}

// --- 학생 검색 및 연동 관련 로직 ---

function openStudentSearchModal() {
  const modalEl = document.getElementById("studentSearchModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  document.getElementById("studentSearchKeyword").value = "";
  document.getElementById("studentSearchResult").innerHTML =
    '<div class="text-center text-muted py-3">검색어를 입력하세요.</div>';
  modal.show();
}

function searchStudents() {
  const keyword = document.getElementById("studentSearchKeyword").value;
  if (!keyword.trim()) {
    alert("검색어를 입력해주세요.");
    return;
  }

  fetch(
    `/parkjoon/admin/parents/search-student?keyword=${encodeURIComponent(keyword)}`,
  )
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("studentSearchResult");
      list.innerHTML = "";

      if (data.length === 0) {
        list.innerHTML =
          '<div class="text-center text-muted py-3">검색 결과가 없습니다.</div>';
        return;
      }

      data.forEach((s) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
        item.innerHTML = `
          <div>
            <span class="fw-bold">${s.name}</span>
            <small class="text-muted ms-2">${s.code || "-"}</small>
            <div class="small text-secondary">${s.latestClass || "소속 정보 없음"}</div>
          </div>
          <span class="badge bg-primary rounded-pill">선택</span>
        `;
        item.onclick = () => {
          if (typeof onStudentSelected === "function") {
            onStudentSelected(s);
          }
        };
        list.appendChild(item);
      });
    })
    .catch((err) => console.error(err));
}

// --- 상세 페이지 관련 로직 ---
let detailParentId = null;
let relationModal = null;

/**
 * 학부모 상세 페이지 초기화
 * @param {number} id - 학부모 ID
 */
function initParentDetail(id) {
  detailParentId = id;

  // 1. 탭 상태 유지
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

  // 2. 관계 설정 모달 초기화
  const modalEl = document.getElementById("relationSelectModal");
  if (modalEl) {
    relationModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  }

  // 3. 학생 검색 후 선택 시 콜백 (상세 페이지용)
  window.onStudentSelected = function (student) {
    // 관계 선택 모달 UI 설정
    document.getElementById("relationTargetName").innerText =
      student.name + " 학생과의 관계";
    document.getElementById("relationTargetUid").value = student.uid;
    document.getElementById("relationActionType").value = "ADD";
    document.getElementById("relationSelect").value = "FATHER"; // 기본값

    // 검색 모달 닫고 관계 모달 열기
    const searchModalEl = document.getElementById("studentSearchModal");
    if (searchModalEl) {
      bootstrap.Modal.getInstance(searchModalEl).hide();
    }

    if (relationModal) relationModal.show();
  };
}

/**
 * 관계 수정 모달 열기
 */
function openEditRelationModal(uid, name, currentCode) {
  const targetNameEl = document.getElementById("relationTargetName");
  if (targetNameEl) {
    targetNameEl.innerText = name + " 학생과의 관계 수정";
    document.getElementById("relationTargetUid").value = uid;
    document.getElementById("relationActionType").value = "EDIT";
    document.getElementById("relationSelect").value = currentCode;
  } else {
    console.error("관계 설정 모달 요소를 찾을 수 없습니다.");
  }
  if (relationModal) relationModal.show();
}

/**
 * 관계 설정 확인 (추가 또는 수정 실행)
 */
function confirmRelation() {
  if (!detailParentId) return;

  const uid = document.getElementById("relationTargetUid").value;
  const type = document.getElementById("relationActionType").value;
  const relation = document.getElementById("relationSelect").value;

  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  let url = "";
  let successMsg = "";

  if (type === "ADD") {
    url = `/parkjoon/admin/parents/${detailParentId}/add-child?studentUid=${uid}&relationship=${relation}`;
    successMsg = "자녀가 추가되었습니다.";
  } else {
    url = `/parkjoon/admin/parents/${detailParentId}/update-child-relation?studentUid=${uid}&relationship=${relation}`;
    successMsg = "관계가 수정되었습니다.";
  }

  fetch(url, {
    method: "POST",
    headers: { [header]: token },
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
    .catch(() => alert("서버 통신 오류"));
}

/**
 * 자녀 연동 해제
 */
function removeChild(pId, sUid) {
  if (!confirm("정말 연동을 해제하시겠습니까?")) return;

  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(`/parkjoon/admin/parents/${pId}/remove-child?studentUid=${sUid}`, {
    method: "POST",
    headers: { [header]: token },
  }).then(async (res) => {
    if (res.ok) {
      alert("해제되었습니다.");
      location.reload();
    } else {
      alert("해제 실패");
    }
  });
}

// --- 등록 페이지 관련 로직 ---
let createStudentIndex = 0;
let createTempSelectedStudent = null;

function initParentCreate() {
  const modalEl = document.getElementById("relationSelectModal");
  if (modalEl) {
    relationModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  }

  window.onStudentSelected = function (student) {
    // 이미 선택된 학생인지 확인
    if (document.getElementById(`student-input-${student.uid}`)) {
      alert("이미 추가된 학생입니다.");
      return;
    }

    // 임시 저장 및 관계 모달 오픈
    createTempSelectedStudent = student;
    document.getElementById("relationTargetName").innerText =
      student.name + " 학생과의 관계";
    document.getElementById("relationSelect").value = "FATHER"; // 기본값

    const searchModalEl = document.getElementById("studentSearchModal");
    if (searchModalEl) {
      bootstrap.Modal.getInstance(searchModalEl).hide();
    }
    if (relationModal) relationModal.show();
  };
}

function confirmRelationAdd() {
  const student = createTempSelectedStudent;
  if (!student) return;

  const relationCode = document.getElementById("relationSelect").value;
  const relationSelect = document.getElementById("relationSelect");
  const relationText =
    relationSelect.options[relationSelect.selectedIndex].text;

  document.getElementById("noStudentMsg").style.display = "none";

  // UI 추가
  const container = document.getElementById("selectedStudentsContainer");
  const badge = document.createElement("span");
  badge.className = "badge bg-white text-dark border me-2 mb-2 p-2";
  badge.id = `student-badge-${student.uid}`;
  badge.innerHTML = `${student.name} (${relationText}) <i class="bi bi-x-circle ms-2 text-danger" style="cursor:pointer" onclick="removeStudent(${student.uid})"></i>`;
  container.appendChild(badge);

  // Hidden Input 추가 (List 바인딩을 위한 인덱스 사용)
  const inputs = document.getElementById("hiddenInputsContainer");
  const inputHtml = `<div id="student-input-${student.uid}"><input type="hidden" name="students[${createStudentIndex}].studentId" value="${student.uid}"><input type="hidden" name="students[${createStudentIndex}].relationship" value="${relationCode}"></div>`;
  inputs.insertAdjacentHTML("beforeend", inputHtml);
  createStudentIndex++;

  if (relationModal) relationModal.hide();
}

function removeStudent(uid) {
  const badge = document.getElementById(`student-badge-${uid}`);
  if (badge) badge.remove();

  const input = document.getElementById(`student-input-${uid}`);
  if (input) input.remove();

  const container = document.getElementById("selectedStudentsContainer");
  // 컨테이너에 남은 자식 요소가 1개(noStudentMsg) 이하이면 메시지 표시
  // (badge가 span이므로 span 개수로 체크하는 것이 더 안전할 수 있음)
  if (container.querySelectorAll("span.badge").length === 0) {
    document.getElementById("noStudentMsg").style.display = "block";
  }
}
