package com.example.schoolmate.common.repository.notice;

import java.util.List;

import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.notification.QNotification;
import com.example.schoolmate.common.entity.user.User;
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
