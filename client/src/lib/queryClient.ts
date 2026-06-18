import { QueryClient, QueryFunction } from "@tanstack/react-query";

function handleSessionExpired() {
  localStorage.removeItem("safal_user");
  localStorage.removeItem("safal_token");
  localStorage.removeItem("safal_expires_at");
  if (!window.location.search.includes("expired=1")) {
    window.location.href = "/?expired=1";
  }
}

async function throwIfResNotOk(res: Response) {
  if (res.status === 401) {
    const text = await res.text().catch(() => "");
    if (text.includes("SESSION_EXPIRED") || text.includes("Session expired")) {
      handleSessionExpired();
    }
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("safal_token");
  const headers: Record<string, string> = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("safal_token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      const text = await res.text().catch(() => "");
      if (text.includes("SESSION_EXPIRED") || text.includes("Session expired")) {
        handleSessionExpired();
        throw new Error("Session expired");
      }
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error(`401: ${text || res.statusText}`);
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/** Fetch with auth token and throw on non-OK status */
export async function authFetch(url: string): Promise<any> {
  const token = localStorage.getItem("safal_token");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    const text = await res.text().catch(() => "");
    if (text.includes("SESSION_EXPIRED") || text.includes("Session expired")) {
      handleSessionExpired();
    }
    throw new Error(`401: ${text || res.statusText}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}
