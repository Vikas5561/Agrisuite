package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.CreditCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CreditCollectionRepository extends JpaRepository<CreditCollection, Long> {
    List<CreditCollection> findByDealerIdOrderByCollectedAtDesc(Long dealerId);
    List<CreditCollection> findByFarmerIdOrderByCollectedAtDesc(Long farmerId);
}
