import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("token").then((t) => {
      setHasToken(!!t);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;
  return <Redirect href={hasToken ? "/(admin)/menu-items" : "/(auth)/login"} />;
}
