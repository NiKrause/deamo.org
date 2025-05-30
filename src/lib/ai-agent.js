// src/lib/ai-agent.js

export const AVAILABLE_MODELS = [
    { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', free: false },
    { id: 'anthropic/claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', free: false },
    { id: 'anthropic/claude-3-haiku-20240307', name: 'Claude 3 Haiku', free: false },
    { id: 'openai/gpt-4o', name: 'GPT-4o', free: false },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', free: false },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: true },
    { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: false },
    { id: 'google/gemini-1.0-pro', name: 'Gemini 1.0 Pro', free: true },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', free: true },
    { id: 'mistralai/mistral-large-latest', name: 'Mistral Large', free: false },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', free: true }
  ];
  
  const SYSTEM_PROMPT = `Du bist ein Experte für Argumentationsanalyse. Analysiere den folgenden Text, identifiziere alle Argumente und ihre Prämissen, und erstelle ein Mermaid-Flussdiagramm, das die Argumentationsstruktur darstellt.
  
  Verwende folgendes Format für das Mermaid-Diagramm:
  \`\`\`mermaid
  flowchart TD
    A[Hauptthese] --> B[Argument 1]
    A --> C[Argument 2]
    B --> D[Prämisse 1.1]
    B --> E[Prämisse 1.2]
    C --> F[Prämisse 2.1]
    ...
  \`\`\`
  
  Gib NUR das Mermaid-Diagramm zurück, ohne zusätzlichen Text oder Erklärungen. Generiere keine für die Kompilierung verbotene Zeichen z.B. Anführungszeichen \"\" "`;
  
  function generateFallbackDiagram(subject, content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const mainThesis = subject || 'Hauptthese';
    
    let diagram = 'flowchart TD\n';
    diagram += `  A["${mainThesis}"]\n`;
    
    const argumentLetters = ['B', 'C', 'D', 'E', 'F'];
    const premiseLetters = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    
    let argumentCount = 0;
    let premiseCount = 0;
    
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line) {
        const shortText = line.length > 50 ? line.substring(0, 47) + '...' : line;
        const letter = argumentLetters[argumentCount];
        
        diagram += `  A --> ${letter}["${shortText}"]\n`;
        
        const premiseCount1 = premiseCount++;
        const premiseCount2 = premiseCount++;
        
        if (premiseCount1 < premiseLetters.length) {
          diagram += `  ${letter} --> ${premiseLetters[premiseCount1]}["Prämisse ${i+1}.1"]\n`;
        }
        
        if (premiseCount2 < premiseLetters.length) {
          diagram += `  ${letter} --> ${premiseLetters[premiseCount2]}["Prämisse ${i+1}.2"]\n`;
        }
        
        argumentCount++;
      }
    }
    
    return diagram;
  }
  
  export async function analyzeText(apiKey, selectedModel, subject, content) {
    if (!subject || !content) {
      return { 
        mermaidMarkdown: '', 
        error: 'Bitte gib sowohl Betreff als auch Inhalt ein.' 
      };
    }
  
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'Deamo.org',
          'X-Title': 'Deamo.org'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `Betreff: ${subject}\n\nInhalt: ${content}`
            }
          ]
        })
      });
  
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
  
      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';
      
      const mermaidMatch = assistantMessage.match(/```mermaid\s*([\s\S]*?)\s*```/);
      if (mermaidMatch && mermaidMatch[1]) {
        return {
          mermaidMarkdown: mermaidMatch[1]
            .trim()
            .replace(/"/g, "'")
            .replace(/\\/g, '\\\\')
        };
      } else {
        throw new Error('Konnte kein Mermaid-Diagramm in der Antwort finden.');
      }
    } catch (error) {
      return {
        mermaidMarkdown: generateFallbackDiagram(subject, content),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }