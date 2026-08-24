import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workforce-story-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="workforce-story-section" id="platform">
      <div class="container">
        <div class="section-header-centered animate-on-scroll">
          <span class="section-tag">Workforce Visibility</span>
          <h2 class="section-title-lg">Your workforce is more than a resume.</h2>
          <p class="section-subtitle">
            Static profiles and yearly surveys miss the real capability of your team. Enterprise Learning Platform with Skill and Career Guidance System creates a living, breathing skills inventory that evolves with your business.
          </p>
        </div>

        <div class="story-grid">
          <!-- Left side: Story Copy -->
          <div class="story-text animate-on-scroll">
            <div class="story-card">
              <div class="story-num">01</div>
              <div class="story-body">
                <h3>What employees actually know</h3>
                <p>Unlock hidden talents. Track core competencies and self-reported skills verified through peers and manager assessments.</p>
              </div>
            </div>

            <div class="story-card">
              <div class="story-num">02</div>
              <div class="story-body">
                <h3>What skills they are developing</h3>
                <p>Monitor real-time learning path progress. See what courses employees are taking and which skills they are actively leveling up.</p>
              </div>
            </div>

            <div class="story-card">
              <div class="story-num">03</div>
              <div class="story-body">
                <h3>Where critical gaps exist</h3>
                <p>Instantly map team capabilities against upcoming projects or organizational target profiles to locate and close skill deficits.</p>
              </div>
            </div>
            
            <div class="story-card">
              <div class="story-num">04</div>
              <div class="story-body">
                <h3>Valid credentials & career paths</h3>
                <p>Keep compliance high with automated expiration warnings and connect skill development directly to promotion criteria.</p>
              </div>
            </div>
          </div>

          <!-- Right side: Visual comparison (Static vs Dynamic) -->
          <div class="story-visual animate-on-scroll">
            <!-- Glass card container -->
            <div class="comparison-container">
              <!-- Background card: Old Static Resume -->
              <div class="resume-card-static">
                <div class="red-line-overlay"></div>
                <div class="resume-header">
                  <div class="gray-circle"></div>
                  <div class="gray-text-block w-40"></div>
                  <div class="gray-text-block w-20"></div>
                </div>
                <div class="resume-body">
                  <div class="gray-text-block w-90"></div>
                  <div class="gray-text-block w-80"></div>
                  <div class="gray-text-block w-70"></div>
                  <div class="resume-tag">Static PDF Resume (Outdated)</div>
                </div>
              </div>

              <!-- Foreground Card: SkillSphere Live Dynamic Intelligence -->
              <div class="profile-card-dynamic">
                <div class="live-indicator">
                  <span class="live-dot"></span>
                  <span>LIVE INTELLIGENCE</span>
                </div>
                
                <div class="profile-header">
                  <div class="avatar-ring">
                    <svg viewBox="0 0 100 100" class="ring-svg">
                      <circle cx="50" cy="50" r="45" stroke="#1f2937" stroke-width="6" fill="none" />
                      <circle cx="50" cy="50" r="45" stroke="var(--primary-accent)" stroke-width="6" stroke-dasharray="283" stroke-dashoffset="85" fill="none" class="ring-fill" />
                    </svg>
                    <span class="avatar-letter">E</span>
                  </div>
                  <div>
                    <h4>Emily Chen</h4>
                    <p class="role-badge">Senior Fullstack Engineer</p>
                  </div>
                </div>

                <div class="profile-skills-list">
                  <div class="live-skill-item">
                    <div class="lbl-row">
                      <span>Angular 20</span>
                      <span class="pct">90%</span>
                    </div>
                    <div class="bar-bg"><div class="bar-fill cyan-glow" style="width: 90%"></div></div>
                  </div>
                  
                  <div class="live-skill-item">
                    <div class="lbl-row">
                      <span>Spring Boot 3</span>
                      <span class="pct">75%</span>
                    </div>
                    <div class="bar-bg"><div class="bar-fill orange-glow" style="width: 75%"></div></div>
                  </div>

                  <div class="live-skill-item">
                    <div class="lbl-row">
                      <span>Docker & Kubernetes</span>
                      <span class="pct">60%</span>
                    </div>
                    <div class="bar-bg"><div class="bar-fill purple-glow" style="width: 60%"></div></div>
                  </div>
                </div>

                <div class="profile-stats-mini">
                  <div class="stat-mini">
                    <span class="v">12</span>
                    <span class="l">Verified Skills</span>
                  </div>
                  <div class="stat-mini">
                    <span class="v">3</span>
                    <span class="l">Certifications</span>
                  </div>
                  <div class="stat-mini">
                    <span class="v">89%</span>
                    <span class="l">Compliance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class WorkforceStorySectionComponent {}
