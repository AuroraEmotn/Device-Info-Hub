import { useState } from "react";
import { 
  ShoppingCart, 
  DollarSign, 
  Activity, 
  Battery, 
  Lock, 
  Smartphone, 
  HardDrive, 
  MemoryStick, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  CheckSquare
} from "lucide-react";
import { useEvaluateUsedDevice, type DeviceInfo } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../LangContext";
import { translations } from "../i18n";

export default function UsedBuyerPanel({ device }: { device: DeviceInfo }) {
  const { lang, dir } = useLang();
  const t = translations[lang];
  const evalMutation = useEvaluateUsedDevice();

  const defaultStorage = device.storage.split('/')[0]?.split(',')[0]?.trim() || "128GB";
  const defaultRam = device.ram.split('/')[0]?.split(',')[0]?.trim() || "8GB";

  const [condition, setCondition] = useState("excellent");
  const [storage, setStorage] = useState(defaultStorage);
  const [ram, setRam] = useState(defaultRam);
  const [screenCondition, setScreenCondition] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [defects, setDefects] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evalMutation.mutate({
      data: {
        deviceName: device.name,
        language: lang,
        condition,
        storage,
        ram,
        ...(screenCondition && { screenCondition }),
        ...(batteryHealth && { batteryHealth: Number(batteryHealth) }),
        isLocked,
        ...(defects && { defects }),
        ...(askingPrice && { askingPrice: Number(askingPrice) }),
        ...(currency && { currency }),
      }
    });
  };

  const isPending = evalMutation.isPending;
  const result = evalMutation.data;

  const getDealRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "good": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "fair": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "overpriced": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-primary/20 text-primary border-primary/50";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/30 bg-card/60 backdrop-blur overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.05)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {t.usedBuyerTab}
          </CardTitle>
          <CardDescription>
            {device.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label>{t.overallCondition} <span className="text-destructive">*</span></Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value)}
                  required
                >
                  <option value="excellent">{t.condExcellent}</option>
                  <option value="very_good">{t.condVeryGood}</option>
                  <option value="good">{t.condGood}</option>
                  <option value="acceptable">{t.condAcceptable}</option>
                  <option value="poor">{t.condPoor}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.storageVariant}</Label>
                  <Input value={storage} onChange={(e) => setStorage(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t.ramVariant}</Label>
                  <Input value={ram} onChange={(e) => setRam(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.screenCond}</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={screenCondition} 
                  onChange={(e) => setScreenCondition(e.target.value)}
                >
                  <option value="">--</option>
                  <option value="perfect">{t.screenPerfect}</option>
                  <option value="scratches">{t.screenScratches}</option>
                  <option value="cracked">{t.screenCracked}</option>
                  <option value="replaced">{t.screenReplaced}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t.batteryHealthLabel}</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1" 
                  placeholder="85"
                  value={batteryHealth} 
                  onChange={(e) => setBatteryHealth(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2 flex flex-col justify-center pt-6">
                <div className="flex items-center gap-3">
                  <Switch id="sim-locked" checked={isLocked} onCheckedChange={setIsLocked} />
                  <Label htmlFor="sim-locked" className="cursor-pointer">{t.simLocked}</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.askingPriceLabel}</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="500"
                    value={askingPrice} 
                    onChange={(e) => setAskingPrice(e.target.value)} 
                    className="flex-1"
                  />
                  <Input 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)} 
                    className="w-24 font-mono uppercase"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-2">
              <Label>{t.defectsLabel}</Label>
              <Textarea 
                placeholder={t.defectsPlaceholder}
                value={defects} 
                onChange={(e) => setDefects(e.target.value)} 
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-12 text-lg font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)]">
              {t.evaluateBtn}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isPending && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-card/40 backdrop-blur">
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-1/2 mx-auto mb-4" />
              <Skeleton className="h-6 w-1/3 mx-auto" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      )}

      {!isPending && result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/50 bg-card/80 backdrop-blur overflow-hidden relative shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <div className={`absolute top-0 w-full h-1 ${dir === 'rtl' ? 'bg-gradient-to-l right-0' : 'bg-gradient-to-r left-0'} from-primary via-primary/50 to-transparent`}></div>
            <CardContent className="pt-8 text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t.fairPriceRange}</p>
              <h2 className="text-5xl font-black text-foreground drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center justify-center gap-2" dir="ltr">
                {result.fairPriceMin} — {result.fairPriceMax} <span className="text-2xl text-primary">{result.currency}</span>
              </h2>
              <div className="pt-2 flex justify-center">
                <Badge variant="outline" className={`px-4 py-1.5 text-base border-2 ${getDealRatingColor(result.dealRating)}`}>
                  {result.dealRatingLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-background/50">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">{t.conditionScore}</span>
                  <span className="font-bold text-primary font-mono" dir="ltr">{result.score}/10</span>
                </div>
                <div className="flex gap-1.5 h-3 w-full" dir="ltr">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-sm ${i < result.score ? 'bg-primary shadow-[0_0_8px_rgba(0,255,255,0.4)]' : 'bg-primary/10'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/90 leading-relaxed">
                <span className="font-bold text-primary mb-1 block">{t.verdictLabel}:</span>
                {result.verdict}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard 
              title={t.strengthsLabel} 
              items={result.strengths} 
              icon={<ThumbsUp className="w-5 h-5 text-green-400" />} 
              borderColor="border-green-500/20"
              bgColor="bg-green-500/5"
            />
            <ResultCard 
              title={t.weaknessesLabel} 
              items={result.weaknesses} 
              icon={<ThumbsDown className="w-5 h-5 text-red-400" />} 
              borderColor="border-red-500/20"
              bgColor="bg-red-500/5"
            />
            <ResultCard 
              title={t.negotiationTipsLabel} 
              items={result.negotiationTips} 
              icon={<Lightbulb className="w-5 h-5 text-cyan-400" />} 
              borderColor="border-cyan-500/20"
              bgColor="bg-cyan-500/5"
            />
            <ResultCard 
              title={t.checklistLabel} 
              items={result.checklistBeforeBuying} 
              icon={<CheckSquare className="w-5 h-5 text-purple-400" />} 
              borderColor="border-purple-500/20"
              bgColor="bg-purple-500/5"
            />
          </div>

        </div>
      )}
    </div>
  );
}

function ResultCard({ title, items, icon, borderColor, bgColor }: { title: string, items: string[], icon: React.ReactNode, borderColor: string, bgColor: string }) {
  if (!items || items.length === 0) return null;
  return (
    <Card className={`${borderColor} ${bgColor} backdrop-blur`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-foreground/80">
              <span className="mt-1 text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
