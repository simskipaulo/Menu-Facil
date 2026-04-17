import * as SecureStore from "expo-secure-store";

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync("token");
  return { Authorization: `Bearer ${token}` };
}
