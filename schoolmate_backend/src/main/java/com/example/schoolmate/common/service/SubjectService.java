package com.example.schoolmate.common.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 교과목 관리 서비스
 * 
 * 교과목(Subject) 데이터에 대한 CRUD 비즈니스 로직을 담당합니다.
 * - 과목 코드 및 이름 중복 체크, 등록, 수정, 삭제 기능
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectDTO.Response> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(SubjectDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createSubject(SubjectDTO.Request request) {
        if (subjectRepository.existsById(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
        }
        if (subjectRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 과목명입니다: " + request.getName());
        }

        Subject subject = Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .year(request.getYear()) // cheol
                .build();
        subjectRepository.save(subject);
    }

    public void updateSubject(SubjectDTO.Request request) {
        // 기존 코드로 조회
        Subject subject = subjectRepository.findById(request.getOriginCode())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다: " + request.getOriginCode()));

        // 코드가 변경된 경우 (PK 변경이므로 삭제 후 재생성)
        if (!request.getOriginCode().equals(request.getCode())) {
            if (subjectRepository.existsById(request.getCode())) {
                throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
            }

            // 기존 데이터 삭제
            subjectRepository.delete(subject);

            // 새 데이터 생성
            Subject newSubject = Subject.builder()
                    .code(request.getCode())
                    .name(request.getName())
                    .year(request.getYear()) // cheol
                    .build();
            subjectRepository.save(newSubject);
        } else {
            Subject updatedSubject = Subject.builder()
                    .code(request.getCode())
                    .name(request.getName())
                    .year(request.getYear()) // cheol
                    .build();
            subjectRepository.save(updatedSubject);
        }
    }

    public void deleteSubject(String code) {
        subjectRepository.deleteById(code);
    }
}