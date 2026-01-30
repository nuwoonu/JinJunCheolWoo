package com.example.schoolmate.common.service;

import com.example.schoolmate.common.dto.NoticeDTO;
import com.example.schoolmate.common.entity.SchoolNotice;
import com.example.schoolmate.common.entity.user.User;

import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.SchoolNoticeRepository;
import com.example.schoolmate.board.dto.PageRequestDTO;
import com.example.schoolmate.board.dto.PageResultDTO;
import com.example.schoolmate.board.entity.Notice;
import com.example.schoolmate.board.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class NoticeService {
    private final SchoolNoticeRepository schoolNoticeRepository;
    private final UserRepository userRepository;
    private final NoticeRepository noticeRepository;

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

    // cheol 구현 기능
    public Long insert(com.example.schoolmate.board.dto.NoticeDTO dto) {
        log.info("공지 등록: {}", dto);

        User writer = userRepository.findById(dto.getWriterId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Notice notice = Notice.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .writer(writer)
                .build();

        return noticeRepository.save(notice).getNno();
    }

    // cheol 구현 기능
    public void delete(Long nno) {
        log.info("공지 삭제: {}", nno);
        noticeRepository.deleteById(nno);
    }

    // cheol 구현 기능
    public void update(com.example.schoolmate.board.dto.NoticeDTO dto) {
        log.info("공지 수정: {}", dto);

        Notice notice = noticeRepository.findById(dto.getNno())
                .orElseThrow(() -> new IllegalArgumentException("공지를 찾을 수 없습니다."));

        notice.changeTitle(dto.getTitle());
        notice.changeContent(dto.getContent());
    }

    // cheol 구현 기능
    @Transactional(readOnly = true)
    public com.example.schoolmate.board.dto.NoticeDTO getRow(Long nno) {
        log.info("공지 조회: {}", nno);

        Object result = noticeRepository.getNoticeByNno(nno);
        Object[] arr = (Object[]) result;

        return entityToDto((Notice) arr[0], (User) arr[1]);
    }

    // cheol 구현 기능
    @Transactional(readOnly = true)
    public PageResultDTO<com.example.schoolmate.board.dto.NoticeDTO> getList(PageRequestDTO requestDTO) {
        log.info("공지 목록 조회: {}", requestDTO);

        Pageable pageable = PageRequest.of(
                requestDTO.getPage() - 1,
                requestDTO.getSize(),
                Sort.by("nno").descending());

        Page<Object[]> result;
        if (requestDTO.getKeyword() != null && !requestDTO.getKeyword().isEmpty()) {
            result = noticeRepository.searchList(
                    requestDTO.getType(),
                    requestDTO.getKeyword(),
                    pageable);
        } else {
            result = noticeRepository.getListWithWriter(pageable);
        }

        Function<Object[], com.example.schoolmate.board.dto.NoticeDTO> f = en -> entityToDto((Notice) en[0],
                (User) en[1]);

        List<com.example.schoolmate.board.dto.NoticeDTO> dtoList = result.stream().map(f).collect(Collectors.toList());
        long totalCount = result.getTotalElements();

        return PageResultDTO.<com.example.schoolmate.board.dto.NoticeDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(requestDTO)
                .totalCount(totalCount)
                .build();
    }

    // cheol 구현 기능
    @Transactional(readOnly = true)
    public List<com.example.schoolmate.board.dto.NoticeDTO> getRecentList(int size) {
        log.info("최근 공지 {} 건 조회", size);

        Pageable pageable = PageRequest.of(0, size, Sort.by("nno").descending());
        Page<Object[]> result = noticeRepository.getListWithWriter(pageable);

        return result.stream()
                .map(arr -> entityToDto((Notice) arr[0], (User) arr[1]))
                .collect(Collectors.toList());
    }

    // cheol 구현 기능
    private com.example.schoolmate.board.dto.NoticeDTO entityToDto(Notice notice, User writer) {
        return com.example.schoolmate.board.dto.NoticeDTO.builder()
                .nno(notice.getNno())
                .title(notice.getTitle())
                .content(notice.getContent())
                .writerId(writer.getUid())
                .writerEmail(writer.getEmail())
                .writerName(writer.getName())
                .createDate(notice.getCreateDate())
                .updateDate(notice.getUpdateDate())
                .build();
    }
}