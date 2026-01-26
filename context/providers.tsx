'use client'

import { AuthProvider } from '@/context/auth-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { QueryProvider } from '@/context/query-provider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
          {children}
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  )
}
