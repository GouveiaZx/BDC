import UIKit
import WebKit
import Photos
import MobileCoreServices
import UniformTypeIdentifiers

class WebViewHandler: NSObject {
    
    private weak var viewController: ViewController?
    private weak var progressView: UIProgressView?
    
    init(viewController: ViewController, progressView: UIProgressView) {
        self.viewController = viewController
        self.progressView = progressView
        super.init()
    }
}

// MARK: - WKNavigationDelegate

extension WebViewHandler: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        
        let urlString = url.absoluteString
        
        // Handle external URLs
        if shouldOpenExternally(urlString) {
            UIApplication.shared.open(url, options: [:])
            decisionHandler(.cancel)
            return
        }
        
        // Handle tel: links
        if urlString.hasPrefix("tel:") {
            UIApplication.shared.open(url, options: [:])
            decisionHandler(.cancel)
            return
        }
        
        // Handle mailto: links
        if urlString.hasPrefix("mailto:") {
            UIApplication.shared.open(url, options: [:])
            decisionHandler(.cancel)
            return
        }
        
        // Handle WhatsApp links
        if urlString.contains("wa.me") || urlString.contains("whatsapp.com") {
            UIApplication.shared.open(url, options: [:])
            decisionHandler(.cancel)
            return
        }
        
        // Handle maps links
        if urlString.contains("maps.google.com") || urlString.contains("maps.apple.com") {
            UIApplication.shared.open(url, options: [:])
            decisionHandler(.cancel)
            return
        }
        
        decisionHandler(.allow)
    }
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        progressView?.isHidden = false
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progressView?.isHidden = true
        
        // Inject custom CSS for mobile optimization
        let css = """
        :root {
            --safe-area-inset-top: env(safe-area-inset-top);
            --safe-area-inset-bottom: env(safe-area-inset-bottom);
        }
        
        body {
            padding-top: var(--safe-area-inset-top);
            padding-bottom: var(--safe-area-inset-bottom);
        }
        
        .mobile-app-header {
            padding-top: var(--safe-area-inset-top);
        }
        """
        
        let script = """
        var style = document.createElement('style');
        style.textContent = `\(css)`;
        document.head.appendChild(style);
        """
        
        webView.evaluateJavaScript(script)
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        progressView?.isHidden = true
        viewController?.handleWebViewError(error)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        progressView?.isHidden = true
        viewController?.handleWebViewError(error)
    }
    
    private func shouldOpenExternally(_ urlString: String) -> Bool {
        let externalDomains = [
            "facebook.com",
            "instagram.com",
            "youtube.com",
            "google.com/maps",
            "asaas.com",
            "mercadopago.com",
            "pagseguro.com",
            "apple.com",
            "app-store"
        ]
        
        return externalDomains.contains { urlString.contains($0) }
    }
}

// MARK: - WKUIDelegate

extension WebViewHandler: WKUIDelegate {
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler()
        })
        
        viewController?.present(alert, animated: true)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in
            completionHandler(false)
        })
        
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(true)
        })
        
        viewController?.present(alert, animated: true)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        
        let alert = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        
        alert.addTextField { textField in
            textField.text = defaultText
        }
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in
            completionHandler(nil)
        })
        
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
        
        viewController?.present(alert, animated: true)
    }
    
    // Handle file uploads
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        
        let alert = UIAlertController(title: "Selecionar Arquivo", message: nil, preferredStyle: .actionSheet)
        
        // Camera option
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            alert.addAction(UIAlertAction(title: "Câmera", style: .default) { _ in
                self.presentImagePicker(sourceType: .camera, completionHandler: completionHandler)
            })
        }
        
        // Photo library option
        alert.addAction(UIAlertAction(title: "Galeria de Fotos", style: .default) { _ in
            self.presentImagePicker(sourceType: .photoLibrary, completionHandler: completionHandler)
        })
        
        // Document picker option
        alert.addAction(UIAlertAction(title: "Documentos", style: .default) { _ in
            self.presentDocumentPicker(completionHandler: completionHandler)
        })
        
        alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in
            completionHandler(nil)
        })
        
        // For iPad
        if let popover = alert.popoverPresentationController {
            popover.sourceView = webView
            popover.sourceRect = CGRect(x: webView.bounds.midX, y: webView.bounds.midY, width: 0, height: 0)
        }
        
        viewController?.present(alert, animated: true)
    }
    
    private func presentImagePicker(sourceType: UIImagePickerController.SourceType, completionHandler: @escaping ([URL]?) -> Void) {
        
        guard UIImagePickerController.isSourceTypeAvailable(sourceType) else {
            completionHandler(nil)
            return
        }
        
        let imagePicker = UIImagePickerController()
        imagePicker.sourceType = sourceType
        imagePicker.mediaTypes = [UTType.image.identifier]
        imagePicker.allowsEditing = false
        
        let delegate = ImagePickerDelegate { urls in
            completionHandler(urls)
        }
        
        imagePicker.delegate = delegate
        
        // Keep reference to delegate
        objc_setAssociatedObject(imagePicker, "delegate", delegate, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        
        viewController?.present(imagePicker, animated: true)
    }
    
    private func presentDocumentPicker(completionHandler: @escaping ([URL]?) -> Void) {
        let documentPicker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.item], asCopy: true)
        documentPicker.allowsMultipleSelection = false
        
        let delegate = DocumentPickerDelegate { urls in
            completionHandler(urls)
        }
        
        documentPicker.delegate = delegate
        
        // Keep reference to delegate
        objc_setAssociatedObject(documentPicker, "delegate", delegate, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        
        viewController?.present(documentPicker, animated: true)
    }
}

// MARK: - Image Picker Delegate

class ImagePickerDelegate: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    
    private let completion: ([URL]?) -> Void
    
    init(completion: @escaping ([URL]?) -> Void) {
        self.completion = completion
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        picker.dismiss(animated: true)
        
        guard let image = info[.originalImage] as? UIImage else {
            completion(nil)
            return
        }
        
        // Save image to temporary directory
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "image_\(Date().timeIntervalSince1970).jpg"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        do {
            if let imageData = image.jpegData(compressionQuality: 0.8) {
                try imageData.write(to: fileURL)
                completion([fileURL])
            } else {
                completion(nil)
            }
        } catch {
            print("Error saving image: \(error)")
            completion(nil)
        }
    }
    
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        completion(nil)
    }
}

// MARK: - Document Picker Delegate

class DocumentPickerDelegate: NSObject, UIDocumentPickerDelegate {
    
    private let completion: ([URL]?) -> Void
    
    init(completion: @escaping ([URL]?) -> Void) {
        self.completion = completion
    }
    
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        completion(urls)
    }
    
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        completion(nil)
    }
}