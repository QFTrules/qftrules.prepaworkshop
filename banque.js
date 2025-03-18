"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// var child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const TreeItem = require('./treeItem');
// Object.defineProperty(exports, "__esModule", { value: true });
// import { DepNodeProvider, Dependency } from './treeview';

function GetTypeExo(label, filepath) {
	// filepath is undefined for items in programme de colle
	if (typeof filepath === 'undefined') {
		return ['undefined','undefined'];
	}
	
	// if no error, returns the info about the exercise
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const lines = fileContent.split('\n');
	for (let i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.includes(label)) {
			// get the type of exercise (python, devoir, ...)
			var startIndex = line.lastIndexOf('[') + 1;
			var endIndex = line.lastIndexOf(']');
			const typeExo = line.substring(startIndex, endIndex);
			// get the difficulty of the exercise (on, two, three stars)
			var startIndex = line.indexOf('[', line.indexOf('[') + 1) + 1;
			var endIndex = line.indexOf(']', line.indexOf(']') + 1);
			const difficulty = line.substring(startIndex, endIndex);
			return [typeExo, difficulty];
			}
		}
		return ['undefined','undefined'];
	}

// define data for the tree view
function generateTreeItems() {

	// path to the recueil directory
	var BanquePath = vscode.workspace.getConfiguration('banque').get('path');
	// add absolute path of extension if value is defalt /recueil/
	if (BanquePath === '/recueil/') {
		var BanquePath = __dirname + '/recueil/';
	}
	// vscode.window.showInformationMessage('Path to the recueil directory: ' + BanquePath);


	// const texPath = vscode.workspace.getConfiguration('mathpix-pdf').get('texPath');
	// const path_to_recueil = vscode.workspace.getConfiguration('banque-exercices').get("RecueilPath");
	// list all folders in the recueil directory
	var themes_list = fs.readdirSync(BanquePath).filter(file => fs.statSync(path.join(BanquePath, file)).isDirectory());
	// vscode.window.showInformationMessage('Liste des thèmes : ' + themes_list);
	// remove folders Figure, _fiches, etc.
	// themes_list.splice(themes_list.indexOf('Figure'), 1);
	// // themes_list.splice(themes_list.indexOf('_fiches'), 1);
	// themes_list.splice(themes_list.indexOf('Oraux'), 1);
	// themes_list.splice(themes_list.indexOf('.git'), 1);
	// themes_list.splice(themes_list.indexOf('Info'), 1);

	return themes_list.map(function (theme) {
		// vscode.window.showInformationMessage(theme);

		// get the list of absolute paths to latex files for the theme 
		const latex_files = fs.readdirSync(path.join(BanquePath, theme))
			.filter(file => file.endsWith('.tex'))
			.map(file => path.join(BanquePath, theme, file));
		// latex_files.pop();

		// remove the file that stores all exercices where the difficulty is not specified
		// const suggestion_liste = __dirname + '/tmp/exercices-sans-difficulte.txt';
		// if (fs.existsSync(suggestion_liste)) {
		// 	fs.unlinkSync(suggestion_liste);
		// }
		// vscode.window.showInformationMessage('Liste des fichiers : ' + latex_files);

		// return a tree item for each theme
		return new TreeItem(theme.toUpperCase(), // theme level
			latex_files.map(function (filePath) {
				// vscode.window.showInformationMessage(filePath);
				// get chapter latex file basename
				// var exercices = child_process.execSync('grep -E "\\\\\\\\begin{exo}" ' + filePath).toString().split('\n');
				const exercices = fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line.includes('\\begin{exo}'));
				// exercices.pop();
				const basename = path.parse(filePath).name
				// vscode.window.showInformationMessage(basename);

				return new TreeItem(basename, // chapter level
					exercices.map(function (exo) {
						// get exercise name
						var start = exo.indexOf('{', exo.indexOf('{') + 1) + 1;
						var end = exo.indexOf('}', exo.indexOf('}') + 1);
						var exo = exo.substring(start, end);
						var [typeExo, difficulty] = GetTypeExo(exo, filePath);
						// if (difficulty === '') {
						// 	// add this exercise to a file that stores all exercices where the difficulty is not specified
						// 	// this will be used by the suggestions tree view panel
						// 	fs.appendFileSync(suggestion_liste, filePath + ':' + exo + '\n');
						// }
						return new TreeItem(exo,      				// label
											undefined, 				// children
											filePath,  				// filePath
											'file',    				// contextValue
											undefined, 				// collapsed
											typeExo,   				// typeExo
											difficulty,			  	// difficulty
											basename,				// chapter
											theme.toUpperCase()); 	// theme
					}),
					filePath, 			// filePath
					'chapter', 			// contextValue
					undefined, 			// collapsed
					undefined, 			// typeExo
					undefined,			// difficulty
					basename, 			// chapter
					theme.toUpperCase() // theme
				);
			}),
			undefined, // filePath
			'folder',  // contextValue
			undefined, // collapsed
			undefined, // typeExo
			undefined, // difficulty
			undefined, // chapter
			theme.toUpperCase()  // theme
		);
	});

	// return data;
}






// define the data providers for the programme de colle panel
class BanqueExoShow {
    constructor() {

		// Get the active text editor
		// var editor = vscode.window.activeTextEditor;
		// if (!editor) {
		// 	return;
		// }

		// Generate tree data
		this.data = generateTreeItems();
		
    }

	// define here the command to call when clicking on the tree items
	getTreeItem(element) {
		// var item = element;
		var item = new TreeItem(element.label, element.children, element.filePath, element.contextValue, vscode.TreeItemCollapsibleState.Collapsed, element.typeExo, element.difficulty, element.chapter, element.theme);
		if (element.contextValue === 'file') {
			item.tooltip = "Voir l'exercice";
			item.command = {
				command: 'banque.fetch',
				title: 'Ouvrir exercice',
				arguments: [element],
			}
		} 
		
		return item;
	};

    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    };

	getParent(element) {
		// get the parent of the tree item with the given label
		const treeItems = this.data;
		for (let i = 0; i < treeItems.length; i++) {
			if (treeItems[i].label === element.label) {
				return undefined;
			}
			var parent1 = treeItems[i];
			for (let j = 0; j < parent1.children.length; j++) {
				if (parent1.children[j].label === element.label) {
					return parent1;
				}
				var parent2 = parent1.children[j];
				for (let k = 0; k < parent2.children.length; k++) {
					if (parent2.children[k].label === element.label) {
						return parent2;
					}
				}
			}
		}
	}
	
	getTreeItemByLabel(folderName,filename,label) {
		// get the tree item with the given label
		const treeItems = this.data;
		for (let i = 0; i < treeItems.length; i++) {
			if (folderName === 'undefined' || treeItems[i].label.trim() === folderName.toUpperCase().trim())  {
				var node1 = treeItems[i];
				// if (folderName === label) {
				// 	return node1;
				// }
				for (let j = 0; j < node1.children.length; j++) {
					if (node1.children[j].label === filename) {
						var node2 = node1.children[j];
						// if (filename === label) {
						// 	return node2;
						// }
						for (let k = 0; k < node2.children.length; k++) {
							if (node2.children[k].label === label) {
								// vscode.window.showInformationMessage(treeItems[i].children[j].children[k].label);
								return node2.children[k];
							}
						}
					}
				}
			}
		}
	}

	resolveTreeItem(item) {
		item.tooltip = item.filePath;
		return item;
	};

};

module.exports = BanqueExoShow
module.exports.GetTypeExo = GetTypeExo
	