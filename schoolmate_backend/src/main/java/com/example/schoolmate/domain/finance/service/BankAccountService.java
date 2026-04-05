package com.example.schoolmate.domain.finance.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.finance.dto.BankAccountCreateDTO;
import com.example.schoolmate.domain.student.dto.StudentResponseDTO;
import com.example.schoolmate.domain.finance.entity.BankAccount;
import com.example.schoolmate.domain.finance.repository.BankAccountRepository;
import com.example.schoolmate.domain.parent.entity.ParentInfo;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.parent.repository.ParentInfoRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 계좌 등록 (동일 계좌번호+예금주 중복 시 기존 계좌 반환)
    @Transactional
    public StudentResponseDTO.BankAccountInfo registerBankAccount(BankAccountCreateDTO createDTO) {
        ParentInfo accountHolder = parentInfoRepository.findById(createDTO.getAccountHolderId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "예금주(부모)를 찾을 수 없습니다. ID: " + createDTO.getAccountHolderId()));

        Optional<BankAccount> existingAccount = bankAccountRepository
                .findByAccountNumberAndAccountHolder(
                        createDTO.getAccountNumber(),
                        createDTO.getAccountHolderId());

        if (existingAccount.isPresent()) {
            log.info("기존 계좌 재사용: {}", existingAccount.get().getAccountInfo());
            return StudentResponseDTO.BankAccountInfo.from(existingAccount.get());
        }

        BankAccount bankAccount = BankAccount.builder()
                .bankName(createDTO.getBankName())
                .accountNumber(createDTO.getAccountNumber())
                .accountHolder(accountHolder)
                .notes(createDTO.getNotes())
                .build();

        BankAccount saved = bankAccountRepository.save(bankAccount);
        String holderName = accountHolder.getUser() != null ? accountHolder.getUser().getName() : "미등록";
        log.info("계좌 등록: {} (예금주: {})", saved.getAccountInfo(), holderName);

        return StudentResponseDTO.BankAccountInfo.from(saved);
    }

    // 학생에게 계좌 연결
    @Transactional
    public void assignToStudent(Long accountId, Long studentInfoId) {
        BankAccount bankAccount = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. ID: " + accountId));

        StudentInfo student = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentInfoId));

        student.setBankAccount(bankAccount);
        log.info("학생 {} 에게 계좌 {} 연결 완료", studentInfoId, accountId);
    }

    // 학생의 계좌 연결 해제
    @Transactional
    public void unassignFromStudent(Long studentInfoId) {
        StudentInfo student = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentInfoId));

        student.setBankAccount(null);
        log.info("학생 {} 계좌 연결 해제 완료", studentInfoId);
    }

    // 계좌 정보 수정
    @Transactional
    public StudentResponseDTO.BankAccountInfo updateBankAccount(Long accountId, BankAccountCreateDTO updateDTO) {
        BankAccount bankAccount = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. ID: " + accountId));

        bankAccount.updateAccountInfo(
                updateDTO.getBankName(),
                updateDTO.getAccountNumber(),
                updateDTO.getNotes());

        log.info("계좌 정보 수정: {}", bankAccount.getAccountInfo());

        return StudentResponseDTO.BankAccountInfo.from(bankAccount);
    }

    // 학생의 계좌 조회
    public StudentResponseDTO.BankAccountInfo getBankAccountByStudent(Long studentInfoId) {
        log.info("학생 계좌 조회 - studentInfoId: {}", studentInfoId);
        return bankAccountRepository.findByStudentId(studentInfoId)
                .map(StudentResponseDTO.BankAccountInfo::from)
                .orElse(null);
    }

}

    