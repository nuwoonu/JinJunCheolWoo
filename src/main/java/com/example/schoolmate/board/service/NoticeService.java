package com.example.schoolmate.board.service;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.board.dto.NoticeDTO;
import com.example.schoolmate.board.dto.PageRequestDTO;
import com.example.schoolmate.board.dto.PageResultDTO;
import com.example.schoolmate.board.entity.Notice;
import com.example.schoolmate.board.repository.NoticeRepository;
import com.example.schoolmate.common.entity.User;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Transactional
@Log4j2
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    // 공지 등록
    public Long insert(NoticeDTO dto) {
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

    // 공지 삭제
    public void delete(Long nno) {
        log.info("공지 삭제: {}", nno);
        noticeRepository.deleteById(nno);
    }

    // 공지 수정
    public void update(NoticeDTO dto) {
        log.info("공지 수정: {}", dto);

        Notice notice = noticeRepository.findById(dto.getNno())
                .orElseThrow(() -> new IllegalArgumentException("공지를 찾을 수 없습니다."));

        notice.changeTitle(dto.getTitle());
        notice.changeContent(dto.getContent());
    }

    // 공지 단건 조회
    @Transactional(readOnly = true)
    public NoticeDTO getRow(Long nno) {
        log.info("공지 조회: {}", nno);

        Object result = noticeRepository.getNoticeByNno(nno);
        Object[] arr = (Object[]) result;

        return entityToDto((Notice) arr[0], (User) arr[1]);
    }

    // 공지 목록 조회
    @Transactional(readOnly = true)
    public PageResultDTO<NoticeDTO> getList(PageRequestDTO requestDTO) {
        log.info("공지 목록 조회: {}", requestDTO);

        Pageable pageable = PageRequest.of(
                requestDTO.getPage() - 1,
                requestDTO.getSize(),
                Sort.by("nno").descending()
        );

        Page<Object[]> result;
        if (requestDTO.getKeyword() != null && !requestDTO.getKeyword().isEmpty()) {
            result = noticeRepository.searchList(
                    requestDTO.getType(),
                    requestDTO.getKeyword(),
                    pageable
            );
        } else {
            result = noticeRepository.getListWithWriter(pageable);
        }

        Function<Object[], NoticeDTO> f = en -> entityToDto((Notice) en[0], (User) en[1]);

        List<NoticeDTO> dtoList = result.stream().map(f).collect(Collectors.toList());
        long totalCount = result.getTotalElements();

        return PageResultDTO.<NoticeDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(requestDTO)
                .totalCount(totalCount)
                .build();
    }

    // 최근 공지 목록 조회 (대시보드용)
    @Transactional(readOnly = true)
    public List<NoticeDTO> getRecentList(int size) {
        log.info("최근 공지 {} 건 조회", size);

        Pageable pageable = PageRequest.of(0, size, Sort.by("nno").descending());
        Page<Object[]> result = noticeRepository.getListWithWriter(pageable);

        return result.stream()
                .map(arr -> entityToDto((Notice) arr[0], (User) arr[1]))
                .collect(Collectors.toList());
    }

    // Entity -> DTO 변환
    private NoticeDTO entityToDto(Notice notice, User writer) {
        return NoticeDTO.builder()
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
