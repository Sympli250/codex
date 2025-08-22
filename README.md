# Symplissime AI

Ce projet fournit une interface JavaScript pour discuter avec Symplissime AI et téléverser des documents.

## Configuration de la clé API

Avant de charger `symplissime-ai.js`, définissez l'objet global `SYMPLISSIME_CONFIG` pour fournir vos identifiants :

```html
<script>
  window.SYMPLISSIME_CONFIG = {
    API_KEY: 'votre_cle_api',
    WORKSPACE: 'votre_workspace',
    USER: 'votre_utilisateur'
  };
</script>
```

La clé API est requise pour l'upload de fichiers. Une erreur 403 indiquera que les identifiants sont manquants ou invalides.
