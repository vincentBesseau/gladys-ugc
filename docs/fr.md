# UGC

Films actuellement à l'affiche dans votre cinéma UGC, affichés dans le widget
"Prochaines sorties" de Gladys.

## Important : intégration non officielle

Cette intégration lit la page "films à l'affiche" que **ugc.fr sert
publiquement à n'importe quel visiteur** de son site — le même contenu que
vous verriez en ouvrant la page de votre cinéma dans un navigateur, rien de
plus. Elle n'est ni développée, ni approuvée, ni affiliée à UGC. UGC peut
changer son site à tout moment et casser cette intégration sans préavis.

Aucune API payante, aucun identifiant extrait d'une application, aucun
contournement de protection anti-robot n'est utilisé : uniquement le point
d'accès public que le site utilise déjà pour lui-même.

## Configuration

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Lancez l'action **Trouver mon cinéma** : laissez le champ vide pour lister
   tous les cinémas UGC, ou tapez une ville / un code postal pour filtrer.
   Le résultat s'affiche sous le bouton, au format
   `Nom du cinéma — Ville (ID: 10)`.
3. Copiez l'identifiant numérique du cinéma souhaité dans le champ
   **Identifiant du cinéma**, puis enregistrez.
4. (Optionnel) Choisissez le **Jour à afficher** — Aujourd'hui, Demain ou
   Dans 7 jours. La page "à l'affiche" d'ugc.fr est pour un seul jour à la
   fois : ce réglage ne change pas la période affichée, il change quel jour
   est lu.

Les films à l'affiche ce jour-là dans ce cinéma apparaissent alors dans le
widget "Prochaines sorties" du tableau de bord. La date affichée sous chaque
affiche est la date de sortie officielle du film (pas une séance) : un film
qui joue depuis plusieurs semaines garde sa date de sortie d'origine.

## Limites connues (v1)

- Un seul cinéma à la fois par installation de l'intégration.
- Un seul jour à la fois (aujourd'hui, demain ou dans 7 jours) : pas de
  fenêtre glissante ni d'horaires de séances (prévu pour une version
  future).
- La liste des cinémas est une liste statique maintenue à la main (voir le
  README du dépôt) : un nouveau cinéma UGC peut ne pas encore y apparaître.

## Dépannage

L'intégration journalise tout ce qu'elle fait : consultez les logs de
l'intégration depuis l'interface Gladys (ou `docker logs` sur l'hôte) avec
`LOG_LEVEL=debug` pour le détail complet.
