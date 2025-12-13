// src/components/Chat.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";

export default function Chat({ profile, patient, onClose }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [activePatient, setActivePatient] = useState(patient || null);
  const [newChatMsg, setNewChatMsg] = useState("");

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ---------------- Fetch all conversations ----------------
  const fetchConversations = useCallback(async () => {
    if (!profile) return;

    const { data: msgs, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`receiver_id.eq.${profile.id},sender_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    if (error) return console.error(error);

    const grouped = {};
    msgs.forEach((m) => {
      const otherUser = m.sender_id === profile.id ? m.receiver_id : m.sender_id;
      if (!grouped[otherUser]) grouped[otherUser] = [];
      grouped[otherUser].push(m);
    });

    const convos = await Promise.all(
      Object.keys(grouped).map(async (uid) => {
        const { data: user } = await supabase
          .from("ridercustomer_users")
          .select("id, name")
          .eq("id", uid)
          .single();

        const list = grouped[uid];
        const last = list[0];
        const unread = list.filter(
          (msg) => msg.receiver_id === profile.id && !msg.read_status
        ).length;

        return {
          user: user || { name: "Unknown" },
          last_message: last?.message || "",
          time: last?.created_at || "",
          unread_count: unread,
        };
      })
    );

    setAllConversations(convos);

    if (!activePatient && convos.length > 0) {
      setActivePatient(convos[0].user);
    }
  }, [profile, activePatient]);

  // ---------------- Fetch messages for a patient ----------------
  const fetchMessages = useCallback(
    async (patientParam) => {
      if (!profile || !patientParam) return;

      const roomId1 = `room_staff${profile.id}_patient${patientParam.id}`;
      const roomId2 = `room_staff${patientParam.id}_patient${profile.id}`;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`room_id.eq.${roomId1},room_id.eq.${roomId2}`)
        .order("created_at", { ascending: true });

      if (error) return console.error(error);

      setChatMessages(data || []);

      const unread = (data || []).filter(
        (msg) => msg.receiver_id === profile.id && !msg.read_status
      );
      if (unread.length > 0) {
        await supabase
          .from("notifications")
          .update({ read_status: true })
          .in("id", unread.map((u) => u.id));
      }

      fetchConversations();
    },
    [profile, fetchConversations]
  );

  // ---------------- Effect: Update chat when activePatient changes ----------------
  useEffect(() => {
    if (!activePatient) return;
    fetchMessages(activePatient);

    const roomId1 = `room_staff${profile.id}_patient${activePatient.id}`;
    const roomId2 = `room_staff${activePatient.id}_patient${profile.id}`;

    const channel = supabase
      .channel(`chat_staff${profile.id}_patient${activePatient.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `or=(room_id.eq.${roomId1},room_id.eq.${roomId2})`,
        },
        () => fetchMessages(activePatient)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activePatient, profile, fetchMessages]);

  // ---------------- Auto-expand textarea ----------------
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [newChatMsg]);

  // ---------------- Auto-scroll ----------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ---------------- Send new message ----------------
  const sendChatMessage = async () => {
    if (!newChatMsg.trim() || !activePatient || !profile) return;

    const roomId = `room_staff${profile.id}_patient${activePatient.id}`;
    const messageData = {
      message: newChatMsg.trim(),
      sender_id: profile.id,
      receiver_id: activePatient.id,
      room_id: roomId,
      read_status: false,
    };

    setNewChatMsg("");
    setChatMessages((prev) => [
      ...prev,
      { ...messageData, created_at: new Date().toISOString() },
    ]);

    const { error } = await supabase.from("notifications").insert([messageData]);
    if (error) console.error("Error sending message:", error);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  if (!profile || !activePatient) return <p className="p-4 text-center">Loading chat...</p>;

  return (
    <div className="flex h-full bg-white/30 dark:bg-gray-800/40 backdrop-blur-md rounded-xl overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-3 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Messages</h3>
          <button onClick={onClose} className="text-gray-700 dark:text-gray-200 text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {allConversations.map((c) => (
            <div
              key={c.user.id}
              onClick={() => setActivePatient(c.user)}
              className={`flex items-center p-2 rounded-lg cursor-pointer ${
                activePatient?.id === c.user.id ? "bg-blue-400/40 dark:bg-blue-600/50" : "hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {c.user.name[0]}
              </div>
              <div className="ml-2 flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.user.name}</h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{c.last_message}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{c.unread_count}</span>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Main */}
      <main className="flex-1 flex flex-col">
        <div className="flex items-center p-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {activePatient.name[0]}
          </div>
          <h3 className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{activePatient.name}</h3>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {chatMessages.map((msg) => {
            const mine = msg.sender_id === profile.id;
            return (
              <div key={msg.id || Math.random()} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-xs break-words text-sm shadow-md ${
                  mine
                    ? "bg-green-400 text-white"
                    : "bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <span className="text-xs block mt-1 text-right text-gray-700 dark:text-gray-200">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <div className="flex gap-2 p-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <textarea
            ref={textareaRef}
            rows={1}
            value={newChatMsg}
            onChange={(e) => setNewChatMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-xl border border-gray-200/50 dark:border-gray-600/50 bg-white/20 dark:bg-gray-700/40 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none backdrop-blur-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
          />
          <button
            onClick={sendChatMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md transition"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
