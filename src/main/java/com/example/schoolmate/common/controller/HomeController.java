package com.example.schoolmate.common.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
// import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * 공통 홈 컨트롤러 (Joon)
 * "/" 경로는 LoginController에서 처리 (redirect:/login)
 */
@Controller
public class HomeController {

    @GetMapping("/home")
    public String getHome(Authentication auth) {
        if (auth == null) {
            return "redirect:/main";
        }
        // 각 Role에 따른 dashboard로 리다이렉트[woo]
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return "redirect:/dashboard/admin";
        }
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"))) {
            return "redirect:/dashboard/teacher";
        }
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            return "redirect:/dashboard/student";
        }
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PARENT"))) {
            return "redirect:/parent/dashboard";
        }

        return "redirect:/main";
    }

    @GetMapping("/main")
    public String getMain() {
        return "main";
    }

}
