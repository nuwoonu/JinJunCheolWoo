/**
 * 학사 일정 관리 스크립트 (FullCalendar)
 */

let calendar;
let eventModal;

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  eventModal = new bootstrap.Modal(document.getElementById("eventModal"));

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listMonth",
    },
    locale: "ko",
    editable: true, // 드래그 수정 가능
    selectable: true, // 날짜 선택 가능
    events: ADMIN_URLS.ADMIN_API_SCHEDULE, // 이벤트 소스 (GET)

    // 날짜 클릭 시 등록 모달
    select: function (info) {
      openCreateModal(info.startStr, info.endStr);
    },

    // 이벤트 클릭 시 수정 모달
    eventClick: function (info) {
      openUpdateModal(info.event);
    },

    // 드래그로 날짜 변경 시 자동 저장
    eventDrop: function (info) {
      updateEventDate(info.event);
    },
    eventResize: function (info) {
      updateEventDate(info.event);
    },
  });

  calendar.render();
});

function openCreateModal(startStr, endStr) {
  document.getElementById("modalTitle").innerText = "일정 등록";
  document.getElementById("eventId").value = "";
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventStart").value = startStr || "";

  // FullCalendar 선택 시 endStr은 다음날 00:00이므로 하루 빼주는 로직이 필요할 수 있음
  // 여기서는 간단히 start만 세팅
  document.getElementById("eventEnd").value = "";
  document.getElementById("eventType").selectedIndex = 0;
  document.getElementById("targetGrade").value = "";
  document.getElementById("eventDesc").value = "";
  document.getElementById("btnDelete").style.display = "none";

  eventModal.show();
}

function openUpdateModal(event) {
  document.getElementById("modalTitle").innerText = "일정 수정";
  document.getElementById("eventId").value = event.id;
  document.getElementById("eventTitle").value = event.title;
  document.getElementById("eventStart").value = event.startStr.split("T")[0];
  document.getElementById("eventEnd").value = event.endStr
    ? new Date(
        new Date(event.endStr).setDate(new Date(event.endStr).getDate() - 1),
      )
        .toISOString()
        .split("T")[0]
    : "";

  // Extended Props
  const props = event.extendedProps;
  document.getElementById("eventType").value = props.eventType;
  document.getElementById("targetGrade").value = props.targetGrade || "";
  document.getElementById("eventDesc").value = props.description || "";

  document.getElementById("btnDelete").style.display = "block";
  eventModal.show();
}

function saveEvent() {
  const id = document.getElementById("eventId").value;
  const data = {
    title: document.getElementById("eventTitle").value,
    start: document.getElementById("eventStart").value,
    end: document.getElementById("eventEnd").value || null,
    eventType: document.getElementById("eventType").value,
    targetGrade: document.getElementById("targetGrade").value || null,
    description: document.getElementById("eventDesc").value,
  };

  if (!data.title || !data.start) {
    alert("일정명과 시작일은 필수입니다.");
    return;
  }

  const method = id ? "PUT" : "POST";
  const url = id
    ? `${ADMIN_URLS.ADMIN_API_SCHEDULE}/${id}`
    : ADMIN_URLS.ADMIN_API_SCHEDULE;

  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      [header]: token,
    },
    body: JSON.stringify(data),
  }).then((res) => {
    if (res.ok) {
      calendar.refetchEvents(); // 달력 새로고침
      eventModal.hide();
    } else {
      alert("저장 실패");
    }
  });
}

function deleteEvent() {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  const id = document.getElementById("eventId").value;
  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  fetch(`${ADMIN_URLS.ADMIN_API_SCHEDULE}/${id}`, {
    method: "DELETE",
    headers: { [header]: token },
  }).then((res) => {
    if (res.ok) {
      calendar.refetchEvents();
      eventModal.hide();
    } else {
      alert("삭제 실패");
    }
  });
}

function updateEventDate(event) {
  // 드래그 앤 드롭 시 날짜만 업데이트 (나머지 정보 유지 필요)
  // 여기서는 편의상 상세 정보를 다시 읽어오거나, 백엔드에서 날짜만 패치하는 API를 따로 두는 것이 좋음.
  // 현재 구조상 PUT은 전체 업데이트이므로, 기존 데이터를 가져와서 날짜만 바꿔 보내야 함.
  // 간단 구현을 위해 여기서는 생략하거나, 상세 모달을 띄우는 방식으로 유도할 수 있음.
  // 또는 API를 PATCH로 구현하여 부분 수정을 지원해야 함.

  // 일단은 드래그 후 바로 반영되지 않도록 리셋 (구현 복잡도 때문)
  calendar.refetchEvents();
}

function uploadScheduleCsv() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput.files.length) return;

  const token = document.querySelector('meta[name="_csrf"]').content;
  const header = document.querySelector('meta[name="_csrf_header"]').content;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  if (
    !confirm(
      "선택한 CSV 파일로 일정을 대량 등록하시겠습니까?\n(형식: 일정명,시작일,종료일,유형,대상학년,설명)",
    )
  ) {
    fileInput.value = "";
    return;
  }

  fetch(`${ADMIN_URLS.ADMIN_API_SCHEDULE}/import-csv`, {
    method: "POST",
    headers: {
      [header]: token,
    },
    body: formData,
  })
    .then((res) => {
      if (res.ok) {
        alert("일정 등록이 완료되었습니다.");
        calendar.refetchEvents();
      } else {
        res.text().then((text) => alert("오류 발생: " + text));
      }
    })
    .catch((err) => {
      console.error("네트워크 에러:", err);
      alert("서버 통신 중 에러가 발생했습니다.");
    })
    .finally(() => {
      fileInput.value = "";
    });
}
