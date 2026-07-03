import { useState, useEffect, useRef } from "react";
import { Search, Server, Cpu, HardDrive, Smartphone, History, Check, X, Disc, Battery, Layers, Info, ShoppingCart } from "lucide-react";
import { useLookupDevice, useGetDeviceSuggestions } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeviceInfo } from "@workspace/api-client-react";
import { useLang } from "../LangContext";
import { translations, LANGUAGES } from "../i18n";
import UsedBuyerPanel from "./UsedBuyerPanel";

export default function Home() {
  const [query, setQuery] = useState("");
  const lookupMutation = useLookupDevice();
  const { data: suggestions, isLoading: isLoadingSuggestions } = useGetDeviceSuggestions();
  const { lang, setLang, dir } = useLang();
  const t = translations[lang];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    lookupMutation.mutate({ data: { query: query.trim(), language: lang } });
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    lookupMutation.mutate({ data: { query: name, language: lang } });
  };

  const isPending = lookupMutation.isPending;
  const result = lookupMutation.data;

  // Re-run search if lang changes and we have a result
  const lastResultLang = useRef(lang);
  useEffect(() => {
    if (lang !== lastResultLang.current && result && query.trim()) {
      lastResultLang.current = lang;
      lookupMutation.mutate({ data: { query: query.trim(), language: lang } });
    }
  }, [lang, result, query, lookupMutation]);

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 space-y-12" dir={dir}>
      {/* Language Switcher */}
      <div className={`flex gap-2 ${dir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${
              lang === l.code 
                ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(0,255,255,0.15)]" 
                : "bg-card/50 text-muted-foreground border-transparent hover:bg-card hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary drop-shadow-[0_0_15px_rgba(0,255,255,0.2)]">
          {t.appTitle}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t.appSubtitle}
        </p>
        
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder} 
            className={`h-14 ${dir === 'rtl' ? 'pl-12 pr-4' : 'pr-12 pl-4'} rounded-xl text-lg bg-card/50 border-primary/30 focus-visible:ring-primary focus-visible:border-primary shadow-inner`}
            data-testid="input-search"
          />
          <Button 
            type="submit" 
            size="icon" 
            className={`absolute top-2 h-10 w-10 rounded-lg hover:bg-primary/90 ${dir === 'rtl' ? 'left-2' : 'right-2'}`}
            disabled={isPending}
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
          </Button>
        </form>

        <div className="pt-2">
          {isLoadingSuggestions ? (
            <div className="flex justify-center gap-2 flex-wrap">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="flex justify-center gap-2 flex-wrap">
              {suggestions.map((s, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="px-3 py-1 cursor-pointer hover:bg-primary/20 transition-colors border-primary/20"
                  onClick={() => handleSuggestionClick(s.name)}
                  data-testid={`badge-suggestion-${i}`}
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {isPending && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}

      {!isPending && result && (
        result.found ? (
          <DeviceResults device={result} />
        ) : (
          <Card className="border-destructive/50 bg-destructive/10 text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.notFound}</h3>
              <p className="text-muted-foreground">{t.notFoundDesc}</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

function DeviceResults({ device }: { device: DeviceInfo }) {
  const [activeTab, setActiveTab] = useState<"info" | "used">("info");
  const { lang, dir } = useLang();
  const t = translations[lang];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-primary/20">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-6 py-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "info" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
          }`}
        >
          <Info className="w-4 h-4" />
          {t.deviceInfoTab}
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={`px-6 py-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "used" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {t.usedBuyerTab}
        </button>
      </div>

      {activeTab === "info" && <DeviceDetails device={device} />}
      {activeTab === "used" && <UsedBuyerPanel device={device} />}
    </div>
  );
}

function DeviceDetails({ device }: { device: DeviceInfo }) {
  const { lang, dir } = useLang();
  const t = translations[lang];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/30 bg-card/60 backdrop-blur overflow-hidden relative shadow-[0_0_30px_rgba(0,255,255,0.05)]">
        <div className={`absolute top-0 w-full h-1 ${dir === 'rtl' ? 'bg-gradient-to-l right-0' : 'bg-gradient-to-r left-0'} from-primary via-primary/50 to-transparent`}></div>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-primary" />
                {device.name}
              </CardTitle>
              <CardDescription className="text-base mt-2 flex items-center gap-2">
                {device.brand && <span className="font-semibold text-primary/80">{device.brand}</span>}
                {device.brand && <span>•</span>}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <History className="w-4 h-4" /> {t.releaseDate}: {device.releaseDate}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <InfoBox icon={<Layers className="w-5 h-5" />} label={t.osUi} value={device.os} />
            <InfoBox icon={<HardDrive className="w-5 h-5" />} label={t.storage} value={device.storage} />
            <InfoBox icon={<Disc className="w-5 h-5" />} label={t.ram} value={device.ram} />
            <InfoBox icon={<Server className="w-5 h-5" />} label={t.latestOfficial} value={device.latestOfficialOs} />
          </div>

          <div className="bg-background/50 rounded-xl p-5 border border-primary/10 mb-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="font-semibold">{t.processor}</span>
                {device.processorName && <span className="text-muted-foreground text-sm ml-2">({device.processorName})</span>}
              </div>
              <span className="font-bold text-primary font-mono" dir="ltr">{device.processorRating}/10</span>
            </div>
            <div className="flex gap-1.5 h-3 w-full" dir="ltr">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm ${i < device.processorRating ? 'bg-primary shadow-[0_0_8px_rgba(0,255,255,0.4)]' : 'bg-primary/10'}`} 
                />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {device.customRoms.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary rounded-full"></span>
                    {t.customRoms}
                  </h3>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {t.latestViaRom}: {device.latestAndroidViaRom}
                  </Badge>
                </div>
                <div className="rounded-xl border border-primary/20 overflow-hidden bg-background/50">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/20 hover:bg-transparent">
                        <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-bold`}>{t.romName}</TableHead>
                        <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-bold`}>{t.androidVersion}</TableHead>
                        <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-bold`}>{t.status}</TableHead>
                        <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-bold`}>{t.developer}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {device.customRoms.map((rom, idx) => (
                        <TableRow key={idx} className="border-primary/10 hover:bg-primary/5">
                          <TableCell className="font-semibold text-foreground/90">{rom.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{rom.androidVersion}</TableCell>
                          <TableCell>
                            <StatusBadge status={rom.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{rom.maintainer || t.unknown}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {device.customRecoveries.length > 0 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-primary rounded-full"></span>
                  {t.customRecoveries}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {device.customRecoveries.map((rec, idx) => (
                    <div key={idx} className="bg-background/50 border border-primary/10 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-lg">{rec.name}</span>
                        <Badge variant={rec.isOfficial ? "default" : "secondary"} className={rec.isOfficial ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                          {rec.isOfficial ? t.officialBadge : t.portBadge}
                        </Badge>
                      </div>
                      {rec.notes && <p className="text-sm text-muted-foreground mt-1">{rec.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {device.notes && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed">
                <span className="font-bold text-primary mb-1 block">{t.additionalNotes}:</span>
                {device.notes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-background/40 border border-primary/10 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
        {icon} <span>{label}</span>
      </div>
      <div className="font-semibold text-foreground/90">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colorClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  const greenStatuses = ["رسمي", "Official", "Officiel", "Resmi"];
  const orangeStatuses = ["غير رسمي", "Unofficial", "Non officiel", "Gayri resmi", "Port"];
  const redStatuses = ["متوقف", "Discontinued", "Abandonné", "Durduruldu"];

  if (greenStatuses.includes(status)) {
    colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  } else if (orangeStatuses.includes(status)) {
    colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  } else if (redStatuses.includes(status)) {
    colorClass = "bg-red-500/20 text-red-400 border-red-500/30";
  }

  return (
    <Badge variant="outline" className={`${colorClass}`}>
      {status}
    </Badge>
  );
}