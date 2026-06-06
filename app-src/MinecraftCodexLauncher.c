#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface MinecraftCodexAppDelegate : NSObject <NSApplicationDelegate, WKNavigationDelegate>
@property(strong) NSWindow *window;
@property(strong) WKWebView *webView;
@end

@implementation MinecraftCodexAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
  (void)notification;

  NSRect frame = NSMakeRect(0, 0, 1280, 780);
  self.window = [[NSWindow alloc]
      initWithContentRect:frame
                styleMask:(NSWindowStyleMaskTitled |
                           NSWindowStyleMaskClosable |
                           NSWindowStyleMaskMiniaturizable |
                           NSWindowStyleMaskResizable)
                  backing:NSBackingStoreBuffered
                    defer:NO];
  self.window.title = @"Minecraft Codex Edition";
  self.window.minSize = NSMakeSize(900, 560);
  [self.window center];

  WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
  self.webView = [[WKWebView alloc] initWithFrame:self.window.contentView.bounds
                                    configuration:configuration];
  self.webView.navigationDelegate = self;
  self.webView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  [self.window.contentView addSubview:self.webView];

  NSURL *indexURL = [[NSBundle mainBundle] URLForResource:@"index" withExtension:@"html"];
  NSURL *resourcesURL = [[[NSBundle mainBundle] resourceURL] URLByStandardizingPath];
  if (indexURL && resourcesURL) {
    [self.webView loadFileURL:indexURL allowingReadAccessToURL:resourcesURL];
  }

  [self.window makeKeyAndOrderFront:nil];
  [self.window makeFirstResponder:self.webView];
  [NSApp activateIgnoringOtherApps:YES];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
  (void)sender;
  return YES;
}

@end

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    NSApplication *application = [NSApplication sharedApplication];
    MinecraftCodexAppDelegate *delegate = [[MinecraftCodexAppDelegate alloc] init];
    application.delegate = delegate;
    [application run];
  }
  return 0;
}
