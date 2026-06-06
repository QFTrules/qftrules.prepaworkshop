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

const BanquePath = resolveBanquePath(vscode.workspace.getConfiguration('banque').get('path'));
// check if path is valid
if (!fs.existsSync(BanquePath)) {
	vscode.window.showErrorMessage('Chemin d`accès banque.path invalide.');
}

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

// find all subdirectories, WHATEVER THE DEPTH, within directory basePath that are called dirName
function findDirectories(basePath, dirName) {
    let results = [];
    const items = fs.readdirSync(basePath, { withFileTypes: true });

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

	if (!fs.existsSync(tmpPath)) {
		fs.mkdirSync(tmpPath, { recursive: true });
	}

	// find all subdirectories, WHATEVER THE DEPTH, within directory BanquePath that are called /Figures/
	const directories = findDirectories(BanquePath, 'Figures');

	try {
		const data = fs.readFileSync(exercice_sty, 'utf8');
		const cleanedData = data.replace(/\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath\{\{[\s\S]*?\}\}/g, '');
		const normalizedDirectories = directories.map(directory => toTexPath(directory));
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

	// BANQUE EXERCICES COMMANDS //
	// vscode.commands.registerCommand('banque.copy', function (document) {
	// 	// Copy the document path to the clipboard
	// 	let editor = vscode.window.activeTextEditor;
	// 	if (editor) {
	// 		// let document = editor.document;
	// 		let position = editor.selection.active;
	// 		// get name of file opened in editor
	// 		const fileName = path.basename(editor.document.fileName);
	// 		// if TD in fileName
	// 		if (fileName.includes('TD') || fileName.includes('DS') || fileName.includes('DM')) {
	// 			editor.edit(editBuilder => {
	// 				editBuilder.insert(position, '\\Ex{' + document.label.replace(/"/g, '') + '}\n');
	// 			});
	// 		} else {
	// 			if (fileName.includes('Colle')) {			
	// 				editor.edit(editBuilder => {
	// 					editBuilder.insert(position, document.label.replace(/"/g, ''));
	// 				});
	// 			} else {
	// 				editor.edit(editBuilder => {
	// 					editBuilder.insert(position, document.label.replace(/"/g, ''));
	// 				});
	// 			}
	// 		}
	// 	}
	// 	}
	// )

	// FUNCTIONS OF VIEW - ITEM - THEME //
	// copy the latex file and use it as a source in an exercise latex document (TD, ...)
	// vscode.commands.registerCommand('banque.source', function (document) {
	// 	// open the latex document in vscode
	// 	let editor = vscode.window.activeTextEditor;
	// 	if (editor) {
	// 		// let document = editor.document;
	// 		let position = editor.selection.active;
	// 		editor.edit(editBuilder => {
	// 			editBuilder.insert(position, '\\Source{' + path.basename(document.filePath) + '}\n');
	// 		});
	// 	}
	// })

	// add exercise in current latex chapter
	vscode.commands.registerCommand('banque.ajout-exercice', function (document) {
		vscode.window.showInformationMessage('Ajout d\'un exercice dans le chapitre ${document.label}');
		// open the latex document in vscode
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(document.filePath), { viewColumn: vscode.ViewColumn.One }).then(() => {
			// get the active text editor
			let editor = vscode.window.activeTextEditor;
			if (editor) {

				// name of exercise environment
				let exoenvi = 'exo';

				// latex lines with exercise environment
				const exo = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\\begin{${exoenvi}}[1][TD]{nom-exercice}\nÉnoncé\n\\begin{questions}\n\t\\item Première question.\n\t\\item Deuxième question.\n\\end{questions}\n\\end{${exoenvi}}\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n`;
				vscode.window.showInformationMessage(exo);

				// write exo at the very beginning of the file
				editor.edit(editBuilder => {
					editBuilder.insert(new vscode.Position(0, 0), exo);

					// first occurrence of string to search in the document
					var searchString = '{nom-exercice}';
					let document = editor.document;
					var text = document.getText();
					var position = text.indexOf(searchString);
					var startPosition = document.positionAt(position);
					var endPosition = document.positionAt(position + searchString.length);
					
					// select the range and reveal it in the editor
					var range = new vscode.Range(startPosition, endPosition);
					editor.selection = new vscode.Selection(range.start, range.end);
					editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
				});
			
			}
		});
	})

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

		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(doc.filePath), { viewColumn: vscode.ViewColumn.One }).then(() => {
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
	vscode.commands.registerCommand('banque.compile', function (document) {
		
		let exoenvi = 'exo';
		// string to search in the document
		const searchString = '\\begin{' + exoenvi +'}';

		// get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('Aucun éditeur actif pour compiler l\'exercice.');
			return;
		}

		// if command called from the editor
		if (document === undefined) {

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
			vscode.commands.executeCommand('banque.fetch', document);
			if (!document.filePath || !document.label) {
				vscode.window.showErrorMessage('Impossible de compiler: informations exercice manquantes.');
				return;
			}
			var exo = document.label;
			var FilePath = document.filePath;
		}

		// name of temporary latex exercise file
		const exercice_name = 'Exercice'
		const exercice = __dirname + `/tmp/${exercice_name}`;
		// insert the TEX root line at the beginning of the file
		insertLatexMagic(editor, exercice);
		// create the exercise latex file
		const template = `\\input{${toTexPath(runtimeExerciceStyPath)}}\n\\Corrige\n\\begin{document}\n\\Source{${FilePath}}\n\\Exercice{${exo}}\n\\end{document}`;
		fs.writeFileSync(exercice + '.tex', template);
		// compile and open the exercise
		vscode.commands.executeCommand('latex-workshop.build', {rootFile:FilePath, recipe:'pdflatex'}).then(() => {
			// message to show that the exercise has been compiled
			vscode.window.showInformationMessage(`Exercice « ${exo} » compilé avec succès.`);
			// open tab
			vscode.commands.executeCommand('latex-workshop.tab');
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
			var start = sourceIndex + ('\\Source{').length;
			var end = editorText.indexOf('.tex}', start);
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
			var fileName = lineText.substring(start, end);
			var folderName = 'undefined';
		}
		// hihglight the exercise in the editor
		vscode.commands.executeCommand('extension.selectCurlyBrackets', {label: exo});

		const banque_exercices = new BanqueExoShow();
		const TreeView = vscode.window.createTreeView('banque-exercices', { treeDataProvider: banque_exercices });
		const item = banque_exercices.getTreeItemByLabel(folderName,fileName,exo);
		// vscode.window.showInformationMessage(item.label);
		TreeView.reveal(item, {focus: true, select: true, expand: true});
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