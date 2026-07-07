import type { Metadata } from 'next';
import './globals.compiled.css';
import { AppProvider } from '@/contexto_global/AppContext';
import { ThemeProvider } from '@/contexto_global/ThemeContext';
import NavigationSidebar from '@/componentes_visuales/NavigationSidebar';

export const metadata: Metadata = {
  title: 'Neuro Vision Analytic - Análisis Facial',
  description: 'Plataforma clínica para evaluar la movilidad facial y el tremor en pacientes con Parkinson.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased">
        <ThemeProvider>
          <AppProvider>
            <div className="app-container">
              <NavigationSidebar />
              <main className="min-h-screen overflow-y-auto">
                {children}
              </main>
            </div>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
