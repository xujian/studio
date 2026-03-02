'use client'

import { AuthProvider } from '@/context/auth-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { QueryProvider } from '@/context/query-provider'
import { LenisProvider } from '@/context/lenis-provider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
          <LenisProvider>
            {children}
          </LenisProvider>
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  )
}
