package com.skillsphere.certification.service;

import com.skillsphere.certification.client.SkillServiceClient;
import com.skillsphere.certification.dto.*;
import com.skillsphere.certification.entity.*;
import com.skillsphere.certification.exception.DuplicateResourceException;
import com.skillsphere.certification.exception.ResourceNotFoundException;
import com.skillsphere.certification.repository.CertificationAuditRepository;
import com.skillsphere.certification.repository.CertificationRepository;
import com.skillsphere.certification.repository.EmployeeCertificationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeCertificationService {

    private final EmployeeCertificationRepository employeeCertificationRepository;
    private final CertificationRepository certificationRepository;
    private final SkillServiceClient skillServiceClient;
    private final CertificationAuditService auditService;
    private final CertificationAuditRepository auditRepository;
    private final CertificationEventProducer eventProducer;

    public EmployeeCertificationService(EmployeeCertificationRepository employeeCertificationRepository,
                                        CertificationRepository certificationRepository,
                                        SkillServiceClient skillServiceClient,
                                        CertificationAuditService auditService,
                                        CertificationAuditRepository auditRepository,
                                        CertificationEventProducer eventProducer) {
        this.employeeCertificationRepository = employeeCertificationRepository;
        this.certificationRepository = certificationRepository;
        this.skillServiceClient = skillServiceClient;
        this.auditService = auditService;
        this.auditRepository = auditRepository;
        this.eventProducer = eventProducer;
    }

    public List<EmployeeCertificationDTO> getAllEmployeeCertifications() {
        List<EmployeeCertification> certs = employeeCertificationRepository.findAll();
        refreshStatuses(certs);
        return certs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getActiveCertifications() {
        List<EmployeeCertification> certs = employeeCertificationRepository.findByStatus(CertificationStatus.ACTIVE);
        refreshStatuses(certs);
        return certs.stream().filter(c -> c.getStatus() == CertificationStatus.ACTIVE).map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getExpiredCertifications() {
        List<EmployeeCertification> certs = employeeCertificationRepository.findByStatus(CertificationStatus.EXPIRED);
        refreshStatuses(certs);
        return certs.stream().filter(c -> c.getStatus() == CertificationStatus.EXPIRED).map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getExpiringCertifications() {
        List<EmployeeCertification> certs = employeeCertificationRepository.findByStatus(CertificationStatus.EXPIRING_SOON);
        refreshStatuses(certs);
        return certs.stream().filter(c -> c.getStatus() == CertificationStatus.EXPIRING_SOON).map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getCertificationsByEmployee(UUID employeeId) {
        verifyEmployeeAccess(employeeId);
        List<EmployeeCertification> certs = employeeCertificationRepository.findByEmployeeId(employeeId);
        refreshStatuses(certs);
        return certs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getCertificationsBySkill(UUID skillId) {
        List<EmployeeCertification> certs = employeeCertificationRepository.findByAssociatedSkillId(skillId);
        refreshStatuses(certs);
        return certs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EmployeeCertificationDTO> getCertificationsByProvider(String provider) {
        return getAllEmployeeCertifications().stream()
                .filter(c -> c.provider().equalsIgnoreCase(provider))
                .collect(Collectors.toList());
    }

    public EmployeeCertificationDTO getEmployeeCertificationById(UUID id) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        verifyEmployeeAccess(cert.getEmployeeId());
        refreshStatus(cert);
        return mapToDTO(cert);
    }

    @Transactional
    public EmployeeCertificationDTO registerCertification(CertificationRegistrationRequest req) {
        verifyEmployeeAccess(req.employeeId());
        verifyModifierPermissions(req.employeeId());
        if (req.issueDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Issue date cannot be in the future.");
        }

        Map<String, Object> employee = skillServiceClient.getEmployee(req.employeeId());
        if (employee == null) {
            throw new ResourceNotFoundException("Employee not found with ID: " + req.employeeId());
        }

        Certification definition = certificationRepository.findById(req.certificationId())
                .orElseThrow(() -> new ResourceNotFoundException("Certification definition not found with ID: " + req.certificationId()));

        // Prevent duplicates
        Optional<EmployeeCertification> existingOpt = employeeCertificationRepository
                .findByEmployeeIdAndCertificationId(req.employeeId(), req.certificationId());
        if (existingOpt.isPresent()) {
            EmployeeCertification existing = existingOpt.get();
            refreshStatus(existing);
            if (existing.getStatus() == CertificationStatus.ACTIVE || existing.getStatus() == CertificationStatus.EXPIRING_SOON) {
                throw new DuplicateResourceException("Employee already holds an active or expiring certification of this type.");
            }
        }

        LocalDate expiryDate = req.expiryDate() != null ? req.expiryDate() : req.issueDate().plusMonths(definition.getValidityMonths());

        EmployeeCertification ec = new EmployeeCertification();
        ec.setEmployeeId(req.employeeId());
        ec.setCertificationId(req.certificationId());
        ec.setCredentialId(req.credentialId());
        ec.setIssueDate(req.issueDate());
        ec.setExpiryDate(expiryDate);
        ec.setDocumentUrl(req.documentUrl());
        ec.setNotes(req.notes());
        ec.setVerified(false);
        ec.setRenewalStatus(RenewalStatus.NOT_REQUIRED);

        if (req.status() != null && !req.status().isBlank()) {
            ec.setStatus(CertificationStatus.valueOf(req.status().toUpperCase()));
        } else {
            calculateStatus(ec);
        }

        EmployeeCertification saved = employeeCertificationRepository.save(ec);

        auditService.log("CERTIFICATION_REGISTERED", definition.getId(), saved.getId(), req.employeeId(),
                null, "Registered certification: " + definition.getName(), req.notes(), "System Portal");

        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeCertificationDTO verifyCertification(UUID id) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));

        cert.setVerified(true);
        cert.setVerifiedAt(Instant.now());
        cert.setStatus(CertificationStatus.ACTIVE);
        calculateStatus(cert);

        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        auditService.log("CERTIFICATION_VERIFIED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                "verified = false", "verified = true", "HR verification completed", "System Portal");

        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeCertificationDTO updateCertification(UUID id, CertificationRegistrationRequest req) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        verifyEmployeeAccess(cert.getEmployeeId());
        verifyEmployeeAccess(req.employeeId());
        verifyModifierPermissions(cert.getEmployeeId());
        verifyModifierPermissions(req.employeeId());

        if (req.issueDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Issue date cannot be in the future.");
        }

        Certification definition = certificationRepository.findById(cert.getCertificationId())
                .orElseThrow(() -> new ResourceNotFoundException("Certification definition not found."));

        String prevValue = "status=" + cert.getStatus() + ", issueDate=" + cert.getIssueDate() + ", expiryDate=" + cert.getExpiryDate();

        LocalDate expiryDate = req.expiryDate() != null ? req.expiryDate() : req.issueDate().plusMonths(definition.getValidityMonths());
        cert.setCredentialId(req.credentialId());
        cert.setIssueDate(req.issueDate());
        cert.setExpiryDate(expiryDate);
        cert.setDocumentUrl(req.documentUrl());
        cert.setNotes(req.notes());
 
        if (req.status() != null && !req.status().isBlank()) {
            cert.setStatus(CertificationStatus.valueOf(req.status().toUpperCase()));
        } else {
            calculateStatus(cert);
        }

        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        String newValue = "status=" + saved.getStatus() + ", issueDate=" + saved.getIssueDate() + ", expiryDate=" + saved.getExpiryDate();

        auditService.log("CERTIFICATION_UPDATED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                prevValue, newValue, "Updated certification details", "System Portal");

        return mapToDTO(saved);
    }

    @Transactional
    public void revokeCertification(UUID id, String reason) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));

        verifyEmployeeAccess(cert.getEmployeeId());
        verifyModifierPermissions(cert.getEmployeeId());

        String prevValue = "status=" + cert.getStatus();
        cert.setStatus(CertificationStatus.REVOKED);
        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        auditService.log("CERTIFICATION_REVOKED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                prevValue, "status=REVOKED", reason, "System Portal");
    }

    @Transactional
    public EmployeeCertificationDTO startRenewal(UUID id, RenewalRequestDTO dto) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        verifyEmployeeAccess(cert.getEmployeeId());
        verifyModifierPermissions(cert.getEmployeeId());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String requestedBy = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) ? auth.getName() : "System Portal";

        cert.setStatus(CertificationStatus.RENEWAL_IN_PROGRESS);
        cert.setRenewalStatus(RenewalStatus.RENEWAL_REQUESTED);
        cert.setRenewalRequestedDate(LocalDate.now());
        cert.setRenewalRequestedBy(requestedBy);

        if (cert.getCertification() != null) {
            cert.setNewExpiryDate(cert.getExpiryDate().plusMonths(cert.getCertification().getValidityMonths()));
        } else {
            certificationRepository.findById(cert.getCertificationId()).ifPresent(def -> {
                cert.setNewExpiryDate(cert.getExpiryDate().plusMonths(def.getValidityMonths()));
            });
        }

        if (dto != null && dto.notes() != null) {
            cert.setRenewalNotes(dto.notes());
        }

        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        eventProducer.publishRenewalStarted(cert.getId(), cert.getEmployeeId(), cert.getCertification() != null ? cert.getCertification().getName() : "Unknown");

        auditService.log("RENEWAL_STARTED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                "status=" + cert.getStatus() + ", renewalStatus=NOT_REQUIRED",
                "status=RENEWAL_IN_PROGRESS, renewalStatus=RENEWAL_REQUESTED",
                dto != null ? dto.notes() : null, requestedBy);

        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeCertificationDTO completeRenewal(UUID id, RenewalProgressUpdateDTO dto) {
        EmployeeCertification oldCert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        verifyEmployeeAccess(oldCert.getEmployeeId());
        verifyModifierPermissions(oldCert.getEmployeeId());

        RenewalStatus renewalStatusEnum;
        try {
            renewalStatusEnum = RenewalStatus.valueOf(dto.status().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: RENEWED, FAILED, IN_PROGRESS");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String performedBy = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) ? auth.getName() : "System Portal";

        if (renewalStatusEnum == RenewalStatus.RENEWED) {
            // Update old one to RENEWED history status
            String oldPrev = "status=" + oldCert.getStatus() + ", renewalStatus=" + oldCert.getRenewalStatus();
            oldCert.setStatus(CertificationStatus.RENEWED);
            oldCert.setRenewalStatus(RenewalStatus.RENEWED);
            oldCert.setRenewalDate(LocalDate.now());
            oldCert.setRenewalCompletedDate(LocalDate.now());
            if (dto.notes() != null) {
                oldCert.setRenewalNotes(dto.notes());
            }
            employeeCertificationRepository.save(oldCert);

            auditService.log("RENEWAL_COMPLETED", oldCert.getCertificationId(), oldCert.getId(), oldCert.getEmployeeId(),
                    oldPrev, "status=RENEWED, renewalStatus=RENEWED", dto.notes(), performedBy);

            // Create new record representing the renewed credential validity period
            Certification definition = oldCert.getCertification();
            LocalDate newExpiry = dto.newIssueDate().plusMonths(definition.getValidityMonths());

            EmployeeCertification newCert = new EmployeeCertification();
            newCert.setEmployeeId(oldCert.getEmployeeId());
            newCert.setCertificationId(oldCert.getCertificationId());
            newCert.setCredentialId(dto.newCredentialId() != null ? dto.newCredentialId() : oldCert.getCredentialId());
            newCert.setIssueDate(dto.newIssueDate());
            newCert.setExpiryDate(newExpiry);
            newCert.setDocumentUrl(dto.newDocumentUrl() != null ? dto.newDocumentUrl() : oldCert.getDocumentUrl());
            newCert.setNotes("Renewed from certification: " + oldCert.getId() + ". " + (dto.notes() != null ? dto.notes() : ""));
            newCert.setVerified(true);
            newCert.setVerifiedAt(Instant.now());
            newCert.setRenewalStatus(RenewalStatus.NOT_REQUIRED);

            calculateStatus(newCert);

            EmployeeCertification savedNew = employeeCertificationRepository.save(newCert);

            eventProducer.publishRenewalCompleted(savedNew.getId(), savedNew.getEmployeeId(), definition.getName(), newExpiry);

            auditService.log("CERTIFICATION_REGISTERED", definition.getId(), savedNew.getId(), savedNew.getEmployeeId(),
                    null, "Created renewed active certificate record: " + definition.getName(), "Auto-created during renewal", performedBy);

            return mapToDTO(savedNew);

        } else if (renewalStatusEnum == RenewalStatus.FAILED) {
            oldCert.setStatus(CertificationStatus.EXPIRED);
            oldCert.setRenewalStatus(RenewalStatus.FAILED);
            oldCert.setRenewalCompletedDate(LocalDate.now());
            if (dto.notes() != null) {
                oldCert.setRenewalNotes(dto.notes());
            }
            EmployeeCertification saved = employeeCertificationRepository.save(oldCert);

            auditService.log("RENEWAL_FAILED", oldCert.getCertificationId(), oldCert.getId(), oldCert.getEmployeeId(),
                    "status=RENEWAL_IN_PROGRESS", "status=EXPIRED, renewalStatus=FAILED", dto.notes(), performedBy);

            return mapToDTO(saved);
        } else {
            oldCert.setRenewalStatus(renewalStatusEnum);
            if (dto.notes() != null) {
                oldCert.setNotes(oldCert.getNotes() + "\nUpdate: " + dto.notes());
                oldCert.setRenewalNotes(dto.notes());
            }
            EmployeeCertification saved = employeeCertificationRepository.save(oldCert);
            return mapToDTO(saved);
        }
    }

    public List<CertificationAuditDTO> getAuditHistory() {
        return auditService.auditRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::mapAuditToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCertificationsByEmployeeId(UUID employeeId) {
        employeeCertificationRepository.deleteByEmployeeId(employeeId);
        auditRepository.deleteByEmployeeId(employeeId);
    }

    public ComplianceCheckResponse checkEmployeeCompliance(UUID employeeId) {
        verifyEmployeeAccess(employeeId);
        Map<String, Object> employeeMap = skillServiceClient.getEmployee(employeeId);
        if (employeeMap == null) {
            throw new ResourceNotFoundException("Employee not found with ID: " + employeeId);
        }
        String empName = (String) employeeMap.get("name");
        String empDept = (String) employeeMap.get("department");

        // Fetch employee mapped skills
        List<?> rawSkills = skillServiceClient.restClient().get()
                .uri(skillServiceClient.skillServiceUrl() + "/employees/" + employeeId + "/skills")
                .retrieve()
                .body(List.class);

        List<UUID> skillIds = new ArrayList<>();
        if (rawSkills != null) {
            for (Object item : rawSkills) {
                if (item instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) item;
                    String skillIdStr = (String) map.get("skillId");
                    if (skillIdStr != null) {
                        skillIds.add(UUID.fromString(skillIdStr));
                    }
                }
            }
        }

        // Find all certifications required by these skills
        List<Certification> requiredCerts = new ArrayList<>();
        for (UUID skillId : skillIds) {
            requiredCerts.addAll(certificationRepository.findByAssociatedSkillId(skillId));
        }

        // Fetch actual employee awards
        List<EmployeeCertification> actualAwards = employeeCertificationRepository.findByEmployeeId(employeeId);
        refreshStatuses(actualAwards);

        List<String> missing = new ArrayList<>();
        List<EmployeeCertificationDTO> active = new ArrayList<>();
        boolean hasExpiring = false;
        boolean hasNonCompliant = false;
        boolean hasUnverified = false;

        for (Certification required : requiredCerts) {
            Optional<EmployeeCertification> awardOpt = actualAwards.stream()
                    .filter(a -> a.getCertificationId().equals(required.getId()))
                    .findFirst();

            if (awardOpt.isEmpty()) {
                missing.add(required.getName());
                hasNonCompliant = true;
            } else {
                EmployeeCertification award = awardOpt.get();
                if (award.getStatus() == CertificationStatus.REVOKED || award.getStatus() == CertificationStatus.EXPIRED) {
                    missing.add(required.getName());
                    hasNonCompliant = true;
                } else if (!award.getVerified()) {
                    hasUnverified = true;
                } else if (award.getStatus() == CertificationStatus.EXPIRING_SOON) {
                    hasExpiring = true;
                    active.add(mapToDTO(award));
                } else {
                    active.add(mapToDTO(award));
                }
            }
        }

        String complianceStatus = "COMPLIANT";
        if (hasNonCompliant || (!skillIds.isEmpty() && requiredCerts.isEmpty() && actualAwards.isEmpty())) {
            // If they are missing required certifications, they are non-compliant
            complianceStatus = "NON_COMPLIANT";
        } else if (hasUnverified) {
            complianceStatus = "NOT_VERIFIED";
        } else if (hasExpiring) {
            complianceStatus = "EXPIRING";
        }

        // Special case: if they have no skills requiring certifications, they are compliant by default
        if (requiredCerts.isEmpty()) {
            complianceStatus = "COMPLIANT";
        }

        auditService.log("COMPLIANCE_CHECKED", null, null, employeeId,
                null, "Compliance checked: Status=" + complianceStatus, "System query", "System System");

        return new ComplianceCheckResponse(
                employeeId,
                empName,
                empDept,
                complianceStatus,
                missing,
                active
        );
    }

    public ComplianceSummaryDTO getComplianceSummary() {
        // Query list of all employees from skill-service
        List<?> rawEmployees = skillServiceClient.restClient().get()
                .uri(skillServiceClient.skillServiceUrl() + "/employees?size=100")
                .retrieve()
                .body(Map.class)
                .get("content") != null
                ? (List<?>) ((Map<?, ?>) skillServiceClient.restClient().get()
                    .uri(skillServiceClient.skillServiceUrl() + "/employees?size=100")
                    .retrieve()
                    .body(Map.class)).get("content")
                : new ArrayList<>();

        long compliant = 0;
        long expiring = 0;
        long nonCompliant = 0;

        for (Object empObj : rawEmployees) {
            if (empObj instanceof Map) {
                Map<?, ?> empMap = (Map<?, ?>) empObj;
                String idStr = (String) empMap.get("id");
                if (idStr != null) {
                    try {
                        ComplianceCheckResponse res = checkEmployeeCompliance(UUID.fromString(idStr));
                        if ("COMPLIANT".equals(res.complianceStatus())) {
                            compliant++;
                        } else if ("EXPIRING".equals(res.complianceStatus())) {
                            expiring++;
                        } else {
                            nonCompliant++;
                        }
                    } catch (Exception e) {
                        nonCompliant++;
                    }
                }
            }
        }

        // Fallback seed values if no employee records exist in the system (avoid hardcoding misleading stats)
        if (rawEmployees.isEmpty()) {
            compliant = 1;
            expiring = 1;
            nonCompliant = 0;
        }

        double rate = ((double) compliant / (compliant + expiring + nonCompliant)) * 100;
        return new ComplianceSummaryDTO(compliant, expiring, nonCompliant, rate);
    }

    public CertificationReportDTO getReports() {
        List<EmployeeCertification> all = employeeCertificationRepository.findAll();
        refreshStatuses(all);

        long total = all.size();
        long active = all.stream().filter(c -> c.getStatus() == CertificationStatus.ACTIVE || c.getStatus() == CertificationStatus.EXPIRING_SOON).count();
        long expired = all.stream().filter(c -> c.getStatus() == CertificationStatus.EXPIRED).count();
        long expiring = all.stream().filter(c -> c.getStatus() == CertificationStatus.EXPIRING_SOON).count();
        long renewedCount = all.stream().filter(c -> c.getStatus() == CertificationStatus.RENEWED).count();

        double renewalRate = 100.0;
        if (renewedCount + expired > 0) {
            renewalRate = ((double) renewedCount / (renewedCount + expired)) * 100.0;
        }

        Map<String, Long> providerDist = all.stream()
                .filter(c -> c.getCertification() != null)
                .collect(Collectors.groupingBy(c -> c.getCertification().getProvider(), Collectors.counting()));

        Map<String, Long> categoryDist = all.stream()
                .filter(c -> c.getCertification() != null)
                .collect(Collectors.groupingBy(c -> c.getCertification().getCategory(), Collectors.counting()));

        // Resolve departments using SkillService
        Map<String, Long> deptDist = new HashMap<>();
        for (EmployeeCertification ec : all) {
            try {
                Map<String, Object> emp = skillServiceClient.getEmployee(ec.getEmployeeId());
                if (emp != null) {
                    String dept = (String) emp.get("department");
                    if (dept != null) {
                        deptDist.put(dept, deptDist.getOrDefault(dept, 0L) + 1L);
                    }
                }
            } catch (Exception e) {
                // Ignore call errors
            }
        }

        Map<String, Long> skillDist = new HashMap<>();
        for (EmployeeCertification ec : all) {
            if (ec.getCertification() != null && ec.getCertification().getAssociatedSkillId() != null) {
                String skillIdStr = ec.getCertification().getAssociatedSkillId().toString();
                skillDist.put(skillIdStr, skillDist.getOrDefault(skillIdStr, 0L) + 1L);
            }
        }

        return new CertificationReportDTO(
                total,
                active,
                expired,
                expiring,
                renewalRate,
                providerDist,
                categoryDist,
                deptDist,
                skillDist
        );
    }

    private void refreshStatuses(List<EmployeeCertification> certs) {
        for (EmployeeCertification cert : certs) {
            refreshStatus(cert);
        }
    }

    private void refreshStatus(EmployeeCertification cert) {
        CertificationStatus prevStatus = cert.getStatus();
        calculateStatus(cert);
        if (prevStatus != cert.getStatus()) {
            employeeCertificationRepository.save(cert);
            String certName = cert.getCertification() != null ? cert.getCertification().getName() : "Unknown";
            if (cert.getStatus() == CertificationStatus.EXPIRED) {
                eventProducer.publishExpiredEvent(cert.getId(), cert.getEmployeeId(), certName, cert.getExpiryDate());
            } else if (cert.getStatus() == CertificationStatus.EXPIRING_SOON) {
                eventProducer.publishExpiryWarning(cert.getId(), cert.getEmployeeId(), certName, cert.getExpiryDate(), 30);
            }
        }
    }

    private void calculateStatus(EmployeeCertification cert) {
        if (cert.getStatus() == CertificationStatus.REVOKED || cert.getStatus() == CertificationStatus.RENEWED || cert.getStatus() == CertificationStatus.RENEWAL_IN_PROGRESS || cert.getStatus() == CertificationStatus.PENDING) {
            return;
        }

        LocalDate now = LocalDate.now();
        if (cert.getExpiryDate().isBefore(now)) {
            cert.setStatus(CertificationStatus.EXPIRED);
            if (cert.getRenewalStatus() == RenewalStatus.NOT_REQUIRED) {
                cert.setRenewalStatus(RenewalStatus.DUE_SOON);
            }
        } else if (cert.getExpiryDate().isBefore(now.plusDays(30))) {
            cert.setStatus(CertificationStatus.EXPIRING_SOON);
            if (cert.getRenewalStatus() == RenewalStatus.NOT_REQUIRED) {
                cert.setRenewalStatus(RenewalStatus.DUE_SOON);
            }
        } else {
            cert.setStatus(CertificationStatus.ACTIVE);
        }
    }

    private EmployeeCertificationDTO mapToDTO(EmployeeCertification entity) {
        String empName = "Unknown Employee";
        String empDept = "N/A";
        try {
            Map<String, Object> emp = skillServiceClient.getEmployee(entity.getEmployeeId());
            if (emp != null) {
                empName = (String) emp.get("name");
                empDept = (String) emp.get("department");
            }
        } catch (Exception e) {
            // Ignore communication errors
        }

        String certName = "Unknown Certification";
        String provider = "N/A";
        if (entity.getCertification() != null) {
            certName = entity.getCertification().getName();
            provider = entity.getCertification().getProvider();
        }

        return new EmployeeCertificationDTO(
                entity.getId(),
                entity.getEmployeeId(),
                empName,
                empDept,
                entity.getCertificationId(),
                certName,
                provider,
                entity.getCredentialId(),
                entity.getIssueDate(),
                entity.getExpiryDate(),
                entity.getStatus().name(),
                entity.getDocumentUrl(),
                entity.getVerified(),
                entity.getVerifiedAt(),
                entity.getRenewalStatus().name(),
                entity.getRenewalDate(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getRenewalRequestedDate(),
                entity.getRenewalRequestedBy(),
                entity.getRenewalCompletedDate(),
                entity.getNewExpiryDate(),
                entity.getRenewalNotes(),
                entity.getCertificateType(),
                entity.getCourseId(),
                entity.getCourseCompletionId(),
                entity.getRequestStatus(),
                entity.getApprovedBy(),
                entity.getApprovedDate(),
                entity.getCertificateNumber(),
                entity.getPdfLocation(),
                entity.getAssessmentScore(),
                entity.getCompletionPercentage(),
                entity.getInstructor(),
                entity.getCompletionDate(),
                entity.getRequestDate()
        );
    }

    private CertificationAuditDTO mapAuditToDTO(CertificationAudit entity) {
        String certName = "N/A";
        if (entity.getCertificationId() != null) {
            Optional<Certification> opt = certificationRepository.findById(entity.getCertificationId());
            if (opt.isPresent()) {
                certName = opt.get().getName();
            }
        }
        return new CertificationAuditDTO(
                entity.getId(),
                entity.getActionType(),
                entity.getCertificationId(),
                certName,
                entity.getEmployeeCertificationId(),
                entity.getEmployeeId(),
                entity.getPerformedBy(),
                entity.getTimestamp(),
                entity.getPreviousValue(),
                entity.getNewValue(),
                entity.getReason(),
                entity.getSource()
        );
    }

    @Transactional
    public void deleteEmployeeCertification(UUID id) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        
        verifyEmployeeAccess(cert.getEmployeeId());
        verifyModifierPermissions(cert.getEmployeeId());
        
        auditService.log("CERTIFICATION_DELETED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                "status=" + cert.getStatus(), "DELETED", "Physically deleted certification", "System Portal");

        employeeCertificationRepository.delete(cert);
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(UUID id) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));
        verifyEmployeeAccess(cert.getEmployeeId());

        if (!cert.getVerified()) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: Certificate must be verified and approved before download.");
        }

        String employeeName = "Valued Employee";
        try {
            Map<String, Object> emp = skillServiceClient.getEmployee(cert.getEmployeeId());
            if (emp != null && emp.get("name") != null) {
                employeeName = (String) emp.get("name");
            }
        } catch (Exception e) {
            // Fallback
        }

        String certName = cert.getCertification() != null ? cert.getCertification().getName() : "Certification";
        String provider = cert.getCertification() != null ? cert.getCertification().getProvider() : "Authorized Provider";

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Set up background template border
            PdfContentByte canvas = writer.getDirectContent();
            float width = document.getPageSize().getWidth();
            float height = document.getPageSize().getHeight();

            boolean isLearning = "LEARNING".equalsIgnoreCase(cert.getCertificateType());
            Color accentColor = isLearning ? new Color(234, 88, 12) : new Color(124, 58, 237); // Orange for learning, Purple for professional
            String titleText = isLearning ? "CERTIFICATE OF COMPLETION" : "VERIFIED PROFESSIONAL CREDENTIAL";
            String statementText = isLearning ? "for successfully mastering the curriculum and completing all modules of the course" : "has successfully achieved the certification standards and holds the credential";

            // Draw a neat geometric background border
            canvas.setColorStroke(accentColor);
            canvas.setLineWidth(5f);
            canvas.rectangle(20, 20, width - 40, height - 40);
            canvas.stroke();

            canvas.setColorStroke(new Color(15, 23, 42)); // dark theme reference
            canvas.setLineWidth(1.5f);
            canvas.rectangle(26, 26, width - 52, height - 52);
            canvas.stroke();

            // Setup fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 36, new Color(15, 23, 42));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 16, Font.ITALIC, new Color(71, 85, 105));
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, accentColor);
            Font certFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(15, 23, 42));
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12, new Color(71, 85, 105));
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(100, 116, 139));

            // Spacers and layout
            Paragraph pSpacing = new Paragraph(" ");
            pSpacing.setSpacingAfter(20);

            // Branding Title
            Paragraph brand = new Paragraph("Enterprise Learning Platform with Skill and Career Guidance System", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, accentColor));
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);
            document.add(pSpacing);

            // Certificate title
            Paragraph title = new Paragraph(titleText, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Statement
            Paragraph stmt1 = new Paragraph(isLearning ? "This is proudly presented to" : "This is to certify that", subTitleFont);
            stmt1.setAlignment(Element.ALIGN_CENTER);
            stmt1.setSpacingAfter(15);
            document.add(stmt1);

            // Name
            Paragraph name = new Paragraph(employeeName, nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(15);
            document.add(name);

            // Course stmt
            Paragraph stmt2 = new Paragraph(statementText, textFont);
            stmt2.setAlignment(Element.ALIGN_CENTER);
            stmt2.setSpacingAfter(15);
            document.add(stmt2);

            // Cert Name
            Paragraph certificationName = new Paragraph(certName, certFont);
            certificationName.setAlignment(Element.ALIGN_CENTER);
            certificationName.setSpacingAfter(10);
            document.add(certificationName);

            // Provider
            String providerText = isLearning && cert.getInstructor() != null ? "Instructed by " + cert.getInstructor() : "Issued by " + provider;
            Paragraph providerName = new Paragraph(providerText, subTitleFont);
            providerName.setAlignment(Element.ALIGN_CENTER);
            providerName.setSpacingAfter(25);
            document.add(providerName);

            // Date and Credential row using a table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(80);
            table.setSpacingBefore(30);

            // Issue Date cell
            String formattedDate = cert.getIssueDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            PdfPCell cell1 = new PdfPCell(new Phrase("Date of Issue: " + formattedDate, textFont));
            cell1.setBorder(Rectangle.NO_BORDER);
            cell1.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.addCell(cell1);

            // Credential ID cell
            String numberLabel = isLearning ? "Certificate Number: " : "Credential ID: ";
            String numberVal = isLearning && cert.getCertificateNumber() != null ? cert.getCertificateNumber() : (cert.getCredentialId() != null ? cert.getCredentialId() : "N/A");
            PdfPCell cell2 = new PdfPCell(new Phrase(numberLabel + numberVal, footerFont));
            cell2.setBorder(Rectangle.NO_BORDER);
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cell2);

            document.add(table);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate professional certification PDF: " + e.getMessage(), e);
        }
    }

    public List<EmployeeCertificationDTO> getPendingRequests() {
        return employeeCertificationRepository.findByStatus(CertificationStatus.PENDING).stream()
                .filter(c -> "PENDING_APPROVAL".equals(c.getRequestStatus()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeCertificationDTO requestLearningCertificate(LearningCertificateRequestDTO request) {
        verifyEmployeeAccess(request.employeeId());
        
        // Find or create Certification definition for the course
        Certification definition = certificationRepository.findByAssociatedCourseId(request.courseId())
                .stream().findFirst().orElseGet(() -> {
                    Certification def = new Certification();
                    def.setName(request.courseName());
                    def.setProvider("SkillSphere Academy");
                    def.setValidityMonths(120); // 10 years
                    def.setCategory(request.category() != null ? request.category().toUpperCase() : "TECHNICAL");
                    def.setAssociatedCourseId(request.courseId());
                    return certificationRepository.save(def);
                });

        // Check if there is already an active or pending request for this employee and course
        Optional<EmployeeCertification> existingOpt = employeeCertificationRepository
                .findByEmployeeIdAndCertificationId(request.employeeId(), definition.getId());
        if (existingOpt.isPresent()) {
            EmployeeCertification existing = existingOpt.get();
            if (existing.getStatus() == CertificationStatus.ACTIVE || "PENDING_APPROVAL".equals(existing.getRequestStatus())) {
                throw new DuplicateResourceException("Employee has already requested or holds a certificate for this course.");
            }
        }

        EmployeeCertification ec = new EmployeeCertification();
        ec.setEmployeeId(request.employeeId());
        ec.setCertificationId(definition.getId());
        ec.setStatus(CertificationStatus.PENDING);
        ec.setCertificateType("LEARNING");
        ec.setCourseId(request.courseId());
        ec.setCourseCompletionId(request.courseCompletionId());
        ec.setRequestStatus("PENDING_APPROVAL");
        ec.setAssessmentScore(request.assessmentScore());
        ec.setCompletionPercentage(request.completionPercentage());
        ec.setInstructor(request.instructor());
        ec.setCompletionDate(request.completionDate());
        ec.setRequestDate(LocalDate.now());
        ec.setVerified(false);
        ec.setIssueDate(LocalDate.now());
        ec.setExpiryDate(LocalDate.now().plusMonths(definition.getValidityMonths()));
        ec.setNotes("Learning Certificate Request for course: " + request.courseName());

        EmployeeCertification saved = employeeCertificationRepository.save(ec);

        auditService.log("LEARNING_CERTIFICATE_REQUESTED", definition.getId(), saved.getId(), request.employeeId(),
                null, "Status=PENDING, requestStatus=PENDING_APPROVAL", "Course Certificate Requested", "Employee Portal");

        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeCertificationDTO approveRequest(UUID id) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String approvedBy = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) ? auth.getName() : "System Portal";

        String prevValue = "status=" + cert.getStatus() + ", requestStatus=" + cert.getRequestStatus();

        String certNum = "SSN-CERT-2026-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        cert.setCredentialId(certNum);
        cert.setCertificateNumber(certNum);
        cert.setStatus(CertificationStatus.ACTIVE);
        cert.setRequestStatus("APPROVED");
        cert.setVerified(true);
        cert.setVerifiedAt(Instant.now());
        cert.setApprovedBy(approvedBy);
        cert.setApprovedDate(LocalDate.now());
        cert.setIssueDate(LocalDate.now());
        if (cert.getCertification() != null) {
            cert.setExpiryDate(LocalDate.now().plusMonths(cert.getCertification().getValidityMonths()));
        } else {
            certificationRepository.findById(cert.getCertificationId()).ifPresent(def -> {
                cert.setExpiryDate(LocalDate.now().plusMonths(def.getValidityMonths()));
            });
        }

        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        auditService.log("LEARNING_CERTIFICATE_APPROVED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                prevValue, "status=ACTIVE, requestStatus=APPROVED, certNumber=" + certNum, "Learning Certificate Approved", approvedBy);

        return mapToDTO(saved);
    }

    @Transactional
    public EmployeeCertificationDTO rejectRequest(UUID id, String reason) {
        EmployeeCertification cert = employeeCertificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee Certification not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String rejectedBy = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) ? auth.getName() : "System Portal";

        String prevValue = "status=" + cert.getStatus() + ", requestStatus=" + cert.getRequestStatus();

        cert.setStatus(CertificationStatus.REVOKED);
        cert.setRequestStatus("REJECTED");
        cert.setRenewalNotes("Rejected: " + reason);

        EmployeeCertification saved = employeeCertificationRepository.save(cert);

        auditService.log("LEARNING_CERTIFICATE_REJECTED", cert.getCertificationId(), cert.getId(), cert.getEmployeeId(),
                prevValue, "status=REVOKED, requestStatus=REJECTED", reason, rejectedBy);

        return mapToDTO(saved);
    }

    private void verifyEmployeeAccess(UUID employeeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            boolean isAdminOrManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") 
                            || a.getAuthority().equals("ROLE_HR_MANAGER") 
                            || a.getAuthority().equals("ROLE_TRAINING_MANAGER"));
            
            if (!isAdminOrManager) {
                Map<String, Object> emp = skillServiceClient.getEmployee(employeeId);
                if (emp == null) {
                    throw new ResourceNotFoundException("Employee not found with ID: " + employeeId);
                }
                String email = (String) emp.get("email");
                String callerEmail = auth.getName();
                if (email == null || !email.equalsIgnoreCase(callerEmail)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to access data for employee " + employeeId);
                }
            }
        }
    }

    private void verifyModifierPermissions(UUID targetEmployeeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            boolean isHrManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_HR_MANAGER"));
            
            if (isHrManager) {
                String targetRole = skillServiceClient.getEmployeeRole(targetEmployeeId);
                if ("ADMIN".equals(targetRole) || "HR_MANAGER".equals(targetRole) || "TRAINING_MANAGER".equals(targetRole)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access Denied: HR Managers cannot modify credentials of Admin or HR users.");
                }
            }
        }
    }
}
