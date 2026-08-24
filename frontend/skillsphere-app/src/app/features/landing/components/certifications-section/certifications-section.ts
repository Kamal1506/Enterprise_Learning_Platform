import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CertificationItem {
  name: string;
  provider: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  expiryDate: string;
  code: string;
  renewalProgress: number;
}

@Component({
  selector: 'app-certifications-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="certifications-section" id="certifications">
      <div class="container">
        <div class="cert-grid">
          <!-- Left: Narrative and stats -->
          <div class="cert-content animate-on-scroll">
            <span class="section-tag">Credential Compliance</span>
            <h2 class="section-title">Certifications you can trust.</h2>
            <p class="section-desc">
              Manage workforce credentials effortlessly. Enterprise Learning Platform with Skill and Career Guidance System automates expiry alerts, tracks renewal training progress, and publishes instant validation paths. Keep security and corporate compliance at 100%.
            </p>

            <div class="cert-stats-dashboard">
              <div class="cert-stat-item">
                <div class="num-box green-glow">8.4K</div>
                <div class="lbl">Active Credentials</div>
              </div>
              
              <div class="cert-stat-item">
                <div class="num-box yellow-glow">247</div>
                <div class="lbl">Expiring Soon</div>
              </div>
              
              <div class="cert-stat-item">
                <div class="num-box blue-glow">94%</div>
                <div class="lbl">Renewal Rate</div>
              </div>
            </div>
            
            <div class="compliance-badge-wrapper">
              <div class="badge-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>ISO 27001 & SOC2 Compliance Ready</span>
              </div>
            </div>
          </div>

          <!-- Right: Interactive Certification Console -->
          <div class="cert-visual animate-on-scroll">
            <div class="cert-console-card">
              <div class="console-header-row">
                <h3>Credential Registry</h3>
                <div class="filter-tabs">
                  <button class="filter-btn" [class.active]="activeFilter() === 'ALL'" (click)="setFilter('ALL')">All</button>
                  <button class="filter-btn" [class.active]="activeFilter() === 'ACTIVE'" (click)="setFilter('ACTIVE')">Active</button>
                  <button class="filter-btn" [class.active]="activeFilter() === 'EXPIRING'" (click)="setFilter('EXPIRING')">Alerts</button>
                </div>
              </div>

              <div class="cert-cards-list">
                @for (cert of filteredCerts(); track cert.code) {
                  <div class="cert-console-item" [class.cert-expired]="cert.status === 'EXPIRED'" [class.cert-expiring]="cert.status === 'EXPIRING_SOON'">
                    <div class="cert-header-meta">
                      <div>
                        <h4>{{ cert.name }}</h4>
                        <span class="provider-lbl">{{ cert.provider }}</span>
                      </div>
                      <span class="cert-status-badge" [ngClass]="statusClass(cert.status)">
                        {{ cert.status.replace('_', ' ') }}
                      </span>
                    </div>

                    <div class="cert-body-meta">
                      <div class="meta-col">
                        <span class="lbl">ID Code</span>
                        <span class="val">{{ cert.code }}</span>
                      </div>
                      <div class="meta-col">
                        <span class="lbl">Expires</span>
                        <span class="val">{{ cert.expiryDate }}</span>
                      </div>
                    </div>

                    @if (cert.status === 'EXPIRING_SOON') {
                      <div class="renewal-workflow-progress">
                        <div class="renewal-lbl">
                          <span>Auto-Renewal Learning Pathway</span>
                          <span>{{ cert.renewalProgress }}%</span>
                        </div>
                        <div class="renewal-bar"><div class="renewal-fill" [style.width]="cert.renewalProgress + '%'"></div></div>
                      </div>
                    } @else if (cert.status === 'EXPIRED') {
                      <div class="expired-alert-row">
                        <span class="expired-alert-txt">⚠️ Renewal training path is pending enrollment</span>
                        <button class="btn btn-primary btn-xs">Enroll Now</button>
                      </div>
                    } @else {
                      <div class="cert-verification-seal">
                        <span class="check-icon">✓</span> Verified Secure Credential
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CertificationsSectionComponent {
  activeFilter = signal<'ALL' | 'ACTIVE' | 'EXPIRING'>('ALL');

  certsList: CertificationItem[] = [
    {
      name: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      status: 'ACTIVE',
      expiryDate: '15-Mar-2028',
      code: 'AWS-SAA-382941',
      renewalProgress: 100
    },
    {
      name: 'Java SE 17 Oracle Certified Professional',
      provider: 'Oracle Corporation',
      status: 'EXPIRED',
      expiryDate: '10-Jul-2026',
      code: 'ORCL-OCP-17382',
      renewalProgress: 0
    },
    {
      name: 'Professional Scrum Master I',
      provider: 'Scrum.org',
      status: 'ACTIVE',
      expiryDate: '01-Nov-2029',
      code: 'SCRUM-PSM-9284',
      renewalProgress: 100
    },
    {
      name: 'Google Cloud Associate Cloud Engineer',
      provider: 'Google Cloud Platform',
      status: 'EXPIRING_SOON',
      expiryDate: '22-Aug-2026',
      code: 'GCP-ACE-81932',
      renewalProgress: 75
    }
  ];

  filteredCerts = computed(() => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.certsList;
    if (f === 'ACTIVE') return this.certsList.filter(c => c.status === 'ACTIVE');
    return this.certsList.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED');
  });

  setFilter(filter: 'ALL' | 'ACTIVE' | 'EXPIRING') {
    this.activeFilter.set(filter);
  }

  statusClass(status: string) {
    if (status === 'ACTIVE') return 'badge-status-active';
    if (status === 'EXPIRING_SOON') return 'badge-status-expiring';
    return 'badge-status-expired';
  }
}
