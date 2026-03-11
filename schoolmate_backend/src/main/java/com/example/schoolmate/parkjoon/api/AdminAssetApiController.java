package com.example.schoolmate.parkjoon.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.common.dto.AssetDTO;
import com.example.schoolmate.common.service.AssetService;

import lombok.RequiredArgsConstructor;

// 기자재 관리 REST API
@RestController
@RequestMapping("/parkjoon/admin/api/assets")
@RequiredArgsConstructor
public class AdminAssetApiController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<Page<?>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(assetService.getAssetList(keyword, pageable));
    }

    @GetMapping("/summaries")
    public ResponseEntity<?> summaries() {
        return ResponseEntity.ok(assetService.getAssetSummaries());
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody AssetDTO.Request request) {
        assetService.createAsset(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> update(@RequestBody AssetDTO.Request request) {
        assetService.updateAsset(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.ok().build();
    }
}
