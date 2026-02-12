package com.example.schoolmate.common.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.FacilityDTO;
import com.example.schoolmate.common.entity.SchoolFacility;
import com.example.schoolmate.common.repository.facility.SchoolFacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FacilityService {

    private final SchoolFacilityRepository facilityRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<FacilityDTO.Response> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(FacilityDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createFacility(FacilityDTO.Request request) {
        String imageFilename = fileService.upload(request.getImageFile(), "facilities");

        SchoolFacility facility = SchoolFacility.builder()
                .name(request.getName())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .description(request.getDescription())
                .isAvailable(true)
                .imageFilename(imageFilename)
                .build();
        facilityRepository.save(facility);
    }

    public void updateFacility(FacilityDTO.Request request) {
        SchoolFacility facility = facilityRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("시설을 찾을 수 없습니다."));

        facility.setName(request.getName());
        facility.setLocation(request.getLocation());
        facility.setCapacity(request.getCapacity());
        facility.setDescription(request.getDescription());
        facility.setAvailable(request.isAvailable());

        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            if (facility.getImageFilename() != null) {
                fileService.delete(facility.getImageFilename(), "facilities");
            }
            String imageFilename = fileService.upload(request.getImageFile(), "facilities");
            facility.setImageFilename(imageFilename);
        }
    }

    public void deleteFacility(Long id) {
        SchoolFacility facility = facilityRepository.findById(id).orElse(null);
        if (facility != null) {
            if (facility.getImageFilename() != null) {
                fileService.delete(facility.getImageFilename(), "facilities");
            }
            facilityRepository.delete(facility);
        }
    }
}