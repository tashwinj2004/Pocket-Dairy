import { useEffect } from "react";
import { useRouter } from "next/router";

import { session } from "../lib/api";

/**
 * Portal — redirects the user to the correct dashboard based on their role.
 * Renders nothing itself; it exists purely for routing.
 */
export default function Portal() {
  const router = useRouter();

  useEffect(() => {
    const value = session();
    const destination =
      value?.user?.role === "leader"
        ? "/leader/dashboard"
        : "/employee/dashboard";
    router.replace(destination);
  }, [router]);

  return null;
}
