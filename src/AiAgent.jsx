import React, { useState } from "react";

export default function AiAgent({ onAddTask, onMoveTask }) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReply("");

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      setReply(data.reply);

      // Prosty parser komend (dopasuj do swojego systemu)
      if (/dodaj zadanie (.+)/i.test(input)) {
        const taskName = input.match(/dodaj zadanie (.+)/i)[1];
        onAddTask(taskName);
      }

      if (/przenieś zadanie (.+) do kolumny (.+)/i.test(input)) {
        const [, task, column] = input.match(/przenieś zadanie (.+) do kolumny (.+)/i);
        onMoveTask(task, column.toLowerCase());
      }
    } catch (e) {
      setReply("Błąd komunikacji z AI.");
    }

    setLoading(false);
    setInput("");
  };

  return (
    <div className="p-4 border rounded my-4">
      <h3 className="mb-2 font-bold">Agent AI</h3>
      <input
        type="text"
        placeholder="Napisz polecenie (np. dodaj zadanie Test)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 w-full mb-2"
        onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
      />
      <button
        onClick={sendPrompt}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Przetwarzanie..." : "Wyślij"}
      </button>
      {reply && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <strong>Odpowiedź AI:</strong>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
}
