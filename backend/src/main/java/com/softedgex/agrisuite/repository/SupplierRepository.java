package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByDealerId(Long dealerId);
    Optional<Supplier> findBySupplierCode(String supplierCode);
}
