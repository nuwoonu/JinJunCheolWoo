package com.example.schoolmate.cheol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalDetailsRequestDTO {

    private String bloodGroup;

    private Double height;

    private Double weight;
}
