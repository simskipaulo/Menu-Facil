import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "../constants/api";

export default function Index() {
  const [status, setStatus] = useState<"loading" | "auth" | "unauth">("loading");

  useEffect(() => {
    SecureStore.getItemAsync("token").then(async (t) => {
      if (!t) { setStatus("unauth"); return; }
      try {
        await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
          timeout: 6000,
        });
        setStatus("auth");
      } catch {
        await SecureStore.deleteItemAsync("token");
        setStatus("unauth");
      }
    });
  }, []);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1e3a8a" }}>
        <ActivityIndicator color="#60a5fa" size="large" />
      </View>
    );
  }

  return <Redirect href={status === "auth" ? "/(admin)/menu-items" : "/(auth)/login"} />;
}
