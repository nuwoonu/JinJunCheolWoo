package com.example.schoolmate.domain.servicenotice.service;

import com.example.schoolmate.domain.servicenotice.dto.ServiceNoticeDTO;
import com.example.schoolmate.domain.servicenotice.entity.ServiceNotice;
import com.example.schoolmate.domain.servicenotice.repository.ServiceNoticeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ServiceNoticeService {

    private final ServiceNoticeRepository serviceNoticeRepository;

    @Transactional(readOnly = true)
    public Page<ServiceNoticeDTO.Summary> getList(String keyword, Pageable pageable) {
        return serviceNoticeRepository.findAllActive(keyword, pageable)
                .map(ServiceNoticeDTO.Summary::fromEntity);
    }

    @Transactional
    public ServiceNoticeDTO.Detail getDetail(Long id) {
        ServiceNotice notice = serviceNoticeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("공지를 찾을 수 없습니다."));
        notice.incrementViewCount();
        return ServiceNoticeDTO.Detail.fromEntity(notice);
    }

    @Transactional
    public void create(ServiceNoticeDTO.Request request, String writerName) {
        ServiceNotice notice = ServiceNotice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .writerName(writerName)
                .isPinned(request.isPinned())
                .build();
        serviceNoticeRepository.save(notice);
    }

    @Transactional
    public void update(Long id, ServiceNoticeDTO.Request request) {
        ServiceNotice notice = serviceNoticeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("공지를 찾을 수 없습니다."));
        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setPinned(request.isPinned());
    }

    @Transactional
    public void delete(Long id) {
        ServiceNotice notice = serviceNoticeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("공지를 찾을 수 없습니다."));
        notice.setDeleted(true);
    }
}
