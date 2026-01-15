package com.example.schoolmate.service;

import java.util.List;

import com.example.schoolmate.studentdto.StudentCreateDTO;
import com.example.schoolmate.studentdto.StudentResponseDTO;
import com.example.schoolmate.studentdto.StudentUpdateDTO;

public interface StudentService {

    // 학생 등록
    StudentResponseDTO createStudent(StudentCreateDTO createDTO);

    // 학생 정보 조회 (UID로)
    StudentResponseDTO getStudentByUid(Long uid);

    // 학생 정보 조회 (학번으로)
    StudentResponseDTO getStudentByStudentNumber(Long studentNumber);

    // 전체 학생 목록 조회
    List<StudentResponseDTO> getAllStudents();

    // 학년별 학생 목록 조회
    List<StudentResponseDTO> getStudentsByGrade(int grade);

    // 반별 학생 목록 조회
    List<StudentResponseDTO> getStudentsByClassNum(int classNum);

    // 학년 + 반별 학생 목록 조회
    List<StudentResponseDTO> getStudentsByGradeAndClass(int grade, int classNum);

    // 학생 정보 수정
    StudentResponseDTO updateStudent(Long uid, StudentUpdateDTO updateDTO);

    // 학생 삭제 (소프트 삭제 - status를 INACTIVE로 변경)
    void deleteStudent(Long uid);

    // 학생 완전 삭제 (물리적 삭제)
    void permanentDeleteStudent(Long uid);
}
