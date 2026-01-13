import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Apple } from "lucide-react";

export function MenuBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 z-50 text-sm font-medium text-black select-none shadow-sm">
      <div className="flex items-center">
        <button className="hover:bg-white/30 p-1 rounded transition-colors" data-testid="button-apple">
          <Apple className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="flex items-center">
        <span data-testid="text-datetime">{format(time, "EEE MMM d h:mm aa")}</span>
      </div>
    </div>
  );
}
