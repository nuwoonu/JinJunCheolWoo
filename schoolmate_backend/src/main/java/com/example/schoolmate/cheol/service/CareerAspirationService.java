package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.careeraspirationdto.CareerAspirationDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.ParentCareerDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.StudentCareerDTO;
import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.cheol.repository.CareerAspirationRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
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
        private final AcademicTermRepository academicTermRepository;

        /**
         * 학생이 진로희망 작성/수정
         */
        @Transactional
        public CareerAspirationDTO saveStudentCareer(StudentCareerDTO dto) {
                // 학생 조회
                StudentInfo student = studentInfoRepository.findById(dto.getStudentId())
                                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

                AcademicTerm term = academicTermRepository.findById(dto.getAcademicTermId())
                                .orElseThrow(() -> new IllegalArgumentException("학기를 찾을 수 없습니다."));

                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndAcademicTermId(dto.getStudentId(), dto.getAcademicTermId())
                                .orElseGet(() -> CareerAspiration.builder()
                                                .student(student)
                                                .academicTerm(term)
                                                .build());

                // 학생 정보 업데이트
                aspiration.updateStudentInfo(dto.getSpecialtyOrInterest(), dto.getStudentDesiredJob());

                // 저장
                CareerAspiration saved = careerAspirationRepository.save(aspiration);

                log.info("학생 진로희망 저장: {} - {}",
                                student.getUser().getName(), term.getDisplayName());

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

                AcademicTerm term = academicTermRepository.findById(dto.getAcademicTermId())
                                .orElseThrow(() -> new IllegalArgumentException("학기를 찾을 수 없습니다."));

                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndAcademicTermId(dto.getStudentId(), dto.getAcademicTermId())
                                .orElseGet(() -> CareerAspiration.builder()
                                                .student(student)
                                                .academicTerm(term)
                                                .build());

                // 학부모 정보 업데이트
                aspiration.updateParentInfo(dto.getParentDesiredJob());

                // 저장
                CareerAspiration saved = careerAspirationRepository.save(aspiration);

                log.info("학부모 진로희망 저장: 자녀({}) - {}",
                                student.getUser().getName(), term.getDisplayName());

                return CareerAspirationDTO.from(saved);
        }

        /**
         * 학생별 전체 진로희망 조회 (학년 오름차순)
         */
        public List<CareerAspirationDTO> getAllByStudentId(Long studentId) {
                return careerAspirationRepository
                                .findByStudentIdOrderByAcademicTerm_SchoolYear_YearAscAcademicTerm_SemesterAsc(studentId)
                                .stream()
                                .map(CareerAspirationDTO::from)
                                .collect(Collectors.toList());
        }

        /**
         * 특정 학년/학기 진로희망 조회 (화면 렌더링용)
         */
        public CareerAspirationDTO getCareerAspiration(Long studentId, Long academicTermId) {
                CareerAspiration aspiration = careerAspirationRepository
                                .findByStudentIdAndAcademicTermId(studentId, academicTermId)
                                .orElse(null);

                return aspiration != null ? CareerAspirationDTO.from(aspiration) : null;
        }
}