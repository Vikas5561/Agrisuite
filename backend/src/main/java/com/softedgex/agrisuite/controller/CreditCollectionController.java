package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.CreditCollection;
import com.softedgex.agrisuite.service.CreditCollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/collections")
public class CreditCollectionController {

    @Autowired
    private CreditCollectionService creditCollectionService;

    @GetMapping
    public ResponseEntity<List<CreditCollection>> getAllCollections() {
        return ResponseEntity.ok(creditCollectionService.getCollections());
    }

    @PostMapping
    public ResponseEntity<CreditCollection> collectCredit(@RequestBody CreditCollection collection) {
        return ResponseEntity.ok(creditCollectionService.collectCredit(collection));
    }
}
