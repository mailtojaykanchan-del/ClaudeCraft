#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

static NSString *const kBundledVersion = @"1.1.9";
static NSString *const kUpdateManifestURL = @"https://mailtojaykanchan-del.github.io/ClaudeCraft/version.json";

static NSInteger CompareVersionStrings(NSString *left, NSString *right) {
  NSArray<NSString *> *leftParts = [left componentsSeparatedByString:@"."];
  NSArray<NSString *> *rightParts = [right componentsSeparatedByString:@"."];
  NSUInteger count = MAX(leftParts.count, rightParts.count);

  for (NSUInteger index = 0; index < count; index++) {
    NSInteger leftValue = index < leftParts.count ? leftParts[index].integerValue : 0;
    NSInteger rightValue = index < rightParts.count ? rightParts[index].integerValue : 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

@interface MinecraftCodexAppDelegate : NSObject <NSApplicationDelegate, WKNavigationDelegate>
@property(strong) NSWindow *window;
@property(strong) WKWebView *webView;
@property(assign) BOOL loadingRemoteUpdate;
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

  [self.window makeKeyAndOrderFront:nil];
  [self.window makeFirstResponder:self.webView];
  [NSApp activateIgnoringOtherApps:YES];

  [self loadBundledGame];
  [self checkForUpdates];
}

- (void)loadBundledGame {
  self.loadingRemoteUpdate = NO;
  NSURL *indexURL = [[NSBundle mainBundle] URLForResource:@"game" withExtension:@"html"];
  if (!indexURL) {
    indexURL = [[NSBundle mainBundle] URLForResource:@"index" withExtension:@"html"];
  }
  NSURL *resourcesURL = [[[NSBundle mainBundle] resourceURL] URLByStandardizingPath];
  if (indexURL && resourcesURL) {
    [self.webView loadFileURL:indexURL allowingReadAccessToURL:resourcesURL];
  }
}

- (void)checkForUpdates {
  NSURL *manifestURL = [NSURL URLWithString:kUpdateManifestURL];
  if (!manifestURL) return;

  NSURLSessionDataTask *task = [[NSURLSession sharedSession]
      dataTaskWithURL:manifestURL
    completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      (void)response;
      if (error || data.length == 0) return;

      NSError *jsonError = nil;
      id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
      if (jsonError || ![json isKindOfClass:NSDictionary.class]) return;

      NSDictionary *manifest = (NSDictionary *)json;
      NSString *latestVersion = [manifest[@"version"] isKindOfClass:NSString.class] ? manifest[@"version"] : nil;
      NSString *indexURLString = [manifest[@"index_url"] isKindOfClass:NSString.class] ? manifest[@"index_url"] : nil;
      if (!latestVersion || !indexURLString) return;
      if (CompareVersionStrings(latestVersion, kBundledVersion) <= 0) return;

      NSURL *indexURL = [NSURL URLWithString:indexURLString];
      if (!indexURL) return;

      dispatch_async(dispatch_get_main_queue(), ^{
        self.loadingRemoteUpdate = YES;
        NSURLRequest *request = [NSURLRequest requestWithURL:indexURL
                                                 cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                                             timeoutInterval:20.0];
        [self.webView loadRequest:request];
      });
    }];
  [task resume];
}

- (void)webView:(WKWebView *)webView
    didFailProvisionalNavigation:(WKNavigation *)navigation
                       withError:(NSError *)error {
  (void)webView;
  (void)navigation;
  (void)error;
  if (self.loadingRemoteUpdate) {
    [self loadBundledGame];
  }
}

- (void)webView:(WKWebView *)webView
    didFailNavigation:(WKNavigation *)navigation
            withError:(NSError *)error {
  (void)webView;
  (void)navigation;
  (void)error;
  if (self.loadingRemoteUpdate) {
    [self loadBundledGame];
  }
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
