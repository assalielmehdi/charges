import { LogOut } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBar } from "@/components/ui/status-bar";
import { Brand } from "./brand";

export function MobileTopBar({
  logoutAction,
}: {
  logoutAction: () => Promise<void> | void;
}) {
  return (
    <div className="md:hidden shrink-0">
      <StatusBar />
      <div className="px-6 pt-2 pb-3 flex items-center justify-between">
        <Brand size="sm" />
        <form action={logoutAction}>
          <IconButton type="submit" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </IconButton>
        </form>
      </div>
    </div>
  );
}
