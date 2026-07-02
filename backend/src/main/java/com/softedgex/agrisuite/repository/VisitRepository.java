package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    List<Visit> findByDealerIdOrderByVisitDateDesc(Long dealerId);
    List<Visit> findByFarmerIdOrderByVisitDateDesc(Long farmerId);
    List<Visit> findByStaffIdOrderByVisitDateDesc(Long staffId);
}
