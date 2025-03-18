"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
const path = require('path');
// Object.defineProperty(exports, "__esModule", { value: true });
// import { DepNodeProvider, Dependency } from './treeview';

// define action in the tree view
var __extends = (this && this.__extends) || (function () {
	var extendStatics = function (d, b) {
		extendStatics = Object.setPrototypeOf ||
			({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
			function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
		return extendStatics(d, b);
	};
	return function (d, b) {
		if (typeof b !== "function" && b !== null)
			throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
		extendStatics(d, b);
		function __() { this.constructor = d; }
		d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
})();

// define the properties of the tree items, notably the icons, descriptions, and the collapsible states
var TreeItem = /** @class */ (function (_super) {
	__extends(TreeItem, _super);
	function TreeItem(label, children, filePath, contextValue, collapsed, typeExo, difficulty, chapter, theme) {
		// _this is used to keep the initial object this available in the constructor
		var _this = _super.call(this, label, children === undefined ? vscode.TreeItemCollapsibleState.None :
			vscode.TreeItemCollapsibleState.Expanded, collapsed, typeExo, difficulty, chapter, theme) || this;
			_this.children = children;
			_this.filePath = filePath;
			_this.contextValue = contextValue;
			_this.typeExo = typeExo;
			_this.difficulty = difficulty;
			_this.chapter = chapter;
			_this.theme = theme;

			// indicate difficulty level in the tree view
			_this.description = _this.contextValue === 'file' ? '★'.repeat(difficulty) : '';

			// define the collapsible state of the tree items, expanded by default
			if (typeof collapsed === 'undefined') {
				_this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
			} else {
				_this.collapsibleState = collapsed;
			}
			
			//  do not show the small arrow indicating the collapsed state for leaves of the tree
			if (_this.contextValue === 'file' || _this.contextValue === 'pdf' || _this.contextValue === 'latex') {
				_this.collapsibleState = vscode.TreeItemCollapsibleState.None;
			}
			
			if (typeof typeExo === 'string') {
				// define context-specific icons for banque-exercices
				if (_this.contextValue === 'file') {
					if (typeExo.includes('python')) {
						_this.iconPath = {
							light: path.join(__dirname, 'images', 'file_type_python.svg'),
							dark: path.join(__dirname, 'images', 'file_type_python.svg')
						};
					} else {
						if (typeExo.includes('TD') || typeExo.includes('appli')) {
							_this.iconPath = {
								light: path.join(__dirname, 'images', 'pencil_light.png'),
								dark: path.join(__dirname, 'images', 'pencil_dark.png')
							};
						} else {
							if (typeExo.includes('colle')) {
								_this.iconPath = {
									light: path.join(__dirname, 'images', 'chalkboard_light.png'),
									dark: path.join(__dirname, 'images', 'chalkboard_dark.png')
								};
							} else {
								if (typeExo.includes('oral')) {
									_this.iconPath = {
										light: path.join(__dirname, 'images', 'gear-solid_light.png'),
										dark: path.join(__dirname, 'images', 'gear-solid_dark.png')
									};
								} else {
									if (typeExo.includes('devoir')) {
										_this.iconPath = {
											light: path.join(__dirname, 'images', 'paper_light.png'),
											dark: path.join(__dirname, 'images', 'paper_dark.png')
										};
									}
									else {
									}
								}
							}
						}
					}
				}
			// define specific icon for programme-colle	
			} else {
				if (label === 'Cours') {
					_this.iconPath = {
						light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
						dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
						// light: path.join(__dirname, 'images', 'chalkboard_light.png'),
						// dark: path.join(__dirname, 'images', 'chalkboard_dark.png')
				};
				} else {
					if (label === 'TD') {
						_this.iconPath = {
							light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
							dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
							// light: path.join(__dirname, 'images', 'pencil_light.png'),
							// dark: path.join(__dirname, 'images', 'pencil_dark.png')
						};
					} else {
						if (label === 'DM') {
							_this.iconPath = {
								light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
								dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
								// light: path.join(__dirname, 'images', 'house_light.png'),
								// dark: path.join(__dirname, 'images', 'house_dark.png')
							};
						} else {
							if (label === 'TP') {
								_this.iconPath = {
									light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
									dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
									// light: path.join(__dirname, 'images', 'flask_light.png'),
									// dark: path.join(__dirname, 'images', 'flask_dark.png')
								};
							} else {
								if (label === 'DS') {
									_this.iconPath = {
										light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
										dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
										// light: path.join(__dirname, 'images', 'paper_light.png'),
										// dark: path.join(__dirname, 'images', 'paper_dark.png')
									};
								} else {
									if (contextValue === 'folder' || contextValue === 'chapter') {
										_this.iconPath = {
											light: path.join(__dirname, 'images', 'default_folder_opened.svg'),
											dark: path.join(__dirname, 'images', 'default_folder_opened.svg')
										};
										} else {
										if (contextValue === 'pdf') {
											_this.iconPath = {
												light: path.join(__dirname, 'images', 'file_type_pdf.svg'),
												dark: path.join(__dirname, 'images', 'file_type_pdf.svg')
											};
										}
									}
								}
							}
						}
					}
				}
			}
		return _this;
	}

	return TreeItem;
}(vscode.TreeItem));

module.exports = TreeItem;