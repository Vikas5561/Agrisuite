package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByDealerId(Long dealerId);
    Optional<Product> findByProductCode(String productCode);
    Optional<Product> findByProductCodeAndDealerId(String productCode, Long dealerId);

    @Query("SELECT p FROM Product p WHERE p.dealerId = :dealerId AND p.stock <= p.minimumStock")
    List<Product> findLowStockProducts(@Param("dealerId") Long dealerId);

    @Query("SELECT p FROM Product p WHERE p.dealerId = :dealerId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.productCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("dealerId") Long dealerId, @Param("query") String query);

    long countByDealerId(Long dealerId);
}
