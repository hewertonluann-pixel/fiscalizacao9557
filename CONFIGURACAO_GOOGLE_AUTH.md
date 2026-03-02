# 🔐 Configuração do Google OAuth - Firebase

## 📝 Passo a Passo para Habilitar Login com Google

### 1️⃣ Acessar o Firebase Console

1. Acesse: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Selecione o projeto **fiscalizacao9557**

---

### 2️⃣ Habilitar Google Authentication

1. No menu lateral, clique em **Authentication** (🔒 Autenticação)
2. Clique na aba **Sign-in method** (Métodos de login)
3. Clique em **Google** na lista de provedores
4. Clique no botão **Ativar** (toggle)
5. Preencha os campos:
   - **Nome público do projeto**: `Sistema de Fiscalização - Diamantina/MG`
   - **E-mail de suporte do projeto**: `hewertonluann@gmail.com` (ou email da prefeitura)
6. Clique em **Salvar**

---

### 3️⃣ Adicionar Domínio Autorizado

1. Ainda em **Authentication** > **Settings** (Configurações)
2. Na seção **Authorized domains** (Domínios autorizados)
3. Adicione o domínio onde o sistema estará hospedado:
   - Se for GitHub Pages: `hewertonluann-pixel.github.io`
   - Se for domínio próprio: `seudominio.com.br`
   - Para testes locais: `localhost` (já vem habilitado)
4. Clique em **Adicionar domínio**

---

### 4️⃣ Criar Coleção de Usuários Autorizados (Automático)

✅ O sistema já cria automaticamente a coleção `usuarios_autorizados` no primeiro acesso!

Estrutura criada:
```json
{
  "email": "hewertonluann@gmail.com",
  "nome": "Hewerton",
  "tipo": "fiscal",
  "ativo": true,
  "dataCriacao": "2026-03-02T11:00:00.000Z"
}
```

---

### 5️⃣ Verificar Usuários Cadastrados

1. No Firebase Console, vá em **Firestore Database**
2. Procure a coleção `usuarios_autorizados`
3. Você verá os 5 usuários:
   - ✅ Hewerton (fiscal)
   - ✅ Érica (fiscal)
   - ✅ Thais (fiscal)
   - ✅ Alexon (gerente)
   - ✅ Marina (fiscal)

---

## 👥 Usuários Autorizados

| Nome | Email | Tipo | Status |
|------|-------|------|--------|
| Hewerton | hewertonluann@gmail.com | Fiscal | ✅ Ativo |
| Érica | ericakristiane82@gmail.com | Fiscal | ✅ Ativo |
| Thais | thaaiis.abarbosa@gmail.com | Fiscal | ✅ Ativo |
| Alexon | alexoncoelhopintalmeida@gmail.com | Gerente | ✅ Ativo |
| Marina | marinasouza35316590@gmail.com | Fiscal | ✅ Ativo |

---

## ➕ Como Adicionar Novos Usuários

### Opção 1: Manualmente no Firestore

1. Acesse **Firestore Database** no Firebase Console
2. Abra a coleção `usuarios_autorizados`
3. Clique em **Adicionar documento**
4. Preencha os campos:
   ```json
   {
     "email": "novousuario@gmail.com",
     "nome": "Nome do Usuário",
     "tipo": "fiscal",  // ou "gerente"
     "ativo": true,
     "dataCriacao": "2026-03-02T12:00:00.000Z"
   }
   ```
5. Clique em **Salvar**

### Opção 2: Editar o Código (login.html)

Adicione o novo usuário no objeto `USUARIOS_AUTORIZADOS`:

```javascript
const USUARIOS_AUTORIZADOS = {
  'hewertonluann@gmail.com': { nome: 'Hewerton', tipo: 'fiscal' },
  'novousuario@gmail.com': { nome: 'Novo Usuário', tipo: 'fiscal' },  // ⭐ Adicionar aqui
  // ... outros usuários
};
```

---

## 🚫 Como Desativar um Usuário

1. Acesse **Firestore Database**
2. Abra a coleção `usuarios_autorizados`
3. Encontre o documento do usuário
4. Edite o campo `ativo` para `false`
5. O usuário não conseguirá mais fazer login

---

## 🔒 Segurança

✅ **Implementado:**
- Autenticação via Google (OAuth 2.0)
- Lista de emails autorizados (whitelist)
- Validação de status ativo
- Controle de perfil (fiscal/gerente)
- Sessão segura no localStorage

🛡️ **Benefícios:**
- Não armazena senhas
- MFA do Google (se habilitado pelo usuário)
- Auditoria de acessos via Firebase
- Proteção contra força bruta

---

## 🌐 Publicar o Sistema

### GitHub Pages (Gratuito)

1. No repositório, vá em **Settings** > **Pages**
2. Em **Source**, selecione `main` branch
3. Clique em **Save**
4. URL será: `https://hewertonluann-pixel.github.io/fiscalizacao9557/`
5. Adicione este domínio nos **Authorized domains** do Firebase

---

## ❓ Troubleshooting

### Erro: "Este app não foi verificado pelo Google"
- **Solução**: Clique em "Avançado" > "Ir para fiscalizacao9557 (não seguro)"
- **Motivo**: App em desenvolvimento (normal para projetos internos)

### Erro: "Email não autorizado"
- **Solução**: Verifique se o email está na coleção `usuarios_autorizados`
- **Solução**: Verifique se o campo `ativo` está como `true`

### Erro: "Pop-up bloqueado"
- **Solução**: Permitir pop-ups no navegador para o site

---

## 📞 Suporte

Em caso de dúvidas:
- Firebase Documentation: [https://firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)
- Contato: hewertonluann@gmail.com

---

✅ **Sistema pronto para uso após configuração do Firebase!**
