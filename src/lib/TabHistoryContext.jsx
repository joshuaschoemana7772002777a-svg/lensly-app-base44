/**
 * TabHistoryContext
 * Provides independent navigation history stacks for each bottom-nav tab.
 * Each tab remembers its last visited URL so switching back restores it.
 * Also stores scroll position per path so that tab-switching restores scroll.
 */
import React, { createContext, useContext, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// The root path for each tab
export const TAB_ROOTS = {
  Home: "/",
  Discover: "/Discover",
  Messages: "/Messages",
  Settings: "/Settings",
};

// Derive which tab owns a given pathname
export function getTabForPath(pathname) {
  if (pathname === "/" || pathname === "/Home") return "Home";
  if (pathname.startsWith("/Discover")) return "Discover";
  if (
    pathname.startsWith("/Messages") ||
    pathname.startsWith("/Conversation") ||
    pathname.startsWith("/Inbox") ||
    pathname.startsWith("/Updates") ||
    pathname.startsWith("/MyRequests") ||
    pathname.startsWith("/Notifications") ||
    pathname.startsWith("/CreateRequest")
  ) return "Messages";
  if (
    pathname.startsWith("/Settings") ||
    pathname.startsWith("/EditProfile") ||
    pathname.startsWith("/EditClientProfile")
  ) return "Settings";
  // CreatorProfile accessible from Discover tab primarily
  if (pathname.startsWith("/CreatorProfile")) return "Discover";
  return null; // unknown / overlay pages
}

const TabHistoryContext = createContext(null);

export function TabHistoryProvider({ children }) {
  // Last visited full path per tab
  const tabLastPath = useRef({
    Home: "/",
    Discover: "/Discover",
    Messages: "/Messages",
    Settings: "/Settings",
  });

  // Scroll positions per path
  const scrollPositions = useRef({});

  const saveScroll = useCallback((path, y) => {
    scrollPositions.current[path] = y;
  }, []);

  const getScroll = useCallback((path) => {
    return scrollPositions.current[path] ?? 0;
  }, []);

  const updateTabPath = useCallback((tab, path) => {
    if (tab) tabLastPath.current[tab] = path;
  }, []);

  const getTabPath = useCallback((tab) => {
    return tabLastPath.current[tab] ?? TAB_ROOTS[tab];
  }, []);

  return (
    <TabHistoryContext.Provider value={{ updateTabPath, getTabPath, saveScroll, getScroll }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  return useContext(TabHistoryContext);
}