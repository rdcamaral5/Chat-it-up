package com.info5059.vendor.purchaseorder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController

public class PurchaseOrderController {
   
    @Autowired
    private PurchaseOrderDAO purchaseOrderDAO;

    @Autowired
    private PurchaseOrderRepository purchaseRepository;

    @GetMapping("/api/pos/{id}")
    public ResponseEntity<Iterable<PurchaseOrder>> findByVendor(@PathVariable Long id) {
        Iterable<PurchaseOrder> reports = purchaseOrderDAO.findByVendor(id);
        return new ResponseEntity<Iterable<PurchaseOrder>>(reports, HttpStatus.OK);
    }

    @GetMapping("/api/pos/")
    public ResponseEntity<Iterable<PurchaseOrder>> findAll() {
        Iterable<PurchaseOrder> po = purchaseRepository.findAll();
        return new ResponseEntity<Iterable<PurchaseOrder>>(po, HttpStatus.OK);
    }
    @PostMapping("/api/pos/")
    public ResponseEntity<Long> addOne(@RequestBody PurchaseOrder clientrep) { // use RequestBody here
        Long poId = purchaseOrderDAO.create(clientrep);
        return new ResponseEntity<Long>(poId, HttpStatus.OK);
    }
}