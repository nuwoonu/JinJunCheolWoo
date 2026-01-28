package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;

public interface UserRepositoryCustom {
    Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition condition, Pageable pageable);

    Page<User> searchStudents(StudentDTO.StudentSearchCondition cond, Pageable pageable);

    Page<User> searchStaffs(StaffDTO.StaffSearchCondition cond, Pageable pageable);

    Page<ParentInfo> searchParents(ParentDTO.ParentSearchCondition cond, Pageable pageable);

    Optional<User> findDetailByCode(String code);

    boolean existsStudentByCode(String code);

    List<User> findStudentsByAssignment(int year, int grade, int classNum);

    List<User> findUnassignedStudents(int year, int limit);

    long countByClassroom(int year, int grade, int classNum);

    Optional<User> findTeacherByCode(String code);

    long countStudentsByStatus(StudentStatus status);

    long countTeachersByStatus(TeacherStatus status);

    long countStaffsByStatus(StaffStatus status);

    long countParentsByStatus(ParentStatus status);

    int findMaxAttendanceNum(int year, int grade, int classNum);
}
