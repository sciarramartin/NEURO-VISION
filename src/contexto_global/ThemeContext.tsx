'use client';

import React, { createContext, useContext, useEffect } from 'react';

/**
 * NEUROVISION trabaja con un único tema (oscuro), por diseño: la identidad
 * visual (incluido el logo de tres puntos) está pensada sobre fondo oscuro.
 *
 * Antes existía un selector claro/oscuro que no tenía ningún efecto real:
 * alternaba el atributo `data-theme` correctamente, pero `globals.css`
 * nunca definió variables de color para el tema claro. En vez de construir
 * un segundo tema completo, se fija el oscuro como único modo soportado
 * y se retira el control roto de la interfaz.
 */
type Theme = 'dark';

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
