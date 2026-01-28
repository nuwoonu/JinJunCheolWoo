package com.example.schoolmate.parkjoon.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.AssetDTO;
import com.example.schoolmate.common.entity.SchoolAsset;
import com.example.schoolmate.common.entity.constant.AssetStatus;
import com.example.schoolmate.common.repository.SchoolAssetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminAssetService {

    private final SchoolAssetRepository assetRepository;

    @Transactional(readOnly = true)
    public Page<AssetDTO.Response> getAssetList(String keyword, Pageable pageable) {
        Page<SchoolAsset> page;
        if (keyword != null && !keyword.isBlank()) {
            page = assetRepository.findByNameContainingOrCodeContaining(keyword, keyword, pageable);
        } else {
            page = assetRepository.findAll(pageable);
        }
        return page.map(AssetDTO.Response::from);
    }

    @Transactional(readOnly = true)
    public List<AssetDTO.Summary> getAssetSummaries() {
        List<SchoolAsset> allAssets = assetRepository.findAll();

        // 카테고리별로 그룹화 (카테고리가 없으면 "기타"로 분류)
        Map<String, List<SchoolAsset>> grouped = allAssets.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getCategory() != null && !a.getCategory().isBlank() ? a.getCategory() : "기타"));

        List<AssetDTO.Summary> summaries = new ArrayList<>();
        for (Map.Entry<String, List<SchoolAsset>> entry : grouped.entrySet()) {
            List<SchoolAsset> list = entry.getValue();
            summaries.add(AssetDTO.Summary.builder()
                    .category(entry.getKey())
                    .totalCount(list.size())
                    .availableCount(list.stream().filter(a -> a.getStatus() == AssetStatus.AVAILABLE).count())
                    .inUseCount(list.stream().filter(a -> a.getStatus() == AssetStatus.IN_USE).count())
                    .brokenCount(list.stream()
                            .filter(a -> a.getStatus() == AssetStatus.BROKEN || a.getStatus() == AssetStatus.LOST)
                            .count())
                    .build());
        }

        return summaries;
    }

    public void createAsset(AssetDTO.Request request) {
        if (request.getCode() != null && assetRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 관리 번호입니다: " + request.getCode());
        }

        SchoolAsset asset = SchoolAsset.builder()
                .name(request.getName())
                .code(request.getCode())
                .category(request.getCategory())
                .location(request.getLocation())
                .status(AssetStatus.AVAILABLE) // 기본값
                .purchaseDate(request.getPurchaseDate())
                .description(request.getDescription())
                .build();

        if (request.getStatus() != null) {
            asset.setStatus(AssetStatus.valueOf(request.getStatus()));
        }

        assetRepository.save(asset);
    }

    public void updateAsset(AssetDTO.Request request) {
        SchoolAsset asset = assetRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("기자재를 찾을 수 없습니다."));

        asset.setName(request.getName());
        asset.setCode(request.getCode());
        asset.setCategory(request.getCategory());
        asset.setLocation(request.getLocation());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            asset.setStatus(AssetStatus.valueOf(request.getStatus()));
        }
    }

    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
    }
}