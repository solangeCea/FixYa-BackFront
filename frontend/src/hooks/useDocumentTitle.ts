import { useEffect } from "react";

/**
 * Actualiza el título del documento (pestaña del navegador) por página.
 * Mejora el SEO y la orientación del usuario sin depender de librerías extra.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;

    return () => {
      document.title = previous;
    };
  }, [title]);
}
