const vscode = require('vscode');

class BanqueSearchViewProvider {
	constructor(banqueProvider) {
		this.banqueProvider = banqueProvider;
		this._view = undefined;
	}

	resolveWebviewView(webviewView, context, _token) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true
		};
		webviewView.webview.html = this.getHtmlContent();
		this.setWebviewMessageListener(webviewView.webview);
	}

	setWebviewMessageListener(webview) {
		webview.onDidReceiveMessage((message) => {
			console.log('[BanqueSearch] Received message:', message.type);
			if (message.type === 'search') {
				vscode.commands.executeCommand('banque.search.fromWebview', message.query);
			}
		});
	}

	showNoResults() {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'showNoResults'
			});
		}
	}

	showResultsMessage(message) {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'showResultsMessage',
				message: message
			});
		}
	}

	clearNoResults() {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'clearNoResults'
			});
		}
	}

	getHtmlContent() {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Recherche Banque d'Exercices</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		html {
			overflow: visible;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
			background-color: var(--vscode-sideBar-background);
			color: var(--vscode-editor-foreground);
			font-size: 13px;
			padding: 8px;
			overflow: visible;
		}

		.search-container {
			display: flex;
			align-items: center;
			gap: 8px;
			overflow: visible;
		}

		.search-input {
			flex: 1;
			padding: 6px 8px;
			border: 1px solid var(--vscode-input-border, #555);
			border-radius: 2px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			font-size: 13px;
		}

		.search-input::placeholder {
			color: var(--vscode-input-placeholderForeground);
		}

		.search-input:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
			box-shadow: 0 0 0 1px var(--vscode-focusBorder);
		}

		.clear-btn {
			padding: 4px 4px;
			border: 1px solid transparent;
			background-color: transparent;
			color: var(--vscode-icon-foreground);
			cursor: pointer;
			border-radius: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
		}

		.clear-btn:hover {
			background-color: var(--vscode-toolbar-hoverBackground);
		}

		#clearTooltip {
			position: fixed;
			background-color: var(--vscode-editorHoverWidget-background);
			color: var(--vscode-editorHoverWidget-foreground);
			padding: 4px 8px;
			border-radius: 2px;
			font-size: 12px;
			white-space: nowrap;
			z-index: 10000;
			border: 1px solid var(--vscode-editorHoverWidget-border);
			display: none;
			pointer-events: none;
		}

		.no-results-message {
			color: var(--vscode-descriptionForeground);
			font-size: 13px;
			padding: 6px 8px;
			text-align: left;
			display: none;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
		}
	</style>
</head>
<body>
	<div class="search-container">
		<input
			type="text"
			id="searchInput"
			class="search-input"
			placeholder="Filtrer"
		/>
		<button id="clearBtn" class="clear-btn" data-tooltip="Effacer">✕</button>
	</div>
	<div id="noResultsMessage" class="no-results-message">
		Aucun exercice trouvé
	</div>
	<div id="clearTooltip"></div>

	<script>
		const vscode = acquireVsCodeApi();
		const searchInput = document.getElementById('searchInput');
		const clearBtn = document.getElementById('clearBtn');
		let searchTimeout;

		// Handle search input
		searchInput.addEventListener('input', (e) => {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				console.log('[SearchView] Input:', e.target.value);
				vscode.postMessage({
					type: 'search',
					query: e.target.value
				});
			}, 300);
		});

		// Handle clear button
		clearBtn.addEventListener('click', () => {
			searchInput.value = '';
			vscode.postMessage({
				type: 'search',
				query: ''
			});
		});

		// Tooltip for clear button
		const tooltip = document.getElementById('clearTooltip');
		let tooltipTimeout;

		clearBtn.addEventListener('mouseenter', () => {
			tooltipTimeout = setTimeout(() => {
				const rect = clearBtn.getBoundingClientRect();
				tooltip.textContent = clearBtn.getAttribute('data-tooltip');
				tooltip.style.left = (rect.left + rect.width / 2) + 'px';
				tooltip.style.top = (rect.bottom + 8) + 'px';
				tooltip.style.transform = 'translateX(-50%)';
				tooltip.style.display = 'block';
			}, 1000);
		});

		clearBtn.addEventListener('mouseleave', () => {
			clearTimeout(tooltipTimeout);
			tooltip.style.display = 'none';
		});

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;
			const resultsDisplay = document.getElementById('noResultsMessage');

			if (message.type === 'showNoResults') {
				resultsDisplay.textContent = 'Aucun exercice trouvé';
				resultsDisplay.style.display = 'block';
			} else if (message.type === 'showResultsMessage') {
				resultsDisplay.textContent = message.message;
				resultsDisplay.style.display = 'block';
			} else if (message.type === 'clearNoResults') {
				resultsDisplay.style.display = 'none';
			}
		});

		// Focus on search input
		setTimeout(() => {
			searchInput.focus();
		}, 100);
	</script>
</body>
</html>`;
	}
}

module.exports = BanqueSearchViewProvider;
