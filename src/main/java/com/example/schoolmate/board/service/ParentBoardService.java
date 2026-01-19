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

import com.example.schoolmate.board.dto.PageRequestDTO;
import com.example.schoolmate.board.dto.PageResultDTO;
import com.example.schoolmate.board.dto.ParentBoardDTO;
import com.example.schoolmate.board.entity.ParentBoard;
import com.example.schoolmate.board.repository.ParentBoardRepository;
import com.example.schoolmate.common.entity.User;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Transactional
@Log4j2
@Service
@RequiredArgsConstructor
public class ParentBoardService {

    private final ParentBoardRepository parentBoardRepository;
    private final UserRepository userRepository;

    // 게시글 등록
    public Long insert(ParentBoardDTO dto) {
        log.info("게시글 등록: {}", dto);

        User writer = userRepository.findById(dto.getWriterId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ParentBoard board = ParentBoard.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .writer(writer)
                .build();

        return parentBoardRepository.save(board).getBno();
    }

    // 게시글 삭제
    public void delete(Long bno) {
        log.info("게시글 삭제: {}", bno);
        parentBoardRepository.deleteById(bno);
    }

    // 게시글 수정
    public void update(ParentBoardDTO dto) {
        log.info("게시글 수정: {}", dto);

        ParentBoard board = parentBoardRepository.findById(dto.getBno())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContent());
    }

    // 게시글 단건 조회
    @Transactional(readOnly = true)
    public ParentBoardDTO getRow(Long bno) {
        log.info("게시글 조회: {}", bno);

        Object result = parentBoardRepository.getBoardByBno(bno);
        Object[] arr = (Object[]) result;

        return entityToDto((ParentBoard) arr[0], (User) arr[1]);
    }

    // 게시글 목록 조회
    @Transactional(readOnly = true)
    public PageResultDTO<ParentBoardDTO> getList(PageRequestDTO requestDTO) {
        log.info("게시글 목록 조회: {}", requestDTO);

        Pageable pageable = PageRequest.of(
                requestDTO.getPage() - 1,
                requestDTO.getSize(),
                Sort.by("bno").descending()
        );

        Page<Object[]> result;
        if (requestDTO.getKeyword() != null && !requestDTO.getKeyword().isEmpty()) {
            result = parentBoardRepository.searchList(
                    requestDTO.getType(),
                    requestDTO.getKeyword(),
                    pageable
            );
        } else {
            result = parentBoardRepository.getListWithWriter(pageable);
        }

        Function<Object[], ParentBoardDTO> f = en -> entityToDto((ParentBoard) en[0], (User) en[1]);

        List<ParentBoardDTO> dtoList = result.stream().map(f).collect(Collectors.toList());
        long totalCount = result.getTotalElements();

        return PageResultDTO.<ParentBoardDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(requestDTO)
                .totalCount(totalCount)
                .build();
    }

    // 최근 게시글 목록 조회 (대시보드용)
    @Transactional(readOnly = true)
    public List<ParentBoardDTO> getRecentList(int size) {
        log.info("최근 게시글 {} 건 조회", size);

        Pageable pageable = PageRequest.of(0, size, Sort.by("bno").descending());
        Page<Object[]> result = parentBoardRepository.getListWithWriter(pageable);

        return result.stream()
                .map(arr -> entityToDto((ParentBoard) arr[0], (User) arr[1]))
                .collect(Collectors.toList());
    }

    // Entity -> DTO 변환
    private ParentBoardDTO entityToDto(ParentBoard board, User writer) {
        return ParentBoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .writerId(writer.getUid())
                .writerEmail(writer.getEmail())
                .writerName(writer.getName())
                .createDate(board.getCreateDate())
                .updateDate(board.getUpdateDate())
                .build();
    }
}
