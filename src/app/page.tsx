"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      "/compare/STLTH%20TITAN%20MAX%20DISPOSABLE-vs-VICE%20BOX%202"
    );
  }, [router]); // ✅ Now `useEffect` runs properly if `router` changes

  return <p>Redirecting...</p>; // ✅ Optional: Shows a message while redirecting
}
