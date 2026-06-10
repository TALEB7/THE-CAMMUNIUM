"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "next-auth/react";

type KycStatus = "none" | "pending" | "approved" | "rejected";

export function useKyc() {
  const { update } = useSession();
  const [status, setStatus] = useState<KycStatus>("none");
  const [kycData, setKycData] = useState<any>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/kyc/status');
      setStatus(res.data.status || "none");
      setKycData(res.data);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const submitPersonalKyc = useCallback(async (formData: FormData) => {
    try {
      const res = await api.post('/kyc/personal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.status === 201 || res.status === 200) {
        await fetchStatus();
        await update({ kycStatus: 'pending' });
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }, [fetchStatus, update]);

  const submitBusinessKyc = useCallback(async (formData: FormData) => {
    try {
      const res = await api.post('/kyc/business', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.status === 201 || res.status === 200) {
        await fetchStatus();
        await update({ kycStatus: 'pending' });
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }, [fetchStatus, update]);

  return { status, submitPersonalKyc, submitBusinessKyc, kycData, refresh: fetchStatus };
}

export default useKyc;
