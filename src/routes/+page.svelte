<script>
  import { onMount } from 'svelte';
  import mermaid from 'mermaid';
  import { analyzeText, AVAILABLE_MODELS } from '$lib/ai-agent';

  let subject = '';
  let content = '';
  let mermaidMarkdown = '';
  let loading = false;
  let error = '';
  let apiKey = ''; // OpenRouter API-Schlüssel
  let selectedModel = 'anthropic/claude-3-opus-20240229';
  const models = AVAILABLE_MODELS;

  // Mermaid initialisieren und gespeicherte Daten laden
  onMount(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: false
      }
    });

    // Daten aus localStorage laden, falls vorhanden
    const savedApiKey = localStorage.getItem('deam_apiKey');
    const savedSubject = localStorage.getItem('deam_subject');
    const savedContent = localStorage.getItem('deam_content');
    const savedModel = localStorage.getItem('deam_selectedModel');
    const savedMermaidMarkdown = localStorage.getItem('deam_mermaidMarkdown');

    if (savedApiKey) apiKey = savedApiKey;
    if (savedSubject) subject = savedSubject;
    if (savedContent) content = savedContent;
    if (savedModel) selectedModel = savedModel;
    if (savedMermaidMarkdown) mermaidMarkdown = savedMermaidMarkdown;
  });

  // Daten im localStorage speichern, wenn sie sich ändern
  $: {
      if (apiKey) localStorage.setItem('deam_apiKey', apiKey);
      if (subject) localStorage.setItem('deam_subject', subject);
      if (content) localStorage.setItem('deam_content', content);
      if (selectedModel) localStorage.setItem('deam_selectedModel', selectedModel);
      if (mermaidMarkdown) localStorage.setItem('deam_mermaidMarkdown', mermaidMarkdown);
  }

  // Add these new variables
  let scale = 1;
  let initialDistance = 0;
  let currentDistance = 0;

  // Add these new variables after the existing ones
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  // Add these new functions for pinch zoom
  function handleTouchStart(event) {
    if (event.touches.length === 2) {
      initialDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
    }
  }

  function handleTouchMove(event) {
    if (event.touches.length === 2) {
      event.preventDefault();
      
      currentDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      const delta = currentDistance - initialDistance;
      const zoomFactor = 0.01;
      
      updateZoom(delta * zoomFactor);
      
      initialDistance = currentDistance;
    }
  }

  function handleTouchEnd() {
    initialDistance = 0;
    currentDistance = 0;
  }

  function handleWheel(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      const zoomFactor = -0.01;
      updateZoom(event.deltaY * zoomFactor);
    }
  }

  function updateZoom(delta) {
    scale = Math.max(0.5, Math.min(2, scale + delta));
    
    const diagramContainer = document.getElementById('mermaid-diagram');
    if (diagramContainer) {
      diagramContainer.style.transform = `scale(${scale})`;
    }
  }

  // Add these new functions for drag and drop
  function handleMouseDown(event) {
    if (event.button === 0) { // Left mouse button only
      isDragging = true;
      startX = event.clientX - translateX;
      startY = event.clientY - translateY;
      const diagramContainer = document.getElementById('mermaid-diagram');
      if (diagramContainer) {
        diagramContainer.style.cursor = 'grabbing';
      }
    }
  }

  function handleMouseMove(event) {
    if (isDragging) {
      event.preventDefault();
      translateX = event.clientX - startX;
      translateY = event.clientY - startY;
      
      const diagramContainer = document.getElementById('mermaid-diagram');
      if (diagramContainer) {
        diagramContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      }
    }
  }

  function handleMouseUp() {
    isDragging = false;
    const diagramContainer = document.getElementById('mermaid-diagram');
    if (diagramContainer) {
      diagramContainer.style.cursor = 'grab';
    }
  }

  // Modify the existing renderMermaid function to reset scale and position
  function renderMermaid() {
    if (!mermaidMarkdown) return;
    
    const element = document.getElementById('mermaid-diagram');
    if (!element) {
      console.error('Mermaid diagram element not found');
      return;
    }

    try {
      // Reset scale and position when re-rendering
      scale = 1;
      translateX = 0;
      translateY = 0;
      element.style.transform = 'translate(0, 0) scale(1)';
      element.style.cursor = 'grab';
      
      // Clear previous content
      element.innerHTML = '';
      
      // Create a new div for the diagram
      const diagramDiv = document.createElement('div');
      diagramDiv.className = 'mermaid';
      diagramDiv.textContent = mermaidMarkdown;
      element.appendChild(diagramDiv);
      
      // Initialize mermaid with the new element
      mermaid.run({
        nodes: [diagramDiv]
      });

      // Add fullscreen change listener
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    } catch (err) {
      console.error('Error rendering Mermaid diagram:', err);
      element.innerHTML = `<div class="text-red-500">Error rendering diagram: ${err.message}</div>`;
    }
  }

  // Handle fullscreen changes
  function handleFullscreenChange() {
    const diagramContainer = document.getElementById('mermaid-diagram');
    if (!diagramContainer) return;

    if (document.fullscreenElement) {
      // Entering fullscreen
      diagramContainer.classList.add('fullscreen');
      // Re-render the diagram to adjust to new size
      setTimeout(renderMermaid, 100);
    } else {
      // Exiting fullscreen
      diagramContainer.classList.remove('fullscreen');
      // Re-render the diagram to adjust to normal size
      setTimeout(renderMermaid, 100);
    }
  }

  let url = ''; // New URL input field
  let urlLoading = false; // Loading state for URL parsing

  // Modify the analyzeText function to correctly handle the Mermaid code extraction
  async function handleAnalyzeText() {
    if (!subject || !content) {
      error = 'Bitte gib sowohl Betreff als auch Inhalt ein.';
      return;
    }

    loading = true;
    error = null;

    try {
      const result = await analyzeText(apiKey, selectedModel, subject, content);
      if (result.error) {
        error = result.error;
      } else {
        mermaidMarkdown = result.mermaidMarkdown;
      }
    } catch (err) {
      error = `Fehler: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  // Funktion zum Generieren eines Beispiel-Diagramms basierend auf dem eingegebenen Text
  function generateExampleDiagram() {
    // Extrahiere Schlüsselwörter aus dem Text
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const mainThesis = subject || 'Hauptthese';
    
    // Erstelle ein Mermaid-Diagramm basierend auf dem Text
    let diagram = 'flowchart TD\n';
    diagram += `  A["${mainThesis}"]\n`;
    
    // Füge für jede nicht-leere Zeile ein Argument hinzu
    const argumentLetters = ['B', 'C', 'D', 'E', 'F'];
    const premiseLetters = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    
    let argumentCount = 0;
    let premiseCount = 0;
    
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line) {
        // Kürze den Text auf maximal 50 Zeichen
        const shortText = line.length > 50 ? line.substring(0, 47) + '...' : line;
        const letter = argumentLetters[argumentCount];
        
        // Füge das Argument hinzu
        diagram += `  A --> ${letter}["${shortText}"]\n`;
        
        // Füge 1-2 Prämissen für jedes Argument hinzu
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
    
    mermaidMarkdown = diagram;
  }

  // Beobachte Änderungen am Mermaid-Markdown und rendere das Diagramm neu
  $: if (mermaidMarkdown) {
    setTimeout(renderMermaid, 0);
  }

  function toggleFullscreen() {
    const diagramContainer = document.getElementById('mermaid-diagram');
    if (!diagramContainer) return;

    if (!document.fullscreenElement) {
      diagramContainer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
</script>

<main class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">DeAmo.org - Dezentralisierte Argumentationsmodelle</h1>
  <h2 class="text-xl font-bold mb-6">Argumentationsanalyse</h2>
  
  <div class="mb-6">
    <label for="api-key" class="block mb-2 font-medium">OpenRouter API-Schlüssel</label>
    <input
      id="api-key"
      type="password"
      bind:value={apiKey}
      class="w-full p-2 border rounded"
      placeholder="sk-or-..."
    />
    <p class="text-sm text-gray-600 mt-1">
      Benötigst du einen API-Schlüssel? Registriere dich bei <a href="https://openrouter.ai" target="_blank" class="text-blue-600 hover:underline">openrouter.ai</a>
    </p>
  </div>

  <div class="mb-6">
    <label for="model-select" class="block mb-2 font-medium">KI-Modell auswählen</label>
    <select
      id="model-select"
      bind:value={selectedModel}
      class="w-full p-2 border rounded"
    >
      {#each models as model}
        <option value={model.id}>{model.name} {model.free ? '(kostenlos)' : ''}</option>
      {/each}
    </select>
  </div>

  <!-- <div class="mb-6">
    <label for="url" class="block mb-2 font-medium">URL zum Analysieren</label>
    <div class="flex gap-2">
      <input
        id="url"
        type="url"
        bind:value={url}
        class="flex-1 p-2 border rounded"
        placeholder="https://example.com/article"
      />
      <button
        on:click={parseUrl}
        disabled={urlLoading}
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
      >
        {urlLoading ? 'Lade...' : 'URL parsen'}
      </button>
    </div>
  </div> -->

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div>
      <label for="subject" class="block mb-2 font-medium">Betreff</label>
      <input
        id="subject"
        type="text"
        bind:value={subject}
        class="w-full p-2 border rounded"
        placeholder="Gib einen Betreff ein"
      />
    </div>
  </div>

  <div class="mb-6">
    <label for="content" class="block mb-2 font-medium">Inhalt</label>
    <textarea
      id="content"
      bind:value={content}
      class="w-full p-2 border rounded h-40"
      placeholder="Gib den zu analysierenden Text ein"
    ></textarea>
  </div>

  <button
    on:click={handleAnalyzeText}
    disabled={loading}
    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 mb-6"
  >
    {loading ? 'Analysiere...' : 'Text analysieren'}
  </button>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {error}
    </div>
  {/if}

  {#if mermaidMarkdown}
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-2">Mermaid-Markdown</h2>
      <textarea
        bind:value={mermaidMarkdown}
        class="w-full p-2 border rounded h-40 font-mono"
        placeholder="Mermaid-Markdown wird hier angezeigt und kann bearbeitet werden"
        on:input={renderMermaid}
      ></textarea>
    </div>

    <div class="mb-6">
      <h2 class="text-xl font-bold mb-2">Argumentationskarte</h2>
      <div class="border p-4 rounded bg-white relative">
        <button
          on:click={toggleFullscreen}
          class="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
        <div 
          id="mermaid-diagram" 
          class="flex justify-center"
          on:mousedown={handleMouseDown}
          on:mousemove={handleMouseMove}
          on:mouseup={handleMouseUp}
          on:mouseleave={handleMouseUp}
          on:touchstart={handleTouchStart}
          on:touchmove={handleTouchMove}
          on:touchend={handleTouchEnd}
          on:wheel={handleWheel}
          style="transform-origin: center; transition: transform 0.1s ease-out; cursor: grab;"
        ></div>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    background-color: #f9fafb;
  }

  /* Add styles for fullscreen mode */
  :global(.mermaid) {
    width: 100%;
    height: 100%;
  }

  :global(#mermaid-diagram.fullscreen) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  :global(#mermaid-diagram.fullscreen .mermaid) {
    transform: scale(1.5);
    transform-origin: center;
  }

  /* Add styles for the fullscreen button */
  :global(#mermaid-diagram.fullscreen button) {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
  }

  /* Add these new styles */
  :global(#mermaid-diagram) {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    cursor: grab;
  }

  :global(#mermaid-diagram:active) {
    cursor: grabbing;
  }
</style>
