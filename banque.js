// IMPORTS //
"use strict";
var vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const TreeItem = require('./treeItem');
// ---------------------------------- //

function generateTreeItems(collapsedState = undefined) {

	// absolute path to the recueil directory
	var BanquePath = vscode.workspace.getConfiguration('banque').get('path');
	if (BanquePath === '/recueil/') {
		var BanquePath = __dirname + '/recueil/';
	}

	// list all folders in the recueil directory and remove the ones excluded
	var themes_list = fs.readdirSync(BanquePath).filter(file => fs.statSync(path.join(BanquePath, file)).isDirectory());
	const exclude = vscode.workspace.getConfiguration('banque').get('exclude');
	themes_list = themes_list.filter(theme => !exclude.includes(theme));

	// return the themes in the tree view
	return themes_list.map(function (theme) {
		// get the list of absolute paths to latex files for the theme 
		const latex_files = fs.readdirSync(path.join(BanquePath, theme))
			.filter(file => file.endsWith('.tex'))
			.map(file => path.join(BanquePath, theme, file));

		// return tree items of each theme
		return new TreeItem(theme.toUpperCase(), // theme level
			latex_files.map(function (filePath) {
				// get the list of exercises in the latex file
				const exercices = fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line.includes('\\begin{exo}'));
				const basename = path.parse(filePath).name

				return new TreeItem(basename, // chapter level
					exercices.map(function (exo) {
						// get exercise name
						var start = exo.lastIndexOf('{') + 1;
						var end = exo.lastIndexOf('}');
						const exoName = exo.substring(start, end);
						// get exercise type
						var start = exo.lastIndexOf('[') + 1;
						var end = exo.lastIndexOf(']');
						const typeExo = exo.substring(start, end);
						// get exercise difficulty
						var start = exo.indexOf('[') + 1;
						var end = exo.indexOf(']');
						const difficulty = exo.substring(start, end);
						// return exercise tree item
						return new TreeItem(exoName,      			// label
											undefined, 				// children
											filePath,  				// filePath
											'file',    				// contextValue
											undefined,				// collapsed
											typeExo,   				// typeExo
											difficulty,			  	// difficulty
											basename,				// chapter
											theme.toUpperCase()); 	// theme
					}),					// children
					filePath, 			// filePath
					'chapter', 			// contextValue
					collapsedState,		// collapsed
					undefined, 			// typeExo
					undefined,			// difficulty
					basename, 			// chapter
					theme.toUpperCase() // theme
				);
			}),					// children
			undefined, 			// filePath
			'folder',  			// contextValue
			collapsedState, 	// collapsed
			undefined, 			// typeExo
			undefined, 			// difficulty
			undefined, 			// chapter
			theme.toUpperCase() // theme
		);
	});

	// return data;
}
// ---------------------------------- //





// TREE VIEW CLASS //
class BanqueExoShow {

	// constructor
    constructor(collapsedState = undefined) {
		this.data = generateTreeItems(collapsedState);
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

	// define here the children of the tree items
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    };


	// get the parent of the tree item with the given label
	getParent(element) {
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
	
	// get the tree item with the given label
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

	// get the tree item with the given label
	resolveTreeItem(item) {
		item.tooltip = item.filePath;
		return item;
	};

};

// EXPORTS //
module.exports = BanqueExoShow
// ---------------------------------- //