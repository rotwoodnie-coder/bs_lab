"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button, Badge, Progress } from "@bs-lab/ui"
import { RotateCcw, Lightbulb, Hand, MousePointerClick, Beaker, Droplets, Flame, Move, Target, Circle, Square, Package, Scissors, Pipette, TestTube, Thermometer, Magnet, Zap, Waves, Sun, Palette } from "@bs-lab/ui/icons"
import { Box } from "@bs-lab/ui/icons"
import { CheckCircle2, Sparkles, FlaskConical, Eye, Leaf } from "@bs-lab/ui/icons"

// 可拖拽物品定义
interface DraggableItem {
  id: string
  name: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  color: string
  draggable?: boolean
}

// 放置区域定义
interface DropZone {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  acceptItems: string[]
  placedItem?: string
  required?: boolean
}

// 交互场景配置
interface InteractionScene {
  id: string
  experimentType: string
  title: string
  instruction: string
  hint: string
  items: DraggableItem[]
  dropZones: DropZone[]
  successMessage: string
  backgroundImage?: string
  backgroundColor?: string
}

interface ExperimentInteractiveProps {
  experimentId: string
  experimentTitle: string
  category: string
  stepOrder: number
  stepTitle: string
  stepDescription: string
  onComplete: () => void
  onReset: () => void
}

// 根据实验ID和步骤获取交互场景配置
function getInteractionScene(experimentId: string, category: string, stepOrder: number): InteractionScene {
  // 物理实验 - 牛顿摆
  if (experimentId === "exp-001" || category === "physics") {
    const physicsScenes: InteractionScene[] = [
      {
        id: "newton-cradle-1",
        experimentType: "physics",
        title: "组装牛顿摆",
        instruction: "将小球拖拽到支架上的正确位置",
        hint: "5个小球需要排列整齐，彼此刚好接触",
        items: [
          { id: "ball-1", name: "钢球1", icon: "circle", x: 20, y: 240, width: 45, height: 45, color: "#4f46e5" },
          { id: "ball-2", name: "钢球2", icon: "circle", x: 80, y: 240, width: 45, height: 45, color: "#6366f1" },
          { id: "ball-3", name: "钢球3", icon: "circle", x: 140, y: 240, width: 45, height: 45, color: "#818cf8" },
          { id: "ball-4", name: "钢球4", icon: "circle", x: 200, y: 240, width: 45, height: 45, color: "#6366f1" },
          { id: "ball-5", name: "钢球5", icon: "circle", x: 260, y: 240, width: 45, height: 45, color: "#4f46e5" },
        ],
        dropZones: [
          { id: "pos-1", name: "位置1", x: 80, y: 120, width: 50, height: 50, acceptItems: ["ball-1", "ball-2", "ball-3", "ball-4", "ball-5"], required: true },
          { id: "pos-2", name: "位置2", x: 135, y: 120, width: 50, height: 50, acceptItems: ["ball-1", "ball-2", "ball-3", "ball-4", "ball-5"], required: true },
          { id: "pos-3", name: "位置3", x: 190, y: 120, width: 50, height: 50, acceptItems: ["ball-1", "ball-2", "ball-3", "ball-4", "ball-5"], required: true },
          { id: "pos-4", name: "位置4", x: 245, y: 120, width: 50, height: 50, acceptItems: ["ball-1", "ball-2", "ball-3", "ball-4", "ball-5"], required: true },
          { id: "pos-5", name: "位置5", x: 300, y: 120, width: 50, height: 50, acceptItems: ["ball-1", "ball-2", "ball-3", "ball-4", "ball-5"], required: true },
        ],
        successMessage: "太棒了！牛顿摆组装完成！",
        backgroundColor: "#f8fafc",
      },
      {
        id: "newton-cradle-2",
        experimentType: "physics",
        title: "单球实验",
        instruction: "拖拽最左边的小球向左拉起，然后释放",
        hint: "拉起角度保持在30度左右",
        items: [
          { id: "pull-ball", name: "拉起小球", icon: "circle", x: 80, y: 120, width: 40, height: 40, color: "#ef4444", draggable: true },
        ],
        dropZones: [
          { id: "pull-zone", name: "拉起位置", x: 20, y: 80, width: 60, height: 60, acceptItems: ["pull-ball"], required: true },
        ],
        successMessage: "观察到了吗？最右边的小球弹起来了！",
        backgroundColor: "#f8fafc",
      },
    ]
    return physicsScenes[Math.min(stepOrder - 1, physicsScenes.length - 1)] || physicsScenes[0]
  }
  
  // 化学实验 - 火山喷发
  if (experimentId === "exp-002" || category === "chemistry") {
    const chemistryScenes: InteractionScene[] = [
      {
        id: "volcano-1",
        experimentType: "chemistry",
        title: "制作火山模型",
        instruction: "将黏土拖拽到塑料瓶周围，塑造火山形状",
        hint: "记得露出瓶口哦！",
        items: [
          { id: "clay-1", name: "黏土块A", icon: "box", x: 20, y: 220, width: 55, height: 40, color: "#92400e" },
          { id: "clay-2", name: "黏土块B", icon: "box", x: 100, y: 220, width: 55, height: 40, color: "#a16207" },
          { id: "clay-3", name: "黏土块C", icon: "box", x: 180, y: 220, width: 55, height: 40, color: "#854d0e" },
        ],
        dropZones: [
          { id: "left-side", name: "左侧", x: 100, y: 150, width: 60, height: 80, acceptItems: ["clay-1", "clay-2", "clay-3"], required: true },
          { id: "right-side", name: "右侧", x: 240, y: 150, width: 60, height: 80, acceptItems: ["clay-1", "clay-2", "clay-3"], required: true },
        ],
        successMessage: "火山外形做好了！看起来很壮观！",
        backgroundColor: "#fef3c7",
      },
      {
        id: "volcano-2",
        experimentType: "chemistry",
        title: "准备熔岩材料",
        instruction: "按顺序将材料倒入瓶中：先小苏打，再色素，最后洗洁精",
        hint: "顺序很重要哦！",
        items: [
          { id: "baking-soda", name: "小苏打", icon: "package", x: 20, y: 220, width: 55, height: 50, color: "#fafaf9" },
          { id: "color", name: "红色色素", icon: "droplet", x: 100, y: 280, width: 40, height: 50, color: "#ef4444" },
          { id: "soap", name: "洗洁精", icon: "droplet", x: 170, y: 280, width: 40, height: 50, color: "#22c55e" },
        ],
        dropZones: [
          { id: "bottle", name: "塑料瓶", x: 170, y: 100, width: 60, height: 100, acceptItems: ["baking-soda", "color", "soap"], required: true },
        ],
        successMessage: "材料准备完成！准备迎接喷发！",
        backgroundColor: "#fef3c7",
      },
      {
        id: "volcano-3",
        experimentType: "chemistry",
        title: "触发喷发",
        instruction: "将白醋快速倒入火山口",
        hint: "准备好观察壮观的喷发！",
        items: [
          { id: "vinegar", name: "白醋", icon: "flask", x: 50, y: 250, width: 50, height: 60, color: "#fbbf24" },
        ],
        dropZones: [
          { id: "crater", name: "火山口", x: 175, y: 60, width: 50, height: 50, acceptItems: ["vinegar"], required: true },
        ],
        successMessage: "哇！火山喷发了！观察气泡和熔岩流动！",
        backgroundColor: "#fee2e2",
      },
    ]
    return chemistryScenes[Math.min(stepOrder - 1, chemistryScenes.length - 1)] || chemistryScenes[0]
  }
  
  // 生物实验 - 显微镜观察
  if (experimentId === "exp-003" || category === "biology") {
    const biologyScenes: InteractionScene[] = [
      {
        id: "microscope-1",
        experimentType: "biology",
        title: "制作临时装片",
        instruction: "用镊子夹取洋葱表皮，放到载玻片上",
        hint: "表皮要平整，不要有褶皱",
        items: [
          { id: "tweezers", name: "镊子", icon: "tool", x: 30, y: 250, width: 40, height: 60, color: "#71717a" },
          { id: "onion-skin", name: "洋葱表皮", icon: "leaf", x: 120, y: 260, width: 50, height: 30, color: "#a3e635" },
        ],
        dropZones: [
          { id: "slide", name: "载玻片", x: 150, y: 120, width: 100, height: 60, acceptItems: ["onion-skin"], required: true },
        ],
        successMessage: "表皮放置成功！接下来进行染色！",
        backgroundColor: "#ecfdf5",
      },
      {
        id: "microscope-2",
        experimentType: "biology",
        title: "染色处理",
        instruction: "用滴管滴加碘液进行染色",
        hint: "滴1-2滴就够了，静置1分钟",
        items: [
          { id: "dropper", name: "滴管", icon: "droplet", x: 50, y: 260, width: 30, height: 50, color: "#6366f1" },
          { id: "iodine", name: "碘液", icon: "flask", x: 120, y: 250, width: 40, height: 60, color: "#92400e" },
        ],
        dropZones: [
          { id: "specimen", name: "标本位置", x: 170, y: 130, width: 60, height: 40, acceptItems: ["dropper", "iodine"], required: true },
        ],
        successMessage: "染色完成！细胞核会变得更清晰！",
        backgroundColor: "#ecfdf5",
      },
      {
        id: "microscope-3",
        experimentType: "biology",
        title: "盖上盖玻片",
        instruction: "将盖玻片轻轻盖在标本上",
        hint: "呈45度角缓慢放下，避免气泡",
        items: [
          { id: "cover-slip", name: "盖玻片", icon: "square", x: 80, y: 260, width: 50, height: 50, color: "#94a3b8" },
        ],
        dropZones: [
          { id: "cover-zone", name: "盖玻片位置", x: 160, y: 115, width: 80, height: 50, acceptItems: ["cover-slip"], required: true },
        ],
        successMessage: "装片制作完成！现在可以放到显微镜下观察了！",
        backgroundColor: "#ecfdf5",
      },
    ]
    return biologyScenes[Math.min(stepOrder - 1, biologyScenes.length - 1)] || biologyScenes[0]
  }
  
  // 默认交互场景
  return {
    id: "default",
    experimentType: "default",
    title: "实验操作",
    instruction: "将材料拖拽到正确的位置完成实验步骤",
    hint: "仔细阅读说明，按步骤操作",
    items: [
      { id: "item-1", name: "实验材料", icon: "box", x: 50, y: 280, width: 50, height: 50, color: "#6366f1" },
    ],
    dropZones: [
      { id: "zone-1", name: "放置区域", x: 175, y: 130, width: 80, height: 80, acceptItems: ["item-1"], required: true },
    ],
    successMessage: "操作完成！做得很好！",
    backgroundColor: "#f8fafc",
  }
}

export function ExperimentInteractive({
  experimentId,
  experimentTitle,
  category,
  stepOrder,
  stepTitle,
  stepDescription,
  onComplete,
  onReset,
}: ExperimentInteractiveProps) {
  const scene = getInteractionScene(experimentId, category, stepOrder)
  
  const [items, setItems] = useState<DraggableItem[]>(scene.items)
  const [dropZones, setDropZones] = useState<DropZone[]>(scene.dropZones)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [placedCount, setPlacedCount] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 重置场景
  useEffect(() => {
    setItems(scene.items)
    setDropZones(scene.dropZones)
    setIsComplete(false)
    setShowHint(false)
    setPlacedCount(0)
  }, [stepOrder, experimentId])
  
  // 检查是否完成
  useEffect(() => {
    const requiredZones = dropZones.filter(z => z.required)
    const allPlaced = requiredZones.every(z => z.placedItem)
    if (allPlaced && requiredZones.length > 0 && !isComplete) {
      setIsComplete(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    }
    setPlacedCount(dropZones.filter(z => z.placedItem).length)
  }, [dropZones, isComplete, onComplete])
  
  // 获取容器内的相对坐标
  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])
  
  // 开始拖拽
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const item = items.find(i => i.id === itemId)
    if (!item) return
    
    // 检查物品是否已放置
    const isPlaced = dropZones.some(z => z.placedItem === itemId)
    if (isPlaced) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const pos = getRelativePosition(clientX, clientY)
    
    setDraggingId(itemId)
    setDragOffset({
      x: pos.x - item.x,
      y: pos.y - item.y
    })
  }, [items, dropZones, getRelativePosition])
  
  // 拖拽中
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingId) return
    
    // 阻止默认行为防止页面滚动
    e.preventDefault()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const pos = getRelativePosition(clientX, clientY)
    
    // 限制在容器范围内
    const boundedX = Math.max(0, Math.min(pos.x - dragOffset.x, 360))
    const boundedY = Math.max(0, Math.min(pos.y - dragOffset.y, 260))
    
    setItems(prev => prev.map(item => 
      item.id === draggingId 
        ? { ...item, x: boundedX, y: boundedY }
        : item
    ))
  }, [draggingId, dragOffset, getRelativePosition])
  
  // 结束拖拽
  const handleDragEnd = useCallback(() => {
    if (!draggingId) return
    
    const item = items.find(i => i.id === draggingId)
    if (!item) {
      setDraggingId(null)
      return
    }
    
    // 检查是否放入了某个区域
    const itemCenterX = item.x + item.width / 2
    const itemCenterY = item.y + item.height / 2
    
    let placed = false
    setDropZones(prev => prev.map(zone => {
      if (
        zone.acceptItems.includes(draggingId) &&
        !zone.placedItem &&
        itemCenterX >= zone.x &&
        itemCenterX <= zone.x + zone.width &&
        itemCenterY >= zone.y &&
        itemCenterY <= zone.y + zone.height
      ) {
        placed = true
        // 将物品吸附到区域中心
        setItems(prevItems => prevItems.map(i => 
          i.id === draggingId 
            ? { 
                ...i, 
                x: zone.x + (zone.width - i.width) / 2, 
                y: zone.y + (zone.height - i.height) / 2 
              }
            : i
        ))
        return { ...zone, placedItem: draggingId }
      }
      return zone
    }))
    
    setDraggingId(null)
  }, [draggingId, items])
  
  // 绑定全局事件
  useEffect(() => {
    if (draggingId) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e)
      const handleEnd = () => handleDragEnd()
      
      // 使用 passive: false 确保可以阻止默认滚动行为
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      document.addEventListener('touchcancel', handleEnd)
      
      // 防止拖拽时选中文本
      document.body.style.userSelect = 'none'
      document.body.style.touchAction = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleEnd)
        document.removeEventListener('touchcancel', handleEnd)
        document.body.style.userSelect = ''
        document.body.style.touchAction = ''
      }
    }
  }, [draggingId, handleDragMove, handleDragEnd])
  
  // 重置场景
  const handleReset = () => {
    setItems(scene.items)
    setDropZones(scene.dropZones)
    setIsComplete(false)
    setShowHint(false)
    setPlacedCount(0)
    onReset()
  }
  
  const requiredCount = dropZones.filter(z => z.required).length
  const progressPercent = requiredCount > 0 ? (placedCount / requiredCount) * 100 : 0
  
  // 渲染图标 - 根据材料类型显示对应图标
  const renderIcon = (icon: string, className?: string) => {
    const iconClass = cn("drop-shadow-sm", className)
    switch (icon) {
      case "circle": return <Circle className={iconClass} fill="currentColor" />
      case "box": return <Box className={iconClass} />
      case "package": return <Package className={iconClass} />
      case "droplet": return <Droplets className={iconClass} />
      case "flask": return <FlaskConical className={iconClass} />
      case "beaker": return <Beaker className={iconClass} />
      case "leaf": return <Leaf className={iconClass} />
      case "scissors": return <Scissors className={iconClass} />
      case "pipette": return <Pipette className={iconClass} />
      case "testtube": return <TestTube className={iconClass} />
      case "thermometer": return <Thermometer className={iconClass} />
      case "magnet": return <Magnet className={iconClass} />
      case "zap": return <Zap className={iconClass} />
      case "waves": return <Waves className={iconClass} />
      case "sun": return <Sun className={iconClass} />
      case "palette": return <Palette className={iconClass} />
      case "flame": return <Flame className={iconClass} />
      case "eye": return <Eye className={iconClass} />
      case "square": return <Square className={iconClass} />
      default: return <Beaker className={iconClass} />
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4 h-full flex flex-col">
      {/* 操作说明栏 */}
      <div className="flex items-center gap-3 p-3 lg:p-4 bg-primary/5 rounded-xl border border-primary/20">
        <MousePointerClick className="h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm lg:text-base font-medium truncate lg:whitespace-normal">{scene.instruction}</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 border">
            <Progress value={progressPercent} className="w-16 lg:w-24 h-2" />
            <span className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap font-medium">
              {placedCount}/{requiredCount}
            </span>
          </div>
          <Button
            variant={showHint ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHint(!showHint)}
            className="h-8 lg:h-9 px-2 lg:px-3"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden lg:inline ml-1.5">提示</span>
          </Button>
        </div>
      </div>
      
      {/* 移动端进度条 */}
      <div className="sm:hidden flex items-center gap-2 px-1">
        <Progress value={progressPercent} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground">{placedCount}/{requiredCount}</span>
      </div>
      
      {/* 提示信息 */}
      {showHint && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm lg:text-base text-yellow-800 dark:text-yellow-400">{scene.hint}</p>
        </div>
      )}
      
      {/* 交互画布 */}
      <div 
        ref={containerRef}
        className="relative w-full flex-1 min-h-[180px] lg:min-h-[320px] xl:min-h-[380px] rounded-xl lg:rounded-2xl border-2 border-dashed border-muted-foreground/30 overflow-hidden select-none shadow-inner"
        style={{ backgroundColor: scene.backgroundColor }}
      >
        {/* 放置区域 */}
        {dropZones.map(zone => (
          <div
            key={zone.id}
            className={cn(
              "absolute border-2 border-dashed rounded-xl transition-all duration-200 flex items-center justify-center",
              zone.placedItem 
                ? "border-green-500 bg-green-100/50 dark:bg-green-900/30" 
                : "border-muted-foreground/40 bg-white/50 dark:bg-white/10 hover:border-primary/50 hover:bg-primary/5"
            )}
            style={{
              left: `${(zone.x / 400) * 100}%`,
              top: `${(zone.y / 300) * 100}%`,
              width: `${(zone.width / 400) * 100}%`,
              height: `${(zone.height / 300) * 100}%`,
            }}
          >
            {!zone.placedItem && (
              <div className="text-center p-1">
                <Target className="h-6 w-6 lg:h-8 lg:w-8 mx-auto text-muted-foreground/50 mb-1" />
                <span className="text-[10px] lg:text-sm text-muted-foreground/60 font-medium">{zone.name}</span>
              </div>
            )}
            {zone.placedItem && (
              <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 absolute -top-2 -right-2 bg-white rounded-full shadow-md" />
            )}
          </div>
        ))}
        
        {/* 可拖拽物品 */}
        {items.map(item => {
          const isPlaced = dropZones.some(z => z.placedItem === item.id)
          return (
            <div
              key={item.id}
              className={cn(
                "absolute flex flex-col items-center justify-center rounded-xl shadow-lg transition-all cursor-grab active:cursor-grabbing touch-none select-none",
                "border-2 border-white/40 hover:shadow-2xl hover:scale-105 hover:border-white/60",
                draggingId === item.id && "shadow-2xl scale-110 z-50 ring-4 ring-primary/50",
                isPlaced && "pointer-events-none opacity-90"
              )}
              style={{
                left: `${(item.x / 400) * 100}%`,
                top: `${(item.y / 300) * 100}%`,
                width: `${(item.width / 400) * 100}%`,
                height: `${(item.height / 300) * 100}%`,
                backgroundColor: item.color,
                color: "#fff",
              }}
              onMouseDown={(e) => handleDragStart(e, item.id)}
              onTouchStart={(e) => handleDragStart(e, item.id)}
            >
              {renderIcon(item.icon, "w-6 h-6 lg:w-8 lg:h-8 drop-shadow-md")}
              <span className="text-[8px] lg:text-[11px] font-semibold mt-0.5 truncate max-w-full px-1 drop-shadow-sm">
                {item.name}
              </span>
              {draggingId === item.id && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                  <Badge className="text-xs shadow-lg bg-primary px-2 py-0.5">
                    <Move className="h-3 w-3 mr-1" />
                    拖动中
                  </Badge>
                </div>
              )}
            </div>
          )
        })}
        
        {/* 拖拽提示 */}
        {!draggingId && placedCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white px-4 py-2 lg:px-5 lg:py-3 rounded-full flex items-center gap-2 animate-pulse shadow-xl">
              <Hand className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="text-xs lg:text-sm font-medium">拖拽下方材料到目标位置</span>
            </div>
          </div>
        )}
        
        {/* 完成动画 */}
        {isComplete && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 lg:p-6 shadow-2xl text-center space-y-3 animate-in zoom-in duration-300">
              <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Sparkles className="h-7 w-7 lg:h-8 lg:w-8 text-green-600" />
              </div>
              <p className="font-bold text-base lg:text-lg">{scene.successMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 物品列表和重置按钮 */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
          <Package className="h-4 w-4" />
          <span className="font-medium hidden sm:inline">材料：</span>
        </div>
        <div className="flex flex-wrap gap-1.5 lg:gap-2 flex-1 min-w-0">
          {items.map(item => {
            const isPlaced = dropZones.some(z => z.placedItem === item.id)
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-lg border text-xs font-medium transition-all",
                  isPlaced 
                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700"
                    : "bg-background border-border"
                )}
              >
                <span 
                  className="w-5 h-5 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {renderIcon(item.icon, "w-3 h-3")}
                </span>
                <span className="truncate max-w-[60px] lg:max-w-none">{item.name}</span>
                {isPlaced && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="flex-shrink-0 h-8 px-2 lg:px-3">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden lg:inline ml-1.5">重置</span>
        </Button>
      </div>
    </div>
  )
}
