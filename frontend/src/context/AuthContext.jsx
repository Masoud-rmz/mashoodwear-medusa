/**
 * Auth context for storefront customer session.
 * purpose --- share login state across header, login, and account pages ---
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearCustomerToken,
  getCustomerToken,
  isCustomerLoggedIn,
} from "../api/medusa/customerAuth";
import { getCustomerMe } from "../api/medusa/customer";
import { transferCartToCustomer } from "../api/medusa/cart";

const AuthContext = createContext(null);

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getCustomerToken());
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getCustomerToken()));

  const refreshCustomer = useCallback(async () => {
    if (!getCustomerToken()) {
      setCustomer(null);
      setToken(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    const result = await getCustomerMe();
    if (!result.ok) {
      setCustomer(null);
      setToken(null);
      setLoading(false);
      return null;
    }
    setCustomer(result.customer);
    setToken(getCustomerToken());
    setLoading(false);
    return result.customer;
  }, []);

  useEffect(() => {
    if (isCustomerLoggedIn()) {
      refreshCustomer();
    } else {
      setLoading(false);
    }
  }, [refreshCustomer]);

  const onAuthSuccess = useCallback(async () => {
    setToken(getCustomerToken());
    await transferCartToCustomer().catch(() => null);
    return refreshCustomer();
  }, [refreshCustomer]);

  const logout = useCallback(() => {
    clearCustomerToken();
    setToken(null);
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      customer,
      loading,
      isLoggedIn: Boolean(token),
      refreshCustomer,
      onAuthSuccess,
      logout,
    }),
    [token, customer, loading, refreshCustomer, onAuthSuccess, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @returns {{
 *   token: string | null,
 *   customer: object | null,
 *   loading: boolean,
 *   isLoggedIn: boolean,
 *   refreshCustomer: () => Promise<object | null>,
 *   onAuthSuccess: () => Promise<object | null>,
 *   logout: () => void,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
