package com.example.schoolmate.parkjoon.service;

import com.example.schoolmate.common.dto.NoticeDTO;
import com.example.schoolmate.common.entity.SchoolNotice;
import com.example.schoolmate.common.entity.user.User;

import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.SchoolNoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminNoticeService {
    private final SchoolNoticeRepository schoolNoticeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<NoticeDTO.Response> getNoticeList(String keyword, Pageable pageable) {
        Page<SchoolNotice> page;
        if (keyword != null && !keyword.isBlank()) {
            page = schoolNoticeRepository.findByTitleContainingOrContentContainingOrderByIsImportantDescIdDesc(keyword,
                    keyword, pageable);
        } else {
            page = schoolNoticeRepository.findAllByOrderByIsImportantDescIdDesc(pageable);
        }
        return page.map(NoticeDTO.Response::from);
    }

    @Transactional(readOnly = true)
    public NoticeDTO.Response getNoticeDetail(Long id) {
        SchoolNotice notice = schoolNoticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));
        return NoticeDTO.Response.from(notice);
    }

    public void increaseViewCount(Long id) {
        SchoolNotice notice = schoolNoticeRepository.findById(id).orElseThrow();
        notice.increaseViewCount();
    }

    public Long createNotice(NoticeDTO.Request request, String writerEmail) {
        User writer = userRepository.findByEmail(writerEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        SchoolNotice notice = SchoolNotice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isImportant(request.isImportant())
                .writer(writer)
                .build();

        return schoolNoticeRepository.save(notice).getId();
    }

    public void updateNotice(NoticeDTO.Request request) {
        SchoolNotice notice = schoolNoticeRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));

        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setImportant(request.isImportant());
    }

    public void deleteNotice(Long id) {
        schoolNoticeRepository.deleteById(id);
    }
}