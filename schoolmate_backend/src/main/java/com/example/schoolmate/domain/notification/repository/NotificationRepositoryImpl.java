package com.example.schoolmate.domain.notification.repository;

import java.util.List;

import com.example.schoolmate.domain.notification.entity.Notification;
import com.example.schoolmate.domain.notification.entity.QNotification;
import com.example.schoolmate.domain.user.entity.User;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public List<Notification> findActiveByReceiver(User receiver) {
        QNotification n = QNotification.notification;
        return query.selectFrom(n)
                .where(n.receiver.eq(receiver)
                        .and(n.isDeleted.isFalse()))
                .orderBy(n.createDate.desc())
                .fetch();
    }

    @Override
    public long countUnreadActiveByReceiver(User receiver) {
        QNotification n = QNotification.notification;
        Long result = query.select(n.count())
                .from(n)
                .where(n.receiver.eq(receiver)
                        .and(n.isRead.isFalse())
                        .and(n.isDeleted.isFalse()))
                .fetchOne();
        return result != null ? result : 0L;
    }
}
