import React, { useState, useRef } from "react";

function AiAgent({ onAddTask, onMoveTask }) {
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

      const commands = data.commands;

      // Dodaj wszystkie taski
      if (commands.add_tasks && commands.add_tasks.length) {
        commands.add_tasks.forEach((task) => onAddTask(task));
      }

      // Przesuń wszystkie taski
      if (commands.move_tasks && commands.move_tasks.length) {
        commands.move_tasks.forEach(({ task, column }) => {
          if (task && column) onMoveTask(task, column.toLowerCase());
        });
      }
    } catch {
      setReply("Błąd komunikacji z AI.");
    }

    setLoading(false);
    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
      <h3>Agent AI</h3>
      <input
        type="text"
        placeholder="Napisz polecenie (np. dodaj 2 taski i przesuń Task 1)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />
      <button onClick={sendPrompt} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
        {loading ? "Przetwarzanie..." : "Wyślij"}
      </button>
      {reply && (
        <div style={{ marginTop: "1rem", backgroundColor: "#f0f0f0", padding: "0.5rem", whiteSpace: "pre-wrap" }}>
          <b>Odpowiedź AI (raw):</b> <br />
          {reply}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [columns, setColumns] = useState({
    todo: ["📝 Task 1", "📝 Task 2"],
    doing: ["⚙️ Task 3", "⚙️ Task 4"],
    done: ["✅ Task 5"],
  });

  const taskCounter = useRef(6);

  const addTask = (taskName) => {
    const newTask = `🆕 ${taskName} (#${taskCounter.current++})`;
    setColumns((prev) => ({
      ...prev,
      todo: [...prev.todo, newTask],
    }));
  };

const moveTask = (taskName, toColumn) => {
  setColumns((prev) => {
    const newCols = {};
    let taskFound = null;

    // Usuń task z obecnej kolumny i zapamiętaj jego pełną nazwę
    Object.entries(prev).forEach(([key, tasks]) => {
      const filtered = tasks.filter((t) => {
        if (t.includes(taskName)) {
          taskFound = t;
          return false; // usuń task
        }
        return true;
      });
      newCols[key] = filtered;
    });

    if (taskFound) {
      // Dodaj task do docelowej kolumny bez zmiany ikonki
      if (!newCols[toColumn]) newCols[toColumn] = [];
      newCols[toColumn].push(taskFound);
    }

    return newCols;
  });
};


  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Kanban + Agent AI</h1>
      <AiAgent onAddTask={addTask} onMoveTask={moveTask} />

      <div style={{ display: "flex", gap: "1rem" }}>
        {Object.entries(columns).map(([colKey, tasks]) => (
          <div
            key={colKey}
            style={{
              flex: 1,
              background: "#eee",
              padding: "1rem",
              borderRadius: "6px",
              minHeight: "200px",
            }}
          >
            <h2 style={{ textTransform: "uppercase" }}>{colKey}</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {tasks.map((task, idx) => (
                <li
                  key={idx}
                  style={{
                    background: "white",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    borderRadius: "4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
