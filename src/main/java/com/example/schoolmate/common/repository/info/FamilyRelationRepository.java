package com.example.schoolmate.common.repository.info;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.common.entity.info.FamilyRelation;

public interface FamilyRelationRepository extends JpaRepository<FamilyRelation, Long> {
    List<FamilyRelation> findByStudentInfo_Code(String code);
}