"use client";

import type { ReactNode } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Progress,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bs-lab/ui";

import { DataTableDemo } from "./data-table-demo";

function ExportHint({ name }: { name: string }) {
  return <p className="mt-2 text-xs text-muted-foreground">Export: <code>{name}</code></p>;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-input bg-card">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function UiDebugPage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">UI Component Debug Playground</h1>
            <p className="text-sm text-muted-foreground">
              Kiểm tra render Tailwind v4 và hành vi tương tác của các atomic components từ <code>@bs-lab/ui</code>.
            </p>
          </header>

          <SectionCard
            title="Action 组"
            description="Button variants/sizes và Toggle state."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <ExportHint name="Button" />

              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="icon-button">
                  +
                </Button>
                <Button disabled>Disabled</Button>
              </div>

              <div className="flex items-center gap-3">
                <Toggle aria-label="toggle-bold">Bold</Toggle>
                <Toggle defaultPressed aria-label="toggle-italic">
                  Italic
                </Toggle>
                <Toggle disabled aria-label="toggle-disabled">
                  Disabled
                </Toggle>
              </div>
              <ExportHint name="Toggle" />
            </div>
          </SectionCard>

          <SectionCard
            title="Forms 组"
            description="Input, Checkbox, Switch, Slider với trạng thái mặc định/disabled/label."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-input p-4">
                <Label htmlFor="ui-debug-input">Email</Label>
                <Input id="ui-debug-input" placeholder="name@example.com" />
                <Input disabled value="disabled@example.com" />
                <ExportHint name="Input" />
              </div>

              <div className="space-y-3 rounded-lg border border-input p-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="accept-term" />
                  <Label htmlFor="accept-term">Đồng ý điều khoản</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="accept-term-disabled" disabled />
                  <Label htmlFor="accept-term-disabled" className="text-muted-foreground">
                    Checkbox disabled
                  </Label>
                </div>
                <ExportHint name="Checkbox" />
              </div>

              <div className="space-y-3 rounded-lg border border-input p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="switch-default" className="leading-none">
                    Thông báo email
                  </Label>
                  <Switch id="switch-default" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="switch-sm" className="leading-none">
                    sm（行内）
                  </Label>
                  <Switch id="switch-sm" size="sm" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="switch-disabled" className="leading-none text-muted-foreground">
                    Switch disabled
                  </Label>
                  <Switch id="switch-disabled" disabled />
                </div>
                <ExportHint name="Switch" />
              </div>

              <div className="space-y-3 rounded-lg border border-input p-4">
                <Label>Volume</Label>
                <Slider defaultValue={[40]} max={100} step={1} />
                <Slider defaultValue={[70]} max={100} step={1} disabled />
                <ExportHint name="Slider" />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Data 组"
            description="Badge màu sắc, Progress, Avatar và Skeleton animation."
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <ExportHint name="Badge" />

              <div className="space-y-2 rounded-lg border border-input p-4">
                <Progress value={25} />
                <Progress value={65} />
                <Progress value={90} />
                <ExportHint name="Progress" />
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-input p-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="avatar" />
                  <AvatarFallback>BS</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>UI</AvatarFallback>
                </Avatar>
              </div>
              <ExportHint name="Avatar" />

              <div className="space-y-2 rounded-lg border border-input p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
              <ExportHint name="Skeleton" />
            </div>
          </SectionCard>

          <SectionCard
            title="Layout 组"
            description="Card container effect và Tabs switching."
          >
            <div className="space-y-5">
              <Card className="border-input">
                <CardHeader>
                  <CardTitle>Sample Card</CardTitle>
                  <CardDescription>Card dùng để xác nhận lớp màu nền/viền/chữ.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nội dung mô phỏng để kiểm tra spacing và typography.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    Action
                  </Button>
                </CardFooter>
              </Card>
              <ExportHint name="Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription" />

              <Tabs defaultValue="tab1" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="rounded-lg border border-input p-4">
                  Nội dung Tab 1
                </TabsContent>
                <TabsContent value="tab2" className="rounded-lg border border-input p-4">
                  Nội dung Tab 2
                </TabsContent>
                <TabsContent value="tab3" className="rounded-lg border border-input p-4">
                  Nội dung Tab 3
                </TabsContent>
              </Tabs>
              <ExportHint name="Tabs, TabsList, TabsTrigger, TabsContent" />
            </div>
          </SectionCard>

          <SectionCard
            title="DataTable（实验课纲管理）"
            description="基于 @tanstack/react-table 的 DataTable：排序、分页、列显隐、行选与客户端筛选；组件来自 @bs-lab/ui。"
          >
            <DataTableDemo />
            <ExportHint name="DataTable, DataTableColumnHeader, DataTablePagination, DataTableViewOptions + useReactTable" />
          </SectionCard>

          <SectionCard
            title="Overlay 组"
            description="Tooltip hover và Sheet drawer trigger."
          >
            <div className="flex flex-wrap items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tooltip content từ @bs-lab/ui</p>
                </TooltipContent>
              </Tooltip>
              <ExportHint name="Tooltip, TooltipTrigger, TooltipContent, TooltipProvider" />

              <Sheet>
                <SheetTrigger asChild>
                  <Button>Open sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Sheet Title</SheetTitle>
                    <SheetDescription>Drawer content để kiểm tra overlay và animation.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 rounded-md border border-input p-3 text-sm text-muted-foreground">
                    Nội dung demo trong Sheet.
                  </div>
                </SheetContent>
              </Sheet>
              <ExportHint name="Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription" />
            </div>
          </SectionCard>
        </div>
      </main>
    </TooltipProvider>
  );
}
