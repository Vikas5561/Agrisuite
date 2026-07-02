package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByDealerId(Long dealerId);
    Optional<Invoice> findByPaymentId(Long paymentId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
