# Visual Studio Code Prépa Workshop Extension

[![version](https://img.shields.io/visual-studio-marketplace/v/qft-rules.prepa-workshop)](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop)
[![updated](https://img.shields.io/visual-studio-marketplace/last-updated/qft-rules.prepa-workshop)](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop)
[![release](https://img.shields.io/visual-studio-marketplace/release-date/qft-rules.prepa-workshop)](https://vsmarketplacebadge.apphb.com/downloads-short/qft-rules.prepa-workshop.svg)

[![downloads](https://img.shields.io/visual-studio-marketplace/d/qft-rules.prepa-workshop)](https://vsmarketplacebadge.apphb.com/downloads-short/qft-rules.prepa-workshop.svg)
[![installs](https://img.shields.io/visual-studio-marketplace/i/qft-rules.prepa-workshop)](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop)
[![rating](https://img.shields.io/visual-studio-marketplace/r/qft-rules.prepa-workshop)](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop)
[![License: CC BY 4.0](https://licensebuttons.net/l/by/4.0/80x15.png)](https://creativecommons.org/licenses/by/4.0/)

[![TeX Live on Windows](https://github.com/James-Yu/LaTeX-Workshop/workflows/TeX%20Live%20on%20Windows/badge.svg)](https://github.com/James-Yu/LaTeX-Workshop/actions?query=workflow%3A%22TeX+Live+on+Windows%22)
[![TeX Live on macOS](https://github.com/James-Yu/LaTeX-Workshop/workflows/TeX%20Live%20on%20macOS/badge.svg)](https://github.com/James-Yu/LaTeX-Workshop/actions?query=workflow%3A%22TeX+Live+on+macOS%22)
[![TeX Live on Linux](https://github.com/James-Yu/LaTeX-Workshop/workflows/TeX%20Live%20on%20Linux/badge.svg)](https://github.com/James-Yu/LaTeX-Workshop/actions?query=workflow%3A%22TeX+Live+on+Linux%22)

# Accueil

[Prépa Workshop](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop) est une extension de [Visual Studio Code](https://code.visualstudio.com/), dont le but est de fournir un espace de travail aux enseignants en CPGE scientifique qui utilisent $\LaTeX{}$ sur [Visual Studio Code](https://code.visualstudio.com/).


### Dépendances
![](https://img.shields.io/badge/warning-important-red.svg)

Cette extension nécessite l'extension [Latex Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) de [Visual Studio Code](https://code.visualstudio.com/), ainsi qu'une distribution [TexLive](https://www.tug.org/texlive/) locale.

### Table des matières

- [Accueil](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Accueil)
- [Vues arborescentes](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Vues-arborescentes)
  - [Banque d'exercices](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/banque-d'exercices)
  - [Programme de colle](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Programme-de-colle)
- [Configurations](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Configurations)
- [LaTeX](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/LaTeX)
  - [Macro LaTeX](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Macro-latex)
  - [Configurations LaTeX recommandées](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Configurations-LaTeX-recommandées)

# Vues arborescentes

L'extension [Prépa Workshop](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop) ajoute une icone à la barre des tâches (barre latérale à gauche) appelée CPGE. En cliquant sur l'icone CPGE, visual studio code affiche une liste de vues arborescentes. Ces vues arborescentes sont intitulées : 
 - [banque d'exercices](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Banque-d'exercices) ;
 - [programme de colle](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/programme-de-colle) (en cours) ;

### Banque d'exercices
Cette vue arborescentes affiche l'ensemble des exercices présents dans le dossier recueil.

### Programme de colle
En cours...

# Configurations
L’extension Prépa Workshop utilise plusieurs paramètres de configurations. Les paramètres, tous modifiables par l’utilisateur, sont les suivants.
- ```banque.path```
  - Valeur par défaut : ```/recueil/```.
  - Définit le chemin d'accès vers le dossier qui contient la banque d’exercices. Il s'agit du dossier local /recueil/ de l'extension  par défaut. Il est vivement recommandé de modifier ce chemin d'accès au profit d'un autre dossier personnel de l'utilisateur. Indiquer dans ce cas un chemin absolu.
- ```banque.exclude```
   - Valeur par défaut : ```/Figures/```.
   - Définit les chemins d'accès relatifs vers les sous-dossiers de *banque.path* qui doivent être exclus de l'affichage dans la vue *banque d'exercices*. 

# LaTeX
[Prépa Workshop](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop) utilise $\LaTeX{}$ comme langage source des fichiers contenant la banque d'exercices. Prépa Workshop définit ainsi :
- des fichiers ```.sty``` dans le dossier local ```/templates/``` de l'extension ;
- des commandes de compilation d'un fichier latex ;
- des *snippets* latex pour l'auto-complétion.

Les fichiers ```.sty``` définissent la mise en page des fichiers latex ainsi que certaines macro disponibles pour l'utilisateur. Le contenu de ces fichiers est détaillé dans la section [Macro LaTeX](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Macro-latex).

En particulier, il est nécessaire d'avoir installé l'extension [Latex Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) de [Visual Studio Code](https://code.visualstudio.com/).  Prépa workshop repose ainsi sur : 
- les fonctions ```latex-workshop.build``` et ```latex-workshop.tab``` ;

En conséquence, certaines configurations de [Latex Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) affectent le comportement de  [Prépa Workshop](https://marketplace.visualstudio.com/items?itemName=qft-rules.prepa-workshop). Les points de vigilance et configurations recommandées sont indiquées dans la section [Configurations recommandées](https://github.com/QFTrules/qftrules.prepaworkshop/wiki/Configurations-recommandées).

### Macro LaTeX
Les macros LaTeX sont les suivantes.
 > Commandes : 
  - ```\solution```
  - ```\Source```
 > Environnements : 
  - ```mintedSolution```
  - ```soluce```
  - ```exo```

### Configurations LaTeX recommandées
![](https://img.shields.io/badge/warning-important-red.svg)

La compilation des codes python, délimités par les environnements ```minted``` ou ```mintedSolution```, nécessite d'appeler la fonction ```pdflatex``` avec l'option ```--shell-escape```. Pensez à ajouter cette option à votre recette de compilation par défaut dans les configurations de l'extension [Latex Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).

# Mises à jour
Les mises à jour sont indiquées sur le [*commit graph*](https://github.com/QFTrules/qftrules.prepaworkshop/commits/master/) du dépôt github de l'extension.