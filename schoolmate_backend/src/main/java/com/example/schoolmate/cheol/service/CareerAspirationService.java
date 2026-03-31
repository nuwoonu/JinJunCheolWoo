package com.example.schoolmate.cheol.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.careeraspirationdto.CareerAspirationDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.ParentCareerDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.StudentCareerDTO;
import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.cheol.repository.CareerAspirationRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class CareerAspirationService {

        private final CareerAspirationRepository careerAspirationRepository;
        private final StudentInfoRepository studentInfoRepository;

        /**
         * 학생이 진로희망 작성/수정
         */
        @Transactional
        public CareerAspirationDTO saveStudentCareer(StudentCareerDTO dto) {
                // 학생 조회
                StudentInfo student = studentInfoRepository.findById(dto.getStudentId())
                                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

                // 해당 학년/학기 레코드 조회 또는 생성
                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndYearAndSemester(dto.getStudentId(), dto.getYear(), dto.getSemester())
                                .orElseGet(() -> CareerAspiration.builder()
                                                .student(student)
                                                .year(dto.getYear())
                                                .semester(dto.getSemester())
                                                .build());

                // 학생 정보 업데이트
                aspiration.updateStudentInfo(dto.getSpecialtyOrInterest(), dto.getStudentDesiredJob());

                // 저장
                CareerAspiration saved = careerAspirationRepository.save(aspiration);

                log.info("학생 진로희망 저장: {} - {}학년 {}학기",
                                student.getUser().getName(), dto.getYear(), dto.getSemester());

                return CareerAspirationDTO.from(saved);
        }

        /**
         * 학부모가 진로희망 작성/수정
         */
        @Transactional
        public CareerAspirationDTO saveParentCareer(ParentCareerDTO dto) {
                // 학생 조회
                StudentInfo student = studentInfoRepository.findById(dto.getStudentId())
                                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

                // 해당 학년/학기 레코드 조회 또는 생성
                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndYearAndSemester(dto.getStudentId(), dto.getYear(), dto.getSemester())
                                .orElseGet(() -> CareerAspiration.builder()
                                                .student(student)
                                                .year(dto.getYear())
                                                .semester(dto.getSemester())
                                                .build());

                // 학부모 정보 업데이트
                aspiration.updateParentInfo(dto.getParentDesiredJob());

                // 저장
                CareerAspiration saved = careerAspirationRepository.save(aspiration);

                log.info("학부모 진로희망 저장: 자녀({}) - {}학년 {}학기",
                                student.getUser().getName(), dto.getYear(), dto.getSemester());

                return CareerAspirationDTO.from(saved);
        }

        /**
         * 특정 학년/학기 진로희망 조회 (화면 렌더링용)
         */
        public CareerAspirationDTO getCareerAspiration(Long studentId, Year year, Semester semester) {
                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndYearAndSemester(studentId, year, semester)
                                .orElse(null);

                return aspiration != null ? CareerAspirationDTO.from(aspiration) : null;
        }
}