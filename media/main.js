const vscode = acquireVsCodeApi();

const elements = {
  emptyState: document.getElementById('empty-state'),
  loading: document.getElementById('loading'),
  results: document.getElementById('results'),
  timestamp: document.getElementById('timestamp'),
  statusIndicator: document.getElementById('status-indicator'),
  sections: {
    output: document.getElementById('output-section'),
    return: document.getElementById('return-section'),
    error: document.getElementById('error-section'),
    codeProcessing: document.getElementById('code-processing-section'),
  },
  content: {
    output: document.getElementById('output-content'),
    return: document.getElementById('return-content'),
    error: document.getElementById('error-content'),
  },
  codeProcessingNotice: document.getElementById('code-processing-notice'),
};

/**
 * Updates the timestamp display
 */
function updateTimestamp() {
  elements.timestamp.textContent = new Date().toLocaleTimeString();
}

/**
 * Shows a specific state and hides others
 * @param {string} state - The state to show: 'empty', 'loading', or 'results'
 */
function showState(state) {
  const states = ['empty-state', 'loading', 'results'];
  states.forEach(s => {
    elements[s.replace('-', '')] || elements[s];
    const element = s === 'empty-state' ? elements.emptyState : elements[s];
    element.classList.toggle('hidden', s !== state);
  });

  // Show/hide status badge based on state
  elements.statusIndicator.classList.toggle('hidden', state !== 'results');

  updateTimestamp();
}

/**
 * Displays execution results
 * @param {Object} data - The execution result data
 */
function displayResults(data) {
  showState('results');

  // Reset all sections
  Object.values(elements.sections).forEach(section => section.classList.add('hidden'));

  // Clear stored code for diff view
  currentDirtyCode = '';
  currentCleanedCode = '';

  if (data.error) {
    elements.statusIndicator.textContent = 'Error';
    elements.statusIndicator.dataset.state = 'error';
    elements.content.error.textContent = data.error;
    elements.sections.error.classList.remove('hidden');
  } else if (data.result) {
    elements.statusIndicator.textContent = 'Success';
    elements.statusIndicator.dataset.state = 'success';

    // Show relevant sections based on available data
    const resultMap = {
      stdout: 'output',
      returnValue: 'return',
    };

    Object.entries(resultMap).forEach(([key, section]) => {
      if (data.result[key]) {
        elements.content[section].textContent = data.result[key];
        elements.sections[section].classList.remove('hidden');
      }
    });

    // Show code processing section if dirty and cleaned code are available
    if (data.result.dirty && data.result.cleaned) {
      // Store the code for diff view
      currentDirtyCode = data.result.dirty;
      currentCleanedCode = data.result.cleaned;

      elements.sections.codeProcessing.classList.remove('hidden');
    }
  }
}

window.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'executionStarted':
      showState('loading');
      break;
    case 'executionResult':
      displayResults(data);
      break;
  }
});

// Store current dirty and cleaned code for diff view
let currentDirtyCode = '';
let currentCleanedCode = '';

/**
 * Opens the native VS Code diff editor
 */
function openDiffEditor() {
  if (currentDirtyCode && currentCleanedCode) {
    // Provide user feedback
    const notice = elements.codeProcessingNotice;
    const originalText = notice.innerHTML;

    notice.innerHTML = '<span class="code-processing-text">⏳ Opening diff editor...</span>';
    notice.style.cursor = 'wait';

    vscode.postMessage({
      type: 'showDiff',
      dirty: currentDirtyCode,
      cleaned: currentCleanedCode,
    });

    // Reset notice after a short delay
    setTimeout(() => {
      notice.innerHTML = originalText;
      notice.style.cursor = 'pointer';
    }, 1000);
  }
}

// Add event listeners for code processing notice
elements.codeProcessingNotice.addEventListener('click', openDiffEditor);

updateTimestamp();
