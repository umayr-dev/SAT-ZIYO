import { redirect } from "next/navigation";

/** Eski havolalar; kontent dashboard layout ichida yangilanadi */
export default function SettingsPage() {
  redirect("/dashboard/settings");
}
