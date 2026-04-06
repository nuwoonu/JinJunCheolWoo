package com.example.schoolmate.domain.finance.dto;
import com.example.schoolmate.domain.parent.entity.ParentInfo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountCreateDTO {

    @NotBlank(message = "은행명은 필수입니다.")
    private String bankName;

    @NotBlank(message = "계좌번호는 필수입니다.")
    private String accountNumber;

    @NotNull(message = "예금주 ID는 필수입니다.")
    private Long accountHolderId; // ParentInfo ID
    // ↑ 예금주명은 ParentInfo에서 자동으로 가져옴

    private String notes;
}