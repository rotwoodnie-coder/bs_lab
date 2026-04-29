/**
 * Living Styleguide：与各展示块 id / 组件名对应的 props 速查文案。
 * 修改 @bs-lab/ui 或业务封装组件 API 时，请同步更新本文件与 registry 中的。
 */
export const LAB_SHOWCASE_PROPS = {
  Button: `variant: default | destructive | success | warning | outline | secondary | ghost | link
size: default | sm | lg | icon | icon-sm | icon-lg
asChild: boolean，配合子元素继承按钮样式（Radix Slot）
其余：原生 button 属性（type、disabled、onClick 等）`,

  ButtonGroup: `orientation: horizontal | vertical（布局轴向）
子级：Button、ButtonGroupSeparator、ButtonGroupText 等组合使用
其余：div 容器属性`,

  Kbd: `Kbd：原生元素属性；用于单键展示
KbdGroup：容器 className，包裹多枚按键或符号`,

  Badge: `variant: default | secondary | destructive | outline | success | warning | science | management
asChild: boolean（Slot 模式）
其余：span 属性`,

  Spinner: `className：控制尺寸（如 size-5）
无业务状态，纯展示加载动效`,

  StatusPulse: `variant: success | warning | error（配色绑定主题 chart token）
sizePx: number，脉搏外圈基准像素，默认 10
className：外层 span`,

  VideoPreviewCard: `title?、caption?、streamSrc?、unreachable?
无地址时与 VideoManagerField 同源的空态 MediaEmptyFrame；有地址时为带 controls 的 MediaPreview`,

  MediaEmptyFrame: `kind(image|video)、hint、description?、emphasize?（置于 group 按钮内时开启 hover/focus 环）
className?；系统统一「占位图」语义（底纹 SVG + 图标），禁止页面自建灰块`,

  MediaPreview: `kind(image|video)、src、className?、alt?、onImageError?（图片加载失败回调，业务可回退紧凑列表避免裂图）
video：未传 variant 或 variant=hover-play 时走懒加载悬停预览（列表/网格默认）；variant=default 时立即挂载带控件播放器（表单确认、弹层完整预览、轮播主画面等）
videoRef?、videoProps?：仅 variant=default 的 video；若需隐藏控件请传 videoProps.controls=false
posterSrc?、posterNode?、onPosterClick?、previewMaxSeconds?（默认 5）：仅悬停预览模式
inViewRootMargin?、inViewThreshold?（悬停预览与 deferVideoMount 共用 IO；悬停默认 threshold=0.1）
deferVideoMount?：variant=default 且 kind=video 时仅在进入视口后挂载 video，长列表降内存
imageLoading?：kind=image 时 img loading，默认 lazy
图片默认 object-contain + bg-background；缩略图铺满传 className 含 object-cover`,

  Progress: `value: number | null（0–100，null 为不确定进度）
其余：Radix Progress.Root 转发属性`,

  Skeleton: `className：控制宽高与圆角
用于占位闪烁块`,

  Table: `Table / TableHeader / TableBody / TableRow / TableHead / TableCell：表格结构组件，样式由 @bs-lab/ui 统一
其余：对应 HTML 表格元素属性`,

  Avatar: `AvatarImage：src、alt 等 img 属性
AvatarFallback：延迟加载失败时的占位`,

  Card: `Card、CardHeader、CardTitle、CardDescription、CardContent、CardFooter：组合布局，无额外魔法 props`,

  Tabs: `Tabs defaultValue / value / onValueChange
TabsList、TabsTrigger value、TabsContent value：与 Radix Tabs 一致
TabsList 默认 min-h-12；TabsTrigger 默认 min-h-11（触控 44px+）`,

  CommandDialog: `继承 Dialog 根 props；title、description、className、showCloseButton
paletteChrome?: portal | management（双模边框与光晕，内置拼接）
子级：CommandInput、CommandList、CommandGroup、CommandItem …；列表项默认 min-h-11`,

  Accordion: `type: single | multiple，collapsible，defaultValue
AccordionItem value、AccordionTrigger、AccordionContent：Radix Accordion`,

  Alert: `variant: default | destructive
子级：AlertTitle、AlertDescription`,

  Breadcrumb: `BreadcrumbList、BreadcrumbItem、BreadcrumbLink、BreadcrumbPage、BreadcrumbSeparator 组合使用
链接使用 href 或 asChild`,

} as const;

export type LabShowcasePropsKey = keyof typeof LAB_SHOWCASE_PROPS;

export const LAB_CUSTOM_PROPS = {
  "input-textarea": `Input：placeholder、disabled、原生 input 属性
Textarea：rows、placeholder、disabled 等原生 textarea 属性`,

  "checkbox-radio": `Checkbox：checked / defaultChecked、onCheckedChange、disabled；checked 支持三态（含 indeterminate，用于父子联动半选）
RadioGroup：value、onValueChange；RadioGroupItem：value`,

  select: `Select：value、onValueChange（受控）
SelectTrigger / SelectContent / SelectItem：与 Radix Select 一致`,

  "media-field": `MediaField：kind(image|video)、value、onChange（受控）
disabled?、emptyText?、allowManualUrl?、className?
支持上传文件后的可视化预览、手动链接输入与清除
推荐场景：轻量表单、仅需“本地上传/手动链接”的页面
不推荐场景：需要媒体库复用、资产统一管理、跨页面一致策略`,

  "media-manager-field": `VideoManagerField / ImageManagerField：value、onChange（受控）
disabled?、className?、emptyText?、emptyDescription?（空态说明）
空态：MediaEmptyFrame 在比例框内水平垂直居中（图标 + 主文案）；操作区紧贴占位框下方、间距压缩（gap-1）
按钮单行顺序：上传 → 从媒体库选择 → 清除（无预览 URL 时清除禁用）
有值时：视频带 controls 的 MediaPreview，图片等比 contained；MediaPreview 图片支持 onImageError 供业务回退
onUploadFile?(file)、onOpenLibrary?、libraryPicker?（媒体库弹层挂载）
uploadLabel?、pickLabel?、clearLabel?
推荐场景：凡接媒体库的业务字段（团队唯一推荐）
禁止：业务页自绘灰色空块或散落的原生 file input；仅在明确不接媒体库时退回 MediaField`,

  "rich-media-editor": `RichMediaEditor：value={ text, embeds[] }、onChange（受控）
embeds[]: { id, kind(image|video), src, caption? }
onUploadMedia?(kind, file, ctx?) => { src, caption? } | null；ctx?.onProgress 可接字节进度（loaded/total/percent）
上传中展示进度条与「发往应用服务器 / 本地与 MinIO」说明；disabled?、placeholder?、textRows?、className?
能力：文本编辑 + 插入图片/视频 + 内联预览 + 每条媒体删除 + 可选说明`,

  "switch-slider": `Switch：checked / defaultChecked、onCheckedChange、disabled；size 三档 lg（w-14 h-8、thumb 6、开态纯色 primary）/ md 默认（w-11 h-6、thumb 4）/ sm（w-8 h-4.5、thumb 3.5，行内紧凑）；拇指 spring（500/30）+ 开态 scale 1.1；关 muted / 开 primary
Slider：value / defaultValue、max、min、step、disabled`,

  "scroll-area-top-edge": `ScrollAreaWithTopEdge：在 ScrollArea 外包一层，向下滚动后顶部显示渐变 + 内阴影提示
className：外层容器（常设固定高度）
fadeFromClassName?：渐变起点色（默认 from-background/95）
其余：与 ScrollArea 根相同（children 等为滚动内容）`,

  combobox: `options: { value, label, group? }[]
value、onValueChange、placeholder、triggerClassName 等（见 Combobox 类型）
allowCustomValue：允许“先搜索再新增”；customValuePrefix：新增项前缀文案
normalizeCustomValue：新增前归一化输入；onCreateOption：创建新值回调`,

  "calendar-range": `Calendar：mode、selected、onSelect（单选示意）
DateRangePicker：date、onDateChange、numberOfMonths 等`,

  "toast-radix": `页面需挂载 Toaster；业务侧调用 useToast().toast({ title, description, variant? })`,

  sonner: `页面需挂载 SonnerToaster；调用 sonnerToast.success / message 等`,

  "dashboard-command-chrome": `DashboardPaletteChrome：portal | management
dashboardCommandPaletteDialogContentClassName(mode)
dashboardCommandSearchFieldClassName(mode)（min-h-11、rounded-full 顶栏触发器）、dashboardCommandSearchIconFieldClassName(mode)（size-11、rounded-full）
与 CommandDialog.paletteChrome 对齐`,

  "lab-bento-card": `BentoCard：staggerIndex?（与父级 stagger 容器配合的入场次序）
footer?（底部分区，与正文间自动顶部分隔线；传入时卡片为纵向 flex、h-auto，无固定 min-height，避免正文与标签重叠；在等高栅格内可给卡片加 className:h-full）
默认内边距 p-6；footer 与正文间距 mt-5
variants?（传入则覆盖内置 hidden/show 动画）
其余：framer-motion HTMLMotionProps<"div">、className、children
BentoCardSocialActions：viewsCount?、likesCount?、commentsCount?、onLikeClick?、onCommentClick?、onBookmarkClick?、className?（阅读/点赞/评论/收藏行；viewsCount 不传则不显示阅读量，纯展示+可选回调）`,

  "lab-stat-metric": `StatMetric：value（目标数字）、durationMs?（默认 900，0 则无动画）
decimals?、viewMode?: portal | management（字重与观感）
className?、suffix?、prefix?`,

  "lab-safety-guard": `SafetyGuard：open、onOpenChange（受控显隐）
title、description?、children（可滚动正文）
acknowledgeId、acknowledgeLabel、acknowledgeChecked、onAcknowledgeChange（须勾选才可确认）
onConfirm、confirmLabel?、cancelLabel?、confirmDisabled?
z-[60] 全屏；遮罩为 bg-overlay + backdrop-blur；AlertDialog 语义下点击遮罩不会关闭，仅取消/确认流程结束可关`,

  "simulation-player-skeleton": `以下为业务组件 SimulationPlayer 在 iframe 未就绪时的占位结构示意。
SimulationPlayer：experimentId、title、embedSrc、className、onTelemetry?`,

  "data-table": `DataTable 及列定义、分页、排序等与 @bs-lab/ui/react-table 联用，详见 data-table-demo 源码
showRowNumber?: boolean（是否显示序号列）
rowNumberHeader?: ReactNode（序号列表头，默认“序号”）
rowNumberMode?: global | page（global=跨页连续，page=每页从 1 开始）
stickyHeader?: boolean（可滚动容器中表头吸顶）
onRowClick?: (row) => void（点击整行触发回调，用于打开详情 Sheet）
onRowDoubleClick?: (row) => void（双击行触发回调，用于打开详情页）
表头吸顶需在外层容器设置 overflow-auto，并开启 stickyHeader`,

  "tab-sw-underline": `TabSwitcher：variant、activeId、onChange、items、layoutIdPrefix（多实例时勿重复）`,

  "tab-sw-pill": `同上 TabSwitcher，variant=pill`,

  "tab-sw-sidebar": `同上 TabSwitcher，variant=sidebar`,

  overlays: `Dialog / Drawer / Sheet / Popover / Tooltip：均为受控或 Trigger + Content 模式，props 遵循 Radix 封装层`,

  pagination: `PaginationLink isActive、href；受控示例用 onClick preventDefault 改写页码`,

} as const;

export type LabCustomPropsId = keyof typeof LAB_CUSTOM_PROPS;

export function getLabCustomPropsDoc(id: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(LAB_CUSTOM_PROPS, id)
    ? LAB_CUSTOM_PROPS[id as LabCustomPropsId]
    : undefined;
}
