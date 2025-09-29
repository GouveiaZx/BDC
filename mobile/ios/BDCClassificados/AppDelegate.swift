import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure app appearance
        configureAppearance()
        
        return true
    }

    // MARK: UISceneSession Lifecycle (iOS 13+)
    @available(iOS 13.0, *)
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    @available(iOS 13.0, *)
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }
    
    // MARK: - Private Methods
    
    private func configureAppearance() {
        // Configure navigation bar appearance
        if #available(iOS 15.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.systemBackground
            appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
            
            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
        }
        
        // Set status bar style
        UIApplication.shared.statusBarStyle = .default
        
        // Configure tab bar if needed
        UITabBar.appearance().tintColor = UIColor(red: 0.48, green: 0.83, blue: 0.56, alpha: 1.0) // #7ad38e
    }
    
    // MARK: - URL Handling
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        
        // Handle custom URL schemes (bdcclassificados://)
        if url.scheme == "bdcclassificados" {
            handleCustomURL(url)
            return true
        }
        
        // Handle universal links (https://your-domain.com/...)
        if url.scheme == "https" {
            handleUniversalLink(url)
            return true
        }
        
        return false
    }
    
    private func handleCustomURL(_ url: URL) {
        // Parse the URL and navigate to appropriate section
        guard let viewController = getCurrentViewController() as? ViewController else { return }
        
        let urlString = url.absoluteString.replacingOccurrences(of: "bdcclassificados://", with: "https://your-production-domain.com/")
        viewController.loadURL(urlString)
    }
    
    private func handleUniversalLink(_ url: URL) {
        // Handle universal links from web
        guard let viewController = getCurrentViewController() as? ViewController else { return }
        viewController.loadURL(url.absoluteString)
    }
    
    private func getCurrentViewController() -> UIViewController? {
        if #available(iOS 13.0, *) {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first else { return nil }
            return window.rootViewController
        } else {
            return window?.rootViewController
        }
    }
    
    // MARK: - Background/Foreground Handling
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // Save any necessary data when app goes to background
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        // Refresh content when app comes to foreground
        if let viewController = getCurrentViewController() as? ViewController {
            viewController.refreshWebView()
        }
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // App became active
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        // App will resign active
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // App will terminate
    }
}