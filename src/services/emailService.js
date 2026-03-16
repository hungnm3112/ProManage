const nodemailer = require('nodemailer');
const config = require('../config/app');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `ProManage <${config.email.user}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const message = `
      <h1>Welcome to ProManage!</h1>
      <p>Hi ${user.name},</p>
      <p>Thank you for registering with ProManage.</p>
      <p>You can now start managing your projects efficiently.</p>
      <br>
      <p>Best regards,</p>
      <p>ProManage Team</p>
    `;

    await this.sendEmail({
      email: user.email,
      subject: 'Welcome to ProManage',
      message
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const message = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br>
      <p>Best regards,</p>
      <p>ProManage Team</p>
    `;

    await this.sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message
    });
  }

  async sendProjectInvitation(user, project, invitedBy) {
    const message = `
      <h1>Project Invitation</h1>
      <p>Hi ${user.name},</p>
      <p>${invitedBy.name} has invited you to join the project: <strong>${project.name}</strong></p>
      <p>Project Description: ${project.description}</p>
      <p>Login to ProManage to view the project details.</p>
      <br>
      <p>Best regards,</p>
      <p>ProManage Team</p>
    `;

    await this.sendEmail({
      email: user.email,
      subject: `Project Invitation - ${project.name}`,
      message
    });
  }

  async sendTaskAssignment(user, task, project) {
    const message = `
      <h1>New Task Assigned</h1>
      <p>Hi ${user.name},</p>
      <p>You have been assigned a new task:</p>
      <p><strong>Task:</strong> ${task.title}</p>
      <p><strong>Project:</strong> ${project.name}</p>
      <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
      <p><strong>Priority:</strong> ${task.priority}</p>
      <p>Login to ProManage to view the task details.</p>
      <br>
      <p>Best regards,</p>
      <p>ProManage Team</p>
    `;

    await this.sendEmail({
      email: user.email,
      subject: `New Task Assignment - ${task.title}`,
      message
    });
  }
}

module.exports = new EmailService();
