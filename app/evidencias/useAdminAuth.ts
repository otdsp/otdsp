import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) return router.replace('/login');

        const { data: userData, error } = await supabase
          .from('user_auth')
          .select('role')
          .eq('id', session.user.id)
          .single();

        //if (error || userData?.role !== 'staff' && userData?.role !== 'pesquisa') return router.replace('/');

        setIsAuthorized(true);
      } catch (error) {
        console.error("Erro na autenticação:", error);
        router.replace('/login');
      } finally {
        setIsAuthLoading(false);
      }
    };

    authenticate();
  }, [router]);

  return { isAuthorized, isAuthLoading };
}