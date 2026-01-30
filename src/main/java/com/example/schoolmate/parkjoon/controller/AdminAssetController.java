package com.example.schoolmate.parkjoon.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.AssetDTO;
import com.example.schoolmate.common.entity.constant.AssetStatus;
import com.example.schoolmate.common.service.AssetService;
import com.example.schoolmate.config.SchoolmateUrls;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 기자재(Asset) 관리 컨트롤러
 * 
 * 노트북, 태블릿 등 학교 비품의 재고와 상태를 관리합니다.
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_ASSETS)
@RequiredArgsConstructor
public class AdminAssetController {

    private final AssetService adminAssetService;

    @GetMapping
    public String list(@RequestParam(value = "keyword", required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {
        model.addAttribute("assets", adminAssetService.getAssetList(keyword, pageable));
        model.addAttribute("summaries", adminAssetService.getAssetSummaries());
        model.addAttribute("statuses", AssetStatus.values());
        model.addAttribute("keyword", keyword);
        return SchoolmateUrls.ADMIN_ASSETS;
    }

    @PostMapping("/create")
    public String create(AssetDTO.Request request, RedirectAttributes ra) {
        try {
            adminAssetService.createAsset(request);
            ra.addFlashAttribute("successMessage", "기자재가 등록되었습니다.");
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "등록 실패: " + e.getMessage());
        }
        return "redirect:/" + SchoolmateUrls.ADMIN_ASSETS;
    }

    @PostMapping("/update")
    public String update(AssetDTO.Request request, RedirectAttributes ra) {
        adminAssetService.updateAsset(request);
        ra.addFlashAttribute("successMessage", "기자재 정보가 수정되었습니다.");
        return "redirect:/" + SchoolmateUrls.ADMIN_ASSETS;
    }

    @PostMapping("/delete")
    public String delete(@RequestParam("id") Long id, RedirectAttributes ra) {
        adminAssetService.deleteAsset(id);
        ra.addFlashAttribute("successMessage", "기자재가 삭제되었습니다.");
        return "redirect:/" + SchoolmateUrls.ADMIN_ASSETS;
    }
}