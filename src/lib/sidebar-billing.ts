const CACHE_KEY = "sat_ziyo_sidebar_billing_v1";

/** Yangilash tez-tez bo‘lmasin — sidebar qayta ochilganda tarmoq bosimi kamayadi */
export const SIDEBAR_BILLING_MAX_AGE_MS = 10 * 60 * 1000;

export type SidebarBillingSnapshot = {
  isSubscriptionActive: boolean;
  subscriptionEndDate: Date | null;
  monthlyCompleted: number;
};

type Stored = {
  v: 1;
  at: number;
  isSubscriptionActive: boolean;
  subscriptionEndDateIso: string | null;
  monthlyCompleted: number;
};

export type CachedSidebarBilling = {
  snapshot: SidebarBillingSnapshot;
  at: number;
};

export function readSidebarBillingCache(): CachedSidebarBilling | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Stored;
    if (p?.v !== 1 || typeof p?.at !== "number") return null;
    let subscriptionEndDate: Date | null = null;
    if (p.subscriptionEndDateIso) {
      const d = new Date(p.subscriptionEndDateIso);
      if (!Number.isNaN(d.getTime())) subscriptionEndDate = d;
    }
    return {
      at: p.at,
      snapshot: {
        isSubscriptionActive: p.isSubscriptionActive,
        subscriptionEndDate,
        monthlyCompleted: p.monthlyCompleted,
      },
    };
  } catch {
    return null;
  }
}

export function writeSidebarBillingCache(s: SidebarBillingSnapshot): void {
  if (typeof window === "undefined") return;
  const payload: Stored = {
    v: 1,
    at: Date.now(),
    isSubscriptionActive: s.isSubscriptionActive,
    subscriptionEndDateIso: s.subscriptionEndDate?.toISOString() ?? null,
    monthlyCompleted: s.monthlyCompleted,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

/** To‘g‘ridan-to‘g‘ri sozlamalardan keyin yangilash kerak bo‘lsa */
export function invalidateSidebarBillingCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

let inflight: Promise<SidebarBillingSnapshot> | null = null;

/**
 * Bir vaqtning o‘zida faqat bitta /me + attempts juftligi — Strict Mode / qayta mount
 * takroriy so‘rovlarni bitta promise ga birlashtiradi.
 */
export function fetchSidebarBillingSnapshot(): Promise<SidebarBillingSnapshot> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [meRes, attemptsRes] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/practice/my-attempts", { credentials: "include" }),
      ]);

      let active = false;
      let endDate: Date | null = null;

      if (meRes.ok) {
        const meRaw = (await meRes.json()) as Record<string, unknown>;
        const me = ((
          meRaw?.data as Record<string, unknown> | undefined
        )?.user ??
          (meRaw?.data as Record<string, unknown> | undefined) ??
          (meRaw?.user as Record<string, unknown> | undefined) ??
          meRaw) as Record<string, unknown>;
        const subscriptionsArr = Array.isArray(me.subscriptions)
          ? (me.subscriptions as Array<Record<string, unknown>>)
          : [];
        const subscriptionObj =
          ((me.subscription as Record<string, unknown> | null) ??
            subscriptionsArr.find(
              (s) => String(s?.status ?? "").toUpperCase() === "ACTIVE",
            ) ??
            subscriptionsArr[0] ??
            null) as
            | { status?: string; expiresAt?: string; expires_at?: string }
            | null;
        const status = (
          me.subscriptionStatus ??
          me.subscription_status ??
          subscriptionObj?.status
        ) as string | undefined;
        const plan = (me.plan ?? me.subscriptionPlan ?? me.planType) as
          | string
          | undefined;
        const premiumFlag = (me.isPremium ??
          me.premium ??
          me.hasPremiumAccess) as boolean | undefined;
        const rawEnd =
          (me.subscriptionEndsAt ??
            me.subscription_end_at ??
            me.subscriptionEndDate ??
            me.subscription_expires_at ??
            me.premiumExpiresAt ??
            me.premium_expires_at ??
            subscriptionObj?.expiresAt ??
            subscriptionObj?.expires_at) as string | undefined;

        if (rawEnd) {
          const parsed = new Date(rawEnd);
          if (!Number.isNaN(parsed.getTime())) endDate = parsed;
        }

        const statusActive =
          typeof status === "string" && status.toUpperCase() === "ACTIVE";
        const planActive =
          typeof plan === "string" && plan.toUpperCase() === "PREMIUM";
        const dateActive = !!endDate && endDate.getTime() > Date.now();
        active = Boolean(premiumFlag || statusActive || planActive || dateActive);
      }

      let completedThisMonth = 0;
      if (attemptsRes.ok) {
        const rawAttempts = await attemptsRes.json();
        const attempts = Array.isArray(rawAttempts)
          ? rawAttempts
          : Array.isArray(rawAttempts?.data)
            ? rawAttempts.data
            : Array.isArray(rawAttempts?.attempts)
              ? rawAttempts.attempts
              : [];
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        completedThisMonth = attempts.filter((a: Record<string, unknown>) => {
          const st = String(a?.status ?? "").toUpperCase();
          if (st !== "COMPLETED") return false;
          const rawDate =
            a?.completedAt ?? a?.completed_at ?? a?.startedAt ?? a?.started_at;
          if (!rawDate) return false;
          const d = new Date(String(rawDate));
          return (
            !Number.isNaN(d.getTime()) &&
            d.getMonth() === month &&
            d.getFullYear() === year
          );
        }).length;
      }

      return {
        isSubscriptionActive: active,
        subscriptionEndDate: endDate,
        monthlyCompleted: completedThisMonth,
      };
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
