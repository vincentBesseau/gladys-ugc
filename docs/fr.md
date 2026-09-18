# UGC

Films actuellement à l'affiche dans votre cinéma UGC, sous forme de widget de
tableau de bord, avec un déclencheur de scène pour l'ajout d'un nouveau
film.

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
   les 5 cinémas UGC les plus proches de votre maison Gladys (si sa position
   est renseignée), ou tapez une ville / un code postal pour chercher parmi
   tous les cinémas. Le résultat s'affiche sous le bouton, au format
   `Nom du cinéma — Ville (12.3 km) (ID: 10)` (la distance n'apparaît que
   pour une recherche par proximité).
3. Copiez l'identifiant numérique du cinéma souhaité dans le champ
   **Identifiant du cinéma**, puis enregistrez.

Si aucune maison Gladys n'a de position renseignée, laisser le champ vide
liste tous les cinémas UGC (comportement de repli).

Ajoutez le widget **À l'affiche** de l'intégration à un tableau de bord
Gladys pour voir les films actuellement à l'affiche dans ce cinéma :
affiche, lien de réservation, horaires de séances du jour (heure et version,
VF/VOST) et, quand ugc.fr en propose une, un lien vers la bande-annonce.

## Déclencheur de scène

L'intégration déclare aussi un déclencheur de scène **Nouveau film ajouté** :
créez une scène avec ce déclencheur pour réagir quand un film jamais vu
auparavant apparaît dans le programme (envoyer un message, par exemple). Le
déclencheur expose le titre du film, sa date de sortie, les horaires du jour
et le lien de réservation comme variables de scène. L'intégration vérifie
l'apparition de nouveaux films deux fois par jour.

## Limites connues (v1)

- Un seul cinéma à la fois par installation de l'intégration.
- Uniquement les films et horaires du jour même (pas de vue sur demain ou les
  jours suivants).
- La liste des cinémas est une liste statique maintenue à la main (voir le
  README du dépôt) : un nouveau cinéma UGC peut ne pas encore y apparaître.

## Dépannage

L'intégration journalise tout ce qu'elle fait : consultez les logs de
l'intégration depuis l'interface Gladys (ou `docker logs` sur l'hôte) avec
`LOG_LEVEL=debug` pour le détail complet.
