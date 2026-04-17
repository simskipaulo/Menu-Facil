import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "../constants/api";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  tenant_id: number | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("token").then(async (t) => {
      if (t) {
        setToken(t);
        try {
          const { data } = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          setUser(data);
        } catch {
          await SecureStore.deleteItemAsync("token");
        }
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
    await SecureStore.setItemAsync("token", data.access_token);
    setToken(data.access_token);
    const me = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    setUser(me.data);
    return me.data as AuthUser;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  };

  return { user, token, loading, login, logout };
}
