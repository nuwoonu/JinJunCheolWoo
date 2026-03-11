package com.example.schoolmate.domain.resources.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.service.FileService;
import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.dto.FacilityDTO;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;
import com.example.schoolmate.domain.resources.repository.SchoolFacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FacilityService {
    private final SchoolFacilityRepository facilityRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<FacilityDTO.Response> getAllFacilities() {
        return facilityRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(FacilityDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createFacility(FacilityDTO.Request request) {
        String filename = null;
        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            filename = fileService.upload(request.getImageFile(), "facilities");
        }

        FacilityStatus status = request.getStatus() != null ? request.getStatus() : FacilityStatus.AVAILABLE;

        SchoolFacility facility = SchoolFacility.builder()
                .capacity(request.getCapacity())
                .type(request.getType())
                .status(status)
                .amenities(request.getAmenities())
                .build();

        // BaseResource fields
        facility.setName(request.getName());
        facility.setLocationDesc(request.getLocation()); // BaseResource.locationDesc
        facility.setDescription(request.getDescription()); // BaseResource.description
        facility.setImageFilename(filename);

        facilityRepository.save(facility);
    }

    public void updateFacility(FacilityDTO.Request request) {
        SchoolFacility facility = facilityRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("시설을 찾을 수 없습니다."));

        // 변경 감지(Dirty Checking) 활용
        facility.setName(request.getName());
        facility.setLocationDesc(request.getLocation()); // BaseResource 필드 동기화
        facility.setDescription(request.getDescription()); // BaseResource 필드 동기화
        facility.setCapacity(request.getCapacity());
        facility.setType(request.getType());
        facility.setAmenities(request.getAmenities());

        if (request.getStatus() != null) {
            facility.setStatus(request.getStatus());
        }

        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            // 이미지 교체 로직
            if (facility.getImageFilename() != null) {
                fileService.delete(facility.getImageFilename(), "facilities");
            }
            facility.setImageFilename(fileService.upload(request.getImageFile(), "facilities"));
        }
    }

    public void deleteFacility(Long id) {
        facilityRepository.deleteById(id);
    }
}