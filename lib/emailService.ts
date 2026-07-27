import emailjs from '@emailjs/browser';

interface SendEmailProps {
  emails: string[];
  subject: string;
  htmlContent: string;
}

export async function sendSystemEmail({ emails, subject, htmlContent }: SendEmailProps) {
  // Configurações do EmailJS
  const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID || 'seu_service_id_do_emailjs';
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_TEMPLATE_ID || 'seu_template_id_do_emailjs';
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY || 'sua_chave_publica_do_emailjs';

  // Como o EmailJS envia por destinatário individual, fazemos um laço rápido
  const promises = emails.map((email) => {
    const templateParams = {
      to_email: email,
      subject: subject,
      message: htmlContent,
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  });

  // Aguarda todos os disparos terminarem
  return Promise.all(promises);
}