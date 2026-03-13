import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { SignalResult, SignalLevel } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";

function signalStyle(level: SignalLevel, t: (k: string) => string): { label: string; color: string; bg: string } {
  switch (level) {
    case "strongBuy":
      return { label: t("sig.strongBuy"), color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "buy":
      return { label: t("sig.buy"), color: "text-green-500", bg: "bg-green-500/10" };
    case "neutral":
      return { label: t("sig.neutral"), color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "sell":
      return { label: t("sig.sell"), color: "text-orange-500", bg: "bg-orange-500/10" };
    case "strongSell":
      return { label: t("sig.strongSell"), color: "text-red-500", bg: "bg-red-500/10" };
  }
}

function SignalBadge({ level, t }: { level: SignalLevel; t: (k: string) => string }) {
  const s = signalStyle(level, t);
  return (
    <Badge variant="outline" className={`${s.bg} ${s.color} text-sm px-3 py-1`}>
      {s.label}
    </Badge>
  );
}

export default function SignalPanel({ signal }: { signal: SignalResult }) {
  const t = useT();
  const overall = signalStyle(signal.overall, t);

  return (
    <div className="space-y-4" data-testid="signal-panel">
      {/* Overall Signal */}
      <Card className={`border-2 ${overall.color.replace("text-", "border-")}/20`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">{t("sig.overall")}</div>
            <div className={`text-3xl font-bold ${overall.color}`}>{overall.label}</div>
            <div className="flex justify-center gap-6 pt-2">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("sig.techSignal")}</div>
                <SignalBadge level={signal.techSignal} t={t} />
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("sig.fundSignal")}</div>
                <SignalBadge level={signal.fundSignal} t={t} />
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("sig.sentSignal")}</div>
                <SignalBadge level={signal.sentSignal} t={t} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sig.reasons")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {signal.reasons.map((reasonKey, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                <span>{t(reasonKey)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{t("sig.disclaimer")}</span>
      </div>
    </div>
  );
}
