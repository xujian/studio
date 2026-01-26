import { ThemeProvider as NextThemeProvider, ThemeProviderProps } from 'next-themes'

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemeProvider {...props}>
      {children}
    </NextThemeProvider>
  )
}