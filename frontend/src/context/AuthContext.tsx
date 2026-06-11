import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Usuario } from "../types/auth";

import { obtenerUsuarioActual } from "../services/authService";
import { getToken, removeToken } from "../services/token";

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const usuarioActual = await obtenerUsuarioActual(token);
        setUsuario(usuarioActual);
      } catch {
        removeToken();
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    }

    cargarUsuario();
  }, []);

  function logout() {
    removeToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        setUsuario,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
