import UIKit
import WebKit

class ViewController: UIViewController {
    
    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var progressView: UIProgressView!
    @IBOutlet weak var loadingView: UIView!
    @IBOutlet weak var errorView: UIView!
    @IBOutlet weak var refreshButton: UIButton!
    
    private let baseURL = "https://your-production-domain.com"
    private var webViewHandler: WebViewHandler!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupWebView()
        loadWebsite()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Hide navigation bar
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }
    
    // MARK: - UI Setup
    
    private func setupUI() {
        // Configure progress view
        progressView.progressTintColor = UIColor(red: 0.48, green: 0.83, blue: 0.56, alpha: 1.0) // #7ad38e
        progressView.trackTintColor = UIColor.systemGray5
        progressView.isHidden = false
        
        // Configure loading view
        loadingView.backgroundColor = UIColor.systemBackground
        loadingView.isHidden = true
        
        // Configure error view
        errorView.backgroundColor = UIColor.systemBackground
        errorView.isHidden = true
        
        // Configure refresh button
        refreshButton.backgroundColor = UIColor(red: 0.48, green: 0.83, blue: 0.56, alpha: 1.0)
        refreshButton.setTitleColor(.white, for: .normal)
        refreshButton.layer.cornerRadius = 8
        refreshButton.addTarget(self, action: #selector(refreshButtonTapped), for: .touchUpInside)
        
        // Set up pull to refresh
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(pullToRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
        webView.scrollView.bounces = true
    }
    
    private func setupWebView() {
        webViewHandler = WebViewHandler(viewController: self, progressView: progressView)
        
        webView.navigationDelegate = webViewHandler
        webView.uiDelegate = webViewHandler
        
        // Configure WebView settings
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        
        // Add observer for progress
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.isLoading), options: .new, context: nil)
        
        // Configure user agent
        webView.evaluateJavaScript("navigator.userAgent") { [weak self] result, error in
            if let userAgent = result as? String {
                self?.webView.customUserAgent = "\(userAgent) BDCClassificados/1.0"
            }
        }
        
        // Inject JavaScript for app identification
        let appScript = WKUserScript(
            source: "window.isBDCMobileApp = true; window.platform = 'ios';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        webView.configuration.userContentController.addUserScript(appScript)
    }
    
    // MARK: - WebView Loading
    
    private func loadWebsite() {
        guard let url = URL(string: baseURL) else { return }
        let request = URLRequest(url: url)
        webView.load(request)
        showLoadingView()
    }
    
    public func loadURL(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    public func refreshWebView() {
        webView.reload()
    }
    
    // MARK: - UI State Management
    
    private func showLoadingView() {
        loadingView.isHidden = false
        errorView.isHidden = true
        webView.isHidden = true
    }
    
    private func showWebView() {
        loadingView.isHidden = true
        errorView.isHidden = true
        webView.isHidden = false
    }
    
    private func showErrorView() {
        loadingView.isHidden = true
        errorView.isHidden = false
        webView.isHidden = true
    }
    
    // MARK: - Actions
    
    @objc private func refreshButtonTapped() {
        loadWebsite()
    }
    
    @objc private func pullToRefresh() {
        webView.reload()
        webView.scrollView.refreshControl?.endRefreshing()
    }
    
    // MARK: - KVO Observer
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.progressView.setProgress(Float(self.webView.estimatedProgress), animated: true)
                
                if self.webView.estimatedProgress >= 1.0 {
                    UIView.animate(withDuration: 0.3, delay: 0.3, options: .curveEaseOut) {
                        self.progressView.setProgress(0.0, animated: false)
                        self.progressView.alpha = 0.0
                    } completion: { _ in
                        self.progressView.alpha = 1.0
                    }
                }
            }
        } else if keyPath == #keyPath(WKWebView.isLoading) {
            DispatchQueue.main.async { [weak self] in
                if let isLoading = change?[.newKey] as? Bool, !isLoading {
                    self?.showWebView()
                }
            }
        }
    }
    
    // MARK: - Memory Management
    
    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.isLoading))
    }
}

// MARK: - Error Handling Extension

extension ViewController {
    
    func handleWebViewError(_ error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.showErrorView()
            
            let alert = UIAlertController(
                title: "Erro de Conexão",
                message: "Não foi possível carregar a página. Verifique sua conexão com a internet.",
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "Tentar Novamente", style: .default) { _ in
                self?.loadWebsite()
            })
            
            alert.addAction(UIAlertAction(title: "OK", style: .cancel))
            
            self?.present(alert, animated: true)
        }
    }
}