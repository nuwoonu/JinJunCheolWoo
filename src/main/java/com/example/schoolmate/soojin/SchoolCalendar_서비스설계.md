# SchoolCalendar 서비스 설계 문서

## 목표
학사 일정을 **캘린더 형식**과 **목록 형식**으로 조회할 수 있는 서비스 구현

---

## 1. 엔티티 구조 (기존)

**파일**: `entity/SchoolCalendar.java`

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| title | String | 일정 제목 |
| startDate | LocalDate | 시작일 |
| endDate | LocalDate | 종료일 (nullable, 당일행사는 null) |
| eventType | EventType | 일정 유형 |
| targetGrade | Integer | 대상 학년 (null=전체) |
| description | String | 상세 설명 |

**EventType** (8가지):
- SCHOOL_EVENT(학교행사), EXAM(시험), HOLIDAY(휴일), VACATION(방학)
- FIELD_TRIP(현장학습), MEETING(회의), BRIEFING(설명회), OTHER(기타)

---

## 2. DTO 구조 (기존)

**파일**: `common/dto/dashboardinfo/SchoolCalendarDTO.java`

```java
public class SchoolCalendarDTO {
    private Long id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private EventType eventType;
    private String eventTypeText;    // "학교행사", "시험" 등
    private Integer targetGrade;
    private String description;
    private Integer dDay;            // D-Day 계산값
    private String dateRangeText;    // "1/23(금)" 또는 "1/23(금) ~ 1/25(일)"
}
```

---

## 3. Repository 추가 메서드

**파일**: `repository/CalendarRepository.java`

```java
public interface CalendarRepository extends JpaRepository<SchoolCalendar, Long> {

    // 월별 조회 (해당 월에 걸쳐있는 모든 일정)
    @Query("SELECT c FROM SchoolCalendar c " +
           "WHERE c.startDate <= :endOfMonth " +
           "AND (c.endDate >= :startOfMonth OR (c.endDate IS NULL AND c.startDate >= :startOfMonth)) " +
           "ORDER BY c.startDate")
    List<SchoolCalendar> findByMonth(@Param("startOfMonth") LocalDate startOfMonth,
                                      @Param("endOfMonth") LocalDate endOfMonth);

    // 학년 필터링 (전체 대상 + 특정 학년)
    @Query("SELECT c FROM SchoolCalendar c " +
           "WHERE c.startDate <= :endOfMonth " +
           "AND (c.endDate >= :startOfMonth OR (c.endDate IS NULL AND c.startDate >= :startOfMonth)) " +
           "AND (c.targetGrade IS NULL OR c.targetGrade = :grade) " +
           "ORDER BY c.startDate")
    List<SchoolCalendar> findByMonthAndGrade(@Param("startOfMonth") LocalDate startOfMonth,
                                              @Param("endOfMonth") LocalDate endOfMonth,
                                              @Param("grade") Integer grade);

    // 다가오는 일정 (오늘 이후)
    List<SchoolCalendar> findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);
}
```

---

## 4. Service 구현

**파일**: `service/SchoolCalendarService.java`

```java
@Transactional
@Log4j2
@Service
@RequiredArgsConstructor
public class SchoolCalendarService {

    private final CalendarRepository calendarRepository;

    // ==================== 조회 (모든 사용자) ====================

    /**
     * 캘린더 형식 - 월별 일정 조회
     */
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getMonthlyCalendar(int year, int month, Integer grade) {
        log.info("월별 일정 조회: {}년 {}월, 학년: {}", year, month, grade);

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        List<SchoolCalendar> events = (grade != null)
            ? calendarRepository.findByMonthAndGrade(startOfMonth, endOfMonth, grade)
            : calendarRepository.findByMonth(startOfMonth, endOfMonth);

        return events.stream()
            .map(this::entityToDto)
            .collect(Collectors.toList());
    }

    /**
     * 목록 형식 - 기간별 일정 조회
     */
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getEventList(LocalDate start, LocalDate end,
                                                 Integer grade, EventType eventType) {
        log.info("일정 목록 조회: {} ~ {}, 학년: {}, 유형: {}", start, end, grade, eventType);

        List<SchoolCalendar> events = calendarRepository.findByMonth(start, end);

        return events.stream()
            .filter(e -> grade == null || e.getTargetGrade() == null || e.getTargetGrade().equals(grade))
            .filter(e -> eventType == null || e.getEventType() == eventType)
            .map(this::entityToDto)
            .collect(Collectors.toList());
    }

    /**
     * 다가오는 일정 조회 (대시보드용)
     */
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getUpcomingEvents(int limit) {
        log.info("다가오는 일정 {} 건 조회", limit);

        return calendarRepository.findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate.now())
            .stream()
            .limit(limit)
            .map(this::entityToDto)
            .collect(Collectors.toList());
    }

    // ==================== 관리 (관리자 전용) ====================

    @PreAuthorize("hasRole('ADMIN')")
    public Long insert(SchoolCalendarDTO dto) {
        log.info("일정 등록: {}", dto);

        SchoolCalendar calendar = SchoolCalendar.builder()
            .title(dto.getTitle())
            .startDate(dto.getStartDate())
            .endDate(dto.getEndDate())
            .eventType(dto.getEventType())
            .targetGrade(dto.getTargetGrade())
            .description(dto.getDescription())
            .build();

        return calendarRepository.save(calendar).getId();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void update(SchoolCalendarDTO dto) {
        log.info("일정 수정: {}", dto);

        SchoolCalendar calendar = calendarRepository.findById(dto.getId())
            .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

        calendar.changeTitle(dto.getTitle());
        calendar.changeStartDate(dto.getStartDate());
        calendar.changeEndDate(dto.getEndDate());
        calendar.changeEventType(dto.getEventType());
        calendar.changeTargetGrade(dto.getTargetGrade());
        calendar.changeDescription(dto.getDescription());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(Long id) {
        log.info("일정 삭제: {}", id);
        calendarRepository.deleteById(id);
    }

    // ==================== 변환 메서드 ====================

    private SchoolCalendarDTO entityToDto(SchoolCalendar entity) {
        return SchoolCalendarDTO.builder()
            .id(entity.getId())
            .title(entity.getTitle())
            .startDate(entity.getStartDate())
            .endDate(entity.getEndDate())
            .eventType(entity.getEventType())
            .eventTypeText(entity.getEventType().getDescription())
            .targetGrade(entity.getTargetGrade())
            .description(entity.getDescription())
            .dDay(calculateDDay(entity.getStartDate()))
            .dateRangeText(formatDateRange(entity.getStartDate(), entity.getEndDate()))
            .build();
    }

    private Integer calculateDDay(LocalDate eventDate) {
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), eventDate);
    }

    private String formatDateRange(LocalDate start, LocalDate end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d(E)", Locale.KOREAN);
        String startText = start.format(formatter);

        if (end == null || end.equals(start)) {
            return startText;
        }
        return startText + " ~ " + end.format(formatter);
    }
}
```

---

## 5. Controller 구현

**파일**: `controller/SchoolCalendarController.java`

```java
@Log4j2
@Controller
@RequiredArgsConstructor
@RequestMapping("/calendar")
public class SchoolCalendarController {

    private final SchoolCalendarService calendarService;

    // ==================== 조회 (모든 로그인 사용자) ====================

    @GetMapping("/monthly")
    public String monthlyView(@RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year,
                              @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
                              @RequestParam(required = false) Integer grade,
                              Model model) {
        List<SchoolCalendarDTO> events = calendarService.getMonthlyCalendar(year, month, grade);
        model.addAttribute("events", events);
        model.addAttribute("year", year);
        model.addAttribute("month", month);
        return "calendar/monthly";
    }

    @GetMapping("/list")
    public String listView(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
                           @RequestParam(required = false) Integer grade,
                           @RequestParam(required = false) EventType eventType,
                           Model model) {
        List<SchoolCalendarDTO> events = calendarService.getEventList(start, end, grade, eventType);
        model.addAttribute("events", events);
        return "calendar/list";
    }

    // API (AJAX용)
    @GetMapping("/api/events")
    @ResponseBody
    public List<SchoolCalendarDTO> getEvents(@RequestParam int year,
                                              @RequestParam int month,
                                              @RequestParam(required = false) Integer grade) {
        return calendarService.getMonthlyCalendar(year, month, grade);
    }

    // ==================== 관리 (관리자 전용) ====================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/add")
    public String addForm(Model model) {
        model.addAttribute("eventTypes", EventType.values());
        return "calendar/admin/add";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/add")
    public String add(@ModelAttribute SchoolCalendarDTO dto, RedirectAttributes rttr) {
        calendarService.insert(dto);
        rttr.addFlashAttribute("msg", "일정이 등록되었습니다.");
        return "redirect:/calendar/list";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/edit/{id}")
    public String editForm(@PathVariable Long id, Model model) {
        // getOne 메서드 필요
        model.addAttribute("eventTypes", EventType.values());
        return "calendar/admin/edit";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/update")
    public String update(@ModelAttribute SchoolCalendarDTO dto, RedirectAttributes rttr) {
        calendarService.update(dto);
        rttr.addFlashAttribute("msg", "일정이 수정되었습니다.");
        return "redirect:/calendar/list";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/delete/{id}")
    public String delete(@PathVariable Long id, RedirectAttributes rttr) {
        calendarService.delete(id);
        rttr.addFlashAttribute("msg", "일정이 삭제되었습니다.");
        return "redirect:/calendar/list";
    }
}
```

---

## 6. 권한 정리

| 기능 | 대상 역할 | 구현 방법 |
|------|----------|----------|
| 캘린더 조회 | 모든 로그인 사용자 | `authenticated()` |
| 목록 조회 | 모든 로그인 사용자 | `authenticated()` |
| 일정 등록 | ADMIN | `@PreAuthorize("hasRole('ADMIN')")` |
| 일정 수정 | ADMIN | `@PreAuthorize("hasRole('ADMIN')")` |
| 일정 삭제 | ADMIN | `@PreAuthorize("hasRole('ADMIN')")` |

---

## 7. Entity 수정 필요

`entity/SchoolCalendar.java`에 변경 메서드 추가:

```java
// 변경 메서드
public void changeTitle(String title) { this.title = title; }
public void changeStartDate(LocalDate startDate) { this.startDate = startDate; }
public void changeEndDate(LocalDate endDate) { this.endDate = endDate; }
public void changeEventType(EventType eventType) { this.eventType = eventType; }
public void changeTargetGrade(Integer targetGrade) { this.targetGrade = targetGrade; }
public void changeDescription(String description) { this.description = description; }
```

---

## 8. 생성/수정할 파일 목록

| 파일 | 작업 |
|------|------|
| `service/SchoolCalendarService.java` | 새로 생성 |
| `controller/SchoolCalendarController.java` | 새로 생성 |
| `repository/CalendarRepository.java` | 쿼리 메서드 추가 |
| `entity/SchoolCalendar.java` | 변경 메서드 추가 |

---

## 9. 필요한 import 목록

### Service
```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.soojin.entity.SchoolCalendar;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.repository.CalendarRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
```

### Controller
```java
import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.service.SchoolCalendarService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
```

### Repository
```java
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.SchoolCalendar;
```
