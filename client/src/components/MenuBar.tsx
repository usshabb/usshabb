import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Apple, LogOut } from "lucide-react";

export function MenuBar({ onLogout }: { onLogout: () => void }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-win95-gray flex items-center justify-between px-2 z-50 text-xs font-medium text-black select-none border-b-2 border-b-white" style={{ borderBottom: '2px solid #ffffff', boxShadow: 'inset 0 -2px 0 #808080' }}>
      <div className="flex items-center">
        <button className="hover:bg-white px-2 py-1 active:bg-win95-dark-gray" data-testid="button-apple">
          <span className="font-bold">Start</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLogout}
          className="hover:bg-white px-2 py-1 active:bg-win95-dark-gray flex items-center gap-1"
          title="Logout"
        >
          <LogOut className="w-3 h-3" />
          <span>Logout</span>
        </button>

        <div className="flex items-center border border-win95-dark-gray px-2 py-0.5" style={{ borderTopColor: '#808080', borderLeftColor: '#808080', borderRightColor: '#ffffff', borderBottomColor: '#ffffff', boxShadow: 'inset 1px 1px 0 #000000' }}>
          <span data-testid="text-datetime">{format(time, "h:mm aa")}</span>
        </div>
      </div>
    </div>
  );
}
