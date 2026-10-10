/** Outcome of the last share attempt; 'idle' renders no status line. */
export type ShareStatus = 'idle' | 'shared' | 'copied' | 'error';

/**
 * ResultActions - Final controls under the printed card: whole-set retake,
 * share, download, and the download/share status lines.
 */
interface ResultActionsProps {
  isPrinting: boolean;
  /** True while the develop-in reveal is running; buttons stay locked with isPrinting. */
  isRevealing: boolean;
  isDownloadError: boolean;
  shareStatus: ShareStatus;
  onRetakeAll: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export const ResultActions = ({
  isPrinting,
  isRevealing,
  isDownloadError,
  shareStatus,
  onRetakeAll,
  onShare,
  onDownload,
}: ResultActionsProps) => (
  <>
    <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 w-full sm:w-auto">
      <button
        type="button"
        onClick={onRetakeAll}
        disabled={isPrinting || isRevealing}
        className="bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full font-medium transition-colors sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
      >
        Retake
      </button>
      <button
        type="button"
        onClick={onShare}
        disabled={isPrinting || isRevealing}
        className="bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full font-medium transition-colors sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
      >
        Share
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={isPrinting || isRevealing}
        className="bg-white text-zinc-950 font-medium px-5 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base rounded-full hover:bg-zinc-200 transition-colors sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        Download
      </button>
    </div>

    {shareStatus === 'shared' && (
      <p className="text-emerald-400 text-sm" role="status">
        Shared!
      </p>
    )}
    {shareStatus === 'copied' && (
      <p className="text-emerald-400 text-sm" role="status">
        Copied to clipboard — paste it anywhere.
      </p>
    )}
    {shareStatus === 'error' && (
      <p className="text-red-400 text-sm" role="status">
        Sharing isn&apos;t supported here — try Download.
      </p>
    )}
    {isDownloadError && (
      <p role="alert" className="text-red-400 text-sm">
        Download failed — please try again.
      </p>
    )}
  </>
);
