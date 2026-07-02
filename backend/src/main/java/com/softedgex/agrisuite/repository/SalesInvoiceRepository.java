package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.SalesInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, Long> {
    List<SalesInvoice> findByDealerIdOrderByCreatedAtDesc(Long dealerId);
    List<SalesInvoice> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<SalesInvoice> findByDealerIdAndCreatedAtAfter(Long dealerId, java.time.LocalDateTime afterTime);
}
