import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // Criando o cliente do Supabase no padrão moderno SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // O Next.js pode reclamar se tentar definir cookies em uma API Route de leitura,
            // mas o Supabase exige a definição do setAll na tipagem. Tratamos silenciosamente.
          }
        },
      },
    }
  );

  try {
    // 1. Verificar a sessão do usuário logado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validar a role na tabela user_auth
    const { data: profile } = await supabase
      .from('user_auth')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'staff') {
      return NextResponse.json({ error: 'Acesso restrito para administradores' }, { status: 403 });
    }

    // 3. Pegar os dados enviados pelo frontend
    const { emails, subject, htmlContent } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatário informado' }, { status: 400 });
    }

    // 4. Disparar e-mails via Resend
    const { data, error } = await resend.emails.send({
      from: 'OTDSP <nao-responda@seudominio.com>',
      to: emails,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}