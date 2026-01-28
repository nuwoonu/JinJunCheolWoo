/**
 * 시설(강의실) 관리 페이지 스크립트
 */

function openCreateModal() {
  const modalEl = document.getElementById("roomModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "시설 등록";
  document.getElementById("roomForm").action =
    "/parkjoon/admin/facilities/rooms/create";
  document.getElementById("roomForm").reset();
  document.getElementById("roomId").value = ""; // ID 초기화

  modal.show();
}

function openUpdateModal(room) {
  const modalEl = document.getElementById("roomModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "시설 수정";
  document.getElementById("roomForm").action =
    "/parkjoon/admin/facilities/rooms/update";
  document.getElementById("roomId").value = room.id;
  document.getElementById("roomName").value = room.name;
  document.getElementById("roomLocation").value = room.location;
  document.getElementById("roomCapacity").value = room.capacity;
  document.getElementById("roomDesc").value = room.description;
  document.getElementById("roomAvailable").checked = room.available;
  modal.show();
}
