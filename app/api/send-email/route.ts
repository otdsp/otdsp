import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import nodemailer from 'nodemailer';

// Configurando o transportador do Gmail utilizando as credenciais seguras do servidor
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  try {
    // 1. Validar Sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validar se o usuário logado é Staff
    const { data: profile } = await supabase
      .from('user_auth')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'staff') {
      return NextResponse.json({ error: 'Acesso restrito para administradores' }, { status: 403 });
    }

    // 3. Pegar os destinatários enviados pelo frontend
    const { emails, subject, htmlContent } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatário informado' }, { status: 400 });
    }

    // 4. Enviar e-mail para a lista de participantes
    // O Gmail aceita uma string com os e-mails separados por vírgula no campo "to"
    await transporter.sendMail({
      from: `"OTDSP Staff" <${process.env.GMAIL_USER}>`,
      to: emails.join(', '), 
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}