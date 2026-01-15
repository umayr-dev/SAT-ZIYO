"use client";

import { TopToScrollButton } from "./TopToScrollButton";
// SupportChatButton removed - support is available in dashboard sidebar

/**
 * Floating Buttons Wrapper
 * Client Component wrapper for all floating buttons
 * This prevents issues with Client Components in Server Component layout
 */
export function FloatingButtons() {
  return (
    <>
      <TopToScrollButton />
      {/* SupportChatButton removed - support is available in dashboard sidebar */}
    </>
  );
}
