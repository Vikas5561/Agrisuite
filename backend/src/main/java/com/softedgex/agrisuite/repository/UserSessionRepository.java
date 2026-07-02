package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findByRefreshToken(String refreshToken);
    List<UserSession> findByUserIdAndStatus(Long userId, String status);
    long countByUserIdAndStatus(Long userId, String status);
}
