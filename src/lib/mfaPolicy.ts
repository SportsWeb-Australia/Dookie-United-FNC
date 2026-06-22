/**
 * Platform-wide two-factor policy — the single switch.
 *
 *   false → soft rollout: admin/committee accounts are prompted to set up 2FA
 *           but may skip it, and may turn it off themselves. Use while testing.
 *   true  → enforced: any admin / committee / platform account MUST set up 2FA
 *           before reaching the dashboard (no skip), and cannot turn it off
 *           afterwards. This is the "security is standard, not optional" mode.
 *
 * Flip to true ONLY after you have:
 *   1. enrolled your own account,
 *   2. confirmed the sign-out -> sign-in 6-digit code challenge works, and
 *   3. deployed the mfa-admin-reset / mfa-recovery Edge Functions
 *      (so a lost phone is a quick reset, not a lock-out).
 */
export const MFA_ENFORCED = true;
