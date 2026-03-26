package com.example.schoolmate.domain.resources.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.resources.constant.AssetStatus;
import com.example.schoolmate.domain.resources.dto.AssetDTO;
import com.example.schoolmate.domain.resources.dto.AssetModelDTO;
import com.example.schoolmate.domain.resources.entity.AssetModel;
import com.example.schoolmate.domain.resources.entity.SchoolAsset;
import com.example.schoolmate.domain.resources.repository.AssetModelRepository;
import com.example.schoolmate.domain.resources.repository.SchoolAssetRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AssetService {
    private final SchoolAssetRepository assetRepository;
    private final AssetModelRepository modelRepository;
    private final FileManager fileManager;
    private final SchoolRepository schoolRepository;

    @Transactional(readOnly = true)
    public Page<AssetDTO.Response> getAssetList(String keyword, Pageable pageable) {
        return assetRepository.search(keyword, pageable).map(AssetDTO.Response::from);
    }

    // --- 모델(AssetModel) 관리 ---
    @Transactional(readOnly = true)
    public List<AssetModelDTO.Response> getAllAssetModels() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        List<AssetModel> models = (schoolId != null)
                ? modelRepository.findBySchoolId(schoolId)
                : modelRepository.findAll();
        return models.stream().map(AssetModelDTO.Response::from).collect(Collectors.toList());
    }

    public void createAssetModel(AssetModelDTO.Request request) {
        log.info("기자재 모델 생성: name={}, category={}", request.getName(), request.getCategory());
        String filename = fileManager.upload(request.getImageFile(), FileManager.UploadType.ASSET);

        AssetModel model = AssetModel.builder()
                .name(request.getName())
                .category(request.getCategory())
                .manufacturer(request.getManufacturer())
                .description(request.getDescription())
                .imageFilename(filename)
                .build();

        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(model::setSchool);
        }

        modelRepository.save(model);
    }

    public void updateAssetModel(AssetModelDTO.Request request) {
        log.info("기자재 모델 수정: id={}, name={}", request.getId(), request.getName());
        AssetModel model = modelRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("모델을 찾을 수 없습니다."));

        model.setName(request.getName());
        model.setCategory(request.getCategory());
        model.setManufacturer(request.getManufacturer());
        model.setDescription(request.getDescription());

        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            model.setImageFilename(fileManager.replace(request.getImageFile(), model.getImageFilename(), FileManager.UploadType.ASSET));
        }
    }

    public void deleteAssetModel(Long id) {
        log.info("기자재 모델 삭제 시도: id={}", id);
        AssetModel model = modelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("모델을 찾을 수 없습니다."));

        // 해당 모델을 참조하는 자산이 있는지 확인
        SchoolAsset probe = SchoolAsset.builder().model(model).build();
        if (assetRepository.exists(Example.of(probe))) {
            throw new IllegalArgumentException("해당 모델을 참조하는 자산(재고)이 존재하여 삭제할 수 없습니다.\n먼저 등록된 자산을 삭제해주세요.");
        }

        fileManager.delete(model.getImageFilename(), FileManager.UploadType.ASSET);
        modelRepository.delete(model);
        log.info("기자재 모델 삭제 완료: id={}", id);
    }

    // --- 자산(SchoolAsset) 관리 ---
    public void createAsset(AssetDTO.Request request) {
        log.info("기자재 등록: assetCode={}, modelId={}", request.getAssetCode(), request.getModelId());

        Long schoolId = SchoolContextHolder.getSchoolId();

        // 관리 번호 중복 체크 (학교 스코프)
        boolean codeExists = (schoolId != null)
                ? assetRepository.existsByAssetCodeAndSchool_Id(request.getAssetCode(), schoolId)
                : assetRepository.existsByAssetCode(request.getAssetCode());
        if (codeExists) {
            throw new IllegalArgumentException("이미 존재하는 관리 번호입니다.");
        }

        // 반드시 기존 모델을 선택해야 함
        if (request.getModelId() == null) {
            throw new IllegalArgumentException("기자재 모델을 선택해야 합니다.");
        }
        AssetModel model = modelRepository.findById(request.getModelId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 모델입니다."));

        AssetStatus status = request.getStatus() != null ? AssetStatus.valueOf(request.getStatus())
                : AssetStatus.AVAILABLE;

        SchoolAsset asset = SchoolAsset.builder()
                .assetCode(request.getAssetCode())
                .serialNumber(request.getSerialNumber())
                .model(model)
                .purchaseDate(request.getPurchaseDate())
                .status(status)
                .build();

        // BaseResource 필드 설정
        asset.setName(model.getName()); // BaseResource.name = 모델명
        asset.setLocationDesc(request.getLocation());
        asset.setDescription(model.getDescription()); // BaseResource.description = 모델 설명 (기본값)

        // schoolId는 위에서 이미 조회함
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(asset::setSchool);
        }

        assetRepository.save(asset);
    }

    public void updateAsset(AssetDTO.Request request) {
        log.info("기자재 수정: id={}, assetCode={}", request.getId(), request.getAssetCode());
        SchoolAsset asset = assetRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("기자재를 찾을 수 없습니다."));

        if (request.getModelId() != null && !request.getModelId().equals(asset.getModel().getId())) {
            AssetModel model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 모델입니다."));
            asset.setModel(model);
            asset.setName(model.getName());
            asset.setDescription(model.getDescription());
        }

        if (request.getAssetCode() != null && !request.getAssetCode().equals(asset.getAssetCode())) {
            if (assetRepository.existsByAssetCode(request.getAssetCode())) {
                throw new IllegalArgumentException("이미 존재하는 관리 번호입니다.");
            }
            asset.setAssetCode(request.getAssetCode());
        }

        asset.setSerialNumber(request.getSerialNumber());
        asset.setLocationDesc(request.getLocation());
        if (request.getStatus() != null) {
            AssetStatus newStatus = AssetStatus.valueOf(request.getStatus());
            asset.setStatus(newStatus);
        }
        asset.setPurchaseDate(request.getPurchaseDate());
    }

    public void deleteAsset(Long id) {
        log.info("기자재 삭제: id={}", id);
        assetRepository.deleteById(id);
    }

    // 2. 카테고리별 요약 (모델 기준으로 그룹화)
    @Transactional(readOnly = true)
    public List<AssetDTO.Summary> getAssetSummaries() {
        List<SchoolAsset> allAssets = assetRepository.findAllByCurrentSchool();

        // 모델의 카테고리 별로 그룹화
        Map<String, List<SchoolAsset>> grouped = allAssets.stream()
                .collect(Collectors.groupingBy(a -> a.getModel().getCategory()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<SchoolAsset> list = entry.getValue();
                    return AssetDTO.Summary.builder()
                            .category(entry.getKey())
                            .totalCount(list.size())
                            .availableCount(list.stream().filter(a -> a.getStatus() == AssetStatus.AVAILABLE).count())
                            .inUseCount(list.stream().filter(a -> a.getStatus() == AssetStatus.IN_USE).count())
                            .brokenCount(list.stream()
                                    .filter(a -> a.getStatus() == AssetStatus.BROKEN
                                            || a.getStatus() == AssetStatus.LOST)
                                    .count())
                            .build();
                }).collect(Collectors.toList());
    }
}
