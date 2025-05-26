// Export all sidebar components from a single entry point
import { SidebarProvider, useSidebar } from "./context"
import { Sidebar } from "./main"
import { SidebarTrigger, SidebarRail } from "./trigger"
import { 
  SidebarInset, 
  SidebarInput, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarSeparator, 
  SidebarContent 
} from "./sections"
import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupAction, 
  SidebarGroupContent 
} from "./group"
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuAction, 
  SidebarMenuBadge, 
  SidebarMenuSkeleton 
} from "./menu"
import { 
  SidebarMenuSub, 
  SidebarMenuSubItem, 
  SidebarMenuSubButton 
} from "./submenu"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
