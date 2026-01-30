package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.FacilityDTO;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.parkjoon.service.AdminFacilityService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 시설/자산 관리 컨트롤러
 * 
 * 학교 시설(강의실, 특별실) 및 기자재(노트북, 태블릿 등) 관리 페이지를 처리합니다.
 * - 시설 및 자산 목록 조회 화면 연결
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_FACILITIES)
@RequiredArgsConstructor
public class AdminFacilityController {

    private final AdminFacilityService adminFacilityService;

    @GetMapping("/rooms")
    public String rooms(Model model) {
        model.addAttribute("facilities", adminFacilityService.getAllFacilities());
        return SchoolmateUrls.ADMIN_FACILITIES + "/rooms";
    }

    @PostMapping("/rooms/create")
    public String createRoom(FacilityDTO.Request request, RedirectAttributes ra) {
        adminFacilityService.createFacility(request);
        ra.addFlashAttribute("successMessage", "시설이 등록되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_FACILITIES + "/rooms";
    }

    @PostMapping("/rooms/update")
    public String updateRoom(FacilityDTO.Request request, RedirectAttributes ra) {
        adminFacilityService.updateFacility(request);
        ra.addFlashAttribute("successMessage", "시설 정보가 수정되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_FACILITIES + "/rooms";
    }

    @PostMapping("/rooms/delete")
    public String deleteRoom(@RequestParam("id") Long id, RedirectAttributes ra) {
        adminFacilityService.deleteFacility(id);
        ra.addFlashAttribute("successMessage", "시설이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_FACILITIES + "/rooms";
    }
}