'use client'

import { ThemeProvider } from '@/context/theme-provider'
import { QueryProvider } from '@/context/query-provider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
        {children}
      </ThemeProvider>
    </QueryProvider>
  )
}
