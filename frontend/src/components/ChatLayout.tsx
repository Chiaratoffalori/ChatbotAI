"use client";

import { useState, useRef, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { logout } from "@/lib/auth";
import { onAuthStateChanged, type User } from "firebase/auth";
import { streamMessageFromBackend, getChats, uploadFile } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  type?: "text" | "jobs";
  jobs?: string[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="#1a2540" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1a2540" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ChatLayout() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
  };
  useEffect(() => {
    const loadChats = async () => {
      const history = await getChats();

      // Raggruppa i messaggi per chatId
      const grouped = history.reduce((acc: Record<string, Message[]>, msg: any, i: number) => {
        const chatId = msg.chatId || "global";
        if (!acc[chatId]) acc[chatId] = [];
        acc[chatId].push({
          id: msg.id || crypto.randomUUID(),
          role: msg.role === "assistant" ? "bot" : "user",
          type: "text",
          content: msg.message,
        });
        return acc;
      }, {});

      const loadedChats = Object.entries(grouped).map(([id, messages]) => ({
        id,
        title: id === "global" ? "Chat Principale" : `Chat ${id.slice(-4)}`,
        messages: messages as Message[],
      }));

      if (loadedChats.length > 0) {
        setChats(loadedChats);
        setActiveChatId(loadedChats[0].id);
      } else {
        createNewChat();
      }
    };
    loadChats();
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const createNewChat = () => {
    const newChat: Chat = { id: crypto.randomUUID(), title: "New chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); // ← solo questo, nient'altro
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    if (!activeChatId) return;

    setIsTyping(true);

    try {
      // 1. carica il file se presente
      if (selectedFile) {
        await uploadFile(selectedFile, activeChatId);

        const fileMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          type: "text",
          content: `📎 ${selectedFile.name}`,
        };
        setChats((prev) => prev.map((c) =>
          c.id === activeChatId ? { ...c, messages: [...c.messages, fileMsg] } : c
        ));
        setSelectedFile(null);
      }

      // 2. Send message and stream response
      if (inputValue.trim()) {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          type: "text",
          content: inputValue.trim(),
        };
        setChats((prev) => prev.map((c) =>
          c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] } : c
        ));
        const currentInput = inputValue.trim();
        setInputValue("");

        // Add an empty bot message immediately, then stream into it
        const botMsgId = crypto.randomUUID();
        setChats((prev) => prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, { id: botMsgId, role: "bot", type: "text", content: "" }] }
            : c
        ));

        await streamMessageFromBackend(currentInput, activeChatId, (delta) => {
          setChats((prev) => prev.map((c) => {
            if (c.id !== activeChatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === botMsgId ? { ...m, content: m.content + delta } : m
              ),
            };
          }));
        });
      }

    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        type: "text",
        content: "❌ " + (err.message || "Errore."),
      };
      setChats((prev) => prev.map((c) =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, errMsg] } : c
      ));
    } finally {
      setIsTyping(false);
    }
  };


  const filteredChats = chats.filter((c) => c.title.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#efefef" }}>
      <style>{`
        @keyframes bounceTyping {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeUp 0.25s ease forwards; }
      `}</style>

      {/* ── SIDEBAR — standalone column, no top navbar ── */}
      <aside className="flex flex-col h-full flex-shrink-0" style={{ width: "350px", background: "#ffffff", borderRight: "1px solid #d9d9d9" }}>

        {/* Logo icon at very top — matching PDF */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <button className="text-[#2f2f2f] hover:opacity-70 transition-opacity" onClick={() => { }}>
            <LogoMark />
          </button>
          <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#000000", fontSize: "18px" }}>
            Chats
          </span>
          <button onClick={createNewChat} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors" title="New chat">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="#2f2f2f" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border: "2px solid #d9d9d9", background: "white" }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="#b3b3b3" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search" className="flex-1 text-xs outline-none bg-transparent" style={{ color: "#303030" }} />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "#b3b3b3", fontSize: "10px" }}>Chats</p>
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5"
              style={{
                background: chat.id === activeChatId ? "white" : "transparent",
                color: "#303030",
                fontWeight: chat.id === activeChatId ? 500 : 400,
              }}
            >
              {chat.title}
            </button>
          ))}
          <button onClick={createNewChat} className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#b3b3b3] hover:text-[#303030] transition-colors">
            New chat
          </button>
        </div>

        {/* User + Logout */}
        <div className="px-4 py-4 flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#6ca6ff" }}>
            {currentUser?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-xs truncate flex-1" style={{ color: "#64748b" }}>{currentUser?.email ?? ""}</span>
          <button onClick={handleLogout} title="Sign out" className="flex-shrink-0 hover:opacity-60 transition-opacity">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA — navbar + messages + input ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full" style={{ background: "#ffffff" }}>

        {/* Navbar — only above the main chat, NOT spanning sidebar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6" style={{ height: "90px", background: "#ffffff" }}>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold text-[#3A5FC8] " style={{ fontFamily: "Syne, sans-serif", fontSize: "20px" }}>
              FIND YOUR PATH
            </span>
            <img
              src="/logo.svg"
              alt="logo"
              style={{ height: "35px", width: "auto" }}
            />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="w-full max-w-[860px] mx-auto px-6 pt-6 pb-2 space-y-3 min-h-full flex-1  flex flex-col">
            {!activeChat || activeChat.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <img
                  src="/logo.svg"
                  alt="logo"
                  className="mb-6"
                  style={{ height: "150px", width: "auto" }}
                />
                <p className="text-sm text-center" style={{ color: "#1E1E1E", maxWidth: "600px" }}>
                  Hi! I’ll help you explore your career options. <br />You can upload your CV and i can help you to find a study path, a job or change career
                </p>
              </div>
            ) : (
              activeChat.messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className="msg-in flex gap-3"
                  style={{ animationDelay: `${i * 20}ms`, justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}
                >
                  {/* Bot avatar — matching PDF "AI" badge */}
                  {msg.role === "bot"}

                  <div style={{ maxWidth: "75%" }}>
                    {msg.role === "bot" ? (
                      <>
                        {console.log("MSG CONTENT:", msg.content)}
                        {/* Bot text: large, no bubble — exact PDF style */}
                        <div className="leading-tight text-[#1d1d1d]" style={{ fontSize: "clamp(14px, 1.8vw, 20px)" }}>
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p style={{ margin: "0", padding: "0" }} {...props} />,
                              li: ({ node, ...props }) => <li style={{ margin: "0.25rem 0", padding: "0", listStyleType: "inherit" }} {...props} />,
                              ul: ({ node, ...props }) => <ul style={{ margin: "0.5rem 0", padding: "0 0 0 1.5rem", listStyleType: "disc" }} {...props} />,
                              ol: ({ node, ...props }) => <ol style={{ margin: "0.5rem 0", padding: "0 0 0 1.5rem", listStyleType: "decimal" }} {...props} />,
                              a: ({ node, ...props }) => <a style={{ color: "#3A5FC8", textDecoration: "underline", pointerEvents: "auto", cursor: "pointer" }} target="_blank" rel="noopener noreferrer" {...props} />,
                            }}
                          >{msg.content.replace(/(Annuncio|Link|URL):\s*(https?:\/\/[^\s*]+)/gi, "[Click here to view the job offer]($2)")}</ReactMarkdown>
                        </div>
                      </>
                    ) : (

                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-[#1d1d1d]" style={{ background: "#DFEAFD", borderBottomRightRadius: "6px" }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing dots */}
            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: "#e4ebff", borderBottomLeftRadius: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full block" style={{ background: "#94a3b8", animation: "bounceTyping 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar — centered, matching PDF */}
        <div className="flex-shrink-0 w-full px-6 pb-16 pt-8">
          <div className="mx-auto flex flex-col w-full max-w-[850px] rounded-2xl px-5 py-3 gap-2" style={{ border: "1px solid #d9d9d9", background: "#ffffff", minHeight: "56px" }}>

            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />

            {/* Preview file */}
            {selectedFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-fit" style={{ background: "#e8edf7", color: "#1a2540", border: "1px solid #c7d4f0" }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#1a2540" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span>{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="hover:opacity-60 ml-1">✕</button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message"
              rows={1}
              className="w-full bg-transparent outline-none resize-none leading-relaxed text-lg placeholder:text-[#b3b3b3] pt-0"
              style={{ color: "#4b4b4b", maxHeight: "160px" }}
            />

            {/* Graffetta e invio */}
            <div className="flex items-center justify-between">
              <button onClick={() => fileInputRef.current?.click()} className="hover:opacity-50 transition-opacity" title="Attach file">
                <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() && !selectedFile}
                className="w-10 h-10 rounded-full grid place-items-center transition-all duration-150"
                style={{ background: (inputValue.trim() || selectedFile) ? "#DFEAFD" : "#DFEAFD", color: (inputValue.trim() || selectedFile) ? "#1E1E1E" : "#1E1E1E", cursor: (inputValue.trim() || selectedFile) ? "pointer" : "default", opacity: (inputValue.trim() || selectedFile) ? 1 : 0.5 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 17V7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="m7 12 5-5 5 5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
