import { useRef, useState } from "react";
import admin from "@/api/adminApi";

/**
 * CSV 대량 등록 공통 훅
 * - 업로드, 로딩 상태, 실패 항목 목록을 관리
 * - 사용: const { csvRef, loading, csvErrors, setCsvErrors, triggerUpload, handleFileChange } = useCsvUpload("/staffs/import-csv", load);
 */
export function useCsvUpload(apiPath: string, onSuccess?: () => void) {
  const csvRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await admin.post(apiPath, fd);
      const errors: string[] = Array.isArray(res.data) ? res.data : [];
      if (errors.length > 0) setCsvErrors(errors);
    } catch (err: any) {
      const data = err?.response?.data;
      setCsvErrors(Array.isArray(data) ? data : [data || "CSV 처리 중 오류가 발생했습니다."]);
    } finally {
      setLoading(false);
      onSuccess?.();
    }
    e.target.value = "";
  };

  const triggerUpload = () => csvRef.current?.click();

  return { csvRef, loading, csvErrors, setCsvErrors, triggerUpload, handleFileChange };
}
