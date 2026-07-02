package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.LoginAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoginAuditLogRepository extends JpaRepository<LoginAuditLog, Long> {
    List<LoginAuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<LoginAuditLog> findByDealerIdOrderByTimestampDesc(Long dealerId);
    List<LoginAuditLog> findTop20ByOrderByTimestampDesc();
}
