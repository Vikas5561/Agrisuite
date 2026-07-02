package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByDealerId(Long dealerId);
    Optional<Staff> findByEmployeeCode(String employeeCode);
    Optional<Staff> findByEmailAndDealerId(String email, Long dealerId);
    Optional<Staff> findByMobileAndDealerId(String mobile, Long dealerId);
    Optional<Staff> findByUserId(Long userId);
    long countByDealerId(Long dealerId);
}
