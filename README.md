# ResilienceHub - Aplicativo de Gestão de Emergências

ResilienceHub é uma plataforma integrada para gestão de emergências que combina:
- Sistema de alerta antecipado baseado em IA
- Gestão inteligente de abrigos e recursos
- Monitoramento em tempo real de áreas de risco
- Aplicativo móvel para população e equipes de resgate

Vídeo de demonstração: https://drive.google.com/drive/folders/13tMov0T1iIq0mrlfSW1Xq3X4ZfMOv4qd?usp=sharing

## Membros do grupo

#### Luana Sousa Matos 
- RM552621 

#### Nicolas Martins 
- RM553478

## Funcionalidades Principais

### Para Usuários Comuns
- Autenticação segura com e-mail e senha
- Visualização de alertas ativos em sua região
- Check-in em abrigos via QR Code
- Visualização de abrigos próximos
- Gerenciamento de perfil pessoal

### Para Administradores de Abrigos
- Dashboard administrativo
- Emissão de alertas de emergência
- Gerenciamento de recursos do abrigo
- Monitoramento de ocupantes
- Ativação/desativação do abrigo

## Tecnologias Utilizadas

- React Native
- Firebase Authentication
- Firebase Firestore
- Expo

## Requisitos

- Node.js 14+
- npm ou yarn
- React Native CLI
- Android Studio (para desenvolvimento Android)
- Conta no Firebase

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ResilienceHubApp.git
cd ResilienceHubApp
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Adicione um aplicativo Android e/ou iOS ao projeto
   - Baixe o arquivo de configuração (`google-services.json` para Android ou `GoogleService-Info.plist` para iOS)
   - Coloque os arquivos de configuração nas pastas apropriadas:
     - Android: `android/app/google-services.json`
     - iOS: `ios/ResilienceHubApp/GoogleService-Info.plist`
   - Atualize o arquivo `firebaseConfig.js` com suas credenciais do Firebase

4. Execute o aplicativo:
```bash
# Para Android
npx react-native run-android

# Para iOS
npx react-native run-ios
```

## Configuração do Firebase

O aplicativo utiliza os seguintes serviços do Firebase:

1. **Authentication**: Para autenticação de usuários
   - Habilite o provedor de e-mail/senha

2. **Firestore Database**: Para armazenamento de dados
   - Crie as seguintes coleções:
     - `users`: Informações dos usuários
     - `shelters`: Dados dos abrigos
     - `alerts`: Alertas de emergência
     - `resources`: Recursos disponíveis nos abrigos

3. **Storage** (opcional): Para armazenamento de imagens
   - Configure as regras de segurança adequadas

## Regras de Segurança do Firestore

Recomendamos as seguintes regras de segurança para o Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler e atualizar apenas seus próprios dados
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Abrigos podem ser lidos por todos, mas modificados apenas por admins
    match /shelters/{shelterId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
    }
    
    // Alertas podem ser lidos por todos, mas criados apenas por admins
    match /alerts/{alertId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
    }
    
    // Recursos podem ser lidos por todos, mas modificados apenas por admins
    match /resources/{resourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
    }
  }
}
```

## Dados de Exemplo

Exemplos esperados de dados para inserir no firestore:

### Usuário Comum
```json
{
  "uid": "user123",
  "email": "usuario@exemplo.com",
  "name": "João Silva",
  "userType": "user",
  "phone": "(11) 99999-9999",
  "address": "Rua das Flores, 123, São Paulo, SP",
  "emergencyContact": "Maria Silva - (11) 88888-8888",
  "checkInHistory": [],
  "currentShelter": null,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Administrador de Abrigo
```json
{
  "uid": "admin123",
  "email": "admin@exemplo.com",
  "name": "Ana Santos",
  "userType": "admin",
  "phone": "(11) 77777-7777",
  "address": "Av. Principal, 456, São Paulo, SP",
  "emergencyContact": "Carlos Santos - (11) 66666-6666",
  "checkInHistory": [],
  "currentShelter": null,
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T09:00:00.000Z"
}
```

### Abrigo
```json
{
  "name": "Abrigo Municipal Central",
  "address": "Rua Central, 789, Centro, São Paulo, SP",
  "capacity": 100,
  "currentOccupancy": 25,
  "adminId": "admin123",
  "active": true,
  "occupants": [
    {
      "userId": "user456",
      "userName": "Pedro Costa",
      "userEmail": "pedro@exemplo.com",
      "checkInTime": "2024-01-15T14:30:00.000Z",
      "status": "checked-in"
    }
  ],
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

### Alerta
```json
{
  "title": "Alerta de Inundação - Zona Leste",
  "description": "Risco de inundação devido às fortes chuvas previstas para as próximas 6 horas. Moradores da região devem se dirigir aos abrigos mais próximos.",
  "type": "flood",
  "severity": "high",
  "location": "Zona Leste, São Paulo, SP",
  "active": true,
  "createdBy": "admin123",
  "createdByName": "Ana Santos",
  "shelterId": "shelter123",
  "shelterName": "Abrigo Municipal Central",
  "createdAt": "2024-01-15T16:00:00.000Z",
  "updatedAt": "2024-01-15T16:00:00.000Z"
}
```

### Recurso
```json
{
  "name": "Cesta Básica Completa",
  "category": "food",
  "quantity": 50,
  "unit": "cestas",
  "description": "Cesta com arroz, feijão, óleo, açúcar e outros itens básicos",
  "shelterId": "shelter123",
  "shelterName": "Abrigo Municipal Central",
  "createdAt": "2024-01-10T08:30:00.000Z",
  "updatedAt": "2024-01-14T16:00:00.000Z"
}
```

## Como Inserir os Dados

### Usando o Console do Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para "Firestore Database"
4. Clique em "Iniciar coleção" ou selecione uma coleção existente
5. Adicione documentos com os dados de exemplo acima
