import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, FolderOpen, Loader2, Search, X } from "lucide-react";
import { MenuBar } from "@/components/MenuBar";
import { Button } from "@/components/ui/button";

export default function FolderView() {
  const { name } = useParams<{ name: string }>();
  // In a real app, we'd fetch folder contents here. 
  // For this v1, we just display the folder name as the "page".

  const decodedName = decodeURIComponent(name || "Unknown");

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gray-100 flex flex-col">
       {/* Wallpaper background (blurred for depth) */}
       <div 
        className="absolute inset-0 bg-cover bg-center -z-10 blur-xl scale-110 opacity-50"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')`
        }}
      />
      
      <MenuBar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-5xl h-full max-h-[800px] glass bg-white/80 rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5"
        >
          {/* Window Toolbar */}
          <div className="h-14 bg-gray-50/50 border-b border-gray-200/50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Link href="/">
                  <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-600/20 cursor-pointer flex items-center justify-center group">
                    <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600/20" />
                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600/20" />
              </div>
              
              <div className="flex items-center gap-1 ml-4 text-gray-500">
                <Link href="/">
                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200/50">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <span className="text-sm font-semibold text-gray-700 mx-2">{decodedName}</span>
              </div>
            </div>

            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-9 pr-4 py-1 bg-gray-200/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-48 transition-all"
              />
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-white/40">
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                <FolderOpen className="w-12 h-12" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">{decodedName}</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                  This is the content page for your folder. 
                  In a full application, you could add files, documents, or apps here.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-8">
                {/* Placeholder items to look populated */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/60 p-4 rounded-lg border border-white/40 shadow-sm flex items-center gap-3 hover:bg-white/80 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 bg-gray-300 rounded" />
                    </div>
                    <div className="text-left">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="h-6 bg-gray-50/80 border-t border-gray-200/50 px-4 flex items-center text-xs text-gray-500">
            4 items, 1.2 GB available
          </div>
        </motion.div>
      </div>
    </div>
  );
}
