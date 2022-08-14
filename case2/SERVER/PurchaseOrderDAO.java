package com.info5059.vendor.purchaseorder;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.EntityManager;
import javax.persistence.EntityNotFoundException;
import javax.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;


@Component
public class PurchaseOrderDAO {

    
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Long create(PurchaseOrder clientrep) {
        PurchaseOrder realReport = new PurchaseOrder();
        realReport.setPodate(LocalDateTime.now());
        realReport.setVendorid(clientrep.getVendorid());
        realReport.setAmount(clientrep.getAmount());
        entityManager.persist(realReport);
        for (PurchaseOrderLineitem item : clientrep.getItems()) {
            PurchaseOrderLineitem realItem = new PurchaseOrderLineitem();
            realItem.setPoid(realReport.getId());
            realItem.setProductid(item.getProductid());
            realItem.setPrice(item.getPrice());
            realItem.setQty(item.getQty());
            entityManager.persist(realItem);
        }
        return realReport.getId();
    }

    public PurchaseOrder findOne(Long id) {
        PurchaseOrder po = entityManager.find(PurchaseOrder.class, id);
        if (po == null) {
            throw new EntityNotFoundException("Can't find report for ID "
                    + id);
        }
        return po;
    }

    @SuppressWarnings("unchecked")
    public List<PurchaseOrder> findByVendor(Long vendorid) {
        return entityManager.createQuery("select r from PurchaseOrder r where r.vendorid = :id")
                .setParameter("id", vendorid)
                .getResultList();
    }

}
