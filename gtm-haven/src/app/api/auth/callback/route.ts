import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        let redirectPath = next;
        
        // If auto routing is requested (from OAuth), determine if it's a new user
        if (next === 'auto' && data.user) {
          const createdAt = new Date(data.user.created_at).getTime();
          const now = Date.now();
          // If created within the last 2 minutes, treat as a new signup
          const isNewUser = (now - createdAt) < 120000;
          
          if (isNewUser) {
            redirectPath = '/onboarding';
          } else {
            redirectPath = '/dashboard';
          }
        } else if (next === 'auto') {
          redirectPath = '/dashboard';
        }

        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
      } else {
        console.error('Supabase auth callback error:', error.message);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/sign-in?error=auth', request.url));
}
