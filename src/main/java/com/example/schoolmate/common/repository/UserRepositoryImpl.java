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
import com.example.schoolmate.common.repository.handler.ParentQueryHandler;
import com.example.schoolmate.common.repository.handler.StaffQueryHandler;
import com.example.schoolmate.common.repository.handler.StudentQueryHandler;
import com.example.schoolmate.common.repository.handler.TeacherQueryHandler;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {
    private final TeacherQueryHandler teacherQueryHandler;
    private final StudentQueryHandler studentQueryHandler;
    private final ParentQueryHandler parentQueryHandler;
    private final StaffQueryHandler staffQueryHandler;

    @Override
    public Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition condition, Pageable pageable) {
        return teacherQueryHandler.search(condition, pageable);
    }

    @Override
    public Page<User> searchStudents(StudentDTO.StudentSearchCondition condition, Pageable pageable) {
        return studentQueryHandler.search(condition, pageable);
    }

    @Override
    public Page<User> searchStaffs(StaffDTO.StaffSearchCondition condition, Pageable pageable) {
        return staffQueryHandler.search(condition, pageable);
    }

    @Override
    public Page<ParentInfo> searchParents(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        return parentQueryHandler.search(cond, pageable);
    }

    @Override
    public Optional<User> findDetailByCode(String code) {
        return studentQueryHandler.findDetailByCode(code);
    }

    @Override
    public boolean existsStudentByCode(String code) {
        return studentQueryHandler.existsByCode(code);
    }

    @Override
    public List<User> findStudentsByAssignment(int year, int grade, int classNum) {
        return studentQueryHandler.findStudentsByAssignment(year, grade, classNum);
    }

    @Override
    public List<User> findUnassignedStudents(int year, int limit) {
        return studentQueryHandler.findUnassignedStudents(year, limit);
    }

    @Override
    public long countByClassroom(int year, int grade, int classNum) {
        return studentQueryHandler.countByClassroom(year, grade, classNum);
    }

    @Override
    public Optional<User> findTeacherByCode(String code) {
        return teacherQueryHandler.findTeacherByCode(code);
    }

    @Override
    public long countStudentsByStatus(StudentStatus status) {
        return studentQueryHandler.countByStatus(status);
    }

    @Override
    public long countTeachersByStatus(TeacherStatus status) {
        return teacherQueryHandler.countByStatus(status);
    }

    @Override
    public long countStaffsByStatus(StaffStatus status) {
        return staffQueryHandler.countByStatus(status);
    }

    @Override
    public long countParentsByStatus(ParentStatus status) {
        return parentQueryHandler.countByStatus(status);
    }

}