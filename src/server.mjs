import express from "express";
import cors from "cors";
import Replicate from "replicate";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Inicjalizacja Replicate z tokenem z env
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/api/chat", async (req, res) => {
  const userPrompt = req.body.prompt;

  // Prompt systemowy - uniwersalny, obsługuje wiele tasków
  const systemInstruction = `
Jesteś asystentem zarządzania zadaniami. Odpowiadaj wyłącznie w formacie JSON:

{
  "add_tasks": ["nazwa zadania 1", "nazwa zadania 2"],
  "move_tasks": [
    {
      "task": "nazwa zadania",
      "column": "todo|doing|done"
    }
  ]
}

Instrukcje dla Ciebie:
1. Dodaj wszystkie nowe zadania, które użytkownik chce utworzyć, do tablicy "add_tasks".
2. Dodaj wszystkie istniejące zadania, które użytkownik chce przesunąć, do tablicy "move_tasks".
3. Mapuj polskie kolumny na angielskie:
   - "pierwsza" → "todo"
   - "druga" → "doing"
   - "trzecia" → "done"
4. Jeśli brak akcji, zwróć pusty JSON: { "add_tasks": [], "move_tasks": [] }.
5. Nigdy nie dodawaj tekstu obok JSON – odpowiedź musi być czysty JSON.
6. Przykład:
   Input: "Dodaj zadania 'Kup mleko' i 'Zadzwoń do klienta', przenieś 'Napisz raport' do kolumny drugiej"
   Output:
   {
     "add_tasks": ["Kup mleko", "Zadzwoń do klienta"],
     "move_tasks": [
       {"task": "Napisz raport", "column": "doing"}
     ]
   }
`;

  const fullPrompt = systemInstruction + "\n\n" + userPrompt;

  try {
    const output = await replicate.run("openai/gpt-5-nano", {
      input: { prompt: fullPrompt },
    });

    // Jeśli output to tablica, łączymy w string
    const text = Array.isArray(output) ? output.join("") : output;

    // Parsujemy JSON z odpowiedzi AI
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) json = JSON.parse(match[0]);
      else json = { add_tasks: [], move_tasks: [] };
    }

    // Upewniamy się, że mamy tablice
    json.add_tasks = Array.isArray(json.add_tasks) ? json.add_tasks : [];
    json.move_tasks = Array.isArray(json.move_tasks) ? json.move_tasks : [];

    res.json({ reply: text, commands: json });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd komunikacji z AI" });
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server działa na http://localhost:${port}`);
});