// IMPORTS //
var vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const BanqueExoShow = require('./banque');
// ---------------------------------- //

// PATHS //
const templatePath = __dirname + '/templates'; 
var BanquePath = vscode.workspace.getConfiguration('banque').get('path');
// add absolute path of extension if value is default /recueil/
if (BanquePath === '/recueil/') {
	var BanquePath = __dirname + '/recueil/';
}
// ---------------------------------- //

// AUXILIARY FUNCTIONS //

// find all subdirectories, WHATEVER THE DEPTH, within directory basePath that are called dirName
function findDirectories(basePath, dirName) {
    let results = [];
    const items = fs.readdirSync(basePath, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
			var fullPath = basePath + item.name + '/';
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
	// find all subdirectories, WHATEVER THE DEPTH, within directory BanquePath that are called /Figures/
	const directories = findDirectories(BanquePath, 'Figures');
	// vscode.window.showInformationMessage(directories.toString());

	// latex line to add (string)
	const graphics_path = '\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath{{' + directories.join('}{') + '}}';
	// latex path to exercice.sty
	const exercice_sty = templatePath + '/exercice.sty';
	// read the file
	const data = fs.readFileSync(exercice_sty, 'utf8');
	// remove the command \\graphicspath if present
	if (data.includes('\\graphicspath')) {
		// remove the line
		const newData = data.replace(/\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath{.*}/, '');
		// write the new data
		fs.writeFileSync(exercice_sty, newData);
	}
	// add the line graphics_path
	fs.appendFileSync(exercice_sty, graphics_path);
}

// ---------------------------------- //

/**
 * @param {vscode.ExtensionContext} context
*/

// ACTIVATE FUNCTION //

function activate() {
	console.log('The extension "prepa-workshop" is now active!');

	// BANQUE EXERCICES COMMANDS //
	vscode.commands.registerCommand('banque.copy', function (document) {
		// Copy the document path to the clipboard
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			// let document = editor.document;
			let position = editor.selection.active;
			// get name of file opened in editor
			const fileName = path.basename(editor.document.fileName);
			// if TD in fileName
			if (fileName.includes('TD') || fileName.includes('DS') || fileName.includes('DM')) {
				editor.edit(editBuilder => {
					editBuilder.insert(position, '\\Ex{' + document.label.replace(/"/g, '') + '}\n');
				});
			} else {
				if (fileName.includes('Colle')) {			
					editor.edit(editBuilder => {
						editBuilder.insert(position, document.label.replace(/"/g, ''));
					});
				} else {
					editor.edit(editBuilder => {
						editBuilder.insert(position, document.label.replace(/"/g, ''));
					});
				}
			}
		}
		}
	)

	// FUNCTIONS OF VIEW - ITEM - THEME //
	// copy the latex file and use it as a source in an exercise latex document (TD, ...)
	vscode.commands.registerCommand('banque.source', function (document) {
		// open the latex document in vscode
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			// let document = editor.document;
			let position = editor.selection.active;
			editor.edit(editBuilder => {
				editBuilder.insert(position, '\\Source{' + path.basename(document.filePath) + '}\n');
			});
		}
	})

	// open the latex file containing exercises in vscode
	vscode.commands.registerCommand('banque.open', function (document) {
		// open the latex document in vscode
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(document.filePath), { viewColumn: vscode.ViewColumn.One });
	})

	// FUNCTIONS OF VIEW - TITLE //
	// refresh the tree view of banque exercices
	vscode.commands.registerCommand('banque.refresh', () => {
		// save current files opened in editor
		vscode.commands.executeCommand('workbench.action.files.saveAll').then(() => {
		vscode.window.registerTreeDataProvider('banque-exercices', new BanqueExoShow());
		});
		// vscode.commands.executeCommand("workbench.actions.treeView.banque-exercices.refresh");
	});

	// collapse all items in the tree view
	vscode.commands.registerCommand('banque.collapse', () => {
		vscode.commands.executeCommand("workbench.actions.treeView.banque-exercices.collapseAll");
		// const banque_exercices = new BanqueExoShow(collapsedState = vscode.TreeItemCollapsibleState.Expanded);
		// vscode.window.registerTreeDataProvider('banque-exercices', banque_exercices);
	});

	// FUNCTIONS OF VIEW - ITEM - EXERCICE //
	// fetch a string in a latex file, like exercise name of balise
	vscode.commands.registerCommand('banque.fetch', function (doc) {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(doc.filePath), { viewColumn: vscode.ViewColumn.One }).then(() => {
			// Get the active text editor and string to search
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			// first occurrence of string to search in the document
			var searchString = '{' + doc.label + '}';
			let document = editor.document;
			var text = document.getText();
			var position = text.indexOf(searchString);
			var startPosition = document.positionAt(position);
			var endPosition = document.positionAt(position + searchString.length);
			
			// check that the string \begin{exo} is also at the beginning of the line
			var line = document.lineAt(startPosition.line).text;
			while (!line.includes('{exo}')) {
					// look for next occurrence of searchString
					position = text.indexOf(searchString, position + 1);
					startPosition = document.positionAt(position);
					endPosition = document.positionAt(position + searchString.length);
					range = new vscode.Range(startPosition, endPosition);
					line = document.lineAt(startPosition.line).text;
				}
				
			// select the range and reveal it in the editor
			var range = new vscode.Range(startPosition, endPosition);
			editor.selection = new vscode.Selection(range.start, range.end);
			editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
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
			var exo = lineText.substring(start, end);
			var FilePath = editor.document.fileName;
			// var SourceFile = path.basename(FilePath);
		} else {// command called from the explorer context menu
			vscode.commands.executeCommand('banque.fetch', document);
			var exo = document.label;
			var FilePath = document.filePath;
			// vscode.commands.executeCommand('vscode.open', vscode.Uri.file(FilePath), { 		viewColumn: vscode.ViewColumn.One });
		}

		// name of temporary latex exercise file
		const exercice_name = 'Exercice'
		const exercice = __dirname + `/tmp/${exercice_name}`;
		// insert the TEX root line at the beginning of the file
		insertLatexMagic(editor, exercice);
		// create the exercise latex file
		const template = `\\input{${templatePath}/exercice.sty}\n\\Corrige\n\\begin{document}\n\\Source{${FilePath}}\n\\Exercice{${exo}}\n\\end{document}`;
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
	vscode.window.registerTreeDataProvider('banque-exercices', new BanqueExoShow())
	update_graphics_path();


}

// This method is called when your extension is deactivated
function deactivate() {}

	
// export modules
module.exports = {
	activate,
	deactivate
}