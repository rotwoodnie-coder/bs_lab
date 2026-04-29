/**
 * Radix UI 根组件 Props 类型转发，供业务扩展包装时无需直接依赖 @radix-ui/*。
 * @author Leixm
 */
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ToastPrimitives from "@radix-ui/react-toast";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";

/** Dialog */
export type DialogRootProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
export type DialogPortalProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>;
export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
export type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;
export type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;
export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

/** Sheet 触发器与 Dialog 共用 Trigger 原语 */
export type SheetTriggerProps = DialogTriggerProps;

/** Alert Dialog */
export type AlertDialogRootProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Root
>;
export type AlertDialogTriggerProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Trigger
>;
export type AlertDialogPortalProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Portal
>;
export type AlertDialogOverlayProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Overlay
>;
export type AlertDialogContentProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Content
>;
export type AlertDialogTitleProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Title
>;
export type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Description
>;
export type AlertDialogActionProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Action
>;
export type AlertDialogCancelProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Cancel
>;

/** Popover */
export type PopoverRootProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>;
export type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Trigger
>;
export type PopoverContentProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;
export type PopoverAnchorProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>;

/** Dropdown Menu */
export type DropdownMenuRootProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Root
>;
export type DropdownMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Trigger
>;
export type DropdownMenuContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;
export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
>;
export type DropdownMenuCheckboxItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>;
export type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioItem
>;
export type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Label
>;
export type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
>;
export type DropdownMenuGroupProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Group
>;
export type DropdownMenuSubProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>;
export type DropdownMenuSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubTrigger
>;
export type DropdownMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubContent
>;

/** Select */
export type SelectRootProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;
export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;
export type SelectValueProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;
export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;
export type SelectSeparatorProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Separator
>;
export type SelectGroupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;

/** Tabs */
export type TabsRootProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
export type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
export type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
export type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

/** Accordion */
export type AccordionRootProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;
export type AccordionTriggerProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
>;
export type AccordionContentProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
>;

/** Tooltip */
export type TooltipProviderProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Provider
>;
export type TooltipRootProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;
export type TooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>;
export type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

/** Hover Card */
export type HoverCardRootProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>;
export type HoverCardTriggerProps = React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Trigger
>;
export type HoverCardContentProps = React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Content
>;

/** Context Menu */
export type ContextMenuRootProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Root
>;
export type ContextMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Trigger
>;
export type ContextMenuContentProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Content
>;
export type ContextMenuItemProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Item
>;

/** Menubar */
export type MenubarRootProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>;
export type MenubarMenuProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Menu>;
export type MenubarTriggerProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>;
export type MenubarContentProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>;
export type MenubarItemProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>;

/** Navigation Menu */
export type NavigationMenuRootProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Root
>;
export type NavigationMenuListProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.List
>;
export type NavigationMenuItemProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Item
>;
export type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Trigger
>;
export type NavigationMenuContentProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Content
>;

/** Collapsible */
export type CollapsibleRootProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Root
>;
export type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Trigger
>;
export type CollapsibleContentProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Content
>;

/** Radio Group */
export type RadioGroupRootProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;
export type RadioGroupItemProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

/** Scroll Area */
export type ScrollAreaRootProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Root
>;
export type ScrollAreaViewportProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Viewport
>;
export type ScrollBarProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>;

/** Separator */
export type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

/** Switch */
export type SwitchRootProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/** Toggle / Toggle Group */
export type ToggleRootProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>;
export type ToggleGroupRootProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
>;
export type ToggleGroupItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
>;

/** Checkbox */
export type CheckboxRootProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

/** Label */
export type LabelRootProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

/** Avatar */
export type AvatarRootProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;
export type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;
export type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

/** Progress */
export type ProgressRootProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

/** Slider */
export type SliderRootProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

/** Toast（Radix） */
export type ToastProviderProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitives.Provider
>;
export type ToastViewportProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitives.Viewport
>;
export type ToastRootProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>;
export type ToastTitleProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>;
export type ToastDescriptionProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitives.Description
>;
export type ToastCloseProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>;
export type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;

/** Slot（组合模式） */
export type SlotProps = React.ComponentPropsWithoutRef<typeof Slot>;
