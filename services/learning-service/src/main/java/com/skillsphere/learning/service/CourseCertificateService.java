package com.skillsphere.learning.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.*;
import com.skillsphere.learning.entity.Course;
import com.skillsphere.learning.entity.CourseCertificate;
import com.skillsphere.learning.entity.Enrollment;
import com.skillsphere.learning.exception.ResourceNotFoundException;
import com.skillsphere.learning.repository.CourseCertificateRepository;
import com.skillsphere.learning.repository.CourseRepository;
import com.skillsphere.learning.client.SkillServiceClient;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Service
public class CourseCertificateService {

    private final CourseCertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final SkillServiceClient skillServiceClient;
    private final EnrollmentService enrollmentService;

    public CourseCertificateService(CourseCertificateRepository certificateRepository,
                                    CourseRepository courseRepository,
                                    SkillServiceClient skillServiceClient,
                                    @Lazy EnrollmentService enrollmentService) {
        this.certificateRepository = certificateRepository;
        this.courseRepository = courseRepository;
        this.skillServiceClient = skillServiceClient;
        this.enrollmentService = enrollmentService;
    }

    @Transactional
    public CourseCertificate generateCertificate(Enrollment enrollment) {
        Optional<CourseCertificate> existing = certificateRepository.findByEmployeeIdAndCourseId(
                enrollment.getEmployeeId(), enrollment.getCourseId()
        );
        if (existing.isPresent()) {
            return existing.get();
        }

        Course course = courseRepository.findById(enrollment.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + enrollment.getCourseId()));

        CourseCertificate cert = new CourseCertificate();
        // SSN-CERT-2026-XXXXXXXX format
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        cert.setCredentialId("SSN-CERT-2026-" + randomSuffix);
        cert.setEmployeeId(enrollment.getEmployeeId());
        cert.setCourseId(enrollment.getCourseId());
        cert.setCourseNameSnapshot(course.getTitle());

        return certificateRepository.save(cert);
    }

    public CourseCertificate getCertificateById(UUID id) {
        CourseCertificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with id: " + id));
        enrollmentService.verifyEmployeeAccess(cert.getEmployeeId());
        return cert;
    }

    public List<CourseCertificate> getCertificatesByEmployee(UUID employeeId) {
        enrollmentService.verifyEmployeeAccess(employeeId);
        return certificateRepository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(UUID id) {
        CourseCertificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with id: " + id));
        enrollmentService.verifyEmployeeAccess(cert.getEmployeeId());

        // Fetch employee details from skill-service
        String employeeName = "Valued Employee";
        try {
            Map<String, Object> emp = skillServiceClient.getEmployee(cert.getEmployeeId());
            if (emp != null && emp.get("name") != null) {
                employeeName = (String) emp.get("name");
            }
        } catch (Exception e) {
            // Fallback to default
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 page in landscape
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Set up background template border
            PdfContentByte canvas = writer.getDirectContent();
            float width = document.getPageSize().getWidth();
            float height = document.getPageSize().getHeight();

            // Draw a neat geometric background border
            canvas.setColorStroke(new Color(234, 88, 12)); // var(--primary-accent) #ea580c
            canvas.setLineWidth(5f);
            canvas.rectangle(20, 20, width - 40, height - 40);
            canvas.stroke();

            canvas.setColorStroke(new Color(15, 23, 42)); // var(--bg-sidebar) dark theme reference
            canvas.setLineWidth(1.5f);
            canvas.rectangle(26, 26, width - 52, height - 52);
            canvas.stroke();

            // Setup fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 36, new Color(15, 23, 42));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 16, Font.ITALIC, new Color(71, 85, 105));
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, new Color(234, 88, 12));
            Font courseFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(15, 23, 42));
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12, new Color(71, 85, 105));
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(100, 116, 139));

            // Spacers and layout
            Paragraph pSpacing = new Paragraph(" ");
            pSpacing.setSpacingAfter(20);

            // Branding Title
            Paragraph brand = new Paragraph("Enterprise Learning Platform with Skill and Career Guidance System", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(234, 88, 12)));
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);
            document.add(pSpacing);

            // Certificate title
            Paragraph title = new Paragraph("CERTIFICATE OF COMPLETION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Statement
            Paragraph stmt1 = new Paragraph("This is proudly presented to", subTitleFont);
            stmt1.setAlignment(Element.ALIGN_CENTER);
            stmt1.setSpacingAfter(15);
            document.add(stmt1);

            // Name
            Paragraph name = new Paragraph(employeeName, nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(15);
            document.add(name);

            // Course stmt
            Paragraph stmt2 = new Paragraph("for successfully mastering the curriculum and completing all modules of the course", textFont);
            stmt2.setAlignment(Element.ALIGN_CENTER);
            stmt2.setSpacingAfter(15);
            document.add(stmt2);

            // Course Name
            Paragraph courseName = new Paragraph(cert.getCourseNameSnapshot(), courseFont);
            courseName.setAlignment(Element.ALIGN_CENTER);
            courseName.setSpacingAfter(25);
            document.add(courseName);

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
            PdfPCell cell2 = new PdfPCell(new Phrase("Credential ID: " + cert.getCredentialId(), footerFont));
            cell2.setBorder(Rectangle.NO_BORDER);
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cell2);

            document.add(table);

            // Closure
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF Certificate: " + e.getMessage(), e);
        }
    }
}
