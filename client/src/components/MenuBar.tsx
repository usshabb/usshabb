import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Apple, Battery, Wifi } from "lucide-react";

export function MenuBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 z-50 text-sm font-medium text-black select-none shadow-sm">
      <div className="flex items-center space-x-4">
        <button className="hover:bg-white/30 p-1 rounded transition-colors">
          <Apple className="w-4 h-4 fill-current" />
        </button>
        <span className="font-bold">Finder</span>
        <span className="hidden sm:inline-block">File</span>
        <span className="hidden sm:inline-block">Edit</span>
        <span className="hidden sm:inline-block">View</span>
        <span className="hidden sm:inline-block">Go</span>
        <span className="hidden sm:inline-block">Window</span>
        <span className="hidden sm:inline-block">Help</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
        </div>
        <span>{format(time, "EEE MMM d h:mm aa")}</span>
      </div>
    </div>
  );
}
