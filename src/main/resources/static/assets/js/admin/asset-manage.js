/**
 * 기자재 관리 페이지 스크립트
 */

function openCreateAssetModal() {
  const modalEl = document.getElementById("assetModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "기자재 등록";
  document.getElementById("assetForm").action =
    "/parkjoon/admin/facilities/assets/create";
  document.getElementById("assetForm").reset();
  document.getElementById("assetId").value = "";
  document.getElementById("assetStatus").value = "AVAILABLE"; // 기본값

  modal.show();
}

function openUpdateAssetModal(asset) {
  const modalEl = document.getElementById("assetModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById("modalTitle").innerText = "기자재 수정";
  document.getElementById("assetForm").action =
    "/parkjoon/admin/facilities/assets/update";

  document.getElementById("assetId").value = asset.id;
  document.getElementById("assetName").value = asset.name;
  document.getElementById("assetCode").value = asset.code;
  document.getElementById("assetCategory").value = asset.category;
  document.getElementById("assetLocation").value = asset.location;
  document.getElementById("assetStatus").value = asset.status;
  document.getElementById("assetPurchaseDate").value = asset.purchaseDate;
  document.getElementById("assetDesc").value = asset.description;

  modal.show();
}
