"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Calendar, Pencil, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchDates() {
    try {
      setLoading(true);
      setError("");
      // Backend: GET /exams/dates -> proxy: /api/exam-dates
      const res = await fetch("/api/exam-dates", {
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
      setError("Sana tanlang yoki YYYY-MM-DD ko‘rinishida kiriting.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // No /admin prefix: POST /api/exam-dates -> backend /exams/dates
      const res = await fetch("/api/exam-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Backend faqat { date } qabul qiladi
        body: JSON.stringify({ date: dateStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add");
      setSuccess("Exam date qo‘shildi.");
      setNewDate("");
      await fetchDates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(d: ExamDateItem) {
    setEditingId(d.id);
    setEditDate(d.date);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDate("");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const dateStr = editDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setError("Sana tanlang yoki YYYY-MM-DD ko‘rinishida kiriting.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/admin/exam-dates/${encodeURIComponent(editingId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // Lokal faylda ham faqat sana kerak
          body: JSON.stringify({ date: dateStr }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Tahrirlash muvaffaqiyatsiz");
      setSuccess("Sana yangilandi.");
      setEditingId(null);
      setEditDate("");
      await fetchDates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tahrirlash muvaffaqiyatsiz");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: ExamDateItem) {
    if (!confirm(`"${d.label || d.date}" sanasini o‘chirishni xohlaysizmi?`))
      return;
    setDeletingId(d.id);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/exam-dates/${encodeURIComponent(d.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "O‘chirish muvaffaqiyatsiz");
      }
      setSuccess("Sana o‘chirildi.");
      await fetchDates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "O‘chirish muvaffaqiyatsiz");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Exam Dates</h2>
          <p className="text-gray-600 mt-1">
            Add exam dates here. They will appear in the dashboard select for
            users.
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
            <Label htmlFor="newDate">Sana</Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              disabled={saving}
              className="w-44"
            />
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? "Qo‘shilmoqda…" : "Qo‘shish"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available exam dates
        </h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : dates.length === 0 ? (
          <p className="text-gray-500">No exam dates yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {dates.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0"
              >
                {editingId === d.id ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? "..." : "Saqlash"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Bekor
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">
                        {/* Faqat sana (YYYY-MM-DD), vaqtsiz */}
                        {d.date.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(d)}
                        disabled={saving || deletingId !== null}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Tahrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(d)}
                        disabled={saving || deletingId !== null}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === d.id ? "..." : "O‘chirish"}
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
