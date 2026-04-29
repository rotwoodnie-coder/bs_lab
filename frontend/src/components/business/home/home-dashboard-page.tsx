"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

import { useAppMode } from "@/context/app-mode-context";

import { ManagementHomeView } from "./management-home-view";
import { PortalHomeView } from "./portal-home-view";

export function HomeDashboardPage() {
  const { viewMode } = useAppMode();

  return (
    <div className="relative min-h-[calc(100dvh-6rem)] pb-4 pt-1">
      <LayoutGroup id="home-dashboard-bento">
        <AnimatePresence mode="wait">
          {viewMode === "portal" ? (
            <motion.div
              key="portal-home"
              role="region"
              aria-label="首页"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <PortalHomeView />
            </motion.div>
          ) : (
            <motion.div
              key="management-home"
              role="region"
              aria-label="工作台首页"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <ManagementHomeView />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
