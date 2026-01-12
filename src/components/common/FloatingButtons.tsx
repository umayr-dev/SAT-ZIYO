"use client";

import { TopToScrollButton } from "./TopToScrollButton";
import { SupportChatButton } from "./SupportChatButton";

/**
 * Floating Buttons Wrapper
 * Client Component wrapper for all floating buttons
 * This prevents issues with Client Components in Server Component layout
 */
export function FloatingButtons() {
  return (
    <>
      <TopToScrollButton />
      <SupportChatButton />
    </>
  );
}
