import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "ai";
  text: string;
}

const suggestions = [
  "Where is Alan Kay Lab?",
  "Find empty classroom",
  "Navigate to C3-05",
  "Show occupancy",
];

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "Hi! I'm your Campus AI. Ask about rooms, navigation, occupancy or generate infrastructure.",
    },
  ]);

  const send = (t?: string) => {
    const text = (t ?? input).trim();
    if (!text) return;
    setMsgs((m) => [
      ...m,
      { role: "user", text },
      {
        role: "ai",
        text: `I've routed "${text}" to the campus twin. Here's what I found based on live sensor data…`,
      },
    ]);
    setInput("");
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_40px_-5px] shadow-primary/60"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute inset-0 rounded-2xl border border-primary/50 animate-ping opacity-30" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-md glass-strong rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Campus AI</div>
                  <div className="text-[10px] text-muted-foreground">Online • Real-time twin</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                        : "max-w-[85%] rounded-2xl bg-white/[0.05] border border-border/40 px-4 py-2.5 text-sm"
                    }
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-border/40 px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] rounded-full border border-border/50 bg-white/[0.03] px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-border/40 p-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the campus twin…"
                className="h-10 rounded-xl bg-white/[0.04] border-border/50"
              />
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
