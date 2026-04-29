"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"

interface UserContextType {
  user: User
  setRole: (role: UserRole) => void
  isTeacher: boolean
  isStudent: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("student")

  // 真实用户数据应由 useAuth / useSessionActor 提供
  const user: User = {
    id: "",
    name: "",
    avatar: "",
    role: currentRole,
    school: "",
  }

  const setRole = (role: UserRole) => {
    setCurrentRole(role)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setRole,
        isTeacher: currentRole === "teacher",
        isStudent: currentRole === "student",
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
