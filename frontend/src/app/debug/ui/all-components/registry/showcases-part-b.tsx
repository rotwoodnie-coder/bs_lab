"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./lab-ui";
import type { ShowcaseDef } from "../lab-types";
import { LAB_SHOWCASE_PROPS } from "../living-docs";
import { ALERT_VARIANTS } from "./lab-constants";
import { LabCommandDialogDemo } from "./lab-demos";

export const SHOWCASES_PART_B = {
  Progress: {
    label: "Progress",
    propsDoc: LAB_SHOWCASE_PROPS.Progress,
    rowClassName: "space-y-2",
    presets: [
      { key: "a", render: () => <Progress value={33} /> },
      { key: "b", render: () => <Progress value={66} /> },
    ],
  },

  Skeleton: {
    label: "Skeleton",
    propsDoc: LAB_SHOWCASE_PROPS.Skeleton,
    rowClassName: "space-y-2",
    presets: [
      { key: "line-1", render: () => <Skeleton className="h-4 w-2/3 max-w-md" /> },
      { key: "line-2", render: () => <Skeleton className="h-4 w-1/2 max-w-sm" /> },
      { key: "block", render: () => <Skeleton className="h-24 w-full max-w-lg" /> },
    ],
  },

  Table: {
    label: "Table",
    propsDoc: LAB_SHOWCASE_PROPS.Table,
    rowClassName: "overflow-x-auto",
    presets: [
      {
        key: "demo",
        render: () => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>年级</TableHead>
                <TableHead className="text-right">课时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>力学</TableCell>
                <TableCell>高一</TableCell>
                <TableCell className="text-right">12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>电磁学</TableCell>
                <TableCell>高二</TableCell>
                <TableCell className="text-right">10</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ),
      },
    ],
  },

  Avatar: {
    label: "Avatar",
    propsDoc: LAB_SHOWCASE_PROPS.Avatar,
    rowClassName: "flex flex-wrap items-center gap-4",
    presets: [
      {
        key: "image",
        render: () => (
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="avatar" />
            <AvatarFallback>BS</AvatarFallback>
          </Avatar>
        ),
      },
      {
        key: "fallback",
        render: () => (
          <Avatar>
            <AvatarFallback className="bg-muted">Lab</AvatarFallback>
          </Avatar>
        ),
      },
    ],
  },

  Card: {
    label: "Card",
    propsDoc: LAB_SHOWCASE_PROPS.Card,
    rowClassName: "max-w-lg",
    presets: [
      {
        key: "default",
        render: () => (
          <Card className="border-input">
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>用于内容分块与层级展示。</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">卡片正文区域。</p>
            </CardContent>
            <CardFooter>
              <Button type="button" size="sm" variant="outline">
                次要操作
              </Button>
            </CardFooter>
          </Card>
        ),
      },
    ],
  },

  Tabs: {
    label: "Tabs",
    propsDoc: LAB_SHOWCASE_PROPS.Tabs,
    rowClassName: "w-full",
    presets: [
      {
        key: "default",
        render: () => (
          <Tabs defaultValue="t1">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
              <TabsTrigger value="t1">概览</TabsTrigger>
              <TabsTrigger value="t2">实验</TabsTrigger>
              <TabsTrigger value="t3">记录</TabsTrigger>
            </TabsList>
            <TabsContent value="t1" className="rounded-lg border border-input p-4 text-sm">
              Tabs 内容一
            </TabsContent>
            <TabsContent value="t2" className="rounded-lg border border-input p-4 text-sm">
              Tabs 内容二
            </TabsContent>
            <TabsContent value="t3" className="rounded-lg border border-input p-4 text-sm">
              Tabs 内容三
            </TabsContent>
          </Tabs>
        ),
      },
    ],
  },

  Accordion: {
    label: "Accordion",
    propsDoc: LAB_SHOWCASE_PROPS.Accordion,
    rowClassName: "w-full",
    presets: [
      {
        key: "default",
        render: () => (
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Accordion 第一项</AccordionTrigger>
              <AccordionContent>可折叠说明正文。</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Accordion 第二项</AccordionTrigger>
              <AccordionContent>更多占位内容。</AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
    ],
  },

  Alert: {
    label: "Alert",
    propsDoc: LAB_SHOWCASE_PROPS.Alert,
    rowClassName: "grid gap-4 md:grid-cols-2",
    presets: ALERT_VARIANTS.map((variant) => ({
      key: variant,
      render: () => (
        <Alert variant={variant}>
          <AlertTitle>{variant === "destructive" ? "Destructive" : "Alert"}</AlertTitle>
          <AlertDescription>
            {variant === "destructive"
              ? "错误或不满足前置条件时的提醒样式。"
              : "默认边框与前景色，用于页内说明。"}
          </AlertDescription>
        </Alert>
      ),
    })),
  },

  Breadcrumb: {
    label: "Breadcrumb",
    propsDoc: LAB_SHOWCASE_PROPS.Breadcrumb,
    presets: [
      {
        key: "default",
        render: () => (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">实验平台</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">课纲</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>力学</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ),
      },
    ],
  },

  CommandDialog: {
    label: "CommandDialog",
    propsDoc: LAB_SHOWCASE_PROPS.CommandDialog,
    rowClassName: "w-full max-w-xl",
    presets: [
      {
        key: "palette-chrome",
        render: () => <LabCommandDialogDemo />,
      },
    ],
  },
} satisfies Record<string, ShowcaseDef>;
