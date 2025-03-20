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
            // var fullPath = path.join(basePath, item.name);
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
			// editBuilder.insert(new vscode.Position(0, 0), latex_magic);
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
	// vscode.window.showInformationMessage('Mise à jour du chemin des figures dans exercice.sty.');
	// find all subdirectories, WHATEVER THE DEPTH, within directory BanquePath that are called /Figures/
	const directories = findDirectories(BanquePath, 'Figures');
	// vscode.window.showInformationMessage(directories.toString());

	// latex line to add (string)
	const graphics_path = '\n% Added by qft-rules.prepaworkshop on start-up\n\\graphicspath{{' + directories.join('}{') + '}}';
	// vscode.window.showInformationMessage(graphics_path);
	// latex path to exercice.sty
	const exercice_sty = templatePath + '/exercice.sty';
	// vscode.window.showInformationMessage(exercice_sty);
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
	// if (!data.includes(graphics_path)) {
	fs.appendFileSync(exercice_sty, graphics_path);
	// } else {
		// throw an error
		// vscode.window.showErrorMessage('La commande latex \\graphicspath est déjà définie.');
	// }
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

	// copy the latex file and use it as a source in an exercise latex document (TD, ...)
	vscode.commands.registerCommand('banque.open', function (document) {
		// open the latex document in vscode
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(document.filePath), { viewColumn: vscode.ViewColumn.One });
	})

	// refresh the tree view of banque exercices
	vscode.commands.registerCommand('banque.refresh', () => {
		const banque_exercices = new BanqueExoShow();
		vscode.window.registerTreeDataProvider('banque-exercices', banque_exercices);
	});

	// fetch a string in a latex file, like exercise name of balise
	vscode.commands.registerCommand('banque.fetch', function (doc) {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(doc.filePath), { viewColumn: vscode.ViewColumn.One });

		// Get the active text editor and string to search
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		// string to search in the document
		var searchString = '{' + doc.label + '}';
		let document = editor.document;
        var text = document.getText();
        var position = text.indexOf(searchString);

		// reveal the string in the editor
        if (position !== -1) {
            var startPosition = document.positionAt(position);
            var endPosition = document.positionAt(position + searchString.length);
            var range = new vscode.Range(startPosition, endPosition);
            editor.selection = new vscode.Selection(range.start, range.end);
			editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
        }
	})

	// command to compile an exercise separately
	vscode.commands.registerCommand('banque.compile', function (document) {
		
		// get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
		}
		
		let exoenvi = 'exo';
		// string to search in the document
		const searchString = '\\begin{' + exoenvi +'}';

		// check if command called from the explorer context menu or from the editor (document undefined)
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
		} else {
			// vscode.window.showInformationMessage(document.label);
			var exo = document.label.replace(/"/g, '');
			var FilePath = document.filePath;
			// vscode.window.showInformationMessage(FilePath);
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(FilePath), { 		viewColumn: vscode.ViewColumn.One });
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

	// command to reveal an exercise in tree view
	vscode.commands.registerCommand('banque.reveal', function () {
		
		// vscode.window.showInformationMessage(document.filePath);
		// get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
	
		// vscode.window.showInformationMessage(folderName, fileName);

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
		// vscode.window.showInformationMessage(fileName, folderName, exo);
		// hihglight the exercise in the editor
		vscode.commands.executeCommand('extension.selectCurlyBrackets', {label: exo});

		const banque_exercices = new BanqueExoShow();
		const TreeView = vscode.window.createTreeView('banque-exercices', { treeDataProvider: banque_exercices });
		const item = banque_exercices.getTreeItemByLabel(folderName,fileName,exo);
		// vscode.window.showInformationMessage(item.label);
		TreeView.reveal(item, {focus: true, select: true, expand: true});
	});

	// call here all commands necessary at launch
	vscode.commands.executeCommand('banque.refresh');
	update_graphics_path();


}

// This method is called when your extension is deactivated
function deactivate() {}

	
// export modules
module.exports = {
	activate,
	deactivate
}