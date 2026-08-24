package com.skillsphere.career.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.skillsphere.career.dto.*;
import com.skillsphere.career.entity.JobApplication;
import com.skillsphere.career.entity.JobPosting;
import com.skillsphere.career.repository.JobApplicationRepository;
import com.skillsphere.career.repository.JobPostingRepository;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final CareerPlanService careerPlanService;
    private final JobPortalService jobPortalService;
    private final JobPostingRepository jobPostingRepository;
    private final JobApplicationRepository jobApplicationRepository;

    public ReportService(CareerPlanService careerPlanService,
                         JobPortalService jobPortalService,
                         JobPostingRepository jobPostingRepository,
                         JobApplicationRepository jobApplicationRepository) {
        this.careerPlanService = careerPlanService;
        this.jobPortalService = jobPortalService;
        this.jobPostingRepository = jobPostingRepository;
        this.jobApplicationRepository = jobApplicationRepository;
    }

    public byte[] generateCareerPlansPdf() {
        List<CareerPlanDTO> plans = careerPlanService.getAllPlansList();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Brand Title
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(234, 88, 12));
            Paragraph brand = new Paragraph("Enterprise Learning Platform with Skill and Career Guidance System", brandFont);
            brand.setAlignment(Element.ALIGN_LEFT);
            document.add(brand);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(15, 23, 42));
            Paragraph title = new Paragraph("Workforce Career Plans Report", titleFont);
            title.setSpacingBefore(10);
            title.setSpacingAfter(20);
            document.add(title);

            // Table setup
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 2f, 2f, 1.5f, 2f, 1.5f});

            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Color headerBg = new Color(15, 23, 42);

            String[] headers = {"Employee Name", "Current Role", "Target Role", "Timeline", "Assigned Mentor", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(8f);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(51, 65, 85));
            for (CareerPlanDTO plan : plans) {
                table.addCell(new PdfPCell(new Phrase(plan.employeeName(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(plan.currentRole(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(plan.targetRole(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(plan.timeline(), cellFont)));
                String mentorName = plan.mentor() != null ? plan.mentor().name() : "Unassigned";
                table.addCell(new PdfPCell(new Phrase(mentorName, cellFont)));
                table.addCell(new PdfPCell(new Phrase(plan.status(), cellFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate career plans PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateCareerPlansCsv() {
        List<CareerPlanDTO> plans = careerPlanService.getAllPlansList();
        StringBuilder csv = new StringBuilder();
        csv.append("Employee ID,Employee Name,Current Role,Target Role,Timeline,Mentor,Status,Expected Promotion Date,Goals\n");

        for (CareerPlanDTO plan : plans) {
            String mentorName = plan.mentor() != null ? plan.mentor().name() : "Unassigned";
            csv.append(plan.employeeId()).append(",")
                    .append(escapeCsv(plan.employeeName())).append(",")
                    .append(escapeCsv(plan.currentRole())).append(",")
                    .append(escapeCsv(plan.targetRole())).append(",")
                    .append(escapeCsv(plan.timeline())).append(",")
                    .append(escapeCsv(mentorName)).append(",")
                    .append(escapeCsv(plan.status())).append(",")
                    .append(plan.expectedPromotionDate() != null ? plan.expectedPromotionDate().toString() : "N/A").append(",")
                    .append(escapeCsv(plan.careerGoal() != null ? plan.careerGoal() : "")).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateJobApplicationsPdf() {
        List<JobApplicationDTO> apps = jobPortalService.getAllApplications();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(234, 88, 12));
            document.add(new Paragraph("Enterprise Learning Platform with Skill and Career Guidance System", brandFont));

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(15, 23, 42));
            Paragraph title = new Paragraph("Internal Job Applications Report", titleFont);
            title.setSpacingBefore(10);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 2f, 1.5f, 1.5f, 1f, 1.5f});

            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Color headerBg = new Color(15, 23, 42);

            String[] headers = {"Employee Name", "Role Applied", "Department", "Location", "Match %", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(8f);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(51, 65, 85));
            for (JobApplicationDTO app : apps) {
                table.addCell(new PdfPCell(new Phrase(app.employeeName(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(app.jobPostingRoleTitle(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(app.jobPostingDepartment(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(app.jobPostingLocation(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(app.matchPercent() + "%", cellFont)));
                table.addCell(new PdfPCell(new Phrase(app.status(), cellFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate job applications PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateJobApplicationsCsv() {
        List<JobApplicationDTO> apps = jobPortalService.getAllApplications();
        StringBuilder csv = new StringBuilder();
        csv.append("Application ID,Employee Name,Role Applied,Department,Location,Match %,Applied Date,Status\n");

        for (JobApplicationDTO app : apps) {
            csv.append(app.id()).append(",")
                    .append(escapeCsv(app.employeeName())).append(",")
                    .append(escapeCsv(app.jobPostingRoleTitle())).append(",")
                    .append(escapeCsv(app.jobPostingDepartment())).append(",")
                    .append(escapeCsv(app.jobPostingLocation())).append(",")
                    .append(app.matchPercent()).append(",")
                    .append(app.appliedAt().toString()).append(",")
                    .append(escapeCsv(app.status())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
