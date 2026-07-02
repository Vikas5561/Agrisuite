package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.DealerSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DealerSubscriptionRepository extends JpaRepository<DealerSubscription, Long> {
    Optional<DealerSubscription> findFirstByDealerIdOrderByCreatedAtDesc(Long dealerId);
    List<DealerSubscription> findByDealerId(Long dealerId);
}
