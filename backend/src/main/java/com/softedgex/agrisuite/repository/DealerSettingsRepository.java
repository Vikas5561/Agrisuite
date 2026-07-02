package com.softedgex.agrisuite.repository;

import com.softedgex.agrisuite.model.DealerSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerSettingsRepository extends JpaRepository<DealerSettings, Long> {
}
