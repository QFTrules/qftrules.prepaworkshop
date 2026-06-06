// IMPORTS //
var vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const BanqueExoShow = require('./banque');
// ---------------------------------- //

// PATHS //
const templatePath = path.join(__dirname, 'templates');
const tmpPath = path.join(__dirname, 'tmp');
let runtimeExerciceStyPath = path.join(templatePath, 'exercice.sty');
function resolveBanquePath(rawPath) {
	if (!rawPath || rawPath === '/recueil/') {
		return path.join(__dirname, 'recueil');
	}

	return path.resolve(rawPath);
}

function isValidBanquePath(targetPath) {
	return fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();
}

const BanquePath = resolveBanquePath(vscode.workspace.getConfiguration('banque').get('path'));

// // ---------------------------------- //
// // GLOBAL STORAGE PATH //
// const globalStoragePath = vscode.workspace.getConfiguration('banque').get('globalStoragePath') || vscode.Uri.joinPath(vscode.env.globalStorageUri, 'banque').fsPath;

// // Ensure the directory exists
// if (!fs.existsSync(globalStoragePath)) {
// 	fs.mkdirSync(globalStoragePath, { recursive: true });
// }

// // BACKUP MODIFIED FILES //
// const backupPath = vscode.Uri.joinPath(vscode.env.globalStorageUri, 'backup').fsPath;

// // Ensure the backup directory exists
// if (!fs.existsSync(backupPath)) {
// 	fs.mkdirSync(backupPath, { recursive: true });
// }

// // Function to backup files
// function backup(filePath) {
// 	const fileName = path.basename(filePath);
// 	const backupFilePath = path.join(backupPath, fileName);

// 	// Check if the file has been modified
// 	if (fs.existsSync(filePath)) {
// 		const originalContent = fs.readFileSync(filePath, 'utf8');
// 		const backupContent = fs.existsSync(backupFilePath) ? fs.readFileSync(backupFilePath, 'utf8') : null;

// 		if (originalContent !== backupContent) {
// 			fs.writeFileSync(backupFilePath, originalContent);
// 		}
// 	}
// }


// AUXILIARY FUNCTIONS //

function toTexPath(filePath) {
	return filePath.replace(/\\/g, '/');
}

function hashString(value) {
	let hash = 0;
	for (let index = 0; index < value.length; index++) {
		hash = ((hash << 5) - hash) + value.charCodeAt(index);
		hash |= 0;
	}
	return Math.abs(hash).toString(16);
}

function buildTempExerciseBasePath(filePath, exo) {
	const sourceBaseName = path.parse(filePath).name;
	const safeExoName = exo.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'exercise';
	const suffix = hashString(`${filePath}::${exo}`);
	return path.join(tmpPath, `Exercice_${sourceBaseName}_${safeExoName}_${suffix}`);
}

function resolveLatexOutDir(rootFilePath) {
	const rootFileUri = vscode.Uri.file(rootFilePath);
	const rawOutDir = vscode.workspace.getConfiguration('latex-workshop', rootFileUri).get('latex.outDir');
	const rootDir = path.dirname(rootFilePath);
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(rootFileUri);
	const workspaceFolderPath = workspaceFolder ? workspaceFolder.uri.fsPath : rootDir;
	const parsedRootFile = path.parse(rootFilePath);

	if (typeof rawOutDir !== 'string' || rawOutDir.trim() === '') {
		return rootDir;
	}

	const resolvedOutDir = rawOutDir
		.replace(/%DIR%/g, rootDir)
		.replace(/%WORKSPACE_FOLDER%/g, workspaceFolderPath)
		.replace(/%DOC%/g, parsedRootFile.name)
		.replace(/%DOCFILE%/g, parsedRootFile.base)
		.replace(/%TMPDIR%/g, tmpPath);

	return path.isAbsolute(resolvedOutDir)
		? resolvedOutDir
		: path.resolve(rootDir, resolvedOutDir);
}

function delay(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForPdf(rootFilePath, attempts = 10, delayMs = 150) {
	const parsedRootFile = path.parse(rootFilePath);
	const candidatePaths = [
		path.join(path.dirname(rootFilePath), `${parsedRootFile.name}.pdf`),
		path.join(resolveLatexOutDir(rootFilePath), `${parsedRootFile.name}.pdf`),
	];

	for (let attempt = 0; attempt < attempts; attempt++) {
		for (const candidatePath of candidatePaths) {
			if (fs.existsSync(candidatePath)) {
				return candidatePath;
			}
		}

		await delay(delayMs);
	}

	return undefined;
}

async function openPdfInSecondColumn(pdfPath) {
	const pdfUri = vscode.Uri.file(pdfPath);
	const secondGroup = vscode.window.tabGroups.all.find(group => group.viewColumn === vscode.ViewColumn.Two);

	if (secondGroup) {
		const existingPdfTabs = secondGroup.tabs.filter(tab => tab.input && tab.input.uri && tab.input.uri.fsPath.startsWith(tmpPath) && tab.input.uri.fsPath.endsWith('.pdf'));
		if (existingPdfTabs.length > 0) {
			await vscode.window.tabGroups.close(existingPdfTabs, true);
		}
	}

	return vscode.commands.executeCommand('vscode.open', pdfUri, {
		viewColumn: vscode.ViewColumn.Two,
		preview: false,
		preserveFocus: false,
	});
}

async function ensureBuildEditor(rootFilePath) {
	if (vscode.window.activeTextEditor) {
		return undefined;
	}

	const document = await vscode.workspace.openTextDocument(vscode.Uri.file(rootFilePath));
	await vscode.window.showTextDocument(document, {
		viewColumn: vscode.ViewColumn.One,
		preview: true,
		preserveFocus: false,
	});

	return rootFilePath;
}

async function closeTabByPath(filePath) {
	for (const group of vscode.window.tabGroups.all) {
		const tab = group.tabs.find(candidate => candidate.input && candidate.input.uri && candidate.input.uri.fsPath === filePath);
		if (tab) {
			await vscode.window.tabGroups.close(tab, true);
			return;
		}
	}
}

// find all subdirectories, WHATEVER THE DEPTH, within directory basePath that are called dirName
function findDirectories(basePath, dirName) {
    let results = [];
	let items = [];

	try {
		items = fs.readdirSync(basePath, { withFileTypes: true });
	} catch (error) {
		return results;
	}

    for (const item of items) {
        if (item.isDirectory()) {
			const fullPath = path.join(basePath, item.name);
			if (item.name.includes(dirName)) {
				results.push(fullPath);
			}
            results = results.concat(findDirectories(fullPath, dirName));
        }
    }

    return results;
}

// insert the TEX root line at the beginning of the file
function insertLatexMagic(editor, rootFile) {
	// get text of the active editor
	const editorText = editor.document.getText();
	// define latex magic line
	const latex_magic = `% !TEX root = ${rootFile}.tex`;
	// add this line if not present at the beginning of the file
	if (editorText.includes(`% !TEX root `)) {
		editor.edit(editBuilder => {
			// get line number that contains the magic line
			const lineIndex = editorText.indexOf(latex_magic);
			const line = editor.document.lineAt(editor.document.positionAt(lineIndex).line);
			// delete the line
			editBuilder.delete(line.range);
			// insert the magic line at the beginning of the file
		}).then(() => {
			editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0, 0), latex_magic);
			});
		}
		);
	}  else {
		editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(0, 0), latex_magic);
		});
	}
}

// update the graphics path in exercice.sty
function update_graphics_path() {
	const exercice_sty = path.join(templatePath, 'exercice.sty');
	const generated_exercice_sty = path.join(tmpPath, 'exercice.generated.sty');

	if (!isValidBanquePath(BanquePath)) {
		vscode.window.showWarningMessage('Chemin d`accès banque.path invalide. Utilisation du template exercice.sty par défaut.');
		return exercice_sty;
	}

	if (!fs.existsSync(tmpPath)) {
		fs.mkdirSync(tmpPath, { recursive: true });
	}

	// find all subdirectories, WHATEVER THE DEPTH, within directory BanquePath that are called /Figures/
	const directories = findDirectories(BanquePath, 'Figures');

	try {
		const data = fs.readFileSync(exercice_sty, 'utf8');
		const cleanedData = data.replace(/\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath\{\{[\s\S]*?\}\}/g, '');
		const normalizedDirectories = directories.map(directory => {
			const normalizedDirectory = toTexPath(directory);
			return normalizedDirectory.endsWith('/') ? normalizedDirectory : `${normalizedDirectory}/`;
		});
		const graphicsPathLine = normalizedDirectories.length > 0
			? `\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath{{${normalizedDirectories.join('}{')}}}`
			: '';

		fs.writeFileSync(generated_exercice_sty, cleanedData + graphicsPathLine);
		return generated_exercice_sty;
	} catch (error) {
		vscode.window.showWarningMessage('Impossible de générer exercice.sty dynamique, utilisation du template par défaut.');
		return exercice_sty;
	}
}

// ---------------------------------- //

/**
 * @param {vscode.ExtensionContext} context
*/

// ACTIVATE FUNCTION //

function activate() {
	console.log('The extension "prepa-workshop" is now active!');
	runtimeExerciceStyPath = update_graphics_path();
	const banqueProvider = new BanqueExoShow();
	const banqueTreeView = vscode.window.createTreeView('banque-exercices', { treeDataProvider: banqueProvider });

	function insertExerciseTemplate(document) {
		if (!document || !document.filePath) {
			vscode.window.showErrorMessage('Impossible d\'ajouter un exercice: chapitre introuvable.');
			return;
		}

		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(document.filePath), { viewColumn: vscode.ViewColumn.One }).then(() => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const exoenvi = 'exo';
			const exo = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\\begin{${exoenvi}}[1][TD]{nom-exercice}\nÉnoncé\n\\begin{questions}\n\t\\item Première question.\n\t\\item Deuxième question.\n\\end{questions}\n\\end{${exoenvi}}\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n`;

			editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0, 0), exo);

				const searchString = '{nom-exercice}';
				const openedDocument = editor.document;
				const text = openedDocument.getText();
				const position = text.indexOf(searchString);
				if (position < 0) {
					return;
				}

				const startPosition = openedDocument.positionAt(position);
				const endPosition = openedDocument.positionAt(position + searchString.length);
				const range = new vscode.Range(startPosition, endPosition);
				editor.selection = new vscode.Selection(range.start, range.end);
				editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
			});
		});
	}

	// BANQUE EXERCICES COMMANDS //
	// Commandes conservées en commentaire pour réactivation ultérieure.
	// vscode.commands.registerCommand('banque.copy', function (document) {
	// 	if (!document || !document.label) {
	// 		return;
	// 	}

	// 	const editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		vscode.window.showErrorMessage('Aucun éditeur actif pour copier l\'exercice.');
	// 		return;
	// 	}

	// 	const position = editor.selection.active;
	// 	editor.edit(editBuilder => {
	// 		editBuilder.insert(position, '\\Ex{' + String(document.label).replace(/"/g, '') + '}\n');
	// 	});
	// });

	// FUNCTIONS OF VIEW - ITEM - THEME //
	// vscode.commands.registerCommand('banque.source', function (document) {
	// 	if (!document || !document.filePath) {
	// 		return;
	// 	}

	// 	const editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		vscode.window.showErrorMessage('Aucun éditeur actif pour insérer la source.');
	// 		return;
	// 	}

	// 	const position = editor.selection.active;
	// 	editor.edit(editBuilder => {
	// 		editBuilder.insert(position, '\\Source{' + path.basename(document.filePath) + '}\n');
	// 	});
	// });

	vscode.commands.registerCommand('banque.folder', async function (document) {
		if (!document || !document.filePath) {
			return;
		}

		await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(document.filePath));
	});

	// add exercise in current latex chapter
	vscode.commands.registerCommand('banque.ajout-exercice', function (document) {
		insertExerciseTemplate(document);
	});

	vscode.commands.registerCommand('banque.addexo', function (document) {
		insertExerciseTemplate(document);
	});

	// open the latex file containing exercises in vscode
	vscode.commands.registerCommand('banque.open', function (document) {
		// open the latex document in vscode
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(document.filePath), { viewColumn: vscode.ViewColumn.One });
	})

	// FUNCTIONS OF VIEW - TITLE //
	// refresh the tree view of banque exercices
	vscode.commands.registerCommand('banque.refresh', () => {
		// save current files opened in editor, then register banque d'exercices tree view
		vscode.commands.executeCommand('workbench.action.files.saveAll').then(() => {
			banqueProvider.refresh();
		});
	});

	// collapse all items in the tree view
	vscode.commands.registerCommand('banque.collapse', () => {
		vscode.commands.executeCommand("workbench.actions.treeView.banque-exercices.collapseAll");
	});

	// FUNCTIONS OF VIEW - ITEM - EXERCICE //
	// fetch a string in a latex file, like exercise name of balise
	vscode.commands.registerCommand('banque.fetch', function (doc) {
		if (!doc || !doc.filePath || !doc.label) {
			vscode.window.showErrorMessage('Impossible d\'ouvrir cet exercice: informations manquantes.');
			return;
		}

		return vscode.commands.executeCommand('vscode.open', vscode.Uri.file(doc.filePath), { viewColumn: vscode.ViewColumn.One }).then(() => {
			// Get the active text editor and string to search
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Aucun éditeur actif pour rechercher l\'exercice.');
				return;
			}

			// first occurrence of string to search in the document
			var searchString = '{' + doc.label + '}';
			let document = editor.document;
			var text = document.getText();
			var position = text.indexOf(searchString);

			if (position < 0) {
				vscode.window.showErrorMessage(`Exercice « ${doc.label} » introuvable dans ce fichier.`);
				return;
			}

			while (position >= 0) {
				const startPosition = document.positionAt(position);
				const endPosition = document.positionAt(position + searchString.length);
				const line = document.lineAt(startPosition.line).text;

				if (line.includes('{exo}')) {
					const range = new vscode.Range(startPosition, endPosition);
					editor.selection = new vscode.Selection(range.start, range.end);
					editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
					return;
				}

				position = text.indexOf(searchString, position + searchString.length);
			}

			vscode.window.showErrorMessage(`Exercice « ${doc.label} » trouvé, mais pas dans un environnement exo.`);
		});
	})
	
	// FUNCTIONS OF VIEW - ITEM - EXERCICE INLINE //
	// command to compile an exercise separately
	vscode.commands.registerCommand('banque.compile', async function (document) {
		
		let exoenvi = 'exo';
		// string to search in the document
		const searchString = '\\begin{' + exoenvi +'}';

		// get the active text editor
		let editor = vscode.window.activeTextEditor;

		// if command called from the editor
		if (document === undefined) {
			if (!editor) {
				vscode.window.showErrorMessage('Aucun éditeur actif pour compiler l\'exercice.');
				return;
			}

			// declare the cursorPosition variable
			const cursorPosition = editor.selection.active;
			// find the first line before the cursor position that contains the string '\begin{exo}'
			let lineNumber = cursorPosition.line;
			let lineText = editor.document.lineAt(lineNumber).text;
			while (lineNumber >= 0 && !lineText.includes(searchString)) {
				lineNumber--;
				if (lineNumber >= 0) {
					lineText = editor.document.lineAt(lineNumber).text;
				}
			}
			if (lineNumber < 0) {
				vscode.window.showErrorMessage('Le curseur ne se trouve pas dans un environnement exo.');
				return;
			}
			// get second { character in line
			const start = lineText.indexOf('{', lineText.indexOf('{') + 1) + 1;
			// get last } caracter in line in case {} characters are present in exo title
			const end = lineText.lastIndexOf('}');
			if (start <= 0 || end <= start) {
				vscode.window.showErrorMessage('Format d\'en-tête exo invalide sur la ligne sélectionnée.');
				return;
			}
			var exo = lineText.substring(start, end);
			var FilePath = editor.document.fileName;
		} else {// command called from the explorer context menu
			if (!document.filePath || !document.label) {
				vscode.window.showErrorMessage('Impossible de compiler: informations exercice manquantes.');
				return;
			}
			await vscode.commands.executeCommand('banque.fetch', document);
			editor = vscode.window.activeTextEditor;
			var exo = document.label;
			var FilePath = document.filePath;
		}

		// name of temporary latex exercise file
		const exercice = buildTempExerciseBasePath(FilePath, exo);
		const exerciceTexPath = exercice + '.tex';
		if (!fs.existsSync(tmpPath)) {
			fs.mkdirSync(tmpPath, { recursive: true });
		}

		// insert the TEX root line at the beginning of the file only when called from an editor
		if (document === undefined && editor) {
			insertLatexMagic(editor, exercice);
		}
		// create the exercise latex file
		const template = `\\input{${toTexPath(runtimeExerciceStyPath)}}\n\\Corrige\n\\begin{document}\n\\Source{${toTexPath(FilePath)}}\n\\Exercice{${exo}}\n\\end{document}`;
		fs.writeFileSync(exerciceTexPath, template);
		// compile and open the exercise
		const temporaryEditorPath = await ensureBuildEditor(exerciceTexPath);

		vscode.commands.executeCommand('latex-workshop.build', false, exerciceTexPath, 'latex', 'pdflatex').then(async () => {
			const pdfPath = await waitForPdf(exerciceTexPath);

			if (!pdfPath) {
				if (temporaryEditorPath) {
					await closeTabByPath(temporaryEditorPath);
				}
				vscode.window.showWarningMessage(`Compilation terminée, mais le PDF de l'exercice « ${exo} » est introuvable.`);
				return;
			}

			// message to show that the exercise has been compiled
			vscode.window.showInformationMessage(`Exercice « ${exo} » compilé avec succès.`);
			if (temporaryEditorPath) {
				await closeTabByPath(temporaryEditorPath);
			}
			await openPdfInSecondColumn(pdfPath);
		});
		
	});

	// FUNCTIONS ONLY USED AS KEYBINDINGS //
	// command to reveal an exercise of a latex file in the tree view
	vscode.commands.registerCommand('banque.reveal', function () {
		
		// get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
	
		// get label of exercise from current mouse position
		const cursorPosition = editor.selection.active;
		const editorText = editor.document.getText();
		// find the first line before the cursor position that contains the string '\begin{exo}'
		let lineNumber = cursorPosition.line;
		let lineText = editor.document.lineAt(lineNumber).text;
		
		// get document filename and folder name 
		if (lineText.includes('begin{Exocolle}') || editorText.includes('\\Source')) { // Source
			// exo
			var startexo = lineText.indexOf('{', lineText.indexOf('{') + 1) + 1;
			var endexo = lineText.lastIndexOf('}');
			var exo = lineText.substring(startexo, endexo);
			// fileName
			const sourceIndex = editorText.indexOf('\\Source{');
			if (sourceIndex < 0) {
				vscode.window.showErrorMessage('Commande \\Source introuvable dans le document courant.');
				return;
			}
			var start = sourceIndex + ('\\Source{').length;
			var end = editorText.indexOf('.tex}', start);
			if (end < 0) {
				vscode.window.showErrorMessage('Format de \\Source invalide (suffixe .tex manquant).');
				return;
			}
			var fileName = editorText.substring(start, end);
			var folderName = 'undefined';
		}
		else { // Source en argument de \Ex[]{}
			// exo 
			var startexo = lineText.indexOf('{') + 1;
			var endexo = lineText.lastIndexOf('}');
			var exo = lineText.substring(startexo, endexo);
			// fileName
			var start = lineText.indexOf('[') +1;
			var end = lineText.indexOf(']');
			if (start <= 0 || end <= start) {
				vscode.window.showErrorMessage('Format de la source dans \\Ex[] invalide.');
				return;
			}
			var fileName = lineText.substring(start, end);
			var folderName = 'undefined';
		}
		// hihglight the exercise in the editor
		vscode.commands.executeCommand('extension.selectCurlyBrackets', {label: exo});

		const item = banqueProvider.getTreeItemByLabel(folderName,fileName,exo);
		if (!item) {
			vscode.window.showErrorMessage(`Exercice « ${exo} » introuvable dans la banque.`);
			return;
		}
		banqueTreeView.reveal(item, {focus: true, select: true, expand: true});
	});

	// COMMANDS AT LAUNCH //
	vscode.window.registerTreeDataProvider('banque-exercices', banqueProvider)


}

// This method is called when your extension is deactivated
function deactivate() {}

	
// export modules
module.exports = {
	activate,
	deactivate
}