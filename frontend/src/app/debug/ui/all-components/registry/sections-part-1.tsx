"use client";

import {
  Checkbox,
  Combobox,
  ImageManagerField,
  Input,
  Label,
  MediaField,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
  VideoManagerField,
} from "./lab-ui";
import type { LabSectionConfig, UiLabContext } from "../lab-types";
import { COMBOBOX_OPTIONS } from "./lab-constants";
import { LabScrollAreaTopEdgeDemo } from "./lab-demos";

export function getUiLabSectionsPart1(): LabSectionConfig[] {
  return [
    {
      id: "section-basics",
      title: "基础交互",
      description: "按钮组合、键盘提示、徽标与加载指示。",
      stackClassName: "space-y-8",
      items: [
        { kind: "showcase", name: "Button" },
        { kind: "showcase", name: "ButtonGroup" },
        { kind: "showcase", name: "Kbd" },
        { kind: "showcase", name: "Badge" },
        { kind: "showcase", name: "Spinner" },
      ],
    },
    {
      id: "section-forms",
      title: "表单录入",
      description: "输入、选择与开关；Combobox 使用受控状态模拟检索选择。",
      stackClassName: "space-y-8",
      items: [
        {
          kind: "custom",
          id: "input-textarea",
          label: "Input / Textarea",
          render: () => (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lab-input">Input</Label>
                <Input id="lab-input" placeholder="邮箱或学号" />
                <Input disabled placeholder="disabled" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lab-textarea">Textarea</Label>
                <Textarea id="lab-textarea" placeholder="多行说明" rows={3} />
              </div>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "checkbox-radio",
          label: "Checkbox / RadioGroup",
          render: (ctx: UiLabContext) => (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label>Checkbox</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="c1" defaultChecked />
                  <Label htmlFor="c1">已开通通知</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="c2" disabled />
                  <Label htmlFor="c2" className="text-muted-foreground">
                    禁用
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="c3" checked={"indeterminate"} />
                  <Label htmlFor="c3">半选（父子联动示意）</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>RadioGroup</Label>
                <RadioGroup
                  value={ctx.radioValue}
                  onValueChange={ctx.setRadioValue}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="plan-a" id="ra" />
                    <Label htmlFor="ra">方案 A</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="plan-b" id="rb" />
                    <Label htmlFor="rb">方案 B</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "select",
          label: "Select",
          render: (ctx: UiLabContext) => (
            <div className="space-y-2">
              <Label htmlFor="lab-select">Select</Label>
              <Select value={ctx.selectValue} onValueChange={ctx.setSelectValue}>
                <SelectTrigger id="lab-select" className="w-full md:w-[240px]">
                  <SelectValue placeholder="选择水果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apple">苹果</SelectItem>
                  <SelectItem value="banana">香蕉</SelectItem>
                  <SelectItem value="orange">橙子</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "switch-slider",
          label: "Switch / Slider",
          render: () => (
            <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 md:flex-row md:border-t-0 md:pt-0">
              <div className="flex flex-col gap-2 rounded-lg border border-input p-4">
                <p className="text-xs text-muted-foreground">
                  L/M/S 三档轨道与拇指；拇指 spring 位移动画，开态略放大；lg/md 开态均为纯色 primary（无渐变）。与 Label 组合请用{" "}
                  <code className="rounded bg-muted px-1 py-0.5">items-center</code> +{" "}
                  <code className="rounded bg-muted px-1 py-0.5">leading-none</code> 保证中线对齐。
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="sw-lg" className="leading-none">
                      lg
                    </Label>
                    <Switch id="sw-lg" size="lg" defaultChecked />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="sw-md" className="leading-none">
                      md（默认）
                    </Label>
                    <Switch id="sw-md" defaultChecked />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="sw-sm" className="leading-none">
                      sm
                    </Label>
                    <Switch id="sw-sm" size="sm" defaultChecked />
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 rounded-lg border border-input p-4 md:max-w-md">
                <Label>Slider</Label>
                <Slider defaultValue={[35]} max={100} step={1} />
                <Slider defaultValue={[60]} max={100} disabled />
              </div>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "combobox",
          label: "Combobox（受控）",
          render: (ctx: UiLabContext) => (
            <div className="space-y-2">
              <Combobox
                options={[...COMBOBOX_OPTIONS]}
                value={ctx.comboValue}
                onValueChange={ctx.setComboValue}
                placeholder="选择课题…"
                allowCustomValue
                customValuePrefix="新增课题："
                triggerClassName="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                当前 value：
                <code className="text-foreground">{ctx.comboValue ?? "—"}</code>
              </p>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "media-manager-field",
          label: "VideoManagerField / ImageManagerField（默认推荐）",
          render: () => (
            <div className="space-y-3">
              <div className="rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-foreground">
                推荐：业务主链路统一使用（上传 + 媒体库选择 + 历史复用）
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>统一图片管理</Label>
                  <ImageManagerField
                    value="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
                    onChange={() => {}}
                  />
                </div>
                <div className="space-y-2">
                  <Label>统一视频管理</Label>
                  <VideoManagerField
                    value="https://www.w3schools.com/html/mov_bbb.mp4"
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>
          ),
        },
        { kind: "showcase", name: "MediaEmptyFrame" },
        { kind: "showcase", name: "MediaPreview" },
        { kind: "showcase", name: "VideoPreviewCard" },
        {
          kind: "custom",
          id: "media-field",
          label: "MediaField（兼容场景）",
          render: () => (
            <div className="space-y-3">
              <div className="rounded-md border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-foreground">
                仅在不接媒体库的轻量页面使用；新业务默认不要首选这个控件
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>图片</Label>
                  <MediaField
                    kind="image"
                    value="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
                    onChange={() => {}}
                  />
                </div>
                <div className="space-y-2">
                  <Label>视频</Label>
                  <MediaField
                    kind="video"
                    value="https://www.w3schools.com/html/mov_bbb.mp4"
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "media-usage-policy",
          label: "媒体控件选型规则",
          render: () => (
            <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>1. 默认优先：VideoManagerField / ImageManagerField</p>
              <p>2. 仅兼容场景：MediaField（本地上传或手动链接）</p>
              <p>3. 涉及统一媒体管理的页面禁止回退到 MediaField</p>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "scroll-area-top-edge",
          label: "ScrollAreaWithTopEdge",
          render: () => <LabScrollAreaTopEdgeDemo />,
        },
      ],
    },
  ];
}
