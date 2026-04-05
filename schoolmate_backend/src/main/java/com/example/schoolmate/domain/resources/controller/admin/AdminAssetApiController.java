package com.example.schoolmate.domain.resources.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.resources.constant.AssetStatus;
import com.example.schoolmate.domain.resources.dto.AssetDTO;
import com.example.schoolmate.domain.resources.dto.AssetModelDTO;
import com.example.schoolmate.domain.resources.service.AssetService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 관리자 기자재(Asset) 관리 REST 컨트롤러
 */
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_ASSETS)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageAssets()")
public class AdminAssetApiController {

    private final AssetService adminAssetService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(value = "keyword", required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        Map<String, Object> response = new HashMap<>();
        response.put("assets", adminAssetService.getAssetList(keyword, pageable));
        response.put("summaries", adminAssetService.getAssetSummaries());
        response.put("models", adminAssetService.getAllAssetModels()); // 등록 모달용
        response.put("statuses", AssetStatus.values());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AssetDTO.Request request) {
        try {
            adminAssetService.createAsset(request);
            return ResponseEntity.ok("기자재가 등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("등록 실패: " + e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody AssetDTO.Request request) {
        adminAssetService.updateAsset(request);
        return ResponseEntity.ok("기자재 정보가 수정되었습니다.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        adminAssetService.deleteAsset(id);
        return ResponseEntity.ok("기자재가 삭제되었습니다.");
    }

    // --- 모델 관리 ---

    @GetMapping("/models")
    public ResponseEntity<?> getModels() {
        return ResponseEntity.ok(adminAssetService.getAllAssetModels());
    }

    @PostMapping("/models")
    public ResponseEntity<?> createModel(@ModelAttribute AssetModelDTO.Request request) {
        adminAssetService.createAssetModel(request);
        return ResponseEntity.ok("모델이 등록되었습니다.");
    }

    @PutMapping("/models/{id}")
    public ResponseEntity<?> updateModel(@PathVariable Long id, @ModelAttribute AssetModelDTO.Request request) {
        request.setId(id);
        adminAssetService.updateAssetModel(request);
        return ResponseEntity.ok("모델 정보가 수정되었습니다.");
    }

    @DeleteMapping("/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        try {
            adminAssetService.deleteAssetModel(id);
            return ResponseEntity.ok("모델이 삭제되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("삭제 실패: " + e.getMessage());
        }
    }
}