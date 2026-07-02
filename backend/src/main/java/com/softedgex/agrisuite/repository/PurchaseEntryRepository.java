package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.PurchaseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseEntryRepository extends JpaRepository<PurchaseEntry, Long> {
    List<PurchaseEntry> findByDealerIdOrderByCreatedAtDesc(Long dealerId);
}
