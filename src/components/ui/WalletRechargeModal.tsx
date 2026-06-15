import React, { useCallback, useEffect, useState } from 'react';
import { useReportsStore } from '../../store/useReportsStore';
import { walletApi } from '../../services/walletApi';

/* ── Preset amounts (₹) — kept in sync with the source mock
   `ui-source/screens/wallet-recharge-popup.html`. The 200 ₹ default
   reflects the new minimum-balance rule called out in the info
   banner so a user can pay immediately without typing anything. */
const PRESETS = [500, 1000, 2000, 5000] as const;
const DEFAULT_AMOUNT = 200;

/* Formats `1234` → "1,234"; safe for any non-negative number we'd
   plausibly show in a wallet recharge flow. */
const formatINR = (n: number): string =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

/**
 * Wallet recharge popup.
 *
 * Translated from `ui-source/screens/wallet-recharge-popup.html`.
 * Mounted once at the layout root and surfaced by either the topbar
 * wallet pill or the `+ Recharge Wallet` CTA on the Wallet
 * Transactions screen — both call `openWalletRecharge()` on the
 * shared store so the modal can stay a singleton.
 *
 * Behaviour kept from the source:
 *   • Preset pills snap the amount + recalc the bill summary + Pay button
 *   • Backdrop click and ✕ both close (Escape too, in addition)
 *   • Body scroll locked while open
 *
 * Behaviour intentionally stubbed (placeholders, no live payment):
 *   • Add Coupon, Hide Bill Summary, Pay — fire a toast for now.
 */
export const WalletRechargeModal: React.FC = () => {
  const open = useReportsStore((s) => s.walletRecharge.open);
  const close = useReportsStore((s) => s.closeWalletRecharge);
  const showToast = useReportsStore((s) => s.showToast);

  const [balance, setBalance] = useState(0);

  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await walletApi.initiatePayURecharge(amount);
      if (res.success && res.data) {
        const payuData = res.data;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payuData.action_url;
        
        const params: any = {
          ...payuData.form_params,
          hash: payuData.hash,
          surl: payuData.success_url,
          furl: payuData.failure_url
        };

        for (const key in params) {
          if (params[key] !== undefined && params[key] !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
          }
        }
        
        document.body.appendChild(form);
        form.submit();
      } else {
        showToast(`Recharge failed: ${res.message || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (e: any) {
      showToast(`Recharge error: ${e.message}`);
      setLoading(false);
    }
  };

  /* Reset the amount + selected preset every time the modal re-opens so
     a fresh interaction always starts from the safe minimum default. */
  useEffect(() => {
    if (open) {
      setAmount(DEFAULT_AMOUNT);
      walletApi.fetchBalance().then(bal => setBalance(bal)).catch(() => {});
    }
  }, [open]);

  /* Escape-to-close mirrors the rest of the app's modal language. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  /* Body scroll lock — prevents background scroll bleed on long pages
     (e.g. the Wallet Transactions table) while the popup is open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) close();
    },
    [close],
  );

  if (!open) return null;

  return (
    <div
      className="wrm-ov sh"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wr-title"
      onClick={onBackdropClick}
    >
      <div className="wrm">
        <div className="wrm-hdr">
          <div>
            <div className="wrm-title" id="wr-title">Recharge Your Wallet</div>
          </div>
          <div className="wrm-hdr-r">
            <div className="wrm-bal">₹{formatINR(balance)}</div>
            <button
              type="button"
              className="wrm-x"
              aria-label="Close"
              onClick={close}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="wrm-body">
          <div className="wrm-info">
            Minimum balance required to ship is now <s>₹500</s> ₹200
          </div>

          <div className="wrm-amt">
            <div className="wrm-amt-cur">₹</div>
            <div className="wrm-amt-val">{formatINR(amount)}</div>
            <div className="wrm-amt-line" />
          </div>

          <div className="wrm-presets" role="group" aria-label="Preset amounts">
            {PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className={`wrm-pre ${amount === v ? 'on' : ''}`}
                onClick={() => setAmount(v)}
              >
                ₹{formatINR(v)}
              </button>
            ))}
          </div>

          <div className="wrm-sec">
            <div className="wrm-sec-t">Offers &amp; Bill Summary</div>
          </div>

          <div className="wrm-coupon">
            <div className="wrm-coupon-l">Have Coupon Code?</div>
            <button
              type="button"
              className="wrm-coupon-r"
              onClick={() => showToast('Add Coupon — coming soon')}
            >
              Add Coupon
            </button>
          </div>

          <div className="wrm-summary">
            <div className="wrm-sum-hdr">
              <span>
                Amount to be credited: <b>₹{formatINR(amount)}</b>
              </span>
              <button
                type="button"
                className="wrm-sum-toggle"
                onClick={() => showToast('Hide Bill Summary — coming soon')}
              >
                Hide Bill Summary
              </button>
            </div>
            <div className="wrm-sum-row">
              <span>Recharge Amount</span>
              <span className="mono">₹{formatINR(amount)}</span>
            </div>
            <div className="wrm-sum-row total">
              <span>Payable Amount</span>
              <span className="mono">₹{formatINR(amount)}</span>
            </div>
          </div>

          <button
            type="button"
            className="wrm-pay"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₹${formatINR(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletRechargeModal;
