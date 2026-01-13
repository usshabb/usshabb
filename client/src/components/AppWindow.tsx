import { X, Minus, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppWindowProps {
  appId: string;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function AppWindow({ appId, title, onClose, children }: AppWindowProps) {
  return (
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-xl overflow-hidden shadow-2xl z-30 bg-white/95 backdrop-blur-xl border border-white/30"
      data-testid={`window-${appId}`}
    >
      {/* Title Bar */}
      <div className="h-10 bg-gray-100/90 backdrop-blur flex items-center px-3 border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            data-testid={`button-close-${appId}`}
          />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="flex-1 text-center text-sm font-medium text-gray-700">{title}</span>
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-2.5rem)] overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}

export function DocsApp({ onClose }: { onClose: () => void }) {
  return (
    <AppWindow appId="docs" title="Docs" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Docs</h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          AI-powered document editor coming soon. Create, edit, and collaborate on documents with AI assistance.
        </p>
      </div>
    </AppWindow>
  );
}

export function NotesApp({ onClose }: { onClose: () => void }) {
  return (
    <AppWindow appId="notes" title="Notes" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Notes</h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          AI-powered note-taking app coming soon. Capture ideas and let AI help organize your thoughts.
        </p>
      </div>
    </AppWindow>
  );
}
