"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Calendar } from "lucide-react";

interface ExamDateItem {
  id: string;
  date: string;
  label: string;
}

export default function AdminExamDatesPage() {
  const router = useRouter();
  const [dates, setDates] = useState<ExamDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");

  async function fetchDates() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/exam-dates", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load exam dates");
      const data = await res.json();
      setDates(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setDates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDates();
  }, []);

  async function handleAdd() {
    const dateStr = newDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setError("Enter date as YYYY-MM-DD");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/exam-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: dateStr,
          label: newLabel.trim() || dateStr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add");
      setSuccess("Exam date added. It will appear in dashboard select.");
      setNewDate("");
      setNewLabel("");
      await fetchDates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Exam Dates</h2>
          <p className="text-gray-600 mt-1">
            Add exam dates here. They will appear in the dashboard select for users.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Add exam date
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="newDate">Date (YYYY-MM-DD)</Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              disabled={saving}
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newLabel">Label (optional)</Label>
            <Input
              id="newLabel"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. June 15, 2026"
              disabled={saving}
              className="w-48"
            />
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available exam dates</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : dates.length === 0 ? (
          <p className="text-gray-500">No exam dates yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {dates.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-gray-900">{d.date}</span>
                <span className="text-gray-600">{d.label || d.date}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

