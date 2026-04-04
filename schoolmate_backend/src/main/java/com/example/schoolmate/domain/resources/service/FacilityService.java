package com.example.schoolmate.domain.resources.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.global.util.FileManager;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.dto.FacilityDTO;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;
import com.example.schoolmate.domain.resources.repository.SchoolFacilityRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FacilityService {
    private final SchoolFacilityRepository facilityRepository;
    private final FileManager fileManager;
    private final SchoolRepository schoolRepository;

    @Transactional(readOnly = true)
    public List<FacilityDTO.Response> getAllFacilities() {
        return facilityRepository.findAllByCurrentSchool().stream()
                .map(FacilityDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createFacility(FacilityDTO.Request request) {
        log.info("시설 생성: name={}", request.getName());
        String filename = fileManager.upload(request.getImageFile(), FileManager.UploadType.FACILITY);

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

        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(facility::setSchool);
        }

        facilityRepository.save(facility);
    }

    public void updateFacility(FacilityDTO.Request request) {
        log.info("시설 수정: id={}, name={}", request.getId(), request.getName());
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
            facility.setImageFilename(fileManager.replace(request.getImageFile(), facility.getImageFilename(), FileManager.UploadType.FACILITY));
        }
    }

    public void deleteFacility(Long id) {
        log.info("시설 삭제: id={}", id);
        facilityRepository.findById(id).ifPresent(f -> fileManager.delete(f.getImageFilename(), FileManager.UploadType.FACILITY));
        facilityRepository.deleteById(id);
    }
}