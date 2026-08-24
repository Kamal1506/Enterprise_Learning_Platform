package com.skillsphere.certification.scheduler;

import com.skillsphere.certification.service.CertificationLifecycleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CertificationExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(CertificationExpiryScheduler.class);

    private final CertificationLifecycleService lifecycleService;

    public CertificationExpiryScheduler(CertificationLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    @Scheduled(cron = "${certification.expiry.scheduler.cron:0 0 0 * * ?}")
    public void scheduleExpiryCheck() {
        log.info("Triggering scheduled certification expiry check...");
        try {
            lifecycleService.runExpiryCheck();
            log.info("Scheduled certification expiry check run successfully.");
        } catch (Exception e) {
            log.error("Error occurred during scheduled certification expiry check: {}", e.getMessage(), e);
        }
    }
}
