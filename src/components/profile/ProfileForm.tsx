"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";
import { Save, User, Mail, Lock, Target, Calendar, Shield } from "lucide-react";

interface ProfileFormProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
}

const NAME_MIN = 2;
const NAME_MAX = 100;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 50;
const TARGET_SCORE_MIN = 400;
const TARGET_SCORE_MAX = 1600;

export function ProfileForm({ user, onUserUpdate }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [targetScore, setTargetScore] = useState<string>(
    user.targetScore != null ? String(user.targetScore) : ""
  );
  const [examDate, setExamDate] = useState(
    user.examDate ? user.examDate.slice(0, 10) : ""
  );

  useEffect(() => {
    setName(user.name || "");
    setTargetScore(user.targetScore != null ? String(user.targetScore) : "");
    setExamDate(user.examDate ? user.examDate.slice(0, 10) : "");
  }, [user]);

  const getPayload = () => {
    const payload: {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
      targetScore?: number;
      examDate?: string;
    } = {};

    const nameTrim = name.trim();
    if (nameTrim && (nameTrim.length < NAME_MIN || nameTrim.length > NAME_MAX)) {
      throw new Error(`Ism ${NAME_MIN}-${NAME_MAX} belgi orasida bo‘lishi kerak`);
    }
    if (nameTrim) payload.name = nameTrim;

    const wantPasswordChange = Boolean(newPassword.trim());
    if (wantPasswordChange) {
      if (!currentPassword.trim()) {
        throw new Error("Parolni o‘zgartirish uchun joriy parolni kiriting");
      }
      if (
        newPassword.length < PASSWORD_MIN ||
        newPassword.length > PASSWORD_MAX
      ) {
        throw new Error(`Yangi parol ${PASSWORD_MIN}-${PASSWORD_MAX} belgi orasida bo‘lishi kerak`);
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (targetScore.trim() !== "") {
      const score = Number(targetScore);
      if (Number.isNaN(score) || score < TARGET_SCORE_MIN || score > TARGET_SCORE_MAX) {
        throw new Error(`Target score ${TARGET_SCORE_MIN}-${TARGET_SCORE_MAX} orasida bo‘lishi kerak`);
      }
      payload.targetScore = score;
    }

    if (examDate.trim()) {
      payload.examDate = new Date(examDate).toISOString().slice(0, 10);
    }

    return payload;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = getPayload();
      if (Object.keys(payload).length === 0) {
        setError("O‘zgartirish kiritilmagan");
        return;
      }

      const updatedUser = await authService.updateProfile(payload);
      onUserUpdate(updatedUser);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Profil yangilandi");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profil yangilanmadi. Qayta urinib ko‘ring."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Asosiy ma'lumot */}
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
            Profil tahrirlash
              </CardTitle>
              <CardDescription>
            PATCH /auth/profile — ism, parol, target score va imtihon sanasi
              </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* User ID (faqat o‘qish) */}
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input id="id" value={user.id} disabled className="bg-gray-50" />
          </div>

          {/* Email (faqat o‘qish) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Ism (2–100 belgi) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Ism (2–100 belgi)
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingizni kiriting"
              minLength={NAME_MIN}
              maxLength={NAME_MAX}
            />
          </div>

          {/* Parol o‘zgartirish */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Parolni o‘zgartirish (ixtiyoriy)
            </Label>
            <p className="text-xs text-gray-500">
              O‘zgartirmoqchi bo‘lsangiz, joriy parol va yangi parolni kiriting (8–50 belgi).
            </p>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Joriy parol"
              className="max-w-md"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yangi parol (8–50 belgi)"
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              className="max-w-md"
            />
          </div>

          {/* Target score (400–1600) */}
          <div className="space-y-2">
            <Label htmlFor="targetScore" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target SAT score (400–1600)
            </Label>
            <Input
              id="targetScore"
              type="number"
              min={TARGET_SCORE_MIN}
              max={TARGET_SCORE_MAX}
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="Masalan 1400"
              className="max-w-xs"
            />
          </div>

          {/* Imtihon sanasi (ISO 8601) */}
          <div className="space-y-2">
            <Label htmlFor="examDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Imtihon sanasi
            </Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Role (faqat o‘qish) */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Input
              id="role"
              value={user.role}
              disabled
              className="bg-gray-50 capitalize max-w-xs"
            />
          </div>

          <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
              className="bg-blue-900 hover:bg-blue-800 gap-2"
              >
                <Save className="h-4 w-4" />
              {isLoading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
