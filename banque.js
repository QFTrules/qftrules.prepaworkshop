// IMPORTS //
"use strict";
var vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const TreeItem = require('./treeItem');
// ---------------------------------- //

function normalizeExcludedThemes(rawExclude) {
	const values = Array.isArray(rawExclude)
		? rawExclude
		: (typeof rawExclude === 'string' && rawExclude.trim() !== '' ? [rawExclude] : []);

	return new Set(values
		.map(value => value.replace(/\\/g, '/').replace(/\/+$/, ''))
		.map(value => path.basename(value))
		.filter(Boolean)
		.map(value => value.toLowerCase()));
}

function resolveBanquePath(rawPath) {
	if (!rawPath || rawPath === '/recueil/') {
		return path.join(__dirname, 'recueil');
	}

	return path.resolve(rawPath);
}

function safeReadDir(targetPath) {
	try {
		return fs.readdirSync(targetPath, { withFileTypes: true });
	} catch (error) {
		return [];
	}
}

function safeReadFile(targetPath) {
	try {
		return fs.readFileSync(targetPath, 'utf8');
	} catch (error) {
		return '';
	}
}

function getBanquePath() {
	const BanquePath = resolveBanquePath(vscode.workspace.getConfiguration('banque').get('path'));

	if (!fs.existsSync(BanquePath) || !fs.statSync(BanquePath).isDirectory()) {
		vscode.window.showErrorMessage('Chemin d`accès banque.path invalide.');
		return undefined;
	}

	return BanquePath;
}

function buildExerciseItem(exoLine, filePath, theme, basename) {
	var start = exoLine.lastIndexOf('{') + 1;
	var end = exoLine.lastIndexOf('}');
	const exoName = exoLine.substring(start, end);
	start = exoLine.lastIndexOf('[') + 1;
	end = exoLine.lastIndexOf(']');
	const typeExo = exoLine.substring(start, end);
	start = exoLine.indexOf('[') + 1;
	end = exoLine.indexOf(']');
	const difficulty = exoLine.substring(start, end);

	return new TreeItem(exoName,
		undefined,
		filePath,
		'file',
		undefined,
		typeExo,
		difficulty,
		basename,
		theme.toUpperCase());
}

function generateExerciseItems(chapterItem) {
	const basename = path.parse(chapterItem.filePath).name;
	return safeReadFile(chapterItem.filePath)
		.split('\n')
		.filter(line => line.includes('\\begin{exo}'))
		.map(exoLine => buildExerciseItem(exoLine, chapterItem.filePath, chapterItem.theme, basename));
}

function generateChapterItems(themeItem, collapsedState = undefined) {
	return safeReadDir(themeItem.filePath)
		.filter(entry => entry.isFile() && entry.name.endsWith('.tex'))
		.map(entry => path.join(themeItem.filePath, entry.name))
		.map(filePath => {
			const basename = path.parse(filePath).name;

			return new TreeItem(basename,
				undefined,
				filePath,
				'chapter',
				collapsedState,
				undefined,
				undefined,
				basename,
				themeItem.theme);
		});
}

function generateTreeItems(collapsedState = undefined) {
	const BanquePath = getBanquePath();
	if (!BanquePath) {
		return [];
	}

	// list all folders in the recueil directory and remove the ones excluded
	var themes_list = safeReadDir(BanquePath)
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name);
	const exclude = vscode.workspace.getConfiguration('banque').get('exclude');
	const excludedThemes = normalizeExcludedThemes(exclude);
	themes_list = themes_list.filter(theme => !excludedThemes.has(theme.toLowerCase()));

	// return the themes in the tree view
	return themes_list.map(function (theme) {
		return new TreeItem(theme.toUpperCase(), // theme level
			undefined,
			path.join(BanquePath, theme),
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
		this.collapsedState = collapsedState;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.data = generateTreeItems(collapsedState);
    }

	refresh() {
		this.data = generateTreeItems(this.collapsedState);
		this._onDidChangeTreeData.fire(undefined);
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
		if (element.contextValue === 'folder') {
			return generateChapterItems(element, this.collapsedState);
		}
		if (element.contextValue === 'chapter') {
			return generateExerciseItems(element);
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
				const chapters = generateChapterItems(node1, this.collapsedState);
				for (let j = 0; j < chapters.length; j++) {
					if (chapters[j].label === filename) {
						const exercises = generateExerciseItems(chapters[j]);
						for (let k = 0; k < exercises.length; k++) {
							if (exercises[k].label === label) {
								return exercises[k];
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