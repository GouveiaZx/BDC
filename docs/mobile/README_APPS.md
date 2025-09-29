# 📱 Aplicativos Móveis - Guia Rápido

Este documento complementa a [documentação completa](README.md) dos aplicativos móveis.

## 🚀 Início Rápido

### Android
1. Abrir `mobile/android/` no Android Studio
2. Atualizar URL de produção em `MainActivity.java`
3. Sync Gradle e fazer build

### iOS
1. Abrir `mobile/ios/BDCClassificados.xcodeproj` no Xcode
2. Atualizar URL de produção em `ViewController.swift`
3. Build e archive para App Store

## ⚙️ Configuração de URLs

**CRÍTICO**: Atualizar URLs antes do build de produção:

```java
// Android - MainActivity.java
private static final String BASE_URL = "https://seu-dominio.com";
```

```swift
// iOS - ViewController.swift
private let baseURL = "https://seu-dominio.com"
```

## 📦 Build Commands

```bash
# Android
./gradlew bundleRelease

# iOS
# Product → Archive no Xcode
```

## 🔗 Funcionalidades

- ✅ WebView container
- ✅ Upload de câmera/galeria
- ✅ Deep linking
- ✅ Navegação nativa
- ✅ Splash screen

Para documentação completa, consulte [README.md](README.md).