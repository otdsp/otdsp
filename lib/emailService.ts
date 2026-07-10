interface SendEmailProps {
  emails: string[];
  subject: string;
  htmlContent: string;
}

export async function sendSystemEmail({ emails, subject, htmlContent }: SendEmailProps) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emails, subject, htmlContent }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao enviar e-mail');
  }
  return result;
}