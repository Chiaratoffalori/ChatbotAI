const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Send Firebase JWT to FastAPI /protected ──────────────────────────
// Call this right after Firebase login succeeds to verify with your backend
export async function callProtected(): Promise<any> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found. Please log in.");

    const res = await fetch(`${API_URL}/protected`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (res.status === 401) throw new Error("Session expired. Please log in again.");
    if (!res.ok) throw new Error("Server error. Please try again.");

    return res.json();
}

export function getToken(): string | null {
    return localStorage.getItem("token");
}

// ── Chat (streaming) ────────────────────────────────────────────────
export async function streamMessageFromBackend(
    message: string,
    chatId: string | undefined,
    onChunk: (delta: string) => void
): Promise<string> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated.");

    const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message, chatId }),
    });

    if (res.status === 401) throw new Error("Session expired. Please log in again.");
    if (!res.ok) throw new Error("Server error. Please try again.");
    if (!res.body) throw new Error("No response body.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Processa solo righe complete (terminate da \n)
        const lines = buffer.split("\n");

        // L'ultima riga potrebbe essere incompleta — la tieni nel buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") return full;
            const cleanData = data
                .replace(/\\n\\n/g, "\n")
                .replace(/\\n/g, "\n")
                .replace(/(\d+)\)/g, "$1.")
                .replace(/(Annuncio|Link):\s*(https?:\/\/[^\s]+)/gi, "[Clicca qui per l'annuncio]($2)");
            full += cleanData;
            onChunk(cleanData);
        }
    }

    return full;
}


//── Helper per le chiamate autenticate ──────────────────────────────
function authHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

// ── Recupera tutte le chat dell'utente ──────────────────────────────
export async function getChats(): Promise<any[]> {
    const res = await fetch(`${API_URL}/chats`, {
        method: "GET",
        headers: authHeaders(),
    });
    if (res.status === 401) throw new Error("Sessione scaduta.");
    if (!res.ok) throw new Error("Errore nel recupero delle chat.");
    const data = await res.json();
    return data.chats; // array di { uid, role, message, createdAt }
}

//- Upload file ──────────────────────────────
export async function uploadFile(file: File, chatId?: string): Promise<string> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated.");

    const formData = new FormData();
    formData.append("file", file);
    if (chatId) {
        formData.append("chat_id", chatId);
    }

    const res = await fetch(`${API_URL}/uploadfile`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });

    if (res.status === 401) throw new Error("Session expired. Please log in again.");
    if (!res.ok) throw new Error("Server error. Please try again.");

    const data = await res.json();
    return String(data.filename);
}