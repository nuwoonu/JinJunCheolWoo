package com.example.schoolmate.cheol.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "bank_accounts", uniqueConstraints = @UniqueConstraint(columnNames = { "account_number",
        "account_holder_id" }))
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "accountHolder", "students" })
public class BankAccount extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String bankName; // 은행명

    @Column(nullable = false, length = 50)
    private String accountNumber; // 계좌번호

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_holder_id", nullable = false)
    private ParentInfo accountHolder; // 예금주 (부모님)
    // ↑ 여기서 이름 가져오기: accountHolder.getUser().getName()

    @OneToMany(mappedBy = "bankAccount")
    @Builder.Default
    private List<StudentInfo> students = new ArrayList<>();

    @Column(length = 500)
    private String notes;

    // 계좌 정보 수정
    public void updateAccountInfo(String bankName, String accountNumber, String notes) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.notes = notes;
    }

    // 예금주명 가져오기 (메서드로 제공)
    public String getAccountHolderName() {
        if (accountHolder == null || accountHolder.getUser() == null) return null;
        return accountHolder.getUser().getName();
    }

    // 이 계좌를 사용하는 학생 수
    public int getStudentCount() {
        return students != null ? students.size() : 0;
    }

    // 계좌 정보 문자열
    public String getAccountInfo() {
        return String.format("%s %s (%s)",
                bankName, accountNumber, getAccountHolderName());
    }
}