package com.example.schoolmate.common.repository.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.schoolmate.common.entity.SchoolFacility;

@Repository
public interface SchoolFacilityRepository extends JpaRepository<SchoolFacility, Long> {
}