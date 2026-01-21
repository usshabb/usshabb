import { useState, useRef, useEffect } from "react";

const PASSCODE_COOKIE = "app_passcode";
const CORRECT_PASSCODE = "1798";

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

// Export logout function
export const clearPasscode = () => {
  deleteCookie(PASSCODE_COOKIE);
  sessionStorage.removeItem("unlocked");
};

export function PasscodeScreen({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if passcode is already stored in cookie
    const storedPasscode = getCookie(PASSCODE_COOKIE);
    if (storedPasscode === CORRECT_PASSCODE) {
      onUnlock();
    } else {
      // Focus first input on mount if not auto-unlocking
      inputRefs.current[0]?.focus();
    }
  }, [onUnlock]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are filled
    if (index === 3 && value) {
      const code = newDigits.join("");
      checkCode(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === 4) {
        checkCode(code);
      }
    }
  };

  const checkCode = (code: string) => {
    if (code === CORRECT_PASSCODE) {
      // Store passcode in cookie
      setCookie(PASSCODE_COOKIE, code);
      onUnlock();
    } else {
      setError(true);
      // Clear inputs after error
      setTimeout(() => {
        setDigits(["", "", "", ""]);
        setError(false);
        inputRefs.current[0]?.focus();
      }, 1000);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#008080' }}>
      {/* Left Side - Image */}
      <div className="w-1/2 h-full relative">
        <img
          src="/passcode-bg.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Passcode Form */}
      <div className="w-1/2 h-full flex items-center justify-center" style={{ background: '#008080' }}>
        <div className="w-full max-w-md px-12">
          {/* Windows 95 Style Dialog */}
          <div className="win95-window">
            {/* Title Bar */}
            <div className="win95-titlebar">
              <span>Enter Password</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-3.5 win95-button flex items-center justify-center text-[10px] font-bold">_</div>
                <div className="w-4 h-3.5 win95-button flex items-center justify-center text-[10px]">□</div>
                <div className="w-4 h-3.5 win95-button flex items-center justify-center text-[10px]">✕</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-2" style={{ color: '#000080' }}>Welcome to the System</h1>
                <p className="text-xs" style={{ color: '#000000' }}>Please enter your 4-digit passcode to continue</p>
              </div>

              {/* Passcode Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold mb-2" style={{ color: '#000000' }}>
                  PASSWORD:
                </label>
                <div className="flex gap-2">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="win95-input w-12 h-12 text-center text-xl font-bold focus:outline-none"
                      style={{ caretColor: 'black' }}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2 win95-window" style={{ background: '#ffffff' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: '#ff0000' }}>✕</span>
                    <span className="text-xs font-bold" style={{ color: '#000000' }}>Incorrect password. Access denied.</span>
                  </div>
                </div>
              )}

              {/* Hint */}
              <div className="text-[10px]" style={{ color: '#000000' }}>
                💡 Hint: The password is a 4-digit number
              </div>

              {/* OK Button */}
              <div className="mt-6 flex justify-end">
                <button
                  className="win95-button px-6 py-1"
                  onClick={() => {
                    const code = digits.join("");
                    if (code.length === 4) {
                      checkCode(code);
                    }
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
