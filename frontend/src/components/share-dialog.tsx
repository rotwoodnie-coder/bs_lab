"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui"
import { Input } from "@bs-lab/ui"
import { Copy, Check, Download, MessageCircle } from "@bs-lab/ui/icons"
import type { ShareInfo } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareInfo: ShareInfo | null
}

export function ShareDialog({ open, onOpenChange, shareInfo }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  if (!shareInfo) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareInfo.url)
      setCopied(true)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#share-qrcode canvas") as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = url
      a.download = `${shareInfo.title}-二维码.png`
      a.click()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分享到微信</DialogTitle>
          <DialogDescription>
            扫描二维码或复制链接分享给好友
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 二维码区域 */}
          <div className="flex flex-col items-center">
            <div 
              id="share-qrcode"
              className="p-4 bg-white rounded-xl shadow-sm border"
            >
              <QRCodeSVG
                value={shareInfo.url}
                size={180}
                level="M"
                includeMargin={false}
                fgColor="#0d9488"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              微信扫一扫，查看实验详情
            </p>
          </div>

          {/* 分享信息预览 */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 line-clamp-1">{shareInfo.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {shareInfo.description}
            </p>
          </div>

          {/* 链接复制 */}
          <div className="flex gap-2">
            <Input
              value={shareInfo.url}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownloadQR}
            >
              <Download className="h-4 w-4 mr-2" />
              保存二维码
            </Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={handleCopy}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制链接"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            复制链接后，打开微信粘贴发送给好友
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
