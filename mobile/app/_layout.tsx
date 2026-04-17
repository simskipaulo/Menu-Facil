import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatedSplash } from "../components/AnimatedSplash";

const qc = new QueryClient();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={qc}>
      <Stack screenOptions={{ headerShown: false }} />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </QueryClientProvider>
  );
}
