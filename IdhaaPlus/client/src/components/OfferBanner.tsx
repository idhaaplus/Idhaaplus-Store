import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Tag, Gift } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Offer } from "@shared/schema";

interface CountdownProps {
  endDate: string;
}

function Countdown({ endDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-2 font-mono text-xl md:text-2xl font-black">
      <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/30">
        {timeLeft.hours.toString().padStart(2, '0')}
      </div>
      <span className="text-white animate-pulse">:</span>
      <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/30">
        {timeLeft.minutes.toString().padStart(2, '0')}
      </div>
      <span className="text-white animate-pulse">:</span>
      <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/30">
        {timeLeft.seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

export function OfferBanner({ offers }: { offers: Offer[] }) {
  const activeOffer = offers.find(o => {
    const now = new Date();
    return o.isActive && now >= new Date(o.startDate) && now <= new Date(o.endDate);
  });

  if (!activeOffer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-primary via-yellow-500 to-primary text-foreground overflow-hidden relative"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-start">
            <div className="bg-white/30 p-3 rounded-2xl border border-white/50 shadow-inner hidden md:block">
              <Tag className="w-8 h-8 text-foreground animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1 border border-black/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                عرض محدود
              </div>
              <h2 className="text-xl md:text-3xl font-black leading-tight drop-shadow-sm">
                {activeOffer.title}
              </h2>
              <p className="text-sm md:text-lg font-bold opacity-90 mt-1 flex items-center gap-2">
                {activeOffer.discountType === "bogo_1_1" ? (
                  <><Gift className="w-5 h-5" /> اشترِ قطعة واحصل على الثانية مجانًا</>
                ) : activeOffer.discountType === "bogo_2_1" ? (
                  <><Gift className="w-5 h-5" /> اشترِ قطعتين واحصل على الثالثة مجانًا</>
                ) : (
                  <>خصم يصل إلى{" "}
                    <span className="underline decoration-white decoration-2 underline-offset-4">
                      {activeOffer.discountType === "percentage" ? `${activeOffer.discountValue}%` : formatPrice(activeOffer.discountValue)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <div className="flex items-center gap-2 text-sm font-black opacity-80 uppercase tracking-widest">
              <Timer className="w-4 h-4" />
              ينتهي خلال
            </div>
            <Countdown endDate={activeOffer.endDate.toString()} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
