package com.skillsphere.certification.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_certifications", schema = "cert_service")
public class EmployeeCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "certification_id", nullable = false)
    private UUID certificationId;

    @Column(name = "credential_id")
    private String credentialId;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CertificationStatus status;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(nullable = false)
    private Boolean verified = false;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "renewal_status", nullable = false)
    private RenewalStatus renewalStatus = RenewalStatus.NOT_REQUIRED;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "renewal_requested_date")
    private LocalDate renewalRequestedDate;

    @Column(name = "renewal_requested_by")
    private String renewalRequestedBy;

    @Column(name = "renewal_completed_date")
    private LocalDate renewalCompletedDate;

    @Column(name = "new_expiry_date")
    private LocalDate newExpiryDate;

    @Column(name = "renewal_notes", columnDefinition = "TEXT")
    private String renewalNotes;

    @Column(name = "certificate_type", nullable = false)
    private String certificateType = "PROFESSIONAL";

    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "course_completion_id")
    private UUID courseCompletionId;

    @Column(name = "request_status")
    private String requestStatus;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    @Column(name = "certificate_number")
    private String certificateNumber;

    @Column(name = "pdf_location")
    private String pdfLocation;

    @Column(name = "assessment_score")
    private Integer assessmentScore;

    @Column(name = "completion_percentage")
    private Integer completionPercentage;

    @Column(name = "instructor")
    private String instructor;

    @Column(name = "completion_date")
    private Instant completionDate;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "certification_id", insertable = false, updatable = false)
    private Certification certification;

    public EmployeeCertification() {}

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getCertificationId() {
        return certificationId;
    }

    public void setCertificationId(UUID certificationId) {
        this.certificationId = certificationId;
    }

    public String getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(String credentialId) {
        this.credentialId = credentialId;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public CertificationStatus getStatus() {
        return status;
    }

    public void setStatus(CertificationStatus status) {
        this.status = status;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public RenewalStatus getRenewalStatus() {
        return renewalStatus;
    }

    public void setRenewalStatus(RenewalStatus renewalStatus) {
        this.renewalStatus = renewalStatus;
    }

    public LocalDate getRenewalDate() {
        return renewalDate;
    }

    public void setRenewalDate(LocalDate renewalDate) {
        this.renewalDate = renewalDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getRenewalRequestedDate() {
        return renewalRequestedDate;
    }

    public void setRenewalRequestedDate(LocalDate renewalRequestedDate) {
        this.renewalRequestedDate = renewalRequestedDate;
    }

    public String getRenewalRequestedBy() {
        return renewalRequestedBy;
    }

    public void setRenewalRequestedBy(String renewalRequestedBy) {
        this.renewalRequestedBy = renewalRequestedBy;
    }

    public LocalDate getRenewalCompletedDate() {
        return renewalCompletedDate;
    }

    public void setRenewalCompletedDate(LocalDate renewalCompletedDate) {
        this.renewalCompletedDate = renewalCompletedDate;
    }

    public LocalDate getNewExpiryDate() {
        return newExpiryDate;
    }

    public void setNewExpiryDate(LocalDate newExpiryDate) {
        this.newExpiryDate = newExpiryDate;
    }

    public String getRenewalNotes() {
        return renewalNotes;
    }

    public void setRenewalNotes(String renewalNotes) {
        this.renewalNotes = renewalNotes;
    }

    public String getCertificateType() {
        return certificateType;
    }

    public void setCertificateType(String certificateType) {
        this.certificateType = certificateType;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public UUID getCourseCompletionId() {
        return courseCompletionId;
    }

    public void setCourseCompletionId(UUID courseCompletionId) {
        this.courseCompletionId = courseCompletionId;
    }

    public String getRequestStatus() {
        return requestStatus;
    }

    public void setRequestStatus(String requestStatus) {
        this.requestStatus = requestStatus;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDate getApprovedDate() {
        return approvedDate;
    }

    public void setApprovedDate(LocalDate approvedDate) {
        this.approvedDate = approvedDate;
    }

    public String getCertificateNumber() {
        return certificateNumber;
    }

    public void setCertificateNumber(String certificateNumber) {
        this.certificateNumber = certificateNumber;
    }

    public String getPdfLocation() {
        return pdfLocation;
    }

    public void setPdfLocation(String pdfLocation) {
        this.pdfLocation = pdfLocation;
    }

    public Integer getAssessmentScore() {
        return assessmentScore;
    }

    public void setAssessmentScore(Integer assessmentScore) {
        this.assessmentScore = assessmentScore;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public Instant getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(Instant completionDate) {
        this.completionDate = completionDate;
    }

    public LocalDate getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDate requestDate) {
        this.requestDate = requestDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Certification getCertification() {
        return certification;
    }

    public void setCertification(Certification certification) {
        this.certification = certification;
    }
}
