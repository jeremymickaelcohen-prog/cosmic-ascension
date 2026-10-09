# Cosmic Ascension — Renaissance (alpha jouable)

Reconstruction indépendante (clean room) du jeu Cosmic Ascension, développée sans utiliser le code source du prototype.

## Fonctionnalités implémentées

- Quinze âges de civilisation, de la pierre jusqu'au type III de Kardachev.
- Récolte manuelle : énergie, bois et pierre.
- 47 bâtiments automatisés, y compris des chaînes industrielles qui consomment leurs intrants.
- 75 technologies réparties en cinq domaines.
- Ascensions conditionnelles avec remise à zéro des stocks, bâtiments, technologies et colonies.
- Héritages permanents, améliorations cumulatives.
- Colonisation de systèmes, indice de Kardachev et objectif final.
- Sauvegarde locale distincte pour le mode développeur, export et import JSON.
- Simulation hors ligne plafonnée à huit heures.
- Interface responsive en français, palette science-fiction industrielle.

## Lancer le jeu

Ouvrir `v1/index.html` dans un navigateur compatible avec les modules JavaScript, via un serveur local. Par exemple, depuis le répertoire `v1` :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

La console développeur est accessible avec `http://localhost:8080/?dev=1`. Activer son mode test avant d'ajouter des ressources ou de changer d'âge. Son emplacement de stockage est indépendant de la partie normale.

## Tests

Avec Node.js 20+ :

```bash
npm test
```

La suite utilise le module `node:test` natif et vérifie la récolte, les achats, la recherche, l'ascension, les pénuries et la victoire.

## Structure

- `index.html` : point d'entrée.
- `src/engine.js` : modèle de données, économie, recherches, production, ascensions et sauvegarde logique (sans DOM).
- `src/main.js` : interface et interactions.
- `src/style.css` : design responsive.
- `tests/game.test.js` : vérifications du moteur.

## Limites connues

Cette alpha est une tranche jouable de base : ce n'est pas encore la version de production finale décrite dans le plan. Les effets visuels, la cartographie galactique, la profondeur des chaînes industrielles, le contenu narratif, la variété de technologies et le calibrage long terme restent à développer. Le modèle de nombres utilise actuellement les nombres JavaScript standards, et non une bibliothèque décimale pour des valeurs supérieures à 1e290.

La validation complète en navigateur et l'équilibrage de chaque époque restent nécessaires. Aucune ancienne sauvegarde du prototype n'est importée automatiquement, conformément à l'exigence d'une nouvelle implémentation indépendante. Les fichiers du prototype sur la branche principale ne sont pas modifiés.

## Déploiement

Le projet peut être publié comme site statique sous un préfixe `/v1/`. Il est volontairement isolé du prototype : ne pas remplacer l'application publique avant validation manuelle.
