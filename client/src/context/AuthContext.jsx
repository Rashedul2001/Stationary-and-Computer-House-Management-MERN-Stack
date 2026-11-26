import { createContext, useContext } from 'react';
import { authClient } from '../lib/authClient';

const AuthContext = createContext({
  user: null,
  session: null,
  isPending: true,
  isAuthenticated: false,
  isAdmin: false,
  refetchSession: async () => {},
});

export function AuthProvider({ children }) {
  const { data, isPending, refetch } = authClient.useSession();
  const user = data?.user || null;
  const session = data?.session || null;
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isPending,
        isAuthenticated,
        isAdmin,
        refetchSession: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
