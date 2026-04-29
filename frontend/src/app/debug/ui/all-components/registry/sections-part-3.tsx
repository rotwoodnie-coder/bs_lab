"use client";

import { Bookmark, FlaskConical, Home, LayoutList, Sparkles } from "./lab-ui";
import { TabSwitcher } from "./lab-ui";
import type { LabSectionConfig, UiLabContext } from "../lab-types";

import { DataTableDemo } from "../../data-table-demo";

export function getUiLabSectionsPart3(): LabSectionConfig[] {
  return [
    {
      id: "section-data",
      title: "数据展示",
      description: "表格、DataTable 示例、头像、卡片、选项卡与折叠面板。",
      stackClassName: "space-y-10",
      items: [
        { kind: "showcase", name: "Table" },
        {
          kind: "custom",
          id: "data-table",
          label: "DataTable（示例：序号列）",
          render: () => (
            <div className="overflow-x-auto">
              <DataTableDemo />
            </div>
          ),
        },
        { kind: "showcase", name: "Avatar" },
        { kind: "showcase", name: "Card" },
        { kind: "showcase", name: "Tabs" },
        { kind: "showcase", name: "Accordion" },
      ],
    },
    {
      id: "section-tab-switcher",
      title: "TabSwitcher",
      description: "脱敏自 Lab Demo：下划线 / 胶囊 / 侧栏样式；图标由 ReactNode 注入。",
      stackClassName: "space-y-10",
      items: [
        {
          kind: "custom",
          id: "tab-sw-underline",
          label: "underline",
          render: (ctx: UiLabContext) => (
            <TabSwitcher
              variant="underline"
              activeId={ctx.tabSwUnderline}
              onChange={ctx.setTabSwUnderline}
              layoutIdPrefix="ui-lab-underline"
              items={[
                {
                  id: "feed",
                  label: "推荐流",
                  icon: <Home />,
                  badge: 2,
                },
                {
                  id: "lab",
                  label: "实验",
                  icon: <FlaskConical />,
                },
                {
                  id: "saved",
                  label: "收藏",
                  icon: <Bookmark />,
                  badge: 12,
                },
              ]}
            />
          ),
        },
        {
          kind: "custom",
          id: "tab-sw-pill",
          label: "pill",
          render: (ctx: UiLabContext) => (
            <TabSwitcher
              variant="pill"
              activeId={ctx.tabSwPill}
              onChange={ctx.setTabSwPill}
              layoutIdPrefix="ui-lab-pill"
              items={[
                { id: "pill-a", label: "列表", icon: <LayoutList /> },
                { id: "pill-b", label: "灵感", icon: <Sparkles /> },
                { id: "pill-c", label: "实验", icon: <FlaskConical /> },
              ]}
            />
          ),
        },
        {
          kind: "custom",
          id: "tab-sw-sidebar",
          label: "sidebar",
          render: (ctx: UiLabContext) => (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
              <div className="rounded-xl border border-border bg-card/60 p-2">
                <TabSwitcher
                  variant="sidebar"
                  activeId={ctx.tabSwSidebar}
                  onChange={ctx.setTabSwSidebar}
                  layoutIdPrefix="ui-lab-sidebar"
                  items={[
                    { id: "nav-a", label: "工作台", icon: <Home /> },
                    { id: "nav-b", label: "实验库", icon: <FlaskConical />, badge: 3 },
                    { id: "nav-c", label: "收藏夹", icon: <Bookmark /> },
                  ]}
                />
              </div>
              <p className="text-sm text-muted-foreground lg:pt-8">
                同一页多个 TabSwitcher 时请设置不同的{" "}
                <code className="text-foreground">layoutIdPrefix</code>，避免 framer-motion
                指示条动画串台。
              </p>
            </div>
          ),
        },
      ],
    },
  ];
}
