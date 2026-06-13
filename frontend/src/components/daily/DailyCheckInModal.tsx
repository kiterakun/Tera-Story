import { useState, type FC } from 'react';
import { Check, Gift, Star, Flame } from 'lucide-react';
import { Spinner } from '../../design-system/Spinner';
import { Modal, ModalHeader, ModalBody } from '../../design-system';
import type { DailyStatus, ClaimDailyResponse } from '../../services/dailyApi';
import { useTranslation } from '../../i18n';
import { StreakBadge } from './StreakBadge';

interface DailyCheckInModalProps {
  isOpen: boolean;
  status: DailyStatus;
  isLoading?: boolean;
  error?: string | null;
  onClaim: () => Promise<ClaimDailyResponse>;
  onClose: () => void;
}


export const DailyCheckInModal: FC<DailyCheckInModalProps> = ({
  isOpen,
  status,
  isLoading = false,
  error = null,
  onClaim,
  onClose,
}) => {
  const t = useTranslation();
  const [claiming, setClaiming] = useState(false);
  const [claimedResult, setClaimedResult] = useState<ClaimDailyResponse | null>(null);
  const [xpFly, setXpFly] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const result = await onClaim();
      setClaimedResult(result);
      setXpFly(true);
      setTimeout(() => setXpFly(false), 1500);
    } finally {
      setClaiming(false);
    }
  };

  // Find today's index (0-6) — use first false as "today" if not claimed
  const todayIndex = status.weekProgress.findIndex((claimed) => !claimed);
  const todayDay = todayIndex >= 0 ? todayIndex : -1;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
      className="max-w-md rounded-2xl animate-scale-in"
    >
      <ModalHeader className="flex items-center gap-2">
        <Star className="w-5 h-5 text-gold shrink-0" />
        <span className="text-lg font-semibold text-ink-100">{t.daily.checkInTitle}</span>
      </ModalHeader>

      <ModalBody className="p-5">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-ink-800 rounded-lg w-1/3 mx-auto" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="aspect-square bg-ink-800 rounded-xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          /* Error state */
          <div className="text-center py-6">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 text-sm text-ink-400 hover:text-ink-200 border border-ink-700 rounded-lg transition-colors"
            >
              {t.common.close}
            </button>
          </div>
        ) : (
          <>
            {/* Streak display */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <StreakBadge streak={status.currentStreak} size="md" />
              <span className="text-xs text-ink-400">
                {t.daily.streakRecord.replace('{count}', String(status.longestStreak))}
              </span>
              {status.streakFreezesAvailable > 0 && (
                <span className="text-xs text-blue-400">
                  {t.daily.streakFreezes.replace('{count}', String(status.streakFreezesAvailable))}
                </span>
              )}
            </div>

            {/* 7-day grid */}
            <div className="grid grid-cols-7 gap-2 mb-5">
              {t.daily.dayLabels.map((label, i) => {
                const isPast = status.weekProgress[i];
                const isToday = i === todayDay;

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-ink-500 font-medium">{label}</span>
                    <div
                      className={`aspect-square w-full rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                        isPast
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                          : isToday
                            ? 'bg-gold/20 border-2 border-gold text-gold animate-[pulse_2s_ease-in-out_infinite]'
                            : 'bg-ink-800 border border-ink-700 text-ink-600'
                      }`}
                    >
                      {isPast ? (
                        <Check className="w-4 h-4" />
                      ) : isToday ? (
                        <span className="text-xs">{todayDay + 1}</span>
                      ) : (
                        <Gift className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Claim button / claimed state */}
            {claimedResult ? (
              <div className="text-center space-y-2 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">{t.daily.claimed}</span>
                </div>
                <p className="text-sm text-ink-300">
                  +{claimedResult.xpEarned} XP
                  {claimedResult.bonus > 0 && (
                    <span className="text-gold ml-1">{t.daily.bonus.replace('{count}', String(claimedResult.bonus))}</span>
                  )}
                </p>
                {xpFly && (
                  <div className="text-gold text-lg font-bold animate-[flyUp_1.5s_ease-out]">
                    +{claimedResult.xpEarned} XP
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="mt-3 px-6 py-2 text-sm bg-ink-800 text-ink-300 rounded-lg hover:bg-ink-700 transition-colors"
                >
                  {t.common.close}
                </button>
              </div>
            ) : todayDay >= 0 ? (
              <div className="text-center">
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full py-3 bg-gold text-ink-950 rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {claiming ? (
                    <>
                      <Spinner size="sm" className="border-2 border-ink-950 border-t-transparent rounded-full" />
                      {t.daily.claiming}
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      {t.daily.claimNow}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm text-ink-400">
                  {t.daily.allClaimed}
                </p>
              </div>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
};
