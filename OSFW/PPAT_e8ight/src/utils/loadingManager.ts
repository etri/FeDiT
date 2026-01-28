/**
 * Loading Manager
 * Manages loading indicators and progress tracking
 */

// Type definitions
export type LoadingStep = {
  number: number;
  title: string;
  message?: string;
};

// ============================================================================
// Loading Manager Class
// ============================================================================

export class LoadingManager {
  private static loadingOverlay: HTMLElement | null = null;

  /**
   * Show loading overlay with title and initial message
   */
  static showLoading(title: string, message: string): void {
    this.createLoadingOverlay(title);
    this.updateLoadingStep(1, message);
  }

  /**
   * Hide loading overlay
   */
  static hideLoading(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('active');
    }
  }

  /**
   * Update loading step
   */
  static updateLoadingStep(stepNumber: number, message?: string): void {
    if (!this.loadingOverlay) return;

    const step = document.getElementById(`step${stepNumber}`);
    if (!step) return;

    // Mark previous steps as completed
    for (let i = 1; i < stepNumber; i++) {
      const prevStep = document.getElementById(`step${i}`);
      if (prevStep) {
        prevStep.classList.remove('active');
        prevStep.classList.add('completed');
        const icon = prevStep.querySelector('.loading-step-icon');
        if (icon) icon.textContent = '✓';
      }
    }

    // Mark current step as active
    step.classList.add('active');

    // Update message if provided
    if (message) {
      const messageElement = document.getElementById(`step${stepNumber}-msg`);
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
    
    // Update progress bar
    this.updateProgress(stepNumber, 6);
    
    // Update current task display
    const currentTask = document.getElementById('currentTask');
    if (currentTask && message) {
      currentTask.textContent = message;
    }
  }
  
  /**
   * Update progress bar
   */
  static updateProgress(current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }
  }
  
  /**
   * Update loading statistics
   */
  static updateStats(stats: { files?: number; size?: string; time?: string }): void {
    const statsElement = document.getElementById('loadingStats');
    if (!statsElement) return;
    
    let statsHtml = '';
    if (stats.files !== undefined) {
      statsHtml += `<div>Files: ${stats.files}</div>`;
    }
    if (stats.size) {
      statsHtml += `<div>Size: ${stats.size}</div>`;
    }
    if (stats.time) {
      statsHtml += `<div>Time: ${stats.time}</div>`;
    }
    
    statsElement.innerHTML = statsHtml;
  }

  /**
   * Complete all loading steps
   */
  static completeLoading(): void {
    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById(`step${i}`);
      if (step) {
        step.classList.remove('active');
        step.classList.add('completed');
        const icon = step.querySelector('.loading-step-icon');
        if (icon) icon.textContent = '✓';
      }
    }
  }

  /**
   * Create loading overlay HTML
   */
  private static createLoadingOverlay(title: string): void {
    // Remove existing overlay if any
    if (this.loadingOverlay) {
      this.loadingOverlay.remove();
    }

    // Create new overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.id = 'loadingOverlay';
    this.loadingOverlay.className = 'loading-overlay active';
    this.loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-header">
          <h3>${title}</h3>
          <div class="loading-progress-bar">
            <div class="loading-progress-fill" id="progressFill"></div>
          </div>
          <div class="loading-progress-text" id="progressText">0%</div>
        </div>
        <div class="loading-current-task" id="currentTask">Initializing...</div>
        <div class="loading-steps">
          <div class="loading-step" id="step1">
            <span class="loading-step-icon">1</span>
            <span class="loading-step-text">Configuration</span>
            <span class="loading-step-message" id="step1-msg">Collecting settings...</span>
          </div>
          <div class="loading-step" id="step2">
            <span class="loading-step-icon">2</span>
            <span class="loading-step-text">Mesh Files</span>
            <span class="loading-step-message" id="step2-msg">Waiting...</span>
          </div>
          <div class="loading-step" id="step3">
            <span class="loading-step-icon">3</span>
            <span class="loading-step-text">Boundary Setup</span>
            <span class="loading-step-message" id="step3-msg">Waiting...</span>
          </div>
          <div class="loading-step" id="step4">
            <span class="loading-step-icon">4</span>
            <span class="loading-step-text">Solver Config</span>
            <span class="loading-step-message" id="step4-msg">Waiting...</span>
          </div>
          <div class="loading-step" id="step5">
            <span class="loading-step-icon">5</span>
            <span class="loading-step-text">Export Model</span>
            <span class="loading-step-message" id="step5-msg">Waiting...</span>
          </div>
          <div class="loading-step" id="step6">
            <span class="loading-step-icon">6</span>
            <span class="loading-step-text">Create Archive</span>
            <span class="loading-step-message" id="step6-msg">Waiting...</span>
          </div>
        </div>
        <div class="loading-details" id="loadingDetails">
          <div class="loading-stats" id="loadingStats"></div>
        </div>
      </div>
    `;

    // Add styles if not already present
    this.addLoadingStyles();

    // Add to document
    document.body.appendChild(this.loadingOverlay);
  }

  /**
   * Add loading overlay styles
   */
  private static addLoadingStyles(): void {
    if (document.getElementById('loadingStyles')) return;

    const style = document.createElement('style');
    style.id = 'loadingStyles';
    style.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .loading-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .loading-content {
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border: 2px solid #00d4ff;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 212, 255, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      .loading-header {
        text-align: center;
        margin-bottom: 25px;
      }

      .loading-header h3 {
        color: #00d4ff;
        margin: 0 0 15px 0;
        font-size: 24px;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }
      
      .loading-progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin: 10px 0;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
      }
      
      .loading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff 0%, #00ff88 100%);
        border-radius: 4px;
        width: 0%;
        transition: width 0.5s ease;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }
      
      .loading-progress-text {
        color: #00ff88;
        font-size: 18px;
        font-weight: bold;
        margin: 10px 0;
      }
      
      .loading-current-task {
        text-align: center;
        color: #aaa;
        font-size: 14px;
        margin-bottom: 20px;
        min-height: 20px;
        font-style: italic;
      }

      .loading-steps {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .loading-step {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 10px;
        border-radius: 5px;
        background: #2a2a2a;
        border: 1px solid #444;
        transition: all 0.3s ease;
      }

      .loading-step.active {
        background: #003366;
        border-color: #00d4ff;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
      }

      .loading-step.completed {
        background: #003300;
        border-color: #00ff00;
      }

      .loading-step-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #444;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        flex-shrink: 0;
      }

      .loading-step.active .loading-step-icon {
        background: #00d4ff;
        color: #000;
      }

      .loading-step.completed .loading-step-icon {
        background: #00ff00;
        color: #000;
      }

      .loading-step-text {
        color: #fff;
        font-weight: bold;
        flex: 1;
      }

      .loading-step-message {
        color: #aaa;
        font-size: 12px;
        flex: 2;
        text-align: right;
      }
      
      .loading-step.active .loading-step-message {
        color: #00d4ff;
        animation: pulse 1.5s infinite;
      }
      
      .loading-step.completed .loading-step-message {
        color: #00ff00;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .loading-details {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #444;
      }
      
      .loading-stats {
        display: flex;
        justify-content: space-around;
        color: #888;
        font-size: 12px;
      }
      
      .loading-stats div {
        text-align: center;
      }
    `;

    document.head.appendChild(style);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export class LoadingUtils {
  /**
   * Delay function for async operations
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show loading indicator for file operations
   */
  static showLoadingIndicator(message: string = 'Loading...'): void {
    let loader = document.getElementById('loadingIndicator');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'loadingIndicator';
      loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(42, 42, 42, 0.95);
        color: #00d4ff;
        padding: 20px 30px;
        border-radius: 10px;
        border: 2px solid #00d4ff;
        font-size: 16px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 10px 50px rgba(0, 212, 255, 0.3);
      `;
      document.body.appendChild(loader);
    }

    loader.innerHTML = `
      <div style="
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 212, 255, 0.3);
        border-top-color: #00d4ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <span>${message}</span>
    `;

    // Add spin animation if not already present
    if (!document.getElementById('spinAnimation')) {
      const style = document.createElement('style');
      style.id = 'spinAnimation';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    loader.style.display = 'flex';
  }

  /**
   * Hide loading indicator
   */
  static hideLoadingIndicator(): void {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.style.display = 'none';
    }
  }
}
