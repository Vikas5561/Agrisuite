package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDealerIdOrderBySentAtDesc(Long dealerId);
}
