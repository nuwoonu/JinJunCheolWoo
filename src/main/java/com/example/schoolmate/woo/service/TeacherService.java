package com.example.schoolmate.woo.service;

import java.util.List;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;

public interface TeacherService {

    // ========== 교사 정보 ==========
    TeacherResponseDTO getTeacherById(Long id);

    List<TeacherResponseDTO> getAllTeachers();

    TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO);

    // ========== 학생 CRUD (교사가 관리) ==========
    StudentResponseDTO createStudent(StudentCreateDTO createDTO);

    StudentResponseDTO getStudentById(Long studentId);

    List<StudentResponseDTO> getAllStudents();

    StudentResponseDTO updateStudent(Long studentId, StudentUpdateDTO updateDTO);

    void deleteStudent(Long studentId);

    // ========== 담당 학급 조회 ==========
    // 내 담당 반 학생들 조회
    ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear);

    // 특정 학급 학생들 조회 (학년, 반으로)
    ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum);

    // ========== 성적 입력/수정 (cheol 연동) ==========
    void inputGrade(Long teacherId, GradeInputDTO gradeDTO);

    void updateGrade(Long teacherId, Long gradeId, Double newScore);

    // 내 과목 학생들 성적 조회
    List<GradeDTO> getMySubjectGrades(Long teacherId, String subjectCode);

    // 특정 학생 성적 조회
    List<GradeDTO> getStudentGrades(Long studentId);
}
