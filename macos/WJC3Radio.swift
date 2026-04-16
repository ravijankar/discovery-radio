import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsAirPlayForMediaPlayback = true

        webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = false

        let url = URL(string: "https://wjc3.ravijankar.com")!
        webView.load(URLRequest(url: url))

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 700, height: 920),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "WJC3 Radio"
        window.contentView = webView
        window.center()
        window.setFrameAutosaveName("WJC3RadioWindow")
        window.makeKeyAndOrderFront(nil)

        let menu = NSMenu()
        let appMenu = NSMenu()
        let appItem = NSMenuItem()
        appItem.submenu = appMenu
        appMenu.addItem(NSMenuItem(title: "Quit WJC3 Radio", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        menu.addItem(appItem)
        NSApp.mainMenu = menu
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
