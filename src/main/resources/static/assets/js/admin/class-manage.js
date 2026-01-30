/**
 * 학급 관리 페이지 스크립트
 */

let studentSearchModal = null;
let selectedStudents = new Set();
// 등록 페이지용 Set (중복 방지)
let createSelectedStudents = new Set();
let createStudentIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
  const modalEl = document.getElementById("studentSearchModal");
  if (modalEl) {
    studentSearchModal = new bootstrap.Modal(modalEl);
  }
});

function openStudentSearchModal() {
  // 상세 페이지인 경우 초기화 (등록 페이지는 누적)
  if (document.getElementById("class-detail-container")) {
    selectedStudents.clear();
    updateSelectedStudentsUI();
  }

  document.getElementById("studentSearchKeyword").value = "";
  document.getElementById("studentSearchResult").innerHTML =
    '<div class="text-center text-muted py-3">학생을 검색하세요.</div>';

  // 랜덤 배정 입력 초기화
  const randomInput = document.getElementById("randomCountInput");
  if (randomInput) randomInput.value = "";

  if (studentSearchModal) studentSearchModal.show();
}

function searchStudents() {
  const keyword = document.getElementById("studentSearchKeyword").value;
  if (!keyword.trim()) return;

  // 기존 API 재사용 (학부모 관리에서 쓰던 것과 동일)
  fetch(
    `${ADMIN_URLS.ADMIN_PARENTS}/search-student?keyword=${encodeURIComponent(keyword)}`,
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
        const btn = document.createElement("button");
        btn.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
        btn.innerHTML = `<span>${s.name} (${s.code})</span> <i class="bi bi-plus-circle"></i>`;

        // 페이지에 따라 다른 함수 호출
        if (document.getElementById("class-detail-container")) {
          btn.onclick = () => selectStudent(s);
        } else {
          btn.onclick = () => addStudentToCreateUI(s);
        }

        list.appendChild(btn);
      });
    });
}

// --- [상세 페이지용] ---

function selectStudent(student) {
  // 중복 체크
  if ([...selectedStudents].some((s) => s.uid === student.uid)) return;
  selectedStudents.add(student);
  updateSelectedStudentsUI();
}

function updateSelectedStudentsUI() {
  const area = document.getElementById("selectedStudentsArea");
  area.innerHTML = "";
  selectedStudents.forEach((s) => {
    const badge = document.createElement("span");
    badge.className = "badge bg-light text-dark border p-2";
    badge.innerHTML = `${s.name} <i class="bi bi-x text-danger" style="cursor:pointer"></i>`;
    badge.querySelector("i").onclick = () => {
      selectedStudents.delete(s);
      updateSelectedStudentsUI();
    };
    area.appendChild(badge);
  });
}

function confirmAddStudents() {
  const randomCountInput = document.getElementById("randomCountInput");
  const randomCount = randomCountInput ? randomCountInput.value : 0;

  if (selectedStudents.size === 0 && (!randomCount || randomCount <= 0)) {
    alert("배정할 학생을 선택하거나 랜덤 인원 수를 입력해주세요.");
    return;
  }

  const cid = document.getElementById("class-detail-container").dataset.cid;
  const uids = [...selectedStudents].map((s) => s.uid);
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  // FormData로 전송
  const formData = new FormData();
  formData.append("studentUids", uids);
  formData.append("randomCount", randomCount);

  fetch(`${ADMIN_URLS.ADMIN_CLASSES}/${cid}/add-students`, {
    method: "POST",
    headers: { [header]: token },
    body: formData,
  }).then(async (res) => {
    const msg = await res.text();
    if (res.ok) {
      alert(msg);
      location.reload();
    } else {
      alert("배정 실패: " + msg);
    }
  });
}

function removeStudent(uid) {
  if (!confirm("해당 학생을 이 학급에서 제외하시겠습니까?")) return;
  const cid = document.getElementById("class-detail-container").dataset.cid;
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(`${ADMIN_URLS.ADMIN_CLASSES}/${cid}/remove-student?studentUid=${uid}`, {
    method: "POST",
    headers: { [header]: token },
  }).then((res) => (res.ok ? location.reload() : alert("제외 실패")));
}

function toggleAllStudents(source) {
  const checkboxes = document.querySelectorAll(".student-checkbox");
  checkboxes.forEach((cb) => (cb.checked = source.checked));
}

function removeSelectedStudents() {
  const checkboxes = document.querySelectorAll(".student-checkbox:checked");
  if (checkboxes.length === 0) {
    alert("선택된 학생이 없습니다.");
    return;
  }

  if (
    !confirm(
      `선택한 ${checkboxes.length}명의 학생을 이 학급에서 제외하시겠습니까?`,
    )
  )
    return;

  const cid = document.getElementById("class-detail-container").dataset.cid;
  const uids = Array.from(checkboxes).map((cb) => cb.value);
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  const formData = new FormData();
  formData.append("studentUids", uids);

  fetch(`${ADMIN_URLS.ADMIN_CLASSES}/${cid}/remove-students`, {
    method: "POST",
    headers: { [header]: token },
    body: formData,
  }).then((res) => (res.ok ? location.reload() : alert("일괄 제외 실패")));
}

// --- [등록 페이지용] ---

function addStudentToCreateUI(student) {
  if (createSelectedStudents.has(student.uid)) {
    alert("이미 추가된 학생입니다.");
    return;
  }
  createSelectedStudents.add(student.uid);

  document.getElementById("noStudentMsg").style.display = "none";
  const container = document.getElementById("selectedStudentsContainer");

  const badge = document.createElement("span");
  badge.className = "badge bg-white text-dark border me-2 mb-2 p-2";
  badge.id = `create-student-badge-${student.uid}`;
  badge.innerHTML = `${student.name} (${student.code}) <i class="bi bi-x-circle ms-2 text-danger" style="cursor:pointer"></i>`;

  badge.querySelector("i").onclick = () => {
    createSelectedStudents.delete(student.uid);
    badge.remove();
    document.getElementById(`create-student-input-${student.uid}`).remove();
    if (createSelectedStudents.size === 0)
      document.getElementById("noStudentMsg").style.display = "block";
  };
  container.appendChild(badge);

  const inputs = document.getElementById("hiddenInputsContainer");
  const inputHtml = `<input type="hidden" id="create-student-input-${student.uid}" name="studentUids" value="${student.uid}">`;
  inputs.insertAdjacentHTML("beforeend", inputHtml);
}

/**
 * 일괄 상태 변경
 */
function updateStatusBulk(statusName, statusLabel) {
  performBulkStatusUpdate(
    `${ADMIN_URLS.ADMIN_CLASSES}/bulk-status`,
    statusName,
    statusLabel,
    ".class-checkbox",
    "cids",
  );
}

/**
 * CSV 일괄 업로드
 */
function uploadClassCsv() {
  uploadCsv(
    `${ADMIN_URLS.ADMIN_CLASSES}/import-csv`,
    "CSV 파일을 통해 학급을 일괄 생성하시겠습니까?\n(형식: 학년도,학년,반,담임교사사번,학생학번목록)",
    "학급 일괄 생성이 완료되었습니다.",
  );
}

// --- 학생 이동 (전반) 로직 ---
let transferModal = null;

function openTransferModal(studentUid, studentName) {
  const modalEl = document.getElementById("transferStudentModal");
  if (!modalEl) return;

  transferModal = new bootstrap.Modal(modalEl);

  document.getElementById("transferStudentName").innerText = studentName;
  document.getElementById("transferStudentUid").value = studentUid;

  // 현재 학급 ID
  const currentCid = document.getElementById("class-detail-container").dataset
    .cid;
  // 현재 학년도 (화면에서 추출하거나 API로 가져와야 함. 여기서는 API 호출 시 year 파라미터 필요)
  // detail.html의 badge에서 year 추출 (임시)
  const yearText = document.querySelector(".badge.bg-primary").innerText; // "2026학년도"
  const year = parseInt(yearText.replace("학년도", ""));

  const select = document.getElementById("targetClassSelect");
  select.innerHTML = '<option value="">로딩 중...</option>';

  fetch(`${ADMIN_URLS.ADMIN_STUDENTS}/api/classrooms?year=${year}`)
    .then((res) => res.json())
    .then((data) => {
      select.innerHTML = '<option value="">선택하세요</option>';
      data.forEach((c) => {
        // 현재 반 제외
        if (c.cid != currentCid) {
          select.add(new Option(`${c.grade}학년 ${c.classNum}반`, c.cid));
        }
      });
    });

  transferModal.show();
}

function confirmTransfer() {
  const currentCid = document.getElementById("class-detail-container").dataset
    .cid;
  const targetCid = document.getElementById("targetClassSelect").value;
  const studentUid = document.getElementById("transferStudentUid").value;

  if (!targetCid) {
    alert("이동할 학급을 선택해주세요.");
    return;
  }

  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;

  fetch(`${ADMIN_URLS.ADMIN_CLASSES}/${currentCid}/transfer-student`, {
    method: "POST",
    headers: {
      [header]: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `targetCid=${targetCid}&studentUid=${studentUid}`,
  }).then(async (res) => {
    if (res.ok) {
      alert("이동되었습니다.");
      location.reload();
    } else {
      alert("이동 실패");
    }
  });
}
