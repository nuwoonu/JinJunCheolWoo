package com.example.schoolmate.parkjoon.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.FacilityDTO;
import com.example.schoolmate.common.entity.SchoolFacility;
import com.example.schoolmate.common.repository.SchoolFacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminFacilityService {

    private final SchoolFacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<FacilityDTO.Response> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(FacilityDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createFacility(FacilityDTO.Request request) {
        SchoolFacility facility = SchoolFacility.builder()
                .name(request.getName())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .description(request.getDescription())
                .isAvailable(true)
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
    }

    public void deleteFacility(Long id) {
        facilityRepository.deleteById(id);
    }
}