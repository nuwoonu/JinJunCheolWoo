package com.example.schoolmate.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequestMapping("/parent/children")
@PreAuthorize("hasRole('PARENT')")
@RequiredArgsConstructor
@Log4j2
public class MyChildrenController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    @GetMapping("/status")
    public String getChildrenStatus(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();

        User parentUser = userRepository.findById(uid).orElse(null);
        if (parentUser != null) {
            ParentInfo parentInfo = parentUser.getInfo(ParentInfo.class);
            if (parentInfo != null && parentInfo.getChildrenRelations() != null) {
                List<ChildDTO> children = parentInfo.getChildrenRelations().stream()
                        .map(relation -> convertToChildDTO(relation.getStudentInfo()))
                        .collect(Collectors.toList());
                model.addAttribute("children", children);
            } else {
                model.addAttribute("children", new ArrayList<>());
            }
        } else {
            model.addAttribute("children", new ArrayList<>());
        }

        return "parent/children/status";
    }

    private ChildDTO convertToChildDTO(StudentInfo studentInfo) {
        User studentUser = studentInfo.getUser();

        String imageUrl = null;
        Profile profile = profileRepository.findByUser(studentUser).orElse(null);
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        int currentYear = LocalDate.now().getYear();
        StudentAssignment assignment = studentInfo.getCurrentAssignment(currentYear);

        return ChildDTO.builder()
                .id(studentUser.getUid())
                .name(studentUser.getName())
                .studentNumber(studentInfo.getStudentIdentityNum())
                .grade(assignment != null ? assignment.getGrade() : null)
                .classNum(assignment != null ? assignment.getClassNum() : null)
                .profileImageUrl(imageUrl)
                .build();
    }
}
