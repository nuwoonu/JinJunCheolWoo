package com.example.schoolmate.domain.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.finance.entity.BankAccount;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    // 계좌번호와 예금주로 조회 (중복 체크용)
    @Query("""
            SELECT ba FROM BankAccount ba
            WHERE ba.accountNumber = :accountNumber
            AND ba.accountHolder.id = :accountHolderId
            """)
    Optional<BankAccount> findByAccountNumberAndAccountHolder(
            @Param("accountNumber") String accountNumber,
            @Param("accountHolderId") Long accountHolderId);

    // 특정 부모의 모든 계좌 조회
    @Query("""
            SELECT ba FROM BankAccount ba
            LEFT JOIN FETCH ba.students
            WHERE ba.accountHolder.id = :parentId
            ORDER BY ba.createDate DESC
            """)
    List<BankAccount> findByAccountHolderIdWithStudents(@Param("parentId") Long parentId);

    // 특정 학생의 계좌 조회
    @Query("""
            SELECT ba FROM BankAccount ba
            JOIN ba.students s
            WHERE s.id = :studentId
            """)
    Optional<BankAccount> findByStudentId(@Param("studentId") Long studentId);

    // 학생이 없는 계좌 조회 (미사용 계좌)
    @Query("SELECT ba FROM BankAccount ba WHERE ba.students IS EMPTY")
    List<BankAccount> findUnusedAccounts();

    // 은행명으로 검색
    List<BankAccount> findByBankNameContainingOrderByCreateDateDesc(String bankName);

    // 예금주명으로 검색
    @Query("""
            SELECT ba FROM BankAccount ba
            WHERE ba.accountHolder.user.name LIKE %:holderName%
            ORDER BY ba.createDate DESC
            """)
    List<BankAccount> findByAccountHolderNameContaining(@Param("holderName") String holderName);
}
