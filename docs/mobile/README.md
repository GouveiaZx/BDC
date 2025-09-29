# BDC Classificados - Aplicativos Móveis

Este diretório contém as versões nativas para Android e iOS do BDC Classificados. Os aplicativos funcionam como containers WebView que carregam a aplicação web existente, mantendo todas as funcionalidades originais.

## 🏗️ Arquitetura

### Android (`android/`)
- **Container WebView nativo** usando Android SDK
- **Target SDK**: 34 (Android 14)
- **Minimum SDK**: 24 (Android 7.0)
- **Linguagem**: Java
- **Funcionalidades**: Upload de arquivos, câmera, localização, deep linking

### iOS (`ios/`)
- **Container WKWebView nativo** usando iOS SDK
- **Target iOS**: 17.0+
- **Linguagem**: Swift
- **Funcionalidades**: Upload de arquivos, câmera, localização, universal links

## 🚀 Funcionalidades

### ✅ Implementadas
- **WebView Container**: Carrega a aplicação web existente
- **Upload de Arquivos**: Suporte completo para câmera e galeria
- **Navegação**: Back button, swipe gestures, pull-to-refresh
- **Permissões**: Câmera, localização, armazenamento
- **Deep Linking**: URLs personalizadas e universal links
- **Error Handling**: Páginas de erro personalizadas
- **Performance**: Otimizações de cache e memória

### 📱 Experiência do Usuário
- **Interface Nativa**: Splash screen, progress bars, loading states
- **Navegação Fluida**: Transições suaves entre páginas
- **Offline Support**: Detecção de conectividade e cache
- **External Links**: Abertura automática de links externos (WhatsApp, Maps, etc.)

## 🛠️ Configuração para Desenvolvimento

### Pré-requisitos

#### Android
- Android Studio Arctic Fox ou superior
- Android SDK 34
- Java 8 ou superior
- Gradle 8.3+

#### iOS
- Xcode 15 ou superior
- iOS 17.0+ SDK
- macOS Ventura ou superior
- Apple Developer Account (para device testing)

### ⚙️ Configuração Inicial

1. **Clone e Configure o Projeto Base**
```bash
cd mobile/
```

2. **Android Setup**
```bash
cd android/
# Abra o projeto no Android Studio
# Sync Gradle files
# Configure seu dispositivo/emulador
```

3. **iOS Setup**
```bash
cd ios/
# Abra BDCClassificados.xcodeproj no Xcode
# Configure Team ID para assinatura
# Configure seu dispositivo/simulador
```

### 🔧 Configuração de URLs

**IMPORTANTE**: Antes de compilar, atualize as URLs de produção:

#### Android
Edite `MainActivity.java`:
```java
private static final String BASE_URL = "https://seu-dominio-producao.com";
```

Edite `AndroidManifest.xml`:
```xml
<data android:host="seu-dominio-producao.com" />
```

#### iOS
Edite `ViewController.swift`:
```swift
private let baseURL = "https://seu-dominio-producao.com"
```

Edite `Info.plist`:
```xml
<string>applinks:seu-dominio-producao.com</string>
```

## 📦 Build e Deploy

### Android - Build

#### Debug Build
```bash
cd android/
./gradlew assembleDebug
# APK gerado em: app/build/outputs/apk/debug/
```

#### Release Build
```bash
cd android/
./gradlew assembleRelease
# APK gerado em: app/build/outputs/apk/release/
```

#### Play Store Bundle
```bash
cd android/
./gradlew bundleRelease
# AAB gerado em: app/build/outputs/bundle/release/
```

### iOS - Build

#### Debug Build
1. Abra projeto no Xcode
2. Selecione dispositivo/simulador
3. Product → Build (⌘B)

#### Release Build
1. Product → Archive
2. Upload para App Store Connect via Organizer
3. Ou export para distribuição adhoc/enterprise

## 🏪 Publicação nas Lojas

### Google Play Store

1. **Preparação**
   - Criar conta Google Play Console
   - Configurar assinatura digital
   - Preparar assets (screenshots, descrições)

2. **Upload**
   - Upload do arquivo AAB
   - Configurar release notes
   - Definir audiência e países

3. **Review Process**
   - Aguardar aprovação (24-72h)
   - Responder a questões de compliance

### Apple App Store

1. **Preparação**
   - Conta Apple Developer ($99/ano)
   - Configurar App Store Connect
   - Preparar assets e metadados

2. **Upload**
   - Archive via Xcode
   - Upload via Organizer ou Transporter
   - Configurar versão no App Store Connect

3. **Review Process**
   - Aguardar aprovação (24-48h)
   - Seguir App Store Guidelines

## 🔄 Atualizações

### Web Content Updates
- **Automático**: O conteúdo web é atualizado automaticamente
- **Sem necessidade de nova versão**: Mudanças no site aparecem imediatamente

### Native Shell Updates
- **Manual**: Requer nova versão nas lojas
- **Necessário para**: Mudanças de permissões, URLs, funcionalidades nativas

## 🧪 Testing

### Android
```bash
# Unit Tests
./gradlew test

# Instrumented Tests
./gradlew connectedAndroidTest

# Manual Testing
# Instale APK no dispositivo e teste todas as funcionalidades
```

### iOS
```bash
# Unit Tests
⌘U no Xcode

# Manual Testing
# Execute no simulador/device e teste todas as funcionalidades
```

## 📱 Screenshots e Assets

### Tamanhos Necessários

#### Android (Google Play)
- **Phone**: 1080x1920, 1080x2340
- **Tablet**: 1200x1920, 2048x1536
- **Feature Graphic**: 1024x500

#### iOS (App Store)
- **iPhone**: 1290x2796, 1179x2556
- **iPad**: 2048x2732, 2732x2048

### Geração
Use a aplicação web rodando nos dispositivos para capturar screenshots reais das funcionalidades.

## 🔐 Segurança

### Implementadas
- **HTTPS Only**: Todas as comunicações via HTTPS
- **Network Security Config**: Configurações de segurança de rede
- **App Transport Security**: Políticas de segurança iOS
- **Certificate Pinning**: (Opcional - adicionar se necessário)

### Recomendações
- Manter SDKs atualizados
- Review regular de permissões
- Monitoramento de vulnerabilidades

## 📊 Analytics e Monitoramento

### Sugestões de Implementação
- **Firebase Analytics**: Tracking de uso
- **Crashlytics**: Relatórios de crash
- **Performance Monitoring**: Métricas de performance

### Implementação
Adicionar SDKs do Firebase aos projetos Android e iOS para analytics detalhados.

## 🎯 Features Futuras

### Planejadas
- **Push Notifications**: Notificações sobre novos anúncios
- **Offline Mode**: Cache mais robusto para uso offline
- **Biometric Auth**: Login via biometria
- **Share Extension**: Compartilhamento direto para o app

### Como Implementar
1. Adicionar dependências necessárias
2. Configurar serviços backend
3. Implementar interfaces nativas
4. Testar e publicar atualizações

## 🐛 Troubleshooting

### Problemas Comuns

#### Android
- **Build Failed**: Verificar versões do Gradle e Android SDK
- **WebView Issues**: Limpar cache e dados do app
- **Permissions**: Verificar AndroidManifest.xml

#### iOS
- **Build Failed**: Verificar Team ID e provisioning profiles
- **WebView Issues**: Reset simulator/device
- **Permissions**: Verificar Info.plist

### Debug
- Use ferramentas de debug nativas (Android Studio Debugger, Xcode Debugger)
- Ative WebView debugging para inspecionar conteúdo web

## 📞 Suporte

Para questões específicas dos aplicativos móveis:
1. Verificar logs do dispositivo
2. Reproduzir no navegador web primeiro
3. Testar em dispositivos diferentes
4. Consultar documentação das plataformas

---

## 🏷️ Informações do App

- **Nome**: BuscaAquiBdC - Classificados  
- **Bundle ID**: com.bdc.classificados
- **Version**: 1.0
- **Target Platforms**: Android 7.0+, iOS 17.0+
- **Size**: ~5-10MB (container + assets)
- **Category**: Business, Shopping, Marketplace