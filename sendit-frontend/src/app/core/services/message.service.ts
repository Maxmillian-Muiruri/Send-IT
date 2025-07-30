import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor() { }

  /**
   * Shows a success message with green background
   * @param message - The success message to display
   * @param duration - Duration in milliseconds (default: 3000ms)
   */
  showSuccess(message: string, duration: number = 3000) {
    this.showMessage(message, 'success', duration);
  }

  /**
   * Shows an error message with red background
   * @param message - The error message to display
   * @param duration - Duration in milliseconds (default: 5000ms)
   */
  showError(message: string, duration: number = 5000) {
    this.showMessage(message, 'error', duration);
  }

  /**
   * Shows a warning message with orange background
   * @param message - The warning message to display
   * @param duration - Duration in milliseconds (default: 4000ms)
   */
  showWarning(message: string, duration: number = 4000) {
    this.showMessage(message, 'warning', duration);
  }

  /**
   * Shows an info message with blue background
   * @param message - The info message to display
   * @param duration - Duration in milliseconds (default: 4000ms)
   */
  showInfo(message: string, duration: number = 4000) {
    this.showMessage(message, 'info', duration);
  }

  /**
   * Internal method to create and display messages
   * @param message - The message to display
   * @param type - The type of message (success, error, warning, info)
   * @param duration - Duration in milliseconds
   */
  private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    // Set styles based on type
    const styles = this.getMessageStyles(type);
    messageDiv.style.cssText = styles;
    
    // Add to DOM
    document.body.appendChild(messageDiv);
    
    // Remove after duration
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, duration);
  }

  /**
   * Get CSS styles for different message types
   * @param type - The type of message
   * @returns CSS styles string
   */
  private getMessageStyles(type: 'success' | 'error' | 'warning' | 'info'): string {
    const baseStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      word-wrap: break-word;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;

    const typeStyles = {
      success: 'background: #4CAF50;',
      error: 'background: #f44336;',
      warning: 'background: #ff9800;',
      info: 'background: #2196F3;'
    };

    return baseStyles + typeStyles[type];
  }

  /**
   * Clear all messages from the screen
   */
  clearAllMessages() {
    const messages = document.querySelectorAll('.success-message, .error-message, .warning-message, .info-message');
    messages.forEach(message => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    });
  }
} 