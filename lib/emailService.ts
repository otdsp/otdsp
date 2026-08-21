import { supabase } from './supabase';

interface SendEmailProps {
  emails: string[];
  subject: string;
  htmlContent: string;
}

export async function sendSystemEmail({
  emails,
  subject,
  htmlContent,
}: SendEmailProps) {
  const { data, error } = await supabase.functions.invoke(
    'send-system-email',
    {
      body: {
        emails,
        subject,
        htmlContent,
      },
    }
  );

  if (error) {
    throw error;
  }

  return data;
}