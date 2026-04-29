"use client";

import * as React from "react";
import { Button, ButtonGroup, SonnerToaster, Toaster, TooltipProvider } from "@bs-lab/ui";

import { cn } from "@/lib/utils";
import { getLabCustomPropsDoc } from "./living-docs";
import {
  type DateRangePickerValue,
  PropsDocBlock,
  ShowcaseBlock,
  UI_LAB_NAV_LINKS,
  UI_LAB_SECTIONS,
  type UiLabContext,
} from "./registry";

function LabSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 flex min-h-fit flex-col gap-8 border-b border-border py-10 last:border-b-0"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="flex min-h-fit flex-col gap-8 rounded-xl border border-input bg-card/40 p-5 shadow-xs sm:p-6">
        {children}
      </div>
    </section>
  );
}

function useLabDocumentTheme() {
  const [mode, setMode] = React.useState<"light" | "dark" | "system">("system");
  const [resolved, setResolved] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("ui-lab-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
    }
  }, []);

  React.useLayoutEffect(() => {
    const root = document.documentElement;

    const computeResolved = (): "light" | "dark" => {
      if (mode === "light") return "light";
      if (mode === "dark") return "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const apply = () => {
      const next = computeResolved();
      setResolved(next);
      root.classList.toggle("dark", next === "dark");
    };

    apply();
    window.localStorage.setItem("ui-lab-theme", mode);

    if (mode !== "system") {
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return { mode, setMode, resolved };
}

function ThemeSwitcher({
  mode,
  setMode,
}: {
  mode: "light" | "dark" | "system";
  setMode: (m: "light" | "dark" | "system") => void;
}) {
  return (
    <ButtonGroup className="w-full sm:w-auto">
      <Button
        type="button"
        size="sm"
        variant={mode === "light" ? "secondary" : "outline"}
        onClick={() => setMode("light")}
      >
        浅色
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "dark" ? "secondary" : "outline"}
        onClick={() => setMode("dark")}
      >
        深色
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "system" ? "secondary" : "outline"}
        onClick={() => setMode("system")}
      >
        系统
      </Button>
    </ButtonGroup>
  );
}

function UiComponentLabInner() {
  const { mode: themeMode, setMode: setThemeMode, resolved: resolvedAppearance } =
    useLabDocumentTheme();

  const [comboValue, setComboValue] = React.useState<string | undefined>("electro");
  const [range, setRange] = React.useState<DateRangePickerValue>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 3, 12),
  });
  const [calDate, setCalDate] = React.useState<Date | undefined>(new Date(2026, 3, 11));
  const [selectValue, setSelectValue] = React.useState("banana");
  const [radioValue, setRadioValue] = React.useState("plan-b");
  const [page, setPage] = React.useState(2);
  const [tabSwUnderline, setTabSwUnderline] = React.useState("feed");
  const [tabSwPill, setTabSwPill] = React.useState("pill-b");
  const [tabSwSidebar, setTabSwSidebar] = React.useState("nav-a");

  const labCtx = React.useMemo<UiLabContext>(
    () => ({
      comboValue,
      setComboValue,
      range,
      setRange,
      calDate,
      setCalDate,
      selectValue,
      setSelectValue,
      radioValue,
      setRadioValue,
      page,
      setPage,
      tabSwUnderline,
      setTabSwUnderline,
      tabSwPill,
      setTabSwPill,
      tabSwSidebar,
      setTabSwSidebar,
    }),
    [
      comboValue,
      range,
      calDate,
      selectValue,
      radioValue,
      page,
      tabSwUnderline,
      tabSwPill,
      tabSwSidebar,
    ],
  );

  return (
    <TooltipProvider>
      <Toaster />
      <SonnerToaster
        theme={resolvedAppearance}
        position="top-center"
        richColors
        closeButton
      />

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 py-3 2xl:max-w-[1600px] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <h1 className="truncate text-lg font-semibold sm:text-xl">UI Component Lab</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Living Styleguide：视觉预览 +{" "}
                <span className="text-foreground">props 速查</span>
                （各块下方列表）· 消费{" "}
                <code className="text-foreground">@bs-lab/ui</code>
              </p>
            </div>
            <ThemeSwitcher mode={themeMode} setMode={setThemeMode} />
          </div>
          <nav
            className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden"
            aria-label="章节"
          >
            {UI_LAB_NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-md border border-transparent bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] 2xl:max-w-[1600px]">
          <aside className="sticky top-16 hidden max-h-[calc(100dvh-4rem)] w-56 shrink-0 self-start overflow-y-auto border-r border-border bg-card/30 px-3 py-6 lg:block xl:w-60">
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              目录
            </p>
            <nav className="flex flex-col gap-0.5 text-sm" aria-label="侧栏导航">
              {UI_LAB_NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 space-y-0 px-6 py-8">
            {UI_LAB_SECTIONS.map((section) => (
              <LabSection
                key={section.id}
                id={section.id}
                title={section.title}
                description={section.description}
              >
                <div
                  className={cn(
                    "flex min-h-fit flex-col",
                    section.stackClassName ?? "gap-8",
                  )}
                >
                  {section.items.map((item) => {
                    if (item.kind === "showcase") {
                      return <ShowcaseBlock key={item.name} name={item.name} />;
                    }
                    const customDoc = getLabCustomPropsDoc(item.id);
                    return (
                      <div key={item.id} className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        {customDoc ? <PropsDocBlock text={customDoc} /> : null}
                        {item.render(labCtx)}
                      </div>
                    );
                  })}
                </div>
              </LabSection>
            ))}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function AllComponentsLabPage() {
  return <UiComponentLabInner />;
}
