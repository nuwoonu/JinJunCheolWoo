package com.example.schoolmate.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.entity.Parent;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.repository.ParentRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parent/children")
@PreAuthorize("hasRole('PARENT')")
@RequiredArgsConstructor
public class MyChildrenController {

    private final ParentRepository parentRepository;

    @GetMapping("/status")
    public String getChildrenStatus(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();

        Parent parent = parentRepository.findById(uid).orElse(null);
        if (parent != null) {
            List<ChildDTO> children = parent.getChildren().stream()
                .map(this::convertToChildDTO)
                .collect(Collectors.toList());
            model.addAttribute("children", children);
        }

        return "parent/children/status";
    }

    private ChildDTO convertToChildDTO(Student student) {
        String imageUrl = null;
        Profile profile = student.getProfile();
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        return ChildDTO.builder()
            .id(student.getUid())
            .name(student.getName())
            .studentNumber(student.getStudentNumber())
            .grade(student.getGrade())
            .classNum(student.getClassNum())
            .profileImageUrl(imageUrl)
            .build();
    }
}
