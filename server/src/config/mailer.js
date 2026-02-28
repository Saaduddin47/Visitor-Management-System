import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter;

export const getMailer = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user && env.smtp.pass ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });

  return transporter;
};

export const sendMail = async (options) => {
  const mailer = getMailer();
  return mailer.sendMail({
    from: env.smtp.from,
    ...options
  });
};
