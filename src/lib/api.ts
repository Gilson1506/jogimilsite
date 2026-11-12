/**
 * Cliente HTTP para o microserviço independente de formulários da JOGIMIL
 *
 * Permite que o website seja hospedado de forma 100% desacoplada
 * (ex: Cloudflare Pages, Vercel, Netlify ou VPS) comunicando via API
 * com o microserviço independente (em http://localhost:3001 ou https://api.jogimil.ao).
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '';

export const API_ENDPOINTS = {
  submitForm: `${API_BASE}/api/forms/submit`,
  health: `${API_BASE}/health`,
};

export interface FormSubmissionPayload {
  formType: string;
  formTitle: string;
  data: Record<string, unknown>;
  source?: string;
}

export interface FormSubmissionResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  destination?: string;
}

export async function submitToMicroservice(payload: FormSubmissionPayload): Promise<FormSubmissionResponse> {
  const source = payload.source || (typeof window !== 'undefined' ? window.location.href : '');
  const res = await fetch(API_ENDPOINTS.submitForm, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      source,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Erro na resposta do microserviço.');
  }

  return json as FormSubmissionResponse;
}
