package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    List<Farmer> findByDealerId(Long dealerId);
    Optional<Farmer> findByFarmerCode(String farmerCode);
    Optional<Farmer> findByMobileAndDealerId(String mobile, Long dealerId);
    
    @Query("SELECT f FROM Farmer f WHERE f.dealerId = :dealerId AND " +
           "(LOWER(f.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "f.mobile LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(f.farmerCode) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Farmer> searchFarmers(@Param("dealerId") Long dealerId, @Param("query") String query);
    
    long countByDealerId(Long dealerId);
}
