# 🐝 Guia de Configuração — Banco de Dados Online (Firebase)

Este documento contém os passos para ativar o **Google Cloud Firestore** e o **Firebase Storage** no catálogo **ZanBee** e no **Chat-bot**.

---

## 1. Criar o Projeto no Firebase Console (Gratuito)

1. Acesse: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"** (ou "Criar projeto").
3. Nome do projeto: `zanbee-catalogo` (ou o nome de sua preferência).
4. Desative o Google Analytics (opcional) e clique em **Criar projeto**.

---

## 2. Ativar o Cloud Firestore (Banco de Dados)

1. No menu lateral esquerdo, clique em **Criação** > **Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Localização: escolha `southamerica-east1` (São Paulo) ou `us-central1`.
4. Em Regras de segurança, selecione **"Iniciar no modo de teste"** (ou configure as regras abaixo).
5. Clique em **Ativar**.

### 🔒 Regras recomendadas do Firestore (Aba "Regras"):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite que qualquer cliente leia os produtos da vitrine
    // e permite escrita pelo painel e pelo chat-bot
    match /products/{document=**} {
      allow read, write: if true;
    }
  }
}
```
*(Clique em **Publicar** após colar).*

---

## 3. Upload de Fotos (Firebase Storage ou Direto no Database)

> 💡 **Nota Importante sobre o Plano Pro/Blaze:**  
> O Firebase recentemente passou a solicitar ativação do plano "Blaze" (cartão de crédito) para criar novos buckets de Storage.  
> **Você NÃO precisa pagar nem cadastrar cartão!**  
> O catálogo ZanBee possui um **compressor automático inteligente** que otimiza fotos de celulares (reduzindo de 5MB para ~50KB) e **salva as fotos diretamente no Cloud Firestore (Database)**, 100% de graça!
>
> - **Se você NÃO quer usar o Storage:** Pule este passo! No painel, deixe o campo `Storage Bucket` vazio. O site salvará as fotos no banco de dados automaticamente.
> - **Se você já tem o Storage liberado:** Siga os passos abaixo:
>   1. No menu lateral, clique em **Criação** > **Storage**.
>   2. Clique em **"Começar"**.
>   3. Em Regras de segurança, selecione modo de teste.
>   4. Regras recomendadas (Aba "Rules"):
>      ```javascript
>      rules_version = '2';
>      service firebase.storage {
>        match /b/{bucket}/o {
>          match /products/{allPaths=**} {
>            allow read, write: if true;
>          }
>        }
>      }
>      ```

---

## 4. Obter as Chaves de Conexão Web

1. Na página inicial do seu projeto Firebase, clique no ícone da engrenagem ⚙️ > **Configurações do projeto**.
2. Na aba **Geral**, desça até a seção **"Seus aplicativos"** e clique no ícone Web **`</>`**.
3. Apelido do app: `zanbee-web`. Clique em **Registrar aplicativo**.
4. Copie o objeto `firebaseConfig`:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyCW6432-vvSRZlOa48kMTpmlLBw_gVTQ6c",
     authDomain: "catalago-a07e0.firebaseapp.com",
     projectId: "catalago-a07e0",
     storageBucket: "catalago-a07e0.firebasestorage.app",
     messagingSenderId: "234094332686",
     appId: "1:234094332686:web:99475f8cdc1ec93dd6a55f"
   };
   ```

---

## 5. Como Conectar no Catálogo ZanBee

Você pode conectar de **duas maneiras**:

### Modo A: Direto pelo Painel de Administração (Sem precisar recompilar)
1. Acesse o Painel do Administrador (`/admin`).
2. No topo, clique no botão **"Configurar Banco"** (ícone de banco de dados).
3. Clique em **"Colar objeto do Firebase Console"** e cole o código que copiou.
4. Clique em **"Preencher Campos Automaticamente"** e depois **"Salvar e Conectar"**.
5. O painel exibirá o selo verde **"Banco Online Ativo"** e enviará automaticamente os produtos para a nuvem!

### Modo B: Via arquivo `.env`
Crie ou verifique o arquivo `.env` na raiz do projeto `CATALAGO DE VENDAS` com:
```env
VITE_FIREBASE_API_KEY=AIzaSyCW6432-vvSRZlOa48kMTpmlLBw_gVTQ6c
VITE_FIREBASE_AUTH_DOMAIN=catalago-a07e0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=catalago-a07e0
VITE_FIREBASE_STORAGE_BUCKET=catalago-a07e0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=234094332686
VITE_FIREBASE_APP_ID=1:234094332686:web:99475f8cdc1ec93dd6a55f
```
*(Já configurado e pronto no projeto!)*

---

## 6. Integração com o Chat-Bot (WhatsApp)

No seu projeto de `chat-bot`:
1. Use as mesmas credenciais do Firebase.
2. Copie o arquivo [`shared/firebase-bot-client.ts`](file:///c:/Users/WIN10/Desktop/MONITORAMENTO/WAGNER/AUTOMATIZAÇÃO/CATALAGO%20DE%20VENDAS/shared/firebase-bot-client.ts) para o seu bot.
3. Exemplo de uso no bot:
   ```typescript
   import {
     initBotFirebase,
     getBotCatalog,
     checkBotStock,
     decrementBotStock,
     formatCatalogForWhatsApp
   } from './firebase-bot-client';

   // Inicializa
   initBotFirebase({
     apiKey: process.env.FIREBASE_API_KEY!,
     projectId: process.env.FIREBASE_PROJECT_ID!
   });

   // 1. Quando o cliente pedir o catálogo no WhatsApp:
   const produtos = await getBotCatalog();
   const mensagem = formatCatalogForWhatsApp(produtos);
   await sendWhatsAppMessage(clienteNumero, mensagem);

   // 2. Quando o cliente fechar o pedido de 2 unidades do produto #2:
   const { available, currentStock } = await checkBotStock(2, 2);
   if (available) {
     const result = await decrementBotStock(2, 2);
     // O estoque cai no Firestore e ATUALIZA AO VIVO no site do cliente!
   }
   ```
